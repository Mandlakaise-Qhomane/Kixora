# 03. Release Gates

## Gate 1 — Baseline quality

- Dependencies install cleanly
- Lint passes with zero warnings
- Type-check passes
- Build completes successfully

## Gate 2 — Security controls

- No wildcard CORS in production origins
- Explicit admin/customer origins are included in the allowlist
- Customer role cannot access admin-only routes
- Payment provider mode is compatible with deployment environment

## Gate 3 — Functional validation

- Catalog filters work for brand, size, price, and search
- Admin auth form renders and submits correctly
- Toast and alert states present expected messaging

## Gate 4 — Live deployment proof

The final sign-off is never based only on local checks. A real staging environment must validate domain routing, auth flows, and payment configuration before a production launch is considered safe.
