export type FindingSeverity = "Critical" | "Warning" | "Informational";
export type MonthOfStatus = "Match" | "Missing" | "Mismatch" | "Invalid";
export type DuplicateStatus = "New" | "Exact Duplicate" | "Possible Duplicate" | "Update Candidate" | "Conflict" | "Requires Review" | "Rejected";

export interface AnalyzedFileRow {
  sourceRowNumber: number;
  values: Record<string, string>;
}

export interface AnalyzedFile {
  sourceFileName: string;
  fileSize: number;
  sheetNames: string[];
  selectedSheet: string;
  headerRowNumber: number;
  originalHeaders: string[];
  canonicalHeaders: string[];
  missingRequiredColumns: string[];
  optionalColumnsDetected: string[];
  codeColumnsDetected: string[];
  rows: AnalyzedFileRow[];
}

export interface DataQualityFinding {
  id: string;
  reportingPeriod: string;
  recordId: string;
  importBatchId: string;
  type: string;
  severity: FindingSeverity;
  field: string;
  description: string;
  originalValue: string;
  suggestedValue: string;
  resolutionStatus: "Open" | "Resolved" | "Ignored";
  createdAt: string;
}

export interface NormalizedRecordCode {
  id: string;
  recordId: string;
  reportingPeriod: string;
  code: string;
  position: number;
  sourceField: string;
  importBatchId: string;
  validationStatus: "Valid" | "Invalid" | "Possible Duplicate" | "Requires Review";
  createdAt: string;
}

export interface NormalizedMonthlyRecord {
  original: Record<string, string>;
  recordId: string;
  businessKey: string;
  reportingPeriod: string;
  importBatchId: string;
  sourceRowNumber: number;
  sourceFileName: string;
  sourceFileHash: string;
  sourceRowHash: string;
  importedAt: string;
  importedBy: string;
  organizationId: string;
  practiceId: string;
  providerId: string;
  careManagerId: string;
  serviceId: string;
  monthOfStatus: MonthOfStatus;
  duplicateStatus: DuplicateStatus;
  validationStatus: "Valid" | "Warning" | "Rejected" | "Requires Review";
  dataQualityStatus: "Clean" | "Findings";
  payrollInclusionStatus: "Included" | "Excluded" | "Requires Review";
  recordVersion: number;
  codes: NormalizedRecordCode[];
  findings: DataQualityFinding[];
}

export interface ImportAnalysis {
  reportingPeriod: string;
  fileHash: string;
  sourceFileName: string;
  sheetNames: string[];
  selectedSheet: string;
  headerRowNumber: number;
  columnsDetected: string[];
  missingRequiredColumns: string[];
  optionalColumnsDetected: string[];
  codeColumnsDetected: string[];
  providersDetected: string[];
  careManagersDetected: string[];
  servicesDetected: string[];
  codesDetected: string[];
  totalRows: number;
  validRows: number;
  warningRows: number;
  rejectedRows: number;
  uniquePatientCandidates: number;
  monthOf: Record<MonthOfStatus, number>;
  preview: Array<{ sourceRowNumber: number; provider: string; careManager: string; service: string; status: string; findingTypes: string[] }>;
}
