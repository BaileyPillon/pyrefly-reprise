/**
 * HOW LONG THE BOSS CARD HOLDS WHEN IT HAS ALREADY BEEN UP AS THE LOADING CARD (post-conference lane "post-fight-start", PR-0481; both games: Chapter I Seymour Flux is FFX, Chapter IV Bahamut is
 * FFX-2; shared opening plumbing; nothing changes where no loading card went up, which is every fight whose stage is ready when the entry begins).
 *
 * A fight that loads behind the entry shows the approved boss card over the entry's ink while it loads (`loadingCard.ts`, after 400 ms), and when the battle is ready its own card goes up over the
 * same ink and holds 1.9 s (`BATTLE_START_HOLD_MS`: a beat to read the chapter, the boss and the party). On a cold page the loading card has been up for 2 to 4 s by then, so the visitor has read the
 * very same card for longer than its hold, and the battle's card then held 1.9 s MORE: Chapter I measured 2.16 s of loading card and then 2.11 s of card (release 64, the demo, press on the first
 * second of the picker), Chapter IV 3.15 s and then 2.07 s. The hold now counts the time the card has been up: it is `hold - up`, but never under {@link CARD_HOLD_FLOOR_MS}, which covers the
 * whole of the entry's reveal and leaves the card a beat over the clear field. The reveal was MEASURED, from the battle card going up to the entry overlay being removed: 929 to 962 ms in FFX
 * (Chapters I to III) and 701 to 785 ms in FFX-2 (the authored break is 700 ms in FFX and 560 ms in FFX-2; the rest is the frame the overlay is taken down on). A card that was up for 0.9 s or less holds
 * the rest of its 1.9 s (1.9 s in all, as ever); one that was up for 3 s holds 1.0 s. The hurried opening (700 ms) is under the floor and is not touched. `?cardhold=full` is the old behaviour (a comparison).
 */

import { HURRIED_CARD_HOLD_MS } from './openingHurry.ts';

/** The banner's own full hold, `BATTLE_START_HOLD_MS` in `BattleStartBanner.ts` (not imported: the screen's tests stand that module in with a mock; `tests/unit/card-hold.test.ts` pins the two equal). */
export const FULL_CARD_HOLD_MS = 1900;

/**
 * The least the battle's own card holds after a loading card: past the whole of the entry's reveal, measured 929 to 962 ms in FFX and 701 to 785 ms in FFX-2 (see above), so the card never starts
 * to fade while the entry's ink is still being taken down (the first cut of this floor, 900 ms, began the fade 13 to 61 ms early in every FFX start; the card is opaque, so nothing showed).
 */
export const CARD_HOLD_FLOOR_MS = 1000;

let upAt: number | null = null;

/** The card over the entry went up (`loadingCard.ts`). */
export function noteLoadingCardUp(at: number = performance.now()): void {
  upAt = at;
}

/** The card over the entry has handed over, or the load failed: nothing is up any more. */
export function noteLoadingCardGone(): void {
  upAt = null;
}

/** How long the card over the entry has been up, ms; 0 when none is. */
export function loadingCardUpMs(now: number = performance.now()): number {
  return upAt === null ? 0 : Math.max(0, now - upAt);
}

/** The hold of the battle's own card after a loading card that has been up `upMs`: the base hold less that, not under the floor, never over the base. Pure. */
export function cardHoldAfterLoading(baseMs: number, upMs: number): number {
  if (!(upMs > 0)) return baseMs;
  return Math.min(baseMs, Math.max(CARD_HOLD_FLOOR_MS, baseMs - upMs));
}

/** `?cardhold=full`: the battle's card holds its whole time after a loading card too (release 64's behaviour), for a comparison. */
export function cardHoldCounted(search: string = typeof window !== 'undefined' ? window.location.search : ''): boolean {
  try {
    return new URLSearchParams(search).get('cardhold') !== 'full';
  } catch {
    return true;
  }
}

/**
 * The `holdMs` option for the battle's own card (`BattleStartBanner`): the hurried hold when the opening is hurried, else the base hold shortened by the loading card's time. `{}` where the card
 * keeps its default 1.9 s (no loading card, or the old behaviour asked for).
 */
export function cardHoldOption(hurried: boolean, now: number = performance.now(), search?: string): { holdMs?: number } {
  const base = hurried ? HURRIED_CARD_HOLD_MS : FULL_CARD_HOLD_MS;
  const held = cardHoldCounted(search) ? cardHoldAfterLoading(base, loadingCardUpMs(now)) : base;
  return hurried || held !== FULL_CARD_HOLD_MS ? { holdMs: held } : {};
}
