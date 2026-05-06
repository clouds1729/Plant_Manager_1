create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_organization_id_idx on audit_logs(organization_id);
create index if not exists audit_logs_entity_idx on audit_logs(entity_type, entity_id);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at desc);

alter table plant_logs
  add column if not exists approval_status text not null default 'draft',
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists approval_notes text;

alter table ipc_periods
  add column if not exists approval_status text not null default 'draft',
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists approval_notes text;

alter table plant_logs drop constraint if exists plant_logs_approval_status_chk;
alter table plant_logs add constraint plant_logs_approval_status_chk check (approval_status in ('draft', 'submitted', 'approved', 'rejected'));

alter table ipc_periods drop constraint if exists ipc_periods_approval_status_chk;
alter table ipc_periods add constraint ipc_periods_approval_status_chk check (approval_status in ('draft', 'submitted', 'approved', 'rejected'));

create or replace function submit_plant_log(log_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare
  current_row plant_logs%rowtype;
begin
  select * into current_row from plant_logs where plant_logs.id = log_id for update;
  if not found then
    raise exception 'Plant log not found';
  end if;

  if current_row.approval_status not in ('draft', 'rejected') then
    raise exception 'Invalid transition from % to submitted', current_row.approval_status;
  end if;

  update plant_logs
  set approval_status = 'submitted', submitted_at = now(), approved_at = null, rejected_at = null, approval_notes = notes, updated_at = now()
  where plant_logs.id = log_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (
    current_row.organization_id,
    null,
    'plant_log',
    current_row.id,
    'submitted',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'submitted', 'approval_notes', notes)
  );

  return query select log_id, 'submitted'::text;
end;
$$;

create or replace function approve_plant_log(log_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare current_row plant_logs%rowtype;
begin
  select * into current_row from plant_logs where plant_logs.id = log_id for update;
  if not found then raise exception 'Plant log not found'; end if;
  if current_row.approval_status <> 'submitted' then
    raise exception 'Invalid transition from % to approved', current_row.approval_status;
  end if;

  update plant_logs
  set approval_status = 'approved', approved_at = now(), rejected_at = null, approval_notes = notes, updated_at = now()
  where plant_logs.id = log_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, null, 'plant_log', current_row.id, 'approved',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'approved', 'approval_notes', notes));

  return query select log_id, 'approved'::text;
end;
$$;

create or replace function reject_plant_log(log_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare current_row plant_logs%rowtype;
begin
  select * into current_row from plant_logs where plant_logs.id = log_id for update;
  if not found then raise exception 'Plant log not found'; end if;
  if current_row.approval_status <> 'submitted' then
    raise exception 'Invalid transition from % to rejected', current_row.approval_status;
  end if;

  update plant_logs
  set approval_status = 'rejected', rejected_at = now(), approved_at = null, approval_notes = notes, updated_at = now()
  where plant_logs.id = log_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, null, 'plant_log', current_row.id, 'rejected',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'rejected', 'approval_notes', notes));

  return query select log_id, 'rejected'::text;
end;
$$;

create or replace function submit_ipc_period(ipc_period_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare current_row ipc_periods%rowtype;
begin
  select * into current_row from ipc_periods where ipc_periods.id = ipc_period_id for update;
  if not found then raise exception 'IPC period not found'; end if;
  if current_row.approval_status not in ('draft', 'rejected') then
    raise exception 'Invalid transition from % to submitted', current_row.approval_status;
  end if;

  update ipc_periods
  set approval_status = 'submitted', submitted_at = now(), approved_at = null, rejected_at = null, approval_notes = notes
  where ipc_periods.id = ipc_period_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, null, 'ipc_period', current_row.id, 'submitted',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'submitted', 'approval_notes', notes));

  return query select ipc_period_id, 'submitted'::text;
end;
$$;

create or replace function approve_ipc_period(ipc_period_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare current_row ipc_periods%rowtype;
begin
  select * into current_row from ipc_periods where ipc_periods.id = ipc_period_id for update;
  if not found then raise exception 'IPC period not found'; end if;
  if current_row.approval_status <> 'submitted' then
    raise exception 'Invalid transition from % to approved', current_row.approval_status;
  end if;

  update ipc_periods
  set approval_status = 'approved', approved_at = now(), rejected_at = null, approval_notes = notes
  where ipc_periods.id = ipc_period_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, null, 'ipc_period', current_row.id, 'approved',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'approved', 'approval_notes', notes));

  return query select ipc_period_id, 'approved'::text;
end;
$$;

create or replace function reject_ipc_period(ipc_period_id uuid, notes text default null)
returns table (id uuid, approval_status text)
language plpgsql
as $$
declare current_row ipc_periods%rowtype;
begin
  select * into current_row from ipc_periods where ipc_periods.id = ipc_period_id for update;
  if not found then raise exception 'IPC period not found'; end if;
  if current_row.approval_status <> 'submitted' then
    raise exception 'Invalid transition from % to rejected', current_row.approval_status;
  end if;

  update ipc_periods
  set approval_status = 'rejected', rejected_at = now(), approved_at = null, approval_notes = notes
  where ipc_periods.id = ipc_period_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (current_row.organization_id, null, 'ipc_period', current_row.id, 'rejected',
    jsonb_build_object('approval_status', current_row.approval_status, 'approval_notes', current_row.approval_notes),
    jsonb_build_object('approval_status', 'rejected', 'approval_notes', notes));

  return query select ipc_period_id, 'rejected'::text;
end;
$$;
