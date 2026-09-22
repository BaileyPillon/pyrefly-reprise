/**
 * A tiny seeded PRNG (mulberry32) so blink/expression/sway schedules are
 * reproducible in tests and in the diagnostics log, instead of drawing on
 * `Math.random()`. Not cryptographic; not shared with `src/battle/**`'s own
 * seeded RNG (this is presentation-only jitter, never game data).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
