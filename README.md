# ITERA Care Management Analytics & Payroll Hub

Security-oriented split deployment:

- `dist/` is the static-only frontend intended for Vercel. It contains no backend runtime.
- `server.ts` and `backend/` are the authenticated PHI backend and must run on the approved backend service.
- The browser calls `VITE_BACKEND_URL` directly. Vercel must never proxy `/api` traffic.
- Production data is partitioned into one Google Spreadsheet per reporting period (`YYYY-MM`) inside a restricted Shared Drive. A Master spreadsheet stores only aggregate/index data and never patient-level PHI.
- The backend uses its managed Cloud Run service account with Application Default Credentials. JSON keys and domain-wide delegation are prohibited.

## Local development

Use Node.js 22.

```text
npm install
npm run dev:frontend
npm run dev:backend
```

Copy `.env.example` to an ignored local environment file and provide environment-specific values. Never put secrets in `VITE_*` variables.

Authentication requires Firebase users provisioned with trusted custom claims. Public self-registration is not supported. Tokens and PHI are memory-only and a browser refresh requires re-authentication.

## Builds

```text
npm run build
npm run build:backend
```

Frontend and backend outputs are deliberately separated into `dist/` and `backend-dist/`.

## Security release gate

```text
npm run release:gate
```

The gate performs TypeScript checking, source-policy scanning, backend security tests, static build isolation checks, backend build and dependency auditing for High/Critical advisories.

Passing the code gate does not establish HIPAA compliance. Production also requires the operational, contractual and policy evidence listed in `docs/security/deployment-controls.md`.

The monthly storage model, required environment variables and operational procedures are documented in `docs/monthly-google-storage.md`. No production migration is performed by the application automatically.

## Production endpoints

- Frontend: `https://itera-payroll.vercel.app`
- Backend: `https://itera-care-backend-hgrqaimkpa-uc.a.run.app`
- Imports remain disabled until an approved fail-closed malware scanner is configured.

The consolidated technical evidence and residual release blockers are recorded in `docs/security/technical-readiness-evidence.md`.
