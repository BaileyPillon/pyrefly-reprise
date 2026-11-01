/**
 * THE REAL-CLIPS HOLD OF CHAPTER III, LIFTED (`booth-b4` put it on 2026-10-31; r72-motion lifts it; FFX only, a presentation change, no number of a fight changes).
 *
 * The live gap pass of release 70 (`D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps2/`) found that Tidus's approved Chapter I return flip (the real-snappy clip's `returnProfile`) is drawn 1.66 times larger in Chapter III
 * and reads as 169 to 287 px one-frame attack hops and 306 to 417 px Energy Rain leaps that release 69's look does not have. `booth-b4` held `real` in `PIECE_HOLDS['braskas-final-aeon']` (the house curves played);
 * the hold said "Lifts when the flip is scaled to the figure's drawn size and a CHK-027 run of Chapter III shows no teleport". `motion/FlipFit.ts` now scales the flip to the figure's drawn size (the worst frame of the
 * flip is Chapter I's, about 170 px of 900, wherever Tidus is drawn bigger: `booth-b4-r72-flip-fit.test.ts` plays the real actor at both sizes), so the row is gone and Chapter III plays the real clips as Chapter I does.
 *
 * Game case (AGENTS.md rule 14): FFX only. Chapter III is an FFX chapter; no FFX-2 chapter holds `real`, and Chapter IV (FFX-2, the booth pair) plays its real clips as before.
 *
 * Each test fails with the row back: put `real` into the Chapter III hold and the first one answers false.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PIECE_HOLDS, isTreatedChapter, setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { curvesGame, curvesOn, inDemoChapter, realKind, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { realProfileOf, realRecoilMs } from '../../src/engine/motion/RealBeats.ts';
import { getChapter } from '../../src/data/encounters.ts';

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

describe('Chapter III plays the real clips again (r72-motion)', () => {
  it('under the scope all Chapter III, Chapter I and Chapter IV all answer real=true, and none of the three holds it', () => {
    setTreatedScope('all');
    for (const id of [III, I, IV]) {
      expect(isTreatedChapter(id, 'real'), id).toBe(true);
      expect(treatedHold(id, 'real'), id).toBeUndefined();
      expect(inDemoChapter(id, 'real'), id).toBe(true);
    }
  });

  it('Chapter III does not hold real (and holds its breath and its moments as before); of the three chapters of the focused review of 10b426248 only XVIII (rows unread, off the list) still does: r73-fit lifted VIII and the Mirror Aeons (below)', () => {
    const holders = Object.entries(PIECE_HOLDS).filter(([, rows]) => rows.real !== undefined).map(([id]) => id);
    expect(holders.sort()).toEqual(['sin-face']); // the fit scales a RETURN flip only (Tidus, Yuna, Kimahri); Wakka's two-frame return and Lulu's none are paced by ReturnPace.ts (r73-fit); Auron's swaps in Sin's face are not his return
    expect(Object.keys(PIECE_HOLDS[III]!)).toEqual(['breath', 'moments']);
  });

  it("with the pack's default mode (real-snappy) Chapter III has the real kind, a real profile for Tidus and the real recoil, as Chapter I does", () => {
    setTreatedScope('all');
    setCurvesMode('real-snappy');
    for (const id of [III, I]) {
      setDemoChapter(id);
      expect(curvesOn(), id).toBe(true);
      expect(curvesGame(), id).toBe('ffx');
      expect(realKind(), id).toBe('snappy');
      expect(realProfileOf(ctx, 'tidus' as never), id).toBeDefined();
      expect(realRecoilMs(ctx, 'tidus' as never, 321), id).not.toBe(321); // the real clip's recovery, not the house fallback
    }
  });

  it('an explicit ?curves=real plays the real kind in Chapter III too, and ?curves=new answers the same in both chapters: no real kind, the house curves', () => {
    setTreatedScope('all');
    setDemoChapter(III);
    setCurvesMode('real');
    expect(realKind()).toBe('real');
    setCurvesMode('new');
    expect(realKind()).toBeNull();
    expect(curvesOn()).toBe(true);
    setDemoChapter(I);
    expect(realKind()).toBeNull(); // `new` is no real mode anywhere
    expect(curvesOn()).toBe(true);
  });

  it('under `?treated=pack` (release 68) Chapter III answers no piece at all, as before; Chapter I plays the real clips', () => {
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

// ---------------------------------------------------------------------------------------------------------------- r73-fit: VIII and the Mirror Aeons

/**
 * CHAPTER VIII (EVRAE) AND THE MIRROR AEONS PLAY THE REAL CLIPS AGAIN (r73-fit, 2026-11-01; FFX only; the driver's call under Bailey's delegation, his to overturn). The focused review of 10b426248 held both (R71-C2: 13 Wakka
 * attack-to-follow swap hops of 161 to 494 px; R71-C3: 32 Tidus and Yuna return-flip hops of 100 to 206.6 px). Release 72's fit scales the flip (Tidus 234.9 px in Chapter VIII, 177 to 206.6 in the Mirror Aeons, to Chapter I's 170); this
 * lane's `motion/ReturnPace.ts` stretches Wakka's two-frame return (and Lulu's none) out of the settle. The bar is Chapter I's own largest frame, no teleport: `booth-b4-r73-return-pace.test.ts` plays the real actor at the drawn sizes.
 */
describe('Chapter VIII and the Mirror Aeons play the real clips again (r73-fit)', () => {
  const LIFTED = [
    ['evrae-airship', ['hd2d', 'arena', 'breath', 'cam', 'moments']],
    ['mirror-aeons', ['hd2d', 'arena', 'card', 'breath', 'cam', 'moments']],
  ] as const;

  it('under the scope all both answer real=true with no hold on it, and what they still hold is exactly what they held before (the other rows unmoved)', () => {
    setTreatedScope('all');
    for (const [id, held] of LIFTED) {
      expect(isTreatedChapter(id, 'real'), id).toBe(true);
      expect(treatedHold(id, 'real'), id).toBeUndefined();
      expect(inDemoChapter(id, 'real'), id).toBe(true);
      expect(Object.keys(PIECE_HOLDS[id]!), id).toEqual(held);
    }
  });

  it("with the pack's default mode (real-snappy) both have the real kind, a real profile for Tidus and Wakka and the real recoil, as Chapter I does", () => {
    setTreatedScope('all');
    setCurvesMode('real-snappy');
    for (const [id] of LIFTED) {
      setDemoChapter(id);
      expect(curvesOn(), id).toBe(true);
      expect(realKind(), id).toBe('snappy');
      expect(realProfileOf(ctx, 'tidus' as never), id).toBeDefined();
      expect(realProfileOf(ctx, 'wakka' as never), id).toBeDefined();
      expect(realRecoilMs(ctx, 'tidus' as never, 321), id).not.toBe(321);
    }
  });

  it('?curves=new still answers the house curves in both, and under `?treated=pack` (release 68) neither answers any piece', () => {
    setTreatedScope('all');
    setCurvesMode('new');
    for (const [id] of LIFTED) {
      setDemoChapter(id);
      expect(realKind(), id).toBeNull();
      expect(curvesOn(), id).toBe(true);
    }
    setTreatedScope('pack');
    setCurvesMode('real-snappy');
    for (const [id] of LIFTED) {
      setDemoChapter(id);
      expect(isTreatedChapter(id, 'real'), id).toBe(false);
      expect(curvesOn(), id).toBe(false);
      expect(realKind(), id).toBeNull();
    }
  });

  it("Sin's face (off the list) is the only chapter that still has a `real` row, and the chapters that play the real clips are FFX ones (rule 14)", () => {
    expect(Object.entries(PIECE_HOLDS).filter(([, rows]) => rows.real !== undefined).map(([id]) => id)).toEqual(['sin-face']);
    expect(getChapter('evrae-airship')?.game).toBe('ffx');
    expect(getChapter('mirror-aeons')?.game).toBe('ffx');
  });
});
