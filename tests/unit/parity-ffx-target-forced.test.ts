/**
 * Parity tests for the FFX forced turns (`src/battle/ffx/kernel/forced-turn.ts`; re-parity RC4 lane FFX-G, **FFX only**).
 *
 * Source: FFX.exe, Steam build 25501027, the Berserk and Confuse turn (`pp_BtlConfuseBerserkTurn`, VA 0x00799ac0) and the Provoke turn
 * (`pp_BtlProvokeTurn`, VA 0x00799d50); spec `research/re-ffx-targeting.md` section 4.6. The hand-worked cases are the note's worked
 * example E9 and its Provoke rules; the last block replays `target_confberserk.json` and `target_provoke.json`, runs of the game's own
 * machine code (23,000 vectors each against an independent model, 0 mismatches; these files hold a stratified subset) with the queued
 * record's command and mask and every draw compared.
 */

import { describe, expect, it } from 'vitest';
import { confuseBerserkTurn, provokeTurn } from '../../src/battle/ffx/kernel/forced-turn.ts';
import { PermBit } from '../../src/battle/ffx/kernel/status-types.ts';
import { type TargetCommand, type TargetSlot, type TargetWorld, slotsOf } from '../../src/battle/ffx/kernel/target-world.ts';
import { commandOfVector, inputOf, scriptedPick, targetFixture, worldOfVector } from './helpers/ffxTargetFixtures.ts';

function world(slots: Record<number, TargetSlot>): TargetWorld {
  const out: Array<TargetSlot | undefined> = new Array<TargetSlot | undefined>(31).fill(undefined);
  for (const [k, v] of Object.entries(slots)) out[Number(k)] = v;
  return out;
}
const here = (over: TargetSlot = {}): TargetSlot => ({ inBattle: 1, targetable: 1, only: 0xff, hp: 100, defAtk: 0x3000, ...over });
const ATTACK: TargetCommand = { b1a: 0x02, b1b: 0x04, misc: 0, b20: 1, hits: 1 };
const noDraw = () => {
  throw new Error('no draw expected');
};

describe('the Berserk and Confuse turn (0x799ac0)', () => {
  it('E9: Tidus 0, Lulu 5, Rikku 6 and monsters 20, 21 on Lulu\'s turn: Berserk draws 0, 1, 2 -> monsters 20, 21, 20; Confuse draws 0, 1, 2 -> Tidus, Lulu herself, Rikku', () => {
    const w = world({ 0: here(), 5: here(), 6: here(), 0x14: here(), 0x15: here() });
    const berserk = [0, 1, 2].map((d) => confuseBerserkTurn(w, 5, 0, ATTACK, (stream, slots) => {
      expect(stream).toBe(4);
      return slots[d % slots.length] as number;
    }));
    expect(berserk.map((t) => slotsOf(t.mask)[0])).toEqual([0x14, 0x15, 0x14]);
    const confuse = [0, 1, 2].map((d) => confuseBerserkTurn(w, 5, 1, ATTACK, (stream, slots) => {
      expect(stream).toBe(4);
      return slots[d % slots.length] as number;
    }));
    expect(confuse.map((t) => slotsOf(t.mask)[0])).toEqual([0, 5, 6]);
    expect(confuse.every((t) => t.ret === -1 && t.command === 0x3000)).toBe(true);
  });

  it('a lone candidate is hit with no draw; an empty set, or a default attack id of 0, drops the turn (an empty record)', () => {
    const lone = world({ 5: here(), 0x14: here() });
    expect(confuseBerserkTurn(lone, 5, 0, ATTACK, noDraw)).toEqual({ ret: -1, command: 0x3000, mask: 1 << 0x14 });
    expect(confuseBerserkTurn(lone, 5, 1, ATTACK, noDraw)).toEqual({ ret: -1, command: 0x3000, mask: 1 << 5 }); // Confused and alone: she swings at herself
    expect(confuseBerserkTurn(world({ 5: here() }), 5, 0, ATTACK, noDraw)).toEqual({ ret: -2, command: 0xff, mask: 0 });
    expect(confuseBerserkTurn(world({ 5: here({ defAtk: 0 }), 0x14: here() }), 5, 0, ATTACK, noDraw)).toEqual({ ret: -2, command: 0xff, mask: 0 });
  });
});

describe('the Provoke turn (0x799d50)', () => {
  const w = (over: Record<number, TargetSlot> = {}): TargetWorld =>
    world({ 0: here(), 1: here(), 0x14: here({ perm: PermBit.Provoke, provokedBy: 1 }), 0x15: here(), ...over });

  it('a Provoked monster swings its default attack at the provoker alone, and no draw is made', () => {
    expect(provokeTurn(w(), 0x14, ATTACK)).toEqual({ ret: -1, command: 0x3000, mask: 1 << 1, perm: PermBit.Provoke });
  });

  it('a provoker who is out of battle, dead or Petrified has the bit cleared and nothing is queued, also for an actor that keeps control', () => {
    for (const gone of [{ inBattle: 0 }, { dead: 1 }, { stoned: 1 }]) {
      const dropped = provokeTurn(w({ 1: here(gone) }), 0x14, ATTACK);
      expect(dropped).toEqual({ ret: 0, command: 0, mask: 0, perm: 0 });
      const keeper = provokeTurn(w({ 1: here(gone), 0x14: here({ perm: PermBit.Provoke, provokedBy: 1, keeps: 1 }) }), 0x14, ATTACK);
      expect(keeper.perm).toBe(0);
      expect(keeper.ret).toBe(0);
    }
  });

  it('an actor that keeps control when Provoked ignores it, the bit staying set (after the provoker test passes)', () => {
    const keeper = w({ 0x14: here({ perm: PermBit.Provoke, provokedBy: 1, keeps: 1 }) });
    expect(provokeTurn(keeper, 0x14, ATTACK)).toEqual({ ret: 0, command: 0, mask: 0, perm: PermBit.Provoke });
  });

  it('a provoker the default attack cannot be aimed at (untargetable) drops the turn: an empty record, the bit kept', () => {
    expect(provokeTurn(w({ 1: here({ targetable: 0 }) }), 0x14, ATTACK)).toEqual({ ret: -2, command: 0xff, mask: 0, perm: PermBit.Provoke });
  });

  it('a group-target default attack goes to the provoker\'s group, an all-target one to the whole legal set', () => {
    const grouped = world({
      0: here({ group: 1 }), 1: here({ group: 1 }), 2: here({ group: 2 }),
      0x14: here({ perm: PermBit.Provoke, provokedBy: 0 }),
    });
    expect(slotsOf(provokeTurn(grouped, 0x14, { ...ATTACK, b1a: 0x02 | 0x4 }).mask)).toEqual([0, 1]);
    expect(slotsOf(provokeTurn(grouped, 0x14, { ...ATTACK, b1a: 0x02 | 0x8 }).mask)).toEqual([0, 1, 2]);
  });
});

describe('golden vectors: the game\'s own forced turns', () => {
  const read = (v: { out: Record<string, unknown> }): { ret: number; command: number; mask: number; perm: number } => ({
    ret: v.out['ret'] as number,
    command: (v.out['command'] as number | undefined) ?? -1,
    mask: (v.out['mask'] as number | undefined) ?? -1,
    perm: v.out['perm'] as number,
  });

  it('target_confberserk.json: the return value, the queued command and mask, and the draws agree on every vector', () => {
    const fx = targetFixture('target_confberserk');
    for (const v of fx.vectors) {
      const i = inputOf(fx, v.in) as { user: number; side: 0 | 1; cmd: Record<string, number>; chrs: Record<string, Record<string, number>> };
      const s = scriptedPick(v.rngDraws);
      const got = confuseBerserkTurn(worldOfVector(i.chrs), i.user, i.side, commandOfVector(i.cmd), s.pick);
      const want = read(v);
      const label = `vector ${v.id} (${v.class})`;
      expect(got.ret, `${label} return`).toBe(want.ret);
      if (want.command !== -1) {
        expect(got.command, `${label} command`).toBe(want.command);
        expect(got.mask >>> 0, `${label} mask`).toBe(want.mask >>> 0);
      }
      expect(s.used(), `${label} draws`).toBe(v.rngDraws?.length ?? 0);
    }
  });

  it('target_provoke.json: the return value, the cleared bit, the queued command and mask agree on every vector', () => {
    const fx = targetFixture('target_provoke');
    let forced = 0;
    for (const v of fx.vectors) {
      const i = inputOf(fx, v.in) as { user: number; cmd: Record<string, number>; chrs: Record<string, Record<string, number>> };
      const got = provokeTurn(worldOfVector(i.chrs), i.user, commandOfVector(i.cmd));
      const want = read(v);
      const label = `vector ${v.id} (${v.class})`;
      expect(got.ret, `${label} return`).toBe(want.ret);
      expect(got.perm, `${label} permanent word`).toBe(want.perm);
      if (want.command !== -1) {
        expect(got.command, `${label} command`).toBe(want.command);
        expect(got.mask >>> 0, `${label} mask`).toBe(want.mask >>> 0);
      }
      if (got.ret === -1) forced += 1;
      expect(v.rngDraws?.length ?? 0, 'the Provoke turn makes no draw').toBe(0);
    }
    expect(forced).toBeGreaterThan(100);
  });
});
