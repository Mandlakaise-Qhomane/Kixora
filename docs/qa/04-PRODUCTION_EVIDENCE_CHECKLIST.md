# 04. Production Evidence Checklist

This checklist turns the production readiness audit into explicit evidence that
must be gathered before launch approval. Repository checks can satisfy only part
of each item. Live infrastructure, Supabase, and payment-provider evidence must
still be collected in staging or production-like environments.

## Critical items

### A. Production configuration

- [ ] `CUSTOMER_ORIGIN` is an HTTPS origin with no path, query, or hash
- [ ] `ADMIN_ORIGIN` is an HTTPS origin with no path, query, or hash
- [ ] `ADMIN_ORIGIN` and `CUSTOMER_ORIGIN` are distinct
- [ ] `CORS_ALLOWED_ORIGINS` contains only explicit origins
- [ ] `CORS_ALLOWED_ORIGINS` includes both declared origins
- [ ] `VITE_PAYMENT_PROVIDER_MODE=payfast` in staging and production
- [ ] `PAYFAST_PASSPHRASE` is present server-side only
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is present server-side only

Repository evidence:
- `src/config/env.ts` rejects invalid production configuration
- `server.ts` refuses startup when the production environment contract fails

Live evidence required:
- deployment environment screenshots or exported secret inventory
- browser devtools proof that secrets are not exposed to the client bundle

### B. Live Supabase policy proof

- [ ] staging project uses the intended migrations
- [ ] anonymous users cannot create sensitive records
- [ ] customers cannot read or write admin-owned records
- [ ] storage access matches bucket policy
- [ ] service-role credentials are not exposed to browsers

Repository evidence:
- migrations in `supabase/migrations`
- local RLS-oriented tests in `tests/security`

Live evidence required:
- authenticated staging test results against the real Supabase project
- screenshots or exported query logs proving denied access cases

### C. Real payment verification

- [ ] PayFast sandbox checkout initializes correctly
- [ ] ITN signatures are verified with the configured passphrase
- [ ] duplicate webhook deliveries do not double-process an order
- [ ] amount and currency mismatches are rejected
- [ ] failure and cancellation states release reservations
- [ ] refund workflow is validated through the real operator process

Repository evidence:
- `src/services/payments/payfastDriver.ts`
- `src/services/webhookService.ts`
- `src/services/payments/webhookIdempotency.ts`
- payment tests in `tests/customer` and `tests/integrations`

Live evidence required:
- sandbox transaction IDs
- webhook delivery logs
- reconciled order records in staging

## High-priority items

### D. Inventory concurrency

- [ ] one-unit inventory cannot be double-sold
- [ ] failed or cancelled payments release reservations
- [ ] webhook retries do not duplicate fulfillment

Repository evidence:
- atomic RPC usage in `src/services/webhookService.ts`
- concurrency-oriented tests in `tests/commerce`

Live evidence required:
- concurrent staging purchase attempt with exactly one success
- database row history proving no negative or duplicate stock transitions

### E. Admin/customer isolation

- [ ] customer sessions cannot reach admin-only surfaces
- [ ] admin-only data remains protected server-side
- [ ] trusted app metadata remains the only role authority

Repository evidence:
- `src/utils/roleUtils.ts`
- `src/routes/AdminRoute.tsx`
- `tests/auth/phase4-auth-isolation.spec.ts`

Live evidence required:
- staging auth session proof for both customer and admin identities
- negative tests against sensitive admin data paths

### F. Deployment and rollback

- [ ] staging deployment exists and is reachable on final hostnames
- [ ] `/api/health` and `/api/ready` are green in staging
- [ ] DNS, HTTPS, and static asset routing are verified
- [ ] rollback steps are rehearsed and signed off

Repository evidence:
- `server.ts` exposes health and readiness endpoints
- `src/config/httpCache.ts` and `server.ts` enforce documented cache headers
- `PRODUCTION_LAUNCH.md` documents cutover and rollback steps

Live evidence required:
- staging deployment URL
- rollback dry-run notes
- DNS or CDN console screenshots

## Medium-priority items

### G. Observability and privacy

- [ ] structured production logs are collected centrally
- [ ] payment and webhook failures are visible in monitoring
- [ ] PII remains sanitized in operational logs

Repository evidence:
- `logger.ts`
- `src/services/monitoringService.ts`
- structured webhook monitoring in `src/services/webhookService.ts`
- sanitization tests in `tests/observability`

Live evidence required:
- monitoring dashboard screenshots
- alert policy configuration for auth, webhook, and order failures

### H. SEO, accessibility, and performance

- [ ] critical customer routes have correct metadata in the deployed build
- [ ] accessibility checks pass on storefront and admin flows
- [ ] bundle delivery and Core Web Vitals are reviewed in staging

Repository evidence:
- `src/components/SEO.tsx`
- Playwright coverage in `tests/observability`

Live evidence required:
- Lighthouse or equivalent staging captures
- manual accessibility review notes for critical flows
