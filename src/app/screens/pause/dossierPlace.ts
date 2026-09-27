/**
 * Where the CHAPTER tab's dossier (the location heading, the quote and the
 * three snapshots) stands, so it never sits on a chapter plate's face.
 *
 * FOC16-02 (release 16 focused review, `critic/reviews/fc7f1a20-focused.md`):
 * Chapter XIII's hero plate B (Bailey's pick, 2026-09-25) puts Trema's face
 * right of centre, and the dossier, the third column beside THIS ENCOUNTER
 * and THE PARTY, laid the snapshots across his eyes at 1600x900 and 2000x1012.
 * The picked frame (`docs/concepts/chapters/trema/hero-plate/b-pause.jpg`)
 * keeps the face clear. The plate cannot pan far enough to clear it (its left
 * edge is within 73 px of the clamp; the plate's README), and the locked PNG is
 * not edited, so the chrome moves instead: Bailey's standing rule for these
 * plates is that the text sits on whichever side of the painting is empty
 * (`faceClear.ts`), and on this plate that is the left.
 *
 * The placements, tried in order, the first that clears wins:
 *
 * 1. `beside`: the three columns as they always were (every plate with no
 *    face box here, and this one wherever the face already clears: 1280x720);
 * 2. `under`: the dossier wraps under the two columns, quote beside snapshots,
 *    the body rising (never above the tab strip) only as far as the objective
 *    demands, the way option A's stacked column does;
 * 3. `under-lean`: the same without the snapshots;
 * 4. `heading`: the heading alone, which is the picked frame as drawn.
 *
 * A placement clears when none of its ink comes within the pause's face
 * margin of the face (through the slow push-in, as `faceClear` measures it),
 * and all of it stays above the objective and inside the frame. The phone
 * stylesheet already stacks the chrome under the face (approved frame f), so
 * nothing moves there.
 *
 * Game case: both (shared pause plumbing, CHK-020); the only plate with a face
 * box today is Chapter XIII's, FFX-2 only, so no other chapter's tab changes.
 */

import '../../../ui/common/pause-chapter.css';
import { FACE_MARGIN, faceOverlap, faceRectOn, type FaceBox, type Rect } from './faceClear.ts';
import { phoneLayout, STACK_AIR } from './stackColumn.ts';

/**
 * Chapter plates' faces, as fractions of the painting (brow to chin, cheek to
 * cheek, hair and hat outside), measured off `public/art/pause/<id>.png` on a
 * 5 % grid as `faceClear.FACE_BOXES` is.
 */
export const CHAPTER_FACE_BOXES: Readonly<Record<string, FaceBox>> = {
  // Plate B: brow 0.42 (above the eyebrows, under the hat band), chin 0.68 (in the beard),
  // ear edge 0.49 to the far cheek 0.67.
  'ch13-trema': { x0: 0.49, x1: 0.67, y0: 0.42, y1: 0.68 },
  // Chapter X plate B (FFX only; D-156): Natus's face, centred. Brow 0.25 (under the swept crest),
  // chin 0.55, cheek to cheek 0.40 to 0.60. The dossier laid its quote and snapshots across his
  // right eye at 1600x900 (docs/concepts/chapters/natus/ship/).
  'ch10-seymour-natus': { x0: 0.4, x1: 0.6, y0: 0.25, y1: 0.55 },
};

export type DossierPlace = 'beside' | 'under' | 'under-lean' | 'heading';

/** In the order they are tried. `heading` always fits: it is the fallback. */
export const DOSSIER_PLACES: readonly DossierPlace[] = ['beside', 'under', 'under-lean', 'heading'];

/** What one placement measured: the dossier's ink, and the line it must stay above. */
export interface DossierMeasure {
  ink: readonly Rect[];
  /** The objective's top less the pause's air; the frame's bottom when there is no objective. */
  floor: number;
  /** The frame's width. */
  width: number;
}

/** Whether a measured placement keeps the face clear and fits the frame. */
export function dossierClears(face: Rect, m: DossierMeasure): boolean {
  if (faceOverlap(face, m.ink, FACE_MARGIN) > 0) return false;
  return m.ink.every((r) => r.bottom <= m.floor && r.left >= 0 && r.right <= m.width);
}

/** The first placement that clears the face; `heading` when none does. Pure: the caller measures. */
export function chooseDossier(face: Rect, measure: (p: DossierPlace) => DossierMeasure | null): DossierPlace {
  for (const p of DOSSIER_PLACES) {
    if (p === 'heading') return p;
    const m = measure(p);
    if (m && dossierClears(face, m)) return p;
  }
  return 'heading';
}

const CLASS: Readonly<Record<Exclude<DossierPlace, 'beside'>, string>> = {
  under: 'pause--dossier-under',
  'under-lean': 'pause--dossier-under pause--dossier-lean',
  heading: 'pause--dossier-heading',
};
const ALL_CLASSES = ['pause--dossier-under', 'pause--dossier-lean', 'pause--dossier-heading'];

function setPlace(root: HTMLElement, p: DossierPlace): void {
  root.querySelector<HTMLElement>('[data-role="body"]')?.style.removeProperty('--pu-dossier-top');
  root.classList.remove(...ALL_CLASSES);
  if (p !== 'beside') root.classList.add(...CLASS[p].split(' '));
  root.dataset['dossier'] = p;
}

function relative(r: DOMRect, origin: DOMRect): Rect {
  return { left: r.left - origin.left, right: r.right - origin.left, top: r.top - origin.top, bottom: r.bottom - origin.top };
}

/** The plate's own box in `art`'s pixels, as `PortraitStage.place` set it; null when it is not placed. */
function plateBox(plate: HTMLElement): { left: number; top: number; width: number; height: number } | null {
  const n = (v: string): number => parseFloat(v);
  const box = { left: n(plate.style.left), top: n(plate.style.top), width: n(plate.style.width), height: n(plate.style.height) };
  return Object.values(box).every(Number.isFinite) && box.width > 0 && box.height > 0 ? box : null;
}

/**
 * Place the dossier for the plate on screen, or put it back beside the columns
 * when the CHAPTER tab is not up, the plate has no face box, or the phone
 * stylesheet lays the screen out. Returns the placement, or `null` when there
 * was nothing to place.
 */
export function placeDossier(root: HTMLElement, art: HTMLElement, plate: HTMLImageElement | null): DossierPlace | null {
  const body = root.querySelector<HTMLElement>('[data-role="body"]');
  const col = body?.querySelector<HTMLElement>('.pause__col[data-col="dossier"]') ?? null;
  const id = plate?.dataset['plate'] ?? '';
  const face = CHAPTER_FACE_BOXES[id];
  const box = plate && face && plate.dataset['art'] !== 'fallback' && plate.dataset['art'] !== 'missing' ? plateBox(plate) : null;
  if (!body || body.dataset['tab'] !== 'chapter' || !col || !face || !box || phoneLayout(root)) {
    setPlace(root, 'beside');
    return col ? 'beside' : null;
  }
  const faceRect = faceRectOn(box, face);
  const origin = art.getBoundingClientRect();
  const obj = root.querySelector<HTMLElement>('[data-role="obj"]')?.getBoundingClientRect();
  const floor = obj && obj.height > 0 ? obj.top - origin.top - STACK_AIR : origin.height - STACK_AIR;
  const tabs = root.querySelector<HTMLElement>('[data-role="tabs"]')?.getBoundingClientRect();
  const ceiling = (tabs && tabs.height > 0 ? tabs.bottom - origin.top : 0) + STACK_AIR;
  const inkOf = (): Rect[] => {
    const ink: Rect[] = [];
    for (const el of col.querySelectorAll<HTMLElement>(':scope > h3, .pause__quote, .pause__snap')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) ink.push(relative(r, origin));
    }
    return ink;
  };
  const measure = (p: DossierPlace): DossierMeasure | null => {
    setPlace(root, p);
    let ink = inkOf();
    if (ink.length === 0) return null;
    // Under the columns, the body rises only as far as the objective demands and never
    // above the tab strip, as option A's stacked column does (`stackColumn.ts`).
    const over = Math.max(...ink.map((r) => r.bottom)) - floor;
    const top = parseFloat(getComputedStyle(body).top);
    const bodyTop = body.getBoundingClientRect().top - origin.top;
    if (p !== 'beside' && over > 0 && Number.isFinite(top) && bodyTop - over >= ceiling) {
      body.style.setProperty('--pu-dossier-top', `${(top - over).toFixed(1)}px`);
      ink = inkOf();
    }
    return { ink, floor, width: origin.width };
  };
  const chosen = chooseDossier(faceRect, measure);
  // Measured last, so a raise the chosen placement needed is the one left standing.
  if (chosen === 'heading') setPlace(root, chosen);
  else measure(chosen);
  return chosen;
}
