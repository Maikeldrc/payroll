export type SeverityType = "Critical Error" | "Warning" | "Informational";

export type EligibilityStatus = "Eligible" | "Ineligible" | "Pending" | "Terminated";
export type HMOStatus = "Yes" | "No";

export type PayrollStatus = "Included" | "Excluded" | "Pending Review" | "Manual Exception";

export type PayrollFlowState =
  | "Draft"
  | "Data Validation"
  | "Manager Review"
  | "Adjustments Required"
  | "Ready for Approval"
  | "Approved"
  | "Closed"
  | "Exported";

import type { RoleName } from "../../shared/authorization";

export type UserRole = RoleName;

export type ConfigUserRole =
  | "System Administrator"
  | "Operations Administrator"
  | "Billing Administrator"
  | "Clinical Administrator"
  | "Supervisor"
  | "Auditor";

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  code: string;
  type?: "MSO" | "Health System" | "Medical Group" | "ACO" | "Contracting Organization" | "Independent Organization";
  parentOrganizationId?: string;
  taxId?: string;
  status?: "Active" | "Inactive" | "Archived";
  effectiveDate?: string;
  terminationDate?: string;
  address?: string;
  mainContact?: { name: string; email: string; phone: string };
  billingContact?: { name: string; email: string; phone: string };
  activeServices?: string[];
  notes?: string;
}

export interface Practice {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  npiType2?: string;
  taxId?: string;
  address?: string;
  locations?: string[];
  phone?: string;
  primaryContact?: string;
  billingContact?: string;
  providerIds?: string[];
  careManagerIds?: string[];
  enabledServices?: string[];
  status?: "Active" | "Inactive" | "Archived";
  effectiveDate?: string;
  terminationDate?: string;
  aliases?: string[];
}

export interface PracticeAffiliation {
  practiceId: string;
  location?: string;
  isPrimary: boolean;
  startDate: string;
  endDate?: string;
  status: "Active" | "Inactive";
}

export interface ProviderEnabledService {
  serviceCode: string;
  effectiveDate: string;
  billingModel: string;
  renderingRole: string;
  status: "Active" | "Inactive";
}

export interface Provider {
  id: string;
  practiceId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  npi?: string;
  specialty?: string;
  taxonomy?: string;
  email?: string;
  phone?: string;
  credentials?: string;
  status?: "Active" | "Inactive" | "Archived";
  effectiveDate?: string;
  terminationDate?: string;
  practiceAffiliations?: PracticeAffiliation[];
  enabledServices?: ProviderEnabledService[];
  careManagerIds?: string[];
  aliases: string[];
}

export interface CareManagerAliasDetail {
  id: string;
  aliasValue: string;
  sourceFile?: string;
  detectedAt?: string;
  occurrences: number;
  mappingStatus: "Manual" | "Auto";
}

export interface CareManagerAssignment {
  organizationId?: string;
  practiceId: string;
  providerId?: string;
  serviceCode?: string;
  effectiveDate: string;
  endDate?: string;
}

export interface CareManager {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  credentials?: string;
  email: string;
  phone?: string;
  role: string;
  supervisorId?: string;
  employmentStatus?: "Full-Time" | "Part-Time" | "Contractor";
  startDate?: string;
  endDate?: string;
  practiceIds: string[];
  providerIds: string[];
  serviceCodes?: string[];
  targetGoalId?: string;
  status: "Active" | "Inactive" | "Archived";
  aliases: string[];
  aliasDetails?: CareManagerAliasDetail[];
  assignments?: CareManagerAssignment[];
  linkedUserAccount?: {
    username: string;
    lastLogin: string;
    accessScope: string;
    loginStatus: "Active" | "Disabled";
  };
  payrollProfile?: {
    ruleSetId?: string;
    employmentType: "Hourly" | "Salary" | "Hybrid";
    supervisorApprovalRequired: boolean;
    hourlyRate?: number;
  };
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  fullName: string;
  sex: "M" | "F" | "Other";
  dob: string;
  address?: string;
  primaryInsuranceName?: string;
  primaryPolicyNumber?: string;
  secondaryInsuranceName?: string;
  secondaryPolicyNumber?: string;
  eligibility: EligibilityStatus;
  hmo: HMOStatus;
}

export interface StructuredCPTCodeRel {
  cptCode: string;
  isBase: boolean;
  parentCode?: string;
  unitOrder: number;
  applicableRole?: string;
  minTimeMinutes?: number;
  maxTimeMinutes?: number;
  effectiveDate: string;
  status: "Active" | "Inactive";
}

export interface ServiceCatalogItem {
  id: string;
  code: string; // e.g. CCM, RPM, PCM, BHI, APCM, TCM, RTM, CoCM
  name: string;
  fullName?: string;
  category?: string;
  description: string;
  isCustom: boolean;
  active: boolean;
  status?: "Active" | "Inactive" | "Archived";
  effectiveDate?: string;
  terminationDate?: string;
  displayOrder?: number;
  icon?: string;
  reportingUnit?: "Patient-Month" | "Episode" | "Encounter" | "Device Period" | "Custom";
  defaultCPTCodes: string[];
  structuredCPTCodes?: StructuredCPTCodeRel[];
  performanceConfig?: {
    panelType: "Time Interval Funnel" | "Device Data Funnel" | "Episode Milestone Funnel" | "Eligibility-to-Billing Funnel" | "Simple KPI Panel" | "Custom Workflow";
    funnelStages: string[];
    warningThreshold: number;
    criticalThreshold: number;
  };
  applicability?: {
    organizationIds: string[];
    practiceIds: string[];
    providerIds: string[];
    payerNames: string[];
  };
  lastModified?: string;
}

export interface CPTOverrideRule {
  payerOrPractice: string;
  customMinTime?: number;
  customMaxUnits?: number;
  note?: string;
}

export interface CPTCode {
  id?: string;
  code: string;
  serviceCode: string;
  description: string;
  shortDescription?: string;
  longDescription?: string;
  codeSystem?: "CPT" | "HCPCS Level II" | "Custom Internal Code";
  category?: string;
  isBaseCode?: boolean;
  parentBaseCode?: string;
  associatedServices?: string[];
  standardRate: number;
  minimumTimeMinutes?: number;
  incrementalTimeMinutes?: number;
  maximumUnitsPerMonth?: number;
  unitType?: "Minutes" | "Days" | "Devices" | "Episodes" | "Units";
  interactiveCommRequired?: boolean;
  deviceDataRequired?: boolean;
  episodeRequired?: boolean;
  effectiveDate?: string;
  terminationDate?: string;
  status?: "Active" | "Inactive" | "Archived";
  overrides?: CPTOverrideRule[];
}

export interface ICD10Code {
  code: string;
  description: string;
  category: string;
  billable?: boolean;
  effectiveYear?: string;
  status?: "Active" | "Deprecated";
  replacementCode?: string;
}

export interface ServiceICD10CodeSet {
  id: string;
  name: string;
  serviceCode: string;
  description: string;
  includedCodes: string[];
  excludedCodes: string[];
  effectiveDate: string;
  version: string;
  status: "Active" | "Draft" | "Archived";
  lastModified: string;
}

export interface DataAliasMapping {
  id: string;
  rawValue: string;
  entityType: "Care Manager" | "Provider" | "Practice" | "Service" | "Insurance Name" | "CPT Code" | "ICD-10 Value";
  suggestedMatch: string;
  confirmedMatch?: string;
  sourceFile: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  confidence: number; // e.g. 96
  status: "Unmapped" | "Suggested" | "Confirmed" | "Ignored" | "Needs Review";
}

export interface CatalogImportTemplate {
  id: string;
  name: string;
  fileType: "Excel (.xlsx)" | "CSV" | "XML";
  organizationId?: string;
  practiceId?: string;
  serviceCode?: string;
  expectedColumns: string[];
  columnMapping: Record<string, string>;
  transformationRules: string[];
  dateFormat: string;
  decimalFormat: string;
  aliasRules: string;
  duplicateDetectionRule: string;
  effectiveDate: string;
  status: "Active" | "Inactive" | "Draft";
  lastModified: string;
}

export interface ValidationError {
  id: string;
  recordId: string;
  rowNumber: number;
  field: string;
  value: any;
  severity: SeverityType;
  message: string;
  resolved: boolean;
  resolutionNote?: string;
}

export interface MonthlyManagementRecord {
  id: string;
  batchId: string;
  mrn: string;
  patientName: string;
  firstName: string;
  lastName: string;
  sex: "M" | "F" | "Other";
  dob: string;
  providerId: string;
  providerName: string;
  careManagerId: string;
  careManagerName: string;
  practiceId: string;
  practiceName: string;
  serviceId: string;
  serviceCode: string;
  conditions: string[];
  icd10s: string[];
  codes: string[];
  code1?: string;
  code2?: string;
  code3?: string;
  code4?: string;
  code5?: string;
  code6?: string;
  monthOf: string; // YYYY-MM
  logEntries: number;
  monthlyBilling: number;
  lastModificationTime: string;
  latestInteractiveCommunication: string;
  primaryInsuranceName: string;
  primaryPolicyNumber: string;
  secondaryInsuranceName: string;
  secondaryPolicyNumber: string;
  address: string;
  eligibility: EligibilityStatus;
  hmo: HMOStatus;

  // Calculated & Payroll attributes
  payrollStatus: PayrollStatus;
  payrollExclusionReason: string;
  qualityScore: number;
  validationErrors: ValidationError[];
  isDuplicate: boolean;
  duplicateDetails?: string;
  manualOverride: boolean;
  notes?: string;

  // Service specific metadata (TCM, PCM, etc.)
  tcmDischargeDate?: string;
  tcmContactDate?: string;
  tcmMedReconDate?: string;
  tcmFaceToFaceDate?: string;
  tcmComplexity?: "Moderate" | "High";
  pcmBillingModel?: "clinical_staff" | "physician_qhp";
}

export interface ImportBatch {
  id: string;
  filename: string;
  fileHash: string;
  uploadedAt: string;
  uploadedBy: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  rejectedRows: number;
  duplicateRows: number;
  totalBilling: number;
  identifiedProviders: string[];
  identifiedCMs: string[];
  identifiedServices: string[];
  identifiedMonths: string[];
  status: "Processing" | "Completed" | "Failed" | "Pending Approval";
}

export interface PayrollRuleCondition {
  field: keyof MonthlyManagementRecord | string;
  operator: "==" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "not_empty" | "is_empty";
  value: any;
  connector?: "AND" | "OR";
}

export interface PayrollRule {
  id: string;
  name: string;
  description: string;
  ruleType:
    | "flat_rate_per_patient"
    | "service_rate"
    | "cpt_rate"
    | "log_entries_bonus"
    | "interactive_comm_bonus"
    | "volume_bonus"
    | "completion_bonus"
    | "incomplete_deduction"
    | "ineligible_deduction"
    | "hybrid";
  baseCalculation: string;
  amountOrPercent: number;
  conditions: PayrollRuleCondition[];
  startDate: string;
  endDate?: string;
  priority: number;
  active: boolean;
  applicableServices: string[]; // empty means all
  applicableCareManagers: string[]; // empty means all
  applicablePractices: string[]; // empty means all
}

export interface ManualAdjustment {
  id: string;
  type?: "Bonus" | "Deduction" | "Correction" | string;
  amount: number;
  reason: string;
  author: string;
  timestamp: string;
}

export interface PayrollBreakdownLine {
  id: string;
  ruleName: string;
  description: string;
  itemCount: number;
  unitRate: number;
  subtotal: number;
  isDeduction: boolean;
  participatingPatientIds: string[];
}

export interface PayrollCalculation {
  id: string;
  careManagerId: string;
  careManagerName: string;
  monthOf: string;
  status: PayrollFlowState;
  version: number;
  managedPatientsCount: number;
  eligiblePatientsCount: number;
  excludedPatientsCount: number;
  baseEarnings: number;
  bonuses: number;
  deductions: number;
  manualAdjustments: ManualAdjustment[];
  grossPay: number;
  netPay: number;
  breakdownLines: PayrollBreakdownLine[];
  closedAt?: string;
  closedBy?: string;
  notes?: string;
  history?: {
    version: number;
    timestamp: string;
    modifiedBy: string;
    changeReason: string;
    netPay: number;
  }[];
}

export interface MappingTemplate {
  id: string;
  name: string;
  reportType: string;
  mappings: Record<string, string>; // fileColumn -> systemField
  createdAt: string;
}

export interface TargetGoal {
  id: string;
  careManagerId?: string;
  practiceId?: string;
  serviceCode?: string;
  monthOf: string;
  minPatients: number;
  minInteractiveCommRate: number; // percentage, e.g. 85
  minLogEntriesAvg: number;
  targetBilling: number;
  minQualityScore: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  previousState?: any;
  newState?: any;
}

export interface GlobalFilterState {
  monthOf: string;
  monthRange: string[]; // for MoM comparisons
  organizationId: string;
  practiceId: string;
  providerId: string;
  careManagerId: string;
  serviceCode: string;
  insurance: string;
  eligibility: string;
  hmo: string;
  cptCode: string;
  condition: string;
  icd10: string;
  payrollStatus: string;
  qualityStatus: string;
  searchQuery: string;
}

export interface AutomatedFinding {
  id: string;
  severity: "High" | "Medium" | "Low";
  title: string;
  description: string;
  metricAffected: string;
  currentValue: string;
  expectedValue: string;
  relatedRecordIds: string[];
  recommendation: string;
  suggestedAction: string;
}
