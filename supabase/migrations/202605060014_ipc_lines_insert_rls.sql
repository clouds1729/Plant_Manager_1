drop policy if exists ipc_lines_insert_finance_admin_owner on ipc_lines;

create policy ipc_lines_insert_finance_admin_owner on ipc_lines
for insert
with check (
  auth.uid() is not null
  and exists (
    select 1
    from ipc_periods ip
    where ip.id = ipc_lines.ipc_period_id
      and is_org_member(ip.organization_id)
      and has_org_role(ip.organization_id, array['owner', 'admin', 'finance'])
  )
);
