const GOOGLE_ID_PATTERN = /^[A-Za-z0-9_-]{10,256}$/;

export interface GoogleStorageConfig {
  sharedDriveId: string;
  rootFolderId: string;
  monthlyFolderId: string;
  masterFolderId: string;
  masterSpreadsheetId: string;
  workspaceDomain: string;
  timeZone: string;
  currency: string;
  capacityWarningThreshold: number;
}

function requiredId(name: string): string {
  const value = process.env[name]?.trim() || "";
  if (!GOOGLE_ID_PATTERN.test(value)) throw new Error(`${name} is not configured with a valid Google resource ID`);
  return value;
}

export function googleStorageConfig(): GoogleStorageConfig {
  const threshold = Number(process.env.GOOGLE_CAPACITY_WARNING_THRESHOLD || 0.8);
  if (!Number.isFinite(threshold) || threshold < 0.5 || threshold > 0.95) {
    throw new Error("GOOGLE_CAPACITY_WARNING_THRESHOLD must be between 0.5 and 0.95");
  }
  return {
    sharedDriveId: requiredId("GOOGLE_SHARED_DRIVE_ID"),
    rootFolderId: requiredId("GOOGLE_ROOT_FOLDER_ID"),
    monthlyFolderId: requiredId("GOOGLE_MONTHLY_FOLDER_ID"),
    masterFolderId: requiredId("GOOGLE_MASTER_FOLDER_ID"),
    masterSpreadsheetId: requiredId("GOOGLE_MASTER_SPREADSHEET_ID"),
    workspaceDomain: (process.env.GOOGLE_WORKSPACE_DOMAIN || "itera.health").trim().toLowerCase(),
    timeZone: (process.env.GOOGLE_DEFAULT_TIME_ZONE || "America/New_York").trim(),
    currency: (process.env.GOOGLE_DEFAULT_CURRENCY || "USD").trim(),
    capacityWarningThreshold: threshold,
  };
}

export function isReportingPeriod(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function reportingPeriod(year: number, month: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid reporting period");
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}
