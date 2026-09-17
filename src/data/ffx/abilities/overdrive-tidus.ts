/**
 * Tidus's Swordplay Overdrives.
 *
 * Source: `research/ffx-combat-core.md` §5.3 (rank/DmgCon/hits from decompile;
 * unlock counts/hit-count corrections from Fandom) and §5.2 (timed-input
 * bonus). All rows `[verified: 2 sources]`.
 *
 * Timed-input bonus (§5.2): `timerMs = 3000` for Tidus; the engine computes
 * `damage += damage * timeRemaining // (timerMs*2)` (cap +50%) from the
 * `tidus-timing` minigame's `TimingResult` at resolve time — this file only
 * marks eligibility via `extra.timedInputBonus: true`, it is not a static
 * number we can bake into `power`.
 *
 * Success/fail branching: Swordplay always executes, but missing the
 * button-timing window changes the damage row. `power`/`hits` below are
 * always the SUCCESS row; the FAIL row lives in `extra.failPower` /
 * `extra.failHits` (there is no dedicated AbilityDef field for a fail
 * branch — this is the coordinating agent's documented convention).
 *
 * Crit: "Tidus's Overdrives can land critical hits... unlike Wakka's Slots,
 * which never crit" — every entry below carries the `crit-eligible` flag.
 *
 * ACCURACY DECISION (2026-09-16, corrected in a second integration pass —
 * the first pass wrongly reasoned that `formula: 'strength'` implies "rolls
 * accuracy like a normal Attack"; the decompiled Overdrive rows below show
 * that is exactly backwards for this damage-type family): does Slice &
 * Dice's 6 hits, or Energy Rain's all-enemies hit, roll to-hit per target?
 * `research/ffx-bfa-yu-yevon.md` §1.3 (lines 101, 107, 108) decompiles three
 * enemy Overdrives — Jecht Bomber, Ultimate Jecht Shot, Jecht Bomber 2 — that
 * are `Strength` formula, `Other` damage type, and all flagged "always
 * hits", CONTRASTED against that same table's plain physical attacks (lines
 * 98, 104-105: Strength, `Physical` type, "affected by Dark" / an explicit
 * accuracy byte, which do roll). The formula is not what decides it; the
 * `Other` damage type — i.e. "this is a character Overdrive" — is. Spiral
 * Cut/Slice & Dice/Energy Rain/Blitz Ace are all `formula: 'strength'`,
 * `damageType: 'other'`, `category: 'overdrive'`, matching the Jecht
 * Overdrives' exact signature. Conclusion: Swordplay always hits and never
 * rolls accuracy. `canMiss: false` is set explicitly on all 4 records below,
 * citing ffx-bfa-yu-yevon.md §1.3 `[verified: 2 sources]` (three independent
 * decompiled rows agree). Each of Slice & Dice's 6 hits and each enemy
 * Energy Rain reaches is unconditional, not an independent roll.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /**
   * §5.3 row 1 [verified: 2 sources]. Rank 3, single target. Success 32
   * DmgCon x1 hit; on a missed timing window, 24 DmgCon x1 hit.
   */
  'spiral-cut': {
    id: 'spiral-cut',
    name: 'Spiral Cut',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 32,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'overdrive-spiral-cut',
    sfxKey: 'sfx-spiral-cut',
    messageTemplate: '{user} uses {ability}',
    minigame: 'tidus-timing',
    extra: {
      timedInputBonus: true,
      failPower: 24,
      failHits: 1,
      vfxKey: 'vfx-spiral-cut',
    },
  },

  /**
   * §5.3 row 2 [verified: 2 sources]. Rank 4, hits a fresh random enemy per
   * hit. Success 6 DmgCon x6 hits; fail 8 DmgCon x3 hits.
   */
  'slice-and-dice': {
    id: 'slice-and-dice',
    name: 'Slice & Dice',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 4,
    power: 6,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 6,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'overdrive-slice-and-dice',
    sfxKey: 'sfx-slice-and-dice',
    messageTemplate: '{user} uses {ability}',
    minigame: 'tidus-timing',
    extra: {
      timedInputBonus: true,
      failPower: 8,
      failHits: 3,
      vfxKey: 'vfx-slice-and-dice',
    },
  },

  /**
   * §5.3 row 3 [verified: 2 sources]. Rank 5, all enemies. Success 26 DmgCon
   * x1 hit; fail 20 DmgCon x1 hit.
   */
  'energy-rain': {
    id: 'energy-rain',
    name: 'Energy Rain',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 26,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'overdrive-energy-rain',
    sfxKey: 'sfx-energy-rain',
    messageTemplate: '{user} uses {ability}',
    minigame: 'tidus-timing',
    extra: {
      timedInputBonus: true,
      failPower: 20,
      failHits: 1,
      vfxKey: 'vfx-energy-rain',
    },
  },

  /**
   * §5.3 row 4 [verified: 2 sources]. Rank 7 on a successful timing chain
   * (fail rank 6). Two-part hit: 8 hits at 4 DmgCon each, then a finishing
   * "Last Hit" at 24 DmgCon x1 — `power`/`hits` carry the 8x4 main volley,
   * `extra.finisherPower`/`extra.finisherHits` carry the finisher. The
   * finisher only fires on a successful chain; on fail the whole Overdrive
   * is just 4 DmgCon x8 hits with no finisher at all.
   */
  'blitz-ace': {
    id: 'blitz-ace',
    name: 'Blitz Ace',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 7,
    power: 4,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 8,
    canMiss: false, // ffx-yunalesca.md §7.2, ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'overdrive-blitz-ace',
    sfxKey: 'sfx-blitz-ace',
    messageTemplate: '{user} uses {ability}',
    minigame: 'tidus-timing',
    extra: {
      timedInputBonus: true,
      failPower: 4,
      failHits: 8,
      failRank: 6, // rank on the fail branch; not asked for explicitly but preserves the research's "(fail rank 6)" note
      finisherPower: 24,
      finisherHits: 1,
      finisherAppliesOnSuccessOnly: true,
      vfxKey: 'vfx-blitz-ace',
    },
  },
};

export default ABILITIES;
