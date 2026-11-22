import { describe, expect, test } from "vitest";
import { buildSeedGroups } from "./seed-rows.mts";

const videos = buildSeedGroups().flat();
const inFeed = (status: string) => status === "ready" || status === "needs_recipe";

describe("seed rows", () => {
  test("every YouTube ID is unique and 11 characters", () => {
    const ids = videos.map((v) => v.youtubeId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toHaveLength(11);
  });

  test("only ready videos have a recipe", () => {
    for (const v of videos) expect(Boolean(v.recipe)).toBe(v.status === "ready");
  });

  test("every status appears, and more than one page of videos is in the feed", () => {
    expect(new Set(videos.map((v) => v.status))).toEqual(
      new Set(["ready", "needs_recipe", "not_easy", "unavailable", "rejected"]),
    );
    expect(videos.filter((v) => inFeed(v.status)).length).toBeGreaterThan(10);
  });

  test("a group of tied videos exists, and groups outnumber ties so an order exists", () => {
    const groups = buildSeedGroups();
    expect(groups.some((g) => g.length > 1)).toBe(true);
    expect(groups.length).toBeGreaterThan(3);
  });
});
