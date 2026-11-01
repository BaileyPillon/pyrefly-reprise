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
import { SKY_TODAY_HOLDS } from './PieceHoldsSky.ts';

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
 * `exp-leblanc` is not this chapter and is never listed) and, in batch 2 (release 70, merged as `booth-b2`), Lady Yunalesca (the FFX lane `booth-ffx-yunalesca`: Chapter II, `yunalesca`, FFX; the first FFX chapter beyond Chapter I; built on the release 69 base, hence "release 69" in that lane's comments) and the three FFX-2 chapters named below, and, in batch 3 (also release 70 at the integration, the FFX-2 lane `booth-ffx2-b3`), Trema (Chapter XIII, `ffx2-trema`, FFX-2). **The r70 verdict pass (2026-10-31, `docs/handoff/booth-b3.md` section 12) took four of the fourteen back out (IX, XII, V and XI: a major each, below); ten were treated in release 70; Chapters IX and XII are back on `booth-ffx-b4-hud` (FFX only: the F1 HUD's layout against their own panels is fixed, `docs/handoff/booth-ffx-b4-hud.md`) and Chapters V and XI are back on `booth-ffx2-b4-sky` (FFX-2 only, `docs/handoff/booth-ffx2-b4-sky.md`) with the HD-2D look and the pro arena grade HELD (`PieceHolds.ts`), so the Farplane's sky draws as release 69 draws it: fourteen are treated.** **The last five listed chapters (`booth-b4-last`, `docs/handoff/booth-b4-last.md`) add four with written holds (Chapters VIII, XVIII and 27 FFX only, Chapter XVI FFX-2 only): eighteen of the nineteen listed chapters were treated at the merge; Chapter XVII (`sin-fins-core`) stays out.** **The r71 verdict pass (2026-10-31, `docs/handoff/booth-b4.md` section 12) took Chapters IX and XII (FFX only: a major each, below) back out and added `hd2d` and `arena` holds to Chapter VIII: sixteen of the nineteen listed chapters are treated.** **The driver's call on the second focused review of the release 71 candidate (2026-11-01, `critic/reviews/4c01379d4-focused`, R71-C1) took Chapter XVIII (Sin's face, FFX only) off: 17 one-frame hops over 100 px remain after the real hold, against 0 on `?treated=pack`; its rows stay, unread: fifteen of the nineteen listed chapters are treated. `r72-hud` (2026-11-01, `docs/handoff/r72-hud.md`) puts IX and XII back (FFX only: their HUD layout fixed, below), the pair's `since` r71 as the first lane wrote it (the driver's to renumber): seventeen of the nineteen listed chapters are treated (10 FFX, 7 FFX-2), and Chapters XVII and XVIII are the two that are not.** A twentieth id fails `tests/unit/booth-treated-chapters.test.ts` until it names a chapter the registry lists, with the game the registry says.
 */
export const TREATED_CHAPTERS: Readonly<Record<string, TreatedEntry>> = Object.freeze({
  'seymour-flux': { game: 'ffx', since: 'r60' },
  yunalesca: { game: 'ffx', since: 'r70' },
  // Batch 3a, the FFX lane `booth-ffx-b3a` (all FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter VII (Seymour and Anima, the Macalania antechamber), Chapter X (Seymour Natus, the Highbridge of Bevelle) and Chapter IX (Yojimbo, the Cavern of the Stolen Fayth). Each holds the pieces
  // named in {@link PIECE_HOLDS} and plays every other piece. `since` is the batch's release number, the driver's to renumber (batch 3 shipped together with batch 2, in release 70, at the r70 integration).
  'seymour-anima-macalania': { game: 'ffx', since: 'r70' },
  'seymour-natus': { game: 'ffx', since: 'r70' },
  // Chapter IX (Yojimbo, `yojimbo-cavern`, FFX only) LEFT THIS LIST in the r70 verdict pass (a major: the Zanmato gauge panel ended against the F1 turn strip), CAME BACK on `booth-ffx-b4-hud` (the gauge between the F1 ribbon and the F1 turn strip: `src/ui/hudf1/hudf1-chapters.css`), LEFT AGAIN in the
  // r71 verdict pass (2026-10-31, `docs/handoff/booth-b4.md` section 12, job HUD-3: with Intel (G) open and the target cursor up, the advisor's one-row tip landed on the gauge, 634 x 53 px at 2560 x 1440, 397 x 33 at 1600 x 900, 318 x 26 at 1280 x 720; live reads 0) and is BACK on `r72-hud`
  // (2026-11-01, `docs/handoff/r72-hud.md`, FFX only): the F1 ribbon is a solid box to the advisor's solver while the gauge is up (`hudAvoidSelectors.f1RibbonEls`: the tip solves against it, clear of the gauge), and the tip is NOT slid right of the ribbon here (`hudf1-chapters.css`: the stylesheet's 166 grid px is Chapter I's),
  // so the bar stands where it was solved. It holds the pieces named in {@link PIECE_HOLDS}, and `F1_TEXT_CEILING` still hands it today's HUD at TEXT SIZE 130. The browser read (HUD-1 to HUD-7 of the handoff) is the next review's: `since` stays r71 (the batch's release number, the driver's to renumber).
  'yojimbo-cavern': { game: 'ffx', since: 'r71' },
  // Batch 3b (`booth-ffx-b3b`, FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter III (Braska's Final Aeon, seven links), Chapter XII (Seymour Omnis and the four Mortiphasm discs) and Chapter XIV (Isaaru's contest of aeons,
  // three links, Yuna alone). `since` is the batch's release number, the driver's to renumber.
  'braskas-final-aeon': { game: 'ffx', since: 'r70' },
  // Chapter XII (Seymour Omnis, `seymour-omnis`, FFX only) LEFT THIS LIST in the r70 verdict pass (a major: the Enemy Intent card clipped the acting hero's HP numeral), CAME BACK on `booth-ffx-b4-hud` (the card's foot 6 grid px above the first party card: `hudf1-chapters.css`), LEFT AGAIN in the r71
  // verdict pass (2026-10-31, `docs/handoff/booth-b4.md` section 12, jobs HUD-1 and HUD-3: the disc strip and its note painted over the F1 turn strip at every width under 1920, 58.7 x 29.6 px at 1280 x 720 and 9.3 at 1600 x 900; the Sensor plate over the target flag, 71.6 x 78 px at 1600, 201 x 67 at 1280)
  // and is BACK on `r72-hud` (2026-11-01, `docs/handoff/r72-hud.md`, FFX only): the strip is anchored by its right edge 8 grid px short of the turn strip (and gives up padding at the small windows), the Sensor card stands under the turn strip clear of the flag, the F1 ribbon is a solid box to the advisor's
  // solver (the card and the tip stand clear of it) and the tip is not slid (`hudf1-chapters.css`, `hudAvoidSelectors.f1RibbonEls`). It holds the pieces named in {@link PIECE_HOLDS}; the card half of the first lane was exact (foot 979 on all 233 sampled frames) and is untouched. Named losses (carried for Bailey, `r72-hud.md` section 9): at TEXT SIZE 115 the disc strip AND the Sensor card keep their size here (the card's type is 13 percent smaller than live's 115; IX's gauge keeps its size too), and at 130 the chapter draws today's HUD.
  'seymour-omnis': { game: 'ffx', since: 'r71' },
  'isaaru-via-purifico': { game: 'ffx', since: 'r70' },
  // The last five listed chapters, the FFX lane `booth-b4-last` (FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter; the holds are in `PieceHoldsLast.ts`): Chapter VIII (Evrae, on the Fahrenheit's deck), Chapter XVIII (Sin's face, link 4 on the same deck over the Bevelle plate) and
  // the Mirror Aeons chapter (Chapter 27 in the list: two plates, no @2x master for the first). Chapter XVII (Sin's Fins and Core, `sin-fins-core`) does NOT join: its Fin plate meets the F1 turn strip and its flight plate is the brightest of any listed chapter's fight plate, 0.659 against the Farplane's 0.628 that clipped (`tests/unit/booth-treated-chapters.test.ts` `NOT_YET`). `since` is the batch's release number.
  'evrae-airship': { game: 'ffx', since: 'r71' },
  // Chapter XVIII (Sin's face, `sin-face`, FFX only) LEFT THIS LIST for release 71 (the driver's call on the second focused HOLD, 2026-11-01: `critic/reviews/4c01379d4-focused`, R71-C1: 17 one-frame hops over 100 px with the real clips held, against 0 on `?treated=pack`) and is BACK on `r73-fast`
  // (2026-11-01, `docs/handoff/r73-fast.md`; both games' plumbing, FFX only for the chapter): the hops were the house strike played at the FAST playback speed (a sub-frame tap of R1, the Bushido sequence's chip, left the review's run on fast from Auron's Dragon Fang on, `r73-sinface`), the strike's travel and
  // return landed in 5 and 8 frames and stepped 0.46 and 0.25 of the reach in one, and `StrikeCurve.crossingFloors` now keeps both at their normal length at every speed (`tests/unit/engine/r73-fast-floor.test.ts`: no frame steps further than at normal, no jerk over 100 px at normal, 0.64, fast, 0.1 and skip, 280 to 600 px). Its rows
  // (`PieceHoldsLast.ts`, including `real`, which stays held), the look row, `sin-hud.css` and the cut-anchor row are as they were. The CHK-027 run against `?treated=pack` at normal AND fast speed is the next focused review's job (r73-fast.md section 6); `booth-b4-r71-sin-face-off.test.ts` asks for it by name in the `SIN-FACE LIFT:` line of the handoff note.
  'sin-face': { game: 'ffx', since: 'r71' }, // `since` stays r71: the batch it joined in (the driver's to renumber)
  'mirror-aeons': { game: 'ffx', since: 'r71' },
  'ffx2-bahamut': { game: 'ffx2', since: 'r60' },
  'ffx2-leblanc': { game: 'ffx2', since: 'r69' },
  // Batch 2, the FFX-2 lane `booth-ffx2-b2` (all FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter V (Vegnagun and Shuyin, five links), Chapter XV (the Den of Woe, three shades) and Chapter XI (the Fallen Aeons,
  // three links). Each holds the pieces named in {@link PIECE_HOLDS} and plays every other piece. `since` is the batch's release number, the driver's to renumber.
  // Chapters V (`ffx2-vegnagun-shuyin`) and XI (`ffx2-fallen-aeons`) LEFT THIS LIST in the r70 verdict pass (the HD-2D bold look clips the Farplane and the Road's very bright sky to a flat white halo: V's first menu and all five links; XI's fights
  // whenever the follower brings the spire's burst into frame; a major the treatment introduced) and CAME BACK in `booth-ffx2-b4-sky` (FFX-2 only; `since` r71, the driver's to renumber) with the look HELD: `PieceHolds.ts` holds `hd2d` and `arena` in both, so the
  // plate draws as release 69 draws it, and Chapter XI holds `cam` as well (its follower crops Yuna where release 69's frame never does). `?skygrade=a|b|c` (`look/pro/SkyGrade.ts`) builds three lighter grades to film for Bailey. **r72 (`r72-sky`): Chapter XI plays `hd2d` and `arena` with grade C by default**
  // (Bailey's pick from the stills: "dimmer lights: a dark night where the burst still shines"; its two holds moved to `PieceHoldsSky.ts`, where `?skygrade=today` puts release 71's Chapter XI back); Chapter V keeps both holds (C leaves 21 percent of its sky band over 240).
  'ffx2-vegnagun-shuyin': { game: 'ffx2', since: 'r71' },
  'ffx2-fallen-aeons': { game: 'ffx2', since: 'r71' },
  'ffx2-den-of-woe': { game: 'ffx2', since: 'r70' },
  // Batch 3, the FFX-2 lane `booth-ffx2-b3` (FFX-2 only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapter XIII (Trema, Cloister 100 of the Via Infinito, two links: Paragon then Trema; the party Yuna Dark Knight, Rikku Alchemist, Paine Dark Knight, two dresses the
  // treatment has not met). It holds the pieces named in {@link PIECE_HOLDS} and plays every other piece. `since` is the batch's release number, the driver's to renumber.
  'ffx2-trema': { game: 'ffx2', since: 'r70' },
  // The last five listed chapters, the FFX-2 item of `booth-b4-last` (FFX-2 only; Bailey 2026-10-30): Chapter XVI (Ixion at Djose, one link and a story close): its Chamber plate is Bailey's approved pick (C2, D-273) with no room row yet, and Ixion's is a swap exception, so the room looks, the follower, the breath, the knock-out's cut and the smear planner wait
  // behind written holds (`PieceHoldsLast.ts`). `since` is the batch's release number.
  'ffx2-ixion-djose': { game: 'ffx2', since: 'r71' },
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

/**
 * `?skygrade=` (r72, `look/pro/SkyGrade.ts`; FFX-2 only: the Farplane's two plates), the whole word: `a`, `b` or `c` (one of the three lighter grades, to film), `today` (release 71's Chapter XI: its `hd2d` and `arena` HELD again, see {@link SKY_TODAY_HOLDS}), `off` (set live only,
 * `__pyrefly.skyGrade(null)`: no grade patches the room, the r70 control arm) or `default` (no word, or a word that names none of these: each chapter plays its own default, Chapter XI grade C and Chapter V nothing). The word lives here, beside `?treated=`, because the hold
 * lookup below reads it and `SkyGrade.ts` imports this module, so it could not hold the state itself without a cycle.
 */
export type SkyWord = 'a' | 'b' | 'c' | 'today' | 'off' | 'default';

/** `?skygrade=a|b|c|today` from a search string (pure): the word, or `default` (no word, no page, or a word that names none). */
export function skyWordFromSearch(search: string | undefined): SkyWord {
  const w = queryWord(search, 'skygrade');
  return w === 'a' || w === 'b' || w === 'c' || w === 'today' ? w : 'default';
}

let skyWordNow: SkyWord | null = null;

/** The word the page asked for (read once from the address). */
export function skyWord(): SkyWord {
  if (skyWordNow === null) skyWordNow = skyWordFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return skyWordNow;
}

/** Tests and `__pyrefly.skyGrade(...)`: force the word (`null` reads the address again). */
export function setSkyWord(value: SkyWord | null): void {
  skyWordNow = value;
}

/**
 * The written reason a treated chapter holds a piece back, or undefined. A hold of {@link PIECE_HOLDS} always answers; a hold of {@link SKY_TODAY_HOLDS} (Chapter XI's `hd2d` and `arena`, which r72 plays by default) answers only while the address says `?skygrade=today`,
 * so that word is release 71's Chapter XI exactly.
 */
export function treatedHold(id: string | undefined, piece: TreatedPiece): string | undefined {
  if (id === undefined) return undefined;
  const own = Object.prototype.hasOwnProperty.call(PIECE_HOLDS, id) ? PIECE_HOLDS[id]![piece] : undefined;
  if (own !== undefined || skyWord() !== 'today') return own;
  return Object.prototype.hasOwnProperty.call(SKY_TODAY_HOLDS, id) ? SKY_TODAY_HOLDS[id]![piece] : undefined;
}

/** The pieces a chapter holds back right now: the ones `?skygrade=today` adds (release 71's order has them first), then `PIECE_HOLDS`' rows. The debug read `__pyrefly.treated().holds` reports this. */
export function treatedHolds(id: string | undefined): string[] {
  if (id === undefined) return [];
  const own = Object.prototype.hasOwnProperty.call(PIECE_HOLDS, id) ? Object.keys(PIECE_HOLDS[id]!) : [];
  const extra = skyWord() === 'today' && Object.prototype.hasOwnProperty.call(SKY_TODAY_HOLDS, id) ? Object.keys(SKY_TODAY_HOLDS[id]!) : [];
  return [...extra.filter((p) => !own.includes(p)), ...own];
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
