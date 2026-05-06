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
