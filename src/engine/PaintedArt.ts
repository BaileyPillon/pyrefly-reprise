import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three';
import { loadArtManifest, manifestKnowsAsset } from './ArtManifest.ts';
import { parseArtFacing, type ArtFacing } from './BattlePresenterActors.ts';
import type { PoseFrame } from './PaintedScale.ts';

// "Does this art exist?" is answered by `./ArtManifest.ts` — import it from
// there. It is deliberately not re-exported here: this file is already well
// over the 400-line house limit, and the manifest is a separate concern that
// the UI layer uses without ever touching a texture.
export { computePoseScale, contactBandFor } from './PaintedScale.ts';
export type { PoseFrame, PoseScale, PoseScaleOptions } from './PaintedScale.ts';
export type { ArtFacing } from './BattlePresenterActors.ts';

/**
 * Loading and bookkeeping for the painted (non-pixel) art pipeline.
 *
 * The art agent writes:
 *   public/art/backdrops/<scene>.png            a ~2688x1536 painting
 *   public/art/characters/<who>/<pose>.png      transparent, cropped figure
 *   public/art/characters/<who>/<pose>.json     { width, height, baselineY, seed, prompt }
 *   public/art/portraits/<who>.png
 *
 * Nothing here ever throws on a missing file: a miss resolves to a procedural
 * placeholder plus a console warning, and {@link watchAssets} polls in dev so
 * the scene hot-swaps the moment the real PNG appears.
 */

/**
 * Sidecar JSON written next to every painted character PNG.
 *
 * `scale` and `anchorY` are **optional hand overrides**. Nothing generates
 * them; they are there so one awkward render can be corrected in a text file
 * instead of in code. See {@link PoseFrame} for their exact meaning — they are
 * read by {@link computePoseScale}, which is what sizes the plane.
 *
 * ```jsonc
 * // public/art/characters/tidus/ko.json
 * { "width": 1216, "height": 823, "baselineY": 813,
 *   "scale": 0.92,      // this render came out 8% large
 *   "anchorY": 0.97 }   // ground line at 97% of the image height
 * ```
 */
export interface PoseMeta extends PoseFrame {
  seed?: number;
  prompt?: string;
  /**
   * Which way this painting faces — `'right'`, `'left'` or `'front'`.
   *
   * The art contract is that party art faces **right** and enemy art faces
   * **left**, so an undeclared painting is assumed to already be correct for
   * the side it is staged on and is never mirrored. This field is how art that
   * does *not* obey the contract says so: `"front"` for the older
   * facing-camera renders (never flipped, because a frontal figure has no
   * wrong side), or the direction it really faces, which is what lets
   * {@link import('./BattlePresenterActors.ts').mirrorFor} flip it exactly when
   * it disagrees with the side it is fighting on.
   */
  facing?: ArtFacing;
}

export interface PaintedTexture {
  texture: Texture;
  meta: PoseMeta;
  /** True when this is a procedural stand-in rather than the real painting. */
  placeholder: boolean;
  /** The URL that was asked for (even when it 404'd). */
  url: string;
}

let maxAnisotropy = 8;

/** Called once by `Renderer` so painted textures use the GPU's real maximum. */
export function setPaintedAnisotropy(n: number): void {
  maxAnisotropy = Math.max(1, Math.min(16, Math.floor(n)));
}

/** Resolve a path under `public/` against the Vite base path. */
export function artUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/**
 * Painted art wants the opposite of the pixel pipeline: smooth magnification,
 * trilinear minification and anisotropy, so a 2688px painting held at an angle
 * does not crawl.
 */
export function configurePaintedTexture(tex: Texture): Texture {
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/** Wrap a canvas as a painted texture (linear + mips, like the real PNGs). */
export function paintedCanvasTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  configurePaintedTexture(tex);
  return tex;
}

const loader = new TextureLoader();
const warned = new Set<string>();

function warnOnce(url: string, why: string): void {
  if (warned.has(url)) return;
  warned.add(url);
  console.warn(`[painted] ${why}: ${url} — using a procedural placeholder.`);
}

/** Resolves to the texture, or null when the file is absent/undecodable. */
export async function tryLoadTexture(url: string): Promise<Texture | null> {
  try {
    const tex = await loader.loadAsync(url);
    return configurePaintedTexture(tex);
  } catch {
    warnOnce(url, 'missing painting');
    return null;
  }
}

/** Reads `<image>.json`. Resolves to null when there is no sidecar. */
export async function tryLoadMeta(imageUrl: string): Promise<PoseMeta | null> {
  const jsonUrl = imageUrl.replace(/\.[a-z0-9]+$/i, '.json');
  try {
    const res = await fetch(jsonUrl, { cache: 'no-cache' });
    if (!res.ok) return null;
    const raw = (await res.json()) as Partial<PoseMeta>;
    if (typeof raw.height !== 'number' || typeof raw.width !== 'number') return null;
    const positive = (v: unknown): v is number =>
      typeof v === 'number' && Number.isFinite(v) && v > 0;
    return {
      width: raw.width,
      height: raw.height,
      baselineY: typeof raw.baselineY === 'number' ? raw.baselineY : raw.height,
      ...(positive(raw.scale) ? { scale: raw.scale } : {}),
      ...(positive(raw.anchorY) ? { anchorY: raw.anchorY } : {}),
      ...(parseArtFacing(raw.facing) ? { facing: parseArtFacing(raw.facing)! } : {}),
      ...(raw.seed !== undefined ? { seed: raw.seed } : {}),
      ...(raw.prompt !== undefined ? { prompt: raw.prompt } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Load one painted image plus its sidecar. On a miss the caller's
 * `fallback()` canvas is used and `placeholder` is true.
 */
export async function loadPainted(
  url: string,
  fallback: () => HTMLCanvasElement,
  fallbackBaseline?: (c: HTMLCanvasElement) => number,
  matte?: MatteOptions,
  fit?: false | BaselineFitOptions,
  opts: LoadPaintedOptions = {},
): Promise<PaintedTexture> {
  // The manifest's flat refusal: this file is not in the build, so asking for
  // it can only produce a 404 and a warning. Straight to the stand-in, in
  // silence. `null` (no manifest, or an un-indexed URL) means "go and look",
  // which is what every caller did before the manifest existed.
  if (!opts.ignoreManifest && (await manifestKnowsAsset(url)) === false) {
    return placeholderPainted(url, fallback, fallbackBaseline);
  }

  const [tex, meta] = await Promise.all([tryLoadTexture(url), tryLoadMeta(url)]);
  if (tex) {
    const img = tex.image as { width?: number; height?: number } | undefined;
    const width = meta?.width ?? img?.width ?? 1024;
    const height = meta?.height ?? img?.height ?? 1024;

    let texture = tex;
    let pixels: CanvasImageSource | null = (tex.image as CanvasImageSource) ?? null;
    if (matte && matte.mode !== 'off' && tex.image) {
      const cleaned = cleanMatte(tex.image as Parameters<typeof cleanMatte>[0], matte);
      if (cleaned) {
        console.warn(
          `[painted] ${url} still had an opaque white studio background; ` +
            'cleaned it at load time. Regenerate the PNG with a proper alpha matte.',
        );
        texture = paintedCanvasTexture(cleaned);
        tex.dispose();
        pixels = cleaned;
      }
    }

    // The sidecar's `baselineY` is written by the art tool and is usually just
    // `height - 16`, not a measurement — so measure. Reading the *cleaned*
    // alpha is what plants a figure's feet exactly on the ground plane.
    let baselineY = meta?.baselineY ?? height;
    if (fit !== false && pixels) {
      const fitted = fitBaselineFromAlpha(pixels, width, height, fit ?? {});
      if (fitted !== null) baselineY = fitted;
    }

    return {
      texture,
      // The hand overrides ride along untouched: `anchorY` beats the measured
      // baseline, and `scale` trims the derived pixel scale, both inside
      // `computePoseScale`.
      meta: {
        width,
        height,
        baselineY,
        ...(meta?.scale !== undefined ? { scale: meta.scale } : {}),
        ...(meta?.anchorY !== undefined ? { anchorY: meta.anchorY } : {}),
        // Which way the painting faces rides along too: it decides whether the
        // plane is mirrored, and that is a per-*pose* question (one old frontal
        // `cast.png` can sit in an otherwise right-facing set).
        ...(meta?.facing !== undefined ? { facing: meta.facing } : {}),
      },
      placeholder: false,
      url,
    };
  }
  return placeholderPainted(url, fallback, fallbackBaseline);
}

/** Options for {@link loadPainted}. */
export interface LoadPaintedOptions {
  /**
   * Load even when `public/art/manifest.json` has never heard of this file.
   *
   * The dev hot-swap watcher needs it: the manifest is generated at build time,
   * so a PNG the art fleet dropped in five seconds ago is by definition not in
   * it, and gating that reload would make new art invisible until a rebuild.
   */
  ignoreManifest?: boolean;
}

/** The procedural stand-in, packaged as a {@link PaintedTexture}. */
function placeholderPainted(
  url: string,
  fallback: () => HTMLCanvasElement,
  fallbackBaseline?: (c: HTMLCanvasElement) => number,
): PaintedTexture {
  const canvas = fallback();
  return {
    texture: paintedCanvasTexture(canvas),
    meta: {
      width: canvas.width,
      height: canvas.height,
      baselineY: fallbackBaseline ? fallbackBaseline(canvas) : canvas.height,
    },
    placeholder: true,
    url,
  };
}

// ---------------------------------------------------------------------------
// Baseline fitting
// ---------------------------------------------------------------------------

export interface BaselineFitOptions {
  /** Alpha a pixel must reach to count as painted content, 0..1. Default 0.35. */
  threshold?: number;
  /**
   * Fraction of the image width that must be opaque on a row before it counts
   * as the figure's bottom. Stops one stray speck of noise from dragging the
   * baseline to the bottom of the canvas. Default 0.006 (≈5 px on an 832-wide
   * painting).
   */
  minRun?: number;
}

/**
 * The lowest row of a painted cut-out that still carries the figure — i.e.
 * where its feet actually are.
 *
 * Returns `null` when the image cannot be read (a tainted canvas) or carries no
 * content at all, in which case the caller keeps whatever the sidecar declared.
 */
export function fitBaselineFromAlpha(
  source: CanvasImageSource,
  width: number,
  height: number,
  opts: BaselineFitOptions = {},
): number | null {
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  // Fitting is a per-row question, so the horizontal resolution can be cut hard.
  const sw = Math.min(w, 256);
  const sh = Math.min(h, 1024);

  const c = document.createElement('canvas');
  c.width = sw;
  c.height = sh;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, sw, sh);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, sw, sh).data;
  } catch {
    return null;
  }

  const cut = Math.round((opts.threshold ?? 0.35) * 255);
  const need = Math.max(2, Math.round(sw * (opts.minRun ?? 0.006)));

  for (let y = sh - 1; y >= 0; y--) {
    let run = 0;
    for (let x = 0; x < sw; x++) {
      if (data[(y * sw + x) * 4 + 3]! >= cut) run++;
    }
    if (run >= need) {
      // +1 so the baseline is the ground line *under* the last painted row.
      const fitted = Math.min(h, Math.round(((y + 1) / sh) * h));
      return fitted;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Matte cleanup
// ---------------------------------------------------------------------------

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

/** HEAD probe. Cheap enough to poll a handful of paths every few seconds. */
export async function assetExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
    return res.ok;
  } catch {
    return false;
  }
}

export interface AssetWatcher {
  stop(): void;
  /** Force one poll immediately. Resolves once the check has run. */
  poll(): Promise<void>;
}

/**
 * Poll a set of URLs until each first appears, then call back once per URL.
 *
 * Used so a running dev session picks up the paintings the art agent is
 * generating without a reload. Inert outside dev unless `force` is set.
 */
export function watchAssets(
  urls: string[],
  onAppear: (url: string) => void,
  opts: { intervalMs?: number; force?: boolean } = {},
): AssetWatcher {
  const pending = new Set(urls);
  const enabled = opts.force || Boolean(import.meta.env.DEV);
  let timer = 0;
  let stopped = false;

  const poll = async (): Promise<void> => {
    if (stopped || !pending.size) return;
    const list = [...pending];
    const results = await Promise.all(list.map((u) => assetExists(u)));
    if (stopped) return;
    list.forEach((url, i) => {
      if (!results[i]) return;
      pending.delete(url);
      try {
        onAppear(url);
      } catch (err) {
        console.warn('[painted] hot-swap failed for', url, err);
      }
    });
    if (!pending.size) stop();
  };

  const stop = (): void => {
    stopped = true;
    if (timer) window.clearInterval(timer);
    timer = 0;
  };

  if (enabled && pending.size) {
    timer = window.setInterval(() => void poll(), opts.intervalMs ?? 5000);
  }

  return { stop, poll };
}

/**
 * Average colour of a horizontal band of an image, as 0..1 linear-ish RGB.
 *
 * `from`/`to` are fractions of the image height. Used to tint the ground and
 * the light rig from the backdrop painting so nothing in the 3D layer is a
 * colour the painting does not already contain.
 */
export function sampleBand(
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  from: number,
  to: number,
  samples = 64,
): [number, number, number] {
  const w = 'naturalWidth' in source ? source.naturalWidth || source.width : source.width;
  const h = 'naturalHeight' in source ? source.naturalHeight || source.height : source.height;
  if (!w || !h) return [0.5, 0.5, 0.5];

  const y0 = Math.max(0, Math.floor(h * Math.min(from, to)));
  const y1 = Math.min(h, Math.ceil(h * Math.max(from, to)));
  const bandH = Math.max(1, y1 - y0);

  const scratch = document.createElement('canvas');
  scratch.width = samples;
  scratch.height = Math.max(1, Math.min(samples, bandH));
  const ctx = scratch.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [0.5, 0.5, 0.5];
  ctx.drawImage(source as CanvasImageSource, 0, y0, w, bandH, 0, 0, scratch.width, scratch.height);

  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  try {
    const data = ctx.getImageData(0, 0, scratch.width, scratch.height).data;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]! / 255;
      if (a < 0.05) continue;
      r += data[i]! * a;
      g += data[i + 1]! * a;
      b += data[i + 2]! * a;
      n += a;
    }
  } catch {
    return [0.5, 0.5, 0.5];
  }
  if (!n) return [0.5, 0.5, 0.5];
  return [r / n / 255, g / n / 255, b / n / 255];
}

/** `sampleBand` result packed into a 0xRRGGBB integer. */
export function bandHex(rgb: [number, number, number]): number {
  const c = (v: number): number => Math.max(0, Math.min(255, Math.round(v * 255)));
  return (c(rgb[0]) << 16) | (c(rgb[1]) << 8) | c(rgb[2]);
}

/**
 * Re-expose a sampled colour to a target luminance, keeping its hue.
 *
 * A band average taken from a painting carries the painting's *hue* honestly
 * but its *brightness* accidentally — a night painting full of dark rock
 * averages to near-black, and a light rig built from that average lights
 * nothing. Sampling for hue and setting the value explicitly is what makes the
 * 3D layer belong to the painting instead of disappearing into it.
 */
export function normaliseLuma(hex: number, target: number): number {
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const k = luma > 0.001 ? target / luma : 1;
  const c = (v: number): number => Math.max(0, Math.min(255, Math.round(v * k * 255)));
  return (c(r) << 16) | (c(g) << 8) | c(b);
}

// ---------------------------------------------------------------------------
// Subject loader — `PaintedArt.load(id)`
// ---------------------------------------------------------------------------

/**
 * The character states the painted pipeline generates, in load order.
 *
 * `idle` is first and is special: every other state falls back to it, so a
 * subject with only `idle.png` still answers every pose name an actor asks for.
 */
export const CHARACTER_STATES = ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'] as const;
export type CharacterState = (typeof CHARACTER_STATES)[number];

/** `public/art/characters/<id>/<state>.png` */
export function characterUrl(id: string, state: string): string {
  return artUrl(`art/characters/${id}/${state}.png`);
}

/** `public/art/portraits/<id>.png` */
export function portraitUrl(id: string): string {
  return artUrl(`art/portraits/${id}.png`);
}

/** `public/art/backdrops/<id>.png` */
export function backdropUrl(id: string): string {
  return artUrl(`art/backdrops/${id}.png`);
}

/** Everything {@link loadSubject} found on disk for one character id. */
export interface PaintedSubject {
  id: string;
  /** One entry per requested state. Always fully populated. */
  poses: Record<string, PaintedTexture>;
  /** `{ state: url }`, so a caller can hand the set to the dev hot-swapper. */
  urls: Record<string, string>;
  /** States that have a painting of their own. */
  real: string[];
  /** States that resolved to `idle` because their own PNG is missing. */
  fellBack: string[];
  /**
   * The subject's declared art facing — `idle`'s sidecar, or the first state
   * that declares one. Undefined means "obeys the contract for its side", which
   * is the default and is never mirrored. Individual poses may still override
   * it through their own sidecar.
   */
  facing?: ArtFacing;
  /** True when even `idle` was absent and everything is a grey silhouette. */
  placeholder: boolean;
}

export interface LoadSubjectOptions {
  /** States to look for. Defaults to {@link CHARACTER_STATES}. */
  states?: readonly string[];
  /**
   * Leftover-white cleanup, forwarded to {@link loadPainted}. Defaults to
   * `{ mode: 'auto' }`; pass `{ mode: 'off' }` for hand-cut art.
   */
  matte?: MatteOptions;
  /** Alpha baseline fitting; `false` trusts the sidecar's `baselineY`. */
  fitBaseline?: false | BaselineFitOptions;
  /** Canvas used when the whole subject is missing. */
  silhouette?: (id: string) => HTMLCanvasElement;
  /** Where the feet are in the silhouette canvas, as a fraction of height. */
  silhouetteBaseline?: number;
}

/**
 * Load every painted state for one character id.
 *
 * ```ts
 * const tidus = await PaintedArt.load('tidus');
 * tidus.real;        // ['idle', 'attack', ...] — what actually exists
 * tidus.poses.cast;  // always a texture, even if cast.png is missing
 * ```
 *
 * Three rules, and nothing here ever rejects:
 *
 * 1. `public/art/characters/<id>/<state>.png` plus its `.json` sidecar is the
 *    source of truth for a state's size and `baselineY`.
 * 2. A **missing state** resolves to `idle` — a character with only an idle
 *    painting can still be asked to `setPose('attack')`.
 * 3. A **missing subject** (no `idle` either) resolves to a soft grey
 *    silhouette for every state, and logs one warning naming the id.
 */
export async function loadSubject(
  id: string,
  opts: LoadSubjectOptions = {},
): Promise<PaintedSubject> {
  const states = opts.states ?? CHARACTER_STATES;
  // `'auto'` by default — which is what `PaintedActor` has always documented,
  // but never got, because an unset `matte` skipped the cleanup entirely. It is
  // the reason a KO render whose white studio background was only half cut
  // (kimahri/ko.png) drew a hard white rectangle beside the body: `'auto'` only
  // touches an image whose leftover background is both large and wrapped around
  // the border, so a properly cut-out PNG still goes through untouched.
  //
  // Deliberately *not* defaulted inside `loadPainted`: backdrops load through
  // it too, and a bright sky is exactly the large, border-hugging near-white
  // region this would eat.
  const matte = opts.matte ?? { mode: 'auto' as const };
  const silhouette = opts.silhouette ?? ((): HTMLCanvasElement => softSilhouette(id));
  const baselineOf = (c: HTMLCanvasElement): number => c.height * (opts.silhouetteBaseline ?? 0.965);

  const wanted = [...new Set(['idle', ...states])];

  // The manifest is the difference between "look and see" and "already know".
  // With one, a pose nobody has painted is never requested — no 404 in the
  // network panel, no `[painted] missing painting` in the console, and the
  // state falls back to `idle` exactly as it always did. Without one (an old
  // deploy, a bare static server, a unit test) `known` is null and every state
  // is fetched, which is the original behaviour.
  const manifest = await loadArtManifest();
  const known = manifest ? (manifest.subjects[id]?.states ?? []) : null;
  const fetchable = known ? wanted.filter((state) => known.includes(state)) : wanted;

  const loaded = await Promise.all(
    fetchable.map((state) =>
      loadPainted(
        characterUrl(id, state),
        () => silhouette(id),
        baselineOf,
        matte,
        opts.fitBaseline,
      ),
    ),
  );

  const byState = new Map<string, PaintedTexture>();
  fetchable.forEach((state, i) => byState.set(state, loaded[i]!));

  // When the manifest says the subject has nothing, no request went out at all
  // and there is no texture to stand in for `idle` — make the silhouette here.
  const idle =
    byState.get('idle') ??
    (((): PaintedTexture => {
      const canvas = silhouette(id);
      return {
        texture: paintedCanvasTexture(canvas),
        meta: { width: canvas.width, height: canvas.height, baselineY: baselineOf(canvas) },
        placeholder: true,
        url: characterUrl(id, 'idle'),
      };
    })());
  const subjectMissing = idle.placeholder;
  if (subjectMissing && !warned.has(`subject:${id}`)) {
    warned.add(`subject:${id}`);
    console.warn(
      `[painted] no art for subject "${id}" (looked for ${characterUrl(id, 'idle')}) — ` +
        'every state falls back to a soft grey silhouette.',
    );
  }

  const poses: Record<string, PaintedTexture> = {};
  const urls: Record<string, string> = {};
  const real: string[] = [];
  const fellBack: string[] = [];

  for (const state of states) {
    const own = byState.get(state);
    if (own && !own.placeholder) {
      poses[state] = own;
      real.push(state);
    } else {
      // A state without its own painting borrows idle's. When idle is missing
      // too, that *is* the silhouette, which is the third rule.
      if (own && state !== 'idle') own.texture.dispose();
      poses[state] = idle;
      if (!subjectMissing) fellBack.push(state);
    }
    urls[state] = characterUrl(id, state);
  }

  // `idle` is the subject's word on which way it was painted; any other state
  // that declares one will do when idle is silent, and the manifest carries the
  // same answer for a subject whose sidecars were never fetched.
  const declared =
    idle.meta.facing ??
    [...byState.values()].find((p) => p.meta.facing !== undefined)?.meta.facing ??
    (manifest ? manifest.subjects[id]?.facing : undefined);

  return {
    id,
    poses,
    urls,
    real,
    fellBack,
    placeholder: subjectMissing,
    ...(declared ? { facing: declared } : {}),
  };
}

/**
 * The stand-in for a character with no art at all: a soft, desaturated
 * head-and-shoulders silhouette, feet at 96.5% of the canvas height.
 *
 * Deliberately quiet — it has to sit in a composed frame without wrecking a
 * screenshot — and deliberately not a coloured box, so a missing subject reads
 * as "art pending", not as "the engine broke".
 */
export function softSilhouette(id = '', size = { width: 512, height: 1024 }): HTMLCanvasElement {
  const W = size.width;
  const H = size.height;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // A stable per-id jitter, so two missing subjects are not pixel-identical.
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const jitter = ((h >>> 8) % 1000) / 1000;

  const feet = H * 0.965;
  const headR = W * 0.15;
  const headY = H * 0.11 + headR;
  const cx = W * 0.5;

  const body = new Path2D();
  body.moveTo(cx - W * (0.2 + jitter * 0.03), feet);
  body.quadraticCurveTo(cx - W * 0.3, H * 0.52, cx - W * 0.24, H * 0.3);
  body.quadraticCurveTo(cx - W * 0.2, headY + headR * 0.4, cx, headY + headR * 0.75);
  body.quadraticCurveTo(cx + W * 0.2, headY + headR * 0.4, cx + W * 0.24, H * 0.3);
  body.quadraticCurveTo(cx + W * 0.3, H * 0.52, cx + W * (0.2 + jitter * 0.03), feet);
  body.closePath();

  const grad = ctx.createLinearGradient(0, H * 0.15, 0, feet);
  grad.addColorStop(0, 'rgba(150, 160, 178, 0.92)');
  grad.addColorStop(0.62, 'rgba(104, 114, 132, 0.9)');
  grad.addColorStop(1, 'rgba(58, 66, 82, 0.9)');

  ctx.filter = 'blur(6px)';
  ctx.fillStyle = grad;
  ctx.fill(body);
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';

  // A cool rim on the left, so it picks up the scene's light direction.
  ctx.globalCompositeOperation = 'source-atop';
  const rim = ctx.createLinearGradient(cx - W * 0.3, 0, cx + W * 0.1, 0);
  rim.addColorStop(0, 'rgba(190, 216, 246, 0.5)');
  rim.addColorStop(0.35, 'rgba(190, 216, 246, 0)');
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  return canvas;
}

/**
 * Namespaced entry point for the painted art pipeline.
 *
 * `PaintedArt.load(id)` is the one other agents should reach for; the rest is
 * re-exported for scene code that needs a single URL or a raw texture.
 */
export const PaintedArt = {
  load: loadSubject,
  loadOne: loadPainted,
  characterUrl,
  portraitUrl,
  backdropUrl,
  url: artUrl,
  states: CHARACTER_STATES,
  silhouette: softSilhouette,
} as const;
