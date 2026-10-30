/**
 * FEEL SWITCHES (motion program, lane "feel", 2026-10-22; Bailey's picks of 2026-10-22 00:10 to 01:30 EDT: "The motion and animations need to be top notch, even above
 * visuals"). Everything this lane adds is a small piece with its own URL key. Five are **OFF at compile time** and ON only in the two demo chapters; the sixth, `?timing=` (a fix, not a look), has been ON in every chapter since 2026-10-26:
 *
 * | key | values | the piece |
 * |---|---|---|
 * | `?punch=` | `today` (default), `new`, `off` | the big-hit camera: today's moment punch 0.11 + spectacle kick, or the subtle 2 to 3 percent zoom with a short settle |
 * | `?hitstop=` | `today` (default), `short`, `off` | the hit-stop: today's, or 3 to 4 frames on criticals, Overdrive finishers and boss big attacks only |
 * | `?rumble=` | `off` (default), `on` | the gamepad's light rumble on big moments (never on keyboard play, never under REDUCE MOTION) |
 * | `?shadow=` | `today` (default), `follow` | the contact shadow stays under the feet through a lunge, shrinks and fades in the air, spreads on landing |
 * | `?motionsfx=` | `off` (default), `on` | the subtle synced motion sounds: a whoosh on a lunge and on a planned smear, a landing thud, a cloth rustle on a cast (step 2; `feel/MotionSfx.ts`) |
 * | `?timing=` | `time` (default, EVERY chapter since the post-conference plan), `frames` (or `today`, `off`, `false`, `0`) | the camera shake and the ink-and-paper impact frame counted in real time (120 Hz and above), not in drawn frames (`feel/TimeBased.ts`; review fix F1); any off word puts the drawn-frame count back |
 *
 * and the shared **`?pack=demo`**, which turns the five looks above ON (`new`, `short`, `on`, `follow`, `on`) in the demo chapters (`time` no longer needs it). A key named beside `pack` wins for its piece
 * (`?pack=demo&punch=today` is the demo pack with today's camera: the A/B).
 *
 * **Demo chapters only (Bailey: "Demo chapters first").** Chapter I is `seymour-flux` (FFX) and Chapter IV is `ffx2-bahamut` (FFX-2), the ids in `data/encounters.ts`. The battle
 * screen tells this module which chapter is running ({@link setFeelChapter}); in any other chapter, and before a chapter is set (the unit tests, every other screen), every
 * answer is today's. So merging this lane changes nothing in the live game: a key, or the pack, in one of those two chapters is the only way to see a new piece.
 * **One exception since the post-conference plan (2026-10-26): `?timing=` is on in every chapter** ({@link timingByTime}); it is a fix (a shake and an impact frame that ran twice as fast on a
 * 120 Hz screen), not a look, and it is the same at 60 Hz. The other six pieces stay as this paragraph says.
 *
 * Pure: no `three`, no DOM but the address of the page (the `HitRecoil.recoilLegacy` / `PoseSwap.motionMode` pattern). Game case: both games (shared presentation plumbing);
 * the per-game numbers live where they always did (`fx/c/SpectacleRules.SPECTACLE_TUNING`).
 */

import { DEMO_CHAPTERS, demoChapter, isTreatedChapter, packDemo, setDemoChapter } from '../motion/DemoGate.ts';

export type PunchMode = 'today' | 'new' | 'off';
export type StopMode = 'today' | 'short' | 'off';

/** The two BOOTH chapters, by the ids in `data/encounters.ts`: Chapter I (FFX) and Chapter IV (FFX-2) (a test-side alias of `motion/DemoGate.DEMO_CHAPTERS`; the chapters the feel reaches are `TREATED_CHAPTERS` there). */
export const FEEL_CHAPTERS: ReadonlySet<string> = new Set(Object.keys(DEMO_CHAPTERS));

/** What the address says (every field null = not named). */
export interface FeelKeys {
  pack: boolean;
  punch: PunchMode | null;
  hitstop: StopMode | null;
  rumble: boolean | null;
  shadow: boolean | null;
  motionsfx: boolean | null;
  timing: boolean | null;
}

const NONE: FeelKeys = { pack: false, punch: null, hitstop: null, rumble: null, shadow: null, motionsfx: null, timing: null };

/** The words that put the drawn-frame count back (`frames` is the documented one, `today` the older one; `off`, `false` and `0` are what a tester types for "turn it off", post-conference review F-4). */
const TIMING_OFF_WORDS: ReadonlySet<string> = new Set(['frames', 'today', 'off', 'false', '0']);

/** Read the seven keys from a search string (pure; `undefined` = no page). An unknown value is not named. */
export function parseFeelKeys(search: string | undefined): FeelKeys {
  if (search === undefined) return NONE;
  let q: URLSearchParams;
  try {
    q = new URLSearchParams(search);
  } catch {
    return NONE;
  }
  const word = (k: string): string => (q.get(k) ?? '').trim().toLowerCase();
  const punch = word('punch');
  const stop = word('hitstop');
  const rumble = word('rumble');
  const shadow = word('shadow');
  const motionsfx = word('motionsfx');
  const timing = word('timing');
  return {
    pack: packDemo(search), // r64: the shared reader, so the conference default (and `?pack=off`) reaches the feel pieces too
    punch: punch === 'today' || punch === 'new' || punch === 'off' ? punch : null,
    hitstop: stop === 'today' || stop === 'short' || stop === 'off' ? stop : null,
    rumble: rumble === 'on' ? true : rumble === 'off' ? false : null,
    shadow: shadow === 'follow' ? true : shadow === 'today' ? false : null,
    motionsfx: motionsfx === 'on' ? true : motionsfx === 'off' ? false : null,
    timing: timing === 'time' ? true : TIMING_OFF_WORDS.has(timing) ? false : null,
  };
}

let keys: FeelKeys | null = null;
const forced: { -readonly [K in keyof FeelKeys]?: FeelKeys[K] } = {};

function read(): FeelKeys {
  if (keys === null) keys = parseFeelKeys(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return keys;
}

/** The battle screen names the running chapter when it builds the field (`null` when it goes). The variable is the ONE shared one (`motion/DemoGate.setDemoChapter`). */
export function setFeelChapter(id: string | null): void {
  setDemoChapter(id ?? undefined);
}

/** The chapter id the battle screen last named, or null. */
export function feelChapter(): string | null {
  return demoChapter() ?? null;
}

/** True while the running chapter is one the treatment reaches (Chapter I, Chapter IV, or a chapter on `DemoGate.TREATED_CHAPTERS`): the only place any new piece can be on. */
export function inFeelChapter(): boolean {
  return isTreatedChapter(demoChapter(), 'feel');
}

/** The pack (`?pack=demo`, or {@link setFeelPack}). */
export function feelPack(): boolean {
  return forced.pack ?? read().pack;
}

/** The camera for a big hit right now: `today` outside the demo chapters and whenever nothing is named. */
export function punchMode(): PunchMode {
  if (!inFeelChapter()) return 'today';
  return forced.punch ?? read().punch ?? (feelPack() ? 'new' : 'today');
}

/** The hit-stop right now. */
export function stopMode(): StopMode {
  if (!inFeelChapter()) return 'today';
  return forced.hitstop ?? read().hitstop ?? (feelPack() ? 'short' : 'today');
}

/** True when the gamepad rumbles on big moments. */
export function rumbleOn(): boolean {
  if (!inFeelChapter()) return false;
  return forced.rumble ?? read().rumble ?? feelPack();
}

/** True when the contact shadow follows the feet. */
export function shadowFollows(): boolean {
  if (!inFeelChapter()) return false;
  return forced.shadow ?? read().shadow ?? feelPack();
}

/** True when the motion sounds play (a whoosh on a lunge, a thud on a landing, a rustle on a cast). */
export function motionSfxOn(): boolean {
  if (!inFeelChapter()) return false;
  return forced.motionsfx ?? read().motionsfx ?? feelPack();
}

/**
 * True when the camera shake and the impact frame run on real time (120 Hz and above) rather than per drawn frame. **On by default in EVERY chapter, with or without the pack** (post-conference
 * plan, 2026-10-26, the driver's call under Bailey's delegation: it removes a glitch, a shake twice as frantic on a 120 Hz screen, and adds no look; at 60 Hz it is the same motion to the
 * thousandth of a world unit). `?timing=frames` (or the older `?timing=today`) is the off word and puts a drawn-frame count back; the debug setter does the same.
 */
export function timingByTime(): boolean {
  return forced.timing ?? read().timing ?? true;
}

/** What every piece is set to by the address and the debug setters, WHATEVER the running chapter (the other five answers are today's outside the demo chapters; `timing` is real time everywhere). The playtest switchboard shows these. */
export function feelConfigured(): { punch: PunchMode; stop: StopMode; rumble: boolean; shadow: boolean; motionsfx: boolean; timing: boolean } {
  const pack = feelPack();
  const k = read();
  return {
    punch: forced.punch ?? k.punch ?? (pack ? 'new' : 'today'),
    stop: forced.hitstop ?? k.hitstop ?? (pack ? 'short' : 'today'),
    rumble: forced.rumble ?? k.rumble ?? pack,
    shadow: forced.shadow ?? k.shadow ?? pack,
    motionsfx: forced.motionsfx ?? k.motionsfx ?? pack,
    timing: forced.timing ?? k.timing ?? true,
  };
}

/** The modes in one object, for the spectacle's flags (`SpectacleRules.SpectacleFlags.feel`). */
export function feelFlags(): { punch: PunchMode; stop: StopMode } {
  return { punch: punchMode(), stop: stopMode() };
}

// ---------------------------------------------------------------- tests and the debug surface

/** Force a piece (`undefined` to go back to the address). The debug setters and the tests use these. */
export function setPunchMode(value: PunchMode | undefined): void {
  if (value === undefined) delete forced.punch;
  else forced.punch = value;
}
export function setStopMode(value: StopMode | undefined): void {
  if (value === undefined) delete forced.hitstop;
  else forced.hitstop = value;
}
export function setRumbleOn(value: boolean | undefined): void {
  if (value === undefined) delete forced.rumble;
  else forced.rumble = value;
}
export function setShadowFollows(value: boolean | undefined): void {
  if (value === undefined) delete forced.shadow;
  else forced.shadow = value;
}
export function setMotionSfxOn(value: boolean | undefined): void {
  if (value === undefined) delete forced.motionsfx;
  else forced.motionsfx = value;
}
export function setTimingByTime(value: boolean | undefined): void {
  if (value === undefined) delete forced.timing;
  else forced.timing = value;
}
export function setFeelPack(value: boolean | undefined): void {
  if (value === undefined) delete forced.pack;
  else forced.pack = value;
}

/** Tests: forget the address, every forced value and the chapter. */
export function resetFeelForTests(search?: string): void {
  keys = search === undefined ? null : parseFeelKeys(search);
  setDemoChapter(undefined);
  for (const k of Object.keys(forced) as Array<keyof FeelKeys>) delete forced[k];
}
