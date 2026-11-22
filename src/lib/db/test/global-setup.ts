// Vitest global setup for the `db` project: builds a template database from
// the migrations once, so every test file can copy it in milliseconds.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";
import type { TestProject } from "vitest/node";
import { assertLocalDatabase } from "../../../../scripts/db/local-only.mts";
import { UNREACHABLE_MESSAGE, adminUrl, fileDbPrefix, templateName, urlWithDatabase } from "./config";
import "./provided";

const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));
const rolesSql = fileURLToPath(new URL("../../../../scripts/db/setup-roles.sql", import.meta.url));

/** Serializes the role creation of two runs starting at once (check-then-create is not atomic). */
const ROLES_LOCK = 7_351_001;

let runId = "";

async function connectAdmin(): Promise<Client> {
  const client = new Client({ connectionString: adminUrl() });
  try {
    await client.connect();
  } catch {
    throw new Error(UNREACHABLE_MESSAGE);
  }
  return client;
}

export async function setup(project: TestProject): Promise<void> {
  // This creates roles with a dev-only password and creates and drops databases.
  assertLocalDatabase(adminUrl(), "TEST_DATABASE_URL");

  runId = randomBytes(4).toString("hex");
  project.provide("testRunId", runId);

  const admin = await connectAdmin();
  try {
    // Roles belong to the cluster, not to a database: create them once.
    await admin.query("SELECT pg_advisory_lock($1)", [ROLES_LOCK]);
    try {
      await admin.query(readFileSync(rolesSql, "utf8"));
    } finally {
      await admin.query("SELECT pg_advisory_unlock($1)", [ROLES_LOCK]);
    }
    await admin.query(`CREATE DATABASE "${templateName(runId)}"`);
  } finally {
    await admin.end();
  }

  const pool = new Pool({ connectionString: urlWithDatabase(adminUrl(), templateName(runId)), max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder });
  } finally {
    await pool.end();
  }
}

export async function teardown(): Promise<void> {
  if (!runId) return; // setup did not get far enough to create anything

  const admin = new Client({ connectionString: adminUrl() });
  try {
    await admin.connect();
  } catch {
    return; // setup already reported that the database is unreachable
  }
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${templateName(runId)}" WITH (FORCE)`);
    // Only this run's own copies: a test file that crashed before cleaning up
    // leaves one behind. Other databases in the cluster are never touched.
    const { rows } = await admin.query<{ datname: string }>(
      "SELECT datname FROM pg_database WHERE starts_with(datname, $1)",
      [fileDbPrefix(runId)],
    );
    for (const { datname } of rows) {
      console.warn(`Dropping leftover test database ${datname}`);
      await admin.query(`DROP DATABASE IF EXISTS "${datname}" WITH (FORCE)`);
    }
  } finally {
    await admin.end();
  }
}
