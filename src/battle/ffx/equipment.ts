/**
 * FFX equipment auto-abilities [ffx-combat-core §9].
 *
 * Equipment in FFX **never changes a stat** — it grants auto-abilities only.
 * This module turns a combatant's two equipment slots into the numbers the
 * damage chain, the status roll and the battle-start setup need.
 *
 * **The decode is the game's** (re-parity RC4, lane FFX-C; FFX only): the percents of every worn ability are SUMMED (`kernel/gear.ts`, the party stat
 * builder and the battle-start gear loop over the game's own auto-ability table), the equipment critical bonus is 3 per worn piece, the resistance bytes
 * of the worn abilities are summed and clamped to 255 and a Curse Ward is a full immunity. `./adapt/gear.ts` is the translation from our ability ids; the
 * functions below keep their old names and signatures.
 */

import type {
  AutoAbilityId,
  DamageType,
  ElementId,
  EquipmentDef,
  FFXCombatant,
  StatusId,
} from '../common/types.ts';
import { aeonGearOf } from './aeon-gear.ts';
import { EXTRA_IMMUNITY_STATUS, STATUS_BY_NUMBER, familyPercent, gearOf, type GearFamily } from './adapt/gear.ts';

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

/**
 * The equipment critical bonus: the crit byte of each worn piece, added (re-parity RC4, FFX only). Every gear row of the game carries 3, so a weapon and an
 * armour give 6 and a weapon alone 3 (`kernel/gear.ts`, FFX-G03 sections 1 and 4.2; read by the 47 commands that take the equipment bonus, among them the
 * plain Attack). An aeon wears fixed gear the engine does not list: the game gives every aeon 6 (re-parity W5, `aeon-gear.ts`).
 */
export function equipmentCrit(c: FFXCombatant): number {
  if (c.side === 'aeon') return aeonGearOf(c).critBonus;
  return gearOf(c).crit;
}

/**
 * The six `+N%` auto-ability families of §9, named the way a menu names them
 * rather than the way the damage chain consumes them.
 */
export type BonusFamily = GearFamily;

/**
 * The `+N%` this bearer's gear gives one family, in percentage points, or 0 (re-parity RC4, FFX only).
 *
 * **Summed, not "best of the family"**: the percents of all eight ability slots add, so Yuna's Blessed Ring carrying both `magic-def-10` and `magic-def-5`
 * is worth 15, and two `hp-10` give HP +20 (`kernel/gear.ts`, FFX-G03 section 4.1). For the four damage families the number is the byte the party percent
 * modifier reads, the low byte of the sum.
 */
export function bonusPercentFor(b: EquipmentBearer, family: BonusFamily): number {
  return familyPercent(b, family);
}

/**
 * Step 8: offensive `+N%` auto-abilities. Strength+% applies to **physical**
 * damage only, Magic+% to **magical** only; `other` (every Overdrive and Mix)
 * gets neither [ffx-combat-core §2.4].
 */
export function offensiveBonusPercent(c: FFXCombatant, type: DamageType): number {
  if (type === 'physical') return familyPercent(c, 'strength');
  if (type === 'magical') return familyPercent(c, 'magic');
  return 0;
}

/** Step 9: defensive `+N%` auto-abilities on the target. */
export function defensiveBonusPercent(c: FFXCombatant, type: DamageType): number {
  if (type === 'physical') return familyPercent(c, 'defense');
  if (type === 'magical') return familyPercent(c, 'magic-def');
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
 *
 * The third number is the chance byte and the fourth the duration byte, both read from the game's auto-ability table
 * (`a_ability.bin`, record bytes 22 to 46 and 47 to 59; re-parity W2): Sleep, Silence and Darkness last 3 turns, Slow is
 * 255 (given for the battle, never counted down), and the statuses of the permanent group have no duration.
 */
const STATUS_STRIKES: ReadonlyArray<readonly [AutoAbilityId, StatusId, number, number]> = [
  ['stonestrike', 'petrify', 100, 0],
  ['deathstrike', 'ko', 100, 0],
  ['zombiestrike', 'zombie', 100, 0],
  ['poisonstrike', 'poison', 100, 0],
  ['sleepstrike', 'sleep', 100, 3],
  ['silencestrike', 'silence', 100, 3],
  ['darkstrike', 'darkness', 100, 3],
  ['slowstrike', 'slow', 100, 255],
  ['stonetouch', 'petrify', 50, 0],
  ['deathtouch', 'ko', 50, 0],
  ['zombietouch', 'zombie', 50, 0],
  ['poisontouch', 'poison', 50, 0],
  ['sleeptouch', 'sleep', 50, 3],
  ['silencetouch', 'silence', 50, 3],
  ['darktouch', 'darkness', 50, 3],
  ['slowtouch', 'slow', 50, 255],
];

/** Weapon status riders, as `status -> summed chance byte` (clamped to the byte) and the duration byte the weapon gives it. */
export function weaponStatusStrikes(c: FFXCombatant): Array<{ status: StatusId; chance: number; duration: number }> {
  const sums = new Map<StatusId, { chance: number; duration: number }>();
  for (const [id, status, chance, duration] of STATUS_STRIKES) {
    if (!hasAuto(c, id)) continue;
    const have = sums.get(status);
    sums.set(status, { chance: Math.min(255, (have?.chance ?? 0) + chance), duration: Math.max(have?.duration ?? 0, duration) });
  }
  return [...sums.entries()].map(([status, v]) => ({ status, chance: v.chance, duration: v.duration }));
}

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
 * **The resistance bytes are the game's sums** (re-parity RC4, FFX only; `kernel/gear.ts`, FFX-G03 section 4.2): the byte of every worn ability is
 * added per status and clamped to 255, so two Death Wards make 100 and a Ward with a Proof 255. An ability that gives a status its extra-immunity bit
 * (the Ribbon's Doom, the Aeon Ribbon's Eject and Scan, **Curseproof and Curse Ward alike**) makes the wearer fully immune to it: 255. Nothing is raised
 * "to a maximum" any more, and an Auto-Haste gives no Slow resistance of its own (the status rule refuses a Slow while a Haste counter is 255).
 */
export function applyEquipmentToCombatant(c: FFXCombatant): void {
  if (!c.equipment) return;
  const gear = gearOf(c);
  gear.resist.forEach((byte, number) => {
    if (byte === 0) return;
    const status = STATUS_BY_NUMBER[number] as StatusId;
    c.immunities[status] = Math.min(255, (c.immunities[status] ?? 0) + byte);
  });
  for (const [bit, status] of EXTRA_IMMUNITY_STATUS) if ((gear.immuneExtra & bit) !== 0) c.immunities[status] = 255;
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
