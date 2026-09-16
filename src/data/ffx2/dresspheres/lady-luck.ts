/**
 * Lady Luck [ffx2-combat-core §3.12, §5.1a, §5.1b]. Luck/critical specialist,
 * long range; not owned at either build point (Ch. 3+ pickup) but included
 * for the roster.
 */

import type { DressphereDef } from './types.ts';

export const ladyLuck: DressphereDef = {
  id: 'lady-luck',
  name: 'Lady Luck',
  commands: ['Attack', 'Gamble', 'Tantalize', 'Bribe', 'Item'],
  longRange: true,
  masteryAp: 1050,
  citation: 'ffx2-combat-core.md §3.12, §5.1a, §5.1b [contradicted: 1030 computed vs 1050 published — use 1050]',
  growth: {
    hp: { a: 35, b: 77, q: 7.7 },
    mp: { a: 3.3, b: 40, q: 143 },
    str: { a: 1.3, d: 75, b: 10, q: 688 },
    mag: { a: 1.1, d: 75, b: 15, q: 480 },
    def: { a: 0, d: 27, b: 35, q: 12800 },
    mdef: { a: 0.2, d: 13, b: 37, q: 6400 },
    agi: { a: 0, d: 13, b: 52, q: 12800 },
    acc: { a: 0, d: 44, b: 122, q: 12800 },
    eva: { a: 0, d: 27, b: 5, q: 12800 },
    luck: { a: 0.2, d: 20, b: 19, q: 12800 },
  },
  exactLevels: {
    20: { hp: 726, mp: 104, str: 36, mag: 37, def: 26, mdef: 43, agi: 55, acc: 123, eva: 5, luck: 24 },
    25: { hp: 871, mp: 118, str: 42, mag: 41, def: 26, mdef: 44, agi: 55, acc: 123, eva: 5, luck: 25 },
    30: { hp: 1011, mp: 133, str: 48, mag: 47, def: 27, mdef: 46, agi: 56, acc: 124, eva: 6, luck: 27 },
    43: { hp: 1342, mp: 169, str: 63, mag: 59, def: 27, mdef: 48, agi: 57, acc: 125, eva: 6, luck: 29 },
    48: { hp: 1458, mp: 180, str: 69, mag: 63, def: 27, mdef: 50, agi: 57, acc: 124, eva: 6, luck: 31 },
    50: { hp: 1503, mp: 188, str: 72, mag: 65, def: 28, mdef: 51, agi: 58, acc: 125, eva: 7, luck: 32 },
  },
  abilities: [
    { abilityId: 'x2-lady-luck-attack', apCost: 0 },
    { abilityId: 'x2-lady-luck-bribe', apCost: 40 },
    { abilityId: 'x2-lady-luck-two-dice', apCost: 20 },
    { abilityId: 'x2-lady-luck-attack-reels', apCost: 20 },
    { abilityId: 'x2-lady-luck-magic-reels', apCost: 70, prereq: 'x2-lady-luck-attack-reels' },
    { abilityId: 'x2-lady-luck-luck', apCost: 30 },
    { abilityId: 'x2-lady-luck-felicity', apCost: 40, prereq: 'x2-lady-luck-luck' },
    { abilityId: 'x2-lady-luck-tantalize', apCost: 60 },
    { abilityId: 'x2-lady-luck-critical', apCost: 160, prereq: 'x2-lady-luck-felicity' },
  ],
};

export default ladyLuck;
