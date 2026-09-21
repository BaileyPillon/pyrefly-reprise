/**
 * The inventory grid: where every visible piece lands at `explode` 1
 * (`docs/concepts/atlas/REFERENCE.md` item 4, "ANATOMICAL INVENTORY").
 *
 * Contract with the caller: pass only the pieces that should appear (the
 * `visiblePieces` selector's result), already ordered by the specimen's
 * system order — this module groups consecutive same-system runs by their
 * first appearance in `pieces` and never reorders the systems themselves, so
 * whoever calls it owns "which system comes first," matching the panel's own
 * row order. Within a group, largest `size` first.
 *
 * Squares that don't fit the box at natural size are shrunk uniformly rather
 * than rearranged (a shrunk-but-recognisable grid beats a fitted-but-jumbled
 * one), down to `minCell`. If even that floor cannot fit `height`, the floor
 * wins and the box is reported as needing `overflowHeight` more room — the
 * caller decides whether to grow the box, scroll it, or both.
 */

import type { Piece } from './model.ts';

export interface PackBox {
  readonly width: number;
  readonly height: number;
  readonly gap: number;
  readonly minCell: number;
}

/** One piece's packed cell, in the same coordinate space as `PackBox`. */
export interface PackedSlot {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface PackResult {
  readonly slots: ReadonlyMap<string, PackedSlot>;
  /** How much taller `height` would need to be to fit everyone at `minCell`. 0 when nothing overflowed. */
  readonly overflowHeight: number;
}

/** Groups pieces by system, preserving each system's first-seen position; sorts each group largest-first. */
function groupBySystemOrder(pieces: readonly Piece[]): readonly (readonly Piece[])[] {
  const order: string[] = [];
  const bySystem = new Map<string, Piece[]>();

  for (const piece of pieces) {
    const existing = bySystem.get(piece.systemId);
    if (existing) {
      existing.push(piece);
    } else {
      bySystem.set(piece.systemId, [piece]);
      order.push(piece.systemId);
    }
  }

  return order.map((systemId) => [...(bySystem.get(systemId) ?? [])].sort((a, b) => b.size - a.size));
}

/** Shelf-packs square cells (side = `piece.size * scale`) left to right, wrapping rows, one gap between systems. */
function simulate(
  groups: readonly (readonly Piece[])[],
  width: number,
  gap: number,
  scale: number,
): { readonly slots: Map<string, PackedSlot>; readonly contentHeight: number } {
  const slots = new Map<string, PackedSlot>();
  let groupTop = 0;
  let bottom = 0;

  for (const group of groups) {
    if (group.length === 0) continue;

    let cursorX = 0;
    let rowTop = groupTop;
    let rowHeight = 0;
    let placedInRow = 0;

    for (const piece of group) {
      const side = piece.size * scale;
      if (placedInRow > 0 && cursorX + side > width) {
        rowTop += rowHeight + gap;
        cursorX = 0;
        rowHeight = 0;
        placedInRow = 0;
      }

      slots.set(piece.id, { x: cursorX, y: rowTop, w: side, h: side });
      cursorX += side + gap;
      rowHeight = Math.max(rowHeight, side);
      placedInRow += 1;
      bottom = Math.max(bottom, rowTop + side);
    }

    groupTop = rowTop + rowHeight + gap;
  }

  return { slots, contentHeight: bottom };
}

/** Packs `pieces` into `box`, shrinking uniformly (never below `minCell`) if the natural size overflows. */
export function packInventory(pieces: readonly Piece[], box: PackBox): PackResult {
  if (pieces.length === 0) {
    return { slots: new Map(), overflowHeight: 0 };
  }

  const groups = groupBySystemOrder(pieces);

  const natural = simulate(groups, box.width, box.gap, 1);
  if (natural.contentHeight <= box.height) {
    return { slots: natural.slots, overflowHeight: 0 };
  }

  const smallestSize = Math.min(...pieces.map((piece) => piece.size));
  const minScale = smallestSize > 0 ? Math.min(1, box.minCell / smallestSize) : 1;

  const atFloor = simulate(groups, box.width, box.gap, minScale);
  if (atFloor.contentHeight > box.height) {
    return { slots: atFloor.slots, overflowHeight: atFloor.contentHeight - box.height };
  }

  // Binary search the largest scale in [minScale, 1] that still fits `box.height`.
  let lo = minScale;
  let hi = 1;
  let best = atFloor;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    const attempt = simulate(groups, box.width, box.gap, mid);
    if (attempt.contentHeight <= box.height) {
      best = attempt;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return { slots: best.slots, overflowHeight: 0 };
}
