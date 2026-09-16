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

import { ABILITIES, ITEMS, FFX_STATUSES, CHARACTERS, AEONS, OVERDRIVE_MODES } from '../../src/data/ffx/index.ts';

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
