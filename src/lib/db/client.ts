// The shared database client (REC-019, ADR 0007), used by the web app, the
// ingestion job and the tests.
//
// - The app uses the pooled DATABASE_URL, as the read-only role `app_readonly`.
// - Migrations, scripts and the ingestion job use DATABASE_URL_DIRECT, as the
//   owner role. It is set only in GitHub Actions secrets, never in Vercel.
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

export type DbClient = {
  db: Db;
  /** Ends the pool. The app never needs this; scripts and tests do. */
  close(): Promise<void>;
};

function requireUrl(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set. Copy .env.example to .env.local (see docs/development.md).`);
  }
  return value;
}

function connect(url: string, max: number, idleTimeoutMillis: number): DbClient {
  const pool = new Pool({ connectionString: url, max, idleTimeoutMillis });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
}

/**
 * The app's client: read-only, through the pooled connection. A small pool per
 * server instance (3 connections, 10 seconds idle, ADR 0007); REC-002 tunes it
 * with real traffic.
 */
export function createAppDb(url: string | undefined = process.env.DATABASE_URL): DbClient {
  return connect(requireUrl("DATABASE_URL", url), 3, 10_000);
}

/** The owner's client for migrations, scripts and the ingestion job: direct connection. */
export function createDirectDb(url: string | undefined = process.env.DATABASE_URL_DIRECT): DbClient {
  return connect(requireUrl("DATABASE_URL_DIRECT", url), 2, 10_000);
}

let appClient: DbClient | undefined;

/** One app client per server instance, created on first use. */
export function getAppDb(): Db {
  appClient ??= createAppDb();
  return appClient.db;
}
