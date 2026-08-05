# Monthly Google Drive and Sheets storage

## Architecture

The browser is a static Vite application on Vercel. It calls the authenticated Cloud Run backend directly. Vercel must not contain functions, API routes, rewrites, proxies, credentials, PHI, or backend secrets.

The backend resolves a selected reporting period through `Monthly_File_Index` in the Master spreadsheet. Each period owns one spreadsheet named `Monthly Data - YYYY-MM`, stored under `Monthly/<YYYY>/<YYYY-MM>/` in the configured restricted Shared Drive. A duplicate period, folder, spreadsheet, or Master index row is a hard failure that requires administrative review.

Monthly tabs:

- `Monthly_Records`
- `Record_Codes`
- `Import_Batches`
- `Data_Quality_Findings`
- `Monthly_KPIs`
- `Payroll_Summary`
- `Monthly_Close`

Master tabs contain only indexes and aggregates: `Monthly_File_Index`, closures, care-manager/provider/service performance, payroll history, and data-quality summary. Patient-level PHI must never be copied into Master.

## Import contract

Users select only Month, Year, and a CSV/XLSX file. `/api/imports/analyze` performs malware scanning, header detection, aliases, validation, period checks, Code1–Code6 extraction, and a non-persistent preview. It returns a signed token valid for 15 minutes. `/api/imports/confirm` requires the same file, selected period, token, and an idempotency key.

The selected `YYYY-MM` is authoritative. Source `Month Of` is classified as `Match`, `Missing`, `Mismatch`, or `Invalid`. Mismatch/invalid rows are rejected from KPI and payroll calculation. Codes are normalized into `Record_Codes`; repeated values remain traceable but require review and are not silently counted as valid additional units.

The business duplicate key is Reporting Period + Practice ID + MRN + normalized Provider ID + normalized Service ID. Exact duplicates are omitted. Conflicts and update candidates require review.

## Backend environment

Required in production:

- `NODE_ENV=production`, `APP_ENV=production`
- `FIREBASE_PROJECT_ID`
- `ALLOWED_ORIGINS` with explicit HTTPS frontend origins
- `DATA_STORE=google-sheets-monthly`
- `AUDIT_FIRESTORE_DATABASE_ID=itera-audit`
- `GOOGLE_SHARED_DRIVE_ID`
- `GOOGLE_ROOT_FOLDER_ID`
- `GOOGLE_MONTHLY_FOLDER_ID`
- `GOOGLE_MASTER_FOLDER_ID`
- `GOOGLE_MASTER_SPREADSHEET_ID`
- `IMPORT_ANALYSIS_TOKEN_SECRET` (minimum 32 characters)
- `IMPORTS_ENABLED=false` until an approved HTTPS malware scanner is configured
- `MALWARE_SCANNER_URL` before setting imports to true

Vercel requires only `VITE_BACKEND_URL`, pointing to the separate HTTPS backend origin. Values prefixed with `VITE_` are public and must never contain secrets.

## Identity and permissions

Cloud Run must execute as `itera-care-backend@itera-tools.iam.gserviceaccount.com`. Share only the required Drive hierarchy with that service account as Editor. The Shared Drive must reject public links, domain-wide sharing outside the approved Workspace, external users, and duplicate resources. Firebase access must use explicit role, one organization, explicit practice scopes, MFA for privileged roles, and an expiry.

The backend service account needs narrowly scoped Firestore access to the named audit database, log writing, read/write access granted through Shared Drive membership, and Secret Manager access only to the named runtime secrets. It still needs an approved least-privilege Firebase Auth role for revoked/disabled-user checks; deployment is blocked until that grant is approved.

## Close and reopen

Recalculation takes a logical period lock, rewrites period KPIs, creates pending payroll rows when needed, and synchronizes non-PHI aggregates. Close is blocked while critical findings are open or any payroll row is missing approval. Closing records an immutable close version and changes both the Master index and Firestore lock to `Closed`. Reopening requires configuration-management permission and a reason of at least ten characters; it creates a new audit/close entry instead of erasing history.

## Capacity and recovery

`GET /api/storage/google/capacity` reports spreadsheet cell allocation and warns at the configured threshold (default 80% of Google Sheets' 10 million-cell limit). Use Shared Drive retention/version history, named Firestore PITR, scheduled exports, and documented restore drills. Never restore over production without validating the exact target period and retaining an export of the current state.

## Migration runbook (dry-run by default)

1. Export and hash the legacy source without changing it.
2. Inventory rows by authoritative period, schema, tenant, business key, and code shape.
3. Generate a reconciliation report: source counts, rejected rows, exact duplicates, conflicts, billing totals, unique patients, and code units.
4. Initialize empty monthly targets and validate permissions/headers.
5. Run the importer against synthetic or approved non-production copies.
6. Obtain written owner approval for the exact periods and hashes.
7. Import one period at a time, reconcile again, calculate, and record evidence.
8. Keep legacy data read-only through the approved rollback window.

This repository does not authorize or automatically execute production migration.
