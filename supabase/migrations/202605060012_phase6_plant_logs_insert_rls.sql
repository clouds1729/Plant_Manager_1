-- Allow internal write roles to create draft daily logs in their own organization.
create policy plant_logs_insert_internal_roles on plant_logs
for insert
with check (
  auth.uid() is not null
  and is_org_member(organization_id)
  and has_org_role(organization_id, array['owner','admin','foreman'])
);
