/**
 * Motion pass, lane "core", step 3 (the per-game MOMENTS): the switch, the numbers, and the REAL `PaintedActor` / `LivingFigure` playing them.
 * - Victory, each game's own: FFX (Chapter I) CHEERS, with the victory painting swapped on the take-off's fastest frame; FFX-2 Chapter IV (the pose is withheld by the sources) STANDS DOWN.
 * - The knock-out: the cross to the lying painting is a CUT inside the smear's window (no frame shows both), the fall takes the same time, and the landing rebounds a little.
 * With the switch off (the default), outside the demo chapters, and under every unit test that does not ask, today's behaviour is unchanged.
 * Game case: both (shared plumbing); FFX in Chapter I, FFX-2 in Chapter IV only by chapter id and by the chapter's own victory rule.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './head-lock-fixture.ts';
import { LivingFigure, type LifeCtx } from '../../../src/engine/fx/mix/living.ts';
import { fallRun, KO_BUCKLE_MS, koCrossMs } from '../../../src/engine/KoFall.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { momentsModeFromSearch, momentsOn, setMomentsMode } from '../../../src/engine/motion/MomentsSwitch.ts';
import { KO_CUT_STRENGTH, cheerShape, koCutMs, koSettleShape, standDownShape, victoryKind } from '../../../src/engine/motion/MomentsPlan.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { resetSmearLog, smearLog } from '../../../src/engine/motion/SmearLog.ts';
import { CUT_MS_MAX, CUT_MS_MIN, FRAMES_MIN, WINDOW_CAP_MS } from '../../../src/engine/motion/SmearPlan.ts';
import { CurveDriver } from '../../../src/engine/motion/CurveDriver.ts';
import { SQUASH_CAP } from '../../../src/engine/motion/StrikeCurve.ts';
import { standDownParty } from '../../../src/engine/motion/MomentBeats.ts';
import type { CoarseMask } from '../../../src/engine/PoseAlign.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
});
afterEach(() => {
  setMomentsMode(null);
  setSmearStyle(null);
  setCurvesMode(null);
  setCurvesChapter(undefined);
  setPaceGame('other');
  resetSmearLog();
  reset();
});

const FRAME120 = 1000 / 120;
const FRAME60 = 1000 / 60;

// ------------------------------------------------------------------------------- the switch

describe('the switch', () => {
  it('is OFF by default, turns on with ?moments=new or ?pack=demo, and ?moments=today wins over the pack', () => {
    expect(momentsModeFromSearch(undefined)).toBe('today');
    expect(momentsModeFromSearch('')).toBe('today');
    expect(momentsModeFromSearch('?moments=new')).toBe('new');
    expect(momentsModeFromSearch('?pack=demo')).toBe('new');
    expect(momentsModeFromSearch('?pack=demo&moments=today')).toBe('today');
    expect(momentsModeFromSearch('?moments=bogus')).toBe('today');
  });

  it('plays only in the two demo chapters', () => {
    setMomentsMode('new');
    expect(momentsOn()).toBe(false); // no chapter named
    setCurvesChapter('yunalesca');
    expect(momentsOn()).toBe(false);
    setCurvesChapter('seymour-flux');
    expect(momentsOn()).toBe(true);
    setCurvesChapter('ffx2-bahamut');
    expect(momentsOn()).toBe(true);
    setMomentsMode('today');
    expect(momentsOn()).toBe(false);
  });
});

// ------------------------------------------------------------------------------- the numbers

describe('the numbers', () => {
  it('a chapter whose sources withhold the pose stands down, every other one cheers', () => {
    expect(victoryKind('hold')).toBe('stand-down');
    expect(victoryKind('pose')).toBe('cheer');
    expect(victoryKind(undefined)).toBe('cheer');
    expect(victoryKind(null)).toBe('cheer');
  });

  it('the cheer is subtle in its squash (never over 6 percent) and swaps a few frames into the flight, after the crouch', () => {
    const s = cheerShape('ffx');
    for (const k of [s.options.crouch, s.options.stretch, s.options.land]) expect(k!).toBeLessThanOrEqual(SQUASH_CAP);
    expect(s.swapU).toBeGreaterThan(s.options.anticipation!);
    expect(s.swapU).toBeLessThan(s.options.anticipation! + 0.2); // within the first fifth of the flight: the rise is steepest at the take-off
    expect(s.height).toBeGreaterThan(0.1);
    expect(s.height).toBeLessThan(0.25);
    expect(cheerShape('ffx2')).toEqual(s); // one shape for both: the sources give none for either
  });

  it('the stand-down never leaves the floor and settles under 2 percent', () => {
    const s = standDownShape('ffx2');
    expect(s.options.crouch!).toBeLessThanOrEqual(0.02);
    expect(s.options.stretch!).toBeLessThan(0.01);
    expect(s.options.land).toBe(0);
  });

  it('the KO rebound is small, scaled by size, and under the squash cap', () => {
    const party = koSettleShape(1.82, 0);
    const boss = koSettleShape(4.1, 1);
    expect(party.height).toBeGreaterThan(0.01);
    expect(party.height).toBeLessThan(0.06);
    expect(boss.height / 4.1).toBeLessThan(party.height / 1.82); // a boss rebounds less, as a share of its height
    expect(boss.ms).toBeGreaterThan(party.ms); // and slower
    for (const s of [party, boss]) {
      expect(s.options.land!).toBeLessThanOrEqual(SQUASH_CAP);
      expect(s.options.stretch!).toBeLessThanOrEqual(SQUASH_CAP);
    }
  });

  it('the KO cut window is the smear\'s own: at least 2.25 display frames, 24 ms or more, never past the cap', () => {
    for (const hz of [30, 60, 120, 144, 240]) {
      const ms = 1000 / hz;
      const w = koCutMs(ms);
      expect(w, `${hz} Hz`).toBeGreaterThanOrEqual(CUT_MS_MIN);
      expect(w, `${hz} Hz`).toBeLessThanOrEqual(WINDOW_CAP_MS);
      expect(w, `${hz} Hz`).toBeGreaterThanOrEqual(Math.min(WINDOW_CAP_MS, Math.round(FRAMES_MIN * ms)));
    }
    expect(koCutMs(1000 / 120)).toBeLessThanOrEqual(CUT_MS_MAX);
    expect(koCutMs(0)).toBeLessThanOrEqual(CUT_MS_MAX);
    expect(KO_CUT_STRENGTH).toBeGreaterThan(0.5);
    expect(KO_CUT_STRENGTH).toBeLessThanOrEqual(1);
  });
});

// ------------------------------------------------------------------------------- the leap's marks

describe('a leap\'s marks', () => {
  it('fire once, on the first frame the leap reaches them, and not before', () => {
    const d = new CurveDriver();
    const seen: number[] = [];
    let t = 0;
    void d.leap(0.3, 400, { anticipation: 0.2, marks: [{ u: 0.28, fn: () => seen.push(t) }] });
    for (let i = 0; i < 100; i++) {
      t += 4;
      d.advance(4);
    }
    expect(seen).toHaveLength(1);
    expect(seen[0]!).toBeGreaterThanOrEqual(0.28 * 400 - 1e-6);
    expect(seen[0]!).toBeLessThanOrEqual(0.28 * 400 + 4);
  });

  it('a leap that is finished early (a fourth one starting) still runs the mark, so a swap that waits on it happens', async () => {
    const d = new CurveDriver();
    let fired = 0;
    void d.leap(0.1, 400, { marks: [{ u: 0.5, fn: () => fired++ }] });
    d.advance(10);
    for (let i = 0; i < 3; i++) void d.leap(0.1, 400);
    expect(fired).toBe(1);
  });
});

// ------------------------------------------------------------------------------- the KO run as a cut

describe('KoRun as a cut', () => {
  it('no frame shows both paintings, the fall takes the same time, and the cut sits at the end of the topple', () => {
    const plain = fallRun('topple', 'ffx')!;
    const cut = fallRun('topple', 'ffx', 30)!;
    expect(cut.opts.cut).toBe(true);
    expect(plain.opts.cut).toBeUndefined();
    expect(cut.opts.crossMs).toBe(30);
    expect(cut.opts.holdMs + cut.opts.crossMs).toBe(plain.opts.holdMs + plain.opts.crossMs); // the same time in all
    let frames = 0;
    let both = 0;
    let last = { out: 1, inn: 0 };
    while (!cut.done && frames < 400) {
      cut.step(FRAME120, FRAME120);
      const p = cut.pose;
      if (p.out > 0 && p.inn > 0) both++;
      last = p;
      frames++;
    }
    expect(both).toBe(0);
    expect(last.inn).toBe(1);
    expect(frames).toBeGreaterThanOrEqual(Math.floor(KO_BUCKLE_MS.ffx / FRAME120));
  });

  it('crossU runs 0 to 1 across the window only', () => {
    const run = fallRun('topple', 'ffx', 34)!;
    expect(run.crossU).toBe(0);
    let t = 0;
    while (run.pose.phase === 'hold') {
      run.step(FRAME120, FRAME120);
      t += FRAME120;
    }
    expect(t).toBeGreaterThan(200);
    expect(run.crossU).toBeLessThan(0.35);
    let seen = run.crossU;
    while (!run.done) {
      run.step(FRAME120, FRAME120);
      expect(run.crossU).toBeGreaterThanOrEqual(seen);
      seen = run.crossU;
    }
    expect(run.crossU).toBe(1);
  });

  it('with no window the run is exactly today\'s (a flip stays a flip)', () => {
    expect(fallRun('topple', 'ffx')!.opts).toEqual({ kind: 'fall', holdMs: KO_BUCKLE_MS.ffx, crossMs: koCrossMs(), riseMs: 0, travel: true, buckle: true, puff: 1 });
    expect(fallRun('flip', 'ffx', 30)!.opts.cut).toBeUndefined();
    expect(fallRun('cut', 'ffx', 30)).toBeNull();
    // only a topple (a party figure falling to a lying painting) is cut: a colossus's buckle and a prone standing painting keep the capped cross, whose pair is not always a big change
    for (const mode of ['cross', 'buckle-cross'] as const) expect(fallRun(mode, 'ffx', 30)!.opts).toEqual(fallRun(mode, 'ffx')!.opts);
  });
});

// ------------------------------------------------------------------------------- the real actor

const N = 48;
const mask = (solid: (col: number, row: number) => boolean): CoarseMask => {
  const bits = new Uint8Array(N * N);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) bits[r * N + c] = solid(c, r) ? 1 : 0;
  return { w: N, h: N, bits };
};
const LEFT = mask((c) => c < N / 2);
const RIGHT = mask((c) => c >= N / 2);

/** Tidus with an `idle` on the left half and a `victory` on the right half (they share nothing: a big change). */
function tidus(name = 'tidus'): Actor {
  const a = new PaintedActor({ name, worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: painting('tidus', 'idle', { silhouette: LEFT }), victory: painting('tidus', 'victory', { silhouette: RIGHT }), ko: painting('tidus', 'ko', { silhouette: RIGHT }) }, 'idle');
  a.position.set(-2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}
const inner = (a: Actor): { position: { x: number; y: number }; scale: { x: number; y: number } } => (a as unknown as { inner: ReturnType<typeof inner> }).inner;
const cellsOf = (a: Actor): { smearAmt: { value: number } } => (a as unknown as { u: ReturnType<typeof cellsOf> }).u;

/** Step the actor `ms` in frames of `frame`; `each` sees every frame (the time since the start, ms). */
function run(a: Actor, ms: number, frame: number, each?: (t: number) => void): void {
  const n = Math.round(ms / frame);
  for (let i = 1; i <= n; i++) {
    a.update(frame / 1000, frame / 1000);
    each?.(i * frame);
  }
}

describe('victory: FFX cheers (Chapter I)', () => {
  it('switched off, the victory painting is asked for at once and the hop is today\'s (no lift before its stagger, no held painting)', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('today');
    const a = tidus();
    a.setPose('victory');
    expect(a.pose).toBe('victory');
  });

  it('switched on, the victory painting waits for the take-off: idle through the crouch, victory a few frames into the spring, with the figure already rising', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('new');
    const a = tidus();
    a.setPose('victory');
    expect(a.pose).toBe('idle'); // not yet
    let swappedAt = -1;
    let liftThen = 0;
    let sy = 1;
    let minSy = 1;
    run(a, 700, FRAME120, (t) => {
      if (swappedAt < 0 && a.pose === 'victory') {
        swappedAt = t;
        liftThen = inner(a).position.y;
      }
      sy = inner(a).scale.y;
      minSy = Math.min(minSy, sy);
    });
    const s = cheerShape('ffx');
    const expected = s.swapU * s.ms; // on-screen ms at the default pace
    expect(swappedAt).toBeGreaterThan(expected - 2 * FRAME120);
    expect(swappedAt).toBeLessThan(expected + 2 * FRAME120);
    expect(liftThen).toBeGreaterThan(0); // already off the floor: a moving figure
    expect(minSy).toBeGreaterThanOrEqual(1 - SQUASH_CAP - 1e-9); // subtle
    expect(a.pose).toBe('victory');
    expect(inner(a).position.y).toBeLessThan(0.03); // home again (the victory posture stands a hair taller: its own crouch is -0.01)
  });

  it('with the smear on, the swap is a planned cut inside the spring (logged), and no frame shows both paintings', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('new');
    setSmearStyle('paint');
    const a = tidus();
    a.setPose('victory');
    const [p, q] = slotsOf(a);
    let both = 0;
    let peak = 0;
    run(a, 700, FRAME120, () => {
      if (p.fade > 1e-6 && q.fade > 1e-6) both++;
      peak = Math.max(peak, cellsOf(a).smearAmt.value);
    });
    const log = smearLog();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ actor: 'tidus', from: 'idle', to: 'victory', kind: 'plane' });
    expect(both).toBe(0);
    expect(peak).toBeGreaterThan(0.2);
    expect(cellsOf(a).smearAmt.value).toBe(0); // the window closed
  });

  it('another pose request while it waits ends the wait: no stale victory painting arrives later', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('new');
    const a = tidus();
    a.setPose('victory');
    run(a, 40, FRAME120);
    a.setPose('idle');
    run(a, 700, FRAME120);
    expect(a.pose).toBe('idle');
  });

  it('asking again while it waits is ignored (the presenter calls once, but a stage re-staging must not cut early)', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('new');
    const a = tidus();
    a.setPose('victory');
    a.setPose('victory');
    expect(a.pose).toBe('idle');
    run(a, 700, FRAME120);
    expect(a.pose).toBe('victory');
  });

  it('outside the demo chapters the moments do nothing even when asked for', () => {
    setCurvesChapter('yunalesca');
    setMomentsMode('new');
    const a = tidus();
    a.setPose('victory');
    expect(a.pose).toBe('victory');
  });

  it('a figure with no victory painting of its own still cheers (the spring plays) and keeps its pose', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('new');
    const a = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
    a.adoptPoses({ idle: painting('tidus', 'idle') }, 'idle');
    a.position.set(-2, 0, 0);
    a.setPose('idle', { immediate: true, force: true });
    a.setPose('victory');
    let top = 0;
    run(a, 700, FRAME120, () => (top = Math.max(top, inner(a).position.y)));
    expect(top).toBeGreaterThan(0.1);
    expect(a.pose).toBe('idle');
  });
});

describe('victory: FFX-2 Chapter IV stands down (the sources withhold the pose)', () => {
  it('standDown never changes the painting and never leaves the floor; the figure settles under 2 percent and comes back', () => {
    setPaceGame('ffx2');
    setCurvesChapter('ffx2-bahamut');
    setMomentsMode('new');
    const a = tidus('rikku');
    a.standDown();
    let low = 1;
    let top = 0;
    let maxX = 0;
    run(a, 1400, FRAME120, () => {
      low = Math.min(low, inner(a).scale.y);
      top = Math.max(top, inner(a).position.y);
      maxX = Math.max(maxX, inner(a).scale.x);
    });
    expect(a.pose).toBe('idle');
    expect(top).toBeCloseTo(0, 6);
    expect(low).toBeLessThan(0.99);
    expect(low).toBeGreaterThan(0.975);
    expect(inner(a).scale.y).toBeCloseTo(1, 3);
    expect(inner(a).scale.x * inner(a).scale.y).toBeCloseTo(1, 3);
    expect(maxX).toBeLessThan(1.03);
  });

  it('the presenter beat stands every party figure down, and only when the moments are on', () => {
    const made: string[] = [];
    const actor = (id: string): { standDown: () => void } => ({ standDown: () => void made.push(id) });
    const actors: Record<string, { standDown: () => void }> = { a: actor('a'), b: actor('b'), foe: actor('foe') };
    const side: Record<string, string> = { a: 'party', b: 'aeon', foe: 'enemy' };
    const ctx = { stage: { staged: () => ['a', 'b', 'foe'], sideOf: (id: string) => side[id], actor: (id: string) => actors[id] } } as unknown as EventCtx;
    setCurvesChapter('ffx2-bahamut');
    setMomentsMode('today');
    expect(standDownParty(ctx)).toBe(false);
    expect(made).toEqual([]);
    setMomentsMode('new');
    expect(standDownParty(ctx)).toBe(true);
    expect(made).toEqual(['a', 'b']);
  });
});

// ------------------------------------------------------------------------------- the KO on the real actor

const FRAME = FRAME120;
type LivingCtx = Partial<LifeCtx>;
const ctxOf = (over: LivingCtx = {}): LifeCtx => ({ dt: 0, game: 'ffx', breath: false, collapse: true, rm: false, grid: [4, 6], ...over });

function step(a: Actor, living: LivingFigure, ms = FRAME, over: LivingCtx = {}): void {
  living.update(ctxOf({ dt: ms / 1000, realDt: ms / 1000, ...over }));
  a.update(ms / 1000, ms / 1000);
}

/** Tidus, put under the mix, KO'd; the rows are what each frame shows. */
function koRows(frames: number, frame = FRAME, over: LivingCtx = {}, sil = false): { rows: Array<{ idle: number; ko: number; amt: number; y: number; sy: number }>; a: Actor; living: LivingFigure } {
  const a = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  a.adoptPoses(sil ? { idle: painting('tidus', 'idle', { silhouette: LEFT }), ko: painting('tidus', 'ko', { silhouette: RIGHT }) } : { idle: painting('tidus', 'idle'), ko: painting('tidus', 'ko') }, 'idle');
  a.position.set(-2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  const living = new LivingFigure(a);
  step(a, living, 0, over);
  for (let i = 0; i < 30; i++) step(a, living, frame, over); // the display's frame time is known by the time a figure falls
  a.setPose('ko');
  const rows: Array<{ idle: number; ko: number; amt: number; y: number; sy: number }> = [];
  for (let i = 0; i < frames; i++) {
    step(a, living, frame, over);
    const s = slotsOf(a);
    const fade = (pose: string): number => s.filter((x) => x.pose === pose).reduce((n, x) => n + x.fade, 0);
    rows.push({ idle: fade('idle'), ko: fade('ko'), amt: cellsOf(a).smearAmt.value, y: inner(a).position.y, sy: inner(a).scale.y });
  }
  return { rows, a, living };
}

describe('the knock-out', () => {
  it('today (switch off): the plain capped cross, both paintings up for a few frames, no smear, no rebound', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('today');
    setSmearStyle('paint');
    const { rows } = koRows(140);
    expect(rows.some((r) => r.idle > 0.02 && r.ko > 0.02)).toBe(true);
    expect(Math.max(...rows.map((r) => r.amt))).toBe(0);
    expect(smearLog()).toHaveLength(0);
    expect(Math.max(...rows.map((r) => r.y))).toBeLessThan(0.02); // the fall's own drop, no rebound
  });

  it('moments on, smear on: the cross is a CUT in the smear window (no frame shows both), logged, and the streak peaks at the cut', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('new');
    setSmearStyle('paint');
    const { rows } = koRows(140, FRAME, {}, true);
    expect(rows.filter((r) => r.idle > 1e-6 && r.ko > 1e-6)).toHaveLength(0);
    const first = rows.findIndex((r) => r.ko > 0);
    expect(first).toBeGreaterThan(20);
    const log = smearLog();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ actor: 'tidus', from: 'idle', to: 'ko', kind: 'plane', style: 'paint', flash: false });
    expect(log[0]!.cutMs).toBeGreaterThanOrEqual(CUT_MS_MIN);
    expect(log[0]!.big).toBe(true); // a plane laid on the floor has no footprint to read an overlap from: the engine says the pair is a big change, and the harness's `loggedAsBig` reads that
    // the streak: zero before the window, up to the strength at the cut, zero after
    const amts = rows.map((r) => r.amt);
    const peak = Math.max(...amts);
    expect(peak).toBeGreaterThan(0.4);
    expect(peak).toBeLessThanOrEqual(KO_CUT_STRENGTH + 1e-9);
    const peakAt = amts.indexOf(peak);
    expect(Math.abs(peakAt - first)).toBeLessThanOrEqual(2); // on the cut's own frame
    expect(rows.slice(0, Math.max(0, first - 8)).every((r) => r.amt === 0)).toBe(true);
    expect(rows.slice(first + 8).every((r) => r.amt === 0)).toBe(true);
    // and it ends on the KO painting alone
    expect(rows.at(-1)).toMatchObject({ idle: 0, ko: 1 });
  });

  it('the fall takes the same time cut or not (the KO painting is whole within one window of the plain cross\'s end)', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('today');
    const plain = koRows(140).rows;
    const plainEnd = plain.findIndex((r) => r.ko >= 1 - 1e-6);
    setMomentsMode('new');
    setSmearStyle('paint');
    const cut = koRows(140).rows;
    const cutEnd = cut.findIndex((r) => r.ko >= 1 - 1e-6);
    expect(Math.abs(cutEnd - plainEnd) * FRAME).toBeLessThanOrEqual(CUT_MS_MAX + 2 * FRAME);
  });

  it('moments on, smear OFF: the KO keeps its plain cross and only the rebound is added', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('new');
    setSmearStyle('off');
    const { rows } = koRows(140);
    expect(rows.some((r) => r.idle > 0.02 && r.ko > 0.02)).toBe(true);
    expect(smearLog()).toHaveLength(0);
    expect(Math.max(...rows.map((r) => r.amt))).toBe(0);
  });

  it('the landing rebounds: the figure comes up a little after the fall lands and is home again, within the squash cap', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('new');
    setSmearStyle('off');
    setMomentsMode('today');
    const base = Math.max(...koRows(220).rows.slice(30).map((r) => r.y));
    setMomentsMode('new');
    const { rows } = koRows(220);
    const rebound = Math.max(...rows.slice(30).map((r) => r.y));
    expect(rebound - base).toBeGreaterThan(0.008);
    expect(rebound).toBeLessThan(0.06);
    expect(rows.at(-1)!.y).toBeLessThan(0.002);
    for (const r of rows) {
      expect(r.sy).toBeGreaterThan(1 - 0.1);
      expect(r.sy).toBeLessThan(1 + 0.1);
    }
  });

  it('REDUCE MOTION keeps a KO a cut (no run, no streak); the rebound is the figure\'s own movement and still plays', () => {
    setCurvesChapter('seymour-flux');
    setMomentsMode('new');
    setSmearStyle('paint');
    const { rows } = koRows(220, FRAME, { rm: true });
    expect(smearLog()).toHaveLength(0);
    expect(rows.filter((r) => r.idle > 1e-6 && r.ko > 1e-6)).toHaveLength(0);
    expect(Math.max(...rows.slice(10).map((r) => r.y))).toBeGreaterThan(0.01);
  });

  it('works at 60 Hz too: still no frame with both paintings, a window of at least two frames', () => {
    setCurvesChapter('ffx2-bahamut');
    setPaceGame('ffx2');
    setMomentsMode('new');
    setSmearStyle('blur');
    const { rows } = koRows(80, FRAME60, { game: 'ffx2' });
    expect(rows.filter((r) => r.idle > 1e-6 && r.ko > 1e-6)).toHaveLength(0);
    const log = smearLog();
    expect(log).toHaveLength(1);
    expect(log[0]!.style).toBe('blur');
    expect(log[0]!.cutMs).toBeGreaterThanOrEqual(2 * FRAME60);
  });
});
