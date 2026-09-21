/**
 * The catalogue at `explode` 1: what the approved frame
 * `docs/concepts/atlas/a-boss-atlas/a3-inventory.html` calls the inventory.
 *
 * Not a grid of anonymous coloured squares — a flow of **named** things,
 * grouped by system, each group under its own small heading and count
 * ("PARTS AND FORMS 12", "ATTACKS AND ABILITIES 50"). A piece with a
 * painting becomes a picture tile with its name and its leading number; every
 * other piece becomes a labelled text chip sized to its own text. Largest
 * first within a group, so the five main parts lead and the supports follow.
 *
 * This module is the pure half: which groups, in what order, with which cells
 * and labels. The DOM half (`stage-paint.ts`) lets the browser flow and
 * measure them, which is the only way a chip is genuinely "sized to its
 * text".
 */

import type { Piece, Specimen } from './model.ts';

/** A picture tile (the piece has painted art) or a text chip (everything else). */
export type InventoryCellKind = 'picture' | 'chip';

export interface InventoryCell {
  readonly id: string;
  readonly systemId: string;
  readonly name: string;
  readonly kind: InventoryCellKind;
  /** Path under `public/art/`, for a picture tile. */
  readonly art?: string;
  /** The piece's leading fact value, when it says something the name does not. */
  readonly note?: string;
}

export interface InventoryGroup {
  readonly systemId: string;
  readonly name: string;
  readonly colour: string;
  /** How many cells this group holds — computed here, never typed. */
  readonly count: number;
  readonly cells: readonly InventoryCell[];
}

/**
 * The note beside a cell's name.
 *
 * A painting always shows its leading number (the frame's tiles read "Head
 * 38,420"). Everything else shows its leading fact only when that fact is not
 * a bare count: "Death 12/12" and "Delay · Vita Brevis" earn their space,
 * while a reward's "1" (how many combatants drop it) is noise next to the
 * item's own name, and the frame does not show it either.
 */
export function noteFor(piece: Piece): string | undefined {
  const value = piece.card.facts[0]?.value;
  if (value === undefined || value.length === 0) return undefined;
  if (piece.kind === 'painting') return value;
  if (piece.kind === 'card') return undefined;
  return /^\d+$/.test(value.trim()) ? undefined : value;
}

function cellFor(piece: Piece): InventoryCell {
  const kind: InventoryCellKind = piece.kind === 'painting' && piece.art !== undefined ? 'picture' : 'chip';
  const note = noteFor(piece);
  return {
    id: piece.id,
    systemId: piece.systemId,
    name: piece.name,
    kind,
    ...(kind === 'picture' && piece.art !== undefined ? { art: piece.art } : {}),
    ...(note !== undefined ? { note } : {}),
  };
}

/**
 * Groups `visible` by the specimen's own system order (never re-ordered
 * here — the systems panel shows the same order), largest piece first within
 * each group, picture tiles ahead of text chips so a group's paintings lead
 * it. A system with nothing visible is left out entirely.
 */
export function buildInventory(specimen: Specimen, visible: readonly Piece[]): InventoryGroup[] {
  const bySystem = new Map<string, Piece[]>();
  for (const piece of visible) {
    const group = bySystem.get(piece.systemId);
    if (group) group.push(piece);
    else bySystem.set(piece.systemId, [piece]);
  }

  const groups: InventoryGroup[] = [];
  for (const system of specimen.systems) {
    const pieces = bySystem.get(system.id);
    if (pieces === undefined || pieces.length === 0) continue;
    const cells = [...pieces]
      .sort((a, b) => {
        const aPicture = a.kind === 'painting' && a.art !== undefined ? 0 : 1;
        const bPicture = b.kind === 'painting' && b.art !== undefined ? 0 : 1;
        return aPicture - bPicture || b.size - a.size || a.name.localeCompare(b.name);
      })
      .map(cellFor);
    groups.push({ systemId: system.id, name: system.name, colour: system.colour, count: cells.length, cells });
  }
  return groups;
}
