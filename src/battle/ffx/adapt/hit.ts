/**
 * One hit, computed by the game's own kernels (re-parity W1; **FFX only**).
 *
 * The FFX engine used to roll the hit, the critical hit and the variance itself and run its own damage chain. It now
 * builds the numbers the game's per-hit pipeline reads (`research/re-ffx-damage.md` section 10), hands them to
 * `kernel/hitdamage.ts#calcHitDamage`, and takes back the amounts and the outcome. The kernel does everything the
 * game's function does between the Nul check and the clamp: the hit roll (`kernel/hit.ts`), the base damage of every
 * class, the sixteen modifier steps in the game's order, the critical roll (`kernel/crit.ts`), the element, the cap.
 * The draws come in the game's order (hit, HP variance, critical roll, MP variance, CTB variance) through a
 * {@link HitDraws}.
 *
 * What stays outside the kernel, and in the engine: the status rolls and the turn queue (batch W2), the targeting,
 * the events, Reflect, Cover, the Overdrive gauges, KO and Auto-Life.
 *
 * Every input has a source in the table of `docs/handoff/re-parity-w1.md`; nothing here has a silent default.
 */

import type { AbilityDef, Affinity, ElementId, FFXCombatant } from '../../common/types.ts';
import { damageCap } from '../kernel/aftermath.ts';
import { critCheck, type CritCheckInput } from '../kernel/crit.ts';
import type { NulCounters } from '../kernel/element.ts';
import { hitCheck, HIT, type HitCheckInput, type HitResult } from '../kernel/hit.ts';
import { calcHitDamage, type HitIo, type HitInput, type HitOutcome } from '../kernel/hitdamage.ts';
import { equipmentCrit, hasAuto, weaponElements } from '../equipment.ts';
import { stacks } from '../predicates.ts';
import { affinityLabel } from './affinity.ts';
import { DEFAULT_ATTACK_COMMAND, accuracyByteOf, resolveCommand, type ResolvedCommand } from './command.ts';
import type { HitDraws } from './draws.ts';
import {
  affinityMasks,
  autoWordA,
  autoWordB,
  buffFlags,
  counterOf,
  elementMask,
  extraWord,
  nulCounters,
  percentBytes,
  permWord,
  specialWord,
} from './words.ts';

/** The timed-input bonus payload [ffx-combat-core §5.2]. */
export interface TimingBonus {
  timeRemainingMs: number;
  timerMs: number;
}

/** Everything one hit needs from the engine. */
export interface HitRequest {
  /** The combatant taking the turn: its Luck, Accuracy, Aim and Darkness feed the hit roll, its Luck stack the critical roll. */
  actor: FFXCombatant;
  /** Whose stat block the damage chain reads: the actor, except in a two-actor rig (`ResolveOptions.statsUser`). */
  statsUser: FFXCombatant;
  target: FFXCombatant;
  /** The ability row this hit resolves (the target's own row for an Overdrive with per-target rows). */
  row: AbilityDef;
  /** Overrides `row.power` (a resolved reel shot, a Bushido row, a Fury tier). */
  power?: number;
  timing?: TimingBonus | null;
  /** The gil offered, for Spare Change; 0 when the command carries none. */
  gilSpent?: number;
  /** The target's CTB counter: what the CTB class and formula 0xd read as the running CTB. */
  targetCtb: number;
  /** The target's tick speed (the engine's cached `ICV_BASE` for its Agility). */
  targetTick: number;
  /** True for a counter-attack: a counter never meets Evade & Counter. */
  isCounter: boolean;
  /**
   * The element set to use instead of the row's own plus the actor's weapon strikes. Given only by the old
   * `computeDamage` entry point, whose callers resolve the set themselves.
   */
  elements?: readonly ElementId[];
}

/** What one hit came to. */
export interface HitReport {
  outcome: HitOutcome;
  /** HP, MP and CTB amounts after the clamp. Positive damages (and delays CTB), negative restores. */
  amounts: [number, number, number];
  /** The damage classes this command touches: 1 HP, 2 MP, 4 CTB (the record's `Cmd+0x23`). */
  classes: number;
  crit: boolean;
  /** The 9999 / 99999 cap bit the HP amount. */
  capped: boolean;
  /** The label of the HP hit's elemental reading ('immune' when an immunity cancelled it). */
  affinity: Affinity;
  /** The Nul counters after the hit's Nul check (a covered counter below 0xfe lost one). */
  nul: NulCounters;
}

/** `Cmd+0x1c` bit 18: the command takes its formula, power and element from the weapon. */
const USES_WEAPON = 0x40000;
/** Result word bit: the hit was critical. */
const RESULT_CRIT = 0x100;

/** The counter kind the hit check reads: 2 when the target has Evade & Counter and this is a physical single-target command aimed at someone else. */
function counterKindOf(req: HitRequest, command: ResolvedCommand): number {
  if (req.isCounter || req.actor.id === req.target.id) return 0;
  if ((command.record.flagsDamage & 3) !== 1) return 0;
  const single = req.row.targeting === 'single-enemy' || req.row.targeting === 'single-ally' || req.row.targeting === 'single-any';
  if (!single) return 0;
  return hasAuto(req.target, 'evade-and-counter') ? 2 : 0;
}

/** The hit check's inputs (`kernel/hit.ts`). */
export function hitCheckInputOf(req: HitRequest, command: ResolvedCommand): HitCheckInput {
  const { actor, target, row } = req;
  const status = permWord(target);
  return {
    cmd: { flagsMisc: command.flagsMisc, accuracy: accuracyByteOf(row.id, command) },
    user: {
      acc: actor.stats.acc,
      luck: actor.stats.luck,
      darkness: counterOf(actor, 'darkness'),
      aim: stacks(actor, 'aim'),
      luckStack: stacks(actor, 'luck'),
    },
    target: {
      status,
      eva: target.stats.eva,
      luck: target.stats.luck,
      reflex: stacks(target, 'reflex'),
      jinx: stacks(target, 'jinx'),
    },
    rec: { sleep: counterOf(target, 'sleep'), status },
    counterKind: counterKindOf(req, command),
  };
}

/** The critical check's inputs (`kernel/crit.ts`). */
export function critCheckInputOf(req: HitRequest, command: ResolvedCommand): CritCheckInput {
  const { actor, target } = req;
  return {
    cmd: { flagsDamage: command.record.flagsDamage, critBonus: command.critBonus },
    user: {
      luck: actor.stats.luck,
      luckStack: stacks(actor, 'luck'),
      equipmentCrit: equipmentCrit(actor),
      buffFlags: buffFlags(actor),
    },
    target: { luck: target.stats.luck, jinx: stacks(target, 'jinx') },
  };
}

/** The per-hit pipeline's inputs (`kernel/hitdamage.ts`). */
export function hitInputOf(req: HitRequest, command: ResolvedCommand): HitInput {
  const { actor, target, row } = req;
  const u = req.statsUser;
  const record = command.record;
  const power = req.power ?? row.power;
  const element = req.elements !== undefined ? elementMask(req.elements) : command.element;
  const weaponElement = req.elements !== undefined ? 0 : elementMask(weaponElements(actor));
  const dealt = percentBytes(u).dealt;
  const taken = percentBytes(target).taken;
  const timer = req.timing?.timerMs ?? 0;
  const perm = permWord(target);
  return {
    user: {
      // Not read by the damage code (the id only picks an RNG stream); the stat fields are:
      id: 0,
      str: u.stats.str,
      mag: u.stats.mag,
      cheer: stacks(u, 'cheer'),
      focus: stacks(u, 'focus'),
      maxHp: u.stats.maxHp,
      maxMp: u.stats.maxMp,
      hp: u.hp,
      mp: u.mp,
      perm: permWord(u),
      autoA: autoWordA(u),
      autoB: autoWordB(u),
      buffFlags: buffFlags(u),
      defaultAttack: DEFAULT_ATTACK_COMMAND,
      currentCommand: command.currentCommand,
      // Only command 0x311f (the game's own Auto-Life revival) consumes it, and no ability of ours is that record.
      bonusFlag: 0,
      // A weapon command takes its formula and power from the weapon; every one of the 23 such records carries the
      // plain weapon's 1 and 16, which is what the ability data carries too (checked by the data test).
      weapon: { formula: command.formula, power, element: weaponElement },
      partyDealt: dealt,
      scale: timer > 0 ? { a: Math.min(req.timing?.timeRemainingMs ?? 0, timer), b: timer } : null,
    },
    target: {
      // The id and the save counter are read by formula 0x16 only, which no ability of ours has (FORMULA_NUMBER cannot give it).
      id: 0xff,
      saveCounter: 0,
      def: target.stats.def,
      mdf: target.stats.mdef,
      cheer: stacks(target, 'cheer'),
      focus: stacks(target, 'focus'),
      maxHp: target.stats.maxHp,
      maxMp: target.stats.maxMp,
      baseCtb: req.targetTick * 3,
      runningHp: target.hp,
      runningMp: target.mp,
      runningCtb: req.targetCtb,
      extra: extraWord(target),
      special: specialWord(target),
      delayImmune: target.immunityFlags.includes('immune-to-delay'),
      tickSpeed: req.targetTick,
      overkillThreshold: target.enemy?.rewards.overkillThreshold ?? 0x7fffffff,
      affinity: affinityMasks(target),
      partyTaken: taken,
    },
    cmd: {
      id: record.id,
      type: record.type,
      flagsMisc: command.flagsMisc,
      flagsDamage: record.flagsDamage,
      damageClass: record.damageClass,
      formula: command.formula,
      power,
      element,
    },
    record: {
      perm,
      extra: extraWord(target),
      shell: counterOf(target, 'shell'),
      protect: counterOf(target, 'protect'),
      nul: nulCounters(target),
    },
    gilOffered: req.gilSpent ?? 0,
  };
}

/** Run one hit of an already-resolved command with the given sources of randomness. */
function execute(req: HitRequest, command: ResolvedCommand, io: HitIo): HitReport {
  const input = hitInputOf(req, command);
  const out = calcHitDamage(input, io);
  const hp = out.amounts[0];
  const usesWeapon = (command.flagsMisc & USES_WEAPON) !== 0;
  const element = usesWeapon ? (input.user.weapon.element | input.cmd.element) & 0xff : input.cmd.element;
  let affinity: Affinity = 'normal';
  if (out.outcome === 'hit') {
    if (out.immunityCount > 0 && req.row.formula !== 'none') affinity = 'immune';
    else if (hp !== 0) affinity = affinityLabel(element, input.target.affinity);
  }
  const cap = damageCap(command.record.flagsDamage, input.user.autoB);
  return {
    outcome: out.outcome,
    amounts: [out.amounts[0], out.amounts[1], out.amounts[2]],
    classes: command.record.damageClass,
    crit: (out.resultMask & RESULT_CRIT) !== 0,
    capped: hp !== 0 && Math.abs(hp) >= cap,
    affinity,
    nul: out.nul,
  };
}

/**
 * One hit as the engine takes it: the hit and critical rolls and the variance are drawn in the game's order from
 * the draws, and only when the game's own rules call for a draw.
 */
export function resolveHit(req: HitRequest, draws: HitDraws): HitReport {
  const command = resolveCommand(req.row, req.actor);
  const hitInput = hitCheckInputOf(req, command);
  const critInput = critCheckInputOf(req, command);
  return execute(req, command, {
    draw: draws.variance,
    hit: () => hitCheck(hitInput, draws.percent),
    crit: () => critCheck(critInput, 0, draws.percent).crit,
  });
}

/** The same hit with its three random inputs fixed: a variance roll, a critical decision, and a hit that lands. */
export function fixedHit(req: HitRequest, varianceRoll: number, crit: boolean): HitReport {
  const landed: HitResult = HIT;
  return execute(req, resolveCommand(req.row, req.actor), { draw: () => varianceRoll, hit: landed, crit });
}
