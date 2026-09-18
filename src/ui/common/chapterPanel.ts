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
import { manifestKnowsAssetNow } from '../../engine/ArtManifest.ts';
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

/**
 * Point an `<img>` at a chapter's hero art, walking {@link heroArtCandidates}
 * on every load failure until one sticks.
 *
 * Written as an error-driven chain rather than a `HEAD` probe so that the
 * first (and, once the art lands, only) candidate costs exactly one request
 * and paints as soon as it decodes. When every candidate fails the element is
 * left with the last `src` and marked `data-art="missing"`, which the
 * stylesheet turns into a flat ink panel rather than a broken-image glyph.
 */
export function mountHeroArt(img: HTMLImageElement, meta: ChapterMeta): void {
  const candidates = heroArtCandidates(meta);
  let index = 0;
  const tryNext = (): void => {
    if (index >= candidates.length) {
      img.dataset['art'] = 'missing';
      return;
    }
    img.dataset['art'] = index === 0 ? 'hero' : index === candidates.length - 1 ? 'fallback' : 'hero';
    img.src = candidates[index++]!;
  };
  img.addEventListener('error', tryNext);
  img.addEventListener('load', () => {
    img.dataset['loaded'] = 'true';
  });
  tryNext();
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
