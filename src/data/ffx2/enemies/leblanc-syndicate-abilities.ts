/**
 * The Leblanc Syndicate — Ormi's, Logos' and the two goons' abilities.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Every number comes from
 * FFX-2 bestiary records #220 / #221 / #222 / #227 / #228 and the FFX-2
 * enemy-ability master list; nothing here exists in FFX.
 *
 * Source: `research/ffx2-leblanc-syndicate.md` (abbreviated `§`), built to
 * `docs/plans/chapter-leblanc-review.md`. Leblanc's own set and the three
 * No Love Lost stages are in `leblanc-syndicate-leblanc-abilities.ts`.
 *
 * ### The two engine facts that make this expressible with no schema change
 *
 * - **Constant-type bases use `formula: 'multiple'` with `extra.flat`.**
 *   `fixed` computes `power x 50`, which can express 50/200/300 but not 24 or
 *   106. `multiple` + `flat` expresses every published band, skips Defense and
 *   both damage-constant steps, and still takes step 7's `rand(240..271)/256`
 *   — which is precisely the randomiser §4.1 inverted the published bands
 *   with. All five Constant-type Syndicate moves use it, so one reading covers
 *   all of them.
 * - **"Cannot be reduced by any means" (Huggles) is `damageType: 'other'`.**
 *   Step 3 is skipped by `formula: 'multiple'`, step 16 (Protect/Shell) tests
 *   `physical`/`magical` and step 17 (Defend/Sentinel) tests `physical`, so
 *   `other` gives exactly the published behaviour.
 *
 * ### Accuracy — gap G1, and why no row below carries an `accuracy` byte
 *
 * `accuracy` is **blank on all six Syndicate records** while published at 3
 * (Dr. Goon, in Act I of this very mission) to 98 (Battlesnake) elsewhere, and
 * §2.6's decoded points race turns any near-zero enemy Accuracy into a 0 % hit
 * rate [§5.1, G1]. The project already answers this: `AbilityDef.accuracy` is
 * the action-owned byte and **enemy Accuracy stats are never read**, and an
 * enemy action that carries no byte falls back to
 * `src/battle/ffx2/constants.ts::ENEMY_BASE_ACCURACY`. So every row here
 * deliberately omits `accuracy`, the stat blocks ship `acc: 0`, and
 * §5.1's `SYNDICATE_ACCURACY_TUNING = 110` is **not** introduced — one
 * project-wide constant, one place to fix when G1 closes.
 *
 * The one thing the sources fix independently of any Accuracy value is the
 * **Darkness / 4 term** [§5.1, verified: 2 sources], so every action Darkness
 * Dance is meant to blunt carries `affected-by-darkness` (or is `physical`,
 * which `hitPercent()` treats the same way). That flag is what carries this
 * chapter's sourced teaching moment.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import {
  CHARGE_VALUE_INSTANT,
  CHARGE_VALUE_LONG,
  CHARGE_VALUE_MEDIUM,
  ENEMY_ATTACK_CONSTANT,
} from '../../../battle/ffx2/constants.ts';

// ---------------------------------------------------------------------------
// Authored constants — every one of them labelled, none of them canon
// ---------------------------------------------------------------------------

/**
 * **AUTHORED — no source publishes a number; gap G2.** Owner-approved
 * 2026-09-21.
 *
 * Mach Fan, Hail of Bullets and Russian Roulette are published only as
 * "moderate", and two of the three are party-wide [§4.3, §4.4, §13 G2]. They
 * are authored **by interpolation inside the fight's own published constant
 * band, not by feel**: the Syndicate's published Constant-type bases are
 * 24 / 50 / 106 / 200 / 300 [§4.1], so the two party-wide "moderate" moves take
 * **106** (the band that sits between Flash Bomb's 50 and Concussive Blast's
 * 300) and the single-target one takes **200**.
 *
 * They are not presented as canon, they sit inside the fight's own sourced
 * range, and §4.1's band-inversion method closes them the moment any band is
 * published.
 */
export const HAIL_OF_BULLETS_BASE = 106;
/** AUTHORED, gap G2 — see {@link HAIL_OF_BULLETS_BASE}. */
export const RUSSIAN_ROULETTE_BASE = 200;

/**
 * **AUTHORED. No source states this either way** [§4.2's ruling, gap G10].
 *
 * `HUGGLES_IS_REDUCIBLE = false` *is* canon [verified: 2 sources] and is
 * expressed as `damageType: 'other'`. Whether Huggles is **accuracy-checked**
 * is stated by nobody: the earlier draft's supporting argument (that the chain
 * reconstruction "used the physical randomiser") is void, because step 7's
 * randomiser applies to every damage type.
 *
 * Shipped `true` — the row carries no `canMiss: false` and does carry
 * `affected-by-darkness` — because that keeps Darkness Dance meaningful
 * against the fight's deadliest move. **That is a design case, not a finding.**
 */
export const HUGGLES_IS_ACCURACY_CHECKED = true;

/** Published, and the reason `damageType: 'other'` is the right shape. §4.2 [verified: 2 sources] */
export const HUGGLES_IS_REDUCIBLE = false;

/**
 * Party-wide Constant-type moves ship `canMiss: false`; single-target physicals
 * roll the hit check.
 *
 * **AUTHORED reading, recorded rather than buried.** No source gives a hit
 * column for any of them, and G1 says the enemy hit model is the part we do not
 * understand. §6.1 lists Concussive Blast, Flash Bomb, Hush Grenade and No Love
 * Lost part 2 as flat numbers landing on the whole party with no miss column,
 * and calls the party-wide constants "what actually move the health bars" — so
 * they are modelled as landing. The cost of the reading is that Darkness Dance
 * does not blunt them, which is exactly what §6.1 says about them.
 */
export const PARTY_WIDE_CONSTANTS_ALWAYS_LAND = true;

// ---------------------------------------------------------------------------
// Ormi — bestiary #222 (Act III), #220 / #221 (Acts I / II). §4.2, §5.3
// ---------------------------------------------------------------------------

export const ormiAbilities: AbilityDef[] = [
  {
    // §4.2 — base 123.80 from step 1's `(19+53)x19x53/1024 + 53` at Lv 19 /
    // Str 53. `power: 16` makes step 6's `x C/16` a no-op, which is the
    // project's convention for a plain enemy Attack [ffx2-bahamut §2.3].
    // Goes through the Defense term; Protect halves it; Sentinel floors it to 1.
    id: 'x2-ormi-shield-bash',
    name: 'Shield Bash',
    game: 'ffx2',
    category: 'attack',
    mpCost: 0,
    power: ENEMY_ATTACK_CONSTANT,
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'affected-by-darkness'],
    chargeTicks: CHARGE_VALUE_INSTANT, // §5.2 tier [estimate — G6]
    messageTemplate: 'Ormi uses Shield Bash on {target}',
  },
  {
    // §4.2 — **50 % of current HP**, so it can never kill from full, plus a
    // Delay. `percent-current` takes sixteenths, so 8/16 = 50 %.
    //
    // **The targeting rule is positional and we have no positions.** §4.2: the
    // character *furthest away*. `Ffx2Unit` carries only `slot` (a formation
    // index) and the free-movement battlefield the rule implies does not exist
    // in our presentation. Rather than widen the `Targeting` union in a
    // contract file for one ability, **Ormi's AI script picks the target** —
    // the highest `slot`, our stand-in for the back of the formation —
    // **AUTHORED**, see `src/battle/ffx2/ai/leblanc-syndicate.ts`.
    //
    // The `weak-delay` flag is carried for provenance; gap G4 — the magnitude
    // is unpublished, and **the FFX-2 engine has no reader for the flag today**
    // (only `src/battle/ffx/abilities.ts` reads it). Recorded, not invented.
    //
    // **Verifier finding, fixed here: the hit check versus Darkness.** §4.2's
    // own table types Supercollider **"Fractional + Delay,"** not Physical —
    // so `damageType: 'other'` (skipping the Defense term) is right and this
    // ability is *not* a physical attack. But `formula: 'percent-current'` is
    // not `'none'` and the row carries no `canMiss: false`, so
    // `hitPercent()` already rolls a hit check for it [`formulas.ts`]. §5.1
    // is explicit that the source's one settled fact — Darkness quartering
    // Accuracy — is meant to cover **the whole trio's hit-checked actions**,
    // not only their normal attacks ("Darkness Dance... covers all three at
    // once," §5.1's Ormi/Logos/Leblanc hit-rate table treats every listed
    // action the same way). Without `affected-by-darkness`,
    // `hitPercent()`'s `damageType === 'physical'` branch never matches
    // `'other'`, so Ormi's Supercollider silently ignored the party's
    // Darkness Dance — the chapter's own canonical opener does nothing
    // against Ormi's positional hit. `affected-by-darkness` closes that
    // without turning it into a physical (no Defense term is added; only the
    // hit check reads the flag). Proven on the real engine:
    // `tests/unit/chapters/leblanc-engine.test.ts`'s "Supercollider rolls a
    // hit check and Darkness quarters it" case.
    id: 'x2-ormi-supercollider',
    name: 'Supercollider',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 8,
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['weak-delay', 'affected-by-darkness'],
    chargeTicks: CHARGE_VALUE_INSTANT, // §5.2 [estimate — G6]
    messageTemplate: 'Ormi uses Supercollider on {target}',
  },
  {
    // §4.2, §4.1 — three hits of base 300 on **one** target, self-chaining to
    // the published total 1,110~1,254. That total is the one exact
    // reconstruction in the research: `300 x (1 + 1.45 + 1.50) = 1,185`, then
    // step 7 gives `floor(1185 x 240/256) = 1110` and
    // `floor(1185 x 271/256) = 1254`. Exact.
    //
    // Unreducible: `damageType: 'other'` skips Protect (step 16) and Sentinel
    // (step 17), which is what "cannot be reduced by any means" means.
    // **Only fires when Ormi is the last enemy standing** — see §5.3's script.
    id: 'x2-ormi-huggles',
    name: 'Huggles',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 3,
    statusEffects: [],
    removesStatuses: [],
    flags: ['weak-delay', 'affected-by-darkness'], // darkness: AUTHORED, G10
    chargeTicks: CHARGE_VALUE_LONG, // §5.2 [estimate — G6]
    extra: { flat: 300 },
    messageTemplate: 'Ormi hugs {target}',
  },
  {
    // §4.2 — base 300 to the whole party, 281~317 each. Fires on the
    // `HP < 25 %` branch, so expect it as Ormi dies; §5.4 says to budget a heal.
    //
    // **G7 resolved: Blast, not Shock.** The wiki infobox for #222 names
    // *Concussive Shock* (base 200, his Djose/Gagazet version); the AI script
    // and the enemy-ability master list both name *Concussive Blast*. The
    // research's ruling is Blast.
    id: 'x2-ormi-concussive-blast',
    name: 'Concussive Blast',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false, // see PARTY_WIDE_CONSTANTS_ALWAYS_LAND
    chargeTicks: CHARGE_VALUE_LONG, // §5.2 [estimate — G6]
    extra: { flat: 300 },
    messageTemplate: 'Ormi uses Concussive Blast',
  },
];

// ---------------------------------------------------------------------------
// Logos — bestiary #228 (Act III), #227 (Act II). §4.3, §5.3
// ---------------------------------------------------------------------------

export const logosAbilities: AbilityDef[] = [
  {
    // §4.3 — **2 hits, Chain x1**, base 30.25 per hit from
    // `(21+17)x21x17/1024 + 17` at Lv 21 / Str 17. Trivial damage: Logos is a
    // *status* threat, not a damage threat. `long-range` because he shoots.
    id: 'x2-logos-double-shot',
    name: 'Double Shot',
    game: 'ffx2',
    category: 'attack',
    mpCost: 0,
    power: ENEMY_ATTACK_CONSTANT,
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 2,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'affected-by-darkness', 'long-range'],
    chargeTicks: CHARGE_VALUE_INSTANT, // §5.2 [estimate — G6]
    messageTemplate: 'Logos uses Double Shot on {target}',
  },
  {
    // §4.3 — moderate non-elemental damage to one character **plus exactly one
    // of six statuses**: Death, Eject, Petrification, Silence, Curse, Poison.
    // Three of the six remove a character; **Eject has no cure at all**, and a
    // character in a special dressphere cannot be ejected [§7.2].
    //
    // `extra.statusRollOneOf` is the documented one-off key that makes the
    // engine draw **exactly one** of the applications instead of rolling each
    // independently (`docs/CONTRACTS.md`: "Genuinely one-off scripted rules …
    // go in `AbilityDef.extra`, with the keys documented in the data file that
    // sets them"). Read by `src/battle/ffx2/resolve.ts::applyRiders`.
    //
    // Each application carries `chance: 254`, which `applyRiders` reads as a
    // guaranteed application. **Verifier finding, corrected label:** the
    // previous comment here called this "canon" — §4.3 states the six
    // outcomes [verified: 2 sources] but says nothing about whether the
    // roulette can ever land *none* of them, so "always lands something" is
    // this project's AUTHORED reading of "plus one of: ...", not a sourced
    // fact. The number (`chance: 254`, i.e. guaranteed) is unchanged; only
    // the label is corrected, the same way G10 relabelled
    // `HUGGLES_IS_ACCURACY_CHECKED` above.
    //
    // **No petrify-shatter permanence in this chapter** (owner, 2026-09-21):
    // `'shattering'` has no reader anywhere under `src/battle/ffx2/` and this
    // track deliberately does not add one. Soft is in the party's bag [§7.6].
    id: 'x2-logos-russian-roulette',
    name: 'Russian Roulette',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [
      { status: 'ko', chance: 254, duration: 0 },
      { status: 'eject', chance: 254, duration: 0 },
      { status: 'petrify', chance: 254, duration: 0 },
      { status: 'silence', chance: 254, duration: 0 },
      { status: 'curse', chance: 254, duration: 0 },
      { status: 'poison', chance: 254, duration: 0 },
    ],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    chargeTicks: CHARGE_VALUE_MEDIUM, // §5.2 [estimate — G6]
    extra: { flat: RUSSIAN_ROULETTE_BASE, statusRollOneOf: true },
    messageTemplate: 'Logos spins the cylinder at {target}',
  },
  {
    // §4.3 — moderate non-elemental damage to the whole party. Magnitude is
    // AUTHORED, gap G2 — see {@link HAIL_OF_BULLETS_BASE}.
    id: 'x2-logos-hail-of-bullets',
    name: 'Hail of Bullets',
    game: 'ffx2',
    category: 'enemy',
    mpCost: 0,
    power: 0,
    formula: 'multiple',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false, // see PARTY_WIDE_CONSTANTS_ALWAYS_LAND
    chargeTicks: CHARGE_VALUE_MEDIUM, // §5.2 [estimate — G6]
    extra: { flat: HAIL_OF_BULLETS_BASE },
    messageTemplate: 'Logos unloads on the party',
  },
];

// ---------------------------------------------------------------------------
// The goons — Act I only. §4.6 [single source]
// ---------------------------------------------------------------------------

export const goonAbilities: AbilityDef[] = [
  {
    // §4.6 — the Dr. Goon's only listed action: a single physical.
    id: 'x2-goon-strike',
    name: 'Strike',
    game: 'ffx2',
    category: 'attack',
    mpCost: 0,
    power: ENEMY_ATTACK_CONSTANT,
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'affected-by-darkness'],
    chargeTicks: CHARGE_VALUE_INSTANT,
    messageTemplate: 'Dr. Goon strikes {target}',
  },
  // §4.6 — the Fem-Goon casts the four Lv.1 elements **party-wide** and the
  // four Lv.2 elements single-target. `C = 8` is the published Lv.1 tier and
  // `C = 13` the Lv.2 tier [ffx2-combat-core §3.6, single source: pbirdman].
  ...(
    [
      ['fire', 'Fire', 'Fira'],
      ['ice', 'Blizzard', 'Blizzara'],
      ['lightning', 'Thunder', 'Thundara'],
      ['water', 'Water', 'Watera'],
    ] as const
  ).flatMap(([element, lv1, lv2]): AbilityDef[] => [
    {
      id: `x2-fem-goon-${lv1.toLowerCase()}`,
      name: lv1,
      game: 'ffx2',
      category: 'enemy',
      mpCost: 0,
      power: 8,
      formula: 'magic',
      damageType: 'magical',
      element: [element],
      targeting: 'all-enemies',
      hits: 1,
      statusEffects: [],
      removesStatuses: [],
      flags: [],
      canMiss: false,
      chargeTicks: CHARGE_VALUE_MEDIUM,
      messageTemplate: `Fem-Goon casts ${lv1}`,
    },
    {
      id: `x2-fem-goon-${lv2.toLowerCase()}`,
      name: lv2,
      game: 'ffx2',
      category: 'enemy',
      mpCost: 0,
      power: 13,
      formula: 'magic',
      damageType: 'magical',
      element: [element],
      targeting: 'single-enemy',
      hits: 1,
      statusEffects: [],
      removesStatuses: [],
      flags: [],
      canMiss: false,
      chargeTicks: CHARGE_VALUE_MEDIUM,
      messageTemplate: `Fem-Goon casts ${lv2} on {target}`,
    },
  ]),
];

export default [...ormiAbilities, ...logosAbilities, ...goonAbilities];
