/**
 * Which face-cleared framing each plate uses, remembered across the tabs that
 * have no member chrome (PR-0079 follow-up, fix12 verifier).
 *
 * `faceClear` needs the member chrome's boxes, and a fixed tab (GUIDE,
 * OPTIONS, CONTROLS, MUSIC) or the panels hidden (H) draws none. The first
 * build kept the member's framing per window size, but a resize while such a
 * tab was up missed that cache and fell back to the uncleared approved
 * framing: the painting jumped on the fixed tab and again, by as much as
 * 800 px, on the way back to the member.
 *
 * Now a cache miss with no chrome estimates the framing from the last member
 * chrome this plate was measured against ({@link estimateBlocks}). The column
 * widths have pixel floors, so the estimate is close rather than exact; when
 * the member tab comes back and the real chrome is measured, `settled` tells
 * the stage to glide the last short distance instead of snapping.
 *
 * The framing itself is `faceSlide.frameFace`: `faceClear`'s search, then
 * option B (slide under the falloff) when that search cannot clear the face.
 * The estimate starts from the two columns side by side (option A's stack is
 * a per-size decision, `faceStack.ts`), and falls back to the last stacked
 * column only where the two columns would cover the face.
 *
 * Game case: both (shared pause plumbing). Pure: no DOM.
 */

import { FACE_BOXES, type Rect } from './faceClear.ts';
import { frameFace, type FramedBox } from './faceSlide.ts';
import { clearsFace, coversFace } from './faceStack.ts';
import type { PlateBox, PlateFraming } from './plates.ts';

interface Measured {
  w: number;
  h: number;
  blocks: readonly Rect[];
}

/** Chrome measured in one frame, stretched onto another. */
export function scaleBlocks(blocks: readonly Rect[], fromW: number, fromH: number, toW: number, toH: number): Rect[] {
  const sx = toW / fromW;
  const sy = toH / fromH;
  return blocks.map((b) => ({ left: b.left * sx, right: b.right * sx, top: b.top * sy, bottom: b.bottom * sy }));
}

/**
 * How far {@link estimateBlocks} leans toward plain stretching. Fitted on the
 * member chrome Chromium laid out for every FFX and FFX-2 plate at six window
 * sizes (270 size pairs, 24 Sep 2026): stretching alone missed the measured
 * framing by 173 px on average and called the slide wrongly 55 times; this
 * blend misses by 67 px and 22 times (the rest are plates on the edge of
 * sliding, where a few px of column decide it).
 */
const STRETCH_WEIGHT = 0.6;

/**
 * The member chrome measured in one frame, estimated for another. The columns'
 * widths are clamps with pixel floors, so the true boxes lie between two
 * guesses: everything stretched with the frame ({@link scaleBlocks}), and every
 * box kept at its pixel size, pinned to the side of the frame it stands on. The
 * estimate is a blend of the two; heights follow the frame (the rows are vh).
 */
export function estimateBlocks(blocks: readonly Rect[], fromW: number, fromH: number, toW: number, toH: number): Rect[] {
  const stretched = scaleBlocks(blocks, fromW, fromH, toW, toH);
  const k = STRETCH_WEIGHT;
  return blocks.map((b, i) => {
    const dx = (b.left + b.right) / 2 < fromW / 2 ? 0 : toW - fromW;
    const s = stretched[i]!;
    return { left: k * s.left + (1 - k) * (b.left + dx), right: k * s.right + (1 - k) * (b.right + dx), top: s.top, bottom: s.bottom };
  });
}

export interface Framed {
  box: FramedBox;
  /** A measured framing just replaced an estimated one: move there smoothly. */
  settled: boolean;
}

export class FaceFramer {
  /** The last framing per plate and window size, kept across fixed tabs. */
  private readonly cleared = new Map<string, FramedBox>();
  /** Keys whose cached framing is an estimate, not measured chrome. */
  private readonly estimated = new Set<string>();
  /** The last member chrome each plate was measured with, two columns side by side. */
  private readonly lastChrome = new Map<string, Measured>();
  /** The last stacked column (option A) each plate was framed against, if any. */
  private readonly lastStack = new Map<string, Measured>();

  /**
   * @param blocks the member chrome as laid out now, or `null` when none is up.
   * @param flat the two columns side by side as measured now, when `blocks` is the stack.
   */
  frame(
    id: string,
    base: PlateBox,
    f: PlateFraming,
    w: number,
    h: number,
    blocks: readonly Rect[] | null,
    flat: readonly Rect[] | null = blocks,
  ): Framed {
    const key = `${id}@${Math.round(w)}x${Math.round(h)}`;
    const face = FACE_BOXES[id];
    if (blocks) {
      const box = frameFace(base, f, face, w, h, blocks);
      this.lastChrome.set(id, { w, h, blocks: flat ?? blocks });
      if (flat && flat !== blocks) this.lastStack.set(id, { w, h, blocks });
      const prev = this.cleared.get(key);
      const wasEstimate = this.estimated.delete(key);
      this.cleared.set(key, box);
      return { box, settled: wasEstimate && prev !== undefined && !sameBox(prev, box) };
    }
    const cached = this.cleared.get(key);
    if (cached) return { box: cached, settled: false };
    const seen = this.lastChrome.get(id);
    if (!seen) return { box: base, settled: false };
    const est = estimateBlocks(seen.blocks, seen.w, seen.h, w, h);
    let box = frameFace(base, f, face, w, h, est);
    const stack = this.lastStack.get(id);
    if (stack && face && coversFace(box, face, est)) {
      const stackEst = estimateBlocks(stack.blocks, stack.w, stack.h, w, h);
      const stacked = frameFace(base, f, face, w, h, stackEst);
      if (clearsFace(stacked, face, w, h, stackEst)) box = stacked;
    }
    this.cleared.set(key, box);
    this.estimated.add(key);
    return { box, settled: false };
  }
}

function sameBox(a: PlateBox, b: PlateBox): boolean {
  return Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.width - b.width) < 0.5;
}
