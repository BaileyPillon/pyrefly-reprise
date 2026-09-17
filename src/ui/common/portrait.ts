/**
 * Shared portrait-image markup: `public/art/portraits/<id>.png` when present,
 * silently absent otherwise (no broken-image icon). Same `onerror` trick
 * `HudMock` uses for its CTB icons, pulled out so `DialogueBox` and
 * `ChapterSelectScreen`/`ResultsScreen` don't each reinvent it.
 *
 * Also the single source of truth for the **head crop**: the paintings are
 * generated one character at a time, so the head sits at a different size and
 * height in every file. `object-fit: cover` alone therefore gives a roster of
 * mismatched faces (Tidus filling his tile, Auron a head-and-shoulders two
 * sizes down, Kimahri's muzzle shoved to the left edge). {@link faceImgHtml}
 * places the painting from the measured eye line instead, so every face in a
 * square frame comes out at the same head scale with its eyes on one line.
 */

import { artUrl } from '../../engine/PaintedArt.ts';

/** `<img>` markup for a portrait, or `''` when `id` is falsy. Removes itself on a 404. */
export function portraitImgHtml(id: string | undefined, alt = ''): string {
  if (!id) return '';
  const src = artUrl(`art/portraits/${id}.png`);
  return `<img src="${src}" alt="${alt}" draggable="false" onerror="this.remove()" />`;
}

/** `<img>` markup for a chapter-select/results backdrop thumbnail. Same miss behaviour. */
export function backdropImgHtml(sceneKey: string | undefined, alt = ''): string {
  if (!sceneKey) return '';
  const src = artUrl(`art/backdrops/${sceneKey}.png`);
  return `<img src="${src}" alt="${alt}" draggable="false" onerror="this.remove()" />`;
}

// ------------------------------------------------------------------ head crop

/**
 * Where a portrait's head is, measured off the painting itself.
 *
 * - `fx`, `fy` — the midpoint between the eyes, as a fraction of the file's
 *   width and height. (A three-quarter view like Kimahri's or Rikku's puts
 *   this well off centre; that is the whole point of the table.)
 * - `ipd` — the eye-to-eye distance as a fraction of the file's **width**.
 *   It is the scale handle: a painting with a small `ipd` is a wide shot and
 *   has to be blown up further to match the rest of the roster.
 * - `aspect` — `width / height` of the file, so the vertical placement can be
 *   worked out from a width-relative scale.
 *
 * Measured off `public/art/portraits/*.png` (2026-09-16), then corrected over
 * four passes of a calibration rig: each portrait rendered through the
 * geometry below into a 600 px reference tile with the target eye line and the
 * target eye-to-eye ticks drawn on top, so a row is right when the pupils sit
 * on the crosshairs rather than when it looks about right. A row within ~1 % of
 * the tile is converged — that is a third of a pixel at the 42 px tile these
 * actually render at. For a rolled head (Wakka, Lulu) the scale handle is the
 * true eye-to-eye distance, the diagonal, not its horizontal projection.
 *
 * They are generated art: if the art fleet re-rolls a portrait, re-measure that
 * row. An unknown id falls back to {@link DEFAULT_CROP}, which is the average
 * of the FFX party — a missed row is a slightly-off crop, never a broken one.
 */
export interface PortraitCrop {
  fx: number;
  fy: number;
  ipd: number;
  aspect: number;
}

const DEFAULT_CROP: PortraitCrop = { fx: 0.5, fy: 0.353, ipd: 0.275, aspect: 832 / 1216 };

const CROPS: Readonly<Record<string, PortraitCrop>> = {
  tidus: { fx: 0.495, fy: 0.3608, ipd: 0.3093, aspect: 832 / 1216 },
  yuna: { fx: 0.5765, fy: 0.3614, ipd: 0.319, aspect: 832 / 1216 },
  auron: { fx: 0.3422, fy: 0.2749, ipd: 0.2338, aspect: 671 / 1216 },
  // Anthro muzzle in three-quarter view: one eye visible, so `fx`/`ipd` are the
  // human-equivalent values that land his head at the roster's scale, and the
  // eye line is set from that one eye.
  kimahri: { fx: 0.28, fy: 0.3455, ipd: 0.225, aspect: 832 / 1216 },
  // Wakka's head is rolled ~25deg and Lulu's ~18: the eye midpoint carries the
  // line, and the diagonal eye-to-eye distance carries the scale.
  wakka: { fx: 0.481, fy: 0.3885, ipd: 0.288, aspect: 832 / 1216 },
  lulu: { fx: 0.4828, fy: 0.3968, ipd: 0.2896, aspect: 832 / 1216 },
  rikku: { fx: 0.3594, fy: 0.3423, ipd: 0.26, aspect: 830 / 1216 },
  // The bosses and the FFX-2 ghosts are looser shots than the party's tight
  // close-ups, so their heads sit much smaller in the file and their rows carry
  // much smaller `ipd`s. Seymour and Shuyin are near-profile and Lenne is a deep
  // three-quarter: only one eye is on camera, so `fx`/`ipd` there are the
  // human-equivalent values that put the head at the roster's scale, not a
  // literal pupil measurement, and the visible eye carries the line.
  seymour: { fx: 0.435, fy: 0.237, ipd: 0.3, aspect: 832 / 1216 },
  yunalesca: { fx: 0.6786, fy: 0.3662, ipd: 0.192, aspect: 832 / 1216 },
  jecht: { fx: 0.65, fy: 0.3934, ipd: 0.22, aspect: 832 / 1216 },
  shuyin: { fx: 0.497, fy: 0.3655, ipd: 0.34, aspect: 832 / 1216 },
  lenne: { fx: 0.5216, fy: 0.3247, ipd: 0.21, aspect: 832 / 1216 },
};

/** The measured crop for `id`, or the roster average when it has no row. */
export function portraitCrop(id: string | undefined): PortraitCrop {
  return (id && CROPS[id]) || DEFAULT_CROP;
}

export interface FaceOptions {
  /** Rendered eye-to-eye distance as a fraction of the frame's width. */
  ipd?: number;
  /** Where the eye line lands in the frame, as a fraction of its height. */
  eyeY?: number;
  /** Extra class on the `<img>`. */
  className?: string;
}

/** House defaults: the head fills a roster tile without the crown clipping. */
const TARGET_IPD = 0.3;
const TARGET_EYE_Y = 0.42;

/**
 * The inline `style` for a crop, shared by {@link faceImgHtml} (a measured
 * `CROPS` row) and {@link bodyHeadCropStyle} (the generic full-body-painting
 * estimate below) — both place a source image inside a square frame from the
 * same four numbers, they just get those numbers from different places.
 */
function cropStyle(crop: PortraitCrop, opts: FaceOptions): string {
  const w = ((opts.ipd ?? TARGET_IPD) / crop.ipd) * 100;
  const h = w / crop.aspect;
  const left = 50 - crop.fx * w;
  const top = (opts.eyeY ?? TARGET_EYE_Y) * 100 - crop.fy * h;
  return (
    `position:absolute;left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;` +
    `width:${w.toFixed(2)}%;height:auto;max-width:none;object-fit:fill`
  );
}

/**
 * A portrait cropped to the head, for a **square** frame with `overflow:
 * hidden` and `position: relative` (`.prep__face`, the chapter-select party
 * tiles). Every face comes back at the same head scale with its eyes on the
 * same line, whatever the painting behind it does.
 *
 * The geometry is inline because it is per-file data, not per-screen styling:
 * the `<img>` is absolutely positioned and sized in percentages of the frame,
 * so it scales with the letterboxed stage and needs no JS after paint. The
 * frame must be square — `top` resolves against its height, the widths against
 * its width, and the two are assumed equal.
 */
export function faceImgHtml(id: string | undefined, alt = '', opts: FaceOptions = {}): string {
  if (!id) return '';
  const style = cropStyle(portraitCrop(id), opts);
  const cls = opts.className ? ` class="${opts.className}"` : '';
  const src = artUrl(`art/portraits/${id}.png`);
  return `<img${cls} src="${src}" alt="${alt}" draggable="false" style="${style}" onerror="this.remove()" />`;
}

/**
 * Generic head-region crop for a **full-body** character painting
 * (`characters/<id>/idle.png`) — the fallback for an enemy with no
 * dedicated `portraits/<id>.png` and no measured {@link CROPS} row (every
 * boss but Seymour, Yunalesca and Jecht, per `research/visual-bible.md`
 * §3.2/§4.11's "small square portraits" spec).
 *
 * These renders are generated "full body ... centered, straight-on"
 * (`characters/<id>/idle.json`'s own `prompt` field), so the head sits in a
 * narrow top-center band whatever the creature — `[estimate]`, tuned by eye
 * against `mortiorchis`, `seymour-flux` and `vegnagun-body`. `aspect`
 * defaults to the pipeline's common 1216x832 canvas; the caller (the async
 * side of `ui/ffx/portraits.ts`, which owns the DOM wiring) narrows it to
 * the file's own `idle.json` dimensions once that sidecar loads, the same
 * "correct in place, never broken" pattern {@link faceImgHtml} uses for a
 * missing `CROPS` row.
 */
const GENERIC_BODY_HEAD_CROP: Omit<PortraitCrop, 'aspect'> = { fx: 0.5, fy: 0.15, ipd: 0.16 };
const GENERIC_BODY_ASPECT = 1216 / 832;

export function bodyHeadCropStyle(aspect: number = GENERIC_BODY_ASPECT, opts: FaceOptions = {}): string {
  return cropStyle({ ...GENERIC_BODY_HEAD_CROP, aspect }, opts);
}
