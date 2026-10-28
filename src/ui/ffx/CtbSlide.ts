/**
 * THE TURN-ORDER LIST THAT SLIDES (MF-13 / TB-13, motion-fluidity pass lane L3; game case: FFX only: the CTB list is the FFX HUD, FFX-2 has the ATB bars instead; a look change: ON by default since release 68,
 * `?ctbslide=today` or `?fluidui=today` is release 67's jump; and never while the player's REDUCE MOTION is on, because a Web Animation is not stopped by a CSS rule: the gate is in {@link ctbSlideOn} and in
 * {@link slideRows}).
 *
 * `CtbList.render` replaces the whole list with `innerHTML` on every sync, so the order of the portraits jumps to its new arrangement and the unit that acted, going to the back, vanishes
 * and reappears. FLIP: before the replacement note where each row IS (First), after it note where each row now is (Last), and let each row that exists in both play from the old place to the new
 * one (Invert, Play) with one `element.animate` (compositor-driven, no timer, a second sync in the middle starts from where the row is drawn). The key of a row is its unit and which of that
 * unit's rows it is (a unit can stand in the queue more than once). A row with no old place fades in; a row that left the list is simply gone, as today.
 *
 * Two cases the first build got wrong (review of 2026-10-27, M1): a row with no box (`display: none`; the F1 strip hides every row from the 4th on) has no old place, so it fades in and never slides in
 * from the page's corner; and the unit that acted, going to the back across two or more others, would cross them with its name over theirs (the first capture of the real strip showed "Tidus" over "Seymour Flux"), so a row that
 * travels more than one and a half times the typical one fades in where it lands.
 *
 * The slide is the row's own `translate` property, not `transform`: the F1 turn strip (`hudf1-ffx.css`) and the phone rail (`phone-hud.css`) both set `transform: none !important` on a row, and an important
 * declaration beats every animation, so a `transform` slide never showed in the real Chapter I HUD (found by the stepped capture, 2026-10-27; the lab list had no such rule). `translate` composes with
 * whatever `transform` the row has and nothing overrides it.
 *
 * **The name touch of release 67's card (CP-11, +33 ms; fixed in release 68):** the row that fades in (the unit that acted, at the back) lands where a sliding neighbour still is, so for about two frames "Seymour Flux" was
 * drawn over the new "Tidus". A fade that has a slide beside it now waits {@link FADE_AFTER_MS}, drawn at opacity 0 meanwhile, until the sliding rows have covered about 80 percent of their way by the curve.
 *
 * Pure DOM helpers: no `three`, no timers; jsdom (no `animate`, no boxes) does nothing.
 */

import { fluidWord, reduceMotionNow } from '../common/fluidUi.ts';

/** How long a row takes to reach its new place, ms: inside the 150 to 250 ms the plan asks for, the same at any display rate (a Web Animation counts wall time). */
export const SLIDE_MS = 200;
/** The curve: quick off the mark, a soft landing. */
export const SLIDE_EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
/** A row that has to move less than this, CSS px, is left alone. */
const MIN_MOVE_PX = 0.5;

let forced: boolean | null = null;
/** Tests and tools: force the switch (`null` reads the address again). */
export function setCtbSlide(on: boolean | null): void {
  forced = on;
}

/** Does the list slide now? The default since release 68 (`FLUID_DEFAULTS.ctbslide`; `?ctbslide=today` / `?fluidui=today` put the jump back), a forced test switch, and never under REDUCE MOTION (it beats all of them). */
export function ctbSlideOn(search: string | undefined = globalThis.location?.search): boolean {
  return !reduceMotionNow() && (forced ?? fluidWord('ctbslide', 'flip', search));
}

/**
 * How long a row that fades in waits when rows slide beside it, ms: the slide's curve has covered 80 percent of its way at about 63 ms ({@link SLIDE_EASING}, the same at any display rate), and a name 55 to 140 px wide
 * on a 170 px pitch is clear of the place it left by then, so the new name is not drawn under a sliding one (CP-11, +33 ms). Counted on the page clock like the slide itself.
 */
export const FADE_AFTER_MS = 70;

export interface RowPlace {
  left: number;
  top: number;
}

/** `actor#n`: the n-th row of that unit in the list. */
function keyed(list: HTMLElement): Array<[string, HTMLElement]> {
  const seen = new Map<string, number>();
  const out: Array<[string, HTMLElement]> = [];
  for (const row of list.querySelectorAll<HTMLElement>('.ig-ctb__row')) {
    const actor = row.dataset['actor'] ?? '';
    const n = seen.get(actor) ?? 0;
    seen.set(actor, n + 1);
    out.push([`${actor}#${n}`, row]);
  }
  return out;
}

/** A row that has to travel more than this many times what a typical row of the render travels (a neighbour's one place) is not dragged across the others: it fades in where it lands (the unit that acted, going to the back over two or more others). */
export const WRAP_RATIO = 1.5;

/**
 * First: where every row is drawn right now (viewport px, transforms and a running slide included). A row with no box (`display: none`: the F1 strip hides every row from the 4th on) has no place
 * to start from: its rect is all zeros, which is the page's corner and not a place (review of 2026-10-27, M1: rows slid in from the top-left of the screen).
 */
export function measureRows(list: HTMLElement): Map<string, RowPlace> {
  const places = new Map<string, RowPlace>();
  for (const [key, row] of keyed(list)) {
    const r = row.getBoundingClientRect();
    if (r.width > 0) places.set(key, { left: r.left, top: r.top });
  }
  return places;
}

/**
 * Last, Invert, Play: every row of the new list that was drawn in the old one slides from there; one that was not (new, or hidden before) fades in where it is, when the old list had rows; one that is
 * hidden now is left alone. A row that has to travel more than one and a half times the typical one (the unit that acted going to the back, across two or more others) fades in at its new place instead of crossing the
 * others with its name over theirs. Returns how many animations it started.
 */
export function slideRows(list: HTMLElement, before: ReadonlyMap<string, RowPlace>): number {
  if (reduceMotionNow()) return 0; // REDUCE MOTION: the list jumps as it did (the caller asks `ctbSlideOn` first; this is the animation's own gate)
  const moves: Array<{ row: HTMLElement; dx: number; dy: number; far: number }> = [];
  const fades: HTMLElement[] = [];
  for (const [key, row] of keyed(list)) {
    if (typeof row.animate !== 'function') return 0;
    const r = row.getBoundingClientRect();
    if (r.width <= 0) continue; // hidden now: nothing to draw
    const was = before.get(key);
    if (!was) {
      if (before.size > 0) fades.push(row);
      continue;
    }
    // The list sits inside a scaled stage (the 640x360 grid): the translation is in the row's own, unscaled, pixels.
    const k = row.offsetWidth > 0 ? r.width / row.offsetWidth : 1;
    const dx = (was.left - r.left) / k;
    const dy = (was.top - r.top) / k;
    if (Math.abs(dx) < MIN_MOVE_PX && Math.abs(dy) < MIN_MOVE_PX) continue;
    moves.push({ row, dx, dy, far: Math.hypot(dx, dy) });
  }
  const sorted = moves.map((m) => m.far).sort((p, q) => p - q);
  const typical = sorted[(sorted.length - 1) >> 1] ?? 0; // the lower median: one far traveller does not move it
  let slid = 0;
  for (const m of moves) {
    if (m.far > typical * WRAP_RATIO) fades.push(m.row);
    else {
      m.row.animate([{ translate: `${m.dx.toFixed(2)}px ${m.dy.toFixed(2)}px` }, { translate: '0px 0px' }], { duration: SLIDE_MS, easing: SLIDE_EASING });
      slid++;
    }
  }
  // A fade beside a slide waits for the sliding names to clear its place (backwards fill: opacity 0 until it starts) and ends with the slides; a fade on its own plays at once.
  const beside = slid > 0;
  for (const row of fades) {
    row.animate([{ opacity: 0 }, { opacity: 1 }], beside ? { duration: SLIDE_MS - FADE_AFTER_MS, delay: FADE_AFTER_MS, easing: 'ease-out', fill: 'backwards' } : { duration: SLIDE_MS * 0.75, easing: 'ease-out' });
  }
  return slid + fades.length;
}
