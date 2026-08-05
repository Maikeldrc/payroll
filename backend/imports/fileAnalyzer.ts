import ExcelJS from "exceljs";
import Papa from "papaparse";
import { canonicalHeader, isRecognizedHeader } from "./headerAliases";
import type { AnalyzedFile, AnalyzedFileRow } from "./types";

const MAX_SHEETS = Number(process.env.MAX_IMPORT_SHEETS || 10);
const MAX_ROWS = Number(process.env.MAX_IMPORT_ROWS || 20_000);
const MAX_COLUMNS = Number(process.env.MAX_IMPORT_COLUMNS || 150);
const REQUIRED_GROUPS = [["MRN"], ["Patient", "First Name+Last Name"], ["Provider"], ["Care Manager"], ["Service"]] as const;

function safeCell(value: unknown, field: string): string {
  if (value instanceof Date) return value.toISOString();
  if (value !== null && typeof value === "object") {
    const cell = value as Record<string, unknown>;
    if ("formula" in cell || "sharedFormula" in cell) {
      if (!("result" in cell) || cell.result === undefined || cell.result === null) {
        throw new Error(`Formula without a cached value rejected in ${field}`);
      }
      return safeCell(cell.result, field);
    }
    if (typeof cell.text === "string" && typeof cell.hyperlink === "string") {
      return safeCell(cell.text, field);
    }
    if (Array.isArray(cell.richText)) {
      const text = cell.richText.map((part) => {
        if (!part || typeof part !== "object" || typeof (part as Record<string, unknown>).text !== "string") {
          throw new Error(`Invalid rich content rejected in ${field}`);
        }
        return (part as Record<string, unknown>).text as string;
      }).join("");
      return safeCell(text, field);
    }
    throw new Error(`Unsupported spreadsheet content rejected in ${field}`);
  }
  const text = String(value ?? "").trim();
  if (/^[=+\-@\t\r]/.test(text)) throw new Error(`Formula content rejected in ${field}`);
  if (text.length > 4_000) throw new Error(`${field} exceeds maximum length`);
  return text;
}

function detectHeaderRow(rows: unknown[][]): number {
  let bestIndex = -1;
  let bestScore = 0;
  rows.slice(0, 10).forEach((row, index) => {
    const score = row.filter((value) => isRecognizedHeader(String(value ?? ""))).length;
    if (score > bestScore) { bestIndex = index; bestScore = score; }
  });
  if (bestIndex < 0 || bestScore < 4) throw new Error("Header row could not be detected");
  return bestIndex;
}

function missingRequired(headers: Set<string>): string[] {
  const missing: string[] = [];
  if (!headers.has("MRN")) missing.push("MRN");
  if (!headers.has("Patient") && !(headers.has("First Name") && headers.has("Last Name"))) missing.push("Patient or First Name + Last Name");
  for (const required of ["Provider", "Care Manager", "Service"]) if (!headers.has(required)) missing.push(required);
  return missing;
}

function analyzeMatrix(file: Express.Multer.File, sheetNames: string[], selectedSheet: string, matrix: unknown[][]): AnalyzedFile {
  if (matrix.length > MAX_ROWS + 10) throw new Error(`File exceeds ${MAX_ROWS} row limit`);
  const headerIndex = detectHeaderRow(matrix);
  const originalHeaders = matrix[headerIndex].map((value, index) => safeCell(value, `header_${index + 1}`));
  if (originalHeaders.length > MAX_COLUMNS) throw new Error(`File exceeds ${MAX_COLUMNS} column limit`);
  const canonicalHeaders = originalHeaders.map(canonicalHeader);
  const duplicates = canonicalHeaders.filter((header, index) => canonicalHeaders.indexOf(header) !== index);
  if (duplicates.length) throw new Error(`Duplicate normalized columns: ${[...new Set(duplicates)].join(",")}`);
  const rows: AnalyzedFileRow[] = matrix.slice(headerIndex + 1).map((row, index) => ({
    sourceRowNumber: headerIndex + index + 2,
    values: Object.fromEntries(canonicalHeaders.map((header, column) => [header, safeCell(row[column], `${header} row ${headerIndex + index + 2}`)])),
  })).filter((row) => Object.values(row.values).some(Boolean));
  const headers = new Set(canonicalHeaders);
  const codeColumnsDetected = canonicalHeaders.filter((header) => /^Code[1-6]$/.test(header));
  return {
    sourceFileName: file.originalname.split(/[\\/]/).pop()?.slice(0, 180) || "upload",
    fileSize: file.size || file.buffer.length,
    sheetNames,
    selectedSheet,
    headerRowNumber: headerIndex + 1,
    originalHeaders,
    canonicalHeaders,
    missingRequiredColumns: missingRequired(headers),
    optionalColumnsDetected: canonicalHeaders.filter((header) => !["MRN", "Patient", "First Name", "Last Name", "Provider", "Care Manager", "Service"].includes(header)),
    codeColumnsDetected,
    rows,
  };
}

export async function analyzeFile(file: Express.Multer.File): Promise<AnalyzedFile> {
  const extension = file.originalname.toLowerCase().split(".").pop();
  if (extension === "csv") {
    if (file.buffer.includes(0)) throw new Error("Binary content is not valid CSV");
    const parsed = Papa.parse<unknown[]>(file.buffer.toString("utf8"), { header: false, skipEmptyLines: true });
    if (parsed.errors.length) throw new Error("CSV parsing failed");
    return analyzeMatrix(file, ["CSV"], "CSV", parsed.data);
  }
  if (extension !== "xlsx" || file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4b) throw new Error("Invalid XLSX signature");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);
  if (!workbook.worksheets.length || workbook.worksheets.length > MAX_SHEETS) throw new Error("Workbook sheet count is not allowed");
  const worksheet = workbook.worksheets.find((candidate) => candidate.actualRowCount > 0) || workbook.worksheets[0];
  const matrix: unknown[][] = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => matrix.push((row.values as unknown[]).slice(1)));
  return analyzeMatrix(file, workbook.worksheets.map((sheet) => sheet.name), worksheet.name, matrix);
}

export const REQUIRED_IMPORT_GROUPS = REQUIRED_GROUPS;
