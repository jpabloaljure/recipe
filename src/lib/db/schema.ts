// The video catalog schema (REC-019, ADR 0003 and 0007). The target design is
// docs/architecture/data-model.md; the rules the database enforces are in
// openspec/changes/add-video-catalog-schema/specs/video-catalog/spec.md.
//
// Not declared here (Drizzle cannot express them), so they live in
// hand-written SQL migrations: the feed-entry trigger and its check
// constraint, the `rejected` rule, the `updated_at` triggers and the grants.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const videoStatus = pgEnum("video_status", [
  "ready",
  "needs_recipe",
  "not_easy",
  "unavailable",
  "rejected",
]);

export const recipeSource = pgEnum("recipe_source", ["description", "comment", "captions"]);

export const video = pgTable(
  "video",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    youtubeId: text("youtube_id").notNull().unique(),
    title: text("title").notNull(),
    channelId: text("channel_id").notNull(),
    channelName: text("channel_name"),
    // The three candidate facts (ING-2) are empty only for a `rejected` video.
    durationSeconds: integer("duration_seconds"),
    embeddable: boolean("embeddable"),
    language: text("language"),
    status: videoStatus("status").notNull(),
    // Set by the database (a trigger, migration 0001); millisecond precision
    // so it survives a JS Date round trip in the feed cursor.
    enteredFeedAt: timestamp("entered_feed_at", { withTimezone: true, precision: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "video_candidate_facts_required",
      sql`${table.status} = 'rejected' or (${table.durationSeconds} is not null and ${table.embeddable} is not null and ${table.language} is not null)`,
    ),
    // The feed query: newest first by (entered_feed_at, id), filtered by status.
    index("video_feed_idx").on(table.status, table.enteredFeedAt, table.id),
  ],
);

export const recipe = pgTable(
  "recipe",
  {
    videoId: integer("video_id")
      .primaryKey()
      .references(() => video.id, { onDelete: "cascade" }),
    servings: text("servings"),
    // Ordered lists. The database checks they are lists; the shape of each item
    // (an ingredient's name, EXT-3) and completeness (EXT-5) belong to extraction.
    ingredients: jsonb("ingredients").notNull(),
    steps: jsonb("steps").notNull(),
    source: recipeSource("source").notNull(),
    // Raw "easy" facts (EXT-4), kept so the thresholds can change later.
    ingredientCount: integer("ingredient_count").notNull(),
    estimatedActiveMinutes: integer("estimated_active_minutes").notNull(),
    specialEquipment: text("special_equipment").array().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("recipe_ingredients_is_list", sql`jsonb_typeof(${table.ingredients}) = 'array'`),
    check("recipe_steps_is_list", sql`jsonb_typeof(${table.steps}) = 'array'`),
  ],
);
