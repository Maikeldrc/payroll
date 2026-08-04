import type { AuthenticatedPrincipal } from "../security/auth";
import { appendPostgresMonthlyRecords, readPostgresMonthlyRecords, readPostgresPayroll } from "./postgresRepository";
import { appendMonthlyRecords, filterPayrollForPrincipal, filterRecordsForPrincipal, readMonthlyRecords, readPayrollCalculations } from "./sheetsRepository";
import type { MonthlyRecordRow, PayrollRow } from "./types";

export type DataStore = "postgres" | "sheets";

export function configuredDataStore(): DataStore {
  const value = (process.env.DATA_STORE || "sheets").trim();
  if (value !== "postgres" && value !== "sheets") throw new Error("DATA_STORE must be postgres or sheets");
  return value;
}

export async function readAuthorizedMonthlyRecords(principal: AuthenticatedPrincipal): Promise<MonthlyRecordRow[]> {
  return configuredDataStore() === "postgres"
    ? readPostgresMonthlyRecords(principal)
    : filterRecordsForPrincipal(await readMonthlyRecords(), principal);
}

export async function appendAuthorizedMonthlyRecords(records: MonthlyRecordRow[], principal: AuthenticatedPrincipal): Promise<void> {
  if (configuredDataStore() === "postgres") return appendPostgresMonthlyRecords(records, principal);
  return appendMonthlyRecords(records);
}

export async function readAuthorizedPayroll(principal: AuthenticatedPrincipal): Promise<PayrollRow[]> {
  return configuredDataStore() === "postgres"
    ? readPostgresPayroll(principal)
    : filterPayrollForPrincipal(await readPayrollCalculations(), principal);
}

export type { MonthlyRecordRow, PayrollRow } from "./types";
export { filterRecordsForPrincipal, filterPayrollForPrincipal } from "./sheetsRepository";
