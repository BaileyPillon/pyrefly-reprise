/**
 * Four FFX-2 items that Chapter XIII's **sourced kit option** carries (Split_Infinity's clear,
 * `docs/plans/trema-winnability-method-check.md` S3–S6; `research/ffx2-trema.md` §5: "Stamina
 * Tonic … Megalixir … drain his MP first (Soul Spring …)"). **FFX-2 only** [AGENTS.md rule 14].
 * No shipped build carries any of them, so no shipped replay moves; the approved TR11 a bag
 * (`builds/via-infinito.ts`) does not carry them either.
 *
 * Effects, ffx2-combat-core §5.5 items table and §2.9.3 item constants:
 * - **Soul Spring**: "absorbs 937–1058 HP and up to 1058 MP" (SGL, drain); power 20, "1,000
 *   drained". The MP half is `extra.mpDrainMatchesHp` (`battle/ffx2/aeon-effects.ts`).
 * - **Three Stars**: "whole party's MP cost becomes 0 for the battle" (GRP): Spellspring, which
 *   also removes Darkness's HP cost (§2.8 Spellspring row; `x2-dark-knight-darkness`).
 * - **Twin Stars**: the same on one ally (SGL).
 * - **Stamina Tonic**: "party's max HP doubled for the battle" (GRP): `max-hp-x2`
 *   (`battle/ffx2/kit.ts`: the ceiling moves, capped at 9,999).
 *
 * Charge and recovery copy the other items' `[estimate]` (CT medium, recovery 70). None of the
 * four is sold (§5.5 "Sell/Buy … / —"), so `price` is 0 as for the X-Potion.
 */

import type { AbilityDef, ItemDef } from '../../../battle/common/types.ts';
import { CT_MEDIUM } from '../abilities/helpers.ts';

function item(id: string, name: string, targeting: ItemDef['targeting'], description: string): ItemDef {
  return { id, name, game: 'ffx2', effect: `x2-item-${id.slice(3)}`, targeting, usableInBattle: true, usableInMenu: false, price: 0, description };
}

export const cloisterItems: ItemDef[] = [
  item('x2-soul-spring', 'Soul Spring', 'single-enemy', 'Drains HP and MP from an enemy to the user.'),
  item('x2-three-stars', 'Three Stars', 'all-allies', 'Reduces the whole party\'s MP costs to 0 for the battle.'),
  item('x2-twin-stars', 'Twin Stars', 'single-ally', 'Reduces one ally\'s MP costs to 0 for the battle.'),
  item('x2-stamina-tonic', 'Stamina Tonic', 'all-allies', 'Doubles the whole party\'s maximum HP for the battle.'),
];

const effect = {
  game: 'ffx2' as const,
  category: 'item' as const,
  mpCost: 0,
  chargeTicks: CT_MEDIUM,
  recoveryTicks: 70,
  element: ['none' as const],
  hits: 1,
  removesStatuses: [],
};

export const cloisterEffectAbilities: AbilityDef[] = [
  {
    ...effect,
    id: 'x2-item-soul-spring',
    name: 'Soul Spring',
    power: 20, // "1,000 drained" [§2.9.3]
    formula: 'fixed',
    damageType: 'other',
    targeting: 'single-enemy',
    statusEffects: [],
    flags: ['drains'],
    extra: { mpDrainMatchesHp: true }, // "and up to 1058 MP" [§5.5]
    messageTemplate: '{user} uses a Soul Spring',
  },
  {
    ...effect,
    id: 'x2-item-three-stars',
    name: 'Three Stars',
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'all-allies',
    statusEffects: [{ status: 'spellspring', chance: 254, duration: 0 }], // Infinite in §2.8: the battle
    flags: [],
    messageTemplate: '{user} uses Three Stars',
  },
  {
    ...effect,
    id: 'x2-item-twin-stars',
    name: 'Twin Stars',
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'single-ally',
    statusEffects: [{ status: 'spellspring', chance: 254, duration: 0 }],
    flags: [],
    messageTemplate: '{user} uses Twin Stars',
  },
  {
    ...effect,
    id: 'x2-item-stamina-tonic',
    name: 'Stamina Tonic',
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'all-allies',
    statusEffects: [{ status: 'max-hp-x2', chance: 254, duration: 0 }], // "for the battle": no expiry
    flags: [],
    messageTemplate: '{user} uses a Stamina Tonic',
  },
];
