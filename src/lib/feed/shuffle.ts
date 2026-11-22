// The light shuffle (API-2, REC-002 design D5): each page the feed receives is
// shuffled once, in the client, so the server response stays the same for
// everyone and cacheable (PERF-6). The random source is injected so tests can
// make the order deterministic.

/** A number in [0, 1), like `Math.random`. */
export type RandomSource = () => number;

/** A new array with the same items in a random order (Fisher-Yates); the input is not changed. */
export function shufflePage<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
