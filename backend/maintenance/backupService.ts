import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import type { AuthenticatedPrincipal } from "../security/auth";
import { auditFirestore } from "../audit/firestore";
import { googleStorageConfig } from "../google/config";
import { GoogleDriveService } from "../google/driveService";
import { MasterSheetManager } from "../google/masterSheetManager";

export type BackupMode = "manual" | "automatic";
export type BackupFrequency = "daily" | "weekly";

export interface BackupPolicy {
  mode: BackupMode;
  frequency: BackupFrequency;
  backupBeforeCleanup: true;
  lastBackupAt: string | null;
  lastBackupId: string | null;
}

const DEFAULT_POLICY: BackupPolicy = {
  mode: "manual",
  frequency: "daily",
  backupBeforeCleanup: true,
  lastBackupAt: null,
  lastBackupId: null,
};

function organization(principal: AuthenticatedPrincipal): string {
  if (principal.scopes.organizationIds.length !== 1) throw new Error("A single organization scope is required");
  return principal.scopes.organizationIds[0];
}

function safeTimestamp(now = new Date()): string {
  return now.toISOString().replace(/[:.]/g, "-");
}

export class BackupService {
  constructor(
    private readonly drive = new GoogleDriveService(),
    private readonly master = new MasterSheetManager(),
  ) {}

  private policyRef(org: string) {
    return auditFirestore().collection("backupPolicies").doc(org);
  }

  async getPolicy(principal: AuthenticatedPrincipal): Promise<BackupPolicy> {
    const snapshot = await this.policyRef(organization(principal)).get();
    const data = snapshot.data();
    return {
      ...DEFAULT_POLICY,
      mode: data?.mode === "automatic" ? "automatic" : "manual",
      frequency: data?.frequency === "weekly" ? "weekly" : "daily",
      lastBackupAt: typeof data?.lastBackupAt === "string" ? data.lastBackupAt : null,
      lastBackupId: typeof data?.lastBackupId === "string" ? data.lastBackupId : null,
    };
  }

  async setPolicy(principal: AuthenticatedPrincipal, mode: BackupMode, frequency: BackupFrequency): Promise<BackupPolicy> {
    const org = organization(principal);
    await this.policyRef(org).set({ mode, frequency, backupBeforeCleanup: true, updatedBy: principal.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return this.getPolicy(principal);
  }

  async isAutomaticBackupDue(principal: AuthenticatedPrincipal): Promise<boolean> {
    const policy = await this.getPolicy(principal);
    if (policy.mode !== "automatic") return false;
    if (!policy.lastBackupAt) return true;
    const elapsed = Date.now() - new Date(policy.lastBackupAt).getTime();
    const interval = policy.frequency === "weekly" ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    return !Number.isFinite(elapsed) || elapsed >= interval;
  }

  async create(principal: AuthenticatedPrincipal, trigger: "manual" | "automatic" | "pre-cleanup" | "pre-restore") {
    const org = organization(principal);
    const backupId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const ref = auditFirestore().collection("dataBackups").doc(backupId);
    await ref.set({ backupId, organization: org, trigger, status: "running", createdAt, createdBy: principal.uid });
    try {
      const config = googleStorageConfig();
      const backupRoot = await this.drive.ensureUniqueFolder("Backups", config.rootFolderId);
      const snapshotFolder = await this.drive.createFolder(`ITERA Backup ${safeTimestamp(new Date(createdAt))}`, backupRoot.id);
      const periods = await this.master.monthlyFileIndex();
      const sources = [
        { id: config.masterSpreadsheetId, name: `ITERA Payroll Master - ${createdAt.slice(0, 10)}` },
        ...periods.map((period) => ({ id: period.spreadsheetId, name: `${period.spreadsheetName} - Backup` })),
      ];
      const copies = [];
      for (const source of sources) copies.push(await this.drive.copyFile(source.id, source.name, snapshotFolder.id));
      await ref.set({ status: "complete", folderId: snapshotFolder.id, fileCount: copies.length, completedAt: new Date().toISOString() }, { merge: true });
      await this.policyRef(org).set({ lastBackupAt: createdAt, lastBackupId: backupId, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return { backupId, createdAt, trigger, status: "complete" as const, fileCount: copies.length };
    } catch (error) {
      await ref.set({ status: "failed", completedAt: new Date().toISOString(), failureType: error instanceof Error ? error.name : "UnknownError" }, { merge: true });
      throw error;
    }
  }

  async restore(principal: AuthenticatedPrincipal, backupId: string, sheetsService: import("../google/sheetsService").GoogleSheetsService) {
    const org = organization(principal);
    const backupSnapshot = await auditFirestore().collection("dataBackups").doc(backupId).get();
    const backup = backupSnapshot.data();
    if (!backupSnapshot.exists || backup?.organization !== org || backup?.status !== "complete" || typeof backup?.folderId !== "string") {
      throw new Error("Backup is unavailable or outside the authorized organization");
    }
    const files = await this.drive.listChildren(backup.folderId, undefined, "application/vnd.google-apps.spreadsheet");
    const masterCopies = files.filter((file) => file.name.startsWith("ITERA Payroll Master - "));
    if (masterCopies.length !== 1) throw new Error("Backup does not contain one identifiable master spreadsheet");
    const masterCopy = masterCopies[0];
    const indexRows = await sheetsService.readRows(masterCopy.id, "Monthly_File_Index", "M", 10_000);
    const monthlyReferences = indexRows.slice(1).filter((row) => /^\d{4}-(0[1-9]|1[0-2])$/.test(row[0] || "") && row[4] && row[5]);
    const restorePlan = monthlyReferences.map((row) => {
      const copies = files.filter((file) => file.name === `${row[5]} - Backup`);
      if (copies.length !== 1) throw new Error(`Backup monthly spreadsheet is missing or duplicated for ${row[0]}`);
      return { reportingPeriod: row[0], sourceId: copies[0].id, targetId: row[4] };
    });
    await Promise.all([
      this.drive.getResource(masterCopy.id),
      this.drive.getResource(googleStorageConfig().masterSpreadsheetId),
      ...restorePlan.flatMap((item) => [this.drive.getResource(item.sourceId), this.drive.getResource(item.targetId)]),
    ]);
    const restored = [];
    for (const item of restorePlan) {
      const sheetCount = await sheetsService.restoreSpreadsheet(item.sourceId, item.targetId);
      restored.push({ reportingPeriod: item.reportingPeriod, sheetCount });
    }
    const masterSheetCount = await sheetsService.restoreSpreadsheet(masterCopy.id, googleStorageConfig().masterSpreadsheetId);
    const restoreId = crypto.randomUUID();
    await auditFirestore().collection("dataRestoreEvents").doc(restoreId).set({
      restoreId, backupId, organization: org, restoredBy: principal.uid, restoredAt: new Date().toISOString(),
      restoredMonthlyFiles: restored.length, restoredMasterSheets: masterSheetCount, status: "complete",
    });
    return { restoreId, backupId, restoredMonthlyFiles: restored.length, restoredMasterSheets: masterSheetCount };
  }

  async list(principal: AuthenticatedPrincipal) {
    const org = organization(principal);
    const snapshot = await auditFirestore().collection("dataBackups").where("organization", "==", org).limit(50).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        backupId: String(data.backupId || doc.id),
        trigger: String(data.trigger || "manual"),
        status: String(data.status || "unknown"),
        createdAt: String(data.createdAt || ""),
        completedAt: data.completedAt ? String(data.completedAt) : null,
        fileCount: Number(data.fileCount || 0),
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
  }
}
