# 01. Test Strategy

## Objective

Verify both the storefront user experience and the security boundaries between customers and administrators before any release commitment.

## Test layers

### 1. Unit validation

- Pure filtering logic and role extraction
- Production env validation without secrets
- Guard functions that prevent unauthorized role changes

### 2. Component validation

- Success-state toast rendering
- Admin route authentication flow and access prompts

### 3. Browser and security validation

- Auth isolation between customer and admin domains
- Role escalation boundary tests
- Production security checks for HTTP headers, CORS, and cookie handling

## Evidence standard

A release candidate is accepted only when the local command output confirms the tests pass without manual overrides or bypasses.
