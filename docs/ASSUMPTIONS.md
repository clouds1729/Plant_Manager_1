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
- Phase 5 hardening adds role enforcement to approval RPCs using `auth.uid()` and `organization_members` checks; calls now fail when unauthenticated or lacking required org role.
- `audit_logs.actor_id` is now written from `auth.uid()` in approval RPCs; local SQL-only testing without Supabase Auth context will see `Authentication required` by design.
- RLS is now enabled for approval-focused tables (`organization_members`, `audit_logs`, `plant_logs`, `ipc_periods`) with organization-isolation read policies and limited update/insert paths for approval activity.
- Full app-wide RLS is now enabled for `imports`, `import_rows`, `projects`, `suppliers`, `plants`, and `plant_rates` with org-isolated reads and role-aware writes.
- `is_org_member` and `has_org_role` are now `SECURITY DEFINER` helpers with fixed `search_path=public` so approval-table RLS and RPC checks do not recurse through `organization_members` RLS evaluation.
- `organization_members` RLS read policy is intentionally self-row (`auth.uid() = user_id`) to avoid recursive policy evaluation; org-wide member listing remains deferred to a dedicated admin-safe approach.

- Phase 5 auth/app gating now requires Supabase-authenticated users on core app routes (`/dashboard`, `/projects`, `/suppliers`, `/plants`, `/logs`, `/rates`, `/ipc-periods`, `/ipc-preview`, `/imports`, `/scan-imports`); unauthenticated users are shown a sign-in-required screen and directed to `/login`.
- App shell now fetches current `organization_members` membership for authenticated users and surfaces organization/role context in navigation; users without membership are blocked with an explicit "No organization membership found" state (no synthetic fallback membership).
- UI-level role-aware approval button visibility is convenience-only and intentionally mirrors DB/RPC rules (`foreman/admin/owner` submit logs; `finance/admin/owner` approve/reject logs; `finance/admin/owner` submit/approve/reject IPC periods), while database checks remain source-of-truth.
- `import_rows` RLS is enforced via parent `imports.organization_id` because `import_rows` has no direct `organization_id`; policy checks use parent-row existence and org helper functions.
- UI flows that create business/import records now assume organization context comes from authenticated `organization_members` lookup, not free-form org UUID entry.
- Remaining Phase 5 follow-up work after this step: admin membership management UI, and production auth-provider/session polish.

- Phase 5 membership management currently uses manual `user_id` entry (UUID) for add-member operations; invite-by-email UX is intentionally deferred.
- Membership mutations run through database RPCs (`add_organization_member`, `update_organization_member_role`, `remove_organization_member`) and enforce owner/admin auth plus last-owner protections at the database layer.
- Production auth-provider/session polish remains deferred; local workflow assumes existing authenticated users are manually linked into `organization_members`.

- Phase 6 supplier portal foundation introduces a manual `supplier_users` mapping; users without a mapping intentionally see "No supplier portal access found.".
- Supplier portal is intentionally read-only in this phase and only exposes supplier-scoped profile/plants/rates/IPC data.
- Supplier-scoped read policies now apply only when a user lacks an internal org role (`owner/admin/finance/foreman/viewer`); users with both `supplier_viewer` and an internal role retain internal read scope.
- Invite/onboarding polish for supplier users remains deferred.
- Reports/PDF exports and billing/subscriptions remain deferred beyond this foundation step.
- Phase 6 reports/export foundation is internal-only (`/reports`) and targets finance/admin workflows first; supplier-facing report access remains out of scope.
- CSV export of existing IPC line data is the first export artifact; full branded PDF export remains deferred to a later Phase 6 step.
- Phase 6 current PDF path is browser print-to-PDF from internal `/reports/print`; branded/server-side PDF generation remains deferred.
