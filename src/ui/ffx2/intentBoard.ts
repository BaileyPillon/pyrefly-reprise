import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { placeSlab, steerRects, type SlabRect } from './intentPlacement.ts';

/**
 * The board the enemy-intent slab and the chain counter steer around, in
 * viewport pixels, and the slab's solved spot on it. Moved out of
 * `FFX2BattleHud.ts` unchanged (house rule: source files under 400 lines);
 * the HUD still owns every DOM element this reads. FFX-2 only: the FFX HUD
 * keeps its own twin.
 */

/** One rectangle the intent slab must not cover. */
export type IntentAvoidRect = SlabRect;

/**
 * A fighter's body half-width as a fraction of its projected height. See
 * {@link fighterBoxes} for why this is a ratio and not a measurement.
 */
export const BODY_HALF_WIDTH = 0.28;

/**
 * `EnemyIntent.ts`'s own placement constants, mirrored so the slab's natural
 * position can be reproduced here before it is solved for. They are grid px and
 * scale with the letterbox, exactly as they do there.
 */
const INTENT_HEAD_GAP = 10;
const INTENT_EDGE_MARGIN = 4;
const INTENT_FALLBACK_W = 150;
const INTENT_FALLBACK_H = 40;

const BOARD_SELECTORS = [
  '.ffx2hud__enemies',
  '.ffx2hud__party',
  '.ffx2hud__command',
  '.ffx2hud__telegraph',
  '.mad__card',
  '.mad__toggle',
  '.sgd__panel',
  '.sgd__toggle',
  '.ffx2-chain-chip',
  // PR-0150: the target-select plates (`TargetPlates.ts`).
  '.ffx2-tplate',
  '.ffx2-aplate',
  '.ffx2-ctlhint',
  // Not `.ffx2sc`: the spherechange wheel is a modal sized to the whole
  // overlay, so listing it would make every placement "covered" and send
  // the solver hunting for a spot that does not exist. It is *meant* to be
  // over the slab, and it takes input while it is up.
] as const;

/** PR-0150: the target-select plates, which the intent slab steers around with a margin. */
const PLATE_SELECTORS: ReadonlySet<string> = new Set(['.ffx2-tplate', '.ffx2-aplate', '.ffx2-ctlhint']);

export interface BoardOptions {
  skipChainChip?: boolean;
  addIntentPanel?: boolean;
  /** The stage's letterbox scale. */
  scale: number;
  /** The slab's `E HIDE` chip height while the slab is up, in viewport px (0 otherwise). */
  chipReach: number;
}

/** Every painted HUD box under `root` the slab would rather not cover, in viewport px. */
export function boardRects(root: HTMLElement, opts: BoardOptions): IntentAvoidRect[] {
  const out: IntentAvoidRect[] = [];
  const all: readonly string[] = opts.addIntentPanel
    ? [...BOARD_SELECTORS, '.eint__panel', '.eint__toggle']
    : BOARD_SELECTORS;
  for (const selector of all) {
    if (opts.skipChainChip && selector === '.ffx2-chain-chip') continue;
    for (const el of root.querySelectorAll<HTMLElement>(selector)) {
      // Size alone: a zero-size box already means "not laid out", and it
      // covers `[hidden]` (forced to `display: none` by `tokens.css`) and a
      // hidden ancestor too. See the FFX twin.
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      // The PR-0150 plates keep a gap, and reach down by the slab's `E HIDE`
      // chip: the solver places the slab's own box, and the chip rides above
      // that box's top-right corner, so a slab parked right under a plate
      // wore its chip across the plate.
      const plate = PLATE_SELECTORS.has(selector);
      const pad = plate ? 3 * (opts.scale || 1) : 0;
      const below = plate ? pad + opts.chipReach : 0;
      out.push({ left: r.left - pad, top: r.top - pad, right: r.right + pad, bottom: r.bottom + below });
    }
  }
  return out;
}

export type ProjectFn = (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => { x: number; y: number } | null;

/**
 * Every living fighter's body box, in viewport pixels.
 *
 * There are no sprite bounds to ask for — `PaintedStage.snapshot()` reports
 * poses, not extents — so a box is the projected head-to-feet span with a
 * half-width of {@link BODY_HALF_WIDTH} of that height. That is about right
 * for the girls and deliberately narrow for a spread dragon: a box that
 * claimed Bahamut's whole wingspan would leave the slab nowhere to stand.
 */
export function fighterBoxes(state: BattleState | null, project: ProjectFn): IntentAvoidRect[] {
  if (!state) return [];
  const out: IntentAvoidRect[] = [];
  for (const id of Object.keys(state.combatants)) {
    const c = state.combatants[id];
    if (!c || c.hp <= 0) continue;
    const head = project(id, 'head');
    const feet = project(id, 'feet');
    if (!head || !feet) continue;
    const height = Math.abs(feet.y - head.y);
    if (height <= 0) continue;
    const half = height * BODY_HALF_WIDTH;
    out.push({
      left: head.x - half,
      right: head.x + half,
      top: Math.min(head.y, feet.y),
      bottom: Math.max(head.y, feet.y),
    });
  }
  return out;
}

export interface SlabSolveInput {
  obstacles: IntentAvoidRect[];
  /** The overlay's viewport rect (laid out). */
  layer: { left: number; top: number; width: number; height: number };
  /** The acting enemy's projected head, in viewport px. */
  head: { x: number; y: number };
  scale: number;
  /** The slab's own box (panel while up, else its chip), if laid out. */
  box: { width: number; height: number } | null;
  /** True while the slab's panel is up. */
  panelUp: boolean;
  /** The `E HIDE` chip's height, if it is laid out. */
  chipHeight: number | null;
  /** The viewport y the help band reserves down to (0 when BATTLE HELP is off). */
  bandTop: number;
}

/**
 * Reproduce the slab's natural position, solve for a free one, and express
 * the answer as avoid rectangles (`intentPlacement.ts` has the full account).
 */
export function solveSlab(input: SlabSolveInput): IntentAvoidRect[] {
  const { layer, head, scale } = input;
  const w = input.box?.width || INTENT_FALLBACK_W * scale;
  const h = input.box?.height || INTENT_FALLBACK_H * scale;
  // The chip rides the panel's top-right corner and is clamped into the
  // frame, so a slab flush with the top edge wears its own `E HIDE` across
  // its first line. Reserve the chip's band while the panel is up.
  const chipRoom = input.panelUp ? (input.chipHeight ?? 8 * scale) + scale : 0;
  // PR-0012: while BATTLE HELP is on, the top band owns the stage's first
  // 17.33 grid rows whenever a menu is open; the slab (and its chip) start
  // under it at all times, so opening a menu never makes the slab jump.
  const headroom = chipRoom + Math.max(0, input.bandTop - layer.top);

  const edge = INTENT_EDGE_MARGIN * scale;
  const cx = head.x - layer.left;
  const cy = head.y - layer.top;
  const natural = { left: cx - w / 2, top: cy - INTENT_HEAD_GAP * scale - h };

  const local = input.obstacles.map((o) => ({
    left: o.left - layer.left,
    top: o.top - layer.top,
    right: o.right - layer.left,
    bottom: o.bottom - layer.top,
  }));
  const target = placeSlab(natural, { w, h }, local, { width: layer.width, height: layer.height }, edge, headroom);
  const clampedNatural = {
    left: Math.max(edge, Math.min(Math.max(edge, layer.width - w - edge), natural.left)),
    top: Math.max(edge, Math.min(Math.max(edge, layer.height - h - edge), natural.top)),
  };
  return steerRects(clampedNatural, target, { w, h }, { width: layer.width, height: layer.height }).map((r) => ({
    left: r.left + layer.left,
    top: r.top + layer.top,
    right: r.right + layer.left,
    bottom: r.bottom + layer.top,
  }));
}
