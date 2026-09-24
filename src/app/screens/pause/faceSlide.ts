/**
 * Option B for the faces no framing can clear: slide the plate under the dark
 * falloff on the chrome side.
 *
 * Bailey, 24 Sep 2026, *"All your recommendations"*, answering
 * `docs/concepts/layout/pause-faces/README.md`: FFX-2 Rikku B, FFX Tidus B,
 * Auron at 1280x960 B, and **B as one rule for every painting the face-clear
 * framing cannot clear**. `faceClear.clearFace` searches every legal framing
 * (no empty page at either edge) from the approved zoom down to cover; when
 * none of them clears the face it hands back the approved framing, and this is
 * the step after it:
 *
 * - The plate may pan **past its edge on the chrome side**, just far enough
 *   that the face, grown by {@link FACE_MARGIN} and swept over both ends of
 *   the 26 s push-in, clears every chrome box the screen drew. The strip of
 *   page it uncovers sits under the columns, where the falloff is already
 *   near-black, and the plate's own edge is feathered into it
 *   ({@link slideMask}), as the sheet's frames were.
 * - Only when the face would then leave the far edge of the screen does the
 *   plate shrink, and never below {@link SLIDE_MIN_SCALE} of the approved
 *   framing: the sheet's 0.8x, measured at the end of the push-in (see there).
 * - The whole face stays on screen at rest and through the push-in, as
 *   everywhere else in the pause (fix12). Where that leaves no room for the
 *   full {@link FACE_MARGIN} of air, the air may drop to half of it
 *   ({@link SLIDE_MARGINS}), never less.
 * - Where option B as drawn (these bounds) cannot clear the face, the plate
 *   keeps the approved framing, as before the pick: a smaller plate, a face
 *   touching a column or a half-empty screen was never on the sheet
 *   (repair of the verifier's 1024x768 and 844x390 findings, 24 Sep 2026).
 *   For that case Bailey picked option A the same day: `faceStack.chromeFor`
 *   stacks the two columns into one and frames against that.
 * - Only a slid plate is feathered ({@link FramedBox.slid}); the feather never
 *   reaches into the face ({@link slideMask}).
 *
 * The chrome, the meters and the two columns stay exactly as mocked: only the
 * painting moves. A portrait frame (the phone, approved frame f) is never
 * slid; its chrome stacks under the face by design.
 *
 * Game case: both. Shared pause plumbing (CHK-020); the face boxes are per
 * painting, and the rule applies to any plate, not to three named ones.
 *
 * Pure: no DOM.
 */

import { clearFace, FACE_MARGIN, faceInFrame, faceOverlap, faceRectOn, PUSH_SCALE, type FaceBox, type Rect } from './faceClear.ts';
import { type ChromeSide, type PlateBox, type PlateFraming } from './plates.ts';

/**
 * The smallest the plate may get while it slides.
 *
 * The sheet's frames were held 1.1 s into the push-in and shrank to at most
 * 0.8x. Measured through the whole push-in (the plate ends at 1.06x and holds
 * there), 0.8x carries FFX Tidus's and Auron's faces 20 to 35 px past the right
 * edge at 1280x960. So the floor is the sheet's 0.8x **as seen at the end of
 * the push-in**: 0.8 / 1.06, about 0.755x at rest.
 */
export const SLIDE_MIN_SCALE = 0.8 / PUSH_SCALE;
/**
 * The air kept between the face and the chrome while sliding, largest first:
 * the pause's own {@link FACE_MARGIN}, then half of it. Tried in order, each
 * down to the floor. Never none: the sheet's B frames all kept 15 to 16 px.
 */
export const SLIDE_MARGINS: readonly number[] = [FACE_MARGIN, FACE_MARGIN / 2];
/** How finely the shrink is searched, as a fraction of the approved width. */
const SCALE_STEP = 0.005;

type Framing = Pick<PlateFraming, 'x' | 'y'> & { side?: ChromeSide };

/** A plate box, flagged when it is option B's slide (only then is it feathered). */
export type FramedBox = PlateBox & { readonly slid?: true };

/**
 * The framing to use for one plate: `clearFace`'s, or, when that could not
 * clear the face, the plate slid under the falloff; the approved framing when
 * even the slide cannot clear it.
 */
export function frameFace(
  base: PlateBox,
  f: Framing,
  face: FaceBox | undefined,
  frameW: number,
  frameH: number,
  blocks: readonly Rect[],
): FramedBox {
  const box = clearFace(base, f, face, frameW, frameH, blocks);
  if (box !== base || !face || blocks.length === 0 || frameW < frameH) return box;
  if (faceOverlap(faceRectOn(base, face), blocks) === 0 && faceInFrame(base, face, frameW, frameH)) return base;
  const slid = slideFace(base, f, face, frameW, frameH, blocks);
  return slid ? { ...slid, slid: true } : base;
}

/** Which side the chrome is on: the plate's own, or read off where the face sits. */
function chromeSideOf(base: PlateBox, f: Framing, frameW: number): ChromeSide {
  if (f.side) return f.side;
  return base.left + base.width * f.x >= frameW / 2 ? 'left' : 'right';
}

/**
 * The plate slid past its chrome-side edge until the face clears, shrunk only
 * as far as the far edge demands; `null` when nothing down to the floor clears.
 */
export function slideFace(
  base: PlateBox,
  f: Framing,
  face: FaceBox,
  frameW: number,
  frameH: number,
  blocks: readonly Rect[],
): PlateBox | null {
  if (frameW < frameH || blocks.length === 0) return null;
  const side = chromeSideOf(base, f, frameW);
  // The sheet's own range only: down to 0.8x of the approved framing at the end
  // of the push-in, the full margin first.
  for (const margin of SLIDE_MARGINS) {
    const box = slideAt(base, side, face, frameW, frameH, blocks, margin, 1, SLIDE_MIN_SCALE);
    if (box) return box;
  }
  return null;
}

/** {@link slideFace} at one margin, scales `hi` down to `lo`: the largest scale, then the shortest slide. */
function slideAt(
  base: PlateBox,
  side: ChromeSide,
  face: FaceBox,
  frameW: number,
  frameH: number,
  blocks: readonly Rect[],
  margin: number,
  hi: number,
  lo: number,
): PlateBox | null {
  const midY = (face.y0 + face.y1) / 2;
  const faceY = base.top + base.height * midY;
  const steps = Math.max(1, Math.ceil((hi - lo) / SCALE_STEP));

  for (let k = 0; k <= steps; k++) {
    const s = hi - ((hi - lo) * k) / steps;
    const width = base.width * s;
    const height = base.height * s;
    // Keep the face at the height the approved framing put it; a plate shorter
    // than the frame hangs from the top, and its bottom edge is feathered too.
    const top = height >= frameH ? Math.min(0, Math.max(frameH - height, faceY - height * midY)) : 0;
    const at = (left: number): PlateBox => ({ left, top, width, height, magnify: base.magnify * s });

    // The face's swept box moves one for one with the plate's left edge, so each
    // chrome box gives exactly one pan that puts the face just past it.
    const probe = faceRectOn(at(0), face);
    const candidates: number[] =
      side === 'left'
        ? [frameW - width, ...blocks.map((b) => b.right + margin - probe.left + 0.01)]
        : [0, ...blocks.map((b) => b.left - margin - probe.right - 0.01)];
    // Never leave page showing on the far side: that side is the painting's.
    const legal = side === 'left' ? candidates.filter((l) => l >= frameW - width) : candidates.filter((l) => l <= 0);
    legal.sort((a, b) => (side === 'left' ? a - b : b - a));
    for (const left of legal) {
      const box = at(left);
      if (faceOverlap(faceRectOn(box, face), blocks, margin) === 0 && faceInFrame(box, face, frameW, frameH)) return box;
    }
  }
  return null;
}

/** The empty page a slid plate uncovers, per edge, in frame px (0 when covered). */
export interface EmptyEdges {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function emptyEdges(box: Pick<PlateBox, 'left' | 'top' | 'width' | 'height'>, frameW: number, frameH: number): EmptyEdges {
  const e = (v: number): number => (v > 0.5 ? v : 0);
  return {
    left: e(box.left),
    right: e(frameW - (box.left + box.width)),
    top: e(box.top),
    bottom: e(frameH - (box.top + box.height)),
  };
}

/** How far into the plate its uncovered edge fades in: the sheet's own feather. */
export function slideFeather(frameW: number): number {
  return Math.max(120, Math.round(frameW * 0.14));
}

/**
 * The CSS mask that feathers a slid plate's uncovered edges into the falloff,
 * or `''` when no page shows. One gradient per uncovered edge, intersected
 * (`.pause__plate--slid`). The stage applies it to a slid plate only
 * ({@link FramedBox.slid}): a plate the search framed is never masked, even
 * where it leaves page uncovered for another reason (the 4K magnify cap).
 *
 * With `face`, each fade ends before the face begins (at rest; the push-in
 * scales the mask with the plate), so the feather never dims an eye or a chin.
 */
export function slideMask(
  box: Pick<PlateBox, 'left' | 'top' | 'width' | 'height'>,
  frameW: number,
  frameH: number,
  face?: FaceBox,
): string {
  const edges = emptyEdges(box, frameW, frameH);
  const full = slideFeather(frameW);
  const room: Record<keyof EmptyEdges, number> = face
    ? {
        left: box.width * face.x0,
        right: box.width * (1 - face.x1),
        top: box.height * face.y0,
        bottom: box.height * (1 - face.y1),
      }
    : { left: full, right: full, top: full, bottom: full };
  const to: Record<keyof EmptyEdges, string> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
  const parts = (Object.keys(to) as (keyof EmptyEdges)[])
    .filter((edge) => edges[edge] > 0)
    .map((edge) => `linear-gradient(to ${to[edge]}, transparent 0px, #000 ${Math.max(0, Math.min(full, Math.floor(room[edge])))}px)`);
  return parts.join(', ');
}
