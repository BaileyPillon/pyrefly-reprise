/**
 * The prep menu's CHAPTER tab — the briefing you get before the fight.
 *
 * The same dossier the pause menu shows down its right-hand side
 * (`src/ui/common/chapterPanel.ts`), on the prep shell's ivory sheet instead
 * of over ink, with the two differences that not having a battle behind it
 * forces: the objectives are a briefing rather than a checklist (no ticks —
 * nothing has been attempted yet), and there is no ENCOUNTER PROGRESS row.
 *
 * It is the **first** tab (`order: -10`) because it is the thing a player who
 * has just picked a chapter wants to read, before they start tuning a Sphere
 * Grid — and because a menu whose first tab is STATS asks the player to know
 * what they are preparing for.
 *
 * Game-agnostic: {@link makeChapterPanel} takes the `GameId` and is registered
 * once per game. The FFX-2 prep menu had no registered panel at all before
 * this, so it showed the shell's fallback stat sheet; it now has one tab, and
 * `PartyPrepScreen`'s `fullScreen: false` keeps that single tab composing into
 * the Ink & Gold frame rather than being treated as a whole menu.
 */

import type { GameId } from '../../../battle/common/types.ts';
import type { PrepPanel, PrepPanelContext } from '../../../app/screens/PartyPrepScreen.ts';
import type { InputSnapshot } from '../../../app/Input.ts';
import { getChapterMeta } from '../../../data/chapter-meta.ts';
import { escapeHtml } from '../../common/html.ts';
import {
  eyebrowHtml,
  heroArtCandidates,
  objectivesHtml,
  snapshotsHtml,
  tipHtml,
  watchHeroBackground,
} from '../../common/chapterPanel.ts';
import './chapter-panel-tab.css';
import './chapter-panel-phone.css';

/**
 * The hero art as the tab's background slab.
 *
 * The pause screen can mount an `<img>` and walk the candidate list on error;
 * a CSS background cannot report a 404, so this stacks every candidate in one
 * `background-image` instead. CSS draws the *first* layer on top and paints
 * the later ones behind it, so listing them best-first gives the same result:
 * when `art/pause/<chapter>.png` exists it covers everything under it, and
 * when it does not the browser simply draws nothing for that layer and the
 * shipped portrait behind it shows through. One property, no JavaScript, and
 * no broken-image glyph either way.
 */
/**
 * Toggles `.is-visible` on a column's two `.prepchap__cue` siblings to say
 * "there is more copy this way" — see the PR-0127 comment where this is
 * called. A column only carries the cue when it is actually scrollable
 * (`scrollHeight > clientHeight`), and only on the edge that still has
 * unscrolled content, so a chapter whose copy already fits never shows one.
 *
 * Wired to `scroll` and to every image inside the column: the thumbnail
 * column's own height can still change after this first runs, once a
 * `cpanel__snap-img` finishes loading and claims its real box.
 */
function wireScrollCue(col: HTMLElement, wrap: HTMLElement): void {
  const top = wrap.querySelector<HTMLElement>('.prepchap__cue--top');
  const bottom = wrap.querySelector<HTMLElement>('.prepchap__cue--bottom');
  const update = (): void => {
    const scrollable = col.scrollHeight - col.clientHeight > 1;
    top?.classList.toggle('is-visible', scrollable && col.scrollTop > 1);
    bottom?.classList.toggle(
      'is-visible',
      scrollable && col.scrollTop + col.clientHeight < col.scrollHeight - 1,
    );
  };
  col.addEventListener('scroll', update, { passive: true });
  for (const img of col.querySelectorAll('img')) {
    img.addEventListener('load', update, { once: true });
  }
  update();
  window.requestAnimationFrame(update);
}

/**
 * PR-0127 (both games; the prep card is shared): the columns scrolled only
 * under a mouse wheel, so at 1280x720 Chapter 6's TIP stayed cut mid-sentence
 * for a keyboard or pad player. The shell binds neither shoulder button, so
 * L1 / R1 (PageUp / PageDown, F / R, pad LB / RB) page **both** columns
 * together, each within its own range: one press is most of a column, which at
 * 1280x720 is enough to bring every chapter's TIP fully into view.
 */
const PAGE_FRACTION = 0.8;

/**
 * The columns that currently hold more copy than they show. At phone width
 * (PR-0127 option A) the card is one stacked page and the columns never
 * scroll; the page does, so the prep page itself (`.prep`, scrollable only
 * there) is the one thing L1 / R1 page.
 */
function scrollableCols(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const page = root.closest<HTMLElement>(".prep[data-tab='chapter']");
  const candidates = [...root.querySelectorAll<HTMLElement>('[data-scrollcol]')];
  if (page && getComputedStyle(page).overflowY === 'auto') candidates.push(page);
  return candidates.filter((c) => c.scrollHeight - c.clientHeight > 1);
}

/** Page every scrollable column by `dir`; true when any of them moved. */
export function pageChapterColumns(root: HTMLElement | null, dir: 1 | -1): boolean {
  let moved = false;
  for (const col of scrollableCols(root)) {
    const max = col.scrollHeight - col.clientHeight;
    const next = Math.max(0, Math.min(max, col.scrollTop + dir * Math.max(12, col.clientHeight * PAGE_FRACTION)));
    if (Math.abs(next - col.scrollTop) < 0.5) continue;
    col.scrollTop = next;
    // `scroll` fires asynchronously; the cue should not wait a frame for it.
    col.dispatchEvent(new Event('scroll'));
    moved = true;
  }
  return moved;
}

function heroBackground(chapterId: string): string {
  const meta = getChapterMeta(chapterId);
  if (!meta) return '';
  return heroArtCandidates(meta)
    .map((url) => `url(${url})`)
    .join(', ');
}

export function makeChapterPanel(game: GameId): PrepPanel {
  let root: HTMLElement | null = null;

  const render = (ctx: PrepPanelContext): void => {
    if (!root) return;
    const meta = getChapterMeta(ctx.chapter.id);
    if (!meta) {
      // A chapter with no meta record still gets a readable tab rather than a
      // blank slab — the shell's own copy is always there.
      root.innerHTML = `<div class="prepchap__fallback">
        <h2>${escapeHtml(ctx.chapter.title)}</h2>
        <p>${escapeHtml(ctx.chapter.blurb)}</p>
      </div>`;
      return;
    }

    const layers = heroBackground(ctx.chapter.id);
    // Two columns, not the pause screen's single stack.
    //
    // The prep shell gives a tab a band roughly 120 logical px tall between the
    // tab strip and its own controls hint — less than half the height the pause
    // menu's column has — but more than twice the width. So the dossier is
    // composed here from `chapterPanel.ts`'s individual parts (which is what
    // they are exported for) rather than through `dossierHtml`: the copy stays
    // shared, the arrangement is this tab's own.
    //
    // Two parts are deliberately dropped. The arena still, because the hero
    // painting behind this *is* the chapter's picture and a second one would be
    // two photographs of the same place; and PLAY TIME / ENCOUNTER PROGRESS,
    // because there is no battle yet to have either.
    root.innerHTML = `
      <div class="prepchap">
        <div class="prepchap__hero" style="background-image:${layers}"></div>
        <div class="prepchap__wash"></div>
        <div class="prepchap__cols cpanel cpanel--paper">
          <div class="prepchap__colwrap">
            <div class="prepchap__col" data-scrollcol>
              <div class="cpanel__eyebrow">${eyebrowHtml(meta)}</div>
              <h2 class="cpanel__title">${escapeHtml(meta.title)}</h2>
              <div class="cpanel__subtitle">${escapeHtml(meta.subtitle)}</div>
              <div class="cpanel__where">${escapeHtml(meta.location)}</div>
              <p class="cpanel__blurb">${escapeHtml(meta.blurb)}</p>
              <div class="cpanel__snaps">${snapshotsHtml(meta)}</div>
            </div>
            <div class="prepchap__cue prepchap__cue--top" aria-hidden="true"></div>
            <div class="prepchap__cue prepchap__cue--bottom" aria-hidden="true"></div>
          </div>
          <div class="prepchap__colwrap">
            <div class="prepchap__col prepchap__col--brief" data-scrollcol>
              ${objectivesHtml(meta)}
              ${tipHtml(meta)}
            </div>
            <div class="prepchap__cue prepchap__cue--top" aria-hidden="true"></div>
            <div class="prepchap__cue prepchap__cue--bottom" aria-hidden="true"></div>
          </div>
        </div>
      </div>`;

    // PR-0127 (round 09): the old scroll cue was two extra `background-image`
    // layers on `.prepchap__col` itself — which paints a background *under*
    // an element's own children, so the thumbnail column's opaque photo
    // tiles sat on top of it and hid it completely (measured: a pixel diff
    // with and without the layers differed in 22 of 271 columns over the
    // photo row). Real elements, laid out *after* the scrolling column
    // inside a positioned wrapper, paint above it regardless of what the
    // column's own content is — see `wireScrollCue` and the
    // `.prepchap__cue` rules in `chapter-panel-tab.css`.
    for (const wrap of root.querySelectorAll<HTMLElement>('.prepchap__colwrap')) {
      const col = wrap.querySelector<HTMLElement>('[data-scrollcol]');
      if (col) wireScrollCue(col, wrap);
    }

    // Fix 3, pre-release pass: `heroBackground()` above only ever emits the
    // 1x plate (plus the .webp/fallback chain) — a CSS background cannot ask
    // a browser to pick between resolutions the way an `<img srcset>` can, so
    // the upgrade to the 2x master, when one exists, has to be wired in by
    // hand once the slab is actually in the document and has a real box to
    // measure. See `watchHeroBackground`.
    const hero = root.querySelector<HTMLElement>('.prepchap__hero');
    if (hero) watchHeroBackground(hero, meta);
  };

  return {
    id: 'chapter',
    label: 'Chapter',
    game,
    order: -10,
    // Compose into the shell's frame. Required for FFX-2, where this is the
    // only registered panel and the shell would otherwise hand it the whole
    // screen (`PartyPrepScreen.ownsWholeScreen`).
    fullScreen: false,
    mount(el: HTMLElement, ctx: PrepPanelContext): void {
      root = el;
      render(ctx);
    },
    unmount(): void {
      root = null;
    },
    handleInput(input: InputSnapshot): boolean {
      if (input.consume('r1')) pageChapterColumns(root, 1);
      if (input.consume('l1')) pageChapterColumns(root, -1);
      return false;
    },
    hint() {
      const visible = !!root && !root.hidden && root.isConnected;
      return visible && scrollableCols(root).length ? { keys: 'PG UP / PG DN', label: 'SCROLL' } : null;
    },
  };
}
