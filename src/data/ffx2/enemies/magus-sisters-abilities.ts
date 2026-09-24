/**
 * The Magus Sisters' actions on the Road to the Farplane (Chapter XI).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source:
 * `research/ffx2-fallen-aeons.md` §4.2: "SinirothX + wiki Cindy / Sandy / Mindy
 * pages + wiki enemy-ability table + GamerGuides + Split_Infinity". DC = damage
 * constant `[SinirothX]`. The FFX Magus Sisters are a different record set.
 *
 * Accuracy, durations and "can it miss" follow `./fallen-aeons-abilities.ts`'s
 * header: no `accuracy` byte (the enemy baseline), physical rolls, the rest
 * never misses (hard rule 5), unpublished durations last until cured or
 * dispelled (`duration: 0`, `[estimate]`). No MP cost is published for Sandy's
 * Razzia, Cindy's Camisade, Absorb, Not-So-Mighty Guard or White Highwind, or
 * Mindy's Passado, so those are 0; the Sisters carry MP 9,999 either way.
 */

import type { AbilityDef, StatusId } from '../../../battle/common/types.ts';

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
};

/** "cures their ailments and stat changes" (White Highwind, §4.2). */
const HIGHWIND_CURES: StatusId[] = [
  'poison', 'silence', 'darkness', 'sleep', 'confuse', 'berserk', 'slow', 'stop', 'curse', 'itchy',
  'str-down', 'mag-down', 'def-down', 'mdef-down', 'accu-down', 'eva-down', 'luck-down',
];

function tierMagic(id: string, name: string, element: 'fire' | 'ice' | 'lightning' | 'water'): AbilityDef {
  return {
    ...base,
    id,
    name,
    mpCost: 24, // §4.2 "one target, element, magic, 24 MP"
    power: 19, // DC 19
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'single-enemy',
    canMiss: false,
    messageTemplate: `Mindy casts ${name}`,
  };
}

export const magusSistersAbilities: AbilityDef[] = [
  // ---- Sandy (mantis) ------------------------------------------------------
  {
    ...base,
    id: 'x2-sandy-attack',
    name: 'Attack',
    category: 'attack',
    power: 16, // DC 16, physical
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['crit-eligible'],
    messageTemplate: 'Sandy attacks {target}',
  },
  {
    ...base,
    id: 'x2-sandy-razzia',
    name: 'Razzia',
    power: 16, // DC 16, "one target, magic"
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: false,
    messageTemplate: 'Sandy uses Razzia',
  },
  // ---- Cindy (ladybug) -----------------------------------------------------
  {
    ...base,
    id: 'x2-cindy-camisade',
    name: 'Camisade',
    power: 16, // DC 16, physical
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['crit-eligible'],
    messageTemplate: 'Cindy uses Camisade',
  },
  {
    ...base,
    id: 'x2-cindy-absorb',
    name: 'Absorb',
    // "drains 3/16 of one target's current HP and MP", fractional. HP through
    // `percent-current` + `drains`; the MP half is `extra.mpFractionOfCurrent`.
    power: 3,
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['drains'],
    canMiss: false,
    extra: { mpFractionOfCurrent: 3 },
    messageTemplate: 'Cindy uses Absorb',
  },
  {
    ...base,
    id: 'x2-cindy-demi',
    name: 'Demi',
    mpCost: 10, // "Gravity, 10 MP"
    power: 4, // "whole party loses 1/4 of current HP"
    formula: 'percent-current',
    damageType: 'other',
    element: ['gravity'],
    targeting: 'all-enemies',
    canMiss: false,
    messageTemplate: 'Cindy casts Demi',
  },
  {
    ...base,
    id: 'x2-cindy-regen',
    name: 'Regen',
    mpCost: 40, // "Regen on one sister, 40 MP"
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-ally',
    statusEffects: [{ status: 'regen', chance: 254, duration: 0 }],
    canMiss: false,
    messageTemplate: 'Cindy casts Regen',
  },
  {
    ...base,
    id: 'x2-cindy-not-so-mighty-guard',
    name: 'Not-So-Mighty Guard',
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies', // "Protect, Shell and Regen on all three sisters"
    statusEffects: [
      { status: 'protect', chance: 254, duration: 0 },
      { status: 'shell', chance: 254, duration: 0 },
      { status: 'regen', chance: 254, duration: 0 },
    ],
    canMiss: false,
    messageTemplate: 'Cindy uses Not-So-Mighty Guard',
  },
  {
    ...base,
    id: 'x2-cindy-white-highwind',
    name: 'White Highwind',
    power: 6, // "heals all sisters by 3/8 of max HP" = 6/16
    formula: 'percent-total',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    removesStatuses: HIGHWIND_CURES,
    flags: ['heals', 'removes-statuses'],
    canMiss: false,
    messageTemplate: 'Cindy uses White Highwind',
  },
  // ---- Mindy (bee) ---------------------------------------------------------
  {
    ...base,
    id: 'x2-mindy-passado',
    name: 'Passado',
    // F-6 [conflict]: SinirothX "1/16 of remaining HP, 15 times"; the wiki "reduces HP
    // by 15/16"; Split_Infinity and GamerGuides "81.5% of current HP". All agree it
    // cannot kill. Plan FA9: SinirothX's 15 x 1/16 of current HP, tagged.
    // Measured (2026-09-24, not tuned): each of the 15 hits also builds the FFX-2 chain
    // bonus, so on the Chapter V preset it takes 80.8 to 82.7 % of current HP (median
    // 81.8 %), not the 37.9 % that 15 plain 1/16 hits would leave. That lands on
    // Split_Infinity's and GamerGuides' observed 81.5 %; F-6 stays open (research §9).
    power: 1,
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 15,
    canMiss: false,
    messageTemplate: 'Mindy uses Passado',
  },
  tierMagic('x2-mindy-firaga', 'Firaga', 'fire'),
  tierMagic('x2-mindy-blizzaga', 'Blizzaga', 'ice'),
  tierMagic('x2-mindy-thundaga', 'Thundaga', 'lightning'),
  tierMagic('x2-mindy-waterga', 'Waterga', 'water'),
  // ---- all three -----------------------------------------------------------
  {
    ...base,
    id: 'x2-magus-delta-attack',
    name: 'Delta Attack',
    // "whole party to 1 HP and 0 MP": HP [verified: 4 sources]; SinirothX prints
    // "remaining HP - 1" and mentions only HP, so the MP half is the wiki's alone
    // (F-9, `[single source]`, plan FA9). A constant, not a percentage
    // (`aeon-effects.ts`), so it cannot kill.
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false,
    extra: { setHpTo: 1, setMpTo: 0 },
    messageTemplate: 'The Magus Sisters unleash Delta Attack',
  },
];
