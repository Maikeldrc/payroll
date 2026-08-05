# Production activation checklist

## Identity and platform

- [ ] Confirm Google Cloud/Workspace BAA and approved project/Shared Drive ownership.
- [ ] Grant the backend service account only: named Firestore database access, logging, required secret versions, and restricted Shared Drive membership.
- [ ] Approve the least-privilege Firebase Auth permission needed for revoked/disabled-user verification.
- [ ] Enforce MFA, explicit tenant/practice scopes, access expiry, joiner/mover/leaver procedures, and quarterly access reviews.
- [ ] Prohibit JSON service-account keys and domain-wide delegation.

## Storage

- [ ] Create restricted Root, Monthly, Master folders and exactly one Master spreadsheet.
- [ ] Create the five resource-ID secrets and the import-token secret without exposing values in logs or Vercel.
- [ ] Run `/api/storage/google/validate`; resolve every permission or duplicate-resource violation.
- [ ] Confirm Master tabs contain no patient-level PHI and Shared Drive external/public/domain-link sharing is disabled.
- [ ] Configure Drive audit logs, Vault/retention, exports, and a tested restore procedure.

## Application

- [ ] Deploy `itera-care-backend`; do not overwrite unrelated Cloud Run services.
- [ ] Configure explicit backend CORS for the final Vercel domain and update Vercel `VITE_BACKEND_URL`.
- [ ] Temporary exception: if `IMPORTS_ENABLED=true` and `ALLOW_UNSCANNED_IMPORTS=true`, record formal risk acceptance and remove the bypass when an approved HTTPS malware scanner passes fail-closed tests.
- [ ] Run `npm run release:gate` and environment-bound synthetic tests for auth, cross-tenant denial, upload edge cases, idempotency, locks, calculations, close/reopen, reports, and audit continuity.
- [ ] Validate static frontend artifacts contain no secrets, IDs, PHI, backend code, or source maps.

## Go-live governance

- [ ] Security, Privacy, Compliance, Payroll, Clinical, and Operations owners approve release evidence and residual risks.
- [ ] Incident-response contacts, breach workflow, monitoring alerts, and rollback decision authority are documented.
- [ ] Any legacy migration has separate written approval for the exact periods and source hashes. No production migration is implicit in deployment.
