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

import { manifestKnowsAssetNow } from '../../engine/ArtManifest.ts';
import { artUrl } from '../../engine/PaintedArt.ts';

/**
 * Skip an `<img>` for art the build-time manifest says is not there.
 *
 * `onerror="this.remove()"` already made a miss *invisible*; it did not make it
 * *free*, and every one of those misses is a 404 in the live site's network
 * panel (`docs/handoff/adv-art-manifest.md`). Asking `public/art/manifest.json`
 * first turns "remove it after it fails" into "never ask". Returns false —
 * i.e. emit the `<img>` and let `onerror` handle it — whenever the manifest has
 * not loaded or has no opinion, so nothing here can hide art on a race.
 */
function knownAbsent(path: string): boolean {
  return manifestKnowsAssetNow(artUrl(path)) === false;
}

/** True when the manifest positively says this art is there. */
function knownPresent(path: string): boolean {
  return manifestKnowsAssetNow(artUrl(path)) === true;
}

/** `<img>` markup for a portrait, or `''` when `id` is falsy. Removes itself on a 404. */
export function portraitImgHtml(id: string | undefined, alt = ''): string {
  if (!id || knownAbsent(`art/portraits/${id}.png`)) return '';
  const src = artUrl(`art/portraits/${id}.png`);
  return `<img src="${src}" alt="${alt}" draggable="false" onerror="this.remove()" />`;
}

/** `<img>` markup for a chapter-select/results backdrop thumbnail. Same miss behaviour. */
export function backdropImgHtml(sceneKey: string | undefined, alt = ''): string {
  if (!sceneKey || knownAbsent(`art/backdrops/${sceneKey}.png`)) return '';
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
 * - `aspect` — `width / height` of the file. It is only the *starting guess*
 *   now: {@link refineFaceCrop} replaces it with the loaded image's true
 *   `naturalWidth / naturalHeight` as soon as the bytes land (see below).
 *
 * Re-measured 2026-09-18 against the current files, off a calibration rig:
 * each portrait rendered through the geometry below into a 320 px reference
 * tile with the target eye line and eye-to-eye ticks drawn on top, so a row is
 * right when the pupils sit on the crosshairs rather than when it looks about
 * right. For a rolled head (Wakka, Rikku, Yunalesca) the scale handle is the
 * true eye-to-eye distance, the diagonal, not its horizontal projection; for a
 * near-profile (Kimahri, Seymour) only one eye is on camera and the pair are
 * the human-equivalent values that land the head at the roster's scale.
 *
 * **These rows go stale the moment the art fleet re-rolls a painting**, which
 * is exactly how Auron ended up cropped through the chin: his row was measured
 * on 2026-09-16 against a 671x1216 file and every portrait in the game was
 * regenerated on 2026-09-18. Two things now keep a stale row from cutting a
 * face rather than merely mis-centring it:
 *
 * 1. the aspect is taken from the file, never from the row ({@link refineFaceCrop});
 * 2. {@link cropStyle} clamps the placement so the painting always covers the
 *    frame, and {@link DEFAULT_CROP} — what an unknown id gets — is a plain
 *    top-biased crop rather than a guess at somebody's eye line.
 *
 * A painting can also carry its own focal data and skip the table entirely:
 * see {@link portraitFocal}.
 */
export interface PortraitCrop {
  fx: number;
  fy: number;
  ipd: number;
  aspect: number;
}

/** The pipeline's usual portrait canvas, and the starting guess for any row. */
const CANVAS_ASPECT = 832 / 1216;

/**
 * No measured row: fit the width and bias to the top of the painting.
 *
 * `ipd` 0.30 is `TARGET_IPD`, i.e. "do not scale this painting at all", and
 * `fy` 0.295 lands the top edge of the file a hair above the top of the frame.
 * Every portrait in the pipeline is a head-and-shoulders or a creature's head
 * in the upper half of a tall canvas, so the top band is where a face is even
 * when nobody has measured one — and unlike the old roster-average row it can
 * never blow an unmeasured painting up to five times the frame.
 */
const DEFAULT_CROP: PortraitCrop = { fx: 0.5, fy: 0.295, ipd: 0.3, aspect: CANVAS_ASPECT };

const CROPS: Readonly<Record<string, PortraitCrop>> = {
  tidus: { fx: 0.4, fy: 0.328, ipd: 0.22, aspect: CANVAS_ASPECT },
  yuna: { fx: 0.379, fy: 0.343, ipd: 0.243, aspect: CANVAS_ASPECT },
  auron: { fx: 0.31, fy: 0.4735, ipd: 0.265, aspect: CANVAS_ASPECT },
  // Anthro muzzle in near profile: one eye visible, so `fx`/`ipd` are the
  // human-equivalent values that land his head at the roster's scale, and the
  // eye line is set from that one eye.
  kimahri: { fx: 0.6, fy: 0.335, ipd: 0.19, aspect: CANVAS_ASPECT },
  wakka: { fx: 0.325, fy: 0.3, ipd: 0.241, aspect: CANVAS_ASPECT },
  lulu: { fx: 0.681, fy: 0.37, ipd: 0.211, aspect: CANVAS_ASPECT },
  rikku: { fx: 0.55, fy: 0.538, ipd: 0.267, aspect: CANVAS_ASPECT },
  // Seymour is near-profile like Kimahri; the rest are three-quarter views with
  // both eyes on camera.
  seymour: { fx: 0.67, fy: 0.36, ipd: 0.173, aspect: CANVAS_ASPECT },
  yunalesca: { fx: 0.621, fy: 0.358, ipd: 0.245, aspect: CANVAS_ASPECT },
  jecht: { fx: 0.695, fy: 0.2275, ipd: 0.19, aspect: CANVAS_ASPECT },
};

/** The measured crop for `id`, or the top-biased fallback when it has no row. */
export function portraitCrop(id: string | undefined): PortraitCrop {
  return (id && CROPS[id]) || DEFAULT_CROP;
}

/** Ids with a measured row, for the guard test. */
export function measuredPortraitIds(): string[] {
  return Object.keys(CROPS);
}

export interface FaceOptions {
  /** Rendered eye-to-eye distance as a fraction of the frame's width. */
  ipd?: number;
  /** Where the eye line lands in the frame, as a fraction of its height. */
  eyeY?: number;
  /** Extra class on the `<img>`. */
  className?: string;
  /**
   * `z-index` for the `<img>`, for a frame that stacks a monogram, a body crop
   * and a portrait in one tile and needs the better art to win on paint order
   * (`ui/ffx/portraits.ts` does this by hand; FFX-2's party rows ask for it
   * here). Everything in such a frame must be positioned — see
   * {@link faceCropStyle}.
   */
  z?: number;
}

/** House defaults: the head fills a roster tile without the crown clipping. */
const TARGET_IPD = 0.3;
const TARGET_EYE_Y = 0.42;

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * The inline `style` for a crop, shared by {@link faceImgHtml} (a measured
 * `CROPS` row) and {@link bodyHeadCropStyle} (the generic full-body-painting
 * estimate below) — both place a source image inside a square frame from the
 * same four numbers, they just get those numbers from different places.
 *
 * The placement is **clamped to cover the frame**. Without it a row that
 * over-estimates the head scale (or an unmeasured painting that is wider than
 * the canvas it was measured on) leaves bare frame down one edge or under the
 * chin — which is what a stale row looked like on the live build. Clamped, the
 * worst a wrong row can do is put the head off centre.
 */
function cropStyle(crop: PortraitCrop, opts: FaceOptions): string {
  let w = ((opts.ipd ?? TARGET_IPD) / crop.ipd) * 100;
  let h = w / crop.aspect;
  const grow = Math.max(1, 100 / w, 100 / h);
  w *= grow;
  h *= grow;
  const left = clamp(100 - w, 0, 50 - crop.fx * w);
  const top = clamp(100 - h, 0, (opts.eyeY ?? TARGET_EYE_Y) * 100 - crop.fy * h);
  return (
    `position:absolute;left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;` +
    `width:${w.toFixed(2)}%;height:auto;max-width:none;object-fit:fill`
  );
}

/** `cropStyle`'s numbers, applied to a live element without clobbering its other declarations. */
function applyCrop(img: HTMLImageElement, crop: PortraitCrop, opts: FaceOptions): void {
  for (const decl of cropStyle(crop, opts).split(';')) {
    const at = decl.indexOf(':');
    if (at > 0) img.style.setProperty(decl.slice(0, at), decl.slice(at + 1));
  }
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
 *
 * The `data-face-crop` attribute is what lets {@link refineFaceCrop} correct
 * the geometry from the file itself once the bytes land; the markup is right
 * without it, and righter with it.
 */
export function faceImgHtml(id: string | undefined, alt = '', opts: FaceOptions = {}): string {
  if (!id || knownAbsent(`art/portraits/${id}.png`)) return '';
  const style = faceCropStyle(id, opts) + zDecl(opts);
  const cls = opts.className ? ` class="${opts.className}"` : '';
  const src = artUrl(`art/portraits/${id}.png`);
  scheduleFaceCropSweep();
  return (
    `<img${cls} src="${src}" alt="${alt}" draggable="false" style="${style}"` +
    ` data-face-crop="${id}"${faceOptAttrs(opts)} onerror="this.remove()" />`
  );
}

/**
 * The first of `ids` the manifest has art for, as a face `<img>`.
 *
 * FFX-2 asks this: Yuna in a dressphere wants `yuna-<dressphere>` if the fleet
 * has painted one, then her plain portrait, and Paine — who has no
 * `portraits/paine.png` at all yet — falls through to the head of her own
 * full-body dressphere painting ({@link bodyFaceImgHtml}). Returns `''` when
 * the manifest knows none of them, which is the caller's cue to draw its own
 * fallback chip.
 */
export function faceImgHtmlFrom(ids: readonly string[], alt = '', opts: FaceOptions = {}): string {
  for (const id of ids) {
    if (knownPresent(`art/portraits/${id}.png`)) return faceImgHtml(id, alt, opts);
  }
  // No manifest yet (a cold first frame, or a hand-built server): emit the
  // *last* candidate that is not known-absent and let `onerror` sort it out.
  // The list runs most specific first, and on a cold manifest the generic id
  // is the one most likely to be on disk — a miss here draws no face at all,
  // where a miss on the specific one costs nothing.
  const fallback = [...ids].reverse().find((id) => !knownAbsent(`art/portraits/${id}.png`));
  return fallback ? faceImgHtml(fallback, alt, opts) : '';
}

/** The `z-index` declaration for a stacked tile, or nothing. */
function zDecl(opts: FaceOptions): string {
  return opts.z === undefined ? '' : `;z-index:${opts.z}`;
}

/** `data-face-*` attributes carrying non-default options through to the refinement pass. */
function faceOptAttrs(opts: FaceOptions): string {
  return (
    (opts.ipd !== undefined ? ` data-face-ipd="${opts.ipd}"` : '') +
    (opts.eyeY !== undefined ? ` data-face-eye="${opts.eyeY}"` : '')
  );
}

/**
 * The inline `style` {@link faceImgHtml} puts on its `<img>`, on its own, for a
 * caller that builds the element itself — `ui/ffx/portraits.ts`, whose chips
 * stack three layers in one frame and need to add a `z-index` to this.
 *
 * Note the `position: absolute` in what comes back: that is not decoration.
 * Anything that shares a frame with a chip layer has to be positioned too, or
 * the browser paints the positioned layers over it whatever the DOM order says
 * — which is exactly the bug that left the FFX CTB tiles showing their ink
 * monogram on top of a perfectly good portrait (docs/handoff/bp1-portrait-basepath.md).
 */
export function faceCropStyle(id: string | undefined, opts: FaceOptions = {}): string {
  return cropStyle(portraitCrop(id), opts);
}

/**
 * Generic head-region crop for a **full-body** character painting
 * (`characters/<id>/idle.png`) — the fallback for a fighter with no
 * dedicated `portraits/<id>.png` and no measured {@link CROPS} row (every
 * boss but Seymour, Yunalesca and Jecht, and every FFX-2 girl in a dressphere
 * the fleet has not painted a portrait for, per `research/visual-bible.md`
 * §3.2/§4.11's "small square portraits" spec).
 *
 * These renders are cropped to the figure, head at the top ("full body ...
 * centered, straight-on", `characters/<id>/idle.json`'s own `prompt`), so the
 * head sits in a narrow top-center band whatever the creature —
 * `[estimate]`, tuned by eye against `mortiorchis`, `seymour-flux` and
 * `vegnagun-body`. `aspect` defaults to the pipeline's common 1216x832 canvas;
 * a caller that renders through {@link bodyFaceImgHtml} gets the file's real
 * aspect substituted as soon as the image loads, the same "correct in place,
 * never broken" pattern {@link faceImgHtml} uses for a stale `CROPS` row.
 */
const GENERIC_BODY_HEAD_CROP: Omit<PortraitCrop, 'aspect'> = { fx: 0.5, fy: 0.15, ipd: 0.16 };
const GENERIC_BODY_ASPECT = 1216 / 832;

export function bodyHeadCropStyle(aspect: number = GENERIC_BODY_ASPECT, opts: FaceOptions = {}): string {
  return cropStyle({ ...GENERIC_BODY_HEAD_CROP, aspect }, opts);
}

/**
 * The head of a full-body painting as a face `<img>`, for a fighter with no
 * portrait file. Same square-frame contract as {@link faceImgHtml}.
 */
export function bodyFaceImgHtml(subjectId: string | undefined, alt = '', opts: FaceOptions = {}): string {
  if (!subjectId || knownAbsent(`art/characters/${subjectId}/idle.png`)) return '';
  const cls = opts.className ? ` class="${opts.className}"` : '';
  const src = artUrl(`art/characters/${subjectId}/idle.png`);
  scheduleFaceCropSweep();
  return (
    `<img${cls} src="${src}" alt="${alt}" draggable="false" style="${bodyHeadCropStyle(undefined, opts)}${zDecl(opts)}"` +
    ` data-face-crop="${subjectId}" data-face-body="1"${faceOptAttrs(opts)} onerror="this.remove()" />`
  );
}

// ------------------------------------------------- correction from the file

/**
 * Optional focal data shipped beside a painting:
 * `public/art/portraits/<id>.json` with a `focal: { fx, fy, ipd }` block, in
 * the same units as {@link PortraitCrop}.
 *
 * Nothing emits one yet — the pipeline writes the generation parameters and
 * `width`/`height` only — but when the fleet starts measuring a face at render
 * time this is where it lands, and it wins over the table, which is the only
 * way a re-rolled painting can ever be right without a human re-measuring it
 * (see `docs/handoff/fix3-ffx2-hud-prep.md`). Asked for once per id, lazily,
 * and only for a portrait actually on screen; a miss is cached as "no focal"
 * so a site without sidecars asks once and never again.
 */
interface PortraitSidecar {
  focal?: { fx?: number; fy?: number; ipd?: number };
}

const focals = new Map<string, Promise<Omit<PortraitCrop, 'aspect'> | null>>();

export function portraitFocal(id: string): Promise<Omit<PortraitCrop, 'aspect'> | null> {
  const cached = focals.get(id);
  if (cached) return cached;
  const pending = (async (): Promise<Omit<PortraitCrop, 'aspect'> | null> => {
    if (typeof fetch !== 'function') return null;
    try {
      const res = await fetch(artUrl(`art/portraits/${id}.json`), { cache: 'force-cache' });
      if (!res.ok) return null;
      const focal = ((await res.json()) as PortraitSidecar).focal;
      if (!focal) return null;
      const { fx, fy, ipd } = focal;
      if (!isFraction(fx) || !isFraction(fy) || !isFraction(ipd) || ipd <= 0) return null;
      return { fx, fy, ipd };
    } catch {
      // A dev server answers a missing sidecar with `index.html` and a 200, so
      // the JSON parse is the honest check — same trap `ArtManifest` documents.
      return null;
    }
  })();
  focals.set(id, pending);
  return pending;
}

function isFraction(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
}

/**
 * Re-place one loaded portrait from what the file actually is.
 *
 * The markup's inline style assumed the pipeline's canvas; this swaps in the
 * image's real `naturalWidth / naturalHeight`, which is the half of a stale row
 * that actually cuts a face (Auron's row was measured on a 671x1216 file and
 * the painting is 832x1216: the assumed frame was 24 % too tall, so his eye
 * line landed a fifth of a tile below where it belongs and the crop ran off his
 * chin). Then, if the painting ships focal data, that replaces the row too.
 */
export function refineFaceCrop(img: HTMLImageElement): void {
  const id = img.getAttribute('data-face-crop');
  if (!id || !img.naturalWidth || !img.naturalHeight) return;
  const aspect = img.naturalWidth / img.naturalHeight;
  const opts: FaceOptions = {};
  const ipd = Number(img.getAttribute('data-face-ipd'));
  if (Number.isFinite(ipd) && ipd > 0) opts.ipd = ipd;
  const eyeY = Number(img.getAttribute('data-face-eye'));
  if (Number.isFinite(eyeY) && eyeY > 0) opts.eyeY = eyeY;

  if (img.hasAttribute('data-face-body')) {
    applyCrop(img, { ...GENERIC_BODY_HEAD_CROP, aspect }, opts);
    return;
  }
  applyCrop(img, { ...portraitCrop(id), aspect }, opts);
  void portraitFocal(id).then((focal) => {
    if (focal && img.isConnected) applyCrop(img, { ...focal, aspect }, opts);
  });
}

let sweepPending = false;

/**
 * Catch up with every portrait already in the DOM.
 *
 * The `load` listener below covers the normal path; a portrait that came out of
 * the HTTP cache can be `complete` before anything has a chance to listen, and
 * every caller here builds its markup with `innerHTML`, so there is no element
 * to attach to until the assignment lands. One pass on the next frame after any
 * markup is built covers both.
 */
function scheduleFaceCropSweep(): void {
  if (sweepPending || typeof document === 'undefined' || typeof requestAnimationFrame !== 'function') return;
  sweepPending = true;
  requestAnimationFrame(() => {
    sweepPending = false;
    for (const img of document.querySelectorAll<HTMLImageElement>('img[data-face-crop]')) {
      if (img.complete) refineFaceCrop(img);
    }
  });
}

if (typeof document !== 'undefined') {
  // `load` does not bubble, so this listens in the capture phase — one listener
  // for every portrait the game will ever draw, rather than an `onload`
  // attribute per `<img>`.
  document.addEventListener(
    'load',
    (event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement && target.hasAttribute('data-face-crop')) refineFaceCrop(target);
    },
    true,
  );
}
