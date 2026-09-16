/**
 * Trainer [ffx2-combat-core §3.13, §5.1a, §5.2]. Not owned at either build
 * point (Ch. 3 pickup). One of two dresspheres with real per-character
 * combat-stat variance (the other is Mascot); FF Wiki carries no per-level
 * table for Trainer, only the shared HP/MP curve (131 -> 3,239 HP,
 * 34 -> 214 MP across Lv 1-99) and three discrete per-girl rows at Lv 30/45/50
 * [§3.13, §5.2]. The single §5.1a growth algorithm below is therefore an
 * approximation shared across all three girls, corrected to the published
 * per-girl points at the three known levels via `perCharacterExactLevels`.
 */

import type { DressphereDef } from './types.ts';

export const trainer: DressphereDef = {
  id: 'trainer',
  name: 'Trainer',
  commands: ['Attack', 'Pet', 'Item'],
  longRange: true,
  masteryAp: 600,
  citation: 'ffx2-combat-core.md §3.13, §5.1a, §5.2 [single source, derived total, per-girl AP identical]',
  growth: {
    hp: { a: 46, b: 85, q: 7 },
    mp: { a: 2.6, b: 32, q: 130 },
    str: { a: 1.8, d: 20, b: 17, q: 240 },
    mag: { a: 1.1, d: 17, b: 12, q: 176 },
    def: { a: 0.3, d: 27, b: 32, q: 6400 },
    mdef: { a: 0.2, d: 20, b: 20, q: 12800 },
    agi: { a: 0.1, d: 100, b: 47, q: 12800 },
    acc: { a: 0, d: 11, b: 100, q: 12800 },
    eva: { a: 0, d: 20, b: 4, q: 12800 },
    luck: { a: 0, d: 20, b: 7, q: 12800 },
  },
  perCharacterExactLevels: {
    yuna: {
      30: { hp: 1337, mp: 104, str: 69, mag: 41, def: 48, mdef: 29, agi: 51, acc: 104, eva: 7, luck: 10 },
      45: { hp: 1866, mp: 134, str: 92, mag: 52, def: 55, mdef: 34, agi: 53, acc: 105, eva: 7, luck: 10 },
      50: { hp: 2028, mp: 143, str: 99, mag: 55, def: 57, mdef: 35, agi: 53, acc: 106, eva: 8, luck: 11 },
    },
    rikku: {
      30: { hp: 1337, mp: 104, str: 58, mag: 47, def: 32, mdef: 33, agi: 57, acc: 105, eva: 8, luck: 10 },
      45: { hp: 1866, mp: 134, str: 79, mag: 60, def: 39, mdef: 38, agi: 59, acc: 107, eva: 8, luck: 10 },
      50: { hp: 2028, mp: 143, str: 85, mag: 64, def: 42, mdef: 40, agi: 60, acc: 108, eva: 9, luck: 11 },
    },
    paine: {
      30: { hp: 1337, mp: 104, str: 66, mag: 48, def: 47, mdef: 30, agi: 55, acc: 108, eva: 7, luck: 14 },
      45: { hp: 1866, mp: 134, str: 89, mag: 60, def: 52, mdef: 35, agi: 56, acc: 110, eva: 7, luck: 14 },
      50: { hp: 2028, mp: 143, str: 96, mag: 63, def: 54, mdef: 38, agi: 57, acc: 110, eva: 8, luck: 15 },
    },
  },
  abilities: [
    { abilityId: 'x2-trainer-kogoro-blaze', apCost: 0, character: 'yuna' },
    { abilityId: 'x2-trainer-kogoro-strike', apCost: 80, character: 'yuna' },
    { abilityId: 'x2-trainer-doom-kogoro', apCost: 80, character: 'yuna', prereq: 'x2-trainer-kogoro-strike' },
    { abilityId: 'x2-trainer-kogoro-cure', apCost: 30, character: 'yuna' },
    { abilityId: 'x2-trainer-pound', apCost: 100, character: 'yuna', prereq: 'x2-trainer-doom-kogoro' },
    { abilityId: 'x2-trainer-sneaky-ghiki', apCost: 0, character: 'rikku' },
    { abilityId: 'x2-trainer-ghiki-gouge', apCost: 0, character: 'rikku' },
    { abilityId: 'x2-trainer-bully-ghiki', apCost: 100, character: 'rikku' },
    { abilityId: 'x2-trainer-ghiki-pep', apCost: 30, character: 'rikku' },
    { abilityId: 'x2-trainer-ghiki-cheer', apCost: 0, character: 'rikku' },
    { abilityId: 'x2-trainer-carrier-flurry', apCost: 0, character: 'paine' },
    { abilityId: 'x2-trainer-death-flurry', apCost: 60, character: 'paine' },
    { abilityId: 'x2-trainer-hp-flurry', apCost: 0, character: 'paine' },
    { abilityId: 'x2-trainer-flurry-speed', apCost: 60, character: 'paine' },
    { abilityId: 'x2-trainer-maulwings', apCost: 100, character: 'paine', prereq: 'x2-trainer-death-flurry' },
  ],
};

export default trainer;
