/**
 * Where the FFX-2 command-help band (PR-0012, D-040: option A, "a one-line
 * slab at the top of the screen") actually goes on a given screen, as a pure
 * function of the letterbox and the one piece of chrome that shares its row.
 *
 * FFX-2 only: FFX's slab (`src/ui/ffx/commandHelp.ts`, `.ffx-cmd-info`) sits
 * beside its own command window and is untouched.
 *
 * Two things the first build of the band did not account for, both measured
 * by the independent check of 3fc3a931:
 *
 * 1. **The PAUSE chip.** `BattleScreen` mounts `.battle-pause-chip` in device
 *    px at the top-left of the screen root, outside this HUD's scaled stage,
 *    so at 1280x720 and 1600x900 it drew over the band's left end. The chip
 *    is not this track's file, so the band starts to the right of it instead
 *    of under it.
 * 2. **Portrait screens.** The HUD is a 640x360 grid letterboxed into the
 *    viewport; at 390x844 that grid is scaled by 0.61 and the band's 6.33-unit
 *    text renders at under 4 px. When the letterbox leaves a bar above the
 *    stage, the band moves into that bar (`mode: 'bar'`), is zoomed back up so
 *    its text is at least {@link MIN_TEXT_PX} real pixels, and may wrap.
 *
 * The enemy-intent slab is steered clear of the band by `FFX2BattleHud`
 * (see `bandReserve`), since that slab's placement is solved there.
 */

/** The band's height on the 640x360 grid (52 px at 1920x1080). Mirrors `ffx2-hud.css`. */
export const BAND_GRID_HEIGHT = 17.33;
/** The description's font size on the grid (19 px at 1920x1080). Mirrors `ffx2-hud.css`. */
export const BAND_GRID_TEXT = 6.33;
/** The smallest real text size the band may render at when it has room to grow. */
export const MIN_TEXT_PX = 11;
/** Clearance between the PAUSE chip and the band's left end, in grid units. */
const CHIP_GAP = 4;
/** Up to three wrapped lines of 11 px text plus padding must fit in the bar. */
const BAR_MIN_ROOM_PX = 3 * MIN_TEXT_PX * 1.3 + 8;

export interface DeviceRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface BandInput {
  /** The stage's letterbox scale (`FFX2BattleHud.layout`). */
  scale: number;
  /** The stage's top-left corner, in viewport px. */
  stageX: number;
  stageY: number;
  /** `.battle-pause-chip`'s rect in viewport px, when it is laid out. */
  pauseChip?: DeviceRect | null;
}

export interface BandGeometry {
  /** `stage`: the top row of the grid; `bar`: the letterbox bar above the grid. */
  mode: 'stage' | 'bar';
  /** The band's left edge, in grid units. */
  left: number;
  /** The zoom applied on top of the stage scale (1 in `stage` mode). */
  zoom: number;
}

/** Solve the band's placement for one screen. */
export function bandGeometry(input: BandInput): BandGeometry {
  const scale = input.scale > 0 ? input.scale : 1;
  const realText = BAND_GRID_TEXT * scale;
  if (realText < MIN_TEXT_PX && input.stageY >= BAR_MIN_ROOM_PX) {
    return { mode: 'bar', left: 0, zoom: MIN_TEXT_PX / realText };
  }
  let left = 0;
  const chip = input.pauseChip;
  if (chip && chip.right > chip.left && chip.bottom > chip.top) {
    const bandTop = input.stageY;
    const bandBottom = input.stageY + BAND_GRID_HEIGHT * scale;
    if (chip.top < bandBottom && chip.bottom > bandTop) {
      left = Math.max(0, (chip.right - input.stageX) / scale + CHIP_GAP);
    }
  }
  return { mode: 'stage', left, zoom: 1 };
}

/**
 * How far down from the top of the overlay the intent slab must start so it
 * and its `E HIDE` chip stay under the band, in viewport px. Zero in `bar`
 * mode: there the band is outside the stage, and is handed to the slab's
 * solver as an ordinary obstacle instead ({@link bandBarRect}).
 */
export function bandReserve(geom: BandGeometry, input: BandInput): number {
  if (geom.mode !== 'stage') return 0;
  return input.stageY + BAND_GRID_HEIGHT * input.scale;
}

/** The band's rect in viewport px while it sits in the bar, for the slab's solver. */
export function bandBarRect(geom: BandGeometry, input: BandInput, heightPx: number): DeviceRect | null {
  if (geom.mode !== 'bar') return null;
  return {
    left: input.stageX,
    right: input.stageX + 640 * input.scale,
    top: input.stageY - heightPx,
    bottom: input.stageY,
  };
}

/** Write a geometry onto the band element (the CSS in `ffx2-hud.css` reads it). */
export function applyBandGeometry(el: HTMLElement, geom: BandGeometry): void {
  el.classList.toggle('ffx2-cmd-info--bar', geom.mode === 'bar');
  el.style.setProperty('--band-left', `${geom.left.toFixed(2)}px`);
  el.style.setProperty('--band-zoom', geom.zoom.toFixed(4));
}
