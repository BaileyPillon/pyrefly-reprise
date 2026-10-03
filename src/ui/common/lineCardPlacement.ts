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

/**
 * The same card one step smaller (37.5% of the width), tried before the band.
 * Chapter III's opening camera leaves no 0.7 slot: Braska's Final Aeon, who
 * speaks, reaches both top slots and Yuna's torso both bottom ones (measured
 * 2026-09-27 at 1600x900 and 2000x1012), while a 0.6 card fits top-left, left
 * of the Aeon. The concept calls its sizes mockup values, not final CSS.
 */
export const SMALL_CARD_SCALE = 0.6;
const WIN_W = 0.625;
const WIN_H = 0.1319;
const OVERHANG = 0.0695;
/** The portrait's foot below the window (0.69vw): part of the card's box. */
const FOOT = 0.0069;

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
  /**
   * Boxes the card must never touch: the party's faces and torsos
   * ({@link torsoOf}, PR-0211's acceptance) and whoever may speak in the beat.
   */
  hard: readonly ScreenRect[];
  /**
   * Boxes the card should miss when a slot can (the party's whole boxes, legs
   * included): option A's own rule. When no slot misses them, a slot that only
   * crosses legs still beats the band, which crosses everyone's.
   */
  prefer?: readonly ScreenRect[];
  /** Boxes the card would rather miss (every other fiend): a tie-break only. */
  soft?: readonly ScreenRect[];
  /** Room kept around the hard and preferred boxes, px. Defaults to {@link guardFor}. */
  guard?: number;
  /**
   * The desktop scales to try, in order. Defaults to {@link CARD_SCALE} then
   * {@link SMALL_CARD_SCALE}; a beat Bailey wants small (D-247, Chapter III's
   * opening) passes `[SMALL_CARD_SCALE]` so the 0.6 card is the only size.
   * Ignored on a phone, whose card is one fixed size.
   */
  sizes?: readonly number[];
}

/**
 * The share of a party member's projected box that is face and torso: the top
 * 65%, the measure PR-0211's acceptance ("no intersection with a party face or
 * torso") was checked with on 2026-09-27.
 */
export const TORSO_FRACTION = 0.65;

/** A party member's face and torso. */
export function torsoOf(r: ScreenRect): ScreenRect {
  return { x: r.x, y: r.y, w: r.w, h: r.h * TORSO_FRACTION };
}

/** `r` grown by `m` on every side. */
export function grow(r: ScreenRect, m: number): ScreenRect {
  return { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
}

/**
 * Room between the card and a guarded box, as a share of the width.
 *
 * The card cannot move during a line, but the camera's idle sway and a
 * `shake` keep the actors drifting a little under it: up to 8 px at 1600x900
 * while a line was up, measured 2026-09-27 (`docs/handoff/iter2-b4.md`,
 * REPAIR). A beat's camera moves are handled apart: the card is put away for
 * them and placed again (`midbeatLineCard.ts`).
 */
export const GUARD_SHARE = 0.01;

/** The default {@link LineCardInput.guard} for a viewport width. */
export function guardFor(width: number): number {
  return Math.round(width * GUARD_SHARE);
}

/** The card's candidate places, in preference order, for a viewport (at `scale` on a desktop). */
export function lineCardSlots(width: number, height: number, scale: number = CARD_SCALE): LineCardPick[] {
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
  const w = WIN_W * 100 * vw * scale;
  const winH = WIN_H * 100 * vw * scale;
  const over = OVERHANG * 100 * vw * scale;
  const h = winH + over + FOOT * 100 * vw * scale;
  const margin = Math.max(16, 2 * vw);
  // Clear of the PAUSE chip in the corner (`BattleScreen.ts`).
  const top = Math.max(36, 2.4 * vw);
  const bottomY = height - margin - h;
  const at = (place: LineCardSlot, x: number, y: number): LineCardPick => ({
    place,
    rect: { x, y, w, h },
    winTop: y + over,
    scale,
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
  return { place: 'band', rect: { x: 1.5 * vw, y: winTop - over, w: 97 * vw, h: winH + over + FOOT * 100 * vw }, winTop, scale: 1 };
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
 * The place for one beat, with room ({@link LineCardInput.guard}) kept around
 * every hard and preferred box. In order:
 *
 * 1. a slot that misses the hard and the preferred boxes (option A as picked),
 *    at 0.7, else at {@link SMALL_CARD_SCALE}; among several, the one covering
 *    least of the soft boxes;
 * 2. else a slot that misses the hard boxes, covering least of the preferred
 *    ones (a compact card over one member's legs rather than a band over all);
 * 3. else option B's band, the picked fallback.
 */
export function pickLineCardPlace(input: LineCardInput): LineCardPick {
  const g = input.guard ?? guardFor(input.width);
  const hard = input.hard.map((r) => grow(r, g));
  const prefer = (input.prefer ?? []).map((r) => grow(r, g));
  const soft = input.soft ?? [];
  const phone = input.width <= PHONE_MAX_WIDTH;
  const sizes = (phone ? [1] : input.sizes ?? [CARD_SCALE, SMALL_CARD_SCALE]).map((k) => lineCardSlots(input.width, input.height, k));
  const least = (from: readonly LineCardPick[], cost: (p: LineCardPick) => number): LineCardPick | null => {
    let best: LineCardPick | null = null;
    let bestCost = Infinity;
    for (const p of from) {
      const c = cost(p);
      if (c < bestCost) {
        best = p;
        bestCost = c;
      }
    }
    return best;
  };
  const clearOfHard = sizes.map((slots) => slots.filter((s) => coveredArea(s.rect, hard) === 0));
  for (const slots of clearOfHard) {
    const pick = least(slots.filter((s) => coveredArea(s.rect, prefer) === 0), (s) => coveredArea(s.rect, soft));
    if (pick) return pick;
  }
  for (const slots of clearOfHard) {
    const pick = least(slots, (s) => coveredArea(s.rect, prefer) * 4 + coveredArea(s.rect, soft));
    if (pick) return pick;
  }
  return lineCardBand(input.width, input.height);
}
