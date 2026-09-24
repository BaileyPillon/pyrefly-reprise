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
 * chrome this plate was measured against, scaled to the new frame. The column
 * widths have pixel floors, so the estimate is close rather than exact; when
 * the member tab comes back and the real chrome is measured, `settled` tells
 * the stage to glide the last short distance instead of snapping.
 *
 * Game case: both (shared pause plumbing). Pure: no DOM.
 */

import { clearFace, FACE_BOXES, type Rect } from './faceClear.ts';
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

export interface Framed {
  box: PlateBox;
  /** A measured framing just replaced an estimated one: move there smoothly. */
  settled: boolean;
}

export class FaceFramer {
  /** The last framing per plate and window size, kept across fixed tabs. */
  private readonly cleared = new Map<string, PlateBox>();
  /** Keys whose cached framing is an estimate, not measured chrome. */
  private readonly estimated = new Set<string>();
  /** The last member chrome each plate was framed against. */
  private readonly lastChrome = new Map<string, Measured>();

  /**
   * @param blocks the member chrome as laid out now, or `null` when none is up.
   */
  frame(id: string, base: PlateBox, f: PlateFraming, w: number, h: number, blocks: readonly Rect[] | null): Framed {
    const key = `${id}@${Math.round(w)}x${Math.round(h)}`;
    const face = FACE_BOXES[id];
    if (blocks) {
      const box = clearFace(base, f, face, w, h, blocks);
      this.lastChrome.set(id, { w, h, blocks });
      const prev = this.cleared.get(key);
      const wasEstimate = this.estimated.delete(key);
      this.cleared.set(key, box);
      return { box, settled: wasEstimate && prev !== undefined && !sameBox(prev, box) };
    }
    const cached = this.cleared.get(key);
    if (cached) return { box: cached, settled: false };
    const seen = this.lastChrome.get(id);
    if (!seen) return { box: base, settled: false };
    const box = clearFace(base, f, face, w, h, scaleBlocks(seen.blocks, seen.w, seen.h, w, h));
    this.cleared.set(key, box);
    this.estimated.add(key);
    return { box, settled: false };
  }
}

function sameBox(a: PlateBox, b: PlateBox): boolean {
  return Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.width - b.width) < 0.5;
}
