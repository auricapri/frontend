create table if not exists tax_calculation_history (
  id uuid primary key default gen_random_uuid(),
  request_hash text not null,
  input jsonb not null,
  result jsonb not null,
  data_versions jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tax_calculation_history_created_at_idx on tax_calculation_history (created_at);
create index if not exists tax_calculation_history_request_hash_idx on tax_calculation_history (request_hash);

