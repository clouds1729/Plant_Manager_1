Payment-sensitive changes must be audit logged.

Audit these entities:

plant logs
plant rates
suppliers
plants
IPCs
tax settings
approvals

---

## `docs/ARCHITECTURE.md`

```md
# Architecture

## Target Architecture

Plant Manager should be a multi-tenant SaaS application.

## Frontend

Use:

- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Query if useful

## Backend

Use Supabase for:

- authentication
- Postgres database
- file storage
- row-level security
- edge functions where needed

## Database

Use Supabase Postgres.

All business data should be scoped by `organization_id`.

## Multi-Tenancy

Each company is an organization.

Users belong to organizations through `organization_members`.

Most tables should include:

```text
organization_id
created_at
updated_at

Important tables:

organizations
organization_members
projects
suppliers
plants
plant_logs
plant_rates
ipc_periods
ipc_period_plants
ipc_lines
imports
import_rows
audit_logs
Calculation Layer

Payment-critical calculations should live in reusable utility functions.

Recommended folder:

lib/calculations/
  hours.ts
  rates.ts
  ipc.ts

Do not duplicate calculation logic across UI pages.

Import Pipeline

All imports should use the same staged workflow:

raw input
→ parse
→ normalize
→ match plant
→ validate
→ detect conflicts
→ user review
→ commit
→ audit log

Excel import and scan import should share this pipeline.

AI Scan Import

AI scan import must happen server-side.

Never expose API keys in frontend code.

Scanned rows must go to staging first. They must not directly create plant logs.

File Storage

Use Supabase Storage for:

plant photos
timesheet scan images
imported Excel files
generated PDFs if needed
