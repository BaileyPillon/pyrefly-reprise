/**
 * Damage items [ffx2-combat-core §5.5, verified: 2 sources]. Every one of these ignores the user's
 * Str/Mag and the target's Def/MDef, and ignores Shell/Protect/Reflect — flat
 * randomised-constant attacks. Elemental ones are still subject to affinity.
 * A trimmed, representative subset of the full item list is transcribed.
 */

import type { ItemDef } from '../../../battle/common/types.ts';

export const damageItems: ItemDef[] = [
  {
    id: 'x2-poison-fang',
    name: 'Poison Fang',
    game: 'ffx2',
    effect: 'x2-item-poison-fang',
    targeting: 'single-enemy',
    usableInBattle: true,
    usableInMenu: false,
    price: 25,
    description: 'Unblockable special damage plus Poison.',
  },
  {
    id: 'x2-grenade',
    name: 'Grenade',
    game: 'ffx2',
    effect: 'x2-item-grenade',
    targeting: 'all-enemies',
    usableInBattle: true,
    usableInMenu: false,
    price: 25,
    description: 'Always-critical physical damage to all enemies.',
  },
  {
    id: 'x2-fire-gem',
    name: 'Fire Gem',
    game: 'ffx2',
    effect: 'x2-item-fire-gem',
    targeting: 'all-enemies',
    usableInBattle: true,
    usableInMenu: false,
    price: 75,
    description: 'Six hits of Fire damage, randomly distributed.',
  },
  {
    id: 'x2-shining-gem',
    name: 'Shining Gem',
    game: 'ffx2',
    effect: 'x2-item-shining-gem',
    targeting: 'single-enemy',
    usableInBattle: true,
    usableInMenu: false,
    price: 75,
    description: 'Heavy non-elemental damage to one enemy.',
  },
  {
    id: 'x2-dark-matter',
    name: 'Dark Matter',
    game: 'ffx2',
    effect: 'x2-item-dark-matter',
    targeting: 'all-enemies',
    usableInBattle: true,
    usableInMenu: false,
    price: 7500,
    description: 'Extreme non-elemental damage to all enemies.',
  },
  {
    id: 'x2-stamina-spring',
    name: 'Stamina Spring',
    game: 'ffx2',
    effect: 'x2-item-stamina-spring',
    targeting: 'single-enemy',
    usableInBattle: true,
    usableInMenu: false,
    price: 75,
    description: 'Drains HP from an enemy to the user.',
  },
];

export default damageItems;
