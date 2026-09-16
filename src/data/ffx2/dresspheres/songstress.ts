/**
 * Songstress [ffx2-combat-core §3.4, §5.1a, §5.1b]. No Attack command; every
 * Dance/Song is a pure status ability. Mastery is 740 AP (14 learnable
 * entries + 2 key-item dances not modelled here).
 */

import type { DressphereDef } from './types.ts';

export const songstress: DressphereDef = {
  id: 'songstress',
  name: 'Songstress',
  commands: ['Dance', 'Sing', 'Item'],
  longRange: false,
  masteryAp: 740,
  citation: 'ffx2-combat-core.md §3.4, §5.1a, §5.1b [single source, derived total]',
  growth: {
    hp: { a: 28, b: 58, q: 18.5 },
    mp: { a: 3.3, b: 36, q: 99 },
    str: { a: 0.1, d: 17, b: 4, q: 6400 },
    mag: { a: 1.4, d: 10, b: 17, q: 288 },
    def: { a: 0.1, d: 21, b: 3, q: 12800 },
    mdef: { a: 0.4, d: 100, b: 32, q: 6400 },
    agi: { a: 0.1, d: 80, b: 51, q: 12800 },
    acc: { a: 0, d: 18, b: 96, q: 12800 },
    eva: { a: 0, d: 22, b: 8, q: 12800 },
    luck: { a: 0, d: 16, b: 8, q: 12800 },
  },
  exactLevels: {
    20: { hp: 597, mp: 98, str: 7, mag: 46, def: 7, mdef: 41, agi: 55, acc: 98, eva: 10, luck: 9 },
    25: { hp: 725, mp: 112, str: 8, mag: 52, def: 8, mdef: 43, agi: 56, acc: 98, eva: 10, luck: 9 },
    30: { hp: 850, mp: 126, str: 9, mag: 59, def: 9, mdef: 45, agi: 57, acc: 99, eva: 11, luck: 10 },
    43: { hp: 1163, mp: 159, str: 10, mag: 75, def: 10, mdef: 49, agi: 58, acc: 99, eva: 11, luck: 10 },
    48: { hp: 1278, mp: 171, str: 11, mag: 80, def: 11, mdef: 51, agi: 58, acc: 99, eva: 11, luck: 10 },
    50: { hp: 1323, mp: 176, str: 12, mag: 84, def: 12, mdef: 52, agi: 59, acc: 100, eva: 12, luck: 11 },
  },
  abilities: [
    { abilityId: 'x2-songstress-darkness-dance', apCost: 0 },
    { abilityId: 'x2-songstress-samba-of-silence', apCost: 20 },
    { abilityId: 'x2-songstress-sleepy-shuffle', apCost: 80 },
    { abilityId: 'x2-songstress-carnival-cancan', apCost: 80, prereq: 'x2-songstress-sleepy-shuffle' },
    { abilityId: 'x2-songstress-slow-dance', apCost: 60 },
    { abilityId: 'x2-songstress-breakdance', apCost: 120, prereq: 'x2-songstress-slow-dance' },
    { abilityId: 'x2-songstress-jitterbug', apCost: 120, prereq: 'x2-songstress-slow-dance' },
    { abilityId: 'x2-songstress-dirty-dancing', apCost: 160, prereq: 'x2-songstress-carnival-cancan' },
    { abilityId: 'x2-songstress-battle-cry', apCost: 10 },
    { abilityId: 'x2-songstress-cantus-firmus', apCost: 10, prereq: 'x2-songstress-battle-cry' },
    { abilityId: 'x2-songstress-esoteric-melody', apCost: 10 },
    { abilityId: 'x2-songstress-disenchant', apCost: 10, prereq: 'x2-songstress-esoteric-melody' },
    { abilityId: 'x2-songstress-perfect-pitch', apCost: 10 },
    { abilityId: 'x2-songstress-matadors-song', apCost: 10, prereq: 'x2-songstress-perfect-pitch' },
  ],
};

export default songstress;
