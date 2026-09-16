/**
 * Samurai [ffx2-combat-core §3.9, §5.1a, §5.1b]. Gil-throwing and
 * instant-death specialist; not owned at either build point (Ch. 3 pickup)
 * but included for the roster.
 */

import type { DressphereDef } from './types.ts';

export const samurai: DressphereDef = {
  id: 'samurai',
  name: 'Samurai',
  commands: ['Attack', 'Bushido', 'Spare Change', 'Zantetsu', 'Item'],
  longRange: false,
  masteryAp: 750,
  citation: 'ffx2-combat-core.md §3.9, §5.1a, §5.1b [single source, derived total]',
  growth: {
    hp: { a: 38, b: 78, q: 13.3 },
    mp: { a: 2.6, b: 18, q: 180 },
    str: { a: 2, d: 10, b: 15, q: 192 },
    mag: { a: 0.6, d: 4, b: 18, q: 6400 },
    def: { a: 0.3, d: 100, b: 32, q: 6400 },
    mdef: { a: 0.3, d: 16, b: 38, q: 6400 },
    agi: { a: 0, d: 17, b: 54, q: 12800 },
    acc: { a: 0, d: 17, b: 104, q: 12800 },
    eva: { a: 0, d: 20, b: 10, q: 12800 },
    luck: { a: 0, d: 22, b: 13, q: 12800 },
  },
  exactLevels: {
    20: { hp: 808, mp: 68, str: 55, mag: 38, def: 38, mdef: 45, agi: 56, acc: 105, eva: 12, luck: 14 },
    25: { hp: 982, mp: 80, str: 64, mag: 42, def: 40, mdef: 48, agi: 56, acc: 105, eva: 12, luck: 14 },
    30: { hp: 1151, mp: 91, str: 74, mag: 48, def: 41, mdef: 50, agi: 57, acc: 106, eva: 13, luck: 15 },
    43: { hp: 1573, mp: 119, str: 96, mag: 59, def: 44, mdef: 55, agi: 58, acc: 107, eva: 13, luck: 15 },
    48: { hp: 1729, mp: 130, str: 103, mag: 63, def: 46, mdef: 57, agi: 57, acc: 107, eva: 13, luck: 15 },
    50: { hp: 1791, mp: 135, str: 107, mag: 64, def: 47, mdef: 58, agi: 58, acc: 108, eva: 14, luck: 16 },
  },
  abilities: [
    { abilityId: 'x2-samurai-attack', apCost: 0 },
    { abilityId: 'x2-samurai-spare-change', apCost: 20 },
    { abilityId: 'x2-samurai-mirror-of-equity', apCost: 0 },
    { abilityId: 'x2-samurai-sparkler', apCost: 40 },
    { abilityId: 'x2-samurai-fireworks', apCost: 60, prereq: 'x2-samurai-sparkler' },
    { abilityId: 'x2-samurai-nonpareil', apCost: 20 },
    { abilityId: 'x2-samurai-no-fear', apCost: 30, prereq: 'x2-samurai-nonpareil' },
    { abilityId: 'x2-samurai-hayate', apCost: 60, prereq: 'x2-samurai-no-fear' },
    { abilityId: 'x2-samurai-zantetsu', apCost: 140 },
    { abilityId: 'x2-samurai-sos-critical', apCost: 80, prereq: 'x2-samurai-fireworks' },
  ],
};

export default samurai;
