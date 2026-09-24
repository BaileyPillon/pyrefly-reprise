/**
 * PR-0127 at phone width, option A "stacked cards" (Bailey, D-071; both games,
 * the prep shell and its CHAPTER card are shared).
 *
 * The target is `docs/concepts/layout/pr-0127-phone/sheet.jpg`, option A: at
 * 390x844 the 16:9 prep stage scaled to 0.61 left the CHAPTER card's type at
 * 4-7 px. Under 600 CSS px wide, while the CHAPTER tab is open, the stage
 * stops being a scaled 640x360 board and becomes one scrolling column — the
 * title strip over the hero painting, place, story, the three photos,
 * objectives, TIP, then the party — with START BATTLE pinned to the bottom
 * and a "MORE BELOW" cue while there is more page under it.
 *
 * The layout itself is CSS (`src/ui/common/party-prep-phone.css`, keyed on
 * the `data-tab` this module keeps on `.prep` and a width media query), so the
 * desktop sizes are untouched by construction: every rule sits inside
 * `@media (max-width: 599px)`. This module only adds the four small pieces of
 * chrome the stacked page needs and the shell has no element for (the short
 * `FFX-2 · VI` corner label, the PARTY heading, the dock behind START BATTLE
 * and the cue), keeps the cue honest on scroll and resize, and keeps the
 * browser's own PageUp / PageDown from scrolling the page a second time on
 * top of the CHAPTER tab's L1 / R1 paging (`pageChapterColumns`).
 */

import '../../../ui/common/party-prep-phone.css';
import type { Chapter } from '../../../data/encounters.ts';
import { romanNumeral } from '../../../ui/common/roman.ts';

/** The width the stacked layout takes over below. Mirrors the CSS media query. */
export const PHONE_PREP_QUERY = '(max-width: 599px)';

export interface PhonePrep {
  /** The shell switched tab (null: its own fallback sheet). */
  setTab(id: string | null): void;
  /** Recompute the cue now (after content changes). */
  update(): void;
  destroy(): void;
}

/** True when the prep page is a phone-width stacked page that can scroll further down. */
export function hasMoreBelow(prep: HTMLElement): boolean {
  return prep.scrollHeight - prep.clientHeight > 1 && prep.scrollTop + prep.clientHeight < prep.scrollHeight - 8;
}

/** The short game and numeral label the stacked page shows top right, e.g. `FFX-2 · VI`. */
export function phoneWhereLabel(chapter: Pick<Chapter, 'game' | 'number'>): string {
  return `${chapter.game === 'ffx2' ? 'FFX-2' : 'FFX'} · ${romanNumeral(chapter.number)}`;
}

function el(cls: string, html = ''): HTMLElement {
  const e = document.createElement('div');
  e.className = cls;
  e.setAttribute('aria-hidden', 'true');
  e.innerHTML = html;
  return e;
}

/**
 * Add the stacked page's chrome to the shell's stage and keep it current.
 * `prep` is the stage's outer element (`.prep`), `stage` its inner one.
 */
export function installPhonePrep(prep: HTMLElement, stage: HTMLElement, chapter: Chapter): PhonePrep {
  const where = el('prep__phone-where');
  where.textContent = phoneWhereLabel(chapter);
  const party = el('prep__phone-party', 'PARTY');
  const dock = el('prep__phone-dock');
  const cue = el('prep__phone-cue', '<span>&#9660; MORE BELOW</span>');
  stage.append(where, party, dock, cue);

  const mq = typeof window.matchMedia === 'function' ? window.matchMedia(PHONE_PREP_QUERY) : null;
  const update = (): void => {
    cue.classList.toggle('is-visible', hasMoreBelow(prep));
  };
  const onKey = (e: KeyboardEvent): void => {
    // The CHAPTER tab pages the page itself on L1 / R1 (PageUp / PageDown);
    // the browser's default scroll of the same key would move it twice.
    if (prep.dataset['tab'] !== 'chapter' || !mq?.matches) return;
    if (e.code === 'PageDown' || e.code === 'PageUp') e.preventDefault();
  };
  prep.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('keydown', onKey);
  // Fonts and the panel's own content settle after mount and change the
  // stacked page's height; the stage is `height: auto` there, so watch it.
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null;
  ro?.observe(stage);

  return {
    setTab(id) {
      if (id) prep.dataset['tab'] = id;
      else delete prep.dataset['tab'];
      prep.scrollTop = 0;
      update();
      window.requestAnimationFrame(update);
    },
    update,
    destroy() {
      prep.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('keydown', onKey);
      ro?.disconnect();
    },
  };
}
