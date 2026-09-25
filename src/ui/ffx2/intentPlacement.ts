/**
 * Where the enemy-intent slab actually goes, and how to make
 * `EnemyIntentPanel.layout` put it there.
 *
 * ## The problem
 *
 * `src/ui/common/EnemyIntent.ts` pins its slab over the acting enemy's head,
 * clamps it into the overlay, then walks the rectangles the HUD names in
 * `avoid()` and slides the slab off each one **in a single greedy pass**: left
 * or right if that side has room, otherwise straight down. It never re-checks a
 * rectangle it has already passed.
 *
 * That is fine with one obstacle. FFX-2 has nine — the gauge strip, the guide
 * rail and its chip, the command stack, the party column, the advisor card and
 * its chip, and the three girls plus the boss — laid out around the edges of
 * the frame with gaps narrower than the 150x98 slab. A single greedy pass
 * ping-pongs: dodging Bahamut lands the slab on the gauge strip, dodging the
 * strip lands it back on Bahamut, and the last "nowhere to go sideways" dodge
 * drops it to the floor of the overlay — on top of the move advisor. That is
 * what Chapter 4 shipped at 1280x720, 1600x900 and 2000x1000.
 *
 * Merging the obstacles first does not fix it. A bounding-box union of Bahamut
 * and the command stack covers the clean top-right corner *between* them, and
 * because every FFX-2 panel is within a slab's width of the next one, one merge
 * cascades into a single rectangle the size of the screen.
 *
 * ## What this does instead
 *
 * {@link placeSlab} solves the placement properly — a candidate search over the
 * obstacle edges for the free spot nearest where the slab wants to be — and
 * {@link steerRects} turns that answer into the one or two rectangles whose
 * greedy resolution *is* that answer. The HUD hands those back from `avoid()`
 * in place of the raw obstacle list, so the existing single pass lands on the
 * solved placement instead of wandering.
 *
 * It is deliberately a pure function of rectangles: `EnemyIntent.ts` belongs to
 * another track, and the standing request to give `layout()` a real placement
 * pass (which would make this module unnecessary) is written down in
 * `docs/handoff/fix3-ffx2-hud-prep.md`. Until then this steers from the outside
 * and degrades to today's behaviour — {@link steerRects} returns `[]`, i.e. no
 * dodging at all — whenever the slab is already where it should be.
 */

/** A rectangle in whatever space the caller is working in. */
export interface SlabRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  /**
   * A painted fighter rather than HUD chrome. Under {@link placeSlab}'s
   * `tiered` mode the slab may sit on one of these when that is the only way
   * to stay off the chrome, never the other way round.
   */
  soft?: boolean;
}

/** The dodge step's own hard-coded clearance, mirrored from `EnemyIntent.layout`. */
const DODGE_GAP = 4;

/** A move smaller than this is not worth steering for, and cannot be expressed anyway. */
const MIN_STEER = DODGE_GAP + 2;

/**
 * How much more a vertical move costs than a horizontal one.
 *
 * The slab's whole claim is "this is about *that* boss", and it makes that
 * claim by sitting on the boss's eye line with a tail pointing down at the
 * head. Sliding sideways keeps the eye line; dropping below the head loses it
 * and the tail is dropped with it. So a sideways move is preferred even when
 * it is three times as far.
 */
const VERTICAL_COST = 3;

function overlapArea(a: SlabRect, b: SlabRect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(Math.max(min, max), v));
}

export interface SlabPlacement {
  left: number;
  top: number;
  /** True when the slab could be placed clear of every obstacle. */
  free: boolean;
}

/**
 * The free spot nearest the slab's natural position.
 *
 * Candidate positions are the natural one plus, for every obstacle, the
 * positions flush against its four edges — the standard candidate set for
 * rectangle placement, and enough here because a best placement always touches
 * either an obstacle or the frame. Candidates are clamped into the layer and
 * scored by weighted distance from the natural position; the cheapest free one
 * wins.
 *
 * `top` never goes **above** the natural position: the natural top is already
 * the highest the slab wants to be (it is the enemy's head minus the gap minus
 * the slab), so anything higher is further from the boss for no reason. Nor
 * above `edge + headroom`, which is the band the slab's own chip needs.
 *
 * With nothing free — a small frame with a big board — the candidate that
 * covers the least is returned with `free: false`, which is still strictly less
 * overlap than the greedy pass produces.
 *
 * **`opts.tiered`** (the intent slab; FFX-2 only): obstacles marked `soft`
 * (the fighters) rank below the chrome. The winner covers the least chrome
 * first, then the least fighter, then is nearest. Without it every square pixel
 * counted the same, so a tall slab (Trema's, 375x321 at 1600x900) that could
 * not clear both took 2,835 px² of the command stack over a larger slice of
 * Trema's own robe, and printed across ATTACK.
 *
 * **`opts.chip`**: the slab's `E HIDE` chip, `w` x `h`, riding its top-right
 * corner `gap` above its top edge (`EnemyIntent.layout`). It is placed with the
 * slab, so it is scored with it: a slab parked just under the boss plate wore
 * its chip across the plate (Chapter XI, 663 px² at 1280x720).
 */
export function placeSlab(
  natural: { left: number; top: number },
  size: { w: number; h: number },
  obstacles: readonly SlabRect[],
  layer: { width: number; height: number },
  edge: number,
  /**
   * Clearance to keep above the slab for its own `E HIDE` chip, which
   * `EnemyIntent.layout` parks on the slab's top-right corner and then clamps
   * into the frame — so a slab flush with the top edge has the chip clamped
   * down on top of its own first line. Reserving the chip's height is the only
   * way to keep the two apart from out here.
   */
  headroom = 0,
  opts: { tiered?: boolean; chip?: { w: number; h: number; gap: number } } = {},
): SlabPlacement {
  const { tiered = false, chip } = opts;
  const { w, h } = size;
  const maxLeft = layer.width - w - edge;
  const floor = edge + headroom;
  const maxTop = layer.height - h - edge;
  const wanted = Math.max(natural.top, floor);

  const lefts = new Set<number>([clamp(edge, maxLeft, natural.left)]);
  const tops = new Set<number>([clamp(floor, maxTop, wanted)]);
  for (const o of obstacles) {
    lefts.add(clamp(edge, maxLeft, o.right + DODGE_GAP));
    lefts.add(clamp(edge, maxLeft, o.left - w - DODGE_GAP));
    // Downward only; see the doc comment.
    tops.add(clamp(floor, maxTop, Math.max(wanted, o.bottom + DODGE_GAP)));
    if (chip) tops.add(clamp(floor, maxTop, Math.max(wanted, o.bottom + DODGE_GAP + chip.h + chip.gap)));
  }

  let best: SlabPlacement | null = null;
  let bestScore = Infinity;
  let bestHard = Infinity;
  let bestCover = Infinity;
  for (const left of lefts) {
    for (const top of tops) {
      if (top < wanted - 0.5) continue;
      const box = { left, top, right: left + w, bottom: top + h };
      const cap = chip ? { left: box.right - chip.w, top: top - chip.gap - chip.h, right: box.right, bottom: top - chip.gap } : null;
      let cover = 0;
      let hard = 0;
      for (const o of obstacles) {
        const a = overlapArea(box, o) + (cap ? overlapArea(cap, o) : 0);
        cover += a;
        if (!tiered || !o.soft) hard += a;
      }
      // Untiered, every obstacle is chrome, so `hard === cover` and this is the old rule.
      const score = Math.abs(left - natural.left) + VERTICAL_COST * Math.abs(top - natural.top);
      const better =
        hard !== bestHard ? hard < bestHard : cover !== bestCover ? cover < bestCover : score < bestScore;
      if (!better) continue;
      best = { left, top, free: cover === 0 };
      bestScore = score;
      bestHard = hard;
      bestCover = cover;
    }
  }
  return best ?? { left: clamp(edge, maxLeft, natural.left), top: clamp(floor, maxTop, wanted), free: false };
}

/**
 * The avoid rectangles that make one greedy pass land on `target`.
 *
 * `EnemyIntent.layout`'s dodge, for a rectangle `a` the slab intersects:
 *
 * ```
 * roomLeft  = a.left - 4;      roomRight = layer.width - a.right - 4;
 * if      (roomLeft  >= w && roomLeft >= roomRight) left = clampX(a.left - w - 4);
 * else if (roomRight >= w)                          left = clampX(a.right + 4);
 * else                                              top  = clampY(a.bottom + 4);
 * ```
 *
 * Each branch is invertible, so one rectangle per axis is enough:
 *
 * - **move right** — a rectangle hugging the left wall whose right edge is
 *   `target.left - 4`. Its `roomLeft` is negative, so the second branch fires.
 * - **move left** — a rectangle hugging the right wall whose left edge is
 *   `target.left + w + 4`. Its `roomRight` is negative and its `roomLeft` is at
 *   least `w`, so the first branch fires.
 * - **move down** — a rectangle spanning the full width whose bottom edge is
 *   `target.top - 4`. Neither side has room, so the third branch fires.
 *
 * The horizontal rectangle is emitted first and sits in the slab's *natural*
 * row band, so the pass meets it while the slab is still there; the vertical
 * one spans the whole width and so still catches the slab after it has moved
 * sideways. Returns `[]` when the slab is already where it should be, which is
 * the common case and means no dodging happens at all.
 *
 * Coordinates in and out are layer-local. The caller adds the layer's own
 * origin back before handing them to `avoid()`, which works in viewport px.
 */
export function steerRects(
  natural: { left: number; top: number },
  target: { left: number; top: number },
  size: { w: number; h: number },
  layer: { width: number; height: number },
): SlabRect[] {
  const { w, h } = size;
  const out: SlabRect[] = [];
  const dx = target.left - natural.left;
  const dy = target.top - natural.top;

  if (dx > MIN_STEER) {
    out.push({ left: -1, top: natural.top, right: target.left - DODGE_GAP, bottom: natural.top + h });
  } else if (dx < -MIN_STEER) {
    out.push({
      left: target.left + w + DODGE_GAP,
      top: natural.top,
      right: layer.width + 1,
      bottom: natural.top + h,
    });
  }
  if (dy > MIN_STEER) {
    out.push({ left: -1, top: -1, right: layer.width + 1, bottom: target.top - DODGE_GAP });
  }
  return out;
}
