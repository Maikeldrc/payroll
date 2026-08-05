import type { AuthenticatedPrincipal } from "../security/auth";
import { appendPostgresMonthlyRecords, readPostgresMonthlyRecords, readPostgresPayroll } from "./postgresRepository";
import { appendMonthlyRecords, filterPayrollForPrincipal, filterRecordsForPrincipal, readMonthlyRecords, readPayrollCalculations } from "./sheetsRepository";
import type { MonthlyRecordRow, PayrollRow } from "./types";
import { readGoogleMonthlyPayroll, readGoogleMonthlyRecords } from "./googleMonthlyRepository";

export type DataStore = "postgres" | "sheets" | "google-sheets-monthly";

export function configuredDataStore(): DataStore {
  const value = (process.env.DATA_STORE || "sheets").trim();
  if (value !== "postgres" && value !== "sheets" && value !== "google-sheets-monthly") {
    throw new Error("DATA_STORE must be postgres, sheets or google-sheets-monthly");
  }
  return value;
}

export async function readAuthorizedMonthlyRecords(principal: AuthenticatedPrincipal, reportingPeriod?: string): Promise<MonthlyRecordRow[]> {
  const store = configuredDataStore();
  if (store === "google-sheets-monthly") {
    if (!reportingPeriod) throw new Error("Reporting period is required for monthly Google Sheets reads");
    return readGoogleMonthlyRecords(reportingPeriod, principal);
  }
  return store === "postgres"
    ? readPostgresMonthlyRecords(principal)
    : filterRecordsForPrincipal(await readMonthlyRecords(), principal);
}

export async function appendAuthorizedMonthlyRecords(records: MonthlyRecordRow[], principal: AuthenticatedPrincipal): Promise<void> {
  const store = configuredDataStore();
  if (store === "google-sheets-monthly") throw new Error("Monthly imports must use ImportBatchEngine");
  if (store === "postgres") return appendPostgresMonthlyRecords(records, principal);
  return appendMonthlyRecords(records);
}

export async function readAuthorizedPayroll(principal: AuthenticatedPrincipal, reportingPeriod?: string): Promise<PayrollRow[]> {
  const store = configuredDataStore();
  if (store === "google-sheets-monthly") {
    if (!reportingPeriod) throw new Error("Reporting period is required for monthly Google Sheets reads");
    return readGoogleMonthlyPayroll(reportingPeriod, principal);
  }
  return store === "postgres"
    ? readPostgresPayroll(principal)
    : filterPayrollForPrincipal(await readPayrollCalculations(), principal);
}

export type { MonthlyRecordRow, PayrollRow } from "./types";
export { filterRecordsForPrincipal, filterPayrollForPrincipal } from "./sheetsRepository";
