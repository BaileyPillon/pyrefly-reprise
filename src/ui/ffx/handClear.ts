/**
 * r37-ui-floor, blocker 3 (FFX only): the targeting hand steps off the text cards.
 *
 * The hand is docked against the silhouette it names (`TargetCursor`), so it lands wherever the enemy
 * stands. Once the HUD labels hold the 14 px floor at 4:3 (`hud-floor.css`) the advisor card and the
 * Sensor card are wider than they were, and the hand covered the end of a line: "IN WHITE MAGIC" read
 * "IN WHITE MAG" (Chapter I, 1024x768), the folded toggle "I YUNALESCA" read "I YUNALE" (Chapter II,
 * 1024x768 and 1440x900). Like the group chip (`targetChipClear.ts`) it moves only vertically, the least
 * distance that clears every card, and never touches a card's own place. The card is a text panel: the
 * hand over a painted figure is what it is for, so only the cards listed here count.
 *
 * Desktop only (the phone has no hand: its target card is a tap line). FFX only, the FFX-2 cursor is a
 * flower. Pure arithmetic in {@link clearHandShift}; the DOM walk is {@link clearHandOfCards}.
 */

export interface HandBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The cards whose lines the hand must not cover. */
export const HAND_CARD_SELECTOR = '.mad__card, .ffx-sensor, .sgd__panel';

const GAP = 4;

const hits = (a: HandBox, b: HandBox): boolean => Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);

/**
 * The vertical shift (px, positive down) that takes `hand` clear of every card, the smaller of "down past
 * the lowest card it touches" and "up past the highest", re-checked against all cards; 0 when it already
 * clears, or when no shift within `limit` clears them (it is then left where the figure puts it).
 */
export function clearHandShift(hand: HandBox, cards: readonly HandBox[], limit: number, range?: { top: number; bottom: number }): number {
  const touched = cards.filter((c) => hits(hand, c));
  if (!touched.length) return 0;
  const h = hand.bottom - hand.top;
  const down = Math.max(...touched.map((c) => c.bottom)) + GAP - hand.top;
  const up = Math.min(...touched.map((c) => c.top)) - GAP - h - hand.top;
  const clears = (dy: number): boolean => cards.every((c) => !hits({ ...hand, top: hand.top + dy, bottom: hand.bottom + dy }, c));
  const order = Math.abs(up) < down ? [up, down] : [down, up];
  // `range`: the vertical extent of the figure the hand points at; the hand stays beside it (r37-ui-floor, third attempt: a Sensor card
  // taller than the 3-hand-heights limit left the hand on it at TEXT SIZE 115, Chapter II 1440x900).
  const inside = (dy: number): boolean => !range || (hand.top + dy >= range.top && hand.bottom + dy <= range.bottom);
  for (const dy of order) if (Math.abs(dy) <= limit && inside(dy) && clears(dy)) return dy;
  return 0;
}

/** The hand's bob carries it this far sideways (`ffx-hand-bob`); the box tested is widened by it so the answer does not flicker with the phase. */
const BOB = 6;

/**
 * Nudge the cursor layer's hand (`.ffx-target__hand`, positioned by `top` in layer px) off the text cards.
 *
 * Idempotent, so it can run after every layout *and* every frame: the authored `top` is kept on the element
 * (`data-base-top`) and each call measures from it, so a card that moves away lets the hand come back, and a card
 * that moves under it pushes it off. (Run once after the cursor's layout it missed the Sensor card, which settles
 * later: steered sideways, kept off the turn list, folded; at TEXT SIZE 115 and 130 the hand sat on its "HP ???" line.)
 */
export function clearHandOfCards(layer: HTMLElement, host: HTMLElement): void {
  const doc = layer.ownerDocument;
  if (doc.documentElement.dataset['phoneBattle']) return;
  const hand = layer.querySelector<HTMLElement>('.ffx-target__hand');
  if (!hand) return;
  const base = hand.dataset['baseTop'] ?? (hand.dataset['baseTop'] = String(parseFloat(hand.style.top) || 0));
  hand.style.top = `${base}px`;
  const hb = hand.getBoundingClientRect();
  if (hb.width <= 0 || hb.height <= 0) return;
  const cards: HandBox[] = [];
  for (const el of host.querySelectorAll<HTMLElement>(HAND_CARD_SELECTOR)) {
    if (el.hidden || el.closest('[hidden]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && Number(getComputedStyle(el).opacity) > 0.1) {
      cards.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    }
  }
  const fig = layer.querySelector<HTMLElement>('.ffx-target:not(.ffx-target--dim)')?.getBoundingClientRect();
  const range = fig && fig.height > hb.height * 2 ? { top: fig.top, bottom: fig.bottom } : undefined;
  const dy = clearHandShift({ left: hb.left - BOB, top: hb.top, right: hb.right + BOB, bottom: hb.bottom }, cards, range ? range.bottom - range.top : hb.height * 3, range);
  if (dy) hand.style.top = `${(parseFloat(base) || 0) + dy}px`;
}
