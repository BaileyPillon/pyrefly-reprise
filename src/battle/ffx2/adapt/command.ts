/**
 * The command row an FFX-2 action runs on (re-parity W3; **FFX-2 only**).
 *
 * An ability that carries the game's own row (`AbilityDef.ffx2Record`) runs on it, word for word; the generic Attack
 * runs on the row of the user (a girl's by the dressphere she wears, an enemy's own, `adapt/attack-records.ts`); an
 * ability with no row (a few of ours the game has no command for, and every ability a test builds) runs on a row
 * derived from its own fields, the way the engine always read them (`deriveRecord`). Either way the kernels see one
 * shape, {@link ResolvedCommand}.
 *
 * **AGENTS.md hard rule 5 (magic never rolls).** The game rolls accuracy for a few magical rows; the engine's rule is
 * that magic always hits. A row whose damage type is magical and whose accuracy formula is not 0 is therefore kept
 * never-missing (`ruleFive`), unless the ability opts back in with `canMiss: true` (the one sourced case, Enchanted
 * Ammo). The rows this holds back are listed in `docs/handoff/re-parity-w3.md` for Bailey; physical rows follow the game.
 */

import type { AbilityDef, FFX2CommandRecord, Rng } from '../../common/types.ts';
import type { Ffx2Unit } from '../internal.ts';
import type { HitCommand } from '../kernel/hit.ts';
import type { PipelineCommand } from '../kernel/pipeline-types.ts';
import { STATUS_COUNT, type StatusCommand } from '../kernel/statusTypes.ts';
import { partyAttackRecord } from './attack-records.ts';
import { isStageSlot, slotOf, stageDown } from './slots.ts';
import { elementMask } from './words.ts';

/** The game's formula number of each damage formula key (`kernel/damage.ts`). */
export const FORMULA_NUMBER: Readonly<Record<string, number>> = {
  strength: 0,
  'piercing-strength': 1,
  magic: 2,
  'piercing-magic': 3,
  'percent-current': 4,
  'fixed-no-variance': 5,
  healing: 6,
  'percent-total': 7,
  fixed: 8,
  'special-magic': 9,
  'user-max-hp': 0xb,
  gil: 0xc,
  'deal-9999': 0xe,
  fractional: 7,
  lancet: 1,
};

/** `Cmd+0x14` bits the adapters read besides the accuracy formula (bits 3 to 5). */
export const MISC_DARKNESS = 0x40;
export const MISC_ABSORB = 0x100;
export const MISC_STEAL_ITEM = 0x200;
export const MISC_RANDOM_TARGETS = 0x4000;
export const MISC_USES_WEAPON = 0x10000;
export const MISC_NEEDS_DEAD = 0x40000;
export const MISC_BRIBE = 0x4000000;
/** `Cmd+0x1c` bits. */
export const DAMAGE_PHYSICAL = 0x1;
export const DAMAGE_MAGICAL = 0x2;
export const DAMAGE_CAN_CRIT = 0x4;
export const DAMAGE_FIXED_CRIT = 0x8;
export const DAMAGE_HEAL = 0x10;
export const DAMAGE_CLEANSE = 0x20;
export const DAMAGE_CAP_9999 = 0x40;
export const DAMAGE_CAP_99999 = 0x80;
export const DAMAGE_STEAL_GIL = 0x100;
/** `Cmd+0x10` bits. */
export const TARGET_DEAD = 0x40;
export const TARGET_ALL = 0x80;

/** The command ids of Sticky Fingers and Master Thief, which change the steal rolls (`kernel/steal.ts`). */
const COMMAND_STICKY_FINGERS = 0x30c4;
const COMMAND_MASTER_THIEF = 0x30c5;

/** Everything the kernels read about the command, in their own terms. */
export interface ResolvedCommand {
  /** The row the kernels run on (the game's, or derived), after nothing else is changed. */
  record: FFX2CommandRecord;
  source: 'record' | 'derived';
  /** The accuracy formula the hit kernel runs (0 when rule 5 holds a rolling magical row back). */
  accuracyFormula: number;
  /** Rule 5 turned this row's accuracy formula into 0. */
  ruleFive: boolean;
  pipeline: PipelineCommand;
  hit: HitCommand;
  status: StatusCommand;
  hits: number;
  absorbs: boolean;
  stealsItem: boolean;
  stealsGil: boolean;
  bribe: boolean;
  /** The game's chance that a Petrified target shatters (`Cmd+0x2d`). */
  shatter: number;
  /** The row can target all (`Cmd+0x10 & 0x80`): with the player's choice it halves the damage. */
  canTargetAll: boolean;
  /** Derived rows only: the ability's own statuses the kernels' 24-slot tables cannot hold (rolled by the engine). */
  engineRiders: ReadonlyArray<AbilityDef['statusEffects'][number]>;
}

/** The accuracy formula of a `Cmd+0x14` word. */
export function accuracyFormula(flagsMisc: number): number {
  return (flagsMisc >> 3) & 7;
}

/** True for the generic Attack, which runs on the row of whoever uses it. */
function isGenericAttack(ability: AbilityDef): boolean {
  return ability.id === 'attack' || (ability.category === 'attack' && ability.ffx2Record === undefined && ability.id.endsWith('-attack'));
}

/** The record the generic Attack of this user runs on, or undefined (the engine's own ability is then derived). */
function attackRecordFor(user: Ffx2Unit): FFX2CommandRecord | undefined {
  if (user.side === 'party') return partyAttackRecord(user.dresspheres?.current);
  return user.enemy?.ffx2Record?.plainAttack;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/**
 * A record from an ability's own fields (no game row). The mapping is the engine's old reading of each field:
 * the formula key picks the game's formula number, the damage type the physical/magical bit, `crit-eligible` the crit
 * bit, `heals` the heal bit, `drains` the absorb bit, the status list the chance tables.
 */
export function deriveRecord(ability: AbilityDef): FFX2CommandRecord {
  const extra = ability.extra ?? {};
  const flags = ability.flags;
  const damaging = ability.formula !== 'none' && ability.formula !== 'ctb';
  let formula = FORMULA_NUMBER[ability.formula] ?? 0;
  let power = ability.formula === 'multiple' ? 0 : ability.power;
  let damageClass = damaging ? 1 : 0;

  if (ability.formula === 'fixed' && extra['noVariance'] === true) formula = 5;
  if (ability.formula === 'user-max-hp') power = Math.round((ability.power * 16) / 10); // the engine said tenths of max HP, the game sixteenths
  if (ability.formula === 'gil') power = 1; // the formula reads the gil offered; the pipeline needs a non-zero power to run it
  if (ability.formula === 'multiple') {
    const flat = typeof extra['flat'] === 'number' ? extra['flat'] : 0;
    const byLevel = typeof extra['userLevelMultiplier'] === 'number' ? extra['userLevelMultiplier'] : 0;
    const byMaxHp = typeof extra['userMaxHpMultiplier'] === 'number' ? extra['userMaxHpMultiplier'] : 0;
    const byMissing = typeof extra['userMissingHpFraction'] === 'number' ? extra['userMissingHpFraction'] : 0;
    if (flat > 0) { formula = 8; power = Math.max(1, Math.round(flat / 50)); }
    else if (byLevel > 0) { formula = 0x12; power = Math.round(byLevel); }
    else if (byMaxHp > 0) { formula = 0xb; power = Math.round(byMaxHp * 16); }
    else if (byMissing > 0) { formula = 0x11; power = Math.round(byMissing * 16); }
  }
  if (!damaging) { power = 0; formula = 0; }

  const restoresMp = extra['restoresMp'];
  const alsoRestoresMp = extra['alsoRestoresMp'];
  if (typeof restoresMp === 'number' && restoresMp > 0) {
    formula = 5; power = Math.max(1, Math.round(restoresMp / 50)); damageClass = 2;
  } else if (typeof alsoRestoresMp === 'number' && alsoRestoresMp > 0) {
    damageClass |= 2;
  }
  if (extra['mpOnly'] === true) damageClass = 2;
  if (typeof extra['mpFractionOfCurrent'] === 'number' || typeof extra['mpFractionOfMax'] === 'number') damageClass |= 2;
  if (typeof extra['setHpTo'] === 'number') { formula = 0xa; power = 1; damageClass = 1; }
  if (typeof extra['setMpTo'] === 'number') damageClass |= 2;
  if (flags.includes('drains-mp')) damageClass |= 2;

  // accuracy: the engine's old reading of the hit check
  let accFormula = 0;
  let accuracy = 0;
  const restorative = flags.includes('heals') || ability.formula === 'healing';
  if (ability.canMiss === false || !damaging) accFormula = 0;
  // An item never rolls: 67 of the game's 68 item rows are accuracy formula 0 (the 68th is Farplane Shadow's death roll),
  // which is also what the engine always did (`isRestorative`). Only an item with no game row of its own gets here.
  else if (ability.category === 'item') accFormula = 0;
  else if (typeof ability.accuracy === 'number') { accFormula = 1; accuracy = clampByte(ability.accuracy); }
  else if (restorative) accFormula = 0;
  else if (ability.damageType === 'magical' && ability.canMiss !== true) accFormula = 0;
  else accFormula = 2;

  let misc = accFormula << 3;
  if (ability.damageType === 'physical' || flags.includes('affected-by-darkness')) misc |= MISC_DARKNESS;
  if (flags.includes('drains') || flags.includes('drains-mp')) misc |= MISC_ABSORB;
  if (ability.targeting === 'random-enemy' || ability.targeting === 'random-ally') misc |= MISC_RANDOM_TARGETS;
  if (flags.includes('inherits-weapon-properties')) misc |= MISC_USES_WEAPON;
  if (flags.includes('misses-if-target-alive')) misc |= MISC_NEEDS_DEAD;
  if (!damaging && typeof extra['stealAttempt'] === 'string') misc |= MISC_STEAL_ITEM;

  let dmg = 0;
  if (ability.damageType === 'physical') dmg |= DAMAGE_PHYSICAL;
  if (ability.damageType === 'magical') dmg |= DAMAGE_MAGICAL;
  if (flags.includes('crit-eligible')) dmg |= DAMAGE_CAN_CRIT;
  if (flags.includes('crit-eligible') && ability.bonusCrit !== undefined && !flags.includes('adds-equipment-crit')) dmg |= DAMAGE_FIXED_CRIT;
  if (flags.includes('heals') || ability.formula === 'healing') dmg |= DAMAGE_HEAL;
  if (flags.includes('removes-statuses') && ability.removesStatuses.length > 0) dmg |= DAMAGE_CLEANSE;
  if (flags.includes('always-break-damage-limit')) dmg |= DAMAGE_CAP_99999;
  else if (flags.includes('never-break-damage-limit')) dmg |= DAMAGE_CAP_9999;
  if (extra['stealsGil'] === true) { dmg |= DAMAGE_STEAL_GIL; power = 0; damageClass = 0; }

  let target = 0;
  if (flags.includes('can-target-dead') || flags.includes('misses-if-target-alive')) target |= TARGET_DEAD;
  if ((ability.category === 'blackmagic' || ability.category === 'whitemagic') && (ability.targeting === 'all-enemies' || ability.targeting === 'all-allies')) target |= TARGET_ALL;

  const status1: Record<number, number> = {};
  const status2: Record<number, number> = {};
  const statusTime: Record<number, number> = {};
  if ((dmg & DAMAGE_CLEANSE) !== 0) {
    for (const id of ability.removesStatuses) {
      const slot = slotOf(id);
      if (slot === undefined) continue;
      if (slot.group === 1) status1[slot.index] = 254;
      // The game's cleanse rows carry 127 here: a cleanse SUBTRACTS the amount from a timed status's counter (a stage is simply set to 0),
      // so an amount of 1 would only shave a step off Slow or Stop. 127 strips whatever time is left, which is what 'removes' always meant.
      else { status2[slot.index] = 254; statusTime[slot.index] = 127; }
    }
  } else {
    for (const app of ability.statusEffects) {
      const slot = slotOf(app.status);
      if (slot === undefined) continue;
      // The engine's old reading of an authored chance of 254 or more: "always lands, unless the target is immune" (a resist
      // byte of 255 still blocks it: a Ribbon, a boss). That is the game's byte 254; the game's 255 is stronger (it lands
      // THROUGH a resist of 255), and a row that carries one keeps it. A derived row stays at 254.
      const chance = Math.min(254, clampByte(app.chance));
      if (slot.group === 1) {
        status1[slot.index] = Math.max(status1[slot.index] ?? 0, chance);
      } else {
        status2[slot.index] = Math.max(status2[slot.index] ?? 0, chance);
        if (isStageSlot(slot.index)) {
          const steps = Math.max(1, app.stacks ?? 1);
          statusTime[slot.index] = app.status === stageDown(slot.index) ? -steps : steps;
        } else {
          statusTime[slot.index] = app.duration > 0 ? Math.max(1, Math.min(125, Math.round(app.duration))) : 125;
        }
      }
    }
  }

  const stealAttempt = extra['stealAttempt'];
  return {
    id: stealAttempt === 'guaranteed' ? COMMAND_STICKY_FINGERS : stealAttempt === 'force-rare' ? COMMAND_MASTER_THIEF : 0,
    category: ability.category === 'blackmagic' ? 1 : ability.category === 'whitemagic' ? 2 : 0,
    flagsTarget: target,
    flagsMisc: misc,
    flagsDamage: dmg,
    damageClass,
    formula,
    critByte: ability.bonusCrit !== undefined ? clampByte(ability.bonusCrit) : 0,
    accuracy,
    power: clampByte(power),
    hits: Math.max(0, Math.round(ability.hits ?? 1)),
    shatter: flags.includes('shatter') ? clampByte(ability.shatterChance ?? 0) : 0,
    element: elementMask(ability.element),
    killer: 0,
    ...(Object.keys(status1).length > 0 ? { status1 } : {}),
    ...(Object.keys(status2).length > 0 ? { status2 } : {}),
    ...(Object.keys(statusTime).length > 0 ? { statusTime } : {}),
  };
}

/** A sparse index-to-byte map as the kernels' 24-entry table. */
function table(sparse: Readonly<Record<number, number>> | undefined): number[] {
  const out = new Array<number>(STATUS_COUNT).fill(0);
  if (sparse !== undefined) for (const [i, v] of Object.entries(sparse)) out[Number(i)] = v;
  return out;
}

/**
 * The statuses of a derived ability that have no slot in the game's tables (the engine's hidden Delay effect and
 * Action-cancel, Shattering): the engine rolls those itself with the same landing rule.
 */
function ridersWithoutSlot(ability: AbilityDef, derived: boolean): ResolvedCommand['engineRiders'] {
  return ability.statusEffects.filter((app) => {
    if (slotOf(app.status) === undefined) return true;
    // A derived cleanse cannot also inflict: the kernels run one mode per command.
    return derived && ability.flags.includes('removes-statuses') && ability.removesStatuses.length > 0;
  });
}

/**
 * Which of a command's rows runs this cast: the index into `FFX2CommandRecord.pickOne`, drawn once (the game's script
 * picks one row of Russian Roulette's five, 1 in 5 each), or 0 with no draw for every other command.
 */
export function pickVariant(ability: AbilityDef, rng: Rng): number {
  const rows = ability.ffx2Record?.pickOne;
  if (rows === undefined || rows.length < 2) return 0;
  return rng.pick(rows.map((_, i) => i));
}

/**
 * The command `user` runs when it uses `ability`. `hitsOverride` is a minigame outcome (Trigger Happy, a dice roll);
 * above 0 it replaces the row's hits, as in the game. `variant` is {@link pickVariant}'s answer.
 */
export function resolveCommand(ability: AbilityDef, user: Ffx2Unit, hitsOverride = 0, variant = 0): ResolvedCommand {
  const generic = isGenericAttack(ability) ? attackRecordFor(user) : undefined;
  // A monster whose game list gives this move a row of its own (`FFX2MonsterRecord.commands`) runs that row, not the ability's.
  const given = generic ?? user.enemy?.ffx2Record?.commands?.[ability.id] ?? ability.ffx2Record;
  const record = given === undefined ? deriveRecord(ability) : (given.pickOne?.[variant] ?? given);
  const derived = given === undefined;

  let flagsMisc = record.flagsMisc;
  // An ability the engine aims "at a random target" is a script that picks its target each hit (Shuyin's Attack, Shiva's
  // and Baralai's Triple Attack): the game's row for those is an ordinary single-target command, so the engine's targeting
  // is what asks for the random pick, one target per hit from the same stream the game uses for it (stream 5).
  if (ability.targeting === 'random-enemy' || ability.targeting === 'random-ally') flagsMisc |= MISC_RANDOM_TARGETS;
  let ruleFive = false;
  if ((record.flagsDamage & 3) === DAMAGE_MAGICAL && accuracyFormula(flagsMisc) !== 0 && ability.canMiss !== true) {
    flagsMisc &= ~0x38; // AGENTS.md rule 5: magic never rolls
    ruleFive = true;
  }
  const formula = accuracyFormula(flagsMisc);

  const pipeline: PipelineCommand = {
    id: record.id,
    category: record.category,
    flagsTarget: record.flagsTarget,
    flagsMisc,
    flagsDamage: record.flagsDamage,
    damageClass: record.damageClass,
    formula: record.formula,
    power: record.power,
    element: record.element,
    speciesKiller: record.killer,
  };
  const hit: HitCommand = {
    id: record.id,
    formula,
    darknessApplies: (flagsMisc & MISC_DARKNESS) !== 0,
    accuracy: record.accuracy,
    power: record.power,
    hits: record.hits,
    physicalOnly: (record.flagsDamage & 3) === DAMAGE_PHYSICAL,
    randomTargets: (flagsMisc & MISC_RANDOM_TARGETS) !== 0,
  };
  const status: StatusCommand = {
    chance1: table(record.status1),
    chance2: table(record.status2),
    amount2: table(record.statusTime),
    cleanse: (record.flagsDamage & DAMAGE_CLEANSE) !== 0,
    usesWeapon: (flagsMisc & MISC_USES_WEAPON) !== 0,
  };
  return {
    record,
    source: derived ? 'derived' : 'record',
    accuracyFormula: formula,
    ruleFive,
    pipeline,
    hit,
    status,
    hits: hitsOverride > 0 ? hitsOverride : record.hits,
    absorbs: (flagsMisc & MISC_ABSORB) !== 0,
    stealsItem: (flagsMisc & MISC_STEAL_ITEM) !== 0,
    stealsGil: (record.flagsDamage & DAMAGE_STEAL_GIL) !== 0,
    bribe: (flagsMisc & MISC_BRIBE) !== 0,
    shatter: record.shatter,
    canTargetAll: (record.flagsTarget & TARGET_ALL) !== 0,
    engineRiders: ridersWithoutSlot(ability, derived),
  };
}
