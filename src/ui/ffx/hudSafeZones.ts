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
 * | 1 Seymour Flux | x 65..285, y 153..314 |
 * | 2 Yunalesca | x 205..373, y 185..340 |
 * | 3 Braska's Final Aeon | x 68..284, y 185..339 |
 *
 * Their union is x 65..373, y 153..340 — and the band between the command
 * stack and the party-status column, which is where the advisor card shipped,
 * is x 211..403. There is no fixed sub-rectangle of that band outside the
 * union, which is exactly why Bailey's Chapter 1 capture has the NEXT BEST MOVE
 * card printed across Tidus and Kimahri. A **fixed** zone cannot be right; a
 * zone measured against the party each frame can.
 *
 * ## The two zones
 *
 * {@link advisorZone} tries them in order and takes the first that fits:
 *
 * 1. **The pocket** — bottom-anchored, between the rightmost party sprite and
 *    the party-status column. It exists in chapters 1 and 3 (~100px wide once
 *    the sprite estimate's margin is paid) and is the placement nearest to
 *    where the card already was, so the card stays where a player who has
 *    played chapter 1 expects it.
 * 2. **The shelf** — above the party's heads, between the strategy guide's rail
 *    and the boss column, dropped below the Sensor card if that is up. This is
 *    what chapter 2 gets, where the party stands far enough right that the
 *    pocket collapses to ~11px.
 *
 * If neither fits the caller is handed `null` and leaves the card where the
 * advisor's own layout put it — a visible overlap is a better failure than a
 * card that vanishes off the grid.
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

/** A zone shorter than this is not a zone — the card's head alone is ~14px. */
export const MIN_ADVISOR_HEIGHT = 28;

export interface AdvisorZoneInput {
  /** The command stack and its help card, as one box. */
  cmdArea: Rect;
  /** The party-status column. Its left edge is the hard rail on the right. */
  partyStatus: Rect;
  /** The strategy guide's rail, or `null` when the player has it off. */
  guide: Rect | null;
  /** The Sensor card while it is up, or `null`. */
  sensor: Rect | null;
  /** Every **party** sprite's screen rect, in grid px. Empty is allowed. */
  sprites: readonly Rect[];
}

/** Where the advisor card's box goes. `bottom` is distance from the stage's bottom edge. */
export interface AdvisorZone {
  left: number;
  width: number;
  bottom: number;
  /** Tallest the card may grow before it would reach whatever is above it. */
  maxHeight: number;
  /** Which of the two zones this is, for the handoff table and the tests. */
  kind: 'pocket' | 'shelf';
}

/**
 * The band the advisor card should occupy, or `null` if neither zone fits.
 *
 * See the file header for why there are two. Both are computed from live
 * measurements: nothing here is a constant that a new encounter's party slots
 * could invalidate.
 */
export function advisorZone(input: AdvisorZoneInput): AdvisorZone | null {
  const railRight = input.partyStatus.left - GAP;

  // ---- 1. the pocket: bottom-anchored, right of the party, left of the rail.
  const spritesRight = input.sprites.reduce((m, r) => Math.max(m, r.right), -Infinity);
  const pocketLeft = Math.max(input.cmdArea.right, spritesRight) + GAP;
  const pocketWidth = railRight - pocketLeft;
  if (Number.isFinite(pocketLeft) && pocketWidth >= MIN_ADVISOR_WIDTH) {
    // How far up the card may grow: past the Sensor card, which is the one
    // other panel whose column reaches down into the pocket's, and past any
    // sprite that still shares the pocket's x span — which cannot happen while
    // `pocketLeft` is derived from `spritesRight`, but is cheap to keep honest
    // if a later caller hands in a narrower left edge.
    let ceilingY = GAP;
    if (input.sensor && overlapsX(input.sensor, pocketLeft, railRight)) {
      ceilingY = Math.max(ceilingY, input.sensor.bottom + GAP);
    }
    for (const r of input.sprites) {
      if (overlapsX(r, pocketLeft, railRight)) ceilingY = Math.max(ceilingY, r.bottom + GAP);
    }
    const room = STAGE.height - POCKET_BOTTOM - ceilingY;
    if (room >= MIN_ADVISOR_HEIGHT) {
      return {
        left: pocketLeft,
        width: pocketWidth,
        bottom: POCKET_BOTTOM,
        maxHeight: Math.min(room, MAX_ADVISOR_HEIGHT),
        kind: 'pocket',
      };
    }
  }

  // ---- 2. the shelf: above the party's heads, right of the guide's rail.
  const headsTop = input.sprites.reduce((m, r) => Math.min(m, r.top), Infinity);
  if (!Number.isFinite(headsTop)) return null;
  const shelfLeft = (input.guide ? input.guide.right : input.cmdArea.left) + GAP;
  const shelfRight = Math.min(railRight, SHELF_RIGHT);
  const shelfWidth = shelfRight - shelfLeft;
  if (shelfWidth < MIN_ADVISOR_WIDTH) return null;

  // The card's bottom edge clears the highest head — and the command stack,
  // whose top edge is not a constant: opening a submenu grows the stack upward
  // (measured 204.5 at the top row, 177.8 with a Skill list open) until it
  // reaches the shelf's own band. Chapter 2's card met it there in every
  // `submenu` state the live matrix captured.
  let floorY = headsTop;
  if (overlapsX(input.cmdArea, shelfLeft, shelfRight)) floorY = Math.min(floorY, input.cmdArea.top);
  const cardBottomY = floorY - GAP;
  const ceilingY = input.sensor && overlapsX(input.sensor, shelfLeft, shelfRight) ? input.sensor.bottom + GAP : GAP;
  const room = cardBottomY - ceilingY;
  if (room < MIN_ADVISOR_HEIGHT) return null;
  return {
    left: shelfLeft,
    width: shelfWidth,
    bottom: STAGE.height - cardBottomY,
    maxHeight: Math.min(room, MAX_ADVISOR_HEIGHT),
    kind: 'shelf',
  };
}

function overlapsX(r: Rect, left: number, right: number): boolean {
  return r.left < right && r.right > left;
}
