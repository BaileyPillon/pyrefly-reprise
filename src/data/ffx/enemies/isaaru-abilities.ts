/**
 * Boss-only `AbilityDef`s for **Isaaru's three aeons** in the Via Purifico
 * beneath Bevelle — Chapter XIV: **Grothia** (`m284`, his Ifrit), **Pterya**
 * (`m254`, his Valefor) and **Spathi** (`m287`, his Bahamut).
 *
 * Every row is read off `research/ffx-isaaru-bevelle.md` §3, the decompiled
 * action rows (Grayfox96 FFX-RNG-tracker, pinned commit 0acf1ac3), cross-checked
 * against the FF Wiki enemy-ability table (revid 4008011; the plan's review R7
 * re-fetched it and found "70 Sp", "44 Sp", "26 Mag", "8 Phy", "24 Mag")
 * `[verified: 2 sources]` unless a row says otherwise. Isaaru himself has **no
 * actions** (`monster_actions.json` `m248` is empty, §2.1).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. In FFX-2 Isaaru is a tour guide
 * and nobody summons (research §0.3); nothing here is imported by
 * `src/battle/ffx2/**` or `src/data/ffx2/**`.
 *
 * ## Own records, never the player aeons' rows
 *
 * Yuna's aeons ship `hellfire`, `energy-ray`, `sonic-wings` and `mega-flare`
 * with the **player** aeons' constants (Energy Ray DC 55, Sonic Wings rank 2).
 * Isaaru's aeons use the **enemy** rows, which differ, so every id here is
 * prefixed with the enemy's name (plan I-G6: the enemy ids never reuse a
 * roster id either).
 *
 * ## Shared records, and the rows NOT shipped (§3.0)
 *
 * The three records are shared with **Belgemine's** aeons, so a row being in a
 * record does not mean Isaaru's aeon uses it. Not shipped: Grothia's Meteor
 * Strike (4:137; the wiki: he "casts Fira instead"), Belgemine's first-turn
 * attack (4:98) and the Anima-only Hellfire (4:230); Pterya's Energy Blast
 * (4:166; GameFAQs "but no Energy Blast") and Belgemine's attack (4:127 on
 * `m254`); **Spathi's two counter rows** (4:127 Attack, 4:173 Impulse): no
 * source describes Spathi countering (research I-4, plan B9: not built).
 *
 * ## What the research leaves open, and what each row does about it
 *
 * - **MP cost** is never read for an enemy (`abilities.ts#mpCostFor`); every
 *   row says `mpCost: 0`. Fira's decompiled MP 8 is recorded in its comment.
 * - **Accuracy.** Magic and every Overdrive always hit [AGENTS.md hard rule
 *   5]: `canMiss: false` on every Magic-formula row. The physical rows carry
 *   their decompiled accuracy byte (90, 120, 60) and roll; Sonic Wings is
 *   "always hits" in the decompile, so it is `canMiss: false` too.
 * - **Type Other** (Hellfire, Mega Flare): the Magic formula applies Magic
 *   Defense, and Shell, which only halves `'magical'`, does not
 *   (`formulas.ts`); Shield quarters any type. Energy Ray is `'magical'`, so
 *   Shell halves it [§3.2, verified: 3 sources].
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

/** Ids, mirrored by `src/battle/ffx/ai/isaaru-rules.ts` (the tests pin them equal). */
export const GROTHIA_ATTACK = 'grothia-attack';
export const GROTHIA_ATTACK_YUNA = 'grothia-attack-yuna';
export const GROTHIA_FIRA = 'grothia-fira';
export const GROTHIA_HELLFIRE = 'grothia-hellfire';
export const PTERYA_ATTACK = 'pterya-attack';
export const PTERYA_ATTACK_YUNA = 'pterya-attack-yuna';
export const PTERYA_SONIC_WINGS = 'pterya-sonic-wings';
export const PTERYA_ENERGY_RAY = 'pterya-energy-ray';
export const SPATHI_COUNTDOWN = 'spathi-countdown';
export const SPATHI_MEGA_FLARE = 'spathi-mega-flare';

/**
 * Row **4:0**, "Attack Aeon": his attack on an aeon. Strength **DC 16**,
 * physical, rank 3, accuracy **90**, can crit, shatter 10 [§3.1 / §3.2
 * decompiled; the wiki and GameFAQs: a "basic physical", verified: 2 sources].
 * Grothia's and Pterya's rows are the same bytes.
 */
function attackAeon(id: string): AbilityDef {
  return {
    id,
    name: 'Attack',
    game: 'ffx',
    category: 'enemy',
    mpCost: 0,
    rank: 3, // §3.1 [decompiled]
    power: 16, // §3.1 [decompiled]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'random-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'shatter'],
    shatterChance: 10, // §3.1 [decompiled]
    accuracy: 90, // §3.1 [decompiled]
    messageTemplate: '{user} attacks',
  };
}

export const grothiaAttack = attackAeon(GROTHIA_ATTACK);
export const pteryaAttack = attackAeon(PTERYA_ATTACK);

/**
 * Row **4:127**, Grothia's attack **on Yuna** (only when no aeon is out):
 * Strength DC 16, physical, rank 3, **accuracy 120**, and it fills no gauge
 * [§3.1 decompiled + wiki "an attack with increased accuracy that doesn't
 * increase his Overdrive gauge", verified: 2 sources]. No crit byte printed.
 */
export const grothiaAttackYuna: AbilityDef = {
  id: GROTHIA_ATTACK_YUNA,
  name: 'Attack',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.1 [decompiled]
  power: 16, // §3.1 [decompiled]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  accuracy: 120, // §3.1 [verified: 2 sources]
  messageTemplate: '{user} attacks',
};

/**
 * Row **3:69**, Fira: one random target, Magic **DC 24**, magical, **Fire**,
 * rank 3, reflectable, shatter 10 (decompiled MP 8, unread for an enemy)
 * [§3.1 decompiled + wiki "24", GameFAQs, verified: 3 sources]. Grothia
 * absorbs Fire, but he "will not heal himself" with it [§2.3, single source:
 * wiki]: the row is aimed at the party side only, so he never does.
 */
export const grothiaFira: AbilityDef = {
  id: GROTHIA_FIRA,
  name: 'Fira',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.1 [decompiled]
  power: 24, // §3.1 [verified: 3 sources]
  formula: 'magic',
  damageType: 'magical',
  element: ['fire'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['reflectable', 'shatter'],
  shatterChance: 10, // §3.1 [decompiled]
  canReflect: true,
  canMiss: false,
  messageTemplate: '{user} casts Fira',
};

/**
 * Row **4:94**, **Hellfire** (his Overdrive): the whole party side, Magic
 * **DC 70**, type **Other**, **Fire**, rank 3 [§3.1 decompiled + wiki "70",
 * GameFAQs, Jegged, verified: 3 sources]. Magic Defense applies, Shell does
 * not, **Shield quarters it and NulBlaze cancels it** (a Fire element on a
 * NulBlazed target, `abilities.ts#consumeNulCharges`). §5.2 `[derived]`: it
 * kills every aeon of the shipped set from full HP (1,765 to 1,898 at roll 16).
 */
export const grothiaHellfire: AbilityDef = {
  id: GROTHIA_HELLFIRE,
  name: 'Hellfire',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.1 [decompiled]
  power: 70, // §3.1 [verified: 3 sources]
  formula: 'magic',
  damageType: 'other', // §3.1 "Other" — Shell does not apply
  element: ['fire'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} unleashes Hellfire',
};

/**
 * Row **4:92**, Pterya's attack **on Yuna** (only when no aeon is out):
 * Strength **DC 8**, physical, rank 3, **accuracy 60**, and it fills no gauge
 * [§3.2 decompiled + wiki "reduced power and accuracy that won't fill her
 * Overdrive gauge", verified: 2 sources].
 */
export const pteryaAttackYuna: AbilityDef = {
  id: PTERYA_ATTACK_YUNA,
  name: 'Attack',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.2 [decompiled]
  power: 8, // §3.2 [verified: 2 sources]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  accuracy: 60, // §3.2 [verified: 2 sources]
  messageTemplate: '{user} attacks',
};

/**
 * Row **4:93**, Sonic Wings: one random target, Strength **DC 8**, physical,
 * rank 3, **always hits**, weak Delay [§3.2 decompiled + wiki "8", GameFAQs,
 * verified: 3 sources]. Yuna's aeons are Delay-vulnerable (the Aeon Ribbon
 * leaves Delay out, `setup.ts`), so the Delay lands on them.
 */
export const pteryaSonicWings: AbilityDef = {
  id: PTERYA_SONIC_WINGS,
  name: 'Sonic Wings',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.2 [decompiled]
  power: 8, // §3.2 [verified: 3 sources]
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['weak-delay'],
  canMiss: false, // §3.2 [decompiled] "always hits"
  messageTemplate: '{user} uses Sonic Wings',
};

/**
 * Row **4:61**, **Energy Ray** (her Overdrive): the whole party side, Magic
 * **DC 26**, **Magical** (so Shell halves it, unlike Hellfire and Mega Flare),
 * non-elemental, rank 3 [§3.2 decompiled + wiki "26", GameFAQs, verified: 3
 * sources].
 */
export const pteryaEnergyRay: AbilityDef = {
  id: PTERYA_ENERGY_RAY,
  name: 'Energy Ray',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.2 [decompiled]
  power: 26, // §3.2 [verified: 3 sources]
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} unleashes Energy Ray',
};

/**
 * **Countdown**: Spathi's turn when the count is not yet 0 [§3.3: "Counts down
 * to Mega Flare", the wiki enemy-ability table, noted for Bahamut and Spathi;
 * wiki + GameFAQs + Jegged, verified: 3 sources]. **Not a row in the
 * tracker's list**, so everything but its effect is ours: no damage, aimed at
 * himself, rank 3 (the engine's default action rank, the rank every row in
 * the record carries). The number itself rides on the turn's telegraph
 * (`ai/isaaru.ts`).
 */
export const spathiCountdown: AbilityDef = {
  id: SPATHI_COUNTDOWN,
  name: 'Countdown',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate] — see the doc comment
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} counts down',
};

/**
 * Row **4:95**, **Mega Flare**: the whole party side, Magic **DC 44**, type
 * **Other**, non-elemental, rank 3 [§3.3 decompiled + wiki "44", GameFAQs,
 * Jegged, verified: 3 sources]. §5.3 `[derived]` reproduces GameFAQs' "around
 * 2,200, about 550 with Shield" (2,148 to 2,469 at roll 16; ÷4 = 537 to 617).
 */
export const spathiMegaFlare: AbilityDef = {
  id: SPATHI_MEGA_FLARE,
  name: 'Mega Flare',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.3 [decompiled]
  power: 44, // §3.3 [verified: 3 sources]
  formula: 'magic',
  damageType: 'other', // §3.3 "Other" — Shell does not apply
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} unleashes Mega Flare',
};

/** Every row this file ships, keyed by id, for `src/data/ffx/index.ts`. */
export const ISAARU_ABILITIES: Record<string, AbilityDef> = {
  [grothiaAttack.id]: grothiaAttack,
  [grothiaAttackYuna.id]: grothiaAttackYuna,
  [grothiaFira.id]: grothiaFira,
  [grothiaHellfire.id]: grothiaHellfire,
  [pteryaAttack.id]: pteryaAttack,
  [pteryaAttackYuna.id]: pteryaAttackYuna,
  [pteryaSonicWings.id]: pteryaSonicWings,
  [pteryaEnergyRay.id]: pteryaEnergyRay,
  [spathiCountdown.id]: spathiCountdown,
  [spathiMegaFlare.id]: spathiMegaFlare,
};

export default ISAARU_ABILITIES;
