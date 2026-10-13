/**
 * The front end's paintings, fetched and decoded before the screens that show
 * them (PR-0065).
 *
 * Round 11 photographed a cold launch: Auron's briefing arriving without Auron
 * or its backdrop, and the chapter board's party tiles as grey placeholder
 * busts (now on Chapter VIII too) while their 1.1-1.4 MB portraits loaded.
 * The title screen waits for a key, so it is where this starts: whatever the
 * next screen shows first (the briefing's two paintings on a first launch,
 * otherwise the board's opening card and every card's faces), then the rest.
 * Since r43 (PR-0405) it starts at the player's first key or pointer input, not when the title appears: see {@link armFrontEndWarm}.
 *
 * Each screen waits for its own set before it goes up, with a ceiling so a
 * slow network delays a screen and never holds it. The screen right after the
 * title is waited for by the title itself, before its wipe starts
 * ({@link holdForNextScreen}), so the wipe still clears onto the new screen:
 * the first build of this waited after the wipe had cleared, and the bare
 * title sat there for up to 2.5 s ignoring every key (round 11 verification).
 *
 * The URLs are read off the board's own markup (`chapterCards.ts`), so this
 * warms exactly what the screen will ask for and cannot drift from it. That
 * markup depends on the art manifest (an FFX-2 face is `yuna-x2.png` once the
 * manifest says so, plain `yuna.png` before), so the board's list is read only
 * once the manifest has landed; read earlier, it warmed the wrong FFX-2 faces.
 *
 * Game case: both, one shared front end.
 */

import type { App } from '../App.ts';
import { loadArtManifest } from '../../engine/ArtManifest.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { untilWarm, warmImages } from '../imageWarm.ts';
import { asideHtml, heroHtml, railHtml } from './frontend/chapterCards.ts';
import { buildChapterTiles, groupChapterTiles, type ChapterTile } from './frontend/chapterGrid.ts';

/**
 * Longest the briefing or the board waits for its paintings. On a first launch
 * the title has been fetching them since it went up, so the wait is normally
 * nil. A cold cache and an Enter within half a second of load (measured at
 * 100 Mbit/s with the title's music and SFX loading alongside) is where it
 * binds: the title then holds this long before its wipe, and the plate may
 * still land after the board is up.
 */
export const FRONTEND_WARM_CEILING_MS = 1000;

/** When the title already spent a screen's wait, the time that wait ends. */
const deadlines = new Map<'briefing' | 'board', number>();

/** `p`, or nothing once `ms` has passed. */
function within(p: Promise<unknown>, ms: number): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise((resolve) => {
    timer = setTimeout(resolve, ms);
  });
  return Promise.race([p, late]).finally(() => clearTimeout(timer));
}

/** Wait until `end` (a `performance.now()` time) at the latest for the board's first card. */
async function boardGate(app: Pick<App, 'save'>, end: number): Promise<void> {
  await within(loadArtManifest(), Math.max(0, end - performance.now()));
  const board = boardArtUrls(app.save);
  const ready = untilWarm(board.first, Math.max(0, end - performance.now()));
  void warmImages(board.rest, 'idle'); // r29: the rest waits for anything a screen needs now
  await ready;
}

/** What Auron's briefing paints (`ui/coach/Briefing.ts`). */
export function briefingArtUrls(): string[] {
  return [artUrl('art/characters/auron/idle.png'), artUrl('art/backdrops/dreams-end.png')];
}

/** Every `src="..."` in a piece of markup, in order. */
function srcsIn(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/\b(?:data-lazy-)?src="([^"]+)"/g)) out.push(m[1]!.replace(/&amp;/g, '&'));
  return out;
}

/**
 * A card's party faces as `[top, lower]` layers. An FFX-2 tile stacks her
 * dressphere body under her portrait (`ui/common/portrait.ts`
 * `faceLayersHtml`); the portrait is the one the player sees, the body only
 * shows through if the portrait is missing, so only the top layer is urgent.
 */
function faceLayers(tile: ChapterTile): { top: string[]; lower: string[] } {
  const top: string[] = [];
  const lower: string[] = [];
  for (const face of asideHtml(tile, null).split('class="fe-party__face"').slice(1)) {
    const srcs = srcsIn(face);
    if (srcs.length === 0) continue;
    top.push(srcs[srcs.length - 1]!);
    lower.push(...srcs.slice(0, -1));
  }
  return { top, lower };
}

/**
 * The board's paintings: `first` is what its first paint shows and waits for
 * (the opening card's plate, silhouettes and faces); `rest` is everything else,
 * most urgent first: every other card's faces (what the cursor reaches next;
 * round 11 caught Chapter VIII's Wakka and Rikku as grey busts), the stacked
 * body layers under the FFX-2 portraits, then the rail and the other plates.
 *
 * Only the opening card is waited on: waiting for every card's faces too was
 * 21 MB, which held a cold board at 100 Mbit/s to its ceiling (round 11
 * verification). The rest loads while the player reads the first card.
 */
export function boardArtUrls(save: Parameters<typeof buildChapterTiles>[0]): { first: string[]; rest: string[] } {
  const tiles = buildChapterTiles(save);
  let selected = tiles.findIndex((t) => t.playable);
  if (selected < 0) selected = 0;
  const plate = (tile: ChapterTile, index: number): string[] => [
    ...(tile.sceneKey ? [artUrl(`art/backdrops/${tile.sceneKey}.png`)] : []),
    ...srcsIn(heroHtml(tile, index)),
  ];
  const head = tiles[selected];
  const headFaces = head ? faceLayers(head) : { top: [], lower: [] };
  const first = [...(head ? plate(head, selected) : []), ...headFaces.top];
  const others = tiles.map((t, i) => [t, i] as const).filter(([, i]) => i !== selected);
  const otherFaces = others.map(([t]) => faceLayers(t));
  const rail = srcsIn(railHtml(groupChapterTiles(tiles), tiles, selected));
  const seen = new Set(first);
  const rest = [
    ...otherFaces.flatMap((f) => f.top),
    ...headFaces.lower,
    ...otherFaces.flatMap((f) => f.lower),
    ...rail,
    ...others.flatMap(([t, i]) => plate(t, i)),
  ].filter((u) => !seen.has(u) && (seen.add(u), true));
  return { first: [...new Set(first)], rest };
}

/**
 * Start everything the front end will show, most urgent first. Called by the
 * title. The briefing's paintings go first only when it is due: a returning
 * player never sees it, and its 4.4 MB backdrop queued ahead of the board's
 * opening card was part of what held a cold board to its ceiling.
 */
export function warmFrontEnd(app: Pick<App, 'save'>, briefingDue: boolean): void {
  if (briefingDue) void warmImages(briefingArtUrls());
  void loadArtManifest().then(() => {
    try {
      const board = boardArtUrls(app.save);
      void warmImages(board.first);
      void warmImages(board.rest, 'idle'); // r29 PR-0221: behind anything a screen needs now
    } catch {
      /* a harness without chapters: the screens load their own art */
    }
  });
}

/**
 * What the next screen needs for its first paint, and nothing beyond it: the briefing's two paintings when it is due, else the
 * board's opening card with its faces. A screen waits for these (ceilinged, {@link holdForNextScreen}); the rest of the board does not.
 */
function warmNextScreen(app: Pick<App, 'save'>, briefingDue: boolean): void {
  if (briefingDue) void warmImages(briefingArtUrls());
  void loadArtManifest().then(() => {
    try {
      void warmImages(boardArtUrls(app.save).first);
    } catch {
      /* a harness without chapters: the screens load their own art */
    }
  });
}

/**
 * When the title asks for the briefing's and the board's paintings (PR-0405, round 25).
 *
 *   `now`    as soon as the title is up: the next screen's first paint, then every other card's art (r42 and before).
 *   `first`  the next screen's first paint as soon as the title is up; the rest of the board at the player's first input.
 *   `defer`  nothing until the player's first input; the press that leaves the title then holds for the next screen's first paint.
 *
 * The address can name one (`?prefetch=now|first|defer`, for the measurements and for switching a mode on); the default is
 * {@link DEFAULT_PREFETCH_MODE}, `now`: what the live build does. Measured on a 100 Mbit/s link against the live build, `defer` made the board arrive
 * a second later after the press and Auron's briefing come up a second late, and `first` kept the press as fast but left the board's rail strips empty for
 * several seconds for a player who had sat on the title (they finish about 5 s later), neither of which may happen on a fast link, and neither helped a slow
 * one (the idle lane already keeps the rest of the board behind the opening card there). `docs/handoff/r43-delivery.md` holds the numbers; one constant here
 * (and nothing else) turns `first` or `defer` on for everyone.
 */
export type PrefetchMode = 'now' | 'first' | 'defer';

export const PREFETCH_MODES: readonly PrefetchMode[] = ['now', 'first', 'defer'];

/** The mode in force when the address names none. */
export const DEFAULT_PREFETCH_MODE: PrefetchMode = 'now';

/** The mode a page address names (`?prefetch=`), else `fallback`. */
export function prefetchModeFrom(search: string, fallback: PrefetchMode = DEFAULT_PREFETCH_MODE): PrefetchMode {
  const value = new URLSearchParams(search).get('prefetch');
  return PREFETCH_MODES.find((mode) => mode === value) ?? fallback;
}

/**
 * What counts as the player's first input: a key, a press, a touch, a wheel, or the pointer moving.
 * (A gamepad raises no DOM event; the title's own start press reaches {@link startFrontEndWarm} directly.)
 */
export const FIRST_INPUT_EVENTS = ['keydown', 'pointerdown', 'pointermove', 'touchstart', 'wheel'] as const;

/** The listeners of the one pending {@link armFrontEndWarm}, so arming twice (the title entered again) never stacks them. */
let pendingArm: (() => void) | null = null;

/**
 * The paintings wait for the player's first key or pointer input, not for the title to appear (PR-0405).
 *
 * Round 25 measured 29.7 MB of art arriving in the 4.5 seconds after the title was ready (121 MB in the first 24 s) before anyone had
 * touched anything. The briefing's and the board's paintings now start at the first key, press, touch, wheel or pointer movement
 * anywhere in the front end, or at the press that leaves the title ({@link startFrontEndWarm}), whichever comes first. A session with no
 * input at all (a tab left open, a script that only looks) fetches none of them.
 *
 * Nothing waits on this that did not wait before: the title's hold for the next screen's first paint ({@link holdForNextScreen},
 * ceilinged at {@link FRONTEND_WARM_CEILING_MS}) is what the press that leaves the title waits for. Game case: both (one shared front end).
 *
 * Returns the function that cancels the wait.
 */
export function armFrontEndWarm(
  app: Pick<App, 'save'>,
  briefingDue: () => boolean,
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'> | null = typeof window === 'undefined' ? null : window,
): () => void {
  pendingArm?.();
  if (!target) return () => undefined;
  const fire = (): void => startFrontEndWarm(app, briefingDue());
  const disarm = (): void => {
    for (const type of FIRST_INPUT_EVENTS) target.removeEventListener(type, fire, { capture: true });
    if (pendingArm === disarm) pendingArm = null;
  };
  for (const type of FIRST_INPUT_EVENTS) target.addEventListener(type, fire, { capture: true, passive: true });
  pendingArm = disarm;
  return disarm;
}

/** Start the front end's paintings now, and stop waiting for an input to do it (the first input has come). */
export function startFrontEndWarm(app: Pick<App, 'save'>, briefingDue: boolean): void {
  pendingArm?.();
  warmFrontEnd(app, briefingDue);
}

/** The title's side of it: what to ask for now and what to leave for the first input, by {@link PrefetchMode}. Returns the function that cancels the wait. */
export function beginFrontEndWarm(
  app: Pick<App, 'save'>,
  briefingDue: () => boolean,
  mode: PrefetchMode = DEFAULT_PREFETCH_MODE,
  target?: Pick<EventTarget, 'addEventListener' | 'removeEventListener'> | null,
): () => void {
  if (mode === 'now') {
    startFrontEndWarm(app, briefingDue());
    return () => undefined;
  }
  if (mode === 'first') warmNextScreen(app, briefingDue());
  return armFrontEndWarm(app, briefingDue, target);
}

/** How long a screen may still wait: what the title left of it, else the whole ceiling. */
function budgetFor(key: 'briefing' | 'board'): number {
  const until = deadlines.get(key);
  deadlines.delete(key);
  return until === undefined ? FRONTEND_WARM_CEILING_MS : Math.max(0, until - performance.now());
}

/**
 * The title's half of the wait: before its wipe starts, hold (with the
 * ceiling) for what the screen after it shows first. That screen then spends
 * only what is left, so the two waits never add up.
 */
export async function holdForNextScreen(app: Pick<App, 'save'>, briefingDue: boolean): Promise<void> {
  const end = performance.now() + FRONTEND_WARM_CEILING_MS;
  deadlines.set(briefingDue ? 'briefing' : 'board', end);
  try {
    if (briefingDue) await untilWarm(briefingArtUrls(), FRONTEND_WARM_CEILING_MS);
    else await boardGate(app, end);
  } catch {
    /* never hold the title over its paintings */
  }
}

/** Wait (with what is left of the ceiling) for the briefing's two paintings. */
export async function briefingWhenWarm(): Promise<void> {
  await untilWarm(briefingArtUrls(), budgetFor('briefing'));
}

/** Wait (with what is left of the ceiling) for the board's first card, then build the screen. */
export async function boardWhenWarm<T>(app: Pick<App, 'save'>, make: () => T): Promise<T> {
  const end = performance.now() + budgetFor('board');
  try {
    await boardGate(app, end);
  } catch {
    /* never hold the board over its paintings */
  }
  return make();
}
