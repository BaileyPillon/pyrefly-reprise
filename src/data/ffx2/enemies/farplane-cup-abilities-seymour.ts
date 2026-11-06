/**
 * The eighteen abilities of Seymour in the hidden chapter "The Farplane Cup" (`monster.bin` row 319, script `m319`): Attack, Demi, Curaga, Dispel (and Dispel on himself), Critical Attack, Drain Attack, Black Sky, Absorb,
 * Meteor, Shell, Protect, Break, Magic Up, Strength Up, Confuse, Slowga and Ultima. **FFX-2 only** [AGENTS.md rule 14]. The comment on each is its row (`research/re-ffx2-farplane-cup.md` §7; the numbers are pinned
 * against `tests/fixtures/parity/ffx2/farplane_cup_rows.json` by `tests/unit/chapters/farplane-cup-data.test.ts`); the notes on `./farplane-cup-abilities.ts` (the hit rule, the picks) apply here too.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { base, CUP_ABILITY, DISPEL_STRIPS } from './farplane-cup-abilities-base.ts';

export const seymourAbilities: AbilityDef[] = [
  // ---- Seymour --------------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: CUP_ABILITY.seymourAttack,
    name: 'Attack',
    power: 16, // row 0x4000: formula 0, power 16, crit 5, shatter 10, accuracy formula 2
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'Seymour attacks {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.demi,
    name: 'Demi',
    mpCost: 10, // [row 0x3082]
    power: 4, // formula 4: 25 percent of each girl's CURRENT HP, Gravity element, the whole party
    formula: 'percent-current',
    damageType: 'magical',
    element: ['gravity'],
    targeting: 'all-enemies',
    messageTemplate: 'Seymour casts Demi',
  },
  {
    ...base,
    id: CUP_ABILITY.curaga,
    name: 'Curaga',
    mpCost: 20, // [row 0x30b5]; magical, heals, reflectable
    power: 38, // formula 6, power 38
    formula: 'healing',
    damageType: 'magical',
    element: ['none'],
    targeting: 'self',
    flags: ['heals', 'reflectable'],
    messageTemplate: 'Seymour casts Curaga',
  },
  {
    ...base,
    id: CUP_ABILITY.dispel,
    name: 'Dispel',
    mpCost: 12, // [row 0x30b8]
    power: 0, // the party GROUP (pick DU10): Shell, Protect, Reflect, Regen, Haste and the "always" statuses off every girl at chance 254
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    removesStatuses: [...DISPEL_STRIPS],
    flags: ['removes-statuses'],
    messageTemplate: 'Seymour casts Dispel',
  },
  {
    ...base,
    id: CUP_ABILITY.dispelSelf,
    name: 'Dispel',
    mpCost: 12, // the same row 0x30b8 aimed at himself: the script's Reflect branches (he is never Reflected by his own record, so it is dead code kept for the script's sake)
    power: 0,
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'self',
    removesStatuses: [...DISPEL_STRIPS],
    flags: ['removes-statuses'],
    messageTemplate: 'Seymour casts Dispel on himself',
  },
  {
    ...base,
    id: CUP_ABILITY.criticalAttack,
    name: 'Critical Attack',
    power: 16, // row 0x4015: formula 0, power 16, crit byte 255 (always a critical), shatter 100; always hits
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: 'Seymour strikes {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.drainAttack,
    name: 'Drain Attack',
    power: 12, // row 0x4010: formula 0, power 12, accuracy formula 2, the user absorbs the damage
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    flags: ['drains'],
    messageTemplate: 'Seymour drains {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.blackSky,
    name: 'Black Sky',
    mpCost: 80, // [row 0x3088] (RE §7)
    power: 6, // formula 0 (STR-built, magical for Shell), TEN hits of power 6 spread over random girls, shatter 100; always hits
    hits: 10,
    formula: 'strength',
    damageType: 'magical',
    element: ['none'],
    targeting: 'random-enemy',
    messageTemplate: 'Seymour casts Black Sky',
  },
  {
    ...base,
    id: CUP_ABILITY.absorb,
    name: 'Absorb',
    power: 3, // row 0x4040: HP and MP together (class 3), formula 4, power 3, taken by the user; always hits
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['drains'],
    messageTemplate: 'Seymour uses Absorb on {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.meteor,
    name: 'Meteor',
    mpCost: 99, // [row 0x4221] (RE §7)
    power: 8, // formula 9 (a Magic cubic), TWELVE hits of power 8 spread over random girls; not reflectable
    hits: 12,
    formula: 'special-magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'random-enemy',
    messageTemplate: 'Seymour casts Meteor',
  },
  {
    ...base,
    id: CUP_ABILITY.shell,
    name: 'Shell',
    mpCost: 10, // [row 0x30bb]
    power: 0, // himself: Shell 254 for a counter of 110; reflectable
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'self',
    flags: ['reflectable'],
    statusEffects: [{ status: 'shell', chance: 254, duration: 0 }],
    messageTemplate: 'Seymour casts Shell',
  },
  {
    ...base,
    id: CUP_ABILITY.protect,
    name: 'Protect',
    mpCost: 12, // [row 0x30bc]
    power: 0, // himself: Protect 254 for a counter of 110; reflectable
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'self',
    flags: ['reflectable'],
    statusEffects: [{ status: 'protect', chance: 254, duration: 0 }],
    messageTemplate: 'Seymour casts Protect',
  },
  {
    ...base,
    id: CUP_ABILITY.break,
    name: 'Break',
    mpCost: 20, // [row 0x3084] (RE §7)
    power: 0, // status only: Petrify at 80 on ONE girl (pick DU10: the row is single-target); accuracy formula 0
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['reflectable'],
    statusEffects: [{ status: 'petrify', chance: 80, duration: 0 }],
    messageTemplate: 'Seymour casts Break on {target}',
  },
  {
    ...base,
    id: CUP_ABILITY.magicUp,
    name: 'Magic Up',
    power: 0, // his own Magic stage +2, chance 255 [row 0x41dd]
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    statusEffects: [{ status: 'mag-up', chance: 255, duration: 255, stacks: 2 }],
    messageTemplate: 'Seymour casts Magic Up',
  },
  {
    ...base,
    id: CUP_ABILITY.strengthUp,
    name: 'Strength Up',
    power: 0, // his own Strength stage +2, chance 255 [row 0x41db]
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    statusEffects: [{ status: 'str-up', chance: 255, duration: 255, stacks: 2 }],
    messageTemplate: 'Seymour casts Strength Up',
  },
  {
    ...base,
    id: CUP_ABILITY.confuse,
    name: 'Confuse',
    mpCost: 12, // [row 0x3083]
    power: 0, // status only: Confusion at 100 on the party GROUP (pick DU10); accuracy formula 0; reflectable
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    flags: ['reflectable'],
    statusEffects: [{ status: 'confuse', chance: 100, duration: 0 }],
    messageTemplate: 'Seymour casts Confuse',
  },
  {
    ...base,
    id: CUP_ABILITY.slowga,
    name: 'Slowga',
    mpCost: 8, // [row 0x421e] (RE §7)
    power: 16, // the ATB class (class 4), formula 4, power 16; Slow 130, counter 126; the whole party; reflectable
    formula: 'ctb',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    flags: ['reflectable'],
    statusEffects: [{ status: 'slow', chance: 130, duration: 0 }],
    messageTemplate: 'Seymour casts Slowga',
  },
  {
    ...base,
    id: CUP_ABILITY.ultima,
    name: 'Ultima',
    mpCost: 90, // [row 0x41fb] (RE §7)
    power: 42, // formula 2, power 42, the whole party, shatter 100; magical
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    messageTemplate: 'Seymour casts Ultima',
  },
];
