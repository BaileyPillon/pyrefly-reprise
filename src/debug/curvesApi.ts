/**
 * `window.__pyrefly.curves(mode?)`, `.curvesChapter(id?)`, `.curvesOn()` and `.strikeMarks(game?, distance?)`: the motion-core switch for captures and checks (motion pass, lane "core").
 *
 * `curves()` returns `'new'` or `'today'` (from `?curves=` / `?pack=demo`, default today); `curves('new' | 'today')` sets it for what starts from now on. The new curves play only in the demo
 * chapters (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`): `curvesOn()` is the answer for the running chapter. `strikeMarks` returns a game's strike marks in paced ms (and the
 * on-screen ms at the default pace) for a recorder that wants to line a capture up on `contact` or `travelPeak`.
 */
import { curvesChapter, curvesGame, curvesMode, curvesOn, setCurvesChapter, setCurvesMode, type CurveGame, type CurvesMode } from '../engine/motion/CurvesSwitch.ts';
import { PROFILES, defaultPaceFactor, resolveStrike, strikeMarks, type StrikeMarks } from '../engine/motion/StrikeCurve.ts';

export function installCurvesDebug(api: Record<string, unknown>): void {
  api['curves'] = (mode?: CurvesMode): CurvesMode => {
    if (mode === 'new' || mode === 'today') setCurvesMode(mode);
    return curvesMode();
  };
  api['curvesChapter'] = (id?: string): string | undefined => {
    if (typeof id === 'string') setCurvesChapter(id);
    return curvesChapter();
  };
  api['curvesOn'] = (): boolean => curvesOn();
  api['strikeMarks'] = (game: CurveGame = curvesGame(), distance = 1.4, timeScale = 1): { paced: StrikeMarks; onScreenAtDefaultPace: StrikeMarks } => {
    const paced = strikeMarks(resolveStrike(PROFILES[game], { distance, height: 1.82, timeScale }));
    const k = defaultPaceFactor(game) / Math.max(0.02, timeScale);
    const onScreenAtDefaultPace = Object.fromEntries(Object.entries(paced).map(([n, v]) => [n, v * k])) as unknown as StrikeMarks;
    return { paced, onScreenAtDefaultPace };
  };
}
