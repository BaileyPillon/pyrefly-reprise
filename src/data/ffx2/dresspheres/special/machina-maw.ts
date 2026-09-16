/**
 * Machina Maw — Rikku's special dressphere [ffx2-combat-core §3.15].
 * Physical/status mech: main body + Smasher-R + Crusher-L (identical growth
 * curve). Growth curves and the two worked stat blocks (Lv 25/50, at the
 * reference 6-node grid) are transcribed from SinirothX §19.
 */

import type { SpecialDressphereDef } from './types.ts';

export const machinaMaw: SpecialDressphereDef = {
  id: 'machina-maw',
  name: 'Machina Maw',
  owner: 'rikku',
  partIds: { main: 'machina-maw-main', podA: 'machina-maw-smasher-r', podB: 'machina-maw-crusher-l' },
  citation: 'ffx2-combat-core.md §3.15 [single source: SinirothX §19]',
  parts: {
    main: {
      growth: {
        hp: { a: 66, b: 200, q: 13 },
        mp: { a: 5.5, b: 40, q: 70 },
        str: { a: 2.3, d: 20, b: 19, q: 192 },
        mag: { a: 1.4, d: 8, b: 21, q: 208 },
        def: { a: 0.2, d: 11, b: 80, q: 12800 },
        mdef: { a: 0.1, d: 9, b: 28, q: 6400 },
        agi: { a: 0, d: 15, b: 40, q: 12800 },
        acc: { a: 0, d: 15, b: 116, q: 12800 },
        eva: { a: 0, d: 19, b: 2, q: 12800 },
        luck: { a: 0, d: 15, b: 6, q: 12800 },
      },
      exactLevels: {
        25: { hp: 1801, mp: 168, str: 74, mag: 56, def: 87, mdef: 33, agi: 41, acc: 117, eva: 3, luck: 7 },
        50: { hp: 3307, mp: 279, str: 123, mag: 85, def: 94, mdef: 38, agi: 43, acc: 119, eva: 4, luck: 9 },
      },
    },
    podA: {
      // Smasher-R and Crusher-L share one growth curve [§3.15].
      growth: {
        hp: { a: 54, b: 80, q: 8.5 },
        mp: { a: 4, b: 20, q: 100 },
        str: { a: 2.3, d: 12, b: 14, q: 160 },
        mag: { a: 1.3, d: 11, b: 20, q: 208 },
        def: { a: 0.3, d: 13, b: 30, q: 6400 },
        mdef: { a: 0, d: 7, b: 28, q: 9600 },
        agi: { a: 0, d: 17, b: 38, q: 12800 },
        acc: { a: 0, d: 8, b: 110, q: 12800 },
        eva: { a: 0, d: 17, b: 1, q: 12800 },
        luck: { a: 0, d: 19, b: 5, q: 12800 },
      },
      exactLevels: {
        25: { hp: 1356, mp: 113, str: 69, mag: 51, def: 39, mdef: 31, agi: 39, acc: 113, eva: 2, luck: 6 },
        50: { hp: 2485, mp: 195, str: 117, mag: 77, def: 48, mdef: 34, agi: 40, acc: 116, eva: 3, luck: 7 },
      },
    },
    podB: {
      growth: {
        hp: { a: 54, b: 80, q: 8.5 },
        mp: { a: 4, b: 20, q: 100 },
        str: { a: 2.3, d: 12, b: 14, q: 160 },
        mag: { a: 1.3, d: 11, b: 20, q: 208 },
        def: { a: 0.3, d: 13, b: 30, q: 6400 },
        mdef: { a: 0, d: 7, b: 28, q: 9600 },
        agi: { a: 0, d: 17, b: 38, q: 12800 },
        acc: { a: 0, d: 8, b: 110, q: 12800 },
        eva: { a: 0, d: 17, b: 1, q: 12800 },
        luck: { a: 0, d: 19, b: 5, q: 12800 },
      },
      exactLevels: {
        25: { hp: 1356, mp: 113, str: 69, mag: 51, def: 39, mdef: 31, agi: 39, acc: 113, eva: 2, luck: 6 },
        50: { hp: 2485, mp: 195, str: 117, mag: 77, def: 48, mdef: 34, agi: 40, acc: 116, eva: 3, luck: 7 },
      },
    },
  },
  abilities: {
    main: [
      { abilityId: 'x2-machina-maw-attack', apCost: 0 },
      { abilityId: 'x2-machina-maw-death-missile', apCost: 0 },
      { abilityId: 'x2-machina-maw-revival', apCost: 10 },
      { abilityId: 'x2-machina-maw-shockwave', apCost: 20 },
      { abilityId: 'x2-machina-maw-shockstorm', apCost: 20, prereq: 'x2-machina-maw-shockwave' },
      { abilityId: 'x2-machina-maw-vajra', apCost: 30, prereq: 'x2-machina-maw-shockstorm' },
    ],
    podA: [
      { abilityId: 'x2-machina-maw-howitzer', apCost: 0 },
      { abilityId: 'x2-machina-maw-anti-power-shell', apCost: 10 },
      { abilityId: 'x2-machina-maw-shellter', apCost: 20 },
      { abilityId: 'x2-machina-maw-hp-repair', apCost: 0 },
    ],
    podB: [
      { abilityId: 'x2-machina-maw-blind-shell', apCost: 10 },
      { abilityId: 'x2-machina-maw-anti-magic-shell', apCost: 10 },
      { abilityId: 'x2-machina-maw-booster', apCost: 20 },
      { abilityId: 'x2-machina-maw-mp-repair', apCost: 0 },
    ],
  },
};

export default machinaMaw;
