/**
 * The embed URL of one slide's iframe. `enablejsapi=1` lets the IFrame Player
 * API attach to it and `origin` is the page's own origin, which the API checks
 * (add-autoplay-playback design Decision 2). There is no `loop` parameter: the
 * player's loop mode never reports an end, so the controller restarts the video
 * itself (Decision 5).
 */
export function embedUrl(youtubeId: string, origin: string): string {
  return (
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}` +
    `?playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`
  );
}
