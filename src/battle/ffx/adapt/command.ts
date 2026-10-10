/**
 * An ability seen the way the parity kernels read a command record (re-parity W1; **FFX only**).
 *
 * The kernels take the game's command record fields: the formula, power and element, the type byte, the two flag
 * words and the damage classes, the accuracy and crit bytes. An {@link AbilityDef} carries the numbers (formula,
 * power, element, accuracy byte, crit byte) in its own fields and the rest in `AbilityDef.record`, the game's own
 * record (`src/data/ffx/command-records/`). This module builds the kernels' views of one ability:
 *
 * - **With a record** the type byte, the flag words and the damage classes are the game's. The Delay Attack and
 *   Delay Buster bits stay in the word: the hit kernel applies the delay itself (re-parity W2).
 * - **Without one** (an ability of ours) the same fields are derived from the ability's own flags, exactly the
 *   facts the engine always read: the damage type, `crit-eligible`, `heals`, `drains`, the cap flags, and the old
 *   accuracy rule (`canMiss`, the accuracy byte, the user's side). The kernels then run on that derived command,
 *   so such an ability keeps today's inputs and the game's arithmetic.
 *
 * - **An enemy's plain Attack** is not the party's record (0x3000, accuracy formula 3, which reads the user's Accuracy
 *   stat): a monster attacks with a monster-side record. The enemy carries the game's own where it is known
 *   ({@link FFXPlainAttack}, the possessed aeons' 0x6000); an enemy with none keeps today's reading, derived from the
 *   ability's flags (always hits, can crit).
 *
 * An input the ability cannot supply is an error, never a default: a record with accuracy formula 1 or 2 needs
 * the ability's accuracy byte.
 */

import type { AbilityDef, FFXCommandRecord, FFXPlainAttack, FormulaKey, Side } from '../../common/types.ts';
import { CMD_AFFECTED_BY_DARKNESS, CMD_ACCURACY_FORMULA_SHIFT, CMD_NO_EFFECT_ON_LIVING } from '../kernel/hit.ts';
import { CMD_CAN_CRIT, CMD_CRIT_BONUS_FROM_EQUIPMENT } from '../kernel/crit.ts';
import { elementMask } from './words.ts';

/** Our formula keys as the game's formula numbers (`research/re-ffx-damage.md` section 2). */
export const FORMULA_NUMBER: Readonly<Record<FormulaKey, number>> = {
  none: 0,
  strength: 0x01,
  'piercing-strength': 0x02,
  magic: 0x03,
  'piercing-magic': 0x04,
  'percent-current': 0x05,
  'fixed-no-variance': 0x06,
  healing: 0x07,
  'percent-total': 0x08,
  fixed: 0x09,
  ctb: 0x0d,
  'special-magic': 0x0f,
  'user-max-hp': 0x10,
  gil: 0x15,
  'deal-9999': 0x17,
  // Lancet reads MAG and the user's Focus and ignores the target's defence: formula 4.
  lancet: 0x04,
  // FFX-2 shapes: an FFX data file never carries them; the old engine computed 0 for them and so does formula 0.
  fractional: 0,
  multiple: 0,
};

/** `Cmd+0x1c` bits the kernels read beyond the hit check's three (kernel/hit.ts). */
const MISC_ABSORB = 0x100;
const MISC_DELAY_ATTACK = 0x2000;
const MISC_DELAY_BUSTER = 0x4000;
const MISC_PIERCE_ARMOR = 0x10000;
const MISC_USES_WEAPON = 0x40000;
/** `Cmd+0x20` bits. */
const DMG_PHYSICAL = 0x01;
const DMG_MAGICAL = 0x02;
const DMG_HEAL = 0x10;
const DMG_CLEANSE = 0x20;
const DMG_CAP_9999 = 0x40;
const DMG_CAP_99999 = 0x80;

/** The first id of the item commands: Alchemy tests the range 0x2000 to 0x2fff. */
const ITEM_COMMAND_BASE = 0x2000;
/** The party's default attack command (what Berserk multiplies). */
export const DEFAULT_ATTACK_COMMAND = 0x3000;

/** The part of a combatant the reading of a command depends on: its side, and an enemy's own plain Attack record. */
export interface CommandUser {
  side: Side;
  enemy?: { plainAttack?: FFXPlainAttack | undefined } | undefined;
}

/** One ability as the kernels read it: the record words (the game's or derived) and the ability's numbers. */
export interface ResolvedCommand {
  record: FFXCommandRecord;
  /** True when `record` was derived from the ability's flags (the ability has no game record). */
  derived: boolean;
  /** `Cmd+0x1c`, Delay Attack and Delay Buster included. */
  flagsMisc: number;
  /** `Cmd+0x28`: the formula number. */
  formula: number;
  /** `Cmd+0x2d`: the element bits. */
  element: number;
  /** `Cmd+0x29`: the accuracy byte, when the command has one (an enemy's own Attack record brings its own). */
  accuracy: number | undefined;
  /** `Cmd+0x27`: the crit bonus byte. */
  critBonus: number;
  /** The id the pipeline sees as the command being run: the party's Attack for a generic Attack, else the record's own. */
  currentCommand: number;
}

/**
 * The damage classes the ability's own flags imply: the pools the engine has always applied its amount to (HP 1, MP 2,
 * CTB 4). A derived record has these; a recorded ability has the game's, and the engine also keeps these to decide
 * which of its zero-damage casts still print a number (Bio Fury is a cast with no damage class in the game).
 */
export function engineDamageClass(def: AbilityDef): number {
  if (def.formula === 'none') return 0;
  if (def.formula === 'lancet') return 3;
  if (def.formula === 'ctb') return 4;
  if (def.flags.includes('drains-mp')) return 2;
  const restores = def.extra?.['restoresPool'];
  if (def.flags.includes('heals') && restores === 'mp') return 2;
  if (def.flags.includes('heals') && restores === 'both') return 3;
  return 1;
}

/** The accuracy formula the old hit rule amounted to, for an ability with no record. */
function derivedAccuracyFormula(def: AbilityDef, userSide: Side): number {
  if (def.canMiss === false) return 0;
  if (def.accuracy !== undefined) return 2;
  if (userSide === 'enemy') return 0;
  return def.damageType === 'physical' ? 3 : 0;
}

/** The record an ability with no game record would have, from the flags the engine always read. */
function deriveRecord(def: AbilityDef, userSide: Side): FFXCommandRecord {
  const flags = def.flags;
  let misc = derivedAccuracyFormula(def, userSide) << CMD_ACCURACY_FORMULA_SHIFT;
  if (flags.includes('affected-by-darkness')) misc |= CMD_AFFECTED_BY_DARKNESS;
  if (flags.includes('drains') || flags.includes('drains-mp') || def.formula === 'lancet') misc |= MISC_ABSORB;
  if (flags.includes('piercing') || flags.includes('ignores-armored') || def.ignoresDefense === true) misc |= MISC_PIERCE_ARMOR;
  if (flags.includes('inherits-weapon-properties')) misc |= MISC_USES_WEAPON;
  if (flags.includes('misses-if-target-alive')) misc |= CMD_NO_EFFECT_ON_LIVING;
  if (flags.includes('weak-delay')) misc |= MISC_DELAY_ATTACK;
  if (flags.includes('strong-delay')) misc |= MISC_DELAY_BUSTER;

  let damage = def.damageType === 'physical' ? DMG_PHYSICAL : def.damageType === 'magical' ? DMG_MAGICAL : 0;
  if (flags.includes('crit-eligible')) damage |= CMD_CAN_CRIT;
  if (flags.includes('adds-equipment-crit')) damage |= CMD_CRIT_BONUS_FROM_EQUIPMENT;
  if (flags.includes('heals')) damage |= DMG_HEAL;
  if (flags.includes('removes-statuses')) damage |= DMG_CLEANSE;
  if (flags.includes('never-break-damage-limit')) damage |= DMG_CAP_9999;
  if (flags.includes('always-break-damage-limit')) damage |= DMG_CAP_99999;

  return {
    // A derived item command sits in the item range (Alchemy tests it); nothing else reads a derived id.
    id: def.category === 'item' ? ITEM_COMMAND_BASE : 0,
    type: def.damageType === 'magical' ? 1 : 0,
    flagsMisc: misc,
    flagsDamage: damage,
    damageClass: engineDamageClass(def),
  };
}

/**
 * The kernels' view of one ability used by `user`. The generic Attack used by an enemy never reads the party's
 * record: it takes the enemy's own plain-Attack record when the game says which, else the record derived from the
 * ability's flags (the engine's reading before the wiring).
 */
export function resolveCommand(def: AbilityDef, user: CommandUser): ResolvedCommand {
  const plain = isDefaultAttack(def) && user.side === 'enemy';
  const own = plain ? user.enemy?.plainAttack : undefined;
  const record = own?.record ?? (plain ? deriveRecord(def, user.side) : (def.record ?? deriveRecord(def, user.side)));
  return {
    record,
    derived: own === undefined && (plain || def.record === undefined),
    flagsMisc: record.flagsMisc,
    formula: FORMULA_NUMBER[def.formula],
    element: elementMask(def.element),
    accuracy: own?.accuracy ?? def.accuracy,
    critBonus: own?.critBonus ?? def.bonusCrit ?? 0,
    currentCommand: isDefaultAttack(def) && own === undefined ? DEFAULT_ATTACK_COMMAND : record.id,
  };
}
/** The accuracy formula of a command, bits 3 to 5 of `Cmd+0x1c`. */
export function accuracyFormulaOf(command: ResolvedCommand): number {
  return (command.flagsMisc >>> CMD_ACCURACY_FORMULA_SHIFT) & 7;
}

/** `Cmd+0x29`: the accuracy byte formulas 1 and 2 read. The command must carry it for those; no other formula reads it. */
export function accuracyByteOf(abilityId: string, command: ResolvedCommand): number {
  const formula = accuracyFormulaOf(command);
  if (formula !== 1 && formula !== 2) return command.accuracy ?? 0;
  if (command.accuracy === undefined) {
    throw new Error(`FFX hit kernel: ability '${abilityId}' has accuracy formula ${formula} but no accuracy byte`);
  }
  return command.accuracy;
}
/** True when this command is the one Berserk multiplies: the generic Attack. */
export function isDefaultAttack(def: AbilityDef): boolean {
  return def.id === 'attack';
}
