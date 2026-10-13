/**
 * E-PYRE, the look (`src/engine/entrance/entranceLook.ts`): the timing, the curves and the motes, as numbers. Pure.
 *
 * Bailey, 2026-10-12, decision 61e: bosses and aeons that pop in over one frame arrive as pyreflies gathering; the fallback is E-FADE, a 300 ms fade-in. The options page's E-PYRE
 * is "900 ms, 54 frames". Game case: both (shared plumbing).
 */
import { describe, expect, it } from 'vitest';
import {
  ALPHA_RISE,
  FADE_MS,
  GATHER_CURVE,
  GATHER_MS,
  HOLD_ALPHA,
  MOTE_LIFE_S,
  MOTE_PEAK_PER_S,
  REDUCED_FADE_MS,
  RELEASE_END,
  bandAt,
  chooseEntrance,
  entranceRng,
  frameAt,
  gatherMote,
  moteCount,
  moteShape,
  moteSizeScale,
  type QuadCorners,
} from '../../src/engine/entrance/entranceLook.ts';

const FRAME = 1000 / 60;
const wish = { body: 'pyrefly' as const, reduceMotion: false, lowEffects: false, instant: false };

describe('what plays', () => {
  it("the gather is the options page's 900 ms (54 frames at 60 fps), the fallback is 300 ms (18 frames), REDUCE MOTION's is shorter than either", () => {
    expect(GATHER_MS).toBe(900);
    expect(GATHER_MS / FRAME).toBeCloseTo(54, 6);
    expect(FADE_MS).toBe(300);
    expect(FADE_MS / FRAME).toBeCloseTo(18, 6);
    expect(REDUCED_FADE_MS).toBeLessThan(FADE_MS);
    // the critic's acceptance for an entrance: at least a 3-frame fade
    expect(REDUCED_FADE_MS / FRAME).toBeGreaterThanOrEqual(3);
  });

  it('a body made of pyreflies gathers, at full strength; a living person or a machine fades; REDUCE MOTION fades shortly; a hurried opening shows the figure', () => {
    expect(chooseEntrance(wish)).toEqual({ kind: 'gather', ms: 900, density: 1 });
    expect(chooseEntrance({ ...wish, body: 'plain' })).toEqual({ kind: 'fade', ms: 300, density: 0 });
    expect(chooseEntrance({ ...wish, reduceMotion: true })).toEqual({ kind: 'reduced', ms: 200, density: 0 });
    expect(chooseEntrance({ ...wish, body: 'plain', reduceMotion: true }).kind).toBe('reduced');
    expect(chooseEntrance({ ...wish, instant: true })).toEqual({ kind: 'instant', ms: 0, density: 0 });
    expect(chooseEntrance({ ...wish, instant: true, reduceMotion: true }).kind).toBe('instant');
  });

  it("LOW EFFECTS keeps the sweep and drops the motes (as the death's erosion at that tier); the phone releases 0.6 of them", () => {
    expect(chooseEntrance({ ...wish, lowEffects: true })).toEqual({ kind: 'gather', ms: 900, density: 0 });
    expect(chooseEntrance({ ...wish, phone: true })).toEqual({ kind: 'gather', ms: 900, density: 0.6 });
  });
});

describe('what the figure shows', () => {
  it('a gather starts at nothing drawn, below every "is it showing" line (0.02), and ends whole', () => {
    const a = frameAt('gather', GATHER_MS, 0);
    expect(a.dissolve).toBe(1);
    expect(a.alpha).toBe(HOLD_ALPHA);
    expect(HOLD_ALPHA).toBeLessThan(0.02);
    expect(HOLD_ALPHA).toBeGreaterThan(0.001); // the planes stay in the scene, warm
    const z = frameAt('gather', GATHER_MS, GATHER_MS);
    expect(z).toEqual({ alpha: 1, dissolve: 0, done: true });
    expect(frameAt('gather', GATHER_MS, GATHER_MS + 500).done).toBe(true);
  });

  it('the dissolve only ever comes down, the opacity only ever comes up, and the opacity is whole by ALPHA_RISE of the way', () => {
    let prevD = 1;
    let prevA = 0;
    for (let ms = 0; ms <= GATHER_MS; ms += FRAME) {
      const f = frameAt('gather', GATHER_MS, ms);
      expect(f.dissolve).toBeLessThanOrEqual(prevD + 1e-12);
      expect(f.alpha).toBeGreaterThanOrEqual(prevA - 1e-12);
      prevD = f.dissolve;
      prevA = f.alpha;
    }
    expect(frameAt('gather', GATHER_MS, GATHER_MS * ALPHA_RISE).alpha).toBeCloseTo(1, 9);
  });

  it("the sweep's pace: the pyreflies are seen before the painting (under a twentieth of it built in the first 150 ms), and the last tenth is under 200 ms (the figure is not left a silhouette)", () => {
    expect(1 - frameAt('gather', GATHER_MS, 150).dissolve).toBeLessThan(0.07);
    let lastTenth = 0;
    for (let ms = 0; ms <= GATHER_MS; ms += 1) if (frameAt('gather', GATHER_MS, ms).dissolve < 0.3) lastTenth++;
    expect(lastTenth).toBeLessThan(200);
    expect(lastTenth).toBeGreaterThan(100);
    expect(GATHER_CURVE).toBeGreaterThan(1);
  });

  it('no frame of an entrance steps the figure by more than the sweep can: a level steps under 0.06 a frame', () => {
    let worst = 0;
    for (let ms = FRAME; ms <= GATHER_MS; ms += FRAME) {
      worst = Math.max(worst, Math.abs(frameAt('gather', GATHER_MS, ms).dissolve - frameAt('gather', GATHER_MS, ms - FRAME).dissolve));
    }
    expect(worst).toBeLessThan(0.06);
  });

  it('a fade is linear from the held opacity to whole, with no dissolve; REDUCE MOTION fades the same, shorter', () => {
    const mid = frameAt('fade', FADE_MS, FADE_MS / 2);
    expect(mid.dissolve).toBe(0);
    expect(mid.alpha).toBeCloseTo(HOLD_ALPHA + (1 - HOLD_ALPHA) / 2, 9);
    expect(frameAt('reduced', REDUCED_FADE_MS, REDUCED_FADE_MS)).toEqual({ alpha: 1, dissolve: 0, done: true });
    // 3 frames or more of fade at 60 fps
    let shown = 0;
    for (let ms = 0; ms < REDUCED_FADE_MS; ms += FRAME) {
      const a = frameAt('reduced', REDUCED_FADE_MS, ms).alpha;
      if (a > 0.02 && a < 0.98) shown++;
    }
    expect(shown).toBeGreaterThanOrEqual(3);
  });

  it('instant is whole at once', () => {
    expect(frameAt('instant', 0, 0)).toEqual({ alpha: 1, dissolve: 0, done: true });
  });
});

describe('the motes', () => {
  const total = (density: number): number => moteCount(0, 1, GATHER_MS, density);

  it('about 500 are released over the gather at full density, 0.6 of that on the phone, none at LOW EFFECTS', () => {
    expect(total(1)).toBeGreaterThan(300);
    expect(total(1)).toBeLessThan(600);
    expect(total(0.6)).toBeCloseTo(total(1) * 0.6, 6);
    expect(total(0)).toBe(0);
    // the emitter holds 900 and a mote lives about half a second: the gather never fills it
    expect(total(1)).toBeLessThan(900);
    expect(MOTE_PEAK_PER_S * (MOTE_LIFE_S[1] ?? 1)).toBeLessThan(900);
  });

  it('a trickle from the first frame, none after the release ends, and splitting a span does not change the count', () => {
    expect(moteShape(0)).toBeGreaterThan(0);
    expect(moteShape(RELEASE_END)).toBe(0);
    expect(moteShape(0.99)).toBe(0);
    expect(moteCount(RELEASE_END, 1, GATHER_MS, 1)).toBe(0);
    const whole = moteCount(0.1, 0.7, GATHER_MS, 1);
    let parts = 0;
    for (let p = 0.1; p < 0.7 - 1e-9; p += FRAME / GATHER_MS) parts += moteCount(p, Math.min(0.7, p + FRAME / GATHER_MS), GATHER_MS, 1);
    expect(parts).toBeCloseTo(whole, 0);
  });

  it("the band is the one the death uses (`PyreflyStage.release`): the head end first as the level comes down, the whole height at the middle", () => {
    expect(bandAt(1).lo).toBeCloseTo(1, 9);
    expect(bandAt(1).hi).toBe(1);
    expect(bandAt(0)).toEqual({ lo: 0, hi: 0 });
    expect(bandAt(0.5).lo).toBe(0);
    expect(bandAt(0.5).hi).toBe(1);
    expect(bandAt(0.9).lo).toBeCloseTo((0.9 - 0.56) / 0.44, 9);
  });

  const quad: QuadCorners = { bl: [10, 0, -3], br: [14, 0, -3], tl: [10, 6, -3] };

  it('a mote is born in the air round the figure and flies to a point of the dissolve edge, arriving as it dies: it never rises away', () => {
    const rng = entranceRng(7);
    for (let i = 0; i < 300; i++) {
      const d = 0.15 + 0.8 * rng();
      const m = gatherMote(rng, quad, d);
      const t = { x: m.x + m.vx * m.life, y: m.y + m.vy * m.life, z: m.z + m.vz * m.life };
      // the target is on the painting (x across 20 to 80 percent, y within the band of the level, z a hair in front)
      const u = (t.x - 10) / 4;
      const v = (t.y - 0) / 6;
      const { lo, hi } = bandAt(d);
      expect(u).toBeGreaterThanOrEqual(0.2 - 1e-9);
      expect(u).toBeLessThanOrEqual(0.8 + 1e-9);
      expect(v).toBeGreaterThanOrEqual(lo - 1e-9);
      expect(v).toBeLessThanOrEqual(Math.max(hi, lo + 0.02) + 1e-9);
      expect(t.z).toBeCloseTo(-3 + 0.05, 9);
      expect(m.life).toBeGreaterThanOrEqual(MOTE_LIFE_S[0]);
      expect(m.life).toBeLessThanOrEqual(MOTE_LIFE_S[1]);
      // it starts away from the figure, and it is going toward the target the whole way (a straight line)
      expect(Math.hypot(m.x - t.x, m.y - t.y, m.z - t.z)).toBeGreaterThan(0.3);
    }
  });

  it('the cloud follows the size of the figure, a mote is drawn larger the farther the figure is, and a seed replays the same motes', () => {
    const small: QuadCorners = { bl: [0, 0, 0], br: [1, 0, 0], tl: [0, 1.5, 0] };
    const big: QuadCorners = { bl: [0, 0, 0], br: [12, 0, 0], tl: [0, 16, 0] };
    const reach = (q: QuadCorners): number => {
      const rng = entranceRng(3);
      let sum = 0;
      for (let i = 0; i < 200; i++) {
        const m = gatherMote(rng, q, 0.5);
        const t = { x: m.x + m.vx * m.life, y: m.y + m.vy * m.life };
        sum += Math.hypot(m.x - t.x, m.y - t.y);
      }
      return sum / 200;
    };
    expect(reach(big)).toBeGreaterThan(reach(small) * 4);
    expect(moteSizeScale(5)).toBe(1);
    expect(moteSizeScale(14)).toBe(1);
    expect(moteSizeScale(28)).toBe(2);
    expect(moteSizeScale(500)).toBe(4);
    expect(gatherMote(entranceRng(9), quad, 0.5, 3).size).toBeCloseTo(gatherMote(entranceRng(9), quad, 0.5, 1).size * 3, 9);
    expect(gatherMote(entranceRng(9), quad, 0.5)).toEqual(gatherMote(entranceRng(9), quad, 0.5));
    expect(entranceRng(1)()).not.toBe(entranceRng(2)());
  });
});
