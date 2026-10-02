import { MathUtils, PerspectiveCamera, Vector3, type Object3D } from 'three';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's geometry: figures as billboards, their screen boxes, and the
 * poses the framing and the held shots use. Ported from option C's prototype (`candy-max-proto`,
 * `fx/max/c/masters.ts`, `staging.ts`), trimmed to the mix: no action cuts are built (D-318: the
 * Clair Obscur / Persona camera grammar waits for Bailey's camera-lab pick). Nothing here writes the
 * camera or a figure; every function returns numbers or a pose. Game case: both (plumbing).
 */

export interface Pose {
  pos: Vector3;
  look: Vector3;
  fov: number;
}

export interface Fig {
  /** Feet (world). */
  feet: Vector3;
  /** World height as drawn (scale included). */
  h: number;
  /** Half the drawn width (world). */
  halfW: number;
  enemy: boolean;
  id: string;
  /** The painting's own drawn quad (world), when the actor offers it: the exact screen box. */
  quad?: Vector3[];
  /** The painting's alpha over its drawn quad, for the silhouette checks (bosses). */
  mask?: Mask;
}

/** A painting's alpha, sampled over its content box: `at(fx, fy)` with fx, fy in 0..1 of the screen box (y down). */
export interface Mask {
  at(fx: number, fy: number): number;
}

const masks = new Map<string, { w: number; h: number; a: Uint8Array } | null>();

/** The alpha of a texture at low resolution (cached by uuid); null when it cannot be read. */
function alphaOf(tex: { uuid: string; image?: unknown } | null | undefined): { w: number; h: number; a: Uint8Array } | null {
  if (!tex) return null;
  const hit = masks.get(tex.uuid);
  if (hit !== undefined) return hit;
  const img = tex.image as (CanvasImageSource & { width?: number }) | undefined;
  if (!img?.width || typeof document === 'undefined') return null;
  try {
    const w = 48;
    const h = 72;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g) return null;
    g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    const a = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) a[i] = d[i * 4 + 3]!;
    const out = { w, h, a };
    masks.set(tex.uuid, out);
    return out;
  } catch {
    masks.set(tex.uuid, null);
    return null;
  }
}

type SlotGuts = { mesh: { scale: Vector3 }; material: { uniforms: Record<string, { value: unknown }> }; scale: { contentBox: { x0: number; x1: number; y0: number; y1: number }; offsetY: number } };

/** The silhouette mask of an actor's active painting over its content quad, or undefined. */
function maskOf(a: Actor): Mask | undefined {
  const g = a as unknown as { slots?: SlotGuts[]; active?: number };
  const slot = g.slots?.[g.active ?? 0];
  if (!slot) return undefined;
  const al = alphaOf(slot.material.uniforms['map']?.value as { uuid: string; image?: unknown } | null);
  if (!al) return undefined;
  const sx = slot.mesh.scale.x;
  const ax = Math.abs(sx) || 1;
  const sy = slot.mesh.scale.y || 1;
  const box = slot.scale.contentBox;
  const u0 = box.x0 / ax + 0.5;
  const u1 = box.x1 / ax + 0.5;
  const v0 = (box.y0 - slot.scale.offsetY) / sy + 0.5;
  const v1 = (box.y1 - slot.scale.offsetY) / sy + 0.5;
  const mirrored = sx < 0; // the screen's left is u1 when the plane is mirrored
  return {
    at(fx: number, fy: number): number {
      const u = mirrored ? u1 - fx * (u1 - u0) : u0 + fx * (u1 - u0);
      const v = v1 - fy * (v1 - v0);
      const x = Math.min(al.w - 1, Math.max(0, Math.floor(u * al.w)));
      const y = Math.min(al.h - 1, Math.max(0, Math.floor((1 - v) * al.h)));
      return al.a[y * al.w + x]! / 255;
    },
  };
}

export interface Box {
  l: number;
  r: number;
  t: number;
  b: number;
}

/** A painted figure as the scene walk finds it (`PaintedActor`'s public surface, read only). */
export type Actor = Object3D & {
  worldHeight: number;
  facing: number;
  poseSize?: [number, number];
  poseUrls?: Record<string, string>;
  isPlaceholder?: boolean;
  pose?: string;
  lifeState?: string;
  contentQuad?: (out?: [Vector3, Vector3, Vector3, Vector3]) => [Vector3, Vector3, Vector3, Vector3];
};

export const UP = new Vector3(0, 1, 0);

/**
 * A figure standing at its place: not acting, and nothing in flight on it (no lunge, knockback, run,
 * crossfade or fade). A member's menu lean (`ready`) counts as standing: it is the frame a menu shows.
 */
export function stillActor(a: Actor): boolean {
  const busy = (a as unknown as { tweens?: { size?: number } }).tweens?.size ?? 0;
  return busy === 0 && a.lifeState !== 'act';
}

/** The subject id an actor paints (`characters/<id>/...`), else its name. */
export function subjectId(a: Actor): string {
  return /characters\/([^/]+)\//.exec(a.poseUrls?.['idle'] ?? '')?.[1] ?? a.name;
}

const quad: [Vector3, Vector3, Vector3, Vector3] = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];

/** The painted content as a billboard: bottom centre, height and half width (world), plus its quad. */
export function figOf(a: Actor): Fig {
  const enemy = a.facing < 0;
  if (a.contentQuad) {
    a.updateWorldMatrix(true, true);
    const [bl, br, tr, tl] = a.contentQuad(quad);
    const feet = new Vector3().addVectors(bl, br).multiplyScalar(0.5);
    const top = (tr.y + tl.y) / 2;
    const mask = enemy ? maskOf(a) : undefined;
    return { feet, h: Math.max(0.2, top - feet.y), halfW: Math.max(0.1, bl.distanceTo(br) / 2), enemy, id: subjectId(a), quad: [bl.clone(), br.clone(), tr.clone(), tl.clone()], ...(mask ? { mask } : {}) };
  }
  const size = a.poseSize ?? [a.worldHeight * 0.6, a.worldHeight];
  const s = Math.abs(a.scale.y || 1);
  return { feet: a.getWorldPosition(new Vector3()), h: Math.max(0.2, size[1]) * s, halfW: Math.max(0.1, size[0]) * 0.5 * s, enemy, id: subjectId(a) };
}

/** A throwaway camera at a pose, for projections. */
export function cameraAt(p: Pose, aspect: number): PerspectiveCamera {
  const c = new PerspectiveCamera(p.fov, aspect, 0.1, 400);
  c.position.copy(p.pos);
  c.lookAt(p.look);
  c.updateMatrixWorld(true);
  return c;
}

const tmp = new Vector3();

/** A figure's screen box (CSS px): its painted quad projected when known, else the billboard estimate. */
export function figBox(f: Fig, cam: PerspectiveCamera, W: number, H: number): Box {
  const b: Box = { l: Infinity, r: -Infinity, t: Infinity, b: -Infinity };
  const put = (v: Vector3): void => {
    tmp.copy(v).project(cam);
    const x = (tmp.x * 0.5 + 0.5) * W;
    const y = (0.5 - tmp.y * 0.5) * H;
    b.l = Math.min(b.l, x);
    b.r = Math.max(b.r, x);
    b.t = Math.min(b.t, y);
    b.b = Math.max(b.b, y);
  };
  if (f.quad) {
    for (const q of f.quad) put(q);
    return b;
  }
  const right = new Vector3().setFromMatrixColumn(cam.matrixWorld, 0).setY(0).normalize();
  for (const [sx, sy] of [[-1, 0], [1, 0], [-1, 1], [1, 1]] as const) put(new Vector3().copy(f.feet).addScaledVector(right, sx * f.halfW).addScaledVector(UP, sy * f.h));
  return b;
}

export function unionBox(figs: readonly Fig[], cam: PerspectiveCamera, W: number, H: number): Box {
  const u: Box = { l: Infinity, r: -Infinity, t: Infinity, b: -Infinity };
  for (const f of figs) {
    const b = figBox(f, cam, W, H);
    u.l = Math.min(u.l, b.l);
    u.r = Math.max(u.r, b.r);
    u.t = Math.min(u.t, b.t);
    u.b = Math.max(u.b, b.b);
  }
  return u;
}

/** The screen gap between the party's right edge and the enemies' left edge (CSS px). */
export function gapPx(figs: readonly Fig[], cam: PerspectiveCamera, W: number, H: number): number {
  const p = figs.filter((f) => !f.enemy);
  const e = figs.filter((f) => f.enemy);
  if (!p.length || !e.length) return 0;
  return unionBox(e, cam, W, H).l - unionBox(p, cam, W, H).r;
}

/** The share of `a`'s box that `o`'s box covers. */
export function coverShare(a: Box, o: Box): number {
  const w = Math.min(a.r, o.r) - Math.max(a.l, o.l);
  const h = Math.min(a.b, o.b) - Math.max(a.t, o.t);
  return w > 0 && h > 0 ? (w * h) / Math.max(1, (a.r - a.l) * (a.b - a.t)) : 0;
}

/**
 * The worst share of a party member's box a NEARER party member covers (0 = nobody hides anybody):
 * the judges' "Tidus stands in front of Wakka" check. Depth from the camera decides who is in front.
 */
export function partyOverlap(figs: readonly Fig[], cam: PerspectiveCamera, W: number, H: number): number {
  const party = figs.filter((f) => !f.enemy);
  const boxes = party.map((f) => figBox(f, cam, W, H));
  const depth = party.map((f) => f.feet.distanceTo(cam.position));
  let worst = 0;
  boxes.forEach((a, i) => {
    boxes.forEach((o, j) => {
      if (i !== j && depth[j]! < depth[i]!) worst = Math.max(worst, coverShare(a, o));
    });
  });
  return worst;
}

/** The party's mean on-screen height (CSS px). */
export function partyPx(figs: readonly Fig[], cam: PerspectiveCamera, W: number, H: number): number {
  const party = figs.filter((f) => !f.enemy);
  let s = 0;
  for (const f of party) {
    const b = figBox(f, cam, W, H);
    s += b.b - b.t;
  }
  return s / Math.max(1, party.length);
}

export function centroid(figs: readonly Fig[]): Vector3 {
  const c = new Vector3();
  for (const f of figs) c.add(f.feet);
  return figs.length ? c.multiplyScalar(1 / figs.length) : c;
}

/** The pose `p` stood back (k > 1) or pushed in (k < 1) along its own view line. */
export function standBack(p: Pose, k: number): Pose {
  return { pos: p.look.clone().add(p.pos.clone().sub(p.look).multiplyScalar(k)), look: p.look.clone(), fov: p.fov };
}

/**
 * The static lens shift (CSS px, + = content moves right / down) that centres a shot's subjects in
 * the HUD-free area (VP-1001-46): the union is clipped to the frame first, the shift is capped at 8 %
 * of the frame each way, and the party (`keep`) is never pushed out of the frame.
 */
export function lensFor(union: Box, keep: Box | null, free: Box, W: number, H: number): [number, number] {
  const u: Box = { l: Math.max(0, union.l), r: Math.min(W, union.r), t: Math.max(0, union.t), b: Math.min(H, union.b) };
  const cap = (x: number, lim: number): number => Math.max(-lim, Math.min(lim, x));
  let sx = cap((free.l + free.r) / 2 - (u.l + u.r) / 2, W * 0.08);
  let sy = cap((free.t + free.b) / 2 - (u.t + u.b) / 2, H * 0.08);
  if (keep) {
    sx = Math.max(Math.min(sx, W * 0.99 - keep.r), W * 0.01 - keep.l);
    sy = Math.max(Math.min(sy, H * 0.99 - keep.b), H * 0.01 - keep.t);
  }
  return [Math.round(sx), Math.round(sy)];
}

/** Degrees between two horizontal directions. */
export function yawBetween(a: Vector3, b: Vector3): number {
  const x = new Vector3(a.x, 0, a.z).normalize();
  const y = new Vector3(b.x, 0, b.z).normalize();
  return MathUtils.radToDeg(Math.acos(Math.max(-1, Math.min(1, x.dot(y)))));
}
