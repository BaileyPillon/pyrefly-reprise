/**
 * The knock-back's curve (`src/engine/HitRecoil.ts`; r40-recoil, FC-1; both games; Bailey's pick P3-80: "an 80 ms eased push").
 *
 * The pure half: the profile as a function of progress, then the largest step a frame can see at every frame rate and pacing. The real actor, the stage's hit-stop and the harness's own jerk
 * detector are in `hit-recoil-actor.test.ts`. The old curve (one `elasticOut` tween from the full distance, ticked even while the field holds) is rebuilt here so each guard can fail.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { RECOIL_OVERSHOOT, RECOIL_PUSH_MS, hitRecoilOffset, pushMs, recoilLegacy, setRecoilLegacy } from '../../../src/engine/HitRecoil.ts';
import { Easing } from '../../../src/engine/Tween.ts';

afterEach(() => setRecoilLegacy(null));

/** Px per world unit at the battle camera of the stored round-23 frames (Tidus, 1.82 units, about 270 px tall on a 1600 px screen). */
const PX = 148.4;
const LIGHT = 0.22; // `BattlePresenterBeats.damage`: the recoil's distance for a hit
const CRIT = 0.34; // and for a crit
const FLINCH = 1.82 * 0.1; // the life layer's flinch cue
const MOVES: Array<[string, number, number]> = [['light', 360, LIGHT], ['crit', 360, CRIT], ['flinch', 300, FLINCH], ['boss', 420, 0.34], ['spell', 380, 0.3]];

/** The old knock-back: the offset after `t` ms of tween time. */
const legacyAt = (t: number, ms: number, d: number): number => -(1 - Easing.elasticOut(Math.min(1, t / ms))) * d;

/** Sample a curve every frame at `fps`, with the tween clock running at `rate` of real time; the steps between frames, world units. */
function steps(at: (tMs: number) => number, ms: number, fps: number, rate: number, freeze = 0, before: number = at(0)): number[] {
  const out: number[] = [];
  let prev = before;
  let t = 0;
  for (let i = 0; i < Math.ceil((ms / rate / 1000) * fps) + 6; i++) {
    if (i >= freeze) t += (1000 / fps) * rate;
    const v = at(Math.min(t, ms));
    out.push(v - prev);
    prev = v;
  }
  return out;
}

describe('the shape', () => {
  it('starts where the figure is, ends at rest exactly, and is back at the full distance when the push ends', () => {
    for (const [, ms, d] of MOVES) {
      expect(hitRecoilOffset(0, ms, d)).toBe(0);
      expect(hitRecoilOffset(1, ms, d)).toBe(0);
      expect(hitRecoilOffset(RECOIL_PUSH_MS / ms, ms, d)).toBeCloseTo(-d, 9);
    }
    expect(hitRecoilOffset(0, 360, LIGHT, -0.1)).toBe(-0.1); // a second hit starts from the current offset
    expect(hitRecoilOffset(1, 360, LIGHT, -0.1)).toBe(0);
  });

  it('never goes further back than the distance, overshoots forward once by under a tenth of it, and crosses zero once', () => {
    for (const [, ms, d] of MOVES) {
      let lo = 0, hi = 0, crossings = 0, prev = 0;
      for (let i = 1; i <= 4000; i++) {
        const v = hitRecoilOffset(i / 4000, ms, d);
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
        if (prev < 0 && v >= 0) crossings++;
        if (prev > 0 && v <= 0) crossings++;
        prev = v;
      }
      expect(lo).toBeGreaterThanOrEqual(-d - 1e-9);
      expect(hi).toBeGreaterThan(0.05 * d); // a spring, not a plain ease
      expect(hi).toBeLessThanOrEqual(RECOIL_OVERSHOOT * d); // recoil-overshoot: the plan's 0.1 of the distance
      expect(crossings).toBe(2); // back through rest on the way home, and a touch on the way down from the overshoot
    }
  });

  it('is continuous at the join of the push and the spring, also on a very short move', () => {
    for (const ms of [360, 100, 30, 10, 1]) {
      const push = pushMs(ms);
      expect(push).toBeLessThanOrEqual(RECOIL_PUSH_MS);
      expect(push).toBeLessThan(ms); // there is always a spring after the push
      const eps = 1e-6;
      const a = hitRecoilOffset((push - eps) / Math.max(1, ms), ms, LIGHT);
      const b = hitRecoilOffset((push + eps) / Math.max(1, ms), ms, LIGHT);
      expect(Math.abs(a - b)).toBeLessThan(0.001 * LIGHT);
    }
  });

  it('is a pure function of its inputs (deterministic) and clamps progress', () => {
    expect(hitRecoilOffset(0.3, 360, LIGHT)).toBe(hitRecoilOffset(0.3, 360, LIGHT));
    expect(hitRecoilOffset(-1, 360, LIGHT)).toBe(0);
    expect(hitRecoilOffset(7, 360, LIGHT)).toBe(0);
    expect(hitRecoilOffset(0.5, 0, LIGHT)).toBeDefined();
  });
});

describe('the largest step a frame can see', () => {
  it('stays small at every frame rate and pacing, where the old curve threw the whole distance in a frame', () => {
    for (const [label, ms, d] of MOVES) {
      for (const rate of [1, 1 / 1.2, 1 / 1.1]) {
        for (const fps of [60, 120, 144]) {
          const s = steps((t) => hitRecoilOffset(t / ms, ms, d), ms, fps, rate);
          const worst = Math.max(...s.map(Math.abs));
          // at 60 fps: the push's first frame is sineOut(0.2) = 0.32 of the distance at worst, the spring's first about 0.28
          expect(worst, `${label} ${fps} fps rate ${rate.toFixed(2)}`).toBeLessThanOrEqual((fps === 60 ? 0.33 : fps === 120 ? 0.17 : 0.15) * d);
          expect(worst * PX).toBeLessThan(24); // under the harness's own floor for a jerk (`jerkMinPx`)
        }
      }
    }
  });

  it('reads 0.62 of the distance at worst even at 30 fps (the push is 2.4 frames long there)', () => {
    for (const [, ms, d] of MOVES) {
      const worst = Math.max(...steps((t) => hitRecoilOffset(t / ms, ms, d), ms, 30, 1).map(Math.abs));
      expect(worst).toBeLessThanOrEqual(0.62 * d);
    }
  });

  it('the old curve could throw the whole distance in one frame (the guard can fail), and sprang home in one or two', () => {
    for (const [, ms, d] of MOVES) {
      // a hit-stop holds the field for 3 frames, but the tween is ticked: progress 0 writes the full distance on the first frame
      const old = steps((t) => legacyAt(t, ms, d), ms, 60, 1 / 1.2, 3, 0); // before the hit the figure is at rest (0)
      expect(Math.abs(old[0]!)).toBeCloseTo(d, 9); // 33 px (light) to 50 px (crit) in one frame
      expect(Math.max(...old.map(Math.abs)) * PX).toBeGreaterThan(24);
      expect(Math.max(...old.slice(1).map(Math.abs))).toBeGreaterThan(0.4 * d); // and the release a frame or two later (0.50 to 0.56 of the distance)
    }
  });

  it('leaves the figure where it is for the whole of a hit-stop and starts the push when the field lets go', () => {
    for (const [, ms, d] of MOVES) {
      const s = steps((t) => hitRecoilOffset(t / ms, ms, d), ms, 60, 1 / 1.2, 5);
      expect(s.slice(0, 5).every((v) => v === 0)).toBe(true);
      expect(Math.abs(s[5]!)).toBeGreaterThan(0);
      expect(Math.abs(s[5]!)).toBeLessThanOrEqual(0.33 * d);
    }
  });

  it('a second hit landing mid-spring starts from the current offset, with no step bigger than the first push', () => {
    const d = LIGHT;
    for (const from of [-d, -0.5 * d, 0.06 * d, 0]) {
      const s = steps((t) => hitRecoilOffset(t / 360, 360, d, from), 360, 60, 1, 0);
      const first = Math.abs(s[0]!);
      expect(first).toBeLessThanOrEqual(0.33 * Math.abs(-d - from) + 1e-9);
      expect(Math.max(...s.map(Math.abs))).toBeLessThanOrEqual(0.33 * Math.max(d, Math.abs(-d - from)) + 1e-9);
    }
  });

  it('keeps the total distance and the duration of the knock-back', () => {
    for (const [, ms, d] of MOVES) {
      let lo = hitRecoilOffset(pushMs(ms) / ms, ms, d); // the push's end, which is not on the 1/1000 grid
      for (let i = 0; i <= 1000; i++) lo = Math.min(lo, hitRecoilOffset(i / 1000, ms, d));
      expect(-lo).toBeCloseTo(d, 6); // the same displacement the old curve started from
      expect(Math.abs(hitRecoilOffset(0.999, ms, d))).toBeLessThan(0.01 * d); // settled by the end of `ms`
      expect(hitRecoilOffset(1, ms, d)).toBe(0);
    }
  });
});

describe('the switch', () => {
  it('reads the address once, and a test can force it', () => {
    expect(recoilLegacy()).toBe(false); // no address in node
    setRecoilLegacy(true);
    expect(recoilLegacy()).toBe(true);
    setRecoilLegacy(null);
    expect(recoilLegacy()).toBe(false);
  });
});
