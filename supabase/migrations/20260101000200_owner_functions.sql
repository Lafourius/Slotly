-- Weekly availability is replaced in one transaction so a partial network
-- failure can never leave an owner with half a schedule.
create or replace function public.save_weekly_availability(
  p_business_id uuid,
  p_days jsonb,
  p_breaks jsonb
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = auth.uid()
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if jsonb_typeof(p_days) <> 'array' or jsonb_typeof(p_breaks) <> 'array' then
    raise exception 'INVALID_INPUT';
  end if;

  delete from public.availability_rules
  where business_id = p_business_id;

  insert into public.availability_rules (
    business_id, weekday, start_time, end_time, is_active
  )
  select
    p_business_id,
    (day ->> 'weekday')::smallint,
    (day ->> 'start_time')::time,
    (day ->> 'end_time')::time,
    true
  from jsonb_array_elements(p_days) as day;

  delete from public.availability_breaks
  where business_id = p_business_id;

  insert into public.availability_breaks (
    business_id, weekday, start_time, end_time, label
  )
  select
    p_business_id,
    (item ->> 'weekday')::smallint,
    (item ->> 'start_time')::time,
    (item ->> 'end_time')::time,
    nullif(item ->> 'label', '')
  from jsonb_array_elements(p_breaks) as item;
end;
$$;

revoke all on function public.save_weekly_availability(uuid, jsonb, jsonb) from public;
grant execute on function public.save_weekly_availability(uuid, jsonb, jsonb)
  to authenticated, service_role;
