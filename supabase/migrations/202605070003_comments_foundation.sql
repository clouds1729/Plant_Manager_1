create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_org_entity_created_idx on comments (organization_id, entity_type, entity_id, created_at asc);

alter table comments enable row level security;

create policy comments_select_same_org on comments
for select using (is_org_member(organization_id));

create policy comments_insert_same_org on comments
for insert with check (
  auth.uid() is not null
  and is_org_member(organization_id)
  and author_user_id = auth.uid()
);
