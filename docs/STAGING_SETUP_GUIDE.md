# Staging Supabase Setup for Admin E2E Tests

Admin browser tests use the local mock-auth path during development. CI skips admin browser tests by default because a local mock session does not verify real Supabase authentication. To run them against Supabase, use a dedicated staging project, never production.

## Staging Project

1. Create a Supabase project dedicated to staging and apply the repository migrations.
2. Create a test administrator account in Supabase Auth.
3. Grant that user the `admin` role through the trusted `app_metadata` role-management path used by the application. Do not grant admin access through `user_metadata` or client-side local storage.
4. Seed the staging project with the catalog, inventory, orders, and promo data required by admin smoke tests. Those tests create and modify records.

## Local Run

Export the staging configuration in the shell before starting Playwright:

```sh
export PLAYWRIGHT_USE_STAGING_SUPABASE=true
export PLAYWRIGHT_SUPABASE_URL=https://your-staging-project.supabase.co
export PLAYWRIGHT_SUPABASE_ANON_KEY=your-staging-anon-key
export PLAYWRIGHT_ADMIN_EMAIL=admin-test@example.com
export PLAYWRIGHT_ADMIN_PASSWORD='your-staging-admin-password'
npx playwright test tests/admin tests/auth/phase4-auth-isolation.spec.ts
```

The Playwright server fails at startup if staging mode is enabled but any required variable is missing. With staging mode disabled, local runs use mock auth. In CI, admin browser tests are skipped unless staging auth is explicitly enabled.

## GitHub Actions

Set the repository variable `PLAYWRIGHT_USE_STAGING_SUPABASE` to `true` to opt in. Add secrets `PLAYWRIGHT_SUPABASE_URL`, `PLAYWRIGHT_SUPABASE_ANON_KEY`, `PLAYWRIGHT_ADMIN_EMAIL`, and `PLAYWRIGHT_ADMIN_PASSWORD`. The variable defaults to `false`, so the standard CI run needs no staging credentials.

Use an isolated staging project and test account with only staging data. Never add credential values to tracked files or use production credentials.