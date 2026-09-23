/**
 * Markup for the showpiece chapter board: the hero plate, the prose slab, the
 * grouped card rail and the dossier.
 *
 * Approved end state:
 * `docs/concepts/polish/showpiece-frontend/chapter-select.png`. The base look
 * is the approved tile `docs/screenshots/mockups/A-chapter-select.jpg`; what
 * this adds is the boss silhouettes and the two game groups.
 *
 * Split out of `ChapterSelectScreen.ts` so both stay under the 400-line house
 * limit. Everything here is a pure string builder — the screen owns the DOM,
 * the input and the save.
 */

import type { Chapter } from '../../../data/encounters.ts';
import { artUrl } from '../../../engine/PaintedArt.ts';
import { escapeHtml } from '../../../ui/common/html.ts';
import { partyFaceHtml, type PartyFaceMember } from '../../../ui/common/partyFace.ts';
import { formatClearTime } from '../../../ui/common/resultsMath.ts';
import type { ChapterGroup, ChapterTile } from './chapterGrid.ts';
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
 * A boss painting drawn as an ink silhouette.
 *
 * The painting is an approved file in `public/art/characters/`; the silhouette
 * is the `.fe-sil` CSS filter over it, so nothing is generated and the
 * approved art is never replaced (hard rules 8 and 9).
 */
function silHtml(key: string, className: string): string {
  const src = artUrl(`art/characters/${key}/idle.png`);
  return (
    `<span class="${className}">` +
    `<img class="fe-sil" src="${src}" alt="" draggable="false" onerror="this.parentElement?.remove()">` +
    `</span>`
  );
}

/** The backdrop `<img>` for a plate, or nothing when there is no painting. */
function plateHtml(sceneKey: string | null, alt: string): string {
  if (!sceneKey) return '';
  const src = artUrl(`art/backdrops/${sceneKey}.png`);
  return `<img src="${src}" alt="${escapeHtml(alt)}" draggable="false" onerror="this.remove()">`;
}

/**
 * The selected chapter, big.
 *
 * Cleared or not, the hero plate always carries the silhouette: this is the
 * card the player is looking at, and the boss reading as a shape is the whole
 * point of the board. It is the *rail* cards that swap silhouette for painting
 * once a chapter is behind you.
 */
export function heroHtml(tile: ChapterTile, index: number): string {
  const sils = tile.silhouetteKeys;
  const back = sils.length > 1 ? silHtml(sils[0]!, 'fe-hero__sil fe-hero__sil--back') : '';
  const front = sils.length > 0 ? silHtml(sils[sils.length - 1]!, 'fe-hero__sil') : '';
  const numeral = tile.numeral ? `Chapter ${tile.numeral}` : 'Coming';
  return `
    <div class="fe-hero" data-action="fe-card-${index}" role="button" tabindex="0"
         aria-label="${escapeHtml(tile.title)}">
      <div class="fe-hero__art">${plateHtml(tile.sceneKey, tile.title)}</div>
      ${tile.sceneKey ? '' : '<div class="fe-card__locked"></div>'}
      <div class="fe-hero__fade"></div>
      ${back}${front}
      ${tile.cleared ? '<div class="fe-hero__check" title="Cleared">&#10003;</div>' : ''}
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
 * One rail card.
 *
 * An uncleared chapter shows its boss as an ink silhouette and its name, and
 * **nothing else** — no subtitle, no location, no blurb, because those are the
 * spoiler. A cleared one shows the painting instead: the shape has done its
 * job and the place is the reward.
 */
export function cardHtml(tile: ChapterTile, index: number): string {
  if (!tile.playable) {
    return `
      <div class="fe-card fe-card--coming" aria-disabled="true"
           aria-label="${escapeHtml(tile.title)} — coming">
        <div class="fe-card__locked"></div>
        ${tile.silhouetteKeys[0] ? silHtml(tile.silhouetteKeys[0], 'fe-card__sil') : ''}
        <div class="fe-card__name">${escapeHtml(tile.title)}</div>
        <div class="fe-card__coming">Coming</div>
      </div>
    `;
  }
  const sil = tile.cleared ? '' : tile.silhouetteKeys.at(-1);
  return `
    <div class="fe-card${tile.cleared ? ' fe-card--cleared' : ''}"
         data-action="fe-card-${index}" role="button" tabindex="0"
         aria-label="${escapeHtml(tile.title)}">
      <div class="fe-card__art">${plateHtml(tile.sceneKey, tile.title)}</div>
      <div class="fe-card__fade"></div>
      ${sil ? silHtml(sil, 'fe-card__sil') : ''}
      ${tile.numeral ? `<span class="fe-card__num">${tile.numeral}</span>` : ''}
      ${tile.cleared ? '<span class="fe-card__check" title="Cleared">&#10003;</span>' : ''}
      <div class="fe-card__name">${escapeHtml(tile.title)}</div>
    </div>
  `;
}

/**
 * The whole rail: two game groups, every tile but the selected one.
 *
 * The cards are flex items with no fixed height, so five chapters and eight
 * chapters both fill the same rail without a scrollbar and without a rewrite
 * the day a chapter lands.
 */
export function railHtml(groups: readonly ChapterGroup[], tiles: readonly ChapterTile[], selected: number): string {
  const indexOf = new Map(tiles.map((t, i) => [t.id, i]));
  return groups
    .map((group) => {
      const cards = group.tiles
        .filter((t) => indexOf.get(t.id) !== selected)
        .map((t) => cardHtml(t, indexOf.get(t.id) ?? -1))
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
