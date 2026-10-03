/**
 * Drawing one living face: the picked parts composited over the plate's own pixels (D-320).
 *
 * The plate is never redrawn; this canvas holds only the parts, in the small box that covers all of them, and sits over
 * the plate with the same box and grade. At rest it holds nothing, so the plate is exactly today's picture. The order
 * is the rig's: the eye's socket re-fill, the iris and its catchlight moved by the gaze and clipped to the eye's
 * window, the closed lid for a blink (it snaps: see below), then the open smile or the concerned press at its weight.
 * A blink is the closed painting up or down, never a cross-fade, so no frame mixes two paintings at the eyes; the mouth
 * is a cross-fade of the painted part over the plate's own mouth (the painted parts are the plate outside their mask).
 *
 * Game case: both. Takes a 2D context and decoded images, so a recording fake can test every call; no DOM of its own,
 * no engine state, no RNG.
 */

import { boxOf, type Box, type Eye, type PlateParts, type Scale } from './livingParts.ts';

export interface FaceState {
  smile: number;
  press: number;
  /** 1 open, 0 shut. */
  aperture: number;
  /** The iris offset in master (2x) pixels. */
  iris: { x: number; y: number };
}

export const FACE_REST: Readonly<FaceState> = { smile: 0, press: 0, aperture: 1, iris: { x: 0, y: 0 } };

/** The catchlight moves a third as far as the iris (the rig's 0.3). */
export const CATCH_RATIO = 0.3;
/**
 * The press is a cross-fade over the plate's own mouth, and over a toothy grin (Tidus, Wakka) the teeth ghost through
 * while it is half there. So its weight is shaped to spend as little time half there as the A2 swell allows: nothing
 * under 0.15, full from 0.75 (the smile, close to the plate's own mouth, stays linear).
 */
export function pressAlpha(w: number): number {
  const c = Math.min(1, Math.max(0, (w - 0.15) / 0.6));
  return c * c * (3 - 2 * c);
}

/** A blink's lid is shut under this aperture (half-way), open above it. */
const LID_SHUT_BELOW = 0.5;
/** Weights and offsets under these draw nothing. */
const EPS_W = 0.004;
const EPS_PX = 0.04;

/** The minimal slice of a 2D context this draws with (the real one satisfies it, and so does a recording fake). */
export interface Ctx2D {
  clearRect(x: number, y: number, w: number, h: number): void;
  drawImage(img: unknown, x: number, y: number): void;
  save(): void;
  restore(): void;
  beginPath(): void;
  rect(x: number, y: number, w: number, h: number): void;
  clip(): void;
  globalAlpha: number;
  globalCompositeOperation: string;
}

export interface Scratch {
  canvas: unknown;
  ctx: Ctx2D;
}

export interface RenderLayer {
  spec: PlateParts;
  scale: Scale;
  /** The canvas box at this scale: every part is drawn relative to its corner. */
  origin: Box;
  images: ReadonlyMap<string, unknown>;
  /** One scratch surface per eye, sized to that eye's box, for the window clip. */
  scratch: (eye: Eye, w: number, h: number) => Scratch | null;
}

/** Small steps of a state compare equal, so an idle face costs nothing between changes. */
export function stateKey(s: FaceState): string {
  const q = (v: number, step: number): number => Math.round(v / step);
  return [q(s.smile, 0.004), q(s.press, 0.004), (s.aperture < LID_SHUT_BELOW ? 0 : 1), q(s.iris.x, 0.05), q(s.iris.y, 0.05)].join(',');
}

/** True when the state is today's plate: nothing to draw. */
export function atRest(s: FaceState): boolean {
  return s.smile < EPS_W && s.press < EPS_W && s.aperture >= LID_SHUT_BELOW && Math.abs(s.iris.x) < EPS_PX && Math.abs(s.iris.y) < EPS_PX;
}

/** Clear and draw. Returns false when the state is the rest pose (the canvas was only cleared). */
export function drawFace(ctx: Ctx2D, L: RenderLayer, s: FaceState): boolean {
  ctx.clearRect(0, 0, L.origin[2], L.origin[3]);
  if (atRest(s)) return false;
  const k = L.scale === '2x' ? 1 : 0.5;
  const rel = (b: Box): Box => [b[0] - L.origin[0], b[1] - L.origin[1], b[2], b[3]];
  const img = (name: string): unknown => L.images.get(name);
  const box = (name: string): Box | null => {
    const spec = L.spec.parts[name];
    return spec ? rel(boxOf(spec, L.scale)) : null;
  };

  const dx = Math.round(s.iris.x * k);
  const dy = Math.round(s.iris.y * k);
  if (Math.abs(dx) >= EPS_PX * k || Math.abs(dy) >= EPS_PX * k) {
    for (const e of L.spec.gaze) {
      const b = box(`eye${e}-socket`);
      const parts = ['socket', 'iris', 'catch', 'window'].map((n) => img(`eye${e}-${n}`));
      if (!b || parts.some((p) => !p)) continue;
      const sc = L.scratch(e, b[2], b[3]);
      if (!sc) continue;
      sc.ctx.globalCompositeOperation = 'source-over';
      sc.ctx.clearRect(0, 0, b[2], b[3]);
      sc.ctx.drawImage(parts[1], dx, dy);
      sc.ctx.drawImage(parts[2], Math.round(dx * CATCH_RATIO), Math.round(dy * CATCH_RATIO)); // whole pixels: as sharp as the plate
      sc.ctx.globalCompositeOperation = 'destination-in';
      sc.ctx.drawImage(parts[3], 0, 0);
      sc.ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(parts[0], b[0], b[1]);
      ctx.drawImage(sc.canvas, b[0], b[1]);
    }
  }

  if (s.aperture < LID_SHUT_BELOW) {
    // A cel blink: the closed painting is either up or not. A top-down wipe of it showed a hard box edge for its two
    // in-between frames on every plate (seen at 1:1), so the lid snaps and the aperture only decides when.
    for (const e of L.spec.blink) {
      const b = box(`lid${e}-closed`);
      const lid = img(`lid${e}-closed`);
      if (b && lid) ctx.drawImage(lid, b[0], b[1]);
    }
  }

  for (const [name, w] of [['mouth-open-smile', s.smile], ['mouth-concerned-press', pressAlpha(s.press)]] as const) {
    const b = box(name);
    const part = img(name);
    if (!b || !part || w < EPS_W) continue;
    ctx.globalAlpha = Math.min(1, w);
    ctx.drawImage(part, b[0], b[1]);
    ctx.globalAlpha = 1;
  }
  return true;
}
