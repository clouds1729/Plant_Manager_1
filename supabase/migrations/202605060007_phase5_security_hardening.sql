create extension if not exists "pgcrypto";

-- Role foundation hardening for existing table.
alter table organization_members
  add constraint organization_members_role_phase5_chk
  check (role in ('owner', 'admin', 'finance', 'foreman', 'viewer'));

create unique index if not exists organization_members_org_user_idx
  on organization_members (organization_id, user_id);

create or replace function current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function has_org_role(org_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.role = any(allowed_roles)
  );
$$;

create or replace function require_authenticated_user()
returns uuid
language plpgsql
stable
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  return v_user_id;
end;
$$;

create or replace function submit_plant_log(log_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare
  current_row plant_logs%rowtype;
  v_actor_id uuid;
begin
  v_actor_id := require_authenticated_user();
  select * into current_row from plant_logs where plant_logs.id = log_id for update;
  if not found then raise exception 'Plant log not found'; end if;
  if not is_org_member(current_row.organization_id) then raise exception 'Forbidden: not an organization member'; end if;
  if not has_org_role(current_row.organization_id, array['foreman','admin','owner']) then raise exception 'Forbidden: insufficient role'; end if;
  if current_row.approval_status not in ('draft', 'rejected') then raise exception 'Invalid transition from % to submitted', current_row.approval_status; end if;

  update plant_logs set approval_status = 'submitted', submitted_at = now(), approved_at = null, rejected_at = null, approval_notes = notes, updated_at = now()
  where plant_logs.id = log_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, v_actor_id, 'plant_log', current_row.id, 'submitted',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'submitted', 'approval_notes', notes));

  return query select log_id, 'submitted'::text;
end;
$$;

create or replace function approve_plant_log(log_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare current_row plant_logs%rowtype; v_actor_id uuid;
begin
  v_actor_id := require_authenticated_user();
  select * into current_row from plant_logs where plant_logs.id = log_id for update;
  if not found then raise exception 'Plant log not found'; end if;
  if not is_org_member(current_row.organization_id) then raise exception 'Forbidden: not an organization member'; end if;
  if not has_org_role(current_row.organization_id, array['finance','admin','owner']) then raise exception 'Forbidden: insufficient role'; end if;
  if current_row.approval_status <> 'submitted' then raise exception 'Invalid transition from % to approved', current_row.approval_status; end if;

  update plant_logs set approval_status = 'approved', approved_at = now(), rejected_at = null, approval_notes = notes, updated_at = now()
  where plant_logs.id = log_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, v_actor_id, 'plant_log', current_row.id, 'approved',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'approved', 'approval_notes', notes));

  return query select log_id, 'approved'::text;
end;
$$;

create or replace function reject_plant_log(log_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare current_row plant_logs%rowtype; v_actor_id uuid;
begin
  v_actor_id := require_authenticated_user();
  select * into current_row from plant_logs where plant_logs.id = log_id for update;
  if not found then raise exception 'Plant log not found'; end if;
  if not is_org_member(current_row.organization_id) then raise exception 'Forbidden: not an organization member'; end if;
  if not has_org_role(current_row.organization_id, array['finance','admin','owner']) then raise exception 'Forbidden: insufficient role'; end if;
  if current_row.approval_status <> 'submitted' then raise exception 'Invalid transition from % to rejected', current_row.approval_status; end if;

  update plant_logs set approval_status = 'rejected', rejected_at = now(), approved_at = null, approval_notes = notes, updated_at = now()
  where plant_logs.id = log_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, v_actor_id, 'plant_log', current_row.id, 'rejected',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'rejected', 'approval_notes', notes));

  return query select log_id, 'rejected'::text;
end;
$$;

create or replace function submit_ipc_period(ipc_period_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare current_row ipc_periods%rowtype; v_actor_id uuid;
begin
  v_actor_id := require_authenticated_user();
  select * into current_row from ipc_periods where ipc_periods.id = ipc_period_id for update;
  if not found then raise exception 'IPC period not found'; end if;
  if not is_org_member(current_row.organization_id) then raise exception 'Forbidden: not an organization member'; end if;
  if not has_org_role(current_row.organization_id, array['finance','admin','owner']) then raise exception 'Forbidden: insufficient role'; end if;
  if current_row.approval_status not in ('draft', 'rejected') then raise exception 'Invalid transition from % to submitted', current_row.approval_status; end if;

  update ipc_periods set approval_status = 'submitted', submitted_at = now(), approved_at = null, rejected_at = null, approval_notes = notes
  where ipc_periods.id = ipc_period_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, v_actor_id, 'ipc_period', current_row.id, 'submitted',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'submitted', 'approval_notes', notes));

  return query select ipc_period_id, 'submitted'::text;
end;
$$;

create or replace function approve_ipc_period(ipc_period_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare current_row ipc_periods%rowtype; v_actor_id uuid;
begin
  v_actor_id := require_authenticated_user();
  select * into current_row from ipc_periods where ipc_periods.id = ipc_period_id for update;
  if not found then raise exception 'IPC period not found'; end if;
  if not is_org_member(current_row.organization_id) then raise exception 'Forbidden: not an organization member'; end if;
  if not has_org_role(current_row.organization_id, array['finance','admin','owner']) then raise exception 'Forbidden: insufficient role'; end if;
  if current_row.approval_status <> 'submitted' then raise exception 'Invalid transition from % to approved', current_row.approval_status; end if;

  update ipc_periods set approval_status = 'approved', approved_at = now(), rejected_at = null, approval_notes = notes
  where ipc_periods.id = ipc_period_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, v_actor_id, 'ipc_period', current_row.id, 'approved',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'approved', 'approval_notes', notes));

  return query select ipc_period_id, 'approved'::text;
end;
$$;

create or replace function reject_ipc_period(ipc_period_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare current_row ipc_periods%rowtype; v_actor_id uuid;
begin
  v_actor_id := require_authenticated_user();
  select * into current_row from ipc_periods where ipc_periods.id = ipc_period_id for update;
  if not found then raise exception 'IPC period not found'; end if;
  if not is_org_member(current_row.organization_id) then raise exception 'Forbidden: not an organization member'; end if;
  if not has_org_role(current_row.organization_id, array['finance','admin','owner']) then raise exception 'Forbidden: insufficient role'; end if;
  if current_row.approval_status <> 'submitted' then raise exception 'Invalid transition from % to rejected', current_row.approval_status; end if;

  update ipc_periods set approval_status = 'rejected', rejected_at = now(), approved_at = null, approval_notes = notes
  where ipc_periods.id = ipc_period_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, v_actor_id, 'ipc_period', current_row.id, 'rejected',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'rejected', 'approval_notes', notes));

  return query select ipc_period_id, 'rejected'::text;
end;
$$;

alter table organization_members enable row level security;
alter table audit_logs enable row level security;
alter table plant_logs enable row level security;
alter table ipc_periods enable row level security;

create policy organization_members_select_self on organization_members
for select using (auth.uid() = user_id);

create policy audit_logs_select_same_org on audit_logs
for select using (is_org_member(organization_id));

create policy audit_logs_insert_finance_admin_owner on audit_logs
for insert with check (
  auth.uid() is not null
  and is_org_member(organization_id)
  and has_org_role(organization_id, array['foreman','finance','admin','owner'])
);

create policy plant_logs_select_same_org on plant_logs
for select using (is_org_member(organization_id));

create policy plant_logs_update_approval_roles on plant_logs
for update using (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['foreman','finance','admin','owner'])
)
with check (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['foreman','finance','admin','owner'])
);

create policy ipc_periods_select_same_org on ipc_periods
for select using (is_org_member(organization_id));

create policy ipc_periods_update_approval_roles on ipc_periods
for update using (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['finance','admin','owner'])
)
with check (
  is_org_member(organization_id)
  and has_org_role(organization_id, array['finance','admin','owner'])
);
