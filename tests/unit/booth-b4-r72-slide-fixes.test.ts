/**
 * r72-motion, the three majors of the adversarial review of the knock-out slide ease (item 2; BOTH games: the actor layer is shared by FFX chapters 1 to 3 and FFX-2 chapters 4 to 6, and the gate follows
 * the treated chapter's own game). `D:/Tools/pyrefly-scratch/2026-11-01/r72-motion/review/REVIEW.md` M1 to M3; each test below fails with its fix taken out (the mutants are listed in docs/handoff/r72-motion.md).
 *
 * - M1: under REDUCE MOTION the knock-out is a deliberate cut (`KoFall.koMode`, Bailey's pick of 2026-10-10), so the lying body is shown whole at its place; the ease must not glide it (43 frames of motion in the probe).
 * - M2: the ease must not change WHERE the bodies rest. A figure's place is chosen against where its neighbours will lie, so bodies down on one frame, or inside the 700 ms of the slide, stack no worse than the old call.
 * - M3: the ease follows the treatment's switches. It plays where the new curves play (a treated chapter, the curves not `today`, the pack on, `?treated=all`), so the untreated chapters, `?pack=off`, `?treated=pack`
 *   (outside the booth pair), `?curves=today`, the phone gate and `?kofall=off` give release 71's slide.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setDemoChapter, setTreatedScope, type TreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setCurvesMode, type CurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { setSlideEaseLegacy, slideEaseDt, slideEaseOn } from '../../src/engine/motion/SlideEase.ts';
import { SLIDE_EASE_MS, layProneFigures, setProneAvoid, type NdcBox } from '../../src/engine/ProneLay.ts';
import { cameraAt, reset, type Actor } from './engine/head-lock-fixture.ts';
import { ctxOf, figure, lying, rig } from './engine/ko-fall-fixture.ts';

const I = 'seymour-flux';
const IV = 'ffx2-bahamut';
const XIV = 'isaaru-via-purifico';

beforeEach(() => {
  setMoveWord('kotopple', 'today');
  setTreatedScope('all');
  setCurvesMode('real-snappy');
  setDemoChapter(XIV);
});
afterEach(() => {
  reset();
  setProneAvoid(null);
  setMoveWord('kotopple', null);
  setTreatedScope(null);
  setCurvesMode(null);
  setDemoChapter(undefined);
  setSlideEaseLegacy(null);
  vi.unstubAllGlobals();
});

const slideOf = (a: Actor): number => (a as unknown as { proneShift: number }).proneShift;
const PANEL: NdcBox = { x0: -0.9, y0: -1, x1: -0.2, y1: 0.2 };

// ------------------------------------------------------------------------------------------------ M3 and M1: the gate

describe('M3: the ease answers to the same switches as the rest of the treatment (the stage asks slideEaseDt)', () => {
  const run = (dt: number, rm = false): number | undefined => slideEaseDt(dt, rm);

  it.each([I, IV, XIV, 'yunalesca', 'braskas-final-aeon', 'ffx2-leblanc', 'ffx2-ixion-djose', 'yojimbo-cavern', 'seymour-omnis'])('a treated chapter (%s) with the pack on eases: the real clock comes back unchanged (IX and XII are treated again since r72-hud)', (id) => {
    setDemoChapter(id);
    expect(slideEaseOn(false)).toBe(true);
    expect(run(1 / 60)).toBe(1 / 60);
    expect(run(0)).toBe(0); // a hit-stop frame is a clock of 0, not "no clock"
  });

  it.each(['new', 'real', 'real-snappy'] as CurvesMode[])('every mode that turns the curves on eases (%s)', (mode) => {
    setCurvesMode(mode);
    expect(run(1 / 60)).toBe(1 / 60);
  });

  it.each(['sin-fins-core', 'exp-leblanc', 'a-hidden-chapter', undefined])('an untreated chapter (%s) gives release 71 its whole slide on the first frame: no clock (XVII is the listed chapter off the list; XVIII came back in r73-fast)', (id) => {
    setDemoChapter(id);
    expect(slideEaseOn(false)).toBe(false);
    expect(run(1 / 60)).toBeUndefined();
  });

  it('?curves=today and ?pack=off (the curves mode today) give no clock in a treated chapter, in every chapter', () => {
    setCurvesMode('today');
    for (const id of [I, IV, XIV, 'yunalesca', 'ffx2-leblanc']) {
      setDemoChapter(id);
      expect(run(1 / 60), id).toBeUndefined();
    }
  });

  it('?treated=pack: outside the booth pair no clock; the booth pair keeps its ease', () => {
    setTreatedScope('pack' as TreatedScope);
    for (const id of [XIV, 'yunalesca', 'braskas-final-aeon', 'ffx2-leblanc', 'ffx2-ixion-djose']) {
      setDemoChapter(id);
      expect(run(1 / 60), id).toBeUndefined();
    }
    for (const id of [I, IV]) {
      setDemoChapter(id);
      expect(run(1 / 60), id).toBe(1 / 60);
    }
  });

  it('?kofall=off (play the knock-out as before FA-1, for a same-build capture) gives no clock either', () => {
    vi.stubGlobal('location', { search: '?kofall=off' });
    setSlideEaseLegacy(null); // read the address
    expect(run(1 / 60)).toBeUndefined();
    vi.unstubAllGlobals();
    setSlideEaseLegacy(null);
    expect(run(1 / 60)).toBe(1 / 60);
    setSlideEaseLegacy(true); // the forced answer, for the tests that do not stub the address
    expect(run(1 / 60)).toBeUndefined();
  });

  it('the stage hands layProneFigures the gate, and the gate takes the stage\'s own REDUCE MOTION answer (source check)', () => {
    const src = readFileSync(resolve(__dirname, '../../src/engine/BattlePresenterStage.ts'), 'utf8');
    expect(src).toMatch(/pinned, slideEaseDt\(realDt, this\.opts\.comfort\?\.\(\)\.reduceMotion === true\),/);
    expect(src).not.toMatch(/pinned, realDt,/);
    // the same read the stage gives the actor's own `still` (REDUCE MOTION), so the two cannot disagree
    expect(src).toMatch(/actor\.still = \(\) => this\.opts\.comfort\?\.\(\)\.reduceMotion === true;/);
  });
});

describe('M1: REDUCE MOTION gets no new motion', () => {
  it('the gate withdraws the clock under REDUCE MOTION, in every treated chapter, in every mode', () => {
    for (const id of [I, IV, XIV, 'yunalesca', 'ffx2-leblanc']) {
      for (const mode of ['new', 'real', 'real-snappy'] as CurvesMode[]) {
        setDemoChapter(id);
        setCurvesMode(mode);
        expect(slideEaseDt(1 / 60, true), `${id} ${mode}`).toBeUndefined();
        expect(slideEaseOn(true), `${id} ${mode}`).toBe(false);
      }
    }
  });

  /** A knock-out under REDUCE MOTION (or not) in a treated chapter, the way the stage steps it: the mix, the actor, `layProneFigures` given what the gate answers. */
  function lie(rm: boolean, o: { ms: number; hz?: number }): { slide: number[]; fade: number[] } {
    const hz = o.hz ?? 60;
    setProneAvoid(() => [PANEL]);
    const r = rig('tidus', { rm, game: 'ffx' });
    const neighbour = figure('yuna');
    neighbour.position.set(2.5, 0, 0);
    neighbour.updateMatrixWorld(true);
    const dt = 1 / hz;
    const slide: number[] = [];
    const fade: number[] = [];
    r.a.setPose('ko');
    for (let i = 0; i < Math.round((o.ms / 1000) * hz); i++) {
      r.living.update(ctxOf({ dt, realDt: dt, ...r.over }));
      r.a.update(dt, dt);
      layProneFigures([r.a, neighbour], r.cam, undefined, undefined, slideEaseDt(dt, rm));
      r.a.updateMatrixWorld(true);
      slide.push(slideOf(r.a));
      fade.push(lying(r.a).fade);
    }
    return { slide, fade };
  }

  it('under REDUCE MOTION the lying body is shown whole at its place and never moves (the probe read 43 frames of glide)', () => {
    const s = lie(true, { ms: 1200 });
    expect(Math.abs(s.slide[0]!)).toBeGreaterThan(0.1); // a real slide was chosen (the premise)
    expect(new Set(s.slide).size).toBe(1); // 0 frames in which the body moves
    expect(s.fade.find((f) => f >= 1)).toBe(1); // the cut: the lying painting is whole within a frame or two
    expect(s.fade.findIndex((f) => f >= 1)).toBeLessThanOrEqual(2);
  });

  it('...at the place release 71 chooses, at every refresh rate', () => {
    for (const hz of [30, 60, 144]) {
      const rm = lie(true, { ms: 800, hz });
      const eased = lie(false, { ms: 1200, hz });
      expect(rm.slide[0], `${hz} Hz`).toBe(eased.slide.at(-1)); // rest where the eased body rests
    }
  });

  it('without REDUCE MOTION the same knock-out does glide (so the test above is not vacuous): more than 40 frames of motion at 60 Hz', () => {
    const s = lie(false, { ms: 1200 });
    let moving = 0;
    for (let i = 1; i < s.slide.length; i++) if (s.slide[i] !== s.slide[i - 1]) moving++;
    expect(moving).toBeGreaterThan(40);
    expect(s.slide[0]).toBe(0);
  });

  it('REDUCE MOTION switched on while a body is part-way puts it at its place at once and holds it there', () => {
    setProneAvoid(() => [PANEL]);
    const r = rig('tidus', { game: 'ffx' });
    const neighbour = figure('yuna');
    neighbour.position.set(2.5, 0, 0);
    neighbour.updateMatrixWorld(true);
    const dt = 1 / 60;
    r.a.setPose('ko');
    const trace: number[] = [];
    for (let i = 0; i < 60; i++) {
      r.living.update(ctxOf({ dt, realDt: dt, ...r.over }));
      r.a.update(dt, dt);
      layProneFigures([r.a, neighbour], r.cam, undefined, undefined, slideEaseDt(dt, i >= 20)); // REDUCE MOTION is turned on at frame 20
      trace.push(slideOf(r.a));
    }
    const part = trace[19]!;
    const want = trace.at(-1)!;
    expect(Math.abs(part)).toBeGreaterThan(0);
    expect(Math.abs(part)).toBeLessThan(Math.abs(want));
    expect(trace[20]).toBe(want);
    expect(new Set(trace.slice(20)).size).toBe(1);
  });
});

// ------------------------------------------------------------------------------------------------ M2: the choices are the old call's

interface Wipe {
  /** Each figure's slide at the end of every frame (world units). */
  trace: number[][];
  final: number[];
}

/**
 * Figures standing at `xs`, knocked out on the frames `koAt` (a frame index each), stepped `frames` frames at `hz`; `dt` false is the old call (no clock: each body lies at its chosen place at once), true the eased one.
 * The stage's own order: the actor, then `layProneFigures`.
 */
function wipe(names: string[], xs: number[], koAt: number[], o: { frames: number; dt: boolean; hz?: number; panel?: boolean }): Wipe {
  setProneAvoid(o.panel ? () => [PANEL] : null);
  const hz = o.hz ?? 60;
  const dt = 1 / hz;
  const cam = cameraAt(3);
  const all = names.map((n, i) => {
    const a = figure(n);
    a.position.set(xs[i]!, 0, 0);
    a.updateMatrixWorld(true);
    return a;
  });
  const trace: number[][] = names.map(() => []);
  for (let f = 0; f < o.frames; f++) {
    all.forEach((a, i) => { if (koAt[i] === f) a.setPose('ko'); });
    all.forEach((a) => a.update(dt, dt));
    layProneFigures(all, cam, undefined, undefined, o.dt ? dt : undefined);
    all.forEach((a, i) => { a.updateMatrixWorld(true); trace[i]!.push(slideOf(a)); });
  }
  return { trace, final: trace.map((t) => t.at(-1)!) };
}

/** The party-wipe positions the review swept (three bodies on one frame), and the names that give them different widths. */
const ROWS: Array<[string[], number[]]> = [
  [['tidus', 'yuna', 'tidus'], [-2.6, -1.5, -0.4]],
  [['tidus', 'yuna', 'yuna'], [-2.2, -1.4, -0.6]],
  [['yuna', 'tidus', 'yuna'], [-3.0, -1.8, -0.6]],
  [['tidus', 'tidus', 'yuna'], [-2.0, -1.2, -0.4]],
];

describe('M2: bodies down on one frame, or within the 700 ms of the slide, rest where the old call put them', () => {
  it('the premise: the old call chooses real slides for these rows (at least one body slides in every row)', () => {
    for (const [names, xs] of ROWS) {
      const old = wipe(names, xs, [0, 0, 0], { frames: 30, dt: false });
      expect(old.final.some((v) => Math.abs(v) > 0.05), `${names} ${xs}`).toBe(true);
    }
  });

  it.each(ROWS.map((r, i) => [i, ...r] as const))('row %s: three bodies down on ONE frame end at exactly the old call\'s three places', (_i, names, xs) => {
    const old = wipe(names, xs, [0, 0, 0], { frames: 90, dt: false });
    const eased = wipe(names, xs, [0, 0, 0], { frames: 90, dt: true });
    expect(eased.final).toEqual(old.final);
    // and they ease: nothing on the frame they go down
    for (const t of eased.trace) expect(t[0]).toBe(0);
  });

  it.each(ROWS.map((r, i) => [i, ...r] as const))('row %s: the places are the old call\'s on a wipe with a HUD panel to avoid, and at 144 Hz', (_i, names, xs) => {
    for (const hz of [60, 144]) {
      const old = wipe(names, xs, [0, 0, 0], { frames: Math.round(1.6 * hz), dt: false, hz, panel: true });
      const eased = wipe(names, xs, [0, 0, 0], { frames: Math.round(1.6 * hz), dt: true, hz, panel: true });
      expect(eased.final, `${hz} Hz`).toEqual(old.final);
    }
  });

  it('two knock-outs 0 to 800 ms apart (the second inside the first one\'s slide): the second rests where the old call put it, whatever the lag', () => {
    let differs = 0;
    for (const [names, xs] of ROWS) {
      for (const lagFrames of [0, 1, 3, 6, 12, 20, 30, 41, 42, 43, 48]) {
        const koAt = [0, lagFrames, -1];
        const old = wipe(names, xs, koAt, { frames: 160, dt: false });
        const eased = wipe(names, xs, koAt, { frames: 160, dt: true });
        expect(eased.final, `${names} ${xs} lag ${lagFrames}`).toEqual(old.final);
        if (lagFrames > 0 && lagFrames < 42 && Math.abs(old.final[1]!) > 0) differs++;
      }
    }
    expect(differs).toBeGreaterThan(0); // the sweep has bodies that slide inside the window: the test is not vacuous
  });

  it('three bodies one after another, 120 ms apart, end at the old call\'s places', () => {
    for (const [names, xs] of ROWS) {
      const koAt = [0, 7, 14];
      const old = wipe(names, xs, koAt, { frames: 200, dt: false });
      const eased = wipe(names, xs, koAt, { frames: 200, dt: true });
      expect(eased.final, `${names} ${xs}`).toEqual(old.final);
    }
  });

  it('a body that stands up on the frame another goes down stays where its clock had it (it is not left at the place the neighbour\'s choice parked it)', () => {
    for (const order of ['reviver first', 'reviver last'] as const) {
      setProneAvoid(null);
      const cam = cameraAt(3);
      const a = figure('tidus');
      const b = figure('yuna');
      a.position.set(-2.6, 0, 0);
      b.position.set(-1.5, 0, 0);
      const actors = order === 'reviver first' ? [a, b] : [b, a];
      for (const x of actors) x.updateMatrixWorld(true);
      const dt = 1 / 60;
      a.setPose('ko');
      let before = 0;
      for (let f = 0; f < 18; f++) { // a is part-way along its slide
        a.update(dt, dt); b.update(dt, dt);
        layProneFigures(actors, cam, undefined, undefined, dt);
        before = slideOf(a);
      }
      expect(Math.abs(before), order).toBeGreaterThan(0);
      a.setPose('idle'); // a stands up ...
      b.setPose('ko'); // ... on the frame b goes down
      a.update(dt, dt); b.update(dt, dt);
      layProneFigures(actors, cam, undefined, undefined, dt);
      expect(slideOf(a), order).toBe(before);
      expect(SLIDE_EASE_MS).toBe(700);
    }
  });
});
