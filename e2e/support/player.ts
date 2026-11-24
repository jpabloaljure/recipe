import type { Page } from "@playwright/test";
import { activeSlide } from "./feed";
import { expect } from "./test";

/**
 * Test side of the fake YouTube player (`youtube-fake.ts`). Reads the players
 * the app created and drives them as a real player would: the video ending,
 * the home cook pausing with the player's own control, the browser refusing
 * unmuted autoplay, and the tab being hidden. Wait for results with
 * `expect.poll` or `expectPlayer`; never with fixed waits (E2E rule 6).
 */

export type FakePlayerInfo = {
  youtubeId: string;
  state: string;
  muted: boolean;
  calls: string[];
};

type FakePlayer = {
  youtubeId: string | null;
  state: number;
  muted: boolean;
  mutedReads: number;
  calls: string[];
  destroyed: boolean;
  _set(state: number): void;
};
type FakeApi = {
  players: FakePlayer[];
  blockUnmutedAutoplay: boolean;
  reportedMuted: boolean | null;
  stateName(code: number): string;
};

// Runs in the page; written inline because Playwright serializes the function.
function liveInfo(youtubeId: string | null) {
  const fake = (window as unknown as { __youTubeFake?: FakeApi }).__youTubeFake;
  if (!fake) return [];
  return fake.players
    .filter((p) => !p.destroyed && (youtubeId === null || p.youtubeId === youtubeId))
    .map((p) => ({
      youtubeId: p.youtubeId as string,
      state: fake.stateName(p.state),
      muted: p.muted,
      calls: [...p.calls],
    }));
}

/** All players the app has created and not destroyed. */
export async function livePlayers(page: Page): Promise<FakePlayerInfo[]> {
  return page.evaluate(liveInfo, null);
}

/** The live player of one video, or `null` while the app has not created it. */
export async function playerOf(page: Page, youtubeId: string): Promise<FakePlayerInfo | null> {
  const found = await page.evaluate(liveInfo, youtubeId);
  return found[0] ?? null;
}

/** Waits until the player exists and shows `state` and `muted`. */
export async function expectPlayer(
  page: Page,
  youtubeId: string,
  expected: { state: string; muted: boolean },
): Promise<void> {
  await expect
    .poll(async () => {
      const player = await playerOf(page, youtubeId);
      return player ? { state: player.state, muted: player.muted } : null;
    })
    .toEqual(expected);
}

/** The video id of the slide the feed considers active. */
export async function activeVideoId(page: Page): Promise<string> {
  await expect(activeSlide(page)).toBeAttached();
  const id = await activeSlide(page).getAttribute("data-youtube-id");
  if (!id) throw new Error("The active slide has no video id");
  return id;
}

/** The video of that slide: the one whose player the app attaches to its iframe. */
export async function videoIdOfSlide(page: Page, index: number): Promise<string> {
  const id = await page.getByTestId("feed-slide").nth(index).getAttribute("data-youtube-id");
  if (!id) throw new Error(`Slide ${index} has no video id`);
  return id;
}

/** How many times the app has read this video's muted state (it polls the active one). */
export async function mutedReads(page: Page, youtubeId: string): Promise<number> {
  return page.evaluate((id) => {
    const fake = (window as unknown as { __youTubeFake: FakeApi }).__youTubeFake;
    return fake.players.find((p) => !p.destroyed && p.youtubeId === id)?.mutedReads ?? 0;
  }, youtubeId);
}

/** From now on every player reports this muted state, whatever its real state (a wrong constant read). */
export async function reportMutedAs(page: Page, muted: boolean): Promise<void> {
  await page.evaluate((value) => {
    (window as unknown as { __youTubeFake: FakeApi }).__youTubeFake.reportedMuted = value;
  }, muted);
}

/** The video reaches its end (the real player reports `ended`). */
export async function emitEnded(page: Page, youtubeId: string): Promise<void> {
  await page.evaluate((id) => {
    const fake = (window as unknown as { __youTubeFake: FakeApi }).__youTubeFake;
    fake.players.find((p) => !p.destroyed && p.youtubeId === id)?._set(0);
  }, youtubeId);
}

/** The home cook pauses with the player's own control: a pause the app did not cause. */
export async function emitUserPause(page: Page, youtubeId: string): Promise<void> {
  await page.evaluate((id) => {
    const fake = (window as unknown as { __youTubeFake: FakeApi }).__youTubeFake;
    fake.players.find((p) => !p.destroyed && p.youtubeId === id)?._set(2);
  }, youtubeId);
}

/** The home cook turns sound on with the player's own control: the player's muted state changes, no app call. */
export async function emitUserUnmute(page: Page, youtubeId: string): Promise<void> {
  await setPlayerMuted(page, youtubeId, false);
}

/** The home cook mutes with the player's own control. */
export async function emitUserMute(page: Page, youtubeId: string): Promise<void> {
  await setPlayerMuted(page, youtubeId, true);
}

async function setPlayerMuted(page: Page, youtubeId: string, muted: boolean): Promise<void> {
  await page.evaluate(
    ({ id, value }) => {
      const fake = (window as unknown as { __youTubeFake: FakeApi }).__youTubeFake;
      const player = fake.players.find((p) => !p.destroyed && p.youtubeId === id);
      if (player) player.muted = value;
    },
    { id: youtubeId, value: muted },
  );
}

/** From now on the browser refuses sound: unmuting a playing video pauses it. */
export async function blockUnmutedAutoplay(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __youTubeFake: FakeApi }).__youTubeFake.blockUnmutedAutoplay = true;
  });
}

/** The browser tab is hidden (`visibilitychange` with `hidden`). */
export async function hideTab(page: Page): Promise<void> {
  await setVisibility(page, "hidden");
}

/** The browser tab is visible again. */
export async function showTab(page: Page): Promise<void> {
  await setVisibility(page, "visible");
}

async function setVisibility(page: Page, state: "hidden" | "visible"): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, "visibilityState", { value, configurable: true });
    Object.defineProperty(document, "hidden", { value: value === "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
}
