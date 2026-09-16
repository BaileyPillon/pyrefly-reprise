/**
 * Floral Fallal — Yuna's special dressphere [ffx2-combat-core §3.15].
 * Magic-oriented: main body + Left Pistil (offence/status) + Right Pistil
 * (support/debuff). Growth curves and the two worked stat blocks (Lv 25/50,
 * at the reference 6-node grid) are transcribed from SinirothX §19.
 */

import type { SpecialDressphereDef } from './types.ts';

export const floralFallal: SpecialDressphereDef = {
  id: 'floral-fallal',
  name: 'Floral Fallal',
  owner: 'yuna',
  partIds: { main: 'floral-fallal-main', podA: 'floral-fallal-left-pistil', podB: 'floral-fallal-right-pistil' },
  citation: 'ffx2-combat-core.md §3.15 [single source: SinirothX §19]',
  parts: {
    main: {
      growth: {
        hp: { a: 72, b: 180, q: 13 },
        mp: { a: 6.6, b: 60, q: 40 },
        str: { a: 2.2, d: 6, b: 18, q: 176 },
        mag: { a: 2.1, d: 17, b: 40, q: 176 },
        def: { a: 0.1, d: 7, b: 38, q: 12800 },
        mdef: { a: 0.1, d: 13, b: 94, q: 6400 },
        agi: { a: 0, d: 17, b: 40, q: 12800 },
        acc: { a: 0, d: 44, b: 116, q: 12800 },
        eva: { a: 0, d: 20, b: 2, q: 12800 },
        luck: { a: 0, d: 17, b: 8, q: 12800 },
      },
      exactLevels: {
        25: { hp: 1931, mp: 209, str: 73, mag: 90, def: 44, mdef: 98, agi: 41, acc: 116, eva: 3, luck: 9 },
        50: { hp: 3587, mp: 327, str: 122, mag: 133, def: 49, mdef: 102, agi: 42, acc: 116, eva: 4, luck: 10 },
      },
    },
    podA: {
      growth: {
        hp: { a: 51, b: 80, q: 12 },
        mp: { a: 4, b: 80, q: 60 },
        str: { a: 2.2, d: 33, b: 13, q: 160 },
        mag: { a: 1.6, d: 20, b: 30, q: 320 },
        def: { a: 0.1, d: 13, b: 40, q: 12800 },
        mdef: { a: 0.1, d: 13, b: 70, q: 6400 },
        agi: { a: 0, d: 16, b: 38, q: 12800 },
        acc: { a: 0, d: 22, b: 105, q: 12800 },
        eva: { a: 0, d: 22, b: 2, q: 12800 },
        luck: { a: 0, d: 20, b: 5, q: 12800 },
      },
      exactLevels: {
        25: { hp: 1302, mp: 169, str: 64, mag: 69, def: 44, mdef: 74, agi: 39, acc: 106, eva: 3, luck: 6 },
        50: { hp: 2421, mp: 238, str: 108, mag: 104, def: 48, mdef: 78, agi: 40, acc: 107, eva: 4, luck: 7 },
      },
    },
    podB: {
      // Left and Right Pistil share one growth curve [§3.15].
      growth: {
        hp: { a: 51, b: 80, q: 12 },
        mp: { a: 4, b: 80, q: 60 },
        str: { a: 2.2, d: 33, b: 13, q: 160 },
        mag: { a: 1.6, d: 20, b: 30, q: 320 },
        def: { a: 0.1, d: 13, b: 40, q: 12800 },
        mdef: { a: 0.1, d: 13, b: 70, q: 6400 },
        agi: { a: 0, d: 16, b: 38, q: 12800 },
        acc: { a: 0, d: 22, b: 105, q: 12800 },
        eva: { a: 0, d: 22, b: 2, q: 12800 },
        luck: { a: 0, d: 20, b: 5, q: 12800 },
      },
      exactLevels: {
        25: { hp: 1302, mp: 169, str: 64, mag: 69, def: 44, mdef: 74, agi: 39, acc: 106, eva: 3, luck: 6 },
        50: { hp: 2421, mp: 238, str: 108, mag: 104, def: 48, mdef: 78, agi: 40, acc: 107, eva: 4, luck: 7 },
      },
    },
  },
  abilities: {
    main: [
      { abilityId: 'x2-floral-fallal-attack', apCost: 0 },
      { abilityId: 'x2-floral-fallal-heat-whirl', apCost: 0 },
      { abilityId: 'x2-floral-fallal-barrier', apCost: 20 },
      { abilityId: 'x2-floral-fallal-flare-whirl', apCost: 24 },
      { abilityId: 'x2-floral-fallal-great-whirl', apCost: 30, prereq: 'x2-floral-fallal-flare-whirl' },
    ],
    podA: [
      { abilityId: 'x2-floral-fallal-dream-pollen', apCost: 0 },
      { abilityId: 'x2-floral-fallal-halfdeath-petals', apCost: 0 },
      { abilityId: 'x2-floral-fallal-death-petals', apCost: 10 },
      { abilityId: 'x2-floral-fallal-left-stigma', apCost: 20 },
    ],
    podB: [
      { abilityId: 'x2-floral-fallal-white-pollen', apCost: 0 },
      { abilityId: 'x2-floral-fallal-tough-nuts', apCost: 0 },
      { abilityId: 'x2-floral-fallal-hard-leaves', apCost: 0 },
      { abilityId: 'x2-floral-fallal-right-stigma', apCost: 20 },
    ],
  },
};

export default floralFallal;
