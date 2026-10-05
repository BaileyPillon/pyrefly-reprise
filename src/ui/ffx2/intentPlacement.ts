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
  /**
   * A soft box that is one of the player's own party (PR-0249, FFX-2 only). Under `tiered` the slab covers the
   * boss's painting before it covers a girl: chrome first, then the party, then the rest of the soft boxes.
   */
  party?: boolean;
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

/**
 * How far a panel's box (each side), and a girl's (her head edge), is deflated while the girls rank with the chrome (`girlsFirst`): the house
 * slab skew (12 degrees) paints each chrome box less than its bounding box at the corners, by up to `height / 2 * tan(12)`, and a
 * slab a pixel or two from a command list is touching it, not covering it. Without this the grown command list's top edge (one
 * pixel under the slab's bottom at 1600x900, Chapter IV at 130 %) sent the slab onto Bahamut instead of the free band above.
 * A girl's box is deflated along its top edge (her head) for the other reason: she bobs. Paine's head box moved between 448 and
 * 449 px as the menus opened, the left spot (clear of everything but Bahamut's own painting) gained 74 px squared of her, ranked
 * as chrome, and the slab hopped 223 px to the right onto four times as much of the boss, then back when the menu closed.
 */
const GIRLS_FIRST_GRAZE = 3;

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
 * What the winning placement covers, px squared, on the three ranks {@link placeSlab} minimises in order: `hard` (the chrome, and
 * under `girlsFirst` the girls too), then `party` (the girls when they rank below the chrome), then `cover` (everything).
 */
export interface SlabScore {
  hard: number;
  party: number;
  cover: number;
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
 * first, then the least of the party (`party`, PR-0249), then the least other
 * fighter, then is nearest. Without it every square pixel
 * counted the same, so a tall slab (Trema's, 375x321 at 1600x900) that could
 * not clear both took 2,835 px² of the command stack over a larger slice of
 * Trema's own robe, and printed across ATTACK.
 *
 * **`opts.girlsFirst`** (FFX-2 at TEXT SIZE 115 / 130 %, judgment call K of critic round 21): the girls rank with the chrome, not
 * below it. The grown panels leave no free spot, so the old order (chrome first, then the party) put the slab across Yuna's
 * feet to spare the guide; a girl is never the thing to cover, so it covers an enemy's painting or a panel instead.
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
  opts: SlabOptions = {},
): SlabPlacement {
  const { left, top, free } = placeSlabScored(natural, size, obstacles, layer, edge, headroom, opts);
  return { left, top, free };
}

/** `placeSlab`'s options. */
export interface SlabOptions {
  tiered?: boolean;
  chip?: { w: number; h: number; gap: number };
  girlsFirst?: boolean;
  /**
   * Only consider spots within `dx` across and `dy` down of the natural position (clamped into the layer). The shape decision (`pickSlabWidth`) asks for the
   * narrow slab's best spot *beside its enemy*: left to itself the solver prefers a clean spot anywhere on the screen to a nearby one
   * that grazes a head, and a shape change that only buys a corner is not worth making. The natural spot itself is always inside.
   */
  near?: { dx: number; dy: number };
}

/**
 * {@link placeSlab} with the winning placement's score: what it still covers on each rank. The same search, so `left`, `top` and
 * `free` are exactly `placeSlab`'s; the score is what lets the HUD compare two slab shapes (`pickSlabWidth`).
 */
export function placeSlabScored(
  natural: { left: number; top: number },
  size: { w: number; h: number },
  obstacles: readonly SlabRect[],
  layer: { width: number; height: number },
  edge: number,
  headroom = 0,
  opts: SlabOptions = {},
): SlabPlacement & SlabScore {
  const { tiered = false, chip, girlsFirst = false, near } = opts;
  const { w, h } = size;
  const maxLeft = layer.width - w - edge;
  const floor = edge + headroom;
  const maxTop = layer.height - h - edge;
  const wanted = Math.max(natural.top, floor);

  // Where the slab would stand with nothing in its way: its natural spot, clamped into the layer. The `near` window is measured
  // from here (the raw natural top can be far above the frame: Vegnagun's tail pins it 436 px up).
  const home = { left: clamp(edge, maxLeft, natural.left), top: clamp(floor, maxTop, wanted) };
  const lefts = new Set<number>([home.left]);
  const tops = new Set<number>([home.top]);
  // PR-0249: the one place the slab may rise above its natural row is to clear a girl's head
  // (tiered mode only): the spot flush above her box, never above the chip headroom.
  const above = new Set<number>();
  for (const o of obstacles) {
    if (!tiered || !o.soft || !o.party) continue;
    const t = clamp(floor, maxTop, o.top - h - DODGE_GAP);
    if (t < wanted - 0.5) {
      tops.add(t);
      above.add(t);
    }
  }
  // r37-ui-floor, blocker 5 (FFX-2 only): the two walls (and, below, the chip's own flush column) are candidates
  // too. The other columns come from obstacle edges, so when a card's width changes (the 14 px floor at 4:3) the
  // column that least covers a girl can vanish: at 1024x768 the Shell step lost left 131 and took 177 over Rikku.
  // More columns can only improve a lexicographic minimum, so the party tier gets no worse anywhere.
  if (tiered) {
    lefts.add(edge);
    lefts.add(Math.max(edge, maxLeft));
  }
  for (const o of obstacles) {
    lefts.add(clamp(edge, maxLeft, o.right + DODGE_GAP));
    lefts.add(clamp(edge, maxLeft, o.left - w - DODGE_GAP));
    // The `E HIDE` chip rides the slab's top-right corner and is scored with it, so the slab may also stand
    // with that chip, not its body, flush against an obstacle's right edge (its body is lower, clear of it).
    if (tiered && chip) lefts.add(clamp(edge, maxLeft, o.right + DODGE_GAP - (w - chip.w)));
    // Downward only; see the doc comment.
    tops.add(clamp(floor, maxTop, Math.max(wanted, o.bottom + DODGE_GAP)));
    if (chip) tops.add(clamp(floor, maxTop, Math.max(wanted, o.bottom + DODGE_GAP + chip.h + chip.gap)));
  }

  let best: SlabPlacement | null = null;
  let bestScore = Infinity;
  let bestHard = Infinity;
  let bestParty = Infinity;
  let bestCover = Infinity;
  for (const left of lefts) {
    for (const top of tops) {
      if (top < wanted - 0.5 && !above.has(top)) continue;
      if (near && (Math.abs(left - home.left) > near.dx || Math.abs(top - home.top) > near.dy)) continue;
      const box = { left, top, right: left + w, bottom: top + h };
      const cap = chip ? { left: box.right - chip.w, top: top - chip.gap - chip.h, right: box.right, bottom: top - chip.gap } : null;
      let cover = 0;
      let hard = 0;
      let party = 0;
      for (const o of obstacles) {
        const g = girlsFirst && !o.soft ? GIRLS_FIRST_GRAZE : 0;
        // A girl is deflated along her head edge only (`GIRLS_FIRST_GRAZE`): the slab's bottom edge meets her there and she bobs there.
        const head = girlsFirst && o.soft && o.party ? GIRLS_FIRST_GRAZE : 0;
        const probe = g ? { left: o.left + g, top: o.top + g, right: o.right - g, bottom: o.bottom - g } : head ? { ...o, top: o.top + head } : o;
        const a = overlapArea(box, probe) + (cap ? overlapArea(cap, probe) : 0);
        cover += a;
        if (!tiered || !o.soft || (girlsFirst && o.party)) hard += a;
        else if (o.party) party += a;
      }
      // Untiered, every obstacle is chrome, so `hard === cover` and this is the old rule.
      const score = Math.abs(left - natural.left) + VERTICAL_COST * Math.abs(top - natural.top);
      const better =
        hard !== bestHard
          ? hard < bestHard
          : party !== bestParty
            ? party < bestParty
            : cover !== bestCover
              ? cover < bestCover
              : score < bestScore;
      if (!better) continue;
      best = { left, top, free: cover === 0 };
      bestScore = score;
      bestHard = hard;
      bestParty = party;
      bestCover = cover;
    }
  }
  if (!best) return { left: clamp(edge, maxLeft, natural.left), top: clamp(floor, maxTop, wanted), free: false, hard: 0, party: 0, cover: 0 };
  return { ...best, hard: bestHard, party: bestParty, cover: bestCover };
}

/** The slab's two shapes: its own width, or the narrow one (`.eint__panel--narrow`), which wraps its text into a narrower column. */
export type SlabWidth = 'wide' | 'narrow';

/** Two placements' `hard` and `party` areas closer than this (px squared, a few pixels of graze) are the same rank. */
const TIER_TOLERANCE = 6;

/**
 * A wide slab that covers no chrome and no girl and at most this share of its own area in painted fighters is good enough: its
 * bottom edge brushing the heads of a row of enemies (Chapter VI at 115 %, 5 percent) is what the slab does at 100 % too, and not
 * worth another shape.
 */
const GOOD_ENOUGH_SHARE = 0.08;

/** A slab's `cover` must improve by at least this share of its own area to count (a sliver is not worth changing its shape for). */
const COVER_GAIN_SHARE = 0.02;

/** And by at least this factor: the narrow slab is taller, so two placements that both sit on a frame-filling painting differ by little. */
const COVER_GAIN_FACTOR = 0.5;

/**
 * Which shape the intent slab should wear (judgment call K of critic round 21, FFX-2 at TEXT SIZE 115 / 130 % only). `wide` is the
 * slab as it is at 100 %; `narrow` wraps the same words into a column about three quarters as wide and so about a third taller. The
 * grown panels can leave no band as wide as the wide slab (Chapter VI at 130 %: 121 grid px between the enemy list and the command
 * stack, 150 wanted), and then the solver has nowhere to put it but over the fighters it is talking about; the narrow one fits the
 * band. It is not simply better, though: it is taller, and in a fight with a free spot for the wide slab (Chapter IV) it covers
 * more of the boss than the wide one does. So each shape is solved on the same board and the narrow one is worn only when it is
 * clearly the cleaner of the two:
 *
 * 1. The wide slab is good enough (no chrome, no girl, and at most `GOOD_ENOUGH_SHARE` of its area in painted fighters): wide.
 *    Always the default, whatever it wore a frame ago.
 * 2. One shape covers less chrome (`hard`) or then less of the party (`party`), beyond a few pixels of graze: that one.
 * 3. On what is left (`cover`, the painted fighters): the narrow one only when it covers at most half of what the wide one does
 *    *and* at least `COVER_GAIN_SHARE` of the slab less; and the wide one when the reverse holds.
 * 4. Otherwise the shape it already wears, so a board that hovers between two answers does not flip the slab between frames.
 *
 * Pure: the caller solves both shapes (`intentBoard.chooseSlabWidth`) and hands the scores over.
 */
export function pickSlabWidth(current: SlabWidth, wide: SlabScore, narrow: SlabScore, slabArea: number): SlabWidth {
  if (wide.hard <= TIER_TOLERANCE && wide.party <= TIER_TOLERANCE && wide.cover <= Math.max(TIER_TOLERANCE, GOOD_ENOUGH_SHARE * slabArea)) return 'wide';
  if (Math.abs(wide.hard - narrow.hard) > TIER_TOLERANCE) return narrow.hard < wide.hard ? 'narrow' : 'wide';
  if (Math.abs(wide.party - narrow.party) > TIER_TOLERANCE) return narrow.party < wide.party ? 'narrow' : 'wide';
  const gain = COVER_GAIN_SHARE * slabArea;
  if (narrow.cover <= wide.cover * COVER_GAIN_FACTOR && wide.cover - narrow.cover > gain) return 'narrow';
  if (wide.cover <= narrow.cover * COVER_GAIN_FACTOR && narrow.cover - wide.cover > gain) return 'wide';
  return current;
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
