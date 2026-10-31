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
 * Game case (AGENTS.md rule 14): the gate is both games (shared plumbing); the chapter's game is read from the table (FFX Chapter I, FFX-2 Chapter IV, FFX-2 Chapter VI, FFX Chapter II).
 */

import { PIECE_HOLDS } from './PieceHolds.ts';

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
 * THE LIST. The booth pair (release 60 and 64: the pair is on from the first release that had the pack), Leblanc (release 69, `booth-leblanc`: Chapter VI, `ffx2-leblanc`, FFX-2; the HIDDEN experiment
 * `exp-leblanc` is not this chapter and is never listed) and, in batch 2 (release 70, merged as `booth-b2`), Lady Yunalesca (the FFX lane `booth-ffx-yunalesca`: Chapter II, `yunalesca`, FFX; the first FFX chapter beyond Chapter I; built on the release 69 base, hence "release 69" in that lane's comments) and the three FFX-2 chapters named below, and, in batch 3 (also release 70 at the integration, the FFX-2 lane `booth-ffx2-b3`), Trema (Chapter XIII, `ffx2-trema`, FFX-2). **The r70 verdict pass (2026-10-31, `docs/handoff/booth-b3.md` section 12) took four of the fourteen back out (IX, XII, V and XI: a major each, below); ten were treated. Chapters V and XI are back on the list (`booth-ffx2-b4-sky`, FFX-2 only, `docs/handoff/booth-ffx2-b4-sky.md`) with the HD-2D look and the pro arena grade HELD (`PieceHolds.ts`), so the Farplane's sky draws as release 69 draws it; twelve are treated.** A twentieth id fails `tests/unit/booth-treated-chapters.test.ts` until it names a chapter the registry lists, with the game the registry says.
 */
export const TREATED_CHAPTERS: Readonly<Record<string, TreatedEntry>> = Object.freeze({
  'seymour-flux': { game: 'ffx', since: 'r60' },
  yunalesca: { game: 'ffx', since: 'r70' },
  // Batch 3a, the FFX lane `booth-ffx-b3a` (all FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter VII (Seymour and Anima, the Macalania antechamber), Chapter X (Seymour Natus, the Highbridge of Bevelle) and Chapter IX (Yojimbo, the Cavern of the Stolen Fayth). Each holds the pieces
  // named in {@link PIECE_HOLDS} and plays every other piece. `since` is the batch's release number, the driver's to renumber (batch 3 shipped together with batch 2, in release 70, at the r70 integration).
  'seymour-anima-macalania': { game: 'ffx', since: 'r70' },
  'seymour-natus': { game: 'ffx', since: 'r70' },
  // Chapter IX (Yojimbo, `yojimbo-cavern`) LEFT THIS LIST in the r70 verdict pass (2026-10-31, `docs/handoff/booth-b3.md` section 12): its Zanmato gauge panel ends against the F1 turn strip, a major the treatment introduced and release 69 does not have.
  // Its rows (look, arena, holds, rim) stay in their tables, unread, and it answers `NOT_YET` in `tests/unit/booth-treated-chapters.test.ts` until the layout is fixed and one line puts it back.
  // Batch 3b (`booth-ffx-b3b`, FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter III (Braska's Final Aeon, seven links), Chapter XII (Seymour Omnis and the four Mortiphasm discs) and Chapter XIV (Isaaru's contest of aeons,
  // three links, Yuna alone). `since` is the batch's release number, the driver's to renumber.
  'braskas-final-aeon': { game: 'ffx', since: 'r70' },
  // Chapter XII (Seymour Omnis, `seymour-omnis`) LEFT THIS LIST in the r70 verdict pass: the Enemy Intent card of the disc tracker clips the acting hero's HP numeral against the F1 party panel (a major, introduced; release 69 stacks the card above the panel). Rows stay, unread.
  'isaaru-via-purifico': { game: 'ffx', since: 'r70' },
  'ffx2-bahamut': { game: 'ffx2', since: 'r60' },
  'ffx2-leblanc': { game: 'ffx2', since: 'r69' },
  // Batch 2, the FFX-2 lane `booth-ffx2-b2` (all FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter V (Vegnagun and Shuyin, five links), Chapter XV (the Den of Woe, three shades) and Chapter XI (the Fallen Aeons,
  // three links). Each holds the pieces named in {@link PIECE_HOLDS} and plays every other piece. `since` is the batch's release number, the driver's to renumber.
  // Chapters V (`ffx2-vegnagun-shuyin`) and XI (`ffx2-fallen-aeons`) LEFT THIS LIST in the r70 verdict pass (the HD-2D bold look clips the Farplane and the Road's very bright sky to a flat white halo: V's first menu and all five links; XI's fights
  // whenever the follower brings the spire's burst into frame; a major the treatment introduced) and CAME BACK in `booth-ffx2-b4-sky` (FFX-2 only; `since` r71, the driver's to renumber) with the look HELD: `PieceHolds.ts` holds `hd2d` and `arena` in both, so the
  // plate draws as release 69 draws it, and Chapter XI holds `cam` as well (its follower crops Yuna where release 69's frame never does). `?skygrade=a|b|c` (`look/pro/SkyGrade.ts`, default off) builds three lighter grades to film for Bailey.
  'ffx2-vegnagun-shuyin': { game: 'ffx2', since: 'r71' },
  'ffx2-fallen-aeons': { game: 'ffx2', since: 'r71' },
  'ffx2-den-of-woe': { game: 'ffx2', since: 'r70' },
  // Batch 3, the FFX-2 lane `booth-ffx2-b3` (FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter XIII (Trema, Cloister 100 of the Via Infinito, two links: Paragon then Trema; the party Yuna Dark Knight, Rikku Alchemist, Paine Dark Knight, two dresses the
  // treatment has not met). It holds the pieces named in {@link PIECE_HOLDS} and plays every other piece. `since` is the batch's release number, the driver's to renumber.
  'ffx2-trema': { game: 'ffx2', since: 'r70' },
});

// {@link PIECE_HOLDS}, the written holds, lives in `PieceHolds.ts` (moved out when batch 3 passed the 400-line house limit) and is re-exported here, so every reader imports it from this module as before.
export { PIECE_HOLDS };

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
