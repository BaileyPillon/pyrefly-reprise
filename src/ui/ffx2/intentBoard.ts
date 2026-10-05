import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import {
  pickSlabWidth,
  placeSlab,
  placeSlabScored,
  steerRects,
  type SlabOptions,
  type SlabPlacement,
  type SlabRect,
  type SlabScore,
  type SlabWidth,
} from './intentPlacement.ts';

/**
 * The board the enemy-intent slab and the chain counter steer around, in
 * viewport pixels, and the slab's solved spot on it. Moved out of
 * `FFX2BattleHud.ts` unchanged (house rule: source files under 400 lines);
 * the HUD still owns every DOM element this reads. FFX-2 only: the FFX HUD
 * keeps its own twin (FFX aims with the hand, which is docked beside the
 * figure, so it has no reticle to steer around).
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

/**
 * How near its enemy the narrow slab's spot is searched, as a share of the window's width and half its height. The solver carries
 * the wide slab across the screen when that is the only clean spot; changing its shape is a smaller thing to ask for and has to buy
 * a place beside its enemy, not a corner (Chapter V at 130 %: the narrow slab found a clean spot in the bottom-left corner, 830 px
 * from Vegnagun, with its numbers wrapped, where the wide one sat over a part of the painting; Chapter VI at 2000x1012: a clean spot
 * at the far left edge beat the one above the enemies, which only grazed their heads). The same window is used to place the narrow
 * slab once it is worn, so what was chosen is what is drawn.
 */
const NARROW_NEAR_SHARE = 0.3;

const BOARD_SELECTORS = [
  '.ffx2hud__enemies',
  '.ffx2hud__party',
  '.ffx2hud__command',
  '.ffx2hud__telegraph',
  // Not `.ffx2hud__message` (PR-0143): the battle-message banner is a 2.2 s
  // transient, so it finds its own free spot and yields (`battleMessage.ts`);
  // listing it here made the slab jump 78 px each time a line showed or hid.
  '.mad__card',
  '.mad__toggle',
  '.sgd__panel',
  // The guide's MORE row sits under the panel in the same column and paints in the same place: the slab, and its `E HIDE` chip
  // above all, wore it across the row at 2000x1012 (Chapter V, TEXT SIZE 130 %, judgment call K of round 21).
  '.sgd__more',
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
  for (const box of reticleBoxes(root)) out.push(box);
  return out;
}

/**
 * FOC16-01 (release 16 focused review, Chapter XIII): the field reticle while a
 * target is being chosen, as soft rectangles. FFX-2's reticle is a six-petal
 * flower (`TargetCursor.ts`, `.ffx-target__flower`) up to 0.68 of the shorter
 * screen edge across; the slab hung over Paragon's head sat inside it, and the
 * petals printed across the move's description at 1600x900 and 2000x1012.
 *
 * Soft, like a fighter: the flower is the field's mark, not chrome, so the
 * slab moves off it whenever there is a free spot and never onto the HUD to
 * dodge it. The box is the flower's own square, centred where it is drawn: the
 * element spins (`ffx-flower-turn`), so its bounding box breathes by up to
 * 41 %, while the ring and petals stay inside the circle the square holds
 * (`FLOWER_SVG`: petal tips at 47 of a 50 radius), which does not turn.
 */
export function reticleBoxes(root: HTMLElement): IntentAvoidRect[] {
  const out: IntentAvoidRect[] = [];
  for (const el of root.querySelectorAll<HTMLElement>('.ffx-target__flower')) {
    const r = el.getBoundingClientRect();
    const side = parseFloat(el.style.width) || el.offsetWidth;
    if (!(side > 0) || r.width <= 0 || r.height <= 0) continue;
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    out.push({ left: cx - side / 2, top: cy - side / 2, right: cx + side / 2, bottom: cy + side / 2, soft: true });
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
      // A painting, not chrome: the slab ranks it below the HUD (`placeSlab`, tiered).
      soft: true,
      // PR-0249: and the girls rank above the boss's painting, so the slab covers Bahamut before it covers Rikku.
      party: c.side === 'party',
    });
  }
  return out;
}

/**
 * PR-0094 (FFX-2 only in practice: the one table is Vegnagun's, Ch V): the
 * faces and weapons on the field (`TargetingPort.keyFeatures`) as **hard**
 * obstacles. A frame-filling part's body box stays soft (the slab would have
 * nowhere to go), but under `placeSlab`'s tiered rule a soft box may be covered
 * when nothing is free, which is how the link-4 Redoubt card came to sit on the
 * head's horn ring and the link-3 Charge Core slab on the core's rim. A key
 * feature ranks with the chrome instead: the slab covers a painting's armour
 * before it covers its face or its weapon.
 */
export function keyFeatureObstacles(features: ReadonlyArray<{ x: number; y: number; w: number; h: number }>): IntentAvoidRect[] {
  return features.map((r) => ({ left: r.x, top: r.y, right: r.x + r.w, bottom: r.y + r.h }));
}

/**
 * The intent slab and its `E HIDE` chip while painted, as panels the field's
 * target plate docks clear of (`dockPlate`). FFX-2 only. At Vegnagun's link 3
 * (D-044, the Body on option C's spot) the slab's only free spot while aiming
 * is right under the Body, where the Bulwark plates hang by default; docked
 * against this, they take the side above their ring instead of printing across
 * the slab's header. The slab never steers around the field plate, so the two
 * cannot chase each other.
 */
export function slabPanels(root: HTMLElement): Array<{ x: number; y: number; w: number; h: number }> {
  const out: Array<{ x: number; y: number; w: number; h: number }> = [];
  for (const el of root.querySelectorAll<HTMLElement>('.eint__panel, .eint__toggle')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
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
  /** The `E HIDE` chip's box, if it is laid out. */
  chip: { width: number; height: number } | null;
  /** The viewport y the help band reserves down to (0 when BATTLE HELP is off). */
  bandTop: number;
  /** Rank the girls with the chrome (TEXT SIZE 115 / 130 %, judgment call K of round 21): never cover a girl to spare a panel. */
  girlsFirst?: boolean;
  /** The slab wears its narrow shape (`intentWidth.ts`): its spot is searched beside its enemy only (`NARROW_NEAR_SHARE`). */
  narrow?: boolean;
}

/**
 * Reproduce the slab's natural position, solve for a free one, and express
 * the answer as avoid rectangles (`intentPlacement.ts` has the full account).
 */
export function solveSlab(input: SlabSolveInput): IntentAvoidRect[] {
  const { layer } = input;
  const w = input.box?.width || INTENT_FALLBACK_W * input.scale;
  const h = input.box?.height || INTENT_FALLBACK_H * input.scale;
  const { natural, edge, headroom, local, opts } = slabProblem(input, w, h);
  const target = placeSlab(natural, { w, h }, local, { width: layer.width, height: layer.height }, edge, headroom, opts);
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

/** The slab's natural spot, the obstacles in layer-local px and the solver's options, for a slab of `w` x `h`. */
function slabProblem(input: SlabSolveInput, w: number, h: number, narrow = input.narrow === true) {
  const { layer, head, scale } = input;
  // The chip rides the panel's top-right corner and is clamped into the
  // frame, so a slab flush with the top edge wears its own `E HIDE` across
  // its first line. Reserve the chip's band while the panel is up.
  const chipRoom = input.panelUp ? (input.chip ? input.chip.height : 8 * scale) + scale : 0;
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
    soft: o.soft === true,
    party: o.party === true,
  }));
  // Tiered: the command stack, the party and the boss plate outrank the fighters, and the chip
  // riding the panel is placed with it (M2, 2026-09-25).
  const chip = input.panelUp ? { w: input.chip?.width || 40 * scale, h: input.chip?.height || 8 * scale, gap: scale } : undefined;
  const opts: SlabOptions = {
    tiered: true,
    ...(chip ? { chip } : {}),
    ...(input.girlsFirst ? { girlsFirst: true } : {}),
    ...(narrow ? { near: { dx: NARROW_NEAR_SHARE * layer.width, dy: 0.5 * layer.height } } : {}),
  };
  return { natural, edge, headroom, local, opts };
}

/** A slab's measured size, viewport px. */
export interface SlabSize {
  width: number;
  height: number;
}

/**
 * Which shape the intent slab should wear on this board (judgment call K of critic round 21; FFX-2 at TEXT SIZE 115 / 130 %):
 * solves the slab at its wide size and at its narrow size, from the same head and obstacles, and lets
 * `intentPlacement.pickSlabWidth` say which is the cleaner. `current` is the shape it wears now (the tie-break).
 *
 * Two things differ from the solve that places the slab. The painting of the enemy the slab hangs over (the soft box that holds
 * the head it is pinned to) is left out: covering some of it is the design (the slab does at 100 %, 37 percent of Bahamut), and
 * counting it made the taller narrow slab look worse than the wide one wherever the boss is the only fighter. And the narrow slab
 * is only looked for beside its enemy (`NARROW_NEAR_SHARE`).
 */
export function chooseSlabWidth(input: SlabSolveInput, sizes: { wide: SlabSize; narrow: SlabSize }, current: SlabWidth): SlabWidth {
  const { layer, head } = input;
  // The head the slab is pinned to is projected for the rest pose, the boxes for the live one: they differ by the sway, so "inside"
  // has some air (4 grid px). Vegnagun's tail swings its box top up and down across its own head.
  const air = 4 * input.scale;
  const own = (o: IntentAvoidRect): boolean =>
    o.soft === true && o.party !== true && head.x >= o.left - air && head.x <= o.right + air && head.y >= o.top - air && head.y <= o.bottom + air;
  const others = { ...input, obstacles: input.obstacles.filter((o) => !own(o)) };
  const score = (s: SlabSize, narrow: boolean): SlabPlacement & SlabScore => {
    const { natural, edge, headroom, local, opts } = slabProblem(others, s.width, s.height, narrow);
    return placeSlabScored(natural, { w: s.width, h: s.height }, local, { width: layer.width, height: layer.height }, edge, headroom, opts);
  };
  const sw = score(sizes.wide, false);
  const sn = score(sizes.narrow, true);
  return pickSlabWidth(current, sw, sn, sizes.wide.width * sizes.wide.height);
}
