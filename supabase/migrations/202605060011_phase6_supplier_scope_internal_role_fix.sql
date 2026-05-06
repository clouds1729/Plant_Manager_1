-- Phase 6 fix: supplier scoping should only apply when user lacks an internal org role.

create or replace function has_internal_org_role(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select has_org_role(org_id, array['owner','admin','finance','foreman','viewer']);
$$;

drop policy if exists suppliers_select_by_role_scope on suppliers;
create policy suppliers_select_by_role_scope on suppliers
for select using (
  is_org_member(organization_id)
  and (
    has_internal_org_role(organization_id)
    or id = current_supplier_id(organization_id)
  )
);

drop policy if exists plants_select_by_role_scope on plants;
create policy plants_select_by_role_scope on plants
for select using (
  is_org_member(organization_id)
  and (
    has_internal_org_role(organization_id)
    or supplier_id = current_supplier_id(organization_id)
  )
);

drop policy if exists plant_rates_select_by_role_scope on plant_rates;
create policy plant_rates_select_by_role_scope on plant_rates
for select using (
  is_org_member(organization_id)
  and (
    has_internal_org_role(organization_id)
    or supplier_id = current_supplier_id(organization_id)
  )
);

drop policy if exists ipc_periods_select_by_role_scope on ipc_periods;
create policy ipc_periods_select_by_role_scope on ipc_periods
for select using (
  is_org_member(organization_id)
  and (
    has_internal_org_role(organization_id)
    or supplier_id = current_supplier_id(organization_id)
  )
);

drop policy if exists ipc_lines_select_by_role_scope on ipc_lines;
create policy ipc_lines_select_by_role_scope on ipc_lines
for select using (
  exists (
    select 1
    from ipc_periods ip
    where ip.id = ipc_lines.ipc_period_id
      and is_org_member(ip.organization_id)
      and (
        has_internal_org_role(ip.organization_id)
        or ip.supplier_id = current_supplier_id(ip.organization_id)
      )
  )
);
