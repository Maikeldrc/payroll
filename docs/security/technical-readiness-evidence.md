# Technical readiness evidence

Status date: 2026-08-04. This is engineering evidence, not a HIPAA compliance determination.

## Implemented

- Static-only Vite/Vercel frontend with separate backend origin and defensive headers.
- Firebase authentication, backend RBAC, minimum-necessary response shaping, explicit tenant/practice scope, privileged MFA, access expiry, and no public registration.
- Monthly Google Sheets managers for restricted Shared Drive resources, deterministic folder/file naming, Master index validation, exact schema headers, duplicate-resource failure, and permission inspection.
- CSV/XLSX analysis with size/type/shape limits, formula rejection, aliases, dynamic Code1–Code6, selected-period authority, data-quality findings, normalized `Record_Codes`, business duplicate keys, two-step confirmation, idempotency, malware-scanner gate, and logical period locks.
- Monthly KPI calculation from eligible records and valid normalized codes; pending payroll generation; non-PHI Master synchronization; capacity warnings; versioned close/reopen workflow.
- Named Firestore audit/lock database with hash-chained events, deny-all client rules, delete protection, and PITR.
- Immutable Cloud Run image tags and distinct `itera-care-backend` deployment target.

## Verified locally

- TypeScript compile/lint.
- Security and monthly import unit tests.
- Static/frontend build isolation and backend bundle through the release gate.
- Exact/optional/non-sequential code-column cases and Month Of missing/mismatch behavior.

## Release blockers and residual risks

- Shared Drive/folder/Master IDs have not been supplied; live structure and ACL validation cannot run.
- Imports are intentionally disabled because no approved malware scanner is configured.
- The dedicated backend service account has the approved least-privilege Firebase Auth Viewer capability used for revoked/disabled-user checks.
- Secret Manager values and secret-version IAM have not been completed.
- Environment-bound integration, concurrency, recovery, audit-log export, retention, alerting, and operational owner evidence remain pending.
- Google Sheets has transaction/concurrency/cell-limit constraints. The implementation mitigates them with monthly partitioning, logical locks, idempotency, batch states, duplicate checks, versioning, capacity alerts, and close controls, but operational monitoring and recovery drills remain mandatory.
- Payroll rows default to `Pending Review` with zero values until approved payroll configuration/inputs are provided; close is blocked until approval.
- No production data migration has been executed or authorized.

## Trust boundaries

Vercel/static delivery → untrusted browser → Firebase identity → authenticated Cloud Run backend → restricted Shared Drive monthly sheets / aggregate Master sheet. Audit/locks are isolated in the named Firestore database. The malware scanner is a separate required trust boundary when imports are enabled.

Follow `docs/security/production-activation-checklist.md` and `docs/monthly-google-storage.md` before release.
