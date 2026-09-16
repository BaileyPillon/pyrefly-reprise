/**
 * Gun Mage [ffx2-combat-core §3.7, §5.1a, §5.1b]. The Blue Mage; quadruple
 * damage vs matching species via Fiend Hunter. Mastery is 360 AP plus 16
 * zero-AP Blue Bullets learned by being hit.
 */

import type { DressphereDef } from './types.ts';

export const gunMage: DressphereDef = {
  id: 'gun-mage',
  name: 'Gun Mage',
  commands: ['Attack', 'Blue Bullet', 'Fiend Hunter', 'Scan', 'Item'],
  longRange: true,
  masteryAp: 360,
  citation: 'ffx2-combat-core.md §3.7, §5.1a, §5.1b [single source, derived total]',
  growth: {
    hp: { a: 36, b: 72, q: 8.8 },
    mp: { a: 3.1, b: 18, q: 173 },
    str: { a: 2, d: 67, b: 14, q: 160 },
    mag: { a: 1.5, d: 4, b: 28, q: 192 },
    def: { a: 1, d: 100, b: 7, q: 176 },
    mdef: { a: 1, d: 18, b: 44, q: 192 },
    agi: { a: 0, d: 12, b: 51, q: 12800 },
    acc: { a: 0.1, d: 100, b: 118, q: 12800 },
    eva: { a: 0, d: 22, b: 1, q: 12800 },
    luck: { a: 0, d: 27, b: 9, q: 12800 },
  },
  exactLevels: {
    20: { hp: 747, mp: 98, str: 52, mag: 61, def: 25, mdef: 63, agi: 53, acc: 120, eva: 3, luck: 10 },
    22: { hp: 809, mp: 104, str: 55, mag: 64, def: 25, mdef: 65, agi: 53, acc: 120, eva: 3, luck: 10 },
    24: { hp: 871, mp: 109, str: 59, mag: 67, def: 27, mdef: 66, agi: 53, acc: 120, eva: 3, luck: 10 },
    25: { hp: 901, mp: 112, str: 61, mag: 68, def: 28, mdef: 67, agi: 53, acc: 120, eva: 3, luck: 10 },
    26: { hp: 932, mp: 115, str: 62, mag: 70, def: 28, mdef: 68, agi: 53, acc: 120, eva: 3, luck: 10 },
    28: { hp: 991, mp: 120, str: 66, mag: 73, def: 29, mdef: 69, agi: 53, acc: 121, eva: 3, luck: 10 },
    30: { hp: 1050, mp: 126, str: 69, mag: 76, def: 31, mdef: 71, agi: 55, acc: 122, eva: 4, luck: 11 },
    43: { hp: 1410, mp: 161, str: 89, mag: 93, def: 38, mdef: 80, agi: 56, acc: 123, eva: 4, luck: 11 },
    45: { hp: 1462, mp: 166, str: 92, mag: 96, def: 38, mdef: 81, agi: 56, acc: 123, eva: 4, luck: 11 },
    48: { hp: 1539, mp: 173, str: 96, mag: 100, def: 40, mdef: 82, agi: 56, acc: 123, eva: 4, luck: 11 },
    50: { hp: 1588, mp: 179, str: 99, mag: 102, def: 41, mdef: 83, agi: 56, acc: 124, eva: 5, luck: 12 },
    52: { hp: 1637, mp: 184, str: 102, mag: 105, def: 41, mdef: 84, agi: 56, acc: 123, eva: 4, luck: 12 },
  },
  abilities: [
    { abilityId: 'x2-gun-mage-attack', apCost: 0 },
    { abilityId: 'x2-gun-mage-scan', apCost: 0 },
    { abilityId: 'x2-gun-mage-1000-needles', apCost: 0 },
    { abilityId: 'x2-gun-mage-absorb', apCost: 0 },
    { abilityId: 'x2-gun-mage-mighty-guard', apCost: 0 },
    { abilityId: 'x2-gun-mage-white-wind', apCost: 0 },
    { abilityId: 'x2-gun-mage-fire-breath', apCost: 0 },
    { abilityId: 'x2-gun-mage-stone-breath', apCost: 0 },
    { abilityId: 'x2-gun-mage-drill-shot', apCost: 0 },
    { abilityId: 'x2-gun-mage-mortar', apCost: 0 },
    { abilityId: 'x2-gun-mage-annihilator', apCost: 0 },
    { abilityId: 'x2-gun-mage-supernova', apCost: 0 },
    { abilityId: 'x2-gun-mage-cry-in-the-night', apCost: 0 },
    { abilityId: 'x2-gun-mage-fiend-hunter-lv2', apCost: 30 },
  ],
};

export default gunMage;
