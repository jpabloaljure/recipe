// Vitest global setup for the `db` project: builds a template database from
// the migrations once, so every test file can copy it in milliseconds.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";
import { TEMPLATE_DB, TEST_DB_PREFIX, UNREACHABLE_MESSAGE, adminUrl, urlWithDatabase } from "./config";

const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));
const rolesSql = fileURLToPath(new URL("../../../../scripts/db/setup-roles.sql", import.meta.url));

async function connectAdmin(): Promise<Client> {
  const client = new Client({ connectionString: adminUrl() });
  try {
    await client.connect();
  } catch {
    throw new Error(UNREACHABLE_MESSAGE);
  }
  return client;
}

export async function setup(): Promise<void> {
  const admin = await connectAdmin();
  try {
    // Roles belong to the cluster, not to a database: create them once.
    await admin.query(readFileSync(rolesSql, "utf8"));
    await admin.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${TEMPLATE_DB}`);
  } finally {
    await admin.end();
  }

  // Until the first migration exists the template is simply empty.
  if (existsSync(`${migrationsFolder}/meta/_journal.json`)) {
    const pool = new Pool({ connectionString: urlWithDatabase(adminUrl(), TEMPLATE_DB), max: 1 });
    try {
      await migrate(drizzle(pool), { migrationsFolder });
    } finally {
      await pool.end();
    }
  }
}

export async function teardown(): Promise<void> {
  const admin = new Client({ connectionString: adminUrl() });
  try {
    await admin.connect();
  } catch {
    return; // setup already reported that the database is unreachable
  }
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${TEMPLATE_DB} WITH (FORCE)`);
    // A test file that crashed before cleaning up leaves a copy behind.
    // (starts_with, not LIKE: `_` is a LIKE wildcard and would match `template1`.)
    const { rows } = await admin.query<{ datname: string }>(
      "SELECT datname FROM pg_database WHERE starts_with(datname, $1)",
      [TEST_DB_PREFIX],
    );
    for (const { datname } of rows) {
      console.warn(`Dropping leftover test database ${datname}`);
      await admin.query(`DROP DATABASE IF EXISTS "${datname}" WITH (FORCE)`);
    }
  } finally {
    await admin.end();
  }
}
