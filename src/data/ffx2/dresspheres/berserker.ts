/**
 * Berserker [ffx2-combat-core §3.10, §5.1a, §5.1b]. Highest HP and Agility of
 * the standard set; not owned at either build point (Ch. 3 pickup) but
 * included for the roster.
 */

import type { DressphereDef } from './types.ts';

export const berserker: DressphereDef = {
  id: 'berserker',
  name: 'Berserker',
  commands: ['Attack', 'Berserk', 'Instinct', 'Howl', 'Item'],
  longRange: false,
  masteryAp: 1360,
  citation: 'ffx2-combat-core.md §3.10, §5.1a, §5.1b [single source, derived total]',
  growth: {
    hp: { a: 66, b: 113, q: 10 },
    mp: { a: 1.6, b: 14, q: 200 },
    str: { a: 2.1, d: 5, b: 16, q: 128 },
    mag: { a: 0, d: 33, b: 1, q: 12800 },
    def: { a: 0, d: 14, b: 24, q: 12800 },
    mdef: { a: 0, d: 20, b: 1, q: 12800 },
    agi: { a: 0.1, d: 80, b: 58, q: 12800 },
    acc: { a: 0, d: 14, b: 102, q: 12800 },
    eva: { a: 0, d: 14, b: 13, q: 12800 },
    luck: { a: 0, d: 21, b: 12, q: 12800 },
  },
  exactLevels: {
    20: { hp: 1393, mp: 44, str: 59, mag: 3, def: 26, mdef: 3, agi: 61, acc: 104, eva: 15, luck: 13 },
    25: { hp: 1701, mp: 51, str: 69, mag: 3, def: 26, mdef: 3, agi: 61, acc: 104, eva: 15, luck: 13 },
    30: { hp: 2003, mp: 58, str: 78, mag: 4, def: 28, mdef: 4, agi: 62, acc: 105, eva: 16, luck: 14 },
    43: { hp: 2767, mp: 73, str: 100, mag: 4, def: 28, mdef: 4, agi: 64, acc: 106, eva: 17, luck: 14 },
    48: { hp: 3051, mp: 79, str: 107, mag: 4, def: 28, mdef: 4, agi: 64, acc: 105, eva: 17, luck: 14 },
    50: { hp: 3163, mp: 82, str: 112, mag: 5, def: 29, mdef: 5, agi: 64, acc: 106, eva: 18, luck: 15 },
  },
  abilities: [
    { abilityId: 'x2-berserker-attack', apCost: 0 },
    { abilityId: 'x2-berserker-berserk', apCost: 0 },
    { abilityId: 'x2-berserker-cripple', apCost: 20 },
    { abilityId: 'x2-berserker-mad-rush', apCost: 30, prereq: 'x2-berserker-cripple' },
    { abilityId: 'x2-berserker-crackdown', apCost: 30, prereq: 'x2-berserker-mad-rush' },
    { abilityId: 'x2-berserker-eject', apCost: 40, prereq: 'x2-berserker-mad-rush' },
    { abilityId: 'x2-berserker-intimidate', apCost: 50, prereq: 'x2-berserker-crackdown' },
    { abilityId: 'x2-berserker-howl', apCost: 80, prereq: 'x2-berserker-mad-rush' },
    { abilityId: 'x2-berserker-counterattack', apCost: 180 },
    { abilityId: 'x2-berserker-magic-counter', apCost: 300, prereq: 'x2-berserker-counterattack' },
    { abilityId: 'x2-berserker-evade-and-counter', apCost: 400, prereq: 'x2-berserker-magic-counter' },
  ],
};

export default berserker;
