-- Public booking surface.
--
-- Read RPCs are callable by anon and return only public information.
-- create_public_booking is callable by the server (service_role) only: the
-- Next.js server action validates the requested slot with the same engine used
-- to render availability, then this function re-checks invariants and inserts
-- atomically. This keeps one implementation of the availability rules while
-- the database still guarantees that no two bookings can overlap, even under
-- concurrent requests.

-- ---------------------------------------------------------------------------
-- Public business profile + active services
-- ---------------------------------------------------------------------------

create or replace function public.get_public_business(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_business public.businesses;
  v_services jsonb;
begin
  if v_slug = '' then
    return null;
  end if;

  select * into v_business
  from public.businesses
  where slug = v_slug;

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'duration_minutes', s.duration_minutes,
        'price_minor_units', s.price_minor_units
      )
      order by s.created_at asc
    ),
    '[]'::jsonb
  )
  into v_services
  from public.services s
  where s.business_id = v_business.id and s.is_active;

  return jsonb_build_object(
    'business', jsonb_build_object(
      'id', v_business.id,
      'name', v_business.name,
      'slug', v_business.slug,
      'description', v_business.description,
      'category', v_business.category,
      'city', v_business.city,
      'timezone', v_business.timezone,
      'logo_url', v_business.logo_url,
      'booking_mode', v_business.booking_mode
    ),
    'services', v_services
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Booking context for one service
-- ---------------------------------------------------------------------------

create or replace function public.get_public_booking_context(
  p_slug text,
  p_service_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_business public.businesses;
  v_service public.services;
  v_services jsonb;
  v_rules jsonb;
  v_breaks jsonb;
  v_exceptions jsonb;
  v_busy jsonb;
begin
  if v_slug = '' or p_service_id is null then
    return null;
  end if;

  select * into v_business
  from public.businesses
  where slug = v_slug;

  if not found then
    return null;
  end if;

  select * into v_service
  from public.services
  where id = p_service_id
    and business_id = v_business.id
    and is_active;

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'duration_minutes', s.duration_minutes,
        'price_minor_units', s.price_minor_units
      )
      order by s.created_at asc
    ),
    '[]'::jsonb
  )
  into v_services
  from public.services s
  where s.business_id = v_business.id and s.is_active;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'weekday', r.weekday,
        'start_time', to_char(r.start_time, 'HH24:MI'),
        'end_time', to_char(r.end_time, 'HH24:MI')
      )
      order by r.weekday
    ),
    '[]'::jsonb
  )
  into v_rules
  from public.availability_rules r
  where r.business_id = v_business.id and r.is_active;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'weekday', b.weekday,
        'start_time', to_char(b.start_time, 'HH24:MI'),
        'end_time', to_char(b.end_time, 'HH24:MI')
      )
      order by b.weekday, b.start_time
    ),
    '[]'::jsonb
  )
  into v_breaks
  from public.availability_breaks b
  where b.business_id = v_business.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(e.date, 'YYYY-MM-DD'),
        'start_time', case when e.start_time is null then null else to_char(e.start_time, 'HH24:MI') end,
        'end_time', case when e.end_time is null then null else to_char(e.end_time, 'HH24:MI') end,
        'is_unavailable', e.is_unavailable
      )
      order by e.date
    ),
    '[]'::jsonb
  )
  into v_exceptions
  from public.availability_exceptions e
  where e.business_id = v_business.id
    and e.date between current_date - 1 and current_date + 120;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'start_at', a.start_at,
        'buffer_end_at', a.buffer_end_at
      )
      order by a.start_at
    ),
    '[]'::jsonb
  )
  into v_busy
  from public.appointments a
  where a.business_id = v_business.id
    and a.status in ('pending', 'confirmed', 'completed')
    and a.buffer_end_at > now() - interval '1 day'
    and a.start_at < now() + interval '120 days';

  return jsonb_build_object(
    'business', jsonb_build_object(
      'id', v_business.id,
      'name', v_business.name,
      'slug', v_business.slug,
      'description', v_business.description,
      'category', v_business.category,
      'city', v_business.city,
      'timezone', v_business.timezone,
      'logo_url', v_business.logo_url,
      'booking_mode', v_business.booking_mode
    ),
    'service', jsonb_build_object(
      'id', v_service.id,
      'name', v_service.name,
      'description', v_service.description,
      'duration_minutes', v_service.duration_minutes,
      'buffer_minutes', v_service.buffer_minutes,
      'price_minor_units', v_service.price_minor_units,
      'is_active', v_service.is_active
    ),
    'services', v_services,
    'rules', v_rules,
    'breaks', v_breaks,
    'exceptions', v_exceptions,
    'busy', v_busy
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Atomic booking creation
-- ---------------------------------------------------------------------------

create or replace function public.create_public_booking(
  p_slug text,
  p_service_id uuid,
  p_start_at timestamptz,
  p_name text,
  p_email text,
  p_phone text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_business public.businesses;
  v_service public.services;
  v_name text := btrim(coalesce(p_name, ''));
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'), '');
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  v_status text;
  v_end_at timestamptz;
  v_buffer_end_at timestamptz;
  v_customer_id uuid;
  v_appointment_id uuid;
  v_reference text;
begin
  if v_slug = '' or p_service_id is null or p_start_at is null then
    raise exception 'INVALID_INPUT';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'INVALID_INPUT';
  end if;

  if v_email is null and v_phone is null then
    raise exception 'EMAIL_OR_PHONE_REQUIRED';
  end if;

  if v_email is not null and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'INVALID_EMAIL';
  end if;

  if v_phone is not null and (char_length(v_phone) < 6 or char_length(v_phone) > 19) then
    raise exception 'INVALID_PHONE';
  end if;

  if v_notes is not null and char_length(v_notes) > 1000 then
    raise exception 'INVALID_INPUT';
  end if;

  select * into v_business
  from public.businesses
  where slug = v_slug;

  if not found then
    raise exception 'BUSINESS_NOT_FOUND';
  end if;

  select * into v_service
  from public.services
  where id = p_service_id
    and business_id = v_business.id
    and is_active;

  if not found then
    raise exception 'SERVICE_UNAVAILABLE';
  end if;

  if p_start_at <= now() then
    raise exception 'INVALID_SLOT';
  end if;

  if p_start_at > now() + interval '120 days' then
    raise exception 'INVALID_SLOT';
  end if;

  -- Serialise bookings for this business for the duration of the transaction.
  -- This removes the check-then-insert race between concurrent customers.
  perform pg_advisory_xact_lock(hashtextextended(v_business.id::text, 0));

  v_end_at := p_start_at + make_interval(mins => v_service.duration_minutes);
  v_buffer_end_at := p_start_at
    + make_interval(mins => v_service.duration_minutes + v_service.buffer_minutes);
  v_status := case when v_business.booking_mode = 'auto' then 'confirmed' else 'pending' end;

  if exists (
    select 1
    from public.appointments a
    where a.business_id = v_business.id
      and a.status in ('pending', 'confirmed', 'completed')
      and tstzrange(a.start_at, a.buffer_end_at, '[)')
          && tstzrange(p_start_at, v_buffer_end_at, '[)')
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  -- Reuse the customer record for this business when contact details match.
  if v_email is not null or v_phone is not null then
    select c.id into v_customer_id
    from public.customers c
    where c.business_id = v_business.id
      and (
        (v_email is not null and lower(c.email) = v_email)
        or (v_phone is not null and c.phone = v_phone)
      )
    order by c.created_at asc
    limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers (business_id, name, email, phone)
    values (v_business.id, v_name, v_email, v_phone)
    returning id into v_customer_id;
  end if;

  insert into public.appointments (
    business_id,
    service_id,
    customer_id,
    start_at,
    end_at,
    buffer_end_at,
    status,
    customer_notes
  )
  values (
    v_business.id,
    v_service.id,
    v_customer_id,
    p_start_at,
    v_end_at,
    v_buffer_end_at,
    v_status,
    v_notes
  )
  returning id into v_appointment_id;

  v_reference := 'SLT-' || upper(substr(replace(v_appointment_id::text, '-', ''), 1, 6));

  insert into public.analytics_events (name, business_id)
  values ('booking_submitted', v_business.id);

  if v_status = 'confirmed' then
    insert into public.analytics_events (name, business_id)
    values ('booking_confirmed', v_business.id);
  end if;

  return jsonb_build_object(
    'id', v_appointment_id,
    'status', v_status,
    'start_at', p_start_at,
    'end_at', v_end_at,
    'reference', v_reference,
    'service_name', v_service.name,
    'business_name', v_business.name,
    'business_slug', v_business.slug,
    'timezone', v_business.timezone,
    'booking_mode', v_business.booking_mode
  );

exception
  when exclusion_violation then
    raise exception 'SLOT_TAKEN';
  when unique_violation then
    raise exception 'SLOT_TAKEN';
end;
$$;

-- ---------------------------------------------------------------------------
-- Slug availability (authenticated onboarding only)
-- ---------------------------------------------------------------------------

create or replace function public.slug_available(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    lower(btrim(coalesce(p_slug, ''))) ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(btrim(coalesce(p_slug, ''))) between 3 and 48
    and not exists (
      select 1 from public.businesses b
      where b.slug = lower(btrim(coalesce(p_slug, '')))
    );
$$;

-- ---------------------------------------------------------------------------
-- Rate limiting (server only)
-- ---------------------------------------------------------------------------

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  if p_bucket is null or p_bucket = '' or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  v_window := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_counters (bucket, window_start, hits)
  values (p_bucket, v_window, 1)
  on conflict (bucket, window_start)
  do update set hits = public.rate_limit_counters.hits + 1
  returning hits into v_hits;

  -- Opportunistic cleanup keeps the table small without a cron job.
  delete from public.rate_limit_counters
  where window_start < now() - interval '1 day';

  return v_hits <= p_limit;
end;
$$;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------

revoke all on function public.get_public_business(text) from public;
revoke all on function public.get_public_booking_context(text, uuid) from public;
revoke all on function public.create_public_booking(text, uuid, timestamptz, text, text, text, text) from public;
revoke all on function public.slug_available(text) from public;
revoke all on function public.consume_rate_limit(text, integer, integer) from public;

grant execute on function public.get_public_business(text) to anon, authenticated, service_role;
grant execute on function public.get_public_booking_context(text, uuid) to anon, authenticated, service_role;
grant execute on function public.slug_available(text) to authenticated, service_role;

-- Booking writes and rate limiting are server-only. Public customers reach
-- them through validated Next.js server actions, never directly.
grant execute on function public.create_public_booking(text, uuid, timestamptz, text, text, text, text) to service_role;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
