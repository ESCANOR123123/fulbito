-- Corrige la lectura pública de opiniones sin exponer columnas de moderación.
-- Aplicar después de 005_fichajes_perfiles_ampliados.sql.

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

notify pgrst, 'reload schema';
