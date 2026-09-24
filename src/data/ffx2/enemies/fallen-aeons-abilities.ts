/**
 * Shiva's and Anima's actions on the Road to the Farplane (Chapter XI).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source:
 * `research/ffx2-fallen-aeons.md` §4.1 (Shiva) and §4.3 (Anima); the tags are
 * that file's, carried verbatim (rule 6). DC = damage constant `[SinirothX]`.
 * The FFX Shiva and Anima are different records with different numbers
 * (`src/data/ffx/**`); nothing here is shared with them, and every id is
 * `x2-`-prefixed so the two games never meet in one lookup.
 *
 * **Accuracy.** The aeons' Accuracy is 0 on the record (§3; "a real FFX-2
 * value", `ffx2-bahamut.md` §1.1), so no row carries an `accuracy` byte and the
 * engine's enemy baseline (`constants.ts` ENEMY_BASE_ACCURACY) applies: the
 * Leblanc precedent. Physical attacks roll; magic and the fractional and
 * constant moves never miss (hard rule 5: `canMiss: false`). Whether a
 * fractional move can miss is not in the sources: `[estimate]`.
 *
 * **Durations.** No source publishes a duration for Heavenly Strike's Stop,
 * Pain's ailments or Stare's Poison. `duration: 0` makes them last until cured
 * (Remedy cures Stop, Silence, Darkness, Poison and Itchy in the Chapter V bag),
 * the Leblanc precedent for unpublished durations. `[estimate]`
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

/** Shiva, §4.1. AI `[verified: 2 sources — SinirothX, wiki AI dump, identical]`. */
export const x2ShivaAbilities: AbilityDef[] = [
  {
    ...base,
    id: 'x2-shiva-kick',
    name: 'Kick', // her Normal Attack; SinirothX names it "Kick"
    category: 'attack',
    power: 16, // DC 16 [SinirothX]; about 400 observed (Split_Infinity)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['crit-eligible'],
    messageTemplate: 'Shiva kicks {target}',
  },
  {
    ...base,
    id: 'x2-shiva-blizzaga',
    name: 'Blizzaga',
    mpCost: 24, // [SinirothX + wiki]
    power: 19, // DC 19 [SinirothX + wiki]; about 500 observed (Split_Infinity)
    formula: 'magic',
    damageType: 'magical',
    element: ['ice'],
    targeting: 'single-enemy',
    canMiss: false,
    messageTemplate: 'Shiva casts Blizzaga',
  },
  {
    ...base,
    id: 'x2-shiva-triple-attack',
    name: 'Triple Attack',
    power: 12, // DC 12 x3 [SinirothX + wiki]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'random-enemy', // "3 hits on random targets"
    hits: 3,
    flags: ['crit-eligible'],
    messageTemplate: 'Shiva uses Triple Attack',
  },
  {
    ...base,
    id: 'x2-shiva-heavenly-strike',
    name: 'Heavenly Strike',
    // Halves one target's current HP **and** MP, Stop at chance 30
    // [verified: 4 sources — SinirothX, wiki, GamerGuides, Split_Infinity]; the 30 is
    // SinirothX only (plan Review R1). 8/16 of current HP through the engine's shared
    // fractional path; the MP half is `extra.mpFractionOfCurrent` (aeon-effects.ts).
    power: 8,
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    // Stop at chance 30 through the linear Status 1 formula (combat-core §2.6a), Shiva Lv 41:
    // 41x5 + 30 - 5 x the girl's level. With the Chapter V preset's levels (our
    // [estimate]) it lands on Yuna (Lv 46) about 5 % and never on Rikku (48) or Paine (50).
    // Measured over 2000 seeds, 2026-09-24; not tuned (rule 6). The Stop puzzle rarely shows.
    statusEffects: [{ status: 'stop', chance: 30, duration: 0 }],
    canMiss: false,
    extra: { mpFractionOfCurrent: 8 },
    messageTemplate: 'Shiva uses Heavenly Strike',
  },
  {
    ...base,
    id: 'x2-shiva-diamond-dust',
    name: 'Diamond Dust',
    power: 26, // DC 26 [SinirothX]; about 1,000 to all (Split_Infinity)
    formula: 'magic',
    damageType: 'magical',
    // F-5 [conflict]: SinirothX says Ice; the wiki, GamerGuides and Split_Infinity say
    // non-elemental (Ice Eater does not absorb it). Plan FA9: non-elemental, tagged.
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false,
    messageTemplate: 'Shiva unleashes Diamond Dust',
  },
];

/** Anima, §4.3. AI `[verified: 2 sources — SinirothX, wiki AI dump]`. */
export const x2AnimaAbilities: AbilityDef[] = [
  {
    ...base,
    id: 'x2-anima-stare',
    name: 'Stare', // her Normal Attack
    power: 10, // DC 10 [SinirothX + wiki]
    // "magic that ignores Magic Defense" [SinirothX + wiki]; GamerGuides calls it
    // unblockable. The wiki's prose also calls it "physical" once (plan Review R1).
    formula: 'piercing-magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    // Poison at chance 25, Anima Lv 43: 43x5 + 25 - 5 x level lands on Yuna (46) about 10 %,
    // never on Rikku (48) or Paine (50) with the Chapter V preset. Measured, not tuned.
    statusEffects: [{ status: 'poison', chance: 25, duration: 0 }],
    canMiss: false,
    messageTemplate: 'Anima stares at {target}',
  },
  {
    ...base,
    id: 'x2-anima-pain',
    name: 'Pain',
    power: 16, // DC 16, magic [SinirothX + wiki + GamerGuides, verified: 3 sources]
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    // Silence, Darkness and Itchy at chance 120 each, plus -1 level to Strength, Magic,
    // Defense, Magic Defense, Accuracy and Evasion; the losses stack [verified: 3 sources].
    // The -1 levels carry no published chance: 254 (lands unless immune) is `[estimate]`.
    // Not instant death, unlike FFX's Pain.
    statusEffects: [
      { status: 'silence', chance: 120, duration: 0 },
      { status: 'darkness', chance: 120, duration: 0 },
      { status: 'itchy', chance: 120, duration: 0 },
      { status: 'str-down', chance: 254, duration: 0, stacks: 1 },
      { status: 'mag-down', chance: 254, duration: 0, stacks: 1 },
      { status: 'def-down', chance: 254, duration: 0, stacks: 1 },
      { status: 'mdef-down', chance: 254, duration: 0, stacks: 1 },
      { status: 'accu-down', chance: 254, duration: 0, stacks: 1 },
      { status: 'eva-down', chance: 254, duration: 0, stacks: 1 },
    ],
    canMiss: false,
    messageTemplate: 'Anima uses Pain',
  },
  {
    ...base,
    id: 'x2-anima-oblivion',
    name: 'Oblivion',
    power: 5, // DC 5 x16 [SinirothX]; about 600 to all observed (Split_Infinity)
    formula: 'strength',
    // F-7 [conflict]: SinirothX says physical; Split_Infinity and GamerGuides treat it as
    // magical (Shell advice). Plan FA9: physical (SinirothX), tagged, so Protect reduces it.
    damageType: 'physical',
    // Hard rule 5: every Overdrive always hits, and Oblivion is Anima's action-counter
    // Overdrive (§4, "fires the aeon's Overdrive at 100"). Physical decides the damage
    // and defence only; no source says a blow can miss. Diamond Dust and Delta Attack
    // are `canMiss: false` for the same reason.
    canMiss: false,
    element: ['none'], // the wiki: non-elemental
    targeting: 'random-enemy', // 16 hits on random party members
    hits: 16,
    messageTemplate: 'Anima unleashes Oblivion',
  },
];
