/**
 * One hit of one command against one target, as the game computes it: the
 * composition of the damage kernels in the game's own order.
 *
 * **Game case: FFX only.**
 *
 * Source: FFX.exe Steam build 25501027, the per-hit pipeline at 0x78e630
 * (research/re-ffx-damage.md §3). The hit roll, the critical roll and the
 * variance draw are supplied through {@link HitIo} so that they are consumed
 * in the game's order: Nul check, hit roll, HP variance draw, critical roll
 * (only for a command that can crit), MP variance draw, CTB variance draw.
 * The status infliction in the middle of the real function is NOT computed
 * here; pass its result as `input.status`.
 *
 * The engine does not call this yet (wiring is a separate, reviewed step).
 */

import {
  deathHitNoDamage,
  delayAttackCtb,
  delayImmunity,
  finalClamp,
  noStatusOutcome,
  petrifiedNoDamage,
  threatenIgnoresDelay,
  type Triple,
} from './aftermath.ts';
import { baseDamage, type BaseDamageInput } from './damage.ts';
import { elementMod, nulElementCheck } from './element.ts';
import type { HitCommand, HitInput, HitIo, HitOutcome, HitOutput, HitTarget, HitUser } from './hittypes.ts';
import {
  absorbInvert,
  alchemyMod,
  armoredMod,
  berserkMod,
  critMod,
  damageImmunity,
  damageScaleOverride,
  defendSentinelMod,
  magicBoosterMod,
  newHitFlags,
  partyPercentMod,
  protectMod,
  ratioImmunity,
  shellMod,
  shieldBoostMod,
  userBreakMod,
  type HitFlags,
  type PartyPercent,
} from './modifiers.ts';

export type {
  HitCommand,
  HitInput,
  HitIo,
  HitOutcome,
  HitOutput,
  HitRecord,
  HitRollResult,
  HitTarget,
  HitUser,
} from './hittypes.ts';

interface Source {
  formula: number;
  power: number;
  element: number;
}

/** A command that uses weapon properties (Cmd+0x1c bit 0x40000) takes formula, power and element from the weapon. */
function resolveSource(cmd: HitCommand, user: HitUser): Source {
  if ((cmd.flagsMisc & 0x40000) === 0) return { formula: cmd.formula, power: cmd.power, element: cmd.element };
  return {
    formula: user.weapon.formula,
    power: user.weapon.power,
    element: (user.weapon.element | cmd.element) & 0xff,
  };
}

interface Work {
  flags: HitFlags;
  bonusFlag: number;
  defUsed: number | undefined;
  mdfUsed: number | undefined;
}

/** The base-damage input for one class of this hit. */
function baseOf(
  inp: HitInput,
  src: Source,
  mode: number,
  snapshot: number,
  variance: boolean,
  target: HitTarget = inp.target,
): BaseDamageInput {
  return {
    user: inp.user,
    target,
    cmd: inp.cmd,
    formula: src.formula,
    power: src.power,
    snapshot,
    mode,
    variance,
    gilOffered: inp.gilOffered,
  };
}

/** The party percent table bytes this hit reads: the user's "dealt" pair and the target's "taken" pair. */
function partyPercentOf(user: HitUser, target: HitTarget): PartyPercent {
  return {
    physDealt: user.partyDealt.phys,
    magDealt: user.partyDealt.mag,
    physTaken: target.partyTaken.phys,
    magTaken: target.partyTaken.mag,
  };
}

/** The HP class: base damage, then the modifier chain in the game's order. */
function hpClass(inp: HitInput, io: HitIo, src: Source, w: Work): number {
  const { user, target, cmd, record } = inp;
  const base = baseDamage(baseOf(inp, src, 1, record.perm, !inp.noVariance), io.draw);
  w.defUsed = base.defUsed;
  w.mdfUsed = base.mdfUsed;
  const f = w.flags;
  let d = base.value;
  d = shieldBoostMod(target.extra, d, f);
  d = shellMod(cmd.flagsDamage, record.shell, d, f);
  d = protectMod(cmd.flagsDamage, record.protect, d, f);
  if ((cmd.flagsDamage & 4) !== 0) {
    const crit = typeof io.crit === 'function' ? io.crit() : io.crit;
    d = critMod(d, crit, f);
  }
  d = berserkMod(user.perm, user.currentCommand, user.defaultAttack, d);
  const booster = magicBoosterMod(cmd.id, cmd.type, user.autoA, w.bonusFlag, d);
  d = booster.damage;
  w.bonusFlag = booster.bonusFlag;
  d = alchemyMod(user.autoA, cmd.id, cmd.flagsDamage, src.formula, d);
  d = partyPercentMod(cmd.flagsDamage, partyPercentOf(user, target), d);
  d = ratioImmunity(src.formula, target.special, d, f);
  d = absorbInvert(cmd.flagsMisc, user.perm, record.perm, d);
  d = elementMod(d, src.element, target.affinity);
  d = armoredMod(cmd.flagsMisc, target.special, user.autoA, record.perm, d, f);
  d = defendSentinelMod(cmd.flagsDamage, record.extra, d, f);
  d = userBreakMod(cmd.flagsDamage, user.perm, d);
  d = damageImmunity(cmd.flagsDamage, target.special, d, f);
  return damageScaleOverride(user.scale, d);
}

/** The MP class: base damage (mode 2), Magic Booster, Alchemy, a cap at the target's running MP, the absorb flip. */
function mpClass(inp: HitInput, io: HitIo, src: Source, w: Work): number {
  const { user, target, cmd, record } = inp;
  let d = baseDamage(baseOf(inp, src, 2, record.perm, !inp.noVariance), io.draw).value;
  const booster = magicBoosterMod(cmd.id, cmd.type, user.autoA, w.bonusFlag, d);
  d = booster.damage;
  w.bonusFlag = booster.bonusFlag;
  d = alchemyMod(user.autoA, cmd.id, cmd.flagsDamage, src.formula, d);
  if (d > 0 && target.runningMp < d) d = target.runningMp;
  return absorbInvert(cmd.flagsMisc, user.perm, record.perm, d);
}

/** The CTB class: base damage (mode 4) and the absorb flip. */
function ctbClass(inp: HitInput, io: HitIo, src: Source): number {
  const { user, cmd, record } = inp;
  const d = baseDamage(baseOf(inp, src, 4, record.perm, !inp.noVariance), io.draw).value;
  return absorbInvert(cmd.flagsMisc, user.perm, record.perm, d);
}

/**
 * Delay Attack/Buster, Threaten, the status result, then the three "no damage"
 * overrides, in the game's order. Returns the damage, the result word and the
 * live classes that go into the final clamp.
 */
function tailSteps(
  inp: HitInput,
  damage: Triple,
  mask: number,
  classLeft: number,
): { damage: Triple; mask: number; classLeft: number } {
  const { cmd, target, record } = inp;
  const status = inp.status ?? noStatusOutcome(record.perm, record.extra);
  const delay = delayAttackCtb(cmd.flagsMisc, target.tickSpeed, damage[2], mask);
  const threaten = threatenIgnoresDelay(record.perm, delay.mask, classLeft, delay.ctbDamage);
  const maskAfterStatus = delay.mask | status.maskBits;
  const ctb = status.ctbDamage ?? threaten.ctbDamage;
  const unpetrified = petrifiedNoDamage(record.perm, status.permAfter, status.extraAfter, [damage[0], damage[1], ctb]);
  const settled: Triple = [
    unpetrified[0],
    unpetrified[1],
    delayImmunity(target.delayImmune, maskAfterStatus, status.ctbFlag, unpetrified[2]),
  ];
  const dead = deathHitNoDamage(record.perm, status.permAfter, maskAfterStatus, settled);
  return { damage: dead.damage, mask: dead.mask, classLeft: threaten.classLeft };
}

/** Compute one hit. See the file header for the order of the random draws. */
export function calcHitDamage(inp: HitInput, io: HitIo): HitOutput {
  const { user, target, cmd, record } = inp;
  const src = resolveSource(cmd, user);
  const w: Work = { flags: newHitFlags(0), bonusFlag: user.bonusFlag, defUsed: undefined, mdfUsed: undefined };
  const f = w.flags;
  let outcome: HitOutcome = 'hit';
  let outcomeByte = 0;
  let damage: Triple = [0, 0, 0];
  let nul = record.nul;

  const nulCheck = nulElementCheck(src.element, record.nul);
  if (nulCheck.nullified) {
    outcome = 'nullified';
    outcomeByte = 2;
    nul = nulCheck.counters;
    f.resultMask = cmd.damageClass & 0xff;
    f.immunityCount = 1;
  } else {
    const roll = typeof io.hit === 'function' ? io.hit() : io.hit;
    if (roll === 1) {
      outcome = 'miss';
      outcomeByte = 1;
    } else if (roll === 2) {
      outcome = 'noEffect';
    } else {
      f.resultMask = cmd.damageClass & 0xff;
      f.classLeft = f.resultMask;
      let hp = 0;
      let mp = 0;
      let ctb = 0;
      if (src.power !== 0) {
        if ((cmd.damageClass & 1) !== 0) {
          hp = hpClass(inp, io, src, w);
          outcomeByte = f.reduced;
        }
        if ((f.resultMask & 2) !== 0) mp = mpClass(inp, io, src, w);
        if ((f.resultMask & 4) !== 0) {
          f.classLeft &= ~4;
          ctb = ctbClass(inp, io, src);
        }
      }
      damage = [hp, mp, ctb];
    }
  }

  let mask = f.resultMask;
  let classLeft = f.classLeft;
  if (outcome === 'hit') {
    const tail = tailSteps(inp, damage, mask, classLeft);
    damage = tail.damage;
    mask = tail.mask;
    classLeft = tail.classLeft;
  }
  const clamp = finalClamp({
    damage,
    mask,
    flagsDamage: cmd.flagsDamage,
    userAutoB: user.autoB,
    userBuffFlags: user.buffFlags,
    overkillThreshold: target.overkillThreshold,
    running: [target.runningHp, target.runningMp, target.runningCtb],
  });
  // The record's un-varied base is computed AFTER the clamp has reduced the running totals.
  const after: HitTarget = {
    ...target,
    runningHp: clamp.running[0],
    runningMp: clamp.running[1],
    runningCtb: clamp.running[2],
  };
  const unvaried = baseDamage(baseOf(inp, src, 1, 0, false, after), io.draw).value;
  return {
    outcome,
    amounts: clamp.amounts,
    resultMask: clamp.overkill ? mask | 0x80 : mask,
    outcomeByte,
    unvariedHpBase: unvaried,
    running: clamp.running,
    nul,
    bonusFlag: w.bonusFlag,
    classLeft,
    immunityCount: f.immunityCount,
    armored: f.armored,
    guardMark: f.guardMark,
    defUsed: w.defUsed,
    mdfUsed: w.mdfUsed,
  };
}
