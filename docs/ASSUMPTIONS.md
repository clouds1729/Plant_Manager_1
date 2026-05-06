# Assumptions

This file records implementation assumptions made by Codex or contributors.

When a requirement is ambiguous, choose the simplest production-safe interpretation and document it here.

## Current Assumptions

- The first implementation uses Supabase as the backend.
- The product is multi-tenant by organization.
- Every major business table should include `organization_id`.
- Phase 1 does not implement IPCs, imports, supplier portals, or approval workflows.
- Phase 1 CRUD pages use direct Supabase browser client calls and require valid UUID references for linked records.
- Authentication UI is represented by a landing/login entry page, while full sign-in flow wiring is deferred to follow-up hardening.
- Phase 2 foundation stores IPC line items per log so totals are reproducible and rates are resolved by effective date on each log date.
- IPC preview/finalization logic blocks finalization when any included log is missing an effective rate.
- Log locking in this phase is represented by linking included logs with `plant_logs.ipc_period_id`; stricter workflow/permissions enforcement is deferred to approvals phase.
- IPC finalization now uses a single database-side Postgres RPC (`finalize_ipc_period`) that performs period creation, line inserts, plant linking, and `plant_logs.ipc_period_id` updates atomically in one transaction.
- Remaining limitation: while finalization is atomic, full approval workflow, audit logging, and RLS-hardening for RPC execution are still deferred to later phases.
- Phase 3 Excel upload parses in-browser, then persists staged rows into `imports` and `import_rows`; users can update conflict resolution actions and commit from the staged records.
- Phase 3 import commit now runs through a single database-side Postgres RPC (`commit_import_rows`) so plant log writes, import row linking, and import status update happen atomically in one transaction.
- `create_flagged_duplicate` remains intentionally uncommitted in Phase 3 because there is no dedicated duplicate-linking/flag column in `plant_logs`; rows with this action are counted as skipped by the RPC and left without `committed_log_id`.
- Imported Excel sheet is expected to provide normalized keys (`date`, `registration_number`, `start_time`, `end_time`, `lunch_hours`, `unproductive_hours`, `breakdown_hours`, `remarks`) in header row.
- Phase 4 scan import uses a server-only extraction endpoint (`/api/scan-import`) and returns `extraction_not_configured` unless `SCAN_IMPORT_PROVIDER=mock` is set for a development stub flow.
- Phase 4 reuses `imports/import_rows` staging and `commit_import_rows` RPC; low-confidence scan rows (`requires_review=true`) are blocked from commit until reviewed.
- Real OCR/AI provider integration, secure file storage wiring, and provider-specific parsing are deferred until explicit environment configuration and follow-up hardening.
- Phase 5 approval workflow foundation now exists for `plant_logs` and `ipc_periods` with status fields (`draft/submitted/approved/rejected`) and database RPC transitions; role enforcement and RLS hardening are still deferred to the next Phase 5 hardening step.
- Phase 5 foundation introduces `audit_logs` table and writes approval-transition audit rows from RPCs; `actor_id` is currently nullable until Supabase Auth identity is fully wired into RPC context.
