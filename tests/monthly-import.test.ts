import assert from "node:assert/strict";
import test from "node:test";
import { reportingPeriod } from "../backend/google/config";
import { analyzeFile } from "../backend/imports/fileAnalyzer";
import { canonicalHeader } from "../backend/imports/headerAliases";
import { normalizeImport } from "../backend/imports/normalizationEngine";
import { applyDuplicateClassification } from "../backend/imports/duplicateEngine";
import { MONTHLY_RECORD_HEADERS } from "../backend/google/schemas";
import ExcelJS from "exceljs";

const principal = {
  uid: "synthetic-user", role: "Operations Administrator" as const,
  scopes: { organizationIds: ["org-a"], practiceIds: ["practice-a"], providerIds: [], careManagerIds: [], patientIds: [], serviceCodes: [] },
};

function csvFile(headers: string[], row: string[]): Express.Multer.File {
  return {
    originalname: "synthetic.csv", mimetype: "text/csv",
    buffer: Buffer.from(`${headers.join(",")}\n${row.join(",")}`), size: 1,
  } as Express.Multer.File;
}

async function xlsxFile(rows: unknown[][]): Promise<Express.Multer.File> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Import");
  rows.forEach((row) => worksheet.addRow(row));
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return { originalname: "synthetic.xlsx", mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer, size: buffer.length } as Express.Multer.File;
}

test("reporting period rejects impossible months", () => {
  assert.equal(reportingPeriod(2026, 8), "2026-08");
  assert.throws(() => reportingPeriod(2026, 13), /Invalid reporting period/);
});

test("dynamic code aliases support Code1 through Code6", () => {
  assert.equal(canonicalHeader("CPT1"), "Code1");
  assert.equal(canonicalHeader("Billing Code 4"), "Code4");
  assert.equal(canonicalHeader("Code_6"), "Code6");
});

test("analyzer accepts missing Month Of and non-sequential optional code columns", async () => {
  const analyzed = await analyzeFile(csvFile(
    ["Medical Record Number", "Patient Name", "Physician", "CM", "Program", "CPT1", "Billing Code 4", "Code_6"],
    ["MRN-1", "Synthetic Person", "Dr Synthetic", "Manager", "CCM", "99490", "99439", "99439"],
  ));
  assert.deepEqual(analyzed.codeColumnsDetected, ["Code1", "Code4", "Code6"]);
  assert.equal(analyzed.missingRequiredColumns.length, 0);
  const { records, analysis } = normalizeImport({ analyzed, reportingPeriod: "2026-08", fileHash: "a".repeat(64), importBatchId: "batch", principal });
  assert.equal(records[0].monthOfStatus, "Missing");
  assert.equal(records[0].codes.length, 3);
  assert.equal(records[0].codes[2].validationStatus, "Possible Duplicate");
  assert.equal(analysis.monthOf.Missing, 1);
});

test("combined Codes works without individual code columns and period mismatch is rejected", async () => {
  const analyzed = await analyzeFile(csvFile(
    ["MRN", "Patient", "Provider", "Care Manager", "Service", "Codes", "Month Of"],
    ["MRN-2", "Synthetic Person", "Dr Synthetic", "Manager", "RPM", "99453;99454", "2026-07"],
  ));
  const { records } = normalizeImport({ analyzed, reportingPeriod: "2026-08", fileHash: "b".repeat(64), importBatchId: "batch", principal });
  assert.equal(records[0].codes.length, 2);
  assert.equal(records[0].monthOfStatus, "Mismatch");
  assert.equal(records[0].validationStatus, "Rejected");
  assert.equal(records[0].payrollInclusionStatus, "Requires Review");
});

test("imports with no code columns remain valid for non-code services", async () => {
  const analyzed = await analyzeFile(csvFile(
    ["MRN", "Patient", "Provider", "Care Manager", "Service", "Month Of"],
    ["MRN-3", "Synthetic Person", "Dr Synthetic", "Manager", "Care Mgmt", "2026-08"],
  ));
  const { records } = normalizeImport({ analyzed, reportingPeriod: "2026-08", fileHash: "c".repeat(64), importBatchId: "batch", principal });
  assert.equal(records[0].codes.length, 0);
  assert.equal(records[0].validationStatus, "Valid");
});

test("XLSX analysis keeps visible values while stripping formulas, links and rich formatting", async () => {
  const file = await xlsxFile([
    ["MRN", "Patient", "Provider", "Care Manager", "Service", "Month Of"],
    [
      "MRN-5",
      { formula: '"Synthetic Person"', result: "Synthetic Person" },
      { text: "Dr Synthetic", hyperlink: "https://example.invalid/provider" },
      { richText: [{ text: "Synthetic " }, { text: "Manager" }] },
      "CCM",
      { formula: '"2026-08"', result: "2026-08" },
    ],
  ]);
  const analyzed = await analyzeFile(file);
  assert.equal(analyzed.rows[0].values.Patient, "Synthetic Person");
  assert.equal(analyzed.rows[0].values.Provider, "Dr Synthetic");
  assert.equal(analyzed.rows[0].values["Care Manager"], "Synthetic Manager");
  assert.equal(analyzed.rows[0].values["Month Of"], "2026-08");
});

test("XLSX cached formula results cannot reintroduce spreadsheet injection", async () => {
  const file = await xlsxFile([
    ["MRN", "Patient", "Provider", "Care Manager", "Service"],
    ["MRN-6", { formula: '"ignored"', result: "=HYPERLINK(\"https://example.invalid\")" }, "Dr Synthetic", "Manager", "CCM"],
  ]);
  await assert.rejects(() => analyzeFile(file), /Formula content rejected/);
});

test("duplicate engine omits exact matches and flags changed business keys for review", async () => {
  const analyzed = await analyzeFile(csvFile(
    ["MRN", "Patient", "Provider", "Care Manager", "Service", "Month Of"],
    ["MRN-4", "Synthetic Person", "Dr Synthetic", "Manager", "CCM", "2026-08"],
  ));
  const { records } = normalizeImport({ analyzed, reportingPeriod: "2026-08", fileHash: "d".repeat(64), importBatchId: "batch", principal });
  const record = records[0];
  const existing = MONTHLY_RECORD_HEADERS.map((header) => ({
    "Reporting Period": record.reportingPeriod, "Practice ID": record.practiceId, MRN: record.original.MRN,
    "Provider Normalized ID": record.providerId, "Service Normalized ID": record.serviceId,
    "Source Row Hash": record.sourceRowHash, "Record Version": "1",
  }[header] || ""));
  applyDuplicateClassification(records, [[...MONTHLY_RECORD_HEADERS], existing]);
  assert.equal(records[0].duplicateStatus, "Exact Duplicate");
  assert.equal(records[0].payrollInclusionStatus, "Excluded");
  record.sourceRowHash = "changed";
  applyDuplicateClassification(records, [[...MONTHLY_RECORD_HEADERS], existing]);
  assert.equal(records[0].duplicateStatus, "Update Candidate");
  assert.equal(records[0].validationStatus, "Requires Review");
});
