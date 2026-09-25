/**
 * Markup for the chapter board: the hero plate, the prose slab, the fixed
 * card list and the dossier.
 *
 * Approved end state (D-183, Bailey 2026-09-25, "I'll go with C a victory
 * ribbon" and "All recommendations"): `docs/concepts/chapter-select-v2/`
 * option C, with every plate and card showing the boss painted on its own
 * scene (`chapterPlates.ts`) and the fixed list. It replaces the silhouette
 * board of `docs/concepts/polish/showpiece-frontend/chapter-select.png`; the
 * Ink & Gold chrome, the prose slab and the dossier are unchanged.
 *
 * Split out of `ChapterSelectScreen.ts` so both stay under the 400-line house
 * limit. Everything here is a pure string builder — the screen owns the DOM,
 * the input and the save.
 */

import type { Chapter } from '../../../data/encounters.ts';
import { escapeHtml } from '../../../ui/common/html.ts';
import { partyFaceHtml, type PartyFaceMember } from '../../../ui/common/partyFace.ts';
import { formatClearTime } from '../../../ui/common/resultsMath.ts';
import type { ChapterGroup, ChapterTile } from './chapterGrid.ts';
import { cardRibbonHtml, victorySashHtml } from './chapterProgress.ts';
import { plateArtHtml } from './chapterPlates.ts';
import './party-face-placeholder.css';

/** Every enemy in the chapter's first formation, as one line. */
export function bossNames(chapter: Chapter): string {
  return chapter.enemyGroupRef.enemies.map((e) => e.name).join(' + ');
}

/** The three who actually walk in — FFX's active slots, FFX-2's whole trio. */
export function recommendedParty(chapter: Chapter): PartyFaceMember[] {
  const build = chapter.buildRef;
  if (build.game === 'ffx') {
    return build.activeSlots.flatMap((id) => {
      const m = build.members.find((x) => x.id === id);
      return m ? [{ id: m.id, name: m.name }] : [];
    });
  }
  return build.members.map((m) => ({ id: m.id, name: m.name, dressphere: m.currentDressphere }));
}

/**
 * The selected chapter, big: its boss painted on its own scene (D-183), the
 * chapter numeral and name bottom-left, and the VICTORY sash once beaten.
 * The whole plate is the begin button (the second click of the two-click rule).
 */
export function heroHtml(tile: ChapterTile, index: number, bestTimeMs: number | null = null): string {
  const numeral = tile.numeral ? `Chapter ${tile.numeral}` : 'Coming';
  return `
    <div class="fe-hero${tile.cleared ? ' fe-hero--cleared' : ''}" data-action="fe-card-${index}" role="button" tabindex="0"
         aria-label="${escapeHtml(tile.title)}">
      <div class="fe-hero__art">${plateArtHtml(tile, 'hero')}</div>
      <div class="fe-hero__fade"></div>
      ${victorySashHtml(tile, bestTimeMs)}
      <div class="fe-hero__num">${escapeHtml(numeral)}</div>
      <div class="fe-hero__name">${escapeHtml(tile.title)}</div>
    </div>
  `;
}

/** The ivory slab under the hero: what the chapter *is*. */
export function proseHtml(tile: ChapterTile): string {
  const chapter = tile.chapter;
  if (!chapter) {
    return `
      <div class="fe-prose">
        <div class="fe-prose__title">${escapeHtml(tile.title)}</div>
        <div class="fe-prose__body">Approved and not yet built. It joins the board the day its
          encounter data lands.</div>
      </div>
    `;
  }
  const badge = chapter.game === 'ffx' ? 'CTB' : 'ATB';
  return `
    <div class="fe-prose">
      <div class="fe-prose__title">${escapeHtml(chapter.subtitle)}</div>
      <div class="fe-prose__body">${escapeHtml(chapter.blurb)}</div>
      <span class="fe-prose__badge">${badge}</span>
    </div>
  `;
}

/**
 * One card of the fixed list (D-183): the numeral in its own column, the name
 * beside it, the boss painted on its scene behind, and the gold ribbon once
 * beaten. The selected card is the same element lit in place (gold frame,
 * gold numeral block, the notch), so nothing moves when the cursor does.
 *
 * A COMING card has no `data-action`: it can never be selected or started.
 */
export function cardHtml(tile: ChapterTile, index: number, selected: boolean, bestTimeMs: number | null = null): string {
  const num = `<span class="fe-card__num">${escapeHtml(tile.numeral ?? '')}</span>`;
  const name = `<span class="fe-card__name">${escapeHtml(tile.title)}</span>`;
  const art = `<div class="fe-card__art">${plateArtHtml(tile, 'card')}</div><div class="fe-card__fade"></div>`;
  if (!tile.playable) {
    return `
      <div class="fe-card fe-card--coming" data-card="${escapeHtml(tile.id)}" aria-disabled="true"
           aria-label="${escapeHtml(tile.title)} — coming">
        ${art}${num}${name}<span class="fe-card__coming">Coming</span>
      </div>
    `;
  }
  const cls = `fe-card${tile.cleared ? ' fe-card--cleared' : ''}${selected ? ' fe-card--sel' : ''}`;
  return `
    <div class="${cls}" data-card="${escapeHtml(tile.id)}" data-action="fe-card-${index}" role="button" tabindex="0"
         aria-label="${escapeHtml(tile.title)}"${selected ? ' aria-current="true"' : ''}>
      ${art}${num}${name}${cardRibbonHtml(tile, bestTimeMs)}
    </div>
  `;
}

/**
 * The whole list: two game groups, **every** tile in its place (D-183).
 *
 * The rail once dropped the selected tile (it had moved up to the plate), so
 * every card below slid up one place and a second click on the same spot
 * landed on the next chapter (Bailey: "If I click Evrae then click its again
 * it's Yojimbo"). Now the list never changes shape: the selected card is lit
 * where it sits. The cards are flex items with no fixed height, so the list
 * fills the same rail whatever the chapter count.
 */
export function railHtml(
  groups: readonly ChapterGroup[],
  tiles: readonly ChapterTile[],
  selected: number,
  bestTimeOf: (id: string) => number | null = () => null,
): string {
  const indexOf = new Map(tiles.map((t, i) => [t.id, i]));
  return groups
    .map((group) => {
      const cards = group.tiles
        .map((t) => {
          const i = indexOf.get(t.id) ?? -1;
          return cardHtml(t, i, i === selected, t.cleared ? bestTimeOf(t.id) : null);
        })
        .join('');
      if (!cards) return '';
      return (
        `<div class="fe-rail__group${group.game === 'ffx2' ? ' ig--ffx2' : ''}">` +
        `${escapeHtml(group.label)}<i></i></div>${cards}`
      );
    })
    .join('');
}

/** The right-hand dossier: where, who you take, what you fight, how fast. */
export function asideHtml(tile: ChapterTile, bestTimeMs: number | null): string {
  const chapter = tile.chapter;
  const location = `
    <div class="fe-aside__key">Location</div>
    <div class="fe-aside__value">${escapeHtml(tile.location)}</div>
    <div class="fe-aside__rule"></div>
  `;
  if (!chapter) {
    return `${location}
      <div class="fe-aside__key">Status</div>
      <div class="fe-aside__value fe-aside__value--plain fe-aside__value--none">Approved, not yet built</div>
    `;
  }
  const best = bestTimeMs !== null ? formatClearTime(bestTimeMs) : null;
  const party = recommendedParty(chapter)
    .map(
      // PR-0065 (round 09): a grey letter tile painted as if it were the
      // answer, for however long the real portrait takes to decode, is
      // exactly what CHK-012 calls out — "a fallback never ships as the
      // final face". The round's own fix note allows the alternative to
      // waiting on `img.decode()` (which belongs to `ChapterSelectScreen.ts`,
      // outside this track): "make the fallback the ink silhouette the
      // locked cards already use, so no state of this screen ever shows a
      // letter." `.fe-party__ph` is that — a plain CSS bust silhouette, no
      // text, no per-character art — so there is no longer a letter for a
      // slow network to catch mid-reveal (the load-order dance this used to
      // need to hide it, `dossierFaceReveal.ts`, went with it: nothing left
      // to hide). The initial still exists, for a screen reader, as text a
      // sighted player never sees.
      (m) => `
        <div class="fe-party__tile">
          <div class="fe-party__face">${partyFaceHtml(m, { z: 1 })}<span class="fe-party__ph" aria-hidden="true"></span><span class="fe-party__sr">${escapeHtml(
            m.name.charAt(0).toUpperCase(),
          )}</span></div>
          <span class="fe-party__name">${escapeHtml(m.name)}</span>
        </div>
      `,
    )
    .join('');
  return `${location}
    <div class="fe-aside__key">Boss</div>
    <div class="fe-aside__value fe-aside__value--plain">${escapeHtml(bossNames(chapter))}</div>
    <div class="fe-aside__rule"></div>
    <div class="fe-aside__key">Party</div>
    <div class="fe-party">${party}</div>
    <div class="fe-aside__rule"></div>
    <div class="fe-aside__key">Best</div>
    <div class="fe-aside__value fe-aside__value--plain${
      best === null ? ' fe-aside__value--none' : ''
    }">${best ?? 'Not cleared'}</div>
  `;
}
