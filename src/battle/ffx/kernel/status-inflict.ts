/**
 * FFX status infliction and cleansing (`pp_BtlInflictStatus`, VA 0x0078ae00) and the glue to the extra-status step
 * (`./status-extra.ts`, VA 0x0078b4e0) and the stage buffs.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D. Spec:
 * `research/re-ffx-ctb-status.md` sections 6 and 7. Pure, deterministic, not wired into the engine; the engine's
 * `statuses.ts` (a different model: named statuses with timers) is untouched.
 *
 * The step runs once per hit per target, between the damage classes and the clean-up of the per-hit pipeline
 * (`./hitdamage.ts` takes its result as `HitInput.status`; {@link toStatusOutcome} makes that shape). It edits a COPY
 * of the target's status snapshot (the hit record); the game writes the snapshot back to the character after the
 * damage is applied. The 25 regular statuses are visited in order 0..24 and only those whose chance byte (the larger
 * of the command's and, for a weapon command, the weapon's) is not 0 do anything.
 *
 * Draws: one per visited status on the inflicting path, none on the cleansing path. All come from the USER's mode 2
 * stream: `draw() % 101` for every status but Threaten, `draw() % 100` for Threaten; the draw is spent before the
 * chance bytes are looked at, so a chance of 255 or a resistance of 255 still costs one.
 */

import type { StatusOutcome } from './aftermath.ts';
import { delayForRank } from './ctb.ts';
import { isMonsterChrId } from './rng.ts';
import { applyStageBuffs, inflictExtraStatus, mergeExtraStatusWord } from './status-extra.ts';
import {
  CMD_CLEANSE,
  CMD_USES_WEAPON,
  PERM_STATUS_FLAGS,
  PERMANENT_STATUS_COUNT,
  PermBit,
  REGULAR_STATUS_COUNT,
  ResultCounter,
  Status,
  TEMPORAL_STATUS_FLAGS,
  TEMPORAL_TICKS_AT_END,
  TemporalSlot,
  type InflictCommand,
  type InflictFlags,
  type InflictTarget,
  type InflictUser,
  type StatusRecord,
} from './status-types.ts';

export { applyStageBuffs, inflictExtraStatus, mergeExtraStatusWord };
export * from './status-types.ts';

export interface InflictInput {
  cmd: InflictCommand;
  user: InflictUser;
  target: InflictTarget;
  /** The snapshot this hit edits; the input object is not modified. */
  record: StatusRecord;
  /** The hit's result-flag word so far (the step ORs bits into it: 4 for Threaten, immunity pop-ups). */
  mask: number;
  /** The hit's CTB amount so far (third value of the damage triple); the step may overwrite it. */
  ctbDamage: number;
  flags?: InflictFlags;
}

export interface InflictResult {
  record: StatusRecord;
  /** The result-flag word after the step. */
  mask: number;
  /** The CTB amount after the step. */
  ctbDamage: number;
  /** True when the step wrote the CTB amount (a Threaten landed, or a Haste/Slow failed and zeroed it). */
  ctbDamageTouched: boolean;
  /** 1 when a Threaten landed (it bypasses delay immunity), else 0. */
  ctbFlag: number;
  /** The two eight-integer counter arrays ({@link ResultCounter}). */
  applied: number[];
  removed: number[];
  /** Chr+0x641..0x659 of the target after the step; only the Threaten byte (index 11) can change. */
  resist: number[];
  /** Chr+0x5c4 of the target: the user id, when a Provoke landed. */
  provokedBy: number | null;
  /** Chr+0x5c5 of the target: the user id, when a Threaten landed. */
  threatenedBy: number | null;
  /** Chr+0x701 of the target: 3 or 4 when a Death landed from command 0x30e2 / 0x3120. */
  deathMarker: number | null;
  /** Mode 2 draws spent. */
  draws: number;
}

interface Work extends InflictResult {
  record: StatusRecord;
}

const bump = (arr: number[], slot: number): void => {
  arr[slot] = (arr[slot] as number) + 1;
};
const clamp255 = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : v);

/** What one status did: nothing, took effect, was removed, or failed (a temporal failure marks Haste/Slow). */
type Step = 'none' | 'added' | 'removed' | 'fail' | 'failTemporal';

function permanentStep(i: number, res: number, cleanse: boolean, w: Work, inp: InflictInput, flags: InflictFlags): Step {
  const { user, target } = inp;
  const bit = 1 << i;
  const snap = w.record.perm;
  if (cleanse) {
    if ((snap & PermBit.Petrify) !== 0 && (bit & PermBit.Petrify) === 0) return 'fail';
    if (i === Status.Death && (snap & PermBit.Zombie) !== 0) {
      // Life on a Zombie: kills it, unless the target is immune to Life (Chr+0x5b8 bit 2).
      if ((target.special & 4) !== 0) {
        bump(w.applied, ResultCounter.Immune);
        return 'none';
      }
      w.record.perm = (snap | bit) & 0xffff;
      bump(w.applied, ResultCounter.Changed);
      return 'added';
    }
    if ((snap & bit) === 0 || (target.autoPerm & bit) !== 0) return 'fail';
    w.record.perm = snap & ~bit & 0xffff;
    if (i === Status.Death) bump(w.removed, ResultCounter.Revived);
    bump(w.applied, ResultCounter.Changed);
    return 'removed';
  }
  if ((snap & PermBit.Petrify) !== 0 || (target.perm & bit) !== 0) return 'fail';
  const free = (target.autoPerm & 0xf00) === 0;
  let next: number;
  switch (i) {
    case Status.Death:
      if (user.currentCommand === 0x30e2) w.deathMarker = 3;
      else if (user.currentCommand === 0x3120) w.deathMarker = 4;
      next = snap | bit;
      break;
    case Status.Confuse:
      if (!free) return 'fail';
      next = (snap | bit) & 0xf1ff;
      break;
    case Status.Berserk:
      if (!free) return 'fail';
      next = (snap | bit) & 0xf2ff;
      break;
    case Status.Provoke:
      if (!free) return 'fail';
      w.provokedBy = user.id & 0xff;
      next = (snap | bit) & 0xf4ff;
      break;
    case Status.Threaten: {
      const clockOk = w.record.counters[TemporalSlot.Haste] !== 0xff && w.record.counters[TemporalSlot.Slow] !== 0xff;
      if (!free || !clockOk) return 'fail';
      w.ctbFlag = 1;
      if (res !== 0) w.resist[Status.Threaten] = Math.max(1, Math.trunc((res * 7) / 10));
      w.mask |= 4;
      w.threatenedBy = user.id & 0xff;
      const delay = delayForRank(user.agi, user.rank & 0xff, user.haste & 0xff, user.slow & 0xff);
      w.ctbDamage = (delay + (user.ctb & 0xff) - (target.ctb & 0xff)) | 0;
      w.ctbDamageTouched = true;
      w.record.counters[TemporalSlot.Haste] = 0;
      w.record.counters[TemporalSlot.Slow] = 0;
      next = (snap | bit) & 0xf8ff;
      break;
    }
    case Status.Petrify:
      // Petrify replaces every other permanent status, clears every counter and the stances; a monster (or a
      // battle with the setup flag) shatters at once: Death and Eject join it.
      w.record.counters.fill(0);
      w.record.extra &= 0x813f;
      next = bit;
      if (isMonsterChrId(target.chrId) || flags.petrifyShattersParty === true) {
        next |= PermBit.Death;
        w.record.extra |= 0x100;
      }
      break;
    default:
      next = snap | bit;
  }
  w.record.perm = next & 0xffff;
  bump(w.applied, ResultCounter.Changed);
  return 'added';
}

function temporalStep(i: number, cleanse: boolean, w: Work, inp: InflictInput, useWeapon: boolean): Step {
  const { cmd, user, target } = inp;
  const t = i - PERMANENT_STATUS_COUNT;
  let duration = (cmd.durations[t] ?? 0) & 0xff;
  if (useWeapon) duration = Math.max(duration, (user.weaponDurations[t] ?? 0) & 0xff);
  const rec = w.record;
  if ((rec.perm & PermBit.Petrify) !== 0) return 'failTemporal';
  if (cleanse) {
    const c = rec.counters[t] as number;
    if (c === 0 || c >= 0xff) return 'failTemporal';
    rec.counters[t] = clamp255(c - duration);
    bump(w.applied, ResultCounter.Changed);
    return 'removed';
  }
  const flagsByte = TEMPORAL_STATUS_FLAGS[t] as number;
  if (user.id === target.id && duration < 0xfd && (flagsByte & TEMPORAL_TICKS_AT_END) !== 0) duration += 1;
  if (((target.counters[t] ?? 0) & 0xff) > 0) return 'failTemporal';
  const clockOk =
    rec.counters[TemporalSlot.Haste] !== 0xff && rec.counters[TemporalSlot.Slow] !== 0xff && (rec.perm & PermBit.Threaten) === 0;
  if (t === TemporalSlot.Sleep) {
    rec.counters[t] = duration;
    rec.extra &= 0xf7ff;
  } else if (t === TemporalSlot.Haste || t === TemporalSlot.Slow) {
    if (!clockOk) return 'failTemporal';
    rec.counters[t] = duration;
    rec.counters[t === TemporalSlot.Haste ? TemporalSlot.Slow : TemporalSlot.Haste] = 0;
    rec.perm &= 0xf7ff;
  } else {
    rec.counters[t] = duration;
  }
  bump(w.applied, ResultCounter.Changed);
  return 'added';
}

/** The pop-up bits an immune target adds to the result word, and the immune count. */
function markImmune(i: number, w: Work): void {
  const bit = 1 << i;
  if (i < PERMANENT_STATUS_COUNT) {
    if ((bit & PermBit.Petrify) !== 0) w.mask |= 0x4000;
    if ((bit & PermBit.Zombie) !== 0) w.mask |= 0x2000;
  } else {
    const t = i - PERMANENT_STATUS_COUNT;
    if (t === TemporalSlot.Sleep) w.mask |= 0x200;
    if (t === TemporalSlot.Silence) w.mask |= 0x400;
    if (t === TemporalSlot.Darkness) w.mask |= 0x800;
  }
  bump(w.applied, ResultCounter.Immune);
}

/**
 * `pp_BtlInflictStatus`. For each regular status with a non-zero chance:
 *
 * - **Does it land?** A cleansing command always does, with no draw. Otherwise one draw is spent, then:
 *   Threaten (11) lands when `draw % 100 < resistance` (the byte is a success percentage, not a resistance; a miss
 *   with resistance 0 is treated as immune); every other status uses `roll = draw % 101` and lands when the
 *   chance is 255, or the resistance is not 255 and (the chance is 254, or `roll < chance - resistance`, or the
 *   debug always-hit switch is on). Death against a record that already carries Zombie uses resistance 254.
 * - **What does landing do?** See {@link permanentStep} (statuses 0..11: edits the record's permanent word) and
 *   {@link temporalStep} (12..24: writes the record's counter). A failed Haste or Slow zeroes the hit's CTB amount;
 *   a landed Threaten writes it.
 * - A status that does not land counts as failed, or as immune when the resistance byte is 255 (adding the
 *   pop-up bits to the result word).
 */
export function inflictStatus(input: InflictInput, draw: () => number): InflictResult {
  const { cmd, user, target } = input;
  const flags = input.flags ?? {};
  const cleanse = (cmd.flagsDamage & CMD_CLEANSE) !== 0;
  const useWeapon = (cmd.flagsMisc & CMD_USES_WEAPON) !== 0;
  const w: Work = {
    record: { perm: input.record.perm & 0xffff, counters: input.record.counters.map((c) => c & 0xff), extra: input.record.extra & 0xffff },
    mask: input.mask | 0,
    ctbDamage: input.ctbDamage | 0,
    ctbDamageTouched: false,
    ctbFlag: 0,
    applied: new Array<number>(8).fill(0),
    removed: new Array<number>(8).fill(0),
    resist: Array.from({ length: REGULAR_STATUS_COUNT }, (_, k) => (target.resist[k] ?? 0) & 0xff),
    provokedBy: null,
    threatenedBy: null,
    deathMarker: null,
    draws: 0,
  };
  const roll = (modulus: number): number => {
    w.draws += 1;
    return (draw() & 0x7fffffff) % modulus;
  };

  for (let i = 0; i < REGULAR_STATUS_COUNT; i++) {
    let chance = (cmd.chances[i] ?? 0) & 0xff;
    if (useWeapon) chance = Math.max(chance, (user.weaponChances[i] ?? 0) & 0xff);
    if (chance === 0) continue;
    const t = i - PERMANENT_STATUS_COUNT;
    let res = w.resist[i] as number;

    let landed: boolean;
    if (cleanse) {
      landed = true;
    } else if (i === Status.Threaten) {
      landed = roll(100) < res;
      if (!landed && res === 0) res = 0xff;
    } else {
      const r = roll(101);
      if (i === Status.Death && (w.record.perm & PermBit.Zombie) !== 0) res = 0xfe;
      landed = chance === 0xff || (res !== 0xff && (chance === 0xfe || r < chance - res || flags.debugAlwaysHit === true));
    }

    let step: Step = 'none';
    let markedTemporal = false;
    if (landed && flags.debugNeverHit !== true) {
      step = t < 0 ? permanentStep(i, res, cleanse, w, input, flags) : temporalStep(i, cleanse, w, input, useWeapon);
      if (step === 'fail' || step === 'failTemporal') bump(w.applied, ResultCounter.Failed);
      markedTemporal = step === 'failTemporal';
    } else {
      markedTemporal = t >= 0;
      if (res === 0xff) markImmune(i, w);
      else bump(w.applied, ResultCounter.Failed);
    }

    const cls = (t < 0 ? PERM_STATUS_FLAGS[i] : TEMPORAL_STATUS_FLAGS[t]) as number;
    const added = step === 'added';
    const gone = step === 'removed';
    const a = (cls & 0x40) === 0 ? ResultCounter.Plain : ResultCounter.Class40;
    if (added) bump(w.applied, a);
    if (gone) bump(w.removed, a);
    if ((cls & 0x20) !== 0) {
      if (added) bump(w.applied, ResultCounter.Class20);
      if (gone) bump(w.removed, ResultCounter.Class20);
    }
    if ((cls & 0x80) !== 0) {
      if (added) bump(w.applied, ResultCounter.Bad);
      if (gone) bump(w.removed, ResultCounter.Bad);
    }
    if (markedTemporal && (i === Status.Haste || i === Status.Slow)) {
      w.ctbDamage = 0;
      w.ctbDamageTouched = true;
    }
  }
  return w;
}

/** Both steps of the per-hit pipeline, in its order, and what the hit pipeline (`./hitdamage.ts`) needs of them. */
export interface InflictAllInput extends InflictInput {
  /** The wanted extra-status bits ({@link mergeExtraStatusWord}). */
  extraMask: number;
}

export interface InflictAllResult extends InflictResult {
  /** `Chr+0x5c8` of the target when a Doom landed, else null. */
  doomCounter: number | null;
  /** `Chr+0x5ca` of the target (Auto-Life bonus flag), else null. */
  bonusFlag: number | null;
  /** The same result in the shape `HitInput.status` takes. */
  outcome: StatusOutcome;
}

/** Run {@link inflictStatus} then {@link inflictExtraStatus} on the same record, counters and draw stream. */
export function inflictStatuses(input: InflictAllInput, draw: () => number): InflictAllResult {
  const first = inflictStatus(input, draw);
  const second = inflictExtraStatus(
    {
      cmd: input.cmd,
      user: input.user,
      target: input.target,
      record: first.record,
      extraMask: input.extraMask,
      applied: first.applied,
      removed: first.removed,
      ...(input.flags?.debugNeverHit === undefined ? {} : { flags: { debugNeverHit: input.flags.debugNeverHit } }),
    },
    draw,
  );
  const merged: InflictResult = {
    ...first,
    record: second.record,
    applied: second.applied,
    removed: second.removed,
    draws: first.draws + second.draws,
  };
  return {
    ...merged,
    doomCounter: second.doomCounter,
    bonusFlag: second.bonusFlag,
    outcome: toStatusOutcome(merged, input.mask),
  };
}

/**
 * The shape `HitInput.status` takes (`./aftermath.ts`): the snapshot words after infliction, the result-flag bits the
 * step added, the CTB amount it wrote (or null), and the Threaten flag that bypasses delay immunity.
 */
export function toStatusOutcome(result: InflictResult, maskBefore: number): StatusOutcome {
  return {
    permAfter: result.record.perm,
    extraAfter: result.record.extra,
    maskBits: (result.mask & ~maskBefore) | 0,
    ctbDamage: result.ctbDamageTouched ? result.ctbDamage : null,
    ctbFlag: result.ctbFlag,
  };
}
