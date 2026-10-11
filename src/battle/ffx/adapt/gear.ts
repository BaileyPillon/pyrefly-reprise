/**
 * The gear kernel, reached from the engine (re-parity RC4 lane FFX-C; **FFX only**).
 *
 * `kernel/gear.ts` is the game's party stat builder and battle-start gear loop over the game's own auto-ability table (`kernel/gear-table.ts`). The
 * engine keeps gear as two `EquipmentDef`s whose abilities are our ids; this module turns them into the game's words (`./gear-ids.ts`), runs the kernel,
 * and names the answer in the engine's own terms: the summed percents for the damage chain and the prep screens, the maximum HP and MP, the equipment
 * critical bonus, and the resistance bytes and extra immunities `applyEquipmentToCombatant` writes onto a combatant. No default for anything the engine
 * cannot say: an ability without a record of the game's cannot be named (the id map is exhaustive).
 */

import type { AutoAbilityId, StatusId } from '../../common/types.ts';
import type { EquipmentBearer } from '../equipment.ts';
import { ExtraBit } from '../kernel/status-types.ts';
import {
  GEAR_ROW_CRIT,
  GearEntry,
  damageBytes,
  gearEffects,
  maxHpFrom,
  maxMpFrom,
  type GearItem,
  type GearResult,
} from '../kernel/gear.ts';
import { AUTO_ABILITY_RECORDS } from '../kernel/gear-table.ts';
import { autoAbilityWord } from './gear-ids.ts';

/** The 25 regular statuses in the order of the game's chance, duration-offset and resistance bytes (status numbers 0 to 24). */
export const STATUS_BY_NUMBER: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'threaten',
  'sleep', 'silence', 'darkness', 'shell', 'protect', 'reflect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste', 'slow',
];

/** The extra-status bits that have an engine status (the four Distill bits have none): what a gear's extra-immunity word protects. */
export const EXTRA_IMMUNITY_STATUS: ReadonlyArray<readonly [number, StatusId]> = [
  [ExtraBit.Scan, 'scan'],
  [ExtraBit.Shield, 'shield'],
  [ExtraBit.Boost, 'boost'],
  [ExtraBit.Eject, 'eject'],
  [ExtraBit.AutoLife, 'auto-life'],
  [ExtraBit.Curse, 'curse'],
  [ExtraBit.Defend, 'defend'],
  [ExtraBit.Guard, 'guard'],
  [ExtraBit.Sentinel, 'sentinel'],
  [ExtraBit.Doom, 'doom'],
];

/** The kernel's view of what a bearer wears: each piece's crit byte (the game's 3 unless the data says otherwise) and its ability words. */
export function gearItemsOf(b: EquipmentBearer): GearItem[] {
  const eq = b.equipment;
  if (eq === undefined) return [];
  return [eq.weapon, eq.armor].map((item) => ({
    crit: item.bonusCrit ?? GEAR_ROW_CRIT,
    words: item.autoAbilities.map((id: AutoAbilityId) => autoAbilityWord(id)),
  }));
}

const NO_GEAR: GearResult = gearEffects([], AUTO_ABILITY_RECORDS);

interface Memo {
  weapon: readonly AutoAbilityId[];
  armor: readonly AutoAbilityId[];
  weaponCrit: number;
  armorCrit: number;
  result: GearResult;
}
const memo = new WeakMap<object, Memo>();

function sameIds(a: readonly AutoAbilityId[], b: readonly AutoAbilityId[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * What the game's builder and gear loop make of the gear a bearer wears. A bearer with no gear gets all zeros. The answer is read-only: it is shared
 * between calls while the two pieces still hold the same abilities and crit bytes (the damage chain asks for it several times a hit), and recomputed the
 * moment either piece changes, whether its list was replaced or edited in place.
 */
export function gearOf(b: EquipmentBearer): Readonly<GearResult> {
  const eq = b.equipment;
  if (eq === undefined) return NO_GEAR;
  const weaponCrit = eq.weapon.bonusCrit ?? GEAR_ROW_CRIT;
  const armorCrit = eq.armor.bonusCrit ?? GEAR_ROW_CRIT;
  const hit = memo.get(eq);
  if (hit !== undefined && hit.weaponCrit === weaponCrit && hit.armorCrit === armorCrit && sameIds(hit.weapon, eq.weapon.autoAbilities) && sameIds(hit.armor, eq.armor.autoAbilities)) {
    return hit.result;
  }
  const result = gearEffects(gearItemsOf(b), AUTO_ABILITY_RECORDS);
  memo.set(eq, { weapon: [...eq.weapon.autoAbilities], armor: [...eq.armor.autoAbilities], weaponCrit, armorCrit, result });
  return result;
}

/** The builder entries the engine's six `+N%` families are summed on. */
export const FAMILY_ENTRY = {
  hp: GearEntry.Hp,
  mp: GearEntry.Mp,
  strength: GearEntry.PhysDealt,
  magic: GearEntry.MagDealt,
  defense: GearEntry.PhysTaken,
  'magic-def': GearEntry.MagTaken,
} as const;

export type GearFamily = keyof typeof FAMILY_ENTRY;

/**
 * The percent a bearer's gear gives one family: for HP and MP the sum of the percents of every worn ability of the family (it raises the maximum), for
 * the four damage families the byte the party percent modifier reads (the low byte of that sum).
 */
export function familyPercent(b: EquipmentBearer, family: GearFamily): number {
  const g = gearOf(b);
  const entry = FAMILY_ENTRY[family];
  return entry === GearEntry.Hp || entry === GearEntry.Mp ? (g.sums[entry] as number) : (damageBytes(g.sums)[entry - GearEntry.PhysDealt] as number);
}

/** The maximum HP the builder makes of `base` (the Sphere Grid HP) with this bearer's gear. */
export function gearMaxHp(b: EquipmentBearer, base: number): number {
  const g = gearOf(b);
  return maxHpFrom(base, g.sums[GearEntry.Hp] as number, g.wordB);
}

/** The maximum MP the builder makes of `base` with this bearer's gear. */
export function gearMaxMp(b: EquipmentBearer, base: number): number {
  const g = gearOf(b);
  return maxMpFrom(base, g.sums[GearEntry.Mp] as number, g.wordB);
}
