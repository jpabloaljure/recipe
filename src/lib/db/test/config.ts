// Shared settings for the database tests (ADR 0007).

/** Name of the template database the migrations are applied to once. */
export const TEMPLATE_DB = "template_catalog";

/** Prefix of every per-file database, so leftovers are easy to find. */
export const TEST_DB_PREFIX = "t_";

/** The cluster the tests create their databases in (an owner/superuser URL). */
export function adminUrl(): string {
  return process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:54329/postgres";
}

/** The same cluster and credentials, a different database. */
export function urlWithDatabase(url: string, database: string): string {
  const next = new URL(url);
  next.pathname = `/${database}`;
  return next.toString();
}

/** The same cluster, a different role (for the read-only tests). */
export function urlAsRole(url: string, role: string, password: string, database: string): string {
  const next = new URL(urlWithDatabase(url, database));
  next.username = role;
  next.password = password;
  return next.toString();
}

/** The dev-only password set by scripts/db/setup-roles.sql. */
export const READONLY_ROLE = "app_readonly";
export const READONLY_PASSWORD = "app_readonly";

export const UNREACHABLE_MESSAGE =
  "Cannot reach the test database. Start Postgres with `pnpm db:up` " +
  "(or set TEST_DATABASE_URL to a Postgres 17 you can create databases in).";
