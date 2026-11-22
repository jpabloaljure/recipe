import { describe, expect, it } from "vitest";
import { shufflePage } from "./shuffle";

/** A repeatable random source (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("shufflePage", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

  it("holds exactly the same items", () => {
    expect([...shufflePage(items, seeded(1))].sort()).toEqual([...items].sort());
  });

  it("does not change its input", () => {
    const copy = [...items];
    shufflePage(items, seeded(2));
    expect(items).toEqual(copy);
  });

  it("gives the same order for the same random source, and a different one for another", () => {
    expect(shufflePage(items, seeded(3))).toEqual(shufflePage(items, seeded(3)));
    expect(shufflePage(items, seeded(3))).not.toEqual(shufflePage(items, seeded(4)));
  });

  it("keeps the order when the source always returns the top of its range", () => {
    expect(shufflePage(items, () => 0.999999)).toEqual(items);
  });

  it("handles empty and one-item pages", () => {
    expect(shufflePage([], seeded(1))).toEqual([]);
    expect(shufflePage(["a"], seeded(1))).toEqual(["a"]);
  });
});
