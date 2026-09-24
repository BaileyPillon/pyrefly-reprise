/**
 * Where the FFX HUD's optional advice card is allowed to land.
 *
 * ## The problem this file exists for
 *
 * `docs/ENGINE-API.md#hud-safe-area` fixes the rails the always-on chrome owns
 * — the CTB column on the right, the party-status column bottom-right, the
 * command stack bottom-left — and tells a **scene** how to place its boss
 * against them. It says nothing about the other direction: where a *panel* may
 * sit so it does not land on the **fight**, because until the advisor card and
 * the enemy-intent slab shipped there was no panel that could.
 *
 * There is no one rectangle that answers it, and that is the whole difficulty.
 * The cast stands in a different place in every encounter, measured live at
 * 1600x900 on this 640x360 grid (the run is in `docs/handoff/fix3-ffx-hud.md`):
 *
 * | chapter | party, union | enemies, union |
 * |---|---|---|
 * | 1 Seymour Flux | x 57..297, y 149..316 | x 317..514, y 13..240 |
 * | 2 Yunalesca | x 198..388, y 181..342 | x 329..499, y 63..259 |
 * | 3 Braska's Final Aeon | x 58..295, y 181..340 | x 295..495, y 61..258 |
 *
 * ## What the round-02 gate refuted, and what changed here
 *
 * The previous version of this file offered three hand-written placements — a
 * bottom-right *pocket*, a *shelf* above the party's heads, and a *narrow
 * pocket* — and tried them in that order. The adversarial pass measured what
 * that actually shipped, on the built build, at four viewports:
 *
 * | chapter | zone it took | card, painted | on the fight |
 * |---|---|---|---|
 * | 1 | `pocket-narrow`, 83 wide | x 295..400 | 44 px² of Kimahri, **773 px² of Seymour Flux** |
 * | 2 | **`null`** | x 218..403 | **7 465 / 4 125 / 1 781 px² of Tidus, Yuna, Auron** |
 * | 3 | `pocket-narrow`, 85 wide | x 294..399 | **1 626 px² of Braska's Final Aeon** |
 *
 * Three separate faults, and all three are answered by the same rewrite:
 *
 * 1. **Enemies were never obstacles.** Only `sprites` — the *party* — was. The
 *    pocket therefore ran from the party's right edge to the party-status
 *    column straight through whatever boss was standing in between. Now
 *    {@link AdvisorZoneInput.enemies} is an input and a boss bounds a box like
 *    anything else.
 * 2. **`null` was not a safe answer.** The header used to promise that the FFX
 *    HUD "takes the card down and leaves the chip" and the HUD did the
 *    opposite: it cleared the inline box and handed the card back to
 *    `MoveAdvisor`'s own unguarded anchor, which in Chapter 2 is the middle of
 *    the party. Now there are two passes — the full card, then a
 *    {@link NARROW_ADVISOR_WIDTH} one — and both are *fully clear of every
 *    obstacle*, so a declined zone means the screen is genuinely full and the
 *    caller may take the card down knowing the chip is docked somewhere real.
 * 3. **Three hand-written placements cannot see a fourth.** Chapter 1's best
 *    box is neither a pocket nor a shelf over the party: it is the open sky
 *    between the strategy guide's rail and Seymour Flux, 152 grid px of it,
 *    which no named placement looked at. {@link solveBox} searches instead: it
 *    cuts the stage at every obstacle edge and takes the best free rectangle,
 *    so a new encounter's staging is answered by arithmetic rather than by a
 *    fourth special case.
 *
 * ## The shear is paid for in the box, not argued about afterwards
 *
 * `move-advisor.css` gives the card `transform: skewX(var(--ig-skew))`, so what
 * a browser (and every harness that has measured this HUD) reports for it is
 * the **bounding box of the sheared shape** — `SKEW * height` wider than the
 * box the card was laid out in. The old file reasoned about which corner
 * reached which neighbour at which height, and got 44 grid px² of Kimahri
 * wrong. This one solves for the *painted* rectangle and then insets the card
 * inside it ({@link cardBoxInside}), so "the card's box is inside the free box"
 * and "the card's painting is inside the free box" are the same statement.
 *
 * Everything here is pure arithmetic on the 640x360 authoring grid so
 * `tests/unit/ui-ffx-hud-safe-zones.test.ts` can pin the three chapters'
 * measured numbers without a browser.
 */

/** A rectangle on the 640x360 authoring grid. */
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The authoring grid both FFX HUD stages are letterboxed from. */
export const STAGE = { width: 640, height: 360 } as const;

/** Clearance between two slabs, and between a slab and a fighter, in grid px. */
export const GAP = 6;

/**
 * The horizontal shear the advisor card is painted with: `--ig-skew`.
 *
 * Measured off `getComputedStyle().transform` on the built preview:
 * `.mad__card` is `matrix(1, 0, -0.212557, 1, 0, 0)`, while `.ig-stat-list`,
 * `.sgd__panel` and `.ffx-cmd-area` are `none` — the skew lives on the *rows*
 * of those panels, not on the panels themselves. So the card's corners really
 * do reach past their neighbours, and a solver that ignores it ships a card
 * whose bottom-left corner is 11 grid px left of the box it was given.
 */
export const SKEW = 0.212557;

/**
 * Half a party sprite's width, as a fraction of its projected height.
 *
 * The HUD's projector (`HudPort.setProjector`) answers with *points* — head,
 * chest, feet — not with the actor's quad, and widening that contract belongs
 * to the engine track, not this one (`docs/handoff/fix3-ffx-hud.md` asks for
 * it). So a sprite's horizontal extent is reconstructed from its height, which
 * the head and feet points do give exactly.
 *
 * Measured live through the debug API across the nine party sprites of
 * chapters 1-3, as a fraction of the head-to-feet span:
 *
 * | | Tidus | Yuna | third |
 * |---|---|---|---|
 * | 1 Seymour Flux | 0.386 | **0.453** | 0.371 (Kimahri) |
 * | 2 Yunalesca | 0.362 | 0.421 | 0.370 (Auron) |
 * | 3 Braska's Final Aeon | 0.371 | 0.433 | 0.375 (Auron) |
 *
 * 0.45 shipped first and was **under** the worst case: Yuna's quad in Chapter 1
 * reached 2.35 grid px past the rect claimed for her. 0.50 clears the measured
 * maximum by 10%, which is the right way to be wrong.
 */
export const SPRITE_HALF_WIDTH_RATIO = 0.5;

/**
 * How far above the projector's `head` point the painted quad actually reaches,
 * as a fraction of the head-to-feet span.
 *
 * The head anchor is on the figure's *head*; the quad carries transparent
 * margin above it for hair, a weapon over the shoulder and the aura. Measured
 * across the same nine sprites the ratio is a remarkably flat 0.1023..0.1063,
 * so 0.14 clears the worst case by a third.
 */
export const SPRITE_TOP_MARGIN_RATIO = 0.14;

/**
 * The same margin under the `feet` point, as a fraction of the span.
 *
 * Tiny — measured 0.0015..0.0020 across the nine sprites, because the quad is
 * built to stand *on* its feet — but not zero. 0.01 clears the worst case five
 * times over and costs nothing: no panel is ever placed below the party.
 */
export const SPRITE_FOOT_MARGIN_RATIO = 0.01;

/**
 * Narrowest the advisor card may be laid out at on the first pass.
 *
 * This is `MoveAdvisor.MIN_CARD_WIDTH`, repeated because the two components
 * must not disagree: `MoveAdvisor.layout` clamps its own measured band to 132
 * and `fitCard` walks its density ladder against whatever width is on the
 * element, so a zone narrower than 132 hands the card a box its own owner
 * would never have chosen.
 *
 * The round-02 gate is the reason this is a floor again rather than a target.
 * The previous file let the last-resort placement go to 80, and every FFX
 * chapter took it: a card 49 grid px narrower than the one the advisor track
 * designed, in a pocket that ran through the boss.
 */
export const MIN_ADVISOR_WIDTH = 132;

/**
 * The last width the card is still worth printing at, for the relaxed pass.
 *
 * Only reached when **no** box on the screen holds a 132-wide card clear of
 * every panel and every fighter. Measured on the built preview by rendering
 * the card at its full density at a ladder of widths — grid px of content the
 * card wants, against the 104 it is allowed:
 *
 * | width | Ch.1 / Ch.2 | Ch.3 |
 * |---|---|---|
 * | 76 | 112 | 120 |
 * | **80** | **103** | 120 |
 * | 88 | 90 | 101 |
 * | 132 | 67 | 84 |
 *
 * 80 is the last width at which the whole card still fits inside the cap with
 * nothing dropped from the density ladder. At 76 it does not. None of the
 * three shipped chapters needs this pass — the test file pins that — and it
 * exists so that a fourth encounter with a wider boss degrades to a narrow
 * card in clear ground rather than to a wide card on Tidus.
 */
export const NARROW_ADVISOR_WIDTH = 80;

/**
 * Widest the card is allowed to grow — `MoveAdvisor`'s own `MAX_CARD_WIDTH`.
 *
 * A zone is not an instruction to fill it. With the strategy guide off the
 * open band measures over 300 grid px, and a 300px-wide NEXT BEST MOVE slab is
 * a letterbox, not a card. The card is left-aligned in the band it won.
 */
export const MAX_ADVISOR_WIDTH = 226;

/**
 * The width past which a wider box stops being *better*, for {@link better}.
 *
 * Without it every tie between two roomy boxes is settled by width alone and
 * the card drifts to whichever corner of the frame happens to be emptiest.
 * Past this the card is comfortable, and the tie should be settled by staying
 * near the command stack the player is reading instead.
 */
export const COMFORTABLE_ADVISOR_WIDTH = 180;

/** Distance from the stage's bottom edge a bottom-anchored card sits at. */
export const POCKET_BOTTOM = 26;

/**
 * Tallest the card may grow, in grid px — `move-advisor.css`'s own
 * `max-height`, repeated here because a zone's `maxHeight` overrides it.
 */
export const MAX_ADVISOR_HEIGHT = 104;

/**
 * A zone shorter than this is not a zone.
 *
 * It was 22 for one round, and the card shipped cut through the middle of its
 * own move line. Measured on the built preview, the tersest rung of
 * `MoveAdvisor`'s density ladder — two named moves, their submenus and the
 * board's note, which it cannot give up anything else from — needs:
 *
 * | | 88-93 wide | 105 wide | 132+ wide |
 * |---|---|---|---|
 * | Ch.1 / Ch.2 | 38 | 31 | 31 |
 * | Ch.3 | 50 | 44 | 31 |
 *
 * 72 clears the worst of those by 44%, which is the margin a board the run did
 * not visit needs, and it is the number the advisor track asked for after
 * measuring its own card.
 */
export const MIN_ADVISOR_HEIGHT = 72;

/**
 * Room kept above the card for its own `N HIDE MOVES` chip, in grid px.
 *
 * The chip is 8 grid px tall and rides `ADVISOR_CHIP_GAP` above the card's top
 * edge, so a box measured against the *card* hands back a card whose chip is
 * already past it. At 1280x720 that chip poked 34 grid px² into the Sensor
 * card, in every state the Sensor was up.
 */
export const ADVISOR_CHIP_RESERVE = 11;

/** Room kept for the chip's own width when it is parked on its own. */
export const CHIP_WIDTH = 56;

export interface AdvisorZoneInput {
  /**
   * The command stack, with its breadcrumb — **not** the help slab.
   *
   * Those three used to be handed over as one box, which is how the round-02
   * build lost the open band above the party: `.ffx-cmd-info` is pinned 180
   * grid px up the column (`ffx-hud.css`), so the union's top edge was 131 in
   * every state and every box above the party was measured down to it. They
   * are two panels with two different jobs and they are two rects here.
   */
  cmdArea: Rect;
  /** The command window's help slab (`.ffx-cmd-info`), or `null` while it is empty. */
  cmdInfo?: Rect | null;
  /** The party-status column. Its left edge is the hard rail on the right. */
  partyStatus: Rect;
  /** The strategy guide's rail, or `null` when the player has it off. */
  guide: Rect | null;
  /** The enemy plate while it is up, or `null`. */
  sensor: Rect | null;
  /**
   * The enemy-intent slab while it is up, or `null`.
   *
   * 150 x 168 grid px at its largest, and in FFX it ships **folded** (see
   * `FFXBattleHud.mount`), so most decisions hand `null` here and the band it
   * used to own is the band the card now takes.
   */
  intent?: Rect | null;
  /** The intent slab's parked chip, which is up whenever the slab is not. */
  intentChip?: Rect | null;
  /** The CTB queue, or `null`. The right-hand rail above the party status. */
  ctb?: Rect | null;
  /** Every **party** sprite's screen rect, in grid px. Empty is allowed. */
  sprites: readonly Rect[];
  /**
   * Every **enemy** on the field, same units.
   *
   * Absent for a whole round, and that absence is refutation 2 of the round-02
   * gate: the card was printed over Seymour Flux and over Braska's Final Aeon
   * because nothing in this file had ever been told a boss was there.
   */
  enemies?: readonly Rect[];
  /** Yojimbo's Zanmato gauge panel and its banner while up (FFX, Chapter IX only; `ZanmatoGauge.ts`). */
  enemyGauge?: readonly Rect[];
}

/** Where the advisor card's box goes. `bottom` is distance from the stage's bottom edge. */
export interface AdvisorZone {
  left: number;
  width: number;
  bottom: number;
  /**
   * Tallest the card may grow before it would reach whatever is above it.
   *
   * Never less than {@link MIN_ADVISOR_HEIGHT}: a box that cannot offer that
   * much is not returned at all.
   */
  maxHeight: number;
  /**
   * Which kind of ground the box turned out to be, for the handoff table, the
   * `data-zone` attribute and the tests. It is *described* from the solved box
   * rather than chosen first — that is the whole change from the round-02
   * build, where the name came first and the geometry was bent to reach it.
   */
  kind: 'shelf' | 'pocket' | 'open' | 'compact';
}

/**
 * The band the advisor card should occupy, or `null` when it must be declined.
 *
 * Two passes: the card at the width its own owner designed it for, then — only
 * if the frame genuinely holds no such box — the narrow one. Both are fully
 * clear of every panel and every fighter; the second is not a *worse* place,
 * it is a smaller card in an equally clear one.
 */
export function advisorZone(input: AdvisorZoneInput): AdvisorZone | null {
  const obstacles = obstaclesOf(input);
  const full = solveCard(obstacles, input, MIN_ADVISOR_WIDTH);
  if (full) return full;
  const narrow = solveCard(obstacles, input, NARROW_ADVISOR_WIDTH);
  return narrow ? { ...narrow, kind: 'compact' } : null;
}

/**
 * Where the `N BEST MOVE` chip parks when {@link advisorZone} declines.
 *
 * A declined card is not a missing panel — the chip stays, and it is the whole
 * advisor for that decision. It must therefore still land somewhere clear of
 * the fight, which the stylesheet's own anchor (`left: 196px`) is not: in
 * chapters 1 and 3 that is Tidus's chest.
 *
 * The chip is ~56 x 8 grid px, so it fits in bands no card could use.
 */
export function advisorChipDock(input: AdvisorZoneInput): { left: number; bottom: number } | null {
  const box = solveBox(obstaclesOf(input), {
    minWidth: CHIP_WIDTH,
    minHeight: ADVISOR_CHIP_RESERVE,
    anchor: anchorOf(input),
  });
  if (!box) return null;
  return { left: box.left, bottom: STAGE.height - box.bottom };
}

// ----------------------------------------------------------------- the solve

/** Every rectangle a panel may not be drawn over, in one list. */
function obstaclesOf(input: AdvisorZoneInput): Rect[] {
  const out: Rect[] = [];
  for (const r of [
    input.cmdArea,
    input.cmdInfo ?? null,
    input.partyStatus,
    input.guide,
    input.sensor,
    input.intent ?? null,
    input.intentChip ?? null,
    input.ctb ?? null,
    ...input.sprites,
    ...(input.enemies ?? []),
    ...(input.enemyGauge ?? []),
  ]) {
    if (r && r.right > r.left && r.bottom > r.top) out.push(r);
  }
  return out;
}

/**
 * The point a tie is settled by distance from: the command stack's top-right
 * corner, which is where the player's eye already is.
 */
function anchorOf(input: AdvisorZoneInput): { x: number; y: number } {
  return { x: input.cmdArea.right, y: input.cmdArea.top };
}

/**
 * Fit the card into the best free box, or `null`.
 *
 * The one piece of arithmetic worth reading twice is the height/width trade.
 * The card's painted width is `width + SKEW * height`, so in a box that is
 * nearly wide enough the two are in competition and a *shorter* card is a
 * *wider* one. Chapter 1's open band is 152.4 grid px: at the full 104 of
 * height the card can only be 130.3 wide — under {@link MIN_ADVISOR_WIDTH},
 * so the round-02 build declined and fell back to an 83px pocket on the boss —
 * and at 90.4 it is 133.2, which is the card the advisor track designed. So
 * the height is capped by the box *and* by `(boxWidth - minWidth) / SKEW`.
 */
function solveCard(obstacles: readonly Rect[], input: AdvisorZoneInput, minWidth: number): AdvisorZone | null {
  const box = solveBox(obstacles, {
    minWidth: minWidth + SKEW * MIN_ADVISOR_HEIGHT,
    minHeight: MIN_ADVISOR_HEIGHT + ADVISOR_CHIP_RESERVE,
    anchor: anchorOf(input),
    minWidthAt: (boxWidth) => {
      // A box only counts if some height in [MIN, MAX] leaves `minWidth` after
      // the shear. `height >= MIN_ADVISOR_HEIGHT` is the binding case.
      return boxWidth - SKEW * MIN_ADVISOR_HEIGHT >= minWidth;
    },
  });
  if (!box) return null;
  const boxWidth = box.right - box.left;
  const height = Math.min(
    MAX_ADVISOR_HEIGHT,
    box.bottom - box.top - ADVISOR_CHIP_RESERVE,
    (boxWidth - minWidth) / SKEW,
  );
  if (height < MIN_ADVISOR_HEIGHT) return null;
  const card = cardBoxInside(box, height);
  if (card.width < minWidth) return null;
  return {
    left: card.left,
    width: Math.min(card.width, MAX_ADVISOR_WIDTH),
    bottom: STAGE.height - box.bottom,
    maxHeight: height,
    kind: describe(box, input),
  };
}

/**
 * The card's **layout** box inside a free box, once its shear is paid for.
 *
 * `skewX` slides the row at `y` by `SKEW * (centre - y)`, so the painted shape
 * reaches `SKEW * height / 2` right of the layout box at the top and the same
 * distance left of it at the bottom. Insetting by that on both sides is what
 * makes the painting fit the box it was solved for — at *any* height the
 * density ladder settles on, because a shorter card shears less and its
 * painting is strictly inside a taller one's.
 */
export function cardBoxInside(box: Rect, height: number): { left: number; width: number } {
  const reach = (SKEW * height) / 2;
  return { left: box.left + reach, width: box.right - box.left - 2 * reach };
}

/** What kind of ground a solved box turned out to be. See {@link AdvisorZone.kind}. */
function describe(box: Rect, input: AdvisorZoneInput): AdvisorZone['kind'] {
  if (box.bottom >= STAGE.height - POCKET_BOTTOM - 1) return 'pocket';
  const heads = input.sprites.map((s) => s.top);
  if (heads.length && box.bottom <= Math.min(...heads)) return 'shelf';
  return 'open';
}

interface BoxWant {
  minWidth: number;
  minHeight: number;
  anchor: { x: number; y: number };
  /** An extra predicate on a candidate's width; see {@link solveCard}. */
  minWidthAt?: (width: number) => boolean;
}

/**
 * The best free rectangle on the stage, or `null`.
 *
 * **Why a search and not a third named placement.** The three placements this
 * replaced were each a sentence about the screen — "between the rightmost
 * sprite and the party column", "above the party's heads" — and each was true
 * of the screen it was written against. Chapter 1's best box is a sentence
 * nobody wrote: *between the strategy guide's rail and Seymour Flux, above the
 * command window's help slab*. Rather than add it and wait for the fifth
 * encounter to need a fifth, the stage is cut at every obstacle edge (plus a
 * {@link GAP}) and every resulting strip is measured.
 *
 * The cost is bounded and small: at most ~2n+2 horizontal cuts for n obstacles
 * — fourteen on a busy FFX screen — so a few hundred strips, each swept once.
 * It runs when a decision opens, not per frame (`FFXBattleHud.solveAdvisorPlacement`).
 */
export function solveBox(obstacles: readonly Rect[], want: BoxWant): Rect | null {
  const top = GAP;
  const bottom = STAGE.height - POCKET_BOTTOM;
  const left = GAP;
  const right = STAGE.width - GAP;

  const ys = new Set<number>([top, bottom]);
  for (const o of obstacles) {
    const a = o.top - GAP;
    const b = o.bottom + GAP;
    if (a > top && a < bottom) ys.add(a);
    if (b > top && b < bottom) ys.add(b);
  }
  const cuts = [...ys].sort((a, b) => a - b);

  let best: Rect | null = null;
  for (let i = 0; i < cuts.length; i++) {
    for (let j = i + 1; j < cuts.length; j++) {
      const y0 = cuts[i]!;
      const y1 = cuts[j]!;
      if (y1 - y0 < want.minHeight) continue;
      // Everything that reaches into this horizontal strip, as x-blockers.
      const blockers: Array<[number, number]> = [];
      for (const o of obstacles) {
        if (o.bottom + GAP <= y0 || o.top - GAP >= y1) continue;
        blockers.push([o.left - GAP, o.right + GAP]);
      }
      for (const [x0, x1] of freeSpans(blockers, left, right)) {
        const width = x1 - x0;
        if (width < want.minWidth) continue;
        if (want.minWidthAt && !want.minWidthAt(width)) continue;
        best = better(best, { left: x0, top: y0, right: x1, bottom: y1 }, want);
      }
    }
  }
  return best;
}

/** The maximal clear x-intervals of `left..right` once `blockers` are removed. */
function freeSpans(blockers: Array<[number, number]>, left: number, right: number): Array<[number, number]> {
  const sorted = [...blockers].sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [];
  let x = left;
  for (const [a, b] of sorted) {
    if (a > x) out.push([x, Math.min(a, right)]);
    x = Math.max(x, b);
    if (x >= right) break;
  }
  if (x < right) out.push([x, right]);
  return out.filter(([a, b]) => b > a);
}

/**
 * Which of two free boxes the card is better off in.
 *
 * Height first — the card gives up whole sentences to fit a short box and only
 * chips and wrapping to fit a narrow one — then width, then *nearness to the
 * command stack*. Both of the first two are compared **capped**, so a box with
 * 200 px of room does not beat one with the 115 the card can actually use, and
 * a 300 px-wide letterbox does not beat a comfortable card beside the menu.
 * Without the cap the tie-break never ran and the card drifted to whichever
 * corner of the frame was emptiest.
 */
function better(a: Rect | null, b: Rect, want: BoxWant): Rect {
  if (!a) return b;
  const cap = MAX_ADVISOR_HEIGHT + ADVISOR_CHIP_RESERVE;
  const ha = Math.min(a.bottom - a.top, cap);
  const hb = Math.min(b.bottom - b.top, cap);
  if (Math.abs(ha - hb) > 0.01) return hb > ha ? b : a;
  const wa = Math.min(a.right - a.left, COMFORTABLE_ADVISOR_WIDTH);
  const wb = Math.min(b.right - b.left, COMFORTABLE_ADVISOR_WIDTH);
  if (Math.abs(wa - wb) > 0.01) return wb > wa ? b : a;
  return distance(b, want.anchor) < distance(a, want.anchor) ? b : a;
}

/** How far a box's nearest point is from the anchor. Ties are broken left-then-up. */
function distance(r: Rect, p: { x: number; y: number }): number {
  const dx = Math.max(r.left - p.x, 0, p.x - r.right);
  const dy = Math.max(r.top - p.y, 0, p.y - r.bottom);
  return Math.hypot(dx, dy);
}
