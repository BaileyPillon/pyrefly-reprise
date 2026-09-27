/**
 * The CHAPTER tab over a painted face: slide the plate, not the chrome (PR-0171, D-234).
 *
 * Bailey, 26 Sep 2026, *"i'll go with all of your recommends"*, picking option C of
 * `docs/concepts/pause-dossier-2026-09-27/` (the picked frames are `ch{2,9}-{1600,2000}-c-slide.jpg`):
 * the chrome stays exactly as live, and the plate slides right past its left edge under the
 * member-tab rule he picked on 24 Sep 2026 (`faceSlide.ts`, "B as one rule"), until the face
 * clears THIS ENCOUNTER, THE PARTY and the dossier. The plate shrinks only when the face would
 * leave the right edge, and **at most to 0.88x** ({@link CHAPTER_SLIDE_MIN_SCALE}), above the
 * member tabs' 0.755x floor.
 *
 * The dossier is tried where it stands first and then wrapped under the columns, the way
 * `dossierPlace.ts` already wraps it: `beside`, `under`, `under-lean` (no snapshots, which is
 * the picked frame in battle). The first placement a slide inside the bounds clears wins. When
 * none does (a narrow window, the phone), nothing here applies and the tab is as it was.
 *
 * Game case: FFX data on shared chrome. The two plates are FFX paintings (Chapter II shows Yuna,
 * Chapter IX Yojimbo); the rule itself is the shared pause's and names no game (CHK-020).
 */

import { FACE_MARGIN, faceInFrame, faceOverlap, faceRectOn, type FaceBox, type Rect } from './faceClear.ts';
import { frameFace, type FramedBox } from './faceSlide.ts';
import { applyDossier, dossierFits, type DossierPlace } from './dossierPlace.ts';
import { phoneLayout } from './stackColumn.ts';
import type { PlateBox, PlateFraming } from './plates.ts';

/**
 * The faces on the two chapter plates the slide is for, as fractions of the painting, measured
 * off `public/art/pause/<id>.png` on a 2.5 % grid (`tools/zz-b6.tmp/crop.py` frames in the B6
 * handoff).
 */
export const CHAPTER_SLIDE_FACES: Readonly<Record<string, FaceBox>> = {
  // Chapter II (Yuna, three-quarter turn): the round-13 face region the critic checks PR-0171
  // against (hairline 0.18 to chin 0.60, the hair at her near cheek 0.37 to past the far jaw
  // 0.70). Wider than her face alone (0.43 to 0.67), so the check and the rule are one box.
  'ch2-yunalesca': { x0: 0.37, x1: 0.7, y0: 0.18, y1: 0.6 },
  // Chapter IX: the mask itself, under the hat brim 0.2 to the lowest tooth 0.78 (the round-13
  // box stopped at 0.7, above the teeth), the left horn 0.41 to the far edge 0.72 (the round-13
  // box's 0.40 to 0.74 took in hat and collar, and no slide inside 0.88x clears it in battle at
  // 1600x900).
  'ch9-yojimbo': { x0: 0.41, x1: 0.72, y0: 0.2, y1: 0.78 },
};

/** D-234: "at most down to 0.88x" of the approved framing. */
export const CHAPTER_SLIDE_MIN_SCALE = 0.88;

/** Where the dossier is tried, in order. `heading` is the face rule's fallback, not a slide. */
export const CHAPTER_SLIDE_PLACES: readonly DossierPlace[] = ['beside', 'under', 'under-lean'];

/** Whole-element boxes: THIS ENCOUNTER, THE PARTY, the tab strip and the prompts. */
const BOX_SELECTOR = ".pause__col:not([data-col='dossier']), .pause__tab, .pause__bump, .pause__back, .pause__hide";
/** Text boxes, by their ink: the dossier's heading, the brand, the eyebrow and the objective line. */
const TEXT_SELECTOR = ".pause__col[data-col='dossier'] > h3, .pause__eyebrow, .pause__line, .pause__brand";
/** The dossier's own blocks. */
const DOSSIER_SELECTOR = ".pause__col[data-col='dossier'] .pause__quote, .pause__col[data-col='dossier'] .pause__snap";

function textRect(el: Element): DOMRect {
  const range = document.createRange();
  if (typeof range.getBoundingClientRect !== 'function') return el.getBoundingClientRect();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}

/**
 * The CHAPTER tab's chrome as laid out now, relative to `frame`. The dossier column is measured
 * by its blocks, not its box: wrapped under the columns it is a full-width row, and its box
 * would cover the face whatever the plate did.
 */
export function chapterChromeBoxes(root: HTMLElement, frame: HTMLElement): Rect[] {
  const origin = frame.getBoundingClientRect();
  const out: Rect[] = [];
  const add = (r: DOMRect): void => {
    if (r.width <= 0 || r.height <= 0) return;
    out.push({ left: r.left - origin.left, right: r.right - origin.left, top: r.top - origin.top, bottom: r.bottom - origin.top });
  };
  root.querySelectorAll(BOX_SELECTOR).forEach((el) => add(el.getBoundingClientRect()));
  root.querySelectorAll(DOSSIER_SELECTOR).forEach((el) => add(el.getBoundingClientRect()));
  root.querySelectorAll(TEXT_SELECTOR).forEach((el) => add(textRect(el)));
  return out;
}

/** A framing clears when no chrome is within half the pause's margin of the face, and the face stays on screen. */
export function slideClears(box: PlateBox, face: FaceBox, blocks: readonly Rect[], frameW: number, frameH: number): boolean {
  return faceOverlap(faceRectOn(box, face), blocks, FACE_MARGIN / 2) === 0 && faceInFrame(box, face, frameW, frameH);
}

/**
 * The slid framing for a chapter plate on the CHAPTER tab, with the dossier laid out to match,
 * or `null` (and the dossier back beside the columns, as live) when the rule does not apply or
 * no placement clears inside the bounds.
 */
export function slideChapterPlate(
  root: HTMLElement,
  art: HTMLElement,
  id: string,
  base: PlateBox,
  f: PlateFraming,
  frameW: number,
  frameH: number,
): FramedBox | null {
  delete root.dataset['dossierSlid'];
  const face = CHAPTER_SLIDE_FACES[id];
  const body = root.querySelector<HTMLElement>('[data-role="body"]');
  if (!face || body?.dataset['tab'] !== 'chapter' || frameW < frameH || phoneLayout(root)) return null;
  for (const place of CHAPTER_SLIDE_PLACES) {
    const m = applyDossier(root, art, place);
    if (m && !dossierFits(m)) continue;
    const blocks = chapterChromeBoxes(root, art);
    const box = frameFace(base, f, face, frameW, frameH, blocks, CHAPTER_SLIDE_MIN_SCALE);
    if (slideClears(box, face, blocks, frameW, frameH)) {
      root.dataset['dossierSlid'] = id;
      return box;
    }
    if (!m) break; // no dossier on the tab: the other placements are the same chrome
  }
  applyDossier(root, art, 'beside');
  return null;
}
