import { describe, expect, it } from "vitest";
import { MAX_SHORT_SECONDS, parseList, planLoad, validateEntry } from "./curated.mts";

// Names follow `video-catalog › <Requirement> › <Scenario>` (change add-database-feed).

const entry = (overrides: Record<string, unknown> = {}) => ({
  youtube_id: "AAAAAAAAAAA",
  title: "Garlic pasta",
  channel_name: "Example Kitchen",
  channel_id: "UCexample0001",
  duration_seconds: 42,
  embeddable: true,
  language: "en",
  ...overrides,
});

describe("video-catalog › Invalid list input is not loaded", () => {
  it("› List file missing or not valid JSON: invalid JSON and a non-array are refused", () => {
    expect(parseList("{ not json").ok).toBe(false);
    expect(parseList('{"a":1}')).toEqual({ ok: false, reason: expect.stringContaining("array") });
    expect(parseList("[]")).toEqual({ ok: true, entries: [] });
  });

  it.each([
    ["youtube_id", { youtube_id: undefined }],
    ["a youtube_id that is not 11 characters", { youtube_id: "short" }],
    ["title", { title: "  " }],
    ["channel_name", { channel_name: undefined }],
    ["channel_id", { channel_id: "" }],
    ["duration_seconds", { duration_seconds: undefined }],
    ["a duration that is not a whole number", { duration_seconds: 4.5 }],
    ["embeddable", { embeddable: "yes" }],
    ["language", { language: undefined }],
  ])("› Entry with a missing field (%s) is skipped with its ID and a reason", (_label, overrides) => {
    const plan = planLoad([entry({ youtube_id: "BBBBBBBBBBB" }), entry(overrides)]);

    expect(plan.toWrite.map((video) => video.entry.youtubeId)).toEqual(["BBBBBBBBBBB"]);
    expect(plan.skipped).toHaveLength(1);
    expect(plan.skipped[0].reason).not.toBe("");
  });

  it("logs the entry's own YouTube ID when it has one", () => {
    expect(planLoad([entry({ title: undefined })]).skipped).toEqual([
      { youtubeId: "AAAAAAAAAAA", reason: expect.stringContaining("title") },
    ]);
  });

  it("skips something that is not an object", () => {
    expect(planLoad(["text", null, [1]]).skipped).toHaveLength(3);
  });

  it("› Same YouTube ID twice: the first is loaded and the later one is skipped", () => {
    const plan = planLoad([entry({ title: "First" }), entry({ title: "Second" })]);

    expect(plan.toWrite.map((video) => video.entry.title)).toEqual(["First"]);
    expect(plan.skipped).toEqual([{ youtubeId: "AAAAAAAAAAA", reason: expect.stringContaining("earlier") }]);
  });
});

describe("video-catalog › Curated list loading", () => {
  it("› Short that passes the checks: stored as needs_recipe with the listed values", () => {
    const [video] = planLoad([entry()]).toWrite;

    expect(video).toEqual({
      status: "needs_recipe",
      entry: {
        youtubeId: "AAAAAAAAAAA",
        title: "Garlic pasta",
        channelName: "Example Kitchen",
        channelId: "UCexample0001",
        durationSeconds: 42,
        embeddable: true,
        language: "en",
      },
    });
  });

  it("accepts the longest Short and an English variant", () => {
    const plan = planLoad([entry({ duration_seconds: MAX_SHORT_SECONDS, language: "en-GB" })]);
    expect(plan.toWrite[0].status).toBe("needs_recipe");
  });

  it.each([
    ["too long", { duration_seconds: MAX_SHORT_SECONDS + 1 }],
    ["not embeddable", { embeddable: false }],
    ["not English", { language: "es" }],
  ])("› Short that fails the checks (%s): stored as rejected", (_label, overrides) => {
    const plan = planLoad([entry(overrides)]);

    expect(plan.toWrite.map((video) => video.status)).toEqual(["rejected"]);
    expect(plan.skipped).toEqual([]);
  });

  it("validateEntry keeps the listed values unchanged", () => {
    expect(validateEntry(entry({ title: "Keep  my   spacing" }))).toMatchObject({
      ok: true,
      entry: { title: "Keep  my   spacing" },
    });
  });
});
