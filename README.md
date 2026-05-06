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

- **Phase 1 complete**: SaaS foundation, CRUD, dashboard, and hour calculations.
- **Phase 2 complete/hardened**: rates, IPC preview, IPC periods, and atomic IPC finalization RPC.
- **Phase 3 complete/hardened**: Excel import staging, conflict detection, and atomic import commit RPC.
- **Phase 4 complete foundation**: scan import route, server-only extraction placeholder, mock provider mode, and confidence/review metadata.
- **Phase 5 mostly complete**: approval workflows, audit logs, auth gating, role-aware UI, app-wide RLS, and admin membership management.
- **Phase 6 in progress**: supplier portal, internal reports, CSV export, and browser print-to-PDF foundation.

## Implemented routes

- `/login`
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
- `/settings/members`
- `/supplier-portal`
- `/reports`
- `/reports/print`

## Important limitations

- Invite-by-email membership onboarding is not implemented yet; membership currently uses manual `user_id` entry.
- Production auth/session provider polish is deferred.
- Real OCR/AI provider is not wired yet; scan import currently uses mock/dev provider mode.
- Billing/subscriptions are deferred.
- Branded/server-side PDF generation is deferred (current path is browser print-to-PDF from reports).
- Broad UI polish and onboarding/invite polish are deferred.
- Supplier portal and reports/export are foundation-level and not production-polished yet.
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
