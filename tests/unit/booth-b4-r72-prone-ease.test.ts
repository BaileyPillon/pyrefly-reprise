/**
 * r72-motion, item 2 (shared plumbing, BOTH games): the knock-out floor slide eases in (`ProneLay.layProneFigures(..., dt)`, `SLIDE_EASE_MS`).
 *
 * The live gap pass of release 70 (`D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps2/`, FFX XIV Isaaru) found Ixion's lying painting 355 px (0.9 of half its length) from its station at the cross from the toppled
 * painting to the lying one, a swap jerk of 89 to 91 px against CHK-027's allowance of 80 at 1600 wide; the jerk is a quarter of the slide (250 px read 64.3, 340 read 86.4, 355 read 89.2, 357 read 89.8). The stage chooses
 * the place the body comes to rest on the frame the figure goes down and, until now, put it there at once. Now the choice is the same and the body gets there over 700 ms (smootherstep, the stage's real clock):
 * at the cross, 267 ms in, 28.5 percent of the slide is behind it, so the jerk reads 5 + 0.237 x 0.285 x 355 = 29 px.
 *
 * These tests run the REAL `PaintedActor` under the REAL `LivingFigure`, the REAL `layProneFigures` in the order of the stage (the mix, the actor, `layProneFigures`, the head lock), at 60, 120 and 144 Hz, with a
 * standing neighbour (and, for a long slide, a HUD panel through `setProneAvoid`) that makes the stage slide the lying body; FFX's Tidus and Yuna and an FFX-2 dress.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { SLIDE_EASE_MS, layProneFigures, setProneAvoid, type NdcBox } from '../../src/engine/ProneLay.ts';
import { reset, viewOf, type Actor } from './engine/head-lock-fixture.ts';
import { anchors, ctxOf, figure, lying, record, rig, slots, type Rig } from './engine/ko-fall-fixture.ts';
import { figureTrack } from '../../critic/runner/lib/continuity-pure.mjs';

beforeEach(() => setMoveWord('kotopple', 'today'));
afterEach(() => {
  reset();
  setProneAvoid(null);
  setMoveWord('kotopple', null);
});

/** A panel over the middle left of the frame (NDC): the body must lie clear of it, so the stage picks a long slide. */
const PANEL: NdcBox = { x0: -0.9, y0: -1, x1: -0.2, y1: 0.2 };
const smootherstep = (u: number): number => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const slideOf = (a: Actor): number => (a as unknown as { proneShift: number }).proneShift;

interface Lie {
  r: Rig;
  all: Actor[];
  hz: number;
  /** The slide the body has at the end of every frame since the KO was called (world units), and the lying plane's fade. */
  slide: number[];
  fade: number[];
  rows: Array<ReturnType<typeof record>>;
}

/** Knock `subject` out beside a neighbour and step `ms` of the game at `hz`; `dt` false is the old call (no clock), `freeze` holds the field clock on those frames (a hit-stop). */
function lie(subject: string, o: { hz: number; ms: number; dt: boolean; nx?: number; panel?: boolean; pinned?: boolean; freeze?: (i: number) => boolean }): Lie {
  setProneAvoid(o.panel ? () => [PANEL] : null);
  const r = rig(subject, { game: subject.includes('-') ? 'ffx2' : 'ffx' }); // an FFX-2 dress (yuna-thief) plays in an FFX-2 life layer
  const neighbour = figure('yuna');
  neighbour.position.set(o.nx ?? -1.4, 0, 0);
  neighbour.updateMatrixWorld(true);
  const all: Actor[] = [r.a, neighbour];
  const out: Lie = { r, all, hz: o.hz, slide: [], fade: [], rows: [] };
  const dt = 1 / o.hz;
  r.a.setPose('ko');
  for (let i = 0; i < Math.round((o.ms / 1000) * o.hz); i++) frame(out, o, i, dt);
  return out;
}

/** One frame of the game in the order of the stage: the mix, the actor, `layProneFigures`, the head lock. */
function frame(s: Lie, o: { dt: boolean; pinned?: boolean; freeze?: (i: number) => boolean }, i: number, dt: number): void {
  const field = o.freeze?.(i) ? 0 : dt;
  s.r.living.update(ctxOf({ dt: field, realDt: dt, ...s.r.over }));
  s.r.a.update(field, dt);
  layProneFigures(s.all, s.r.cam, undefined, o.pinned ? new Set([s.r.a]) : undefined, o.dt ? dt : undefined);
  s.r.a.holdHead(viewOf(s.r.cam));
  s.r.a.updateMatrixWorld(true);
  s.slide.push(slideOf(s.r.a));
  s.fade.push(lying(s.r.a).fade);
  s.rows.push(record(s.r));
}

/** The place the stage chose for the body (the old call puts it there on the first frame). */
const chosen = (subject: string, nx = -1.4, panel = false): number => lie(subject, { hz: 60, ms: 100, dt: false, nx, panel }).slide[0]!;

describe('the premise: the stage chooses a slide, and the old call puts the body there on the frame it goes down', () => {
  it.each([
    ['tidus', -1.4, false],
    ['yuna', -1.4, false],
    ['tidus', 2.5, true],
  ] as const)('%s beside a neighbour at %s (panel %s): a slide of 0.1 to 1 unit, whole on frame 0', (subject, nx, panel) => {
    const s = lie(subject, { hz: 60, ms: 200, dt: false, nx, panel });
    expect(Math.abs(s.slide[0]!)).toBeGreaterThan(0.1);
    expect(Math.abs(s.slide[0]!)).toBeLessThan(1);
    expect(new Set(s.slide).size).toBe(1);
  });
});

describe('the slide eases in over SLIDE_EASE_MS and comes to exactly the place the stage chose', () => {
  it('SLIDE_EASE_MS is 700 (0 would give the old behaviour back)', () => {
    expect(SLIDE_EASE_MS).toBe(700);
  });

  for (const hz of [60, 120, 144]) {
    for (const [subject, nx, panel] of [['tidus', -1.4, false], ['yuna', -1.4, false], ['tidus', 2.5, true], ['yuna-thief', 2.5, true]] as const) {
      it(`${subject} (nx ${nx}, panel ${panel}) at ${hz} Hz: nothing on the first frame, smootherstep of the time since, the chosen place at 700 ms and held after`, () => {
        const want = chosen(subject, nx, panel);
        expect(Math.abs(want)).toBeGreaterThan(0.1);
        const s = lie(subject, { hz, ms: 1200, dt: true, nx, panel });
        expect(s.slide[0]).toBe(0);
        // after k frames of 1/hz the slide is want x smootherstep(k / hz / 0.7)
        for (const k of [1, 5, 16, 30, 41, 60]) if (k < s.slide.length) expect(s.slide[k]! / want, `frame ${k}`).toBeCloseTo(smootherstep(k / hz / (SLIDE_EASE_MS / 1000)), 6);
        const done = Math.ceil((SLIDE_EASE_MS / 1000) * hz) + 1;
        expect(s.slide[done]).toBe(want); // exactly the place the old call chose, not a rounded one
        expect(s.slide.at(-1)).toBe(want);
        // it only goes one way
        for (let i = 1; i < s.slide.length; i++) expect(Math.abs(s.slide[i]!), `frame ${i}`).toBeGreaterThanOrEqual(Math.abs(s.slide[i - 1]!) - 1e-12);
      });
    }
  }

  it('the fastest frame of the slide is 1.875 times the average, so a 355 px slide (Ixion at Isaaru) moves 16 px a frame at 60 Hz at most', () => {
    const want = chosen('tidus', 2.5, true);
    const s = lie('tidus', { hz: 60, ms: 1000, dt: true, nx: 2.5, panel: true });
    let fastest = 0;
    for (let i = 1; i < s.slide.length; i++) fastest = Math.max(fastest, Math.abs(s.slide[i]! - s.slide[i - 1]!));
    expect(fastest / Math.abs(want)).toBeLessThan((1.875 * (1 / 60)) / 0.7 + 1e-3);
    expect((355 * (1.875 * (1 / 60))) / 0.7).toBeLessThan(17);
  });

  it('a hit-stop (the field clock held) never leaves it half-way: the slide runs on the real clock', () => {
    const s = lie('tidus', { hz: 60, ms: 1200, dt: true, panel: true, nx: 2.5, freeze: (i) => i >= 4 && i < 40 });
    const want = chosen('tidus', 2.5, true);
    expect(s.slide.at(-1)).toBe(want);
    expect(s.slide[Math.ceil(0.7 * 60) + 1]).toBe(want);
  });
});

describe('at the cross from the toppled painting to the lying one the slide is mostly still to come', () => {
  for (const hz of [60, 120, 144]) {
    it(`${hz} Hz: when the lying painting takes over (fade 0.5), 20 to 35 percent of the slide is behind it, where the old call had all of it`, () => {
      const old = lie('tidus', { hz, ms: 900, dt: false, nx: 2.5, panel: true });
      const eased = lie('tidus', { hz, ms: 900, dt: true, nx: 2.5, panel: true });
      const at = (s: Lie): number => s.fade.findIndex((f) => f >= 0.5);
      expect(at(old)).toBe(at(eased)); // the fall is the same fall
      const want = old.slide[0]!;
      expect(old.slide[at(old)]).toBe(want);
      const frac = eased.slide[at(eased)]! / want;
      expect(frac).toBeGreaterThan(0.2);
      expect(frac).toBeLessThan(0.35);
      // the jerk model of the gap pass, 5 + 0.237 x the slide in px: Ixion's 355 px read 89 and now reads under 40 (the allowance is 80)
      expect(5 + 0.237 * 355).toBeGreaterThan(80);
      expect(5 + 0.237 * 355 * frac).toBeLessThan(40);
    });
  }

  it('the tracked head and feet step no more across the fall than they did (the topple is the biggest step either way), and after the cross nowhere over 16 px a frame', () => {
    const worst = (s: Lie, from: number): number => {
      const a = anchors(s.r.a);
      const track = s.rows.map((rec) => figureTrack(rec, a as never));
      let w = 0;
      for (let i = Math.max(1, from); i < track.length; i++) for (const part of ['feet', 'head'] as const) {
        const p = track[i - 1]?.[part];
        const q = track[i]?.[part];
        if (p && q) w = Math.max(w, Math.hypot(q[0] - p[0], q[1] - p[1]));
      }
      return w;
    };
    const old = lie('tidus', { hz: 60, ms: 1500, dt: false, nx: 2.5, panel: true });
    const eased = lie('tidus', { hz: 60, ms: 1500, dt: true, nx: 2.5, panel: true });
    const at = eased.fade.findIndex((f) => f >= 0.5);
    expect(worst(eased, 1)).toBeLessThanOrEqual(worst(old, 1) + 1);
    expect(worst(eased, at + 1)).toBeLessThan(16);
  });
});

describe('who it touches and who it leaves alone', () => {
  it('a figure the stage does not slide (a chosen shift of 0) is never eased: the shift is 0 on every frame', () => {
    const s = lie('tidus', { hz: 60, ms: 1000, dt: true, nx: 2.5 });
    expect(new Set(s.slide)).toEqual(new Set([0]));
  });

  it('a pinned figure (a scene\'s enemy spot) is never slid, eased or not', () => {
    const s = lie('tidus', { hz: 60, ms: 1000, dt: true, nx: 2.5, panel: true, pinned: true });
    expect(new Set(s.slide)).toEqual(new Set([0]));
  });

  it('a revive in the middle of the slide stops it where it is and the lying body keeps lying there while it fades (no pop), then lets go', () => {
    const hz = 60;
    const s = lie('tidus', { hz, ms: 330, dt: true, nx: 2.5, panel: true }); // 20 frames in: the slide is part-way
    const want = chosen('tidus', 2.5, true);
    const mid = s.slide.at(-1)!;
    expect(Math.abs(mid)).toBeGreaterThan(0.1 * Math.abs(want));
    expect(Math.abs(mid)).toBeLessThan(0.9 * Math.abs(want));
    s.r.a.setPose('idle');
    const after: number[] = [];
    for (let i = 0; i < 60; i++) {
      frame(s, { dt: true }, 100 + i, 1 / hz);
      after.push(s.slide.at(-1)!);
    }
    expect(after[0]).toBe(mid); // held on the revive frame
    for (const v of after) expect(v === mid || v === 0, `${v}`).toBe(true); // never a third value: it did not carry on to the chosen place
    expect(after.at(-1)).toBe(0); // and goes with the lying plane once it has faded
  });

  it('the old call (no clock) is untouched: a caller that passes no dt gets the whole slide on the first frame and nothing after', () => {
    const s = lie('yuna', { hz: 60, ms: 1000, dt: false });
    expect(new Set(s.slide).size).toBe(1);
    expect(s.slide[0]).not.toBe(0);
  });

  it('the stage passes its real clock to the lay pass (source check: BattlePresenterStage.update calls layProneFigures with realDt)', () => {
    const src = readFileSync(resolve(__dirname, '../../src/engine/BattlePresenterStage.ts'), 'utf8');
    expect(src).toMatch(/layProneFigures\(\s*figures\.map\(\(s\) => s\.actor\),\s*this\.opts\.camera,\s*this\.opts\.battleCamera,\s*pinned, realDt,/);
    expect(slots(rig('tidus').a)).toHaveLength(2);
  });
});
