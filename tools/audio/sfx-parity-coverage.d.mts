export interface ChapterFact {
  id: string;
  game: 'ffx' | 'ffx2';
  actors: Set<string>;
  enemyAbilities: Set<string>;
  partyAbilities: Set<string>;
}

export interface Coverage {
  facts: ChapterFact[];
  /** The chapters a hook's selector can be heard in. */
  chaptersOf(hook: { game: 'ffx' | 'ffx2'; at: Record<string, unknown> }): Set<string>;
  /** The chapters in which any original answering the row can be heard (every chapter of the game for a menu key or a flow slot). */
  rowChapters(rowId: string): Set<string>;
  /** The chapters that load the pack (`packs.ts`). */
  packChapters(pack: string): Set<string>;
}

export function chapterFacts(): ChapterFact[];
export function createCoverage(): Coverage;
export const FLOW_ROWS: Set<string>;
