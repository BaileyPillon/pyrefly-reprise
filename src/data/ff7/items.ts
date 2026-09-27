/**
 * FF7 consumables in the Guard Scorpion slice [core §8.6].
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Effects live in `abilities.ts`
 * (`item:<id>`). The Assault Gun drop is equipment (`equipment.ts`); Grenade and
 * Ether are not reachable before the fight [core §8.6, derived / single source: Jegged].
 */

import type { Ff7ItemDef } from '../../battle/ff7/defs.ts';
import type { Ff7ItemId } from './ids.ts';

type Consumable = Exclude<Ff7ItemId, 'assault-gun'>;

export const FF7_ITEMS: Readonly<Record<Consumable, Ff7ItemDef>> = {
  potion: {
    id: 'potion',
    name: 'Potion',
    effect: 'item:potion',
    usableInBattle: true,
    cite: 'core §8.6 [single source: Fergusson PM §5]',
  },
  'phoenix-down': {
    id: 'phoenix-down',
    name: 'Phoenix Down',
    effect: 'item:phoenix-down',
    usableInBattle: true,
    cite: 'core §8.6 [single source: Fergusson PM §5]',
  },
};
