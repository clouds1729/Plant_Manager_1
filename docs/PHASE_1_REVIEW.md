# Phase 1 Review

## What Phase 1 currently supports

- Next.js App Router app with TypeScript/Tailwind foundation.
- Supabase client wiring for browser/server usage.
- Database schema for:
  - organizations
  - organization_members
  - projects
  - suppliers
  - plants
  - plant_logs
- CRUD pages for projects, suppliers, plants, and daily logs.
- Dashboard counts and current-month billable-hour total.
- Centralized hour calculation utilities in `lib/calculations/hours.ts`.
- Unit tests for hour calculations.

## What is intentionally missing in Phase 1

The following are intentionally deferred beyond Phase 1:

- Plant rate history and effective-date lookup.
- IPC period creation, preview, and finalization.
- Excel import pipeline.
- AI scan import pipeline.
- Approval workflows and audit logs.
- Supplier portal.
- Billing/subscriptions.
