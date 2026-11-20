/**
 * Response types of the feed API. The contract is docs/api/openapi.yaml
 * (REC-021); keep these types and that file in sync in review.
 *
 * Every field is always present: a field with no value is `null`, never left
 * out. There is no internal `id`: `youtubeId` is the item's key.
 */

/** One ingredient, stored as written in the source (amounts are not scaled). */
export type Ingredient = {
  name: string;
  /** For example "1/2" or "a pinch". */
  quantity: string | null;
  /** For example "cup"; `null` for "salt to taste". */
  unit: string | null;
};

/** Where a recipe came from (EXT-6). */
export type RecipeSource = "description" | "comment" | "captions";

export type Recipe = {
  /** As written in the source, for example "2" or "2–3". */
  servings: string | null;
  ingredients: Ingredient[];
  /** Step texts in order; the position is the step number. */
  steps: string[];
  source: RecipeSource;
};

export type FeedItem = {
  /** The YouTube video ID: unique, the client's list key, and the embed ID. */
  youtubeId: string;
  title: string;
  /** The channel's display name, crediting the creator. */
  channelName: string | null;
  /** `null` for a title-only (`needs_recipe`) video. */
  recipe: Recipe | null;
};

export type FeedPage = {
  /** Up to 10 items, newest first by feed-entry time. */
  items: FeedItem[];
  /** Opaque cursor for the next page; `null` on the last page. */
  nextCursor: string | null;
};

export type ApiErrorCode = "invalid_cursor" | "not_found" | "internal_error";

/** Body of every error the app's routes produce (400, 404, 5xx). */
export type ApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

/** Where the feed client gets its pages from. */
export interface FeedSource {
  /** `null` asks for the first page; otherwise pass a page's `nextCursor` unchanged. */
  getPage(cursor: string | null): Promise<FeedPage>;
}
