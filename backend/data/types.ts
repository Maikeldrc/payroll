export interface MonthlyRecordRow {
  id: string;
  patientId: string;
  mrn: string;
  patientName: string;
  organizationId: string;
  practiceId: string;
  providerId: string;
  providerName: string;
  careManagerId: string;
  careManagerName: string;
  serviceCode: string;
  monthOf: string;
  monthlyBilling: number;
  eligibility: string;
  insuranceName: string;
  diagnosisSummary: string;
  payrollStatus: string;
  logEntries?: number;
  latestInteractiveCommunication?: string;
  hmo?: string;
  codes?: string[];
  validationStatus?: string;
  dataQualityStatus?: string;
  duplicateStatus?: string;
}

export interface PayrollRow {
  id: string;
  organizationId: string;
  practiceId: string;
  careManagerId: string;
  careManagerName: string;
  monthOf: string;
  baseEarnings: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  status: string;
  calculationVersion: number;
  inputHash: string;
}
