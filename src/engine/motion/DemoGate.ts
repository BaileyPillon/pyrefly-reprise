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
 * **Release 69 (`booth-leblanc`; Bailey 2026-10-30: "the nice treatment you gave to the booth chapters you need to now apply to all live and selectable chapters (meaning ones that arent hidden) please start with leblanc"):** the
 * treatment no longer follows the two booth ids but {@link TREATED_CHAPTERS}, which grows one line per chapter (Leblanc first), with a written hold for any single piece a chapter is not ready for ({@link PIECE_HOLDS}) and `?treated=pack`
 * to put release 68's reach back. {@link DEMO_CHAPTERS} and {@link isDemoChapter} stay the booth pair, for the kiosk's own things (the picker, the seeds, the party rigs, the voiced lines).
 *
 * Game case (AGENTS.md rule 14): the gate is both games (shared plumbing); the chapter's game is read from the table (FFX Chapter I, FFX-2 Chapter IV, FFX-2 Chapter VI).
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

/**
 * Is this chapter id Chapter I or Chapter IV: the BOOTH PAIR? Booth-only things ask this (the kiosk's picker, its seeds, the party rigs, the voiced lines: `DEMO_CHAPTERS`); the treatment's own
 * pieces ask {@link isTreatedChapter}, which answers true for this pair too.
 */
export function isDemoChapter(id: string | undefined): boolean {
  return id !== undefined && Object.prototype.hasOwnProperty.call(DEMO_CHAPTERS, id);
}

// ---------------------------------------------------------------------------------------------------------------- THE TREATED CHAPTERS
//
// Bailey 2026-10-30: "the nice treatment you gave to the booth chapters you need to now apply to all live and selectable chapters (meaning ones that arent hidden) please start with leblanc"; 2026-10-29:
// "you make all executive decisions for the next few days. i'll go with all of your recommendations" (the driver's calls under it, his to overturn). Until release 69 the treatment (the F1 HUD, the pro look, camera
// and staging, the curves, the moments, the feel, the new effects, the sound pass, the governor) followed `DEMO_CHAPTERS`, two ids. It now follows ONE growing list: a chapter joins by one line in
// {@link TREATED_CHAPTERS}, and any single piece the chapter is not ready for waits behind a written hold in {@link PIECE_HOLDS}.

/** The pieces of the treatment a chapter can hold back one by one: each switch module names the one it is (`isTreatedChapter(id, piece)`). */
export type TreatedPiece =
  | 'hud' | 'hd2d' | 'arena' | 'look' | 'rim' | 'boss' | 'cam' | 'card' | 'ending' | 'opening' | 'breath'
  | 'curves' | 'real' | 'moments' | 'smear' | 'feel' | 'fx' | 'audio' | 'governor';

export const TREATED_PIECES: readonly TreatedPiece[] = [
  'hud', 'hd2d', 'arena', 'look', 'rim', 'boss', 'cam', 'card', 'ending', 'opening', 'breath', 'curves', 'real', 'moments', 'smear', 'feel', 'fx', 'audio', 'governor',
];

/** One treated chapter: its game (rule 14: which game's layout, profile and tables play) and when it joined. */
export interface TreatedEntry {
  readonly game: DemoGame;
  readonly since: string;
}

/**
 * THE LIST. The booth pair (release 60 and 64: the pair is on from the first release that had the pack) and Leblanc (release 69, `booth-leblanc`: Chapter VI, `ffx2-leblanc`, FFX-2; the HIDDEN experiment
 * `exp-leblanc` is not this chapter and is never listed). A twentieth id fails `tests/unit/booth-treated-chapters.test.ts` until it names a chapter the registry lists, with the game the registry says.
 */
export const TREATED_CHAPTERS: Readonly<Record<string, TreatedEntry>> = Object.freeze({
  'seymour-flux': { game: 'ffx', since: 'r60' },
  'ffx2-bahamut': { game: 'ffx2', since: 'r60' },
  'ffx2-leblanc': { game: 'ffx2', since: 'r69' },
});

/**
 * Pieces a treated chapter does not play yet, each with the written reason and what lifts it (the shape of `SwapSwitch.SCOPE_EXCEPTIONS`: a reason of 80 characters or more, ending in "Lifts when ..."). A held
 * piece answers today's in that chapter and every other piece plays. The booth pair has none: they are the approved target.
 */
export const PIECE_HOLDS: Readonly<Record<string, Readonly<Partial<Record<TreatedPiece, string>>>>> = Object.freeze({
  'ffx2-leblanc': Object.freeze({
    breath:
      'FFX-2, Chapter VI: the held breath is the drain-and-flood built for Mega Flare (and, in FFX, Total Annihilation), a solemn beat. Her sourced showpiece is No Love Lost (research/ffx2-leblanc-syndicate.md section 4.5: ' +
      'three timed stages, eight shots, the party knocked down, a finisher; "the perfect thing for a presentation layer to build around"), a three-beat comedy combo whose tone, sound and shot are a mockup decision ' +
      '(hard rule 9), and no move of this chapter is named in `StagingPort.BigMove`, so nothing here plays the breath today. Lifts when Bailey or the driver picks a tone and a shot for No Love Lost from a mockup and the breath ' +
      'plan (and, for the sound pass, `passRecipes.HEADLINE_BLOWS`, which hit) is given a row for its ids `x2-nll-1` to `x2-nll-3`.',
  }),
});

/**
 * WHICH CHAPTERS THE TREATMENT REACHES, by the address (`?treated=`): `all` (the default on a page) is {@link TREATED_CHAPTERS}; `pack` is release 68's, the booth pair only, whatever else the list says (one word to put
 * Leblanc, and every chapter that joins later, back to the look it had). With no page at all (a unit test, a tool) it reads `pack`, as `packDemo` reads off with no page: a test that wants a joined chapter sets
 * {@link setTreatedScope}.
 */
export type TreatedScope = 'all' | 'pack';

/** `?treated=pack|all` from a search string (pure): the word if it names a scope; `pack` with no page; else `all`. `booth`, `today` and `68` are `pack`. */
export function treatedScopeFromSearch(search: string | undefined): TreatedScope {
  if (search === undefined) return 'pack';
  const w = queryWord(search, 'treated');
  return w === 'pack' || w === 'booth' || w === 'today' || w === '68' ? 'pack' : 'all';
}

let scopeNow: TreatedScope | null = null;

/** The scope the page asked for. Read once. */
export function treatedScope(): TreatedScope {
  if (scopeNow === null) scopeNow = treatedScopeFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return scopeNow;
}

/** Tests and `window.__pyrefly.treated(...)`: force the scope (`null` reads the address again). */
export function setTreatedScope(value: TreatedScope | null): void {
  scopeNow = value;
}

/** The written reason a treated chapter holds a piece back, or undefined. */
export function treatedHold(id: string | undefined, piece: TreatedPiece): string | undefined {
  return id === undefined || !Object.prototype.hasOwnProperty.call(PIECE_HOLDS, id) ? undefined : PIECE_HOLDS[id]![piece];
}

/**
 * Does the treatment reach this chapter (and, with `piece`, play that piece in it)? True for the booth pair always; for any other id only under the `all` scope, when the id is in {@link TREATED_CHAPTERS} and the
 * piece is not held. Pure but for the address, read once.
 */
export function isTreatedChapter(id: string | undefined, piece?: TreatedPiece): boolean {
  if (id === undefined) return false;
  if (isDemoChapter(id)) return true;
  if (treatedScope() !== 'all' || !Object.prototype.hasOwnProperty.call(TREATED_CHAPTERS, id)) return false;
  return piece === undefined || treatedHold(id, piece) === undefined;
}

/** The game of a chapter the treatment reaches (under the current scope), or `fallback` for any other id. */
export function demoGameOf(id: string | undefined, fallback: DemoGame = 'ffx'): DemoGame {
  return isTreatedChapter(id) ? TREATED_CHAPTERS[id!]!.game : fallback;
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
