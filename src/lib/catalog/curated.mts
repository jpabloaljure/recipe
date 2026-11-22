// The curated-list loader's rules (REC-002, design D7), as pure functions so
// unit tests need no database. `scripts/db/load-curated.mts` reads the file
// and `load.mts` writes; this file only decides what each entry becomes.
//
// ING-2 (PRD 6.4): only Shorts-length videos (at most 3 minutes) that are
// embeddable and in English are candidates; the others are stored `rejected`.

/** The longest a Short can be (PRD ING-2). */
export const MAX_SHORT_SECONDS = 180;

export type CuratedEntry = {
  youtubeId: string;
  title: string;
  channelName: string;
  channelId: string;
  durationSeconds: number;
  embeddable: boolean;
  language: string;
};

export type PlannedVideo = { entry: CuratedEntry; status: "needs_recipe" | "rejected" };
export type SkippedEntry = { youtubeId: string; reason: string };
export type LoadPlan = { toWrite: PlannedVideo[]; skipped: SkippedEntry[] };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** The list file's text as a list of raw entries, or why it cannot be used. */
export function parseList(text: string): { ok: true; entries: unknown[] } | { ok: false; reason: string } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return { ok: false, reason: `the list is not valid JSON (${(error as Error).message})` };
  }
  if (!Array.isArray(value)) return { ok: false, reason: "the list must be a JSON array of entries" };
  return { ok: true, entries: value };
}

const isText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/** An entry with everything the schema needs, or the first thing it lacks. */
export function validateEntry(raw: unknown): { ok: true; entry: CuratedEntry } | SkippedEntry & { ok: false } {
  const object = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const rawId = object?.youtube_id;
  const id = typeof rawId === "string" ? rawId : "(no youtube_id)";
  const fail = (reason: string) => ({ ok: false as const, youtubeId: id, reason });

  if (!object) return fail("the entry is not an object");
  if (typeof rawId !== "string" || !YOUTUBE_ID.test(rawId)) return fail("youtube_id is missing or is not 11 characters of A-Z a-z 0-9 _ -");
  if (!isText(object.title)) return fail("title is missing");
  if (!isText(object.channel_name)) return fail("channel_name is missing");
  if (!isText(object.channel_id)) return fail("channel_id is missing");
  const seconds = object.duration_seconds;
  if (typeof seconds !== "number" || !Number.isInteger(seconds) || seconds <= 0) {
    return fail("duration_seconds is missing or is not a positive whole number");
  }
  if (typeof object.embeddable !== "boolean") return fail("embeddable is missing or is not true or false");
  if (!isText(object.language)) return fail("language is missing");

  return {
    ok: true,
    entry: {
      youtubeId: rawId,
      title: object.title,
      channelName: object.channel_name,
      channelId: object.channel_id,
      durationSeconds: seconds,
      embeddable: object.embeddable,
      language: object.language,
    },
  };
}

/** True when the entry passes the ING-2 candidate checks. */
export function passesCandidateChecks(entry: CuratedEntry): boolean {
  const english = entry.language.toLowerCase() === "en" || entry.language.toLowerCase().startsWith("en-");
  return entry.durationSeconds <= MAX_SHORT_SECONDS && entry.embeddable && english;
}

/**
 * What to do with each raw entry: write it (`needs_recipe`, or `rejected` when
 * it fails ING-2) or skip it with a reason. The first of a repeated YouTube ID
 * wins; a later one is skipped.
 */
export function planLoad(rawEntries: readonly unknown[]): LoadPlan {
  const toWrite: PlannedVideo[] = [];
  const skipped: SkippedEntry[] = [];
  const seen = new Set<string>();
  for (const raw of rawEntries) {
    const result = validateEntry(raw);
    if (!result.ok) {
      skipped.push({ youtubeId: result.youtubeId, reason: result.reason });
      continue;
    }
    const { entry } = result;
    if (seen.has(entry.youtubeId)) {
      skipped.push({ youtubeId: entry.youtubeId, reason: "the same youtube_id appears earlier in the list" });
      continue;
    }
    seen.add(entry.youtubeId);
    toWrite.push({ entry, status: passesCandidateChecks(entry) ? "needs_recipe" : "rejected" });
  }
  return { toWrite, skipped };
}
