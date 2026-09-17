/**
 * Sanity checks for the FFX player-side data tables this data agent owns
 * (`abilities/**`, `items/**`, `statuses/**`, `characters/**`, `aeons/**`,
 * `overdrives/**`, `mixes/**`). Mirrors the pattern already established by
 * `tests/unit/data-ffx-enemies.test.ts` for the enemy-data agent's files:
 * TypeScript enforces every closed-union field is a real member of its
 * union (`npx tsc --noEmit`); these tests cover what the type system
 * cannot — numeric ranges declared in `battle/common/types.ts`'s own doc
 * comments, and a citation-coverage proxy so no file ships with an
 * unsourced number (`docs/CONTRACTS.md`: "a table with no tag anywhere is
 * a defect").
 *
 * Cross-module resolution (every `EnemyDef.abilityIds` / `learnedAbilityIds`
 * / `ItemDef.effect` reference resolving, and no colliding duplicate ids)
 * is covered separately by `tests/unit/data-ffx-index.test.ts`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AbilityDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { hitChance } from '../../src/battle/ffx/accuracy.ts';

import { ABILITIES, ITEMS, FFX_STATUSES, CHARACTERS, AEONS, OVERDRIVE_MODES } from '../../src/data/ffx/index.ts';

// Every ability-bearing module THIS data agent owns (abilities/**, aeons/**,
// mixes/**) — deliberately excludes `enemies/*-abilities.ts`, which is a
// different agent's files and not this test's business to assert against.
import { ABILITIES as WHITEMAGIC_CURE } from '../../src/data/ffx/abilities/whitemagic-cure.ts';
import { ABILITIES as WHITEMAGIC_REVIVAL } from '../../src/data/ffx/abilities/whitemagic-revival.ts';
import { ABILITIES as WHITEMAGIC_PROTECT } from '../../src/data/ffx/abilities/whitemagic-protect.ts';
import { ABILITIES as WHITEMAGIC_HASTE_SLOW } from '../../src/data/ffx/abilities/whitemagic-haste-slow.ts';
import { ABILITIES as BLACKMAGIC_ELEMENTAL } from '../../src/data/ffx/abilities/blackmagic-elemental.ts';
import { ABILITIES as BLACKMAGIC_ADVANCED } from '../../src/data/ffx/abilities/blackmagic-advanced.ts';
import { ABILITIES as SPECIAL_BUFFS } from '../../src/data/ffx/abilities/special-buffs.ts';
import { ABILITIES as SPECIAL_UTILITY } from '../../src/data/ffx/abilities/special-utility.ts';
import { ABILITIES as SPECIAL_RIKKU } from '../../src/data/ffx/abilities/special-rikku.ts';
import { ABILITIES as SPECIAL_MENU_MARKERS } from '../../src/data/ffx/abilities/special-menu-markers.ts';
import { ABILITIES as SKILL_STATUS_ATTACKS } from '../../src/data/ffx/abilities/skill-status-attacks.ts';
import { ABILITIES as SKILL_BREAKS_MISC } from '../../src/data/ffx/abilities/skill-breaks-misc.ts';
import { ABILITIES as OVERDRIVE_TIDUS } from '../../src/data/ffx/abilities/overdrive-tidus.ts';
import { ABILITIES as OVERDRIVE_AURON } from '../../src/data/ffx/abilities/overdrive-auron.ts';
import { ABILITIES as OVERDRIVE_WAKKA_1 } from '../../src/data/ffx/abilities/overdrive-wakka-1.ts';
import { ABILITIES as OVERDRIVE_WAKKA_2 } from '../../src/data/ffx/abilities/overdrive-wakka-2.ts';
import { ABILITIES as OVERDRIVE_LULU_1 } from '../../src/data/ffx/abilities/overdrive-lulu-1.ts';
import { ABILITIES as OVERDRIVE_LULU_2 } from '../../src/data/ffx/abilities/overdrive-lulu-2.ts';
import { ABILITIES as OVERDRIVE_KIMAHRI_1 } from '../../src/data/ffx/abilities/overdrive-kimahri-1.ts';
import { ABILITIES as OVERDRIVE_KIMAHRI_2 } from '../../src/data/ffx/abilities/overdrive-kimahri-2.ts';
import { ABILITIES as OVERDRIVE_YUNA } from '../../src/data/ffx/abilities/overdrive-yuna.ts';
import { ABILITIES as AEON_ABILITIES_CORE } from '../../src/data/ffx/aeons/abilities-core.ts';
import { ABILITIES as AEON_ABILITIES_CORE_2 } from '../../src/data/ffx/aeons/abilities-core-2.ts';
import { ABILITIES as AEON_ABILITIES_OPTIONAL } from '../../src/data/ffx/aeons/abilities-optional.ts';
import { ABILITIES as AEON_ABILITIES_OPTIONAL_2 } from '../../src/data/ffx/aeons/abilities-optional-2.ts';
import { ABILITIES as MIX_ABILITIES } from '../../src/data/ffx/mixes/abilities.ts';

// Two enemy-data-agent files this data agent was explicitly authorised to
// edit for the accuracy fix (2026-09-16), because that agent has been idle.
// `enemies/yunalesca-abilities.ts` is deliberately NOT imported here: the
// engine agent is editing it directly for the Mega Death fix and is setting
// `canMiss` there itself — asserting against it from this test would create
// exactly the kind of cross-agent test collision this file's `MY_OWN_
// ABILITIES` scoping already avoids elsewhere.
import { SEYMOUR_FLUX_ABILITIES } from '../../src/data/ffx/enemies/seymour-flux-abilities.ts';
import { BRASKAS_FINAL_AEON_ABILITIES } from '../../src/data/ffx/enemies/braskas-final-aeon-abilities.ts';

/** Every `AbilityDef` this data agent itself authors, merged — no enemy-owned records mixed in. */
const MY_OWN_ABILITIES: Record<string, AbilityDef> = {
  ...WHITEMAGIC_CURE,
  ...WHITEMAGIC_REVIVAL,
  ...WHITEMAGIC_PROTECT,
  ...WHITEMAGIC_HASTE_SLOW,
  ...BLACKMAGIC_ELEMENTAL,
  ...BLACKMAGIC_ADVANCED,
  ...SPECIAL_BUFFS,
  ...SPECIAL_UTILITY,
  ...SPECIAL_RIKKU,
  ...SPECIAL_MENU_MARKERS,
  ...SKILL_STATUS_ATTACKS,
  ...SKILL_BREAKS_MISC,
  ...OVERDRIVE_TIDUS,
  ...OVERDRIVE_AURON,
  ...OVERDRIVE_WAKKA_1,
  ...OVERDRIVE_WAKKA_2,
  ...OVERDRIVE_LULU_1,
  ...OVERDRIVE_LULU_2,
  ...OVERDRIVE_KIMAHRI_1,
  ...OVERDRIVE_KIMAHRI_2,
  ...OVERDRIVE_YUNA,
  ...AEON_ABILITIES_CORE,
  ...AEON_ABILITIES_CORE_2,
  ...AEON_ABILITIES_OPTIONAL,
  ...AEON_ABILITIES_OPTIONAL_2,
  ...MIX_ABILITIES,
};

// ---------------------------------------------------------------------------
// Accuracy fidelity regression (2026-09-16) — magic and Overdrives always
// hit in FFX and must never roll accuracy. Evidence: `research/
// ffx-yunalesca.md` §7.2 (line 596), "Physical accuracy tanks; magic
// unaffected"; `research/ffx-bfa-yu-yevon.md` §1.3 (lines 99, 101, 107,
// 108), which decompiles Jecht Beam (Magic formula) and three `Other`-
// damage-type Overdrives (Jecht Bomber, Ultimate Jecht Shot, Jecht Bomber 2)
// as all flagged "always hits", contrasted with that table's plain physical
// attacks (lines 98, 104-105), which roll accuracy normally. The engine
// reads this directly: `src/battle/ffx/accuracy.ts`'s `hitChance()` returns
// `null` (guaranteed hit) when `def.canMiss === false`, checked before
// anything else. An earlier pass shipped `canMiss: true` on all 19 Black
// Magic spells, all 19 Fury records, Tidus's 4 Swordplay Overdrives,
// Wakka's 14 Slots abilities, and all 44 Mix-related abilities (the 100
// records this fix corrected) by reasoning from absence rather than from
// these decompiled rows.
//
// UPDATE (2026-09-16, later same day): Auron's Bushido, Kimahri's Ronso
// Rage, Yuna's Grand Summon, and the aeons' own Overdrives were closed out
// in a follow-up pass using the identical evidence — see their own files'
// ACCURACY DECISION headers. A follow-up pass after that also fixed two
// enemy-data-agent files this data agent was explicitly authorised to edit
// (`enemies/seymour-flux-abilities.ts`, `enemies/braskas-final-aeon-
// abilities.ts` — see their own ACCURACY EDIT headers); `enemies/
// yunalesca-abilities.ts` is excluded throughout because the engine agent
// owns that edit. The blanket "every overdrive-category ability" check
// below is still deliberately NOT used, because the enemy files mix
// physical actions that correctly roll (Left-Arm Strike, Blade Blitz, Cross
// Cleave) alongside magical/Overdrive ones that don't — id-list checks are
// used instead throughout this section for that reason.
// ---------------------------------------------------------------------------

/**
 * The 19 player-castable Black Magic spell ids this data agent owns
 * (`abilities/blackmagic-elemental.ts` + `blackmagic-advanced.ts`).
 * NOT the same set as `category === 'blackmagic'` project-wide: the
 * enemy-data agent's `enemies/seymour-flux-abilities.ts` also tags its
 * self-cast `flare-self` as `category: 'blackmagic'` — a different,
 * boss-owned `AbilityDef` (self-target, magic formula) that this data agent
 * separately set `canMiss: false` on directly in that file (see its own
 * ACCURACY EDIT header), so it is EXCLUDED here to avoid double-testing
 * someone else's file from this data agent's own strict list; it is
 * covered instead by `BFA_AND_SEYMOUR_ALWAYS_HIT_IDS` below.
 */
const BLACK_MAGIC_IDS = [
  'fire', 'fira', 'firaga', 'blizzard', 'blizzara', 'blizzaga',
  'thunder', 'thundara', 'thundaga', 'water', 'watera', 'waterga',
  'bio', 'demi', 'death', 'drain', 'osmose-spell', 'flare', 'ultima',
];

describe('FFX ability catalog — Black Magic and Overdrives always hit (canMiss: false)', () => {
  it('every player Black Magic spell has canMiss: false (fully covered by this fix)', () => {
    const offenders = BLACK_MAGIC_IDS.filter((id) => ABILITIES[id]?.canMiss !== false);
    expect(offenders, offenders.join(', ')).toEqual([]);
  });

  it('every Black Magic or Overdrive record this data agent owns has canMiss === false (strict — catches unset too)', () => {
    // 2026-09-16, tightened per coordinator review: an EARLIER version of
    // this guard checked `canMiss === true`, which only catches a record
    // explicitly flipped to the wrong value. `accuracy.ts`'s `hitChance()`
    // checks `canMiss === false` to short-circuit to a guaranteed hit — an
    // UNSET `canMiss` does NOT short-circuit and rolls to hit exactly like
    // `canMiss: true` does. Auron's Bushido, Kimahri's Ronso Rage, Yuna's
    // Grand Summon, and the aeons' own Overdrives were all unset and this
    // weaker guard passed anyway, which is exactly why they were missed in
    // the first fix pass. Checking `!== false` here, not `=== true`, closes
    // that hole: this test MUST fail before those four families are fixed,
    // and MUST pass after.
    //
    // Scoped to `MY_OWN_ABILITIES` (this data agent's own modules), not the
    // merged `ABILITIES` table: `enemies/*-abilities.ts` also carries
    // `category: 'overdrive'`/`'blackmagic'` records that mix in physical
    // actions and possessed-aeon copies with their own, separately-reasoned
    // exceptions (see `BFA_AND_SEYMOUR_ALWAYS_HIT_IDS` below for those,
    // checked by explicit id list instead of a blanket category filter for
    // exactly that reason) — a blanket category check over the merged table
    // would either miss those exceptions or wrongly assert against
    // `enemies/yunalesca-abilities.ts`, which this data agent must not
    // touch right now.
    const offenders = Object.values(MY_OWN_ABILITIES)
      .filter((a) => (a.category === 'blackmagic' || a.category === 'overdrive') && a.canMiss !== false)
      .map((a) => a.id);
    expect(offenders, offenders.join(', ')).toEqual([]);
  });

  /**
   * The enemy-data-agent records this data agent was explicitly authorised
   * to fix (2026-09-16): all of `enemies/seymour-flux-abilities.ts`'s
   * magical/status actions, and `enemies/braskas-final-aeon-abilities.ts`'s
   * magical/status actions and every Overdrive (including the 9
   * `possessed-*` Overdrive copies). Deliberately an explicit id list, not
   * a category filter: both files also contain physical Strength attacks
   * that correctly still roll (`cross-cleave`, `left-arm-strike`,
   * `left-arm-strike-2`, `blade-blitz` — Blade Blitz has its own `accuracy:
   * 150` byte and both Left-Arm Strikes are `affected-by-darkness`, which
   * confirms they roll) and 10 possessed-aeon Attack/Special records
   * (`category: 'aeon'`) deliberately left mirroring this data agent's own
   * still-unset player-aeon Attack/Special decision. `enemies/
   * yunalesca-abilities.ts` is excluded entirely — the engine agent owns
   * that file's `canMiss` edit.
   */
  const BFA_AND_SEYMOUR_ALWAYS_HIT_IDS = [
    // seymour-flux-abilities.ts
    'total-annihilation', 'banish', 'slowga-counter', 'full-life', 'flare-self',
    'lance-of-atrophy', 'mortibsorption', // already correct before this pass
    // braskas-final-aeon-abilities.ts — magical/status/script actions
    'jecht-beam', // already correct before this pass
    'yu-pagoda-curse', 'gravija', 'power-wave-bfa', 'power-wave-aeon',
    'draws-sword', 'yu-yevon-command-254',
    // braskas-final-aeon-abilities.ts — every Overdrive
    'triumphant-grasp', 'triumphant-grasp-2', 'jecht-bomber', 'jecht-bomber-2', 'ultimate-jecht-shot', // 3 already correct
    'possessed-valefor-energy-ray', 'possessed-valefor-energy-blast',
    'possessed-ifrit-hellfire', 'possessed-ixion-thors-hammer',
    'possessed-shiva-diamond-dust', 'possessed-bahamut-mega-flare',
    'possessed-anima-oblivion', 'possessed-yojimbo-zanmato', 'possessed-cindy-delta-attack',
  ];

  /** Physical Strength attacks in the same two enemy files that correctly still roll accuracy — must stay unset. */
  const BFA_AND_SEYMOUR_STILL_ROLLING_IDS = ['cross-cleave', 'left-arm-strike', 'left-arm-strike-2', 'blade-blitz'];

  it('every authorised enemy magical/status/Overdrive record has canMiss === false (strict)', () => {
    const merged: Record<string, AbilityDef> = { ...SEYMOUR_FLUX_ABILITIES, ...BRASKAS_FINAL_AEON_ABILITIES };
    const offenders = BFA_AND_SEYMOUR_ALWAYS_HIT_IDS.filter((id) => merged[id]?.canMiss !== false);
    expect(offenders, offenders.join(', ')).toEqual([]);
  });

  it('the enemy physical attacks this pass deliberately left alone actually roll to hit (behaviour, not just the field)', () => {
    // 2026-09-16, rewritten per coordinator review: the previous version of
    // this test only checked `canMiss !== false` as a FIELD VALUE. The
    // engine's `hitChance()` was extended with a THIRD always-hit branch
    // (`src/battle/ffx/accuracy.ts`: `def.accuracy === undefined && user.side
    // === 'enemy'` -> always hits, "Enemy Accuracy is never used" [§2.11]) —
    // so a record can have `canMiss` correctly left unset and STILL always
    // hit in practice, if it also lacks an `accuracy` byte and isn't a
    // physical action that reaches the ACC-based table. A field check can't
    // see that; only calling the real function can. This test does that:
    // it builds a minimal enemy `user` and party `target` and asserts
    // `hitChance()` returns a NUMBER (a real roll), not `null`
    // (unconditional hit), for each of the four attacks this pass
    // deliberately left alone.
    const merged: Record<string, AbilityDef> = { ...SEYMOUR_FLUX_ABILITIES, ...BRASKAS_FINAL_AEON_ABILITIES };
    const enemyUser: FFXCombatant = {
      id: 'test-enemy',
      name: 'Test Enemy',
      side: 'enemy',
      spriteKey: 'test-enemy',
      stats: { hp: 9999, mp: 999, str: 50, def: 50, mag: 50, mdef: 50, agi: 50, luck: 20, eva: 0, acc: 100, maxHp: 9999, maxMp: 999 },
      hp: 9999,
      mp: 999,
      statuses: {},
      affinities: {},
      immunities: {},
      immunityFlags: [],
      controller: 'ai',
      alive: true,
      removed: false,
      slot: 0,
      flags: {},
      learnedAbilityIds: [],
    };
    const partyTarget: FFXCombatant = {
      ...enemyUser,
      id: 'test-party-member',
      name: 'Test Party Member',
      side: 'party',
      stats: { ...enemyUser.stats, eva: 10, luck: 15 },
    };
    const offenders: string[] = [];
    for (const id of BFA_AND_SEYMOUR_STILL_ROLLING_IDS) {
      const def = merged[id];
      expect(def, id).toBeDefined();
      if (!def) continue;
      const chance = hitChance(enemyUser, partyTarget, def);
      if (chance === null) offenders.push(id);
    }
    expect(offenders, `these should roll (hitChance !== null) but always hit instead: ${offenders.join(', ')}`).toEqual([]);
  });

  it('a representative sample resolves canMiss: false explicitly (not just by default omission)', () => {
    // Spot-checks that the field is actually SET, not merely absent (which
    // would also satisfy `canMiss !== true` but would be exactly the
    // omission-defaults-by-accident bug this whole fix exists to prevent).
    const sample = ['fire', 'ultima', 'fire-fury', 'ultima-fury', 'slice-and-dice', 'blitz-ace', 'fire-shot', 'attack-reels-hit', 'mix', 'mix-firestorm', 'mix-ultra-potion'];
    for (const id of sample) {
      expect(ABILITIES[id], id).toBeDefined();
      expect(ABILITIES[id]?.canMiss, id).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Numeric range checks — bounds are the ones documented in
// `src/battle/common/types.ts`'s own field comments.
// ---------------------------------------------------------------------------

describe('FFX ability catalog — numeric ranges stay inside the documented bounds', () => {
  it('every AbilityDef.mpCost is 0-999', () => {
    for (const a of Object.values(ABILITIES)) {
      expect(a.mpCost, a.id).toBeGreaterThanOrEqual(0);
      expect(a.mpCost, a.id).toBeLessThanOrEqual(999);
    }
  });

  it('every AbilityDef.rank, when present, is 1-10 (or the documented 0 = "falls back to rank 3" byte)', () => {
    // ffx-combat-core §6.1 [verified: 2 sources]: "The raw rank byte is 0 ->
    // the engine's fallback is rank 3" — Dismiss ships the raw byte (0), not
    // the resolved fallback, per that note and AbilityDef.rank's own doc
    // comment ("A raw rank byte of 0 falls back to 3").
    for (const a of Object.values(ABILITIES)) {
      if (a.rank === undefined) continue;
      expect(a.rank, a.id).toBeGreaterThanOrEqual(0);
      expect(a.rank, a.id).toBeLessThanOrEqual(10);
    }
  });

  it('every AbilityDef.power (DmgCon) is 0-255', () => {
    for (const a of Object.values(ABILITIES)) {
      expect(a.power, a.id).toBeGreaterThanOrEqual(0);
      expect(a.power, a.id).toBeLessThanOrEqual(255);
    }
  });

  it('every AbilityDef.hits is 0-16', () => {
    for (const a of Object.values(ABILITIES)) {
      expect(a.hits, a.id).toBeGreaterThanOrEqual(0);
      expect(a.hits, a.id).toBeLessThanOrEqual(16);
    }
  });

  it('every AbilityDef.accuracy, bonusCrit and shatterChance, when present, are in byte/percentage range', () => {
    for (const a of Object.values(ABILITIES)) {
      if (a.accuracy !== undefined) {
        expect(a.accuracy, `${a.id} accuracy`).toBeGreaterThanOrEqual(0);
        expect(a.accuracy, `${a.id} accuracy`).toBeLessThanOrEqual(255);
      }
      if (a.bonusCrit !== undefined) {
        expect(a.bonusCrit, `${a.id} bonusCrit`).toBeGreaterThanOrEqual(0);
        expect(a.bonusCrit, `${a.id} bonusCrit`).toBeLessThanOrEqual(100);
      }
      if (a.shatterChance !== undefined) {
        expect(a.shatterChance, `${a.id} shatterChance`).toBeGreaterThanOrEqual(0);
        expect(a.shatterChance, `${a.id} shatterChance`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('every StatusApplication chance/duration/stacks byte is in range', () => {
    for (const a of Object.values(ABILITIES)) {
      for (const app of a.statusEffects) {
        expect(app.chance, `${a.id} -> ${app.status} chance`).toBeGreaterThanOrEqual(0);
        expect(app.chance, `${a.id} -> ${app.status} chance`).toBeLessThanOrEqual(255);
        expect(app.duration, `${a.id} -> ${app.status} duration`).toBeGreaterThanOrEqual(0);
        expect(app.duration, `${a.id} -> ${app.status} duration`).toBeLessThanOrEqual(255);
        if (app.stacks !== undefined) {
          expect(app.stacks, `${a.id} -> ${app.status} stacks`).toBeGreaterThanOrEqual(0);
          expect(app.stacks, `${a.id} -> ${app.status} stacks`).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it('every ItemDef.price is non-negative (0 = the documented "not in research" placeholder)', () => {
    for (const i of Object.values(ITEMS)) {
      expect(i.price, i.id).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Catalog shape checks — the descriptive tables this data agent added
// on top of the contract (statuses, characters, aeons, overdrive modes).
// ---------------------------------------------------------------------------

describe('FFX statuses/characters/aeons/overdrive-modes catalogs', () => {
  it('FFX_STATUSES has an entry for every party-relevant status the ability catalog actually applies', () => {
    const appliedStatusIds = new Set<string>();
    for (const a of Object.values(ABILITIES)) {
      for (const app of a.statusEffects) appliedStatusIds.add(app.status);
    }
    const missing = [...appliedStatusIds].filter((id) => !(id in FFX_STATUSES));
    expect(missing, missing.join(', ')).toEqual([]);
  });

  it('CHARACTERS lists all 7 party members, each with a non-empty overdrive ability list that resolves', () => {
    const ids = Object.keys(CHARACTERS);
    expect(ids.sort()).toEqual(['auron', 'kimahri', 'lulu', 'rikku', 'tidus', 'wakka', 'yuna'].sort());
    for (const c of Object.values(CHARACTERS)) {
      expect(c.overdriveAbilityIds.length, c.id).toBeGreaterThan(0);
      for (const odId of c.overdriveAbilityIds) {
        expect(odId in ABILITIES, `${c.id} -> ${odId}`).toBe(true);
      }
    }
  });

  it('AEONS lists every mandatory aeon plus the optional ones, each with resolvable ability ids', () => {
    for (const id of ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo', 'cindy', 'sandy', 'mindy']) {
      expect(id in AEONS, id).toBe(true);
    }
    for (const aeonDef of Object.values(AEONS)) {
      const attackIds = Array.isArray(aeonDef.attackAbilityId) ? aeonDef.attackAbilityId : [aeonDef.attackAbilityId];
      for (const id of attackIds) expect(id in ABILITIES, `${aeonDef.id} attack -> ${id}`).toBe(true);
      if (aeonDef.specialAbilityId) {
        expect(aeonDef.specialAbilityId in ABILITIES, `${aeonDef.id} special`).toBe(true);
      }
      for (const id of aeonDef.overdriveAbilityIds) {
        expect(id in ABILITIES, `${aeonDef.id} overdrive -> ${id}`).toBe(true);
      }
      for (const id of aeonDef.sharedCommandIds) {
        expect(id in ABILITIES, `${aeonDef.id} shared -> ${id}`).toBe(true);
      }
    }
  });

  it('OVERDRIVE_MODES lists all 17 modes with a learn-turns entry for every party member', () => {
    expect(Object.keys(OVERDRIVE_MODES).length).toBe(17);
    for (const mode of Object.values(OVERDRIVE_MODES)) {
      for (const key of ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'] as const) {
        expect(typeof mode.learnTurnsByCharacter[key], `${mode.id}.${key}`).toBe('number');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Citation coverage — every file this data agent authored must cite at
// least one research section and carry a confidence tag. Thresholds are
// per-file (not a flat "10", per `data-ffx-enemies.test.ts`'s convention)
// because file size here ranges from a single ability (`overdrive-yuna.ts`)
// to dozens (`statuses/core.ts`) — the bar is "cited at all", not a volume
// target.
// ---------------------------------------------------------------------------

describe('FFX player-data files — citation coverage', () => {
  const files = [
    'abilities/whitemagic-cure.ts',
    'abilities/whitemagic-revival.ts',
    'abilities/whitemagic-protect.ts',
    'abilities/whitemagic-haste-slow.ts',
    'abilities/blackmagic-elemental.ts',
    'abilities/blackmagic-advanced.ts',
    'abilities/special-buffs.ts',
    'abilities/special-utility.ts',
    'abilities/special-rikku.ts',
    'abilities/special-menu-markers.ts',
    'abilities/skill-status-attacks.ts',
    'abilities/skill-breaks-misc.ts',
    'abilities/overdrive-tidus.ts',
    'abilities/overdrive-auron.ts',
    'abilities/overdrive-wakka-1.ts',
    'abilities/overdrive-wakka-2.ts',
    'abilities/overdrive-lulu-1.ts',
    'abilities/overdrive-lulu-2.ts',
    'abilities/overdrive-kimahri-1.ts',
    'abilities/overdrive-kimahri-2.ts',
    'abilities/overdrive-yuna.ts',
    'aeons/abilities-core.ts',
    'aeons/abilities-core-2.ts',
    'aeons/abilities-optional.ts',
    'aeons/abilities-optional-2.ts',
    'aeons/index.ts',
    'overdrives/modes.ts',
    'mixes/abilities.ts',
    'mixes/abilities-restoratives.ts',
    'mixes/abilities-wards.ts',
    'mixes/abilities-boosts.ts',
    'mixes/abilities-ordnance.ts',
    'mixes/recipes.ts',
    'items/restoratives-1.ts',
    'items/restoratives-2.ts',
    'items/cures-utility-1.ts',
    'items/cures-utility-2.ts',
    'items/cures-utility-3.ts',
    'items/offensive-1a.ts',
    'items/offensive-1b.ts',
    'items/offensive-2a.ts',
    'items/offensive-2b.ts',
    'statuses/core.ts',
    'statuses/stacks-and-flags.ts',
    'characters/index.ts',
  ];

  it.each(files)('%s cites at least one research section (§) and a confidence tag', (relPath) => {
    const path = fileURLToPath(new URL(`../../src/data/ffx/${relPath}`, import.meta.url));
    const text = readFileSync(path, 'utf8');
    const sectionCitations = text.match(/§[\d.]+/g) ?? [];
    expect(sectionCitations.length, `${relPath} section citation count`).toBeGreaterThanOrEqual(1);
    // The confidence tag doesn't have to open the bracket (some files write
    // `[ffx-combat-core §6.1, verified: 2 sources]`, others `[verified: 2
    // sources]` right after the citation) — just require one of the three
    // house tags to appear as a bracketed phrase somewhere in the file.
    expect(/\[[^\]]*(decompiled|verified|single source|estimate)[^\]]*\]/i.test(text), `${relPath} confidence tag`).toBe(
      true,
    );
  });
});
