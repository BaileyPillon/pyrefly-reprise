/**
 * Option A for the faces neither the framing nor option B can clear: stack
 * IN THIS FIGHT under BATTLE STATS in one column on the chrome side.
 *
 * Bailey, 24 Sep 2026, *"I'll go with your recommendations full speed again
 * please"*, answering the question the B repair left open
 * (`docs/concepts/layout/pause-faces/README.md`, "Repair"): FFX-2 Paine at
 * 1280x960 and 1280x720 in chapters 5 and 6, where B would need about 0.54x of
 * her approved framing, takes **option A as the sheet draws it** (`sheet.jpg`,
 * row A): the two columns become one, BATTLE STATS on top, and the stack rises
 * only as far as it must to clear the objective.
 *
 * As a rule, not a per-name patch: any member plate reaches it when
 *
 * 1. the two columns as mocked leave chrome on the face (at zero margin) after
 *    `faceSlide.frameFace` (the face-clear search, then B's slide) has done all
 *    it may: a slid plate, or a face that only misses the pause's full margin
 *    of air, is not this case, and
 * 2. the stacked column fits between the tab strip and the objective, inside
 *    the frame ({@link StackHost} says so), and
 * 3. the framing against the stacked column clears the face (at zero overlap
 *    with the pause's own margin, on screen, through the whole push-in).
 *
 * Anything the plain framing or B already clears keeps its two columns, and a
 * case the stack cannot clear either keeps the layout it had before (the
 * columns come back side by side). A portrait frame (the phone, approved
 * frame f) never gets here: its chrome already stacks under the face.
 *
 * Game case: both. Shared pause plumbing (CHK-020); the case that reaches it
 * today is FFX-2 Paine, and the rule does not name her.
 *
 * Pure: no DOM. The screen hands in the measurer and the switch.
 */

import { faceInFrame, faceOverlap, faceRectOn, type FaceBox, type Rect } from './faceClear.ts';
import { frameFace, type FramedBox } from './faceSlide.ts';
import type { PlateBox, PlateFraming } from './plates.ts';

type Framing = Pick<PlateFraming, 'x' | 'y' | 'side'>;

/**
 * Turns the stacked column on or off. Turning it on returns `false` when the
 * stack does not fit (it would run into the tab strip or the objective, or out
 * of the frame); turning it off always succeeds.
 */
export type StackHost = (on: boolean) => boolean;

/**
 * Whether a framing clears the face: B's slide (which keeps at least half the
 * margin by construction), or no chrome within the pause's full margin and the
 * whole face on screen, through the push-in.
 */
export function clearsFace(box: FramedBox, face: FaceBox, frameW: number, frameH: number, blocks: readonly Rect[]): boolean {
  if (box.slid) return true;
  return faceOverlap(faceRectOn(box, face), blocks) === 0 && faceInFrame(box, face, frameW, frameH);
}

/** Whether chrome sits on the face itself (zero margin, through the push-in): the only case the stack is for. */
export function coversFace(box: FramedBox, face: FaceBox, blocks: readonly Rect[]): boolean {
  return !box.slid && faceOverlap(faceRectOn(box, face), blocks, 0) > 0;
}

/** What {@link chromeFor} laid out: the chrome to frame against, and the two columns it measured on the way. */
export interface ChromeChoice {
  /** The member chrome as it now stands, or `null` when none is up. */
  blocks: Rect[] | null;
  /** The two columns side by side, as measured this time (equal to `blocks` unless stacked). */
  flat: Rect[] | null;
}

/**
 * The member chrome the plate should be framed against, laying it out first:
 * the two columns side by side, or the stacked column when only that clears
 * the face. `blocks` is `null` when no member chrome is up (a fixed tab, `H`,
 * photo mode): the stack is then left as it was, so nothing moves under a
 * change that had nothing to do with the member.
 */
export function chromeFor(
  base: PlateBox,
  f: Framing,
  face: FaceBox | undefined,
  frameW: number,
  frameH: number,
  measure: () => Rect[] | null,
  stack: StackHost | undefined,
): ChromeChoice {
  const plain = (blocks: Rect[] | null): ChromeChoice => ({ blocks, flat: blocks });
  if (!stack) return plain(measure());
  if (!measure()) return plain(null);
  stack(false);
  const flat = measure();
  if (!flat || !face || frameW < frameH) return plain(flat);
  if (!coversFace(frameFace(base, f, face, frameW, frameH, flat), face, flat)) return plain(flat);
  if (stack(true)) {
    const stacked = measure();
    if (stacked && clearsFace(frameFace(base, f, face, frameW, frameH, stacked), face, frameW, frameH, stacked)) {
      return { blocks: stacked, flat };
    }
  }
  stack(false);
  return plain(flat);
}
