-- Read-only access for the app (REC-019, ADR 0007, spec: video-catalog). The
-- app, and so every Vercel preview, connects as `app_readonly`: it can read the
-- app's tables and nothing else.
--
-- The role is created before the migrations run: by scripts/db/setup-roles.sql
-- locally and in CI, and with SQL in Neon's SQL editor on Neon (see
-- docs/development.md). This migration only grants.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_readonly') THEN
    RAISE EXCEPTION 'The role app_readonly does not exist. Create it first: scripts/db/setup-roles.sql locally, docs/development.md on Neon.';
  END IF;
END
$$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO app_readonly;
--> statement-breakpoint
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;
--> statement-breakpoint
-- Tables created by later migrations are readable too. Default privileges
-- belong to the role that creates the tables, and Neon's owner role has a
-- project-specific name, so the migrating role is looked up, not hardcoded.
-- Migrations must always run as the same role (the owner, through the direct
-- connection).
DO $$
BEGIN
  EXECUTE format(
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT ON TABLES TO app_readonly',
    current_user
  );
END
$$;
