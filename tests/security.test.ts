import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { createBackendApp } from "../backend/app";
import { configuredDataStore, filterRecordsForPrincipal } from "../backend/data/repository";
import type { MonthlyRecordRow } from "../backend/data/types";
import { parseUpload } from "../backend/files/uploadService";
import { PERMISSIONS, ROLE_NAMES, ROLE_PERMISSIONS, roleHasPermission, type Permission, type RoleName } from "../shared/authorization";
import { validateProductionConfiguration } from "../backend/config/production";

process.env.NODE_ENV = "test";
process.env.ALLOWED_ORIGINS = "https://app.itera.health";

test("backend denies anonymous API requests and emits defensive headers", async () => {
  const response = await request(createBackendApp()).get("/api/me").set("Origin", "https://app.itera.health");
  assert.equal(response.status, 401);
  assert.equal(response.body.error, "authentication_required");
  assert.match(response.headers["cache-control"], /no-store/);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-powered-by"], undefined);
  assert.ok(response.headers["x-correlation-id"]);
});

test("backend rejects unknown browser origins", async () => {
  const response = await request(createBackendApp()).get("/healthz").set("Origin", "https://preview-attacker.vercel.app");
  assert.equal(response.status, 403);
  assert.equal(response.body.error, "origin_not_allowed");
});

test("every sensitive route rejects anonymous requests before processing", async () => {
  const app = createBackendApp();
  const cases: Array<["get" | "post", string]> = [
    ["get", "/api/dashboard/summary?monthOf=2026-08"], ["get", "/api/patients?monthOf=2026-08"],
    ["post", "/api/patients/detail"],
    ["get", "/api/reports/patients.csv?monthOf=2026-08"], ["get", "/api/reports/patients.xlsx?monthOf=2026-08"],
    ["get", "/api/reports/executive.pdf?monthOf=2026-08"], ["get", "/api/audit-events"],
    ["get", "/api/payroll?monthOf=2026-08"],
    ["post", "/api/imports"], ["post", "/api/imports/analyze"], ["post", "/api/imports/confirm"],
    ["post", "/api/reporting-periods/initialize"], ["post", "/api/reporting-periods/recalculate"],
    ["post", "/api/reporting-periods/close"], ["post", "/api/reporting-periods/reopen"],
    ["get", "/api/storage/google/configuration"], ["get", "/api/storage/google/capacity"], ["post", "/api/session/logout"],
    ["get", "/api/storage/backups"], ["post", "/api/storage/backups"], ["post", "/api/storage/backups/policy"],
    ["post", "/api/storage/test-data/purge"],
  ];
  for (const [method, path] of cases) {
    const response = await request(app)[method](path).set("Origin", "https://app.itera.health");
    assert.equal(response.status, 401, `${method.toUpperCase()} ${path}`);
  }
});

test("production configuration fails closed when security dependencies are absent", () => {
  const previous = { ...process.env };
  try {
    process.env.NODE_ENV = "production";
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.DATA_STORE;
    delete process.env.DATABASE_URL;
    delete process.env.MALWARE_SCANNER_URL;
    assert.throws(() => validateProductionConfiguration(), /Missing required production configuration/);
  } finally {
    process.env = previous;
  }
});

test("production requires the monthly Google Sheets adapter and explicit resource IDs", () => {
  const previous = { ...process.env };
  try {
    process.env.NODE_ENV = "production";
    process.env.APP_ENV = "production";
    process.env.FIREBASE_PROJECT_ID = "synthetic-project";
    process.env.ALLOWED_ORIGINS = "https://app.itera.health";
    process.env.AUDIT_FIRESTORE_DATABASE_ID = "itera-audit";
    process.env.IMPORT_ANALYSIS_TOKEN_SECRET = "synthetic-secret-at-least-32-characters-long";
    process.env.GOOGLE_SHARED_DRIVE_ID = "synthetic_shared_drive_id";
    process.env.GOOGLE_ROOT_FOLDER_ID = "synthetic_root_folder_id";
    process.env.GOOGLE_MONTHLY_FOLDER_ID = "synthetic_monthly_folder_id";
    process.env.GOOGLE_MASTER_FOLDER_ID = "synthetic_master_folder_id";
    process.env.GOOGLE_MASTER_SPREADSHEET_ID = "synthetic_master_spreadsheet_id";
    process.env.DATA_STORE = "sheets";
    assert.throws(() => validateProductionConfiguration(), /DATA_STORE must be google-sheets-monthly/);
    process.env.DATA_STORE = "unknown";
    assert.throws(() => configuredDataStore(), /google-sheets-monthly/);
    process.env.DATA_STORE = "google-sheets-monthly";
    assert.doesNotThrow(() => validateProductionConfiguration());
  } finally {
    process.env = previous;
  }
});

test("role matrix keeps executive and provider viewers away from privileged operations", () => {
  assert.equal(roleHasPermission("Executive Viewer", "patient:view"), false);
  assert.equal(roleHasPermission("Executive Viewer", "configuration:manage"), false);
  assert.equal(roleHasPermission("Provider Viewer", "payroll:view"), false);
  assert.equal(roleHasPermission("Care Manager", "import:create"), false);
  assert.equal(roleHasPermission("System Administrator", "audit:view"), true);
});

test("all eleven backend roles have the exact reviewed permission set", () => {
  const expected: Record<RoleName, Permission[]> = {
    "System Administrator": [...PERMISSIONS],
    "Operations Administrator": ["dashboard:view", "patient:view", "patient:update", "performance:view", "quality:view", "import:create", "report:create", "report:download", "configuration:view", "configuration:manage"],
    "Payroll Administrator": ["dashboard:view", "performance:view", "payroll:view", "payroll:manage", "report:create", "report:download"],
    "Billing Administrator": ["dashboard:view", "patient:view", "billing:view", "report:create", "report:download"],
    "Clinical Administrator": ["dashboard:view", "patient:view", "patient:update", "performance:view", "quality:view", "report:create", "report:download"],
    "Operations Manager": ["dashboard:view", "patient:view", "performance:view", "quality:view", "report:create", "report:download"],
    Supervisor: ["dashboard:view", "patient:view", "patient:update", "performance:view", "quality:view", "report:create"],
    "Care Manager": ["patient:view", "patient:update", "performance:view", "quality:view"],
    "Provider Viewer": ["dashboard:view", "patient:view", "performance:view"],
    "Executive Viewer": ["dashboard:view", "performance:view"],
    Auditor: ["dashboard:view", "performance:view", "payroll:view", "billing:view", "report:download", "configuration:view", "audit:view"],
  };
  assert.deepEqual([...ROLE_NAMES].sort(), Object.keys(expected).sort());
  for (const role of ROLE_NAMES) {
    assert.deepEqual([...ROLE_PERMISSIONS[role]].sort(), expected[role].sort(), role);
  }
});

const baseRecord: MonthlyRecordRow = {
  id: "r1", patientId: "patient-1", mrn: "synthetic-mrn", patientName: "Synthetic Patient",
  organizationId: "org-a", practiceId: "practice-a", providerId: "provider-a", providerName: "Synthetic Provider",
  careManagerId: "cm-a", careManagerName: "Synthetic Manager", serviceCode: "CCM", monthOf: "2026-08",
  monthlyBilling: 100, eligibility: "Eligible", insuranceName: "Synthetic Insurance", diagnosisSummary: "Synthetic condition", payrollStatus: "Pending Review",
};

test("tenant scope filter denies cross-organization, cross-practice and cross-provider records", () => {
  const principal = {
    uid: "user-1", role: "Provider Viewer" as const,
    scopes: { organizationIds: ["org-a"], practiceIds: ["practice-a"], providerIds: ["provider-a"], careManagerIds: [], patientIds: [], serviceCodes: [] },
  };
  const records = [baseRecord, { ...baseRecord, id: "r2", organizationId: "org-b" }, { ...baseRecord, id: "r3", practiceId: "practice-b" }, { ...baseRecord, id: "r4", providerId: "provider-b" }];
  assert.deepEqual(filterRecordsForPrincipal(records, principal).map((record) => record.id), ["r1"]);
});

test("tenant scope filter enforces care-manager, patient and service scopes together", () => {
  const principal = {
    uid: "user-2", role: "Care Manager" as const,
    scopes: { organizationIds: ["org-a"], practiceIds: ["practice-a"], providerIds: [], careManagerIds: ["cm-a"], patientIds: ["patient-1"], serviceCodes: ["CCM"] },
  };
  const records = [baseRecord, { ...baseRecord, id: "r2", careManagerId: "cm-b" }, { ...baseRecord, id: "r3", patientId: "patient-2" }, { ...baseRecord, id: "r4", serviceCode: "RPM" }];
  assert.deepEqual(filterRecordsForPrincipal(records, principal).map((record) => record.id), ["r1"]);
});

test("upload parser rejects spreadsheet formula injection", async () => {
  const csv = [
    "ID,PatientID,MRN,Patient,OrganizationID,PracticeID,ProviderID,Provider,CareManagerID,CareManager,Service,MonthOf",
    "r1,p1,m1,=HYPERLINK(\"https://invalid\"),org-a,practice-a,provider-a,Provider,cm-a,Manager,CCM,2026-08",
  ].join("\n");
  const file = { originalname: "synthetic.csv", buffer: Buffer.from(csv), mimetype: "text/csv" } as Express.Multer.File;
  await assert.rejects(() => parseUpload(file), /Formula content rejected/);
});

test("upload parser rejects missing required values and negative billing", async () => {
  const header = "ID,PatientID,MRN,Patient,OrganizationID,PracticeID,ProviderID,Provider,CareManagerID,CareManager,Service,MonthOf,MonthlyBilling";
  const missing = { originalname: "synthetic.csv", buffer: Buffer.from(`${header}\n,p1,m1,Patient,org-a,practice-a,provider-a,Provider,cm-a,Manager,CCM,2026-08,1`), mimetype: "text/csv" } as Express.Multer.File;
  await assert.rejects(() => parseUpload(missing), /ID is required/);
  const negative = { originalname: "synthetic.csv", buffer: Buffer.from(`${header}\nr1,p1,m1,Patient,org-a,practice-a,provider-a,Provider,cm-a,Manager,CCM,2026-08,-1`), mimetype: "text/csv" } as Express.Multer.File;
  await assert.rejects(() => parseUpload(negative), /Invalid billing/);
});

test("CORS preflight advertises only the reviewed methods", async () => {
  const response = await request(createBackendApp()).options("/api/me")
    .set("Origin", "https://app.itera.health")
    .set("Access-Control-Request-Method", "PUT");
  assert.equal(response.status, 204);
  assert.equal(response.headers["access-control-allow-origin"], "https://app.itera.health");
  assert.doesNotMatch(response.headers["access-control-allow-methods"] || "", /PUT/);
});
