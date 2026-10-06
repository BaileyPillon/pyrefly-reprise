/**
 * **A painted figure as rows** (r391-reach; both games; presentation only: no engine state, no RNG, no `three` import).
 *
 * The strike has to reach its target on the screen, and the screen shows painted shapes, not boxes: a figure's painted box is the tight box
 * of its alpha (`PaintedActor.contentQuad`), so two boxes can overlap by 150 px while their painted pixels are still apart (a raised sword
 * and a boss's foot), and a lunge that closes the boxes by a fixed margin leaves some strikes in the air and sends others far into the body.
 * What the lunge needs is where the figure's painted FRONT is, row by row. This module reads it from the painting's own alpha:
 *
 * - {@link alphaMaskOf}: the alpha of the pose on screen over its painted box, as drawn (a mirrored painting flipped), at 128 x 192, cached per
 *   texture. The slot access is the cast `fx/mix/geometry.ts` makes for its silhouette checks; a DOM canvas is the only DOM use, and a caller
 *   without one (a unit test) gets `undefined` and falls back to the box.
 * - {@link profileOf}: for each of {@link BANDS} horizontal bands of that box, how far from the box's left edge the first painted pixel is and
 *   how far the last one reaches (fractions 0..1 of the box width, NaN where the band holds nothing).
 * - {@link frontClearance}: the lateral gap between an attacker's painted front and a target's painted near side, over the screen rows the two
 *   shapes share. Negative is painted overlap.
 *
 * "Painted" is the cut the critic's chamfer measure uses (alpha 0.35), so the number the solver aims at is the number the harness reads.
 */
import type { Rect } from './StageMotionPort.ts';

/** Horizontal bands a painted box is cut into (a 320 px figure: 8 px a band). */
export const BANDS = 40;

/** Alpha at or above this is painted: the critic harness's cut (`critic/runner/lib` chamfer, `lungeprobe`), so solver and measure agree. */
export const PAINTED_ALPHA = 0.35;

/** The mask's size: the painted box resampled to this, whatever the master's resolution. */
const MASK_W = 128;
const MASK_H = 192;

/** The painting's alpha over its painted box, as drawn (left to right as on screen, top to bottom). */
export interface AlphaMask {
  readonly w: number;
  readonly h: number;
  readonly a: Uint8Array;
}

/** A figure's painted front as rows: per band, the box fraction where the first painted pixel starts and where the last one ends (NaN: nothing in the band). */
export interface Profile {
  readonly left: ArrayLike<number>;
  readonly right: ArrayLike<number>;
}

/** A figure on screen: its painted box, and its profile when the painting could be read (else the whole box counts as painted). */
export interface Shape {
  rect: Rect;
  profile?: Profile | undefined;
}

/** Rows of a figure that is all box: what a figure whose painting cannot be read is taken to be. */
export const FULL_BOX: Profile = { left: new Float32Array(BANDS).fill(0), right: new Float32Array(BANDS).fill(1) };

// ------------------------------------------------------------------ the pure part

/** Cut an alpha mask into rows. */
export function profileOf(m: AlphaMask, bands = BANDS): Profile {
  const left = new Float32Array(bands).fill(Number.NaN);
  const right = new Float32Array(bands).fill(Number.NaN);
  const cut = Math.round(PAINTED_ALPHA * 255);
  const painted = (x: number, y0: number, y1: number): boolean => {
    for (let y = y0; y < y1; y++) if (m.a[y * m.w + x]! >= cut) return true;
    return false;
  };
  for (let b = 0; b < bands; b++) {
    const y0 = Math.floor((b * m.h) / bands);
    const y1 = Math.max(y0 + 1, Math.floor(((b + 1) * m.h) / bands));
    let lo = -1;
    for (let x = 0; x < m.w && lo < 0; x++) if (painted(x, y0, y1)) lo = x;
    if (lo < 0) continue;
    let hi = lo;
    for (let x = m.w - 1; x > lo; x--) {
      if (painted(x, y0, y1)) {
        hi = x;
        break;
      }
    }
    left[b] = lo / m.w;
    right[b] = (hi + 1) / m.w;
  }
  return { left, right };
}

/** The rows two figures must share for a strike to be able to touch: a sliver of one row is a graze, not a reach (px). */
export const MIN_ROW_PX = 2;

/**
 * The lateral clearance between an attacker's painted front and a target's painted near side, measured over every pair of bands that share
 * screen rows: `gap` is the smallest of them (+ air, - painted overlap), `shared` the height of the screen span the two figures share (px), and
 * null when they share none (no lateral lunge can touch: the target is above or below the attacker's rows). `dir` +1: the attacker faces +x (its
 * front is its right side, the target's near side its left); -1: the reverse. Linear in where the attacker stands, so a search can solve it.
 */
export function frontClearance(dir: 1 | -1, a: Shape, t: Shape): { gap: number; shared: number } | null {
  const pa = a.profile ?? FULL_BOX;
  const pt = t.profile ?? FULL_BOX;
  const ah = a.rect.h / pa.left.length;
  const th = t.rect.h / pt.left.length;
  let gap = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < pa.left.length; i++) {
    const ea = dir > 0 ? pa.right[i]! : pa.left[i]!;
    if (!Number.isFinite(ea)) continue;
    const front = a.rect.x + ea * a.rect.w;
    const ay0 = a.rect.y + i * ah;
    for (let j = 0; j < pt.left.length; j++) {
      const et = dir > 0 ? pt.left[j]! : pt.right[j]!;
      if (!Number.isFinite(et)) continue;
      const ty0 = t.rect.y + j * th;
      const y0 = Math.max(ay0, ty0);
      const y1 = Math.min(ay0 + ah, ty0 + th);
      if (y1 - y0 < MIN_ROW_PX) continue;
      const near = t.rect.x + et * t.rect.w;
      const g = dir > 0 ? near - front : front - near;
      if (g < gap) gap = g;
      if (y0 < top) top = y0;
      if (y1 > bottom) bottom = y1;
    }
  }
  return Number.isFinite(gap) ? { gap, shared: bottom - top } : null;
}

/**
 * The lateral clearance between the same two fronts over every pair of bands at most `maxV` px apart vertically, the ones that share a row included (one is above the
 * other with a little air between, or they share only a sliver): the lateral gap of the nearest such pair (the first to line up as the attacker closes in), and how far apart
 * the rows are. Where the shapes share enough rows (see {@link frontClearance}) a lunge can touch; here it can only line the attacker's front up with the target's near side,
 * which is as close as a lateral lunge gets (the strike ends beside the target, not in it). Null when no pair is that near.
 */
export function nearClearance(dir: 1 | -1, a: Shape, t: Shape, maxV: number): { gap: number; v: number } | null {
  const pa = a.profile ?? FULL_BOX;
  const pt = t.profile ?? FULL_BOX;
  const ah = a.rect.h / pa.left.length;
  const th = t.rect.h / pt.left.length;
  let best: { gap: number; v: number } | null = null;
  for (let i = 0; i < pa.left.length; i++) {
    const ea = dir > 0 ? pa.right[i]! : pa.left[i]!;
    if (!Number.isFinite(ea)) continue;
    const front = a.rect.x + ea * a.rect.w;
    const ay0 = a.rect.y + i * ah;
    for (let j = 0; j < pt.left.length; j++) {
      const et = dir > 0 ? pt.left[j]! : pt.right[j]!;
      if (!Number.isFinite(et)) continue;
      const ty0 = t.rect.y + j * th;
      const ov = Math.min(ay0 + ah, ty0 + th) - Math.max(ay0, ty0);
      if (-ov > maxV) continue; // further apart vertically than the strike can make up
      const near = t.rect.x + et * t.rect.w;
      const g = dir > 0 ? near - front : front - near;
      if (!best || g < best.gap) best = { gap: g, v: Math.max(0, -ov) };
    }
  }
  return best;
}

// ------------------------------------------------------------------ the reader (a painted actor's pose)

/** What a `PaintedActor` holds that the mask needs (the cast `fx/mix/geometry.ts` `maskOf` makes), and what it hands out for a pose it is not showing (`poseShape`). */
interface ActorGuts {
  slots?: Array<{
    mesh: { scale: { x: number; y: number } };
    material: { uniforms: Record<string, { value: unknown } | undefined> };
    scale: { contentBox: { x0: number; x1: number; y0: number; y1: number }; offsetY: number };
  }>;
  active?: number;
  poseShape?(name: string): { tex: { image?: unknown }; u0: number; u1: number; v0: number; v1: number; mirrored: boolean } | null;
}
type Img = CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number };

const masks = new WeakMap<object, Map<string, AlphaMask | null>>();
const profiles = new WeakMap<AlphaMask, Profile>();
let scratch: { c: HTMLCanvasElement; g: CanvasRenderingContext2D } | null | undefined;

function canvas(): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } | null {
  if (scratch !== undefined) return scratch;
  scratch = null;
  if (typeof document === 'undefined') return scratch;
  const c = document.createElement('canvas');
  c.width = MASK_W;
  c.height = MASK_H;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (g) scratch = { c, g };
  return scratch;
}

/**
 * The alpha of a painting over the box `u0..u1` x `v0..v1` of its own uv (v up), as drawn on screen (`mirrored`: left to right flipped); `undefined` where it cannot
 * be read (no DOM, an unloaded or closed image). Cached per texture and box, so a pose read once costs nothing again.
 */
export function alphaMaskFrom(tex: { image?: unknown }, u0: number, u1: number, v0: number, v1: number, mirrored: boolean): AlphaMask | undefined {
  const img = tex.image as Img | undefined;
  if (!img) return undefined;
  const iw = img.naturalWidth || img.width || 0;
  const ih = img.naturalHeight || img.height || 0;
  if (!(iw > 0) || !(ih > 0)) return undefined;
  const key = `${u0.toFixed(4)},${u1.toFixed(4)},${v0.toFixed(4)},${v1.toFixed(4)},${mirrored ? 1 : 0}`;
  let per = masks.get(tex);
  if (!per) masks.set(tex, (per = new Map()));
  const hit = per.get(key);
  if (hit !== undefined) return hit ?? undefined;
  let out: AlphaMask | null = null;
  const cv = canvas();
  // the painted box in the image's own pixels (v is up, the image's rows go down)
  const x0 = Math.max(0, Math.min(iw, u0 * iw));
  const x1 = Math.max(0, Math.min(iw, u1 * iw));
  const y0 = Math.max(0, Math.min(ih, (1 - v1) * ih));
  const y1 = Math.max(0, Math.min(ih, (1 - v0) * ih));
  if (cv && x1 - x0 >= 1 && y1 - y0 >= 1) {
    try {
      cv.g.setTransform(1, 0, 0, 1, 0, 0);
      cv.g.clearRect(0, 0, MASK_W, MASK_H);
      if (mirrored) cv.g.setTransform(-1, 0, 0, 1, MASK_W, 0);
      cv.g.drawImage(img, x0, y0, x1 - x0, y1 - y0, 0, 0, MASK_W, MASK_H);
      const d = cv.g.getImageData(0, 0, MASK_W, MASK_H).data;
      const a = new Uint8Array(MASK_W * MASK_H);
      for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3]!;
      out = { w: MASK_W, h: MASK_H, a };
    } catch {
      out = null; // a tainted or closed image: the box stands in
    }
  }
  per.set(key, out);
  return out ?? undefined;
}

/**
 * The alpha of the pose a painted actor shows now (its active slot), or, with `pose`, of that pose as it would stand (`PaintedActor.poseShape`; the pose showing
 * now when the actor cannot say), over its painted box and as drawn; `undefined` where it cannot be read (no DOM, an unloaded image, an actor that is not a painted one).
 */
export function alphaMaskOf(actor: object, pose?: string): AlphaMask | undefined {
  const guts = actor as ActorGuts;
  const other = pose !== undefined ? guts.poseShape?.(pose) : null;
  if (other) return alphaMaskFrom(other.tex, other.u0, other.u1, other.v0, other.v1, other.mirrored);
  const slot = guts.slots?.[guts.active ?? 0];
  const tex = slot?.material.uniforms['map']?.value as { image?: unknown } | null | undefined;
  if (!slot || !tex) return undefined;
  const sx = slot.mesh.scale.x;
  const ax = Math.abs(sx) || 1;
  const sy = slot.mesh.scale.y || 1;
  const box = slot.scale.contentBox;
  return alphaMaskFrom(tex, box.x0 / ax + 0.5, box.x1 / ax + 0.5, (box.y0 - slot.scale.offsetY) / sy + 0.5, (box.y1 - slot.scale.offsetY) / sy + 0.5, sx < 0);
}

/** The rows of the pose a painted actor shows now (or of `pose`, as it would stand); `undefined` where its painting cannot be read. */
export function profileOfActor(actor: object, pose?: string): Profile | undefined {
  const m = alphaMaskOf(actor, pose);
  if (!m) return undefined;
  let p = profiles.get(m);
  if (!p) profiles.set(m, (p = profileOf(m)));
  return p;
}
