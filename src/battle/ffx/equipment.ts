/**
 * FFX equipment auto-abilities [ffx-combat-core §9].
 *
 * Equipment in FFX **never changes a stat** — it grants auto-abilities only.
 * This module turns a combatant's two equipment slots into the numbers the
 * damage chain, the status roll and the battle-start setup need.
 */

import type {
  AutoAbilityId,
  DamageType,
  ElementId,
  EquipmentDef,
  FFXCombatant,
  StatusId,
} from '../common/types.ts';

/**
 * The structural slice of "someone wearing FFX gear".
 *
 * An `FFXCombatant` satisfies it, and so does an `FFXMemberBuild` — which is
 * the point: the prep menus reason about a build long before an engine has
 * turned it into a combatant, and §9's numbers are the same either way.
 * Purely additive; every existing export here still takes `FFXCombatant`.
 */
export interface EquipmentBearer {
  equipment?: { weapon: EquipmentDef; armor: EquipmentDef } | undefined;
}

/** Every auto-ability the combatant has, weapon first then armour. */
export function autoAbilitiesOf(c: FFXCombatant): AutoAbilityId[] {
  const eq = c.equipment;
  if (!eq) return [];
  return [...eq.weapon.autoAbilities, ...eq.armor.autoAbilities];
}

/** Does the combatant carry this auto-ability? */
export function hasAuto(c: FFXCombatant, id: AutoAbilityId): boolean {
  return bearerHasAuto(c, id);
}

/** {@link hasAuto} for anything wearing gear, combatant or build. */
export function bearerHasAuto(b: EquipmentBearer, id: AutoAbilityId): boolean {
  const eq = b.equipment;
  if (!eq) return false;
  return eq.weapon.autoAbilities.includes(id) || eq.armor.autoAbilities.includes(id);
}

/** Sum of the weapon's and armour's bonus critical rates, in percentage points. */
export function equipmentCrit(c: FFXCombatant): number {
  const eq = c.equipment;
  if (!eq) return 0;
  return (eq.weapon.bonusCrit ?? 0) + (eq.armor.bonusCrit ?? 0);
}

const OFFENSE_PHYSICAL: ReadonlyArray<readonly [AutoAbilityId, number]> = [
  ['strength-3', 3],
  ['strength-5', 5],
  ['strength-10', 10],
  ['strength-20', 20],
];
const OFFENSE_MAGICAL: ReadonlyArray<readonly [AutoAbilityId, number]> = [
  ['magic-3', 3],
  ['magic-5', 5],
  ['magic-10', 10],
  ['magic-20', 20],
];
const DEFENSE_PHYSICAL: ReadonlyArray<readonly [AutoAbilityId, number]> = [
  ['defense-3', 3],
  ['defense-5', 5],
  ['defense-10', 10],
  ['defense-20', 20],
];
const DEFENSE_MAGICAL: ReadonlyArray<readonly [AutoAbilityId, number]> = [
  ['magic-def-3', 3],
  ['magic-def-5', 5],
  ['magic-def-10', 10],
  ['magic-def-20', 20],
];

/**
 * Pools are the one place where an auto-ability really does change a
 * `StatBlock` field: `maxHP = baseHP * (100+N) // 100`, `maxMP` likewise
 * [ffx-combat-core §9].
 */
const POOL_HP: ReadonlyArray<readonly [AutoAbilityId, number]> = [
  ['hp-5', 5],
  ['hp-10', 10],
  ['hp-20', 20],
  ['hp-30', 30],
];
const POOL_MP: ReadonlyArray<readonly [AutoAbilityId, number]> = [
  ['mp-5', 5],
  ['mp-10', 10],
  ['mp-20', 20],
  ['mp-30', 30],
];

/**
 * The six `+N%` auto-ability families of §9, named the way a menu names them
 * rather than the way the damage chain consumes them.
 */
export type BonusFamily = 'strength' | 'magic' | 'defense' | 'magic-def' | 'hp' | 'mp';

const BONUS_TABLES: Readonly<Record<BonusFamily, ReadonlyArray<readonly [AutoAbilityId, number]>>> = {
  strength: OFFENSE_PHYSICAL,
  magic: OFFENSE_MAGICAL,
  defense: DEFENSE_PHYSICAL,
  'magic-def': DEFENSE_MAGICAL,
  hp: POOL_HP,
  mp: POOL_MP,
};

function bestPercent(c: EquipmentBearer, table: ReadonlyArray<readonly [AutoAbilityId, number]>): number {
  let best = 0;
  for (const [id, pct] of table) if (bearerHasAuto(c, id) && pct > best) best = pct;
  return best;
}

/**
 * Best `+N%` this bearer carries from one family, in percentage points, or 0.
 *
 * "Best", not "sum": the tiers of one family never stack, so Yuna's Blessed
 * Ring carrying both `magic-def-10` and `magic-def-5` is worth 10, not 15
 * [ffx-combat-core §9; the same `bestPercent` steps 8/9 of the damage chain
 * already use].
 */
export function bonusPercentFor(b: EquipmentBearer, family: BonusFamily): number {
  return bestPercent(b, BONUS_TABLES[family]);
}

/**
 * Step 8: offensive `+N%` auto-abilities. Strength+% applies to **physical**
 * damage only, Magic+% to **magical** only; `other` (every Overdrive and Mix)
 * gets neither [ffx-combat-core §2.4].
 */
export function offensiveBonusPercent(c: FFXCombatant, type: DamageType): number {
  if (type === 'physical') return bestPercent(c, OFFENSE_PHYSICAL);
  if (type === 'magical') return bestPercent(c, OFFENSE_MAGICAL);
  return 0;
}

/** Step 9: defensive `+N%` auto-abilities on the target. */
export function defensiveBonusPercent(c: FFXCombatant, type: DamageType): number {
  if (type === 'physical') return bestPercent(c, DEFENSE_PHYSICAL);
  if (type === 'magical') return bestPercent(c, DEFENSE_MAGICAL);
  return 0;
}

/** Elements a weapon adds to every weapon-property attack [ffx-combat-core §3]. */
const ELEMENT_STRIKES: ReadonlyArray<readonly [AutoAbilityId, ElementId]> = [
  ['firestrike', 'fire'],
  ['icestrike', 'ice'],
  ['lightningstrike', 'lightning'],
  ['waterstrike', 'water'],
];

/** Weapon elements picked up by an `inherits-weapon-properties` action. */
export function weaponElements(c: FFXCombatant): ElementId[] {
  const out: ElementId[] = [];
  for (const [id, el] of ELEMENT_STRIKES) if (hasAuto(c, id)) out.push(el);
  return out;
}

/**
 * Weapon status strikes and touches [ffx-combat-core §4.1].
 * Touch = chance 50, Strike = chance 100; both on one weapon stack additively
 * to 150, which is why the table sums rather than picking a winner.
 */
const STATUS_STRIKES: ReadonlyArray<readonly [AutoAbilityId, StatusId, number]> = [
  ['stonestrike', 'petrify', 100],
  ['deathstrike', 'ko', 100],
  ['zombiestrike', 'zombie', 100],
  ['poisonstrike', 'poison', 100],
  ['sleepstrike', 'sleep', 100],
  ['silencestrike', 'silence', 100],
  ['darkstrike', 'darkness', 100],
  ['slowstrike', 'slow', 100],
  ['stonetouch', 'petrify', 50],
  ['deathtouch', 'ko', 50],
  ['zombietouch', 'zombie', 50],
  ['poisontouch', 'poison', 50],
  ['sleeptouch', 'sleep', 50],
  ['silencetouch', 'silence', 50],
  ['darktouch', 'darkness', 50],
  ['slowtouch', 'slow', 50],
];

/** Weapon status riders, as `status -> summed chance byte`. */
export function weaponStatusStrikes(c: FFXCombatant): Array<{ status: StatusId; chance: number }> {
  const sums = new Map<StatusId, number>();
  for (const [id, status, chance] of STATUS_STRIKES) {
    if (hasAuto(c, id)) sums.set(status, (sums.get(status) ?? 0) + chance);
  }
  return [...sums.entries()].map(([status, chance]) => ({ status, chance }));
}

/** Ribbon's protected list [ffx-combat-core §9]. Note it does NOT cover the Breaks or Death. */
const RIBBON_STATUSES: readonly StatusId[] = [
  'zombie',
  'petrify',
  'poison',
  'confuse',
  'berserk',
  'provoke',
  'sleep',
  'silence',
  'darkness',
  'slow',
  'doom',
];

/** Aeon Ribbon adds Death, all four Breaks, Scan and Eject on top of Ribbon's list. */
const AEON_RIBBON_EXTRA: readonly StatusId[] = [
  'ko',
  'power-break',
  'magic-break',
  'armor-break',
  'mental-break',
  'scan',
  'eject',
];

/** Proofs set that status's resistance byte to 255. */
const PROOFS: ReadonlyArray<readonly [AutoAbilityId, StatusId]> = [
  ['stoneproof', 'petrify'],
  ['deathproof', 'ko'],
  ['zombieproof', 'zombie'],
  ['poisonproof', 'poison'],
  ['sleepproof', 'sleep'],
  ['silenceproof', 'silence'],
  ['darkproof', 'darkness'],
  ['slowproof', 'slow'],
  ['confuseproof', 'confuse'],
  ['berserkproof', 'berserk'],
  ['curseproof', 'curse'],
];

/** Wards set that status's resistance byte to 50 — subtractive, not multiplicative. */
const WARDS: ReadonlyArray<readonly [AutoAbilityId, StatusId]> = [
  ['stone-ward', 'petrify'],
  ['death-ward', 'ko'],
  ['zombie-ward', 'zombie'],
  ['poison-ward', 'poison'],
  ['sleep-ward', 'sleep'],
  ['silence-ward', 'silence'],
  ['dark-ward', 'darkness'],
  ['slow-ward', 'slow'],
  ['confuse-ward', 'confuse'],
  ['berserk-ward', 'berserk'],
  ['curse-ward', 'curse'],
];

/** Elemental armour: ward -> resist, proof -> immune, eater -> absorb. */
const ELEMENT_ARMOUR: ReadonlyArray<readonly [AutoAbilityId, ElementId, 'resist' | 'immune' | 'absorb']> = [
  ['fire-ward', 'fire', 'resist'],
  ['ice-ward', 'ice', 'resist'],
  ['lightning-ward', 'lightning', 'resist'],
  ['water-ward', 'water', 'resist'],
  ['fireproof', 'fire', 'immune'],
  ['iceproof', 'ice', 'immune'],
  ['lightningproof', 'lightning', 'immune'],
  ['waterproof', 'water', 'immune'],
  ['fire-eater', 'fire', 'absorb'],
  ['ice-eater', 'ice', 'absorb'],
  ['lightning-eater', 'lightning', 'absorb'],
  ['water-eater', 'water', 'absorb'],
];

/**
 * Fold equipment into a combatant's resistance bytes and elemental affinities,
 * in place. Called once at battle start.
 *
 * Wards and Proofs **raise** a resistance byte, never lower one, so an enemy's
 * own 255 always wins.
 */
export function applyEquipmentToCombatant(c: FFXCombatant): void {
  if (!c.equipment) return;
  const raise = (status: StatusId, value: number): void => {
    if ((c.immunities[status] ?? 0) < value) c.immunities[status] = value;
  };
  for (const [id, status] of WARDS) if (hasAuto(c, id)) raise(status, 50);
  for (const [id, status] of PROOFS) if (hasAuto(c, id)) raise(status, 255);
  if (hasAuto(c, 'ribbon')) for (const s of RIBBON_STATUSES) raise(s, 255);
  if (hasAuto(c, 'aeon-ribbon')) {
    for (const s of RIBBON_STATUSES) raise(s, 255);
    for (const s of AEON_RIBBON_EXTRA) raise(s, 255);
  }
  // Auto-Haste also makes the wearer immune to Slow [ffx-combat-core §1.4].
  if (hasAuto(c, 'auto-haste')) raise('slow', 255);
  for (const [id, element, affinity] of ELEMENT_ARMOUR) {
    if (hasAuto(c, id)) c.affinities[element] = affinity;
  }
}

/**
 * The damage/healing cap for this user and action [ffx-combat-core §2.13].
 * `never-break-damage-limit` forces 9 999 even with Break Damage Limit;
 * `always-break-damage-limit` ignores equipment entirely.
 */
export function damageCapFor(user: FFXCombatant, flags: readonly string[]): number {
  if (flags.includes('never-break-damage-limit')) return 9999;
  if (flags.includes('always-break-damage-limit')) return 99999;
  return hasAuto(user, 'break-damage-limit') ? 99999 : 9999;
}

/** The auto-abilities that grant a permanent status at battle start, stack 255. */
export const AUTO_STATUS_ABILITIES: ReadonlyArray<readonly [AutoAbilityId, StatusId]> = [
  ['auto-haste', 'haste'],
  ['auto-protect', 'protect'],
  ['auto-shell', 'shell'],
  ['auto-regen', 'regen'],
  ['auto-reflect', 'reflect'],
];

/** The SOS auto-abilities, applied at stack 255 while the wearer is in Critical. */
export const SOS_STATUS_ABILITIES: ReadonlyArray<readonly [AutoAbilityId, StatusId]> = [
  ['sos-haste', 'haste'],
  ['sos-protect', 'protect'],
  ['sos-shell', 'shell'],
  ['sos-regen', 'regen'],
  ['sos-reflect', 'reflect'],
  ['sos-nulblaze', 'nulblaze'],
  ['sos-nulfrost', 'nulfrost'],
  ['sos-nulshock', 'nulshock'],
  ['sos-nultide', 'nultide'],
];
