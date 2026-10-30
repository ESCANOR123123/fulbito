-- La Bombonerita: Auth, perfiles y reservas compartidas.
-- Ejecutar una vez en el SQL Editor del proyecto Supabase.

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text not null,
    phone text not null,
    role text not null default 'customer' check (role in ('customer', 'admin')),
    created_at timestamptz not null default now()
);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, phone)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        coalesce(new.raw_user_meta_data ->> 'phone', '')
    );
    return new;
end;
$$;

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    field_id bigint not null,
    field_name text not null,
    complex text not null,
    price integer not null check (price >= 0),
    booking_date date not null,
    start_time time not null,
    player_name text not null,
    phone text not null,
    created_at timestamptz not null default now(),
    constraint bookings_one_per_slot unique (field_id, booking_date, start_time)
);
create index if not exists bookings_user_date_idx on public.bookings (user_id, booking_date, start_time);

-- Exposes occupancy only; names and phone numbers stay in the owner/admin table.
create table if not exists public.booking_slots (
    field_id bigint not null,
    booking_date date not null,
    start_time time not null,
    primary key (field_id, booking_date, start_time)
);

create or replace function public.sync_booking_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' then
        insert into public.booking_slots (field_id, booking_date, start_time)
        values (new.field_id, new.booking_date, new.start_time);
        return new;
    end if;
    delete from public.booking_slots
    where field_id = old.field_id
      and booking_date = old.booking_date
      and start_time = old.start_time;
    return old;
end;
$$;

revoke all on function public.sync_booking_slot() from public, anon, authenticated;
drop trigger if exists on_booking_slot_sync on public.bookings;
create trigger on_booking_slot_sync
after insert or delete on public.bookings
for each row execute function public.sync_booking_slot();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    );
$$;

create or replace function public.current_user_email_is_verified()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from auth.users
        where id = (select auth.uid()) and email_confirmed_at is not null
    );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.current_user_email_is_verified() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_user_email_is_verified() to authenticated;

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_slots enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.bookings from anon, authenticated;
revoke all on public.booking_slots from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, delete on public.bookings to authenticated;
grant select on public.booking_slots to authenticated;

drop policy if exists profiles_read_self on public.profiles;
create policy profiles_read_self on public.profiles
for select to authenticated
using (id = (select auth.uid()));

drop policy if exists bookings_read_owner_or_admin on public.bookings;
create policy bookings_read_owner_or_admin on public.bookings
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists bookings_create_verified_owner on public.bookings;
create policy bookings_create_verified_owner on public.bookings
for insert to authenticated
with check (
    user_id = (select auth.uid())
    and (select public.current_user_email_is_verified())
);

drop policy if exists bookings_cancel_owner_or_admin on public.bookings;
create policy bookings_cancel_owner_or_admin on public.bookings
for delete to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists booking_slots_read_authenticated on public.booking_slots;
create policy booking_slots_read_authenticated on public.booking_slots
for select to authenticated
using (true);
