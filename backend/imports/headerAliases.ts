const ALIASES: Record<string, string[]> = {
  MRN: ["mrn", "medical record number", "medical_record_number"],
  Patient: ["patient", "patient name", "patient_name"],
  "First Name": ["first name", "firstname", "first_name"],
  "Last Name": ["last name", "lastname", "last_name"],
  Sex: ["sex", "gender"],
  "Date of Birth": ["date of birth", "dob", "birth date"],
  Provider: ["provider", "provider name", "physician"],
  "Care Manager": ["care manager", "caremanager", "care_manager", "cm"],
  Practice: ["practice", "practice name", "clinic"],
  Service: ["service", "program", "service type"],
  Conditions: ["conditions", "condition", "diagnoses", "diagnosis"],
  "ICD-10s": ["icd-10s", "icd10s", "icd 10", "icd-10", "icd codes"],
  Codes: ["codes", "billing codes", "cpt codes", "hcpcs codes"],
  "Month Of": ["month of", "monthof", "month_of", "reporting period"],
  "Log Entries": ["log entries", "logs", "log count"],
  "Monthly Billing": ["monthly billing", "monthlybilling", "billing", "amount billed"],
  "Measured Days": ["measured days", "measureddays"],
  "Last Modification Time": ["last modification time", "last modified", "modified at"],
  "Latest Interactive Communication": ["latest interactive communication", "last interactive communication"],
  "Primary Insurance Name": ["primary insurance name", "primary insurance", "insurance"],
  "Primary Policy Number": ["primary policy number", "primary policy", "policy number"],
  "Secondary Insurance Name": ["secondary insurance name", "secondary insurance"],
  "Secondary Policy Number": ["secondary policy number", "secondary policy"],
  Address: ["address", "patient address"],
  Eligibility: ["eligibility", "eligible"],
  HMO: ["hmo", "is hmo"],
};

function key(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
}

const LOOKUP = new Map<string, string>();
for (const [canonical, aliases] of Object.entries(ALIASES)) {
  LOOKUP.set(key(canonical), canonical);
  aliases.forEach((alias) => LOOKUP.set(key(alias), canonical));
}

export function canonicalHeader(input: string): string {
  const normalized = key(input);
  const codeMatch = normalized.match(/^(?:code|cpt|billing code) ([1-6])$/) || normalized.match(/^(?:code|cpt)([1-6])$/);
  if (codeMatch) return `Code${codeMatch[1]}`;
  return LOOKUP.get(normalized) || input.trim();
}

export function isRecognizedHeader(input: string): boolean {
  const canonical = canonicalHeader(input);
  return canonical !== input.trim() || Object.prototype.hasOwnProperty.call(ALIASES, canonical) || /^Code[1-6]$/.test(canonical);
}
