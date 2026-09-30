# 02. Execution Log

## Local validation sequence

1. Install dependencies and initialize the repo.
2. Run ESLint and TypeScript validation.
3. Run the Vitest unit and component suite.
4. Run security and auth Playwright suites.
5. Run the integration suite and check build output.
6. Verify production env rules for CORS and payment provider mode.

## Evidence expectation

Each step must log pass/fail output with exit code 0 before the release decision is considered green.
