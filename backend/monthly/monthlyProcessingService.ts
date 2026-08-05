import { googleStorageConfig } from "../google/config";
import { MasterSheetManager } from "../google/masterSheetManager";
import { MONTHLY_RECORD_HEADERS } from "../google/schemas";
import { GoogleSheetsService } from "../google/sheetsService";
import type { AuthenticatedPrincipal } from "../security/auth";

type Row = Record<string, string>;

function objects(rows: string[][]): Row[] {
  const headers = rows[0] || [];
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function number(value: string): number {
  const parsed = Number(value.replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function eligible(record: Row): boolean {
  return record["Record Status"] === "Active" && record["Payroll Inclusion Status"] === "Included" && record["Duplicate Status"] === "New";
}

async function replaceMasterPeriod(sheets: GoogleSheetsService, title: string, reportingPeriod: string, rows: Array<Array<string | number>>): Promise<void> {
  const masterId = googleStorageConfig().masterSpreadsheetId;
  const existing = await sheets.readRows(masterId, title, "Z");
  const retained = existing.slice(1).filter((row) => row[0] !== reportingPeriod);
  await sheets.clearRows(masterId, title);
  await sheets.appendRows(masterId, title, [...retained, ...rows]);
}

export interface MonthlyCalculationSummary {
  reportingPeriod: string;
  recordCount: number;
  eligibleRecordCount: number;
  uniquePatients: number;
  billablePatients: number;
  billing: number;
  codeUnits: number;
  openCriticalFindings: number;
  openWarnings: number;
  importBatchCount: number;
  calculationVersion: string;
}

export class MonthlyProcessingService {
  constructor(private readonly sheets = new GoogleSheetsService(), private readonly master = new MasterSheetManager()) {}

  async calculate(reportingPeriod: string, principal: AuthenticatedPrincipal): Promise<MonthlyCalculationSummary> {
    const reference = await this.master.findMonthlyFile(reportingPeriod);
    if (!reference) throw new Error("Reporting period has not been initialized");
    const spreadsheetId = reference.spreadsheetId;
    const [recordRows, codeRows, findingRows, batchRows, payrollRows] = await Promise.all([
      this.sheets.readRows(spreadsheetId, "Monthly_Records", "AZ"), this.sheets.readRows(spreadsheetId, "Record_Codes", "I"),
      this.sheets.readRows(spreadsheetId, "Data_Quality_Findings", "P"), this.sheets.readRows(spreadsheetId, "Import_Batches", "X"),
      this.sheets.readRows(spreadsheetId, "Payroll_Summary", "Q"),
    ]);
    if ((recordRows[0] || []).join("|") !== MONTHLY_RECORD_HEADERS.join("|")) throw new Error("Monthly records schema is invalid");
    const records = objects(recordRows);
    const accepted = records.filter(eligible);
    const codes = objects(codeRows).filter((row) => row["Validation Status"] === "Valid" && accepted.some((record) => record["Record ID"] === row["Record ID"]));
    const findings = objects(findingRows).filter((row) => row["Resolution Status"] === "Open");
    const batches = objects(batchRows).filter((row) => row["Import Status"] === "Completed");
    const version = `monthly-v1-${new Date().toISOString()}`;
    const groups = new Map<string, Row[]>();
    for (const record of accepted) {
      const key = [record["Organization ID"], record["Practice ID"], record["Provider Normalized ID"], record["Care Manager Normalized ID"], record["Service Normalized ID"]].join("|");
      groups.set(key, [...(groups.get(key) || []), record]);
    }
    const kpis: Array<Array<string | number>> = [];
    for (const [key, group] of groups) {
      const [org, practice, provider, manager, service] = key.split("|");
      const unique = new Set(group.map((row) => row.MRN)).size;
      const billing = group.reduce((sum, row) => sum + number(row["Monthly Billing"]), 0);
      const groupRecordIds = new Set(group.map((row) => row["Record ID"]));
      const codeUnits = codes.filter((row) => groupRecordIds.has(row["Record ID"])).length;
      for (const metric of [["active_records", "Active Records", group.length], ["unique_patients", "Unique Patients", unique], ["billing", "Monthly Billing", billing], ["code_units", "Validated Code Units", codeUnits]] as const) {
        kpis.push([reportingPeriod, org, practice, provider, manager, service, metric[0], metric[1], metric[2], 1, metric[2], metric[0] === "billing" ? "Currency" : "Count", version, new Date().toISOString()]);
      }
    }
    await this.sheets.clearRows(spreadsheetId, "Monthly_KPIs");
    await this.sheets.appendRows(spreadsheetId, "Monthly_KPIs", kpis);

    const byManager = new Map<string, Row[]>();
    for (const row of accepted) byManager.set(row["Care Manager Normalized ID"], [...(byManager.get(row["Care Manager Normalized ID"]) || []), row]);
    let existingPayroll = objects(payrollRows);
    if (!existingPayroll.length && byManager.size) {
      await this.sheets.appendRows(spreadsheetId, "Payroll_Summary", [...byManager.entries()].map(([id, rows]) => [
        reportingPeriod, id, rows[0]?.["Care Manager"] || "", 0, 0, 0, 0, 0, 0, 0, "Pending Review", version, "", "", "",
      ]));
      existingPayroll = objects(await this.sheets.readRows(spreadsheetId, "Payroll_Summary", "Q"));
    }
    await replaceMasterPeriod(this.sheets, "Care_Manager_Monthly_Performance", reportingPeriod, [...byManager.entries()].map(([id, rows]) => {
      const unique = new Set(rows.map((row) => row.MRN)).size;
      const billing = rows.reduce((sum, row) => sum + number(row["Monthly Billing"]), 0);
      return [reportingPeriod, id, rows[0]?.["Care Manager"] || "", "All", rows.length, unique, billing > 0 ? unique : 0, unique ? (billing > 0 ? 1 : 0) : 0, 0, 0, 0, billing, 0, 0, 100];
    }));
    const byProvider = new Map<string, Row[]>();
    const byService = new Map<string, Row[]>();
    for (const row of accepted) {
      byProvider.set(row["Provider Normalized ID"], [...(byProvider.get(row["Provider Normalized ID"]) || []), row]);
      byService.set(row["Service Normalized ID"], [...(byService.get(row["Service Normalized ID"]) || []), row]);
    }
    await replaceMasterPeriod(this.sheets, "Provider_Monthly_Performance", reportingPeriod, [...byProvider.entries()].map(([id, rows]) => {
      const billing = rows.reduce((sum, row) => sum + number(row["Monthly Billing"]), 0);
      return [reportingPeriod, rows[0]?.["Practice ID"] || "", id, rows[0]?.Provider || "", "All", rows.length, rows.filter((row) => number(row["Monthly Billing"]) > 0).length, billing, billing, 100];
    }));
    await replaceMasterPeriod(this.sheets, "Service_Monthly_Performance", reportingPeriod, [...byService.entries()].map(([id, rows]) => {
      const ids = new Set(rows.map((row) => row["Record ID"]));
      const groupCodes = codes.filter((row) => ids.has(row["Record ID"]));
      const billing = rows.reduce((sum, row) => sum + number(row["Monthly Billing"]), 0);
      const unique = new Set(rows.map((row) => row.MRN)).size;
      return [reportingPeriod, id, rows.length, unique, rows.filter((row) => number(row["Monthly Billing"]) > 0).length, unique ? rows.filter((row) => number(row["Monthly Billing"]) > 0).length / unique : 0, groupCodes.length, 0, billing, billing];
    }));
    await replaceMasterPeriod(this.sheets, "Payroll_History", reportingPeriod, existingPayroll.map((row) => [
      reportingPeriod, row["Care Manager ID"], row["Calculation Version"], number(row["Base Payroll"]), number(row.Bonuses), number(row.Deductions), number(row["Manual Adjustments"]), number(row["Final Payroll"]), row["Payroll Status"], row["Approved By"], row["Closed At"],
    ]));

    const summary: MonthlyCalculationSummary = {
      reportingPeriod, recordCount: records.length, eligibleRecordCount: accepted.length,
      uniquePatients: new Set(accepted.map((row) => row.MRN)).size,
      billablePatients: new Set(accepted.filter((row) => number(row["Monthly Billing"]) > 0).map((row) => row.MRN)).size,
      billing: accepted.reduce((sum, row) => sum + number(row["Monthly Billing"]), 0), codeUnits: codes.length,
      openCriticalFindings: findings.filter((row) => row.Severity === "Critical").length,
      openWarnings: findings.filter((row) => row.Severity === "Warning").length,
      importBatchCount: batches.length, calculationVersion: version,
    };
    await this.master.updateMonthlyFile({ ...reference, recordCount: summary.recordCount, importBatchCount: summary.importBatchCount });
    await replaceMasterPeriod(this.sheets, "Data_Quality_Summary", reportingPeriod, [[reportingPeriod, summary.openCriticalFindings, summary.openWarnings, findings.filter((row) => row.Severity === "Informational").length, 0, findings.length, records.length ? Math.max(0, 100 - findings.length / records.length * 100) : 100]]);
    return summary;
  }

  async close(reportingPeriod: string, principal: AuthenticatedPrincipal, notes: string): Promise<MonthlyCalculationSummary> {
    const summary = await this.calculate(reportingPeriod, principal);
    if (summary.openCriticalFindings > 0) throw new Error("Critical data quality findings must be resolved before close");
    const reference = await this.master.findMonthlyFile(reportingPeriod);
    if (!reference) throw new Error("Reporting period has not been initialized");
    const payroll = objects(await this.sheets.readRows(reference.spreadsheetId, "Payroll_Summary", "Q"));
    if (summary.eligibleRecordCount > 0 && !payroll.length) throw new Error("Payroll must be calculated and approved before close");
    if (payroll.some((row) => row["Payroll Status"] !== "Approved")) throw new Error("All payroll rows must be approved before close");
    const existingClose = objects(await this.sheets.readRows(reference.spreadsheetId, "Monthly_Close", "T"));
    const closeVersion = existingClose.length + 1;
    const now = new Date().toISOString();
    await this.sheets.appendRows(reference.spreadsheetId, "Monthly_Close", [[reportingPeriod, "Closed", summary.recordCount, summary.uniquePatients, summary.billablePatients, summary.billing, summary.billing, summary.billing, payroll.reduce((sum, row) => sum + number(row["Final Payroll"]), 0), summary.openCriticalFindings, summary.openWarnings, summary.importBatchCount, summary.calculationVersion, principal.uid, now, "", "", "", closeVersion, notes]]);
    await this.master.updateMonthlyFile({ ...reference, status: "Closed", recordCount: summary.recordCount, importBatchCount: summary.importBatchCount });
    await replaceMasterPeriod(this.sheets, "Monthly_Closures", reportingPeriod, [[reportingPeriod, reference.spreadsheetId, "Closed", closeVersion, summary.recordCount, summary.uniquePatients, summary.billablePatients, summary.billing, summary.billing, summary.billing, payroll.reduce((sum, row) => sum + number(row["Final Payroll"]), 0), summary.openCriticalFindings, principal.uid, now]]);
    return summary;
  }

  async recordReopen(reportingPeriod: string, principal: AuthenticatedPrincipal, reason: string): Promise<void> {
    const reference = await this.master.findMonthlyFile(reportingPeriod);
    if (!reference) throw new Error("Reporting period has not been initialized");
    const existingClose = objects(await this.sheets.readRows(reference.spreadsheetId, "Monthly_Close", "T"));
    const last = existingClose.at(-1);
    if (!last || last.Status !== "Closed") throw new Error("Reporting period has no closed version");
    const now = new Date().toISOString();
    await this.sheets.appendRows(reference.spreadsheetId, "Monthly_Close", [[reportingPeriod, "Reopened", last["Record Count"] || 0, last["Unique Active Patients"] || 0, last["Unique Billable Patients"] || 0, last["Total Billing"] || 0, last["Direct Revenue"] || 0, last["Total Attributed Revenue"] || 0, last["Final Payroll"] || 0, last["Open Critical Findings"] || 0, last["Open Warnings"] || 0, last["Import Batch Count"] || 0, last["Calculation Version"] || "", "", "", principal.uid, now, reason, Number(last["Close Version"] || 1), ""]]);
    await this.master.updateMonthlyFile({ ...reference, status: "Open" });
    await replaceMasterPeriod(this.sheets, "Monthly_Closures", reportingPeriod, [[reportingPeriod, reference.spreadsheetId, "Reopened", Number(last["Close Version"] || 1), last["Record Count"] || 0, last["Unique Active Patients"] || 0, last["Unique Billable Patients"] || 0, last["Total Billing"] || 0, last["Direct Revenue"] || 0, last["Total Attributed Revenue"] || 0, last["Final Payroll"] || 0, last["Open Critical Findings"] || 0, principal.uid, now]]);
  }
}
