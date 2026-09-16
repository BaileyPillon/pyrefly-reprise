/**
 * Dark Knight [ffx2-combat-core §3.8, §5.1a, §5.1b]. Highest combined HP+Def
 * of the standard set; slowest Agility (39-41) in the game. AP sums to the
 * published 490 total, the cheapest dressphere to master. **Darkness is the
 * single most important player ability in both encounters this project
 * ships** — see `abilities/dark-knight.ts`.
 */

import type { DressphereDef } from './types.ts';

export const darkKnight: DressphereDef = {
  id: 'dark-knight',
  name: 'Dark Knight',
  commands: ['Attack', 'Darkness', 'Arcana', 'Charon', 'Item'],
  longRange: false,
  masteryAp: 490,
  citation: 'ffx2-combat-core.md §3.8, §5.1a, §5.1b [verified: 2 sources]',
  growth: {
    hp: { a: 58, b: 173, q: 17.5 },
    mp: { a: 3.2, b: 85, q: 155 },
    str: { a: 2.3, d: 12, b: 16, q: 128 },
    mag: { a: 1, d: 2, b: 16, q: 176 },
    def: { a: 0.5, d: 20, b: 90, q: 6400 },
    mdef: { a: 0.1, d: 4, b: 72, q: 6400 },
    agi: { a: 0, d: 16, b: 36, q: 12800 },
    acc: { a: 0, d: 17, b: 100, q: 12800 },
    eva: { a: 0, d: 20, b: 0, q: 12800 },
    luck: { a: 0, d: 20, b: 8, q: 12800 },
  },
  exactLevels: {
    20: { hp: 1311, mp: 147, str: 60, mag: 44, def: 118, mdef: 80, agi: 38, acc: 102, eva: 2, luck: 10 },
    21: { hp: 1366, mp: 150, str: 62, mag: 45, def: 118, mdef: 80, agi: 38, acc: 102, eva: 2, luck: 10 },
    22: { hp: 1422, mp: 152, str: 64, mag: 47, def: 120, mdef: 81, agi: 38, acc: 102, eva: 2, luck: 10 },
    23: { hp: 1477, mp: 155, str: 65, mag: 47, def: 119, mdef: 80, agi: 38, acc: 102, eva: 2, luck: 10 },
    24: { hp: 1533, mp: 158, str: 69, mag: 49, def: 121, mdef: 82, agi: 38, acc: 102, eva: 2, luck: 10 },
    25: { hp: 1588, mp: 161, str: 71, mag: 50, def: 122, mdef: 82, agi: 38, acc: 102, eva: 2, luck: 10 },
    26: { hp: 1643, mp: 164, str: 72, mag: 52, def: 123, mdef: 83, agi: 38, acc: 102, eva: 2, luck: 10 },
    27: { hp: 1698, mp: 167, str: 75, mag: 52, def: 123, mdef: 84, agi: 38, acc: 102, eva: 2, luck: 10 },
    28: { hp: 1753, mp: 169, str: 76, mag: 54, def: 124, mdef: 84, agi: 38, acc: 102, eva: 2, luck: 10 },
    29: { hp: 1807, mp: 172, str: 78, mag: 55, def: 125, mdef: 84, agi: 38, acc: 102, eva: 2, luck: 10 },
    30: { hp: 1862, mp: 176, str: 80, mag: 56, def: 126, mdef: 86, agi: 39, acc: 103, eva: 3, luck: 11 },
    43: { hp: 2562, mp: 211, str: 103, mag: 70, def: 134, mdef: 91, agi: 40, acc: 104, eva: 3, luck: 11 },
    44: { hp: 2615, mp: 213, str: 105, mag: 71, def: 135, mdef: 93, agi: 40, acc: 104, eva: 3, luck: 11 },
    45: { hp: 2668, mp: 216, str: 107, mag: 72, def: 136, mdef: 93, agi: 40, acc: 104, eva: 3, luck: 11 },
    46: { hp: 2721, mp: 219, str: 108, mag: 73, def: 136, mdef: 93, agi: 40, acc: 103, eva: 3, luck: 11 },
    47: { hp: 2773, mp: 221, str: 110, mag: 74, def: 137, mdef: 94, agi: 40, acc: 103, eva: 3, luck: 11 },
    48: { hp: 2826, mp: 224, str: 112, mag: 75, def: 137, mdef: 94, agi: 40, acc: 103, eva: 3, luck: 11 },
    49: { hp: 2878, mp: 226, str: 114, mag: 76, def: 138, mdef: 94, agi: 40, acc: 103, eva: 3, luck: 11 },
    50: { hp: 2931, mp: 229, str: 116, mag: 77, def: 139, mdef: 96, agi: 41, acc: 104, eva: 4, luck: 12 },
    51: { hp: 2983, mp: 232, str: 117, mag: 78, def: 139, mdef: 95, agi: 41, acc: 104, eva: 4, luck: 12 },
    52: { hp: 3035, mp: 234, str: 118, mag: 79, def: 140, mdef: 96, agi: 41, acc: 104, eva: 4, luck: 12 },
  },
  abilities: [
    { abilityId: 'x2-dark-knight-attack', apCost: 0 },
    { abilityId: 'x2-dark-knight-darkness', apCost: 0 },
    { abilityId: 'x2-dark-knight-charon', apCost: 20 },
    { abilityId: 'x2-dark-knight-drain', apCost: 20 },
    { abilityId: 'x2-dark-knight-demi', apCost: 20 },
    { abilityId: 'x2-dark-knight-confuse', apCost: 30, prereq: 'x2-dark-knight-demi' },
    { abilityId: 'x2-dark-knight-break', apCost: 40, prereq: 'x2-dark-knight-confuse' },
    { abilityId: 'x2-dark-knight-bio', apCost: 30 },
    { abilityId: 'x2-dark-knight-doom', apCost: 20, prereq: 'x2-dark-knight-bio' },
    { abilityId: 'x2-dark-knight-death', apCost: 50, prereq: 'x2-dark-knight-doom' },
    { abilityId: 'x2-dark-knight-black-sky', apCost: 100, prereq: 'x2-dark-knight-death' },
    { abilityId: 'x2-dark-knight-poisonproof', apCost: 30 },
    { abilityId: 'x2-dark-knight-stoneproof', apCost: 30, prereq: 'x2-dark-knight-poisonproof' },
    { abilityId: 'x2-dark-knight-curseproof', apCost: 30 },
  ],
};

export default darkKnight;
