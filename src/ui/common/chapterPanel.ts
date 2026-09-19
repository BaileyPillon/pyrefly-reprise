/**
 * The chapter dossier — the block of copy and art that the pause screen shows
 * down its right-hand side and the prep menu's CHAPTER tab shows on its sheet.
 *
 * One module because it is genuinely one thing seen twice, and the two views
 * differ in exactly two ways, both of them parameters here: the prep tab has
 * no live battle behind it, so its objectives render as a plain list with no
 * check marks and it has no ENCOUNTER PROGRESS row. Everything else — the
 * `FFX / I` eyebrow, the title, the subtitle, the blurb, the arena still, the
 * tip, the three snapshot polaroids — is identical, and was drifting into two
 * copies the moment it was written twice.
 *
 * Pure `data -> HTML` transforms, in the style of
 * `app/screens/PartyPrepContent.ts`, so both callers stay small and the copy
 * can be asserted on without mounting a screen. The one thing that cannot be a
 * string is the hero art (it has to fall back when a file 404s), so that is
 * {@link mountHeroArt}, which takes an element.
 */

import './chapter-panel.css';
import type { ChapterMeta } from '../../data/chapter-meta.ts';
import {
  loadArtManifest,
  manifestKnowsAssetNow,
  pause2xUrlFor,
  pauseStemOf,
} from '../../engine/ArtManifest.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { escapeHtml } from './html.ts';
import { formatPlayTime, type EncounterProgress, type ObjectiveStatus } from './chapterObjectives.ts';

/**
 * Where to look for a chapter's pause-screen hero art, best first.
 *
 * `ChapterMeta.heroArt` is an *intended* commission with no file extension —
 * the art pipeline had not rendered these when the data landed and the format
 * was undecided (`docs/handoff/pause-screen.md`, "Art status"). So the screen
 * tries both extensions it could plausibly be and then falls back to
 * `heroArtFallback`, an existing shipped portrait that the chapter-meta test
 * asserts is on disk today. The order is deliberate: `.png` first because that
 * is what every other painting in `public/art/**` ships as.
 *
 * The list is exported so a test can assert the fallback is last without
 * having to mount anything or fake an image load.
 */
export function heroArtCandidates(meta: ChapterMeta): string[] {
  const all = [
    artUrl(`art/${meta.heroArt}.png`),
    artUrl(`art/${meta.heroArt}.webp`),
    artUrl(`art/${meta.heroArtFallback}`),
  ];
  // Drop candidates the build-time art manifest positively denies, before
  // anything asks the browser for them. The `.webp` arm is the one this
  // always removes: it exists only because the format was once undecided, and
  // nothing in `public/art/**` has ever shipped as one, so it was a guaranteed
  // 404 on every chapter panel — and the party-prep panel stacks all three as
  // CSS `background-image` layers, which fetches every one of them rather than
  // stopping at the first that works. `null` (no manifest yet, or a path it
  // does not index) is not "absent", so the error-driven chain below stays the
  // fallback rather than becoming a dependency.
  const filtered = all.filter((url) => manifestKnowsAssetNow(url) !== false);
  return filtered.length ? filtered : all;
}

/** Where the subject's face sits in a plate, 0..1 from the top-left corner. */
export interface ArtFocal {
  x: number;
  y: number;
}

/**
 * Where to hold a pause plate when the frame crops it, absent a sidecar.
 *
 * The plates are 1344x768 (1.75:1) and the pause screen is now the whole
 * window, so *something* is always cropped: a 16:9 window eats the sides, a
 * 21:9 one eats the top and bottom, a phone held upright eats most of the
 * width. Centre horizontally, and a little above centre vertically, because
 * every one of these paintings is a head-and-shoulders close-up — the face is
 * in the upper third, and `50% 50%` is what pushes a chin off the bottom of an
 * ultrawide.
 */
export const DEFAULT_PAUSE_FOCAL: Readonly<ArtFocal> = { x: 0.5, y: 0.35 };

/** The 1x plates the art fleet ships, and the width their 2x masters are. */
const PLATE_1X_WIDTH = 1344;
const PLATE_1X_HEIGHT = 768;
const PLATE_2X_WIDTH = 2688;
/** 1.75 — the shape every pause plate is painted at. */
const PLATE_ASPECT = PLATE_1X_WIDTH / PLATE_1X_HEIGHT;

/**
 * How many CSS pixels of image a box `w x h` needs when the plate is drawn
 * with `object-fit: cover`.
 *
 * This is the whole of the `sizes` fix, and the reason a `sizes="100vw"` was
 * wrong: `sizes` is a *width* hint, and `cover` is driven by whichever axis is
 * the more demanding. On a 390x844 phone at DPR 3 the width hint asked for
 * 390 x 3 = 1170 physical pixels, the 1344-wide PNG satisfied that, and the
 * browser never fetched the master — but cover has to fill 1170x2532, so a
 * 768px-tall source was magnified 3.30x and the screen was exactly the
 * "low-resolution image blown up" Bailey reported, on the one class of screen
 * where it is most obvious. The 2688x1536 master would have been 1.65x.
 *
 * Covering a box `w x h` with a source of aspect `a` scales the source by
 * `max(w / srcW, h / srcH)`, so the width of source actually consumed is
 * `max(w, h * a)`. Feed the browser that and it picks correctly at every
 * aspect and every DPR, because it multiplies the hint by the DPR itself.
 *
 * Exported for the test that pins the phone case.
 */
export function coverSourceWidth(w: number, h: number, aspect: number = PLATE_ASPECT): number {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 0;
  return Math.ceil(Math.max(w, h * aspect));
}

/**
 * Keep one element's `sizes` truthful, now and whenever its box changes.
 *
 * One observer per element, kept on the element itself so it lives and dies
 * with it (a `ResizeObserver` holds its targets weakly, so nothing here keeps
 * a detached `<img>` alive). Re-entered safely: `mountPlate` runs again on
 * every load failure as the candidate chain walks.
 */
const sizedImages = new WeakMap<HTMLImageElement, ResizeObserver>();

function applyCoverSizes(img: HTMLImageElement): void {
  const rect = img.getBoundingClientRect();
  let px = coverSourceWidth(rect.width, rect.height);
  if (px <= 0) {
    // Not laid out yet, or in a hidden tab. The pause plate is the window, so
    // the window is the right guess until the observer says otherwise.
    if (typeof window === 'undefined') return;
    px = coverSourceWidth(window.innerWidth, window.innerHeight);
  }
  if (px > 0) img.sizes = `${px}px`;
}

function watchCoverSizes(img: HTMLImageElement): void {
  applyCoverSizes(img);
  if (sizedImages.has(img) || typeof ResizeObserver !== 'function') return;
  const ro = new ResizeObserver(() => {
    if (img.srcset) applyCoverSizes(img);
  });
  ro.observe(img);
  sizedImages.set(img, ro);
}

/** Sidecars already fetched, by PNG url. `null` = fetched, nothing usable. */
const focalCache = new Map<string, ArtFocal | null>();

/**
 * Read a `focal` out of a parsed sidecar, or `null`.
 *
 * Forgiving on purpose: the sidecars are generator metadata the art fleet
 * writes (prompt, seed, canvas...), `focal` is an optional addition to them,
 * and a plate whose sidecar is malformed must fall back to the default rather
 * than break the one image the screen is. Out-of-range numbers are clamped
 * rather than rejected — `1.2` means "the right-hand edge", not "give up".
 */
export function parseArtFocal(raw: unknown): ArtFocal | null {
  if (!raw || typeof raw !== 'object') return null;
  const focal = (raw as { focal?: unknown }).focal;
  if (!focal || typeof focal !== 'object') return null;
  const { x, y } = focal as { x?: unknown; y?: unknown };
  if (typeof x !== 'number' || typeof y !== 'number') return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
}

/**
 * The focal point for a `public/art/pause/<id>.png`, from its sidecar.
 *
 * One `fetch` per plate per session, cached including the misses, so reopening
 * the pause menu costs nothing. Anything that goes wrong — no sidecar, HTML
 * from a dev server's catch-all, no `focal` key — resolves to
 * {@link DEFAULT_PAUSE_FOCAL}.
 */
export async function pauseFocal(pngUrl: string): Promise<Readonly<ArtFocal>> {
  const cached = focalCache.get(pngUrl);
  if (cached !== undefined) return cached ?? DEFAULT_PAUSE_FOCAL;
  let focal: ArtFocal | null = null;
  if (pauseStemOf(pngUrl) !== null && typeof fetch === 'function') {
    try {
      const res = await fetch(pngUrl.replace(/\.png(?=$|[?#])/i, '.json'), { cache: 'force-cache' });
      if (res.ok) focal = parseArtFocal(await res.json());
    } catch {
      focal = null;
    }
  }
  focalCache.set(pngUrl, focal);
  return focal ?? DEFAULT_PAUSE_FOCAL;
}

/**
 * Point an `<img>` at a chapter's hero art, walking {@link heroArtCandidates}
 * on every load failure until one sticks.
 *
 * Written as an error-driven chain rather than a `HEAD` probe so that the
 * first (and, once the art lands, only) candidate costs exactly one request
 * and paints as soon as it decodes. When every candidate fails the element is
 * left with the last `src` and marked `data-art="missing"`, which the
 * stylesheet turns into a flat ink panel rather than a broken-image glyph.
 *
 * Two things happen on top of that, both only for a real pause plate (never
 * for the shipped CTB portrait the chain ends on, which was painted for a
 * 40px tile and has its own framing rule in the stylesheet):
 *
 * - **`srcset`.** When the manifest says `<id>.2x.webp` exists, the element
 *   offers `1344w` and `2688w` and the browser picks. That is the whole
 *   high-resolution fix: a 2000px-wide window asks for more than 1344 CSS px
 *   of image and now gets a file that has it. The `sizes` hint it picks
 *   against is {@link coverSourceWidth} of the element's own box, not `100vw`
 *   — see that function for why a width-only hint under-fetched on a phone.
 * - **`object-position`.** Set from the plate's `focal`, so a frame that has
 *   to crop crops away from the face.
 */
export function mountHeroArt(img: HTMLImageElement, meta: ChapterMeta): void {
  const candidates = heroArtCandidates(meta);
  let index = 0;
  const tryNext = (): void => {
    if (index >= candidates.length) {
      img.dataset['art'] = 'missing';
      img.removeAttribute('srcset');
      return;
    }
    const url = candidates[index++]!;
    img.dataset['art'] = index === 1 ? 'hero' : index === candidates.length ? 'fallback' : 'hero';
    mountPlate(img, url);
  };
  img.addEventListener('error', tryNext);
  img.addEventListener('load', () => {
    img.dataset['loaded'] = 'true';
  });
  tryNext();
}

/**
 * Put one candidate on the element: `src` now, and the 2x candidate and the
 * focal point as soon as the manifest and the sidecar can say.
 *
 * `src` is assigned first and unconditionally, so the painting starts decoding
 * on the same tick the menu opens rather than waiting on a manifest that is
 * usually already in hand. The upgrade re-checks that the element is still on
 * this candidate before it touches anything — the error chain may have moved
 * on while the sidecar was in flight.
 */
function mountPlate(img: HTMLImageElement, url: string): void {
  img.removeAttribute('srcset');
  img.removeAttribute('sizes');
  img.style.removeProperty('object-position');
  img.src = url;

  if (pauseStemOf(url) === null) return;

  const stillHere = (): boolean => img.getAttribute('src') === url;

  void loadArtManifest().then(() => {
    const retina = pause2xUrlFor(url);
    if (!retina || !stillHere()) return;
    // `sizes` before `srcset`: the selection runs off whatever `sizes` says at
    // the moment the candidate list arrives, and a `100vw` that was only ever
    // going to be replaced would have already fetched the wrong file.
    applyCoverSizes(img);
    img.srcset = `${url} ${PLATE_1X_WIDTH}w, ${retina} ${PLATE_2X_WIDTH}w`;
    watchCoverSizes(img);
  });

  void pauseFocal(url).then((focal) => {
    if (!stillHere()) return;
    img.style.objectPosition = `${(focal.x * 100).toFixed(1)}% ${(focal.y * 100).toFixed(1)}%`;
  });
}

/**
 * Give every `<img data-fallback="...">` under `root` its fallback.
 *
 * The dossier can mount its hero art by hand ({@link mountHeroArt}) because
 * there is one of it. The party tab has one close-up per member, written into
 * an `innerHTML` string like everything else in this codebase's UI, and each
 * of them is aimed at `art/pause/<id>.png` — art that is commissioned but not
 * yet painted (`docs/handoff/pause-screen.md`). This is the one-line wiring
 * step that makes those strings degrade to the shipped portrait instead of a
 * broken-image glyph: call it once after assigning `innerHTML`.
 *
 * Single-shot by design — the handler removes the attribute before swapping
 * the `src`, so a fallback that is *itself* missing cannot loop.
 */
export function wireImageFallbacks(root: ParentNode): void {
  for (const img of root.querySelectorAll<HTMLImageElement>('img[data-fallback]')) {
    img.addEventListener(
      'error',
      () => {
        const next = img.dataset['fallback'];
        delete img.dataset['fallback'];
        if (next) img.src = next;
      },
      { once: true },
    );
  }
}

/** `FFX · I` — the game label and chapter numeral, as the dossier's eyebrow. */
export function eyebrowHtml(meta: ChapterMeta): string {
  return `<span class="cpanel__game">${escapeHtml(meta.gameLabel)}</span><span class="cpanel__dot">&middot;</span><span class="cpanel__numeral">${escapeHtml(
    meta.numeral,
  )}</span>`;
}

export interface ObjectiveListOptions {
  /**
   * Evaluated rows. Omit for the prep tab, which has no battle to evaluate
   * against and lists the objectives as a plain briefing instead.
   */
  statuses?: readonly ObjectiveStatus[];
}

/**
 * The OBJECTIVES block.
 *
 * With `statuses` every row carries a box that is either ticked or empty and
 * the header counts them; without, the boxes are rendered as inert bullets —
 * not empty check boxes, which would read as "you have failed all three"
 * before the fight has started.
 */
export function objectivesHtml(meta: ChapterMeta, opts: ObjectiveListOptions = {}): string {
  const statuses = opts.statuses;
  const live = statuses !== undefined;
  const done = live ? statuses.filter((s) => s.done).length : 0;
  const rows = meta.objectives
    .map((objective, i) => {
      const isDone = live ? (statuses[i]?.done ?? false) : false;
      const mark = live
        ? `<span class="cpanel__check" aria-hidden="true">${isDone ? '&#10003;' : ''}</span>`
        : `<span class="cpanel__bullet" aria-hidden="true"></span>`;
      return `<li class="cpanel__objective${isDone ? ' cpanel__objective--done' : ''}">${mark}<span class="cpanel__objective-label">${escapeHtml(
        objective.label,
      )}</span></li>`;
    })
    .join('');
  const count = live ? `<span class="cpanel__count">${done}/${meta.objectives.length}</span>` : '';
  return `<div class="cpanel__head"><span class="cpanel__head-label">OBJECTIVES</span>${count}</div>
    <ul class="cpanel__objectives">${rows}</ul>`;
}

/** The three journal snapshots, with their handwritten captions. */
export function snapshotsHtml(meta: ChapterMeta): string {
  return meta.snapshots
    .map(
      (snap, i) => `
      <figure class="cpanel__snap" style="--snap-tilt:${[-2.5, 1.5, -1][i] ?? 0}deg">
        <span class="cpanel__snap-img" style="background-image:url(${artUrl(`art/${snap.image}`)})"></span>
        <figcaption class="cpanel__snap-cap">${escapeHtml(snap.caption)}</figcaption>
      </figure>`,
    )
    .join('');
}

/** The canon strategy line, under its gold TIP label. */
export function tipHtml(meta: ChapterMeta): string {
  return `<div class="cpanel__tip"><span class="cpanel__tip-label">TIP</span><span class="cpanel__tip-text">${escapeHtml(
    meta.tip,
  )}</span></div>`;
}

export interface DossierOptions extends ObjectiveListOptions {
  /** Backdrop scene key for the arena still. */
  sceneKey: string;
  /** Accumulated real play time for this chapter, in ms. Omit on the prep tab. */
  playTimeMs?: number;
  /** Live encounter progress. Omit on the prep tab. */
  progress?: EncounterProgress | null;
  /** Difficulty label. The game ships exactly one. */
  difficulty?: string;
  /**
   * Include the three snapshot polaroids. Default true.
   *
   * The pause screen sets this false and renders them itself along the bottom
   * of the frame, beside the party cards, where they have the width to lie at
   * their own angles — the reference layout's photographs tucked into a
   * journal. The prep tab has no bottom strip, so it keeps them in the column.
   */
  snapshots?: boolean;
}

/**
 * The whole dossier, top to bottom.
 *
 * The ledger row (PLAY TIME / DIFFICULTY / PROGRESS) only renders the cells it
 * was given a value for, so the prep tab's version simply omits them rather
 * than printing `--` three times.
 */
export function dossierHtml(meta: ChapterMeta, opts: DossierOptions): string {
  const ledger: string[] = [];
  if (opts.playTimeMs !== undefined) {
    ledger.push(
      `<div class="cpanel__ledger-cell"><span class="cpanel__ledger-k">PLAY TIME</span><span class="cpanel__ledger-v">${escapeHtml(
        formatPlayTime(opts.playTimeMs),
      )}</span></div>`,
    );
  }
  ledger.push(
    `<div class="cpanel__ledger-cell"><span class="cpanel__ledger-k">DIFFICULTY</span><span class="cpanel__ledger-v cpanel__ledger-v--word">${escapeHtml(
      opts.difficulty ?? 'Faithful',
    )}</span></div>`,
  );
  if (opts.progress) {
    ledger.push(
      `<div class="cpanel__ledger-cell"><span class="cpanel__ledger-k">ENCOUNTER</span><span class="cpanel__ledger-v cpanel__ledger-v--word">${escapeHtml(
        opts.progress.label,
      )}</span></div>`,
    );
  }

  return `
    <div class="cpanel__eyebrow">${eyebrowHtml(meta)}</div>
    <h2 class="cpanel__title">${escapeHtml(meta.title)}</h2>
    <div class="cpanel__subtitle">${escapeHtml(meta.subtitle)}</div>
    <div class="cpanel__where">${escapeHtml(meta.location)}</div>
    <div class="cpanel__arena" style="background-image:url(${artUrl(`art/backdrops/${opts.sceneKey}.png`)})"></div>
    <p class="cpanel__blurb">${escapeHtml(meta.blurb)}</p>
    <div class="cpanel__ledger">${ledger.join('')}</div>
    ${objectivesHtml(meta, opts.statuses !== undefined ? { statuses: opts.statuses } : {})}
    ${tipHtml(meta)}
    ${opts.snapshots === false ? '' : `<div class="cpanel__snaps">${snapshotsHtml(meta)}</div>`}
  `;
}
