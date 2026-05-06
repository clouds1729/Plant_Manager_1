# Phase 6 Review (Supplier Portal Foundation)

## Delivered in this foundation step
- Added protected `/supplier-portal` route with a minimal supplier-facing, read-only dashboard.
- Added `supplier_users` mapping table (`organization_id`, `supplier_id`, `user_id`) for explicit manual user-to-supplier linking.
- Added supplier mapping/self-read policy and helper function `current_supplier_id(org_id)` for DB-side scoping.
- Updated read policies so `supplier_viewer` users only read supplier-scoped records for:
  - `suppliers`
  - `plants`
  - `plant_rates`
  - `ipc_periods`
  - `ipc_lines` (via `ipc_periods` join)
- Internal owner/admin/finance workflows remain unchanged for write paths.

## Explicitly deferred
- Reports and PDF exports.
- Billing/subscriptions.
- Broad UI polish and onboarding/invite polish.

## Operational note
- Supplier-user mapping is manual in this phase (no automated invite/onboarding flow yet).
