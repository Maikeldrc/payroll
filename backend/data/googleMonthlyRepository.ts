import { MasterSheetManager } from "../google/masterSheetManager";
import { GoogleSheetsService } from "../google/sheetsService";
import type { AuthenticatedPrincipal } from "../security/auth";
import type { MonthlyRecordRow, PayrollRow } from "./types";

function records(rows: string[][]): Array<Record<string, string>> {
  const headers = rows[0] || [];
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function amount(value: string): number {
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function spreadsheetFor(reportingPeriod: string): Promise<string | null> {
  return (await new MasterSheetManager().findMonthlyFile(reportingPeriod))?.spreadsheetId || null;
}

export async function readGoogleMonthlyRecords(reportingPeriod: string, principal: AuthenticatedPrincipal): Promise<MonthlyRecordRow[]> {
  const spreadsheetId = await spreadsheetFor(reportingPeriod);
  if (!spreadsheetId) return [];
  const source = records(await new GoogleSheetsService().readRows(spreadsheetId, "Monthly_Records", "AZ"));
  return source.filter((row) => row["Record Status"] === "Active").map((row) => ({
    id: row["Record ID"], patientId: row.MRN, mrn: row.MRN, patientName: row.Patient || `${row["First Name"]} ${row["Last Name"]}`.trim(),
    organizationId: row["Organization ID"], practiceId: row["Practice ID"], providerId: row["Provider Normalized ID"], providerName: row.Provider,
    careManagerId: row["Care Manager Normalized ID"], careManagerName: row["Care Manager"], serviceCode: row.Service,
    monthOf: row["Reporting Period"], monthlyBilling: amount(row["Monthly Billing"]), eligibility: row.Eligibility,
    insuranceName: row["Primary Insurance Name"], diagnosisSummary: row.Conditions, payrollStatus: row["Payroll Inclusion Status"],
    logEntries: amount(row["Log Entries"]), latestInteractiveCommunication: row["Latest Interactive Communication"], hmo: row.HMO,
    codes: row.Codes.split(",").map((code) => code.trim()).filter(Boolean), validationStatus: row["Validation Status"],
    dataQualityStatus: row["Data Quality Status"], duplicateStatus: row["Duplicate Status"],
  })).filter((row) => {
    const scope = principal.scopes;
    return scope.organizationIds.includes(row.organizationId) && scope.practiceIds.includes(row.practiceId)
      && (!scope.providerIds.length || scope.providerIds.includes(row.providerId))
      && (!scope.careManagerIds.length || scope.careManagerIds.includes(row.careManagerId))
      && (!scope.patientIds.length || scope.patientIds.includes(row.patientId))
      && (!scope.serviceCodes.length || scope.serviceCodes.includes(row.serviceCode));
  });
}

export async function readGoogleMonthlyPayroll(reportingPeriod: string, principal: AuthenticatedPrincipal): Promise<PayrollRow[]> {
  const spreadsheetId = await spreadsheetFor(reportingPeriod);
  if (!spreadsheetId) return [];
  return records(await new GoogleSheetsService().readRows(spreadsheetId, "Payroll_Summary", "Q")).map((row, index) => ({
    id: `${reportingPeriod}:${row["Care Manager ID"] || index}`, organizationId: principal.scopes.organizationIds[0],
    practiceId: principal.scopes.practiceIds[0], careManagerId: row["Care Manager ID"], careManagerName: row["Care Manager Display Name"],
    monthOf: reportingPeriod, baseEarnings: amount(row["Base Payroll"]), bonuses: amount(row.Bonuses), deductions: amount(row.Deductions),
    netPay: amount(row["Final Payroll"]), status: row["Payroll Status"], calculationVersion: 1, inputHash: "monthly-sheets-controlled",
  })).filter((row) => !principal.scopes.careManagerIds.length || principal.scopes.careManagerIds.includes(row.careManagerId));
}
