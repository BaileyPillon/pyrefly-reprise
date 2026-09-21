/**
 * Search over one specimen's pieces (`docs/concepts/atlas/REFERENCE.md` item
 * 7: "Find a structure", focused with `/`).
 *
 * `buildIndex` is separate from `search` so a site builds the index once per
 * specimen and re-searches it on every keystroke without re-reading
 * `Specimen.pieces`. Ranking favours the piece's own name over its system or
 * citation, on the theory that someone typing "oblique" is looking for a
 * piece named that, not a system or a footnote that happens to mention it.
 */

import type { Specimen } from './model.ts';

interface SearchEntry {
  readonly pieceId: string;
  readonly name: string;
  readonly systemName: string;
  readonly cite: string;
  /** Position in `Specimen.pieces`, the tie-break for equally-ranked matches. */
  readonly order: number;
}

export interface SearchIndex {
  readonly entries: readonly SearchEntry[];
}

/** Indexes every piece's name, system name and cite, case-folded once up front. */
export function buildIndex(specimen: Specimen): SearchIndex {
  const systemNames = new Map(specimen.systems.map((system) => [system.id, system.name] as const));

  const entries = specimen.pieces.map(
    (piece, order): SearchEntry => ({
      pieceId: piece.id,
      name: piece.name,
      systemName: systemNames.get(piece.systemId) ?? '',
      cite: piece.card.cite,
      order,
    }),
  );

  return { entries };
}

/** Lower tier numbers rank first. `null` means the query does not match this entry at all. */
function rankTier(entry: SearchEntry, query: string): number | null {
  const name = entry.name.toLowerCase();
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.split(/\s+/).some((word) => word.startsWith(query))) return 2;
  if (name.includes(query)) return 3;
  if (entry.cite.toLowerCase().includes(query) || entry.systemName.toLowerCase().includes(query)) return 4;
  return null;
}

/**
 * Ranked piece ids matching `query`: exact name, then name-prefix, then a
 * word inside the name starting with it, then substring, then a match only
 * in the cite or system name. Ties keep specimen order. An empty (or
 * all-whitespace) query returns no results — there is nothing to rank.
 */
export function search(index: SearchIndex, query: string, limit: number): readonly string[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0 || limit <= 0) {
    return [];
  }

  const ranked = index.entries
    .map((entry) => ({ entry, tier: rankTier(entry, q) }))
    .filter((row): row is { entry: SearchEntry; tier: number } => row.tier !== null)
    .sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.entry.order - b.entry.order));

  return ranked.slice(0, limit).map((row) => row.entry.pieceId);
}
