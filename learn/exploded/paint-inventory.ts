/**
 * The catalogue at `explode` 1: every piece this game ships, laid flat.
 *
 * The approved frame `c3-inventory.png` shows a dense mosaic of real
 * thumbnails with the chapter's own pieces outlined in gold. This keeps that
 * — real paintings, gold outlines — and adds what the mockup could leave
 * out: a heading and a count per component, and a name under every tile.
 * (Both are lessons from sites A and B: an inventory of anonymous squares
 * says nothing, and a grouped one reads.)
 *
 * It sits in the stage's inventory host, which is outside the camera, so the
 * type here never tilts, zooms or drops below 13px; when the flow is taller
 * than the chrome-free box the shared stage pans it by drag.
 */

import { buildInventory } from '../shared/inventory.ts';
import type { Piece, Specimen } from '../shared/model.ts';
import { escapeHtml } from '../shared/text.ts';
import type { ChapterUse } from './chapter-use.ts';
import { usedByChapter } from './chapter-use.ts';
import { thumbKeyForPiece, thumbUrl } from './thumbs.ts';

export interface InventoryContext {
  readonly specimen: Specimen;
  readonly visible: readonly Piece[];
  readonly use: ChapterUse;
  readonly selectedId: string | null;
  /** The chapter the gold outlines mean, e.g. "Chapter II". */
  readonly chapterLabel: string;
}

/** Which shape a tile takes, from the family its piece belongs to. */
function shapeFor(pieceId: string): 'cut' | 'wide' | 'face' | 'plate' {
  if (pieceId.startsWith('asset-backdrop-')) return 'wide';
  if (pieceId.startsWith('asset-pause-')) return 'plate';
  if (pieceId.startsWith('asset-portrait-')) return 'face';
  return 'cut';
}

/** A painted tile's "x5" badge: how many poses are in it, when there is more than one. */
function poseBadge(piece: Piece): string {
  if (!piece.id.startsWith('asset-subject-')) return '';
  const poses = piece.card.facts.find((fact) => fact.label === 'Painted poses')?.value;
  const count = poses === undefined ? 0 : Number(poses);
  return Number.isFinite(count) && count > 1 ? `<em>&times;${count}</em>` : '';
}

function tileHtml(piece: Piece, ctx: InventoryContext): string {
  const used = usedByChapter(piece.id, ctx.use);
  const selected = ctx.selectedId === piece.id;
  const thumbKey = thumbKeyForPiece(piece.id);
  const url = thumbKey === undefined ? undefined : thumbUrl(thumbKey);
  const classes = [
    'pyc-t',
    url !== undefined ? `pyc-t--${shapeFor(piece.id)}` : 'pyc-t--type',
    used ? 'pyc-t--use' : '',
    selected ? 'pyc-t--sel' : '',
  ]
    .filter((c) => c.length > 0)
    .join(' ');
  const face =
    url !== undefined
      ? `<span class="pyc-t__im"><img src="${escapeHtml(url)}" alt="" loading="lazy">${poseBadge(piece)}</span>`
      : '<span class="pyc-t__im pyc-t__im--none"><i></i></span>';
  return (
    `<span class="${classes}" data-piece-id="${escapeHtml(piece.id)}" data-system-id="${escapeHtml(piece.systemId)}" tabindex="0">` +
    `${face}<span class="pyc-t__n">${escapeHtml(piece.name)}</span></span>`
  );
}

/** The whole inventory flow: a heading and count per component, then its tiles. */
export function paintInventory(ctx: InventoryContext): string {
  const groups = buildInventory(ctx.specimen, ctx.visible);
  const byId = new Map(ctx.specimen.pieces.map((piece) => [piece.id, piece] as const));

  const head =
    `<div class="pyc-invhead"><span class="pyc-invhead__n">${ctx.visible.length}</span>` +
    `<span class="pyc-invhead__t">pieces, laid flat, grouped by component</span>` +
    `<span class="pyc-key"><span><i class="pyc-key__u"></i>used in ${escapeHtml(ctx.chapterLabel)}</span>` +
    `<span><em>&times;5</em>five painted poses in one tile</span></span></div>`;

  const body = groups
    .map((group) => {
      const tiles = group.cells
        .map((cell) => {
          const piece = byId.get(cell.id);
          return piece === undefined ? '' : tileHtml(piece, ctx);
        })
        .join('');
      return (
        `<div class="pyc-grp"><i style="background:${escapeHtml(group.colour)}"></i>` +
        `<span>${escapeHtml(group.name)}</span><b>${group.count}</b></div>` +
        `<div class="pyc-tiles">${tiles}</div>`
      );
    })
    .join('');

  return `<div class="pyx-inv__flow pyc-inv" data-inv-flow>${head}${body}</div>`;
}
