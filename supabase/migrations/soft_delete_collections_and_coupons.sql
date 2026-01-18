alter table if exists public.collections
  add column if not exists deleted_at timestamp with time zone,
  add column if not exists deleted_by uuid;

create index if not exists collections_deleted_at_idx on public.collections (deleted_at);

alter table if exists public.coupons
  add column if not exists deleted_at timestamp with time zone,
  add column if not exists deleted_by uuid;

create index if not exists coupons_deleted_at_idx on public.coupons (deleted_at);

