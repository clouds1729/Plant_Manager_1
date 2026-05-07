create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_org_created_idx on activity_events (organization_id, created_at desc);

alter table activity_events enable row level security;

create policy activity_events_select_same_org on activity_events
for select using (is_org_member(organization_id));

create policy activity_events_insert_same_org on activity_events
for insert with check (
  auth.uid() is not null
  and is_org_member(organization_id)
  and (actor_user_id is null or actor_user_id = auth.uid())
);

create or replace function create_activity_event(
  p_organization_id uuid,
  p_event_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_message text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security invoker
as $$
begin
  insert into activity_events (organization_id, actor_user_id, event_type, entity_type, entity_id, message, metadata)
  values (p_organization_id, auth.uid(), p_event_type, p_entity_type, p_entity_id, p_message, coalesce(p_metadata, '{}'::jsonb));
end;
$$;
