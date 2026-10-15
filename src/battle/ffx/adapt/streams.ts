/**
 * FFX's own random streams, as the engine draws from them (re-parity RNG lane; **FFX only**: FFX-2 has its own exe, its own
 * generator and its own map, `../../ffx2/adapt/streams.ts`).
 *
 * The generator is `kernel/rng.ts` (68 streams, `research/re-ffx-rng-hit.md` section 1). The engine holds one
 * {@link GameStreams} over it and asks for a stream by number. **Which stream a roll uses** (section 2 and the lanes' notes):
 *
 * | Roll | Stream | Source |
 * |---|---|---|
 * | damage variance, critical roll, Escape, the opening CTB | the roller's own, mode 0: party slot + 20, every aeon and party slot 7: 27, a monster slot + 8 (28 to 35) | `re-ffx-rng-hit.md` 2 |
 * | the hit-or-evade roll | the user's mode 1 (+ 16) | same |
 * | status infliction, extra statuses, shatter, Threaten | the user's mode 2 (+ 32) | same |
 * | steal success and amount | 10; the rare slot 11 (loot and drops are the engine's own model, on `BattleRng.aux`) | `re-ffx-rng-hit.md` 2 |
 * | a script's `GetRandomValue` | 2, `& 0xFFFF`; one stream for every script and actor | `re-ffx-rng-hit.md` 2, `re-ffx-ai-*.md` |
 * | a script's actor picker (`findMatchingChr`), and a Berserk or Confuse target | 4, `% candidates`, ascending actor order, no draw under two | `re-ffx-ai-*.md`; Berserk and Confuse: `pp_BtlPickAutoTarget` (0x007996d0) |
 * | the targets of a random-target command, one draw per hit | 5, the same picker | `pp_BtlBuildTargetHits` (0x0078ba70) |
 * | a Reflect bounce | 6, the same picker | same |
 * | a Mix result's auto-target: one ally by the single picker, or one group by the group pick | 4 for the single pick (a draw only with two or more candidates); 5 for the group pick (one draw for any non-empty side), then 5 per hit of a multi-hit result | `FFX-G05` section 5, `pp_BtlAutoTarget` (0x007996d0); `mix.ts` |
 * | an Overdrive result's hit removal (Slice and Dice's Fail, Lulu's Fury with fewer casts), one draw per hit taken away | 16, `value % (targets holding the most hits)` | `FFX-G01` section 8 (0x007afe00) |
 * | Chapter VIII's scene and camera draws, the Fins' caption | 2, counted (`ai/airship-scenes.ts`) | the formation scripts |
 * | Wakka's Attack Reels result | 19, **named but not drawn yet**: the engine takes the player's reel input from `BattleRng.aux` | `re-ffx-rng-hit.md` 2 (the anchor map), `re-ffx-ai-evrae-yojimbo-isaaru-sin.md` (0x007b1b50 is the reel builder) |
 *
 * A **run seed** is the game's seed product `k` (`kernel/rng.ts#seedProduct`, the clock byte taken as 1): the 68 states are then
 * what the game's own seeding routine leaves (`seedStates`).
 */

import { GameStreams, type StreamGame } from '../../common/streams.ts';
import type { FFXCombatant } from '../../common/types.ts';
import { RNG_STREAM_COUNT, rngNextState, rngOutput, rngStreamIndex, seedProduct, seedStates } from '../kernel/rng.ts';
import type { Ctx } from '../state.ts';
import { slotOf } from './slots.ts';

/** The streams that do not depend on a character (`research/re-ffx-rng-hit.md` section 2, and the lane notes named there). */
export const FfxStream = {
  /** A script's `GetRandomValue()`: `value & 0xFFFF`. */
  Script: 2,
  /** A script's `findMatchingChr` pick, and the target of a forced (Berserk, Confuse) single-target action: `value % count`. */
  Picker: 4,
  /** The target of each hit of a random-target command. */
  RandomTarget: 5,
  /** A Reflect bounce's target. */
  Reflect: 6,
  /** An Overdrive result's hit removal: `value % (the number of targets holding the most hits)`, one draw for each hit taken away (re-parity RC4 lane B). */
  OverdriveRemoval: 16,
  /** Steal success (and Pilfer's amount): `value % 255`. */
  Steal: 10,
  /** The rare-slot roll: `value & 0xff`. */
  StealSlot: 11,
  /** Wakka's Attack Reels result. Named for the stream map; nothing draws it yet (the player's reel input is a stand-in on `BattleRng.aux`). */
  Reels: 19,
} as const;

/** The FFX generator and seeding, in the shape {@link GameStreams} wants. */
export const FFX_STREAM_GAME: StreamGame = {
  name: 'FFX',
  count: RNG_STREAM_COUNT,
  draw(states, stream) {
    const next = rngNextState(stream, states[stream] ?? 0);
    states[stream] = next;
    return rngOutput(next);
  },
  seedStates: (runSeed) => seedStates(seedProduct(1, runSeed - 1)),
};

/** A new FFX battle generator for a run seed. */
export function makeFfxRng(seed = 0): GameStreams {
  return new GameStreams(FFX_STREAM_GAME, seed);
}

/** The three streams one character rolls on (`pp_BtlRngStreamIndex`, FFX.exe 0x0078d210). */
export interface UserStreams {
  /** Mode 0: damage variance, the critical roll, Escape, the opening CTB. */
  damage: number;
  /** Mode 1: the hit-or-evade roll. */
  hit: number;
  /** Mode 2: status infliction, extra statuses, shatter, Threaten. */
  status: number;
}

/** The streams of a character in game slot `slot`; `aeon` is the character's aeon flag (the exe's gender-bit byte). */
export function userStreams(slot: number, aeon: boolean): UserStreams {
  return { damage: rngStreamIndex(slot, 0, aeon), hit: rngStreamIndex(slot, 1, aeon), status: rngStreamIndex(slot, 2, aeon) };
}

/** What a one-stream generator is asked for: it ignores the stream, so no slot is looked up for it (a rig with ids the game has no slot for). */
const ONE_STREAM: UserStreams = { damage: 0, hit: 0, status: 0 };

/** The streams of an engine combatant (its game slot, `slots.ts`); a game generator gets an error for a combatant with no slot. */
export function streamsOf(ctx: Ctx, c: FFXCombatant): UserStreams {
  if (ctx.rng.streamCount === 1) return ONE_STREAM;
  return userStreams(slotOf(ctx, c), c.side === 'aeon');
}
