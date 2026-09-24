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
import faceCropData from './face-crops.json';
import { canHostCrop } from './portraitHost.ts';

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

/**
 * `<img>` markup for a portrait, or `''` when `id` is falsy. Removes itself on a 404.
 *
 * `style`, when given, is an extra inline `style` attribute — additive, so every
 * existing caller that omits it (`ChapterSelectScreen`, `ResultsScreen`) gets the
 * exact same markup as before. `DialogueBox` is the one caller that passes it: the
 * dialogue card's own `object-fit: cover` placement (`dialogueObjectPosition`
 * below), which has to travel with the `<img>` because this function, not the
 * caller, decides whether the element exists at all (a 404'd or manifest-absent
 * portrait renders nothing, style included).
 *
 * `manualCrop: true` stamps `data-face-crop-manual="1"` on the `<img>`, which
 * {@link refineFaceCrop} refuses to touch (see its own comment for why this
 * exists — critic PR-0020/PR-0056). Every other caller of this function leaves
 * it `false`/omitted and is unaffected.
 */
export function portraitImgHtml(id: string | undefined, alt = '', opts: { style?: string; manualCrop?: boolean } = {}): string {
  if (!id || knownAbsent(`art/portraits/${id}.png`)) return '';
  const src = artUrl(`art/portraits/${id}.png`);
  const styleAttr = opts.style ? ` style="${opts.style}"` : '';
  const manualAttr = opts.manualCrop ? ' data-face-crop-manual="1"' : '';
  return `<img src="${src}" alt="${alt}" draggable="false"${styleAttr}${manualAttr} onerror="this.remove()" />`;
}

/**
 * Where the dialogue card's `object-fit: cover` should centre a speaker's
 * portrait, as a CSS `object-position` value (`"<fx>% <fy>%"`).
 *
 * Deliberately **not** {@link portraitCrop} / {@link cropStyle}: that geometry
 * assumes a square frame (the doc comment on {@link faceImgHtml} says so), and
 * the dialogue card's cut-in is not one. `object-fit: cover` on the `<img>`
 * itself asks the browser to do the covering — no zoom math, no clamp, no way
 * to overflow the frame or leave a gap behind it — so all this needs to supply
 * is *where the face is*, which `object-position` takes as a plain fraction of
 * the source image.
 *
 * A speaker with a row in {@link DIALOGUE_CROPS} (measured for this frame,
 * `face-crops.json`'s `dialogue` table — the dialogue-card track's own rows,
 * separate from the `portraits` table other screens read) uses it; anyone else
 * falls back to {@link portraitCrop}'s `fx`/`fy` (ignoring its `ipd`/`aspect`,
 * which only matter to the square-frame zoom math), which is right for every
 * speaker this card has actually shipped except Jecht — see the `dialogue.jecht`
 * row's note for why he needed his own.
 */
const DIALOGUE_CROPS = (faceCropData.dialogue ?? {}) as Readonly<Record<string, { fx: number; fy: number }>>;

export function dialogueObjectPosition(id: string | undefined): string {
  if (!id) return '50% 25%';
  const row = DIALOGUE_CROPS[id] ?? portraitCrop(id);
  return `${(row.fx * 100).toFixed(2)}% ${(row.fy * 100).toFixed(2)}%`;
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
 * - `aspect` — `width / height` of the file. The rows carry the size the file
 *   was measured at, so the first paint is already right;
 *   {@link refineFaceCrop} then replaces it with the loaded image's true
 *   `naturalWidth / naturalHeight`, which is what keeps a re-rolled painting
 *   from being placed against a canvas that no longer exists.
 *
 * **The rows live in `face-crops.json`, not here**, because they are measured
 * data about files the art fleet re-rolls rather than code — and because the
 * measuring rig (`tools/portraits/measure-face-crops.mjs`) reads the same file,
 * so the acceptance sheet and the shipped geometry cannot drift apart. Every
 * row was read off a window of its own painting under a grid labelled in file
 * pixels, so the number under the crosshair is the number in the row; `note`
 * records where the eyes actually are. For a head rolled out of the vertical
 * the scale handle is the true eye separation, the diagonal, not its horizontal
 * projection; for a near-profile with one eye on camera (Auron, Kimahri,
 * Bahamut, Ixion, Valefor) `fx` and `ipd` are the human-equivalent values that
 * land the head at the roster's scale and `fy` comes from that one eye.
 *
 * **These rows go stale the moment the art fleet re-rolls a painting.** That is
 * how Auron shipped cropped through the chin: his row was measured against a
 * 671x1216 file, every portrait was regenerated at 832x1216, and nothing in the
 * build noticed. Four things now stand between a stale row and a cut face:
 *
 * 1. each row records the file's pixel size, and
 *    `tests/unit/ui-portrait-face-crop.test.ts` reads the real paintings off
 *    disk and fails when one has moved;
 * 2. the same test asserts each row's own measured eye line lands on
 *    {@link TARGET_EYE_Y} and its eye separation at {@link TARGET_IPD} once
 *    placed, so a row that cannot be honoured fails rather than shipping;
 * 3. the aspect is taken from the file at runtime, never only from the row
 *    ({@link refineFaceCrop});
 * 4. {@link cropStyle} clamps the placement so the painting always covers the
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

/** A row as `face-crops.json` stores it: the focal numbers plus the file they were measured on. */
interface MeasuredRow {
  fx: number;
  fy: number;
  ipd: number;
  px: number[];
  note?: string;
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

const PORTRAIT_ROWS = faceCropData.portraits as Readonly<Record<string, MeasuredRow>>;
const BODY_ROWS = faceCropData.bodies as Readonly<Record<string, MeasuredRow>>;

function toCrop(row: MeasuredRow | undefined, fallback: PortraitCrop): PortraitCrop {
  if (!row) return fallback;
  const w = row.px[0];
  const h = row.px[1];
  return { fx: row.fx, fy: row.fy, ipd: row.ipd, aspect: w && h ? w / h : fallback.aspect };
}

/** The measured crop for `id`, or the top-biased fallback when it has no row. */
export function portraitCrop(id: string | undefined): PortraitCrop {
  return toCrop(id ? PORTRAIT_ROWS[id] : undefined, DEFAULT_CROP);
}

/** Ids with a measured row, for the guard test. */
export function measuredPortraitIds(): string[] {
  return Object.keys(PORTRAIT_ROWS);
}

/** Full-body ids with a measured head row, for the guard test. */
export function measuredBodyIds(): string[] {
  return Object.keys(BODY_ROWS);
}

/**
 * The pixel size a row was measured against, so the guard test can compare it
 * with the file actually on disk. `undefined` for an unmeasured id.
 */
export function measuredFilePx(id: string, kind: 'portrait' | 'body' = 'portrait'): number[] | undefined {
  return (kind === 'body' ? BODY_ROWS : PORTRAIT_ROWS)[id]?.px;
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
export const TARGET_IPD = 0.3;
export const TARGET_EYE_Y = 0.42;

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

/**
 * The painted layers of a face tile, stacked: the best portrait the manifest
 * has, over the head of a full-body painting for anyone the fleet has not
 * painted a portrait of.
 *
 * The caller supplies the floor — a monogram, an initial — and this adds
 * whatever real art exists above it. Layers are *stacked* rather than chosen
 * because the art manifest may not have landed on the first frame; each `<img>`
 * removes itself on a miss, so whichever layer is real wins and a miss costs
 * nothing.
 *
 * The frame around this must be square, `position: relative`, `overflow:
 * hidden` — and the floor must be positioned too, or it paints over the art
 * (docs/handoff/bp1-portrait-basepath.md).
 *
 * FFX-2's party rows call this. `src/app/screens/PartyPrepContent.ts` is the
 * other place that wants it: its roster draws `faceImgHtml(id)` alone, so
 * **Paine**, who has no `portraits/paine.png`, gets her name initial on the
 * prep screen where the battle gives her a painted face.
 */
export function faceLayersHtml(
  portraitIds: readonly string[],
  bodyId: string | undefined,
  alt = '',
  opts: Omit<FaceOptions, 'z'> = {},
): string {
  const body = bodyId ? bodyFaceImgHtml(bodyId, alt, { ...opts, z: 1 }) : '';
  return body + faceImgHtmlFrom(portraitIds, alt, { ...opts, z: 2 });
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
  // Asking for the style means an `<img>` is about to exist, and the one caller
  // that does this builds the element itself without a `data-face-crop`. Arming
  // the sweep here is what lets the correction pass find it anyway.
  scheduleFaceCropSweep();
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
const GENERIC_BODY_CROP: PortraitCrop = { ...GENERIC_BODY_HEAD_CROP, aspect: GENERIC_BODY_ASPECT };

/**
 * The measured head of one full-body painting, or the generic estimate.
 *
 * **The estimate is wrong more often than it is right, and this is why the
 * table exists.** `fx 0.5` assumes the figure is centred on the canvas; the
 * dressphere paintings are not. Paine's Dark Knight stands right of centre with
 * a greatsword filling the left of the frame, so centring on 0.5 put the blade
 * in the party row where her face should be — the FFX-2 party rows drew a sword
 * for the whole of Chapter 5. Rikku's Dark Knight hides behind a machina arm,
 * Rikku's Thief has hair tall enough to push her eyes a quarter of the way down
 * the file, and Yuna's Dark Knight wears a horned helm. Every one of those is a
 * different `fx`/`fy`, and no single estimate covers them.
 *
 * The estimate is kept for an unmeasured id (a boss's idle painting, a
 * dressphere nobody has measured yet) because a roughly-top-centre crop of a
 * "full body, centered, straight-on" render is still better than a cover crop.
 */
export function bodyCrop(id: string | undefined): PortraitCrop {
  return toCrop(id ? BODY_ROWS[id] : undefined, GENERIC_BODY_CROP);
}

/**
 * The inline style for a full-body head crop.
 *
 * `id` is optional so that `ui/ffx/portraits.ts`, which asks for the generic
 * estimate and then tightens the aspect itself once its image loads, keeps its
 * exact current behaviour; passing an id opts into the measured table.
 */
export function bodyHeadCropStyle(aspect: number = GENERIC_BODY_ASPECT, opts: FaceOptions = {}, id?: string): string {
  const row = id ? BODY_ROWS[id] : undefined;
  return cropStyle(row ? toCrop(row, GENERIC_BODY_CROP) : { ...GENERIC_BODY_HEAD_CROP, aspect }, opts);
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
    `<img${cls} src="${src}" alt="${alt}" draggable="false"` +
    ` style="${cropStyle(bodyCrop(subjectId), opts)}${zDecl(opts)}"` +
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
 *
 * Refuses an element carrying `data-face-crop-manual` outright. This whole
 * module watches the document for *any* `<img src=".../art/portraits/...">`
 * and silently adopts and corrects it — right for a plain `<img>` a screen
 * built by hand, wrong for `DialogueBox`'s cut-in (critic PR-0020/PR-0056):
 * its `<img>` already carries its own `object-fit: cover` +
 * `object-position` from {@link dialogueObjectPosition}, sized to a frame
 * that this function's square-frame math was never meant for, and the sweep
 * was overwriting that inline style with its own on the very next frame —
 * which is how the dialogue card kept the overflow bug even after its own
 * markup asked for cover framing. `portraitImgHtml`'s `manualCrop` option is
 * the only way to set the attribute, so nothing else is affected.
 */
export function refineFaceCrop(img: HTMLImageElement): void {
  if (img.hasAttribute('data-face-crop-manual')) return;
  const id = img.getAttribute('data-face-crop');
  if (!id || !img.naturalWidth || !img.naturalHeight) return;
  const aspect = img.naturalWidth / img.naturalHeight;
  const opts: FaceOptions = {};
  const ipd = Number(img.getAttribute('data-face-ipd'));
  if (Number.isFinite(ipd) && ipd > 0) opts.ipd = ipd;
  const eyeY = Number(img.getAttribute('data-face-eye'));
  if (Number.isFinite(eyeY) && eyeY > 0) opts.eyeY = eyeY;

  if (img.hasAttribute('data-face-body')) {
    applyCrop(img, { ...bodyCrop(id), aspect }, opts);
    return;
  }
  applyCrop(img, { ...portraitCrop(id), aspect }, opts);
  void portraitFocal(id).then((focal) => {
    if (focal && img.isConnected) applyCrop(img, { ...focal, aspect }, opts);
  });
}

/**
 * The portrait id a `<img>` is showing, from its `src`, for an element that
 * nobody tagged.
 *
 * `ui/ffx/portraits.ts` builds the FFX HUD's own portrait layer by hand — it
 * asks for {@link faceCropStyle} and writes its own `<img>` with a `z-index` —
 * so that element never carried `data-face-crop` and the correction pass below
 * has never touched the CTB tiles or the party window. That was invisible only
 * because every portrait on disk happens to match the canvas its row was
 * measured on; the moment one does not, the HUD is the screen that shows it.
 * The file is its own identity, so read the id back off the URL rather than
 * reaching into another track's markup.
 */
function portraitIdFromSrc(src: string): string | null {
  const m = /\/art\/portraits\/([^/?#]+)\.png(?:[?#]|$)/.exec(src);
  return m?.[1] ?? null;
}

/**
 * Tag and correct portrait `<img>`s that were built outside this module.
 *
 * Deliberately narrow: only an element that is already showing a
 * `art/portraits/<id>.png`, is not a body crop (`ui/ffx/portraits.ts` tightens
 * those itself from `idle.json` and must keep owning them), and has no
 * `data-face-crop` of its own. Anything adopted is tagged, so it costs one pass.
 */
function adoptUntaggedPortraits(root: ParentNode): void {
  for (const img of root.querySelectorAll<HTMLImageElement>('img[src*="/art/portraits/"]:not([data-face-crop])')) {
    if (img.hasAttribute('data-body-id') || img.hasAttribute('data-face-body') || img.hasAttribute('data-face-crop-manual')) continue;
    if (!canHostCrop(img)) continue;
    const id = portraitIdFromSrc(img.getAttribute('src') ?? '');
    if (!id) continue;
    img.setAttribute('data-face-crop', id);
    if (img.complete) refineFaceCrop(img);
  }
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
    adoptUntaggedPortraits(document);
    for (const img of document.querySelectorAll<HTMLImageElement>('img[data-face-crop]')) {
      if (img.complete) refineFaceCrop(img);
    }
  });
}

/**
 * Run the correction pass over `root` now, for a caller that has just written
 * markup and cannot wait a frame — and for the unit tests, which have no
 * `requestAnimationFrame`.
 */
export function refineFaceCropsIn(root: ParentNode): void {
  adoptUntaggedPortraits(root);
  for (const img of root.querySelectorAll<HTMLImageElement>('img[data-face-crop]')) {
    if (img.complete) refineFaceCrop(img);
  }
}

if (typeof document !== 'undefined') {
  // `load` does not bubble, so this listens in the capture phase — one listener
  // for every portrait the game will ever draw, rather than an `onload`
  // attribute per `<img>`.
  document.addEventListener(
    'load',
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      if (target.hasAttribute('data-face-crop-manual')) return;
      if (!target.hasAttribute('data-face-crop')) {
        // A portrait somebody else's module built; adopt it before correcting.
        if (target.hasAttribute('data-body-id')) return;
        if (!canHostCrop(target)) return;
        const id = portraitIdFromSrc(target.getAttribute('src') ?? '');
        if (!id) return;
        target.setAttribute('data-face-crop', id);
      }
      refineFaceCrop(target);
    },
    true,
  );
}

// ------------------------------------------------- measured body-crop rescue

/**
 * Frame a portrait tile on the painting's **actual silhouette**, measured from
 * its alpha once the image has loaded.
 *
 * Bailey, on the Chapter 3 frame: *"Yu Pagoda's turn-list portrait is a letter
 * tile."* It was not, quite — the body-crop layer was emitted and the image
 * did load. What it framed was empty sky. {@link bodyCrop}'s estimate places a
 * *humanoid head*: near the top of the canvas, a fifth of the way down, on a
 * face-sized scale. A Yu Pagoda is a levitating stack of discs sitting small in
 * the middle of a padded 1024-square canvas, so that crop landed on transparent
 * pixels and the ink monogram painted straight through it — which is what a
 * letter tile looks like.
 *
 * So measure. One `drawImage` into a small offscreen canvas gives the alpha
 * box, and a square taken from the **top third** of that box is a portrait of
 * whatever the subject actually is: a face for a figure, a spire for a pagoda,
 * a muzzle for Vegnagun's head.
 *
 * Deliberately a **rescue, not a replacement**. A subject with a measured row
 * in `face-crops.json` keeps it — those rows were measured by eye against the
 * real paintings and beat any automatic rule. This only runs for an id with no
 * row, which is exactly the set that was showing sky.
 *
 * Silent and non-fatal throughout: a tainted canvas, a missing 2D context or a
 * fully transparent PNG all leave the existing crop alone.
 */
export function refineBodyCropFromAlpha(img: HTMLImageElement): void {
  const id = img.getAttribute('data-body-id');
  if (!id || !img.naturalWidth || !img.naturalHeight) return;
  // A hand-measured row is better than anything measured here.
  if (BODY_ROWS[id]) return;
  if (img.dataset['bodyCropMeasured'] === '1') return;

  const box = alphaBoxOf(img);
  if (!box) return;
  img.dataset['bodyCropMeasured'] = '1';

  const boxW = box.x1 - box.x0;
  const boxH = box.y1 - box.y0;
  if (boxW <= 0 || boxH <= 0) return;

  // A square over the top third of the silhouette, at least as wide as the
  // silhouette is, so a tall thin subject is not cropped to a stripe.
  const side = Math.max(boxW, Math.min(boxH, boxW * 1.25));
  const cx = box.x0 + boxW / 2;
  const cy = box.y0 + Math.min(boxH / 2, side / 2 + boxH * 0.08);

  const scale = (img.naturalWidth / side) * 100;
  const left = 50 - ((cx / img.naturalWidth) * scale);
  const top = 50 - ((cy / img.naturalHeight) * ((img.naturalHeight / side) * 100));
  img.style.setProperty('position', 'absolute');
  img.style.setProperty('left', `${left.toFixed(2)}%`);
  img.style.setProperty('top', `${top.toFixed(2)}%`);
  img.style.setProperty('width', `${scale.toFixed(2)}%`);
  img.style.setProperty('height', 'auto');
  img.style.setProperty('max-width', 'none');
  img.style.setProperty('object-fit', 'fill');
}

/** The painted content's bounding box in an image, in natural pixels. */
function alphaBoxOf(img: HTMLImageElement): { x0: number; y0: number; x1: number; y1: number } | null {
  if (typeof document === 'undefined') return null;
  const sw = Math.min(img.naturalWidth, 128);
  const sh = Math.min(img.naturalHeight, 128);
  if (sw < 2 || sh < 2) return null;
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  let data: Uint8ClampedArray;
  try {
    ctx.drawImage(img, 0, 0, sw, sh);
    data = ctx.getImageData(0, 0, sw, sh).data;
  } catch {
    // A cross-origin painting taints the canvas. Keep the estimate.
    return null;
  }
  let x0 = sw;
  let y0 = sh;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      if (data[(y * sw + x) * 4 + 3]! < 90) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0 || y1 < 0) return null;
  const kx = img.naturalWidth / sw;
  const ky = img.naturalHeight / sh;
  return { x0: x0 * kx, y0: y0 * ky, x1: (x1 + 1) * kx, y1: (y1 + 1) * ky };
}

/** Run {@link refineBodyCropFromAlpha} over every already-loaded body image. */
export function refineBodyCropsIn(root: ParentNode): void {
  for (const img of root.querySelectorAll<HTMLImageElement>('img[data-body-id]')) {
    if (img.complete) refineBodyCropFromAlpha(img);
  }
}

if (typeof document !== 'undefined') {
  // `load` does not bubble; capture once for every body-crop image the game
  // will ever draw, the same way the face-crop pass above does.
  document.addEventListener(
    'load',
    (event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement && target.hasAttribute('data-body-id')) {
        refineBodyCropFromAlpha(target);
      }
    },
    true,
  );
}
