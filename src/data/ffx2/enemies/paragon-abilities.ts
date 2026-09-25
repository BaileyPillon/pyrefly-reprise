/**
 * Paragon's actions on Cloister 100 of the Via Infinito (Chapter XIII, link 1).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: `research/ffx2-trema.md` §4.1;
 * the tags are that file's, carried verbatim (rule 6). DC = damage constant `[SinirothX]`.
 * Paragon shares a *model* with FFX's Nemesis and no data (research §0), so every id here is
 * `paragon-`-prefixed and nothing is shared with the FFX tables.
 *
 * **Accuracy.** Paragon's record has Accuracy 0 (SinirothX; the wiki's "Accuracy 13" is its
 * mislabelled Luck, research §3.2). **The normal form's physicals always connect**
 * `[verified: 2 sources]`: Split_Infinity (FAQ 26832, G0648: normal Paragon "is able to connect
 * with all of his physical attacks", which is why he fights it Oversouled) and the wiki's
 * *Paragon* (revid 3998078: only the Oversoul form's attacks can be dodged); research §4.1. So the
 * five Normal Attacks carry `canMiss: false` (method check E3, 2026-09-25). Before, they rolled on
 * the engine's enemy baseline (`constants.ts` ENEMY_BASE_ACCURACY, an `[estimate]`) and landed 3 %
 * of the time against the preset's Rabite's Feet. Magic never misses (hard rule 5).
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
  canMiss: false, // normal form: "connect[s] with all of his physical attacks" [verified: 2 sources]
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
    // Confuse: no duration on the row; the group's `timedAilmentDefaults` gives §2.8's global default 133 (70.5 s).
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
    // Unexplained, not tuned (flagged 2026-09-25): this row (DC 16, Str 244, Lv 99) gives 7,814 to
    // about 8,824 non-crit through `resolve.ts`, and the wiki's observed range is that times 1.0587,
    // which is 271/256 to four places (its low end is our top roll x 240/256). A second randomiser
    // step, a Str or DC we lack, or a wiki target state? The research does not say.
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
