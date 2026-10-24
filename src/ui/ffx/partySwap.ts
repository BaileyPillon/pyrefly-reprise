/**
 * THE PARTY CARDS EASE WHEN THE LIST CHANGES WHO IS ON IT (r64-fixes, FFX only: Chapter I; conference demo, the F1 HUD only).
 *
 * When Yuna summons Ixion the party's three cards are replaced by the aeon's single card, when Seymour's Banish sends him away the three come back, and the original does the same swap in one frame (that is
 * faithful and stays: the structure is not changed, only how it arrives). The F1 HUD already has its own motion for a block that leaves and returns at an action (`hudf1-act.css`: out 170 ms ease-in with a
 * slide and a fade, back 220 ms ease-out), and the skeptic found the one place the party cards still cut: 274 px to 112 px in a single frame at the summon (`SKEPTIC2.md` m5).
 *
 * So a change of membership does the same two moves: the old list is kept as a ghost (a copy, aria-hidden, no pointer) that slides out to the right edge and fades over `slideOutMs`, and each new card
 * slides in from there over `slideBackMs`, a little behind it and one step apart so the cascade the cards already have reads as arriving. REDUCE MOTION (the game's own row or the OS preference): the
 * same two moves faded, not slid, as the rest of the HUD does. A list that only changes numbers (the usual render) does none of this.
 *
 * FFX-2 has no aeon in a demo fight (its party list is a different component with its own window, `FFX2BattleHud`); nothing here touches it.
 */

import { HUD_F1_TUNE } from '../hudf1/HudF1Switch.ts';

/** The order-free identity of a list of actors: two lists with the same key show the same cards. */
export function memberKey(ids: readonly string[]): string {
  return [...ids].sort().join('|');
}

/** Does a render change WHO is on the list (and is there a list already drawn to leave)? */
export function membershipChanged(previousKey: string | null, nextKey: string, drawnRows: number): boolean {
  return previousKey !== null && previousKey !== nextKey && drawnRows > 0;
}

/** How far the cards slide, in the HUD's own px (`--f1-slide`, 52 px for a block's slide; the cards go twice that, from and to the right edge they sit on). */
export const PARTY_SLIDE_FACTOR = 2;

/** The delay of each new card behind the one before it, ms (the cascade), and the wait before the first, so the ghost has started to go. */
export const PARTY_IN_STEP_MS = 40;
export const PARTY_IN_DELAY_MS = 90;

export interface SwapTiming {
  outMs: number;
  inMs: number;
  slidePx: number;
  /** Faded, not slid. */
  reduce: boolean;
}

/** The numbers of one swap: the F1 HUD's own durations, the slide from the HUD's variable, fade-only under REDUCE MOTION. */
export function swapTiming(root: Element | null, reduceMotion: boolean): SwapTiming {
  let px = 52;
  if (root && typeof getComputedStyle === 'function') {
    const v = parseFloat(getComputedStyle(root).getPropertyValue('--f1-slide'));
    if (Number.isFinite(v) && v > 0) px = v;
  }
  return { outMs: HUD_F1_TUNE.slideOutMs, inMs: HUD_F1_TUNE.slideBackMs, slidePx: Math.round(px * PARTY_SLIDE_FACTOR), reduce: reduceMotion };
}

/** REDUCE MOTION, the game's own row (`html[data-reduce-motion]`) or the OS preference. */
export function reduceMotionNow(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.documentElement.hasAttribute('data-reduce-motion')) return true;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** A copy of the list as it is drawn now, placed beside it (the list is absolutely placed, so the copy sits exactly on it), to leave while the new cards arrive. Null when the list is not mounted. */
export function makePartyGhost(list: HTMLElement): HTMLElement | null {
  const parent = list.parentElement;
  if (!parent) return null;
  const ghost = list.cloneNode(true) as HTMLElement;
  ghost.removeAttribute('data-role'); // the real list is the one `[data-role=party-status]` finds
  ghost.classList.add('f1-party-ghost');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.pointerEvents = 'none';
  parent.insertBefore(ghost, list);
  return ghost;
}

type Animatable = { animate?: (frames: Keyframe[], opts: KeyframeAnimationOptions) => Animation };

/**
 * Play the two moves: `ghost` out, the cards of `list` in. Returns the number of animations started (0 where the browser has no `animate`, a test's jsdom: the ghost is simply removed).
 * Pure presentation; nothing here reads or changes the battle.
 */
export function playPartySwap(list: HTMLElement, ghost: HTMLElement | null, t: SwapTiming): number {
  const dropGhost = (): void => ghost?.remove();
  if (typeof (list as Animatable).animate !== 'function') {
    dropGhost();
    return 0;
  }
  let started = 0;
  const out = t.reduce ? { opacity: 0 } : { opacity: 0, translate: `${t.slidePx}px 0` };
  if (ghost) {
    const a = (ghost as Animatable).animate!([{ opacity: 1, translate: '0 0' }, out], { duration: t.reduce ? 140 : t.outMs, easing: 'cubic-bezier(0.5, 0, 0.9, 0.4)', fill: 'forwards' });
    a.onfinish = dropGhost;
    a.oncancel = dropGhost;
    setTimeout(dropGhost, Math.max(2000, t.outMs + 400)); // a page that never runs the animation (a hidden tab) does not keep the copy; 2 s so a slow-motion capture (a tenth of the speed) still sees it
    started++;
  }
  started += arriveRows(list, t, 0);
  return started;
}

/**
 * The cards of `list` arrive: each slides in (or fades in) behind the one before it. `elapsedMs` is how long ago the swap began: 0 for the swap itself, more for a render that lands inside it (see
 * `resumePartySwapIn`). A negative delay starts the animation part-way through, so a row born late arrives from where the row it replaced had got to, and a row whose arrival is over is left alone.
 */
function arriveRows(list: HTMLElement, t: SwapTiming, elapsedMs: number): number {
  let started = 0;
  list.querySelectorAll<HTMLElement>('.ig-stat').forEach((row, i) => {
    const delay = PARTY_IN_DELAY_MS + i * PARTY_IN_STEP_MS - elapsedMs;
    if (delay + t.inMs <= 0) return; // this card's arrival is over
    const from = t.reduce ? { opacity: 0 } : { opacity: 0, translate: `${t.slidePx}px 0` };
    (row as Animatable).animate!([from, { opacity: 1, translate: '0 0' }], { duration: t.inMs, delay, easing: 'cubic-bezier(0.16, 0.84, 0.3, 1)', fill: 'backwards' });
    started++;
  });
  return started;
}

/** Is a swap that began `elapsedMs` ago still bringing cards in (the last of up to four cards, with the cascade)? */
export function swapInFlight(t: SwapTiming, elapsedMs: number): boolean {
  return elapsedMs < PARTY_IN_DELAY_MS + 3 * PARTY_IN_STEP_MS + t.inMs;
}

/**
 * r64-fixes, the skeptic's F2: the game renders the party list again right after a swap (3 ms after a dismissal, 129 ms after a summon), and a render replaces every row, so the cards that were
 * arriving were thrown away and the new ones cut in at full opacity. A render inside the swap's window gives the new rows the arrival the old ones had, at the same point in it (a part-way start), so the
 * fade carries on without a break. Returns the number of animations started (0 where the browser has no `animate`).
 */
export function resumePartySwapIn(list: HTMLElement, t: SwapTiming, elapsedMs: number): number {
  if (typeof (list as Animatable).animate !== 'function') return 0;
  return arriveRows(list, t, Math.max(0, elapsedMs));
}

/** `?partyswap=off`: the original's one-frame swap of the party cards (this lane's ease is off). A comparison, or if the ease ever misbehaves at the booth. */
export function partySwapOn(search: string = typeof window !== 'undefined' ? window.location.search : ''): boolean {
  try {
    return new URLSearchParams(search).get('partyswap') !== 'off';
  } catch {
    return true;
  }
}
