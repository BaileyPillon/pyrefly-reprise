/**
 * **The seven final Celestial weapons** (FFX only; the hidden Penance chapter, number 35). **Source: the game's own weapon table**, `research/re-ffx-penance.md` section 6, item 5 (`[bytes]`: `weapon.bin` rows 139 to 145,
 * the layout from the community parser, documentation only): each row holds a damage **formula** and **power** at +0x08 and +0x09 and four fixed abilities, the first of which is Break Damage Limit (0x8019, the repo's
 * `break-damage-limit`). The engine models every other weapon as the plain one (formula 1, power 16); these seven are the one weapon data the chapter needs that the repo did not have.
 *
 * | Row | Wielder | Weapon | Formula (power 16) | Fixed abilities |
 * |---|---|---|---|---|
 * | 139 | Tidus | Caladbolg | 0x11 Celestial HP | Break Damage Limit, Triple Overdrive, Evade & Counter, Magic Counter |
 * | 140 | Yuna | Nirvana | 0x12 Celestial MP | Break Damage Limit, Triple Overdrive, Double AP, One MP Cost |
 * | 141 | Wakka | World Champion | 0x11 | Break Damage Limit, Triple Overdrive, Double AP, Evade & Counter |
 * | 142 | Kimahri | Spirit Lance | 0x11 | the same four as Wakka |
 * | 143 | Auron | Masamune | 0x13 Celestial low HP | Break Damage Limit, Triple Overdrive, First Strike, Counterattack |
 * | 144 | Lulu | Onion Knight | 0x12 | Break Damage Limit, Triple Overdrive, Magic Booster, One MP Cost |
 * | 145 | Rikku | Godhand | 0x11 | Break Damage Limit, Triple Overdrive, Double AP, Gillionaire |
 *
 * **What it does in a fight (RE 6.5, `[derived]`):** the formulas need no defence term. While the wielder has more than about a tenth of his or her HP (0x11) every hit on Penance or an arm is the 99,999 cap, Protect's halving included,
 * which is the guides' "six hits an arm" (500,000 / 99,999 = 5.00005) and 121 hits on the body. Without these rows the fight is not winnable (the plan's J2): the chapter would stall against Mighty Guard's Regen.
 *
 * The names are the game's own, public (the HD Remaster's weapon names); the abilities are a list of fixed slots (`slots: 4`, all filled). The Break Damage Limit is also what lifts the cap on the wielder's hits, so every row has it.
 */

import type { AutoAbilityId, EquipmentDef } from '../../../battle/common/types.ts';

/** The per-row facts: the weapon's name, its formula and power, and its four fixed abilities. */
export interface CelestialRow {
  /** The row in `weapon.bin`. */
  readonly row: number;
  readonly name: string;
  readonly formula: 0x11 | 0x12 | 0x13;
  readonly power: 16;
  readonly abilities: readonly AutoAbilityId[];
}

/** The crit byte every gear row carries (the repo's `BASE_WEAPON_BONUS_CRIT`; RE 6.5: crit 3). */
const CELESTIAL_CRIT = 3;

/** The seven rows, by the character who wields the weapon (the party builds' member ids). */
export const CELESTIAL_WEAPONS: Readonly<Record<string, CelestialRow>> = {
  tidus: { row: 139, name: 'Caladbolg', formula: 0x11, power: 16, abilities: ['break-damage-limit', 'triple-overdrive', 'evade-and-counter', 'magic-counter'] },
  yuna: { row: 140, name: 'Nirvana', formula: 0x12, power: 16, abilities: ['break-damage-limit', 'triple-overdrive', 'double-ap', 'one-mp-cost'] },
  wakka: { row: 141, name: 'World Champion', formula: 0x11, power: 16, abilities: ['break-damage-limit', 'triple-overdrive', 'double-ap', 'evade-and-counter'] },
  kimahri: { row: 142, name: 'Spirit Lance', formula: 0x11, power: 16, abilities: ['break-damage-limit', 'triple-overdrive', 'double-ap', 'evade-and-counter'] },
  auron: { row: 143, name: 'Masamune', formula: 0x13, power: 16, abilities: ['break-damage-limit', 'triple-overdrive', 'first-strike', 'counterattack'] },
  lulu: { row: 144, name: 'Onion Knight', formula: 0x12, power: 16, abilities: ['break-damage-limit', 'triple-overdrive', 'magic-booster', 'one-mp-cost'] },
  rikku: { row: 145, name: 'Godhand', formula: 0x11, power: 16, abilities: ['break-damage-limit', 'triple-overdrive', 'double-ap', 'gillionaire'] },
};

/** The equipment piece for a wielder: four slots, all fixed abilities, the row's formula and power on it (`EquipmentDef.weaponRow`). `undefined` for a character with no Celestial weapon. */
export function celestialWeapon(memberId: string): EquipmentDef | undefined {
  const r = CELESTIAL_WEAPONS[memberId];
  if (r === undefined) return undefined;
  return { name: r.name, slots: 4, autoAbilities: [...r.abilities], bonusCrit: CELESTIAL_CRIT, weaponRow: { formula: r.formula, power: r.power } };
}
