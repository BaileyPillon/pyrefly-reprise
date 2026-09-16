/**
 * Mascot [ffx2-combat-core §3.14, §5.1a, §5.1b, §5.2]. The endgame
 * dressphere (Episode Complete in all 15 areas of Spira) — not realistically
 * owned at either build point. The §5.1b per-level table matches Yuna's
 * §5.2 discrete rows exactly, so it is used as the shared baseline
 * `exactLevels`; Rikku and Paine's small stat divergence (different borrowed
 * skillsets) is captured via `perCharacterExactLevels` at the three published
 * points.
 */

import type { DressphereDef } from './types.ts';

export const mascot: DressphereDef = {
  id: 'mascot',
  name: 'Mascot',
  commands: ['Attack', 'Kupo! / Wildcat / Cutlery', 'Item'],
  longRange: false,
  masteryAp: 653,
  citation: 'ffx2-combat-core.md §3.14, §5.1a, §5.1b, §5.2 [single source, derived total, per-girl]',
  growth: {
    hp: { a: 81, b: 90, q: 6.7 },
    mp: { a: 5.8, b: 99, q: 97 },
    str: { a: 1.8, d: 17, b: 20, q: 240 },
    mag: { a: 2, d: 12, b: 30, q: 112 },
    def: { a: 0.1, d: 23, b: 130, q: 12800 },
    mdef: { a: 0.1, d: 8, b: 110, q: 6400 },
    agi: { a: 0.1, d: 22, b: 54, q: 12800 },
    acc: { a: 0.1, d: 22, b: 120, q: 12800 },
    eva: { a: 0, d: 10, b: 10, q: 12800 },
    luck: { a: 0, d: 23, b: 15, q: 12800 },
  },
  // Yuna's curve; matches her §5.2 discrete points exactly.
  exactLevels: {
    20: { hp: 1651, mp: 211, str: 56, mag: 68, def: 135, mdef: 117, agi: 58, acc: 123, eva: 13, luck: 17 },
    30: { hp: 2386, mp: 264, str: 72, mag: 84, def: 137, mdef: 120, agi: 60, acc: 124, eva: 15, luck: 18 },
    43: { hp: 3298, mp: 329, str: 92, mag: 103, def: 139, mdef: 122, agi: 61, acc: 126, eva: 15, luck: 18 },
    45: { hp: 3433, mp: 340, str: 95, mag: 105, def: 139, mdef: 123, agi: 62, acc: 126, eva: 16, luck: 18 },
    48: { hp: 3635, mp: 354, str: 99, mag: 110, def: 139, mdef: 124, agi: 62, acc: 126, eva: 16, luck: 18 },
    50: { hp: 3767, mp: 364, str: 102, mag: 112, def: 140, mdef: 124, agi: 62, acc: 127, eva: 17, luck: 19 },
  },
  perCharacterExactLevels: {
    rikku: {
      30: { hp: 2383, mp: 268, str: 69, mag: 88, def: 136, mdef: 128, agi: 59, acc: 122, eva: 15, luck: 17 },
      45: { hp: 3418, mp: 344, str: 91, mag: 109, def: 139, mdef: 133, agi: 61, acc: 124, eva: 16, luck: 17 },
      50: { hp: 3748, mp: 369, str: 98, mag: 116, def: 139, mdef: 134, agi: 62, acc: 125, eva: 17, luck: 18 },
    },
    paine: {
      30: { hp: 2342, mp: 240, str: 76, mag: 70, def: 134, mdef: 118, agi: 56, acc: 128, eva: 10, luck: 18 },
      45: { hp: 3366, mp: 301, str: 100, mag: 89, def: 137, mdef: 121, agi: 58, acc: 130, eva: 11, luck: 18 },
      50: { hp: 3693, mp: 320, str: 108, mag: 96, def: 138, mdef: 123, agi: 59, acc: 132, eva: 11, luck: 19 },
    },
  },
  abilities: [
    { abilityId: 'x2-mascot-ribbon', apCost: 999 },
    { abilityId: 'x2-mascot-auto-shell', apCost: 80 },
    { abilityId: 'x2-mascot-auto-protect', apCost: 80, prereq: 'x2-mascot-auto-shell' },
    { abilityId: 'x2-mascot-moogle-beam', apCost: 80, character: 'yuna', prereq: 'x2-mascot-auto-protect' },
    { abilityId: 'x2-mascot-pupu-platter', apCost: 80, character: 'rikku', prereq: 'x2-mascot-auto-protect' },
    { abilityId: 'x2-mascot-cactling-gun', apCost: 80, character: 'paine', prereq: 'x2-mascot-auto-protect' },
  ],
};

export default mascot;
