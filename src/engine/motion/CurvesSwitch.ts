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

/** The two demo chapters and the game each one is (`src/data/encounters.ts` ids). */
export const DEMO_CHAPTER_GAMES: Readonly<Record<string, CurveGame>> = {
  'seymour-flux': 'ffx',
  'ffx2-bahamut': 'ffx2',
};

export type CurveGame = 'ffx' | 'ffx2';
export type CurvesMode = 'new' | 'today';

let mode: CurvesMode | null = null;
let chapter: string | undefined;

/** `?curves=new|today` and `?pack=demo` from a search string (pure): `today` (the default) unless `curves=new`, or `pack=demo` with no `curves=today`. */
export function curvesModeFromSearch(search: string | undefined): CurvesMode {
  if (search === undefined) return 'today';
  let curves = '';
  let pack = '';
  try {
    const p = new URLSearchParams(search);
    curves = (p.get('curves') ?? '').trim().toLowerCase();
    pack = (p.get('pack') ?? '').trim().toLowerCase();
  } catch {
    /* an unreadable address is no address: the default */
  }
  if (curves === 'today') return 'today';
  return curves === 'new' || pack === 'demo' ? 'new' : 'today';
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

/** `BattleScreen` names the running chapter as the battle sets up (and `undefined` as it exits); the demo gate reads it. */
export function setCurvesChapter(id: string | undefined): void {
  chapter = id;
}

export function curvesChapter(): string | undefined {
  return chapter;
}

/** Is the running chapter Chapter I or Chapter IV? */
export function inDemoChapter(id: string | undefined): boolean {
  return id !== undefined && Object.prototype.hasOwnProperty.call(DEMO_CHAPTER_GAMES, id);
}

/** True when the new curves play now: switched on, in a demo chapter. */
export function curvesOn(): boolean {
  return curvesMode() === 'new' && inDemoChapter(chapter);
}

/** The game whose profile plays: the demo chapter's own. FFX when no demo chapter is running (never read then: {@link curvesOn} is false). */
export function curvesGame(id: string | undefined = chapter): CurveGame {
  return id !== undefined && Object.prototype.hasOwnProperty.call(DEMO_CHAPTER_GAMES, id) ? DEMO_CHAPTER_GAMES[id]! : 'ffx';
}
