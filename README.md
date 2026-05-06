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

- **Phase 1 complete foundation**: app shell, CRUD for projects/suppliers/plants/logs, dashboard metrics, and hour-calculation utilities.
- **Phase 2 in progress**: rate history and IPC generation foundation.
- **Not yet implemented**: Excel import, AI scan import, approval workflows, supplier portal, billing/subscriptions.

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
