-- Queue transactional booking emails. Configure scheduling separately with
-- supabase/schedule_booking_emails.sql after adding the required Vault secrets.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create table if not exists public.booking_email_queue (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid not null references public.bookings (id) on delete cascade,
    email_type text not null check (email_type in ('confirmation', 'reminder_24h', 'reminder_2h')),
    recipient_email text not null,
    scheduled_at timestamptz not null,
    sent_at timestamptz,
    claimed_until timestamptz,
    attempts integer not null default 0,
    last_error text,
    created_at timestamptz not null default now(),
    constraint booking_email_queue_once unique (booking_id, email_type)
);

create index if not exists booking_email_queue_due_idx
    on public.booking_email_queue (scheduled_at)
    where sent_at is null;

alter table public.booking_email_queue enable row level security;
revoke all on public.booking_email_queue from public, anon, authenticated;
grant all on public.booking_email_queue to service_role;

create or replace function public.queue_booking_emails()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    recipient text;
    match_at timestamptz;
begin
    select email into recipient from auth.users where id = new.user_id;
    if recipient is null or recipient = '' then
        return new;
    end if;

    match_at := (new.booking_date + new.start_time) at time zone 'America/Argentina/Buenos_Aires';

    insert into public.booking_email_queue (booking_id, email_type, recipient_email, scheduled_at)
    values (new.id, 'confirmation', recipient, now());

    if match_at - interval '24 hours' > now() then
        insert into public.booking_email_queue (booking_id, email_type, recipient_email, scheduled_at)
        values (new.id, 'reminder_24h', recipient, match_at - interval '24 hours');
    end if;

    if match_at - interval '2 hours' > now() then
        insert into public.booking_email_queue (booking_id, email_type, recipient_email, scheduled_at)
        values (new.id, 'reminder_2h', recipient, match_at - interval '2 hours');
    end if;

    return new;
end;
$$;

revoke all on function public.queue_booking_emails() from public, anon, authenticated;
drop trigger if exists queue_booking_emails_after_insert on public.bookings;
create trigger queue_booking_emails_after_insert
after insert on public.bookings
for each row execute function public.queue_booking_emails();

create or replace function public.claim_booking_emails(batch_size integer default 50)
returns setof public.booking_email_queue
language sql
security definer
set search_path = ''
as $$
    with due as (
        select id
        from public.booking_email_queue
        where sent_at is null
          and scheduled_at <= now()
          and (claimed_until is null or claimed_until < now())
          and attempts < 5
        order by scheduled_at
        limit greatest(1, least(batch_size, 100))
        for update skip locked
    )
    update public.booking_email_queue q
    set claimed_until = now() + interval '10 minutes',
        attempts = q.attempts + 1,
        last_error = null
    from due
    where q.id = due.id
    returning q.*;
$$;

revoke all on function public.claim_booking_emails(integer) from public, anon, authenticated;
grant execute on function public.claim_booking_emails(integer) to service_role;
