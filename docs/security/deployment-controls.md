# Security deployment controls

Passing the code gate does not establish HIPAA compliance. Release requires documented organizational approval, an applicable Google Workspace/Cloud BAA, risk analysis, policies, workforce training, incident response, retention, legal review, access reviews, and recovery evidence.

Required technical controls:

- Vercel serves only static `dist/`; no PHI, secrets, functions, rewrites, proxies, or server-side API routes.
- Cloud Run is deployed as the distinct `itera-care-backend` service with a dedicated managed service account.
- Firebase verifies revoked tokens, disabled users, MFA for privileged roles, explicit organization/practice scopes, and access expiry.
- Production uses `DATA_STORE=google-sheets-monthly`; one restricted Shared Drive spreadsheet exists per `YYYY-MM` and Master contains no patient-level PHI.
- The backend, never the browser, owns Drive/Sheets credentials and validates every configured resource and permission boundary.
- Audit and logical locks use the named `itera-audit` Firestore database with deny-by-default client rules, hash chaining, PITR, and restricted service-account access.
- Imports remain disabled until an approved fail-closed HTTPS malware scanner is operational. Analyze and confirm require the same file hash and a short-lived signed token.
- Period locks, exact-duplicate suppression, review states, code normalization, calculation versions, close prerequisites, and append-only close/reopen history are enforced by the backend.
- Log sinks, alerts, Shared Drive audit logs, retention, backups/exports, and restore drills must be evidenced before release.

Never place identifiers, credentials, tokens, PHI, scanner URLs, or Drive/Sheets IDs in `VITE_*`, repository files, browser storage, or client logs.

See `docs/monthly-google-storage.md` for schemas, runtime variables, and the dry-run migration procedure.
