/**
 * MF-18, the cut-side anchor, in the smear director on a fake host with the real `PoseBlend` (lane pc-scope, 2026-10-28; `motion/CutAnchor.ts`, `SmearDirector.ts`; both games): a plane cut across far-apart
 * heads draws the incoming plane back toward the old head and eases it home; `?cutanchor=today` (the default) moves nothing; `moving` only for a figure that travels; a plane given another painting loses
 * its glide. The pure parts are in `pc-scope-cut-anchor.test.ts`, the real actor in `engine/pc-scope-cut-anchor-actor.test.ts`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PoseBlend } from '../../src/engine/PoseBlend.ts';
import type { Footprint } from '../../src/engine/PoseAlign.ts';
import { setCurvesChapter } from '../../src/engine/motion/CurvesSwitch.ts';
import { GLIDE_MS_MAX, setCutAnchorMode, type CutAnchorMode } from '../../src/engine/motion/CutAnchor.ts';
import { SmearDirector, type SmearHost } from '../../src/engine/motion/SmearDirector.ts';
import { resetSmearLog, smearLog } from '../../src/engine/motion/SmearLog.ts';
import { CUT_AT, MIN_SPEED } from '../../src/engine/motion/SmearPlan.ts';
import { setSmearStyle } from '../../src/engine/motion/SmearSwitch.ts';
import { resetSwapLog } from '../../src/engine/motion/SwapLog.ts';
import { setCauseMode, setStanceMode, setSwapScope, type CauseMode } from '../../src/engine/motion/SwapSwitch.ts';
import { setMenuHold } from '../../src/engine/motion/MenuHold.ts';
import { setAlignedSwap } from '../../src/engine/PoseSwap.ts';

afterEach(() => {
  setCutAnchorMode(null);
  setSmearStyle(null);
  setCurvesChapter(undefined);
  setCauseMode(null, null);
  setStanceMode(null);
  setSwapScope(null);
  setMenuHold(null);
  setAlignedSwap(null);
  resetSmearLog();
  resetSwapLog();
});

// ------------------------------------------------------------------ the director, on a fake host

const H = 1.8;
const SOLID = { w: 4, h: 4, bits: new Uint8Array(16).fill(1) };
const W = 3;
/** A plane 3 world units wide centred at `cx` whose registered head sits `off` world units to the right of its middle (on the silhouette: the planes are solid): its anchor is at `cx + off`. */
const footprint = (cx: number, off: number): Footprint => {
  const u = 0.5 + off / W;
  return { cx, cy: H / 2, width: W, height: H, mirror: 1, mask: SOLID, head: [u - 0.05, 0.05, u + 0.05, 0.15] };
};

interface FakePlane {
  fade: number;
  pose: string;
  mesh: { scale: { x: number; y: number } };
  material: { uniforms: Record<string, undefined> };
}

interface Rig {
  dir: SmearDirector;
  planes: [FakePlane, FakePlane];
  blend: PoseBlend;
  fp: Footprint[];
  shifts: Array<[number, number]>;
  align: [number, number];
  /** The painting `pose` is asked for, the way `PaintedActor.setPose` does it: the blend, the incoming plane given its painting with its head `off` world units right of the idle's (its drift reset), then the director. */
  ask(pose: string, off: number, cx?: number): void;
  /** One frame of `ms` real ms: the blend, then the director's step (the actor's order). */
  frame(ms?: number): void;
}

function rig(withShift = true): Rig {
  const mk = (pose: string, fade: number): FakePlane => ({ fade, pose, mesh: { scale: { x: 1, y: H } }, material: { uniforms: {} as Record<string, undefined> } });
  const planes: [FakePlane, FakePlane] = [mk('idle', 1), mk('', 0)];
  const blend = new PoseBlend(planes);
  const fp = [footprint(0, 0), footprint(0, 0)];
  const shifts: Array<[number, number]> = [];
  const align: [number, number] = [0, 0];
  let active: 0 | 1 = 0;
  const cells = { smearAmt: { value: 0 }, smearStyle: { value: 0 }, smearVec: { value: { set: () => undefined } } };
  const host: SmearHost = {
    name: () => 'auron',
    worldHeight: () => H,
    planes,
    cells,
    blend,
    showing: () => active,
    poseOf: (i) => planes[i]!.pose,
    footprintOf: (i) => fp[i]!,
    canCut: () => true,
    flash: () => undefined,
    flashBlocked: () => false,
    ...(withShift ? { shiftPlane: (i: 0 | 1, dx: number) => { shifts.push([i, dx]); align[i] = dx; } } : {}),
  };
  const dir = new SmearDirector(host);
  const r: Rig = {
    dir,
    planes,
    blend,
    fp,
    shifts,
    align,
    ask(pose, off, cx = 0) {
      const plan = blend.request(pose, 120, active);
      if (plan.same) throw new Error('the fake host asked for the pose it already shows');
      planes[plan.to]!.pose = pose;
      fp[plan.to] = footprint(cx, off);
      align[plan.to] = 0; // applyPose
      active = plan.to;
      dir.swap(plan.to, pose);
    },
    frame(ms = 1000 / 60) {
      blend.advance(ms);
      dir.step(ms);
      dir.track(0, 0, ms / 1000, ms / 1000);
    },
  };
  return r;
}

function setUp(mode: CutAnchorMode, cause: CauseMode = 'cut'): void {
  setSmearStyle('paint');
  setCurvesChapter('seymour-flux');
  setCauseMode(cause);
  setCutAnchorMode(mode);
}

describe('the director: ?cutanchor=today is release 67\'s cut', () => {
  it('a hit that is a cut across 0.33 of the height moves no plane and logs no glide', () => {
    setUp('today');
    const r = rig();
    r.ask('hurt', 0.33 * H);
    expect(smearLog()).toHaveLength(1);
    expect(smearLog()[0]).toMatchObject({ cause: 'hit', to: 'hurt' });
    expect(smearLog()[0]!.glide).toBeUndefined();
    expect(r.shifts).toEqual([]);
    for (let i = 0; i < 20; i++) r.frame();
    expect(r.shifts).toEqual([]);
  });
});

describe('the director: ?cutanchor=on', () => {
  it('draws the incoming plane back so 0.12 of the height is left at the cut, logs it, and eases it home to exactly 0', () => {
    setUp('on');
    const r = rig();
    const d = 0.33 * H; // heads 0.33 of the height apart (under the 0.4 line of a cause cut at rest)
    r.ask('hurt', d);
    expect(smearLog()).toHaveLength(1);
    const e = smearLog()[0]!;
    expect(e).toMatchObject({ cause: 'hit', from: 'idle', to: 'hurt', anchorDistance: expect.closeTo(0.33, 6) });
    expect(e.glide).toEqual({ share: 0.21, ms: GLIDE_MS_MAX }); // 0.21 of the height over the cap: the longest glide
    expect(r.shifts).toHaveLength(1);
    const [plane, dx] = r.shifts[0]!;
    expect(plane).toBe(1);
    expect(dx).toBeCloseTo(-(0.33 - 0.12) * H, 9);
    expect(Math.abs(d + dx)).toBeCloseTo(0.12 * H, 9); // what is left of the head step at the cut
    const seen: number[] = [dx];
    for (let i = 0; i < 40 && r.dir['glide'].active; i++) {
      r.frame();
      seen.push(r.align[1]);
    }
    expect(r.align[1]).toBe(0);
    expect(r.shifts.at(-1)).toEqual([1, 0]);
    // monotonic, never past zero, the first glide step the biggest
    for (let k = 1; k < seen.length; k++) expect(Math.abs(seen[k]!)).toBeLessThanOrEqual(Math.abs(seen[k - 1]!) + 1e-12);
    expect(seen.every((v) => v <= 0)).toBe(true);
    const steps = seen.slice(1).map((v, k) => Math.abs(v - seen[k]!)).filter((s) => s > 0);
    expect(steps[0]).toBeGreaterThan(steps.at(-1)!);
    // the glide ends within the hold, the glide and a frame of slack
    expect(seen.length * (1000 / 60)).toBeLessThanOrEqual((e.cutMs * CUT_AT + e.glide!.ms) + 2 * (1000 / 60) + 1);
  });

  it('a head step under the cap is left as it is: no shift, no glide in the log', () => {
    setUp('on');
    const r = rig();
    r.ask('hurt', 0.1 * H);
    expect(smearLog()).toHaveLength(1);
    expect(smearLog()[0]!.glide).toBeUndefined();
    expect(r.shifts).toEqual([]);
  });

  it('works toward the old head from the left too', () => {
    setUp('on');
    const r = rig();
    r.ask('hurt', -0.3 * H);
    expect(r.shifts[0]![1]).toBeCloseTo((0.3 - 0.12) * H, 9);
  });

  it('a host without shiftPlane gets no anchor and nothing breaks', () => {
    setUp('on');
    const r = rig(false);
    r.ask('hurt', 0.33 * H);
    expect(smearLog()).toHaveLength(1);
    expect(smearLog()[0]!.glide).toBeUndefined();
    for (let i = 0; i < 10; i++) r.frame();
  });

  it('is not made with ?swap=aligned on (it drifts the same field)', () => {
    setUp('on');
    setAlignedSwap(true);
    const r = rig();
    r.ask('hurt', 0.33 * H);
    expect(r.shifts).toEqual([]);
  });

  it('does not touch a swap that is not a cut: a blend at rest (the recovery of a big pair keeps today\'s blend under pick)', () => {
    setUp('on', 'pick');
    const r = rig();
    r.ask('hurt', 0.33 * H);
    for (let i = 0; i < 40; i++) r.frame();
    r.shifts.length = 0;
    resetSmearLog();
    r.ask('idle', 0); // hurt back to idle: `recover`, a pair the planner calls big, at rest: no smear, no cut
    expect(smearLog()).toHaveLength(0);
    expect(r.shifts).toEqual([]);
  });

  it('a swap that follows a swap counts the drift the outgoing plane still carries: the head it shows is where the step is measured from', () => {
    setUp('on');
    const r = rig();
    r.ask('hurt', 0.35 * H); // incoming head at +0.35 H, drawn back to +0.12 H: shift -0.23 H on plane 1
    expect(r.shifts[0]).toEqual([1, expect.closeTo(-0.23 * H, 9)]);
    // 3 frames later the glide is under way; the next cut returns to the idle head at 0 (as placed 0.35 H away: under the 0.4 line of a cause cut at rest)
    for (let i = 0; i < 3; i++) r.frame();
    const carried = r.align[1]; // negative, a little less than 0.23 H
    expect(carried).toBeLessThan(-0.05 * H);
    expect(carried).toBeGreaterThan(-0.23 * H);
    r.shifts.length = 0;
    r.blend.advance(200); // the first blend is over
    r.ask('cast', 0);
    const visibleOut = 0.35 * H + carried; // the head the outgoing plane SHOWS, not the one it is registered at
    const step = 0 - visibleOut; // the new head is to the left of the outgoing head as drawn
    const [, dx] = r.shifts.find(([i]) => i === 0)!;
    expect(Math.abs(step + dx)).toBeCloseTo(0.12 * H, 6);
    expect(dx).toBeGreaterThan(0);
    expect(dx).toBeLessThan(0.23 * H); // not the 0.23 H it would be if the drift on the outgoing plane were forgotten
    // the first glide keeps easing on the plane that is going out, and is dropped when it ends
    for (let i = 0; i < 40; i++) r.frame();
    expect(r.align[1]).toBe(0);
    expect(r.align[0]).toBe(0);
  });
});

describe('the director: ?cutanchor=moving', () => {
  it('a cut on a figure at rest is left alone; the same cut on a figure travelling gets the anchor', () => {
    setUp('moving');
    const rest = rig();
    rest.ask('hurt', 0.33 * H);
    expect(rest.shifts).toEqual([]);
    expect(smearLog()[0]!.glide).toBeUndefined();
    resetSmearLog();
    const run = rig();
    for (let i = 0; i < 12; i++) run.dir.track(i * 0.06, 0, 1 / 60, 1 / 60); // 3.6 world units a second: 2 body heights a second
    run.ask('hurt', 0.33 * H);
    expect(run.shifts).toHaveLength(1);
    expect(smearLog()[0]!.glide).toBeDefined();
    expect(smearLog()[0]!.speed).toBeGreaterThanOrEqual(MIN_SPEED);
  });
});

describe('the director: a plane given another painting loses its glide', () => {
  it('the drift the actor reset is not written back', () => {
    setUp('on');
    const r = rig();
    r.ask('hurt', 0.33 * H);
    expect(r.dir['glide'].active).toBe(true);
    r.planes[1]!.pose = 'cast'; // the actor re-pointed the plane (applyPose reset its drift)
    r.align[1] = 0;
    r.shifts.length = 0;
    for (let i = 0; i < 20; i++) r.frame();
    expect(r.shifts).toEqual([]);
    expect(r.dir['glide'].active).toBe(false);
  });
});
