/**
 * FFX-2 status infliction, group 1: `pp_status_roll_g1`, the on/off ailments (Death, Petrify, Sleep,
 * Silence, Darkness, Poison, Confusion, Berserk, Curse, Defense, Eject, ...).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69),
 * function 0x00619230. Spec: `research/re-ffx2-hit-status.md` section 4. Pure, no DOM, no engine types;
 * not wired into the engine. Randomness comes from a `draw(stream)` callback (see `./rng.ts`).
 *
 * For each of the 24 statuses, in index order, with `c` the command's chance byte (raised to the
 * attacker's weapon byte when the command uses character properties):
 *
 * - `c == 0`: skipped, no draw.
 * - Otherwise, unless the command is a cleanse, ONE draw from the attacker's purpose-2 stream is made
 *   first (`draw % 101`), even for `c` of 254 or 255 and even for an immune target.
 * - It lands when `c == 255`, or the target's resist byte `r` is not 255 and (`c == 254` or
 *   `roll < c + 5 * (lvA - lvT) - r`). A cleanse always "lands" and makes no draw.
 * - Not landed with `r == 255`: the target is immune; for Petrify, Sleep, Silence and Darkness a flag is
 *   added to the result flag word (0x4000, 0x200, 0x400, 0x800).
 * - Landed, inflicting, main layer: nothing happens to a target that is petrified, whose result set is
 *   petrified, that already has the status, or (Petrify, Eject) is mid-action; otherwise the bit is set
 *   with the per-status rules in {@link inflictGroup1}.
 * - Landed, cleansing: the bit is cleared from the result set if the target has it (a Petrified target
 *   can only be cleansed of Petrify); statuses held by a permanent source are cleared from the set but
 *   reported as unchanged.
 */

import { at } from './intops.ts';
import { Ffx2RngKind, drawValue, isMonsterSlot, rngStreamForChr, type Ffx2Draw } from './rng.ts';
import {
  STATUS1_INFO,
  STATUS_COUNT,
  statusLands,
  type StatusAttacker,
  type StatusCommand,
  type StatusOptions,
  type StatusOutcome,
  type StatusResult,
  type StatusTarget,
} from './statusTypes.ts';

/** Result flag bits `pp_status_roll_g1` adds when a target is immune to the status (display only). */
export const IMMUNE_FLAG_PETRIFY = 0x4000;
export const IMMUNE_FLAG_SLEEP = 0x200;
export const IMMUNE_FLAG_SILENCE = 0x400;
export const IMMUNE_FLAG_DARKNESS = 0x800;

function immuneFlagFor(index: number): number {
  switch (index) {
    case 1:
      return IMMUNE_FLAG_PETRIFY;
    case 2:
      return IMMUNE_FLAG_SLEEP;
    case 3:
      return IMMUNE_FLAG_SILENCE;
    case 4:
      return IMMUNE_FLAG_DARKNESS;
    default:
      return 0;
  }
}

export interface Group1Outcome {
  result: StatusResult;
  log: StatusOutcome[];
}

/**
 * The inflict step for one landed status on the main layer, after the common refusals. Returns the new
 * result set, or `null` when the status does not take. `allow` is false while the target holds a
 * permanent Confusion/Berserk (0xc0) or the 0x20000 status; `curseOk` is false while it holds a
 * permanent Curse (0x100).
 *
 * | bit      | rule                                                                                 |
 * |----------|--------------------------------------------------------------------------------------|
 * | 0x1      | set                                                                                  |
 * | 0x40     | needs `allow`; set, clears 0x80 and 0x20000 (Confusion removes Berserk)             |
 * | 0x80     | needs `allow`; set, clears 0x40 and 0x20000 (Berserk removes Confusion)             |
 * | 0x20000  | needs `allow` and `curseOk`; set, clears 0x40, 0x80, 0x100                           |
 * | 0x100    | needs `allow` and `curseOk`; set, clears 0x20000                                    |
 * | 0x400    | set, clears Petrify (0x2)                                                            |
 * | 0x2      | refused if Eject is on the target or the set; else the set becomes just 0x2, the     |
 * |          | counters are zeroed, and a monster is ejected as well (0x402)                        |
 * | others   | set                                                                                  |
 */
function inflictGroup1(
  bit: number,
  set: number,
  allow: boolean,
  curseOk: boolean,
  status1: number,
  isMonster: boolean,
): { set: number; zeroCounters: boolean } | null {
  if (bit & 0x1) return { set: set | bit, zeroCounters: false };
  if (bit & 0x40) return allow ? { set: (set | bit) & 0xfffdff7f, zeroCounters: false } : null;
  if (bit & 0x80) return allow ? { set: (set | bit) & 0xfffdffbf, zeroCounters: false } : null;
  if (bit & 0x20000) return allow && curseOk ? { set: (set | bit) & 0xfffffe3f, zeroCounters: false } : null;
  if (bit & 0x100) return allow && curseOk ? { set: (set | bit) & 0xfffdffff, zeroCounters: false } : null;
  if (bit & 0x400) return { set: (set | bit) & 0xfffffffd, zeroCounters: false };
  if (bit & 0x2) {
    if ((status1 & 0x400) !== 0 || (set & 0x400) !== 0) return null;
    return { set: isMonster ? bit | 0x400 : bit, zeroCounters: true };
  }
  return { set: set | bit, zeroCounters: false };
}

/**
 * `pp_status_roll_g1` (exe 0x00619230). Returns a new result; the inputs are not changed.
 */
export function rollGroup1(
  attacker: StatusAttacker,
  target: StatusTarget,
  command: StatusCommand,
  start: StatusResult,
  draw: Ffx2Draw,
  options: StatusOptions = {},
): Group1Outcome {
  const result: StatusResult = {
    ...start,
    counters: Array.from(start.counters),
    layerCBytes: Array.from(start.layerCBytes),
  };
  const log: StatusOutcome[] = [];
  const stream = rngStreamForChr(attacker.id, Ffx2RngKind.Status);
  const cleanse = command.cleanse;
  const monster = isMonsterSlot(target.id);

  for (let i = 0; i < STATUS_COUNT; i++) {
    const bit = (1 << i) >>> 0;
    let c = at(command.chance1, i) & 0xff;
    if (command.usesWeapon) {
      const w = at(attacker.weaponChance1, i) & 0xff;
      if (c < w) c = w;
    }
    if (c === 0) continue;
    let r = at(target.resist1, i) & 0xff;
    const info = at(STATUS1_INFO, i);

    let landed = false;
    let roll: number | null = null;
    if (cleanse) {
      landed = true;
    } else {
      roll = drawValue(draw, stream) % 101;
      if ((info & 0x400) !== 0 && options.stopGate === true) {
        r = 0xff; // forced: resisted, whatever the chance
      } else {
        landed = statusLands(c, r, roll, attacker.level, target.level, options.debugForceLand === true);
      }
    }

    let applied = false;
    let removed = false;
    let immune = false;
    if (!landed || options.debugForceFail === true) {
      if (r === 0xff) {
        immune = true;
        result.flags |= immuneFlagFor(i);
      }
    } else if (!cleanse) {
      if (result.secondaryLayer) {
        if ((result.layerCSet & bit) === 0) {
          result.layerCSet = (result.layerCSet | bit) >>> 0;
          applied = true;
        }
      } else if (
        (target.status1 & 2) === 0 &&
        (result.statusSet & 2) === 0 &&
        !((target.actionState & ~4) !== 0 && (info & 0x100) !== 0) &&
        (target.status1 & bit) === 0
      ) {
        const allow = (target.protectMask & 0xc0) === 0 && (target.protectMask & 0x20000) === 0;
        const curseOk = (target.protectMask & 0x100) === 0;
        const next = inflictGroup1(bit, result.statusSet, allow, curseOk, target.status1, monster);
        if (next) {
          result.statusSet = next.set >>> 0;
          if (next.zeroCounters) result.counters.fill(0);
          applied = true;
        }
      }
    } else if (result.secondaryLayer) {
      if ((result.layerCSet & bit) !== 0) {
        result.layerCSet = (result.layerCSet & ~bit) >>> 0;
        removed = true;
      }
    } else if (((target.status1 & 2) === 0 || (bit & 2) !== 0) && (target.status1 & bit) !== 0) {
      result.statusSet = (result.statusSet & ~bit) >>> 0;
      if ((target.protectMask & bit) === 0) removed = true;
    }

    log.push({ group: 1, index: i, chance: c, resist: r, roll, landed, immune, applied, removed, attempted: false });
  }
  return { result, log };
}
