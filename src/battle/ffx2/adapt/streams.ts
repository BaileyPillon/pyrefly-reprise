/**
 * FFX-2's own random streams, as the engine draws from them (re-parity RNG lane; **FFX-2 only**: FFX has its own exe, its own
 * generator and its own map, `../../ffx/adapt/streams.ts`).
 *
 * The generator is `kernel/rng.ts` (68 streams, `research/re-ffx2-hit-status.md` section 1). The engine holds one
 * {@link GameStreams} over it and asks for a stream by number. **Which stream a roll uses** (section 1.1 and the AI and timing
 * notes):
 *
 * | Roll | Stream | Source |
 * |---|---|---|
 * | damage variance, the critical roll, ATB start / reset / thinking time, Poison and Regen phase | the unit's own, purpose 0: a party slot + 20, a monster slot + 13 | `re-ffx2-hit-status.md` 1.1; the kernels pass it |
 * | the hit-or-evade roll | the attacker's purpose 1 (+ 16) | same |
 * | status infliction, the shatter roll | the attacker's purpose 2 (+ 32) | same |
 * | the first-strike roll, the reset it triggers | 1 (the roll), the unit's own (the reset) | `re-ffx2-atb-status.md` section 4 |
 * | the target of each hit of a random-target row | 5 (`value % candidates`, ascending slot order, no draw under two) | `re-ffx2-hit-status.md` 2.6 |
 * | Steal, Pilfer Gil, Bribe | 10 and 11 | `re-ffx2-hit-status.md` 5; the kernels pass them |
 * | the kill-reward roll: one draw on 10 at EVERY knock-out (a girl's too), a draw on 11 when an item drops | 10 and 11 | FFX2-G03 4.2 and 6; `kill-rewards.ts` (re-parity RC9, lane X2-C) |
 * | a script's `random()` | 2, the low 16 bits | `re-ffx2-ai-*.md` |
 * | a script's target search (`searchr`, `searchr_nop`) | 4 | `re-ffx2-ai-*.md` |
 * | the item ledger (reserve, refund, commit) and the battle-end commit window | none: no draw | FFX2-G06 section 5 (0 draws in 357,509 vectors), FFX2-G10 sections 10.1 to 10.4 (60,000) |
 *
 * A **run seed** is the game's seed product `p` (`kernel/rng.ts#seedProduct`, the clock fold taken as 0): the 68 states are then
 * what the game's own seeding routine leaves (`seedStates`).
 */

import { GameStreams, type StreamGame } from '../../common/streams.ts';
import { FFX2_RNG_STREAM_COUNT, rngDraw, seedStates } from '../kernel/rng.ts';

/** The streams the boss scripts draw from, global to the battle (`research/re-ffx2-ai-bahamut-vegnagun.md` section 1.3). */
export const Ffx2ScriptStream = {
  /** `random()`: the low 16 bits of one draw. */
  Random: 2,
  /** Every target search: `searchr` (near-weighted) and `searchr_nop` (uniform). */
  Search: 4,
} as const;

/** The FFX-2 generator and seeding, in the shape {@link GameStreams} wants. */
export const FFX2_STREAM_GAME: StreamGame = {
  name: 'FFX-2',
  count: FFX2_RNG_STREAM_COUNT,
  draw: (states, stream) => rngDraw(states, stream),
  seedStates: (runSeed) => seedStates(0, runSeed - 1).states,
};

/** A new FFX-2 battle generator for a run seed. */
export function makeFfx2Rng(seed = 0): GameStreams {
  return new GameStreams(FFX2_STREAM_GAME, seed);
}
