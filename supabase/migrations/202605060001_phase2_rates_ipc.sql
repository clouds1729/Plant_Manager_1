create table if not exists plant_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  plant_id uuid not null references plants(id) on delete cascade,
  rate numeric(12,2) not null check (rate >= 0),
  unit text not null default 'hour',
  effective_from date not null,
  effective_to date,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint plant_rates_unit_chk check (unit in ('hour', 'day', 'month', 'fixed'))
);

create index if not exists plant_rates_lookup_idx on plant_rates (plant_id, effective_from, effective_to);

create table if not exists ipc_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete restrict,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  ipc_number text,
  status text not null default 'draft',
  subtotal numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ipc_status_chk check (status in ('draft', 'submitted', 'approved', 'paid', 'void', 'finalized')),
  constraint ipc_period_range_chk check (period_end >= period_start)
);

create table if not exists ipc_period_plants (
  id uuid primary key default gen_random_uuid(),
  ipc_period_id uuid not null references ipc_periods(id) on delete cascade,
  plant_id uuid not null references plants(id) on delete cascade,
  unique (ipc_period_id, plant_id)
);

create table if not exists ipc_lines (
  id uuid primary key default gen_random_uuid(),
  ipc_period_id uuid not null references ipc_periods(id) on delete cascade,
  plant_id uuid not null references plants(id) on delete restrict,
  log_id uuid references plant_logs(id) on delete restrict,
  log_date date not null,
  hours numeric(10,2) not null default 0,
  rate numeric(12,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table plant_logs add column if not exists ipc_period_id uuid references ipc_periods(id) on delete set null;
create index if not exists plant_logs_ipc_period_id_idx on plant_logs(ipc_period_id);
