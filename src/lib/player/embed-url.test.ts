import { describe, expect, it } from "vitest";
import { embedUrl } from "./embed-url";

describe("embedUrl", () => {
  it("enables the player API for the page's origin and has no loop parameter", () => {
    const url = new URL(embedUrl("abc_123-XYZ", "https://example.com"));
    expect(url.origin + url.pathname).toBe("https://www.youtube-nocookie.com/embed/abc_123-XYZ");
    expect(url.searchParams.get("enablejsapi")).toBe("1");
    expect(url.searchParams.get("origin")).toBe("https://example.com");
    expect(url.searchParams.get("playsinline")).toBe("1");
    expect(url.searchParams.get("mute")).toBe("1");
    expect(url.searchParams.has("loop")).toBe(false);
  });

  it("encodes the video id", () => {
    expect(embedUrl("a/b", "http://localhost:3000")).toContain("/embed/a%2Fb?");
  });
});
