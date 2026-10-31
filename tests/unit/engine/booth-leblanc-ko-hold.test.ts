/**
 * THE KO CUT IN LEBLANC IS HELD (release 69, branch `booth-leblanc`, r69-fix; Chapter VI is FFX-2 only, the gate is both games).
 *
 * The r69-fix control run (Rikku Thief, three KOs in Act I, 1600 x 900, the booth-leblanc tree's continuity harness) found the treated Leblanc hard-cuts the hurt-to-KO swap: no blend frame, a swap jerk of 152 to 168 px
 * (0.62 to 0.63 of her drawn height; Yuna Gunner 0.50 to 0.52), over the 0.5 cap that excuses a planned smear (CHK-027 fails), where release 68 blends five frames. The cut is asked for in
 * `PaintedActorLife.koCutWindow`, which needs `momentsOn()` and `smearOn()`; of the lane words only `?moments=today` (and `?smear=off`, which drops every planned smear) brought the blend back, so the narrow piece is `moments`.
 * `DemoGate.PIECE_HOLDS['ffx2-leblanc'].moments` holds it. These tests pin the real actor's answer: the window the live KO run is built with (`fx/mix/living.ts` passes `a.koCutWindow()` to `KoFall.fallRun`).
 *
 * Chapter I and Chapter IV (the approved target) keep the cut; Leblanc under `?treated=pack` is release 68 (no cut, nothing treated).
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
  const run = fallRun('topple', 'ffx2', window)!;
  return { window, moments: momentsOn(), cut: run.opts.cut, crossMs: run.opts.crossMs };
}

describe('the KO cut of a party figure (the window the live KO run is built with)', () => {
  it('Chapter IV and Chapter I cut the KO inside the smear window (the approved target: a cut of a few frames, the lying painting arrives under it)', () => {
    for (const chapter of ['ffx2-bahamut', 'seymour-flux']) {
      const k = koWindow(chapter, 'all');
      expect(k.moments, chapter).toBe(true);
      expect(k.window, chapter).toBeGreaterThan(0);
      expect(k.cut, chapter).toBe(true);
      expect(k.crossMs, chapter).toBe(k.window);
    }
  });

  it("Leblanc plays release 68's KO: no window, the plain cross, so the swap is the blend CHK-027 passes (the hold on `moments`)", () => {
    const k = koWindow('ffx2-leblanc', 'all');
    expect(k.moments).toBe(false);
    expect(k.window).toBeUndefined();
    expect(k.cut).toBeUndefined();
    const plain = fallRun('topple', 'ffx2')!;
    expect(k.crossMs).toBe(plain.opts.crossMs); // the same cross release 68 plays: a blend over several frames, not a cut of a few milliseconds
    expect(k.crossMs).toBeGreaterThan(60);
  });

  it('under ?treated=pack (release 68) Leblanc has no cut either, and the booth pair keeps it', () => {
    expect(koWindow('ffx2-leblanc', 'pack').window).toBeUndefined();
    expect(koWindow('ffx2-bahamut', 'pack').window).toBeGreaterThan(0);
  });

  it('the hidden experiment that plays the same ids is not Chapter VI: no cut there either', () => {
    expect(koWindow('exp-leblanc', 'all').window).toBeUndefined();
  });
});
