-- Fotos, enlaces y opiniones públicas de los perfiles de Fichajes.

alter table public.player_profiles drop constraint if exists player_profiles_bio_check;
alter table public.player_profiles drop constraint if exists player_profiles_bio_length;
alter table public.player_profiles
    add constraint player_profiles_bio_length check (char_length(bio) <= 600);

alter table public.player_profiles
    add column if not exists avatar_url text,
    add column if not exists full_body_photo_url text,
    add column if not exists video_url text,
    add column if not exists instagram_url text,
    add column if not exists tiktok_url text;

alter table public.player_profiles
    drop constraint if exists player_profiles_avatar_url_length,
    drop constraint if exists player_profiles_full_body_photo_url_length,
    drop constraint if exists player_profiles_video_url_valid,
    drop constraint if exists player_profiles_instagram_url_valid,
    drop constraint if exists player_profiles_tiktok_url_valid;

alter table public.player_profiles
    add constraint player_profiles_avatar_url_length check (avatar_url is null or char_length(avatar_url) <= 500),
    add constraint player_profiles_full_body_photo_url_length check (full_body_photo_url is null or char_length(full_body_photo_url) <= 500),
    add constraint player_profiles_video_url_valid check (video_url is null or (char_length(video_url) <= 500 and video_url ~* '^https://(www\.)?(youtube\.com|youtu\.be|instagram\.com|tiktok\.com)(/|$)')),
    add constraint player_profiles_instagram_url_valid check (instagram_url is null or (char_length(instagram_url) <= 500 and instagram_url ~* '^https://(www\.)?instagram\.com(/|$)')),
    add constraint player_profiles_tiktok_url_valid check (tiktok_url is null or (char_length(tiktok_url) <= 500 and tiktok_url ~* '^https://(www\.)?tiktok\.com(/|$)'));

grant select (avatar_url, full_body_photo_url, video_url, instagram_url, tiktok_url)
    on public.player_profiles to anon;
grant insert (avatar_url, full_body_photo_url, video_url, instagram_url, tiktok_url)
    on public.player_profiles to authenticated;
grant update (avatar_url, full_body_photo_url, video_url, instagram_url, tiktok_url)
    on public.player_profiles to authenticated;

create table if not exists public.player_profile_reviews (
    id uuid primary key default gen_random_uuid(),
    player_profile_id uuid not null references public.player_profiles (id) on delete cascade,
    reviewer_user_id uuid not null references auth.users (id) on delete cascade,
    stars smallint not null check (stars between 1 and 5),
    comment text not null check (char_length(comment) between 10 and 500),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (player_profile_id, reviewer_user_id)
);

create index if not exists player_profile_reviews_public_idx
    on public.player_profile_reviews (player_profile_id, created_at desc);

alter table public.player_profile_reviews enable row level security;
revoke all on public.player_profile_reviews from anon, authenticated;

grant select (id, player_profile_id, stars, comment, created_at)
    on public.player_profile_reviews to anon;
grant select on public.player_profile_reviews to authenticated;
grant insert (player_profile_id, reviewer_user_id, stars, comment)
    on public.player_profile_reviews to authenticated;
grant update (stars, comment, updated_at)
    on public.player_profile_reviews to authenticated;

-- La política pública necesita consultar columnas de moderación que anon no puede leer.
-- Esta función devuelve solo un booleano y ejecuta esa comprobación con permisos controlados.
create or replace function public.is_public_player_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.player_profiles as p
        where p.id = $1
            and p.status = 'active'
            and p.moderation_status = 'approved'
            and p.contact_consent_at is not null
    );
$$;

revoke all on function public.is_public_player_profile(uuid) from public, anon, authenticated;
grant execute on function public.is_public_player_profile(uuid) to anon, authenticated;

drop policy if exists player_profile_reviews_public_read on public.player_profile_reviews;
create policy player_profile_reviews_public_read on public.player_profile_reviews
for select to anon, authenticated
using (public.is_public_player_profile(player_profile_id));

drop policy if exists player_profile_reviews_owner_read on public.player_profile_reviews;
create policy player_profile_reviews_owner_read on public.player_profile_reviews
for select to authenticated
using (reviewer_user_id = (select auth.uid()));

drop policy if exists player_profile_reviews_verified_insert on public.player_profile_reviews;
create policy player_profile_reviews_verified_insert on public.player_profile_reviews
for insert to authenticated
with check (
    reviewer_user_id = (select auth.uid())
    and (select public.current_user_email_is_verified())
    and exists (
        select 1 from public.player_profiles p
        where p.id = player_profile_id and p.owner_user_id <> (select auth.uid())
            and p.status = 'active' and p.moderation_status = 'approved'
    )
);

drop policy if exists player_profile_reviews_owner_update on public.player_profile_reviews;
create policy player_profile_reviews_owner_update on public.player_profile_reviews
for update to authenticated
using (reviewer_user_id = (select auth.uid()))
with check (
    reviewer_user_id = (select auth.uid())
    and (select public.current_user_email_is_verified())
);

-- El guardado de fotos queda aislado por carpeta de usuario.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-photos', 'player-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists player_photos_public_read on storage.objects;
create policy player_photos_public_read on storage.objects
for select to public using (bucket_id = 'player-photos');

drop policy if exists player_photos_owner_insert on storage.objects;
create policy player_photos_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'player-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists player_photos_owner_update on storage.objects;
create policy player_photos_owner_update on storage.objects
for update to authenticated
using (bucket_id = 'player-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'player-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists player_photos_owner_delete on storage.objects;
create policy player_photos_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'player-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

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
                new.time_slot, new.preferred_venue, new.bio, new.avatar_url,
                new.full_body_photo_url, new.video_url, new.instagram_url, new.tiktok_url)
                is distinct from
                (old.public_name, old.phone, old.contact_consent_at, old.primary_position,
                old.secondary_position, old.preferred_foot, old.level, old.available_days,
                old.time_slot, old.preferred_venue, old.bio, old.avatar_url,
                old.full_body_photo_url, old.video_url, old.instagram_url, old.tiktok_url) then
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

create or replace function public.guard_player_profile_review_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if not (select public.current_user_email_is_verified()) then
        raise exception 'Verificá tu correo para dejar una opinión.' using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' then
        if old.reviewer_user_id is distinct from (select auth.uid()) then
            raise exception 'Solo podés editar tu propia opinión.' using errcode = '42501';
        end if;
    else
        if new.reviewer_user_id is distinct from (select auth.uid()) then
            raise exception 'La opinión debe pertenecer a tu cuenta.' using errcode = '42501';
        end if;
    end if;
    if exists (
        select 1 from public.player_profiles p where p.id = new.player_profile_id
            and p.owner_user_id = (select auth.uid())
    ) then
        raise exception 'No podés calificar tu propio perfil.' using errcode = '42501';
    end if;
    new.updated_at := now();
    return new;
end;
$$;

revoke all on function public.guard_player_profile_review_write() from public, anon, authenticated;
drop trigger if exists guard_player_profile_review_write on public.player_profile_reviews;
create trigger guard_player_profile_review_write
before insert or update on public.player_profile_reviews
for each row execute function public.guard_player_profile_review_write();

notify pgrst, 'reload schema';
