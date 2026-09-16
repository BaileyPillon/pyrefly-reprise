/**
 * White Mage [ffx2-combat-core §3.5, §5.1a, §5.1b]. No Attack command. Best
 * Magic Defense and high MP of the standard set. AP costs corrected per the
 * §3.0 authority box (Cure 20, Dispel 30, Full-Life 160) so the list sums to
 * the published 750 mastery total. **Casting Shell first is the single
 * action that converts a guaranteed Bahamut-fight wipe into a guaranteed
 * survival** [ffx2-bahamut §2.4, §3.3].
 */

import type { DressphereDef } from './types.ts';

export const whiteMage: DressphereDef = {
  id: 'white-mage',
  name: 'White Mage',
  commands: ['Pray', 'Vigor', 'White Magic', 'Item'],
  longRange: false,
  masteryAp: 750,
  citation: 'ffx2-combat-core.md §3.5, §5.1a, §5.1b [verified: 2 sources]',
  growth: {
    hp: { a: 28, b: 75, q: 17.7 },
    mp: { a: 3.9, b: 44, q: 122 },
    str: { a: 0.1, d: 13, b: 5, q: 6400 },
    mag: { a: 1.8, d: 10, b: 28, q: 160 },
    def: { a: 0.1, d: 19, b: 8, q: 12800 },
    mdef: { a: 0.9, d: 100, b: 111, q: 1600 },
    agi: { a: 0, d: 17, b: 50, q: 12800 },
    acc: { a: 0, d: 18, b: 98, q: 12800 },
    eva: { a: 0, d: 22, b: 4, q: 12800 },
    luck: { a: 0, d: 19, b: 9, q: 12800 },
  },
  exactLevels: {
    20: { hp: 613, mp: 119, str: 9, mag: 64, def: 12, mdef: 129, agi: 52, acc: 100, eva: 5, luck: 10 },
    21: { hp: 639, mp: 122, str: 9, mag: 65, def: 12, mdef: 129, agi: 52, acc: 100, eva: 5, luck: 10 },
    22: { hp: 664, mp: 126, str: 9, mag: 66, def: 12, mdef: 130, agi: 52, acc: 100, eva: 5, luck: 10 },
    23: { hp: 690, mp: 129, str: 9, mag: 68, def: 12, mdef: 131, agi: 52, acc: 100, eva: 5, luck: 10 },
    24: { hp: 715, mp: 133, str: 9, mag: 70, def: 12, mdef: 132, agi: 52, acc: 100, eva: 5, luck: 10 },
    25: { hp: 740, mp: 136, str: 10, mag: 72, def: 13, mdef: 133, agi: 52, acc: 100, eva: 5, luck: 10 },
    26: { hp: 765, mp: 140, str: 10, mag: 72, def: 13, mdef: 134, agi: 52, acc: 100, eva: 5, luck: 10 },
    27: { hp: 790, mp: 144, str: 10, mag: 74, def: 13, mdef: 135, agi: 52, acc: 100, eva: 5, luck: 10 },
    28: { hp: 815, mp: 147, str: 10, mag: 76, def: 13, mdef: 136, agi: 52, acc: 100, eva: 5, luck: 10 },
    29: { hp: 840, mp: 151, str: 10, mag: 77, def: 13, mdef: 137, agi: 52, acc: 100, eva: 5, luck: 10 },
    30: { hp: 865, mp: 154, str: 11, mag: 80, def: 14, mdef: 138, agi: 53, acc: 101, eva: 6, luck: 11 },
    43: { hp: 1175, mp: 196, str: 13, mag: 98, def: 15, mdef: 148, agi: 54, acc: 102, eva: 6, luck: 11 },
    44: { hp: 1198, mp: 200, str: 13, mag: 99, def: 15, mdef: 149, agi: 54, acc: 102, eva: 6, luck: 11 },
    45: { hp: 1221, mp: 203, str: 14, mag: 101, def: 16, mdef: 150, agi: 54, acc: 102, eva: 6, luck: 11 },
    46: { hp: 1244, mp: 206, str: 14, mag: 101, def: 16, mdef: 151, agi: 54, acc: 101, eva: 6, luck: 11 },
    47: { hp: 1267, mp: 209, str: 13, mag: 103, def: 16, mdef: 152, agi: 53, acc: 101, eva: 6, luck: 11 },
    48: { hp: 1289, mp: 213, str: 13, mag: 104, def: 16, mdef: 153, agi: 53, acc: 101, eva: 6, luck: 11 },
    49: { hp: 1312, mp: 216, str: 13, mag: 105, def: 16, mdef: 154, agi: 53, acc: 101, eva: 6, luck: 11 },
    50: { hp: 1334, mp: 219, str: 14, mag: 108, def: 17, mdef: 155, agi: 54, acc: 102, eva: 7, luck: 12 },
    51: { hp: 1357, mp: 221, str: 14, mag: 108, def: 17, mdef: 155, agi: 54, acc: 102, eva: 7, luck: 12 },
    52: { hp: 1379, mp: 224, str: 14, mag: 110, def: 17, mdef: 156, agi: 54, acc: 102, eva: 7, luck: 12 },
  },
  abilities: [
    { abilityId: 'x2-white-mage-pray', apCost: 0 },
    { abilityId: 'x2-white-mage-vigor', apCost: 20 },
    { abilityId: 'x2-white-mage-shell', apCost: 30 },
    { abilityId: 'x2-white-mage-protect', apCost: 30, prereq: 'x2-white-mage-shell' },
    { abilityId: 'x2-white-mage-cure', apCost: 20 },
    { abilityId: 'x2-white-mage-cura', apCost: 40, prereq: 'x2-white-mage-cure' },
    { abilityId: 'x2-white-mage-curaga', apCost: 80, prereq: 'x2-white-mage-cura' },
    { abilityId: 'x2-white-mage-esuna', apCost: 20 },
    { abilityId: 'x2-white-mage-dispel', apCost: 30, prereq: 'x2-white-mage-esuna' },
    { abilityId: 'x2-white-mage-life', apCost: 30 },
    { abilityId: 'x2-white-mage-full-life', apCost: 160, prereq: 'x2-white-mage-life' },
    { abilityId: 'x2-white-mage-reflect', apCost: 30, prereq: 'x2-white-mage-protect' },
    { abilityId: 'x2-white-mage-regen', apCost: 80, prereq: 'x2-white-mage-curaga' },
    { abilityId: 'x2-white-mage-full-cure', apCost: 80, prereq: 'x2-white-mage-regen' },
    { abilityId: 'x2-white-mage-lv2', apCost: 40, prereq: 'x2-white-mage-vigor' },
    { abilityId: 'x2-white-mage-lv3', apCost: 60, prereq: 'x2-white-mage-lv2' },
  ],
};

export default whiteMage;
