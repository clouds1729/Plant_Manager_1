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

## Supplier portal data presentation update
- Replaced raw JSON dumps in `/supplier-portal` with structured read-only UI sections:
  - Supplier profile card
  - Plants table
  - Plant rates table
  - IPC periods table
  - IPC line items table
- Added basic display formatting for currency, dates, and hours plus explicit empty states per data section.
- Kept portal data retrieval and access model unchanged (same supplier mapping flow and supplier-scoped reads; no mutation flows added).
- Follow-up fix: removed obsolete raw-JSON render path so `/supplier-portal` has a single structured return path only.
