# ITERA technical readiness evidence

Assessment date: 2026-08-04. Scope: the repository and locally available deployment configuration. This document is technical evidence, not a legal determination of HIPAA compliance.

Status vocabulary: **Verified**, **Failed**, **Not verified**, **Operational evidence required**, **Policy evidence required**, **Contractual evidence required**, **Legal/compliance validation required**, and **Not applicable**.

## A. Executive technical readiness summary

Overall classification: **Conditional readiness — remediation required**.

The code-level Critical and High findings identified in the initial assessment have been remediated: the frontend is static-only, Vercel has no PHI runtime, authentication is mandatory, authorization is backend-enforced, production requires PostgreSQL, uploads and reports are backend-only, and audit events are hash chained. The local security suite, frontend build, static isolation check, backend build and High/Critical dependency gate pass.

Production remains blocked because deployment, tenant data migration, Google Workspace controls, Cloud IAM, backups/restore, log retention, alerting, BAAs and browser/network traces against the real environment are **Not verified**. No claim of legal compliance is made.

## B. Architecture and data flow

### Target and implemented code path

```text
Vercel static origin ── HTML/JS/CSS/public assets only ──> Browser memory
Firebase Identity ── ID token + MFA claim ───────────────> Browser memory
Browser ── Bearer token, direct HTTPS, no-store ─────────> Cloud Run API
Cloud Run API ── RBAC + tenant scopes + minimum necessary > PostgreSQL (RLS)
Cloud Run API ── security/import audit metadata only ─────> Firestore
Cloud Run API ── file bytes, fail closed ─────────────────> approved malware scanner
```

Trust boundaries are Vercel/static delivery, browser/untrusted client, identity provider, authenticated backend, PostgreSQL, Firestore audit store and the malware scanner. Google Sheets remains compiled only as a controlled development/migration adapter; `NODE_ENV=production` requires `DATA_STORE=postgres`.

### Component inventory

| Component | Runtime/host | Data | PHI possible | Storage/logging | Authentication/authorization | Status |
|---|---|---|---:|---|---|---|
| `dist/` | Vercel static CDN | Public assets/config | No by design | Static cache; HTML no-store | None | Verified locally |
| React client | Browser | Minimum authorized PHI | Yes | Memory only; no first-party persistent store | Firebase token + server claims | Verified in source; runtime trace pending |
| Express API | Cloud Run target | PHI, reports, uploads | Yes | No-store; safe allowlisted logs | Firebase Admin, RBAC, tenant scope | Verified in source/tests; deployment pending |
| PostgreSQL | Cloud SQL target | Clinical/billing/payroll PHI | Yes | RLS, TLS required, backups pending | Runtime DB role | Schema verified; service pending |
| Firestore | Google Cloud | Audit metadata/import hashes | Controlled identifiers only | Hash chain; client denied | Admin SDK only | Code/rules verified; deployment pending |
| Google Sheets | Workspace | Legacy source PHI | Yes | Transitional/read-only after cutover | Backend ADC + explicit allowlist | Production prohibited; Workspace state pending |
| Malware scanner | Approved external service | Uploaded file bytes | Yes | Vendor retention must be zero/approved | Backend only | Configuration gate verified; vendor evidence pending |

## C. Vercel PHI isolation report

| Question | Result | Evidence |
|---|---|---|
| Does Vercel receive/process/transmit/store/cache/log PHI? | **Confirmed No in built artifact and configuration; production trace Not verified** | `vercel.json`, `dist/`, `scripts/verify-static-isolation.mjs` |
| Do previews access PHI? | **Denied by backend CORS in code; deployment Not verified** | explicit `ALLOWED_ORIGINS`; unknown preview test returns 403 |
| Is frontend static-only? | **Verified locally** | Vite emits three static artifacts; no functions, middleware, rewrites or proxies |
| Are Vercel runtime features required? | **Confirmed No** | frontend build only; workflows reject `.vercel/output/functions` |

Production evidence must include Vercel build manifest, 404 checks for `/api/*` and server artifacts, a browser network trace for every PHI flow, and Vercel request/function/edge log review.

## D. Google Sheets PHI security report

The legacy schema can contain patient ID, MRN, patient name, organization/practice/provider/care-manager identifiers, service/month, eligibility, insurance, diagnosis summary, billing and payroll metadata. The frontend no longer imports Google APIs or spreadsheet IDs. Only the backend transitional adapter uses application-default credentials and an explicit spreadsheet allowlist.

Owners, Shared Drive, ACLs, external/public/domain sharing, service accounts, Apps Script, add-ons, connectors, offline/mobile access, downloads, copies, Vault, retention and Drive audit logs are **Not verified**. Google Sheets is **not recommended as the production system of record** due to transactionality, row-level authorization, integrity, concurrency, auditability and payroll risks. Migration to PostgreSQL is required before production.

The non-disruptive route is: inventory, target schema, validation, cohort migration, SHA-256 reconciliation, parallel run, controlled cutover, read-only archive, approved retention/deletion and rehearsed rollback. This repository intentionally does not execute a production migration automatically.

## E. PHI inventory

| Data element | Source/destination | Authorized roles | Logging | Retention status | Risk |
|---|---|---|---|---|---|
| Patient identifiers/name/MRN | PostgreSQL → patient endpoints | Clinical/operations/provider/care-manager by scope | Never payload; resource ID hashed | Policy pending | High |
| Diagnosis/clinical summary | PostgreSQL → field-filtered clinical views/reports | Clinical Admin, Supervisor, Care Manager, System Admin | Never payload | Policy pending | High |
| Insurance/billing | PostgreSQL → billing-authorized responses/reports | Billing/operations/system roles | Never payload | Policy pending | High |
| Payroll results | PostgreSQL → payroll endpoint | Payroll/System/Auditor as matrix permits | Integrity status only | Policy pending | High |
| Uploaded CSV/XLSX | Browser → API → scanner → memory parser | Import-authorized roles | SHA-256 and row count only | Buffer zeroed; scanner policy pending | High |
| Generated reports | API → browser blob | Report + data permission and tenant scope | Controlled period/format ID | Browser blob revoked; policy pending | High |

## F. HIPAA technical control matrix

| Control | Status | Evidence or missing evidence |
|---|---|---|
| Access control / unique identification | Verified in code | Firebase UID, trusted roles, explicit tenant claims |
| Automatic logoff | Verified in code | 15-minute client idle, 8-hour client/backend absolute expiry |
| Authentication / MFA | Verified in code; operational evidence required | revocation check, disabled-user check, privileged MFA claim |
| Authorization / minimum necessary | Verified in code/tests | deny-by-default permissions, field allowlists, backend aggregation |
| Encryption in transit | Configuration verified; deployment pending | HTTPS origins/scanner and database TLS fail closed |
| Encryption at rest | Operational evidence required | Cloud SQL/Firestore/Workspace configuration evidence |
| Audit controls / integrity | Verified in code; deployment pending | immutable transaction writes, sequence and SHA-256 chain verifier |
| Data integrity | Verified in schema/import controls; runtime pending | constraints, hashes, idempotency, formula rejection, reconciliation |
| Transmission security | Verified in configuration; runtime trace pending | direct backend origin, CSP/CORS, no Vercel proxy |
| Incident procedures | Policy evidence required | response plan, contacts, exercises |
| Backup / disaster recovery | Operational and policy evidence required | PITR, restore test, RTO/RPO |
| Risk analysis | This artifact supports it; compliance validation required | residual risks below |
| Workforce/access management | Operational/policy evidence required | approvals, periodic review, offboarding, 90-day assignment expiry |
| Business associates | Contractual/legal validation required | BAAs and covered-service configuration |

## G. Residual findings register

### TR-001 — Production infrastructure and runtime isolation not verified

- Severity: High release blocker
- Components: Vercel, Cloud Run, Cloud SQL, Firebase/Firestore
- Evidence: deployment workflows exist; no accessible production project/runtime evidence
- Current behavior: code fails closed, but real IAM, DNS/TLS, logs and network flows are unproven
- Expected: isolated deployed environments with retained traces and logs
- Risk: configuration drift could reintroduce preview/tenant/PHI exposure
- Relationship: access control, transmission security, audit controls
- Recommendation: execute `production-activation-checklist.md`
- Effort: 2–5 days after credentials/resources are available
- Regression risk: Medium
- Verification: production synthetic end-to-end suite and provider log review

### TR-002 — Workspace/legacy spreadsheet controls not verified

- Severity: High release blocker
- Component/resource: Google Workspace and every legacy spreadsheet/copy
- Evidence missing: ACL/publication/add-on/script/export/audit/Vault inventory
- Risk: PHI may remain accessible or exportable outside authorized roles
- Recommendation: export and review Workspace evidence; lock source read-only after reconciled cutover
- Effort: 1–3 days plus owner remediation
- Regression risk: Low
- Verification: unauthorized account denied, public/external sharing disabled, Drive audit event retained

### TR-003 — Operational, policy and contractual evidence missing

- Severity: High release blocker
- Data: all production PHI
- Evidence missing: BAAs/scope, retention, incident response, backup restore, workforce review, log access/retention, alerting
- Risk: technically secure code can operate outside required safeguards
- Recommendation: compliance owner signs the release evidence package
- Effort: organization-dependent
- Regression risk: Low
- Verification: approved artifacts with owners, dates and review cadence

### TR-004 — Browser isolation trace could not be completed locally

- Severity: Medium
- Component: browser test environment
- Evidence: static/source tests pass; integrated browser could not complete localhost navigation
- Expected: storage, back-button/logout and direct-network trace using synthetic data
- Recommendation: run the automated/manual production-candidate browser matrix before release
- Verification: HAR/screenshot evidence contains no PHI and no PHI request to Vercel

### TR-005 — Moderate transitive dependency advisories

- Severity: Medium
- Components: `uuid` through ExcelJS/Firebase Admin/Google libraries
- Evidence: npm audit reports 9 Moderate and 0 High/Critical; suggested forced fix is breaking
- Recommendation: track upstream patches and retest; High/Critical gate remains blocking
- Regression risk: High if force-downgraded
- Verification: clean supported dependency upgrade and full release gate

## H. Remediation roadmap

- Immediate (0–7 days): provision distinct projects, Cloud SQL and runtime identity; deploy rules/indexes; configure Secret Manager, MFA and explicit user scopes; collect Workspace and BAA evidence.
- Short term (8–30 days): migrate one tenant cohort, reconcile, parallel-run, test rollback, cut over, archive Sheets read-only; execute synthetic browser/Vercel isolation tests.
- Medium term (31–90 days): restore exercise, alert tuning, periodic access certification, incident tabletop, dependency refresh and retention automation.
- Operational: IAM, Workspace ACLs, logging access, backups/PITR, monitoring, offboarding.
- Policy: retention/deletion, incident response, access reviews, acceptable exports and devices.
- Contractual/legal: BAAs, covered service configurations, scanner data handling and compliance sign-off.

## I. Automated security test plan

The release suite covers anonymous denial, CORS preview denial, sensitive-route authentication, production fail-closed configuration, all eleven RBAC sets, organization/practice/provider/care-manager/patient/service isolation, unsafe upload content, CORS methods, static artifact isolation, first-party persistence bans, builds and High/Critical dependency auditing.

Before production, add environment-bound synthetic tests for: storage/Cache API/cookies, refresh/back after logout, idle/absolute expiry, user/org switching, Vercel and backend network traces, disabled/expired users, Firebase MFA, Cloud SQL RLS under the actual runtime role, audit-chain continuity, malformed/oversized/macro files, scanner failure, duplicate idempotency, unauthorized/cross-tenant downloads and Workspace access denial.

No production PHI may be used in test fixtures, screenshots, HAR files or reports.

## J. Release gate checklist

Production is blocked if any condition is true:

- Any Critical finding or High code vulnerability remains open.
- Cross-tenant or field-level authorization fails.
- Vercel PHI isolation or static-only deployment is not evidenced.
- Frontend direct Sheets access or a public/external spreadsheet exists.
- Preview can access production identity, backend, database, reports or PHI.
- PHI appears in URLs, logs, static artifacts, browser persistence or unapproved services.
- Secrets appear in the frontend/repository or long-lived downloadable service-account keys exist.
- Upload/download/report authentication, scanning, tenant scope or audit fails.
- Firestore rules/indexes, audit chain, backups/restore, log restrictions or MFA are not evidenced.
- A required BAA or covered-service validation is missing.
- PostgreSQL reconciliation/rollback evidence is missing or `DATA_STORE` is not `postgres`.

Authoritative execution checklist: `docs/security/production-activation-checklist.md`.
