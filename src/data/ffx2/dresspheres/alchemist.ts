/**
 * Alchemist [ffx2-combat-core §3.11, §5.1a, §5.1b]. Long range, free
 * consumables. Mastery is 2,249 AP, by far the most expensive dressphere —
 * Ether (400) and Elixir (999) alone account for over half of it.
 */

import type { DressphereDef } from './types.ts';

export const alchemist: DressphereDef = {
  id: 'alchemist',
  name: 'Alchemist',
  commands: ['Attack', 'Mix', 'Stash', 'Item'],
  longRange: true,
  masteryAp: 2249,
  citation: 'ffx2-combat-core.md §3.11, §5.1a, §5.1b [single source, derived total]',
  growth: {
    hp: { a: 38, b: 80, q: 7.6 },
    mp: { a: 1.5, b: 14, q: 177 },
    str: { a: 1.6, d: 66, b: 13, q: 208 },
    mag: { a: 0.2, d: 13, b: 4, q: 6400 },
    def: { a: 1, d: 60, b: 10, q: 176 },
    mdef: { a: 0.3, d: 19, b: 2, q: 6400 },
    agi: { a: 0, d: 12, b: 50, q: 12800 },
    acc: { a: 0, d: 13, b: 117, q: 12800 },
    eva: { a: 0, d: 22, b: 1, q: 12800 },
    luck: { a: 0, d: 33, b: 10, q: 12800 },
  },
  exactLevels: {
    20: { hp: 788, mp: 42, str: 44, mag: 12, def: 26, mdef: 10, agi: 52, acc: 119, eva: 3, luck: 11 },
    23: { hp: 885, mp: 46, str: 47, mag: 13, def: 27, mdef: 11, agi: 52, acc: 120, eva: 3, luck: 11 },
    24: { hp: 917, mp: 47, str: 49, mag: 14, def: 28, mdef: 11, agi: 52, acc: 120, eva: 3, luck: 11 },
    25: { hp: 948, mp: 48, str: 50, mag: 14, def: 29, mdef: 12, agi: 52, acc: 120, eva: 3, luck: 11 },
    28: { hp: 1041, mp: 52, str: 54, mag: 15, def: 30, mdef: 13, agi: 52, acc: 120, eva: 3, luck: 11 },
    30: { hp: 1102, mp: 54, str: 57, mag: 17, def: 32, mdef: 14, agi: 53, acc: 121, eva: 4, luck: 12 },
    43: { hp: 1471, mp: 68, str: 73, mag: 20, def: 39, mdef: 18, agi: 55, acc: 121, eva: 4, luck: 12 },
    46: { hp: 1550, mp: 72, str: 76, mag: 22, def: 40, mdef: 19, agi: 54, acc: 122, eva: 4, luck: 12 },
    48: { hp: 1601, mp: 73, str: 78, mag: 22, def: 41, mdef: 20, agi: 54, acc: 122, eva: 4, luck: 12 },
    50: { hp: 1652, mp: 75, str: 81, mag: 23, def: 42, mdef: 21, agi: 55, acc: 123, eva: 4, luck: 13 },
  },
  abilities: [
    { abilityId: 'x2-alchemist-attack', apCost: 0 },
    { abilityId: 'x2-alchemist-mix', apCost: 0 },
    { abilityId: 'x2-alchemist-stash-potion', apCost: 10 },
    { abilityId: 'x2-alchemist-stash-hi-potion', apCost: 40, prereq: 'x2-alchemist-stash-potion' },
    { abilityId: 'x2-alchemist-stash-mega-potion', apCost: 120, prereq: 'x2-alchemist-stash-hi-potion' },
    { abilityId: 'x2-alchemist-stash-x-potion', apCost: 160, prereq: 'x2-alchemist-stash-mega-potion' },
    { abilityId: 'x2-alchemist-stash-remedy', apCost: 20 },
    { abilityId: 'x2-alchemist-stash-phoenix-down', apCost: 30 },
    { abilityId: 'x2-alchemist-stash-ether', apCost: 400 },
    { abilityId: 'x2-alchemist-stash-elixir', apCost: 999, prereq: 'x2-alchemist-stash-ether' },
    { abilityId: 'x2-alchemist-items-lv2', apCost: 30 },
    { abilityId: 'x2-alchemist-chemist', apCost: 40 },
    { abilityId: 'x2-alchemist-elementalist', apCost: 80, prereq: 'x2-alchemist-chemist' },
  ],
};

export default alchemist;
