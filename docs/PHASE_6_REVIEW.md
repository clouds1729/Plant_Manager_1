# Phase 6 Review (Supplier Portal + Reports/Export Foundation)

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
- Added protected internal-only `/reports` route for IPC summary + line-item review and initial export.
- Added role-aware report/export gating so CSV export controls are visible only to `owner/admin/finance`.
- Added lightweight CSV export foundation for IPC lines with a totals row (no PDF library added).
- Added protected `/reports/print` internal print view that reuses IPC period + IPC line report data and supports browser print-to-PDF via `window.print()`.

## Explicitly deferred
- Full branded/server-side PDF generation and advanced report templates (current PDF path is browser print-to-PDF from /reports/print).
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
