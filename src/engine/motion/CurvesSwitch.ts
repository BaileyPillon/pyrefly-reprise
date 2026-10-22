/**
 * THE MOTION-CORE SWITCH (conference demo, motion pass, lane "core"; Bailey 2026-10-22 ~00:10-01:30 EDT: "The motion and animations need to be top notch, even above visuals" and
 * "Pose continuity needs to be tight. It needs to be impressive."). The pure switch of the new CURVES: the sampled strike (`StrikeCurve.ts`), the cast lift, the FFX-2 leap, the
 * recoil-and-recover, the subtle volume-preserving squash and the paced pose-blend clock.
 *
 * **Default: OFF.** Merging this must not change the live game: with no address key (and in every unit test) `curvesOn()` answers false and every hook falls straight through to
 * today's code. It turns on when ALL of these hold:
 *
 * 1. the address carries `?curves=new` or the shared key `?pack=demo` (the Thursday test build runs with `?pack=demo`; `?curves=today` wins over the pack, for A/B captures);
 * 2. the running chapter is one of the two DEMO CHAPTERS, Chapter I (`seymour-flux`, FFX) or Chapter IV (`ffx2-bahamut`, FFX-2), named by `BattleScreen` as the battle sets up
 *    ({@link setCurvesChapter}). Every other chapter keeps today's motion, whatever the address says.
 *
 * Game case (AGENTS.md rule 14): the SWITCH is both games; WHICH profile plays is the chapter's game (`curvesGame`): FFX in Chapter I, FFX-2 in Chapter IV.
 *
 * REDUCE MOTION does not switch the curves off (Bailey's pick, 2026-10-22: it turns off "Shake, punch, freeze, rumble" only; characters still move). The shake, the punch and the
 * hit-stop stay behind their own existing gates.
 *
 * Pure: no `three`, no DOM but the address of the page (hard rule 1). Read once, like the other URL switches (`PoseSwap.ts`, `HitRecoil.recoilLegacy`).
 */

import { DEMO_CHAPTERS, demoChapter, demoGameOf, isDemoChapter, packDemo, queryWord, setDemoChapter, type DemoGame } from './DemoGate.ts';

/** The two demo chapters and the game each one is (`src/data/encounters.ts` ids): the ONE table every lane's switch reads (`DemoGate.ts`). */
export const DEMO_CHAPTER_GAMES: Readonly<Record<string, CurveGame>> = DEMO_CHAPTERS;

export type CurveGame = DemoGame;
/**
 * `new`: the sampled curves with the numbers of this game's own profile (`StrikeCurve.PROFILES`, all [ours]). `real` and `real-snappy` (integration 2, 2026-10-22; Bailey's decision 179, "Timing + camera
 * now, full later"): the same curves driven by the REAL game's clips (`data/motion/realMotion.ts`, `RealMotion.ts`): `real` is the real proportions at the real speed (party attacks 1.5 to 2.9 s,
 * bosses 4.2 to 4.7 s), `real-snappy` the same proportions scaled to Bailey's "about 1.1 s" pick. Both turn the curves ON (a real mode is a kind of `new`).
 */
export type CurvesMode = 'new' | 'today' | 'real' | 'real-snappy';
/** The real-motion sub-mode playing: `real` (the real speed) or `snappy` (scaled to the 1.1 s pick). */
export type RealKind = 'real' | 'snappy';

let mode: CurvesMode | null = null;

/**
 * `?curves=new|today|real|real-snappy` and `?pack=demo` from a search string (pure): `today` (the default) unless `curves=new` (or `real`, or `real-snappy`, `snappy` for short), or `pack=demo` with
 * no `curves=today` (the pack alone is `new`: the real modes are asked for by name).
 */
export function curvesModeFromSearch(search: string | undefined): CurvesMode {
  if (search === undefined) return 'today';
  const curves = queryWord(search, 'curves');
  if (curves === 'today') return 'today';
  if (curves === 'real') return 'real';
  if (curves === 'real-snappy' || curves === 'snappy') return 'real-snappy';
  return curves === 'new' || packDemo(search) ? 'new' : 'today';
}

/** The switch as the page asked for it. Read once. */
export function curvesMode(): CurvesMode {
  if (mode === null) mode = curvesModeFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return mode;
}

/** Tests and `window.__pyrefly.curves(...)`: force the mode (`null` reads the address again). */
export function setCurvesMode(value: CurvesMode | null): void {
  mode = value;
}

/** `BattleScreen` names the running chapter as the battle sets up (and `undefined` as it exits); the demo gate reads it. The variable is the ONE shared one (`DemoGate.setDemoChapter`). */
export function setCurvesChapter(id: string | undefined): void {
  setDemoChapter(id);
}

export function curvesChapter(): string | undefined {
  return demoChapter();
}

/** Is the running chapter Chapter I or Chapter IV? */
export function inDemoChapter(id: string | undefined): boolean {
  return isDemoChapter(id);
}

/** True when the new curves play now: switched on (`new`, `real` or `real-snappy`), in a demo chapter. */
export function curvesOn(): boolean {
  return curvesMode() !== 'today' && isDemoChapter(demoChapter());
}

/** The real-motion sub-mode playing now: `real` or `snappy` when the curves are on in a real mode, else null (`new`, `today`, or outside a demo chapter). */
export function realKind(): RealKind | null {
  if (!curvesOn()) return null;
  const m = curvesMode();
  return m === 'real' ? 'real' : m === 'real-snappy' ? 'snappy' : null;
}

/** The game whose profile plays: the demo chapter's own. FFX when no demo chapter is running (never read then: {@link curvesOn} is false). */
export function curvesGame(id: string | undefined = demoChapter()): CurveGame {
  return demoGameOf(id, 'ffx');
}
