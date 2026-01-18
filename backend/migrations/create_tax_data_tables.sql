create table if not exists tax_data_cache (
  key text primary key,
  payload jsonb not null,
  source_version text,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists tax_data_cache_expires_at_idx on tax_data_cache (expires_at);

create table if not exists tax_sync_queue (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  payload jsonb,
  status text not null default 'pending',
  attempts int not null default 0,
  max_attempts int not null default 5,
  run_after timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tax_sync_queue_status_run_after_idx on tax_sync_queue (status, run_after);

create table if not exists tax_data_versions (
  name text primary key,
  version text not null,
  updated_at timestamptz not null default now()
);

