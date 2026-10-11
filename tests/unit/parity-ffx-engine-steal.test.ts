/**
 * **Engine-level parity, Steal** (re-parity W5; **FFX only**).
 *
 * `parity-ffx-steal-rewards.test.ts` proves the game's steal function against FFX.exe. This file proves the wiring:
 * `steal.ts#resolveSteal` (what a Steal or a Mug does to a monster) on generated situations, against the rules of the
 * research note written out again here (`research/re-ffx-overdrive-steal-aeons.md` section 3.1), so nothing is read from
 * the kernel or the adapter:
 *
 * 1. the chance is a BYTE: 255 for a table that says 100 percent, halved after every success (`max(1, chance * 50 / 100)`),
 *    255, 127, 63, 31, 15, 7, 3, 1, 1, ... and never 0, where the old percent roll (100, 50, 25, 12, 6, 3, 1, 0) could never
 *    steal again from the eighth steal;
 * 2. the success roll is the first draw, `% 255 < chance`; a failed roll changes nothing; the rarity roll is a second draw
 *    made only after a success, `& 0xff` below 0x20 (0x80 with Pickpocket, always with Master Thief);
 * 3. a Mug that missed draws the success roll and then does nothing (the miss cancels the steal after the draw).
 */

import { describe, expect, it } from 'vitest';
import type { FFXCombatant, ItemDrop } from '../../src/battle/common/types.ts';
import { resolveSteal } from '../../src/battle/ffx/steal.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { fighter, stats } from './ffx-fixtures.test.ts';
import { ScriptedRng, contextOf, makeRng } from './helpers/ffxEngineWiring.ts';

const COMMON: ItemDrop = { itemId: 'potion', count: 3, chance: 100 } as ItemDrop;
const RARE: ItemDrop = { itemId: 'elixir', count: 1, chance: 12 } as ItemDrop;

interface Table { baseChance: number; stealRate?: number; common: ItemDrop; rare: ItemDrop }

function field(table: Table | undefined, autos: readonly string[], raws: number[]) {
  const thief = fighter({ id: 'rikku', side: 'party', stats: stats() });
  thief.equipment = { weapon: { name: 'W', slots: 4, autoAbilities: [...autos] as never }, armor: { name: 'A', slots: 1, autoAbilities: [] } };
  const foe = fighter({ id: 'foe', side: 'enemy', stats: stats() }) as FFXCombatant;
  foe.enemy = { rewards: { steal: table } } as unknown as FFXCombatant['enemy'];
  const rng = new ScriptedRng(raws);
  const { ctx, events } = contextOf(thief, foe, rng, 0);
  return { ctx, events, thief, foe, rng };
}

/** The rule written out: the chance byte after `n` successes. */
function chanceByte(table: Table, n: number): number {
  let c = table.stealRate ?? Math.round((table.baseChance * 255) / 100);
  for (let i = 0; i < n && c > 0; i++) c = Math.max(1, Math.floor((c * 50) / 100));
  return c;
}

describe('the chance schedule is the game\'s byte, not a percent', () => {
  const table: Table = { baseChance: 100, common: COMMON, rare: RARE };

  it('255, 127, 63, 31, 15, 7, 3, 1, 1, 1: never 0, so a monster can be stolen from after the eighth steal', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => chanceByte(table, n))).toEqual([255, 127, 63, 31, 15, 7, 3, 1, 1, 1]);
    for (let n = 0; n < 12; n++) {
      const c = chanceByte(table, n);
      // a roll equal to the chance fails and changes nothing; a roll one below it succeeds and counts
      const fail = field(table, [], [c, 5]);
      rtOf(fail.ctx, 'foe').stealCount = n;
      expect(resolveSteal(fail.ctx, fail.thief, fail.foe), `steal ${n} at roll ${c}`).toBe(c >= 255 ? true : false);
      if (c < 255) expect(rtOf(fail.ctx, 'foe').stealCount).toBe(n);
      const win = field(table, [], [c - 1, 5]);
      rtOf(win.ctx, 'foe').stealCount = n;
      expect(resolveSteal(win.ctx, win.thief, win.foe), `steal ${n} at roll ${c - 1}`).toBe(true);
      expect(rtOf(win.ctx, 'foe').stealCount).toBe(n + 1);
    }
  });

  it('a table that says 100 percent is the byte 255: the first attempt never fails, whatever the draw', () => {
    for (const raw of [0, 1, 127, 254, 255, 256, 0x7fffffff]) {
      const f = field(table, [], [raw, 5]);
      expect(resolveSteal(f.ctx, f.thief, f.foe), `raw ${raw}`).toBe(true);
    }
  });
});

describe('500 generated steals: the draws, the item, the count', () => {
  it('equal the rules written out', () => {
    const rng = makeRng(20261013);
    const seen = { common: 0, rare: 0, fail: 0, missed: 0, pick: 0, master: 0, stealRate: 0, zero: 0 };
    for (let i = 0; i < 500; i++) {
      const table: Table = {
        baseChance: rng.pick([100, 100, 100, 60, 25]),
        ...(rng.next() < 0.15 ? { stealRate: rng.pick([0, 1, 40, 130, 255]) } : {}),
        common: { ...COMMON, count: rng.pick([1, 2, 5]) },
        rare: { ...RARE, itemId: 'elixir', count: rng.pick([1, 3]) },
      };
      const pick = rng.next() < 0.2;
      const master = rng.next() < 0.1;
      const missed = rng.next() < 0.12;
      const n = rng.int(0, 9);
      const raws = [rng.int(0, 0x7fffffff), rng.int(0, 0x7fffffff)];
      const f = field(table, [...(pick ? ['pickpocket'] : []), ...(master ? ['master-thief'] : [])], raws);
      rtOf(f.ctx, 'foe').stealCount = n;
      const took = resolveSteal(f.ctx, f.thief, f.foe, missed);

      const chance = chanceByte(table, n);
      const success = !missed && raws[0]! % 255 < chance;
      const thr = master ? 256 : pick ? 0x80 : 0x20;
      const rare = success && (raws[1]! & 0xff) < thr;
      expect(took, `situation ${i}`).toBe(success);
      expect(rtOf(f.ctx, 'foe').stealCount, `count ${i}`).toBe(success ? n + 1 : n);
      // the draws: the success roll always (a miss cancels the steal after it), the rarity roll only after a success
      expect(f.rng.calls.map((c) => c.max), `draws ${i}`).toEqual(success ? [254, 255] : [254]);
      const item = rare ? table.rare : table.common;
      expect(f.ctx.rt.inventory.get(item.itemId) ?? 0, `item ${i}`).toBe(success ? item.count : 0);
      if (!success) expect(f.ctx.rt.inventory.size).toBe(0);
      if (success && rare) seen.rare++;
      if (success && !rare) seen.common++;
      if (!success && !missed) seen.fail++;
      if (missed) seen.missed++;
      if (pick) seen.pick++;
      if (master) seen.master++;
      if (table.stealRate !== undefined) seen.stealRate++;
      if (chance === 0) seen.zero++;
    }
    for (const [k, v] of Object.entries(seen)) expect(v, `the sample reached ${k}`).toBeGreaterThanOrEqual(5);
  });

  it('a monster with no steal table says so and draws nothing; a Mug that missed says nothing', () => {
    const none = field(undefined, [], [3]);
    expect(resolveSteal(none.ctx, none.thief, none.foe)).toBe(false);
    expect(none.rng.calls).toHaveLength(0);
    expect(none.events.some((e) => e['type'] === 'message' && String(e['text']).includes('Nothing to steal'))).toBe(true);
    const missed = field({ baseChance: 100, common: COMMON, rare: RARE }, [], [3]);
    expect(resolveSteal(missed.ctx, missed.thief, missed.foe, true)).toBe(false);
    expect(missed.rng.calls).toHaveLength(1);
    expect(missed.events.filter((e) => e['type'] === 'message')).toHaveLength(0);
  });
});
