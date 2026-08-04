import { google } from "googleapis";
import type { AuthenticatedPrincipal } from "../security/auth";
import type { MonthlyRecordRow, PayrollRow } from "./types";
export type { MonthlyRecordRow, PayrollRow } from "./types";

const REQUIRED_HEADERS = [
  "ID", "PatientID", "MRN", "Patient", "OrganizationID", "PracticeID",
  "ProviderID", "Provider", "CareManagerID", "CareManager", "Service", "MonthOf",
] as const;

function configuredSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const allowlist = new Set((process.env.GOOGLE_SHEETS_ALLOWED_IDS || "").split(",").map((item) => item.trim()).filter(Boolean));
  if (!id || !allowlist.has(id)) throw new Error("Google Sheets data source is not allowlisted");
  return id;
}

function value(row: string[], indexes: Map<string, number>, header: string): string {
  const index = indexes.get(header);
  return index === undefined ? "" : String(row[index] ?? "").trim();
}

function toNumber(input: string): number {
  const parsed = Number(input.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function readMonthlyRecords(): Promise<MonthlyRecordRow[]> {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: configuredSpreadsheetId(),
    range: "MonthlyRecords!A1:AZ5001",
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });
  const rows = (response.data.values || []) as string[][];
  if (rows.length === 0) return [];
  const indexes = new Map(rows[0].map((header, index) => [String(header).trim(), index]));
  const missing = REQUIRED_HEADERS.filter((header) => !indexes.has(header));
  if (missing.length > 0) throw new Error(`Tenant columns missing from data source: ${missing.join(",")}`);

  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    id: value(row, indexes, "ID"),
    patientId: value(row, indexes, "PatientID"),
    mrn: value(row, indexes, "MRN"),
    patientName: value(row, indexes, "Patient"),
    organizationId: value(row, indexes, "OrganizationID"),
    practiceId: value(row, indexes, "PracticeID"),
    providerId: value(row, indexes, "ProviderID"),
    providerName: value(row, indexes, "Provider"),
    careManagerId: value(row, indexes, "CareManagerID"),
    careManagerName: value(row, indexes, "CareManager"),
    serviceCode: value(row, indexes, "Service"),
    monthOf: value(row, indexes, "MonthOf"),
    monthlyBilling: toNumber(value(row, indexes, "MonthlyBilling")),
    eligibility: value(row, indexes, "Eligibility"),
    insuranceName: value(row, indexes, "Insurance"),
    diagnosisSummary: value(row, indexes, "Conditions"),
    payrollStatus: value(row, indexes, "PayrollStatus"),
  }));
}

export async function appendMonthlyRecords(records: MonthlyRecordRow[]): Promise<void> {
  if (records.length === 0) return;
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  const sheets = google.sheets({ version: "v4", auth });
  const values = records.map((record) => [
    record.id, record.patientId, record.mrn, record.patientName, record.organizationId, record.practiceId,
    record.providerId, record.providerName, record.careManagerId, record.careManagerName, record.serviceCode,
    record.monthOf, record.monthlyBilling, record.eligibility, record.insuranceName, record.diagnosisSummary,
    record.payrollStatus,
  ]);
  await sheets.spreadsheets.values.append({
    spreadsheetId: configuredSpreadsheetId(),
    range: "MonthlyRecords!A:Q",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

export async function readPayrollCalculations(): Promise<PayrollRow[]> {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: configuredSpreadsheetId(), range: "PayrollCalculations!A1:Z5001", valueRenderOption: "UNFORMATTED_VALUE",
  });
  const rows = (response.data.values || []) as string[][];
  if (!rows.length) return [];
  const indexes = new Map(rows[0].map((header, index) => [String(header).trim(), index]));
  const required = ["ID", "OrganizationID", "PracticeID", "CareManagerID", "CareManagerName", "MonthOf", "BaseEarnings", "Bonuses", "Deductions", "NetPay", "Status", "CalculationVersion", "InputHash"];
  const missing = required.filter((header) => !indexes.has(header));
  if (missing.length) throw new Error(`Payroll tenant/integrity columns missing: ${missing.join(",")}`);
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    id: value(row, indexes, "ID"), organizationId: value(row, indexes, "OrganizationID"), practiceId: value(row, indexes, "PracticeID"),
    careManagerId: value(row, indexes, "CareManagerID"), careManagerName: value(row, indexes, "CareManagerName"), monthOf: value(row, indexes, "MonthOf"),
    baseEarnings: toNumber(value(row, indexes, "BaseEarnings")), bonuses: toNumber(value(row, indexes, "Bonuses")), deductions: toNumber(value(row, indexes, "Deductions")),
    netPay: toNumber(value(row, indexes, "NetPay")), status: value(row, indexes, "Status"), calculationVersion: toNumber(value(row, indexes, "CalculationVersion")),
    inputHash: value(row, indexes, "InputHash"),
  }));
}

export function filterPayrollForPrincipal(rows: PayrollRow[], principal: AuthenticatedPrincipal): PayrollRow[] {
  const scopes = principal.scopes;
  if (!scopes.organizationIds.length || !scopes.practiceIds.length) return [];
  return rows.filter((row) => includes(scopes.organizationIds, row.organizationId)
    && includes(scopes.practiceIds, row.practiceId)
    && (scopes.careManagerIds.length === 0 || includes(scopes.careManagerIds, row.careManagerId)));
}

function includes(allowed: string[], value: string): boolean {
  return allowed.includes("*") || allowed.includes(value);
}

export function filterRecordsForPrincipal(records: MonthlyRecordRow[], principal: AuthenticatedPrincipal): MonthlyRecordRow[] {
  const { scopes, role } = principal;
  if (scopes.organizationIds.length === 0 || scopes.practiceIds.length === 0) return [];
  if (role === "Care Manager" && scopes.careManagerIds.length === 0) return [];
  if (role === "Provider Viewer" && scopes.providerIds.length === 0) return [];

  return records.filter((record) =>
    includes(scopes.organizationIds, record.organizationId)
    && includes(scopes.practiceIds, record.practiceId)
    && (scopes.providerIds.length === 0 || includes(scopes.providerIds, record.providerId))
    && (scopes.careManagerIds.length === 0 || includes(scopes.careManagerIds, record.careManagerId))
    && (scopes.patientIds.length === 0 || includes(scopes.patientIds, record.patientId))
    && (scopes.serviceCodes.length === 0 || includes(scopes.serviceCodes, record.serviceCode))
  );
}
