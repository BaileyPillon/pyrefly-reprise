/**
 * Biran and Yenke (the hidden FFX chapter): **what the two brothers pay**, played out on the real engine (`research/re-ffx-biran-yenke.md` section 2; FFX only).
 *
 * The game's loot record gives each brother ONE drop slot: the slot's chance byte is 255 (it always drops), the common item is a Return Sphere x1, and the rare item, a Friend Sphere x1, comes in its place when
 * the second draw's low byte is below 0x20 (one time in eight); an Overkill doubles whichever is given. Until re-parity RC9 the engine rolled this on its own side stream (`ItemDrop.rare`), and before that as two
 * independent drops; now it is the game's roll on the loot records m134 and m135 (`adapt/loot.ts`: stream 10 against the chance byte, stream 11 for the rare entry), and the result carries the game's reward list,
 * in which equal items STACK (two Return Spheres are one entry of 2).
 *
 * What is pinned: a brother pays exactly one item, never none and never both; the rare one comes about one time in eight (measured over 300 fights, printed); an Overkill doubles whichever was given; the gil
 * and the AP are the record's; the same seed pays the same.
 */
import { describe, expect, it } from 'vitest';

import type { BattleResult } from '../../../src/battle/common/types.ts';
import * as H from '../helpers/ronsoDrive.ts';

/** Fight to a win on `seed`: both brothers at 1 HP, Kimahri untouchable, a plain Attack on whichever still stands. `strong` makes Kimahri's blows overkills. */
function win(seed: number, strong = false): BattleResult {
  const engine = H.newEngine(seed);
  if (strong) H.actor(engine, H.KIM).stats.str = 255;
  for (let i = 0; i < 400; i++) {
    H.invincible(engine);
    for (const id of [H.BIRAN, H.YENKE]) {
      const brother = H.actor(engine, id);
      if (brother.hp > 1) brother.hp = 1;
    }
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      expect(d.result.outcome, `seed ${seed}`).toBe('victory');
      return d.result;
    }
    if (d.kind !== 'player-input') continue;
    const standing = [H.BIRAN, H.YENKE].filter((id) => H.actor(engine, id).hp > 0);
    engine.submit(H.swing(d, standing[0]!) ?? H.defend());
  }
  throw new Error(`seed ${seed}: no victory`);
}

describe('each brother pays one item from one slot', () => {
  const SEEDS = 300;
  const results = Array.from({ length: SEEDS }, (_, i) => win(i + 1));

  it('pays exactly one Return Sphere or Friend Sphere each: never none, never both, stacked entries', () => {
    for (const [i, r] of results.entries()) {
      expect(r.drops.reduce((n, d) => n + d.count, 0), `seed ${i + 1}: one item a brother`).toBe(2);
      expect(r.drops.length, `seed ${i + 1}: equal items stack, so one entry or two`).toBeLessThanOrEqual(2);
      for (const drop of r.drops) {
        expect(['return-sphere', 'friend-sphere'], `seed ${i + 1}`).toContain(drop.itemId);
        expect(drop, `seed ${i + 1}`).toEqual({ itemId: drop.itemId, count: drop.count }); // the result carries the item given, not the slot's table
      }
      expect(new Set(r.drops.map((d) => d.itemId)).size, `seed ${i + 1}: one stack per item`).toBe(r.drops.length);
      expect(r.overkilled, `seed ${i + 1}: no overkill at 1 HP and a plain blow`).toEqual([]);
    }
  });

  it('gives the rare Friend Sphere about one time in eight (measured), the Return Sphere otherwise', () => {
    const friends = results.reduce((n, r) => n + r.drops.filter((d) => d.itemId === 'friend-sphere').reduce((m, d) => m + d.count, 0), 0);
    const slots = SEEDS * 2;
    console.log(`[biran-yenke rewards] Friend Sphere in ${friends} of ${slots} slots (the record: 1 in 8 = ${slots / 8})`);
    expect(friends).toBeGreaterThan(slots / 8 - 35);
    expect(friends).toBeLessThan(slots / 8 + 35);
    expect(results.some((r) => r.drops.some((d) => d.itemId === 'friend-sphere'))).toBe(true);
    expect(results.some((r) => r.drops.every((d) => d.itemId === 'return-sphere'))).toBe(true);
  });

  it('pays 1,500 gil and 4,500 AP for each brother, and the same seed pays the same', () => {
    for (const r of results.slice(0, 20)) {
      expect(r.gil).toBe(3_000);
      expect(r.ap).toBe(9_000);
    }
    expect(win(7).drops).toEqual(win(7).drops);
  });

  it('doubles whichever item was given on an Overkill, and gives nothing extra', () => {
    let sawOverkill = false;
    for (let seed = 1; seed <= 30; seed++) {
      const r = win(seed, true);
      expect(r.drops.length, `seed ${seed}: one stack per item`).toBeLessThanOrEqual(2);
      const total = r.drops.reduce((n, d) => n + d.count, 0);
      expect(total, `seed ${seed}: 1 an item, 2 for each brother overkilled`).toBe(2 + r.overkilled.length);
      if (r.overkilled.length > 0) sawOverkill = true;
      for (const d of r.drops) expect([1, 2, 3, 4], `seed ${seed}: two brothers, each one item or two`).toContain(d.count);
    }
    expect(sawOverkill, 'a blow of 255 Strength is an overkill on a brother at 1 HP').toBe(true);
  });
});
