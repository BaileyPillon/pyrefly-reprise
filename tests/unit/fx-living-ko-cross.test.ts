/**
 * FA-1 (visual-and-feel pass, 2026-10-10; PR-0378; both games): a KO painting that does not lie down CROSSES over instead of cutting.
 *
 * The REAL `PaintedActor` under the REAL `LivingFigure` (KO COLLAPSE's driver, `fx/mix/living.ts`), stepped frame by frame the way the game steps it:
 * `living.update` first (it is `MaxMix`'s, before the stage), then the actor. Every plane is read as the continuity harness reads it, by its painting's
 * name and its fade. The pure rules of the KO (the mode table, the clock, the capped cross) are `engine/ko-fall.test.ts`.
 *
 * What was wrong: `LivingFigure.onSetPose` forced `crossfadeMs = 0` for every KO, held the standing painting for the buckle and flipped to the KO painting
 * in one frame (EC-1001-09). That cut was written for a party member who falls; a colossus, a machine part, a pagoda and a Sin fin never lie down, so the
 * flip was a pure snap (78 of round 23's 96), and a standing painting already flagged prone by its shape (Vegnagun's tail, Overdrive Sin: the two largest
 * jerks of the run, 807 and 513 px) took a plain cut with no buckle at all.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './engine/head-lock-fixture.ts';
import { LivingFigure, type LifeCtx } from '../../src/engine/fx/mix/living.ts';
import { KO_CROSS_PEAK } from '../../src/engine/PoseBlend.ts';

afterEach(reset);

const FRAME = 1000 / 60;

type Painting = ReturnType<typeof painting>;

/** A figure whose poses are the given paintings (real records), staged the way the stage stages it. */
function figure(name: string, side: 'party' | 'enemy', poses: Record<string, Painting>): Actor {
  const a = new PaintedActor({ name, worldHeight: 1.82, side, breathe: false, sway: false, shadow: false });
  a.adoptPoses(poses, 'idle');
  a.position.set(side === 'party' ? -2 : 2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}

/** The two paintings a KO changes between, and the figure that carries them. */
const tidus = (): Actor => figure('tidus', 'party', { idle: painting('tidus', 'idle'), ko: painting('tidus', 'ko') });
const anima = (): Actor => figure('anima', 'enemy', { idle: painting('anima', 'idle'), ko: painting('anima', 'ko') });
/** Vegnagun's tail: a standing painting flagged prone by its shape (a lying body's painting stands in for its idle), then a KO painting that is prone too. */
const tail = (): Actor => figure('vegnagun-tail', 'enemy', { idle: painting('tidus', 'ko'), ko: painting('rikku', 'ko') });

const ctxOf = (over: Partial<LifeCtx> = {}): LifeCtx => ({ dt: 0, game: 'ffx', breath: false, collapse: true, rm: false, grid: [4, 6], ...over });

/** One frame of the game: the mix drives the figure (`living.update`, field dt and real dt), then the stage moves the actor. */
function step(a: Actor, living: LivingFigure, fieldMs = FRAME, realMs = FRAME, over: Partial<LifeCtx> = {}): void {
  living.update(ctxOf({ dt: fieldMs / 1000, realDt: realMs / 1000, ...over }));
  a.update(fieldMs / 1000, realMs / 1000);
}

/** The fade of each painting that shows, planes that hold one painting added up. */
function shown(a: Actor): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of slotsOf(a)) if (s.pose && s.fade > 0) out[s.pose] = (out[s.pose] ?? 0) + s.fade;
  return out;
}

/** Call the KO and step on: the rows are what each frame shows, row 0 the frame the KO was called in. */
function ko(a: Actor, living: LivingFigure, frames: number, over: Partial<LifeCtx> = {}, freeze: (i: number) => boolean = () => false): Array<Record<string, number>> {
  step(a, living, 0, 0, over); // the mix has seen the figure, with the part on
  a.setPose('ko');
  const rows = [shown(a)];
  for (let i = 0; i < frames; i++) {
    step(a, living, freeze(i) ? 0 : FRAME, FRAME, over);
    rows.push(shown(a));
  }
  return rows;
}

describe('a KO painting that does not lie down crosses over (Anima, a colossus whose KO painting stands)', () => {
  it('holds the standing painting for the buckle, then crosses to the KO painting on the capped curve and is never a cut', () => {
    const a = anima();
    const living = new LivingFigure(a);
    const rows = ko(a, living, 40);
    expect(living.last).toMatchObject({ cuts: 0, collapses: 1, crosses: 1 });
    // the hold: the standing painting alone, 14 frames (220 ms) counting the call frame
    const holdEnd = rows.findIndex((r) => (r['ko'] ?? 0) > 0);
    expect(holdEnd).toBe(14);
    for (let i = 0; i < holdEnd; i++) expect(rows[i], `frame ${i}`).toEqual({ idle: 1 });
    // the cross: both paintings up for at least 2 frames, the lesser one never above 0.382, the KO painting rising every frame
    const crossing = rows.filter((r) => (r['idle'] ?? 0) > 0.02 && (r['ko'] ?? 0) > 0.02);
    expect(crossing.length).toBeGreaterThanOrEqual(2);
    for (const r of rows) expect(Math.min(r['idle'] ?? 0, r['ko'] ?? 0)).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-9);
    let last = 0;
    for (let i = holdEnd; i < rows.length; i++) {
      const k = rows[i]!['ko'] ?? 0;
      expect(k, `frame ${i}`).toBeGreaterThanOrEqual(last);
      expect(k - last, `frame ${i}`).toBeLessThan(0.36); // no frame is a snap: the cut was a step of 1.0
      last = k;
    }
    // it ends on the KO painting alone, and the standing plane is gone
    expect(rows.at(-1)).toEqual({ ko: 1 });
  });

  it('FFX-2 buckles for 170 ms (11 frames counting the call frame), then the same cross', () => {
    const a = anima();
    const living = new LivingFigure(a);
    const rows = ko(a, living, 40, { game: 'ffx2' });
    expect(rows.findIndex((r) => (r['ko'] ?? 0) > 0)).toBe(11);
    expect(rows.at(-1)).toEqual({ ko: 1 });
  });

  it('the cross is on the real clock: a hit-stop that freezes the field for the whole cross does not freeze it', () => {
    const a = anima();
    const living = new LivingFigure(a);
    const rows = ko(a, living, 40, {}, (i) => i >= 14); // the field stops as the hold ends (its 14th frame is the last)
    const kos = rows.map((r) => r['ko'] ?? 0);
    expect(kos.at(-1)).toBe(1); // it finished
    // and no two frames of the cross repeat one another (a frozen half-mix would)
    const mid = kos.filter((k) => k > 0 && k < 1);
    for (let i = 1; i < mid.length; i++) expect(mid[i]!).toBeGreaterThan(mid[i - 1]!);
  });

  it('a hit-stop in the hold holds the buckle: the standing painting stays up and the cross waits', () => {
    const a = anima();
    const living = new LivingFigure(a);
    const rows = ko(a, living, 30, {}, (i) => i >= 4 && i < 12); // frozen for 8 frames mid-hold
    expect(rows.findIndex((r) => (r['ko'] ?? 0) > 0)).toBe(14 + 8);
  });
});

describe('the from.scale.prone branch: a standing painting already flagged prone (Vegnagun tail, Overdrive Sin) used to be a plain cut', () => {
  it('crosses from the first frame, with no buckle and no hold', () => {
    const a = tail();
    expect(slotsOf(a).find((s) => s.pose === 'idle')!.scale.prone).toBe(true);
    const living = new LivingFigure(a);
    const rows = ko(a, living, 12);
    expect(living.last).toMatchObject({ cuts: 0, collapses: 0, crosses: 1 });
    expect(rows[0]).toEqual({ idle: 1 }); // the call frame
    expect(rows[1]!['ko'] ?? 0).toBeGreaterThan(0); // the cross has begun
    for (const r of rows) expect(Math.min(r['idle'] ?? 0, r['ko'] ?? 0)).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-9);
    expect(rows.at(-1)).toEqual({ ko: 1 });
    // under 75 ms of it
    expect(rows.findIndex((r) => (r['ko'] ?? 0) === 1)).toBeLessThanOrEqual(6);
  });
});

describe('REDUCE MOTION: a short cross that moves nothing (the page default), no longer a cut', () => {
  it('a figure that would have buckled crosses at once, with no buckle at any frame', () => {
    const a = tidus();
    const living = new LivingFigure(a);
    const buckles: number[] = [];
    step(a, living, 0, 0, { rm: true });
    a.setPose('ko');
    const rows = [shown(a)];
    for (let i = 0; i < 12; i++) {
      step(a, living, FRAME, FRAME, { rm: true });
      buckles.push(living.last.buckle);
      rows.push(shown(a));
    }
    expect(living.last).toMatchObject({ cuts: 0, collapses: 0, crosses: 1 });
    expect(Math.max(...buckles)).toBe(0);
    expect(rows[1]!['ko'] ?? 0).toBeGreaterThan(0);
    for (const r of rows) expect(Math.min(r['idle'] ?? 0, r['ko'] ?? 0)).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-9);
    expect(rows.at(-1)).toEqual({ ko: 1 });
  });
});

describe('?kofall=off plays the KO as it was before this fix (a same-build A/B for the capture lane)', () => {
  it('the buckle, then one frame from the standing painting to the KO painting', () => {
    const was = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', { value: { search: '?kofall=off' }, configurable: true });
    try {
      const a = anima();
      const living = new LivingFigure(a);
      const rows = ko(a, living, 30);
      expect(living.last).toMatchObject({ cuts: 0, collapses: 1, crosses: 0 });
      const flip = rows.findIndex((r) => (r['ko'] ?? 0) > 0);
      expect(flip).toBe(14);
      expect(rows[flip]).toEqual({ ko: 1 });
      expect(rows[flip - 1]).toEqual({ idle: 1 });
    } finally {
      if (was) Object.defineProperty(globalThis, 'location', was);
      else delete (globalThis as { location?: unknown }).location;
    }
  });
});

describe('what stays as it was', () => {
  it('a KO with no painting of its own keeps the buckle and the flip (two layers of one painting would dim for a moment); under REDUCE MOTION it is a cut', () => {
    const lone = (): Actor => figure('rikku-thief', 'party', { idle: painting('rikku-thief', 'idle') });
    const a = lone();
    const living = new LivingFigure(a);
    const rows = ko(a, living, 30);
    expect(living.last).toMatchObject({ cuts: 0, collapses: 1, crosses: 0 });
    for (const r of rows) expect(Object.keys(r)).toEqual(['idle']);
    const b = lone();
    const l2 = new LivingFigure(b);
    ko(b, l2, 5, { rm: true });
    expect(l2.last).toMatchObject({ cuts: 1, collapses: 0, crosses: 0 });
  });

  it('a departure the KO collapse never touched (the Syndicate yields) is left to the actor\'s own blend', () => {
    const a = figure('leblanc', 'enemy', { idle: painting('anima', 'idle'), ko: painting('anima', 'ko') });
    const living = new LivingFigure(a);
    step(a, living, 0, 0);
    a.setPose('ko');
    expect(living.last).toMatchObject({ cuts: 0, collapses: 0, crosses: 0 });
    expect(a.blending).toBe(true);
  });

  it('any other pose ends a run where it stands: the KO painting at full, the standing one gone, and no half-mix is left', () => {
    const a = anima();
    const living = new LivingFigure(a);
    step(a, living, 0, 0);
    a.setPose('ko');
    for (let i = 0; i < 4; i++) step(a, living);
    expect(shown(a)).toEqual({ idle: 1 });
    a.setPose('idle', { immediate: true, force: true });
    for (let i = 0; i < 3; i++) step(a, living);
    expect(Object.values(shown(a)).reduce((x, y) => x + y, 0)).toBe(1);
    expect(living.last.buckle).toBe(0);
  });

  it('a part that is off leaves the actor\'s own crossfade alone', () => {
    const a = anima();
    const living = new LivingFigure(a);
    step(a, living, 0, 0, { collapse: false });
    a.setPose('ko');
    expect(living.last).toMatchObject({ cuts: 0, collapses: 0, crosses: 0 });
    expect(a.blending).toBe(true);
  });
});
