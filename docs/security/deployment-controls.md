# Required production controls

Production deployment is blocked until the following evidence is attached to the release record.

- Vercel deploy contains only `dist/index.html` and fingerprinted assets. Requests to `/api/*`, `/server.cjs` and source maps return 404.
- Backend runs from `Dockerfile.backend` on an approved service with authenticated deployment access, TLS and restricted log access.
- `ALLOWED_ORIGINS` contains only the approved production frontend; preview domains are excluded.
- Firebase privileged roles require MFA, custom claims are assigned only by the provisioning workflow, and client Firestore access is denied.
- Google credentials use workload identity/application-default credentials; no JSON key is downloaded or stored in CI.
- Production, staging and development use different Firebase projects and database resources.
- Production uses PostgreSQL exclusively. `DATA_STORE=sheets` is limited to controlled development or migration staging.
- The PostgreSQL runtime role cannot own tables or bypass RLS; Cloud SQL encryption at rest, verified TLS, backups and point-in-time recovery are enabled.
- Google Workspace evidence covers owners, Shared Drive, ACLs, external sharing, publication, add-ons, DLP, audit, Vault, retention and offboarding.
- Malware scanner is configured and fails closed.
- Firestore audit rules/indexes are deployed and audit-chain verification is retained with the release evidence.
- Applicable BAAs and covered-service configurations are approved by legal/compliance.

Google Sheets is a transitional adapter only. The target PostgreSQL schema is defined in `migrations/001_postgresql_target_schema.sql`; production migration requires reconciliation, parallel run, cutover and rollback approval.
