import { Pool, type PoolClient } from "pg";
import type { AuthenticatedPrincipal } from "../security/auth";
import type { MonthlyRecordRow, PayrollRow } from "./types";

let pool: Pool | undefined;

function databasePool(): Pool {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("PostgreSQL data source is not configured");
  pool ??= new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ssl: process.env.DATABASE_SSL === "disable" ? false : { rejectUnauthorized: true },
  });
  return pool;
}

function explicit(values: string[]): string[] {
  return values.filter((value) => value && value !== "*");
}

async function inTenantTransaction<T>(principal: AuthenticatedPrincipal, operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const organizationIds = explicit(principal.scopes.organizationIds);
  const practiceIds = explicit(principal.scopes.practiceIds);
  if (!organizationIds.length || !practiceIds.length) throw new Error("Explicit tenant scope is required");

  const client = await databasePool().connect();
  try {
    await client.query("BEGIN READ WRITE");
    await client.query("SELECT set_config('itera.organization_ids', $1, true), set_config('itera.practice_ids', $2, true)", [
      organizationIds.join(","), practiceIds.join(","),
    ]);
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function readPostgresMonthlyRecords(principal: AuthenticatedPrincipal): Promise<MonthlyRecordRow[]> {
  return inTenantTransaction(principal, async (client) => {
    const s = principal.scopes;
    const result = await client.query({
      text: `SELECT r.id::text, r.patient_id::text, p.mrn, p.patient_name,
        r.organization_id, r.practice_id, r.provider_id, r.provider_name,
        r.care_manager_id, r.care_manager_name, r.service_code, r.month_of::text,
        r.monthly_billing, r.eligibility, r.insurance_name, r.diagnosis_summary, r.payroll_status
        FROM monthly_management_records r
        JOIN patients p ON p.id = r.patient_id AND p.organization_id = r.organization_id AND p.practice_id = r.practice_id
        WHERE r.organization_id = ANY($1::text[]) AND r.practice_id = ANY($2::text[])
          AND (cardinality($3::text[]) = 0 OR r.provider_id = ANY($3::text[]))
          AND (cardinality($4::text[]) = 0 OR r.care_manager_id = ANY($4::text[]))
          AND (cardinality($5::text[]) = 0 OR r.patient_id = ANY($5::text[]))
          AND (cardinality($6::text[]) = 0 OR r.service_code = ANY($6::text[]))`,
      values: [explicit(s.organizationIds), explicit(s.practiceIds), explicit(s.providerIds), explicit(s.careManagerIds), explicit(s.patientIds), explicit(s.serviceCodes)],
    });
    return result.rows.map((row) => ({
      id: row.id, patientId: row.patient_id, mrn: row.mrn, patientName: row.patient_name,
      organizationId: row.organization_id, practiceId: row.practice_id, providerId: row.provider_id,
      providerName: row.provider_name, careManagerId: row.care_manager_id, careManagerName: row.care_manager_name,
      serviceCode: row.service_code, monthOf: row.month_of, monthlyBilling: Number(row.monthly_billing),
      eligibility: row.eligibility, insuranceName: row.insurance_name, diagnosisSummary: row.diagnosis_summary,
      payrollStatus: row.payroll_status,
    }));
  });
}

export async function appendPostgresMonthlyRecords(records: MonthlyRecordRow[], principal: AuthenticatedPrincipal): Promise<void> {
  await inTenantTransaction(principal, async (client) => {
    for (const record of records) {
      await client.query({
        text: `INSERT INTO patients (id, organization_id, practice_id, mrn, patient_name)
          VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (id) DO UPDATE SET mrn = EXCLUDED.mrn, patient_name = EXCLUDED.patient_name, updated_at = now()
          WHERE patients.organization_id = EXCLUDED.organization_id AND patients.practice_id = EXCLUDED.practice_id`,
        values: [record.patientId, record.organizationId, record.practiceId, record.mrn, record.patientName],
      });
      await client.query({
        text: `INSERT INTO monthly_management_records
          (id, patient_id, organization_id, practice_id, provider_id, provider_name, care_manager_id, care_manager_name,
           service_code, month_of, monthly_billing, eligibility, insurance_name, diagnosis_summary, payroll_status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::date,$11,$12,$13,$14,$15)
          ON CONFLICT (id) DO NOTHING`,
        values: [record.id, record.patientId, record.organizationId, record.practiceId, record.providerId, record.providerName,
          record.careManagerId, record.careManagerName, record.serviceCode, record.monthOf, record.monthlyBilling,
          record.eligibility, record.insuranceName, record.diagnosisSummary, record.payrollStatus],
      });
    }
  });
}

export async function readPostgresPayroll(principal: AuthenticatedPrincipal): Promise<PayrollRow[]> {
  return inTenantTransaction(principal, async (client) => {
    const s = principal.scopes;
    const result = await client.query({
      text: `SELECT id::text, organization_id, practice_id, care_manager_id, care_manager_name,
        month_of::text, base_earnings, bonuses, deductions, net_pay, status,
        calculation_version, calculation_input_hash
        FROM payroll_calculations
        WHERE organization_id = ANY($1::text[]) AND practice_id = ANY($2::text[])
          AND (cardinality($3::text[]) = 0 OR care_manager_id = ANY($3::text[]))`,
      values: [explicit(s.organizationIds), explicit(s.practiceIds), explicit(s.careManagerIds)],
    });
    return result.rows.map((row) => ({
      id: row.id, organizationId: row.organization_id, practiceId: row.practice_id,
      careManagerId: row.care_manager_id, careManagerName: row.care_manager_name, monthOf: row.month_of,
      baseEarnings: Number(row.base_earnings), bonuses: Number(row.bonuses), deductions: Number(row.deductions),
      netPay: Number(row.net_pay), status: row.status, calculationVersion: Number(row.calculation_version),
      inputHash: row.calculation_input_hash,
    }));
  });
}
