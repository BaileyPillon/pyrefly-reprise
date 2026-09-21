/**
 * The stage for a specimen whose pieces carry **no** authored box: sites B
 * and C, where every piece's on-screen size comes from `tile-size.ts` and its
 * inventory slot from `pack.ts`, and the whole trip home -> burst -> grid is
 * `layout.ts`'s two eased legs.
 *
 * This is the original shared stage, unchanged in behaviour — it moved out of
 * `stage.ts` when site A's approved frames needed an authored stage of their
 * own (`stage-authored.ts`), so that adding one did not put the other at
 * risk.
 */

import type { Piece, Specimen, System } from './model.ts';
import { pieceTransform } from './layout.ts';
import type { PackBox } from './pack.ts';
import { packInventory } from './pack.ts';
import { normalizeSizesForDisplay } from './tile-size.ts';
import type { ExplorerState } from './store.ts';
import { visiblePieces } from './store.ts';
import { escapeHtml } from './text.ts';
import { artUrl } from './urls.ts';

export const DEFAULT_PACK_BOX: PackBox = { width: 740, height: 680, gap: 6, minCell: 14 };

/** `explode` at which a non-painted piece (card/tile) reaches full opacity — see `fadeInFor`. */
const CARD_FADE_IN_END = 0.12;

/**
 * A painted piece is always fully opaque. A card or tile piece (an ability,
 * a support part with no painting of its own, or a catalogue fact) starts
 * invisible at `explode` 0 and fades in by {@link CARD_FADE_IN_END} — the
 * assembled view reads as a clean, whole subject (the approved frame,
 * `docs/concepts/atlas/a-boss-atlas/a1-assembled.html`, shows no cards at
 * all), and by the time anything has visibly moved apart from its home
 * position the card describing it has already faded in alongside it.
 */
export function fadeInFor(piece: Piece, explode: number): number {
  if (piece.kind === 'painting') return 1;
  return Math.max(0, Math.min(1, explode / CARD_FADE_IN_END));
}

function systemFor(specimen: Specimen, piece: Piece): System | undefined {
  return specimen.systems.find((s) => s.id === piece.systemId);
}

function pieceInnerHtml(piece: Piece, specimen: Specimen): string {
  const system = systemFor(specimen, piece);
  const colour = system?.colour ?? '#66627a';
  if (piece.kind === 'painting' && piece.art !== undefined) {
    return `<img class="pyx-piece__img" src="${escapeHtml(artUrl(piece.art))}" alt="">`;
  }
  if (piece.kind === 'card') {
    return `<div class="pyx-piece__cardface" style="border-color:${escapeHtml(colour)}"><span>${escapeHtml(piece.name)}</span></div>`;
  }
  return `<div class="pyx-piece__tileface" style="background:${escapeHtml(colour)}" title="${escapeHtml(piece.name)}"></div>`;
}

/** Paints `world` for `state`. The caller owns the camera transform on `world` itself. */
export function paintGeneric(world: HTMLElement, specimen: Specimen, state: ExplorerState, box: PackBox): void {
  const visible = visiblePieces(specimen, state);
  const displayPieces = normalizeSizesForDisplay(visible);
  const packed = packInventory(displayPieces, box);

  // pack.ts lays slots out from (0, 0) — the top-left of `box` — not centred on it. The
  // stage's own origin is the screen centre, so re-centre the packed group's own true
  // bounding box (which may be narrower/shorter than `box` itself) on that origin, rather
  // than letting the grid grow only rightward/downward off the visible stage.
  let maxRight = 0;
  let maxBottom = 0;
  for (const slot of packed.slots.values()) {
    maxRight = Math.max(maxRight, slot.x + slot.w);
    maxBottom = Math.max(maxBottom, slot.y + slot.h);
  }
  const centerDx = -maxRight / 2;
  const centerDy = -maxBottom / 2;

  world.innerHTML = displayPieces
    .map((piece) => {
      const rawSlot = packed.slots.get(piece.id) ?? { x: 0, y: 0, w: piece.size, h: piece.size };
      const slot = { ...rawSlot, x: rawSlot.x + centerDx, y: rawSlot.y + centerDy };
      const t = pieceTransform(piece, slot, state.explode);
      const selected = state.selectedId === piece.id;
      const opacity = fadeInFor(piece, state.explode);
      return `
      <div class="pyx-piece pyx-piece--${piece.kind}${selected ? ' pyx-piece--selected' : ''}"
        data-piece-id="${escapeHtml(piece.id)}" data-system-id="${escapeHtml(piece.systemId)}"
        role="button" tabindex="${piece.kind === 'tile' ? '-1' : '0'}" aria-label="${escapeHtml(piece.name)}"
        style="width:${piece.size}px;opacity:${opacity};pointer-events:${opacity > 0.05 ? 'auto' : 'none'};transform:translate3d(calc(-50% + ${t.x}px), calc(-50% + ${t.y}px), ${t.z}px) scale(${t.scale}) rotateY(${t.rotateY}deg)">
        ${pieceInnerHtml(piece, specimen)}
      </div>`;
    })
    .join('');
}
