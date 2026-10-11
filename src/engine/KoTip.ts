/**
 * THE GEOMETRY OF A TOPPLE (visual-and-feel fix FA-2 and FA-3; PR-0378; both games). Pure: no `three`, no DOM.
 *
 * Option B of the Motion Options page (P1-B): before the lying painting crosses in, the STANDING plane really travels. It is turned about its feet toward
 * the side the KO painting's head lies, up to about 80 degrees (the plan: 75 to 85), and slid along the floor so the two bodies' middles meet; the
 * revive plays the same pose backwards. `KoFall.ts` is the clock and the decision; `fx/mix/living.ts` hands a plane its {@link SlotTip} every frame;
 * `PaintedActor.placeSlot` calls {@link placeTipped} after it has placed the plane as always (so a tip survives the head lock's per-frame `sizeSlot`,
 * which places the plane again at every factor it tries).
 *
 * All lengths are world units in the actor's inner frame (x right, origin at the actor's ground point, y up). Angles are `Object3D.rotation.z`: counter-
 * clockwise positive, so a fall toward the right is a negative angle.
 *
 * What is chosen here and why (all `[ours]`, to be tuned from the capture lane, none of it sourced):
 * - **The pivot is the toe edge**, not the stance. Turning about the stance dips the feet that lead the fall under the floor (the page lifted the figure by an
 *   amount it measured from the silhouette; the engine has no mask at KO time). Turning about the front-most near-floor point of the underside hull
 *   (`PoseMeta.ground`, measured for every painting) never sinks a boot and needs no lift. No hull: the stance. No stance: the plane's middle.
 * - **The slide aligns the heads** when both paintings have a registered head (what the eye and the harness follow: a fade-weighted head that has to travel
 *   from the toppled head to the lying one is the biggest single step of a fall), else the content-box middles. The page chose its slide by silhouette
 *   overlap; this is a cruder reading of the same thing.
 * - **80 degrees**, the middle of the plan's range; the lying painting takes over from there.
 */

import type { GroundHull } from './PaintedRest.ts';

/** The fully toppled angle, radians (80 degrees). */
export const TOPPLE_RAD = (80 * Math.PI) / 180;
/** A hull point is "at the floor" within this share of the body's height: boots, hems and soles, not a hand or a sword tip. */
export const FOOT_ROW = 0.06;
/** The pivot may lead the stance by at most this share of the body's height (a hem or a long boot, not a weapon laid along the floor). */
export const TOE_REACH_MAX = 0.3;
/** The slide never exceeds this many plane heights, so a bad box can never throw a figure across the field. */
export const SLIDE_MAX = 1.2;

/** What `PaintedActor.placeSlot` is told about a plane that is tipping. */
export interface SlotTip {
  /** The screen side the body falls to: 1 right, -1 left. */
  side: 1 | -1;
  /** The angle of the fully toppled plane, radians (positive; {@link TOPPLE_RAD}). */
  full: number;
  /** How far it has tipped, 0 upright to 1 toppled: the angle is this share of the way. */
  e: number;
  /** How far it has slid toward {@link SlotTip.target}, 0 to 1 (its own clock: a fall keeps sliding while it crosses, so the feet never skate faster than the check allows). */
  slide: number;
  /** The x, in the inner frame, the toppled body slides to (the lying painting's head, or its content middle: see {@link SlotTip.by}), or null for no slide. */
  target: number | null;
  /** Which point of the toppled plane meets the target: its head (when it has a registered one; the target is then the lying painting's head) or the middle of its content. */
  by: 'head' | 'middle';
}

/** The bits of a plane mesh {@link placeTipped} writes. `PaintedRest.placePlane` has just placed it upright. */
export interface TipMesh {
  position: { x: number; y: number };
  rotation: { z: number };
  scale: { x: number };
}

interface TipScale {
  width: number;
  unitsPerPixel: number;
  anchorY: number;
  height: number;
  offsetY: number;
  contentBox: { x0: number; x1: number; y0: number; y1: number };
}

interface TipMeta {
  width: number;
  stanceX?: number;
  ground?: GroundHull;
  head?: readonly [number, number, number, number];
}

const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x);

/**
 * Which way a body falls: the side of the KO painting its head lies on (`headU` is the head box's middle, as a share of the painting's width), read
 * through the mirror the plane is drawn in; the way the figure faces (forward) when the painting has no registered head.
 */
export function tipSide(headU: number | undefined, mirror: 1 | -1, facing: 1 | -1): 1 | -1 {
  if (headU === undefined || !Number.isFinite(headU)) return facing;
  return ((headU < 0.5 ? -1 : 1) * mirror) as 1 | -1;
}

/** The head box's middle, as a share of the painting's width, or undefined. */
export function headMiddleU(head: readonly [number, number, number, number] | undefined): number | undefined {
  return head ? (head[0] + head[2]) / 2 : undefined;
}

/**
 * Where a plane turns about, x in the inner frame. `centreX` is where the plane sits now (its centre, after the registration shift): the stance is the
 * registered point the figure stands on, and the toe edge is the front-most near-floor point of the underside hull in the fall direction `side`, never
 * behind the stance and never further than {@link TOE_REACH_MAX} of the body's height ahead of it.
 */
export function tipPivotX(centreX: number, meta: TipMeta, scale: TipScale, mirror: 1 | -1, side: 1 | -1): number {
  const upp = scale.unitsPerPixel;
  const stance = meta.stanceX !== undefined ? centreX + (meta.stanceX - meta.width / 2) * upp * mirror : centreX;
  const hull = meta.ground?.hull;
  if (!hull || hull.length === 0 || !(upp > 0)) return stance;
  const bodyH = scale.contentBox.y1 > 0 ? scale.contentBox.y1 : scale.height;
  const floor = FOOT_ROW * bodyH;
  let toe = stance;
  for (const [px, py] of hull) {
    if ((scale.anchorY - py) * upp > floor) continue;
    const x = centreX + (px - meta.width / 2) * upp * mirror;
    if ((x - toe) * side > 0) toe = x;
  }
  return stance + side * Math.min(Math.abs(toe - stance), TOE_REACH_MAX * bodyH);
}

/** The x, in the inner frame, of the middle of a plane's head box (a plane at `pos`, rolled by `roll`), or undefined when it has no registered head. */
export function headCentreX(head: readonly [number, number, number, number] | undefined, scale: Pick<TipScale, 'width' | 'height'>, mirror: 1 | -1, pos: { x: number; y: number }, roll: number): number | undefined {
  if (!head) return undefined;
  const lx = mirror * ((head[0] + head[2]) / 2 - 0.5) * scale.width;
  const ly = (0.5 - (head[1] + head[3]) / 2) * scale.height;
  return pos.x + lx * Math.cos(roll) - ly * Math.sin(roll);
}

/** The x of the middle of a plane's painted content, in the inner frame, for a plane at `pos` rolled by `roll` (a lying painting is rolled to rest, `PaintedRest.ts`). */
export function contentCentreX(scale: Pick<TipScale, 'offsetY' | 'contentBox'>, mirror: 1 | -1, pos: { x: number; y: number }, roll: number): number {
  const b = scale.contentBox;
  const lx = (mirror * (b.x0 + b.x1)) / 2;
  const ly = (b.y0 + b.y1) / 2 - scale.offsetY; // the box is measured from the ground point, the plane is centred at `offsetY`
  return pos.x + lx * Math.cos(roll) - ly * Math.sin(roll);
}

/**
 * Tip a plane that has just been placed upright: turn it about its pivot by `e` of the full angle toward `side` and slide it by `slide` of the way to the
 * lying body's middle. Reads the plane's own placement (`mesh.position`, `mesh.scale.x`'s sign) and writes its position and rotation. Call straight after
 * `placePlane`: it adds to the rotation it finds.
 */
export function placeTipped(mesh: TipMesh, tip: SlotTip, meta: TipMeta, scale: TipScale): void {
  if (!(tip.e > 0) && !(tip.slide > 0)) return;
  const mirror: 1 | -1 = mesh.scale.x < 0 ? -1 : 1;
  const bx = mesh.position.x;
  const by = mesh.position.y;
  const px = tipPivotX(bx, meta, scale, mirror, tip.side);
  const turn = (a: number, x: number, y: number): { x: number; y: number } => ({
    x: px + (x - px) * Math.cos(a) - y * Math.sin(a),
    y: (x - px) * Math.sin(a) + y * Math.cos(a),
  });
  let slide = 0;
  if (tip.target !== null) {
    const b = scale.contentBox;
    const h = tip.by === 'head' ? meta.head : undefined;
    // the point of this plane that meets the target: its head, or the middle of its content
    const at = h ? { x: bx + mirror * ((h[0] + h[2]) / 2 - 0.5) * scale.width, y: by + (0.5 - (h[1] + h[3]) / 2) * scale.height } : { x: bx + (mirror * (b.x0 + b.x1)) / 2, y: (b.y0 + b.y1) / 2 };
    const met = turn(-tip.side * tip.full, at.x, at.y);
    slide = clamp(tip.target - met.x, -SLIDE_MAX * scale.height, SLIDE_MAX * scale.height) * tip.slide;
  }
  const angle = -tip.side * tip.full * tip.e;
  const at = turn(angle, bx, by);
  mesh.position.x = at.x + slide;
  mesh.position.y = at.y;
  mesh.rotation.z += angle;
}
