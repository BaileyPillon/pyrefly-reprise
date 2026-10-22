/**
 * Motion pass, lane "core", step 1 (CURVES): the pure pieces. `CurvesSwitch` (default OFF, demo chapters only), `StrikeCurve` (the sampled strike and its marks), `StrikeRun` (the
 * paced clock, the contact hold, the carry), `CurveDriver` (cast lift, leap) and `RecoilCurve`. Game case: both (FFX profile in Chapter I, FFX-2's in Chapter IV).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CurveDriver, LiftChannel } from '../../../src/engine/motion/CurveDriver.ts';
import { curvesGame, curvesModeFromSearch, curvesOn, inDemoChapter, setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { newRecoilOffset, recoilDistance, RECOIL_SCALE } from '../../../src/engine/motion/RecoilCurve.ts';
import {
  PROFILES,
  SQUASH_CAP,
  defaultPaceFactor,
  heftFactors,
  resolveStrike,
  sampleAt,
  sampleStrike,
  strikeMarkFractions,
  strikeMarks,
  strikeTotalMs,
  travelPeakU,
  type StrikeSample,
  type StrikeShape,
} from '../../../src/engine/motion/StrikeCurve.ts';
import { StrikeRun } from '../../../src/engine/motion/StrikeRun.ts';
import { installCurvesDebug } from '../../../src/debug/curvesApi.ts';

afterEach(() => {
  setCurvesMode(null);
  setCurvesChapter(undefined);
});

/** A shape whose paced ms equal the profile's ms (the pace the profile is written at), for readable numbers. */
const shapeOf = (game: 'ffx' | 'ffx2', over: { distance?: number; heft?: number; arcGain?: number } = {}): StrikeShape =>
  resolveStrike(PROFILES[game], { distance: over.distance ?? 1.4, height: 1.82, timeScale: defaultPaceFactor(game), ...(over.heft !== undefined ? { heft: over.heft } : {}), ...(over.arcGain !== undefined ? { arcGain: over.arcGain } : {}) });

describe('the switch: default OFF, the two demo chapters only', () => {
  it('reads ?curves= and ?pack=demo from a search string', () => {
    expect(curvesModeFromSearch(undefined)).toBe('today');
    expect(curvesModeFromSearch('')).toBe('today');
    expect(curvesModeFromSearch('?curves=new')).toBe('new');
    expect(curvesModeFromSearch('?pack=demo')).toBe('new');
    expect(curvesModeFromSearch('?pack=demo&curves=today')).toBe('today');
    expect(curvesModeFromSearch('?curves=bogus')).toBe('today');
    expect(curvesModeFromSearch('?pack=other')).toBe('today');
  });
  it('is off with no page and off in every chapter but Chapter I and Chapter IV', () => {
    expect(curvesOn()).toBe(false); // no location in this test: today
    setCurvesMode('new');
    expect(curvesOn()).toBe(false); // no chapter named yet
    for (const id of ['yunalesca', 'ffx2-vegnagun-shuyin', 'sinspawn-gui', 'fayth']) {
      setCurvesChapter(id);
      expect(curvesOn()).toBe(false);
    }
    setCurvesChapter('seymour-flux');
    expect(curvesOn()).toBe(true);
    expect(curvesGame()).toBe('ffx');
    setCurvesChapter('ffx2-bahamut');
    expect(curvesOn()).toBe(true);
    expect(curvesGame()).toBe('ffx2');
    setCurvesMode('today');
    expect(curvesOn()).toBe(false);
    expect(inDemoChapter('seymour-flux')).toBe(true);
    expect(inDemoChapter('yunalesca')).toBe(false);
    expect(inDemoChapter(undefined)).toBe(false);
  });
});

describe('the profiles: the brief\'s numbers, each game its own', () => {
  it('FFX is the snappy 1.1 s: wind-up 150, travel 250, hold 200, return 400, settle 100 (ms on screen at the default pace)', () => {
    const p = PROFILES.ffx;
    expect([p.windupMs, p.travelMs, p.holdMs, p.returnMs, p.settleMs]).toEqual([150, 250, 200, 400, 100]);
    const s = resolveStrike(PROFILES.ffx, { distance: 1.4, height: 1.82, timeScale: 1 });
    expect(strikeTotalMs(s) * defaultPaceFactor('ffx')).toBeCloseTo(1100, 6); // the clock counts paced ms: on screen it is the profile's 1.1 s at the default pace
  });
  it('FFX-2 is quicker: earlier contact, a higher arc, a quicker return', () => {
    const a = PROFILES.ffx;
    const b = PROFILES.ffx2;
    expect(b.windupMs + b.travelMs).toBeLessThan(a.windupMs + a.travelMs);
    expect(b.returnMs).toBeLessThan(a.returnMs);
    expect(b.arc).toBeGreaterThan(a.arc * 2);
    expect(b.bias).toBeLessThan(a.bias); // FFX's fastest frame comes later: a committed arrival
    expect(travelPeakU(a.bias)).toBeGreaterThan(travelPeakU(b.bias));
    expect(strikeTotalMs(resolveStrike(PROFILES.ffx2, { distance: 1.4, height: 1.82, timeScale: 1 })) * defaultPaceFactor('ffx2')).toBeCloseTo(1000, 6);
  });
  it('the profile\'s milliseconds are on screen at the DEFAULT pace; a different pace stretches the move relative to it', () => {
    const at = (pace: number): number => strikeTotalMs(resolveStrike(PROFILES.ffx, { distance: 1.4, height: 1.82, timeScale: 1 })) * pace;
    expect(at(defaultPaceFactor('ffx'))).toBeCloseTo(1100, 6);
    expect(at(1)).toBeLessThan(1100); // ?pace=current
    expect(at(1.4)).toBeGreaterThan(1100); // ?pace=relaxed
  });
});

describe('the sampled timeline', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    const s = shapeOf(game);
    const total = strikeTotalMs(s);
    const STEP = 1000 / 120;

    it(`${game}: starts and ends at the exact rest pose`, () => {
      const a = sampleStrike(s, 0);
      expect(a).toEqual({ x: 0, lift: 0, sy: 1, lean: 0 });
      const z = sampleStrike(s, 1);
      expect(z).toEqual({ x: 0, lift: 0, sy: 1, lean: 0 });
      expect(Object.is(z.x, -0)).toBe(false);
    });

    it(`${game}: touches the target at contact (a few px over), holds at 1 and walks home past 0 and back`, () => {
      const m = strikeMarks(s);
      const atContact = sampleAt(s, 'pre', m.contact);
      expect(atContact.x).toBeCloseTo(1 + s.over, 9);
      expect(atContact.lift).toBeCloseTo(0, 9);
      expect(atContact.sy).toBeCloseTo(1, 9);
      expect(atContact.lean).toBeCloseTo(0, 9);
      const held = sampleAt(s, 'hold', 1000);
      expect(held.x).toBeCloseTo(1, 12);
      expect(held.sy).toBe(1);
      let min = 0;
      for (let ms = 0; ms <= s.returnMs + s.settleMs; ms += 1) min = Math.min(min, sampleAt(s, 'post', ms).x);
      expect(min).toBeCloseTo(-s.homeOver, 6); // steps a little past home
      expect(sampleAt(s, 'pre', 0.4 * s.windupMs).x).toBeLessThan(0); // the pull back
    });

    it(`${game}: squash and stretch are volume-preserving and never leave +-${SQUASH_CAP * 100} percent`, () => {
      for (const heft of [0, 0.5, 1]) {
        const h = shapeOf(game, { heft });
        let lo = 1;
        let hi = 1;
        const n = 800;
        for (let i = 0; i <= n; i++) {
          const r = sampleStrike(h, i / n);
          lo = Math.min(lo, r.sy);
          hi = Math.max(hi, r.sy);
          expect(Math.abs(r.sy - 1)).toBeLessThanOrEqual(SQUASH_CAP + 1e-12);
        }
        expect(hi - 1).toBeGreaterThan(0.02); // it is a visible stretch...
        expect(1 - lo).toBeGreaterThan(0.025); // ...and a visible squash
      }
    });

    it(`${game}: sampled at 120 Hz no channel jumps (continuity), and it accelerates smoothly`, () => {
      const out: StrikeSample = { x: 0, lift: 0, sy: 1, lean: 0 };
      let prev = { x: 0, lift: 0, sy: 1, lean: 0 };
      let prevD = { x: 0, lift: 0 };
      let maxDx = 0;
      let maxDl = 0;
      let maxDsy = 0;
      let maxAcc = 0;
      for (let ms = STEP; ms <= total + STEP; ms += STEP) {
        const contact = s.windupMs + s.travelMs;
        const r = ms < contact ? sampleAt(s, 'pre', ms, out) : ms < contact + s.holdMs ? sampleAt(s, 'hold', ms - contact, out) : sampleAt(s, 'post', ms - contact - s.holdMs, out);
        const dx = r.x - prev.x;
        maxDx = Math.max(maxDx, Math.abs(dx));
        maxDl = Math.max(maxDl, Math.abs(r.lift - prev.lift));
        maxDsy = Math.max(maxDsy, Math.abs(r.sy - prev.sy));
        // the contact is a hard stop of the travel and the hold's pulse is a push: velocity may change at those frames only
        if (ms > STEP * 2 && Math.abs(ms - contact) > STEP * 2) maxAcc = Math.max(maxAcc, Math.abs(dx - prevD.x));
        prevD = { x: dx, lift: r.lift - prev.lift };
        prev = { x: r.x, lift: r.lift, sy: r.sy, lean: r.lean };
      }
      expect(maxDx).toBeLessThan(0.12); // of the distance, per 1/120 s: no frame throws the figure (a 1.4 unit lunge: 0.17 units, 22 px at 1440p)
      expect(maxDl).toBeLessThan(0.02); // of the height
      expect(maxDsy).toBeLessThan(0.03); // the landing thud is a push: about 2 percent of the scale in its first frames
      expect(maxAcc).toBeLessThan(0.02);
    });

    it(`${game}: the marks are in order and travelPeak / settlePeak are the fastest frames`, () => {
      const m = strikeMarks(s);
      expect(m.windupEnd).toBeGreaterThan(0);
      expect(m.travelPeak).toBeGreaterThan(m.windupEnd);
      expect(m.contact).toBeGreaterThan(m.travelPeak);
      expect(m.holdEnd).toBeGreaterThan(m.contact);
      expect(m.settlePeak).toBeGreaterThan(m.holdEnd);
      expect(m.end).toBeGreaterThan(m.settlePeak);
      expect(m.end).toBeCloseTo(total, 9);
      const f = strikeMarkFractions(s);
      expect(f.end).toBe(1);
      expect(f.contact).toBeCloseTo(m.contact / total, 12);
      // fastest frame before contact, found by brute force on the sampler
      let best = 0;
      let at = 0;
      for (let ms = 0.5; ms < m.contact; ms += 0.5) {
        const v = Math.abs(sampleAt(s, 'pre', ms).x - sampleAt(s, 'pre', ms - 0.5).x);
        if (v > best) [best, at] = [v, ms];
      }
      expect(Math.abs(at - m.travelPeak)).toBeLessThan(3);
      best = 0;
      for (let ms = 0.5; ms < s.returnMs; ms += 0.5) {
        const v = Math.abs(sampleAt(s, 'post', ms).x - sampleAt(s, 'post', ms - 0.5).x);
        if (v > best) [best, at] = [v, ms];
      }
      expect(Math.abs(at - 0.5 * s.returnMs)).toBeLessThan(3);
      expect(travelPeakU(s.bias)).toBeGreaterThan(0.35);
      expect(travelPeakU(s.bias)).toBeLessThan(0.75);
    });
  }

  it('FFX-2 flies higher than FFX, both land at contact with no lift left', () => {
    const peak = (g: 'ffx' | 'ffx2'): number => {
      const s = shapeOf(g);
      let m = 0;
      for (let i = 0; i <= 400; i++) m = Math.max(m, sampleStrike(s, i / 400).lift);
      return m;
    };
    expect(peak('ffx2')).toBeGreaterThan(peak('ffx') * 2);
    expect(peak('ffx')).toBeCloseTo(PROFILES.ffx.arc, 2);
  });

  it('a strike after an FFX-2 run-in plays no arc of its own (arcGain 0): no double lift', () => {
    const s = shapeOf('ffx2', { arcGain: 0 });
    for (let i = 0; i <= 400; i++) expect(sampleStrike(s, i / 400).lift).toBe(0);
  });

  it('bosses: the same curves, heavier and slower, with less air and less squash', () => {
    const light = shapeOf('ffx');
    const heavy = shapeOf('ffx', { heft: 1 });
    expect(strikeTotalMs(heavy)).toBeGreaterThan(strikeTotalMs(light) * 1.25);
    expect(heavy.arc).toBeLessThan(light.arc * 0.5);
    expect(heavy.squash).toBeLessThan(light.squash);
    const f = heftFactors(1);
    expect(f.time).toBeGreaterThan(1);
    expect(f.arc).toBeLessThan(0.5);
    expect(heftFactors(0)).toEqual({ time: 1, hold: 1, ret: 1, arc: 1, squash: 1, pull: 1, over: 1 });
  });

  it('the overshoot past the touch point is capped in world units, so a long reach does not bury the figure in its target', () => {
    const near = shapeOf('ffx', { distance: 1.4 });
    const far = shapeOf('ffx', { distance: 4.4 });
    expect(near.over * 1.4).toBeLessThanOrEqual(PROFILES.ffx.overMax + 1e-12);
    expect(far.over * 4.4).toBeLessThanOrEqual(PROFILES.ffx.overMax + 1e-12);
    expect(far.pull * 4.4).toBeLessThanOrEqual(PROFILES.ffx.pullbackMax + 1e-12);
  });
});

describe('the clock: paced time, frame-rate independence, the contact hold', () => {
  const shape = shapeOf('ffx');
  const run = (autoRelease = true): StrikeRun => new StrikeRun(shape, 1.4, 1.82, null, autoRelease);

  it('the same curve at 60 Hz, 120 Hz, 240 Hz and an uneven frame train', () => {
    const at = (steps: number[], ms: number): { x: number; lift: number; sy: number } => {
      const r = run();
      let t = 0;
      for (const s of steps) {
        r.advance(s);
        t += s;
      }
      expect(t).toBeCloseTo(ms, 9);
      const p = r.sample();
      return { x: p.x, lift: p.lift, sy: p.sy };
    };
    for (const ms of [100, 240, 400, 560, 700, 900, 1000]) {
      const ref = at([ms], ms);
      for (const dt of [1000 / 60, 1000 / 120, 1000 / 240]) {
        const n = Math.round(ms / dt);
        const steps = Array.from({ length: n }, () => ms / n);
        const got = at(steps, ms);
        expect(got.x).toBeCloseTo(ref.x, 9);
        expect(got.lift).toBeCloseTo(ref.lift, 9);
        expect(got.sy).toBeCloseTo(ref.sy, 9);
      }
      const uneven: number[] = [];
      let left = ms;
      for (let i = 0; left > 0; i++) {
        const s = Math.min(left, [3, 17.4, 8.3, 25, 1][i % 5]!);
        uneven.push(s);
        left -= s;
      }
      expect(at(uneven, ms).x).toBeCloseTo(ref.x, 9);
    }
  });

  it('the marks fire once each, in order, on the frame that crosses them, and the leftover time carries across a phase boundary', () => {
    const r = run();
    const seen: string[] = [];
    for (const name of ['windupEnd', 'travelPeak', 'contact', 'holdEnd', 'settlePeak', 'end'] as const) r.on(name, () => seen.push(name));
    const m = strikeMarks(shape);
    r.advance(m.windupEnd - 1);
    expect(seen).toEqual([]);
    r.advance(2);
    expect(seen).toEqual(['windupEnd']);
    r.advance(m.travelPeak - m.windupEnd);
    expect(seen).toEqual(['windupEnd', 'travelPeak']);
    // one huge frame: all the rest in order, and the total time is exactly what was fed
    r.advance(10_000);
    expect(seen).toEqual(['windupEnd', 'travelPeak', 'contact', 'holdEnd', 'settlePeak', 'end']);
    expect(r.done).toBe(true);
    expect(r.time).toBeCloseTo(strikeTotalMs(shape), 6);
  });

  it('a frame that crosses the contact carries its leftover into the hold (no lost frame time)', () => {
    const a = run();
    const b = run();
    const m = strikeMarks(shape);
    a.advance(m.contact + 5);
    b.advance(m.contact - 4);
    b.advance(9);
    expect(a.sample().sy).toBeCloseTo(b.sample().sy, 12);
    expect(a.sample().x).toBeCloseTo(b.sample().x, 12);
  });

  it('holds at the contact until released, at least the minimum, then goes home', () => {
    const r = run(false);
    const m = strikeMarks(shape);
    r.advance(m.contact + shape.holdMs + 800);
    expect(r.phaseName).toBe('hold');
    expect(r.done).toBe(false);
    expect(r.sample().x).toBeCloseTo(1.4, 9);
    r.release();
    r.advance(1);
    expect(r.phaseName).toBe('post');
    r.advance(shape.returnMs + shape.settleMs);
    expect(r.done).toBe(true);
    expect(r.sample()).toEqual({ x: 0, lift: 0, sy: 1, lean: 0 });
    // released early: still holds the minimum
    const q = run(false);
    q.advance(m.contact + 10);
    q.release();
    q.advance(shape.holdMs - 40);
    expect(q.phaseName).toBe('hold');
    q.advance(60);
    expect(q.phaseName).toBe('post');
  });

  it('a hit-stop (zero time) holds the move exactly where it is', () => {
    const r = run();
    r.advance(300);
    const a = r.sample();
    for (let i = 0; i < 10; i++) r.advance(0);
    expect(r.sample()).toEqual(a);
  });

  it('a strike begun over another folds the old pose out instead of snapping', () => {
    const first = run();
    first.advance(250);
    const was = first.sample();
    const second = new StrikeRun(shape, 1.4, 1.82, was, true);
    const now = second.sample();
    expect(now.x).toBeCloseTo(was.x, 12);
    expect(now.sy).toBeCloseTo(was.sy, 12);
    second.advance(200);
    const later = second.sample();
    expect(Math.abs(later.x - sampleAt(shape, 'pre', 200).x * 1.4)).toBeLessThan(1e-9); // folded out after 120 ms
  });

  it('the driver settles its promise when the move ends, is replaced or is disposed', async () => {
    const d = new CurveDriver();
    const { run: r, done } = d.begin(shape, 1.4, 1.82, true);
    let settled = false;
    void done.then(() => (settled = true));
    d.advance(shape.windupMs);
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(d.out.x).toBeLessThan(0); // still pulling back
    d.advance(5000);
    await Promise.resolve();
    expect(settled).toBe(true);
    expect(r.done).toBe(true);
    expect(d.out).toEqual({ x: 0, lift: 0, sy: 1, lean: 0 });
    // replaced
    const a = d.begin(shape, 1.4, 1.82, true);
    let aDone = false;
    void a.done.then(() => (aDone = true));
    d.advance(100);
    d.begin(shape, 1.4, 1.82, true);
    await Promise.resolve();
    expect(aDone).toBe(true);
    // disposed
    let bDone = false;
    void d.begin(shape, 1.4, 1.82, true).done.then(() => (bDone = true));
    d.dispose();
    await Promise.resolve();
    expect(bDone).toBe(true);
  });
});

describe('the cast lift and the leap', () => {
  it('a cast lift rises, is HELD until released, then comes down and rings a small landing squash that rests at 1', () => {
    const c = new LiftChannel();
    c.rise(0.12, 200);
    c.advance(100);
    expect(c.value).toBeGreaterThan(0);
    expect(c.value).toBeLessThan(0.12);
    c.advance(100);
    expect(c.value).toBeCloseTo(0.12, 12);
    for (let i = 0; i < 100; i++) c.advance(16.7); // held a second and a half
    expect(c.value).toBeCloseTo(0.12, 12);
    expect(c.held).toBe(true);
    c.release(260);
    let minSy = 1;
    for (let i = 0; i < 80; i++) {
      c.advance(8.33);
      minSy = Math.min(minSy, c.landSy);
    }
    expect(c.value).toBe(0);
    expect(minSy).toBeLessThan(1);
    expect(minSy).toBeGreaterThan(1 - SQUASH_CAP);
    expect(c.landSy).toBe(1);
  });

  it('a leap crouches, flies in an arc, stretches, lands and rings; its promise settles at the landing', async () => {
    const d = new CurveDriver();
    let landed = false;
    void d.leap(0.42, 400).then(() => (landed = true));
    let peak = 0;
    let lo = 1;
    let hi = 1;
    for (let ms = 0; ms < 400; ms += 8.33) {
      d.advance(8.33);
      peak = Math.max(peak, d.out.lift);
      lo = Math.min(lo, d.out.sy);
      hi = Math.max(hi, d.out.sy);
    }
    d.advance(8.33);
    await Promise.resolve();
    expect(landed).toBe(true);
    expect(peak).toBeCloseTo(0.42, 2);
    expect(lo).toBeLessThan(1);
    expect(hi).toBeGreaterThan(1);
    for (let i = 0; i < 40; i++) d.advance(8.33);
    expect(d.out.lift).toBe(0);
    expect(d.out.sy).toBe(1);
  });
});

describe('the recoil: a few px, then recover with one small overshoot', () => {
  it('scales today\'s push to about 30 percent, thinner for a heavy body', () => {
    expect(RECOIL_SCALE).toBe(0.3);
    expect(recoilDistance(0.22)).toBeCloseTo(0.066, 9);
    expect(recoilDistance(0.34)).toBeCloseTo(0.102, 9);
    expect(recoilDistance(0.22, 1)).toBeLessThan(recoilDistance(0.22));
  });
  it('pushes out fast, recovers past rest by about 13 percent of the push once, and rests at exactly 0', () => {
    const d = recoilDistance(0.22);
    let min = 0;
    let max = 0;
    let crossings = 0;
    let prev = 0;
    for (let i = 0; i <= 720; i++) {
      const v = newRecoilOffset(i / 720, 360, d);
      min = Math.min(min, v);
      max = Math.max(max, v);
      if (i > 0 && Math.sign(prev) !== Math.sign(v) && v !== 0 && prev !== 0) crossings++;
      prev = v;
    }
    expect(min).toBeCloseTo(-d, 6);
    expect(max / d).toBeGreaterThan(0.1);
    expect(max / d).toBeLessThan(0.16);
    expect(crossings).toBe(1);
    expect(newRecoilOffset(1, 360, d)).toBe(0);
    expect(Object.is(newRecoilOffset(1, 360, d), -0)).toBe(false);
    // the push is most of the way out in the first 70 ms
    expect(newRecoilOffset(70 / 360, 360, d)).toBeCloseTo(-d, 6);
    // a second hit mid-recoil starts from where the figure is
    expect(newRecoilOffset(0, 360, d, -0.04)).toBeCloseTo(-0.04, 12);
  });
});

describe("window.__pyrefly.curves / curvesChapter / curvesOn / strikeMarks (the recorder's setters)", () => {
  it('sets the mode and the chapter, answers curvesOn for the demo chapters only, and lines a capture up on the marks', () => {
    const api: Record<string, (...a: unknown[]) => unknown> = {};
    installCurvesDebug(api as Record<string, unknown>);
    expect(api['curves']!()).toBe('today');
    expect(api['curves']!('new')).toBe('new');
    expect(api['curvesOn']!()).toBe(false);
    expect(api['curvesChapter']!('ffx2-bahamut')).toBe('ffx2-bahamut');
    expect(api['curvesOn']!()).toBe(true);
    expect(api['curvesChapter']!('yunalesca')).toBe('yunalesca');
    expect(api['curvesOn']!()).toBe(false);
    const m = api['strikeMarks']!('ffx') as { paced: Record<string, number>; onScreenAtDefaultPace: Record<string, number> };
    expect(m.onScreenAtDefaultPace['contact']).toBeCloseTo(400, 6);
    expect(m.onScreenAtDefaultPace['end']).toBeCloseTo(1100, 6);
    expect(m.paced['contact']! * defaultPaceFactor('ffx')).toBeCloseTo(400, 6);
  });
});
