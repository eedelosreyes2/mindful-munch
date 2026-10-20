-- Runs the weekly-insight Edge Function hourly; it only sends to subscribers for whom it's 6 PM on Sunday.
-- Requires two Vault secrets, created once (values are not stored in the repo):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<same value as the function''s CRON_SECRET>', 'weekly_insight_cron_secret');

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'weekly-insight-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/weekly-insight',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'weekly_insight_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
