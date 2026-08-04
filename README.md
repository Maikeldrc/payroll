# ITERA Care Management Analytics & Payroll Hub

Security-oriented split deployment:

- `dist/` is the static-only frontend intended for Vercel. It contains no backend runtime.
- `server.ts` and `backend/` are the authenticated PHI backend and must run on the approved backend service.
- The browser calls `VITE_BACKEND_URL` directly. Vercel must never proxy `/api` traffic.
- Production requires PostgreSQL with row-level security. Google Sheets is a transitional development/migration adapter only, using application-default/workload identity credentials and an explicit spreadsheet allowlist.

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

The consolidated technical evidence and residual release blockers are recorded in `docs/security/technical-readiness-evidence.md`.
