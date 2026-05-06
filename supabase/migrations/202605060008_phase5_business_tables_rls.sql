alter table projects enable row level security;
alter table suppliers enable row level security;
alter table plants enable row level security;
alter table plant_rates enable row level security;
alter table imports enable row level security;
alter table import_rows enable row level security;

create policy projects_select_same_org on projects
for select using (is_org_member(organization_id));

create policy projects_insert_admin_owner on projects
for insert with check (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['admin','owner'])
);

create policy projects_update_admin_owner on projects
for update using (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['admin','owner'])
)
with check (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['admin','owner'])
);

create policy projects_delete_admin_owner on projects
for delete using (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['admin','owner'])
);

create policy suppliers_select_same_org on suppliers
for select using (is_org_member(organization_id));

create policy suppliers_write_admin_owner on suppliers
for all using (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['admin','owner'])
)
with check (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['admin','owner'])
);

create policy plants_select_same_org on plants
for select using (is_org_member(organization_id));

create policy plants_write_admin_owner on plants
for all using (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['admin','owner'])
)
with check (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['admin','owner'])
);

create policy plant_rates_select_same_org on plant_rates
for select using (is_org_member(organization_id));

create policy plant_rates_write_finance_admin_owner on plant_rates
for all using (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['finance','admin','owner'])
)
with check (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['finance','admin','owner'])
);

create policy imports_select_same_org on imports
for select using (is_org_member(organization_id));

create policy imports_write_finance_admin_owner on imports
for all using (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['finance','admin','owner'])
)
with check (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['finance','admin','owner'])
);

create policy import_rows_select_via_import_org on import_rows
for select using (
  exists (
    select 1
    from imports i
    where i.id = import_rows.import_id
      and is_org_member(i.organization_id)
  )
);

create policy import_rows_insert_via_import_org on import_rows
for insert with check (
  exists (
    select 1
    from imports i
    where i.id = import_rows.import_id
      and is_org_member(i.organization_id)
      and has_org_role(i.organization_id, array['finance','admin','owner'])
  )
);

create policy import_rows_update_via_import_org on import_rows
for update using (
  exists (
    select 1
    from imports i
    where i.id = import_rows.import_id
      and is_org_member(i.organization_id)
      and has_org_role(i.organization_id, array['finance','admin','owner'])
  )
)
with check (
  exists (
    select 1
    from imports i
    where i.id = import_rows.import_id
      and is_org_member(i.organization_id)
      and has_org_role(i.organization_id, array['finance','admin','owner'])
  )
);

create policy import_rows_delete_via_import_org on import_rows
for delete using (
  exists (
    select 1
    from imports i
    where i.id = import_rows.import_id
      and is_org_member(i.organization_id)
      and has_org_role(i.organization_id, array['finance','admin','owner'])
  )
);
