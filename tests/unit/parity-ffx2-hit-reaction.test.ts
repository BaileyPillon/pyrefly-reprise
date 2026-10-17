/**
 * **Re-parity lane X2-A, slice 1: the hit reaction** (FFX-2 only; note FFX2-G01, live game 2026-10-13).
 *
 * Three groups:
 * 1. The kernels (`kernel/hit-reaction.ts`) against the exe's own answers: `tests/fixtures/parity/ffx2/hit_reaction.json` is a stratified sample of
 *    the proof logs (comparator, chooser, animation ratio, 24 worlds of the per-step update) and always runs. With `PYREFLY_X2A_PROOF=<proof folder>`
 *    (the folder holding `x1_comparator.jsonl`, `x3_chooser.jsonl`, `x5_speed.jsonl`) and `PYREFLY_X2A_WORLDS=<worlds file>` it replays every vector:
 *    20,000 comparator, 30,000 chooser, 20,000 ratio and 3,000 worlds (93,000 character updates).
 * 2. The data (`data/ffx2/hit-reaction-frames.ts`): pinned against the numbers of the note's tables, the order of a girl's sets and the three live Mascot
 *    lengths that fix the scheduling offset.
 *
 * The wiring (the window, the halved-tick span, the forced hit and Haste, per body) is `ffx2-hit-reaction-wiring.test.ts`.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  animationRatio,
  chainUpdate,
  chooseReaction,
  interruptMask,
  keepsChainAlive,
  type ChooserInput,
  type RatioInput,
  type ReactionTarget,
} from '../../src/battle/ffx2/kernel/hit-reaction.ts';
import { HIT_REACTION_SCHEDULING_STEPS } from '../../src/battle/ffx2/constants.ts';
import * as hrf from '../../src/data/ffx2/hit-reaction-frames.ts';

// ---------------------------------------------------------------------------------------------------
// 1. The kernels against the exe
// ---------------------------------------------------------------------------------------------------

interface Vector {
  id: number;
  class: string;
  in: any;
  out: any;
}

const fixture = JSON.parse(readFileSync(new URL('../fixtures/parity/ffx2/hit_reaction.json', import.meta.url), 'utf8')) as { vectors: Vector[] };

const owner = (i: number): number => ({ 3: 0, 4: 0, 5: 1, 6: 1, 7: 2, 8: 2 } as Record<number, number>)[i] ?? i;

function maskOf(v: any): number {
  return interruptMask({ e6d: v.e6d, e6e: v.e6e, e6f: v.e6f, e70: v.e70, queueCount: v.e66, actionState: v.atype, stopped: v.stop !== 0, petrified: (v.status & 2) !== 0 }, v.l1, v.l2);
}

function targetOf(d: any, actionState: number): ReactionTarget {
  return {
    e6d: d.e6d, e6e: d.e6e, e6f: d.e6f, e70: d.e70, queueCount: d.e66, actionState, e71: d.e71, runningTag: d.d30, skip: d.x663, runningClass: d.d40, redirect: d.redirect,
    stopped: d.stop !== 0, petrified: (d.status & 2) !== 0,
  };
}

function chooserInput(v: any): ChooserInput {
  return {
    kind: v.kind, extra: v.p4, callFlags: v.p5, resultFlags: v.p6, redirected: v.p7 !== 0, targetSlot: v.t_slot,
    target: targetOf(v.T, v.T_atype), animator: targetOf(v.O, v.O_atype), queuePending: v.queue_pending, deathStarted: v.death_ret, requestAccepted: v.req_ret,
  };
}

function chooserMatches(v: any, emu: any): boolean {
  const plan = chooseReaction(chooserInput(v));
  return plan.returned === emu.ret && JSON.stringify(plan.death) === JSON.stringify(emu.death) && JSON.stringify(plan.request) === JSON.stringify(emu.req) && plan.freeze === emu.d58;
}

function ratioInput(v: any): RatioInput {
  return {
    motion: v.p3, freezeTest: v.p4 !== 0, paused: v.pause !== 0,
    self: { motionType: v.self.flags758, freeze: v.self.d58, inBattle: v.self.f1784 !== 0, partyFlag: v.self.f1788 !== 0, fixedOn: v.self.b2e4, fixedRatio: v.self.w2e6 },
    root: { status1: v.root.status, stop: v.root.stop, haste: v.root.haste !== 0, slow: v.root.slow !== 0, fixedOn: v.root.b2e4, fixedRatio: v.root.w2e6, base: v.root.w2e0 },
  };
}

/** One world of 31 characters through the per-step update; returns the number of updates that disagree with the exe. */
function worldMismatches(world: any[], emu: number[][]): number {
  let bad = 0;
  world.forEach((c, i) => {
    const o = world[owner(i)];
    const got = chainUpdate({ chain: c.chain, damageInFlight: c.d98, freeze: c.d58, stoppedOrPetrified: o.stop !== 0 || o.petr !== 0 });
    const want = emu[i];
    if (want === undefined || got.chain !== want[0] || got.freeze !== want[1]) bad += 1;
  });
  return bad;
}

describe('the kernels agree with the exe (the committed sample of the proof)', () => {
  const of = (cls: string): Vector[] => fixture.vectors.filter((v) => v.class === cls);

  it('the priority comparator: every sampled vector', () => {
    const vs = of('interrupt_mask');
    expect(vs.length).toBeGreaterThan(200);
    expect(vs.filter((v) => maskOf(v.in) !== v.out)).toEqual([]);
  });

  it('the chooser: every sampled vector, request, death attempt, freeze counter and return value', () => {
    const vs = of('choose_reaction');
    expect(vs.length).toBeGreaterThan(400);
    expect(vs.filter((v) => !chooserMatches(v.in, v.out)).map((v) => v.id)).toEqual([]);
    // the sample reaches every tag the chooser can ask for, and the two-step freeze
    const tags = new Set(vs.map((v) => v.out.req?.[1]).filter((t) => t !== undefined));
    expect([...tags].sort((a, b) => a - b)).toEqual([2, 3, 23, 24, 25, 26, 27, 30, 63]);
    expect(vs.some((v) => v.out.d58 === 2)).toBe(true);
  });

  it('the animation ratio: every sampled vector, and Haste is 2.0', () => {
    const vs = of('animation_ratio');
    expect(vs.length).toBeGreaterThan(250);
    expect(vs.filter((v) => animationRatio(ratioInput(v.in)) !== v.out).map((v) => v.id)).toEqual([]);
    expect(new Set(vs.map((v) => v.out)).has(0x200)).toBe(true);
  });

  it('the per-step update: every character of every sampled world', () => {
    const vs = of('chain_update_world');
    expect(vs.length).toBe(24);
    expect(vs.reduce((a, v) => a + worldMismatches(v.in, v.out), 0)).toBe(0);
  });
});

const PROOF = process.env['PYREFLY_X2A_PROOF'];
const WORLDS = process.env['PYREFLY_X2A_WORLDS'];

describe.skipIf(PROOF === undefined || !existsSync(join(PROOF, 'x3_chooser.jsonl')))('the kernels agree with the exe (the whole proof, PYREFLY_X2A_PROOF)', () => {
  const rows = (file: string): any[] => readFileSync(join(PROOF as string, file), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

  it('comparator: 20,000 vectors', () => {
    const vs = rows('x1_comparator.jsonl');
    expect(vs.length).toBe(20000);
    expect(vs.filter((v) => maskOf(v.in) !== v.emu).length).toBe(0);
  });

  it('chooser: 30,000 vectors', () => {
    const vs = rows('x3_chooser.jsonl');
    expect(vs.length).toBe(30000);
    expect(vs.filter((v) => !chooserMatches(v.in, v.emu)).length).toBe(0);
  }, 120_000);

  it('animation ratio: 20,000 vectors', () => {
    const vs = rows('x5_speed.jsonl');
    expect(vs.length).toBe(20000);
    expect(vs.filter((v) => animationRatio(ratioInput(v.in)) !== v.emu).length).toBe(0);
  });

  it.skipIf(WORLDS === undefined || !existsSync(WORLDS ?? ''))('per-step update: 3,000 worlds, 93,000 character updates', () => {
    const worlds = readFileSync(WORLDS as string, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
    expect(worlds.length).toBe(3000);
    expect(worlds.reduce((a, w) => a + worldMismatches(w.w, w.emu), 0)).toBe(0);
  });
});

describe('the kernels, by hand', () => {
  it('the chain lives exactly as long as the damage tag is in flight, and the freeze counter falls first', () => {
    expect(chainUpdate({ chain: 3, damageInFlight: 1, freeze: 0, stoppedOrPetrified: false })).toEqual({ chain: 3, freeze: 0 });
    expect(chainUpdate({ chain: 3, damageInFlight: 0, freeze: 0, stoppedOrPetrified: false })).toEqual({ chain: 0, freeze: 0 });
    expect(chainUpdate({ chain: 3, damageInFlight: 0, freeze: 2, stoppedOrPetrified: false })).toEqual({ chain: 3, freeze: 1 });
    expect(chainUpdate({ chain: 3, damageInFlight: 0, freeze: 1, stoppedOrPetrified: false })).toEqual({ chain: 0, freeze: 0 });
    expect(chainUpdate({ chain: 3, damageInFlight: 2, freeze: 0, stoppedOrPetrified: true })).toEqual({ chain: 0, freeze: 0 });
  });

  it('kinds 3, 4, 8 and 13 to 16 keep a chain alive; the others do not', () => {
    const keeping = [...Array(20).keys()].filter(keepsChainAlive);
    expect(keeping).toEqual([3, 4, 8, 13, 14, 15, 16]);
  });
});

// ---------------------------------------------------------------------------------------------------
// 2. The data
// ---------------------------------------------------------------------------------------------------

describe('the data (note FFX2-G01 section 7.3)', () => {
  it("pins the bosses' table: dmg1 / hdmg1 by motion set", () => {
    const boss: Record<number, [number, number]> = {
      0x10a8: [51, 81], 0x10a6: [34, 55], 0x10a4: [39, 50], 0x10a7: [57, 65], 0x10a9: [40, 40], 0x10aa: [30, 57], 0x10ab: [44, 59], 0x10ac: [30, 30],
      0x10ad: [60, 60], 0x10b0: [35, 36], 0x10b1: [32, 32], 0x1102: [20, 33], 0x1104: [30, 30], 0x1081: [50, 50], 0x1082: [32, 32], 0x1083: [30, 30],
      0x10c2: [22, 22], 0x111a: [16, 16], 0x111b: [16, 16], 0x111f: [16, 16], 0x1122: [10, 10], 0x1127: [15, 15],
    };
    for (const [set, clips] of Object.entries(boss)) expect(hrf.MONSTER_CLIP_FRAMES[Number(set)], `set 0x${Number(set).toString(16)}`).toEqual(clips);
  });

  it("a girl's sets: 17 a girl, in the order of her jobs, 51 in all, every one with clips", () => {
    for (const girl of ['yuna', 'rikku', 'paine'] as const) {
      const sets = hrf.GIRL_MOTION_SETS[girl];
      expect(sets.length).toBe(17);
      for (const s of sets) expect(hrf.GIRL_CLIP_FRAMES[s], `${girl} set 0x${s.toString(16)}`).toBeDefined();
    }
    expect(Object.keys(hrf.GIRL_CLIP_FRAMES).length).toBe(51);
    // the pods' motion-set numbers run in step across the three girls
    expect([hrf.GIRL_MOTION_SETS.yuna[15], hrf.GIRL_MOTION_SETS.rikku[15], hrf.GIRL_MOTION_SETS.paine[15]]).toEqual([0x44, 0x45, 0x46]);
    expect([hrf.GIRL_MOTION_SETS.yuna[16], hrf.GIRL_MOTION_SETS.rikku[16], hrf.GIRL_MOTION_SETS.paine[16]]).toEqual([0x3ce, 0x3cf, 0x3d0]);
    // the one girl set whose critical clip differs from the normal one
    expect(hrf.GIRL_CLIP_FRAMES[0x2b]).toEqual([35, 32]);
  });

  it('the scheduling offset is 1: the three live Mascot lengths fit it and no other offset', () => {
    // Q1 of the live session of 2026-10-13: Yuna 31 steps, Paine 37, Rikku (Hasted, animations at 2.0) 15.
    const live = { yuna: 31, paine: 37, rikku: 15 };
    const clip = (girl: 'yuna' | 'rikku' | 'paine'): number => (hrf.GIRL_CLIP_FRAMES[hrf.GIRL_MOTION_SETS[girl][(hrf.DRESSPHERE_SLOT['mascot'] as number) - 1] as number] as hrf.ClipFrames)[0];
    expect([clip('yuna'), clip('paine'), clip('rikku')]).toEqual([30, 36, 28]);
    for (const k of [0, 1, 2, 3]) {
      const fits = clip('yuna') + k === live.yuna && clip('paine') + k === live.paine && clip('rikku') / 2 + k === live.rikku;
      expect(fits, `offset ${k}`).toBe(k === 1);
    }
    expect(HIT_REACTION_SCHEDULING_STEPS).toBe(1);
  });

  it("Chapter V's Shuyin is row 260, the 30-frame set; the 135-frame set belongs to an inert record no unit is built from", () => {
    expect(hrf.MONSTER_MOTION_SET[260]).toBe(0x1104);
    expect(hrf.MONSTER_CLIP_FRAMES[0x1104]).toEqual([30, 30]);
    expect(Object.values(hrf.MONSTER_MOTION_SET)).not.toContain(0x1125);
  });
});
