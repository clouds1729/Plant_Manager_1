create policy ipc_periods_insert_finance_admin_owner on ipc_periods
for insert with check (
  auth.uid() is not null
  and is_org_member(organization_id)
  and has_org_role(organization_id, array['finance','admin','owner'])
);
