/**
 * The shades' actions in the Den of Woe (Chapter XV): Baralai, Gippal, Nooj.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source:
 * `research/ffx2-gippal-den-of-woe.md` §4.1 (Gippal), §4.2 (Baralai), §4.3 (Nooj);
 * the tags are that file's, carried verbatim (rule 6). DC = damage constant
 * `[SinirothX]`. Every id is `x2-den-`-prefixed, so nothing meets the Gun Mage's
 * own Mortar, Drill Shot or Absorb (`abilities/gun-mage.ts`).
 *
 * Bailey's picks (plan `docs/plans/chapter-gippal-review.md`, 2026-09-25, "I'll go
 * with all your recommendations"):
 * - **GP8 a:** Bullseye and Mortar (a 140° arc in front of Gippal) and Glint
 *   (everyone within 5 m of Baralai) hit the **whole party**. Our engine has no
 *   positions; this is harsher than the arc, and the guide will say so.
 * - **GP9:** the data dump's values where the sources conflict (G-2, G-5, G-7).
 * - **GP10 a:** Lightfall, Bullseye, Drill Shot and Greedy Aura are **exact**
 *   (`extra.noVariance`, `ffx2/formulas.ts`); every other row rolls step 7 as the
 *   combat core has it.
 *
 * **Accuracy.** Accuracy 0 on each record is a real FFX-2 value (research §3), so
 * no row carries an `accuracy` byte and the engine's enemy baseline applies (the
 * Leblanc and Chapter XI precedent). Physical strikes roll to hit; magic, the
 * fractional and the constant moves never miss (hard rule 5: `canMiss: false`).
 * `crit-eligible` sits on the single-target and random physical strikes, as on
 * every shipped enemy attack (house precedent, not a source).
 *
 * **Durations and chances the sources do not give** are `[estimate]`s, each on its
 * row: `duration: 0` lasts until cured (the Chapter XI precedent), and a rider
 * with no printed chance is 254 (lands unless immune).
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

/** A DC-n physical strike on one girl (Normal Attack and its kin). */
function strike(id: string, name: string, power: number, message: string): AbilityDef {
  return {
    ...base, id, name, category: 'attack', power, formula: 'strength', damageType: 'physical',
    element: ['none'], targeting: 'single-enemy', flags: ['crit-eligible'], messageTemplate: message,
  };
}

/** Gippal (shade), §4.1. AI `[verified: 2 sources for the cycle]`. */
export const shadeGippalAbilities: AbilityDef[] = [
  strike('x2-den-gippal-attack', 'Kick', 16, 'Gippal kicks {target}'), // DC 16; "a kick" (Split_Infinity)
  {
    ...strike('x2-den-gippal-grinder', 'Grinder', 14, 'Gippal uses Grinder on {target}'), // DC 14 [verified: 3 sources]
    category: 'enemy',
    formula: 'piercing-strength', // "ignores Defense"
  },
  {
    ...base,
    id: 'x2-den-gippal-bullseye',
    name: 'Bullseye',
    // "loses 9/16 of current HP; cannot kill" [verified: 4 sources]. GP8 a: the whole
    // party, not the 140° arc. GP10 a: exact. Fractional: Protect and Shell do nothing.
    power: 9,
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false,
    extra: { noVariance: true, cannotKill: true },
    messageTemplate: 'Gippal fires Bullseye',
  },
  {
    ...base,
    id: 'x2-den-gippal-mortar',
    name: 'Mortar',
    // DC 22, physical, "ignores Defense" [SinirothX + wiki]; GP8 a: the whole party.
    // Protect still halves it (step 16 reads the damage type, not Defense). The Blue
    // Bullet is not taught (GP7 a): the Gun Mage already lists her own Mortar.
    power: 22,
    formula: 'piercing-strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'all-enemies',
    messageTemplate: 'Gippal fires Mortar',
  },
  {
    ...base,
    id: 'x2-den-gippal-potion-plus',
    name: 'Potion Plus',
    // "restores 600 HP to himself", constant [4 sources]: 12 x 50. Not one of GP10 a's
    // four, so step 7 rolls it (562-635) like every other constant in the engine.
    power: 12,
    formula: 'fixed',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    flags: ['heals'],
    canMiss: false,
    messageTemplate: 'Gippal drinks a Potion Plus',
  },
  {
    ...base,
    id: 'x2-den-gippal-flash-bomb',
    name: 'Flash Bomb',
    // "46-52 to all + Darkness (chance 50)", randomized constant [verified: 2 sources]:
    // 1 x 50 under the roll [240, 271] / 256 gives 46-52 [derived].
    power: 1,
    formula: 'fixed',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    statusEffects: [{ status: 'darkness', chance: 50, duration: 0 }], // duration [estimate]
    canMiss: false,
    messageTemplate: 'Gippal throws a Flash Bomb',
  },
  {
    ...base,
    id: 'x2-den-gippal-hush-grenade',
    name: 'Hush Grenade',
    power: 1, // as Flash Bomb, Silence (chance 50) [verified: 2 sources]
    formula: 'fixed',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    statusEffects: [{ status: 'silence', chance: 50, duration: 0 }], // duration [estimate]
    canMiss: false,
    messageTemplate: 'Gippal throws a Hush Grenade',
  },
];

/** Baralai (shade), §4.2. Actions `[SinirothX + wiki]`; AI `[verified: 2 sources]`. */
export const shadeBaralaiAbilities: AbilityDef[] = [
  strike('x2-den-baralai-attack', 'Attack', 16, 'Baralai strikes {target}'), // DC 16
  {
    ...strike('x2-den-baralai-triple-attack', 'Triple Attack', 12, 'Baralai uses Triple Attack'), // DC 12 x3
    category: 'enemy',
    targeting: 'random-enemy', // "3 random hits"
    hits: 3,
  },
  {
    ...base,
    id: 'x2-den-baralai-glint',
    name: 'Glint',
    // DC 20, physical, "everyone within 5 m of him, or one character if none is in
    // range". GP8 a: the whole party (the Vegnagun Bulwark precedent), labelled.
    power: 20,
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'all-enemies',
    messageTemplate: 'Baralai uses Glint',
  },
  {
    ...base,
    id: 'x2-den-baralai-looming-glacier',
    name: 'Looming Glacier',
    // "one character's MP to 0 and Stop". `setMpTo` (`ffx2/aeon-effects.ts`) plus the
    // Stop rider; no chance is printed: 254 [estimate], duration [estimate].
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    statusEffects: [{ status: 'stop', chance: 254, duration: 0 }],
    canMiss: false,
    extra: { setMpTo: 0 },
    messageTemplate: 'Baralai uses Looming Glacier',
  },
  {
    ...base,
    id: 'x2-den-baralai-drill-shot',
    name: 'Drill Shot',
    // "one character loses 3/4 of max HP", on the last attacker at 8 (G-5). 12/16;
    // GP10 a: exact. It can kill.
    power: 12,
    formula: 'percent-total',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: false,
    extra: { noVariance: true },
    messageTemplate: 'Baralai fires Drill Shot at {target}',
  },
  {
    ...base,
    id: 'x2-den-baralai-absorb',
    name: 'Absorb',
    // "3/16 of current HP and MP", drained (the Cindy precedent: `percent-current` +
    // `drains`, the MP half `extra.mpFractionOfCurrent`). Rolled: not one of GP10's four.
    power: 3,
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['drains'],
    canMiss: false,
    extra: { mpFractionOfCurrent: 3 },
    messageTemplate: 'Baralai uses Absorb',
  },
  {
    ...base,
    id: 'x2-den-baralai-not-so-mighty-guard',
    name: 'Not-So-Mighty Guard',
    power: 0, // "Protect, Shell, Regen on himself"
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    statusEffects: [
      { status: 'protect', chance: 254, duration: 0 },
      { status: 'shell', chance: 254, duration: 0 },
      { status: 'regen', chance: 254, duration: 0 },
    ],
    canMiss: false,
    messageTemplate: 'Baralai uses Not-So-Mighty Guard',
  },
  {
    ...base,
    id: 'x2-den-baralai-silence',
    name: 'Silence',
    // "one or all characters, chance 75"; his AI casts it on all. The AI's "MP >= 20"
    // test is sourced; the spell's own MP cost is not printed, so none is charged.
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    statusEffects: [{ status: 'silence', chance: 75, duration: 0 }], // duration [estimate]
    canMiss: false,
    messageTemplate: 'Baralai casts Silence',
  },
  {
    ...base,
    id: 'x2-den-baralai-regen',
    name: 'Regen',
    mpCost: 40, // "Regen (40 MP)"
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    statusEffects: [{ status: 'regen', chance: 254, duration: 0 }],
    canMiss: false,
    messageTemplate: 'Baralai casts Regen',
  },
];

/** Nooj (shade), §4.3. Actions `[SinirothX]`; cycle `[verified: 3 sources]`. */
export const shadeNoojAbilities: AbilityDef[] = [
  strike('x2-den-nooj-attack', 'Attack', 16, 'Nooj fires at {target}'), // Normal Attack 1, DC 16
  {
    ...base,
    id: 'x2-den-nooj-rippling-chroma',
    name: 'Rippling Chroma', // Normal Attack 2; the wiki's name
    power: 20, // DC 20, "magic that ignores Magic Defense"
    formula: 'piercing-magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: false,
    messageTemplate: 'Nooj uses Rippling Chroma on {target}',
  },
  {
    ...base,
    id: 'x2-den-nooj-greedy-aura',
    name: 'Greedy Aura',
    // "every character loses 3/16 of max HP and MP". The MP half is
    // `extra.mpFractionOfMax` (GP-G3). G-7: damage only, it does not heal him (SinirothX).
    // GP10 a: exact.
    power: 3,
    formula: 'percent-total',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false,
    extra: { noVariance: true, mpFractionOfMax: 3 },
    messageTemplate: 'Nooj uses Greedy Aura',
  },
  {
    ...base,
    id: 'x2-den-nooj-lightfall',
    name: 'Lightfall',
    // "5,000 damage to every character, constant, can break the damage limit"
    // [SinirothX]: 100 x 50, exact (GP10 a). Invincible stops it (`formulas.ts` step 20).
    power: 100,
    formula: 'fixed',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    flags: ['always-break-damage-limit'],
    canMiss: false,
    extra: { noVariance: true },
    messageTemplate: 'Nooj unleashes Lightfall',
  },
];

export const denOfWoeAbilities: readonly AbilityDef[] = [
  ...shadeBaralaiAbilities,
  ...shadeGippalAbilities,
  ...shadeNoojAbilities,
];
