/**
 * The rule wall at `explode` 1 (`b3-inventory.png`): the markup half of
 * `wall.ts`.
 *
 * It is laid out by the browser inside the chrome-free region and **panned by
 * drag** when it is taller than that region, rather than shrunk: 137 named
 * rules cannot be squeezed into 671px of stage without dropping the type
 * under 13px, and an unreadable tile is worse than a scroll. The flow carries
 * `data-inv-flow`, which is the handle `learn/shared/stage.ts` pans.
 */

import { escapeHtml, highlightNumbers } from '../shared/text.ts';
import type { WallBlock } from './wall.ts';
import type { StudioComponentId } from './rules.ts';

/**
 * How many tiles of each tier fit across the chrome-free stage. The frame fits
 * more per row because its wall is 1216px wide and this one is 812; these are
 * the counts at which the longest name in each tier still fits without being
 * clipped ("Step 13 · Damage limit", "Strong delay").
 */
const PER_ROW: Readonly<Record<WallBlock['size'], number>> = { L: 3, M: 4, S: 6 };

function glyph(component: StudioComponentId): string {
  return `<i class="pyb-gl pyb-gl--${escapeHtml(component)}"></i>`;
}

function tileHtml(
  block: WallBlock,
  tile: WallBlock['tiles'][number],
  systemOf: (component: StudioComponentId) => string,
  selectedId: string | null,
): string {
  const sel = tile.pieceId === selectedId ? ' pyb-tile--sel' : '';
  const common = `data-piece-id="${escapeHtml(tile.pieceId)}" data-system-id="${escapeHtml(systemOf(tile.component))}" role="button" tabindex="0" aria-label="${escapeHtml(tile.name)}"`;
  if (block.size === 'L') {
    return `<div class="pyb-tile pyb-tile--l${sel}" ${common}>${glyph(tile.component)}
      <span class="pyb-tile__n">${escapeHtml(tile.name)}</span>
      <span class="pyb-tile__fx">${escapeHtml(tile.line)}</span><span class="pyb-tile__no">${escapeHtml(tile.badge)}</span></div>`;
  }
  return `<div class="pyb-tile pyb-tile--${block.size === 'M' ? 'm' : 's'}${sel}" ${common}>${glyph(tile.component)}
    <span class="pyb-tile__n">${escapeHtml(tile.name)}</span></div>`;
}

/** The whole wall: three tier blocks, each closed by its own counted caption. */
export function paintWall(
  blocks: readonly WallBlock[],
  systemOf: (component: StudioComponentId) => string,
  selectedId: string | null,
): string {
  if (blocks.length === 0) return '<div class="pyb-wall" data-inv-flow><p class="pyb-wall__empty">No rules visible. Turn a component back on in the panel.</p></div>';

  const html = blocks
    .map((block) => {
      const tiles = block.tiles.map((tile) => tileHtml(block, tile, systemOf, selectedId)).join('');
      return `<div class="pyb-wall__b pyb-wall__b--${block.size.toLowerCase()}" style="--pyb-cols:${PER_ROW[block.size]}">${tiles}</div>
        <div class="pyb-wall__cap">${highlightNumbers(block.caption)}</div>`;
    })
    .join('');

  return `<div class="pyb-wall" data-inv-flow>${html}</div>`;
}
