import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Local development reads .env.local; CI and GitHub Actions set the variables.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// Migrations always run as the owner role through the direct connection
// (ADR 0007). `generate` needs no database, so the URL is optional here.
const url = process.env.DATABASE_URL_DIRECT;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  ...(url ? { dbCredentials: { url } } : {}),
});
