/**
 * THE KO CUT IN CHAPTERS III, XII AND XIV IS HELD (release 71, branch `booth-ffx-b3b`, the review's M1 for III and XII, and the review of `booth-b3`'s M1 for XIV; FFX only for the chapters, the gate is both games).
 *
 * The brief's class 4: the moments turn a party figure's knock-out into a hard cut of the hurt-to-KO swap (`PaintedActorLife.koCutWindow`, which needs `momentsOn()` and `smearOn()`), and a cut whose step is over 0.5 of the drawn height fails
 * CHK-027 (Leblanc's Rikku Thief, measured at 0.62). The lane's own table has the reserve Rikku at 0.52, over the cap on the raw number, and both chapters can field her (the same seven as the approved Chapter I's), so
 * `DemoGate.PIECE_HOLDS['braskas-final-aeon' | 'seymour-omnis'].moments` holds the piece. Chapter XIV is Yuna alone with her aeons, all under the bounds on the offline estimate (`booth-ffx-b3b-classes`) but with no READ of her at a hard cut, and the rule holds an unread dress (`booth-b2-ko-rule`), so it holds the piece too. These tests pin the real actor's answer: the window the live KO run is
 * built with (`fx/mix/living.ts` passes `a.koCutWindow()` to `KoFall.fallRun`), the same shape as the Leblanc lane's.
 *
 * Chapter I and Chapter IV (the approved target) keep the cut (Chapter XIV, which the first merge let play it on an estimate, does not); a held chapter under `?treated=pack` is release 68 (no cut, nothing treated).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { reset, yuna } from './head-lock-fixture.ts';
import { fallRun } from '../../../src/engine/KoFall.ts';
import { setTreatedScope } from '../../../src/engine/motion/DemoGate.ts';
import { setCurvesChapter } from '../../../src/engine/motion/CurvesSwitch.ts';
import { momentsOn, setMomentsMode } from '../../../src/engine/motion/MomentsSwitch.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';

afterEach(() => {
  setTreatedScope(null);
  setCurvesChapter(undefined);
  setMomentsMode(null);
  setSmearStyle(null);
  reset();
});

/** The cut window a party figure's KO is built with in this chapter and scope, with the moments and the smear forced on the way the pack does. */
function koWindow(chapter: string, scope: 'all' | 'pack'): { window: number | undefined; moments: boolean; cut: boolean | undefined; crossMs: number } {
  setTreatedScope(scope);
  setCurvesChapter(chapter);
  setMomentsMode('new');
  setSmearStyle('paint');
  const window = yuna().koCutWindow();
  const run = fallRun('topple', 'ffx', window)!;
  return { window, moments: momentsOn(), cut: run.opts.cut, crossMs: run.opts.crossMs };
}

const HELD = ['braskas-final-aeon', 'seymour-omnis', 'isaaru-via-purifico'] as const;

describe('the KO cut of a party figure (the window the live KO run is built with)', () => {
  it('Chapter I and Chapter IV cut the KO inside the smear window (the approved target: a cut of a few frames, the lying painting arrives under it)', () => {
    for (const chapter of ['seymour-flux', 'ffx2-bahamut']) {
      const k = koWindow(chapter, 'all');
      expect(k.moments, chapter).toBe(true);
      expect(k.window, chapter).toBeGreaterThan(0);
      expect(k.cut, chapter).toBe(true);
      expect(k.crossMs, chapter).toBe(k.window);
    }
  });

  it.each(HELD)("%s plays release 68's KO: no window, the plain cross, so the swap is the blend CHK-027 passes (the hold on `moments`)", (chapter) => {
    const k = koWindow(chapter, 'all');
    expect(k.moments).toBe(false);
    expect(k.window).toBeUndefined();
    expect(k.cut).toBeUndefined();
    const plain = fallRun('topple', 'ffx')!;
    expect(k.crossMs).toBe(plain.opts.crossMs); // the same cross release 68 plays: a blend over several frames, not a cut of a few milliseconds
    expect(k.crossMs).toBeGreaterThan(60);
  });

  it('under ?treated=pack (release 68) the held chapters have no cut either, and the booth pair keeps it', () => {
    for (const chapter of HELD) expect(koWindow(chapter, 'pack').window, chapter).toBeUndefined();
    expect(koWindow('seymour-flux', 'pack').window).toBeGreaterThan(0);
  });
});
