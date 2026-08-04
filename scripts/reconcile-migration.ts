import { createHash } from "node:crypto";
import { Pool } from "pg";
import { readMonthlyRecords } from "../backend/data/sheetsRepository";
import type { MonthlyRecordRow } from "../backend/data/types";

if (!process.argv.includes("--dry-run")) {
  throw new Error("Reconciliation is read-only and requires --dry-run");
}

const connectionString = process.env.DATABASE_MIGRATION_URL?.trim();
if (!connectionString) throw new Error("DATABASE_MIGRATION_URL is required");

function canonical(record: MonthlyRecordRow): string {
  return JSON.stringify([
    record.id, record.patientId, record.mrn, record.patientName, record.organizationId, record.practiceId,
    record.providerId, record.providerName, record.careManagerId, record.careManagerName, record.serviceCode,
    record.monthOf, record.monthlyBilling.toFixed(2), record.eligibility, record.insuranceName,
    record.diagnosisSummary, record.payrollStatus,
  ]);
}

function fingerprint(records: MonthlyRecordRow[]): string {
  const digest = createHash("sha256");
  records.sort((a, b) => a.id.localeCompare(b.id)).forEach((record) => digest.update(canonical(record)).update("\n"));
  return digest.digest("hex");
}

const source = await readMonthlyRecords();
const organizationIds = [...new Set(source.map((record) => record.organizationId))];
const practiceIds = [...new Set(source.map((record) => record.practiceId))];
if (!organizationIds.length || !practiceIds.length) throw new Error("Source has no explicit tenant scope");

const pool = new Pool({ connectionString, max: 1, ssl: { rejectUnauthorized: true } });
const client = await pool.connect();
try {
  await client.query("BEGIN READ ONLY");
  await client.query("SELECT set_config('itera.organization_ids', $1, true), set_config('itera.practice_ids', $2, true)", [organizationIds.join(","), practiceIds.join(",")]);
  const result = await client.query({
    text: `SELECT r.id::text, r.patient_id::text, p.mrn, p.patient_name, r.organization_id, r.practice_id,
      r.provider_id, r.provider_name, r.care_manager_id, r.care_manager_name, r.service_code, r.month_of::text,
      r.monthly_billing, r.eligibility, r.insurance_name, r.diagnosis_summary, r.payroll_status
      FROM monthly_management_records r
      JOIN patients p ON p.id = r.patient_id AND p.organization_id = r.organization_id AND p.practice_id = r.practice_id
      WHERE r.organization_id = ANY($1::text[]) AND r.practice_id = ANY($2::text[])`,
    values: [organizationIds, practiceIds],
  });
  const target: MonthlyRecordRow[] = result.rows.map((row) => ({
    id: row.id, patientId: row.patient_id, mrn: row.mrn, patientName: row.patient_name,
    organizationId: row.organization_id, practiceId: row.practice_id, providerId: row.provider_id,
    providerName: row.provider_name, careManagerId: row.care_manager_id, careManagerName: row.care_manager_name,
    serviceCode: row.service_code, monthOf: row.month_of, monthlyBilling: Number(row.monthly_billing),
    eligibility: row.eligibility, insuranceName: row.insurance_name, diagnosisSummary: row.diagnosis_summary,
    payrollStatus: row.payroll_status,
  }));
  await client.query("COMMIT");
  const sourceHash = fingerprint(source);
  const targetHash = fingerprint(target);
  const matches = source.length === target.length && sourceHash === targetHash;
  console.log(JSON.stringify({ mode: "dry-run", sourceCount: source.length, targetCount: target.length, sourceHash, targetHash, matches }));
  if (!matches) process.exitCode = 2;
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  client.release();
  await pool.end();
}
