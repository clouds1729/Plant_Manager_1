create or replace function get_organization_members_admin(org_id uuid)
returns table (user_id uuid, role text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := require_authenticated_user();

  if not exists (
    select 1 from organization_members om
    where om.organization_id = org_id
      and om.user_id = v_actor_id
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'Forbidden: insufficient role';
  end if;

  return query
    select om.user_id, om.role, om.created_at
    from organization_members om
    where om.organization_id = org_id
    order by om.created_at asc;
end;
$$;

create or replace function add_organization_member(target_org_id uuid, target_user_id uuid, target_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := require_authenticated_user();

  if target_role not in ('owner', 'admin', 'finance', 'foreman', 'viewer') then
    raise exception 'Invalid role';
  end if;

  if not exists (
    select 1 from organization_members om
    where om.organization_id = target_org_id
      and om.user_id = v_actor_id
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'Forbidden: insufficient role';
  end if;

  insert into organization_members (organization_id, user_id, role)
  values (target_org_id, target_user_id, target_role)
  on conflict (organization_id, user_id)
  do update set role = excluded.role;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (
    target_org_id,
    v_actor_id,
    'organization_member',
    target_user_id,
    'member_added',
    null,
    jsonb_build_object('user_id', target_user_id, 'role', target_role)
  );
end;
$$;

create or replace function update_organization_member_role(target_org_id uuid, target_user_id uuid, target_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_current_role text;
  v_owner_count bigint;
begin
  v_actor_id := require_authenticated_user();

  if target_role not in ('owner', 'admin', 'finance', 'foreman', 'viewer') then
    raise exception 'Invalid role';
  end if;

  if not exists (
    select 1 from organization_members om
    where om.organization_id = target_org_id
      and om.user_id = v_actor_id
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'Forbidden: insufficient role';
  end if;

  select role into v_current_role
  from organization_members
  where organization_id = target_org_id and user_id = target_user_id
  for update;

  if not found then
    raise exception 'Member not found';
  end if;

  if v_current_role = 'owner' and target_role <> 'owner' then
    select count(*) into v_owner_count
    from organization_members
    where organization_id = target_org_id and role = 'owner';

    if v_owner_count <= 1 then
      raise exception 'Cannot demote last owner';
    end if;
  end if;

  update organization_members
  set role = target_role
  where organization_id = target_org_id and user_id = target_user_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (
    target_org_id,
    v_actor_id,
    'organization_member',
    target_user_id,
    'member_role_updated',
    jsonb_build_object('role', v_current_role),
    jsonb_build_object('role', target_role)
  );
end;
$$;

create or replace function remove_organization_member(target_org_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_current_role text;
  v_owner_count bigint;
begin
  v_actor_id := require_authenticated_user();

  if not exists (
    select 1 from organization_members om
    where om.organization_id = target_org_id
      and om.user_id = v_actor_id
      and om.role in ('owner', 'admin')
  ) then
    raise exception 'Forbidden: insufficient role';
  end if;

  select role into v_current_role
  from organization_members
  where organization_id = target_org_id and user_id = target_user_id
  for update;

  if not found then
    raise exception 'Member not found';
  end if;

  if v_current_role = 'owner' then
    select count(*) into v_owner_count
    from organization_members
    where organization_id = target_org_id and role = 'owner';

    if v_owner_count <= 1 then
      raise exception 'Cannot remove last owner';
    end if;
  end if;

  delete from organization_members
  where organization_id = target_org_id and user_id = target_user_id;

  insert into audit_logs (organization_id, actor_id, entity_type, entity_id, action, before_data, after_data)
  values (
    target_org_id,
    v_actor_id,
    'organization_member',
    target_user_id,
    'member_removed',
    jsonb_build_object('role', v_current_role),
    null
  );
end;
$$;
