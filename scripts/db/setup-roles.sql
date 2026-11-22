-- Creates the read-only role the app connects with (ADR 0007), for a LOCAL
-- or CI Postgres. Safe to run more than once. Run it as the owner/superuser
-- before the migrations: `pnpm db:setup`.
--
-- On Neon this script is not used: the role is created with SQL in Neon's SQL
-- editor (not from the Console's roles page) with a real password; see
-- docs/development.md. The password below is for local development only.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_readonly') THEN
    CREATE ROLE app_readonly LOGIN PASSWORD 'app_readonly';
  END IF;
END
$$;
