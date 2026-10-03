/**
 * The art side of Lady Ginnem's live glow (presentation plan A-9): from her painting, the outline points the
 * motes sit on, the painting's content box (the same one `PaintedActor.contentQuad` reports, so a world quad can be
 * laid over the painting), and a soft halo plate: her silhouette blurred wide, tinted cool white, with the body cut
 * out so the glow only lies outside her (the approved card, `b-pyrefly-edged-card.jpg`: she keeps her face).
 *
 * Needs a DOM canvas and an image; where either is missing (jsdom, a test) it answers null and the callers draw
 * nothing. The battle scene (`scenes/cavern-stolen-fayth-glow.ts`) and the cutscene stage
 * (`app/screens/cutsceneAura.ts`) share it, so there is one reading of her edge.
 *
 * Game case: FFX only for now (Chapter IX); shared plumbing otherwise.
 */

import { measureAlpha } from '../PaintedArt.ts';
import type { AlphaBox } from '../PaintedScale.ts';
import { outlineFromRgba, type OutlinePoint } from './unsentOutline.ts';

export interface UnsentArt {
  /** The painting's size in pixels. */
  w: number;
  h: number;
  /** The tight alpha box in painting pixels, as the actor measures it; null when it could not be read. */
  box: AlphaBox | null;
  /** The body's edge. */
  outline: OutlinePoint[];
  /**
   * The halo plate: it covers the painting grown by `margin` painting pixels on every side, so plate (0,0) is
   * painting (-margin, -margin) and the plate is `(w + 2 margin) x (h + 2 margin)` painting pixels wide.
   */
  glow: HTMLCanvasElement;
  margin: number;
}

/** Halo reach: the margin around the painting, as a share of its height. */
export const GLOW_MARGIN = 0.07;
/** The tint: a cool white, the card's glow. */
export const GLOW_TINT = '#eaf4ff';
/** The motes' colours (the card's white sparks with a few cool ones). */
export const GLOW_MOTES: readonly number[] = [0xffffff, 0xe6f4ff, 0xcfe8ff, 0xf4fbff, 0xbfe0ff];

const cache = new Map<string, Promise<UnsentArt | null>>();

function canvas(w: number, h: number): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Soft blur by halving down and doubling back up: the same on every browser, no `ctx.filter`. */
function softened(src: HTMLCanvasElement, steps: number): HTMLCanvasElement | null {
  let cur: HTMLCanvasElement = src;
  for (let i = 0; i < steps; i++) {
    const next = canvas(Math.max(2, cur.width / 2), Math.max(2, cur.height / 2));
    const ctx = next?.getContext('2d');
    if (!next || !ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, 0, 0, next.width, next.height);
    cur = next;
  }
  const out = canvas(src.width, src.height);
  const octx = out?.getContext('2d');
  if (!out || !octx) return null;
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(cur, 0, 0, out.width, out.height);
  return out;
}

/** The halo plate for a painting drawn on `img` (see {@link UnsentArt.glow}). */
function buildGlow(img: CanvasImageSource, w: number, h: number, margin: number): HTMLCanvasElement | null {
  const s = Math.min(1, 640 / (h + 2 * margin));
  const cw = Math.round((w + 2 * margin) * s);
  const ch = Math.round((h + 2 * margin) * s);
  const base = canvas(cw, ch);
  const bctx = base?.getContext('2d');
  if (!base || !bctx) return null;
  bctx.drawImage(img, margin * s, margin * s, w * s, h * s);
  const tight = softened(base, 2);
  const wide = softened(base, 5);
  const out = canvas(cw, ch);
  const ctx = out?.getContext('2d');
  if (!out || !ctx || !tight || !wide) return null;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 1;
  for (let i = 0; i < 2; i++) ctx.drawImage(tight, 0, 0);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 3; i++) ctx.drawImage(wide, 0, 0);
  // Tint, then lift the body out so only the outside glows.
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = GLOW_TINT;
  ctx.fillRect(0, 0, cw, ch);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(base, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  return out;
}

async function load(url: string): Promise<UnsentArt | null> {
  if (typeof Image === 'undefined' || typeof document === 'undefined') return null;
  const img = new Image();
  img.decoding = 'async';
  const done = new Promise<boolean>((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
  img.src = url;
  if (!(await done)) return null;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (w < 8 || h < 8) return null;
  // Read the alpha at up to 400 px tall: the outline needs the body, not every pixel.
  const rs = Math.min(1, 400 / h);
  const rw = Math.max(8, Math.round(w * rs));
  const rh = Math.max(8, Math.round(h * rs));
  const probe = canvas(rw, rh);
  const pctx = probe?.getContext('2d', { willReadFrequently: true });
  if (!probe || !pctx) return null;
  pctx.drawImage(img, 0, 0, rw, rh);
  let data: Uint8ClampedArray;
  try {
    data = pctx.getImageData(0, 0, rw, rh).data;
  } catch {
    return null;
  }
  const outline = outlineFromRgba(data, rw, rh, { cell: 4 });
  const margin = Math.round(h * GLOW_MARGIN);
  const glow = buildGlow(img, w, h, margin);
  if (!glow || outline.length === 0) return null;
  return { w, h, box: measureAlpha(img, w, h).box, outline, glow, margin };
}

/** Load (once per URL) the glow's art for the painting at `url`; null where there is no DOM or the file is not there. */
export function loadUnsentArt(url: string): Promise<UnsentArt | null> {
  let p = cache.get(url);
  if (!p) {
    p = load(url).catch(() => null);
    cache.set(url, p);
  }
  return p;
}
