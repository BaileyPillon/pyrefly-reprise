/**
 * DEMO MOTION, part 1 (`?motion=demo`; conference demo; both games): the pose blend chosen from the pair (`motion/DemoBlend.ts`), pure, and through the real `PoseBlend` it is handed to.
 *
 * The properties that matter for the continuity harness's two readings of a swap: the double image (the lesser painting's fade times one minus the outlines' overlap, failing at 0.4) and the
 * fade-weighted head's step in one frame (`continuity-pure.mjs figureTrack`: each plane's head weighted by its fade). Both are computed here the way the harness computes them, at 30, 60
 * and 144 frames a second, against today's plain dissolve (`QUAD_IN_OUT`, 120 ms).
 */
import { describe, expect, it } from 'vitest';
import { AGREE_MS, BLEND_MS_MAX, DEMO_KO_CROSS_MS, LONG_MS_MAX, cappedCross, cappedPeak, demoBlend, difference } from '../../../src/engine/motion/DemoBlend.ts';
import { PoseBlend, QUAD_IN_OUT, type BlendCurves } from '../../../src/engine/PoseBlend.ts';
import { KO_CROSS_MS, REVIVE_MS, RISE_MS } from '../../../src/engine/KoFall.ts';

const FPS = [30, 60, 144];

/** Sample a blend (curves, length) the way a game at `fps` does, from a standing start: [{ out, inn }] per frame, ending at the first frame at or past the length. */
function frames(c: BlendCurves, ms: number, fps: number, phase = 0): Array<{ out: number; inn: number }> {
  const out: Array<{ out: number; inn: number }> = [{ out: 1, inn: 0 }];
  const dt = 1000 / fps;
  for (let t = dt * (1 - phase); ; t += dt) {
    const u = Math.min(1, t / ms);
    out.push({ out: Math.max(0, c.out(u)), inn: Math.min(1, c.inn(u)) });
    if (u >= 1) break;
  }
  return out;
}

const plain: BlendCurves = { out: (u) => 1 - QUAD_IN_OUT(u), inn: QUAD_IN_OUT };

/** The fade-weighted position of a figure's head as a share of the gap between the two paintings' heads (0: the old one's, 1: the new one's). */
const weighted = (f: { out: number; inn: number }): number => f.inn / Math.max(1e-9, f.out + f.inn);

function worstStep(fr: Array<{ out: number; inn: number }>): number {
  let worst = 0;
  for (let i = 1; i < fr.length; i++) worst = Math.max(worst, Math.abs(weighted(fr[i]!) - weighted(fr[i - 1]!)));
  return worst;
}

/** The double image of two paintings sharing `overlap` of their outline: the lesser fade times one minus the overlap, the worst frame. */
function worstGhost(fr: Array<{ out: number; inn: number }>, overlap: number): number {
  return Math.max(...fr.map((f) => Math.min(f.out, f.inn) * (1 - overlap)));
}

describe('difference: how far apart two paintings are', () => {
  it('is 0 for a pair that agrees (0.6 or more), 1 for one that does not (0.15 or less), linear between, 0.5 unknown', () => {
    expect(difference(0.9)).toBe(0);
    expect(difference(0.6)).toBe(0);
    expect(difference(0.15)).toBe(1);
    expect(difference(0.03)).toBe(1);
    expect(difference(0.375)).toBeCloseTo(0.5, 6);
    expect(difference(null)).toBe(0.5);
    expect(difference(Number.NaN)).toBe(0.5);
  });
});

describe('the capped cross', () => {
  it('the paintings meet at 0.5 for a linear blend (k = 1) and at 0.382 for k = 2, and the curves start and end where a blend must', () => {
    expect(cappedPeak(1)).toBeCloseTo(0.5, 6);
    expect(cappedPeak(2)).toBeCloseTo((3 - Math.sqrt(5)) / 2, 6);
    for (const k of [1, 1.25, 1.5, 2]) {
      const c = cappedCross(k);
      expect(c.out(0)).toBe(1);
      expect(c.out(1)).toBe(0);
      expect(c.inn(0)).toBe(0);
      expect(c.inn(1)).toBe(1);
      let po = 1;
      let pi = 0;
      for (let i = 1; i <= 200; i++) {
        const u = i / 200;
        expect(c.out(u)).toBeLessThanOrEqual(po + 1e-12); // monotone
        expect(c.inn(u)).toBeGreaterThanOrEqual(pi - 1e-12);
        expect(Math.min(c.out(u), c.inn(u))).toBeLessThanOrEqual(c.cap! + 1e-9); // never both above the cap
        po = c.out(u);
        pi = c.inn(u);
      }
    }
  });

  it('k outside 1 to 2 is clamped (a bad caller cannot make a blend that never lets go)', () => {
    expect(cappedCross(5).cap).toBeCloseTo(cappedPeak(2), 9);
    expect(cappedCross(0).cap).toBeCloseTo(0.5, 9);
  });
});

describe('demoBlend: length and shape of one pose change', () => {
  it('a pair that agrees is short (110 party, 120 foe), a pair that does not is long, nothing ordinary past 160', () => {
    expect(demoBlend({ side: 'party', to: 'ready', overlap: 0.8 }).ms).toBe(AGREE_MS.party);
    expect(demoBlend({ side: 'foe', to: 'ready', overlap: 0.8 }).ms).toBe(AGREE_MS.foe);
    expect(demoBlend({ side: 'party', to: 'follow', overlap: 0.05 }).ms).toBe(140);
    expect(demoBlend({ side: 'foe', to: 'follow', overlap: 0.05 }).ms).toBe(150);
    for (let o = 0; o <= 1; o += 0.05) {
      for (const side of ['party', 'foe'] as const) {
        const b = demoBlend({ side, to: 'attack', overlap: o });
        expect(b.ms).toBeGreaterThanOrEqual(110);
        expect(b.ms).toBeLessThanOrEqual(BLEND_MS_MAX);
      }
    }
  });

  it('a KO, an Overdrive, a special and a victory swap are 40 ms longer, and never past 200', () => {
    for (const to of ['ko', 'dead', 'overdrive', 'od', 'special', 'victory']) {
      const a = demoBlend({ side: 'party', to, overlap: 0.9 });
      expect(a.ms).toBe(AGREE_MS.party + 40);
      expect(demoBlend({ side: 'foe', to, overlap: 0.0 }).ms).toBe(190);
      expect(demoBlend({ side: 'foe', to, overlap: 0.0 }).ms).toBeLessThanOrEqual(LONG_MS_MAX);
    }
  });

  it('the exponent follows the difference: plain at an overlap of 0.6, the full cap at 0.15', () => {
    expect(demoBlend({ side: 'party', to: 'idle', overlap: 0.7 }).k).toBe(1);
    expect(demoBlend({ side: 'party', to: 'idle', overlap: 0.1 }).k).toBe(2);
    expect(demoBlend({ side: 'party', to: 'idle', overlap: 0.1 }).shape.cap).toBeCloseTo(0.382, 3);
  });
});

describe('against today\'s plain dissolve, frame by frame at 30, 60 and 144 fps', () => {
  it('a pair that shares nothing never shows a double image past 0.382 (the harness fails 0.4); the quad dissolve reads 0.5 at its crossing', () => {
    for (const fps of FPS) {
      for (const phase of [0, 0.25, 0.5, 0.75]) {
        const b = demoBlend({ side: 'party', to: 'follow', overlap: 0.0 });
        expect(worstGhost(frames(b.shape, b.ms, fps, phase), 0)).toBeLessThanOrEqual(0.3820001);
      }
    }
    // today's: the lesser fade reaches 0.5 where the two cross (a frame at 144 fps lands within a few hundredths of it)
    expect(Math.max(...frames(plain, 120, 144).map((f) => Math.min(f.out, f.inn)))).toBeGreaterThan(0.44);
  });

  it('for a pair that shares nothing the worst frame of the fade-weighted head is no more than 5 percent over that of the quad dissolve at 60 and 144 fps (the price of the capped cross at 140 ms), and the first frame is as soft as the quad one (no new first-step jerk)', () => {
    for (const fps of [60, 144]) {
      const demo = demoBlend({ side: 'party', to: 'follow', overlap: 0.0 });
      const today = worstStep(frames(plain, 120, fps));
      const now = worstStep(frames(demo.shape, demo.ms, fps));
      expect(now, `${fps} fps: demo ${now.toFixed(3)} vs today ${today.toFixed(3)}`).toBeLessThan(today * 1.05);
    }
    for (const [to, overlap] of [['follow', 0.0], ['ready', 0.9], ['follow', 0.3]] as const) {
      const demo = demoBlend({ side: 'party', to, overlap });
      let first = 0;
      let today = 0;
      for (const phase of [0, 0.25, 0.5, 0.75]) {
        const f = frames(demo.shape, demo.ms, 60, phase);
        const g = frames(plain, 120, 60, phase);
        first += Math.abs(weighted(f[1]!) - weighted(f[0]!));
        today += Math.abs(weighted(g[1]!) - weighted(g[0]!));
      }
      expect(first / 4, `${to} ${overlap}: first frame`).toBeLessThanOrEqual((today / 4) * 1.5 + 0.005);
    }
  });

  it('a pair that agrees is a short blend with no dip (the two fades add to one) whose head moves at most 95 percent of the quad dissolve worst frame', () => {
    const demo = demoBlend({ side: 'party', to: 'ready', overlap: 0.9 });
    for (const f of frames(demo.shape, demo.ms, 60)) expect(f.out + f.inn).toBeCloseTo(1, 6);
    expect(worstStep(frames(demo.shape, demo.ms, 60))).toBeLessThan(worstStep(frames(plain, 120, 60)) * 0.95);
  });

  it('the thinning of the body is the stated 0.76 at the crossing for the full cap and nothing for a plain blend', () => {
    const full = cappedCross(2);
    let worst = 1;
    for (let i = 0; i <= 2000; i++) worst = Math.min(worst, full.out(i / 2000) + full.inn(i / 2000));
    expect(worst).toBeGreaterThan(0.74);
    expect(worst).toBeLessThan(0.78); // 0.75 at the lowest, 0.764 where the two cross
    for (let i = 0; i <= 20; i++) expect(cappedCross(1).out(i / 20) + cappedCross(1).inn(i / 20)).toBeCloseTo(1, 9);
  });
});

describe('through the real PoseBlend', () => {
  function planes(): [{ fade: number; pose: string }, { fade: number; pose: string }] {
    return [{ fade: 1, pose: 'ready' }, { fade: 0, pose: '' }];
  }

  it('retune puts the demo\'s length and shape on a blend that has just started, and a blend that has moved is left alone', () => {
    const p = planes();
    const blend = new PoseBlend(p);
    blend.request('attack', 120, 0);
    const b = demoBlend({ side: 'party', to: 'attack', overlap: 0.0 });
    blend.retune(b.ms, b.shape);
    let t = 0;
    let worst = 0;
    while (blend.blending) {
      blend.advance(1000 / 60);
      t += 1000 / 60;
      worst = Math.max(worst, Math.min(p[0].fade, p[1].fade));
    }
    expect(t).toBeGreaterThanOrEqual(140 - 17);
    expect(t).toBeLessThanOrEqual(140 + 17);
    expect(worst).toBeLessThanOrEqual(0.3821);
    expect(p[1].fade).toBe(1);
    expect(p[0].fade).toBe(0);

    const q = planes();
    const moved = new PoseBlend(q);
    moved.request('attack', 120, 0);
    moved.advance(30);
    const before = q[1].fade;
    moved.retune(300, cappedCross(2));
    moved.advance(30);
    expect(q[1].fade).toBeGreaterThan(before); // still on the old shape: quad at 60 of 120 ms is 0.5, a 300 ms linear blend would be 0.2 only
    expect(q[1].fade).toBeCloseTo(0.5, 2);
  });

  it('a request that turns a running blend round keeps the lesser painting under the cap (both paintings up at the start)', () => {
    const p = planes();
    const blend = new PoseBlend(p);
    blend.request('attack', 120, 0);
    blend.advance(50); // about 0.43 of the way: both paintings show
    const plan = blend.request('ready', 120, 1);
    expect(plan.same).toBe(false);
    blend.retune(160, cappedCross(2));
    let guard = 0;
    while (blend.blending && guard++ < 60) {
      blend.advance(1000 / 60);
      expect(Math.min(p[0].fade, p[1].fade)).toBeLessThanOrEqual(Math.max(0.382, 0.43) + 1e-6);
    }
    expect(p[0].fade).toBe(1);
  });
});

describe('the KO cross under the demo', () => {
  it('is 100 ms, still inside the 300 ms landing squash after the buckle and the 520 ms revive wait', () => {
    expect(DEMO_KO_CROSS_MS).toBeGreaterThan(KO_CROSS_MS);
    expect(220 + DEMO_KO_CROSS_MS).toBeLessThanOrEqual(320);
    expect(DEMO_KO_CROSS_MS + RISE_MS).toBeLessThan(520);
    expect(REVIVE_MS).toBe(KO_CROSS_MS + RISE_MS); // the exported constant is today's
  });
});
