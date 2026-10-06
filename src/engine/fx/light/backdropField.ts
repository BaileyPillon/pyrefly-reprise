import { CanvasTexture, LinearFilter, SRGBColorSpace, Vector3, type Camera, type Mesh, type Object3D, type PlaneGeometry, type Texture } from 'three';

/**
 * Figure lighting MOCKUPS (`lightFlags.ts`): what the room around a figure looks like, as a small blurred copy of the backdrop
 * painting, and where the painting sits on the screen.
 *
 * - `buildField`: the painting drawn down in three halving steps to 64x36 (a box filter, so it is a true blur and a bright
 *   spot spreads instead of being skipped), kept as an sRGB texture so the shader reads linear light. Built once per painting.
 * - `backdropMap`: the screen-to-painting map as an affine transform of NDC, from three projected corners of the backdrop's
 *   plane. The painting is a plane square to the camera, so affine is as exact as a blurred lookup needs.
 * - `findKey`: the brightest spot of the upper two thirds of the field, for a room that has no hand-confirmed light.
 *
 * Presentation only (rule 1); nothing is written to the painting.
 */

export interface BackdropField {
  tex: CanvasTexture;
  /** The uuid of the painting's texture the field was drawn from. */
  from: string;
  w: number;
  h: number;
  data: Uint8ClampedArray;
}

const FIELD_W = 64;
const FIELD_H = 36;

type Drawable = CanvasImageSource & { width: number; height: number };

function halve(src: Drawable, w: number, h: number): HTMLCanvasElement | null {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, w, h);
  return cv;
}

export function buildField(map: Texture | null | undefined): BackdropField | null {
  const img = map?.image as Drawable | undefined;
  if (!map || !img?.width || typeof document === 'undefined') return null;
  try {
    let cur: Drawable = img;
    // 2688x1536 -> 672x384 -> 168x96 -> 64x36: each step a whole-number box where it can be.
    for (const [w, h] of [
      [Math.max(FIELD_W, Math.round(img.width / 4)), Math.max(FIELD_H, Math.round(img.height / 4))],
      [Math.max(FIELD_W, Math.round(img.width / 16)), Math.max(FIELD_H, Math.round(img.height / 16))],
      [FIELD_W, FIELD_H],
    ] as const) {
      const next = halve(cur, w, h);
      if (!next) return null;
      cur = next;
    }
    const cv = cur as HTMLCanvasElement;
    const data = cv.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, FIELD_W, FIELD_H).data;
    const tex = new CanvasTexture(cv);
    tex.colorSpace = SRGBColorSpace;
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return { tex, from: map.uuid, w: FIELD_W, h: FIELD_H, data };
  } catch {
    return null; // a tainted or unreadable image: the looks that read the room's colour then read a flat grey
  }
}

/** The backdrop's main painting mesh in a scene (`Backdrop.ts` names it), or null. */
export function findBackdrop(scene: Object3D): Mesh | null {
  let hit: Mesh | null = null;
  scene.traverse((o) => {
    if (!hit && o.name === 'backdrop-painting') hit = o as Mesh;
  });
  return hit;
}

export interface BackdropMap {
  /** NDC of the painting's uv (0,0), and the NDC change over uv.x 0..1 and uv.y 0..1. */
  n0: [number, number];
  nx: [number, number];
  ny: [number, number];
  /** The inverse: backdrop uv = M * ndc + o, with M = [m00, m10, m01, m11] (column major). */
  m: [number, number, number, number];
  o: [number, number];
}

const p = new Vector3();

function ndcOf(mesh: Mesh, camera: Camera, u: number, v: number, out: [number, number]): void {
  const g = mesh.geometry as PlaneGeometry;
  const bb = g.boundingBox ?? (g.computeBoundingBox(), g.boundingBox!);
  p.set(bb.min.x + u * (bb.max.x - bb.min.x), bb.min.y + v * (bb.max.y - bb.min.y), 0).applyMatrix4(mesh.matrixWorld).project(camera);
  out[0] = p.x;
  out[1] = p.y;
}

/** Where the painting sits on the screen now (`camera` must have its world matrix and projection current). */
export function backdropMap(mesh: Mesh, camera: Camera, out: BackdropMap): BackdropMap {
  mesh.updateWorldMatrix(true, false);
  const a: [number, number] = [0, 0];
  const b: [number, number] = [0, 0];
  const c: [number, number] = [0, 0];
  ndcOf(mesh, camera, 0, 0, a);
  ndcOf(mesh, camera, 1, 0, b);
  ndcOf(mesh, camera, 0, 1, c);
  out.n0 = a;
  out.nx = [b[0] - a[0], b[1] - a[1]];
  out.ny = [c[0] - a[0], c[1] - a[1]];
  const det = out.nx[0] * out.ny[1] - out.ny[0] * out.nx[1] || 1e-6;
  // [u v]^T = A (ndc - n0), A = inverse of the matrix whose columns are nx and ny.
  const a00 = out.ny[1] / det;
  const a01 = -out.ny[0] / det;
  const a10 = -out.nx[1] / det;
  const a11 = out.nx[0] / det;
  out.m = [a00, a10, a01, a11];
  out.o = [-(a00 * a[0] + a01 * a[1]), -(a10 * a[0] + a11 * a[1])];
  return out;
}

export function newBackdropMap(): BackdropMap {
  return { n0: [0, 0], nx: [1, 0], ny: [0, 1], m: [1, 0, 0, 1], o: [0, 0] };
}

/** The brightest spot in the upper two thirds of the field: where a room's key most likely sits (an unchecked fallback). */
export function findKey(f: BackdropField): { at: [number, number]; col: number } {
  let best = -1;
  let bx = 0.5;
  let by = 0.2;
  let col = 0xdde8ff;
  const maxY = Math.floor(f.h * 0.66);
  for (let y = 0; y < maxY; y++) {
    for (let x = 0; x < f.w; x++) {
      const i = (y * f.w + x) * 4;
      const r = f.data[i]!;
      const g = f.data[i + 1]!;
      const b = f.data[i + 2]!;
      const l = r * 0.2126 + g * 0.7152 + b * 0.0722;
      if (l > best) {
        best = l;
        bx = (x + 0.5) / f.w;
        by = (y + 0.5) / f.h;
        col = (r << 16) | (g << 8) | b;
      }
    }
  }
  return { at: [bx, by], col };
}
