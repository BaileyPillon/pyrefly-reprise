/**
 * THE ONE GATE FOR EVERY NEW MOTION PIECE (conference demo, motion pass, integration of the lanes "core", "feel" and "fx"; Bailey 2026-10-22: every new piece "behind switches, default OFF,
 * ON only in Chapter I and Chapter IV with ?pack=demo"). Pure: no `three`, no DOM, no imports (the one page read is the screen's width and pointer, once, at load).
 *
 * The three lanes each grew their own copy of the same two questions: WHICH chapter is running (`CurvesSwitch.setCurvesChapter`, `FeelSwitch.setFeelChapter`, `FxSwitch.setFxChapter`: three
 * variables the battle screen and the spell layer all set to the same id) and WHETHER `?pack=demo` is in the address. Now there is one chapter variable and one pack reader, here; each lane's
 * switch keeps its own name, its own key and its own default, and only points at this module. What each switch DOES is unchanged: the table below is the two demo chapters
 * (`src/data/encounters.ts` ids) and the game each one is.
 *
 * **r64 (Bailey 2026-10-24, item 200b): the pack is ON by default in those two chapters** ({@link PACK_DEFAULT_ON}); `?pack=off` and each lane's own off word keep the old behaviour reachable.
 *
 * Game case (AGENTS.md rule 14): the gate is both games (shared plumbing); the chapter's game is read from the table (FFX Chapter I, FFX-2 Chapter IV).
 */

export type DemoGame = 'ffx' | 'ffx2';

/** The two demo chapters and the game each one is: Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2). */
export const DEMO_CHAPTERS: Readonly<Record<string, DemoGame>> = Object.freeze({
  'seymour-flux': 'ffx',
  'ffx2-bahamut': 'ffx2',
});

let chapter: string | undefined;

/** The battle screen (and, for a spell layer built without it, the layer) names the running chapter as a battle sets up, and `undefined` as it exits. */
export function setDemoChapter(id: string | undefined): void {
  chapter = id;
}

/** The chapter id last named, or undefined. */
export function demoChapter(): string | undefined {
  return chapter;
}

/** Is this chapter id Chapter I or Chapter IV? */
export function isDemoChapter(id: string | undefined): boolean {
  return id !== undefined && Object.prototype.hasOwnProperty.call(DEMO_CHAPTERS, id);
}

/** The game of a demo chapter, or `fallback` for any other id. */
export function demoGameOf(id: string | undefined, fallback: DemoGame = 'ffx'): DemoGame {
  return id !== undefined && Object.prototype.hasOwnProperty.call(DEMO_CHAPTERS, id) ? DEMO_CHAPTERS[id]! : fallback;
}

/** One key of an address, trimmed and lower-cased; '' when absent or when the address cannot be read. */
export function queryWord(search: string | undefined, key: string): string {
  if (search === undefined) return '';
  try {
    return (new URLSearchParams(search).get(key) ?? '').trim().toLowerCase();
  } catch {
    return '';
  }
}

/**
 * THE CONFERENCE DEFAULT (r64, Bailey 2026-10-24 ~13:40 EDT, item 200b: "you can make all the decisions for me, ill go with all your recommendations"; the driver's call under it, his to overturn):
 * the pack is ON by default in Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2), with no `?pack=demo` in the address, from the chapter board and the booth path alike. ONE line to flip:
 * `false` puts every address back to release 62 / r63-play's (the pack only with `?pack=demo`).
 *
 * Every consumer already gates itself on the running chapter (`isDemoChapter(demoChapter())`, or demo mode for the booth's screens), so this changes nothing in any other chapter, screen or mode.
 *
 * **On a desktop-class screen only (r63 focused review R63-P1, 2026-10-24).** The default holds where the pack was built and played, a desktop with a mouse and a keyboard; on a phone or a tablet it is OFF
 * ({@link packScreen}): the F1 HUD is authored on a 640 x 360 grid with key hints and no PAUSE button, so at 390 x 844 it dropped PAUSE, cut the command names (ATTA..., SPE...) and let the party numbers
 * overlap, and on a tablet or a phone held sideways it still has no way to pause by touch. `?pack=demo` forces the pack on anywhere (the booth address) and `?pack=off` forces it off anywhere.
 */
export const PACK_DEFAULT_ON = true;

/** The narrowest page the pack's default plays on, CSS px: the game's own phone breakpoint (`ui/common/phoneBattle.ts` PHONE_BATTLE_QUERY, `(max-width: 599px)`; party prep uses the same 599). */
export const PACK_PHONE_MAX_WIDTH = 599;

/**
 * The largest short side, CSS px, at which a touch-first screen still counts as a phone or a tablet: 1024 is an iPad's (and an iPad Pro 12.9's) short side held either way, so 768 x 1024, 1024 x 768 and
 * 1366 x 1024 are tablets, while a 1920 x 1080 touch monitor (a booth kiosk) is a desktop-class screen.
 */
export const PACK_TOUCH_MAX_SHORT_SIDE = 1024;

/** `desk` = a desktop-class screen (the pack's default applies); `phone` = a phone, a tablet or any narrow screen (the default is off: release 62's HUD and every other piece as it was). */
export type PackScreen = 'desk' | 'phone';

/** What the screen is read from; every field is optional, and a page with none of them (a unit test, a tool) reads as a desktop. */
export interface PackScreenGlobals {
  innerWidth?: number;
  innerHeight?: number;
  matchMedia?: (query: string) => { matches: boolean };
}

/**
 * The screen class from a window-like object (pure). `phone` when the page is narrower than the phone breakpoint ({@link PACK_PHONE_MAX_WIDTH}, upright or sideways), or the primary pointer is coarse
 * (`(pointer: coarse)`: a touch screen with no mouse, which has no key for the P the F1 HUD's pause hint names) on a screen whose short side is {@link PACK_TOUCH_MAX_SHORT_SIDE} or less (a phone, held
 * either way, or a tablet). `desk` otherwise, and `desk` where nothing can be read.
 */
export function readPackScreen(g: PackScreenGlobals = globalThis as PackScreenGlobals): PackScreen {
  const mm = (query: string): boolean => {
    try {
      return typeof g.matchMedia === 'function' && g.matchMedia(query).matches === true;
    } catch {
      return false;
    }
  };
  const w = typeof g.innerWidth === 'number' && g.innerWidth > 0 ? g.innerWidth : undefined;
  const h = typeof g.innerHeight === 'number' && g.innerHeight > 0 ? g.innerHeight : undefined;
  if ((w !== undefined && w <= PACK_PHONE_MAX_WIDTH) || mm(`(max-width: ${PACK_PHONE_MAX_WIDTH}px)`)) return 'phone';
  const short = Math.min(w ?? Infinity, h ?? Infinity);
  return mm('(pointer: coarse)') && short <= PACK_TOUCH_MAX_SHORT_SIDE ? 'phone' : 'desk';
}

/**
 * DECIDED AT LOAD, ONCE: the class of the screen the page opened on, read when this module is evaluated (the page's first script). Turning a phone sideways, resizing a desktop window or a pointer
 * appearing never changes it mid-session, so a fight is never switched from one HUD to the other in the player's hands; a reload decides again.
 */
let screenClass: PackScreen = readPackScreen();

/** The screen class the page opened on ({@link readPackScreen} at load). */
export function packScreen(): PackScreen {
  return screenClass;
}

/** Tests and tools: force the class (`null` reads the page again). */
export function setPackScreen(value: PackScreen | null): void {
  screenClass = value ?? readPackScreen();
}

/** Does the conference default apply on this page: the default is on ({@link PACK_DEFAULT_ON}) and the screen is a desktop-class one ({@link packScreen}). */
export function packDefaultOn(): boolean {
  return PACK_DEFAULT_ON && screenClass === 'desk';
}

/**
 * Is the conference pack asked for by this address? The one reader every lane's switch uses.
 *
 * | address | answer |
 * |---|---|
 * | `?pack=demo` | on, on any screen (the booth address) |
 * | `?pack=off` (or `today`, `0`) | off: every piece back to release 62's, the old behaviour |
 * | no `pack` word (r64) | {@link packDefaultOn}: on for a desktop-class screen, off for a phone or a tablet (r63 R63-P1) |
 * | `undefined` (no page at all: a unit test, a tool) | off, as it always was |
 *
 * A lane's own word still beats the pack for its piece in both directions (`?pro=off`, `?hud=today`, `?audio=today`, `?boss=today`, `?prebuild=off`, `?punch=today`, ...).
 */
export function packDemo(search: string | undefined): boolean {
  if (search === undefined) return false;
  const w = queryWord(search, 'pack');
  if (w === 'demo') return true;
  if (w === 'off' || w === 'today' || w === '0') return false;
  return packDefaultOn();
}

/**
 * The master word of the three "pro" lanes (the r63 integration, 2026-10-23; the look, the camera and the staging): `?pro=off` (or `today`) takes all three back to today's at once, beating each lane's
 * own key and the pack; `?pro=on` turns all three on without the pack, under each lane's own key (`?look=today` still wins over it). '' when the address does not name it. Read by `ProSwitch`,
 * `ProCamSwitch` and `StagingSwitch` and nothing else.
 */
export function proLanes(search: string | undefined): 'on' | 'off' | '' {
  const w = queryWord(search, 'pro');
  return w === 'off' || w === 'today' ? 'off' : w === 'on' || w === 'pro' ? 'on' : '';
}
