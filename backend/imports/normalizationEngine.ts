import { createHash } from "node:crypto";
import type { AuthenticatedPrincipal } from "../security/auth";
import type {
  AnalyzedFile,
  DataQualityFinding,
  ImportAnalysis,
  MonthOfStatus,
  NormalizedMonthlyRecord,
  NormalizedRecordCode,
} from "./types";

const CODE_PATTERN = /^[A-Z0-9]{4,7}(?:-[A-Z0-9]{1,4})?$/;

function hash(...parts: string[]): string {
  return createHash("sha256").update(parts.join("\u001f"), "utf8").digest("hex");
}

function normalizedText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizedIdentifier(value: string): string {
  return normalizedText(value).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function monthlyBusinessKey(reportingPeriod: string, practiceId: string, mrn: string, providerId: string, serviceId: string): string {
  return hash(reportingPeriod, normalizedIdentifier(practiceId), normalizedIdentifier(mrn), providerId, serviceId);
}

function subjectIdentifier(namespace: string, value: string): string {
  const normalized = normalizedIdentifier(value);
  return normalized ? `${namespace}_${hash(namespace, normalized).slice(0, 20)}` : "";
}

function parseMonthOf(value: string, reportingPeriod: string): MonthOfStatus {
  const text = value.trim();
  if (!text) return "Missing";
  const yyyyMm = text.match(/^(\d{4})[-/]([01]?\d)(?:[-/]\d{1,2})?$/);
  if (yyyyMm) {
    const month = Number(yyyyMm[2]);
    if (month < 1 || month > 12) return "Invalid";
    return `${yyyyMm[1]}-${String(month).padStart(2, "0")}` === reportingPeriod ? "Match" : "Mismatch";
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "Invalid";
  const period = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
  return period === reportingPeriod ? "Match" : "Mismatch";
}

function splitCodes(value: string): string[] {
  return value.split(/[;,|\s]+/).map((code) => code.trim().toUpperCase()).filter(Boolean);
}

function finding(
  recordId: string,
  batchId: string,
  reportingPeriod: string,
  type: string,
  severity: DataQualityFinding["severity"],
  field: string,
  description: string,
  originalValue: string,
  suggestedValue = "",
): DataQualityFinding {
  const createdAt = new Date().toISOString();
  return {
    id: `DQ_${hash(recordId, type, field, originalValue).slice(0, 24)}`,
    reportingPeriod,
    recordId,
    importBatchId: batchId,
    type,
    severity,
    field,
    description,
    originalValue,
    suggestedValue,
    resolutionStatus: "Open",
    createdAt,
  };
}

function codeValues(values: Record<string, string>): Array<{ code: string; position: number; sourceField: string }> {
  const result: Array<{ code: string; position: number; sourceField: string }> = [];
  let position = 1;
  for (const code of splitCodes(values.Codes || "")) result.push({ code, position: position++, sourceField: "Codes" });
  for (let index = 1; index <= 6; index += 1) {
    for (const code of splitCodes(values[`Code${index}`] || "")) result.push({ code, position: index, sourceField: `Code${index}` });
  }
  return result;
}

export interface NormalizeImportInput {
  analyzed: AnalyzedFile;
  reportingPeriod: string;
  fileHash: string;
  importBatchId: string;
  principal: AuthenticatedPrincipal;
  importedAt?: string;
}

export function normalizeImport(input: NormalizeImportInput): { records: NormalizedMonthlyRecord[]; analysis: ImportAnalysis } {
  const { analyzed, reportingPeriod, fileHash, importBatchId, principal } = input;
  if (analyzed.missingRequiredColumns.length) throw new Error(`Missing required columns: ${analyzed.missingRequiredColumns.join(", ")}`);
  const importedAt = input.importedAt || new Date().toISOString();
  const organizationId = principal.scopes.organizationIds[0] || "";
  const solePracticeId = principal.scopes.practiceIds.length === 1 ? principal.scopes.practiceIds[0] : "";
  if (!organizationId) throw new Error("Explicit organization scope required");

  const records = analyzed.rows.map((row): NormalizedMonthlyRecord => {
    const values = row.values;
    const providerId = subjectIdentifier("PRV", values.Provider || "");
    const careManagerId = subjectIdentifier("CM", values["Care Manager"] || "");
    const serviceId = subjectIdentifier("SVC", values.Service || "");
    const practiceId = normalizedIdentifier(values.Practice || solePracticeId);
    const mrn = normalizedIdentifier(values.MRN || "");
    const rowHash = hash(...analyzed.canonicalHeaders.map((header) => `${header}=${values[header] || ""}`));
    const recordId = `REC_${hash(reportingPeriod, organizationId, practiceId, mrn, providerId, serviceId, rowHash).slice(0, 28)}`;
    const businessKey = monthlyBusinessKey(reportingPeriod, practiceId, mrn, providerId, serviceId);
    const monthOfStatus = parseMonthOf(values["Month Of"] || "", reportingPeriod);
    const findings: DataQualityFinding[] = [];

    if (!practiceId) findings.push(finding(recordId, importBatchId, reportingPeriod, "Missing Practice", "Critical", "Practice", "A practice could not be resolved within the authorized scope.", values.Practice || ""));
    for (const [field, value] of [["MRN", mrn], ["Provider", providerId], ["Care Manager", careManagerId], ["Service", serviceId]] as const) {
      if (!value) findings.push(finding(recordId, importBatchId, reportingPeriod, `Missing ${field}`, "Critical", field, `${field} is required.`, values[field] || ""));
    }
    if (monthOfStatus !== "Match") {
      const severity = monthOfStatus === "Mismatch" || monthOfStatus === "Invalid" ? "Critical" : "Warning";
      findings.push(finding(recordId, importBatchId, reportingPeriod, `Month Of ${monthOfStatus}`, severity, "Month Of", `Selected period ${reportingPeriod} is authoritative; source value is ${monthOfStatus.toLowerCase()}.`, values["Month Of"] || "", reportingPeriod));
    }

    const rawCodes = codeValues(values);
    const seen = new Set<string>();
    const codes: NormalizedRecordCode[] = rawCodes.map((item, index) => {
      const valid = CODE_PATTERN.test(item.code);
      const duplicate = seen.has(item.code);
      seen.add(item.code);
      if (!valid) findings.push(finding(recordId, importBatchId, reportingPeriod, "Invalid Code", "Warning", item.sourceField, "Code format requires review.", item.code));
      if (duplicate) findings.push(finding(recordId, importBatchId, reportingPeriod, "Repeated Code", "Warning", item.sourceField, "The same code appears more than once; additional units require review.", item.code));
      return {
        id: `RC_${hash(recordId, item.code, item.sourceField, String(index)).slice(0, 28)}`,
        recordId,
        reportingPeriod,
        code: item.code,
        position: item.position,
        sourceField: item.sourceField,
        importBatchId,
        validationStatus: !valid ? "Invalid" : duplicate ? "Possible Duplicate" : "Valid",
        createdAt: importedAt,
      };
    });
    const individualCodes = rawCodes.filter((item) => item.sourceField !== "Codes").map((item) => item.code);
    const combinedCodes = rawCodes.filter((item) => item.sourceField === "Codes").map((item) => item.code);
    if (individualCodes.length && combinedCodes.length && [...new Set(individualCodes)].sort().join("|") !== [...new Set(combinedCodes)].sort().join("|")) {
      findings.push(finding(recordId, importBatchId, reportingPeriod, "Inconsistent Code Sources", "Warning", "Codes", "Codes and Code1-Code6 contain different values.", values.Codes || ""));
    }
    const hasCritical = findings.some((item) => item.severity === "Critical");
    const hasWarning = findings.some((item) => item.severity === "Warning");
    return {
      original: values,
      recordId,
      businessKey,
      reportingPeriod,
      importBatchId,
      sourceRowNumber: row.sourceRowNumber,
      sourceFileName: analyzed.sourceFileName,
      sourceFileHash: fileHash,
      sourceRowHash: rowHash,
      importedAt,
      importedBy: principal.uid,
      organizationId,
      practiceId,
      providerId,
      careManagerId,
      serviceId,
      monthOfStatus,
      duplicateStatus: "New",
      validationStatus: hasCritical ? "Rejected" : hasWarning ? "Warning" : "Valid",
      dataQualityStatus: findings.length ? "Findings" : "Clean",
      payrollInclusionStatus: hasCritical || hasWarning ? "Requires Review" : "Included",
      recordVersion: 1,
      codes,
      findings,
    };
  });

  const providers = [...new Set(records.map((record) => record.providerId).filter(Boolean))];
  const careManagers = [...new Set(records.map((record) => record.careManagerId).filter(Boolean))];
  const services = [...new Set(records.map((record) => record.serviceId).filter(Boolean))];
  const codes = [...new Set(records.flatMap((record) => record.codes.map((item) => item.code)).filter(Boolean))];
  const statusCount = (status: MonthOfStatus) => records.filter((record) => record.monthOfStatus === status).length;
  const analysis: ImportAnalysis = {
    reportingPeriod,
    fileHash,
    sourceFileName: analyzed.sourceFileName,
    sheetNames: analyzed.sheetNames,
    selectedSheet: analyzed.selectedSheet,
    headerRowNumber: analyzed.headerRowNumber,
    columnsDetected: analyzed.canonicalHeaders,
    missingRequiredColumns: analyzed.missingRequiredColumns,
    optionalColumnsDetected: analyzed.optionalColumnsDetected,
    codeColumnsDetected: analyzed.codeColumnsDetected,
    providersDetected: providers,
    careManagersDetected: careManagers,
    servicesDetected: services,
    codesDetected: codes,
    totalRows: records.length,
    validRows: records.filter((record) => record.validationStatus === "Valid").length,
    warningRows: records.filter((record) => record.validationStatus === "Warning").length,
    rejectedRows: records.filter((record) => record.validationStatus === "Rejected").length,
    uniquePatientCandidates: new Set(records.map((record) => normalizedIdentifier(record.original.MRN || "")).filter(Boolean)).size,
    monthOf: { Match: statusCount("Match"), Missing: statusCount("Missing"), Mismatch: statusCount("Mismatch"), Invalid: statusCount("Invalid") },
    preview: records.slice(0, 50).map((record) => ({
      sourceRowNumber: record.sourceRowNumber,
      provider: record.original.Provider || "",
      careManager: record.original["Care Manager"] || "",
      service: record.original.Service || "",
      status: record.validationStatus,
      findingTypes: [...new Set(record.findings.map((item) => item.type))],
    })),
  };
  return { records, analysis };
}
