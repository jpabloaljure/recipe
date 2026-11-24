/**
 * A small log for diagnosing playback on a real device (REC-003). It does
 * nothing unless the address has `?debug`; then the feed shows the last lines on
 * screen (`DebugLog.tsx`), so a phone's player events can be read without a computer.
 */
const MAX_LINES = 60;

type DebugWindow = Window & { __playerLog?: string[] };

export function debugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).has("debug");
  } catch {
    return false;
  }
}

export function debugLog(message: string): void {
  if (!debugEnabled()) return;
  const w = window as DebugWindow;
  const log = (w.__playerLog ??= []);
  log.push(`${(performance.now() / 1000).toFixed(1)} ${message}`);
  if (log.length > MAX_LINES) log.shift();
  window.dispatchEvent(new Event("playerlog"));
}
