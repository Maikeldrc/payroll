export function validateProductionConfiguration(): void {
  if (process.env.NODE_ENV !== "production") return;
  const required = [
    "FIREBASE_PROJECT_ID",
    "ALLOWED_ORIGINS",
    "DATA_STORE",
    "DATABASE_URL",
    "MALWARE_SCANNER_URL",
  ] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Missing required production configuration: ${missing.join(",")}`);

  const origins = process.env.ALLOWED_ORIGINS!.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (origins.some((origin) => !origin.startsWith("https://") || origin.includes("*"))) {
    throw new Error("Production origins must be explicit HTTPS origins without wildcards");
  }
  if (process.env.DATA_STORE !== "postgres") throw new Error("Production DATA_STORE must be postgres");
  if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL!)) throw new Error("Production DATABASE_URL must use PostgreSQL");
  if (process.env.DATABASE_SSL === "disable") throw new Error("Production database TLS cannot be disabled");
  if (!process.env.MALWARE_SCANNER_URL!.startsWith("https://")) {
    throw new Error("Production malware scanner must use HTTPS");
  }
  if (process.env.APP_ENV && process.env.APP_ENV !== "production") {
    throw new Error("NODE_ENV=production requires APP_ENV=production");
  }
}
