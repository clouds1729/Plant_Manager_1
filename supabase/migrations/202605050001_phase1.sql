create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  currency text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  location text,
  client_name text,
  contractor_name text,
  start_date date,
  end_date date,
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  email text,
  tax_id text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete restrict,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  type text not null,
  registration_number text not null,
  category text,
  photo_url text,
  contract_start date,
  contract_end date,
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists plant_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete restrict,
  plant_id uuid not null references plants(id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  lunch_hours numeric(6,2) not null default 0,
  unproductive_hours numeric(6,2) not null default 0,
  unproductive_type text,
  breakdown_hours numeric(6,2) not null default 0,
  gross_hours numeric(6,2) not null default 0,
  billable_hours numeric(6,2) not null default 0,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists plant_logs_unique_plant_date on plant_logs(plant_id, date);
