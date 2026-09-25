/**
 * Matte cleanup for generated character PNGs, moved out of `PaintedArt.ts`
 * (which re-exports it) so that file stays inside its line budget. Pure
 * canvas work; behaviour unchanged.
 */

export interface MatteOptions {
  /**
   * `'auto'` (default) runs the cleanup but keeps the original unless the
   * leftover background is large *and* wraps most of the image border, so a
   * correctly cut-out PNG is never touched. `'force'` always applies it,
   * `'off'` skips it.
   */
  mode?: 'auto' | 'force' | 'off';
  /** Fraction of the image that must be background-white for `'auto'`. */
  minFraction?: number;
  /** Borders the region must touch for `'auto'`. 1..4. */
  minBorders?: number;
}

const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a || 1e-6)));
  return t * t * (3 - 2 * t);
};

/**
 * Remove a leftover white studio background from a generated character PNG.
 *
 * Image models prompted with "simple background, white background" often come
 * back with a matte that only *partly* cut the white away — a big opaque white
 * cloud still surrounds the figure, which reads as a white box once the PNG is
 * a plane in a 3D scene.
 *
 * The fix is a flood fill seeded from the image border that travels only
 * through already-transparent or near-white, near-desaturated pixels, scaling
 * their alpha down by how white they are. Because it is connectivity-based, an
 * *interior* white (Yuna's kimono, a highlight) is never touched — only white
 * that is continuous with the outside of the figure.
 *
 * @returns a cleaned canvas, or null when nothing needed doing.
 */
export function cleanMatte(
  source: CanvasImageSource & { width?: number; height?: number },
  opts: MatteOptions = {},
): HTMLCanvasElement | null {
  const mode = opts.mode ?? 'auto';
  if (mode === 'off') return null;

  const w = Math.floor(
    (source as HTMLImageElement).naturalWidth || (source.width as number) || 0,
  );
  const h = Math.floor(
    (source as HTMLImageElement).naturalHeight || (source.height as number) || 0,
  );
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0);

  let img: ImageData;
  try {
    img = ctx.getImageData(0, 0, w, h);
  } catch {
    return null;
  }
  const d = img.data;

  const whiteness = (i: number): number => {
    const r = d[i]!;
    const g = d[i + 1]!;
    const b = d[i + 2]!;
    const max = r > g ? (r > b ? r : b) : g > b ? g : b;
    const min = r < g ? (r < b ? r : b) : g < b ? g : b;
    const lum = max / 255;
    const sat = max > 0 ? (max - min) / max : 0;
    return smoothstep(0.78, 0.94, lum) * (1 - smoothstep(0.1, 0.32, sat));
  };

  const visited = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let top = 0;
  const push = (p: number): void => {
    if (visited[p]) return;
    visited[p] = 1;
    stack[top++] = p;
  };

  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }

  let cleared = 0;
  const borders = [false, false, false, false]; // top, bottom, left, right

  while (top > 0) {
    const p = stack[--top]!;
    const i = p * 4;
    const a = d[i + 3]!;
    let travel = a < 24;
    if (!travel) {
      const wht = whiteness(i);
      if (wht > 0.3) {
        travel = true;
        // A *hard* cut with a short ramp, not a linear `a * (1 - whiteness)`.
        // Scaling alpha linearly leaves a wash of 30-50%-opaque pixels wherever
        // the studio background picked up a tint from the figure's own glow —
        // invisible in isolation, but in a scene it is a translucent rectangle
        // the size of the whole PNG, and any flash or dissolve lights it up.
        const next = a * (1 - smoothstep(0.26, 0.62, wht));
        if (a - next > 8) cleared++;
        d[i + 3] = next;
        const y0 = (p / w) | 0;
        const x0 = p - y0 * w;
        if (y0 < 2) borders[0] = true;
        if (y0 > h - 3) borders[1] = true;
        if (x0 < 2) borders[2] = true;
        if (x0 > w - 3) borders[3] = true;
      }
    }
    if (!travel) continue;

    const y = (p / w) | 0;
    const x = p - y * w;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }

  if (mode === 'auto') {
    const fraction = cleared / (w * h);
    const touched = borders.filter(Boolean).length;
    if (fraction < (opts.minFraction ?? 0.05) || touched < (opts.minBorders ?? 3)) return null;
  }
  if (!cleared) return null;

  ctx.putImageData(img, 0, 0);
  return canvas;
}
