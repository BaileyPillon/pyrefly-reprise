/**
 * FFX-2 status infliction kernels: the entry point.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69):
 * `pp_status_roll_g1` 0x00619230 (`./statusGroup1.ts`), `pp_status_roll_g2` 0x00619700
 * (`./statusGroup2.ts`), and the shatter roll that follows them inside the damage orchestrator
 * 0x006172c0. Spec: `research/re-ffx2-hit-status.md` section 4. Pure, no DOM, no engine types. The engine
 * rolls a strike's statuses and the shatter through it (`resolve-strike.ts`) and reconciles its own statuses
 * with the result buffer (`resolve-status.ts`). Randomness comes from a `draw(stream)` callback (see `./rng.ts`).
 *
 * The landing rule, the same in both groups: for every status the command gives a chance `c` (a byte;
 * the larger of the command's and the weapon's when the command uses character properties), unless the
 * command is a cleanse the roll is
 *
 *     lands  iff  c == 255,  or  (r != 255 and (c == 254 or  draw % 101 < c + 5 * (lvA - lvT) - r))
 *
 * with `r` the target's resist byte for that status and `lvA`, `lvT` the two levels. Note `% 101`, not
 * `% 100`: a roll is 0 to 100, so a computed chance of 100 still fails one time in 101, and 101 or more
 * always lands (unlike a "capped at 100" percentage). A draw is made for EVERY status with a chance byte
 * above 0, in index order, group 1 first, whether or not the answer is already fixed.
 *
 * What is not modelled: the display counters (`result +0x12..+0x18` and the nine-slot counts the AI
 * and the result-kind code read), which do not change any game state.
 */

import { Ffx2RngKind, drawValue, rngStreamForChr, type Ffx2Draw } from './rng.ts';
import { rollGroup1, type Group1Outcome } from './statusGroup1.ts';
import { rollGroup2, type Group2Outcome } from './statusGroup2.ts';
import type {
  StatusAttacker,
  StatusCommand,
  StatusOptions,
  StatusOutcome,
  StatusResult,
  StatusTarget,
} from './statusTypes.ts';

export {
  IMMUNE_FLAG_DARKNESS,
  IMMUNE_FLAG_PETRIFY,
  IMMUNE_FLAG_SILENCE,
  IMMUNE_FLAG_SLEEP,
  rollGroup1,
} from './statusGroup1.ts';
export { rollGroup2 } from './statusGroup2.ts';
export {
  STATUS1_INFO,
  STATUS2_INFO,
  STATUS_COUNT,
  Status1,
  Status2,
  initialStatusResult,
  statusLands,
} from './statusTypes.ts';
export type {
  StatusAttacker,
  StatusBytes,
  StatusCommand,
  StatusOptions,
  StatusOutcome,
  StatusResult,
  StatusTarget,
} from './statusTypes.ts';
export type { Group1Outcome } from './statusGroup1.ts';
export type { Group2Outcome } from './statusGroup2.ts';

/** Both groups, in the order the damage orchestrator runs them. */
export interface CommandStatusOutcome {
  result: StatusResult;
  log: StatusOutcome[];
  zeroAtbDelta: boolean;
}

/**
 * Group 1 then group 2 on one target (what `pp_dmg_calc_target` does for the status part of a command).
 * Group 2 starts from group 1's result, flag word included.
 */
export function rollCommandStatuses(
  attacker: StatusAttacker,
  target: StatusTarget,
  command: StatusCommand,
  start: StatusResult,
  draw: Ffx2Draw,
  options: StatusOptions = {},
): CommandStatusOutcome {
  const g1: Group1Outcome = rollGroup1(attacker, target, command, start, draw, options);
  const g2: Group2Outcome = rollGroup2(attacker, target, command, g1.result, draw, options);
  return { result: g2.result, log: [...g1.log, ...g2.log], zeroAtbDelta: g2.zeroAtbDelta };
}

/** Result word bits the shatter sets on the result's status set: Death (1) and Eject (0x400). */
export const SHATTER_SET_BITS = 0x401;

export interface ShatterRoll {
  /** A draw was made (the target is Petrified). */
  drew: boolean;
  roll: number | null;
  shattered: boolean;
}

/**
 * The shatter roll (inside `pp_dmg_calc_target`, exe 0x006172c0, right after the status rolls): a
 * PETRIFIED target is hit again; one draw from the attacker's purpose-2 stream, `draw % 101 < chance`
 * with `chance` the command row's byte at +0x2d. Success adds 0x401 to the result status set (the
 * orchestrator then zeroes the damage). A target that is not petrified makes no draw.
 */
export function rollShatter(
  targetPetrified: boolean,
  chance: number,
  attackerId: number,
  draw: Ffx2Draw,
): ShatterRoll {
  if (!targetPetrified) return { drew: false, roll: null, shattered: false };
  const roll = drawValue(draw, rngStreamForChr(attackerId, Ffx2RngKind.Status)) % 101;
  return { drew: true, roll, shattered: roll < (chance & 0xff) };
}
