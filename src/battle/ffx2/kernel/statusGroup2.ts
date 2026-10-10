/**
 * FFX-2 status infliction, group 2: `pp_status_roll_g2`, the timed and staged statuses (Shell,
 * Protect, Reflect, Regen, Haste, Slow, Stop, the seven stat stages, Doom, the immunities).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69),
 * function 0x00619700. Spec: `research/re-ffx2-hit-status.md` section 4. Pure, no DOM, no engine types;
 * the engine runs it through `./status.ts` (`resolve-strike.ts`). Randomness comes from a `draw(stream)`
 * callback (see `./rng.ts`).
 *
 * It runs after group 1 and uses the same landing test (one draw per status with a chance byte, from the
 * attacker's purpose-2 stream, unless the command is a cleanse). What a landed roll does depends on the
 * status's flag word ({@link STATUS2_INFO}):
 *
 * - a TIMED status (flag 0xc): inflicting adds the amount to the result counter, clamped to 0..125, and
 *   refuses when the status is already in effect, when the target is mid-action (Stop only), or when a
 *   permanent source already holds Haste, Slow or Stop. Haste clears the Slow and Stop counters, Slow
 *   clears Haste and Stop, Stop clears Haste and Slow. A cleanse subtracts the amount (needs a counter
 *   of 1 to 126 and no permanent source);
 * - a STAT STAGE (no flag 0xc): inflicting adds the amount to the stage, clamped to -10..+10; if the
 *   stage did not change the attempt is "unchanged". A cleanse sets the stage to 0 if it was not 0.
 *
 * Nothing is inflicted on a target that is petrified or whose result set is petrified. A failed attempt
 * at Haste or Slow (indices 4 and 5) also zeroes the ATB part of the damage result (`zeroAtbDelta`).
 */

import { at, clampInt, s8 } from './intops.ts';
import { Ffx2RngKind, drawValue, rngStreamForChr, type Ffx2Draw } from './rng.ts';
import {
  STATUS2_INFO,
  STATUS_COUNT,
  statusLands,
  type StatusAttacker,
  type StatusCommand,
  type StatusOptions,
  type StatusOutcome,
  type StatusResult,
  type StatusTarget,
} from './statusTypes.ts';

export interface Group2Outcome {
  result: StatusResult;
  log: StatusOutcome[];
  /** A Haste or Slow attempt (index 4 or 5) failed to change anything: the damage result's ATB delta is zeroed. */
  zeroAtbDelta: boolean;
}

/** Highest counter value a timed status can reach in the result (125). */
const COUNTER_MAX = 0x7d;

/**
 * `pp_status_roll_g2` (exe 0x00619700). Returns a new result; the inputs are not changed.
 */
export function rollGroup2(
  attacker: StatusAttacker,
  target: StatusTarget,
  command: StatusCommand,
  start: StatusResult,
  draw: Ffx2Draw,
  options: StatusOptions = {},
): Group2Outcome {
  const result: StatusResult = {
    ...start,
    counters: Array.from(start.counters),
    layerCBytes: Array.from(start.layerCBytes),
  };
  const log: StatusOutcome[] = [];
  const stream = rngStreamForChr(attacker.id, Ffx2RngKind.Status);
  const cleanse = command.cleanse;
  let zeroAtbDelta = false;
  const quiet =
    at(target.layerB, 4) === 0 &&
    at(target.layerB, 5) === 0 &&
    at(target.layerB, 6) === 0 &&
    at(target.layerD, 4) === 0 &&
    at(target.layerD, 5) === 0 &&
    at(target.layerD, 6) === 0;

  for (let i = 0; i < STATUS_COUNT; i++) {
    let c = at(command.chance2, i) & 0xff;
    if (command.usesWeapon) {
      const w = at(attacker.weaponChance2, i) & 0xff;
      if (c < w) c = w;
    }
    if (c === 0) continue;
    let r = at(target.resist2, i) & 0xff;
    const info = at(STATUS2_INFO, i);
    let amount = s8(at(command.amount2, i));
    if (command.usesWeapon) {
      const wa = s8(at(attacker.weaponAmount2, i));
      if (Math.abs(wa) > Math.abs(amount)) amount = wa;
    }

    let landed = false;
    let roll: number | null = null;
    if (cleanse) {
      landed = true;
    } else {
      roll = drawValue(draw, stream) % 101;
      if ((info & 0x400) !== 0 && options.stopGate === true) {
        r = 0xff;
      } else {
        landed = statusLands(c, r, roll, attacker.level, target.level, options.debugForceLand === true);
      }
    }

    let applied = false;
    let removed = false;
    let immune = false;
    let attempted = false; // `local_c`: the attempt was made and changed nothing
    const counters = result.counters;

    if (!landed || options.debugForceFail === true) {
      attempted = true;
      if (r === 0xff) immune = true;
    } else if (result.secondaryLayer) {
      const held = at(result.layerCBytes, i);
      if (!cleanse) {
        if (held === 0) {
          result.layerCBytes[i] = amount & 0xff;
          applied = true;
        }
      } else if (held !== 0) {
        result.layerCBytes[i] = 0;
        removed = true;
      }
    } else if ((target.status1 & 2) !== 0 || (result.statusSet & 2) !== 0) {
      attempted = true;
    } else if ((info & 0xc) !== 0) {
      const prev = s8(at(counters, i));
      if (!cleanse) {
        if (s8(at(target.activeBytes, i)) !== 0) {
          attempted = true;
        } else if (target.actionState !== 0 && (info & 0x100) !== 0) {
          attempted = true;
        } else if ((i === 4 || i === 5 || i === 6) && !quiet) {
          attempted = true;
        } else {
          applied = true;
          counters[i] = clampInt((amount + prev) | 0, 0, COUNTER_MAX);
          if (i === 4) {
            counters[5] = 0;
            counters[6] = 0;
          } else if (i === 5) {
            counters[4] = 0;
            counters[6] = 0;
          } else if (i === 6) {
            counters[4] = 0;
            counters[5] = 0;
          }
        }
      } else if ((prev - 1) >>> 0 > COUNTER_MAX || at(target.layerB, i) !== 0 || at(target.layerD, i) !== 0) {
        attempted = true;
      } else {
        counters[i] = clampInt((prev - amount) | 0, 0, COUNTER_MAX);
        removed = true;
      }
    } else {
      const prev = s8(at(counters, i));
      if (cleanse) {
        if (prev === 0) {
          attempted = true;
        } else {
          counters[i] = 0;
          removed = true;
        }
      } else {
        const next = clampInt((amount + prev) | 0, -10, 10);
        counters[i] = next & 0xff;
        if (next === prev) attempted = true;
        else if (amount <= 0) removed = true;
        else applied = true;
      }
    }

    if (attempted && (i === 4 || i === 5)) zeroAtbDelta = true;
    log.push({ group: 2, index: i, chance: c, resist: r, roll, landed, immune, applied, removed, attempted });
  }
  return { result, log, zeroAtbDelta };
}
