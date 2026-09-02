# Kixora Production Deployment, Webhook Security & Launch Runbook

## Phase 10: Production Readiness & Architecture Specification

---

## 1. Production Configuration & Secrets Checklist

| Variable Name | Context | Purpose | Mandatory in Prod |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Server | Set to `production` for security middleware & CSP | YES |
| `VITE_SUPABASE_URL` | Client & Server | Supabase project API gateway URL | YES |
| `VITE_SUPABASE_ANON_KEY` | Client & Server | Public read/write client key (enforced by RLS) | YES |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Internal server maintenance & migration runner | YES |
| `STRIPE_SECRET_KEY` | Server Only | Stripe API secret key for payment intent processing | YES |
| `STRIPE_WEBHOOK_SECRET` | Server Only | HMAC secret for verifying incoming Stripe webhooks | YES |
| `PAYFAST_MERCHANT_ID` | Client & Server | PayFast merchant account identifier | YES |
| `PAYFAST_MERCHANT_KEY` | Client & Server | PayFast merchant encryption key | YES |
| `PAYFAST_PASSPHRASE` | Server Only | Salt passphrase for MD5 ITN signature verification | YES |
| `THE_COURIER_GUY_API_KEY` | Server Only | The Courier Guy REST API credentials | YES |
| `SHIPPING_WEBHOOK_SECRET` | Server Only | HMAC-SHA256 secret for carrier webhook signatures | YES |
| `RESEND_API_KEY` | Server Only | Transactional email delivery service API key | YES |
| `CORS_ORIGIN` | Server Only | Production origin domain (`https://kixora.com`) | YES |

### Environment & Secrets Hygiene Rules
1. **Zero Client Secrets**: No server secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYFAST_PASSPHRASE`, `SHIPPING_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are bundled into client-facing artifacts or prefixed with `VITE_`.
2. **Server-Side Proxy**: All external mutations, payment initialization, carrier communication, and transactional emails execute strictly through `/api/*` routes.

---

## 2. CDN & Caching Rules Specification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Cloudflare CDN / Edge                           │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
                        ▼                             ▼
       ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
       │     Static Assets (Vite /dist)  │   │      Dynamic APIs (/api/*)      │
       │ Cache-Control: public,          │   │ Cache-Control: no-store,        │
       │ max-age=31536000, immutable     │   │ no-cache, must-revalidate,      │
       │                                 │   │ proxy-revalidate                │
       └─────────────────────────────────┘   └─────────────────────────────────┘
```

### Route-Level Cache Policies

1. **Static Assets (`/assets/*`, `.js`, `.css`, `.woff2`, `.png`, `.jpg`, `.webp`)**:
   - `Cache-Control: public, max-age=31536000, immutable`
   - Content-hashed filenames guarantee instant cache invalidation upon redeployment.
   - Cloudflare Edge Cache TTL: 1 year (`31536000`).

2. **Application Entrypoint (`index.html`)**:
   - `Cache-Control: public, max-age=0, must-revalidate`
   - Ensures users always fetch the freshest bundle manifest while allowing HTTP 304 Not Modified.

3. **Dynamic API & Webhook Ingress (`/api/*`, `/api/webhooks/*`)**:
   - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`
   - `Pragma: no-cache`
   - `Surrogate-Control: no-store`
   - Bypasses Cloudflare cache entirely (`Cache Level: Bypass`).

4. **Crawler Interceptor & SEO Drops (`/product/:id`)**:
   - `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`
   - Allows edge caching of rendered OpenGraph metadata with fast background revalidation.

---

## 3. Webhook Security Architecture

### Strict Security Controls Matrix

| Webhook Route | Provider | Signature Verification Method | Payload Parsing | Tolerance Window | Idempotency Key |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/webhooks/stripe` | Stripe | HMAC-SHA256 (`Stripe-Signature: t=...,v1=...`) | Raw Buffer (`express.raw`) | 300 seconds (5 min) | `evt_id` |
| `/api/webhooks/payfast`| PayFast | MD5 Hash (`data + passphrase`) | URL-encoded Raw Body | N/A (ITN sequence check) | `pf_payment_id` / `m_payment_id` |
| `/api/webhooks/tracking`| Carrier (TCG/Logic) | HMAC-SHA256 (`x-kixora-signature`, `t=...,v1=...`) | Raw Buffer (`express.raw`) | 300 seconds (5 min) | `eventId` |

### Core Security Guarantees:
1. **Raw Body Integrity**: Signatures are evaluated directly against unmodified request byte buffers prior to JSON deserialization.
2. **Replay Protection**: Webhook headers containing timestamps are verified against the system clock (`Math.abs(now - timestamp) <= 300s`). Stale requests are rejected with HTTP 401.
3. **Idempotency Deduplication**: Every event ID is recorded in the `webhook_events` database registry. Duplicate deliveries return HTTP 200 `{ idempotent: true }` without re-executing business logic or email pipelines.
4. **Sanitized Error Responses**: Verification failures return HTTP 400/401/403 with generic error descriptors, preventing information leakage.

---

## 4. DNS & Domain Cutover Runbook

### Pre-Cutover Verification (T-48 Hours)
- [x] Configure production Cloudflare zone for `kixora.com`.
- [x] Set DNS TTL to `300` seconds (5 minutes) across existing DNS records to allow rapid propagation.
- [x] Verify SSL/TLS mode is set to **Full (Strict)** on Cloudflare.
- [x] Ensure origin server presents valid Let's Encrypt / Google Trust Services TLS certificate.

### DNS Records Table

| Type | Host | Target / Value | Proxy Status | TTL |
| :--- | :--- | :--- | :--- | :--- |
| `A` | `@` (apex) | `199.36.158.100` (Cloud Run / Load Balancer) | Proxied (Orange Cloud) | Auto |
| `CNAME` | `www` | `kixora.com` | Proxied (Orange Cloud) | Auto |
| `CNAME` | `api` | `kixora.com` | Proxied (Orange Cloud) | Auto |
| `TXT` | `@` | `v=spf1 include:_spf.resend.com ~all` | DNS Only | 300 |
| `CNAME` | `resend._domainkey` | `resend._domainkey.resend.com` | DNS Only | 300 |
| `TXT` | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@kixora.com` | DNS Only | 300 |

### Cutover Execution Sequence (T-0 Hours)
1. **Maintenance Lock**: Enable maintenance banner if DB migrations require schema locking (not required for non-breaking 0024 migration).
2. **Apply Database Migrations**: Execute `supabase/migrations/0024_carrier_tracking_metadata.sql`.
3. **Deploy Production Container**: Deploy built container to production Cloud Run instance.
4. **Switch DNS Records**: Update Apex and CNAME records in registrar to point to Cloudflare/Origin gateway.
5. **Verify Edge Routing**: Test DNS resolution across global resolvers (`8.8.8.8`, `1.1.1.1`).
6. **TLS Certificate Validation**: Confirm SSL handshake succeeds at `https://kixora.com` and `https://www.kixora.com`.

---

## 5. Post-Launch Smoke Tests & Verification Plan

### Automated Smoke Test Checklist
- **GET `/api/health`**: Returns HTTP 200 `{ status: 'ok', domain: 'kixora-production' }`.
- **GET `/`**: Returns HTTP 200 with HTML title `Kixora | Authenticated Sneaker Vault`.
- **POST `/api/shipping/rates`**: Computes accurate multi-carrier quotes for domestic South African addresses.
- **POST `/api/shipping/labels`**: Generates waybill PDF link, barcode URI, and tracking number.
- **POST `/api/webhooks/tracking`**: Rejects missing/tampered signatures (HTTP 401); accepts valid HMAC signatures (HTTP 200).
- **POST `/api/webhooks/stripe`**: Rejects missing/tampered signatures (HTTP 400); accepts valid signatures.
- **POST `/api/webhooks/payfast`**: Rejects invalid MD5 checksums (HTTP 400); processes valid ITNs.

### Monitoring & Observability
- **Error Tracking**: Monitor structured logs (`logger.error`) for unhandled exceptions or elevated 5xx rates.
- **Webhook Telemetry**: Track `webhook_events` table for processing latency and duplicate event counts.
- **Uptime Monitoring**: Configure synthetic probes hitting `/api/health` at 60-second intervals from multiple geographical regions.

---

## 6. Rollback Runbook

If a critical incident occurs during cutover (e.g. fatal edge routing, database lock, gateway failure):

1. **DNS Fallback**: Switch Cloudflare DNS target back to previous stable container IP (propagation in < 300s due to low TTL).
2. **Container Rollback**: Revert Cloud Run service traffic to previous stable revision tag via CLI/Console.
3. **Database Reversion**: Run backward migration if schema modifications broke compatibility.
4. **Incident Audit**: Review server logs for root cause analysis prior to re-attempting deployment.
