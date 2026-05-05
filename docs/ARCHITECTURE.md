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
