/**
 * Option C, "the victory ribbon": how chapter select teaches which chapters
 * are beaten and how far the player has come.
 *
 * Bailey, 2026-09-25: "I'll go with C a victory ribbon", then "All
 * recommendations" (D-183). Target: `docs/concepts/chapter-select-v2/option-C/`.
 * - A beaten chapter's plate carries a gold sash, VICTORY and its best time.
 * - A beaten chapter's card carries a small gold ribbon across its top-right
 *   corner, with the best time on it (the critique's fix: the target's ribbon
 *   was a bare star).
 * - Under the plate, a strip lists every listed chapter by numeral, FFX then
 *   FFX-2: lit once beaten (gold for FFX, pink for FFX-2), hatched while
 *   coming, underlined when selected, with "N of M beaten". The pips are flat
 *   marks, not buttons (the critique's fix: they read as a second rail).
 *
 * The counts come from the board's own tiles, which come from the chapter
 * registry and the save, so only LISTED chapters count: an unlisted chapter
 * cleared through the debug API never moves "N of M", and a COMING card is
 * never part of M.
 *
 * Pure: no DOM. Game-aware (AGENTS.md rule 14): **both**. The only per-game
 * part is the pip colour, the existing `.ig--ffx2` pink accent.
 */

import type { GameId } from '../../../battle/common/types.ts';
import { escapeHtml } from '../../../ui/common/html.ts';
import { formatClearTime } from '../../../ui/common/resultsMath.ts';
import type { ChapterTile } from './chapterGrid.ts';

/** One mark on the progress strip. */
export interface ProgressPip {
  readonly id: string;
  readonly game: GameId;
  readonly numeral: string;
  readonly lit: boolean;
  readonly coming: boolean;
  readonly selected: boolean;
}

export interface BoardProgress {
  /** Listed, playable chapters the save has beaten. */
  readonly beaten: number;
  /** Listed, playable chapters. A coming card is not one. */
  readonly total: number;
  /** Every card on the board, in board order. */
  readonly pips: readonly ProgressPip[];
}

/** "N of M beaten" and the strip's marks, from the board's own tiles. */
export function boardProgress(tiles: readonly ChapterTile[], selected: number): BoardProgress {
  const playable = tiles.filter((t) => t.playable);
  return {
    beaten: playable.filter((t) => t.cleared).length,
    total: playable.length,
    pips: tiles.map((t, i) => ({
      id: t.id,
      game: t.game,
      numeral: t.numeral ?? '',
      lit: t.playable && t.cleared,
      coming: !t.playable,
      selected: i === selected,
    })),
  };
}

/** The best time as the ribbon and the sash print it (`4:12`), or `null`. */
export function victoryTime(bestTimeMs: number | null | undefined): string | null {
  if (bestTimeMs === null || bestTimeMs === undefined) return null;
  // `formatClearTime` prints `m:ss`; the ribbon keeps it whole.
  return formatClearTime(bestTimeMs);
}

function pipHtml(p: ProgressPip): string {
  const cls = [
    'cs-pip',
    p.lit ? 'is-lit' : '',
    p.coming ? 'is-coming' : '',
    p.selected ? 'is-sel' : '',
    p.game === 'ffx2' ? 'is-x2' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<span class="${cls}" data-pip="${escapeHtml(p.id)}">${escapeHtml(p.numeral)}</span>`;
}

/** The progress strip under the plate. Decoration only: `aria-hidden` pips, one spoken sentence. */
export function progressStripHtml(progress: BoardProgress): string {
  const group = (game: GameId, label: string): string => {
    const own = progress.pips.filter((p) => p.game === game);
    if (own.length === 0) return '';
    return `<span class="cs-strip__game${game === 'ffx2' ? ' cs-strip__game--x2' : ''}">${label}</span>${own.map(pipHtml).join('')}`;
  };
  const said = `${progress.beaten} of ${progress.total} chapters beaten`;
  return `
    <div class="cs-strip" role="img" aria-label="${escapeHtml(said)}">
      <div class="cs-strip__count"><b>${progress.beaten}</b><span class="cs-strip__of">of ${progress.total} beaten</span><span class="cs-strip__slash">/${progress.total}</span></div>
      <div class="cs-strip__pips" aria-hidden="true">${group('ffx', 'X')}${group('ffx2', 'X-2')}</div>
    </div>
  `;
}

/** The gold sash across the plate's corner, only on a beaten chapter. */
export function victorySashHtml(tile: Pick<ChapterTile, 'cleared' | 'playable'>, bestTimeMs: number | null): string {
  if (!tile.playable || !tile.cleared) return '';
  const time = victoryTime(bestTimeMs);
  return `<div class="cs-sash" aria-label="Beaten${time ? `, best ${time}` : ''}"><div class="cs-sash__band"><span>Victory</span>${time ? `<b>${escapeHtml(time)}</b>` : ''}</div></div>`;
}

/** The small ribbon across a beaten card's top-right corner. */
export function cardRibbonHtml(tile: Pick<ChapterTile, 'cleared' | 'playable'>, bestTimeMs: number | null): string {
  if (!tile.playable || !tile.cleared) return '';
  const time = victoryTime(bestTimeMs);
  return `<span class="fe-card__ribbon" title="Beaten"><i>${time ? escapeHtml(time) : '&#10022;'}</i></span>`;
}
