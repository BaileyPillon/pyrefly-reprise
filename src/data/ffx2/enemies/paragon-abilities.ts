/**
 * Paragon's actions on Cloister 100 of the Via Infinito (Chapter XIII, link 1).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: `research/ffx2-trema.md` §4.1;
 * the tags are that file's, carried verbatim (rule 6). DC = damage constant `[SinirothX]`.
 * Paragon shares a *model* with FFX's Nemesis and no data (research §0), so every id here is
 * `paragon-`-prefixed and nothing is shared with the FFX tables.
 *
 * **Accuracy.** Paragon's record has Accuracy 0 (SinirothX; the wiki's "Accuracy 13" is its
 * mislabelled Luck, research §3.2), so the physical rows carry no `accuracy` byte and the
 * engine's enemy baseline applies (`constants.ts` ENEMY_BASE_ACCURACY): the Leblanc and
 * Chapter XI precedent. Magic never misses (hard rule 5: `canMiss: false`).
 *
 * **MP.** No source gives Genesis or Big Bang an MP cost. The wiki says draining Paragon's
 * MP in International / HD blocks both (plan Review, `[single source]`); the AI reads that
 * as "blocked at 0 MP" (`src/battle/ffx2/ai/paragon.ts`), so `mpCost` stays 0 here.
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

/** A Normal Attack: DC 16, physical, one target [SinirothX]. */
const normalAttack = {
  ...base,
  category: 'attack' as const,
  power: 16,
  formula: 'strength' as const,
  damageType: 'physical' as const,
  element: ['none' as const],
  targeting: 'single-enemy' as const,
  flags: ['crit-eligible' as const],
};

/**
 * Genesis's strip list: "Auto-Life, Shell, Protect, Reflect, Regen, Haste, every stat change
 * and Spellspring" [ffx2-trema §4.1, `[SinirothX]`]. "Every stat change" is read as every Up
 * **and** every Down level (the source does not split them).
 */
export const GENESIS_STRIPS: readonly StatusId[] = [
  'auto-life', 'shell', 'protect', 'reflect', 'regen', 'haste', 'spellspring',
  'str-up', 'mag-up', 'def-up', 'mdef-up', 'accu-up', 'eva-up', 'luck-up',
  'str-down', 'mag-down', 'def-down', 'mdef-down', 'accu-down', 'eva-down', 'luck-down',
];

/** Paragon, §4.1. AI `[SinirothX]`, the wiki's and Split_Infinity's prose agreeing. */
export const paragonAbilities: AbilityDef[] = [
  {
    ...normalAttack,
    id: 'paragon-attack-poison',
    name: 'Attack', // Normal Attack 1: Poison, chance 100 [SinirothX]
    statusEffects: [{ status: 'poison', chance: 100, duration: 0 }],
    messageTemplate: 'Paragon attacks {target}',
  },
  {
    ...normalAttack,
    id: 'paragon-attack-itchy',
    name: 'Attack', // Normal Attack 2: Itchy, always [SinirothX]
    statusEffects: [{ status: 'itchy', chance: 255, duration: 0 }],
    messageTemplate: 'Paragon attacks {target}',
  },
  {
    ...normalAttack,
    id: 'paragon-attack-confuse',
    name: 'Attack', // Normal Attack 3: Poison always, Confuse chance 120 [SinirothX]
    // Confuse has no published duration: 0 = until cured or struck, the Chapter XI precedent. `[estimate]`
    statusEffects: [
      { status: 'poison', chance: 255, duration: 0 },
      { status: 'confuse', chance: 120, duration: 0 },
    ],
    messageTemplate: 'Paragon attacks {target}',
  },
  {
    ...normalAttack,
    id: 'paragon-attack-pierce',
    name: 'Attack', // Normal Attack 4: ignores Defense [SinirothX]; wiki observed 8,273 to 9,342
    ignoresDefense: true,
    messageTemplate: 'Paragon attacks {target}',
  },
  {
    ...normalAttack,
    id: 'paragon-attack-drain',
    name: 'Attack', // Normal Attack 5: drains HP [SinirothX]
    flags: ['crit-eligible', 'drains'],
    messageTemplate: 'Paragon attacks {target}',
  },
  {
    ...base,
    id: 'paragon-genesis',
    name: 'Genesis',
    power: 44, // DC 44, magic [SinirothX]
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    // "Everyone in a 150° arc in front of it" (SinirothX; wiki 180°). The FFX-2 engine has no
    // positions, so the whole party: `[estimate]` (plan §4.2 "Not modelled").
    targeting: 'all-enemies',
    removesStatuses: [...GENESIS_STRIPS],
    flags: ['removes-statuses'],
    canMiss: false,
    messageTemplate: 'Paragon uses Genesis',
  },
  {
    ...base,
    id: 'paragon-big-bang',
    name: 'Big Bang',
    power: 250, // DC 250, magic, whole party [SinirothX]
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    // "About 25,000 even at maximum MDEF" (Split_Infinity) and "up to 99,999" (wiki): both
    // past the 9,999 cap, so it breaks the damage limit. `[derived]` from two sources' figures;
    // the plan Review re-derived 23,803 to 26,877 at MDEF 255 with MAG 244.
    flags: ['always-break-damage-limit'],
    canMiss: false,
    messageTemplate: 'Paragon answers with Big Bang',
  },
];
