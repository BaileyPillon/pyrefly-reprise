/**
 * Gunner — Yuna's default [ffx2-combat-core §3.1, §5.1a, §5.1b].
 * Long range, no charge times, best Accuracy/Agility of the standard set.
 * AP costs corrected per the §3.0 authority box; they sum to the published
 * 800 AP mastery total.
 */

import type { DressphereDef } from './types.ts';

export const gunner: DressphereDef = {
  id: 'gunner',
  name: 'Gunner',
  commands: ['Attack', 'Trigger Happy', 'Gunplay', 'Item'],
  longRange: true,
  masteryAp: 800,
  citation: 'ffx2-combat-core.md §3.1, §5.1a, §5.1b [verified: 2 sources]',
  growth: {
    hp: { a: 42, b: 79, q: 7 },
    mp: { a: 1.6, b: 18, q: 188 },
    str: { a: 1.5, d: 4, b: 12, q: 208 },
    mag: { a: 0.6, d: 33, b: 12, q: 6400 },
    def: { a: 1, d: 100, b: 11, q: 192 },
    mdef: { a: 0.4, d: 11, b: 12, q: 6400 },
    agi: { a: 0, d: 13, b: 50, q: 12800 },
    acc: { a: 0.1, d: 33, b: 120, q: 12800 },
    eva: { a: 0, d: 22, b: 2, q: 12800 },
    luck: { a: 0.1, d: 27, b: 12, q: 12800 },
  },
  // §5.1b, both bands this project needs, transcribed from the FF Wiki per-level tables.
  exactLevels: {
    20: { hp: 862, mp: 51, str: 46, mag: 24, def: 30, mdef: 30, agi: 53, acc: 123, eva: 4, luck: 15 },
    21: { hp: 898, mp: 52, str: 46, mag: 24, def: 29, mdef: 29, agi: 53, acc: 123, eva: 4, luck: 15 },
    22: { hp: 934, mp: 54, str: 48, mag: 25, def: 30, mdef: 30, agi: 53, acc: 123, eva: 4, luck: 15 },
    23: { hp: 970, mp: 56, str: 49, mag: 26, def: 31, mdef: 31, agi: 53, acc: 123, eva: 4, luck: 15 },
    24: { hp: 1005, mp: 57, str: 52, mag: 26, def: 32, mdef: 32, agi: 53, acc: 123, eva: 4, luck: 15 },
    25: { hp: 1040, mp: 59, str: 52, mag: 27, def: 32, mdef: 32, agi: 53, acc: 123, eva: 4, luck: 16 },
    26: { hp: 1075, mp: 59, str: 54, mag: 28, def: 33, mdef: 33, agi: 53, acc: 123, eva: 4, luck: 16 },
    27: { hp: 1109, mp: 61, str: 55, mag: 28, def: 33, mdef: 33, agi: 53, acc: 123, eva: 4, luck: 16 },
    28: { hp: 1143, mp: 63, str: 58, mag: 29, def: 35, mdef: 35, agi: 53, acc: 123, eva: 4, luck: 16 },
    29: { hp: 1177, mp: 64, str: 58, mag: 30, def: 35, mdef: 35, agi: 53, acc: 123, eva: 4, luck: 16 },
    30: { hp: 1211, mp: 66, str: 60, mag: 31, def: 36, mdef: 36, agi: 54, acc: 124, eva: 5, luck: 17 },
    43: { hp: 1621, mp: 82, str: 78, mag: 39, def: 44, mdef: 44, agi: 55, acc: 126, eva: 5, luck: 18 },
    44: { hp: 1651, mp: 83, str: 80, mag: 39, def: 44, mdef: 44, agi: 55, acc: 126, eva: 5, luck: 18 },
    45: { hp: 1680, mp: 84, str: 81, mag: 40, def: 45, mdef: 45, agi: 55, acc: 126, eva: 5, luck: 19 },
    46: { hp: 1709, mp: 85, str: 82, mag: 41, def: 45, mdef: 45, agi: 55, acc: 126, eva: 5, luck: 19 },
    47: { hp: 1738, mp: 86, str: 83, mag: 41, def: 45, mdef: 45, agi: 55, acc: 126, eva: 5, luck: 19 },
    48: { hp: 1766, mp: 87, str: 85, mag: 42, def: 46, mdef: 46, agi: 55, acc: 126, eva: 5, luck: 19 },
    49: { hp: 1794, mp: 88, str: 86, mag: 43, def: 47, mdef: 47, agi: 55, acc: 126, eva: 4, luck: 19 },
    50: { hp: 1822, mp: 90, str: 87, mag: 44, def: 47, mdef: 47, agi: 56, acc: 127, eva: 5, luck: 20 },
    51: { hp: 1850, mp: 90, str: 88, mag: 43, def: 47, mdef: 47, agi: 56, acc: 127, eva: 5, luck: 20 },
    52: { hp: 1877, mp: 91, str: 90, mag: 44, def: 48, mdef: 48, agi: 56, acc: 127, eva: 5, luck: 20 },
  },
  abilities: [
    { abilityId: 'x2-gunner-attack', apCost: 0 },
    { abilityId: 'x2-gunner-trigger-happy', apCost: 0 },
    { abilityId: 'x2-gunner-potshot', apCost: 20 },
    { abilityId: 'x2-gunner-cheap-shot', apCost: 30, prereq: 'x2-gunner-potshot' },
    { abilityId: 'x2-gunner-enchanted-ammo', apCost: 30 },
    { abilityId: 'x2-gunner-target-mp', apCost: 30, prereq: 'x2-gunner-enchanted-ammo' },
    { abilityId: 'x2-gunner-quarter-pounder', apCost: 40, prereq: 'x2-gunner-target-mp' },
    { abilityId: 'x2-gunner-on-the-level', apCost: 40, prereq: 'x2-gunner-target-mp' },
    { abilityId: 'x2-gunner-burst-shot', apCost: 60 },
    { abilityId: 'x2-gunner-table-turner', apCost: 60, prereq: 'x2-gunner-potshot' },
    { abilityId: 'x2-gunner-scattershot', apCost: 80, prereq: 'x2-gunner-burst-shot' },
    { abilityId: 'x2-gunner-scatterburst', apCost: 120, prereq: 'x2-gunner-scattershot' },
    { abilityId: 'x2-gunner-darkproof', apCost: 30 },
    { abilityId: 'x2-gunner-sleepproof', apCost: 30, prereq: 'x2-gunner-darkproof' },
    { abilityId: 'x2-gunner-trigger-happy-lv2', apCost: 80 },
    { abilityId: 'x2-gunner-trigger-happy-lv3', apCost: 150, prereq: 'x2-gunner-trigger-happy-lv2' },
  ],
};

export default gunner;
