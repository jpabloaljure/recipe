// The feed query (REC-002, design D1 and D4): one page of `ready` and
// `needs_recipe` videos, newest first by (entered_feed_at, id), with a keyset
// cursor. It reads one row past the page, so an exactly full last page already
// reports no more pages.
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { recipe, video } from "../db/schema";
import { encodeCursor, type FeedPosition } from "./cursor";
import type { FeedItem, FeedPage, Ingredient, Recipe } from "./types";

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
    const items: FeedItem[] = pageRows.map((row) => ({
      youtubeId: row.youtubeId,
      title: row.title,
      channelName: row.channelName,
      recipe:
        row.hasRecipe === null || row.source === null
          ? null
          : ({
              servings: row.servings,
              ingredients: row.ingredients as Ingredient[],
              steps: row.steps as string[],
              source: row.source,
            } satisfies Recipe),
    }));

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
