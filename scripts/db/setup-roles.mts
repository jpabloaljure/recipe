// Runs scripts/db/setup-roles.sql against DATABASE_URL_DIRECT (a local or CI
// Postgres; see docs/development.md). Usage: `pnpm db:setup`.
import { existsSync, readFileSync } from "node:fs";
import { Client } from "pg";
import { assertLocalDatabase } from "./local-only.mts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.DATABASE_URL_DIRECT;
if (!url) {
  console.error("DATABASE_URL_DIRECT is not set. Copy .env.example to .env.local.");
  process.exit(1);
}
// The role below has a dev-only password: never create it on Neon (docs/development.md).
try {
  assertLocalDatabase(url, "DATABASE_URL_DIRECT");
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const sql = readFileSync(new URL("./setup-roles.sql", import.meta.url), "utf8");
const client = new Client({ connectionString: url });
try {
  await client.connect();
  await client.query(sql);
  console.log("Roles ready (app_readonly).");
} catch (error) {
  console.error(`Could not run setup-roles.sql: ${(error as Error).message}`);
  console.error("Is the database running? Try `pnpm db:up`.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
