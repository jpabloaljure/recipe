import type { FeedItem } from "./types";

/**
 * Stub feed data served by `GET /api/feed` until REC-002 reads the database.
 *
 * Real, public, embeddable English cooking Shorts, with the title and channel
 * name YouTube reports for each (checked with YouTube's oEmbed endpoint on
 * 2026-11-20). Every item is title-only (`recipe: null`), so no invented
 * recipe ever reaches users (REC-001 re-check #49).
 */
export const FIXTURE_ITEMS: readonly FeedItem[] = [
  {
    youtubeId: "3iz773UH9O8",
    title: "3 Ingredient Shortbread Cookies Recipe #shorts",
    channelName: "Bigger Bolder Baking with Gemma Stafford",
    recipe: null,
  },
  {
    youtubeId: "4fje-Lh-6Yg",
    title: "Only 3-Ingredient Cookie Cake - Dished #Shorts",
    channelName: "Dished Shorts",
    recipe: null,
  },
  {
    youtubeId: "uSrg6ve07R0",
    title: "3-Ingredient Chicken Patties 🐔🔥🙌 #Shorts",
    channelName: "ketosnackz",
    recipe: null,
  },
  {
    youtubeId: "T_I7vs90MDM",
    title: "3 Ingredient Biscuit Recipe - #easyrecipe #homeingredients #baking #food #breakfast #recipe",
    channelName: "Fantabulosity",
    recipe: null,
  },
  {
    youtubeId: "arrE3144Yfc",
    title: "3-Ingredient Protein Fudge 🍫😋 #Shorts",
    channelName: "ketosnackz",
    recipe: null,
  },
  {
    youtubeId: "P9BzERwaeVA",
    title: "3-ingredient Cookie Cups!!! #recipe #easy #beginners #cookies",
    channelName: "COCO-NAHD by Dhan Tandel",
    recipe: null,
  },
  {
    youtubeId: "QH-cV7McHrQ",
    title: "cooking easy recipe #shorts",
    channelName: "ShareeLynPW on Food Etc.",
    recipe: null,
  },
];
