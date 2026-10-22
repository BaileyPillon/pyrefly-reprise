/**
 * THE MOMENTS SWITCH (conference demo, motion pass, lane "core", step 3; Bailey 2026-10-22 ~00:10-01:30 EDT: victory "Each game's own", KO "Rig collapse + settle", turn start and return to place
 * "Each game's own way"; "Pose continuity needs to be tight").
 *
 * The per-game MOMENTS: the victory moment (FFX: a cheer that swaps the victory painting on the take-off's fastest frame; FFX-2 Chapter IV: the pose is WITHHELD by the sources, so a quiet
 * stand-down), the knock-out's cut-and-settle (a party member's topple ends in a smear cut into the KO painting and a small landing rebound; a boss's collapse gets the same rebound).
 *
 * `?moments=new|today`, read once, like the other URL switches (`CurvesSwitch.ts`, `SmearSwitch.ts`, `PoseSwap.ts`). The shared key `?pack=demo` turns it ON (`?moments=today` wins over the
 * pack, for A/B captures). **Default: OFF** (no address key, and in every unit test): merging this changes nothing in the live game. It plays only in the DEMO CHAPTERS, Chapter I (`seymour-flux`,
 * FFX) and Chapter IV (`ffx2-bahamut`, FFX-2), named by `BattleScreen` to `CurvesSwitch.setCurvesChapter`; every other chapter keeps today's moments whatever the address says.
 *
 * REDUCE MOTION does not switch it off (Bailey's pick: it turns off shake, punch, freeze and rumble only; characters still move). The KO's smear CUT additionally needs the smear itself
 * (`SmearSwitch.smearOn()`: `?smear=paint|blur`, or the pack): `?moments=new&smear=off` keeps the KO's plain cross and adds only the settle.
 *
 * Game case (AGENTS.md rule 14): the switch is both games (shared plumbing); WHICH moment plays is read from the chapter's own victory rule (`chapter-meta victoryPose`, from
 * `research/ffx-vs-ffx2-presentation.md` 2.1 and 2.2) and the chapter's game. Pure: no `three`, no DOM but the address of the page (hard rule 1).
 */
import { curvesChapter, curvesGame, inDemoChapter, type CurveGame } from './CurvesSwitch.ts';

export type MomentsMode = 'new' | 'today';

let mode: MomentsMode | null = null;

/** `?moments=new|today` and `?pack=demo` from a search string (pure): `today` (the default) unless `moments=new`, or `pack=demo` with no `moments=today`. */
export function momentsModeFromSearch(search: string | undefined): MomentsMode {
  if (search === undefined) return 'today';
  let moments = '';
  let pack = '';
  try {
    const p = new URLSearchParams(search);
    moments = (p.get('moments') ?? '').trim().toLowerCase();
    pack = (p.get('pack') ?? '').trim().toLowerCase();
  } catch {
    /* an unreadable address is no address: the default */
  }
  if (moments === 'today') return 'today';
  return moments === 'new' || pack === 'demo' ? 'new' : 'today';
}

/** The switch as the page asked for it. Read once. */
export function momentsMode(): MomentsMode {
  if (mode === null) mode = momentsModeFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return mode;
}

/** Tests and `window.__pyrefly.moments(...)`: force the mode (`null` reads the address again). */
export function setMomentsMode(value: MomentsMode | null): void {
  mode = value;
}

/** True when the new moments play now: switched on, in a demo chapter. */
export function momentsOn(): boolean {
  return momentsMode() === 'new' && inDemoChapter(curvesChapter());
}

/** The game whose moment plays: the demo chapter's own (the same answer as the curves'). */
export function momentsGame(): CurveGame {
  return curvesGame();
}
