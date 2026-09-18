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
import { getChapterMeta } from '../../../data/chapter-meta.ts';
import { escapeHtml } from '../../common/html.ts';
import {
  eyebrowHtml,
  heroArtCandidates,
  objectivesHtml,
  snapshotsHtml,
  tipHtml,
} from '../../common/chapterPanel.ts';
import './chapter-panel-tab.css';

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
          <div class="prepchap__col">
            <div class="cpanel__eyebrow">${eyebrowHtml(meta)}</div>
            <h2 class="cpanel__title">${escapeHtml(meta.title)}</h2>
            <div class="cpanel__subtitle">${escapeHtml(meta.subtitle)}</div>
            <div class="cpanel__where">${escapeHtml(meta.location)}</div>
            <p class="cpanel__blurb">${escapeHtml(meta.blurb)}</p>
            <div class="cpanel__snaps">${snapshotsHtml(meta)}</div>
          </div>
          <div class="prepchap__col prepchap__col--brief">
            ${objectivesHtml(meta)}
            ${tipHtml(meta)}
          </div>
        </div>
      </div>`;
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
  };
}
