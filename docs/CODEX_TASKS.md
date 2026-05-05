## `docs/CODEX_TASKS.md`

This is the most important one for Codex.

```md
# Codex Task Instructions

Codex must not implement the entire product in one pass.

Each task must implement only the requested phase.

## Global Rules

- Read `README.md` and all files in `docs/` before coding.
- Do not implement future phases unless explicitly requested.
- Do not create fake working features.
- Do not hardcode business data.
- Do not put payment-critical calculations only inside UI components.
- Add tests for calculation/business logic.
- Document assumptions in `docs/ASSUMPTIONS.md`.
- Prefer simple, maintainable code over clever abstractions.
- Use TypeScript strictly.

---

# Phase 1 — Core SaaS Foundation

## Goal

Create the base application for Plant Manager.

## Required Features

- Next.js App Router project
- TypeScript
- TailwindCSS
- shadcn/ui setup
- Supabase client setup
- Supabase auth pages
- Organization model
- Project model
- Supplier model
- Plant/equipment model
- Daily plant log model
- CRUD pages for:
  - Projects
  - Suppliers
  - Plants
  - Daily logs
- Basic dashboard showing:
  - number of projects
  - number of suppliers
  - number of plants
  - total billable hours for current month
- Centralized calculation utilities:
  - calculateGrossHours
  - calculateBillableHours
  - isNotOnSite
- Unit tests for calculation utilities
- `.env.example`
- Supabase schema/migration files
- Seed/sample data

## Do Not Implement Yet

- IPC generation
- Rate history
- Excel import
- Scan import
- Supplier portal
- Billing/subscriptions
- PDF generation
- Approval workflows
- Audit logs

---

# Phase 2 — Rates and IPC Generation

## Required Features

- Plant rate history
- Effective-date rate lookup
- IPC period creation
- Plant selection per IPC
- IPC preview
- IPC finalization
- IPC line item storage
- Tax configuration
- Tests for:
  - rate lookup
  - IPC totals
  - selected plant filtering
  - missing rate detection

## Rules

- IPC totals must be reproducible from stored line items.
- Finalized IPCs should lock included logs from normal editing.
- Missing rates should block IPC finalization.

---

# Phase 3 — Excel Import and Conflict Detection

## Required Features

- Excel upload
- Parse rows into import staging table
- Normalize dates, times, registration numbers, supplier names
- Match imported rows to existing plants
- Detect conflicts by same plant and same date
- User can choose:
  - keep existing
  - replace existing
  - skip imported row
  - create flagged duplicate
- Commit only reviewed rows
- Tests for conflict detection

---

# Phase 4 — AI Scan Import

## Required Features

- Upload image of physical timesheet
- Store image in Supabase Storage
- Call AI vision model from server-side endpoint only
- Never expose API keys to browser
- Return parsed rows into same staging flow as Excel import
- Mark low-confidence rows
- Require user review before committing

---

# Phase 5 — Approval Workflow, Audit Logs, Permissions

## Required Features

- Log statuses:
  - draft
  - submitted
  - approved
  - locked
- IPC statuses:
  - draft
  - submitted
  - approved
  - paid
- Audit log table
- Role permissions:
  - owner
  - admin
  - project_manager
  - finance
  - foreman
  - viewer
  - supplier_viewer
- RLS policies for organization isolation
- Tests or documented checks for permissions

---

# Phase 6 — Reporting, Supplier Portal, Polish

## Required Features

- Supplier portal
- PDF exports
- Email/share IPC
- Equipment utilization reports
- Breakdown reports
- Unproductive-hours reports
- Mobile-friendly layout
- Optional offline/PWA mode
