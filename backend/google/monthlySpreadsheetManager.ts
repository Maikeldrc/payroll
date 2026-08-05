import { googleStorageConfig, isReportingPeriod } from "./config";
import { DuplicateDriveResourceError, GoogleDriveService } from "./driveService";
import { MasterSheetManager, type MonthlyFileReference } from "./masterSheetManager";
import { MONTHLY_SHEETS } from "./schemas";
import { GoogleSheetsService } from "./sheetsService";

export class MonthlySpreadsheetManager {
  constructor(
    private readonly drive = new GoogleDriveService(),
    private readonly sheets = new GoogleSheetsService(),
    private readonly master = new MasterSheetManager(),
  ) {}

  async initializePeriod(reportingPeriod: string, actorId: string): Promise<{ reference: MonthlyFileReference; created: boolean }> {
    if (!isReportingPeriod(reportingPeriod)) throw new Error("Invalid reporting period");
    await this.master.ensureStructure();
    const indexed = await this.master.findMonthlyFile(reportingPeriod);
    if (indexed) {
      await this.sheets.ensureStructure(indexed.spreadsheetId, MONTHLY_SHEETS);
      return { reference: indexed, created: false };
    }

    const config = googleStorageConfig();
    const [yearText, monthText] = reportingPeriod.split("-");
    const yearFolder = await this.drive.ensureUniqueFolder(yearText, config.monthlyFolderId);
    const periodFolder = await this.drive.ensureUniqueFolder(reportingPeriod, yearFolder.id);
    const spreadsheetName = `Monthly Data - ${reportingPeriod}`;
    let spreadsheet = await this.drive.findUniqueSpreadsheet(spreadsheetName, periodFolder.id);
    const created = !spreadsheet;
    spreadsheet ||= await this.drive.createSpreadsheet(spreadsheetName, periodFolder.id);

    const duplicates = await this.drive.listChildren(periodFolder.id, spreadsheetName, "application/vnd.google-apps.spreadsheet");
    if (duplicates.length !== 1) throw new DuplicateDriveResourceError(spreadsheetName, duplicates.map((item) => item.id));
    await this.sheets.ensureStructure(spreadsheet.id, MONTHLY_SHEETS);
    const reference = await this.master.registerMonthlyFile({
      reportingPeriod,
      year: Number(yearText),
      month: Number(monthText),
      folderId: periodFolder.id,
      spreadsheetId: spreadsheet.id,
      spreadsheetName,
      status: "Open",
    }, actorId);
    return { reference, created };
  }
}
