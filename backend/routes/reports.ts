import { Router, type Response } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { appendAuditEvent } from "../audit/auditService";
import { readAuthorizedMonthlyRecords, readAuthorizedPayroll, type MonthlyRecordRow } from "../data/repository";
import { authorize } from "../security/authorization";

const querySchema = z.object({ monthOf: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) });

function safeCsvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function permittedColumns(role: string) {
  const columns: Array<{ header: string; value: (record: MonthlyRecordRow) => unknown }> = [
    { header: "Record ID", value: (r) => r.id },
    { header: "Patient ID", value: (r) => r.patientId },
    { header: "MRN", value: (r) => r.mrn },
    { header: "Patient", value: (r) => r.patientName },
    { header: "Practice ID", value: (r) => r.practiceId },
    { header: "Provider", value: (r) => r.providerName },
    { header: "Care Manager", value: (r) => r.careManagerName },
    { header: "Service", value: (r) => r.serviceCode },
    { header: "Month", value: (r) => r.monthOf },
  ];
  if (["System Administrator", "Billing Administrator", "Operations Administrator", "Auditor"].includes(role)) {
    columns.push({ header: "Billing", value: (r) => r.monthlyBilling }, { header: "Insurance", value: (r) => r.insuranceName });
  }
  if (["System Administrator", "Clinical Administrator", "Supervisor", "Care Manager"].includes(role)) {
    columns.push({ header: "Clinical Summary", value: (r) => r.diagnosisSummary });
  }
  return columns;
}

async function scopedRecords(monthOf: string, principal: Express.Locals["principal"]) {
  return (await readAuthorizedMonthlyRecords(principal, monthOf)).filter((record) => record.monthOf === monthOf);
}

async function recordDownload(res: Response, monthOf: string, format: string) {
  await appendAuditEvent({
    principal: res.locals.principal,
    action: "report.generated",
    resourceType: "monthly-report",
    resourceId: `${monthOf}:${format}`,
    result: "success",
    source: "backend",
    correlationId: res.locals.correlationId,
  });
  await appendAuditEvent({
    principal: res.locals.principal,
    action: "report.download",
    resourceType: "monthly-report",
    resourceId: `${monthOf}:${format}`,
    result: "success",
    source: "backend",
    correlationId: res.locals.correlationId,
  });
}

export const reportsRouter = Router();

reportsRouter.get("/reports/patients.csv", authorize("report:download"), authorize("patient:view"), async (req, res, next) => {
  try {
    const { monthOf } = querySchema.parse(req.query);
    const records = await scopedRecords(monthOf, res.locals.principal);
    const columns = permittedColumns(res.locals.principal.role);
    const csv = [columns.map((column) => safeCsvCell(column.header)).join(","), ...records.map((record) => columns.map((column) => safeCsvCell(column.value(record))).join(","))].join("\r\n");
    await recordDownload(res, monthOf, "csv");
    res.type("text/csv").attachment(`itera-report-${monthOf}.csv`).send(csv);
  } catch (error) { next(error); }
});

reportsRouter.get("/reports/patients.xlsx", authorize("report:download"), authorize("patient:view"), async (req, res, next) => {
  try {
    const { monthOf } = querySchema.parse(req.query);
    const records = await scopedRecords(monthOf, res.locals.principal);
    const columns = permittedColumns(res.locals.principal.role);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ITERA backend";
    const sheet = workbook.addWorksheet("Authorized Records");
    sheet.columns = columns.map((column) => ({ header: column.header, key: column.header, width: 22 }));
    records.forEach((record) => sheet.addRow(Object.fromEntries(columns.map((column) => [column.header, column.value(record)]))));
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    await recordDownload(res, monthOf, "xlsx");
    res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").attachment(`itera-report-${monthOf}.xlsx`).send(buffer);
  } catch (error) { next(error); }
});

reportsRouter.get("/reports/executive.pdf", authorize("report:download"), async (req, res, next) => {
  try {
    const { monthOf } = querySchema.parse(req.query);
    const records = await scopedRecords(monthOf, res.locals.principal);
    const doc = new PDFDocument({ size: "LETTER", margin: 54, info: { Title: "ITERA Executive Summary" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    const completed = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
    doc.fontSize(18).text("ITERA Care Management — Executive Summary");
    doc.moveDown().fontSize(11).text(`Reporting period: ${monthOf}`);
    doc.text(`Authorized unique patients: ${new Set(records.map((record) => record.patientId)).size}`);
    doc.text(`Billable records: ${records.filter((record) => record.monthlyBilling > 0).length}`);
    doc.text(`Authorized billing total: $${records.reduce((sum, record) => sum + record.monthlyBilling, 0).toFixed(2)}`);
    doc.moveDown().fontSize(9).fillColor("gray").text("Confidential. Generated by the authorized ITERA backend.");
    doc.end();
    const buffer = await completed;
    await recordDownload(res, monthOf, "pdf");
    res.type("application/pdf").attachment(`itera-executive-${monthOf}.pdf`).send(buffer);
  } catch (error) { next(error); }
});

reportsRouter.get("/reports/care-managers.pdf", authorize("report:download"), authorize("performance:view"), authorize("payroll:view"), async (req, res, next) => {
  try {
    const { monthOf } = querySchema.parse(req.query);
    const [records, payroll] = await Promise.all([
      scopedRecords(monthOf, res.locals.principal),
      readAuthorizedPayroll(res.locals.principal, monthOf),
    ]);
    const managers = new Map<string, { name: string; patients: Set<string>; billing: number }>();
    records.forEach((record) => {
      const current = managers.get(record.careManagerId) ?? { name: record.careManagerName, patients: new Set<string>(), billing: 0 };
      current.patients.add(record.patientId);
      current.billing += record.monthlyBilling;
      managers.set(record.careManagerId, current);
    });
    const payrollByManager = new Map(payroll.filter((row) => row.monthOf === monthOf).map((row) => [row.careManagerId, row]));
    const doc = new PDFDocument({ size: "LETTER", margin: 48, info: { Title: "ITERA Care Manager Scorecards" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    const completed = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
    doc.fontSize(18).text("ITERA Care Manager Scorecards");
    doc.moveDown(0.35).fontSize(10).fillColor("gray").text(`Reporting period: ${monthOf}`);
    doc.moveDown().fillColor("black");
    [...managers.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name)).forEach(([managerId, manager]) => {
      const pay = payrollByManager.get(managerId);
      doc.fontSize(12).text(manager.name, { continued: false });
      doc.fontSize(9).fillColor("gray").text(`Patients: ${manager.patients.size}   Billing: $${manager.billing.toFixed(2)}   Bonus: $${(pay?.bonuses ?? 0).toFixed(2)}   Net pay: $${(pay?.netPay ?? 0).toFixed(2)}`);
      doc.moveDown(0.75).fillColor("black");
    });
    doc.fontSize(8).fillColor("gray").text("Confidential. Generated by the authorized ITERA backend.");
    doc.end();
    const buffer = await completed;
    await recordDownload(res, monthOf, "care-managers-pdf");
    res.type("application/pdf").attachment(`itera-care-manager-scorecards-${monthOf}.pdf`).send(buffer);
  } catch (error) { next(error); }
});

reportsRouter.get("/reports/master.xlsx", authorize("report:download"), authorize("patient:view"), authorize("payroll:view"), async (req, res, next) => {
  try {
    const { monthOf } = querySchema.parse(req.query);
    const [records, payroll] = await Promise.all([
      scopedRecords(monthOf, res.locals.principal),
      readAuthorizedPayroll(res.locals.principal, monthOf),
    ]);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ITERA backend";
    workbook.created = new Date();

    const patientColumns = permittedColumns(res.locals.principal.role);
    const patientSheet = workbook.addWorksheet("Pacientes");
    patientSheet.columns = patientColumns.map((column) => ({ header: column.header, key: column.header, width: 22 }));
    records.forEach((record) => patientSheet.addRow(Object.fromEntries(patientColumns.map((column) => [column.header, column.value(record)]))));

    const payrollSheet = workbook.addWorksheet("Payroll");
    payrollSheet.columns = [
      { header: "Care Manager", key: "careManagerName", width: 28 },
      { header: "Base Earnings", key: "baseEarnings", width: 18 },
      { header: "Bonuses", key: "bonuses", width: 14 },
      { header: "Deductions", key: "deductions", width: 14 },
      { header: "Net Pay", key: "netPay", width: 16 },
      { header: "Status", key: "status", width: 18 },
      { header: "Version", key: "calculationVersion", width: 12 },
    ];
    payroll.filter((row) => row.monthOf === monthOf).forEach((row) => payrollSheet.addRow(row));

    const rulesSheet = workbook.addWorksheet("Reglas");
    rulesSheet.columns = [{ header: "Control", key: "control", width: 32 }, { header: "Valor", key: "value", width: 46 }];
    rulesSheet.addRows([
      { control: "Reporting Period", value: monthOf },
      { control: "Scope", value: "Role, tenant and practice authorization enforced by backend" },
      { control: "Payroll Source", value: "Authorized monthly Payroll_Summary" },
      { control: "Formula Governance", value: "Backend-managed and versioned" },
    ]);

    [patientSheet, payrollSheet, rulesSheet].forEach((sheet) => {
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } };
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
    });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    await recordDownload(res, monthOf, "master-xlsx");
    res.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").attachment(`itera-master-${monthOf}.xlsx`).send(buffer);
  } catch (error) { next(error); }
});
