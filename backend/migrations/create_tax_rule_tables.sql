create table if not exists tax_ipi_rates (
  id uuid primary key default gen_random_uuid(),
  ncm text not null,
  rate numeric not null,
  is_active boolean not null default true,
  valid_from date,
  valid_to date,
  updated_at timestamptz not null default now()
);

create index if not exists tax_ipi_rates_ncm_active_idx on tax_ipi_rates (ncm, is_active);

create table if not exists tax_iss_rates (
  id uuid primary key default gen_random_uuid(),
  city_ibge text not null,
  service_code text,
  rate numeric not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists tax_iss_rates_city_active_idx on tax_iss_rates (city_ibge, is_active);

create table if not exists tax_st_rules (
  id uuid primary key default gen_random_uuid(),
  origin_state text,
  destination_state text not null,
  ncm text not null,
  cest text,
  mva numeric not null,
  internal_rate numeric not null,
  interstate_rate numeric,
  fcp_rate numeric,
  is_active boolean not null default true,
  valid_from date,
  valid_to date,
  updated_at timestamptz not null default now()
);

create index if not exists tax_st_rules_lookup_idx on tax_st_rules (destination_state, ncm, cest, is_active);

