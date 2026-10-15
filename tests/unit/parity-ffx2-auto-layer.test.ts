/**
 * Kernel parity for FFX-2's automatic statuses and counters (re-parity X2-D; **FFX-2 only**): the HP state, the saturating
 * add, the automatic status copy, the SOS check (`kernel/sos-layer.ts`) and the counter check with its can-act test
 * (`kernel/counter-check.ts`).
 *
 * Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), functions 0x00619fc0, 0x00624d60, 0x00636920, 0x006362e0,
 * 0x00641360, 0x006491d0; note FFX2-G04 sections 3.1 to 3.3 and 3.6. A vector is the answer of the REAL game function, run in the
 * emulator harness on the live exe; the files are a stratified pick of the vectors that matched with no difference (89,184 for the
 * layer, 30,000 for the counter check, of which 8,676 queue a counter). The hand-worked tests below restate the note's own
 * examples with the arithmetic shown.
 *
 * Mutation-checked by hand (scratch, one line at a time, each caught here): the copy adds the SOS set in HP state 0 or 2; the
 * saturating add clamps a 126 down to 125; the copy ignores the stored HP state when it is not forced; the SOS check runs
 * with the flag clear; the SOS check runs the effect check without `notify`; a counter fires on a multi-target row; Magic Counter
 * without `landed`; the can-act test drops Eject or bit 17; the pending system action is ignored; a counter aimed at its own source.
 */

import { describe, expect, it } from 'vitest';
import { counterCheck, type Ffx2CounterTarget } from '../../src/battle/ffx2/kernel/counter-check.ts';
import { automaticStatusCopy, hpState, saturatingAdd, sosCheck, type Ffx2AutoLayerChr } from '../../src/battle/ffx2/kernel/sos-layer.ts';
import { arr, inOf, kernelCheck, num, outOf, sub, vectorsOf, type Rec } from './helpers/ffx2AtbAdapters.ts';

function chrOf(r: Rec, flag = 0): Ffx2AutoLayerChr {
  return {
    hp: num(r, 'hp'), maxHp: num(r, 'maxHp'), kept: num(r, 'kept'), keptCnt: arr(r, 'keptCnt'), sos: num(r, 'sos'), sosCnt: arr(r, 'sosCnt'),
    flag: (r['flag'] as number | undefined) ?? flag, eff: num(r, 'eff'), effCnt: arr(r, 'effCnt'), hpPrev: num(r, 'hpPrev'),
  };
}

describe('golden vectors: the HP state, the saturating add, the automatic status copy and the SOS check (tests/fixtures/parity/ffx2/auto_layer.json)', () => {
  const fx = kernelCheck('auto_layer');

  it('the fixture is there and is a pick of every group', () => {
    expect(fx).not.toBeNull();
    for (const cls of ['hp_state', 'sat_add', 'copy', 'sos']) expect(vectorsOf(fx!, cls).length, cls).toBeGreaterThan(90);
  });

  it('the HP state (0x00619fc0): 2 below 1, 1 under a third, else 0', () => {
    for (const v of vectorsOf(fx!, 'hp_state')) expect({ state: hpState(num(inOf(v), 'hp'), num(inOf(v), 'maxHp')) }, `vector ${v.id}`).toEqual(v.out);
  });

  it('the saturating add (0x00624d60), bounds -125 and 125', () => {
    for (const v of vectorsOf(fx!, 'sat_add')) expect({ sum: saturatingAdd(num(inOf(v), 'a'), num(inOf(v), 'b')) }, `vector ${v.id}`).toEqual(v.out);
  });

  it('the automatic status copy (0x00636920), forced and not', () => {
    const copies = vectorsOf(fx!, 'copy');
    expect(copies.some((v) => outOf(v)['ret'] === 0)).toBe(true);
    expect(copies.some((v) => outOf(v)['ret'] === 1 && num(sub(inOf(v), 'chr'), 'sos') !== 0)).toBe(true);
    for (const v of copies) {
      const r = automaticStatusCopy(chrOf(sub(inOf(v), 'chr')), num(inOf(v), 'force') !== 0);
      expect({ ret: r.ret, eff: r.eff, effCnt: r.effCnt, hpPrev: r.hpPrev }, `vector ${v.id}`).toEqual(v.out);
    }
  });

  it('the SOS check (0x006362e0): the copy, then the recompute, then the effect check only when asked', () => {
    const checks = vectorsOf(fx!, 'sos');
    expect(checks.some((v) => (outOf(v)['calls'] as unknown[]).length === 2)).toBe(true);
    for (const v of checks) {
      const slot = num(inOf(v), 'slot');
      const r = sosCheck(chrOf(sub(inOf(v), 'chr')), num(inOf(v), 'notify') !== 0);
      const calls: unknown[] = [];
      if (r.recompute) calls.push(['MsSetStatus', slot, 0xff, 1, 1]);
      if (r.effectCheck) calls.push(['MsStatusEffectCheck', slot]);
      expect({ ret: r.ret, calls, eff: r.eff, hpPrev: r.hpPrev }, `vector ${v.id}`).toEqual(v.out);
    }
  });
});

describe('golden vectors: the counter check and the can-act test (tests/fixtures/parity/ffx2/counter_check.json)', () => {
  const fx = kernelCheck('counter_check');

  it('the fixture is there and has both outcomes', () => {
    expect(fx).not.toBeNull();
    const all = vectorsOf(fx!, 'counter');
    expect(all.length).toBe(300);
    expect(all.filter((v) => outOf(v)['queued'] === true).length).toBeGreaterThan(60);
    expect(all.filter((v) => outOf(v)['queued'] === false).length).toBeGreaterThan(100);
  });

  it('queues the target\'s Attack command at the source alone, or nothing (0x00641360)', () => {
    for (const v of vectorsOf(fx!, 'counter')) {
      const i = inOf(v);
      // The harness made every character its own root, so the root's status word and Stop counter are the character's own.
      const queue = arr(i, 'queueKinds');
      let pending = 0;
      for (let k = 0; k < num(i, 'queueCount'); k++) if (queue[(num(i, 'queueHead') + k) & 7] === 2) pending += 1;
      const target: Ffx2CounterTarget = {
        id: num(i, 'target'), word0: num(i, 'w0'), attackCommand: num(i, 'cmd656'), status1: num(i, 'status'), rootStatus1: num(i, 'status'),
        rootStop: num(i, 'stop'), hitKind: num(i, 'hitKind'), pendingSystem: pending,
      };
      const got = counterCheck(target, num(i, 'source'), { flagsTarget: num(i, 'flagsTarget'), flagsDamage: num(i, 'flagsDamage') }, num(i, 'landed') !== 0);
      const out = got === null ? { queued: false } : { queued: true, command: got.command, mask: got.targetMask };
      expect(out, `vector ${v.id}`).toEqual(v.out);
    }
  });
});

describe('hand-worked from the note', () => {
  const chr = (over: Partial<Ffx2AutoLayerChr>): Ffx2AutoLayerChr => ({
    hp: 1000, maxHp: 9999, kept: 0, keptCnt: new Array<number>(24).fill(0), sos: 0, sosCnt: new Array<number>(24).fill(0), flag: 1,
    eff: 0, effCnt: new Array<number>(24).fill(0), hpPrev: 0, ...over,
  });
  const counts = (entries: Array<[number, number]>): number[] => {
    const a = new Array<number>(24).fill(0);
    for (const [i, n] of entries) a[i] = n & 0xff;
    return a;
  };

  it('HP state 1 is 1 <= HP and HP * 3 < max HP (3.1)', () => {
    // max 9,999: HP 1 to 3,332 is 1 (3,332 * 3 = 9,996 < 9,999) and 3,333 is 0 (9,999 is not below 9,999)
    expect([hpState(1, 9999), hpState(3332, 9999), hpState(3333, 9999)]).toEqual([1, 1, 0]);
    // max 100: 1 to 33; max 1 to 3 never gives 1; a maximum of 0 gives 1 for every HP of 1 or more; below 1 is 2
    expect([hpState(33, 100), hpState(34, 100)]).toEqual([1, 0]);
    expect([1, 2, 3].map((m) => hpState(1, m))).toEqual([0, 0, 0]);
    expect([hpState(1, 0), hpState(5000, 0), hpState(0, 9999), hpState(-4, 9999)]).toEqual([1, 1, 2, 2]);
  });

  it('a count above 125 keeps the larger operand; otherwise the sum is clamped to -125..125 (3.2)', () => {
    expect([saturatingAdd(126, 5), saturatingAdd(5, 127), saturatingAdd(126, 127)]).toEqual([126, 127, 127]);
    expect([saturatingAdd(100, 100), saturatingAdd(-100, -100), saturatingAdd(125, 1)]).toEqual([125, -125, 125]);
    expect(saturatingAdd(-128, -128)).toBe(-125);
  });

  it('SOS statuses are in the effective layer only while the HP state is 1 (SOS Protect: group 2 slot 1, count 126)', () => {
    const base = chr({ sos: 0, sosCnt: counts([[1, 126]]), keptCnt: counts([[0, 126]]), kept: 0, hpPrev: 0 });
    const low = automaticStatusCopy({ ...base, hp: 3000 }, false); // 3,000 * 3 = 9,000 < 9,999: state 1, was 0: refreshed
    expect([low.ret, low.hpPrev, low.effCnt[0], low.effCnt[1]]).toEqual([1, 1, 126, 126]);
    // healed to a third again: state 0, the stored state is 1, so the copy runs and the SOS count is gone; the kept count stays
    const healed = automaticStatusCopy({ ...base, hp: 3400, hpPrev: 1, eff: low.eff, effCnt: low.effCnt }, false);
    expect([healed.ret, healed.hpPrev, healed.effCnt[0], healed.effCnt[1]]).toEqual([1, 0, 126, 0]);
    // dead: state 2 leaves the kept layer only
    const dead = automaticStatusCopy({ ...base, hp: 0, hpPrev: 1, effCnt: low.effCnt }, false);
    expect([dead.ret, dead.hpPrev, dead.effCnt[1]]).toEqual([1, 2, 0]);
    // the same state as last time: nothing, unless forced
    expect(automaticStatusCopy({ ...base, hp: 3000, hpPrev: 1, effCnt: low.effCnt }, false).ret).toBe(0);
    expect(automaticStatusCopy({ ...base, hp: 3000, hpPrev: 1, effCnt: low.effCnt }, true).ret).toBe(1);
  });

  it('the SOS mask is ORed in state 1 only (SOS Critical: group 1 bit 15)', () => {
    const base = chr({ kept: 1 << 13, sos: 1 << 15, hp: 100, maxHp: 9999, hpPrev: 0 });
    expect(automaticStatusCopy(base, false).eff).toBe(((1 << 13) | (1 << 15)) >>> 0);
    expect(automaticStatusCopy({ ...base, hp: 9000 }, true).eff).toBe(1 << 13);
  });

  it('the SOS check does nothing at all with the flag clear, even when the state changed', () => {
    const r = sosCheck(chr({ flag: 0, hp: 100, sos: 1 << 15 }), true);
    expect([r.ret, r.recompute, r.effectCheck, r.eff]).toEqual([0, false, false, 0]);
  });

  it('the SOS check recomputes when the layer changed and tells the effect check only when asked', () => {
    const low = chr({ hp: 100, sos: 1 << 15, hpPrev: 0 });
    expect(sosCheck(low, false)).toMatchObject({ ret: 1, recompute: true, effectCheck: false });
    expect(sosCheck(low, true)).toMatchObject({ ret: 1, recompute: true, effectCheck: true });
    expect(sosCheck({ ...low, hpPrev: 1 }, true)).toMatchObject({ ret: 0, recompute: false, effectCheck: false });
  });
});

describe('counter check, hand-worked (3.6)', () => {
  const girl = (over: Partial<Ffx2CounterTarget> = {}): Ffx2CounterTarget => ({
    id: 2, word0: 0x4, attackCommand: 0x302d, status1: 0, rootStatus1: 0, rootStop: 0, hitKind: 1, pendingSystem: 0, ...over,
  });
  const PHYS = { flagsTarget: 0, flagsDamage: 1 };
  const MAGIC = { flagsTarget: 0, flagsDamage: 2 };

  it('a physical single-target result on a Counterattack holder queues her Attack at the source alone', () => {
    expect(counterCheck(girl(), 17, PHYS, true)).toEqual({ actor: 2, command: 0x302d, targetMask: 1 << 17 });
    expect(counterCheck(girl(), 30, PHYS, true)?.targetMask).toBe((1 << 30) >>> 0);
  });

  it('Evade & Counter alone also gives the physical counter; Magic Counter does not', () => {
    expect(counterCheck(girl({ word0: 0x8 }), 17, PHYS, true)).not.toBeNull();
    expect(counterCheck(girl({ word0: 0x10 }), 17, PHYS, true)).toBeNull();
  });

  it('Magic Counter needs a magical-only row and something that landed', () => {
    expect(counterCheck(girl({ word0: 0x10 }), 17, MAGIC, true)).not.toBeNull();
    expect(counterCheck(girl({ word0: 0x10 }), 17, MAGIC, false)).toBeNull();
    expect(counterCheck(girl({ word0: 0x4 }), 17, MAGIC, true)).toBeNull();
    // a row with both damage bits or neither never counters
    expect(counterCheck(girl({ word0: 0x1c }), 17, { flagsTarget: 0, flagsDamage: 3 }, true)).toBeNull();
    expect(counterCheck(girl({ word0: 0x1c }), 17, { flagsTarget: 0, flagsDamage: 0 }, true)).toBeNull();
  });

  it('a row that aims at several targets (bit 2) or at self (bit 3) never counters', () => {
    expect(counterCheck(girl(), 17, { flagsTarget: 0x4, flagsDamage: 1 }, true)).toBeNull();
    expect(counterCheck(girl(), 17, { flagsTarget: 0x8, flagsDamage: 1 }, true)).toBeNull();
    expect(counterCheck(girl(), 17, { flagsTarget: 0x80, flagsDamage: 1 }, true)).not.toBeNull();
  });

  it('she must be able to act: Confusion, Eject and bit 17 on her own word; asleep, petrified or Stopped on her root', () => {
    for (const status1 of [0x40, 0x400, 0x20000]) expect(counterCheck(girl({ status1 }), 17, PHYS, true), `own ${status1}`).toBeNull();
    for (const rootStatus1 of [0x4, 0x2]) expect(counterCheck(girl({ rootStatus1 }), 17, PHYS, true), `root ${rootStatus1}`).toBeNull();
    expect(counterCheck(girl({ rootStop: 1 }), 17, PHYS, true)).toBeNull();
    // a Silence (0x8) or Poison (0x20) word does not stop her
    expect(counterCheck(girl({ status1: 0x28 }), 17, PHYS, true)).not.toBeNull();
  });

  it('never against herself, never to a result of a counter, never with a system action already waiting', () => {
    expect(counterCheck(girl(), 2, PHYS, true)).toBeNull();
    expect(counterCheck(girl({ hitKind: 2 }), 17, PHYS, true)).toBeNull();
    expect(counterCheck(girl({ pendingSystem: 1 }), 17, PHYS, true)).toBeNull();
  });
});
