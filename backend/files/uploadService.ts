import crypto from "node:crypto";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import type { MonthlyRecordRow } from "../data/types";
import { FieldValue } from "firebase-admin/firestore";
import { auditFirestore } from "../audit/firestore";

const REQUIRED = ["ID", "PatientID", "MRN", "Patient", "OrganizationID", "PracticeID", "ProviderID", "Provider", "CareManagerID", "CareManager", "Service", "MonthOf"];
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function sha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function validateText(value: unknown, field: string, maxLength = 2_000): string {
  if (value !== null && typeof value === "object") throw new Error(`Formula, hyperlink or rich content rejected in ${field}`);
  const text = String(value ?? "").trim();
  if (FORMULA_PREFIX.test(text)) throw new Error(`Formula content rejected in ${field}`);
  if (text.length > maxLength) throw new Error(`${field} exceeds maximum length`);
  return text;
}

function validateRequiredText(value: unknown, field: string, maxLength: number): string {
  const text = validateText(value, field, maxLength);
  if (!text) throw new Error(`${field} is required`);
  return text;
}

function mapRows(rows: Array<Record<string, unknown>>): MonthlyRecordRow[] {
  if (rows.length > 5000) throw new Error("File exceeds 5000 row limit");
  const headers = new Set(Object.keys(rows[0] || {}));
  const missing = REQUIRED.filter((header) => !headers.has(header));
  if (missing.length) throw new Error(`Required columns missing: ${missing.join(",")}`);
  return rows.map((row, index) => {
    const monthOf = validateText(row.MonthOf, "MonthOf");
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthOf)) throw new Error(`Invalid MonthOf at row ${index + 2}`);
    const billing = Number(String(row.MonthlyBilling ?? "0").replace(/[$,]/g, ""));
    if (!Number.isFinite(billing) || billing < 0) throw new Error(`Invalid billing at row ${index + 2}`);
    return {
      id: validateRequiredText(row.ID, "ID", 128), patientId: validateRequiredText(row.PatientID, "PatientID", 128),
      mrn: validateRequiredText(row.MRN, "MRN", 64), patientName: validateRequiredText(row.Patient, "Patient", 200),
      organizationId: validateRequiredText(row.OrganizationID, "OrganizationID", 128), practiceId: validateRequiredText(row.PracticeID, "PracticeID", 128),
      providerId: validateRequiredText(row.ProviderID, "ProviderID", 128), providerName: validateRequiredText(row.Provider, "Provider", 200),
      careManagerId: validateRequiredText(row.CareManagerID, "CareManagerID", 128), careManagerName: validateRequiredText(row.CareManager, "CareManager", 200),
      serviceCode: validateRequiredText(row.Service, "Service", 64), monthOf, monthlyBilling: billing,
      eligibility: validateText(row.Eligibility, "Eligibility", 128), insuranceName: validateText(row.Insurance, "Insurance", 200),
      diagnosisSummary: validateText(row.Conditions, "Conditions"), payrollStatus: validateText(row.PayrollStatus, "PayrollStatus"),
    };
  });
}

export async function parseUpload(file: Express.Multer.File): Promise<MonthlyRecordRow[]> {
  const extension = file.originalname.toLowerCase().split(".").pop();
  if (extension === "csv") {
    if (file.buffer.includes(0)) throw new Error("Binary content is not valid CSV");
    const parsed = Papa.parse<Record<string, unknown>>(file.buffer.toString("utf8"), { header: true, skipEmptyLines: true });
    if (parsed.errors.length) throw new Error("CSV parsing failed");
    return mapRows(parsed.data);
  }
  if (extension !== "xlsx" || file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4b) throw new Error("Invalid XLSX signature");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Workbook contains no worksheet");
  const headers = (worksheet.getRow(1).values as unknown[]).slice(1).map((value) => String(value ?? "").trim());
  const rows: Array<Record<string, unknown>> = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = (row.values as unknown[]).slice(1);
    if (!values.some((value) => value !== null && value !== undefined && value !== "")) return;
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index]])));
  });
  return mapRows(rows);
}

export type UploadScanStatus = "clean" | "temporarily_bypassed";

export async function assertMalwareScanClean(file: Express.Multer.File, hash: string): Promise<UploadScanStatus> {
  const scannerUrl = process.env.MALWARE_SCANNER_URL;
  if (!scannerUrl) {
    if (process.env.ALLOW_UNSCANNED_IMPORTS === "true") return "temporarily_bypassed";
    throw new Error("Malware scanner is not configured");
  }
  const response = await fetch(scannerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", "X-Content-SHA256": hash },
    body: file.buffer,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("Malware scanner unavailable");
  const result = await response.json() as { clean?: boolean };
  if (result.clean !== true) throw new Error("File rejected by malware scanner");
  return "clean";
}

export async function reserveImport(hash: string, actorId: string, idempotencyKey: string): Promise<void> {
  const db = auditFirestore();
  const ref = db.collection("importHashes").doc(hash);
  const requestId = crypto.createHash("sha256").update(`${actorId}:${idempotencyKey}`).digest("hex");
  const requestRef = db.collection("importRequests").doc(requestId);
  await db.runTransaction(async (transaction) => {
    const [current, request] = await Promise.all([transaction.get(ref), transaction.get(requestRef)]);
    if (request.exists) throw new Error("Duplicate idempotency key");
    if (current.exists && current.data()?.status !== "failed") throw new Error("Duplicate upload");
    transaction.create(requestRef, { status: "accepted", actorId, contentHash: hash, createdAt: FieldValue.serverTimestamp() });
    transaction.set(ref, { status: "processing", actorId, idempotencyKey, createdAt: FieldValue.serverTimestamp() });
  });
}

export async function finishImport(hash: string, status: "completed" | "failed", rowCount = 0): Promise<void> {
  await auditFirestore().collection("importHashes").doc(hash)
    .set({ status, rowCount, finishedAt: FieldValue.serverTimestamp() }, { merge: true });
}
