/**
 * The first seed of a chapter run (PR-0008; decisions-2026-09-25 item 5, option B).
 *
 * **Both games (shared plumbing).** Every first attempt used to fight on seed 1, so every
 * newcomer's first Chapter 1 was the same fight, and seed 1 loses it under both the intended
 * line and the advisor. A run the player starts now draws a fresh seed; a retry still adds
 * 1000 per attempt (`BattleScreenFlow.runChapter`). The odds per attempt do not change: the
 * seed only picks which of the fight's own rolls come up. It is our plumbing, not game data.
 *
 * Tests and the critic keep fixed seeds: any caller that passes `RunChapterOptions.seed`
 * gets exactly that seed, and `window.__pyrefly.setSeed(n)` pins every later run started
 * from real keys to `n` (see `docs/DEV.md`).
 *
 * Layering: no `three`, no DOM. `Math.random` is fine here: this is the one place a run's
 * seed is chosen, outside `src/battle/`, whose engines stay deterministic under it.
 */

/** Largest drawn seed; leaves room for the retry's `+ attempt * 1000` in 32 bits. */
export const MAX_DRAWN_SEED = 0x7fff_0000;

let pinned: number | null = null;

/**
 * Pin every later drawn seed to `seed` (the debug API's `setSeed`), or `null` to draw fresh
 * seeds again.
 */
export function pinRunSeed(seed: number | null): void {
  pinned = seed === null ? null : seed | 0;
}

/** The pinned seed, or `null` while runs draw fresh ones. */
export function pinnedRunSeed(): number | null {
  return pinned;
}

/** The first seed of a run that did not name one: the pinned seed, else a fresh one in 1..MAX. */
export function drawRunSeed(random: () => number = Math.random): number {
  if (pinned !== null) return pinned;
  return 1 + Math.floor(random() * MAX_DRAWN_SEED);
}
