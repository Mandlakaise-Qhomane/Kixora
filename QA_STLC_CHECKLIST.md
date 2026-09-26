# QA / STLC Checklist

## Goal

Provide a deployable, evidence-driven checklist for storefront stabilization and release sign-off.

## Required gates

- [ ] Repo branch is created from the correct long-lived base.
- [ ] No secrets or production credentials are committed to source control.
- [ ] Local install, lint, type checks, and build are green.
- [ ] Unit and component tests pass via Vitest.
- [ ] Security and boundary tests pass via Playwright.
- [ ] Production env validation accepts the chosen payment provider contract.
- [ ] Explicit CORS origins are configured and verified before production use.
- [ ] Admin access remains isolated behind staff-only credentials.
- [ ] PayFast is the active production payment mode unless owner approval changes it.
- [ ] Staging validation confirms live admin/customer domain behavior and order flow.

## Sign-off recommendation

The project is ready for staging rollout only when evidence exists for each gate above. Production launch without live deployment proof remains a no-go.
