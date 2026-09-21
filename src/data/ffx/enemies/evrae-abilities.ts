/**
 * Boss-only `AbilityDef`s for **Evrae** (`m119`) and **Cid** (`m149`), the
 * approach to Bevelle on the deck of the *Fahrenheit*.
 *
 * Every row is read off `research/ffx-evrae-airship.md` §3.1 and §3.2, the
 * decompiled action tables. All eight of Evrae's names are independently
 * confirmed by the wiki's Evrae infobox `[verified: 2 sources]`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. §0.4 of the research fences the
 * whole encounter — the range state, the queued order, the missile economy and
 * the reach gate have no FFX-2 counterpart. Nothing here is imported by
 * `src/battle/ffx2/**` or `src/data/ffx2/**`; the absence test is
 * `tests/unit/chapters/evrae-engine.test.ts`.
 *
 * ---
 *
 * ## The five rows that will be built wrong without a comment (§3.3)
 *
 * 1. **Haste is a `Counter Self`, not a scheduled turn.** It consumes no action
 *    slot and fires out of turn order, so the AI script never selects it;
 *    `ai/evrae-rules.ts#castEvraeHaste` resolves it directly. It is the
 *    *player's* Haste row (`ffx_command.csv` #54), so it carries full player
 *    semantics: recovery `floor(/2)` **and** the pending counter halved on the
 *    spot. Both halves, or the phase change reads flat.
 * 2. **Stone Gaze does zero HP damage.** `damages_hp = false`. Its entire
 *    payload is the two statuses — see its own comment for why `formula` is
 *    `'none'` here and where the decompiled `Magic` base 10 went.
 * 3. **Petrify here is a kill.** Swooping Scythe is party-wide and carries
 *    `shatterChance: 50`, so Stone Gaze → Swooping Scythe is a coin-flip
 *    **permanent** removal of a member *and their bench slot*. That is the
 *    encounter's real lethality.
 * 4. **Inhale and "Out of breath range." are a matched pair** — a named visible
 *    telegraph and a named visible whiff. The whiff is a celebration beat: the
 *    player earned it by spending a turn on an order instead of on damage.
 * 5. **Photon Spray is 8 separate hits, each re-rolling its target.**
 *    `targeting: 'random-enemy'`, which `docs/CONTRACTS.md` defines as "picks a
 *    fresh random target per hit". **Not** an 8x multiplier on one victim.
 *
 * ## Not shipped, on purpose
 *
 * **"Critical Strike"** (`ffx_monmagic2` row 102). §3.4: the decompile makes it
 * **Evrae Altana's** Provoke-forced action, both monsters are Provoke-immune,
 * and it never fires under either attribution. C-10 (attribution) and C-10b
 * (the wiki's "cannot crit", which the byte contradicts) are recorded there so
 * the deleted observation does not come back.
 *
 * ## Accuracy
 *
 * Magic and every Overdrive always hit [AGENTS.md hard rule 5]; the engine
 * reads only `canMiss === false`, so it is set explicitly on every magical and
 * every no-damage row here. The two physical rows carry the decompiled
 * `accuracy` byte instead (Attack 120, Swooping Scythe 100) and roll.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Evrae (m119) — §3.1 [decompiled]
// ---------------------------------------------------------------------------

/**
 * The melee row. §3.1: Strength, base 16, one random character, accuracy 120,
 * `can_crit`, **`affected_by_dark`**, shatter 10, `long_range = false`.
 *
 * Darkness is the melee off-switch and it is **per action**: this row is
 * blanked by Dark Attack / Dark Buster and Swooping Scythe is not (§6.1). Say
 * so in the help window; the asymmetry is the whole of what Darkness buys here.
 */
const attack: AbilityDef = {
  id: 'evrae-attack',
  name: 'Attack',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate] — the action table's default; no rank byte for this row
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['crit-eligible', 'affected-by-darkness', 'shatter'],
  shatterChance: 10, // §3.1 [decompiled]
  accuracy: 120, // §3.1 [decompiled]
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.1: Strength, base 8, **whole party**, accuracy 100, **`long_range = true`**,
 * **shatter 50**, `affected_by_dark = false`, no crit.
 *
 * It is a **counter**, not a scheduled turn: Evrae answers being targeted while
 * the ship is pulled back in phase 2 with this, and it **drags the fight back
 * to NEAR** (§5.5, verified: 2 sources). The range change is applied by
 * `ai/evrae-rules.ts#collectEvraeCounters`, not by an `extra.script`, because
 * that keeps it once per reaction rather than once per hit per target.
 *
 * Whether it exists at all in phase 1 is **C-12**; the owner-approved default
 * is phase 2 only — see `SWOOP_PHASE_TWO_ONLY`.
 */
const swoopingScythe: AbilityDef = {
  id: 'evrae-swooping-scythe',
  name: 'Swooping Scythe',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 8,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  // No `affected-by-darkness` and no `crit-eligible`: both bytes are false, and
  // the first one is load-bearing — Darkness does not blank this row.
  flags: ['long-range', 'shatter'],
  shatterChance: 50, // §3.1 [decompiled] — the coin-flip that ends a member
  accuracy: 100, // §3.1 [decompiled]
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.1: Magic, base 36, whole party, Always Hits, **Poison at 100**,
 * `long_range = false` — so it simply cannot be used while the ship is away,
 * and a charge started at NEAR **whiffs** if the ship moves before it resolves.
 *
 * **Poison is not a tax here, it is a second attack.** A character's poison tick
 * is `maxHP // 4` at the end of their own turn (§4.4), on all three actives at
 * once, in the one chapter with no white mage.
 */
const poisonBreath: AbilityDef = {
  id: 'evrae-poison-breath',
  name: 'Poison Breath',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 36,
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'poison', chance: 100, duration: 254 }], // §3.1 [decompiled]
  removesStatuses: [],
  flags: [],
  canMiss: false, // §3.1 [decompiled] — Always Hits
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.1 / §3.3 note 2: `damages_hp = false`, `damages_ctb = true`. **It does no
 * HP damage at all**; its entire payload is Petrify at 100 and Slow at 255.
 *
 * `formula: 'none'` is how that is expressed in this contract, and the
 * decompiled `Magic` base **10** is recorded here rather than in `power`
 * precisely because it never reaches a HP bar — writing it into `power` with a
 * `magic` formula would ship ~300 damage a turn that canon does not have.
 * `damages_ctb` needs no field either: the Slow status's own application
 * doubles the target's pending counter [`statuses.ts#onSlowApplied`].
 *
 * **C-8 — the Slow at chance 255 bypasses Slowproof and Ribbon, and the engine
 * already does it.** `statuses.ts#rollStatus` returns true for `chance >= 255`
 * *before* it reads the target's resistance byte, and `applyStatus` refuses a
 * Slow only when a **permanent** Haste is present — which is exactly SOS Haste
 * and Auto-Haste, the two things the wiki says do block it. The test pins both
 * halves; no escape hatch was needed.
 */
const stoneGaze: AbilityDef = {
  id: 'evrae-stone-gaze',
  name: 'Stone Gaze',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 0, // §3.3 note 2 — the decompiled Magic base is 10 and it damages nothing
  formula: 'none',
  damageType: 'magical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 1,
  statusEffects: [
    { status: 'petrify', chance: 100, duration: 254 }, // §3.1 [decompiled]
    { status: 'slow', chance: 255, duration: 254 }, // §3.1 [decompiled] — 255 ignores resistance
  ],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} uses {ability}',
};

/**
 * §3.1 / §3.3 note 5: Magic, base 3, **8 hits**, Always Hits, each hit
 * re-rolling its target.
 *
 * The 8-hit count is `[decompiled]`; the per-hit retargeting is
 * `[verified: 2 sources — wiki + GamerGuides]` and **not** readable off the
 * target byte, which reads the singular `Random Character` — §3.3's own
 * correction. `'random-enemy'` gives exactly that, and each hit rolls its own
 * damage RNG.
 *
 * This is the only thing Evrae can do while the ship is away, which is what
 * makes pulling back the opening move.
 */
const photonSpray: AbilityDef = {
  id: 'evrae-photon-spray',
  name: 'Photon Spray',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 3,
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'random-enemy',
  hits: 8, // §3.1 [decompiled]
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // §3.1 [decompiled] — Always Hits
  messageTemplate: '{user} uses {ability}',
};

/** §3.1 / §3.3 note 4 — the charge turn, a real named action and one turn of warning. */
const inhale: AbilityDef = {
  id: 'evrae-inhale',
  name: 'Inhale',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 0,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} inhales',
};

/**
 * §3.1 / §3.3 note 4 — the whiff. It fires **in place of** a Poison Breath
 * whose charge started at NEAR when the ship has moved away in the interval.
 *
 * The decompiled row is literally named `Out of breath range.` with the period.
 * We write our own copy [AGENTS.md hard rule 8], so the name is title-cased and
 * unpunctuated per `AbilityDef.name`'s own contract; the canon string is
 * recorded here and nowhere else.
 */
const outOfBreathRange: AbilityDef = {
  id: 'evrae-out-of-breath-range',
  name: 'Out of Breath Range',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 0,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} is out of breath range',
};

/**
 * §3.1: **Counter Self**, `CTB` formula, base 8, Haste at 254, `heals`,
 * `affected_by_reflect`, `affected_by_silence`, `long_range`, rank **4**, MP 8.
 *
 * `heals` on a `ctb` action is what halves the pending counter (`formulas.ts`
 * inverts the sign, `abilities.ts` applies it to the CTB pool), and the Haste
 * status is what halves future recovery — 30 → 15. **Both halves**, exactly as
 * §3.3 note 1 demands.
 *
 * **`reflectable` is the whole of C-14 and the owner chose to keep it.**
 * `targeting.ts#reflectBounceTarget` picks a random living member of the
 * *opposite* side with no self-target special case, so Reflect on Evrae turns
 * this row into a free Haste on a random party member. Dropping the flag is the
 * one-line way to suppress it, and it would be a data decision, not a code one.
 */
const haste: AbilityDef = {
  id: 'evrae-haste',
  name: 'Haste',
  game: 'ffx',
  category: 'enemy',
  mpCost: 8, // §3.1 [decompiled]
  rank: 4, // §3.1 [decompiled] — and never charged, because it is a counter
  power: 8,
  formula: 'ctb',
  damageType: 'other',
  element: ['none'],
  targeting: 'self',
  hits: 1,
  statusEffects: [{ status: 'haste', chance: 254, duration: 254 }], // §3.1 [decompiled]
  removesStatuses: [],
  flags: ['heals', 'reflectable', 'long-range'],
  canMiss: false,
  canReflect: true,
  messageTemplate: '{user} uses {ability}',
};

// ---------------------------------------------------------------------------
// Cid (m149) — §3.2 [decompiled]. One action, and it is the largest damage
// source in the encounter.
// ---------------------------------------------------------------------------

/**
 * §2.2: `Fixed` formula, base **4**, **12 hits**, Always Hits, `long_range`,
 * rank 3, target `M1` — monster slot 1, i.e. **Evrae**.
 *
 * Resolved: **2,244 / 2,400 / 2,532** per volley (min / mid / max), three
 * volleys, **≈7,200 ≈ 22.5 % of the bar, for zero party turns.** That is the
 * fight's central bargain and the chapter's thesis.
 *
 * Two properties of the row decide its shape here:
 * - **`targeting: 'single-ally'`.** Cid rides on `side: 'enemy'` so he gets a
 *   CTB row, which makes Evrae his ally. An ally-targeted damaging action
 *   without the `heals` flag still deals positive damage — `formulas.ts` only
 *   inverts the sign for `heals` — so nothing is sign-flipped and no engine
 *   change was needed. It also means `ai/reactions.ts` never collects a counter
 *   for it (an enemy-side attacker returns early), which is exactly C-1's
 *   recommended default: Cid's script action is not a "regular attack".
 * - **`damageType: 'other'`.** Fixed damage ignores Defense entirely and the
 *   row is non-elemental, so Evrae's ×0.5 does not apply and neither should
 *   Protect or a Power Break. `'other'` is the class `ffx-combat-core` §2.4
 *   reserves for exactly that.
 */
const guidedMissiles: AbilityDef = {
  id: 'cid-guided-missiles',
  name: 'Guided Missiles',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §2.2 [decompiled]
  power: 4, // §2.2 [decompiled]
  formula: 'fixed',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-ally',
  hits: 12, // §2.2 [decompiled]
  statusEffects: [],
  removesStatuses: [],
  flags: ['long-range'],
  canMiss: false, // §2.2 [decompiled] — Always Hits
  messageTemplate: '{user} uses {ability}',
};

export const EVRAE_ABILITIES: Record<string, AbilityDef> = {
  [attack.id]: attack,
  [swoopingScythe.id]: swoopingScythe,
  [poisonBreath.id]: poisonBreath,
  [stoneGaze.id]: stoneGaze,
  [photonSpray.id]: photonSpray,
  [inhale.id]: inhale,
  [outOfBreathRange.id]: outOfBreathRange,
  [haste.id]: haste,
  [guidedMissiles.id]: guidedMissiles,
};

export default EVRAE_ABILITIES;
