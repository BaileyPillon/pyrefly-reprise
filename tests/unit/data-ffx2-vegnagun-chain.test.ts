/**
 * The Vegnagun chain is five battles linked by `nextGroupId` with no menu
 * between [ffx2-vegnagun-shuyin.md §2]: Tail -> Leg -> Body -> Head -> Shuyin.
 * Shuyin is the terminus and must not chain further.
 */

import { describe, expect, it } from 'vitest';

import { ENEMY_GROUPS_BY_ID } from '../../src/data/ffx2/index.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';
import type { EnemyDef } from '../../src/battle/common/types.ts';
import { vegnagunTailGroup } from '../../src/data/ffx2/enemies/vegnagun-tail.ts';
import { vegnagunLegGroup } from '../../src/data/ffx2/enemies/vegnagun-leg.ts';
// Read-only import: `vegnagun-body.ts` (Core + Bulwarks) is owned by another
// track this session; the two `it`s below only assert what it already ships.
import { vegnagunBodyGroup } from '../../src/data/ffx2/enemies/vegnagun-body.ts';
import { vegnagunHeadGroup } from '../../src/data/ffx2/enemies/vegnagun-head.ts';
import { shuyinGroup } from '../../src/data/ffx2/enemies/shuyin.ts';
import { FFX2_ITEMS } from '../../src/data/ffx2/items/index.ts';
import { accessoryEffect } from '../../src/battle/ffx2/accessories.ts';
import { itemLabel } from '../../src/ui/common/resultsMath.ts';

/** Every `EnemyDef` in the chain, boss and parts, keyed by id — one flat lookup for the reward tables below. */
const CHAIN_ENEMIES: Record<string, EnemyDef> = Object.fromEntries(
  [
    ...vegnagunTailGroup.enemies,
    ...vegnagunLegGroup.enemies,
    ...(vegnagunLegGroup.parts ?? []),
    ...vegnagunBodyGroup.enemies,
    ...(vegnagunBodyGroup.parts ?? []),
    ...vegnagunHeadGroup.enemies,
    ...(vegnagunHeadGroup.parts ?? []),
    ...shuyinGroup.enemies,
  ].map((e) => [e.id, e]),
);

describe('Vegnagun -> Shuyin chain', () => {
  it('VEGNAGUN_CHAIN_ORDER walks tail -> leg -> body -> head -> shuyin', () => {
    expect(VEGNAGUN_CHAIN_ORDER).toEqual(['vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head', 'shuyin']);
  });

  it('every link in the chain points to the next, ending at shuyin', () => {
    for (let i = 0; i < VEGNAGUN_CHAIN_ORDER.length - 1; i++) {
      const group = ENEMY_GROUPS_BY_ID[VEGNAGUN_CHAIN_ORDER[i]!];
      expect(group, VEGNAGUN_CHAIN_ORDER[i]).toBeDefined();
      expect(group!.nextGroupId, `${VEGNAGUN_CHAIN_ORDER[i]}.nextGroupId`).toBe(VEGNAGUN_CHAIN_ORDER[i + 1]);
    }
  });

  it('shuyin is the terminus: no further nextGroupId', () => {
    const shuyin = ENEMY_GROUPS_BY_ID['shuyin'];
    expect(shuyin).toBeDefined();
    expect(shuyin!.nextGroupId).toBeUndefined();
  });

  it('bahamut is a standalone encounter, not part of the chain', () => {
    const bahamut = ENEMY_GROUPS_BY_ID['ffx2-bahamut'];
    expect(bahamut).toBeDefined();
    expect(bahamut!.nextGroupId).toBeUndefined();
  });

  it('every Vegnagun/Shuyin group carries the Vegnagun boss-vegnagun or boss-shuyin music cue', () => {
    for (const id of VEGNAGUN_CHAIN_ORDER) {
      const group = ENEMY_GROUPS_BY_ID[id]!;
      const startCue = group.musicCues?.find((c) => c.at === 'start');
      expect(startCue, `${id} start music cue`).toBeDefined();
      expect(['boss-vegnagun', 'boss-shuyin']).toContain(startCue!.track);
    }
  });
});

/**
 * Rewards and steals, transcribed field-for-field from
 * `research/ffx2-vegnagun-shuyin.md` §3.1-§3.5 (line cites per assertion).
 * This is the regression the adversarial fact-check asked for: it would have
 * caught the Tail's and the Head's missing `steal` and the Leg's dangling
 * `x2-mythril-bangle` drop id, all fixed in the same change as this test.
 *
 * Two rows are deliberately **not** asserted to a value the research doesn't
 * give one for — see the Node and Redoubt `it`s below; each says why inline
 * rather than inventing a number [AGENTS.md hard rule 6].
 */
describe('Vegnagun -> Shuyin chain: rewards and steals (research §3)', () => {
  it('Tail (vegnagun-tail): exp/ap/gil/drop/steal, §3.1 lines 203-206', () => {
    const e = CHAIN_ENEMIES['vegnagun-tail']!;
    expect(e.rewards.exp).toBe(5000);
    expect(e.rewards.ap).toBe(5);
    expect(e.rewards.gil).toBe(3000);
    expect(e.rewards.drops).toEqual([{ itemId: 'x2-megalixir', count: 1 }]);
    // §3.1 line 205 — Steal (50%): X-Potion ×4 / rare X-Potion ×6. [verified: 2 sources] (line 212).
    expect(e.rewards.steal).toEqual({
      baseChance: 50,
      common: { itemId: 'x2-x-potion', count: 4 },
      rare: { itemId: 'x2-x-potion', count: 6 },
    });
  });

  it('Leg (vegnagun-leg, the boss part): exp/ap/gil/drop/steal, §3.2 lines 232-234', () => {
    const e = CHAIN_ENEMIES['vegnagun-leg']!;
    expect(e.rewards.exp).toBe(6000);
    expect(e.rewards.ap).toBe(5);
    expect(e.rewards.gil).toBe(3000);
    // §3.2 line 233 — Mythril Bangle ×1. The id is the accessory registry's
    // own key (`src/battle/ffx2/accessories.ts`), as Bahamut's Gris-Gris Bag
    // drop uses `'gris-gris-bag'` (`src/data/ffx2/enemies/bahamut.ts:90`) —
    // not the `x2-` item-table namespace, which has no entry for either.
    expect(e.rewards.drops).toEqual([{ itemId: 'mythril-bangle', count: 1 }]);
    expect(e.rewards.steal).toEqual({
      baseChance: 50,
      common: { itemId: 'x2-elixir', count: 1 },
      rare: { itemId: 'x2-elixir', count: 2 },
    });
  });

  it('Node A/B/C: exp/ap/gil/steal, §3.2 lines 261-263', () => {
    for (const id of ['node-a', 'node-b', 'node-c']) {
      const e = CHAIN_ENEMIES[id]!;
      expect(e.rewards.exp, id).toBe(8000);
      expect(e.rewards.ap, id).toBe(10);
      expect(e.rewards.gil, id).toBe(3000);
      // Common drop only. §3.2 line 262 also lists a rare drop slot ("rare:
      // Hero Drink ×1"), but gives no rate for that slot, and
      // `EnemyRewards['drops']` only carries a rate on `chance` per entry —
      // `src/battle/ffx2/results.ts:86` lists every `drops` entry into the
      // result unconditionally (no roll), so adding the entry would print a
      // Hero Drink on every Node kill, which is not what "rare" means.
      // Left alone; recorded as an open question (research §11).
      expect(e.rewards.drops, id).toEqual([{ itemId: 'x2-megalixir', count: 1 }]);
      expect(e.rewards.steal, id).toEqual({
        baseChance: 50,
        common: { itemId: 'x2-megalixir', count: 1 },
        rare: { itemId: 'x2-megalixir', count: 2 },
      });
    }
  });

  // Read-only: `vegnagun-body.ts` (Core + Bulwarks) belongs to another track
  // this session. This asserts today's shipped values match research and
  // touches nothing in that file.
  it('Body/Core (read-only): exp/ap/gil/drop/steal, §3.3 lines 308-310', () => {
    const e = CHAIN_ENEMIES['vegnagun-body']!;
    expect(e.rewards.exp).toBe(7000);
    expect(e.rewards.ap).toBe(10);
    expect(e.rewards.gil).toBe(3000);
    expect(e.rewards.drops).toEqual([{ itemId: 'x2-megalixir', count: 1 }]);
    expect(e.rewards.steal).toEqual({
      baseChance: 50,
      common: { itemId: 'x2-turbo-ether', count: 1 },
      rare: { itemId: 'x2-turbo-ether', count: 1 },
    });
  });

  // Read-only, same file. §3.3 line 339 gives the drop as one 50% roll
  // between Mega-Potion and rare X-Potion; today's data instead ships two
  // independent 50%-chance entries. That shape difference is `vegnagun-body.ts`'s
  // to resolve, not asserted as a defect here — only that it matches what's
  // shipped today.
  it('Bulwark R/L (read-only): exp/ap/gil/drop/steal, §3.3 lines 338-340', () => {
    for (const id of ['bulwark-r', 'bulwark-l']) {
      const e = CHAIN_ENEMIES[id]!;
      expect(e.rewards.exp, id).toBe(200);
      expect(e.rewards.ap, id).toBe(10);
      expect(e.rewards.gil, id).toBe(150);
      expect(e.rewards.drops, id).toEqual([
        { itemId: 'x2-mega-potion', count: 1, chance: 50 },
        { itemId: 'x2-x-potion', count: 1, chance: 50 },
      ]);
      // Rare slot is `x2-l-bomb`, which resolves in no registry — see the
      // KNOWN_UNRESOLVED exception below. Owned by another track; not fixed here.
      expect(e.rewards.steal, id).toEqual({
        baseChance: 50,
        common: { itemId: 'x2-phoenix-down', count: 1 },
        rare: { itemId: 'x2-l-bomb', count: 1 },
      });
    }
  });

  it('Head (vegnagun-head, the boss part): exp/ap/gil/drop/steal, §3.4 lines 385-387', () => {
    const e = CHAIN_ENEMIES['vegnagun-head']!;
    expect(e.rewards.exp).toBe(0);
    expect(e.rewards.ap).toBe(10);
    expect(e.rewards.gil).toBe(0);
    expect(e.rewards.drops).toEqual([]);
    // §3.4 line 387 documents only "Megalixir ×1" — one item, no separate
    // common/rare wording. The type requires both slots (`EnemyRewards.steal`,
    // `src/battle/common/types.ts:899`), so both hold the same item, exactly
    // as the Body's Turbo Ether and the research's own "common and rare" rows
    // do (Tail, Leg, the boss's own Drop row). [verified: 2 sources] (line 392).
    expect(e.rewards.steal).toEqual({
      baseChance: 50,
      common: { itemId: 'x2-megalixir', count: 1 },
      rare: { itemId: 'x2-megalixir', count: 1 },
    });
  });

  it('Redoubt R/L: exp/ap/gil/drop, §3.4 lines 413-415 — steal deliberately not asserted', () => {
    for (const id of ['redoubt-r', 'redoubt-l']) {
      const e = CHAIN_ENEMIES[id]!;
      expect(e.rewards.exp, id).toBe(0);
      expect(e.rewards.ap, id).toBe(10);
      expect(e.rewards.gil, id).toBe(0);
      expect(e.rewards.drops, id).toEqual([]);
      // §3.4 line 415 names Phoenix Down / rare Mega Phoenix at 50%, but —
      // unlike every other steal row in the document — prints no quantity for
      // either slot, and `ItemDrop.count` is required
      // (`src/battle/common/types.ts:879-885`). Encoding a guessed count would
      // invent a number [AGENTS.md hard rule 6]. Left unset; open question for
      // Bailey (research §11, docs/handoff/NOW.md, 2026-09-21).
    }
  });

  it('Shuyin: exp/ap/gil/drop/steal, §3.5 lines 435-437 (12.5% CONFLICT resolved per §0)', () => {
    const e = CHAIN_ENEMIES['shuyin']!;
    expect(e.rewards.exp).toBe(0);
    expect(e.rewards.ap).toBe(20);
    expect(e.rewards.gil).toBe(0);
    expect(e.rewards.drops).toEqual([]);
    expect(e.rewards.steal).toEqual({
      baseChance: 12.5,
      common: { itemId: 'x2-hero-drink', count: 1 },
      rare: { itemId: 'x2-hero-drink', count: 1 },
    });
  });
});

/**
 * Every drops/steal item id the chain ships should name something a player
 * can look up: an `ItemDef` (`FFX2_ITEMS`) or an accessory
 * (`src/battle/ffx2/accessories.ts`'s `accessoryEffect`) — the two registries
 * `itemLabel` and the accessory stat layer draw on. `x2-l-bomb` is the one
 * confirmed exception: it is the Bulwark record's rare steal
 * (`vegnagun-body.ts`, owned by another track), and it resolves in neither
 * registry, nor under any other spelling checked here (`l-bomb`, `lbomb`,
 * `x2-lbomb` all also miss). `KNOWN_UNRESOLVED` is exhaustive on purpose —
 * the second `it` fails the moment the id starts resolving, so the exception
 * can't quietly go stale.
 */
describe('Vegnagun -> Shuyin chain: item ids resolve somewhere', () => {
  const KNOWN_UNRESOLVED = ['x2-l-bomb'];

  function resolves(itemId: string): boolean {
    return itemId in FFX2_ITEMS || accessoryEffect(itemId) !== undefined;
  }

  it('every drops/steal item id resolves in FFX2_ITEMS or the accessory registry, except KNOWN_UNRESOLVED', () => {
    for (const enemy of Object.values(CHAIN_ENEMIES)) {
      const ids = [
        ...enemy.rewards.drops.map((d) => d.itemId),
        ...(enemy.rewards.steal ? [enemy.rewards.steal.common.itemId, enemy.rewards.steal.rare.itemId] : []),
      ];
      for (const id of ids) {
        if (KNOWN_UNRESOLVED.includes(id)) continue;
        expect(resolves(id), `${enemy.id}: ${id} should resolve in FFX2_ITEMS or the accessory registry`).toBe(true);
      }
    }
  });

  it('KNOWN_UNRESOLVED stays exhaustive: every listed id is still actually unresolved', () => {
    for (const id of KNOWN_UNRESOLVED) {
      expect(resolves(id), `${id} now resolves — shrink KNOWN_UNRESOLVED`).toBe(false);
      // Also checked under the spellings an id-typo fix might land on, so a
      // future fix to l-bomb's *shape* rather than its registry doesn't slip by.
      expect(resolves(id.replace(/^x2-/, ''))).toBe(false);
      expect(resolves(id.replace('-', ''))).toBe(false);
    }
  });
});

/**
 * The player-visible symptom of an unresolved id (`x2-mythril-bangle` before
 * this change): `itemLabel`'s fallback title-cases the raw id, and the `x2-`
 * data-namespace prefix isn't stripped first, so it leaks into the results
 * ledger as a literal "X2" word (`src/ui/common/resultsMath.ts:85-92`).
 * `x2-l-bomb` is excluded — same reason as `KNOWN_UNRESOLVED` above.
 */
describe('Vegnagun -> Shuyin chain: no leaked "x2-" namespace in a displayed label', () => {
  it('itemLabel() of every resolved drops/steal id has no stray "X2" word', () => {
    for (const enemy of Object.values(CHAIN_ENEMIES)) {
      const ids = [
        ...enemy.rewards.drops.map((d) => d.itemId),
        ...(enemy.rewards.steal ? [enemy.rewards.steal.common.itemId, enemy.rewards.steal.rare.itemId] : []),
      ];
      for (const id of ids) {
        if (id === 'x2-l-bomb') continue;
        const label = itemLabel(id);
        expect(label.split(/\s+/), `${enemy.id}: itemLabel(${id}) = "${label}"`).not.toContain('X2');
      }
    }
  });
});
