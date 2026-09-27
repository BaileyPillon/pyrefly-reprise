/**
 * PR-0211, option A (D-232, Bailey 2026-09-26: "i'll go with all of your
 * recommends"): where the mid-battle line card goes.
 *
 * A compact card takes whichever of four slots is clear of the on-screen
 * boxes of the party and the speaker, chosen once per beat; when no slot is
 * clear it falls back to option B's bottom band. The picked frame is
 * `docs/concepts/line-card-2026-09-27/` (`sheet-2-option-a.jpg`).
 *
 * **Game case: both** [AGENTS.md rule 14]. Chapters III (FFX) and V (FFX-2)
 * both put story lines on this card, and it is one dialogue box
 * (`DialogueBox.ts`) shared by both games; the research files do not say
 * where the retail games put a line spoken mid-battle (the concept README).
 *
 * Pure: no DOM, no `three`. Rectangles are CSS pixels in one frame (the
 * battle root's), as `PaintedStage.screenRects()` produces them once the
 * caller has shifted them into it.
 */

import { intersect, rectArea, type ScreenRect } from '../../engine/ScreenRects.ts';

export type LineCardSlot = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'upper' | 'middle' | 'lower' | 'top';

/** A slot, or the bottom band every other option falls back to. */
export type LineCardPlace = LineCardSlot | 'band';

export interface LineCardPick {
  place: LineCardPlace;
  /** The card's whole visual box, the portrait's overhang included. */
  rect: ScreenRect;
  /** Where the dialogue window's own top edge goes (the portrait breaks out above it). */
  winTop: number;
  /** Uniform scale on the window (desktop only; the phone layout is fixed px). */
  scale: number;
}

/**
 * The desktop card, in fractions of the viewport width (the CSS `vw` the box
 * is laid out in, `dialogue-box.css`): the window is 62.5vw by 13.19vw, and
 * the portrait breaks out 6.95vw above it (20.83vw tall, 0.69vw below the
 * foot). The compact card is that box at 0.7, about 45% of the width, the
 * concept's size.
 */
export const CARD_SCALE = 0.7;
const WIN_W = 0.625;
const WIN_H = 0.1319;
const OVERHANG = 0.0695;

/** Below this width the box switches to its fixed-px phone layout (`dialogue-box.css`). */
export const PHONE_MAX_WIDTH = 560;
/** The phone window: 12px gutters, at least 124px tall, the portrait inside it. */
const PHONE_GUTTER = 12;
const PHONE_H = 132;

/** Everything the pick needs. */
export interface LineCardInput {
  /** Viewport width and height (CSS px): the frame the box is laid out in. */
  width: number;
  height: number;
  /** Boxes the card must not touch: the party, and whoever is speaking. */
  hard: readonly ScreenRect[];
  /** Boxes the card would rather miss (every other fiend): a tie-break only. */
  soft?: readonly ScreenRect[];
}

/** The card's candidate places, in preference order, for a viewport. */
export function lineCardSlots(width: number, height: number): LineCardPick[] {
  if (width <= PHONE_MAX_WIDTH) {
    // Portrait phone: a full-width card, stacked down the field. The first is
    // the concept's pick, under the boss bar and the intent card.
    const w = Math.max(0, width - PHONE_GUTTER * 2);
    const at = (place: LineCardSlot, f: number): LineCardPick => {
      const y = Math.round(height * f);
      return { place, rect: { x: PHONE_GUTTER, y, w, h: PHONE_H }, winTop: y, scale: 1 };
    };
    return [at('upper', 0.17), at('middle', 0.3), at('lower', 0.43), at('top', 0.04)];
  }
  const vw = width / 100;
  const w = WIN_W * 100 * vw * CARD_SCALE;
  const winH = WIN_H * 100 * vw * CARD_SCALE;
  const over = OVERHANG * 100 * vw * CARD_SCALE;
  const h = winH + over;
  const margin = Math.max(16, 2 * vw);
  // Clear of the PAUSE chip in the corner (`BattleScreen.ts`).
  const top = Math.max(36, 2.4 * vw);
  const bottomY = height - margin - h;
  const at = (place: LineCardSlot, x: number, y: number): LineCardPick => ({
    place,
    rect: { x, y, w, h },
    winTop: y + over,
    scale: CARD_SCALE,
  });
  return [
    at('top-left', margin, top),
    at('top-right', width - margin - w, top),
    at('bottom-left', margin, bottomY),
    at('bottom-right', width - margin - w, bottomY),
  ];
}

/** The fallback: option B's band along the bottom, over the waiting party panel and menu. */
export function lineCardBand(width: number, height: number): LineCardPick {
  const phone = width <= PHONE_MAX_WIDTH;
  if (phone) {
    const y = height - 88 - PHONE_H;
    return { place: 'band', rect: { x: PHONE_GUTTER, y, w: width - PHONE_GUTTER * 2, h: PHONE_H }, winTop: y, scale: 1 };
  }
  const vw = width / 100;
  const winH = WIN_H * 100 * vw;
  const over = OVERHANG * 100 * vw;
  const bottom = 0.8 * vw;
  const winTop = height - bottom - winH;
  return { place: 'band', rect: { x: 1.5 * vw, y: winTop - over, w: 97 * vw, h: winH + over }, winTop, scale: 1 };
}

/** Area of `r` covered by `boxes`, summed (overlaps between boxes counted twice: a ranking, not a measure). */
export function coveredArea(r: ScreenRect, boxes: readonly ScreenRect[]): number {
  let sum = 0;
  for (const b of boxes) {
    const hit = intersect(r, b);
    if (hit) sum += rectArea(hit);
  }
  return sum;
}

/**
 * The place for one beat: the first slot that touches no hard box, preferring
 * among those the one that covers least of the soft boxes; the band when every
 * slot touches the party or the speaker.
 */
export function pickLineCardPlace(input: LineCardInput): LineCardPick {
  const soft = input.soft ?? [];
  let best: LineCardPick | null = null;
  let bestSoft = Infinity;
  for (const slot of lineCardSlots(input.width, input.height)) {
    if (coveredArea(slot.rect, input.hard) > 0) continue;
    const s = coveredArea(slot.rect, soft);
    if (s < bestSoft) {
      best = slot;
      bestSoft = s;
    }
  }
  return best ?? lineCardBand(input.width, input.height);
}
