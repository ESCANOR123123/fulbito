-- Compartir la configuración de canchas y bloqueos entre dispositivos.
-- Ejecutar después de schema.sql en el SQL Editor de Supabase.

create table if not exists public.fields (
    id bigint primary key,
    name text not null,
    complex text not null,
    surface_type text not null,
    capacity text not null,
    price integer not null check (price >= 0),
    active boolean not null default true,
    updated_at timestamptz not null default now()
);

insert into public.fields (id, name, complex, surface_type, capacity, price)
values
    (1, 'Cancha 1', 'Sede Central', 'Césped Sintético', '5 vs 5', 5000),
    (2, 'Cancha 2', 'Sede Central', 'Césped Natural', '7 vs 7', 7000),
    (3, 'Cancha 3', 'Sede Norte', 'Césped Sintético', '5 vs 5', 5000),
    (4, 'Cancha 4', 'Sede Norte', 'Césped Sintético', '8 vs 8', 8000)
on conflict (id) do nothing;

create table if not exists public.blocked_slots (
    id uuid primary key default gen_random_uuid(),
    field_id bigint not null references public.fields (id) on delete cascade,
    blocked_date date not null,
    start_time time not null,
    reason text not null default 'Mantenimiento',
    created_by uuid not null default auth.uid() references auth.users (id),
    created_at timestamptz not null default now(),
    constraint blocked_slots_one_per_slot unique (field_id, blocked_date, start_time)
);
create index if not exists blocked_slots_date_idx
    on public.blocked_slots (field_id, blocked_date, start_time);

alter table public.fields enable row level security;
alter table public.blocked_slots enable row level security;

revoke all on public.fields from anon, authenticated;
revoke all on public.blocked_slots from anon, authenticated;
grant select on public.fields to anon, authenticated;
grant insert, update, delete on public.fields to authenticated;
grant select, insert, delete on public.blocked_slots to authenticated;

drop policy if exists fields_read_active_public on public.fields;
create policy fields_read_active_public on public.fields
for select to anon using (active);

drop policy if exists fields_read_active_or_admin on public.fields;
create policy fields_read_active_or_admin on public.fields
for select to authenticated using (active or (select public.is_admin()));

drop policy if exists fields_admin_manage on public.fields;
create policy fields_admin_manage on public.fields
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists blocked_slots_read_authenticated on public.blocked_slots;
create policy blocked_slots_read_authenticated on public.blocked_slots
for select to authenticated using (true);

drop policy if exists blocked_slots_admin_manage on public.blocked_slots;
create policy blocked_slots_admin_manage on public.blocked_slots
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Validate reservations server-side so UI tampering cannot book paused or blocked slots.
create or replace function public.validate_booking_field_and_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    selected_field record;
begin
    select name, complex, price into selected_field
    from public.fields
    where id = new.field_id and active;

    if not found then
        raise exception 'La cancha no existe o no está activa.' using errcode = '23503';
    end if;

    if exists (
        select 1 from public.blocked_slots
        where field_id = new.field_id
          and blocked_date = new.booking_date
          and start_time = new.start_time
    ) then
        raise exception 'El horario está bloqueado.' using errcode = '23P01';
    end if;

    new.field_name := selected_field.name;
    new.complex := selected_field.complex;
    new.price := selected_field.price;
    return new;
end;
$$;

revoke all on function public.validate_booking_field_and_block() from public, anon, authenticated;
drop trigger if exists validate_booking_before_insert on public.bookings;
create trigger validate_booking_before_insert
before insert on public.bookings
for each row execute function public.validate_booking_field_and_block();
