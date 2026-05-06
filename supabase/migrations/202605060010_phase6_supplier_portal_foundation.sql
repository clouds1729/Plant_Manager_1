-- Phase 6 foundation: supplier portal user mapping and supplier-scoped read access.

alter table organization_members
  drop constraint if exists organization_members_role_phase5_chk;

alter table organization_members
  add constraint organization_members_role_phase6_chk
  check (role in ('owner', 'admin', 'finance', 'foreman', 'viewer', 'supplier_viewer'));

create table if not exists supplier_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (organization_id, supplier_id, user_id)
);

alter table supplier_users enable row level security;

create policy supplier_users_select_self on supplier_users
for select using (
  auth.uid() is not null
  and user_id = auth.uid()
  and is_org_member(organization_id)
);

create or replace function current_supplier_id(org_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select su.supplier_id
  from public.supplier_users su
  where su.organization_id = org_id
    and su.user_id = auth.uid()
  order by su.created_at asc
  limit 1;
$$;

-- Replace org-wide select policies with supplier-scoped behavior for supplier_viewer role.
drop policy if exists suppliers_select_same_org on suppliers;
create policy suppliers_select_by_role_scope on suppliers
for select using (
  is_org_member(organization_id)
  and (
    not has_org_role(organization_id, array['supplier_viewer'])
    or id = current_supplier_id(organization_id)
  )
);

drop policy if exists plants_select_same_org on plants;
create policy plants_select_by_role_scope on plants
for select using (
  is_org_member(organization_id)
  and (
    not has_org_role(organization_id, array['supplier_viewer'])
    or supplier_id = current_supplier_id(organization_id)
  )
);

drop policy if exists plant_rates_select_same_org on plant_rates;
create policy plant_rates_select_by_role_scope on plant_rates
for select using (
  is_org_member(organization_id)
  and (
    not has_org_role(organization_id, array['supplier_viewer'])
    or supplier_id = current_supplier_id(organization_id)
  )
);

drop policy if exists ipc_periods_select_same_org on ipc_periods;
create policy ipc_periods_select_by_role_scope on ipc_periods
for select using (
  is_org_member(organization_id)
  and (
    not has_org_role(organization_id, array['supplier_viewer'])
    or supplier_id = current_supplier_id(organization_id)
  )
);

alter table ipc_lines enable row level security;

create policy ipc_lines_select_by_role_scope on ipc_lines
for select using (
  exists (
    select 1
    from ipc_periods ip
    where ip.id = ipc_lines.ipc_period_id
      and is_org_member(ip.organization_id)
      and (
        not has_org_role(ip.organization_id, array['supplier_viewer'])
        or ip.supplier_id = current_supplier_id(ip.organization_id)
      )
  )
);
