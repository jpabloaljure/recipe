// One-time placeholder recipes for the curated Shorts (see src/lib/catalog/recipes.mts).
// Usage:
//   pnpm db:load-recipes              apply the recipes in scripts/db/curated-recipes.json
//   pnpm db:load-recipes --dry-run    show the plan, write nothing
//   pnpm db:load-recipes --revert     put the title and the needs_recipe status back
//   pnpm db:load-recipes --check      only run the read-only health check
// In production it runs as the manual workflow `.github/workflows/load-recipes.yml`.
//
// - Reads and checks both files BEFORE connecting, so a missing or invalid file
//   fails before anything is written.
// - Touches only videos that are still `needs_recipe` (apply) or whose recipe is
//   still the placeholder (revert); everything else is left as it is.
// - Uses DATABASE_URL_DIRECT, the only write credential (ADR 0007).
// - Runs the health check at the end and fails if a catalog rule is broken.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { type CuratedEntry, parseList, validateEntry } from "../../src/lib/catalog/curated.mts";
import { applyRecipes, checkCatalog, revertRecipes } from "../../src/lib/catalog/recipes-load.mts";
import { planRecipes } from "../../src/lib/catalog/recipes.mts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const unknown = [...flags].filter((flag) => !["--dry-run", "--revert", "--check"].includes(flag));
if (unknown.length > 0 || (flags.has("--check") && flags.size > 1)) {
  console.error(`Usage: pnpm db:load-recipes [--dry-run | --revert | --check]${unknown.length > 0 ? ` (unknown: ${unknown.join(", ")})` : ""}`);
  process.exit(1);
}
const mode = flags.has("--check") ? "check" : flags.has("--revert") ? "revert" : "apply";
const dryRun = flags.has("--dry-run");

const readList = (path: string) => {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    console.error(`Cannot read ${path}: ${(error as Error).message}`);
    process.exit(1);
  }
  const parsed = parseList(text);
  if (!parsed.ok) {
    console.error(`${path}: ${parsed.reason}`);
    process.exit(1);
  }
  return parsed.entries;
};

const curated: CuratedEntry[] = [];
for (const raw of readList(fileURLToPath(new URL("./curated-shorts.json", import.meta.url)))) {
  const result = validateEntry(raw);
  if (result.ok) curated.push(result.entry);
}
const plan = planRecipes(readList(fileURLToPath(new URL("./curated-recipes.json", import.meta.url))), curated);
for (const skipped of plan.skipped) console.warn(`Skipped ${skipped.youtubeId}: ${skipped.reason}`);
if (plan.skipped.length > 0) {
  console.error(`${plan.skipped.length} recipe(s) are not valid: fix the file before anything is written.`);
  process.exit(1);
}

if (mode !== "check") {
  console.log(`${plan.toApply.length} recipe(s) planned:`);
  for (const { entry, status, originalTitle } of plan.toApply) {
    console.log(`  ${entry.youtubeId}  ${status.padEnd(8)}  "${originalTitle.slice(0, 40)}" -> "${entry.dish}"`);
  }
}

const url = process.env.DATABASE_URL_DIRECT;
if (!url) {
  console.error("DATABASE_URL_DIRECT is not set. Copy .env.example to .env.local, or set the secret in the workflow.");
  process.exit(1);
}

const client = new Client({ connectionString: url });
let failed = 0;
try {
  await client.connect();
  if (mode === "apply" && !dryRun) {
    const result = await applyRecipes(client, plan);
    console.log(`Applied ${result.applied.length}, already done ${result.alreadyDone.length}, not in the database ${result.notFound.length}, failed ${result.failed.length}.`);
    for (const id of result.notFound) console.warn(`Not in the database: ${id}`);
    for (const item of result.failed) console.error(`Failed ${item.youtubeId}: ${item.reason}`);
    failed += result.failed.length;
  } else if (mode === "revert" && !dryRun) {
    const result = await revertRecipes(client, plan);
    console.log(`Reverted ${result.reverted.length}, not the placeholder ${result.notOurs.length}, not in the database ${result.notFound.length}, failed ${result.failed.length}.`);
    for (const item of result.failed) console.error(`Failed ${item.youtubeId}: ${item.reason}`);
    failed += result.failed.length;
  } else if (dryRun) {
    console.log("Dry run: nothing was written.");
  }

  const check = await checkCatalog(client);
  console.log(`Catalog: ${Object.entries(check.counts).map(([status, n]) => `${status} ${n}`).join(", ") || "empty"}.`);
  for (const problem of check.problems) console.error(`Problem: ${problem}`);
  if (check.problems.length === 0) console.log("Catalog check passed.");
  failed += check.problems.length;
} catch (error) {
  console.error((error as Error).message);
  failed += 1;
} finally {
  await client.end().catch(() => {});
}
process.exit(failed === 0 ? 0 : 1);
