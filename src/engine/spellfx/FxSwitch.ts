/**
 * THE SPELL-EFFECT SWITCH (conference demo, motion pass, lane "fx"; Bailey 2026-10-22 00:10-01:30 EDT: spell effects "Faithful shape, painted finish", "Demo chapters first").
 * The pure switch of the NEW spell effects: the painted finish (a brush-stroke look in the effect batch's shader), the Cure column, the buff spells, the hit
 * sparks per weapon, Fire, Blizzard and Thunder with trails, rings and eased sparks, and the livelier item toss.
 *
 * **Default: OFF.** Merging this changes nothing in the live game: with no address key (and in every unit test) {@link fxNewOn} answers false and every hook falls straight
 * through to today's code. It turns on when ALL of these hold:
 *
 * 1. the address carries `?fx=new` or the shared key `?pack=demo` (the Thursday test build runs with `?pack=demo`; `?fx=today` wins over the pack, for A/B captures);
 * 2. the running chapter is one of the two DEMO CHAPTERS, Chapter I (`seymour-flux`, FFX) or Chapter IV (`ffx2-bahamut`, FFX-2), named by `BattleScreen` as the battle sets up
 *    ({@link setFxChapter}). Every other chapter keeps today's effects, whatever the address says.
 *
 * `?fx=` is also the eye-candy options key (`fx/EyeCandy.ts` `parseFxQuery`: `a`, `b`, `c`, `d`, `all`, `off`); that parser skips any word it does not know, so `new` and `today`
 * pass through it unnoticed, and a list (`?fx=new,b`) feeds both. Same reading as `motion/CurvesSwitch.ts` (lane "core") and `feel/FeelSwitch.ts` (lane "feel"): read once, A/B by the key
 * named beside the pack.
 *
 * Game case (AGENTS.md rule 14): the SWITCH is both games; WHICH look plays is the chapter's game (`fxGame`): FFX in Chapter I, FFX-2 in Chapter IV. Each effect says its own case.
 *
 * Pure: no `three`, no DOM but the address of the page (hard rule 1).
 */
import { DEMO_CHAPTERS, demoChapter, demoGameOf, isDemoChapter, packDemo, queryWord, setDemoChapter } from '../motion/DemoGate.ts';
import { menuHolds } from '../motion/MenuHold.ts';

/** The two demo chapters and the game each one is (`src/data/encounters.ts` ids): the ONE table every lane's switch reads (`motion/DemoGate.ts`). */
export const FX_DEMO_CHAPTERS: Readonly<Record<string, 'ffx' | 'ffx2'>> = DEMO_CHAPTERS;

export type FxMode = 'new' | 'today';

let mode: FxMode | null = null;

/** `?fx=new|today` (a word in a comma list) and `?pack=demo` from a search string (pure): `today` (the default) unless `new` is named, or `pack=demo` with no `today`. */
export function fxModeFromSearch(search: string | undefined): FxMode {
  if (search === undefined) return 'today';
  const words = queryWord(search, 'fx').split(',').map((w) => w.trim());
  if (words.includes('today')) return 'today';
  return words.includes('new') || packDemo(search) ? 'new' : 'today';
}

/** The switch as the page asked for it. Read once. */
export function fxMode(): FxMode {
  if (mode === null) mode = fxModeFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return mode;
}

/** Tests and `window.__pyrefly.fxNew(...)`: force the mode (`null` reads the address again). */
export function setFxMode(value: FxMode | null): void {
  mode = value;
}

/** `BattleScreen` names the running chapter as the battle sets up (and `undefined` as it exits); the demo gate reads it. */
export function setFxChapter(id: string | undefined): void {
  setDemoChapter(id);
}

export function fxChapter(): string | undefined {
  return demoChapter();
}

/** Is this chapter Chapter I or Chapter IV? */
export function inFxDemoChapter(id: string | undefined): boolean {
  return isDemoChapter(id);
}

/** The game of the running demo chapter (FFX in Chapter I, FFX-2 in Chapter IV), or undefined outside the demo chapters. */
export function fxGame(): 'ffx' | 'ffx2' | undefined {
  const c = demoChapter();
  return isDemoChapter(c) ? demoGameOf(c) : undefined;
}

/** True when the new effects play now: switched on, in a demo chapter. */
export function fxNewOn(): boolean {
  return fxMode() === 'new' && isDemoChapter(demoChapter());
}

/**
 * THE PIECES OF STEP 3, one by one (Bailey picks on Thursday which stay; the default of an approved piece is flipped on Friday): with the new effects on, each piece is on unless the address names it in
 * `?fxoff=` (a comma list: `?pack=demo&fxoff=banner,slab`). Step 2's effects (Cure, the hit sparks, Fire, Blizzard, Thunder, the item toss) are one set and have no key here.
 *
 * - `bosses`: the bosses' attacks and Jump and Darkness (`spellfx/BossFx.ts`), Curse's darkening of the girl.
 * - `openings`: the charge (a boss's gather), the Overdrive's ready aura and its calm beat, the dress change's burst.
 * - `banner`: the retail Overdrive banner at the top, with no letterbox (FFX).
 * - `slab`: the ability's name over the acting girl's head (FFX-2).
 * - `status`: a move with no damage event starts its effect from its status event (the five buffs of step 2, Banish, Slowga, Curse).
 */
export type FxPiece = 'bosses' | 'openings' | 'banner' | 'slab' | 'status';
export const FX_PIECES: readonly FxPiece[] = ['bosses', 'openings', 'banner', 'slab', 'status'];

let off: Set<FxPiece> | null = null;

/** The pieces `?fxoff=` names, from a search string (pure; unknown words are ignored). */
export function fxOffFromSearch(search: string | undefined): FxPiece[] {
  if (search === undefined) return [];
  try {
    const words = (new URLSearchParams(search).get('fxoff') ?? '').toLowerCase().split(',').map((w) => w.trim());
    return FX_PIECES.filter((p) => words.includes(p));
  } catch {
    return [];
  }
}

function offSet(): Set<FxPiece> {
  if (off === null) off = new Set(fxOffFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? '')));
  return off;
}

/** Tests and `window.__pyrefly.fxPiece(...)`: turn one piece off or on for what starts from now on (`null` reads the address again). */
export function setFxPiece(piece: FxPiece | null, on = true): void {
  if (piece === null) {
    off = null;
    return;
  }
  if (on) offSet().delete(piece);
  else offSet().add(piece);
}

/**
 * Does this piece play now: the new effects are on in a demo chapter and the address did not turn the piece off. FFX-2 only in effect: while a command menu is open (`motion/MenuHold.ts`,
 * D-357) none of these ADDED looks begins (the bosses' own effects, the charge, the name slab, the dress burst, a status move's effect); asked when a look begins, so one already in flight is
 * not pulled down. The painted finish of the spells that play anyway (`fxNewOn`) is not held: a fight would change style with every menu that opens.
 */
export function fxPieceOn(piece: FxPiece): boolean {
  return fxNewOn() && !offSet().has(piece) && !menuHolds();
}
