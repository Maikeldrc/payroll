export interface ImportClientError {
  reason: string;
  message: string;
}

const SAFE_IMPORT_ERRORS: Array<{ pattern: RegExp; reason: string; message: string }> = [
  {
    pattern: /Formula|hyperlink|rich content|Unsupported spreadsheet content/,
    reason: "unsafe_spreadsheet_content",
    message: "El archivo contiene fórmulas, hipervínculos o contenido enriquecido no permitido. Convierta esas celdas a valores antes de importarlo.",
  },
  {
    pattern: /Header row could not be detected/,
    reason: "header_row_not_detected",
    message: "No se pudo identificar la fila de encabezados del archivo.",
  },
  {
    pattern: /Missing required columns/,
    reason: "missing_required_columns",
    message: "Faltan una o más columnas obligatorias: MRN, paciente, provider, care manager o servicio.",
  },
  {
    pattern: /Duplicate normalized columns/,
    reason: "duplicate_columns",
    message: "El archivo contiene columnas duplicadas después de normalizar sus nombres.",
  },
  {
    pattern: /File exceeds|Workbook sheet count is not allowed/,
    reason: "import_limit_exceeded",
    message: "El archivo excede los límites permitidos de filas, columnas u hojas.",
  },
  {
    pattern: /CSV parsing failed|Invalid XLSX signature|Workbook contains no worksheet/,
    reason: "invalid_file_structure",
    message: "El archivo no tiene una estructura CSV/XLSX válida o está dañado.",
  },
];

export function describeImportClientError(error: unknown): ImportClientError | null {
  if (!(error instanceof Error)) return null;
  const match = SAFE_IMPORT_ERRORS.find((candidate) => candidate.pattern.test(error.message));
  return match ? { reason: match.reason, message: match.message } : null;
}
