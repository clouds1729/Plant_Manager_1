# Phase 4 Review

## Delivered
- Added `/scan-imports` UI route for uploading scan files and staging extracted rows.
- Added server-only extraction endpoint at `/api/scan-import`.
- Added scan extraction helpers in `lib/imports/scan.ts` with explicit not-configured behavior.
- Reused existing import normalization/matching/conflict/staging flow.
- Added `import_rows.extraction_confidence` and `import_rows.requires_review` metadata.
- Updated `commit_import_rows` RPC to:
  - honor `imports.source_type` (`excel` or `scan`) when writing `plant_logs.source`.
  - block commit when `requires_review=true`.

## Deferred
- Real paid OCR/AI provider wiring (only `SCAN_IMPORT_PROVIDER=mock` dev path supported).
- Approval workflow and Phase 5 permission/audit changes.
- Supplier portal, billing, subscriptions.
