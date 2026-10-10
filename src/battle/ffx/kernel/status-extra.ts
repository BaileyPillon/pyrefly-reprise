/**
 * FFX extra-status infliction (`pp_BtlInflictExtraStatus`, VA 0x0078b4e0), the shatter roll, the merged extra word of
 * a weapon command, and the stage buffs (`pp_BtlApplyStageBuffs`, VA 0x0078d730).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-ctb-status.md` sections 6 and 7. Pure, deterministic, not wired into the engine.
 *
 * Draws: at most ONE, and only for a Petrified target: the shatter roll, `draw() % 101` from the user's mode 2 stream,
 * spent whether or not the command has a shatter chance. The 16 extra bits themselves are never rolled.
 */

import {
  CMD_CLEANSE,
  EXTRA_STATUS_BITS,
  EXTRA_STATUS_FLAGS,
  ExtraBit,
  PermBit,
  ResultCounter,
  type InflictCommand,
  type InflictFlags,
  type InflictTarget,
  type InflictUser,
  type StatusRecord,
} from './status-types.ts';

/** Bits 1 to 5 of the extra word: the Distill group (at most one of them at a time), and bit 4 is unused. */
const DISTILL_BITS = 0x3e;

export interface ExtraInput {
  cmd: Pick<InflictCommand, 'type' | 'flagsDamage' | 'shatter'>;
  user: Pick<InflictUser, 'autoA'>;
  target: Pick<InflictTarget, 'extra' | 'autoExtra' | 'extraImmune' | 'doomInitial'>;
  /** The record this hit is editing; the input is not modified. */
  record: StatusRecord;
  /** The wanted extra bits: Cmd+0x54, or the word from {@link mergeExtraStatusWord}. Only the low 16 bits count. */
  extraMask: number;
  /** The two result-counter arrays so far (zeros when this step runs alone). */
  applied?: readonly number[];
  removed?: readonly number[];
  flags?: Pick<InflictFlags, 'debugNeverHit'>;
}

export interface ExtraResult {
  record: StatusRecord;
  applied: number[];
  removed: number[];
  /** `Chr+0x5c8` of the target when Doom was inflicted (its Doom countdown restarts), else null. */
  doomCounter: number | null;
  /** `Chr+0x5ca` of the target: 0 when an Auto-Life was cleansed, 1 when one cast by a Magic Booster user landed. */
  bonusFlag: number | null;
  /** 0 or 1. */
  draws: number;
}

/**
 * The extra-status word of a command that may use weapon properties (the per-hit pipeline, VA 0x0078e630): the
 * command's own word `Cmd+0x54` when it does not use the weapon; otherwise the weapon's `Chr+0x604`, with bits 1 to 5
 * cleared when the command's own word has any of them (the command's Distill wins), OR the command's word.
 */
export function mergeExtraStatusWord(cmdExtra: number, weaponExtra: number, usesWeapon: boolean): number {
  const own = cmdExtra & 0xffff;
  if (!usesWeapon) return own;
  let merged = weaponExtra & 0xffff;
  if ((own & DISTILL_BITS) !== 0) merged &= ~DISTILL_BITS;
  return merged | own;
}

const magicBoosterApplies = (autoA: number, commandType: number): boolean =>
  (autoA & 0x40) !== 0 && (commandType === 1 || commandType === 2);

/**
 * `pp_BtlInflictExtraStatus`. Order of events:
 *
 * 1. If the record's Petrify bit is set: ONE draw, `roll = draw() % 101`; `roll < Cmd+0x2c` is a shatter: the record
 *    gains Death (permanent bit 0) and the wanted extra bits gain Eject (0x100). (The Death bit is set even if the
 *    target's Eject immunity then blocks the Eject.)
 * 2. For each of the 16 wanted bits, lowest first:
 *    - debug never-hit: fails;
 *    - target Petrified in the record and neither Eject nor any of bits 0 to 5 wanted: fails;
 *    - cleansing command: needs the bit in the record and not in the equipment-given word `Chr+0x62e`; clears it
 *      (an Auto-Life also clears `Chr+0x5ca`);
 *    - otherwise: immune if the bit is in `Chr+0x65a`; fails if the character already HAS the bit (except Scan,
 *      bit 0, which can be re-applied) or if an equipment Distill is present and a Distill is wanted; else it lands:
 *      a Distill bit clears the other Distill bits in the record, Doom restarts `Chr+0x5c8` from `Chr+0x5c9`, Eject
 *      also clears the Threaten bit of the record, Auto-Life from a Magic Booster user (a type 1 or 2 command) sets
 *      `Chr+0x5ca`.
 *    Counters follow the same rules as {@link inflictStatus}: changed, immune, failed, and by the table classes.
 */
export function inflictExtraStatus(input: ExtraInput, draw: (modulus: number) => number): ExtraResult {
  const rec: StatusRecord = { perm: input.record.perm & 0xffff, counters: input.record.counters.slice(), extra: input.record.extra & 0xffff };
  const applied = (input.applied ?? new Array<number>(8).fill(0)).slice();
  const removed = (input.removed ?? new Array<number>(8).fill(0)).slice();
  const { cmd, target } = input;
  const cleanse = (cmd.flagsDamage & CMD_CLEANSE) !== 0;
  let wanted = input.extraMask & 0xffff;
  let draws = 0;
  let doomCounter: number | null = null;
  let bonusFlag: number | null = null;

  if ((rec.perm & PermBit.Petrify) !== 0) {
    draws += 1;
    if ((draw(101) & 0x7fffffff) % 101 < (cmd.shatter & 0xff)) {
      wanted |= ExtraBit.Eject;
      rec.perm |= PermBit.Death;
    }
  }

  const bump = (arr: number[], slot: number): void => {
    arr[slot] = (arr[slot] as number) + 1;
  };
  for (let k = 0; k < EXTRA_STATUS_BITS; k++) {
    const bit = 1 << k;
    if ((wanted & bit) === 0) continue;
    const cls = EXTRA_STATUS_FLAGS[k] as number;
    let added = false;
    let gone = false;
    const blockedByPetrify =
      (rec.perm & PermBit.Petrify) !== 0 && (wanted & ExtraBit.Eject) === 0 && (wanted & 0x3f) === 0;
    if (input.flags?.debugNeverHit === true || blockedByPetrify) {
      bump(applied, ResultCounter.Failed);
    } else if (cleanse) {
      if ((rec.extra & bit) === 0 || (target.autoExtra & bit) !== 0) {
        bump(applied, ResultCounter.Failed);
      } else {
        if (bit === ExtraBit.AutoLife) bonusFlag = 0;
        rec.extra &= ~bit;
        bump(applied, ResultCounter.Changed);
        gone = true;
      }
    } else if ((target.extraImmune & bit) !== 0) {
      bump(applied, ResultCounter.Immune);
    } else if ((target.extra & bit) !== 0 && bit !== ExtraBit.Scan) {
      bump(applied, ResultCounter.Failed);
    } else if ((target.autoExtra & DISTILL_BITS) !== 0 && (bit & DISTILL_BITS) !== 0) {
      bump(applied, ResultCounter.Failed);
    } else {
      added = true;
      if ((bit & DISTILL_BITS) !== 0) {
        rec.extra = (rec.extra & ~DISTILL_BITS) | bit;
      } else if (bit === ExtraBit.Doom) {
        doomCounter = target.doomInitial & 0xff;
        rec.extra |= bit;
      } else if (bit === ExtraBit.Eject) {
        rec.extra |= bit;
        rec.perm &= ~PermBit.Threaten;
      } else if (bit === ExtraBit.AutoLife) {
        if (magicBoosterApplies(input.user.autoA, cmd.type)) bonusFlag = 1;
        rec.extra |= bit;
      } else {
        rec.extra |= bit;
      }
      bump(applied, ResultCounter.Changed);
    }
    const a = (cls & 0x40) === 0 ? ResultCounter.Plain : ResultCounter.Class40;
    if (added) bump(applied, a);
    if (gone) bump(removed, a);
    if ((cls & 0x80) !== 0) {
      if (added) bump(applied, ResultCounter.Bad);
      if (gone) bump(removed, ResultCounter.Bad);
    }
  }
  return { record: rec, applied, removed, doomCounter, bonusFlag, draws };
}

/**
 * `pp_BtlApplyStageBuffs`. The six stacks are Cheer, Aim, Focus, Reflex, Luck, Jinx (`Chr+0x65e..0x663`). For each of
 * the low six bits of `Cmd+0x56` that is set, the stack gains `max(Cmd+0x59, 1)` and is clamped to 0..5. Nothing here
 * takes a draw, and nothing lowers a stack; the stage-buff statuses have no timer.
 */
export function applyStageBuffs(stacks: readonly number[], buffMask: number, amount: number): number[] {
  const add = (amount & 0xff) < 1 ? 1 : amount & 0xff;
  const out = stacks.map((s) => s & 0xff);
  for (let k = 0; k < 6; k++) {
    if (((buffMask & 0xffff) & (1 << k)) === 0) continue;
    const v = (out[k] as number) + add;
    out[k] = v > 5 ? 5 : v;
  }
  return out;
}
