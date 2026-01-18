create or replace view tracking_events_daily_aggregate as
select
  date_trunc('day', created_at) as date,
  event_type,
  user_id,
  device_type,
  count(*)::bigint as total
from tracking_events
where is_bot = false
group by 1, 2, 3, 4;

create or replace view tracking_events_hourly_aggregate as
select
  date_trunc('hour', created_at) as date,
  event_type,
  device_type,
  count(*)::bigint as total
from tracking_events
where is_bot = false
group by 1, 2, 3;

