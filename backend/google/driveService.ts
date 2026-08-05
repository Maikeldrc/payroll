import type { drive_v3 } from "googleapis";
import { googleDriveClient } from "./clients";
import { googleStorageConfig } from "./config";

const FOLDER_MIME = "application/vnd.google-apps.folder";
const SPREADSHEET_MIME = "application/vnd.google-apps.spreadsheet";

export class DuplicateDriveResourceError extends Error {
  constructor(public readonly resourceName: string, public readonly resourceIds: string[]) {
    super(`Duplicate Google Drive resources detected for ${resourceName}`);
    this.name = "DuplicateDriveResourceError";
  }
}

function queryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export interface DriveResource {
  id: string;
  name: string;
  mimeType: string;
  driveId: string;
  parents: string[];
}

export class GoogleDriveService {
  constructor(private readonly drive: drive_v3.Drive = googleDriveClient()) {}

  async getResource(fileId: string): Promise<DriveResource> {
    const expectedDrive = googleStorageConfig().sharedDriveId;
    const response = await this.drive.files.get({
      fileId,
      supportsAllDrives: true,
      fields: "id,name,mimeType,driveId,parents,trashed",
    });
    const file = response.data;
    if (!file.id || !file.name || !file.mimeType || file.trashed || file.driveId !== expectedDrive) {
      throw new Error("Google resource is missing, trashed or outside the configured Shared Drive");
    }
    return { id: file.id, name: file.name, mimeType: file.mimeType, driveId: file.driveId, parents: file.parents || [] };
  }

  async listChildren(parentId: string, name?: string, mimeType?: string): Promise<DriveResource[]> {
    const config = googleStorageConfig();
    const clauses = [`'${queryValue(parentId)}' in parents`, "trashed = false"];
    if (name) clauses.push(`name = '${queryValue(name)}'`);
    if (mimeType) clauses.push(`mimeType = '${queryValue(mimeType)}'`);
    const response = await this.drive.files.list({
      q: clauses.join(" and "),
      corpora: "drive",
      driveId: config.sharedDriveId,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      pageSize: 1000,
      orderBy: "createdTime asc",
      fields: "files(id,name,mimeType,driveId,parents,trashed)",
    });
    return (response.data.files || []).filter((file): file is drive_v3.Schema$File & { id: string; name: string; mimeType: string; driveId: string } =>
      Boolean(file.id && file.name && file.mimeType && file.driveId === config.sharedDriveId && !file.trashed)
    ).map((file) => ({ id: file.id, name: file.name, mimeType: file.mimeType, driveId: file.driveId, parents: file.parents || [] }));
  }

  async createFolder(name: string, parentId: string): Promise<DriveResource> {
    await this.getResource(parentId);
    const response = await this.drive.files.create({
      supportsAllDrives: true,
      fields: "id,name,mimeType,driveId,parents",
      requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    });
    if (!response.data.id) throw new Error("Google Drive did not return the created folder ID");
    return this.getResource(response.data.id);
  }

  async ensureUniqueFolder(name: string, parentId: string): Promise<DriveResource> {
    const matches = await this.listChildren(parentId, name, FOLDER_MIME);
    if (matches.length > 1) throw new DuplicateDriveResourceError(name, matches.map((item) => item.id));
    return matches[0] || this.createFolder(name, parentId);
  }

  async createSpreadsheet(name: string, parentId: string): Promise<DriveResource> {
    await this.getResource(parentId);
    const response = await this.drive.files.create({
      supportsAllDrives: true,
      fields: "id,name,mimeType,driveId,parents",
      requestBody: { name, mimeType: SPREADSHEET_MIME, parents: [parentId] },
    });
    if (!response.data.id) throw new Error("Google Drive did not return the created spreadsheet ID");
    return this.getResource(response.data.id);
  }

  async findUniqueSpreadsheet(name: string, parentId: string): Promise<DriveResource | null> {
    const matches = await this.listChildren(parentId, name, SPREADSHEET_MIME);
    if (matches.length > 1) throw new DuplicateDriveResourceError(name, matches.map((item) => item.id));
    return matches[0] || null;
  }

  async validateRestrictedPermissions(fileId: string): Promise<{ valid: boolean; violations: string[] }> {
    const config = googleStorageConfig();
    await this.getResource(fileId);
    const response = await this.drive.permissions.list({
      fileId,
      supportsAllDrives: true,
      fields: "permissions(id,type,emailAddress,domain,role,allowFileDiscovery,deleted)",
    });
    const allowedEmails = new Set((process.env.GOOGLE_ALLOWED_ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
    const violations: string[] = [];
    for (const permission of response.data.permissions || []) {
      if (permission.deleted) continue;
      if (permission.type === "anyone") violations.push(`public_permission:${permission.id}`);
      if (permission.type === "domain") violations.push(`domain_wide_permission:${permission.id}`);
      if (permission.type === "user" && permission.emailAddress) {
        const email = permission.emailAddress.toLowerCase();
        if (!email.endsWith(`@${config.workspaceDomain}`) && !email.endsWith(".gserviceaccount.com") && !allowedEmails.has(email)) {
          violations.push(`external_user:${permission.id}`);
        }
      }
    }
    return { valid: violations.length === 0, violations };
  }

  async validateConfiguration(): Promise<{ sharedDriveName: string; resources: DriveResource[]; permissionViolations: string[] }> {
    const config = googleStorageConfig();
    const sharedDrive = await this.drive.drives.get({ driveId: config.sharedDriveId, fields: "id,name" });
    if (!sharedDrive.data.id || !sharedDrive.data.name) throw new Error("Configured Shared Drive is unavailable");
    const resources = await Promise.all([
      this.getResource(config.rootFolderId), this.getResource(config.monthlyFolderId),
      this.getResource(config.masterFolderId), this.getResource(config.masterSpreadsheetId),
    ]);
    const [root, monthly, masterFolder, masterSpreadsheet] = resources;
    if (!root.parents.includes(config.sharedDriveId)) throw new Error("Configured root folder is not at the Shared Drive root");
    if (!monthly.parents.includes(root.id) || !masterFolder.parents.includes(root.id)) throw new Error("Monthly and Master folders must be direct children of the configured root");
    if (!masterSpreadsheet.parents.includes(masterFolder.id)) throw new Error("Master spreadsheet must be inside the configured Master folder");
    const permissionChecks = await Promise.all([config.sharedDriveId, ...resources.map((resource) => resource.id)]
      .map((id) => this.validateRestrictedPermissions(id)));
    return {
      sharedDriveName: sharedDrive.data.name,
      resources,
      permissionViolations: permissionChecks.flatMap((result) => result.violations),
    };
  }
}

export const GOOGLE_FOLDER_MIME = FOLDER_MIME;
export const GOOGLE_SPREADSHEET_MIME = SPREADSHEET_MIME;
