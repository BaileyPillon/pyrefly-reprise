/**
 * Warrior — Paine's default [ffx2-combat-core §3.3, §5.1a, §5.1b].
 * High HP/Str/Def, worst MDef of the standard set. AP costs corrected per the
 * §3.0 authority box (Power Break 30, not `init`) so the list sums to the
 * published 740 mastery total.
 */

import type { DressphereDef } from './types.ts';

export const warrior: DressphereDef = {
  id: 'warrior',
  name: 'Warrior',
  commands: ['Attack', 'Swordplay', 'Assault', 'Sentinel', 'Item'],
  longRange: false,
  masteryAp: 740,
  citation: 'ffx2-combat-core.md §3.3, §5.1a, §5.1b [verified: 2 sources]',
  growth: {
    hp: { a: 46, b: 103, q: 18.3 },
    mp: { a: 2.2, b: 16, q: 150 },
    str: { a: 2, d: 4, b: 14, q: 304 },
    mag: { a: 0.4, d: 13, b: 12, q: 6400 },
    def: { a: 1.1, d: 60, b: 74, q: 208 },
    mdef: { a: 0, d: 10, b: 5, q: 6400 },
    agi: { a: 0, d: 16, b: 48, q: 12800 },
    acc: { a: 0, d: 22, b: 100, q: 12800 },
    eva: { a: 0, d: 20, b: 3, q: 12800 },
    luck: { a: 0, d: 22, b: 11, q: 12800 },
  },
  exactLevels: {
    20: { hp: 1002, mp: 58, str: 57, mag: 24, def: 95, mdef: 8, agi: 50, acc: 102, eva: 5, luck: 12 },
    21: { hp: 1045, mp: 60, str: 58, mag: 24, def: 96, mdef: 8, agi: 50, acc: 102, eva: 5, luck: 12 },
    22: { hp: 1089, mp: 61, str: 60, mag: 25, def: 97, mdef: 8, agi: 50, acc: 102, eva: 5, luck: 12 },
    23: { hp: 1133, mp: 63, str: 62, mag: 25, def: 97, mdef: 8, agi: 50, acc: 102, eva: 5, luck: 12 },
    24: { hp: 1176, mp: 65, str: 64, mag: 26, def: 99, mdef: 8, agi: 50, acc: 102, eva: 5, luck: 12 },
    25: { hp: 1219, mp: 67, str: 66, mag: 26, def: 100, mdef: 9, agi: 50, acc: 102, eva: 5, luck: 12 },
    26: { hp: 1263, mp: 69, str: 68, mag: 26, def: 100, mdef: 9, agi: 50, acc: 102, eva: 5, luck: 12 },
    27: { hp: 1306, mp: 71, str: 69, mag: 27, def: 101, mdef: 9, agi: 50, acc: 102, eva: 5, luck: 12 },
    28: { hp: 1349, mp: 72, str: 72, mag: 27, def: 102, mdef: 9, agi: 50, acc: 102, eva: 5, luck: 12 },
    29: { hp: 1392, mp: 74, str: 74, mag: 28, def: 103, mdef: 9, agi: 50, acc: 102, eva: 5, luck: 12 },
    30: { hp: 1434, mp: 76, str: 75, mag: 29, def: 104, mdef: 10, agi: 51, acc: 103, eva: 6, luck: 13 },
    43: { hp: 1980, mp: 98, str: 98, mag: 34, def: 113, mdef: 11, agi: 52, acc: 103, eva: 6, luck: 13 },
    44: { hp: 2022, mp: 100, str: 100, mag: 35, def: 113, mdef: 10, agi: 52, acc: 103, eva: 6, luck: 13 },
    45: { hp: 2063, mp: 102, str: 101, mag: 36, def: 115, mdef: 11, agi: 52, acc: 103, eva: 6, luck: 13 },
    46: { hp: 2104, mp: 103, str: 103, mag: 36, def: 114, mdef: 11, agi: 52, acc: 103, eva: 6, luck: 13 },
    47: { hp: 2145, mp: 105, str: 104, mag: 37, def: 115, mdef: 11, agi: 52, acc: 103, eva: 6, luck: 13 },
    48: { hp: 2186, mp: 106, str: 106, mag: 37, def: 116, mdef: 11, agi: 52, acc: 103, eva: 6, luck: 13 },
    49: { hp: 2226, mp: 107, str: 108, mag: 38, def: 117, mdef: 11, agi: 52, acc: 103, eva: 6, luck: 13 },
    50: { hp: 2267, mp: 110, str: 109, mag: 38, def: 117, mdef: 12, agi: 53, acc: 104, eva: 7, luck: 14 },
    51: { hp: 2307, mp: 111, str: 110, mag: 38, def: 118, mdef: 12, agi: 53, acc: 104, eva: 7, luck: 14 },
    52: { hp: 2348, mp: 112, str: 113, mag: 39, def: 118, mdef: 12, agi: 53, acc: 104, eva: 7, luck: 14 },
  },
  abilities: [
    { abilityId: 'x2-warrior-attack', apCost: 0 },
    { abilityId: 'x2-warrior-sentinel', apCost: 20 },
    { abilityId: 'x2-warrior-flametongue', apCost: 20 },
    { abilityId: 'x2-warrior-ice-brand', apCost: 20 },
    { abilityId: 'x2-warrior-thunder-blade', apCost: 20 },
    { abilityId: 'x2-warrior-liquid-steel', apCost: 20 },
    { abilityId: 'x2-warrior-demi-sword', apCost: 60, prereq: 'x2-warrior-liquid-steel' },
    { abilityId: 'x2-warrior-excalibur', apCost: 120, prereq: 'x2-warrior-demi-sword' },
    { abilityId: 'x2-warrior-power-break', apCost: 30 },
    { abilityId: 'x2-warrior-armor-break', apCost: 30 },
    { abilityId: 'x2-warrior-magic-break', apCost: 30 },
    { abilityId: 'x2-warrior-mental-break', apCost: 30, prereq: 'x2-warrior-magic-break' },
    { abilityId: 'x2-warrior-delay-attack', apCost: 100, prereq: 'x2-warrior-armor-break' },
    { abilityId: 'x2-warrior-delay-buster', apCost: 120, prereq: 'x2-warrior-delay-attack' },
    { abilityId: 'x2-warrior-assault', apCost: 100, prereq: 'x2-warrior-sentinel' },
    { abilityId: 'x2-warrior-sos-protect', apCost: 20, prereq: 'x2-warrior-sentinel' },
  ],
};

export default warrior;
