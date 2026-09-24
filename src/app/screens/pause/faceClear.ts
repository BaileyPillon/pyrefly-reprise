/**
 * Keep the painting's face out from under the chrome, as a box, at every window size.
 *
 * Bailey's mustRemain for the Until Dawn pause remake (`docs/target/targets.json`,
 * 21 Sep 2026, *"B, yes, yes, yes"*) is that **the text block sits on whichever
 * side of THIS painting is empty**. `plates.ts` picks the side and pans the
 * sidecar's focal *point* to a fixed fraction of the frame. A point is not a
 * face: round 09 and its repair (PR-0079, `docs/plans/pr-0079-method-check.md`)
 * measured the IN THIS FIGHT values sitting on FFX-2 Yuna's eye at 1280x960 and
 * Paine's whole face under both columns there, with the focal point itself
 * clear. The columns keep a near-fixed pixel width (`--pu-key`, `--pu-bar` are
 * CSS floors) while the frame narrows, so no fixed pan fraction is right at
 * every size.
 *
 * This is approved frame (c)'s own move, generalised: the picture is panned,
 * and zoomed back toward plain cover when it has to be, until the face box
 * clears every chrome block the screen actually drew. When the approved framing
 * already clears (frames a, b and c at 1600x900) it is returned untouched.
 *
 * Game case: both. Shared pause plumbing; the face boxes are per painting.
 *
 * Pure: no DOM. The screen measures the chrome and hands the boxes in.
 */

import { FOCAL_AT_Y, PLATE_ASPECT, type PlateBox, type PlateFraming } from './plates.ts';

/** A box in frame pixels. */
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** A face as fractions of its source painting: brow to chin, cheek to cheek. */
export interface FaceBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * Every shipped member plate's face, measured off `public/art/pause/<id>.png`
 * on a 5% grid (fix12, PR-0079). Eyes, nose, mouth and chin are inside; hair,
 * horns and ears past the cheek are not.
 */
export const FACE_BOXES: Readonly<Record<string, FaceBox>> = {
  auron: { x0: 0.43, x1: 0.76, y0: 0.2, y1: 0.73 },
  kimahri: { x0: 0.2, x1: 0.5, y0: 0.33, y1: 0.73 },
  lulu: { x0: 0.33, x1: 0.72, y0: 0.2, y1: 0.78 },
  paine: { x0: 0.23, x1: 0.52, y0: 0.25, y1: 0.61 },
  rikku: { x0: 0.31, x1: 0.67, y0: 0.41, y1: 0.8 },
  'rikku-ffx2': { x0: 0.36, x1: 0.69, y0: 0.24, y1: 0.7 },
  tidus: { x0: 0.37, x1: 0.7, y0: 0.26, y1: 0.72 },
  wakka: { x0: 0.36, x1: 0.7, y0: 0.43, y1: 0.83 },
  yuna: { x0: 0.16, x1: 0.44, y0: 0.25, y1: 0.69 },
  'yuna-ffx2': { x0: 0.355, x1: 0.51, y0: 0.22, y1: 0.45 },
};

/** Air kept between a face and the nearest line of chrome, in CSS px. */
export const FACE_MARGIN = 16;

/**
 * The slow push-in (`pause-screen.css` `pause-push`, `pause-drift`) scales the
 * plate to 1.06 about an origin that drifts between these two points, so a face
 * that clears at rest has to clear at the end of the push as well.
 */
const PUSH_SCALE = 1.06;
const PUSH_ORIGINS: readonly (readonly [number, number])[] = [
  [0.48, 0.44],
  [0.54, 0.48],
];

/** How finely the zoom and the pan are searched. Cheap: a few thousand box tests. */
const ZOOM_STEPS = 48;
const PAN_STEPS = 96;

/** The face's box on screen for one plate box, at rest and at every end of the push-in. */
export function faceRectOn(box: Pick<PlateBox, 'left' | 'top' | 'width' | 'height'>, face: FaceBox, push = true): Rect {
  const at = (s: number, ox: number, oy: number): Rect => {
    const cx = box.left + box.width * ox;
    const cy = box.top + box.height * oy;
    const x = (u: number): number => cx + (box.left + box.width * u - cx) * s;
    const y = (v: number): number => cy + (box.top + box.height * v - cy) * s;
    return { left: x(face.x0), right: x(face.x1), top: y(face.y0), bottom: y(face.y1) };
  };
  const all = [at(1, 0.5, 0.5), ...(push ? PUSH_ORIGINS.map(([ox, oy]) => at(PUSH_SCALE, ox, oy)) : [])];
  return {
    left: Math.min(...all.map((r) => r.left)),
    right: Math.max(...all.map((r) => r.right)),
    top: Math.min(...all.map((r) => r.top)),
    bottom: Math.max(...all.map((r) => r.bottom)),
  };
}

/**
 * Whether the face is wholly inside the frame, at rest and at every end of the
 * push-in. Clearing the chrome by pushing half a face off the edge of the
 * screen is not clearing it: the first run of this search framed Paine at
 * 1280x960 as one eye and an ear, and checking only at rest let the 26 s
 * push-in carry Paine's nose and lip past x = 0 (fix12 verifier).
 */
export function faceInFrame(box: Pick<PlateBox, 'left' | 'top' | 'width' | 'height'>, face: FaceBox, frameW: number, frameH: number, push = true): boolean {
  const r = faceRectOn(box, face, push);
  return r.left >= 0 && r.right <= frameW && r.top >= 0 && r.bottom <= frameH;
}

/** Area of chrome sitting on the face (with the margin), 0 when clear. */
export function faceOverlap(face: Rect, blocks: readonly Rect[], margin = FACE_MARGIN): number {
  let sum = 0;
  for (const b of blocks) {
    const w = Math.min(face.right + margin, b.right) - Math.max(face.left - margin, b.left);
    const h = Math.min(face.bottom + margin, b.bottom) - Math.max(face.top - margin, b.top);
    if (w > 0 && h > 0) sum += w * h;
  }
  return sum;
}

/**
 * The framing to use: `base` when its face already clears the chrome and
 * stays on screen through the push-in;
 * otherwise the largest zoom (closest to the approved head size) at which some
 * legal pan clears it with the whole face still on screen, panned as near to
 * the approved focal position as it can be; otherwise the approved framing
 * untouched (a plate no framing can clear is a layout question, not a
 * framing one: see `docs/plans/pr-0079-method-check.md`).
 *
 * A portrait frame (the phone, approved frame f) is left alone: its chrome
 * stacks under the face by design.
 */
export function clearFace(
  base: PlateBox,
  f: Pick<PlateFraming, 'x' | 'y'>,
  face: FaceBox | undefined,
  frameW: number,
  frameH: number,
  blocks: readonly Rect[],
): PlateBox {
  if (!face || blocks.length === 0 || frameW < frameH) return base;
  if (faceOverlap(faceRectOn(base, face), blocks) === 0 && faceInFrame(base, face, frameW, frameH)) return base;

  const coverW = Math.max(frameW, frameH * PLATE_ASPECT);
  const wantX = base.left + base.width * f.x;

  for (let z = 0; z <= ZOOM_STEPS; z++) {
    const width = base.width - ((base.width - coverW) * z) / ZOOM_STEPS;
    const height = width / PLATE_ASPECT;
    const top = Math.min(0, Math.max(frameH - height, frameH * FOCAL_AT_Y - height * f.y));
    const minLeft = frameW - width;
    let found: { box: PlateBox; drift: number } | null = null;
    for (let p = 0; p <= PAN_STEPS; p++) {
      const left = minLeft * (p / PAN_STEPS);
      const box: PlateBox = { left, top, width, height, magnify: base.magnify * (width / base.width) };
      const overlap = faceOverlap(faceRectOn(box, face), blocks);
      const drift = Math.abs(left + width * f.x - wantX);
      if (overlap === 0 && faceInFrame(box, face, frameW, frameH) && (!found || drift < found.drift)) {
        found = { box, drift };
      }
    }
    if (found) return found.box;
    if (base.width - coverW < 1) break;
  }
  return base;
}
