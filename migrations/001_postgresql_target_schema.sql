BEGIN;

CREATE TABLE organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE practices (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id)
);

CREATE TABLE patients (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  practice_id text NOT NULL,
  mrn text NOT NULL,
  patient_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (practice_id, organization_id) REFERENCES practices(id, organization_id),
  UNIQUE (organization_id, practice_id, mrn),
  UNIQUE (id, organization_id, practice_id)
);

CREATE TABLE monthly_management_records (
  id text PRIMARY KEY,
  patient_id text NOT NULL,
  organization_id text NOT NULL REFERENCES organizations(id),
  practice_id text NOT NULL,
  provider_id text NOT NULL,
  provider_name text NOT NULL,
  care_manager_id text NOT NULL,
  care_manager_name text NOT NULL,
  service_code text NOT NULL,
  month_of date NOT NULL,
  monthly_billing numeric(12,2) NOT NULL DEFAULT 0 CHECK (monthly_billing >= 0),
  eligibility text NOT NULL DEFAULT '',
  insurance_name text NOT NULL DEFAULT '',
  diagnosis_summary text NOT NULL DEFAULT '',
  payroll_status text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (patient_id, organization_id, practice_id) REFERENCES patients(id, organization_id, practice_id),
  FOREIGN KEY (practice_id, organization_id) REFERENCES practices(id, organization_id),
  UNIQUE (patient_id, service_code, month_of)
);

CREATE TABLE payroll_calculations (
  id text PRIMARY KEY,
  organization_id text NOT NULL REFERENCES organizations(id),
  practice_id text NOT NULL,
  care_manager_id text NOT NULL,
  care_manager_name text NOT NULL,
  month_of date NOT NULL,
  base_earnings numeric(12,2) NOT NULL DEFAULT 0,
  bonuses numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_pay numeric(12,2) NOT NULL,
  calculation_version integer NOT NULL CHECK (calculation_version > 0),
  calculation_input_hash text NOT NULL CHECK (calculation_input_hash ~ '^[a-f0-9]{64}$'),
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (practice_id, organization_id) REFERENCES practices(id, organization_id),
  UNIQUE (organization_id, care_manager_id, month_of, calculation_version)
);

CREATE INDEX records_tenant_period_idx ON monthly_management_records (organization_id, practice_id, month_of);
CREATE INDEX records_patient_idx ON monthly_management_records (patient_id, month_of);
CREATE INDEX payroll_tenant_period_idx ON payroll_calculations (organization_id, practice_id, month_of);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;
ALTER TABLE monthly_management_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_management_records FORCE ROW LEVEL SECURITY;
ALTER TABLE payroll_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_calculations FORCE ROW LEVEL SECURITY;

CREATE POLICY patients_tenant_policy ON patients
  USING (
    organization_id = ANY(string_to_array(current_setting('itera.organization_ids', true), ','))
    AND practice_id = ANY(string_to_array(current_setting('itera.practice_ids', true), ','))
  )
  WITH CHECK (
    organization_id = ANY(string_to_array(current_setting('itera.organization_ids', true), ','))
    AND practice_id = ANY(string_to_array(current_setting('itera.practice_ids', true), ','))
  );
CREATE POLICY records_tenant_policy ON monthly_management_records
  USING (
    organization_id = ANY(string_to_array(current_setting('itera.organization_ids', true), ','))
    AND practice_id = ANY(string_to_array(current_setting('itera.practice_ids', true), ','))
  )
  WITH CHECK (
    organization_id = ANY(string_to_array(current_setting('itera.organization_ids', true), ','))
    AND practice_id = ANY(string_to_array(current_setting('itera.practice_ids', true), ','))
  );
CREATE POLICY payroll_tenant_policy ON payroll_calculations
  USING (
    organization_id = ANY(string_to_array(current_setting('itera.organization_ids', true), ','))
    AND practice_id = ANY(string_to_array(current_setting('itera.practice_ids', true), ','))
  )
  WITH CHECK (
    organization_id = ANY(string_to_array(current_setting('itera.organization_ids', true), ','))
    AND practice_id = ANY(string_to_array(current_setting('itera.practice_ids', true), ','))
  );

COMMIT;
