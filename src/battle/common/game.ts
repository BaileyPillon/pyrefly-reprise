/**
 * The game-branch guard: FF7 must never fall silently into an FFX or FFX-2 branch.
 *
 * `GameId` gained `'ff7'` on 2026-09-27 (the hidden Guard Scorpion experiment,
 * `docs/plans/ff7-guard-scorpion-architecture.md`). About a hundred sites across
 * `src/` branch two ways, `game === 'ffx' ? A : B`, and would hand FF7 to FFX-2's
 * `B` without a word. Every such site the FF7 path can reach either gets an
 * explicit `'ff7'` answer or narrows through {@link ffxFamily}, which throws a
 * clear error naming the site; the list is `docs/plans/ff7-game-branch-audit.md`.
 *
 * Pure: no DOM, no `three` (layering rule 1). Game case: shared plumbing (both + FF7).
 */

import type { GameId } from './types.ts';

/** The two games the shipped fifteen chapters belong to. */
export type FfxFamilyGame = 'ffx' | 'ffx2';

/** True for FFX and FFX-2, false for FF7. */
export function isFfxFamily(game: GameId): game is FfxFamilyGame {
  return game === 'ffx' || game === 'ffx2';
}

/** Thrown when FF7 reaches code that only knows FFX and FFX-2. */
export class Ff7NotHandledError extends Error {
  constructor(readonly site: string) {
    super(`${site}: FF7 has no branch here (FFX and FFX-2 only). See docs/plans/ff7-game-branch-audit.md.`);
    this.name = 'Ff7NotHandledError';
  }
}

/**
 * Narrow a {@link GameId} to FFX or FFX-2, or throw {@link Ff7NotHandledError}
 * naming `site`. Use it wherever a two-way branch would otherwise take FF7 into
 * the other game's branch.
 */
export function ffxFamily(game: GameId, site: string): FfxFamilyGame {
  if (isFfxFamily(game)) return game;
  throw new Ff7NotHandledError(site);
}
