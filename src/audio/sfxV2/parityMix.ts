/**
 * SFX parity, the mix at play time (decision 52i, proposal P1; 52k for the menu tick).
 *
 * `parityTrims.ts` (generated, `tools/audio/sfx-parity-mix.mjs`) holds the trim in dB each (game, cue) takes so
 * its event sits at the level the games' own sound facts give it. This module is the lookup the mixer calls when a
 * `v2:` cue plays from the v2 sprite (`SfxSprites.pick`). A cue with no entry plays as mastered, which is what a
 * HOLD row (52j), a low-evidence row, a cue no row names, and every first-bank cue do. A recorded original from a
 * parity pack is mastered to its own row's target, so it is never trimmed.
 *
 * Pure: no DOM, no Web Audio. Game case (AGENTS.md rule 14): the lookup is by the playing game; a chapter with no
 * game (the title, chapter select, FF7) takes no trim.
 */

import type { MixGame } from './parityDerive.ts';
import { PARITY_TRIMS_DB } from './parityTrims.ts';

/** The two games a trim exists for (`parityDerive.ts` derives the table, `parityTrims.ts` holds it). */
export type TrimGame = MixGame;

/** The trim in dB for a v2 cue (no `v2:` prefix) in a game; 0 when it has none or no game is playing. */
export function parityTrimDb(game: TrimGame | null, cue: string): number {
  if (!game) return 0;
  return PARITY_TRIMS_DB[game][cue] ?? 0;
}

/** The same trim as a linear gain, for the cue's gain node. */
export function parityGain(game: TrimGame | null, cue: string): number {
  const db = parityTrimDb(game, cue);
  return db === 0 ? 1 : 10 ** (db / 20);
}
