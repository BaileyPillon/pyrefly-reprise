/**
 * NUMBERS THAT NEVER PRINT THROUGH EACH OTHER, the pure half (conference demo, release 64; the driver's frame-by-frame look at Chapter I: during Seymour Flux's Total Annihilation two glass damage
 * numbers ("778" over a second figure) were drawn on top of each other where two party members stand close).
 *
 * The numeral layer already keeps one target's own figures apart (the ladder, the fan and the lanes in `damageLadder.ts`), but those work per target, in logical pixels, before the safe rect, the HUD dodge and the
 * pop are applied, so the figures of two actors who stand close can still land on one spot. This is the last pass, in SCREEN space, over the boxes as they are about to be drawn: when two numbers that began to
 * show within {@link SPACING_WINDOW_MS} of each other would intersect, the LATER one is moved, UP first (the way every numeral already climbs), then sideways, and a number never leaves its target's
 * neighbourhood, the screen or (unless its target is under it) the HUD. One refinement of "up first": a number whose target stands clearly BELOW the figure it meets is moved down instead, so it never hops over
 * that figure and is never read as the other actor's.
 *
 * Pure: no DOM, no `three`, no clock of its own, no randomness (layering rule 1). The numeral layer reads the boxes and writes the result. The shift is STICKY: the layer hands each number's last shift
 * back in, the planner only ever adds to it (never gives room back), so a number is never seen to jump when the figure it made way for fades out and is dropped, and a pair never swaps sides in flight.
 * Nothing in the engine, no amount, no timing and no look changes.
 *
 * Game case (rule 14): both games, the shared numeral layer (FFX multi-target spells and Overdrives; FFX-2 multi-hit and multi-target moves, Trigger Happy and the chain alike). Whether the planner runs at all is
 * the numeral layer's call: it is handed only the glass numbers (the pro look, the two demo chapters), so every other build's numbers are untouched.
 */

/** Two numbers that began to show within this many ms of each other are "simultaneous": the later one gives way. The presenter's own beat for one blow is 190 to 275 ms. [ours] */
export const SPACING_WINDOW_MS = 400;
/** The breathing room between two boxes, as a share of the shorter box's height (never less than {@link MIN_GAP} px). [ours] */
export const GAP_OF_HEIGHT = 0.16;
export const MIN_GAP = 4;
/** How far a number may be lifted (in box heights) or moved sideways (in box widths) before the planner tries the other way. [ours] */
export const MAX_UP_HEIGHTS = 3.2;
export const MAX_SIDE_WIDTHS = 2.2;
/** A number whose centre is lower than the figure it meets by more than this share of its own height is moved down, not up. [ours] */
export const LOWER_BY = 0.35;

export type SpacingAxis = 'up' | 'left' | 'right' | 'down';

/** A box centre and its half extents, screen px. */
export interface SpacingBox {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
}

export interface SpacingItem extends SpacingBox {
  /** Unique per number. */
  id: number;
  /** When the number began to show, on the layer's own clock (ms). */
  shownAt: number;
  /** Spawn order: breaks a tie in `shownAt` and says who is "later" when two began on the same frame. */
  seq: number;
  /** The shift this number carried on the last frame (from the last result); 0 when it has not moved. */
  dx?: number | undefined;
  dy?: number | undefined;
  /** The axis it moved along (from the last result), kept so it keeps its side. */
  axis?: SpacingAxis | null | undefined;
  /** True when the number's target is under the chrome (it is drawn over the HUD): the HUD panels are not obstacles for it. */
  overPanels?: boolean | undefined;
}

export interface SpacingRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface SpacingOptions {
  /** The layer's box: a moved number stays wholly inside it. Omit while the layer has no layout (tests, the first frame). */
  bounds?: SpacingRect | null | undefined;
  /** HUD panels a moved number may not be pushed into (one it already stands in is left alone). */
  panels?: readonly SpacingRect[] | undefined;
  /** The window; {@link SPACING_WINDOW_MS}. */
  windowMs?: number | undefined;
}

export interface SpacingResult {
  /** The TOTAL shift to add to the number's natural centre (what it carried plus what this frame added). */
  dx: number;
  dy: number;
  /** The axis it moved along, null when it has not moved. */
  axis: SpacingAxis | null;
  /** False only when no clear place was found (every way out was off the screen or into the HUD): the number is then left where it was. */
  clear: boolean;
}

const gapOf = (a: SpacingBox, b: SpacingBox): number => Math.max(MIN_GAP, GAP_OF_HEIGHT * 2 * Math.min(a.hh, b.hh));

/** Do the two boxes, with `gap` between them, intersect? */
export function boxesMeet(a: SpacingBox, b: SpacingBox, gap: number): boolean {
  return Math.abs(a.cx - b.cx) < a.hw + b.hw + gap && Math.abs(a.cy - b.cy) < a.hh + b.hh + gap;
}

const edges = (b: SpacingBox): SpacingRect => ({ left: b.cx - b.hw, top: b.cy - b.hh, right: b.cx + b.hw, bottom: b.cy + b.hh });
const rectsMeet = (a: SpacingRect, b: SpacingRect): boolean => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const vertical = (a: SpacingAxis): boolean => a === 'up' || a === 'down';

/** Move `box` along `axis` just far enough to clear every box in `others` (and any that moving then meets). Returns the extra shift, or null when that never settles in a few rounds. */
function clearAlong(box: SpacingBox, others: readonly SpacingBox[], axis: SpacingAxis): { dx: number; dy: number } | null {
  let dx = 0;
  let dy = 0;
  for (let round = 0; round < 12; round++) {
    const at: SpacingBox = { cx: box.cx + dx, cy: box.cy + dy, hw: box.hw, hh: box.hh };
    let need = 0;
    for (const o of others) {
      const g = gapOf(at, o);
      if (!boxesMeet(at, o, g)) continue;
      // how far along the axis until this box's edge sits one gap past the other's
      const d =
        axis === 'up' ? o.cy - o.hh - g - (at.cy + at.hh)
        : axis === 'down' ? o.cy + o.hh + g - (at.cy - at.hh)
        : axis === 'right' ? o.cx + o.hw + g - (at.cx - at.hw)
        : o.cx - o.hw - g - (at.cx + at.hw);
      need = axis === 'up' || axis === 'left' ? Math.min(need, d) : Math.max(need, d);
    }
    if (need === 0) return { dx, dy };
    if (vertical(axis)) dy += need;
    else dx += need;
  }
  return null;
}

/**
 * Plan the shifts. `items` are every glass number being drawn this frame; the result holds one entry per item.
 *
 * Numbers are taken in the order they began to show. A number whose box (its natural place plus the shift it already carries) meets an earlier one's final box, the earlier having begun within the window, is moved
 * further, along the axis it already moved on or else: up (or down when its target is clearly lower than the figure it meets), then to the side with more room, then the other way. "Room" is the layer's bounds,
 * the HUD panels and the farthest a number may go from where it was drawn. A number that meets nothing keeps the shift it has.
 */
export function planNumberSpacing(items: readonly SpacingItem[], opts: SpacingOptions = {}): Map<number, SpacingResult> {
  const windowMs = opts.windowMs ?? SPACING_WINDOW_MS;
  const bounds = opts.bounds ?? null;
  const panels = opts.panels ?? [];
  const out = new Map<number, SpacingResult>();
  const order = [...items].sort((a, b) => a.shownAt - b.shownAt || a.seq - b.seq);
  const placed: Array<SpacingBox & { shownAt: number }> = [];

  const fits = (box: SpacingBox, from: SpacingBox, overPanels: boolean): boolean => {
    const r = edges(box);
    if (bounds && (r.left < bounds.left || r.right > bounds.right || r.top < bounds.top || r.bottom > bounds.bottom)) return false;
    if (overPanels) return true;
    const rf = edges(from);
    for (const p of panels) if (rectsMeet(r, p) && !rectsMeet(rf, p)) return false;
    return true;
  };

  for (const it of order) {
    const carried = { dx: it.dx ?? 0, dy: it.dy ?? 0 };
    const natural: SpacingBox = { cx: it.cx, cy: it.cy, hw: it.hw, hh: it.hh };
    const here: SpacingBox = { cx: it.cx + carried.dx, cy: it.cy + carried.dy, hw: it.hw, hh: it.hh };
    const near = placed.filter((p) => it.shownAt - p.shownAt <= windowMs);
    const meets = near.filter((p) => boxesMeet(here, p, gapOf(here, p)));
    let result: SpacingResult = { dx: carried.dx, dy: carried.dy, axis: it.axis ?? null, clear: true };
    if (meets.length > 0) {
      const first = meets[0]!;
      const maxUp = MAX_UP_HEIGHTS * 2 * it.hh;
      const maxSide = MAX_SIDE_WIDTHS * 2 * it.hw;
      const sides: SpacingAxis[] = here.cx >= first.cx ? ['right', 'left'] : ['left', 'right'];
      const lower = here.cy - first.cy > LOWER_BY * 2 * it.hh;
      const axes: SpacingAxis[] = lower ? ['down', ...sides, 'up'] : ['up', ...sides, 'down'];
      if (it.axis) axes.splice(axes.indexOf(it.axis), 1), axes.unshift(it.axis); // the way it went before, first
      let found = false;
      for (const axis of axes) {
        // from where it stands now; the shift it would carry in all must stay within the farthest it may go
        const d = clearAlong(here, near, axis);
        if (!d) continue;
        const total = { dx: carried.dx + d.dx, dy: carried.dy + d.dy };
        if (vertical(axis) ? Math.abs(total.dy) > maxUp : Math.abs(total.dx) > maxSide) continue;
        const moved: SpacingBox = { cx: natural.cx + total.dx, cy: natural.cy + total.dy, hw: it.hw, hh: it.hh };
        if (!fits(moved, here, it.overPanels === true)) continue;
        result = { dx: total.dx, dy: total.dy, axis, clear: true };
        found = true;
        break;
      }
      if (!found) result = { dx: carried.dx, dy: carried.dy, axis: it.axis ?? null, clear: false };
    }
    out.set(it.id, result);
    placed.push({ cx: it.cx + result.dx, cy: it.cy + result.dy, hw: it.hw, hh: it.hh, shownAt: it.shownAt });
  }
  return out;
}
