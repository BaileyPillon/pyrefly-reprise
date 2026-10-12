/**
 * Parity tests for FFX Cover and the seven Tidus counters (`src/battle/ffx/kernel/cover.ts`; re-parity RC4 lane FFX-G, **FFX only**).
 *
 * Source: FFX.exe, Steam build 25501027, `pp_BtlFindCover` (VA 0x0078eef0) and `pp_BtlBond` (VA 0x007845e0); spec
 * `research/re-ffx-targeting.md` sections 4.2 and 5. The hand-worked cases are the note's worked examples; the last blocks replay
 * `tests/fixtures/parity/ffx/target_cover.json` and `target_bond.json`, runs of the game's own machine code (28,000 and 12,000 vectors,
 * 0 mismatches against an independent model; these files hold a stratified subset of each).
 */

import { describe, expect, it } from 'vitest';
import { BOND_MAX, bondAdd, bondGet, findCover, newBond } from '../../src/battle/ffx/kernel/cover.ts';
import type { TargetSlot, TargetWorld } from '../../src/battle/ffx/kernel/target-world.ts';
import { ExtraBit, PermBit } from '../../src/battle/ffx/kernel/status-types.ts';
import { denseOf, inputOf, targetFixture, worldOfVector } from './helpers/ffxTargetFixtures.ts';

function world(slots: Record<number, TargetSlot>): TargetWorld {
  const out: Array<TargetSlot | undefined> = new Array<TargetSlot | undefined>(31).fill(undefined);
  for (const [k, v] of Object.entries(slots)) out[Number(k)] = v;
  return out;
}
const guard = (hp: number, over: TargetSlot = {}): TargetSlot => ({ inBattle: 1, hp, extra: ExtraBit.Guard, ...over });
const sentinel = (hp: number, over: TargetSlot = {}): TargetSlot => ({ inBattle: 1, hp, extra: ExtraBit.Sentinel, ...over });

describe('Cover (0x78eef0): who steps in', () => {
  it('E1: a monster hits Yuna; Auron (Sentinel, 500 HP) scores 1000, Kimahri (Guard, 1100) 1100, Tidus (Guard, 600) 600 + half of his counter for Yuna', () => {
    const w = world({ 0: guard(600), 1: { inBattle: 1, hp: 900 }, 2: sentinel(500), 3: guard(1100), 0x14: { inBattle: 1, hp: 9000 } });
    for (const counter of [0, 40, 700]) {
      const bond = newBond();
      bond[1] = counter;
      expect(findCover(w, bond, 0x14, 1), `counter ${counter}`).toBe(3); // 1100 beats 1000 and 600 + 350 = 950
    }
    const bond = newBond();
    bond[1] = 1000; // 600 + 500 = 1100 ties Kimahri's 1100, and Tidus is slot 0: the lowest slot wins a tie
    expect(findCover(w, bond, 0x14, 1)).toBe(0);
    bond[1] = 1001; // 600 + trunc(1001 / 2) = 1100 again
    expect(findCover(w, bond, 0x14, 1)).toBe(0);
    bond[1] = 1002; // 1101
    expect(findCover(w, bond, 0x14, 1)).toBe(0);
  });

  it('E2: cover for Tidus: Yuna (Guard, 400) and Auron (Guard, 500); Yuna\'s counter 0, 100 and 300 give Auron, Auron and Yuna', () => {
    const w = world({ 0: { inBattle: 1, hp: 900 }, 1: guard(400), 2: guard(500), 0x14: { inBattle: 1, hp: 9000 } });
    const bond = newBond();
    expect(findCover(w, bond, 0x14, 0)).toBe(2); // 400 against 500
    bond[1] = 100;
    expect(findCover(w, bond, 0x14, 0)).toBe(2); // 400 + 50 = 450 against 500
    bond[1] = 300;
    expect(findCover(w, bond, 0x14, 0)).toBe(1); // 400 + 150 = 550 against 500
  });

  it('the lowest slot wins a tie, and a candidate must beat the best so far strictly', () => {
    const w = world({ 1: { inBattle: 1, hp: 800 }, 2: guard(700), 3: guard(700), 4: guard(700), 0x14: { inBattle: 1, hp: 1 } });
    expect(findCover(w, newBond(), 0x14, 1)).toBe(2);
  });

  it('Sentinel doubles the HP score, so a Sentinel holder beats a Guard holder with up to twice the HP less', () => {
    const w = world({ 1: { inBattle: 1, hp: 100 }, 2: sentinel(600), 3: guard(1199), 0x14: { inBattle: 1, hp: 1 } });
    expect(findCover(w, newBond(), 0x14, 1)).toBe(2); // 1200 against 1199
    expect(findCover(world({ 1: { inBattle: 1, hp: 100 }, 2: sentinel(600), 3: guard(1201) }), newBond(), 0x14, 1)).toBe(3);
  });

  it('nobody covers the user or the target, a holder that cannot act does not cover, and with nobody the target covers itself', () => {
    const w = world({ 1: guard(500), 2: guard(900, { perm: PermBit.Confuse }), 3: guard(900, { sleep: 2 }), 4: guard(900, { perm: PermBit.Provoke }), 5: guard(900, { perm: PermBit.Threaten }), 6: guard(900, { dead: 1 }), 0x14: { inBattle: 1, hp: 1 } });
    expect(findCover(w, newBond(), 0x14, 2)).toBe(1); // Auron is the target; Yuna is the only one left
    expect(findCover(w, newBond(), 1, 2)).toBe(2); // Yuna is the attacker: nobody else can act, so Auron is his own cover
    expect(findCover(w, newBond(), 0x14, 1)).toBe(1); // Yuna is the target and every other holder is out: she is her own cover
  });

  it('a monster target is covered by monsters (slots 0x14 to 0x1b), a party target by the party', () => {
    const w = world({ 0x14: { inBattle: 1, hp: 10 }, 0x15: guard(5000), 0x16: guard(4000), 1: guard(9999) });
    expect(findCover(w, newBond(), 0, 0x14)).toBe(0x15);
    expect(findCover(w, newBond(), 0x14, 2)).toBe(1);
  });

  it('a negative score never wins (the search starts from -1 and needs a strictly higher score)', () => {
    const w = world({ 1: { inBattle: 1, hp: 10 }, 2: guard(-5), 0x14: { inBattle: 1 } });
    expect(findCover(w, newBond(), 0x14, 1)).toBe(1);
  });
});

describe('the Tidus counters (0x7845e0)', () => {
  it('an index outside 1 to 7 returns 0 and changes nothing; a delta of 0 reads', () => {
    const b = newBond();
    b[3] = 41;
    expect(bondAdd(b, 0, 5)).toBe(0);
    expect(bondAdd(b, 8, 5)).toBe(0);
    expect(bondAdd(b, 4294967295, 5)).toBe(0);
    expect(b).toEqual([0, 0, 0, 41, 0, 0, 0, 0]);
    expect(bondAdd(b, 3, 0)).toBe(41);
    expect(bondGet(b, 3)).toBe(41);
    expect(bondGet(b, 9)).toBe(0);
  });

  it('a sum above 0x0ffffffe is returned but not stored', () => {
    const b = newBond();
    b[2] = BOND_MAX - 1;
    expect(bondAdd(b, 2, 1)).toBe(BOND_MAX);
    expect(b[2]).toBe(BOND_MAX);
    expect(bondAdd(b, 2, 1)).toBe(BOND_MAX + 1);
    expect(b[2]).toBe(BOND_MAX);
  });
});

describe('golden vectors: the game\'s own Cover and counter array', () => {
  it('target_cover.json: every vector agrees (the lowest-slot tie-break, Sentinel, the two Tidus terms, can-act, wild layouts)', () => {
    const fx = targetFixture('target_cover');
    expect(fx.vectors.length).toBeGreaterThanOrEqual(200);
    for (const v of fx.vectors) {
      const i = inputOf(fx, v.in) as { user: number; target: number; bond?: Record<string, number>; chrs: Record<string, Record<string, number>> };
      const bond = denseOf(i.bond, 8);
      const before = [...bond];
      expect(findCover(worldOfVector(i.chrs), bond, i.user, i.target), `vector ${v.class} user ${i.user} target ${i.target}`).toBe(v.out['cover']);
      expect(bond, 'a Cover search reads the counters and never writes them').toEqual(before);
    }
  });

  it('target_bond.json: every vector agrees (index range, the 0x0ffffffe cap, a delta of 0 reads)', () => {
    const fx = targetFixture('target_bond');
    for (const v of fx.vectors) {
      const i = inputOf(fx, v.in) as { bond?: Record<string, number>; idx: number; delta: number };
      const bond = denseOf(i.bond, 8);
      const ret = bondAdd(bond, i.idx | 0, i.delta);
      expect(ret >>> 0, `vector ${v.id}`).toBe((v.out['ret'] as number) >>> 0);
      expect(bond).toEqual(denseOf(v.out['bond'] as Record<string, number>, 8));
    }
  });
});
