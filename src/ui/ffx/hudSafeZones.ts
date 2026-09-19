/**
 * Where the FFX HUD's two *optional* slabs are allowed to land.
 *
 * ## The problem this file exists for
 *
 * `docs/ENGINE-API.md#hud-safe-area` fixes the rails the always-on chrome owns
 * — the CTB column on the right, the party-status column bottom-right, the
 * command stack bottom-left — and tells a **scene** how to place its boss
 * against them. It says nothing about the other direction: where a *panel* may
 * sit so it does not land on the **party**, because until the advisor card and
 * the enemy-intent slab shipped there was no panel that could.
 *
 * There is no one rectangle that answers it, and that is the whole difficulty.
 * The party stands in a different place in every encounter, measured live at
 * 1600x900 on this 640x360 grid (`docs/handoff/fix3-ffx-hud.md` has the run):
 *
 * | chapter | party sprites, union |
 * |---|---|
 * | 1 Seymour Flux | x 65..286, y 152..314 |
 * | 2 Yunalesca | x 207..374, y 185..341 |
 * | 3 Braska's Final Aeon | x 68..285, y 185..339 |
 *
 * Their union is x 65..374, y 152..341 — and the band between the command
 * stack and the party-status column, which is where the advisor card shipped,
 * is x 211..403. There is no fixed sub-rectangle of that band outside the
 * union, which is exactly why Bailey's Chapter 1 capture has the NEXT BEST MOVE
 * card printed across Tidus and Kimahri. A **fixed** zone cannot be right; a
 * zone measured against the party each frame can.
 *
 * ## The three placements
 *
 * {@link advisorZone} tries them in order and takes the first that fits. Each
 * one is searched rather than simply measured — see {@link subBands}: a panel
 * hanging into a band is usually cheaper to stand *beside* than to duck under,
 * and which of the two is true changes with the viewport, because the
 * enemy-intent slab is pinned to the boss through the render camera rather than
 * to this grid.
 *
 * 1. **The pocket** — bottom-anchored, between the rightmost party sprite and
 *    the party-status column, at the card's full width.
 * 2. **The shelf** — above the party's heads, between the strategy guide's rail
 *    and the boss column, dropped below whichever of the Sensor card, the
 *    enemy-intent slab and the CTB queue shares its column, and below the
 *    command stack's top edge when a submenu has raised it into the same band.
 *    Chapters 2 and 3 take this.
 * 3. **The narrow pocket** — the same pocket at {@link NARROW_ADVISOR_WIDTH}
 *    rather than {@link MIN_ADVISOR_WIDTH}, the last resort before declining.
 *    **Chapter 1 takes this**: with the Sensor card up its shelf is 24 grid px
 *    tall, and the 85 grid px of clear ground beside Kimahri is the only box on
 *    that screen the whole card fits in (measured: the full card is 103 px at
 *    85 wide, against 104 of room).
 *
 * ## It is a box the card fits in, or it is nothing
 *
 * If none of the three fits the caller is handed `null` and **declines**: the
 * FFX HUD takes the card down and leaves the chip, which is a complete state.
 * The rule this file exists to keep is that a zone's `maxHeight` is never
 * smaller than the card's own minimum — see {@link MIN_ADVISOR_HEIGHT}, which
 * was 22 and shipped a card cut through the middle of its own move line.
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
 * `move-advisor.css` gives the card `transform: skewX(var(--ig-skew))`, which
 * computes to `matrix(1, 0, -0.212557, 1, 0, 0)`: every row is slid left by
 * `SKEW * (y - the card's vertical centre)`. So the card's **top-right** corner
 * is `SKEW * height / 2` right of the box this file solves for, and its
 * bottom-left corner is the same distance left of it — 11 grid px each way at
 * the card's full height.
 *
 * The previous round's live matrix reasoned that this could be ignored, because
 * "every slab shares one skew, so parallel edges stay parallel and two slabs
 * that do not overlap as laid out cannot overlap as painted". **The premise is
 * false.** Measured off `getComputedStyle().transform` on the built preview:
 *
 * | element | transform |
 * |---|---|
 * | `.mad__card` | `matrix(1, 0, -0.212557, 1, 0, 0)` |
 * | `.ffx-sensor` | `matrix(1, 0, -0.212557, 1, 0, 0)` |
 * | `.ig-stat-list` | **`none`** |
 * | `.sgd__panel` | **`none`** |
 * | `.ffx-cmd-area` | **`none`** |
 * | `.eint__panel` | `matrix(2, 0, 0, 2, 0, 0)` — a scale, not a skew |
 *
 * The skew lives on the *rows* of those panels, not on the panels themselves.
 * So the card's corners really do reach past their neighbours, and they did:
 * Chapter 1's card put its top-right corner 0.8 grid px inside the party-status
 * column, and Chapter 2's card put its bottom-left corner 0.5 inside the
 * strategy guide. See {@link shearedRails}.
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
 * chapters 1-3 (the run is in `docs/handoff/fix3-ffx-hud.md`), as a fraction of
 * the head-to-feet span:
 *
 * | | Tidus | Yuna | third |
 * |---|---|---|---|
 * | 1 Seymour Flux | 0.386 | **0.453** | 0.371 (Kimahri) |
 * | 2 Yunalesca | 0.362 | 0.421 | 0.370 (Auron) |
 * | 3 Braska's Final Aeon | 0.371 | 0.433 | 0.375 (Auron) |
 *
 * 0.45 shipped first and was **under** the worst case: Yuna's quad in Chapter 1
 * reached 2.35 grid px past the rect claimed for her, which is a fighter the
 * "no panel on a fighter" assertion could not see. 0.50 clears the measured
 * maximum by 10%. The price is that the advisor is placed a few px further from
 * the party than it strictly needs to be, which is the right way to be wrong.
 *
 * The head anchor's x sits within 0.017 of the span of the quad's own centre in
 * all nine cases, so centring the reconstruction on it is sound.
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
 *
 * Without it the shelf cleared the wrong line: the card's bottom edge sat
 * `GAP` above the head *point* and therefore ~4 grid px **inside** the top of
 * the painting. That is the `SPRITE advisor x sprite:auron` row the live matrix
 * reported in 35 of its states.
 */
export const SPRITE_TOP_MARGIN_RATIO = 0.14;

/**
 * The same margin under the `feet` point, as a fraction of the span.
 *
 * Tiny — measured 0.0015..0.0020 across the nine sprites, because the quad is
 * built to stand *on* its feet — but not zero, and a rect that stops half a
 * pixel above the bottom of the painting is not a rect that covers it. 0.01
 * clears the worst case five times over and costs nothing: no panel is ever
 * placed below the party.
 */
export const SPRITE_FOOT_MARGIN_RATIO = 0.01;

/**
 * Narrowest the advisor card may be squeezed in FFX.
 *
 * This was 96 for one round, against `MoveAdvisor.MIN_CARD_WIDTH`'s 132, to
 * keep the card in the bottom pocket in chapters 1 and 3 where the pocket
 * measured 99..101. That measurement was made with the sprite rect 0.05 of a
 * span too narrow on each side (see {@link SPRITE_HALF_WIDTH_RATIO}); against
 * the party's real width the pocket is 93.5 and 94.2, so it does not fit a card
 * at **any** width worth reading, and all three chapters take the shelf — which
 * is 180 grid px wide with the guide up and 303 without it.
 *
 * So the floor goes back to the advisor's own 132 and the two components stop
 * disagreeing. The pocket arithmetic stays: it is the better placement when an
 * encounter's party leaves room for it, and a later one may.
 */
export const MIN_ADVISOR_WIDTH = 132;

/**
 * The last width the card is still worth printing at, for the narrow pocket.
 *
 * {@link MIN_ADVISOR_WIDTH} is the width the card was *designed* at and the
 * width the two wide placements are held to. This is the floor under the one
 * placement that exists because the alternative is no card at all.
 *
 * Measured on the built preview, first turn, by rendering the card at its full
 * density at a ladder of widths — grid px of content the card **wants**,
 * against the 104 it is allowed:
 *
 * | width | Ch.1 / Ch.2 | Ch.3 |
 * |---|---|---|
 * | 72 | 119 | 127 |
 * | 76 | 112 | 120 |
 * | **80** | **103** | 120 |
 * | 88 | 90 | 101 |
 * | 132 | 67 | 84 |
 * | 180+ | 57 | 57 |
 *
 * 80 is the last width at which the **whole** card — move, submenu, MP cost,
 * hit chance, effect chips and the plain-wording sentence — still fits inside
 * the cap with nothing dropped from the density ladder. At 76 it does not.
 *
 * Chapter 1's pocket is 92.9 grid px of clear ground, 84.9 of it usable once
 * the card's own shear is reserved ({@link shearedRails}), so it clears this by
 * 6%. The margin is deliberately thin on purpose rather than by accident: every
 * grid px of it was bought by measuring, and the number to move if a chapter
 * ever needs more is `POCKET_BOTTOM` or the party's slots, not this.
 */
export const NARROW_ADVISOR_WIDTH = 80;

/**
 * Widest the card is allowed to grow — `MoveAdvisor`'s own `MAX_CARD_WIDTH`.
 *
 * A zone is not an instruction to fill it. With the strategy guide off the
 * shelf measures 304 grid px, and a 304px-wide NEXT BEST MOVE slab is a
 * letterbox, not a card. The card is left-aligned in the band it won.
 */
export const MAX_ADVISOR_WIDTH = 226;

/**
 * Rightmost the shelf may reach.
 *
 * The FFX bosses' left edges measure 310 (Braska's Final Aeon), 316
 * (Mortiorchis), 340 (Seymour Flux) and 348 (Yunalesca), so 340 keeps the card
 * off three of the four outright and clips the fourth only where the
 * enemy-intent slab already sits. It is a courtesy rail, not a safety one: the
 * assertion this file is written against is about the *party*.
 */
export const SHELF_RIGHT = 340;

/** Distance from the stage's bottom edge the pocket's card sits at. */
export const POCKET_BOTTOM = 26;

/**
 * Tallest the card may grow, in grid px — `move-advisor.css`'s own
 * `max-height`, repeated here because a zone's `maxHeight` overrides it and a
 * zone with 226px of room would otherwise let the card grow past the size it
 * was designed at. A zone offering *less* than this still wins: that is the
 * whole point of measuring it.
 */
export const MAX_ADVISOR_HEIGHT = 104;

/**
 * A zone shorter than this is not a zone.
 *
 * **This constant is the defect.** It was 22, and the comment that defended it
 * argued that "a short card is a usable card — it is the head plus a row". Head
 * plus one row is not 22 grid px; **measured on the built preview it is 31**,
 * and the card scrolls with no scrollbar and a mask fade, so every zone solving
 * between 22 and 31 shipped a card cut through the middle of its own move line
 * with no way for a player holding a controller to see the rest. Chapter 1 with
 * the Sensor card up solves to **24.2**, which is the exact case that comment
 * named as its reason. Bailey's report: the recommendation is unreadable.
 *
 * So the floor is now what the card actually needs, measured rather than
 * reasoned, at the tersest rung of `MoveAdvisor`'s density ladder — the rung
 * that prints two named moves, their submenus and the board's note and cannot
 * give up anything else:
 *
 * | | 88-93 wide | 105 wide | 132+ wide |
 * |---|---|---|---|
 * | Ch.1 / Ch.2 | 38 | 31 | 31 |
 * | Ch.3 | 50 | 44 | 31 |
 *
 * 72 clears the worst of those by 44%, which is the margin a board the run did
 * not visit needs — the tersest card still carries a *note*, and a long one
 * (the round-1 revive board measured 47) is a line or two more. It is also the
 * number the advisor track asked for after measuring its own card.
 *
 * Nothing in the three shipped chapters pays for the higher floor: every
 * placement that survives to the caller offers the full 104.
 */
export const MIN_ADVISOR_HEIGHT = 72;

/**
 * Room kept above the card for its own `N HIDE MOVES` chip, in grid px.
 *
 * The chip is 8 grid px tall and rides `ADVISOR_CHIP_GAP` above the card's top
 * edge, so a zone that measures its ceiling against the *card* hands back a
 * card whose chip is already past it. At 1280x720 the shelf's chip poked 34
 * grid px² into the Sensor card, in every state the Sensor was up.
 */
export const ADVISOR_CHIP_RESERVE = 11;

export interface AdvisorZoneInput {
  /** The command stack and its help card, as one box. */
  cmdArea: Rect;
  /** The party-status column. Its left edge is the hard rail on the right. */
  partyStatus: Rect;
  /** The strategy guide's rail, or `null` when the player has it off. */
  guide: Rect | null;
  /** The Sensor card while it is up, or `null`. */
  sensor: Rect | null;
  /**
   * The enemy-intent slab while it is up, or `null`.
   *
   * It was missing from this input for a whole round, and it is the second
   * largest panel on an FFX screen: 150 x 168 grid px, hung over the boss from
   * y 4. Chapter 1's shelf cleared its left edge by **1.6 grid px** by luck,
   * and the pocket runs straight up into it.
   */
  intent?: Rect | null;
  /** The CTB queue, or `null`. The right-hand rail above the party status. */
  ctb?: Rect | null;
  /** Every **party** sprite's screen rect, in grid px. Empty is allowed. */
  sprites: readonly Rect[];
}

/** Where the advisor card's box goes. `bottom` is distance from the stage's bottom edge. */
export interface AdvisorZone {
  left: number;
  width: number;
  bottom: number;
  /**
   * Tallest the card may grow before it would reach whatever is above it.
   *
   * Never less than {@link MIN_ADVISOR_HEIGHT}: a zone that cannot offer that
   * much is not returned at all.
   */
  maxHeight: number;
  /** Which of the three placements this is, for the handoff table and the tests. */
  kind: 'pocket' | 'shelf' | 'pocket-narrow';
}

/**
 * The band the advisor card should occupy, or `null` when it must be declined.
 *
 * See the file header for the three placements. All of them are computed from
 * live measurements: nothing here is a constant that a new encounter's party
 * slots could invalidate.
 */
export function advisorZone(input: AdvisorZoneInput): AdvisorZone | null {
  return (
    pocket(input, MIN_ADVISOR_WIDTH, 'pocket') ??
    shelf(input) ??
    pocket(input, NARROW_ADVISOR_WIDTH, 'pocket-narrow')
  );
}

/**
 * Where the `N BEST MOVE` chip parks when {@link advisorZone} declines.
 *
 * A declined card is not a missing panel — the chip stays, and it is the whole
 * advisor for that decision. It must therefore still land somewhere clear of
 * the party, which the stylesheet's own anchor (`left: 196px`) is not.
 *
 * The chip is ~56 x 8 grid px, so it fits in bands no card could use: the
 * 24 px shelf Chapter 1 solves to holds it with room to spare.
 */
export function advisorChipDock(input: AdvisorZoneInput): { left: number; bottom: number } | null {
  const band = shelfBand(input);
  if (band && band.right - band.left >= CHIP_WIDTH && band.bottomY - band.ceilingY >= ADVISOR_CHIP_RESERVE) {
    return { left: band.left, bottom: STAGE.height - band.bottomY };
  }
  const p = pocketBand(input);
  if (p && p.right - p.left >= CHIP_WIDTH && STAGE.height - POCKET_BOTTOM - p.ceilingY >= ADVISOR_CHIP_RESERVE) {
    return { left: p.left, bottom: POCKET_BOTTOM };
  }
  return null;
}

/** Room kept for the chip's own width when it is parked on its own. */
const CHIP_WIDTH = 56;

// --------------------------------------------------------------- placements

/** The pocket's x span and the lowest ceiling anything in it hangs at. */
function pocketBand(input: AdvisorZoneInput): { left: number; right: number; ceilingY: number } | null {
  const railRight = input.partyStatus.left - GAP;
  const spritesRight = input.sprites.reduce((m, r) => Math.max(m, r.right), -Infinity);
  const left = Math.max(input.cmdArea.right, spritesRight) + GAP;
  if (!Number.isFinite(left) || railRight - left <= 0) return null;
  // A sprite sharing the pocket's column stands *above* a bottom-anchored card,
  // so it is a ceiling here. It cannot happen while `left` is derived from
  // `spritesRight`, but it is cheap to keep honest for a narrower left edge.
  return { left, right: railRight, ceilingY: ceilingOver(input, left, railRight, input.sprites) };
}

function pocket(input: AdvisorZoneInput, minWidth: number, kind: AdvisorZone['kind']): AdvisorZone | null {
  const band = pocketBand(input);
  if (!band) return null;
  const bottomY = STAGE.height - POCKET_BOTTOM;
  let best: AdvisorZone | null = null;
  for (const [left, right] of subBands(input, band.left, band.right, minWidth)) {
    // The chip sits above the card, so it is the chip that has to clear the
    // ceiling, not the card's own top edge.
    const room = STAGE.height - POCKET_BOTTOM - ceilingOver(input, left, right, input.sprites) - ADVISOR_CHIP_RESERVE;
    if (room < MIN_ADVISOR_HEIGHT) continue;
    const maxHeight = Math.min(room, MAX_ADVISOR_HEIGHT);
    const rails = shearedRails(input, left, right, bottomY, maxHeight);
    if (rails.right - rails.left < minWidth) continue;
    best = better(best, {
      left: rails.left,
      width: Math.min(rails.right - rails.left, MAX_ADVISOR_WIDTH),
      bottom: POCKET_BOTTOM,
      maxHeight,
      kind,
    });
  }
  return best;
}

/** The shelf's outer x span, and the head line the card in it stands on. */
function shelfBand(
  input: AdvisorZoneInput,
): { left: number; right: number; bottomY: number; ceilingY: number } | null {
  const left = (input.guide ? input.guide.right : input.cmdArea.left) + GAP;
  const right = Math.min(input.partyStatus.left - GAP, SHELF_RIGHT);
  if (right - left <= 0) return null;
  const bottomY = shelfFloor(input, left, right);
  if (bottomY === null) return null;
  // No sprites in the ceiling: on the shelf the party is what the card stands
  // *on*, and passing them here would make every head its own ceiling too.
  return { left, right, bottomY, ceilingY: ceilingOver(input, left, right, []) };
}

/**
 * The card's bottom edge for a shelf spanning `left..right`.
 *
 * It clears the highest head **that stands under it** — a sprite two columns
 * away is not a floor — and the command stack, whose top edge is not a
 * constant: opening a submenu grows the stack upward (measured 204.5 at the top
 * row, 177.8 with a Skill list open) until it reaches the shelf's own band.
 * Chapter 2's card met it there in every `submenu` state the live matrix
 * captured. `null` when nothing stands under the band at all — that is open
 * ground, and the pocket is the placement for open ground.
 */
function shelfFloor(input: AdvisorZoneInput, left: number, right: number): number | null {
  let floorY = Infinity;
  for (const r of input.sprites) if (overlapsX(r, left, right)) floorY = Math.min(floorY, r.top);
  if (overlapsX(input.cmdArea, left, right)) floorY = Math.min(floorY, input.cmdArea.top);
  return Number.isFinite(floorY) ? floorY - GAP : null;
}

function shelf(input: AdvisorZoneInput): AdvisorZone | null {
  const band = shelfBand(input);
  if (!band) return null;
  let best: AdvisorZone | null = null;
  for (const [left, right] of subBands(input, band.left, band.right, MIN_ADVISOR_WIDTH)) {
    const bottomY = shelfFloor(input, left, right);
    if (bottomY === null) continue;
    const room = bottomY - ceilingOver(input, left, right, []) - ADVISOR_CHIP_RESERVE;
    if (room < MIN_ADVISOR_HEIGHT) continue;
    const maxHeight = Math.min(room, MAX_ADVISOR_HEIGHT);
    const rails = shearedRails(input, left, right, bottomY, maxHeight);
    if (rails.right - rails.left < MIN_ADVISOR_WIDTH) continue;
    best = better(best, {
      left: rails.left,
      width: Math.min(rails.right - rails.left, MAX_ADVISOR_WIDTH),
      bottom: STAGE.height - bottomY,
      maxHeight,
      kind: 'shelf',
    });
  }
  return best;
}

/**
 * Every x-band inside `left..right` worth trying, widest first.
 *
 * A panel hanging into a band is not automatically a ceiling: it is usually
 * cheaper to stand *beside* it. Chapter 2 is the case that forced this. Its
 * shelf runs to `SHELF_RIGHT` (340) and the enemy-intent slab's projected left
 * edge lands at 347.8 grid px at 1600x900 but at **339.7** at 1280x720 — the
 * slab is pinned to the boss through the render camera, not to the grid — so
 * the same board ducked the card under the slab at one viewport and not at the
 * other, leaving 23 grid px and a declined card at 1280x720 only. Stopping the
 * shelf a gap short of the slab instead costs 6 grid px of width and keeps the
 * whole 104 of height.
 *
 * The candidates are the outer band plus every band cut at an obstacle's near
 * edge, which for four possible obstacles is at most a few dozen pairs. This
 * runs once per decision, not once per frame.
 */
function subBands(
  input: AdvisorZoneInput,
  left: number,
  right: number,
  minWidth: number,
): Array<[number, number]> {
  const cuts = new Set<number>([left, right]);
  for (const r of [input.sensor, input.intent ?? null, input.ctb ?? null]) {
    if (!r || !overlapsX(r, left, right)) continue;
    if (r.left - GAP > left) cuts.add(r.left - GAP);
    if (r.right + GAP < right) cuts.add(r.right + GAP);
  }
  const xs = [...cuts].sort((a, b) => a - b);
  const out: Array<[number, number]> = [];
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      if (xs[j]! - xs[i]! >= minWidth) out.push([xs[i]!, xs[j]!]);
    }
  }
  return out.sort((a, b) => b[1] - b[0] - (a[1] - a[0]));
}

/**
 * Which of two solved boxes the card is better off in.
 *
 * Height first — the card gives up whole sentences to fit a short box and only
 * chips and wrapping to fit a narrow one — then width. `MAX_ADVISOR_HEIGHT` is
 * the ceiling on the comparison as well as on the answer, so a band with 200px
 * of room does not beat a slightly wider one with 104.
 */
function better(a: AdvisorZone | null, b: AdvisorZone): AdvisorZone {
  if (!a) return b;
  if (b.maxHeight !== a.maxHeight) return b.maxHeight > a.maxHeight ? b : a;
  return b.width > a.width ? b : a;
}

/**
 * The lowest edge anything hanging into `left..right` reaches, plus the gap.
 *
 * The Sensor card, the enemy-intent slab and the CTB queue are the three panels
 * whose column can reach down into either placement. `alsoAbove` is the party
 * for a bottom-anchored card and empty for the shelf, where the party is what
 * the card stands on rather than something hanging over it.
 */
function ceilingOver(
  input: AdvisorZoneInput,
  left: number,
  right: number,
  alsoAbove: readonly Rect[],
): number {
  let y = GAP;
  for (const r of [input.sensor, input.intent ?? null, input.ctb ?? null, ...alsoAbove]) {
    if (r && overlapsX(r, left, right)) y = Math.max(y, r.bottom + GAP);
  }
  return y;
}

/**
 * Narrow a band so the card's **painted** corners clear their neighbours too.
 *
 * The card is sheared (see {@link SKEW}) and most of what it stands beside is
 * not, so "the boxes are `GAP` apart" is not the same statement as "the shapes
 * are `GAP` apart". The card's right edge at height `y` is
 * `right + SKEW * (centre - y)`, so against a neighbour on the right the
 * binding height is the **top** of the band the two share, and against one on
 * the left it is the **bottom** of it. A neighbour the card does not reach
 * vertically costs nothing at all, which is what keeps Chapter 1's pocket:
 * Kimahri's feet stop 75 grid px above the card's bottom edge, so the corner
 * that juts furthest left juts into empty ground.
 *
 * The card's height is not known here — it is whatever the density ladder
 * settles on, anywhere from nothing to `maxHeight`. Each term is linear in that
 * height on either side of one breakpoint: the height at which the card's top
 * edge passes the neighbour's, where `yLo` stops being the card's own top and
 * becomes the neighbour's. So the worst case is at an end of the range **or at
 * that breakpoint**, and all three are tried. Chapter 1 is the case that proves
 * it matters: against the party-status column the reserve is 5.0 grid px at the
 * card's full height and 8.1 at the height where the two tops meet.
 */
function shearedRails(
  input: AdvisorZoneInput,
  left: number,
  right: number,
  bottomY: number,
  maxHeight: number,
): { left: number; right: number } {
  let l = left;
  let r = right;
  for (const o of [
    input.cmdArea,
    input.partyStatus,
    input.guide,
    input.sensor,
    input.intent ?? null,
    input.ctb ?? null,
    ...input.sprites,
  ]) {
    if (!o) continue;
    const onRight = o.left >= right;
    const onLeft = o.right <= left;
    if (!onRight && !onLeft) continue; // shares the band's column; a ceiling, not a rail
    const knee = Math.min(Math.max(bottomY - o.top, 0), maxHeight);
    for (const h of [0, knee, maxHeight]) {
      const yLo = Math.max(bottomY - h, o.top);
      const yHi = Math.min(bottomY, o.bottom);
      if (yHi <= yLo) continue; // the card never reaches this neighbour's rows
      const centre = bottomY - h / 2;
      if (onRight) r = Math.min(r, o.left - GAP - SKEW * (centre - yLo));
      else l = Math.max(l, o.right + GAP + SKEW * (yHi - centre));
    }
  }
  return { left: l, right: r };
}

function overlapsX(r: Rect, left: number, right: number): boolean {
  return r.left < right && r.right > left;
}
