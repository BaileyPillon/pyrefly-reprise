/**
 * Thief — Rikku's default [ffx2-combat-core §3.2, §5.1a, §5.1b].
 * Best Evasion, second-best Agility; Attack strikes twice. AP costs sum to
 * the published 1060 mastery total (Steal/Flimflam family + Flee + the three
 * passives below).
 */

import type { DressphereDef } from './types.ts';

export const thief: DressphereDef = {
  id: 'thief',
  name: 'Thief',
  commands: ['Attack', 'Steal', 'Flimflam', 'Flee', 'Item'],
  longRange: false,
  masteryAp: 1060,
  citation: 'ffx2-combat-core.md §3.2, §5.1a, §5.1b [verified: 2 sources]',
  growth: {
    hp: { a: 44, b: 70, q: 7.3 },
    mp: { a: 2.2, b: 33, q: 122 },
    str: { a: 1.7, d: 88, b: 7, q: 176 },
    mag: { a: 1.1, d: 12, b: 10, q: 320 },
    def: { a: 0.5, d: 7, b: 8, q: 1920 },
    mdef: { a: 0.5, d: 8, b: 36, q: 6400 },
    agi: { a: 0.1, d: 80, b: 57, q: 12800 },
    acc: { a: 0, d: 10, b: 108, q: 12800 },
    eva: { a: 0, d: 8, b: 17, q: 12800 },
    luck: { a: 0, d: 7, b: 23, q: 12800 },
  },
  exactLevels: {
    20: { hp: 896, mp: 74, str: 39, mag: 32, def: 24, mdef: 54, agi: 60, acc: 110, eva: 19, luck: 26 },
    21: { hp: 934, mp: 76, str: 40, mag: 33, def: 24, mdef: 54, agi: 60, acc: 110, eva: 19, luck: 26 },
    22: { hp: 972, mp: 78, str: 42, mag: 34, def: 25, mdef: 55, agi: 60, acc: 110, eva: 19, luck: 26 },
    23: { hp: 1010, mp: 79, str: 43, mag: 35, def: 26, mdef: 55, agi: 60, acc: 110, eva: 19, luck: 26 },
    24: { hp: 1048, mp: 81, str: 44, mag: 37, def: 27, mdef: 57, agi: 60, acc: 110, eva: 19, luck: 26 },
    25: { hp: 1085, mp: 83, str: 46, mag: 38, def: 28, mdef: 58, agi: 60, acc: 110, eva: 20, luck: 27 },
    26: { hp: 1122, mp: 85, str: 48, mag: 38, def: 28, mdef: 59, agi: 61, acc: 110, eva: 20, luck: 27 },
    27: { hp: 1159, mp: 87, str: 48, mag: 39, def: 28, mdef: 60, agi: 61, acc: 110, eva: 20, luck: 27 },
    28: { hp: 1195, mp: 88, str: 50, mag: 40, def: 29, mdef: 60, agi: 61, acc: 111, eva: 20, luck: 27 },
    29: { hp: 1231, mp: 90, str: 52, mag: 41, def: 30, mdef: 61, agi: 61, acc: 111, eva: 20, luck: 27 },
    30: { hp: 1267, mp: 92, str: 53, mag: 43, def: 32, mdef: 62, agi: 62, acc: 112, eva: 21, luck: 28 },
    43: { hp: 1709, mp: 112, str: 70, mag: 55, def: 40, mdef: 70, agi: 63, acc: 113, eva: 22, luck: 30 },
    44: { hp: 1741, mp: 114, str: 70, mag: 55, def: 41, mdef: 71, agi: 63, acc: 113, eva: 22, luck: 30 },
    45: { hp: 1773, mp: 116, str: 72, mag: 56, def: 42, mdef: 72, agi: 63, acc: 113, eva: 23, luck: 31 },
    46: { hp: 1805, mp: 117, str: 73, mag: 57, def: 41, mdef: 72, agi: 63, acc: 113, eva: 23, luck: 31 },
    47: { hp: 1836, mp: 118, str: 74, mag: 58, def: 42, mdef: 73, agi: 63, acc: 113, eva: 23, luck: 31 },
    48: { hp: 1867, mp: 120, str: 75, mag: 59, def: 43, mdef: 74, agi: 63, acc: 113, eva: 23, luck: 31 },
    49: { hp: 1898, mp: 121, str: 77, mag: 60, def: 44, mdef: 75, agi: 63, acc: 113, eva: 23, luck: 30 },
    50: { hp: 1928, mp: 123, str: 78, mag: 62, def: 45, mdef: 76, agi: 64, acc: 114, eva: 24, luck: 31 },
    51: { hp: 1958, mp: 124, str: 79, mag: 62, def: 45, mdef: 75, agi: 64, acc: 114, eva: 24, luck: 31 },
    52: { hp: 1988, mp: 125, str: 80, mag: 63, def: 46, mdef: 76, agi: 65, acc: 114, eva: 24, luck: 31 },
  },
  abilities: [
    { abilityId: 'x2-thief-attack', apCost: 0 },
    { abilityId: 'x2-thief-steal', apCost: 0 },
    { abilityId: 'x2-thief-pilfer-gil', apCost: 30 },
    { abilityId: 'x2-thief-borrowed-time', apCost: 100, prereq: 'x2-thief-pilfer-gil' },
    { abilityId: 'x2-thief-pilfer-hp', apCost: 60, prereq: 'x2-thief-pilfer-gil' },
    { abilityId: 'x2-thief-pilfer-mp', apCost: 60, prereq: 'x2-thief-pilfer-hp' },
    { abilityId: 'x2-thief-sticky-fingers', apCost: 120, prereq: 'x2-thief-pilfer-hp' },
    { abilityId: 'x2-thief-master-thief', apCost: 140, prereq: 'x2-thief-sticky-fingers' },
    { abilityId: 'x2-thief-soul-swipe', apCost: 160, prereq: 'x2-thief-pilfer-hp' },
    { abilityId: 'x2-thief-steal-will', apCost: 160, prereq: 'x2-thief-soul-swipe' },
    { abilityId: 'x2-thief-flee', apCost: 10 },
    { abilityId: 'x2-thief-first-strike', apCost: 40 },
    { abilityId: 'x2-thief-initiative', apCost: 60, prereq: 'x2-thief-first-strike' },
  ],
};

export default thief;
