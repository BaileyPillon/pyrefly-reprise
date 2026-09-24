/**
 * Where the three target-select plates of the approved Targeting s3 tile
 * (`docs/concepts/targeting/b-ring-and-dim/s3.png`, "Targeting in FFX-2: a
 * Vegnagun part", Bailey 19 Sep 2026: "B: hand, ring and a quiet dim") go on
 * a given screen, as pure functions of the letterbox and the chrome that
 * shares their rows. PR-0150, the HUD half.
 *
 * FFX-2 only (AGENTS.md rule 14): the tile is the FFX-2 frame. The FFX frames
 * (s1, s2) draw no TARGET plate, no actor plate and no controls hint, and FFX's
 * HUD (`src/ui/ffx/`) is not touched by any of this.
 *
 * The tile draws:
 *
 * - a **TARGET plate** top centre (`TARGET  Vegnagun — Head  PART`),
 * - an **actor plate** top right (`Yuna  GUNNER`), on the same row,
 * - a **controls hint** bottom centre (`ENTER CONFIRM  ← → CHANGE TARGET  ESC BACK`).
 *
 * On this HUD's 640x360 grid the top row is the one the Active/Wait chip
 * already owns (`--x2-atbmode-top` 22 in `ffx2-hud.css`): under the PR-0012
 * help band (D-040, grid rows 0 to 17.33), above the boss strip
 * (`--x2-enemies-top` 41). The bottom row is the 26 grid rows under the move
 * advisor (`ADVISOR_BOTTOM` in `FFX2BattleHud.ts`), left of the party column.
 * Nothing here may cover the party rows, the help band or the enemy plates;
 * a plate with no free room is hidden rather than drawn over them.
 *
 * On a portrait letterbox (390x844) the grid is scaled so far down that the
 * plates' text would render under 4 px, so they move out of the stage the same
 * way the help band does (`commandHelpBand.ts`): the two top plates into the
 * bar above the stage, stacked on top of the band, and the hint into the bar
 * below it, zoomed back up to at least {@link MIN_TEXT_PX} real pixels.
 */

/** A rectangle on the 640x360 stage grid. */
export interface GridRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The grid width and height. */
export const GRID_W = 640;
export const GRID_H = 360;
/** The top row's top edge: the Active/Wait chip's own row (`--x2-atbmode-top`). */
export const ROW_TOP = 22;
/** The top plates' height, ending above the boss strip at 41. */
export const ROW_HEIGHT = 17;
/** The right margin the command stack uses (`.ffx2hud__command { right: 12px }`). */
export const RIGHT_EDGE = GRID_W - 12;
/** The left edge of the boss strip and the chip (`left: 21.33px`). */
export const LEFT_EDGE = 21.33;
/** Clearance between a plate and anything it must not touch. */
export const GAP = 4;
/** The hint's height and its distance from the bottom of the grid. */
export const HINT_HEIGHT = 12;
export const HINT_BOTTOM = 3;
/** The hint's right wall when the party column cannot be measured (`anchors.right` in the HUD). */
export const HINT_FALLBACK_WALL = 458;
/** A TARGET plate narrower than this is not a plate; it is hidden instead. */
export const MIN_TARGET_W = 70;
/** The smallest text the plates carry, in grid units (the TARGET label, the tag, the hint). */
export const SMALL_TEXT = 5;
/** The smallest real text size the plates may render at when they have room to grow. */
export const MIN_TEXT_PX = 11;
/** Two rows of plates plus the help band must fit in the bar above the stage. */
const BAR_MIN_ROOM_PX = 150;

export interface PlateRowInput {
  /** The Active/Wait chip's rect, when it is laid out. The TARGET plate starts right of it. */
  chip: GridRect | null;
  /** The command window's rect. A tall submenu reaches up into the top row. */
  command: GridRect | null;
  /** The telegraph banner's rect while it is up (top right, `.ig-banner`). */
  telegraph: GridRect | null;
  /** The bottom of the help band on the grid, or 0 when it is hidden or out of the stage. */
  bandBottom: number;
  /** The plates' natural widths, in grid units. */
  targetW: number;
  actorW: number;
  /**
   * The field cursor's name plates and group label on the grid (see
   * {@link HintInput.field}). A whole-side command's "ALL ENEMIES" label is
   * hung over the top of the formation, which can be the plates' own row
   * (verifier, PR-0150 repair 2: Darkness, Demi, Bio and Black Sky cut it in
   * half); the plates step off it, it never moves for them.
   */
  field?: readonly GridRect[];
}

export interface PlacedPlate {
  left: number;
  top: number;
  /** The width the plate is given; the name inside it ellipsizes below its natural width. */
  width: number;
}

export interface PlateRowGeometry {
  target: PlacedPlate | null;
  actor: PlacedPlate | null;
}

function overlaps(a: GridRect, b: GridRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function rectOf(p: PlacedPlate, h: number): GridRect {
  return { left: p.left, top: p.top, right: p.left + p.width, bottom: p.top + h };
}

/**
 * Solve the two top plates for one frame, on the stage grid.
 *
 * The actor plate takes the top-right corner, as in the tile. When a tall
 * submenu or the telegraph banner is there, it tries under the banner, then
 * left of the command window; with no free spot it is hidden. The TARGET plate
 * then takes whatever is left of the row between the chip and the actor plate,
 * centred on the grid as in the tile, and is hidden if that is too narrow.
 */
export function plateRow(input: PlateRowInput): PlateRowGeometry {
  const top = Math.max(ROW_TOP, input.bandBottom + GAP);
  const obstacles: GridRect[] = [];
  if (input.command) obstacles.push(input.command);
  if (input.telegraph) obstacles.push(input.telegraph);
  if (input.chip) obstacles.push(input.chip);
  const field = input.field ?? [];
  obstacles.push(...field);
  const band: GridRect = { left: 0, top: 0, right: GRID_W, bottom: input.bandBottom };
  const free = (r: GridRect): boolean =>
    r.left >= 0 && r.right <= GRID_W && r.top >= 0 && !obstacles.some((o) => overlaps(r, o)) && !(input.bandBottom > 0 && overlaps(r, band));

  const w = Math.max(0, input.actorW);
  const rights = [RIGHT_EDGE];
  if (input.command) rights.push(input.command.left - GAP);
  // Left of a field label or name plate that stands in the row (a whole-side
  // label hung where a tall submenu has already pushed the plate), right-most first.
  const rowTop: GridRect = { left: 0, top, right: GRID_W, bottom: top + ROW_HEIGHT };
  for (const f of [...field].filter((f) => overlaps(f, rowTop)).sort((a, b) => b.left - a.left)) rights.push(f.left - GAP);
  const tops = [top];
  if (input.telegraph) tops.push(input.telegraph.bottom + GAP);
  let actor: PlacedPlate | null = null;
  if (w > 0) {
    search: for (const right of rights) {
      for (const t of tops) {
        const cand = { left: right - w, top: t, width: w };
        // Below the banner is only a place to go while it stays above the boss strip's row.
        if (t + ROW_HEIGHT > GRID_H / 2) continue;
        if (free(rectOf(cand, ROW_HEIGHT))) {
          actor = cand;
          break search;
        }
      }
    }
  }

  // The TARGET plate's row, less everything that stands in it (the chip, the
  // actor plate, a tall command window, the banner, a field label): the free
  // spans between them. The plate goes centred on the grid as in the tile,
  // else to the clear spot nearest the centre at its natural width, else
  // shrinks into the widest span, else hides.
  const rowBox: GridRect = { left: 0, top, right: GRID_W, bottom: top + ROW_HEIGHT };
  const blocks: GridRect[] = [...obstacles];
  if (actor) blocks.push(rectOf(actor, ROW_HEIGHT));
  const spans = freeSpans(
    LEFT_EDGE,
    RIGHT_EDGE,
    blocks.filter((b) => overlaps(b, rowBox)),
  );
  let target: PlacedPlate | null = null;
  const want = Math.max(0, input.targetW);
  if (want > 0) {
    const centre = GRID_W / 2 - want / 2;
    const fits = spans
      .filter(([l, r]) => r - l >= want)
      .map(([l, r]) => Math.max(l, Math.min(r - want, centre)))
      .sort((a, b) => Math.abs(a - centre) - Math.abs(b - centre));
    if (fits.length) {
      target = { left: fits[0]!, top, width: want };
    } else {
      const widest = spans.reduce<[number, number] | null>((best, s) => (!best || s[1] - s[0] > best[1] - best[0] ? s : best), null);
      const room = widest ? widest[1] - widest[0] : 0;
      if (widest && room >= Math.min(MIN_TARGET_W, want)) target = { left: widest[0], top, width: room };
    }
  }
  return { target, actor };
}

/**
 * The free spans of `[from, to]` once every block's `[left - GAP, right + GAP]`
 * is taken out, left to right.
 */
function freeSpans(from: number, to: number, blocks: readonly GridRect[]): Array<[number, number]> {
  const cuts = blocks
    .map((b) => [b.left - GAP, b.right + GAP] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const spans: Array<[number, number]> = [];
  let at = from;
  for (const [l, r] of cuts) {
    if (l > at) spans.push([at, Math.min(l, to)]);
    at = Math.max(at, r);
    if (at >= to) break;
  }
  if (at < to) spans.push([at, to]);
  return spans.filter(([l, r]) => r > l);
}

export interface HintInput {
  /** The hint's natural width, in grid units. */
  width: number;
  /** The party column's leftmost row edge on the grid (the HUD's column fence), or null. */
  partyLeft: number | null;
  /**
   * The field cursor's own name plates and group label (`TargetCursor`'s
   * `.ffx-target__plate` / `.ffx-target__all`), on the grid. They dock off the
   * figure they name, so a figure standing low docks its plate on the hint's
   * row; the hint moves off them, they never move for the hint (one side
   * adapts, so the two cannot chase each other).
   */
  field?: readonly GridRect[];
}

/** The hint's row on the grid for a given left edge and width. */
function hintBox(left: number, width: number): GridRect {
  const top = GRID_H - HINT_BOTTOM - HINT_HEIGHT;
  return { left, top, right: left + width, bottom: top + HINT_HEIGHT };
}

/**
 * The controls hint, bottom centre, never under the party column and never
 * under a field name plate: centred when that is clear, else slid along its
 * row to the clear spot nearest the centre. `null` = no room.
 */
export function hintPlacement(input: HintInput): PlacedPlate | null {
  const wall = (input.partyLeft ?? HINT_FALLBACK_WALL) - GAP;
  const spanL = LEFT_EDGE;
  const room = wall - spanL;
  if (input.width <= 0 || room <= 0) return null;
  const w = Math.min(input.width, room);
  const centred = Math.max(spanL, Math.min(wall - w, GRID_W / 2 - w / 2));
  const field = input.field ?? [];
  const lefts = [centred];
  for (const f of field) lefts.push(f.right + GAP, f.left - GAP - w);
  const clear = lefts
    .filter((l) => l >= spanL - 0.01 && l + w <= wall + 0.01)
    .filter((l) => !field.some((f) => overlaps(hintBox(l, w), f)))
    .sort((a, b) => Math.abs(a - centred) - Math.abs(b - centred));
  const left = clear[0];
  if (left === undefined) return null;
  return { left, top: hintBox(left, w).top, width: w };
}

/** The hint's top edge on the grid in the bar under a portrait stage (`.ffx2-ctlhint--bar`'s `top`). */
export const BAR_HINT_TOP = GRID_H + 2;

export interface HintBarInput {
  /** The hint's height on the grid (its box times the bar zoom). */
  height: number;
  /** The grid y of the viewport's bottom edge: how far down the bar reaches. */
  viewBottom: number;
  /** The field cursor's name plates and group label, on the grid (see {@link HintInput.field}). */
  field: readonly GridRect[];
  /**
   * The drop already taken during this target select. The hint never climbs
   * back while the cursor steps (Dr. Goon's plate hangs lower than Ormi's), so
   * it settles once instead of hopping with every arrow key.
   */
  from?: number;
}

/**
 * How far the hint drops inside the bar under a portrait stage so that no
 * field name plate lands on it, in grid units; `null` when the bar runs out
 * first (the hint then hides). The bar hint spans the whole grid width, so a
 * plate docked under a figure standing near the bottom of the stage (Dr. Goon
 * and Ormi in chapter 6 at 390x844) reaches into it.
 */
export function hintBarDrop(input: HintBarInput): number | null {
  const box = (top: number): GridRect => ({ left: 0, top, right: GRID_W, bottom: top + input.height });
  let top = BAR_HINT_TOP + Math.max(0, input.from ?? 0);
  for (let pass = 0; pass <= input.field.length; pass++) {
    const hit = input.field.find((f) => overlaps(box(top), f));
    if (!hit) break;
    top = hit.bottom + GAP;
  }
  if (input.field.some((f) => overlaps(box(top), f))) return null;
  if (top + input.height > input.viewBottom) return null;
  return top - BAR_HINT_TOP;
}

/** A viewport rect expressed on the stage grid, given the grid's origin and scale. `null` when not laid out. */
export function toGrid(
  r: { left: number; top: number; right: number; bottom: number; width: number; height: number } | undefined,
  originX: number,
  originY: number,
  scale: number,
): GridRect | null {
  if (!r || r.width <= 0 || r.height <= 0) return null;
  return {
    left: (r.left - originX) / scale,
    top: (r.top - originY) / scale,
    right: (r.right - originX) / scale,
    bottom: (r.bottom - originY) / scale,
  };
}

export interface PlateModeInput {
  /** The stage's letterbox scale. */
  scale: number;
  /** The stage's top edge in viewport px: the height of the bar above it. */
  stageY: number;
}

export interface PlateMode {
  /** `stage`: on the grid; `bar`: in the letterbox bars above and below it. */
  mode: 'stage' | 'bar';
  /** The zoom applied on top of the stage scale (1 in `stage` mode). */
  zoom: number;
}

/** Whether the plates stay on the grid or move into the letterbox bars (portrait screens). */
export function plateMode(input: PlateModeInput): PlateMode {
  const scale = input.scale > 0 ? input.scale : 1;
  const real = SMALL_TEXT * scale;
  if (real < MIN_TEXT_PX && input.stageY >= BAR_MIN_ROOM_PX) {
    return { mode: 'bar', zoom: MIN_TEXT_PX / real };
  }
  return { mode: 'stage', zoom: 1 };
}
