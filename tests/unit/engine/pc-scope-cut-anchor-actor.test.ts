/**
 * MF-18, the cut-side anchor, on the REAL `PaintedActor` (lane pc-scope, 2026-10-28; `motion/CutAnchor.ts`; both games, in the two pack chapters): a cut across far-apart heads draws the incoming plane back
 * toward the old head (the plane's `align`, `PaintedActor.placeSlot`), then eases it home; `?cutanchor=today` (the default) draws every plane where it always did, and when the glide ends every plane stands
 * exactly where it stands with the word off. Stepped frame by frame the way the game steps it.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { setMenuHold } from '../../../src/engine/motion/MenuHold.ts';
import { setMomentsMode } from '../../../src/engine/motion/MomentsSwitch.ts';
import { resetSmearLog, smearLog } from '../../../src/engine/motion/SmearLog.ts';
import { resetSwapLog } from '../../../src/engine/motion/SwapLog.ts';
import { setCauseMode, setStanceMode, setSwapScope } from '../../../src/engine/motion/SwapSwitch.ts';
import { setCutAnchorMode, type CutAnchorMode } from '../../../src/engine/motion/CutAnchor.ts';
import { paceRate } from '../../../src/engine/pace.ts';
import type { CoarseMask } from '../../../src/engine/PoseAlign.ts';

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
  setSmearStyle('paint');
  setCurvesChapter('seymour-flux');
});
afterEach(() => {
  setSmearStyle(null);
  setMomentsMode(null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setCauseMode(null, null);
  setStanceMode(null);
  setSwapScope(null);
  setCutAnchorMode(null);
  setMenuHold(null);
  setPaceGame('other');
  resetSmearLog();
  resetSwapLog();
  reset();
});

const N = 48;
const band = (c0: number, c1: number): CoarseMask => {
  const bits = new Uint8Array(N * N);
  for (let r = 0; r < N; r++) for (let c = c0; c < c1; c++) bits[r * N + c] = 1;
  return { w: N, h: N, bits };
};

/** Yuna whose idle stands in the left of its picture and whose hurt painting stands in the right: the two heads (the silhouettes' centroids: no head box is registered on these) are 0.33 of her height apart. */
function yuna(): Actor {
  const a = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  const paint = (pose: string, sil: CoarseMask) => painting('yuna', pose, { silhouette: sil });
  a.adoptPoses({ idle: paint('idle', band(8, 24)), hurt: paint('hurt', band(26, 42)), ko: paint('ko', band(26, 42)) }, 'idle');
  a.position.set(-2, 0, 0);
  return a;
}

interface Frame {
  /** The drift, the x and the fade of the plane drawing each painting, by its name. */
  hurt: { align: number; x: number; fade: number };
  idle: { align: number; x: number; fade: number };
}

/** The actor's two planes as the placement leaves them (the fixture's `Slot` type does not list the drift or the mesh position). */
interface Plane {
  pose: string;
  fade: number;
  align: number;
  mesh: { position: { x: number } };
}
const planes = (a: Actor): [Plane, Plane] => slotsOf(a) as unknown as [Plane, Plane];

function read(a: Actor): Frame {
  const at = (pose: string) => {
    const s = planes(a).find((p) => p.pose === pose)!;
    return { align: s.align, x: s.mesh.position.x, fade: s.fade };
  };
  return { hurt: at('hurt'), idle: at('idle') };
}

/** A hit on a figure at rest (`recoil`: the hurt swap is a cut on its cause under `?swapcause=cut`, and so is the recovery after it), stepped `n` frames at 60 Hz. */
function hit(mode: CutAnchorMode, n = 60): { frames: Frame[]; a: Actor } {
  setCutAnchorMode(mode);
  setCauseMode('cut');
  const a = yuna();
  const frames: Frame[] = [];
  a.recoil(340, 0.28);
  for (let i = 0; i < n; i++) {
    a.update(1 / 60);
    frames.push(read(a));
  }
  return { frames, a };
}

const hitEntry = () => smearLog().find((e) => e.to === 'hurt')!;

describe('the real actor: a hit on a figure at rest, a cut on its cause', () => {
  it('today (the default): no plane is ever drawn off its place, and the log has no glide', () => {
    const { frames } = hit('today');
    expect(hitEntry()).toMatchObject({ cause: 'hit', from: 'idle', to: 'hurt', kind: 'plane' });
    expect(smearLog().every((e) => e.glide === undefined)).toBe(true);
    expect(frames.every((f) => f.hurt.align === 0 && f.idle.align === 0)).toBe(true);
  });

  it('on: the incoming plane is drawn back at the cut, eases home, and ends where today puts it; the cut is the same cut', () => {
    const control = hit('today');
    resetSmearLog();
    resetSwapLog();
    const { frames } = hit('on');
    const e = hitEntry();
    expect(e.anchorDistance).toBeGreaterThan(0.12); // the precondition of this test: far apart, and under the 0.4 line of a cause cut at rest
    expect(e.anchorDistance).toBeLessThan(0.4);
    expect(e.glide).toBeDefined();
    expect(e.glide!.share).toBeCloseTo(e.anchorDistance! - 0.12, 2);

    // the hurt plane is drawn back toward the old head from the first frame of the window (it is not yet seen), and eases home; the first window ends where the recovery's begins
    const end = frames.findIndex((f) => f.idle.align !== 0);
    const drawn = frames.slice(0, end).map((f) => f.hurt.align);
    expect(end).toBeGreaterThan(10);
    expect(Math.abs(drawn[0]!)).toBeCloseTo(e.glide!.share * 1.82, 2);
    const mags = drawn.map(Math.abs);
    for (let k = 1; k < mags.length; k++) expect(mags[k]!).toBeLessThanOrEqual(mags[k - 1]! + 1e-12); // never grows
    expect(drawn.every((v) => v === 0 || Math.sign(v) === Math.sign(drawn[0]!))).toBe(true); // never crosses 0
    const home = drawn.findIndex((v) => v === 0);
    expect(home).toBeGreaterThan(5);
    expect((home + 1) * (1000 / 60)).toBeLessThanOrEqual(e.cutMs * 0.5 + e.glide!.ms + 3 * (1000 / 60));
    expect(drawn.slice(home).every((v) => v === 0)).toBe(true);
    // the plane that went out is never moved by this glide
    expect(frames.slice(0, end).every((f) => f.idle.align === 0)).toBe(true);
    // at the cut the hurt plane's x is the control's plus the drift; once home it is the control's, to the last digit
    expect(frames[0]!.hurt.x - control.frames[0]!.hurt.x).toBeCloseTo(drawn[0]!, 9);
    expect(frames[home + 1]!.hurt.x).toBe(control.frames[home + 1]!.hurt.x);
    // the cut itself is the cut: the hurt painting comes in on the same frame as with the word off
    const flip = (fs: Frame[]): number => fs.findIndex((f) => f.hurt.fade > f.idle.fade);
    expect(flip(frames)).toBe(flip(control.frames));
    // the recovery is anchored too, and in the end every plane stands where it stands with the word off
    expect(smearLog().filter((x) => x.glide)).toHaveLength(2);
    const last = frames.at(-1)!;
    expect(last.idle.align).toBe(0);
    expect(last.hurt.align).toBe(0);
    expect(last.idle.x).toBe(control.frames.at(-1)!.idle.x);
    expect(last.hurt.x).toBe(control.frames.at(-1)!.hurt.x);
  });

  it('moving: the hurt swap of a recoil is made on a figure the push is already moving (the planner reads the push speed), so it is anchored; a cut at true rest is not', () => {
    const { frames } = hit('moving');
    const e = hitEntry();
    expect(e.speed).toBeGreaterThan(0.45);
    expect(e.glide).toBeDefined();
    expect(frames[0]!.hurt.align).not.toBe(0);
    // the recovery is made at rest (the push is over): no anchor on it
    const rec = smearLog().find((x) => x.to === 'idle')!;
    expect(rec.speed).toBeLessThan(0.45);
    expect(rec.glide).toBeUndefined();
  });

  it('on, with the smear off or outside the pack: nothing is drawn off its place (there is no cut to anchor)', () => {
    setSmearStyle('off');
    const off = hit('on');
    expect(smearLog()).toHaveLength(0);
    expect(off.frames.every((f) => f.hurt.align === 0 && f.idle.align === 0)).toBe(true);
    setSmearStyle('paint');
    setCurvesChapter('tourist-trap');
    resetSmearLog();
    const out = hit('on');
    expect(smearLog()).toHaveLength(0);
    expect(out.frames.every((f) => f.hurt.align === 0 && f.idle.align === 0)).toBe(true);
  });

  it('two hits close together: the second cut counts what the first left on the plane, and every plane ends exactly home', () => {
    setCutAnchorMode('on');
    setCauseMode('cut');
    const a = yuna();
    a.recoil(340, 0.28);
    for (let i = 0; i < 6; i++) a.update(1 / 60); // the first glide is still going
    a.recoil(340, 0.28);
    for (let i = 0; i < 300; i++) a.update(1 / 60);
    const f = read(a);
    expect(f.hurt.align).toBe(0);
    expect(f.idle.align).toBe(0);
    expect(smearLog().filter((e) => e.glide).length).toBeGreaterThanOrEqual(2);
  });
});

/** The share of the figure's height the plane is drawn back by on the first frame of the window and on the frame the new painting is first seen, stepping the game at `hz`. */
function atFlip(hz: number): { first: number; flip: number; frame: number } {
  setCutAnchorMode('on');
  setCauseMode('cut');
  const a = yuna();
  a.recoil(340, 0.28);
  let first = Number.NaN;
  for (let i = 0; i < 90; i++) {
    a.update(1 / hz);
    const f = read(a);
    if (i === 0) first = Math.abs(f.hurt.align) / 1.82;
    if (f.hurt.fade > f.idle.fade) return { first, flip: Math.abs(f.hurt.align) / 1.82, frame: i + 1 };
  }
  return { first, flip: Number.NaN, frame: -1 };
}

describe('the real actor: the cut frame carries the whole shift at any display rate and any pace (review m-6, i-9)', () => {
  it('the frame the hurt painting is first seen is drawn with the same share of the height as the first frame, at 30, 60, 120, 144 and 240 Hz', () => {
    for (const hz of [30, 60, 120, 144, 240]) {
      const r = atFlip(hz);
      expect(r.frame, `${hz} Hz`).toBeGreaterThanOrEqual(1);
      expect(r.first, `${hz} Hz`).toBeGreaterThan(0.1);
      expect(r.flip, `${hz} Hz`).toBeCloseTo(r.first, 9);
      setCutAnchorMode(null);
      resetSmearLog();
      resetSwapLog();
    }
  });

  it('at every pace the glide runs on the blend clock itself: the cut frame is the flip frame (pace "current" is the unscaled one; "steady" and "relaxed" stretch the blend, which they do while the curves are on: the pack default since release 67)', () => {
    setCurvesMode('real-snappy'); // the pack's default in Chapter I and IV: the blend then runs on the paced clock
    for (const name of ['current', 'steady', 'relaxed'] as const) {
      setPace(name);
      for (const hz of [60, 144, 240]) {
        const r = atFlip(hz);
        expect(r.flip, `${name} ${hz} Hz`).toBeCloseTo(r.first, 9);
        setCutAnchorMode(null);
        resetSmearLog();
        resetSwapLog();
      }
    }
    setPace('steady');
    expect(paceRate('action')).not.toBe(1); // the default pace is not the unscaled one, so the clock the glide runs on matters
  });

  it('a hit-stop (the field held, dt 0; the real clock running) does not freeze the glide: it is where it is with no hold at all', () => {
    const run = (held: boolean): number[] => {
      setCutAnchorMode('on');
      setCauseMode('cut');
      resetSmearLog();
      const a = yuna();
      a.recoil(340, 0.28);
      const out: number[] = [];
      for (let i = 0; i < 24; i++) {
        if (held) a.update(0, 1 / 60);
        else a.update(1 / 60);
        out.push(read(a).hurt.align);
      }
      setCutAnchorMode(null);
      return out;
    };
    const free = run(false);
    resetSwapLog();
    const stopped = run(true);
    expect(stopped.some((v) => v !== 0)).toBe(true);
    expect(stopped.at(-1)).toBe(0); // the glide has ended in 24 real frames, held or not
    for (let k = 0; k < free.length; k++) expect(stopped[k], `frame ${k}`).toBeCloseTo(free[k]!, 9);
  });
});
