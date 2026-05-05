# Roadmap

## Phase 1 — Core SaaS Foundation

Build the basic application foundation:

- Next.js app
- Supabase setup
- Auth
- Organizations
- Projects
- Suppliers
- Plants
- Daily logs
- Basic dashboard
- Calculation utilities
- Unit tests
- Seed data

Success condition:

A user can create a project, supplier, plant, and daily log. The app correctly calculates gross and billable hours.

## Phase 2 — Rates and IPC Generation

Build payment foundation:

- Rate history
- Effective-date rate lookup
- IPC period creation
- Selected plants per IPC
- IPC preview
- IPC finalization
- Stored IPC line items
- Tax configuration

Success condition:

A user can generate an IPC for a supplier and selected plants over a period, with correct totals.

## Phase 3 — Excel Import

Build Excel workflow:

- Upload Excel
- Parse rows
- Normalize fields
- Match plants
- Detect conflicts
- Review staging table
- Commit selected rows

Success condition:

A user can import an Excel timesheet without overwriting existing logs silently.

## Phase 4 — AI Scan Import

Build scan workflow:

- Upload timesheet photo
- Server-side AI extraction
- Staging review
- Conflict detection
- Commit reviewed rows

Success condition:

A scanned timesheet can produce reviewed plant logs without exposing API keys.

## Phase 5 — Approvals, Audit Logs, Permissions

Build commercial safety:

- Log approval workflow
- IPC approval workflow
- Audit logs
- Role-based permissions
- Supabase RLS policies

Success condition:

Users can only perform actions allowed by their role, and payment-sensitive changes are auditable.

## Phase 6 — Reporting and Supplier Portal

Build commercial polish:

- Supplier portal
- PDF reports
- Utilization reports
- Breakdown reports
- Unproductive-hours reports
- Mobile optimization
- Optional offline/PWA support

Success condition:

The platform is usable by both construction company staff and supplier users.
