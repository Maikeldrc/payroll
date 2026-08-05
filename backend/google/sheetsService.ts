import type { sheets_v4 } from "googleapis";
import { GoogleDriveService, GOOGLE_SPREADSHEET_MIME } from "./driveService";
import { googleSheetsClient } from "./clients";

function sheetRange(title: string, range: string): string {
  return `'${title.replace(/'/g, "''")}'!${range}`;
}

export class SpreadsheetStructureError extends Error {
  constructor(public readonly sheetTitle: string, public readonly expected: readonly string[], public readonly actual: string[]) {
    super(`Unexpected header structure in ${sheetTitle}`);
    this.name = "SpreadsheetStructureError";
  }
}

export class GoogleSheetsService {
  constructor(
    private readonly sheets: sheets_v4.Sheets = googleSheetsClient(),
    private readonly drive = new GoogleDriveService(),
  ) {}

  async ensureStructure(spreadsheetId: string, schema: Readonly<Record<string, readonly string[]>>): Promise<void> {
    const resource = await this.drive.getResource(spreadsheetId);
    if (resource.mimeType !== GOOGLE_SPREADSHEET_MIME) throw new Error("Configured resource is not a Google Spreadsheet");
    const metadata = await this.sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties(sheetId,title)",
    });
    const existing = new Map((metadata.data.sheets || []).map((sheet) => [sheet.properties?.title || "", sheet.properties?.sheetId]));
    const missing = Object.keys(schema).filter((title) => !existing.has(title));
    if (missing.length) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: missing.map((title) => ({ addSheet: { properties: { title } } })) },
      });
    }
    for (const [title, expectedHeaders] of Object.entries(schema)) {
      let needsHeader = !existing.has(title);
      if (existing.has(title)) {
        const current = await this.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: sheetRange(title, "1:1"),
          valueRenderOption: "UNFORMATTED_VALUE",
        });
        const actual = ((current.data.values?.[0] || []) as unknown[]).map((value) => String(value ?? "").trim());
        needsHeader = actual.length === 0;
        if (actual.length && (actual.length !== expectedHeaders.length || actual.some((value, index) => value !== expectedHeaders[index]))) {
          throw new SpreadsheetStructureError(title, expectedHeaders, actual);
        }
      }
      if (needsHeader) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: sheetRange(title, "A1"),
          valueInputOption: "RAW",
          requestBody: { values: [[...expectedHeaders]] },
        });
      }
    }
  }

  async readRows(spreadsheetId: string, title: string, maxColumns = "AZ", maxRows = 50_000): Promise<string[][]> {
    await this.drive.getResource(spreadsheetId);
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetRange(title, `A1:${maxColumns}${maxRows}`),
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });
    return (response.data.values || []).map((row) => row.map((value) => String(value ?? "")));
  }

  async appendRows(spreadsheetId: string, title: string, rows: Array<Array<string | number | boolean>>): Promise<void> {
    if (!rows.length) return;
    await this.drive.getResource(spreadsheetId);
    await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetRange(title, "A:ZZ"),
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: rows },
    });
  }

  async updateRow(spreadsheetId: string, title: string, rowNumber: number, values: Array<string | number | boolean>): Promise<void> {
    if (!Number.isInteger(rowNumber) || rowNumber < 2) throw new Error("Invalid spreadsheet row number");
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: sheetRange(title, `A${rowNumber}`),
      valueInputOption: "RAW",
      requestBody: { values: [values] },
    });
  }

  async clearRows(spreadsheetId: string, title: string): Promise<void> {
    await this.sheets.spreadsheets.values.clear({ spreadsheetId, range: sheetRange(title, "A2:ZZ") });
  }

  async capacity(spreadsheetId: string): Promise<Array<{ title: string; rows: number; columns: number; cells: number }>> {
    await this.drive.getResource(spreadsheetId);
    const metadata = await this.sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties(title,gridProperties(rowCount,columnCount))",
    });
    return (metadata.data.sheets || []).map((sheet) => {
      const rows = Number(sheet.properties?.gridProperties?.rowCount || 0);
      const columns = Number(sheet.properties?.gridProperties?.columnCount || 0);
      return { title: sheet.properties?.title || "", rows, columns, cells: rows * columns };
    });
  }
}
