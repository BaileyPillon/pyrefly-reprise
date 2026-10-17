/**
 * **The Drain recoil and the action rank** (re-parity RC10, lane FFX hit order, S2 and S3; **FFX only**). Companion of `parity-ffx-hit-order.test.ts`.
 *
 * - S2 is a table written from the private note FFX-H01 section 3.4 step 6 (the append step's three answers: flag 0 with the sums, flag 1 empty, cancelled) and engine boards
 *   (one heal with the summed amount, the position in round 1 by slot, a skipped self-target, a nullified drain).
 * - S3 is the registry: the rank every ability charges, asked of `kernel/ctb.ts#actionRank`, equals the plain rule (the record's rank byte, 0 is 3).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, FFXCombatant, StatusId, StatusInstance } from '../../src/battle/common/types.ts';
import { resolveAbility } from '../../src/battle/ffx/index.ts';
import { recoilGain, recoilRecord } from '../../src/battle/ffx/kernel/recoil.ts';
import { rankOf } from '../../src/battle/ffx/state.ts';
import { actionRank } from '../../src/battle/ffx/kernel/ctb.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { contextOfBoard } from './helpers/ffxTargetBoard.ts';
import { boardOf, striker } from './helpers/ffxHitOrder.ts';

// ------------------------------------------------------------------ S2

describe('S2: the recoil record of an absorb command', () => {
  it('the three answers of the append step, over every combination (the note, 3.4 step 6)', () => {
    for (const landed of [0, 1, 4]) {
      for (const userTargeted of [false, true]) {
        for (const [hp, mp] of [[0, 0], [30, 0], [0, 12], [30, 12], [-20, 0], [-5, 9]] as const) {
          const record = recoilRecord({ hp, mp, landed, userTargeted });
          const want = landed > 0 ? 'sums' : userTargeted ? 'empty' : 'cancelled';
          expect(record.kind, `${landed}/${userTargeted}/${hp}/${mp}`).toBe(want);
          const gain = recoilGain(record);
          if (want === 'sums') expect(gain).toEqual({ hp: Math.max(0, hp), mp: Math.max(0, mp) });
          else expect(gain).toEqual({ hp: 0, mp: 0 });
        }
      }
    }
  });

  const drain = (hits: number, targeting: AbilityDef['targeting'], extra: Partial<Parameters<typeof striker>[0]> = {}): AbilityDef =>
    striker({ id: `drain-${hits}-${targeting}`, hits, targeting, power: 40, flags: ['drains'], ...extra });

  it('a multi-hit drain over two targets heals its user once, with the sum of every hit, in round 1 before the monsters (a party user)', () => {
    const board = boardOf([5000, 5000], ['lulu']);
    const { ctx, events, byId } = contextOfBoard(board, 21);
    const lulu = byId.get('lulu') as FFXCombatant;
    lulu.hp = 50;
    lulu.stats.maxHp = 1_000_000; // room for the whole heal
    resolveAbility(ctx, lulu, drain(3, 'all-enemies'), ['m0', 'm1']);
    const damage = events.filter((e) => e['type'] === 'damage').map((e) => Number(e['amount']));
    const heals = events.filter((e) => e['type'] === 'heal');
    expect(damage.length).toBe(6);
    expect(heals.length).toBe(1);
    expect(heals[0]!['amount']).toBe(damage.reduce((a, b) => a + b, 0));
    expect(heals[0]!['cause']).toBe('drain');
    expect(lulu.hp).toBe(50 + damage.reduce((a, b) => a + b, 0));
    // round 1: the user's record (slot 5) comes before the monsters (slots 0x14 and 0x15)
    expect(events.findIndex((e) => e['type'] === 'heal')).toBeLessThan(events.findIndex((e) => e['type'] === 'damage'));
  });

  it('a monster draining the party heals itself once, after the party\'s round-1 hits', () => {
    const board = boardOf([5000], ['lulu']);
    const { ctx, events, byId } = contextOfBoard(board, 22);
    const m0 = byId.get('m0') as FFXCombatant;
    m0.hp = 10;
    resolveAbility(ctx, m0, drain(2, 'all-enemies'), ['tidus', 'lulu']);
    const types = events.filter((e) => e['type'] === 'damage' || e['type'] === 'heal').map((e) => (e['type'] === 'damage' ? `d:${e['targetId']}` : 'heal'));
    expect(types.filter((t) => t === 'heal').length).toBe(1);
    expect(types.slice(0, 3)).toEqual(['d:tidus', 'd:lulu', 'heal']);
  });

  it('an Osmose drains MP once: the user gains what the targets actually lost', () => {
    const board = boardOf([5000, 5000], ['lulu']);
    const { ctx, events, byId } = contextOfBoard(board, 23);
    const lulu = byId.get('lulu') as FFXCombatant;
    lulu.mp = 0;
    lulu.stats.maxMp = 10_000; // room for the whole gain
    (byId.get('m1') as FFXCombatant).mp = 7; // the second target has less than a hit takes
    const def = striker({ id: 'osmose-2', hits: 2, targeting: 'all-enemies', power: 30, flags: ['drains-mp'], mp: true });
    resolveAbility(ctx, lulu, def, ['m0', 'm1']);
    const lost = events.filter((e) => e['type'] === 'mp-damage').map((e) => Number(e['amount']));
    const gained = events.filter((e) => e['type'] === 'mp-heal');
    expect(lost.length).toBeGreaterThan(0);
    expect(gained.length).toBe(1);
    expect(gained[0]!['amount']).toBe(lost.reduce((a, b) => a + b, 0));
    expect(lulu.mp).toBe(lost.reduce((a, b) => a + b, 0));
  });

  it('a drain aimed at its own user skips that slot: no hit on itself, no recoil from it; the other target still feeds the one record', () => {
    const board = boardOf([5000], ['lulu']);
    const { ctx, events, byId } = contextOfBoard(board, 24);
    const lulu = byId.get('lulu') as FFXCombatant;
    lulu.hp = 100;
    resolveAbility(ctx, lulu, drain(1, 'single-ally'), ['lulu']);
    expect(events.filter((e) => e['type'] === 'damage' || e['type'] === 'heal').length).toBe(0);
    expect(lulu.hp).toBe(100);
    const again = contextOfBoard(boardOf([5000], ['lulu', 'yuna']), 24);
    const user = again.byId.get('lulu') as FFXCombatant;
    user.hp = 100;
    resolveAbility(again.ctx, user, drain(1, 'all-allies'), ['tidus', 'lulu', 'yuna']);
    const damaged = again.events.filter((e) => e['type'] === 'damage').map((e) => e['targetId']);
    expect(damaged).toEqual(['tidus', 'yuna']);
    expect(again.events.filter((e) => e['type'] === 'heal').length).toBe(1);
  });

  it('a drain whose every hit is turned aside (a Nul) heals nothing', () => {
    const board = boardOf([5000]);
    const { ctx, events, byId } = contextOfBoard(board, 25);
    const m0 = byId.get('m0') as FFXCombatant;
    m0.statuses['nulblaze' as StatusId] = { id: 'nulblaze' as StatusId, turnsRemaining: 254, ticksRemaining: null, charges: 99, stacks: 0, permanent: false } satisfies StatusInstance;
    const tidus = byId.get('tidus') as FFXCombatant;
    tidus.hp = 100;
    resolveAbility(ctx, tidus, drain(3, 'single-enemy', { element: ['fire'] }), ['m0']);
    expect(events.filter((e) => e['type'] === 'heal').length).toBe(0);
    expect(tidus.hp).toBe(100);
  });
});

// ------------------------------------------------------------------ S3

describe('S3: the rank an ability charges goes through the game\'s rank rule and equals the plain rule', () => {
  it('every ability of the registry: rankOf equals the record\'s rank byte (0 is 3), or the ability\'s own rank when it has no record', () => {
    expect(ALL_ABILITIES.length).toBeGreaterThan(300);
    let withRecord = 0;
    for (const def of ALL_ABILITIES) {
      const byte = def.record !== undefined ? def.record.rank ?? def.rank : def.rank;
      const plain = byte === undefined || byte <= 0 ? 3 : byte;
      if (def.record !== undefined) withRecord++;
      expect(rankOf(def), def.id).toBe(plain);
    }
    expect(withRecord).toBeGreaterThan(100);
    expect(rankOf(undefined)).toBe(3);
  });

  it('the scan stops at Doublecast, Quick Pockets and Mix whatever follows, takes the last record found, and 3 for none or 0', () => {
    const ranks = new Map<number, number | null>([[0x3029, 3], [0x305f, 1], [0x311e, 5], [0x3010, 4], [0x3011, 7], [0x3012, 0]]);
    const rank = (ids: number[], flag = 0): number => actionRank(ids, flag, (id) => ranks.get(id) ?? null);
    expect(rank([0x3029, 0x3011])).toBe(3);
    expect(rank([0x305f, 0x3011])).toBe(1);
    expect(rank([0x311e, 0x3011])).toBe(5);
    expect(rank([0x3010, 0x3011])).toBe(7);
    expect(rank([0xff, 0x3010])).toBe(4);
    expect(rank([0x3012, 0xff])).toBe(3);
    expect(rank([0x9999, 0xff])).toBe(3);
    expect(rank([0x3010, 0x3011], 1)).toBe(3); // Copycat: both ids become 0x3028, no record in this table
  });
});
