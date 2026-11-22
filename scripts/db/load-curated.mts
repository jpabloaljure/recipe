// Loads the curated list of Shorts into the database (REC-002, design D7).
// Usage: `pnpm db:load-curated [path-to-list.json]`; in production it runs as the
// manual workflow `.github/workflows/load-curated.yml`.
//
// - Reads and checks the whole list BEFORE connecting, so a missing file or
//   invalid JSON fails before anything is written.
// - Stores each Short that passes the ING-2 checks as `needs_recipe`, and one
//   that fails them as `rejected` (never shown in the feed).
// - Skips, and logs with its YouTube ID, an entry that lacks a field or repeats
//   an ID. Videos already in the database are left as they are (ING-3).
// - Uses DATABASE_URL_DIRECT, the only write credential (ADR 0007).
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { parseList, planLoad } from "../../src/lib/catalog/curated.mts";
import { writePlan } from "../../src/lib/catalog/load.mts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const listPath = process.argv[2] ?? fileURLToPath(new URL("./curated-shorts.json", import.meta.url));

let text: string;
try {
  text = readFileSync(listPath, "utf8");
} catch (error) {
  console.error(`Cannot read the list file ${listPath}: ${(error as Error).message}`);
  process.exit(1);
}
const parsed = parseList(text);
if (!parsed.ok) {
  console.error(`${listPath}: ${parsed.reason}`);
  process.exit(1);
}

const url = process.env.DATABASE_URL_DIRECT;
if (!url) {
  console.error("DATABASE_URL_DIRECT is not set. Copy .env.example to .env.local, or set the secret in the workflow.");
  process.exit(1);
}

const plan = planLoad(parsed.entries);
for (const { youtubeId, reason } of plan.skipped) console.warn(`Skipped ${youtubeId}: ${reason}`);

const client = new Client({ connectionString: url });
try {
  await client.connect();
  const result = await writePlan(client, plan);
  const rejected = plan.toWrite.filter((video) => video.status === "rejected").length;
  console.log(
    `Loaded ${result.inserted} new video(s) (${rejected} of the list are rejected by the ING-2 checks), ` +
      `${result.alreadyStored} already stored, ${plan.skipped.length} skipped.`,
  );
} catch (error) {
  console.error(`The load stopped: ${(error as Error).message}`);
  console.error("Rows already written stay; run it again to load the rest.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
