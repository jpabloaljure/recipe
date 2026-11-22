// The feed query (REC-002, design D1 and D4): one page of `ready` and
// `needs_recipe` videos, newest first by (entered_feed_at, id), with a keyset
// cursor. It reads one row past the page, so an exactly full last page already
// reports no more pages.
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { recipe, video } from "../db/schema";
import { encodeCursor, type FeedPosition } from "./cursor";
import { toRecipe } from "./recipe";
import type { FeedItem, FeedPage, Recipe } from "./types";

export const PAGE_SIZE = 10;

/** Reads one page after `after` (`null` for the first page). */
export type FeedQuery = (after: FeedPosition | null) => Promise<FeedPage>;

export function createFeedQuery(db: Db): FeedQuery {
  return async (after) => {
    const rows = await db
      .select({
        id: video.id,
        youtubeId: video.youtubeId,
        title: video.title,
        channelName: video.channelName,
        enteredFeedAt: video.enteredFeedAt,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        source: recipe.source,
        hasRecipe: recipe.videoId,
      })
      .from(video)
      .leftJoin(recipe, eq(recipe.videoId, video.id))
      .where(
        and(
          inArray(video.status, ["ready", "needs_recipe"]),
          after
            ? sql`(${video.enteredFeedAt}, ${video.id}) < (${after.enteredFeedAt}, ${after.id})`
            : undefined,
        ),
      )
      .orderBy(desc(video.enteredFeedAt), desc(video.id))
      .limit(PAGE_SIZE + 1);

    const pageRows = rows.slice(0, PAGE_SIZE);
    const items: FeedItem[] = pageRows.map((row) => {
      // No recipe row (a left join gives nulls): a title-only video.
      let found: Recipe | null = null;
      if (row.hasRecipe !== null && row.source !== null) {
        found = toRecipe({ servings: row.servings, ingredients: row.ingredients, steps: row.steps, source: row.source });
        // A row that exists but is malformed is served title-only, and logged so it can be fixed.
        if (found === null) console.error(`Video ${row.youtubeId} has a malformed recipe; served without it.`);
      }
      return { youtubeId: row.youtubeId, title: row.title, channelName: row.channelName, recipe: found };
    });

    let nextCursor: string | null = null;
    if (rows.length > PAGE_SIZE) {
      const last = pageRows[pageRows.length - 1];
      // The database rejects a feed video without this time (REC-019), so a
      // missing one means the data is broken: fail loudly, not with a bad cursor.
      if (!last.enteredFeedAt) throw new Error(`Feed video ${last.id} has no feed-entry time.`);
      nextCursor = encodeCursor({ enteredFeedAt: last.enteredFeedAt, id: last.id });
    }
    return { items, nextCursor };
  };
}
