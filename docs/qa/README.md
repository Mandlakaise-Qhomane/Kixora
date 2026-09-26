# QA and STLC Documentation

This folder contains the release-quality evidence and test strategy used to validate the storefront and admin boundaries before a deployment decision.

## Included documents

- [00-SYSTEM_INVENTORY.md](./00-SYSTEM_INVENTORY.md)
- [01-TEST_STRATEGY.md](./01-TEST_STRATEGY.md)
- [02-EXECUTION_LOG.md](./02-EXECUTION_LOG.md)
- [03-RELEASE_GATES.md](./03-RELEASE_GATES.md)

## Minimum evidence before launch

1. Unit and component tests pass in CI.
2. Security and admin boundary suites pass.
3. Payment provider matches the production contract.
4. Live staging validation confirms the configured origins, PayFast credentials, and admin protections.
