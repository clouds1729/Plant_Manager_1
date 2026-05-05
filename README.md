# Plant_Manager_1

Plant Manager is a commercial-grade construction equipment management platform.

It helps construction companies track plant/equipment hours, manage suppliers, calculate billable hours, handle rate histories, generate Interim Payment Certificates (IPCs), and eventually support scan/Excel import workflows.

This project is a rebuild of an earlier single-file Plant Monitor prototype into a proper multi-tenant SaaS application.

## Product Goal

Build a robust, multi-commercial-use web platform for construction companies that need to:

- Manage construction projects
- Track suppliers/subcontractors
- Register plants/equipment
- Log daily equipment hours
- Separate billable hours from breakdown and unproductive time
- Manage plant-specific rate history
- Generate IPCs/payment certificates
- Import timesheets from Excel and scanned images
- Maintain approval workflows and audit logs

## Current Build Strategy

This project must be built in phases.

Do **not** implement the whole product at once.

The correct order is:

1. Phase 1 — Core SaaS foundation
2. Phase 2 — Rates and IPC generation
3. Phase 3 — Excel import and conflict detection
4. Phase 4 — AI scan import
5. Phase 5 — Approval workflow, audit logs, and permissions
6. Phase 6 — Supplier portal, reporting, PDF exports, and polish

The first implementation should only complete Phase 1 unless explicitly instructed otherwise.

## Recommended Stack

Use:

- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Row Level Security
- Zod for validation
- React Hook Form for forms
- Vitest for unit tests

## Important Rule

Do not fake unfinished features.

If a feature belongs to a future phase, create clear placeholder navigation only if useful, but do not implement fake logic.

For example:

- Do not fake IPC generation in Phase 1.
- Do not fake scan import in Phase 1.
- Do not fake Excel import in Phase 1.
- Do not fake supplier portals in Phase 1.

## Phase 1 Goal

Build the foundation of the SaaS app:

- Authentication
- Organization structure
- Projects
- Suppliers
- Plants/equipment
- Daily plant logs
- Gross-hours and billable-hours calculations
- Basic dashboard
- Tests for calculation logic
- Supabase schema/migrations
- Local development documentation

## Business Logic Summary

Each plant log records:

- Date
- Start time
- End time
- Lunch hours
- Unproductive hours
- Unproductive type
- Breakdown hours
- Billable hours
- Remarks

Important distinction:

- If a plant has no start and no end time, it is "not on site."
- If start/end times exist, then the plant was on site.
- Unproductive hours and breakdown hours are deductions from gross hours.
- Billable hours must never be negative.
- Breakdown and unproductive time are different categories and should not be merged.

## Documentation

Read these files before implementation:

- `docs/SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/BUSINESS_RULES.md`
- `docs/ROADMAP.md`
- `docs/CODEX_TASKS.md`

## Development Expectations

Every implementation task should:

1. Follow the phase order.
2. Add tests for business logic.
3. Avoid placeholder business logic.
4. Document assumptions in `docs/ASSUMPTIONS.md`.
5. Keep the code modular.
6. Keep calculations centralized in reusable utility functions.
7. Avoid putting payment-critical calculations directly inside UI components.

## Local Development

Expected commands after setup:

```bash
npm install
npm run dev
npm test
