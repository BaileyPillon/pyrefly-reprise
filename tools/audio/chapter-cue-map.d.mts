/** Types for `tools/audio/chapter-cue-map.mjs` (PR-0099). */
export interface ChapterCueMapRow {
  numeral: string;
  id: string;
  game: string;
  scene: string[];
  battle: string[];
  victory: string[];
  status: string;
  owed: string;
}
export function parseChapterCueMap(markdown: string): ChapterCueMapRow[];
export function auditChapterCueMap(
  chapters: ReadonlyArray<{
    id: string;
    game: string;
    music: { scene?: string | null; battle?: string | null; phase2?: string; victory?: string };
  }>,
  rows: ReadonlyArray<ChapterCueMapRow>,
): Array<{ id: string; problem: string }>;
