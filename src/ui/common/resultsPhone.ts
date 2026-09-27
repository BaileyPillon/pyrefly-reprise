/**
 * The Victory and Defeat results on an upright phone: PR-0001, option B
 * "full-bleed painting, ink sheet" (Bailey, 2026-09-26: "I'll go with all of
 * your recommendations"; target `docs/concepts/phone-2026-09-26/pr0001-victory-B.jpg`
 * and `pr0001-defeat-B.jpg`, mockup `results-mock.html?v=B`).
 *
 * Game case (AGENTS.md rule 14): **both**. The results screen is shared
 * plumbing; each game keeps its accent (FFX gold, FFX-2 pink, through
 * `.ig--ffx2`), a defeat has none, and Chapter IV's silent page stays drained.
 *
 * On a window that matches {@link RESULTS_PHONE_QUERY} the page leaves the
 * 640x360 letterbox (which scaled it to about 390x220, labels at 4 px) and
 * fills the screen: the painting full-bleed with a face-safe crop, the title
 * over it, the spoils as ink tallies, the party as chips (the gain on a win,
 * the level on a loss; the per-member dressphere / AP line is dropped here
 * only), and CONFIRM or RETRY / CHAPTER SELECT pinned at the thumb. One
 * screen, no scroll; every text 14 px or more, buttons 58 px tall
 * (`results-phone.css`). Every other window keeps the desktop page.
 */

import './results-phone.css';
import type { Chapter } from '../../data/encounters.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { coverCropBox } from './coverCrop.ts';
import { escapeHtml } from './html.ts';
import { PHONE_BATTLE_QUERY } from './phoneBattle.ts';
import { portraitCrop, portraitImgHtml } from './portrait.ts';
import { formatNumber, ITEMS_LONG_CHARS, leaderId } from './resultsMath.ts';
import { DEFEAT_ACTIONS, ledgerValueText, memberFaceHtml, type ResultsPageModel } from './resultsPage.ts';
import { wedgeFallenArt, wedgeFigureId, wedgePortraitId, type VictoryLine } from './victoryLine.ts';

/** An upright phone: the same query the phone battle HUD uses, so the two never disagree. */
export const RESULTS_PHONE_QUERY = PHONE_BATTLE_QUERY;

/** Whether `win` should get the phone page. False where `matchMedia` is missing (tests, old engines). */
export function isPhoneResults(win: { matchMedia?: Window['matchMedia'] } | undefined): boolean {
  return typeof win?.matchMedia === 'function' && win.matchMedia(RESULTS_PHONE_QUERY).matches === true;
}

/**
 * Where the face sits on the phone: eyes centred across the screen and on the
 * upper third, above the title (the target's `object-position: 50% 0` on
 * `yuna-x2`, eye line at 0.34 of 844). The cover clamp wins over both, so the
 * painting always fills the screen.
 */
export const PHONE_HERO_FACE = { ipd: 0.3, eyeX: 0.5, eyeY: 0.34 } as const;

/**
 * The lowest the eye line may sit, as a fraction of the screen's height: the
 * title stands at about 0.44 of an 844 px phone, and the eyes stay above it.
 */
export const PHONE_HERO_MAX_EYE_Y = 0.42;

/**
 * The victory portrait's box on a `w` x `h` phone, from the measured
 * `face-crops.json` row. A square portrait covering a tall screen has no room
 * to move up, so one painted with its eyes low (FFX Rikku, eye line at 0.54
 * of the image) would put them under the title; that one is zoomed just
 * enough to lift the eye line to {@link PHONE_HERO_MAX_EYE_Y}.
 */
export function phoneHeroBox(id: string, w: number, h: number): { left: number; top: number; width: number; height: number } {
  const crop = portraitCrop(id);
  const box = coverCropBox(crop, w, h, PHONE_HERO_FACE);
  if (box.top + crop.fy * box.height <= PHONE_HERO_MAX_EYE_Y * h || crop.fy >= 1) return box;
  const tall = (h - PHONE_HERO_MAX_EYE_Y * h) / (1 - crop.fy);
  return coverCropBox(crop, w, h, { ...PHONE_HERO_FACE, ipd: (crop.ipd * tall * crop.aspect) / w });
}

/** The inline style that places `id`'s portrait full-bleed on a `w` x `h` screen. */
export function phoneHeroStyle(id: string, w: number, h: number): string {
  const box = phoneHeroBox(id, w, h);
  return (
    `position:absolute;left:${box.left.toFixed(2)}px;top:${box.top.toFixed(2)}px;` +
    `width:${box.width.toFixed(2)}px;height:${box.height.toFixed(2)}px;max-width:none;object-fit:fill`
  );
}

/** What the phone's painting shows: a win's portrait, or a loss's fallen pose. */
export type PhoneHero = { victory: true; portraitId: string } | { victory: false; hurtUrl: string; koUrl: string } | null;

/**
 * The same figure the desktop wedge stands (VL-1, FOC17-01): a win's speaker
 * or leader in the chapter's own game's likeness, a loss's leader fallen.
 */
export function phoneHeroFigure(chapter: Chapter | undefined, victory: boolean, quip: VictoryLine | undefined): PhoneHero {
  const figure = wedgeFigureId(victory, quip, leaderId(chapter));
  if (!figure) return null;
  if (victory) return { victory: true, portraitId: wedgePortraitId(figure, chapter) };
  const [hurt, ko] = wedgeFallenArt(chapter, figure);
  return { victory: false, hurtUrl: artUrl(hurt), koUrl: artUrl(ko) };
}

/**
 * The full-bleed painting: a win's face-cropped portrait (`manualCrop`, so the
 * portrait module's DOM sweep leaves its box alone), or a loss's fallen pose
 * `[hurt, ko]` sunk into the dark, falling back to KO and then to no figure.
 */
export function phoneHeroHtml(hero: PhoneHero, w: number, h: number): string {
  if (!hero) return '';
  if (hero.victory) {
    return portraitImgHtml(hero.portraitId, '', { style: phoneHeroStyle(hero.portraitId, w, h), manualCrop: true }).replace(
      '<img ',
      `<img class="rresp__hero" data-portrait="${escapeHtml(hero.portraitId)}" `,
    );
  }
  return `<img class="rresp__hero rresp__hero--fallen" src="${hero.hurtUrl}" data-fallback="${hero.koUrl}" alt=""
      draggable="false" onerror="if(this.dataset.fallback){this.src=this.dataset.fallback;this.dataset.fallback='';}else{this.remove();}" />`;
}

/** The phone stage's fixed layers: the painting, its shade, and the page `refresh()` rewrites. */
export function phoneShellHtml(heroHtml: string): string {
  return `
      <div class="rresp__bleed">${heroHtml}</div>
      <div class="rresp__shade"></div>
      <div class="rres__page rresp__page"></div>
    `;
}

/** The chips' grid: one row for up to three, two by two for four, rows of three past that. */
function chipsClass(n: number): string {
  return n <= 4 ? `rresp__chips--n${Math.max(1, n)}` : 'rresp__chips--many';
}

function talliesHtml(m: ResultsPageModel): string {
  return m.ledger
    .map((line) => {
      const items = line.kind === 'items';
      const wide = items && line.value.length > ITEMS_LONG_CHARS ? ' rresp__tally--wide' : '';
      const detail = line.detail ? `<div class="rresp__d">${escapeHtml(line.detail)}</div>` : '';
      return `<div class="rresp__tally${wide}">
          <div class="rresp__k">${escapeHtml(line.key)}</div>
          <div class="rresp__v${items ? ' rresp__v--items' : ''}">${ledgerValueText(line, m.progress)}</div>
          ${detail}
        </div>`;
    })
    .join('');
}

function chipsHtml(m: ResultsPageModel): string {
  const p = m.progress;
  return m.rows
    .map((row) => {
      // A win: the gain (and a level gained, once the count lands). A loss:
      // where the member stands (`S.LV 180` in FFX, `LV 46` in FFX-2).
      const up =
        row.levelDelta > 0 && p >= 1
          ? `<span class="rresp__up">+${row.levelDelta} ${escapeHtml(row.levelUnit.toUpperCase())}</span>`
          : '';
      const lines = m.victory
        ? `<div class="rresp__gains"><span class="rresp__gain">+${formatNumber(Math.round(row.award * p))} <small>${row.awardUnit}</small></span>${up}</div>`
        : `<div class="rresp__lv">${escapeHtml(row.standing)}</div>`;
      return `<div class="rresp__chip-member">
          <div class="rresp__face">${memberFaceHtml(row)}</div>
          <div class="rresp__name">${escapeHtml(row.name)}</div>
          ${lines}
        </div>`;
    })
    .join('');
}

function dockHtml(m: ResultsPageModel): string {
  if (m.victory) {
    return `<div class="rresp__btn rresp__btn--lit" data-action="confirm" role="button" tabindex="0"><span>CONFIRM ▸</span></div>`;
  }
  return DEFEAT_ACTIONS.map((action, i) => {
    const lit = i === m.actionIndex ? ' rresp__btn--lit' : ' rresp__btn--ghost';
    return `<div class="rresp__btn${lit}" data-action="results:${action.choice}" role="button" tabindex="0"><span>${action.label}</span></div>`;
  }).join('');
}

/** The phone page (`.rres__page`'s contents): clock, caption, title, tallies, chips, dock. */
export function phonePageHtml(m: ResultsPageModel, caption: string): string {
  const tags = m.tags.map((t) => `<span class="rresp__tag">${escapeHtml(t)}</span>`).join('');
  const quip = m.quip
    ? `<div class="rresp__quip" data-speaker="${escapeHtml(m.quip.speakerId)}">${escapeHtml(m.quip.line)}</div>`
    : '';
  return `
      <div class="rresp__top">
        <div class="rresp__clock">RESULTS &middot; ${escapeHtml(m.clock)}</div>
        <div class="rresp__caption">${caption}</div>
      </div>
      <div class="rresp__head">
        <div class="rresp__title-row"><span class="rresp__title">${m.heading}</span>${tags}</div>
        <div class="rresp__rule"></div>
        ${quip}
      </div>
      <div class="rresp__tallies">${talliesHtml(m)}</div>
      <div class="rresp__chips ${chipsClass(m.rows.length)}">${chipsHtml(m)}</div>
      <div class="rresp__dock">${dockHtml(m)}</div>
    `;
}
