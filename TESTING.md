# Kixora Automated QA Framework Documentation

## 1. Overview & Test Architecture

The Kixora automated test suite is built on **Playwright** and **TypeScript**, targeting the full-stack React/Vite application. The framework is structured to ensure fast, deterministic, and fully isolated test runs.

### Directory Structure

```
├── tests/
│   ├── fixtures/
│   │   └── test-fixtures.ts          # State reset fixtures & isolated browser contexts
│   ├── customer/
│   │   └── customer-smoke.spec.ts    # End-to-end customer storefront smoke tests
│   ├── admin/
│   │   └── admin-smoke.spec.ts       # Executive Hub and catalog management smoke tests
│   └── regression/
│       └── regression-matrix.spec.ts # Manual test ID traceability suite
├── playwright.config.ts              # Playwright configuration (ports, reporters, timeouts)
├── playwright-report/                # HTML and JSON test execution reports
└── TESTING.md                        # Framework and execution guidelines
```

---

## 2. Test Execution Commands

### Running Tests

| Command | Description |
| :--- | :--- |
| `npm test` or `npx playwright test` | Executes the entire automated test suite headlessly |
| `npm run test:headed` | Runs all tests with visible browser windows |
| `npx playwright test tests/customer/` | Runs customer smoke tests exclusively |
| `npx playwright test tests/admin/` | Runs admin smoke tests exclusively |
| `npx playwright test -g "CS-06"` | Runs a specific test by title or test ID |
| `npx playwright test --debug` | Launches the interactive Playwright Inspector for step-by-step debugging |
| `npm run test:report` | Serves the HTML test report in the browser |

---

## 3. Test Fixtures & Deterministic State Management

Every test runs in an isolated context using custom fixtures defined in `tests/fixtures/test-fixtures.ts`:

- **Automatic `localStorage` Reset**: Clears `localStorage` keys (`kixora_sneakers_v2`, `kixora_cart_v2`, `kixora_orders_v2`, `kixora_promos_v2`, `kixora_wishlist_v2`) before every test run, guaranteeing that tests are completely independent and order-agnostic.
- **`customerPage` Fixture**: Mounts the app at `/` and verifies header readiness.
- **`adminPage` Fixture**: Pre-navigates directly to the Kixora Executive Hub.

---

## 4. Manual → Automated Traceability Matrix

| Manual Test ID | Category | Description | Automated Test Specification | Status |
| :--- | :--- | :--- | :--- | :--- |
| **C-01** | Navigation | Logo click navigates back to storefront | `REG-C01` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **C-03** | Navigation | Hype Drops link switches to drops view | `CS-02` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-04** | Navigation | 3D Lab navigation opens customizer | `CS-02` & `CS-07` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-07** | Search | Header search query filters catalog | `CS-03` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-10** | Showcase | Hero renders 4 perspective showcase cards | `CS-01` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-14** | Filter | Brand chips in hero jump to filtered catalog | `CS-03` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-15** | Filter | Catalog brand filter isolates manufacturer | `REG-C15` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **C-20** | Filter | In-stock toggle hides zero-inventory shoes | `REG-C20` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **C-23** | Product | Product modal opens with inspection views | `CS-04` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-24** | Wishlist | Floating heart saves to wishlist modal | `REG-C24` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **C-26** | Sizing | Size pill selection highlights stock | `CS-04` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-27** | Cart | Add to cart opens drawer with item | `REG-C27` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **C-28** | Cart | Quantity increment, decrement & removal | `CS-05` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-29** | Promo | Valid promo code calculates discount | `CS-05` & `REG-C29-30` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **C-30** | Promo | Invalid or high-threshold promo rejected | `REG-C29-30` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **C-31** | Checkout | Multi-step checkout transitions | `REG-C31-32` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **C-32** | Checkout | Order submission creates tracking ID | `CS-06` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-33** | Tracking | Order tracking verification & status lookup | `CS-06` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-34** | Drops | Raffle alert subscription toggle | `CS-08` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **C-35** | 3D Lab | Custom color palette & bespoke cart add | `CS-07` (`tests/customer/customer-smoke.spec.ts`) | **AUTOMATED** |
| **A-01** | Admin | Executive Hub metric overview loads | `AS-01` (`tests/admin/admin-smoke.spec.ts`) | **AUTOMATED** |
| **A-04** | Admin | Create new deadstock sneaker in catalog | `AS-02` & `REG-A04-07` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **A-07** | Admin | Delete sneaker from catalog | `AS-02` & `REG-A04-07` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **A-08** | Admin | Filter orders by status | `AS-03` (`tests/admin/admin-smoke.spec.ts`) | **AUTOMATED** |
| **A-09** | Admin | Update order status in dropdown | `AS-03` (`tests/admin/admin-smoke.spec.ts`) | **AUTOMATED** |
| **A-12** | Admin | Increment/decrement size stock level | `AS-04` & `REG-A12` (`tests/regression/regression-matrix.spec.ts`) | **AUTOMATED** |
| **A-14** | Admin | Create new promo discount code | `AS-05` (`tests/admin/admin-smoke.spec.ts`) | **AUTOMATED** |
| **A-15** | Admin | Toggle promo code active/inactive | `AS-05` (`tests/admin/admin-smoke.spec.ts`) | **AUTOMATED** |
| **A-16** | Admin | Analytics breakdown view | `AS-06` (`tests/admin/admin-smoke.spec.ts`) | **AUTOMATED** |
| **A-17** | Admin | Return to customer storefront | `AS-06` (`tests/admin/admin-smoke.spec.ts`) | **AUTOMATED** |

---

## 5. Scope & Simulated Feature Boundaries

- **Simulated Payment Gateway**: Checkout Step 2 processes a client-side simulated authorization without querying live banking APIs.
- **Simulated Order Courier Webhooks**: Real-time dispatch and authentication milestones in the order tracking tracker reflect state machine transitions.
