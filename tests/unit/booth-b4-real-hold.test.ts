/**
 * THE REAL-CLIPS HOLD OF CHAPTER III (`booth-b4`, 2026-10-31; FFX only, a presentation hold, no number of a fight changes).
 *
 * The live gap pass of release 70 (`D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps2/`) found that Tidus's approved Chapter I return flip (the real-snappy clip's `returnProfile`) is drawn 1.66 times larger in Chapter III
 * and reads as 169 to 287 px one-frame attack hops and 306 to 417 px Energy Rain leaps that release 69's look does not have. `PIECE_HOLDS['braskas-final-aeon'].real` holds the real clips there: the gate that reads the piece
 * (`CurvesSwitch.realKind`) answers null, so every real consumer (`RealBeats`, `RealMoments`, `RealMotion`) answers undefined and the house curves play, which is what `?curves=new` plays. Chapter I keeps its real clips.
 *
 * Game case (AGENTS.md rule 14): FFX only. Chapter III is an FFX chapter; no FFX-2 chapter holds `real`, and Chapter IV (FFX-2, the booth pair) plays its real clips as before.
 *
 * Each test fails without the row: take `real` out of the Chapter III hold and the first one answers true.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PIECE_HOLDS, isTreatedChapter, setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { curvesGame, curvesOn, inDemoChapter, realKind, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { realProfileOf, realRecoilMs } from '../../src/engine/motion/RealBeats.ts';

const III = 'braskas-final-aeon';
const I = 'seymour-flux';
const IV = 'ffx2-bahamut';

/** The slice of the presenter's stage the real answers read: the art id of a combatant (Tidus, in both chapters). */
const ctx = { stage: { artOf: (id: string) => id } } as never;

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
  setCurvesMode(null);
});

describe('Chapter III holds the real clips (booth-b4)', () => {
  it('under the scope all Chapter III answers real=false and Chapter I answers real=true; Chapter IV (FFX-2) keeps its real clips too', () => {
    setTreatedScope('all');
    expect(isTreatedChapter(III, 'real')).toBe(false);
    expect(isTreatedChapter(I, 'real')).toBe(true);
    expect(isTreatedChapter(IV, 'real')).toBe(true);
    expect(treatedHold(III, 'real')).toBeDefined();
    expect(treatedHold(I, 'real')).toBeUndefined();
    expect(treatedHold(IV, 'real')).toBeUndefined();
    expect(inDemoChapter(III, 'real')).toBe(false);
    expect(inDemoChapter(I, 'real')).toBe(true);
  });

  it('the hold is the one FFX chapter that holds real: no other chapter in the table holds it, and Chapter III still holds its breath and its moments beside it', () => {
    const holders = Object.entries(PIECE_HOLDS).filter(([, rows]) => rows.real !== undefined).map(([id]) => id);
    expect(holders).toEqual([III]);
    expect(Object.keys(PIECE_HOLDS[III]!)).toEqual(['breath', 'moments', 'real']);
  });

  it('the reason names the measure, the pass and what lifts it, in the house shape (80 characters or more, ends in its "Lifts when" clause, no .json)', () => {
    const why = treatedHold(III, 'real')!;
    expect(why.length).toBeGreaterThanOrEqual(80);
    expect(why).toMatch(/^FFX, Chapter III: /);
    expect(why).toMatch(/return flip/);
    expect(why).toMatch(/returnProfile/);
    expect(why).toMatch(/1\.66 times larger/);
    expect(why).toMatch(/169-287 px/);
    expect(why).toMatch(/306-417 px/);
    expect(why).toMatch(/release 70/);
    expect(why).toMatch(/Lifts when the flip is scaled to the figure's drawn size and a CHK-027 run of Chapter III shows no teleport\.$/);
    expect(why).not.toMatch(/\.json/);
  });

  it('with the pack\'s default mode (real-snappy) Chapter III plays the house curves: the curves are on, no real kind, no real profile for Tidus, no real recoil; Chapter I plays the real clip', () => {
    setTreatedScope('all');
    setCurvesMode('real-snappy');

    setDemoChapter(III);
    expect(curvesOn()).toBe(true); // the curves still play (`curves` is not held): what `?curves=new` plays
    expect(curvesGame()).toBe('ffx');
    expect(realKind()).toBeNull();
    expect(realProfileOf(ctx, 'tidus' as never)).toBeUndefined();
    expect(realRecoilMs(ctx, 'tidus' as never, 321)).toBe(321); // the fallback: the house recoil

    setDemoChapter(I);
    expect(curvesOn()).toBe(true);
    expect(realKind()).toBe('snappy');
    expect(realProfileOf(ctx, 'tidus' as never)).toBeDefined(); // Chapter I keeps its real clips
  });

  it('an explicit ?curves=real is held in Chapter III too (the real speed is the same clips), and ?curves=new answers the same in both chapters: no real kind, the house curves', () => {
    setTreatedScope('all');
    setDemoChapter(III);
    setCurvesMode('real');
    expect(realKind()).toBeNull();
    expect(curvesOn()).toBe(true);
    setCurvesMode('new');
    expect(realKind()).toBeNull();
    expect(curvesOn()).toBe(true);
    setDemoChapter(I);
    expect(realKind()).toBeNull(); // `new` is no real mode anywhere
    expect(curvesOn()).toBe(true);
    setCurvesMode('real');
    expect(realKind()).toBe('real');
  });

  it('under `?treated=pack` (release 68) Chapter III answers no piece at all, as before; the hold changes nothing there', () => {
    setTreatedScope('pack');
    setCurvesMode('real-snappy');
    setDemoChapter(III);
    expect(isTreatedChapter(III, 'real')).toBe(false);
    expect(curvesOn()).toBe(false);
    expect(realKind()).toBeNull();
    setDemoChapter(I);
    expect(realKind()).toBe('snappy');
  });
});
