/**
 * Parity tests for the FFX target sets (`src/battle/ffx/kernel/legal-set.ts` and the picker in `target-world.ts`; re-parity RC4 lane
 * FFX-G, **FFX only**).
 *
 * Source: FFX.exe, Steam build 25501027: the picker `pp_BtlPickTarget` (VA 0x007acd40), the legal target set (0x00799820), the group pick
 * (0x00799910) and the auto-target (0x007996d0); spec `research/re-ffx-targeting.md` sections 4.4 to 4.6. The hand-worked cases state the
 * rule in the file's own terms; the last block replays `target_pick.json`, `target_legal.json`, `target_group.json` and
 * `target_auto.json`, runs of the game's own machine code (25,240, 28,000, 16,000 and 28,000 vectors against an independent model, 0
 * mismatches; these files hold a stratified subset of each) with every draw's stream and order compared.
 */

import { describe, expect, it } from 'vitest';
import { autoTargetMask, commandReach, groupPick, legalSet, sideMask } from '../../src/battle/ffx/kernel/legal-set.ts';
import { type TargetCommand, type TargetSlot, type TargetWorld, pickOne, slotsOf } from '../../src/battle/ffx/kernel/target-world.ts';
import { commandOfVector, inputOf, scriptedPick, targetFixture, worldOfVector } from './helpers/ffxTargetFixtures.ts';

function world(slots: Record<number, TargetSlot>): TargetWorld {
  const out: Array<TargetSlot | undefined> = new Array<TargetSlot | undefined>(31).fill(undefined);
  for (const [k, v] of Object.entries(slots)) out[Number(k)] = v;
  return out;
}
const here = (over: TargetSlot = {}): TargetSlot => ({ inBattle: 1, targetable: 1, only: 0xff, hp: 100, ...over });
/** A single-target, opposite-side command that ordinary actors may be aimed at (the plain Attack's shape). */
const ATTACK: TargetCommand = { b1a: 0x02, b1b: 0x04, misc: 0, b20: 1, hits: 1 };
const noDraw = () => {
  throw new Error('no draw expected');
};

describe('the picker (0x7acd40)', () => {
  it('no candidate reports 0xff and draws nothing; one candidate reports it and draws nothing', () => {
    expect(pickOne(0, 4, noDraw)).toBe(0xff);
    expect(pickOne(0x80000000, 4, noDraw)).toBe(0xff); // bit 31 is ignored
    expect(pickOne(1 << 22, 4, noDraw)).toBe(22);
  });

  it('two or more candidates draw once on the stream and take the one of rank value mod count, ascending', () => {
    const seen: Array<[number, number[]]> = [];
    const pick = (stream: number, slots: readonly number[]): number => {
      seen.push([stream, [...slots]]);
      return slots[100 % slots.length] as number;
    };
    expect(pickOne((1 << 3) | (1 << 9) | (1 << 21), 5, pick)).toBe(9); // 100 % 3 = 1 -> the second: slot 9
    expect(seen).toEqual([[5, [3, 9, 21]]]);
  });
});

describe('the legal target set (0x799820)', () => {
  it('a side is its slots in battle and not removed; the dead flag, Targetable and reach take slots out', () => {
    const w = world({
      0: here(), 1: here({ dead: 1 }), 2: here({ targetable: 0 }), 3: here({ removed: 1 }), 4: here({ far: 1 }), 5: { targetable: 1 },
      0x14: here(), 0x15: here({ dead: 1 }),
    });
    expect(slotsOf(sideMask(w, 'party'))).toEqual([0, 1, 2, 4]); // 3 removed, 5 not in battle
    // Attack: reach 0, no "can target the dead" bit.
    expect(slotsOf(legalSet(w, 0x14, 'party', 0x3000, ATTACK))).toEqual([0]);
    // The same command with reach 1 reaches slot 4; with the dead bit it takes slot 1 as well.
    const reach1 = { ...ATTACK, b1a: ATTACK.b1a | 0x80 };
    expect(commandReach(0x14, reach1)).toBe(1);
    expect(slotsOf(legalSet(w, 0x14, 'party', 0x3000, reach1))).toEqual([0, 4]);
    expect(slotsOf(legalSet(w, 0x14, 'party', 0x3000, { ...reach1, b1a: reach1.b1a | 0x40 }))).toEqual([0, 1, 4]);
    expect(slotsOf(legalSet(w, 0, 'monster', 0x3000, ATTACK))).toEqual([0x14]);
  });

  it('the user is exempt from the reach test, and bit 0x200 gives reach 3 to the actors 4, 8 and 13 only', () => {
    const w = world({ 4: here({ far: 3 }), 5: here({ far: 3 }), 0x14: here({ far: 3 }) });
    expect(slotsOf(legalSet(w, 4, 'party', 0x3000, ATTACK))).toEqual([4]);
    const long = { ...ATTACK, b1b: ATTACK.b1b | 0x02 };
    expect(commandReach(4, long)).toBe(3);
    expect(commandReach(8, long)).toBe(3);
    expect(commandReach(13, long)).toBe(3);
    expect(commandReach(5, long)).toBe(0);
    expect(slotsOf(legalSet(w, 4, 'monster', 0x3000, long))).toEqual([0x14]);
    expect(slotsOf(legalSet(w, 5, 'monster', 0x3000, long))).toEqual([]);
  });

  it('the target class: 0 needs the ordinary-actor bit, 1 the event-character bit, 2 never, and an only-by id turns a non-zero class into never', () => {
    const w = world({ 0: here({ tclass: 0 }), 1: here({ tclass: 1 }), 2: here({ tclass: 2 }), 3: here({ tclass: 1, only: 0x3001 }), 4: here({ tclass: 5 }) });
    const ordinary = { ...ATTACK, b1b: 0x04 };
    const event = { ...ATTACK, b1b: 0x08 };
    expect(slotsOf(legalSet(w, 0x14, 'party', 0x3000, ordinary))).toEqual([0, 4]);
    expect(slotsOf(legalSet(w, 0x14, 'party', 0x3000, event))).toEqual([1, 4]);
    expect(slotsOf(legalSet(w, 0x14, 'party', 0x3001, event))).toEqual([1, 3, 4]); // the only-by id is this command's
  });
});

describe('the group pick (0x799910) and the auto-target (0x7996d0)', () => {
  it('the group pick draws once on stream 5 (also for one group), none for an empty mask, and returns the members of the chosen group', () => {
    const w = world({ 0x14: here({ group: 2 }), 0x15: here({ group: 5 }), 0x16: here({ group: 2 }) });
    const calls: Array<[number, number[]]> = [];
    const pick = (stream: number, slots: readonly number[]): number => {
      calls.push([stream, [...slots]]);
      return slots[slots.length - 1] as number;
    };
    expect(slotsOf(groupPick(w, (1 << 0x14) | (1 << 0x15) | (1 << 0x16), pick))).toEqual([0x15]);
    expect(calls).toEqual([[5, [2, 5]]]);
    calls.length = 0;
    expect(slotsOf(groupPick(w, (1 << 0x14) | (1 << 0x16), pick))).toEqual([0x14, 0x16]);
    expect(calls).toEqual([[5, [2]]]); // one populated group still draws
    expect(groupPick(w, 0, noDraw)).toBe(0);
  });

  it('Berserk aims at the opposite side, Confuse at its own side with the actor in it; a monster user reads the same flag the other way round', () => {
    const w = world({ 0: here(), 5: here(), 6: here(), 0x14: here(), 0x15: here() });
    const picks: number[][] = [];
    const first = (stream: number, slots: readonly number[]): number => {
      expect(stream).toBe(4);
      picks.push([...slots]);
      return slots[0] as number;
    };
    expect(autoTargetMask(w, 5, 0x3000, 0, ATTACK, first)).toBe(1 << 0x14); // Lulu Berserk: monsters
    expect(autoTargetMask(w, 5, 0x3000, 1, ATTACK, first)).toBe(1 << 0); // Lulu Confused: her own side, the pick took the first of 0, 5, 6
    expect(picks).toEqual([[0x14, 0x15], [0, 5, 6]]);
    expect(autoTargetMask(w, 0x14, 0x3000, 0, ATTACK, first)).toBe(1 << 0); // a monster Berserk: the party
    expect(autoTargetMask(w, 0x14, 0x3000, 1, ATTACK, first)).toBe(1 << 0x14); // a monster Confused: the monsters
  });

  it('a negative side reads the command: opposite side when bit 1 of the first command byte is set, else own side', () => {
    const w = world({ 0: here(), 0x14: here() });
    expect(autoTargetMask(w, 0, 0x3000, -1, ATTACK, noDraw)).toBe(1 << 0x14);
    expect(autoTargetMask(w, 0, 0x3000, -1, { ...ATTACK, b1a: 0x80 }, noDraw)).toBe(1 << 0);
  });

  it('an all-target command takes the whole set, a self-target one the user alone, and a single-target one with nobody left is empty', () => {
    const w = world({ 0: here(), 1: here(), 0x14: here(), 0x15: here({ dead: 1 }) });
    expect(slotsOf(autoTargetMask(w, 1, 0x3000, 0, { ...ATTACK, b1a: 0x02 | 0x8 }, noDraw))).toEqual([0x14]);
    expect(autoTargetMask(w, 1, 0x3000, 0, { ...ATTACK, b1a: 0x02 | 0xc }, noDraw)).toBe(1 << 1);
    expect(autoTargetMask(world({ 0: here() }), 0, 0x3000, 0, ATTACK, noDraw)).toBe(0);
  });
});

describe('golden vectors: the game\'s own picker and target sets', () => {
  it('target_pick.json: the reported slot and the number of draws agree for every candidate count and every residue', () => {
    const fx = targetFixture('target_pick');
    for (const v of fx.vectors) {
      const i = inputOf(fx, v.in) as { mask: number; stream?: number; out?: boolean };
      // Without an output pointer the function only reports the candidate mask and draws nothing; the chain always gives one.
      if (i.out === false) {
        expect(v.out['nDraws'], `vector ${v.class} without an output pointer`).toBe(0);
        continue;
      }
      const s = scriptedPick(v.rngDraws);
      // The residue vectors carry no stream of their own: the draw's recorded stream is the one the call used.
      expect(pickOne(i.mask, i.stream ?? v.rngDraws?.[0]?.stream ?? 0, s.pick), `vector ${v.class}`).toBe(v.out['out']);
      expect(s.used(), `draws of vector ${v.class}`).toBe(v.out['nDraws']);
    }
  });

  it('target_legal.json: the legal set of a side agrees (Targetable, class, only-by, reach, the user exemption, the dead flag)', () => {
    const fx = targetFixture('target_legal');
    for (const v of fx.vectors) {
      const i = inputOf(fx, v.in) as { user: number; sel: number; cmdId: number; cmd: Record<string, number>; chrs: Record<string, Record<string, number>> };
      const got = legalSet(worldOfVector(i.chrs), i.user, i.sel === -14 ? 'party' : 'monster', i.cmdId, commandOfVector(i.cmd));
      expect(got >>> 0, `vector ${v.class} user ${i.user}`).toBe((v.out['mask'] as number) >>> 0);
    }
  });

  it('target_group.json: the chosen group, its members and the single draw agree', () => {
    const fx = targetFixture('target_group');
    for (const v of fx.vectors) {
      const i = inputOf(fx, v.in) as { mask: number; chrs: Record<string, Record<string, number>> };
      const s = scriptedPick(v.rngDraws);
      expect(groupPick(worldOfVector(i.chrs), i.mask, s.pick) >>> 0, `vector ${v.id}`).toBe((v.out['mask'] as number) >>> 0);
      expect(s.used()).toBe(v.out['nDraws']);
    }
  });

  it('target_auto.json: the auto-target mask and its draws (stream 4 single, stream 5 group, none for all or self) agree', () => {
    const fx = targetFixture('target_auto');
    for (const v of fx.vectors) {
      const i = inputOf(fx, v.in) as { user: number; cmdId: number; side: number; cmd: Record<string, number>; chrs: Record<string, Record<string, number>> };
      const s = scriptedPick(v.rngDraws);
      const got = autoTargetMask(worldOfVector(i.chrs), i.user, i.cmdId, i.side, commandOfVector(i.cmd), s.pick);
      expect(got >>> 0, `vector ${v.class} user ${i.user} side ${i.side}`).toBe((v.out['mask'] as number) >>> 0);
      expect(s.used(), 'every scripted draw was taken and no other').toBe(v.rngDraws?.length ?? 0);
    }
  });
});
