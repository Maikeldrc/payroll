const GOOGLE_ID_PATTERN = /^[A-Za-z0-9_-]{10,256}$/;

export function validateProductionConfiguration(): void {
  if (process.env.NODE_ENV !== "production") return;
  const required = [
    "FIREBASE_PROJECT_ID",
    "ALLOWED_ORIGINS",
    "DATA_STORE",
    "AUDIT_FIRESTORE_DATABASE_ID",
    "GOOGLE_SHARED_DRIVE_ID",
    "GOOGLE_ROOT_FOLDER_ID",
    "GOOGLE_MONTHLY_FOLDER_ID",
    "GOOGLE_MASTER_FOLDER_ID",
    "GOOGLE_MASTER_SPREADSHEET_ID",
    "IMPORT_ANALYSIS_TOKEN_SECRET",
  ] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Missing required production configuration: ${missing.join(",")}`);

  const origins = process.env.ALLOWED_ORIGINS!.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (origins.some((origin) => !origin.startsWith("https://") || origin.includes("*"))) {
    throw new Error("Production origins must be explicit HTTPS origins without wildcards");
  }
  if (process.env.DATA_STORE !== "google-sheets-monthly") {
    throw new Error("Production DATA_STORE must be google-sheets-monthly");
  }
  for (const name of ["GOOGLE_SHARED_DRIVE_ID", "GOOGLE_ROOT_FOLDER_ID", "GOOGLE_MONTHLY_FOLDER_ID", "GOOGLE_MASTER_FOLDER_ID", "GOOGLE_MASTER_SPREADSHEET_ID"] as const) {
    if (!GOOGLE_ID_PATTERN.test(process.env[name]!.trim())) throw new Error(`${name} is invalid`);
  }
  if (process.env.MALWARE_SCANNER_URL && !process.env.MALWARE_SCANNER_URL.startsWith("https://")) {
    throw new Error("Production malware scanner URL must use HTTPS");
  }
  if (process.env.IMPORTS_ENABLED === "true" && !process.env.MALWARE_SCANNER_URL && process.env.ALLOW_UNSCANNED_IMPORTS !== "true") {
    throw new Error("Enabled production imports require an HTTPS malware scanner or an explicit temporary bypass");
  }
  if (process.env.IMPORT_ANALYSIS_TOKEN_SECRET!.length < 32) throw new Error("IMPORT_ANALYSIS_TOKEN_SECRET must contain at least 32 characters");
  if (process.env.APP_ENV && process.env.APP_ENV !== "production") {
    throw new Error("NODE_ENV=production requires APP_ENV=production");
  }
}
