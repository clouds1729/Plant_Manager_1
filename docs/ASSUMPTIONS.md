# Assumptions

This file records implementation assumptions made by Codex or contributors.

When a requirement is ambiguous, choose the simplest production-safe interpretation and document it here.

## Current Assumptions

- The first implementation uses Supabase as the backend.
- The product is multi-tenant by organization.
- Every major business table should include `organization_id`.
- Phase 1 does not implement IPCs, imports, supplier portals, or approval workflows.
- Phase 1 CRUD pages use direct Supabase browser client calls and require valid UUID references for linked records.
- Authentication UI is represented by a landing/login entry page, while full sign-in flow wiring is deferred to follow-up hardening.
