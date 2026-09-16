/**
 * Black Mage — Black Magic / Focus / MP Absorb [ffx2-combat-core §2.9.1, §3.6, verified: 2 sources].
 *
 * No Attack command. Highest MP and Magic of the standard set. Damage
 * constants are the corrected ladder from §2.9 — **not** the old
 * `12/24/42/60/70/100` figures this project previously used: real values are
 * `8 / 13 / 21` for the three tiers, confirmed against the pbirdman
 * calculator's item-power cross-check. Native Black Mage tops out at -ga;
 * Flare, Ultima and Holy are Garment-Grid/accessory-only and live in
 * `abilities/shared.ts`.
 */

import type { AbilityDef, ElementId } from '../../../battle/common/types.ts';
import { CT_MEDIUM, CT_SHORT, RT_NORMAL } from './helpers.ts';

function tier1(id: string, name: string, element: ElementId): AbilityDef {
  return {
    id,
    name,
    game: 'ffx2',
    category: 'blackmagic',
    mpCost: 4,
    chargeTicks: CT_SHORT,
    recoveryTicks: RT_NORMAL,
    power: 8, // §2.9.1 corrected ladder
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'single-any',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable'],
    messageTemplate: `{user} casts ${name}`,
  };
}

function tier2(id: string, name: string, element: ElementId): AbilityDef {
  return {
    id,
    name,
    game: 'ffx2',
    category: 'blackmagic',
    mpCost: 12,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: RT_NORMAL,
    power: 13, // §2.9.1 corrected ladder
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'single-any',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable'],
    messageTemplate: `{user} casts ${name}`,
  };
}

function tier3(id: string, name: string, element: ElementId): AbilityDef {
  return {
    id,
    name,
    game: 'ffx2',
    category: 'blackmagic',
    mpCost: 24,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: RT_NORMAL,
    power: 21, // §2.9.1 corrected ladder
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'single-any',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable'],
    messageTemplate: `{user} casts ${name}`,
  };
}

export const blackMageAbilities: AbilityDef[] = [
  tier1('x2-black-mage-fire', 'Fire', 'fire'),
  tier1('x2-black-mage-blizzard', 'Blizzard', 'ice'),
  tier1('x2-black-mage-thunder', 'Thunder', 'lightning'),
  tier1('x2-black-mage-water', 'Water', 'water'),
  tier2('x2-black-mage-fira', 'Fira', 'fire'),
  tier2('x2-black-mage-blizzara', 'Blizzara', 'ice'),
  tier2('x2-black-mage-thundara', 'Thundara', 'lightning'),
  tier2('x2-black-mage-watera', 'Watera', 'water'),
  tier3('x2-black-mage-firaga', 'Firaga', 'fire'),
  tier3('x2-black-mage-blizzaga', 'Blizzaga', 'ice'),
  tier3('x2-black-mage-thundaga', 'Thundaga', 'lightning'),
  tier3('x2-black-mage-waterga', 'Waterga', 'water'),
  {
    id: 'x2-black-mage-focus',
    name: 'Focus',
    game: 'ffx2',
    category: 'blackmagic',
    mpCost: 0,
    chargeTicks: CT_SHORT,
    recoveryTicks: RT_NORMAL,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    hits: 1,
    statusEffects: [{ status: 'mag-up', chance: 254, duration: 255, stacks: 3 }],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} uses Focus',
  },
  {
    id: 'x2-black-mage-mp-absorb',
    name: 'MP Absorb',
    game: 'ffx2',
    category: 'blackmagic',
    mpCost: 0,
    chargeTicks: CT_SHORT,
    recoveryTicks: RT_NORMAL,
    power: 3,
    formula: 'special-magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-any',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['drains-mp'],
    messageTemplate: '{user} uses MP Absorb',
  },
  {
    id: 'x2-black-mage-lv2',
    name: 'Black Magic Lv. 2',
    game: 'ffx2',
    category: 'blackmagic',
    mpCost: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} learns Black Magic Lv. 2',
    extra: { passive: 'black-magic-cast-time', percent: 30 },
  },
  {
    id: 'x2-black-mage-lv3',
    name: 'Black Magic Lv. 3',
    game: 'ffx2',
    category: 'blackmagic',
    mpCost: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} learns Black Magic Lv. 3',
    extra: { passive: 'black-magic-cast-time', percent: 50 },
  },
];

export default blackMageAbilities;
