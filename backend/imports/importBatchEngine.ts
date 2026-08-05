import { createHash, randomUUID } from "node:crypto";
import { GoogleSheetsService } from "../google/sheetsService";
import { MONTHLY_RECORD_HEADERS } from "../google/schemas";
import { MonthlySpreadsheetManager } from "../google/monthlySpreadsheetManager";
import type { AuthenticatedPrincipal } from "../security/auth";
import { applyDuplicateClassification } from "./duplicateEngine";
import { analyzeFile } from "./fileAnalyzer";
import { normalizeImport } from "./normalizationEngine";
import type { ImportAnalysis, NormalizedMonthlyRecord } from "./types";

function value(record: NormalizedMonthlyRecord, header: string): string | number {
  const original = record.original;
  const originalHeaders = new Set([
    "MRN", "Patient", "First Name", "Last Name", "Sex", "Date of Birth", "Provider", "Care Manager", "Service", "Conditions",
    "ICD-10s", "Codes", "Month Of", "Log Entries", "Monthly Billing", "Measured Days", "Last Modification Time",
    "Latest Interactive Communication", "Primary Insurance Name", "Primary Policy Number", "Secondary Insurance Name",
    "Secondary Policy Number", "Address", "Eligibility", "HMO", "Code1", "Code2", "Code3", "Code4", "Code5", "Code6",
  ]);
  if (originalHeaders.has(header)) return original[header] || "";
  const mapped: Record<string, string | number> = {
    "Record ID": record.recordId, "Reporting Period": record.reportingPeriod, "Import Batch ID": record.importBatchId,
    "Source File Name": record.sourceFileName, "Source Row Number": record.sourceRowNumber, "Source File Hash": record.sourceFileHash,
    "Source Row Hash": record.sourceRowHash, "Imported At": record.importedAt, "Imported By": record.importedBy,
    "Organization ID": record.organizationId, "Practice ID": record.practiceId, "Provider Normalized ID": record.providerId,
    "Care Manager Normalized ID": record.careManagerId, "Service Normalized ID": record.serviceId,
    "Record Status": record.validationStatus === "Rejected" ? "Rejected" : record.validationStatus === "Requires Review" ? "Review" : "Active",
    "Duplicate Status": record.duplicateStatus, "Validation Status": record.validationStatus, "Data Quality Status": record.dataQualityStatus,
    "Payroll Inclusion Status": record.payrollInclusionStatus, "Last Updated At": record.importedAt, "Record Version": record.recordVersion,
  };
  return mapped[header] ?? "";
}

function batchId(fileHash: string, reportingPeriod: string): string {
  return `IMP_${createHash("sha256").update(`${reportingPeriod}:${fileHash}:${randomUUID()}`).digest("hex").slice(0, 24)}`;
}

export class ImportBatchEngine {
  constructor(
    private readonly monthly = new MonthlySpreadsheetManager(),
    private readonly sheets = new GoogleSheetsService(),
  ) {}

  async analyze(file: Express.Multer.File, reportingPeriod: string, principal: AuthenticatedPrincipal, fileHash: string): Promise<{ analysis: ImportAnalysis; records: NormalizedMonthlyRecord[] }> {
    const analyzed = await analyzeFile(file);
    return normalizeImport({ analyzed, reportingPeriod, fileHash, importBatchId: "ANALYSIS", principal });
  }

  async confirm(file: Express.Multer.File, reportingPeriod: string, principal: AuthenticatedPrincipal, fileHash: string): Promise<{ importBatchId: string; rowsImported: number; exactDuplicates: number; reviewRows: number }> {
    const id = batchId(fileHash, reportingPeriod);
    const { records, analysis } = normalizeImport({ analyzed: await analyzeFile(file), reportingPeriod, fileHash, importBatchId: id, principal });
    const period = await this.monthly.initializePeriod(reportingPeriod, principal.uid);
    const spreadsheetId = period.reference.spreadsheetId;
    const existing = await this.sheets.readRows(spreadsheetId, "Monthly_Records", "AZ");
    applyDuplicateClassification(records, existing);
    const startedAt = new Date().toISOString();
    const initialBatchRow: Array<string | number | boolean> = [
      id, reportingPeriod, analysis.sourceFileName, fileHash, file.size, startedAt, principal.uid,
      records.length, analysis.validRows, analysis.warningRows, analysis.rejectedRows,
      records.filter((item) => item.duplicateStatus === "Exact Duplicate").length,
      records.filter((item) => ["Possible Duplicate", "Conflict", "Update Candidate"].includes(item.duplicateStatus)).length,
      records.filter((item) => item.duplicateStatus === "Update Candidate").length,
      analysis.providersDetected.length, analysis.careManagersDetected.length, analysis.servicesDetected.length, analysis.codesDetected.length,
      "Processing", startedAt, "", "", "", 0,
    ];
    await this.sheets.appendRows(spreadsheetId, "Import_Batches", [initialBatchRow]);
    const importable = records.filter((record) => record.duplicateStatus !== "Exact Duplicate");
    try {
      await this.sheets.appendRows(spreadsheetId, "Monthly_Records", importable.map((record) => MONTHLY_RECORD_HEADERS.map((header) => value(record, header))));
      await this.sheets.appendRows(spreadsheetId, "Record_Codes", importable.flatMap((record) => record.codes.map((code) => [
        code.id, code.recordId, code.reportingPeriod, code.code, code.position, code.sourceField, code.importBatchId, code.validationStatus, code.createdAt,
      ])));
      await this.sheets.appendRows(spreadsheetId, "Data_Quality_Findings", importable.flatMap((record) => record.findings.map((item) => [
        item.id, item.reportingPeriod, item.recordId, item.importBatchId, item.type, item.severity, item.field, item.description,
        item.originalValue, item.suggestedValue, "", item.resolutionStatus, "", "", "", item.createdAt,
      ])));
      const batchRows = await this.sheets.readRows(spreadsheetId, "Import_Batches", "X");
      const rowNumber = batchRows.findIndex((row) => row[0] === id) + 1;
      if (rowNumber < 2) throw new Error("Import batch row was not found after append");
      const completed = [...initialBatchRow];
      completed[18] = "Completed";
      completed[20] = new Date().toISOString();
      await this.sheets.updateRow(spreadsheetId, "Import_Batches", rowNumber, completed);
      return {
        importBatchId: id,
        rowsImported: importable.length,
        exactDuplicates: records.length - importable.length,
        reviewRows: records.filter((item) => item.validationStatus === "Requires Review" || item.validationStatus === "Rejected").length,
      };
    } catch (error) {
      const batchRows = await this.sheets.readRows(spreadsheetId, "Import_Batches", "X").catch(() => []);
      const rowNumber = batchRows.findIndex((row) => row[0] === id) + 1;
      if (rowNumber >= 2) {
        const failed = [...initialBatchRow];
        failed[18] = "Failed";
        failed[20] = new Date().toISOString();
        failed[21] = "Persistence";
        failed[22] = error instanceof Error ? error.name : "UnknownError";
        await this.sheets.updateRow(spreadsheetId, "Import_Batches", rowNumber, failed).catch(() => undefined);
      }
      throw error;
    }
  }
}
