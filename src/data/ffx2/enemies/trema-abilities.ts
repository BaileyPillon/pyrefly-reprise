/**
 * Trema's actions on Cloister 100 of the Via Infinito (Chapter XIII, link 2).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: `research/ffx2-trema.md` §4.2; the
 * tags are that file's, carried verbatim (rule 6). DC = damage constant `[SinirothX]`. Trema
 * shares a *model* with FFX's unsent priest at the Zanarkand Dome and no data (research §0).
 *
 * Version: **International / HD** (plan TR2 = a). Two of Bailey's calls live here:
 * - **TR3 = a**: Meteor is **magical** (Shell halves it, Sentinel does not work), the wiki's
 *   reading, `[single source]` + `[conflict]` T-3 (GamerGuides' HD guide says physical).
 * - **TR4 = b**: his spells still need the MP although Spellspring makes them free
 *   (GamerGuides HD, `[single source]` + `[conflict]` T-5). The `mpCost` below is what the AI
 *   checks (`src/battle/ffx2/ai/trema.ts`); Spellspring keeps the resolver from spending it.
 *
 * **Hit rolls.** "The three-part chain hits whatever the target's Evasion and Luck; a high
 * Luck lets you dodge Mist, Mire and Moon" (Split_Infinity; the wiki says "many of which
 * always hit") `[verified: 2 sources]`. So Dying Star, Falling Leaf and Thundering Wave are
 * `canMiss: false`, and Choking Mist, Beguiling Mire and Waning Moon roll the §2.6 hit check
 * against the engine's enemy Accuracy baseline (his record's Accuracy is 0, SinirothX).
 * Magic never misses (hard rule 5). Whether Meteor can miss is not said: it is a spell here
 * (TR3 = a), so it cannot.
 *
 * **A sourced exception to hard rule 5's "only physical attacks roll": Waning Moon** is
 * fractional (`damageType: 'other'`), not physical, and still rolls, because both sources say
 * Luck dodges it (Split_Infinity + the wiki, `[verified: 2 sources]`; Rabite's Foot is the
 * sources' answer to it, research §5 `[verified: 3 sources]`). Rule 6 (the sources) wins over
 * the house default here; flagged to Bailey. The Dark Knight's Darkness (`canMiss: true`, TR9) is
 * the same kind of precedent.
 *
 * **Durations.** No source publishes a duration for Beguiling Mire's Stop or Choking Mist's
 * Poison: `duration: 0`, until cured, the Leblanc and Chapter XI precedent. `[estimate]`
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
};

/** Three physical hits on one girl [SinirothX + wiki + Split_Infinity]. */
const threeHits = {
  ...base,
  category: 'attack' as const,
  formula: 'strength' as const,
  damageType: 'physical' as const,
  element: ['none' as const],
  targeting: 'single-enemy' as const,
  hits: 3,
  flags: ['crit-eligible' as const],
};

/** Trema, §4.2. AI `[SinirothX]`; the HP triggers agree with the wiki. */
export const tremaAbilities: AbilityDef[] = [
  {
    ...threeHits,
    id: 'trema-dying-star',
    name: 'Dying Star',
    power: 3, // DC 3 x3 [SinirothX]
    // "Can break the damage limit" [SinirothX + wiki + Split_Infinity].
    flags: ['crit-eligible', 'always-break-damage-limit'],
    canMiss: false, // the chain hits whatever the target's Evasion and Luck (see the header)
    messageTemplate: 'Trema uses Dying Star',
  },
  {
    ...threeHits,
    id: 'trema-falling-leaf',
    name: 'Falling Leaf',
    power: 1, // DC 1 x3; always follows Dying Star [SinirothX]
    canMiss: false,
    messageTemplate: 'Trema uses Falling Leaf',
  },
  {
    ...threeHits,
    id: 'trema-thundering-wave',
    name: 'Thundering Wave',
    power: 4, // DC 4 x3; always follows Falling Leaf [SinirothX]
    canMiss: false,
    messageTemplate: 'Trema uses Thundering Wave',
  },
  {
    ...threeHits,
    id: 'trema-choking-mist',
    name: 'Choking Mist',
    power: 4, // DC 4 x3, Poison always [SinirothX]
    statusEffects: [{ status: 'poison', chance: 255, duration: 0 }],
    messageTemplate: 'Trema uses Choking Mist',
  },
  {
    ...threeHits,
    id: 'trema-beguiling-mire',
    name: 'Beguiling Mire',
    power: 4, // DC 4 x3 (the Fiend Arena block's 5 x3 is not this fight), Stop chance 120 [SinirothX]
    // No duration value is published: the group's `timedAilmentDefaults` gives Stop §2.8's 100 (53 s) `[estimate]`.
    statusEffects: [{ status: 'stop', chance: 120, duration: 0 }],
    messageTemplate: 'Trema uses Beguiling Mire',
  },
  {
    ...base,
    id: 'trema-waning-moon',
    name: 'Waning Moon',
    // 3 hits, each takes 5/16 of the target's **current** MP and no HP [SinirothX; wiki
    // "remaining MP", plan Review]. `mpOnly` + `mpFractionOfCurrent` (resolve.ts, plan TR-G4).
    // The zero power keeps the HP carrier at 0; the hit still rolls: the sourced rule-5 exception (header).
    power: 0,
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 3,
    canMiss: true,
    extra: { mpOnly: true, mpFractionOfCurrent: 5 },
    messageTemplate: 'Trema uses Waning Moon',
  },
  {
    ...base,
    id: 'trema-demi',
    name: 'Demi',
    mpCost: 10, // [SinirothX + wiki]
    power: 4, // 1/4 of current HP, Gravity, whole party [SinirothX + wiki]
    formula: 'percent-current',
    damageType: 'magical',
    element: ['gravity'],
    targeting: 'all-enemies',
    canMiss: false,
    messageTemplate: 'Trema casts Demi',
  },
  {
    ...base,
    id: 'trema-flare',
    name: 'Flare',
    mpCost: 54, // [SinirothX + wiki]
    power: 55, // DC 55, magic, one target [SinirothX + wiki]
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: false,
    messageTemplate: 'Trema casts Flare',
  },
  {
    ...base,
    id: 'trema-ultima',
    name: 'Ultima',
    mpCost: 90, // [SinirothX + wiki]
    power: 70, // DC 70, magic, whole party [SinirothX + wiki]
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false,
    messageTemplate: 'Trema casts Ultima',
  },
  {
    ...base,
    id: 'trema-meteor',
    name: 'Meteor',
    // 12 hits on random party members, each 1/8 of the target's max HP, no MP cost
    // [SinirothX + wiki; hits T-2 `[verified: 2 sources]`, 10 per Kolar]. Type: magical (TR3 = a,
    // `[conflict]` T-3). The cap question T-4 is moot: 1/8 of max HP reaches 9,999 only above
    // 79,992 max HP (plan §2, `[derived]`).
    power: 2,
    formula: 'percent-total',
    damageType: 'magical',
    element: ['none'],
    targeting: 'random-enemy',
    hits: 12,
    canMiss: false,
    messageTemplate: 'Trema calls down Meteor',
  },
];
