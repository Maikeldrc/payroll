import { Router, type Response } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { appendAuditEvent } from "../audit/auditService";
import { readAuthorizedMonthlyRecords, type MonthlyRecordRow } from "../data/repository";
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
  return (await readAuthorizedMonthlyRecords(principal)).filter((record) => record.monthOf === monthOf);
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
