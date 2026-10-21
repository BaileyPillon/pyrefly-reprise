/**
 * **Procedural canvas textures for the temple chamber, the first set** (the hidden Wind Waker chapter; FFX-2 only): spiral clouds, the flame teardrop, the sky gradient, a leaf, the light-shaft card and a thin waterfall
 * stripe. Ported from the look lab's `js/canvasTex.mjs` and `canvasTex2.mjs`: everything is seeded (two runs draw the same pixels) and flat-coloured. The stone and the floor are in `./stageTextures2.ts`.
 *
 * They draw on a 2D canvas, so they need a DOM; the stage takes them through the {@link StageTextures} interface (`./stage.ts`), which a test replaces with blank textures. Needs three.js. Game case: FFX-2 only.
 */

import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

/** A small seeded random source (mulberry32): the same seed draws the same picture. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function canvas(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) throw new Error('no 2d canvas context');
  return { c, g };
}

/** A canvas as a texture: sRGB, wrapped when it repeats or `wrap` says so, anisotropic. */
export function tex(c: HTMLCanvasElement, opts: { repeat?: readonly [number, number]; wrap?: boolean } = {}): Texture {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = opts.repeat || opts.wrap ? RepeatWrapping : ClampToEdgeWrapping;
  if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
  t.anisotropy = 8;
  return t;
}

export const rgb = (r: number, g: number, b: number, k = 1): string => `rgb(${Math.round(Math.min(255, r * k))},${Math.round(Math.min(255, g * k))},${Math.round(Math.min(255, b * k))})`;

/** Wind Waker cloud: flat white puffs on a flat base, a lilac underside band, a curled spiral tip. */
export function cloudTexture(seed: number): Texture {
  const W = 768;
  const H = 384;
  const { c, g } = canvas(W, H);
  const r = rng(seed);
  const base = H * 0.66;
  const blobs: Array<{ x: number; y: number; r: number }> = [];
  const n = 6 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const rad = 34 + 46 * Math.sin(Math.PI * (0.15 + 0.7 * u)) + r() * 14;
    blobs.push({ x: W * (0.12 + 0.6 * u), y: base - rad * 0.55, r: rad });
  }
  const union = (color: string, dy: number): void => {
    g.fillStyle = color;
    for (const b of blobs) {
      g.beginPath();
      g.arc(b.x, b.y + dy, b.r, 0, Math.PI * 2);
      g.fill();
    }
    g.fillRect(W * 0.12, base - 34 + dy, W * 0.6, 34);
  };
  const cx = W * 0.8;
  const cy = base - 52;
  const spiral = (color: string, dy: number, width: number, k: number): void => {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    for (let a = 3.3 * Math.PI; a >= 0; a -= 0.12) {
      const rr = (6 + 8.2 * a) * k;
      const x = cx + rr * Math.cos(a + 1.1);
      const y = cy + dy + rr * Math.sin(a + 1.1);
      if (a === 3.3 * Math.PI) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  };
  union('#b8c3ec', 13);
  spiral('#b8c3ec', 13, 30, 0.92);
  union('#ffffff', 0);
  spiral('#ffffff', 0, 30, 0.92);
  spiral('rgba(170,183,232,0.95)', 0, 4, 0.8);
  return tex(c);
}

/** Wind Waker flame: flat orange teardrop, yellow inner tear, tiny white core. */
export function flameTexture(): Texture {
  const W = 256;
  const H = 384;
  const { c, g } = canvas(W, H);
  const drop = (cx: number, top: number, w: number, h: number, color: string, stroke: string | null): void => {
    g.beginPath();
    g.moveTo(cx + w * 0.05, top);
    g.bezierCurveTo(cx + w * 0.1, top + h * 0.22, cx + w * 0.5, top + h * 0.5, cx + w * 0.4, top + h * 0.76);
    g.bezierCurveTo(cx + w * 0.34, top + h * 0.97, cx - w * 0.34, top + h * 0.97, cx - w * 0.4, top + h * 0.76);
    g.bezierCurveTo(cx - w * 0.5, top + h * 0.5, cx - w * 0.1, top + h * 0.28, cx + w * 0.05, top);
    g.closePath();
    g.fillStyle = color;
    g.fill();
    if (stroke) {
      g.lineWidth = 8;
      g.strokeStyle = stroke;
      g.stroke();
    }
  };
  drop(W / 2, 12, W * 0.96, H * 0.96, '#ff8a1e', '#e8481a');
  drop(W / 2, H * 0.36, W * 0.62, H * 0.6, '#ffd23a', null);
  drop(W / 2, H * 0.58, W * 0.3, H * 0.36, '#fff4c2', null);
  return tex(c);
}

/** The sky dome's gradient: a deep blue overhead down to a pale horizon. */
export function skyTexture(): Texture {
  const { c, g } = canvas(8, 256);
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#2f86e6');
  grad.addColorStop(0.55, '#62b2f4');
  grad.addColorStop(1, '#d4efff');
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 256);
  return tex(c);
}

/** A flat green leaf with a pale vein. */
export function leafTexture(): Texture {
  const { c, g } = canvas(64, 64);
  g.fillStyle = '#4fbf45';
  g.beginPath();
  g.moveTo(32, 2);
  g.bezierCurveTo(60, 20, 56, 50, 32, 62);
  g.bezierCurveTo(8, 50, 4, 20, 32, 2);
  g.closePath();
  g.fill();
  g.strokeStyle = '#8be860';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(32, 8);
  g.lineTo(32, 56);
  g.stroke();
  return tex(c);
}

/** Soft god-ray card: bright at the top, gone at the bottom, gaussian across. */
export function shaftTexture(): Texture {
  const W = 128;
  const H = 256;
  const { c, g } = canvas(W, H);
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    const along = Math.pow(1 - v, 1.4) * Math.min(1, v * 8);
    for (let x = 0; x < W; x++) {
      const u = (x / (W - 1)) * 2 - 1;
      const across = Math.exp(-u * u * 3.2);
      const a = Math.max(0, Math.min(1, along * across));
      const i = (y * W + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 244;
      img.data[i + 2] = 205;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(img, 0, 0);
  return tex(c);
}

/** A thin waterfall: pale blue with white and deeper-blue vertical streaks; it tiles vertically, so scrolling the offset makes it fall. */
export function waterfallTexture(): Texture {
  const W = 128;
  const H = 512;
  const { c, g } = canvas(W, H);
  const r = rng(77);
  g.fillStyle = rgb(150, 214, 246);
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) {
    const x = r() * W;
    const w = 5 + r() * 12;
    const y0 = r() * H;
    const len = 120 + r() * 260;
    g.fillStyle = r() < 0.55 ? rgb(236, 250, 255) : rgb(96, 176, 232);
    g.fillRect(x, y0, w, Math.min(len, H - y0));
    if (y0 + len > H) g.fillRect(x, 0, w, y0 + len - H);
  }
  g.fillStyle = rgb(240, 252, 255);
  g.fillRect(0, 0, 10, H);
  g.fillRect(W - 10, 0, 10, H);
  return tex(c, { wrap: true });
}
