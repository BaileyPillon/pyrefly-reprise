/**
 * The Chapter IX sakura plate's edge mask (PR-0184, FFX only): the alpha map that
 * ends the approved tree painting on the sides and top without a straight plate
 * edge, and leaves its base whole where the roots stand on the floor. The PNG is
 * never touched; only the alpha the overlay multiplies it by.
 */
import { CanvasTexture } from 'three';

/**
 * Fractions of the plate's width (sides) and height (top): `band` is the soft ramp,
 * `base` the ramp's least inset, `wander` how far further in it wanders along the
 * edge, `reach` how much nearer the edge a bright blossom clump keeps itself
 * (never more than `base`, so the plate edge is always 0), and `dome` how much
 * further the sides pull in toward the top, rounding the upper corners.
 */
const SIDE = { band: 0.07, base: 0.07, wander: 0.07, reach: 0.07, dome: 0.1 } as const;
const TOP = { band: 0.06, base: 0.04, wander: 0.05, reach: 0.04 } as const;

/** A fixed wobble in [0, 1] along an edge: three incommensurate waves, so the line never repeats. */
function edgeWobble(t: number, seed: number): number {
  const w =
    0.5 * Math.sin(2 * Math.PI * (1.7 * t + seed)) +
    0.3 * Math.sin(2 * Math.PI * (4.3 * t + seed * 2.1)) +
    0.2 * Math.sin(2 * Math.PI * (9.1 * t + seed * 3.7));
  return 0.5 + 0.5 * w;
}

const ramp = (d: number, band: number): number => {
  const k = Math.min(1, Math.max(0, d / band));
  return k * k * (3 - 2 * k);
};

/**
 * The tree plate's alpha at canvas point (u, v), v = 0 at the top, for a pixel of
 * brightness `lum` (0..1): 0 on the left, right and top edges, 1 all the way down
 * the base. The approved painting's canopy reaches column 991 of 1024, which read
 * as a straight vertical cut; a ramp parallel to the edge only softened that into a
 * straight soft column (L-0 check, 2026-09-27, 2000x1012). So the ramp's start
 * wanders along each edge, the sides pull in toward the top, and bright clumps keep
 * themselves nearer the edge than the dark gaps beside them: the canopy ends along
 * its own blossom, on an irregular, rounded line.
 */
export function sakuraEdgeAlpha(u: number, v: number, lum = 0): number {
  const l = Math.min(1, Math.max(0, lum));
  const dome = SIDE.dome * Math.max(0, 1 - v / 0.6) ** 2;
  const side = (d: number, seed: number): number =>
    ramp(d - SIDE.base - SIDE.wander * edgeWobble(v, seed) - dome + SIDE.reach * l, SIDE.band);
  const top = ramp(v - TOP.base - TOP.wander * edgeWobble(u, 0.37) + TOP.reach * l, TOP.band);
  return Math.min(side(u, 0.13), side(1 - u, 0.61), top);
}

/**
 * {@link sakuraEdgeAlpha} as an alpha map (three reads its green channel), keyed to
 * `image` when given (the painting, drawn down to `size` so a clump's brightness is
 * its neighbourhood's), else to position alone (the procedural stand-in).
 */
export function sakuraEdgeTexture(image?: CanvasImageSource, size = 256): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  let src: Uint8ClampedArray | null = null;
  if (image) {
    try {
      ctx.drawImage(image, 0, 0, size, size);
      src = ctx.getImageData(0, 0, size, size).data;
    } catch {
      src = null; // an image the canvas cannot read keys by position alone
    }
  }
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const lum = src ? Math.max(src[i]!, src[i + 1]!, src[i + 2]!) / 255 : 0;
      const a = Math.round(255 * sakuraEdgeAlpha((x + 0.5) / size, (y + 0.5) / size, lum));
      img.data[i] = img.data[i + 1] = img.data[i + 2] = a;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return new CanvasTexture(c);
}
