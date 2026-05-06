create table if not exists imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete restrict,
  source_type text not null check (source_type in ('excel', 'scan')),
  file_url text,
  file_name text,
  status text not null default 'uploaded' check (status in ('uploaded', 'parsed', 'reviewed', 'committed', 'cancelled')),
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references imports(id) on delete cascade,
  plant_match_id uuid references plants(id) on delete set null,
  raw_data jsonb not null default '{}'::jsonb,
  parsed_data jsonb not null default '{}'::jsonb,
  validation_status text not null default 'valid' check (validation_status in ('valid', 'warning', 'invalid')),
  conflict_status text not null default 'none' check (conflict_status in ('none', 'conflict')),
  resolution_action text check (resolution_action in ('keep_existing', 'replace_existing', 'skip_imported', 'create_flagged_duplicate')),
  committed_log_id uuid references plant_logs(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists import_rows_import_id_idx on import_rows(import_id);
create index if not exists import_rows_plant_match_id_idx on import_rows(plant_match_id);
