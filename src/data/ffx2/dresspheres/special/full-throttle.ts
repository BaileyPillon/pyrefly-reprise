/**
 * Full Throttle — Paine's special dressphere [ffx2-combat-core §3.15].
 * Physical brawler: main body + Sinistral Wing + Dextral Wing (identical
 * growth curve). Growth curves and the two worked stat blocks (Lv 25/50, at
 * the reference 6-node grid) are transcribed from SinirothX §19. Sword Dance
 * (main, 30 AP) is called "the strongest thing in the game per action" and
 * `ffx2-bahamut.md` §3.3 recommends this transformation for that fight.
 */

import type { SpecialDressphereDef } from './types.ts';

export const fullThrottle: SpecialDressphereDef = {
  id: 'full-throttle',
  name: 'Full Throttle',
  owner: 'paine',
  partIds: { main: 'full-throttle-main', podA: 'full-throttle-left', podB: 'full-throttle-right' },
  citation: 'ffx2-combat-core.md §3.15 [single source: SinirothX §19]',
  parts: {
    main: {
      growth: {
        hp: { a: 70, b: 220, q: 15 },
        mp: { a: 1, b: 2, q: 240 },
        str: { a: 2.4, d: 18, b: 24, q: 208 },
        mag: { a: 1.3, d: 11, b: 39, q: 176 },
        def: { a: 0.3, d: 17, b: 44, q: 6400 },
        mdef: { a: 0.1, d: 6, b: 42, q: 12800 },
        agi: { a: 0, d: 16, b: 44, q: 12800 },
        acc: { a: 0, d: 21, b: 133, q: 12800 },
        eva: { a: 0, d: 16, b: 8, q: 12800 },
        luck: { a: 0, d: 15, b: 10, q: 12800 },
      },
      exactLevels: {
        25: { hp: 1928, mp: 24, str: 82, mag: 70, def: 52, mdef: 48, agi: 45, acc: 134, eva: 9, luck: 11 },
        50: { hp: 3553, mp: 41, str: 134, mag: 94, def: 61, mdef: 55, agi: 46, acc: 135, eva: 10, luck: 13 },
      },
    },
    podA: {
      // Sinistral and Dextral Wing share one growth curve [§3.15].
      growth: {
        hp: { a: 59, b: 100, q: 7 },
        mp: { a: 3, b: 80, q: 120 },
        str: { a: 2, d: 17, b: 18, q: 256 },
        mag: { a: 1.1, d: 8, b: 22, q: 240 },
        def: { a: 0.4, d: 27, b: 43, q: 6400 },
        mdef: { a: 0.1, d: 10, b: 42, q: 12800 },
        agi: { a: 0, d: 15, b: 40, q: 12800 },
        acc: { a: 0.2, d: 15, b: 106, q: 12800 },
        eva: { a: 0, d: 22, b: 2, q: 12800 },
        luck: { a: 0, d: 17, b: 3, q: 12800 },
      },
      exactLevels: {
        25: { hp: 1485, mp: 149, str: 67, mag: 50, def: 53, mdef: 46, agi: 41, acc: 112, eva: 3, luck: 4 },
        50: { hp: 2692, mp: 209, str: 111, mag: 72, def: 64, mdef: 51, agi: 43, acc: 119, eva: 4, luck: 5 },
      },
    },
    podB: {
      growth: {
        hp: { a: 59, b: 100, q: 7 },
        mp: { a: 3, b: 80, q: 120 },
        str: { a: 2, d: 17, b: 18, q: 256 },
        mag: { a: 1.1, d: 8, b: 22, q: 240 },
        def: { a: 0.4, d: 27, b: 43, q: 6400 },
        mdef: { a: 0.1, d: 10, b: 42, q: 12800 },
        agi: { a: 0, d: 15, b: 40, q: 12800 },
        acc: { a: 0.2, d: 15, b: 106, q: 12800 },
        eva: { a: 0, d: 22, b: 2, q: 12800 },
        luck: { a: 0, d: 17, b: 3, q: 12800 },
      },
      exactLevels: {
        25: { hp: 1485, mp: 149, str: 67, mag: 50, def: 53, mdef: 46, agi: 41, acc: 112, eva: 3, luck: 4 },
        50: { hp: 2692, mp: 209, str: 111, mag: 72, def: 64, mdef: 51, agi: 43, acc: 119, eva: 4, luck: 5 },
      },
    },
  },
  abilities: {
    main: [
      { abilityId: 'x2-full-throttle-attack', apCost: 0 },
      { abilityId: 'x2-full-throttle-aestus', apCost: 0 },
      { abilityId: 'x2-full-throttle-fiers', apCost: 20, prereq: 'x2-full-throttle-aestus' },
      { abilityId: 'x2-full-throttle-deeth', apCost: 20, prereq: 'x2-full-throttle-fiers' },
      { abilityId: 'x2-full-throttle-fright', apCost: 20 },
      { abilityId: 'x2-full-throttle-sword-dance', apCost: 30, prereq: 'x2-full-throttle-fright' },
    ],
    podA: [
      { abilityId: 'x2-full-throttle-steel-feather', apCost: 0 },
      { abilityId: 'x2-full-throttle-diamond-feather', apCost: 0 },
      { abilityId: 'x2-full-throttle-buckle-feather', apCost: 0 },
      { abilityId: 'x2-full-throttle-pumice-feather', apCost: 10 },
      { abilityId: 'x2-full-throttle-stamina', apCost: 0 },
      { abilityId: 'x2-full-throttle-reboot', apCost: 10 },
    ],
    podB: [
      { abilityId: 'x2-full-throttle-venom-wing', apCost: 0 },
      { abilityId: 'x2-full-throttle-lazy-wing', apCost: 0 },
      { abilityId: 'x2-full-throttle-still-wing', apCost: 10 },
    ],
  },
};

export default fullThrottle;
