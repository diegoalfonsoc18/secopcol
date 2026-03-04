-- Habilitar la extension pg_cron (ya viene incluida en Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Dar permisos a postgres para usar cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Programar check-alerts cada 30 minutos
-- Invoca la edge function via HTTP usando pg_net
SELECT cron.schedule(
  'check-alerts-every-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/check-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
