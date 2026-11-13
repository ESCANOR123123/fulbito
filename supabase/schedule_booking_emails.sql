-- Run after setting Vault secrets named project_url and service_role_key.
select cron.schedule(
    'send-booking-emails-every-minute',
    '* * * * *',
    $$
    select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-booking-emails',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 10000
    );
    $$
);
