-- Slotly MVP schema
-- All business and customer data is protected by row level security.
-- Public customers never read these tables directly; they use the narrow RPCs
-- defined in 20260101000100_public_booking.sql.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) <= 120)
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create a profile for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(left(new.raw_user_meta_data ->> 'full_name', 120), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profiles for users created before this migration ran.
insert into public.profiles (id, full_name)
select u.id, coalesce(left(u.raw_user_meta_data ->> 'full_name', 120), '')
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  category text not null,
  email text not null,
  phone text,
  city text,
  timezone text not null default 'Asia/Kolkata',
  logo_url text,
  booking_mode text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_owner_unique unique (owner_id),
  constraint businesses_slug_unique unique (slug),
  constraint businesses_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint businesses_slug_length check (char_length(slug) between 3 and 48),
  constraint businesses_name_length check (char_length(name) between 2 and 80),
  constraint businesses_description_length check (char_length(description) <= 500),
  constraint businesses_category_length check (char_length(category) between 2 and 40),
  constraint businesses_email_length check (char_length(email) <= 254),
  constraint businesses_phone_length check (phone is null or char_length(phone) <= 24),
  constraint businesses_city_length check (city is null or char_length(city) <= 80),
  constraint businesses_booking_mode_check check (booking_mode in ('auto', 'manual')),
  constraint businesses_timezone_length check (char_length(timezone) between 3 and 64)
);

create index businesses_owner_idx on public.businesses (owner_id);
create index businesses_slug_idx on public.businesses (slug);

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text not null default '',
  duration_minutes integer not null,
  price_minor_units integer,
  buffer_minutes integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_name_length check (char_length(name) between 2 and 80),
  constraint services_description_length check (char_length(description) <= 1000),
  constraint services_duration_range check (duration_minutes between 5 and 480),
  constraint services_buffer_range check (buffer_minutes between 0 and 240),
  constraint services_price_range check (
    price_minor_units is null
    or (price_minor_units >= 0 and price_minor_units <= 100000000)
  )
);

create index services_business_active_idx
  on public.services (business_id, is_active);

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- availability
-- ---------------------------------------------------------------------------

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  weekday smallint not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  constraint availability_rules_weekday_range check (weekday between 0 and 6),
  constraint availability_rules_time_order check (end_time > start_time),
  constraint availability_rules_business_weekday_unique unique (business_id, weekday)
);

create index availability_rules_business_idx
  on public.availability_rules (business_id);

create table public.availability_breaks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  weekday smallint not null,
  start_time time not null,
  end_time time not null,
  label text,
  constraint availability_breaks_weekday_range check (weekday between 0 and 6),
  constraint availability_breaks_time_order check (end_time > start_time),
  constraint availability_breaks_label_length check (
    label is null or char_length(label) <= 60
  ),
  constraint availability_breaks_unique unique (
    business_id, weekday, start_time, end_time
  )
);

create index availability_breaks_business_idx
  on public.availability_breaks (business_id);

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  is_unavailable boolean not null default true,
  reason text,
  constraint availability_exceptions_reason_length check (
    reason is null or char_length(reason) <= 120
  ),
  constraint availability_exceptions_shape check (
    (start_time is null and end_time is null)
    or (
      start_time is not null
      and end_time is not null
      and end_time > start_time
    )
  ),
  constraint availability_exceptions_unavailable_shape check (
    is_unavailable or (start_time is not null and end_time is not null)
  )
);

create index availability_exceptions_business_date_idx
  on public.availability_exceptions (business_id, date);

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  constraint customers_name_length check (char_length(name) between 2 and 80),
  constraint customers_email_length check (email is null or char_length(email) <= 254),
  constraint customers_phone_length check (phone is null or char_length(phone) <= 24),
  constraint customers_contact_present check (email is not null or phone is not null)
);

create index customers_business_idx on public.customers (business_id);
create unique index customers_business_email_key
  on public.customers (business_id, lower(email))
  where email is not null;
create unique index customers_business_phone_key
  on public.customers (business_id, phone)
  where phone is not null;

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  buffer_end_at timestamptz not null,
  status text not null default 'pending',
  customer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_order check (end_at > start_at),
  constraint appointments_buffer_order check (buffer_end_at >= end_at),
  constraint appointments_status_check check (
    status in ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')
  ),
  constraint appointments_notes_length check (
    customer_notes is null or char_length(customer_notes) <= 1000
  ),
  -- Defence in depth: even a privileged insert cannot create overlapping
  -- occupied time (including buffer) for the same business.
  constraint appointments_no_overlap exclude using gist (
    business_id with =,
    tstzrange(start_at, buffer_end_at, '[)') with &&
  ) where (status in ('pending', 'confirmed', 'completed'))
);

create index appointments_business_start_idx
  on public.appointments (business_id, start_at);
create index appointments_business_status_idx
  on public.appointments (business_id, status);
create index appointments_customer_idx
  on public.appointments (customer_id, start_at desc);
create index appointments_service_idx
  on public.appointments (service_id);

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- analytics and abuse prevention
-- ---------------------------------------------------------------------------

create table public.analytics_events (
  id bigint generated always as identity primary key,
  name text not null,
  business_id uuid references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint analytics_events_name_check check (
    name in (
      'owner_registered',
      'onboarding_completed',
      'service_created',
      'availability_configured',
      'booking_page_shared',
      'public_booking_started',
      'booking_submitted',
      'booking_confirmed'
    )
  )
);

create index analytics_events_business_idx
  on public.analytics_events (business_id, created_at desc);

create table public.rate_limit_counters (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_breaks enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.analytics_events enable row level security;
alter table public.rate_limit_counters enable row level security;

-- Profiles: a user can only read and edit their own profile.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Businesses: owners only.
create policy "businesses_select_own"
  on public.businesses for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "businesses_insert_own"
  on public.businesses for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "businesses_update_own"
  on public.businesses for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Services: owners manage services belonging to their business.
create policy "services_select_own"
  on public.services for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = services.business_id and b.owner_id = (select auth.uid())
    )
  );

create policy "services_insert_own"
  on public.services for insert
  to authenticated
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = services.business_id and b.owner_id = (select auth.uid())
    )
  );

create policy "services_update_own"
  on public.services for update
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = services.business_id and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = services.business_id and b.owner_id = (select auth.uid())
    )
  );

create policy "services_delete_own"
  on public.services for delete
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = services.business_id and b.owner_id = (select auth.uid())
    )
  );

-- Availability rules.
create policy "availability_rules_all_own"
  on public.availability_rules for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = availability_rules.business_id
        and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = availability_rules.business_id
        and b.owner_id = (select auth.uid())
    )
  );

-- Recurring breaks.
create policy "availability_breaks_all_own"
  on public.availability_breaks for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = availability_breaks.business_id
        and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = availability_breaks.business_id
        and b.owner_id = (select auth.uid())
    )
  );

-- Date-specific exceptions.
create policy "availability_exceptions_all_own"
  on public.availability_exceptions for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = availability_exceptions.business_id
        and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = availability_exceptions.business_id
        and b.owner_id = (select auth.uid())
    )
  );

-- Customers are readable by the owner, but appointments keep them immutable
-- as history records.
create policy "customers_select_own"
  on public.customers for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = customers.business_id and b.owner_id = (select auth.uid())
    )
  );

create policy "customers_update_own"
  on public.customers for update
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = customers.business_id and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = customers.business_id and b.owner_id = (select auth.uid())
    )
  );

-- Appointments: owners read and manage their own. There is deliberately no
-- insert or delete policy; bookings are created by the security-definer RPC.
create policy "appointments_select_own"
  on public.appointments for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = appointments.business_id and b.owner_id = (select auth.uid())
    )
  );

create policy "appointments_update_own"
  on public.appointments for update
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = appointments.business_id and b.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = appointments.business_id and b.owner_id = (select auth.uid())
    )
  );

-- Analytics are readable by the owning business only.
create policy "analytics_events_select_own"
  on public.analytics_events for select
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = analytics_events.business_id and b.owner_id = (select auth.uid())
    )
  );

-- Rate limit counters are never exposed to clients.
revoke all on table public.rate_limit_counters from anon, authenticated;

-- Public customers must not read private tables at all.
revoke all on table
  public.profiles,
  public.businesses,
  public.services,
  public.availability_rules,
  public.availability_breaks,
  public.availability_exceptions,
  public.customers,
  public.appointments,
  public.analytics_events
from anon;
