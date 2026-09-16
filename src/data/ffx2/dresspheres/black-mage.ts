/**
 * Black Mage [ffx2-combat-core §3.6, §5.1a, §5.1b]. No Attack command.
 * Highest MP and Magic of the standard set. AP sums to the computed 680
 * mastery total.
 */

import type { DressphereDef } from './types.ts';

export const blackMage: DressphereDef = {
  id: 'black-mage',
  name: 'Black Mage',
  commands: ['Black Magic', 'Focus', 'MP Absorb', 'Item'],
  longRange: false,
  masteryAp: 680,
  citation: 'ffx2-combat-core.md §3.6, §5.1a, §5.1b [single source, derived total]',
  growth: {
    hp: { a: 27, b: 73, q: 19.3 },
    mp: { a: 4.2, b: 48, q: 155 },
    str: { a: 0.1, d: 17, b: 5, q: 6400 },
    mag: { a: 1.6, d: 4, b: 33, q: 192 },
    def: { a: 0.1, d: 17, b: 4, q: 12800 },
    mdef: { a: 0.7, d: 19, b: 108, q: 3200 },
    agi: { a: 0, d: 17, b: 49, q: 12800 },
    acc: { a: 0, d: 18, b: 98, q: 12800 },
    eva: { a: 0.1, d: 22, b: 2, q: 12800 },
    luck: { a: 0, d: 20, b: 9, q: 12800 },
  },
  exactLevels: {
    20: { hp: 593, mp: 130, str: 8, mag: 68, def: 7, mdef: 124, agi: 51, acc: 99, eva: 4, luck: 10 },
    21: { hp: 618, mp: 134, str: 8, mag: 69, def: 7, mdef: 124, agi: 51, acc: 99, eva: 4, luck: 10 },
    22: { hp: 642, mp: 137, str: 8, mag: 71, def: 7, mdef: 125, agi: 51, acc: 99, eva: 4, luck: 10 },
    23: { hp: 667, mp: 141, str: 8, mag: 72, def: 7, mdef: 126, agi: 51, acc: 99, eva: 4, luck: 10 },
    24: { hp: 692, mp: 145, str: 8, mag: 74, def: 7, mdef: 127, agi: 51, acc: 99, eva: 4, luck: 10 },
    25: { hp: 716, mp: 149, str: 9, mag: 76, def: 8, mdef: 128, agi: 51, acc: 99, eva: 4, luck: 10 },
    26: { hp: 740, mp: 153, str: 9, mag: 77, def: 8, mdef: 128, agi: 51, acc: 99, eva: 4, luck: 10 },
    27: { hp: 765, mp: 157, str: 9, mag: 79, def: 8, mdef: 129, agi: 51, acc: 99, eva: 4, luck: 10 },
    28: { hp: 789, mp: 160, str: 9, mag: 80, def: 8, mdef: 130, agi: 51, acc: 99, eva: 4, luck: 10 },
    29: { hp: 813, mp: 164, str: 9, mag: 82, def: 8, mdef: 131, agi: 51, acc: 99, eva: 4, luck: 10 },
    30: { hp: 837, mp: 169, str: 10, mag: 84, def: 9, mdef: 132, agi: 52, acc: 100, eva: 5, luck: 11 },
    43: { hp: 1139, mp: 217, str: 12, mag: 102, def: 11, mdef: 141, agi: 53, acc: 101, eva: 5, luck: 11 },
    44: { hp: 1161, mp: 220, str: 12, mag: 104, def: 11, mdef: 141, agi: 53, acc: 101, eva: 5, luck: 11 },
    45: { hp: 1184, mp: 224, str: 13, mag: 106, def: 12, mdef: 142, agi: 53, acc: 101, eva: 5, luck: 11 },
    46: { hp: 1206, mp: 228, str: 12, mag: 106, def: 11, mdef: 142, agi: 52, acc: 101, eva: 5, luck: 11 },
    47: { hp: 1228, mp: 231, str: 12, mag: 108, def: 11, mdef: 143, agi: 52, acc: 101, eva: 5, luck: 11 },
    48: { hp: 1250, mp: 235, str: 12, mag: 109, def: 11, mdef: 144, agi: 52, acc: 100, eva: 5, luck: 11 },
    49: { hp: 1272, mp: 238, str: 12, mag: 111, def: 11, mdef: 145, agi: 52, acc: 100, eva: 5, luck: 11 },
    50: { hp: 1294, mp: 242, str: 13, mag: 112, def: 12, mdef: 146, agi: 53, acc: 101, eva: 6, luck: 12 },
    51: { hp: 1316, mp: 246, str: 13, mag: 113, def: 12, mdef: 146, agi: 53, acc: 101, eva: 6, luck: 12 },
    52: { hp: 1337, mp: 249, str: 13, mag: 115, def: 12, mdef: 147, agi: 53, acc: 101, eva: 6, luck: 12 },
  },
  abilities: [
    { abilityId: 'x2-black-mage-fire', apCost: 0 },
    { abilityId: 'x2-black-mage-blizzard', apCost: 0 },
    { abilityId: 'x2-black-mage-thunder', apCost: 0 },
    { abilityId: 'x2-black-mage-water', apCost: 0 },
    { abilityId: 'x2-black-mage-fira', apCost: 40, prereq: 'x2-black-mage-fire' },
    { abilityId: 'x2-black-mage-blizzara', apCost: 40, prereq: 'x2-black-mage-blizzard' },
    { abilityId: 'x2-black-mage-thundara', apCost: 40, prereq: 'x2-black-mage-thunder' },
    { abilityId: 'x2-black-mage-watera', apCost: 40, prereq: 'x2-black-mage-water' },
    { abilityId: 'x2-black-mage-firaga', apCost: 100, prereq: 'x2-black-mage-fira' },
    { abilityId: 'x2-black-mage-blizzaga', apCost: 100, prereq: 'x2-black-mage-blizzara' },
    { abilityId: 'x2-black-mage-thundaga', apCost: 100, prereq: 'x2-black-mage-thundara' },
    { abilityId: 'x2-black-mage-waterga', apCost: 100, prereq: 'x2-black-mage-watera' },
    { abilityId: 'x2-black-mage-focus', apCost: 10 },
    { abilityId: 'x2-black-mage-mp-absorb', apCost: 10, prereq: 'x2-black-mage-focus' },
    { abilityId: 'x2-black-mage-lv2', apCost: 40, prereq: 'x2-black-mage-mp-absorb' },
    { abilityId: 'x2-black-mage-lv3', apCost: 60, prereq: 'x2-black-mage-lv2' },
  ],
};

export default blackMage;
