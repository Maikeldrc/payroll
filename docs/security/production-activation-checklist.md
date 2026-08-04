# Production activation evidence

The deployment workflows intentionally require protected GitHub environments and workload identity. They must not be bypassed with local long-lived credentials.

## Google/Firebase backend

1. Create the dedicated runtime service account `itera-care-backend` without downloadable keys.
2. Grant only Firestore data access, Cloud SQL client access, log writing, access to `itera-database-url` and `itera-malware-scanner-url`, and Artifact Registry read access.
3. Keep the migration identity separate from the runtime identity. The runtime identity must not own tables or have `BYPASSRLS`.
4. Configure the approved HTTPS malware scanner in `itera-malware-scanner-url`.
5. Deploy `firestore.rules` and `firestore.indexes.json`.
6. Require MFA in Identity Platform/Firebase and provision custom claims through `npm run access:provision`.
   Every assignment requires `--expires-at` (maximum 90 days). Activate or deactivate accounts with `npm run access:set-status`; both operations revoke existing sessions and create an audit event.
7. Protect the production GitHub environment with independent approval.
8. Run the backend workflow and retain Cloud Build provenance, image digest and release-gate output.
9. Map `api.itera.health` to the Cloud Run service and verify TLS.
10. Run `npm run audit:verify-chain -- --organization <explicit-id>` and retain the count and terminal chain hash as release evidence.

## Vercel frontend

1. Create a Vite project whose output is `dist`.
2. Do not configure functions, middleware, analytics, logs containing bodies, rewrites to the backend, storage products or production secrets.
3. Set only public frontend configuration. The default backend origin is `https://api.itera.health`.
4. Protect the production environment and configure the three Vercel deployment credentials in GitHub.
5. Run the frontend workflow. Its function-directory assertion must pass.
6. Verify `/api/*`, `/server.cjs`, `/server.cjs.map` and source maps return 404.
7. Capture a browser network trace proving all PHI API requests go directly to `api.itera.health`.

## Workspace evidence

Attach ACL exports, publication settings, external sharing review, add-on/Apps Script inventory, Drive audit logs, DLP/Vault policies, retention, backups, offboarding evidence and applicable BAAs to the release record.
## Data cutover

- Apply `migrations/001_postgresql_target_schema.sql` with a migration owner; the runtime identity must not own or bypass RLS.
- Store `DATABASE_URL` and `DATABASE_MIGRATION_URL` in Secret Manager, require verified TLS, and never expose either value to Vercel.
- Migrate one explicit organization/practice cohort at a time; retain the source as read-only during validation.
- Run `npm run migration:reconcile`. It emits counts and SHA-256 aggregate fingerprints only; a mismatch exits with code 2.
- Do not set `DATA_STORE=postgres` for a cohort until counts and fingerprints match and rollback has been exercised.
