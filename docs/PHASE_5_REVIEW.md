# Phase 5 Review (Security Hardening)

## What is now enforced
- Approval RPCs (`submit/approve/reject` for both plant logs and IPC periods) now require authenticated actor identity via `auth.uid()` and reject unauthenticated calls.
- RPCs now verify both organization membership and role-based authorization before state transitions:
  - Plant log submit: `foreman/admin/owner`
  - Plant log approve/reject: `finance/admin/owner`
  - IPC submit/approve/reject: `finance/admin/owner`
- Approval RPC audit writes now set `audit_logs.actor_id = auth.uid()`.
- Existing approval transition validation (`draft/rejected -> submitted`, `submitted -> approved/rejected`) remains preserved.
- Added SQL helper functions for permission checks:
  - `current_user_id()`
  - `is_org_member(org_id)`
  - `has_org_role(org_id, allowed_roles text[])`
- Added role constraint/uniqueness hardening for `organization_members`.

## RLS status
- **Enabled now (Phase 5 hardening scope):**
  - `organization_members`
  - `audit_logs`
  - `plant_logs`
  - `ipc_periods`
- **Enabled now (full app-wide business-table hardening):**
  - `projects`
  - `suppliers`
  - `plants`
  - `plant_rates`
  - `imports`
  - `import_rows` (scoped through parent `imports.organization_id`)
- Policies now enforce organization-member reads and role-limited approval-sensitive writes on the above tables.

## Role model used for hardened business tables
- `viewer`: read-only.
- `admin`/`owner`: can write `projects`, `suppliers`, and `plants`.
- `finance`/`admin`/`owner`: can write `plant_rates`, `imports`, and `import_rows`.
- Read access is org-isolated for authenticated org members across all hardened tables.

## import_rows RLS implementation note
- `import_rows` has no direct `organization_id` and is authorized via `imports` using `import_rows.import_id -> imports.id`.
- Policies use `EXISTS` checks against parent `imports` so authorization is tenant-aware without adding synthetic org data to child rows.

## Local development/auth limitations
- Approval RPC behavior assumes execution in a Supabase Auth context where `auth.uid()` is available.
- Running RPCs directly from SQL shells without JWT context is expected to fail with `Authentication required`.
- This is intentional and part of the Phase 5 security posture.

## RLS recursion safety note
- `is_org_member` / `has_org_role` are implemented as `SECURITY DEFINER` with `search_path=public` and query `public.organization_members` directly to make them safe in RLS predicates for approval-focused tables.
- `organization_members` itself uses a non-recursive self-row read policy (`auth.uid() = user_id`) rather than a policy that calls membership helper functions against the same table.


## App auth gating added
- Added `/login` page with Supabase email/password sign-in and global logout action in app shell.
- Added protected-route gating for main app routes: unauthenticated users now see a clear sign-in-required state.
- Added authenticated membership fetch from `organization_members` and explicit no-membership state.
- Exposed current `organization_id` and role in the app nav for context.

## Role-aware UI convenience gating
- Plant log approval UI now hides actions based on role:
  - Submit: `foreman/admin/owner`
  - Approve/reject: `finance/admin/owner`
  - `viewer`: read-only status display.
- IPC period approval UI now hides submit/approve/reject actions unless role is `finance/admin/owner`; `viewer` remains read-only.
- DB RPC permission checks and RLS remain source-of-truth; UI gating is non-authoritative convenience.

## Deferred after app gating
- Admin membership-management UI.
- Production auth/provider/session UX polish.

## Local development implications
- Business CRUD and import pages now rely on authenticated membership context for `organization_id` during inserts.
- Local manual testing must use a signed-in Supabase user that has an `organization_members` row in the target organization.
- Unauthenticated or non-member sessions should expect empty reads and rejected writes by RLS.
