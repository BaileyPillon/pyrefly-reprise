/**
 * FB-2 (visual-and-feel pass, 2026-10-10; plan item 2; both games): **the stepped dissolve** (`STEPPED_DISSOLVE` in `src/engine/PoseBlend.ts`), the shape of a
 * pose change between two paintings that barely overlap. Bailey's P2-A pick ("I'll go with all your recommendations", ~18:05): the lesser painting never shows
 * more than 0.30, and the pair still shares the screen for most of the blend, so it is a blend and not a cut.
 *
 * The shape is pure arithmetic on two planes' fades, so this file holds it to its numbers, to the strip Bailey saw, and to the properties the plan names:
 * at 30 / 60 / 120 / 144 fps and 400 random phases the lesser plane is never above 0.30 and at least one frame has both above 0.02; and over random request
 * sequences (a request in mid-blend, a reversal, a burst) the cap still holds. The real `PaintedActor` through the same shape, read the way the harness reads
 * it, and the composite of the two planes as pixels, are `pose-blend-composite.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { Easing } from '../../../src/engine/Tween.ts';
import {
  PoseBlend,
  QUAD_IN_OUT,
  STEPPED_AT,
  STEPPED_CAP,
  STEPPED_DISSOLVE,
  poseBlendLegacy,
  poseBlendShape,
  setPoseBlendLegacy,
  type BlendPlane,
  type BlendShapeSpec,
} from '../../../src/engine/PoseBlend.ts';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EPS = 1e-9;
const FPS = [30, 60, 120, 144] as const;
type Idx = 0 | 1;

/** The seam as `PaintedActor.setPose` drives it, on whatever shape `shape` names. */
class Rig {
  readonly planes: [BlendPlane, BlendPlane];
  active: Idx = 0;
  readonly blend: PoseBlend;
  constructor(start: [number, number] = [1, 0], shape: BlendShapeSpec = STEPPED_DISSOLVE, poses: [string, string] = ['idle', '']) {
    this.planes = [
      { fade: start[0], pose: poses[0] },
      { fade: start[1], pose: poses[1] },
    ];
    this.blend = new PoseBlend(this.planes, shape);
  }
  request(key: string, ms: number): ReturnType<PoseBlend['request']> {
    const plan = this.blend.request(key, ms, this.active);
    if (plan.same) return plan;
    if (!plan.reversed) this.planes[plan.to].pose = key;
    this.active = plan.to;
    return plan;
  }
  step(ms: number): void {
    this.blend.advance(ms);
  }
  lesser(): number {
    return Math.min(this.planes[0].fade, this.planes[1].fade);
  }
  keysAbove(min: number): string[] {
    const by = new Map<string, number>();
    for (const p of this.planes) if (p.pose) by.set(p.pose, (by.get(p.pose) ?? 0) + p.fade);
    return [...by].filter(([, f]) => f > min).map(([k]) => k);
  }
}

// ---------------------------------------------------------------- the numbers, and the strip Bailey saw

describe('the stepped dissolve: its numbers', () => {
  it('is the shape of the options page\'s P2-A strip: 40 ms up to 0.30 under the old painting at full, the step to 0.30 and 0.70, 60 ms out and in (the page sampled it at 100 ms)', () => {
    // transcribed from the options page (`motion-options/work/sims.js` SHAPES.A), t in ms
    const page = (t: number): { out: number; inn: number } => {
      if (t < 40) return { out: 1, inn: 0.3 * (t / 40) };
      if (t < 100) {
        const u = (t - 40) / 60;
        return { out: 0.3 * (1 - u), inn: 0.7 + 0.3 * u };
      }
      return { out: 0, inn: 1 };
    };
    for (let t = 0; t <= 120; t += 0.5) {
      const u = t / 100;
      expect(STEPPED_DISSOLVE.out(u), `out at ${t} ms`).toBeCloseTo(page(t).out, 9);
      expect(STEPPED_DISSOLVE.inn(u), `in at ${t} ms`).toBeCloseTo(page(t).inn, 9);
    }
    expect(STEPPED_AT).toBe(0.4);
    expect(STEPPED_CAP).toBe(0.3);
  });

  it('starts at 1 and 0, ends at 0 and 1, and the step trades 1 and 0.30 for 0.30 and 0.70 (the pair still sums to one, so the body does not thin out at the step)', () => {
    expect([STEPPED_DISSOLVE.out(0), STEPPED_DISSOLVE.inn(0)]).toEqual([1, 0]);
    expect([STEPPED_DISSOLVE.out(1), STEPPED_DISSOLVE.inn(1)]).toEqual([0, 1]);
    const before = [STEPPED_DISSOLVE.out(STEPPED_AT - 1e-9), STEPPED_DISSOLVE.inn(STEPPED_AT - 1e-9)];
    const after = [STEPPED_DISSOLVE.out(STEPPED_AT), STEPPED_DISSOLVE.inn(STEPPED_AT)];
    expect(before[0]).toBeCloseTo(1, 12);
    expect(before[1]).toBeCloseTo(0.3, 6);
    expect(after[0]).toBeCloseTo(0.3, 12);
    expect(after[1]).toBeCloseTo(0.7, 12);
    for (let u = 0; u <= 1; u += 0.01) {
      if (u < STEPPED_AT) continue;
      expect(STEPPED_DISSOLVE.out(u) + STEPPED_DISSOLVE.inn(u)).toBeCloseTo(1, 12);
    }
  });

  it('the outgoing curve never rises and the incoming one never falls, and neither leaves 0..1 (also for u outside 0..1)', () => {
    let po = 2;
    let pi = -1;
    for (let u = -0.2; u <= 1.2; u += 0.001) {
      const o = STEPPED_DISSOLVE.out(u);
      const i = STEPPED_DISSOLVE.inn(u);
      expect(o).toBeLessThanOrEqual(po + EPS);
      expect(i).toBeGreaterThanOrEqual(pi - EPS);
      expect(o).toBeGreaterThanOrEqual(0);
      expect(o).toBeLessThanOrEqual(1);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThanOrEqual(1);
      po = o;
      pi = i;
    }
  });

  it('the lesser of the two on the curves is never above the cap, and is exactly the cap at the step: the cap is tight, not vacuous', () => {
    let peak = 0;
    for (let u = 0; u <= 1; u += 0.0005) peak = Math.max(peak, Math.min(STEPPED_DISSOLVE.out(u), STEPPED_DISSOLVE.inn(u)));
    expect(peak).toBeLessThanOrEqual(STEPPED_CAP + EPS);
    expect(peak).toBeGreaterThan(STEPPED_CAP - 0.001);
  });
});

// ---------------------------------------------------------------- the cap at every frame rate and phase

/** One standing-start blend (outgoing at 1, incoming at 0) of `ms`, from `phase` ms into a frame of `1000 / fps`; every frame's two fades. */
function fresh(fps: number, ms: number, phase: number, shape: BlendShapeSpec = STEPPED_DISSOLVE): Array<[number, number]> {
  const rig = new Rig([1, 0], shape);
  rig.request('attack', ms);
  const frame = 1000 / fps;
  const out: Array<[number, number]> = [];
  let step = phase;
  for (let t = 0; t < ms + 2 * frame; t += step, step = frame) {
    rig.step(step);
    out.push([rig.planes[0].fade, rig.planes[1].fade]);
  }
  return out;
}

describe('the stepped dissolve: from a standing start, at 30 / 60 / 120 / 144 fps and 400 random phases', () => {
  for (const ms of [100, 120, 140]) {
    it(`${ms} ms: the lesser plane is never above 0.30, at least one frame has both above 0.02, and the blend lands on 0 and 1`, () => {
      const rnd = mulberry32(ms);
      for (const fps of FPS) {
        const frame = 1000 / fps;
        let peak = 0;
        for (let k = 0; k < 400; k++) {
          const rows = fresh(fps, ms, rnd() * frame);
          let both = 0;
          for (const [a, b] of rows) {
            peak = Math.max(peak, Math.min(a, b));
            if (a > 0.02 && b > 0.02) both++;
          }
          expect(both, `${fps} fps`).toBeGreaterThanOrEqual(1);
          expect(rows[rows.length - 1], `${fps} fps`).toEqual([0, 1]);
        }
        expect(peak, `${fps} fps`).toBeLessThanOrEqual(STEPPED_CAP + EPS);
        if (fps >= 120) expect(peak, `${fps} fps: tight`).toBeGreaterThan(0.28); // at a high frame rate some phase lands next to the step
      }
    });
  }

  it('the harness\'s ghost frames (both above 0.15) at 60 fps and 120 ms are four or fewer from any phase, where the plain dissolve of the same length reads three to five and peaks at 0.5', () => {
    const rnd = mulberry32(60);
    let most = 0;
    let plainPeak = 0;
    for (let k = 0; k < 400; k++) {
      const phase = rnd() * (1000 / 60);
      let n = 0;
      for (const [a, b] of fresh(60, 120, phase)) if (Math.min(a, b) >= 0.15) n++;
      most = Math.max(most, n);
      for (const [a, b] of fresh(60, 120, phase, QUAD_IN_OUT)) plainPeak = Math.max(plainPeak, Math.min(a, b));
    }
    expect(most).toBeLessThanOrEqual(4);
    expect(plainPeak).toBeGreaterThan(0.45); // the guard: today's dissolve does reach the double image the cap removes
  });

  it('is a blend, not a cut, at the lowest frame rate and the longest blend too: 30 fps, 140 ms, every phase has a frame with both above 0.02 and none with the lesser above 0.30', () => {
    for (let k = 0; k < 400; k++) {
      const rows = fresh(30, 140, (k / 400) * (1000 / 30));
      expect(rows.some(([a, b]) => a > 0.02 && b > 0.02)).toBe(true);
      expect(Math.max(...rows.map(([a, b]) => Math.min(a, b)))).toBeLessThanOrEqual(STEPPED_CAP + EPS);
    }
  });
});

// ---------------------------------------------------------------- the cap through requests in mid-blend

describe('the stepped dissolve: a request in mid-blend (FB-1\'s rules, the cap kept)', () => {
  it('ready > attack, then follow 83 ms later (the attack key chain): follow comes up from 0 under the cap, attack goes out from where it stands, ready is gone, no frame above 0.30', () => {
    for (const fps of FPS) {
      const rig = new Rig([1, 0], STEPPED_DISSOLVE, ['ready', '']);
      const frame = 1000 / fps;
      rig.request('attack', 120);
      let t = 0;
      let asked = false;
      let seenLesser = 0;
      while (t < 600) {
        if (!asked && t >= 83) {
          asked = true;
          const attackBefore = rig.planes[rig.active].fade;
          expect(attackBefore).toBeGreaterThan(0.6); // the stronger painting
          const plan = rig.request('follow', 120);
          expect(plan).toMatchObject({ same: false, repoint: true, reversed: false });
          expect(rig.planes[rig.active]).toEqual({ fade: 0, pose: 'follow' });
          expect(rig.keysAbove(0.02)).toEqual(['attack']); // ready was dropped
        }
        rig.step(frame);
        t += frame;
        seenLesser = Math.max(seenLesser, rig.lesser());
        expect(rig.keysAbove(0.02).length).toBeLessThanOrEqual(2);
        expect(rig.keysAbove(0.02).includes('ready') && asked).toBe(false);
      }
      expect(seenLesser, `${fps} fps`).toBeLessThanOrEqual(STEPPED_CAP + EPS);
      expect(rig.planes[rig.active]).toEqual({ fade: 1, pose: 'follow' });
    }
  });

  it('a request that turns the blend round (the flinch that ends mid-fade) keeps the lesser painting at or under the cap in the first half (before the step) and in the second', () => {
    for (const at of [10, 25, 40, 47, 49, 60, 75, 90, 110]) {
      const rig = new Rig();
      rig.request('hurt', 120);
      rig.step(at);
      const pre: [number, number] = [rig.planes[0].fade, rig.planes[1].fade];
      const plan = rig.request('idle', 120);
      if (plan.same) continue; // (the blend had already ended)
      expect(plan).toMatchObject({ reversed: true, repoint: false });
      expect([rig.planes[0].fade, rig.planes[1].fade], `at ${at} ms: not one fade moves at the request`).toEqual(pre);
      for (let f = 0; f < 40; f++) {
        rig.step(1000 / 60);
        expect(rig.lesser(), `turned at ${at} ms, frame ${f}`).toBeLessThanOrEqual(STEPPED_CAP + EPS);
      }
      expect([rig.planes[0].fade, rig.planes[1].fade]).toEqual([1, 0]);
    }
  });

  it('the cap field holds a blend that started above it: the incoming plane stays at most where it was while the outgoing one is above the cap, then the step comes', () => {
    const rig = new Rig([0.6, 0.5], STEPPED_DISSOLVE, ['a', 'b']);
    rig.active = 1;
    rig.request('a', 100); // a reversal onto the stronger painting, both planes up
    const toStart = rig.planes[0].fade;
    for (let t = 5; t < 40; t += 5) {
      rig.step(5); // 5 to 35 ms of 100: before the step
      expect(rig.planes[0].fade).toBeLessThanOrEqual(Math.max(toStart, STEPPED_CAP) + EPS);
      expect(rig.planes[1].fade).toBeCloseTo(0.5, 12); // the outgoing painting holds until the step
    }
    rig.step(5); // 40 ms: the step; the outgoing plane is now at the cap or under it
    expect(rig.planes[1].fade).toBeLessThanOrEqual(STEPPED_CAP + EPS);
    for (let t = 0; t < 100; t += 5) rig.step(5);
    expect([rig.planes[0].fade, rig.planes[1].fade]).toEqual([1, 0]);
  });
});

// ---------------------------------------------------------------- random sequences

interface Run {
  maxLesser: number;
  steps: number;
  requests: number;
}

/** One random run on the stepped dissolve: requests at random gaps, frames of `1000 / fps` ms from a random phase, some of zero time. Every invariant is asserted as it goes. */
function run(seed: number, fps: number, ms: number): Run {
  const tag = (): string => `seed ${seed}, ${fps} fps, ${ms} ms`;
  const fail = (msg: string): never => {
    throw new Error(`${tag()}: ${msg}`);
  };
  const rnd = mulberry32(seed * 104729 + fps * 31 + ms);
  const KEYS = ['idle', 'ready', 'attack', 'follow', 'hurt', 'cast'];
  const rig = new Rig();
  const frame = 1000 / fps;
  const res: Run = { maxLesser: 0, steps: 0, requests: 0 };
  let nextAt = rnd() * 150;
  let clock = 0;
  const phase = rnd() * frame;
  let lastKey = 'idle';
  let sinceLast = 0;
  let prev: [number, number] = [rig.planes[0].fade, rig.planes[1].fade];
  const total = 2600;
  // the steepest a plane moves along a straight part: the incoming plane's climb to the cap, 0.3 / 0.4 of the blend per unit of progress
  const slopePerMs = 0.75 / ms;
  while (clock < total) {
    while (nextAt <= clock && res.requests < 14 && clock < total - 900) {
      const key = KEYS[Math.floor(rnd() * KEYS.length)]!;
      rig.request(key, ms);
      lastKey = key;
      res.requests++;
      sinceLast = 0;
      nextAt += rnd() * 400;
      if (rnd() < 0.2) nextAt = clock;
      prev = [rig.planes[0].fade, rig.planes[1].fade];
      if (rig.lesser() > STEPPED_CAP + EPS && !rig.blend.blending) fail('a request left the lesser plane above the cap');
    }
    const dtMs = clock === 0 ? phase : frame;
    const step = rnd() < 0.15 ? 0 : dtMs; // a hit-stop frame hands the blend no time
    const before = rig.blend.progress;
    const blendingBefore = rig.blend.blending;
    rig.step(step);
    sinceLast += step;
    const now: [number, number] = [rig.planes[0].fade, rig.planes[1].fade];
    for (const f of now) if (!(f >= 0 && f <= 1)) fail(`a fade left 0..1: ${now}`);
    if (rig.keysAbove(0.02).length > 2) fail('more than two painting keys above 0.02');
    if (rig.lesser() > STEPPED_CAP + EPS) fail(`the lesser plane showed ${rig.lesser()}`);
    res.maxLesser = Math.max(res.maxLesser, rig.lesser());
    if (step === 0 && (now[0] !== prev[0] || now[1] !== prev[1])) fail('a frame of no time moved a fade');
    const bound = slopePerMs * step + EPS;
    const moved = Math.max(Math.abs(now[0] - prev[0]), Math.abs(now[1] - prev[1]));
    if (moved > bound) {
      // the one jump a blend has: the frame that crosses the step (or ends the blend)
      const after = rig.blend.progress;
      if (!(blendingBefore && before < STEPPED_AT && (after >= STEPPED_AT || !rig.blend.blending))) fail(`a plane moved ${moved} in ${step.toFixed(1)} ms away from the step`);
      res.steps++;
    }
    prev = now;
    if (sinceLast >= ms + frame + 1e-6) {
      if (rig.blend.blending) fail(`still blending ${sinceLast} ms after the last request`);
      if (rig.planes[rig.active].fade !== 1 || rig.planes[rig.active].pose !== lastKey) fail('the last request did not land');
    }
    clock += dtMs;
  }
  if (rig.blend.blending || rig.planes[rig.active].fade !== 1 || rig.planes[rig.active].pose !== lastKey) fail('not settled on the last request at the end');
  return res;
}

describe('the stepped dissolve: properties over random request sequences', () => {
  for (const fps of FPS) {
    for (const ms of [120, 140]) {
      it(`${fps} fps, ${ms} ms, 40 sequences: the lesser plane never above 0.30, two paintings at most, one jump per blend and only at the step, the last request lands`, () => {
        let worst = 0;
        for (let seed = 1; seed <= 40; seed++) {
          const r = run(seed, fps, ms);
          worst = Math.max(worst, r.maxLesser);
          expect(r.steps).toBeLessThanOrEqual(r.requests + 1);
        }
        expect(worst).toBeLessThanOrEqual(STEPPED_CAP + EPS);
      });
    }
  }

  it('is deterministic: the same sequence gives the same result', () => {
    expect(run(9, 60, 120)).toEqual(run(9, 60, 120));
  });
});

// ---------------------------------------------------------------- the switch

describe('?poseblend=legacy: the switch and the default', () => {
  it('an actor\'s shape is the stepped dissolve, and the legacy switch gives the plain quadInOut back', () => {
    setPoseBlendLegacy(null);
    expect(poseBlendLegacy()).toBe(false); // no address in a test: the default
    expect(poseBlendShape()).toBe(STEPPED_DISSOLVE);
    setPoseBlendLegacy(true);
    expect(poseBlendLegacy()).toBe(true);
    expect(poseBlendShape()).toBe(QUAD_IN_OUT);
    expect(QUAD_IN_OUT).toBe(Easing.quadInOut);
    setPoseBlendLegacy(null);
    expect(poseBlendShape()).toBe(STEPPED_DISSOLVE);
  });

  it('the legacy shape reproduces the plain dissolve exactly (so the switch is a true A/B): the incoming fade is quadInOut of the progress', () => {
    const rig = new Rig([1, 0], QUAD_IN_OUT);
    rig.request('attack', 120);
    rig.step(30);
    expect(rig.planes[1].fade).toBeCloseTo(Easing.quadInOut(0.25), 12);
    expect(rig.planes[0].fade).toBeCloseTo(1 - Easing.quadInOut(0.25), 12);
  });
});
