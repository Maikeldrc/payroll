import { googleStorageConfig, isReportingPeriod } from "./config";
import { GoogleDriveService } from "./driveService";
import { GoogleSheetsService } from "./sheetsService";
import { MASTER_SHEETS, MONTHLY_FILE_INDEX_HEADERS } from "./schemas";

export interface MonthlyFileReference {
  reportingPeriod: string;
  year: number;
  month: number;
  folderId: string;
  spreadsheetId: string;
  spreadsheetName: string;
  status: string;
  recordCount: number;
  importBatchCount: number;
  rowNumber: number;
}

export class MasterSheetManager {
  constructor(
    private readonly sheets = new GoogleSheetsService(),
    private readonly drive = new GoogleDriveService(),
  ) {}

  async ensureStructure(): Promise<void> {
    const config = googleStorageConfig();
    await this.drive.getResource(config.masterSpreadsheetId);
    await this.sheets.ensureStructure(config.masterSpreadsheetId, MASTER_SHEETS);
  }

  async monthlyFileIndex(): Promise<MonthlyFileReference[]> {
    const spreadsheetId = googleStorageConfig().masterSpreadsheetId;
    const rows = await this.sheets.readRows(spreadsheetId, "Monthly_File_Index", "M", 10_000);
    if (!rows.length) return [];
    if (rows[0].join("|") !== MONTHLY_FILE_INDEX_HEADERS.join("|")) throw new Error("Monthly File Index headers are invalid");
    return rows.slice(1).map((row, index) => ({
      reportingPeriod: row[0], year: Number(row[1]), month: Number(row[2]), folderId: row[3], spreadsheetId: row[4],
      spreadsheetName: row[5], status: row[6], recordCount: Number(row[7] || 0), importBatchCount: Number(row[8] || 0),
      rowNumber: index + 2,
    })).filter((entry) => isReportingPeriod(entry.reportingPeriod));
  }

  async findMonthlyFile(reportingPeriod: string): Promise<MonthlyFileReference | null> {
    const matches = (await this.monthlyFileIndex()).filter((entry) => entry.reportingPeriod === reportingPeriod);
    if (matches.length > 1) throw new Error("Monthly File Index contains duplicate reporting periods");
    if (!matches[0]) return null;
    const resource = await this.drive.getResource(matches[0].spreadsheetId);
    if (!resource.parents.includes(matches[0].folderId)) throw new Error("Indexed monthly spreadsheet is outside its indexed folder");
    return matches[0];
  }

  async registerMonthlyFile(reference: Omit<MonthlyFileReference, "rowNumber" | "recordCount" | "importBatchCount">, actorId: string): Promise<MonthlyFileReference> {
    if (await this.findMonthlyFile(reference.reportingPeriod)) throw new Error("Reporting period is already registered");
    const now = new Date().toISOString();
    const values: Array<string | number> = [
      reference.reportingPeriod, reference.year, reference.month, reference.folderId, reference.spreadsheetId,
      reference.spreadsheetName, reference.status, 0, 0, "", "", actorId, now,
    ];
    await this.sheets.appendRows(googleStorageConfig().masterSpreadsheetId, "Monthly_File_Index", [values]);
    const created = await this.findMonthlyFile(reference.reportingPeriod);
    if (!created) throw new Error("Monthly File Index registration could not be verified");
    return created;
  }

  async updateMonthlyFile(reference: MonthlyFileReference): Promise<void> {
    const now = new Date().toISOString();
    const rows = await this.sheets.readRows(googleStorageConfig().masterSpreadsheetId, "Monthly_File_Index", "M", reference.rowNumber);
    const current = rows[reference.rowNumber - 1] || [];
    await this.sheets.updateRow(googleStorageConfig().masterSpreadsheetId, "Monthly_File_Index", reference.rowNumber, [
      reference.reportingPeriod, reference.year, reference.month, reference.folderId, reference.spreadsheetId,
      reference.spreadsheetName, reference.status, reference.recordCount, reference.importBatchCount, current[9] || now, now, current[11] || "", now,
    ]);
  }
}
