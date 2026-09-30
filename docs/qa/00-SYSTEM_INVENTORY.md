# 00. System Inventory

## Application scope

- Storefront UI: React + TypeScript + Vite
- Admin surface: separate route/domain with role-based gating
- Backend: Express server with middleware for CORS, CSRF, rate limiting, and health endpoints
- Data layer: Supabase-backed catalog and auth integration
- Payments: PayFast-first production contract with explicit origin enforcement
- Observability: health endpoints, logs, and Playwright evidence collection

## Key components

- `src/App.tsx`: storefront and admin route entry points
- `src/context/StoreContext.tsx`: catalog state, filters, cart, wishlist, toasts
- `src/config/env.ts`: production environment validation and payment config checks
- `server.ts`: server startup, middleware, and readiness endpoints
- `src/routes/AdminRoute.tsx`: admin authentication gate
- `src/utils/roleUtils.ts`: role extraction and unauthorized escalation checks

## Known release constraints

- Wildcard or empty CORS values are invalid in production.
- Mock payment mode is prohibited in production.
- Admin access should not be granted from customer-authenticated accounts.
- Shipping webhook validation is conditional and only required when shipping is enabled.
