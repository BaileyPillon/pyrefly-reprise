/**
 * THE SMEAR SWITCH (conference demo, motion pass, lane "core", step 2; Bailey 2026-10-22 ~00:10-01:30 EDT: "Cut on the motion peak with a smear" - big pose changes cut on the FASTEST frame inside a
 * 1-2 frame smear plus a light flash; small ones keep the quick blend; "BOTH styles (painted streak and soft motion blur) behind a switch, he picks Thursday").
 *
 * `?smear=paint | blur | off`, read once, like the other URL switches (`PoseSwap.ts`, `CurvesSwitch.ts`, `HitRecoil.recoilLegacy`). The shared key `?pack=demo` turns the smear ON with the painted streak
 * (`paint`) unless `?smear=` says otherwise. **Default: OFF** (no address key, and in every unit test): merging this changes nothing in the live game.
 *
 * It plays only in the DEMO CHAPTERS, Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2): the chapter is the one `BattleScreen` names to `CurvesSwitch.setCurvesChapter`; every other
 * chapter keeps its plain pose blend whatever the address says.
 *
 * REDUCE MOTION does not switch the smear off (Bailey's pick: it turns off "Shake, punch, freeze, rumble" only; characters still move and smear). REDUCE FLASHES does switch the smear's light flash off
 * (`PaintedActor.smearFlash`); the cut and the streak stay.
 *
 * Game case (AGENTS.md rule 14): the switch, the planner and the render are both games (shared plumbing, one engine); WHICH changes are big is read from the paintings themselves, so each game's own
 * paintings decide. Pure: no `three`, no DOM but the address of the page (hard rule 1).
 */
import { curvesChapter, inDemoChapter } from './CurvesSwitch.ts';
import { packDemo, queryWord } from './DemoGate.ts';

export type SmearStyle = 'off' | 'paint' | 'blur';

let style: SmearStyle | null = null;

/** `?smear=` and `?pack=demo` from a search string (pure): `smear=paint|blur|off` wins; else `pack=demo` is `paint`; else `off`. */
export function smearStyleFromSearch(search: string | undefined): SmearStyle {
  if (search === undefined) return 'off';
  const smear = queryWord(search, 'smear');
  if (smear === 'paint' || smear === 'blur' || smear === 'off') return smear;
  return packDemo(search) ? 'paint' : 'off';
}

/** The style the page asked for. Read once. */
export function smearStyle(): SmearStyle {
  if (style === null) style = smearStyleFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return style;
}

/** Tests and `window.__pyrefly.smear(...)`: force the style (`null` reads the address again). */
export function setSmearStyle(value: SmearStyle | null): void {
  style = value;
}

/** The style that plays NOW: the asked-for one in a demo chapter, `off` anywhere else. */
export function smearStyleNow(): SmearStyle {
  const s = smearStyle();
  return s !== 'off' && inDemoChapter(curvesChapter()) ? s : 'off';
}

/** True when the smear plays now (switched on, in a demo chapter). */
export function smearOn(): boolean {
  return smearStyleNow() !== 'off';
}
