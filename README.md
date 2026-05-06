# Plant Manager

Plant Manager is a commercial construction equipment operations and subcontractor payment platform.

It helps teams track daily plant/equipment usage, maintain supplier rate history, and generate reproducible IPC payment records with auditable line items.

## Product vision

Plant Manager is being built as a multi-tenant SaaS product for construction companies and civil contractors that need reliable, defensible equipment payment workflows.

Core outcomes:
- Reduce payment disputes by centralizing usage logs and rate history.
- Ensure IPC totals can always be reproduced from stored line items.
- Support operational staff (site/foreman) and finance/admin teams in one system.

## Current implementation status

- **Phase 1 complete**: SaaS foundation, projects/suppliers/plants/logs, dashboard, and hour calculation tests.
- **Phase 2 complete/hardened**: rates, IPC preview, IPC periods, and IPC finalization via Postgres RPC.
- **Phase 3 complete/hardened**: Excel import staging, `import_rows`, conflict detection, and reviewed commit via Postgres RPC.
- **Phase 4 complete foundation**: scan import route, server-only extraction placeholder, mock provider mode, confidence/review metadata, and shared staging pipeline.
- **Phase 5 not started**: approval workflows, audit logs, and RLS/permissions hardening.
- **Phase 6 not started**: supplier portal, reports, PDF exports, billing/subscriptions/polish.

## Implemented routes

- `/dashboard`
- `/projects`
- `/suppliers`
- `/plants`
- `/logs`
- `/rates`
- `/ipc-periods`
- `/ipc-preview`
- `/imports`
- `/scan-imports`

## Important limitations

- Real OCR/AI provider is not wired yet; scan import uses explicit mock/dev provider only.
- Approval workflow, audit logging, and RLS/RPC authorization hardening are deferred to Phase 5.
- `create_flagged_duplicate` remains intentionally uncommitted.
- Excel headers are currently expected to use normalized keys.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Run the app locally:
   ```bash
   npm run dev
   ```
4. Run tests:
   ```bash
   npm test
   ```
5. Run production build check:
   ```bash
   npm run build
   ```

## Supabase setup notes

- Apply SQL migrations in `supabase/migrations/`.
- Optionally load sample data from `supabase/seed.sql` for local testing.
