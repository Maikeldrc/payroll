import type { AuthenticatedPrincipal } from "../security/auth";
import { googleStorageConfig } from "../google/config";
import { MasterSheetManager } from "../google/masterSheetManager";
import { MASTER_SHEETS, MONTHLY_RECORD_HEADERS, MONTHLY_SHEETS } from "../google/schemas";
import { GoogleSheetsService } from "../google/sheetsService";

const SYNTHETIC_MARKER = /(^SYN[-_]|SYNTHETIC|\bDEMO\b|\bTEST DATA\b)/i;

function syntheticRecord(row: string[]): boolean {
  const indexes = new Map<string, number>(MONTHLY_RECORD_HEADERS.map((header, index) => [header, index]));
  const fields = ["MRN", "Patient", "Record ID", "Source File Name"];
  return fields.some((field) => SYNTHETIC_MARKER.test(row[indexes.get(field) ?? -1] || ""));
}

export class TestDataService {
  constructor(
    private readonly master = new MasterSheetManager(),
    private readonly sheets = new GoogleSheetsService(),
  ) {}

  async purge(principal: AuthenticatedPrincipal) {
    if (principal.scopes.organizationIds.length !== 1) throw new Error("A single organization scope is required");
    const periods = await this.master.monthlyFileIndex();
    const purgedPeriods: string[] = [];
    const mixedPeriods: string[] = [];
    let removedRecords = 0;

    for (const period of periods) {
      const rows = await this.sheets.readRows(period.spreadsheetId, "Monthly_Records", "AZ");
      const records = rows.slice(1).filter((row) => row.some((value) => value !== ""));
      const synthetic = records.filter(syntheticRecord);
      if (!synthetic.length) continue;
      if (synthetic.length !== records.length) {
        mixedPeriods.push(period.reportingPeriod);
        continue;
      }
      for (const title of Object.keys(MONTHLY_SHEETS)) await this.sheets.clearRows(period.spreadsheetId, title);
      removedRecords += synthetic.length;
      purgedPeriods.push(period.reportingPeriod);
      await this.master.updateMonthlyFile({ ...period, status: "Open", recordCount: 0, importBatchCount: 0 });
    }

    if (purgedPeriods.length) {
      const masterSpreadsheetId = googleStorageConfig().masterSpreadsheetId;
      for (const title of Object.keys(MASTER_SHEETS).filter((name) => name !== "Monthly_File_Index")) {
        const rows = await this.sheets.readRows(masterSpreadsheetId, title, "AZ");
        const retained = rows.slice(1).filter((row) => !purgedPeriods.includes(row[0] || ""));
        await this.sheets.replaceDataRows(masterSpreadsheetId, title, retained);
      }
    }

    return { removedRecords, purgedPeriods, mixedPeriods };
  }
}
