/**
 * Boss-only `AbilityDef`s for the Seymour Flux / Mortiorchis encounter
 * (Mt. Gagazet). Source: `research/ffx-seymour-flux.md` §3, §4, §5.
 *
 * Ownership note: abilities that are literally the *same* record a player
 * character could cast (Protect, Reflect, Dispel) are **not** here — they are
 * referenced by id from the shared catalog the abilities data agent owns
 * (`src/data/ffx/abilities`). Everything below is enemy-exclusive, either
 * because no player ever casts it (Lance of Atrophy, Total Annihilation, ...)
 * or because its targeting/behaviour differs from the player-facing spell of
 * the same name (Flare — see `flare-self` below).
 *
 * `extra` keys used in this file, all consumed by the engine's AI script
 * (`src/battle/ffx/ai`), never by this data file:
 *   - `mortibsorptionDecay: { initialMaxHp, decayPerUse, floorMaxHp }` — on
 *     `mortibsorption`. HP-transfer amount is `user.maxHp` (formula
 *     `user-max-hp`, power 10); after each use the engine must set
 *     `mortiorchis.maxHp = Math.max(floorMaxHp, mortiorchis.maxHp - decayPerUse)`
 *     and heal Mortiorchis to the *new* maxHp. Mortiorchis's `maxHp` never
 *     reaches 0 and it has no death state [§2.2].
 *   - `bypassesAeonRibbon: true` — on `banish`. The Eject application must
 *     ignore the aeon's Aeon Ribbon immunity entirely (chance 255 already
 *     signals "ignore ordinary resistance" per `StatusApplication.chance`,
 *     but Aeon Ribbon is a *separate* `AutoAbilityId`-driven immunity, not a
 *     `StatusImmunities` byte, so the engine needs this explicit flag too)
 *     [§4.5, ffx-combat-core §6.1].
 *   - `postponedWhileAeonPresent: true` — on `auto-attack-mode` / the Total
 *     Annihilation charge ladder (see the enemy file's AI notes). Not an
 *     ability field here since the ladder itself is presented via the
 *     engine's `charge` event, not a resolved ability — see the comment in
 *     `seymour-flux.ts`.
 *   - `counterTrigger: 'player-delay-attempt'` — on `slowga-counter`. Fires
 *     from the AI's counter hook, not the scheduled turn queue; costs 0 CTB.
 *   - `selfTargetBounce: true` — on `flare-self`. Always resolves at Self;
 *     the caster's own Reflect status (not the engine's normal reflect-back-
 *     at-attacker rule) decides whether it lands on Seymour or bounces onto
 *     a random party member. See `research/ffx-seymour-flux.md` §3.3.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

/**
 * §3.1 [decompiled]. Random character, Strength formula, always hits,
 * `can_target_dead`, shatter 30. Zombie is chance 100 (not 254): with 0
 * resistance that lands ~99% of the time; a Zombie Ward halves it to ~49.5%.
 */
export const lanceOfAtrophy: AbilityDef = {
  id: 'lance-of-atrophy',
  name: 'Lance of Atrophy',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // §3.1 [estimate: rank byte not in the decompiled excerpt; FFX enemy default]
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [{ status: 'zombie', chance: 100, duration: 254 }],
  removesStatuses: [],
  flags: ['can-target-dead', 'shatter', 'crit-eligible'],
  shatterChance: 30,
  accuracy: 255, // §3.1 [decompiled] "always hits"
  canMiss: false,
  messageTemplate: '{user} uses Lance of Atrophy on {target}',
};

/**
 * §3.1, §3.3 [decompiled] + wiki [verified: 2 sources]. Targets a random
 * Zombie-afflicted character (AI picks the target; falls back to a random
 * living, non-KO'd member and whiffs via `misses-if-target-alive`). On a
 * living Zombie: 100% of max HP as damage (Percentage Total, base 16) plus a
 * guaranteed kill via the `ko` status application. On a KO'd target: full
 * revive (`heals` inverts the sign). Reflectable.
 */
export const fullLife: AbilityDef = {
  id: 'full-life',
  name: 'Full-Life',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 16,
  formula: 'percent-total',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [{ status: 'ko', chance: 254, duration: 0 }], // duration is moot for an instant status; StatusApplication.duration is non-nullable
  // §3.3 [estimate]: exact cleanse list not decompiled; standard FFX Full-Life
  // clears the common battle ailments on a successful revive.
  removesStatuses: ['poison', 'darkness', 'silence', 'sleep', 'confuse', 'berserk', 'slow', 'doom'],
  flags: ['heals', 'can-target-dead', 'misses-if-target-alive', 'removes-statuses', 'reflectable'],
  canReflect: true,
  messageTemplate: '{user} uses Full-Life on {target}',
};

/** §3.1 [decompiled] + wiki [verified: 2 sources]. Party-wide, strong Delay on every target. */
export const crossCleave: AbilityDef = {
  id: 'cross-cleave',
  name: 'Cross Cleave',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 52,
  formula: 'strength',
  damageType: 'physical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['strong-delay', 'crit-eligible'],
  accuracy: 100, // [estimate — matches Seymour's listed Accuracy stat, §1.1]
  messageTemplate: '{user} uses Cross Cleave',
};

/**
 * §3.1 [decompiled] + Final Fantasy Wiki "Total Annihilation" page
 * [verified: 2 sources]. Party-wide, 5 separate hits (each its own `damage`
 * event with `hitIndex`/`hitCount`), Magic formula, non-elemental.
 */
export const totalAnnihilation: AbilityDef = {
  id: 'total-annihilation',
  name: 'Total Annihilation',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 44,
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 5,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  accuracy: 100, // [estimate]
  messageTemplate: '{user} uses Total Annihilation',
};

/**
 * §3.1, §3.3, §4.4.1 [decompiled] + wiki [verified: 2 sources]. **Always
 * targets Self.** Whether it bounces onto the party or lands on Seymour
 * depends entirely on whether he currently holds Reflect — see
 * `selfTargetBounce` above. Category is `blackmagic` (not `enemy`) so the
 * engine's Silence rule (blocks Blk/Wht Magic) applies to it, matching
 * §6 strategy 7. Named `flare-self` rather than the generic `flare` id
 * because its `targeting` (`self`) is incompatible with the player-facing
 * Blk Magic spell of the same name — **do not** let the abilities catalog
 * reuse the bare `flare` id for this record.
 */
export const flareSelf: AbilityDef = {
  id: 'flare-self',
  name: 'Flare',
  game: 'ffx',
  category: 'blackmagic',
  mpCost: 0,
  rank: 3, // [estimate]
  power: 80,
  formula: 'magic',
  damageType: 'magical',
  element: ['none'],
  targeting: 'self',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'reflectable'],
  canReflect: true,
  extra: {
    selfTargetBounce: true,
    note: "Always resolves at Self; Seymour's own Reflect status decides the real target.",
  },
  messageTemplate: '{user} uses Flare',
};

/**
 * §3.1 [decompiled]. Applies Eject, bypassing the aeon's Aeon Ribbon
 * immunity — the one thing that can remove a summoned aeon from the field.
 * The aeon gets exactly one turn first; that timing is AI-script, not data
 * [§4.5, verified: 2 sources].
 */
export const banish: AbilityDef = {
  id: 'banish',
  name: 'Banish',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [{ status: 'eject', chance: 255, duration: 0 }], // duration is moot; eject is permanent-for-battle by rule, not by ticking down
  removesStatuses: [],
  flags: ['always-break-damage-limit'], // [decompiled] cosmetic — no damage is dealt
  extra: { bypassesAeonRibbon: true },
  messageTemplate: '{user} banishes {target}',
};

/**
 * §2.2 [verified: 2 sources]. Mortiorchis's death-trigger reaction, not a
 * scheduled turn: fires the instant its HP hits 0. Formula `user-max-hp`
 * (power 10) reduces to `damage = user.maxHp` exactly, `drains` credits the
 * same amount to Mortiorchis's own HP. See `mortibsorptionDecay` above for
 * the post-use maxHp floor/decay the engine must apply.
 */
export const mortibsorption: AbilityDef = {
  id: 'mortibsorption',
  name: 'Mortibsorption',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 10,
  formula: 'user-max-hp',
  damageType: 'other',
  element: ['none'],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['drains', 'ignores-armored'],
  accuracy: 255,
  canMiss: false,
  extra: {
    mortibsorptionDecay: { initialMaxHp: 4000, decayPerUse: 1000, floorMaxHp: 1000 },
    firesOnZeroHp: true,
    triggersSeymourHpThresholdCheck: true, // §4.3 — unlike Poison damage, this DOES count
  },
  messageTemplate: '{user} uses Mortibsorption',
};

/**
 * §3.1, §4.6 [decompiled] + wiki [verified: 2 sources]. Fires as a counter
 * to a player Delay attempt, costing 0 CTB. `ctb` formula without the
 * `heals` flag *adds* `target.ctb * 16/16` = the target's current CTB,
 * doubling its wait. Both enemies are `immune-to-delay`, so the delay itself
 * always fails on top of this.
 */
export const slowgaCounter: AbilityDef = {
  id: 'slowga-counter',
  name: 'Slowga',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 16,
  formula: 'ctb',
  damageType: 'other',
  element: ['none'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'slow', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['reflectable', 'is-counter'],
  canReflect: true,
  extra: { counterTrigger: 'player-delay-attempt' },
  messageTemplate: '{user} counters with Slowga',
};

/** All Seymour-Flux-encounter-only abilities, keyed by id, for lookups and tests. */
export const SEYMOUR_FLUX_ABILITIES: Record<string, AbilityDef> = {
  [lanceOfAtrophy.id]: lanceOfAtrophy,
  [fullLife.id]: fullLife,
  [crossCleave.id]: crossCleave,
  [totalAnnihilation.id]: totalAnnihilation,
  [flareSelf.id]: flareSelf,
  [banish.id]: banish,
  [mortibsorption.id]: mortibsorption,
  [slowgaCounter.id]: slowgaCounter,
};

export default SEYMOUR_FLUX_ABILITIES;
