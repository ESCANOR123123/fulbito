-- Fichajes compartidos: perfiles, avisos urgentes y denuncias con RLS.
-- Ejecutar después de schema.sql y 002_shared_venue_configuration.sql.

create table if not exists public.player_profiles (
    id uuid primary key default gen_random_uuid(),
    owner_user_id uuid not null unique references auth.users (id) on delete cascade,
    public_name text not null check (char_length(public_name) between 3 and 30),
    phone text not null check (
        regexp_replace(phone, '[[:space:]()]|-', '', 'g') ~ '^((\+|00)?54)?9?0?[1-9][0-9]{1,3}(15)?[0-9]{6,8}$'
    ),
    contact_consent_at timestamptz not null,
    primary_position text not null check (primary_position in ('arquero', 'defensor', 'mediocampista', 'delantero')),
    secondary_position text check (secondary_position is null or secondary_position in ('arquero', 'defensor', 'mediocampista', 'delantero')),
    preferred_foot text not null check (preferred_foot in ('diestro', 'zurdo', 'ambidiestro')),
    level text not null check (level in ('recreativo', 'intermedio', 'competitivo')),
    available_days text[] not null check (
        cardinality(available_days) between 1 and 7
        and available_days <@ array['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']::text[]
    ),
    time_slot text not null check (time_slot in ('tarde', 'noche', 'indistinto')),
    preferred_venue text not null check (preferred_venue in ('central', 'norte', 'indistinta')),
    bio text not null default '' check (char_length(bio) <= 140),
    status text not null default 'active' check (status in ('active', 'paused', 'signed')),
    moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'suspended', 'removed')),
    moderation_note text,
    reviewed_by uuid references auth.users (id) on delete set null,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (secondary_position is null or secondary_position <> primary_position)
);

create index if not exists player_profiles_public_idx
    on public.player_profiles (primary_position, level, preferred_venue, created_at desc)
    where status = 'active' and moderation_status = 'approved';

create table if not exists public.urgent_notices (
    id uuid primary key default gen_random_uuid(),
    captain_user_id uuid not null references auth.users (id) on delete cascade,
    booking_id uuid not null references public.bookings (id) on delete cascade,
    match_date date not null,
    match_time time not null,
    field_name text not null,
    complex text not null,
    needed_position text not null check (needed_position in ('arquero', 'defensor', 'mediocampista', 'delantero', 'cualquiera')),
    level text not null check (level in ('amistoso', 'tranqui', 'fuerte')),
    notes text not null default '' check (char_length(notes) <= 200),
    contact_phone text not null,
    contact_consent_at timestamptz not null,
    expires_at timestamptz not null,
    status text not null default 'open' check (status in ('open', 'filled', 'closed')),
    created_at timestamptz not null default now()
);

create unique index if not exists urgent_notices_one_open_per_booking_idx
    on public.urgent_notices (booking_id) where status = 'open';
create index if not exists urgent_notices_public_idx
    on public.urgent_notices (expires_at, match_date) where status = 'open';

create table if not exists public.player_profile_reports (
    id uuid primary key default gen_random_uuid(),
    player_profile_id uuid not null references public.player_profiles (id) on delete cascade,
    reporter_user_id uuid not null references auth.users (id) on delete cascade,
    reason text not null check (reason in ('contacto_incorrecto', 'contenido_inapropiado', 'perfil_falso', 'otro')),
    details text not null default '' check (char_length(details) <= 240),
    status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
    created_at timestamptz not null default now(),
    unique (player_profile_id, reporter_user_id)
);

create index if not exists player_profile_reports_status_idx
    on public.player_profile_reports (status, created_at desc);

alter table public.player_profiles enable row level security;
alter table public.urgent_notices enable row level security;
alter table public.player_profile_reports enable row level security;

revoke all on public.player_profiles from anon, authenticated;
revoke all on public.urgent_notices from anon, authenticated;
revoke all on public.player_profile_reports from anon, authenticated;

-- El catálogo anónimo solo puede leer perfiles activos, aprobados y con consentimiento.
grant select (id, public_name, phone, primary_position, secondary_position, preferred_foot,
    level, available_days, time_slot, preferred_venue, bio, created_at)
    on public.player_profiles to anon;
grant select on public.player_profiles to authenticated;
grant insert (owner_user_id, public_name, phone, contact_consent_at, primary_position,
    secondary_position, preferred_foot, level, available_days, time_slot, preferred_venue, bio)
    on public.player_profiles to authenticated;
grant update (public_name, phone, contact_consent_at, primary_position, secondary_position,
    preferred_foot, level, available_days, time_slot, preferred_venue, bio, status,
    moderation_status, moderation_note, reviewed_by, reviewed_at, updated_at)
    on public.player_profiles to authenticated;
grant delete on public.player_profiles to authenticated;

-- El rol anónimo solo recibe las columnas públicas y las políticas filtran cada fila.
grant select (id, match_date, match_time, field_name, complex, needed_position,
    level, notes, contact_phone, contact_consent_at, expires_at, status, created_at)
    on public.urgent_notices to anon;
grant select on public.urgent_notices to authenticated;
grant insert (captain_user_id, booking_id, needed_position, level, notes, contact_consent_at)
    on public.urgent_notices to authenticated;
grant update (status, notes) on public.urgent_notices to authenticated;
grant delete on public.urgent_notices to authenticated;

grant select on public.player_profile_reports to authenticated;
grant insert (player_profile_id, reporter_user_id, reason, details)
    on public.player_profile_reports to authenticated;
grant update (status) on public.player_profile_reports to authenticated;

drop policy if exists player_profiles_public_read on public.player_profiles;
create policy player_profiles_public_read on public.player_profiles
for select to anon, authenticated
using (status = 'active' and moderation_status = 'approved' and contact_consent_at is not null);

drop policy if exists player_profiles_owner_read on public.player_profiles;
create policy player_profiles_owner_read on public.player_profiles
for select to authenticated using (owner_user_id = (select auth.uid()));

drop policy if exists player_profiles_admin_read on public.player_profiles;
create policy player_profiles_admin_read on public.player_profiles
for select to authenticated using ((select public.is_admin()));

drop policy if exists player_profiles_owner_insert on public.player_profiles;
create policy player_profiles_owner_insert on public.player_profiles
for insert to authenticated
with check (owner_user_id = (select auth.uid()) and moderation_status = 'pending');

drop policy if exists player_profiles_owner_update on public.player_profiles;
create policy player_profiles_owner_update on public.player_profiles
for update to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

drop policy if exists player_profiles_admin_update on public.player_profiles;
create policy player_profiles_admin_update on public.player_profiles
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists player_profiles_owner_delete on public.player_profiles;
create policy player_profiles_owner_delete on public.player_profiles
for delete to authenticated using (owner_user_id = (select auth.uid()));

create or replace function public.guard_player_profile_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if not (select public.is_admin()) then
        if not (select public.current_user_email_is_verified()) then
            raise exception 'Verificá tu correo antes de publicar un perfil.' using errcode = '42501';
        end if;
        if tg_op = 'INSERT' then
            if new.owner_user_id is distinct from (select auth.uid()) then
                raise exception 'El perfil debe pertenecer a tu cuenta.' using errcode = '42501';
            end if;
            new.status := 'active';
            new.moderation_status := 'pending';
            new.moderation_note := null;
            new.reviewed_by := null;
            new.reviewed_at := null;
        else
            if old.owner_user_id is distinct from (select auth.uid()) then
                raise exception 'Solo podés editar tu propio perfil.' using errcode = '42501';
            end if;
            if old.moderation_status in ('suspended', 'removed') then
                raise exception 'Este perfil está restringido y no se puede editar.' using errcode = '42501';
            end if;
            new.owner_user_id := old.owner_user_id;
            if (new.public_name, new.phone, new.contact_consent_at, new.primary_position,
                new.secondary_position, new.preferred_foot, new.level, new.available_days,
                new.time_slot, new.preferred_venue, new.bio)
                is distinct from
                (old.public_name, old.phone, old.contact_consent_at, old.primary_position,
                old.secondary_position, old.preferred_foot, old.level, old.available_days,
                old.time_slot, old.preferred_venue, old.bio) then
                new.moderation_status := 'pending';
                new.moderation_note := null;
                new.reviewed_by := null;
                new.reviewed_at := null;
            else
                new.moderation_status := old.moderation_status;
                new.moderation_note := old.moderation_note;
                new.reviewed_by := old.reviewed_by;
                new.reviewed_at := old.reviewed_at;
            end if;
        end if;
    end if;
    new.updated_at := now();
    return new;
end;
$$;

revoke all on function public.guard_player_profile_write() from public, anon, authenticated;
drop trigger if exists guard_player_profile_write on public.player_profiles;
create trigger guard_player_profile_write
before insert or update on public.player_profiles
for each row execute function public.guard_player_profile_write();

drop policy if exists urgent_notices_public_read on public.urgent_notices;
create policy urgent_notices_public_read on public.urgent_notices
for select to anon, authenticated
using (status = 'open' and expires_at > now() and contact_consent_at is not null);

drop policy if exists urgent_notices_owner_read on public.urgent_notices;
create policy urgent_notices_owner_read on public.urgent_notices
for select to authenticated using (captain_user_id = (select auth.uid()));

drop policy if exists urgent_notices_admin_read on public.urgent_notices;
create policy urgent_notices_admin_read on public.urgent_notices
for select to authenticated using ((select public.is_admin()));

drop policy if exists urgent_notices_owner_insert on public.urgent_notices;
create policy urgent_notices_owner_insert on public.urgent_notices
for insert to authenticated
with check (captain_user_id = (select auth.uid()) and status = 'open' and contact_consent_at is not null);

drop policy if exists urgent_notices_owner_update on public.urgent_notices;
create policy urgent_notices_owner_update on public.urgent_notices
for update to authenticated
using (captain_user_id = (select auth.uid()))
with check (captain_user_id = (select auth.uid()) and status in ('open', 'filled', 'closed'));

drop policy if exists urgent_notices_admin_update on public.urgent_notices;
create policy urgent_notices_admin_update on public.urgent_notices
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists urgent_notices_owner_delete on public.urgent_notices;
create policy urgent_notices_owner_delete on public.urgent_notices
for delete to authenticated using (captain_user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.prepare_urgent_notice()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    selected_booking public.bookings%rowtype;
    account_phone text;
    match_starts_at timestamptz;
begin
    if new.captain_user_id is distinct from (select auth.uid()) then
        raise exception 'El aviso debe pertenecer a tu cuenta.' using errcode = '42501';
    end if;
    if not (select public.current_user_email_is_verified()) then
        raise exception 'Verificá tu correo antes de publicar un aviso.' using errcode = '42501';
    end if;
    if new.contact_consent_at is null then
        raise exception 'Necesitamos tu consentimiento para compartir el WhatsApp en el aviso.' using errcode = '42501';
    end if;

    select * into selected_booking
    from public.bookings
    where id = new.booking_id and user_id = (select auth.uid());
    if not found then
        raise exception 'Elegí una reserva confirmada de tu cuenta.' using errcode = '42501';
    end if;

    match_starts_at := (selected_booking.booking_date + selected_booking.start_time) at time zone 'America/Argentina/Salta';
    if match_starts_at <= now() then
        raise exception 'La reserva ya pasó.' using errcode = '22023';
    end if;

    select phone into account_phone from public.profiles where id = (select auth.uid());
    if account_phone is null or account_phone = '' then
        raise exception 'Agregá un teléfono a tu cuenta antes de publicar.' using errcode = '22023';
    end if;

    update public.urgent_notices
    set status = 'closed'
    where booking_id = new.booking_id and status = 'open' and expires_at <= now();

    new.match_date := selected_booking.booking_date;
    new.match_time := selected_booking.start_time;
    new.field_name := selected_booking.field_name;
    new.complex := selected_booking.complex;
    new.contact_phone := account_phone;
    new.status := 'open';
    new.expires_at := least(match_starts_at + interval '1 hour', now() + interval '24 hours');
    return new;
end;
$$;

revoke all on function public.prepare_urgent_notice() from public, anon, authenticated;
drop trigger if exists prepare_urgent_notice on public.urgent_notices;
create trigger prepare_urgent_notice
before insert on public.urgent_notices
for each row execute function public.prepare_urgent_notice();

drop policy if exists player_profile_reports_owner_read on public.player_profile_reports;
create policy player_profile_reports_owner_read on public.player_profile_reports
for select to authenticated using (reporter_user_id = (select auth.uid()));

drop policy if exists player_profile_reports_admin_read on public.player_profile_reports;
create policy player_profile_reports_admin_read on public.player_profile_reports
for select to authenticated using ((select public.is_admin()));

drop policy if exists player_profile_reports_create on public.player_profile_reports;
create policy player_profile_reports_create on public.player_profile_reports
for insert to authenticated
with check (
    reporter_user_id = (select auth.uid())
    and not exists (
        select 1 from public.player_profiles p
        where p.id = player_profile_id and p.owner_user_id = (select auth.uid())
    )
);

drop policy if exists player_profile_reports_admin_update on public.player_profile_reports;
create policy player_profile_reports_admin_update on public.player_profile_reports
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists player_profile_reports_owner_delete on public.player_profile_reports;
create policy player_profile_reports_owner_delete on public.player_profile_reports
for delete to authenticated using (reporter_user_id = (select auth.uid()));
