CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('daily-celebrations') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-celebrations');

SELECT cron.schedule(
  'daily-celebrations',
  '30 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--70289993-40f6-4a2c-9ace-0cfb4fde1d4d.lovable.app/api/public/daily-celebrations',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_PnCS8s3oiN863ehskPNDng_uD0KlEgi"}'::jsonb,
    body := '{"source": "pg_cron"}'::jsonb
  ) as request_id;
  $$
);