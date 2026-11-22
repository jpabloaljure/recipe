// Writes a load plan (REC-002, design D7). Each video is its own statement, not
// one big transaction: if a run fails partway, the rows already written stay,
// and a re-run skips them (`ON CONFLICT DO NOTHING`, ING-3). The database sets
// the feed-entry time, so it is never sent. Nothing already stored is changed.
import type { Client } from "pg";
import type { LoadPlan } from "./curated.mts";

export type LoadResult = { inserted: number; alreadyStored: number };

export async function writePlan(client: Pick<Client, "query">, plan: LoadPlan): Promise<LoadResult> {
  let inserted = 0;
  let alreadyStored = 0;
  for (const { entry, status } of plan.toWrite) {
    const result = await client.query(
      `INSERT INTO video (youtube_id, title, channel_id, channel_name, duration_seconds, embeddable, language, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (youtube_id) DO NOTHING`,
      [
        entry.youtubeId,
        entry.title,
        entry.channelId,
        entry.channelName,
        entry.durationSeconds,
        entry.embeddable,
        entry.language,
        status,
      ],
    );
    if (result.rowCount === 1) inserted += 1;
    else alreadyStored += 1;
  }
  return { inserted, alreadyStored };
}
