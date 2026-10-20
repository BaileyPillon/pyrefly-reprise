/**
 * DEMO MOTION, part 1 on the REAL `PaintedActor` (`?motion=demo`; conference demo; both games): the pose blend takes its length and shape from how well the two paintings, as placed, overlap
 * (`PaintedActor.demoRetune`, `motion/DemoBlend.ts`).
 *
 * Yuna on the head-lock fixture with silhouettes of the test's own (solid left half, solid right half, solid all over) so the overlap of a pair is what the test says it is. Stepped frame by
 * frame at 60 fps the way the game steps it. Without the switch the blend is today's: 120 ms, the plain quad dissolve, the lesser painting peaking at 0.5.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './head-lock-fixture.ts';
import { setDemoMotion } from '../../../src/engine/motion/DemoMotion.ts';
import { setPoseBlendStepped } from '../../../src/engine/PoseBlend.ts';
import type { CoarseMask } from '../../../src/engine/PoseAlign.ts';

afterEach(() => {
  setDemoMotion(null);
  setPoseBlendStepped(null);
  reset();
});

const N = 48;
const mask = (solid: (col: number, row: number) => boolean): CoarseMask => {
  const bits = new Uint8Array(N * N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) bits[r * N + c] = solid(c, r) ? 1 : 0;
  return { w: N, h: N, bits };
};
const LEFT = mask((c) => c < N / 2);
const RIGHT = mask((c) => c >= N / 2);
const ALL = mask(() => true);

function yuna(from: CoarseMask, to: CoarseMask, opts: { side?: 'party' | 'enemy'; crossfadeMs?: number; poseShiftPx?: Record<string, number>; same?: boolean } = {}): Actor {
  const a = new PaintedActor({
    name: 'yuna',
    worldHeight: 1.82,
    side: opts.side ?? 'party',
    breathe: false,
    sway: false,
    shadow: false,
    ...(opts.crossfadeMs !== undefined ? { crossfadeMs: opts.crossfadeMs } : {}),
    ...(opts.poseShiftPx ? { poseShiftPx: opts.poseShiftPx } : {}),
  });
  // `same`: the 'hurt' painting is the idle's own record (the same size, stance and feet), so the two sit exactly on each other and the overlap is whatever the masks say
  const hurt = opts.same ? painting('yuna', 'idle', { silhouette: to }, '/art/characters/yuna/hurt.png') : painting('yuna', 'hurt', { silhouette: to });
  a.adoptPoses({ idle: painting('yuna', 'idle', { silhouette: from }), hurt, ko: painting('yuna', 'ko', { silhouette: to }) }, 'idle');
  a.position.set(-2, 0, 0);
  return a;
}

/** Ask for `pose` and step 60 fps until the blend is over: how many ms it took and the most the lesser painting showed. */
function blendOf(a: Actor, pose: string): { ms: number; lesser: number; sums: number[] } {
  a.setPose(pose);
  let ms = 0;
  let lesser = 0;
  const sums: number[] = [];
  for (let i = 0; i < 40 && a.blending; i++) {
    a.update(1 / 60);
    ms += 1000 / 60;
    const [p, q] = slotsOf(a);
    lesser = Math.max(lesser, Math.min(p.fade, q.fade));
    sums.push(p.fade + q.fade);
  }
  return { ms, lesser, sums };
}

describe('without the switch', () => {
  it('a pose change is today\'s: 120 ms, the plain dissolve, the two paintings crossing at one half, whatever the pair', () => {
    setDemoMotion(false);
    for (const [from, to] of [[LEFT, RIGHT], [ALL, ALL]] as const) {
      const b = blendOf(yuna(from, to), 'hurt');
      expect(b.ms).toBeGreaterThanOrEqual(120 - 17);
      expect(b.ms).toBeLessThanOrEqual(120 + 17);
      expect(b.lesser).toBeGreaterThan(0.35); // the quad dissolve's crossing is at 0.5; a frame lands within a few hundredths of it
      for (const s of b.sums.slice(0, -1)) expect(s).toBeCloseTo(1, 6);
    }
  });
});

describe('with the switch', () => {
  it('two paintings that share nothing cross on the capped cross over 140 ms: the lesser painting never shows more than 0.382, and the body thins to about 0.76 at the crossing', () => {
    setDemoMotion(true);
    const b = blendOf(yuna(LEFT, RIGHT), 'hurt');
    expect(b.ms).toBeGreaterThanOrEqual(140 - 17);
    expect(b.ms).toBeLessThanOrEqual(140 + 17);
    expect(b.lesser).toBeLessThanOrEqual(0.3821);
    expect(b.lesser).toBeGreaterThan(0.25);
    expect(Math.min(...b.sums.slice(0, -1))).toBeGreaterThan(0.74);
    expect(Math.min(...b.sums.slice(0, -1))).toBeLessThan(0.9);
  });

  it('two paintings that agree cross on a plain eased blend over 120 ms (the length of today) with no dip', () => {
    setDemoMotion(true);
    const b = blendOf(yuna(ALL, ALL, { same: true }), 'hurt');
    expect(b.ms).toBeGreaterThanOrEqual(120 - 17);
    expect(b.ms).toBeLessThanOrEqual(120 + 17);
    for (const s of b.sums.slice(0, -1)) expect(s).toBeCloseTo(1, 6);
  });

  it('a foe pair that agrees is 140 ms (its own base), and a KO swap is 40 ms longer than the same pair\'s other swaps', () => {
    setDemoMotion(true);
    const foe = blendOf(yuna(ALL, ALL, { side: 'enemy', same: true }), 'hurt');
    expect(foe.ms).toBeGreaterThanOrEqual(140 - 17);
    expect(foe.ms).toBeLessThanOrEqual(140 + 17);
    const ko = blendOf(yuna(ALL, ALL, { same: true }), 'ko'); // a lying body's outline is not read (prone), so the pair is judged in between: 130 + 40
    expect(ko.ms).toBeGreaterThanOrEqual(170 - 17);
    expect(ko.ms).toBeLessThanOrEqual(170 + 17);
  });

  it('an unknown overlap (a painting with no silhouette) reads as in between: 130 ms', () => {
    setDemoMotion(true);
    const a = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
    a.adoptPoses({ idle: painting('yuna', 'idle'), hurt: painting('yuna', 'hurt') }, 'idle');
    a.position.set(-2, 0, 0);
    const b = blendOf(a, 'hurt');
    expect(b.ms).toBeGreaterThanOrEqual(130 - 17);
    expect(b.ms).toBeLessThanOrEqual(130 + 17);
  });

  it('a cut stays a cut (FF7\'s hand-placed key set) and a scene\'s own long dissolve stays long', () => {
    setDemoMotion(true);
    const cut = yuna(LEFT, RIGHT, { crossfadeMs: 0 });
    cut.setPose('hurt');
    expect(cut.blending).toBe(false);
    const long = blendOf(yuna(LEFT, RIGHT, { crossfadeMs: 200 }), 'hurt');
    expect(long.ms).toBeGreaterThanOrEqual(200 - 17);
    expect(long.ms).toBeLessThanOrEqual(200 + 17);
    expect(long.lesser).toBeGreaterThan(0.44); // the plain dissolve it asked for
  });

  it('a request that turns a running blend round is not re-timed in the middle (the blend that began is the one that ends)', () => {
    setDemoMotion(true);
    const a = yuna(LEFT, RIGHT);
    a.setPose('hurt');
    for (let i = 0; i < 4; i++) a.update(1 / 60);
    a.setPose('idle'); // back to the painting a plane still holds: a reversal
    const [p, q] = slotsOf(a);
    const before = [p.fade, q.fade];
    expect(before.every((f) => f >= 0 && f <= 1)).toBe(true);
    let guard = 0;
    while (a.blending && guard++ < 40) a.update(1 / 60);
    expect(a.blending).toBe(false);
    expect([p.fade, q.fade].sort()).toEqual([0, 1]);
  });
});
