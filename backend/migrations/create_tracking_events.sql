create table if not exists tracking_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid,
  session_id text not null,
  ip_address inet,
  ip_hash text,
  user_agent text,
  referer text,
  device_type text,
  is_bot boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tracking_events_event_type_idx on tracking_events (event_type);
create index if not exists tracking_events_user_id_idx on tracking_events (user_id);
create index if not exists tracking_events_session_id_idx on tracking_events (session_id);
create index if not exists tracking_events_created_at_idx on tracking_events (created_at);
create index if not exists tracking_events_is_bot_idx on tracking_events (is_bot);

