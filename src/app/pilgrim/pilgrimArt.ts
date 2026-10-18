/**
 * **The Pilgrimage's pictures** (prototype, FFX only): each stop's plate is the chapter-select board's own painted plate (the boss on its scene, `app/screens/frontend/chapterPlates.ts`), so nothing here is new art and the
 * run reads as the same game as the board. A plate is built from the chapter's tile, with its images loaded at once (a run screen is a short list, not the board's long rail, so no lazy lane).
 *
 * Game case: FFX only.
 */

import { artUrl } from '../../engine/PaintedArt.ts';
import { buildChapterTiles, type ChapterTile } from '../screens/frontend/chapterGrid.ts';
import { plateArtHtml } from '../screens/frontend/chapterPlates.ts';
import type { ChapterId } from '../../data/encounters.ts';

let tiles: Map<string, ChapterTile> | null = null;

function tileOf(id: ChapterId): ChapterTile | undefined {
  tiles ??= new Map(buildChapterTiles({ isCleared: () => false }).map((t) => [t.id, t]));
  return tiles.get(id);
}

/** The painted plate of a chapter (empty when the board has no tile for it). `data-lazy-src` becomes `src`: the images load when the screen is up. */
export function plateHtml(id: ChapterId): string {
  const tile = tileOf(id);
  if (!tile) return '';
  return plateArtHtml(tile, 'hero').replace(/data-lazy-src=/g, 'src=').replace(/ data-lazy-full="[^"]*"/g, '').replace(/<img class="[^"]*cs-art__ph"[^>]*>/g, '');
}

/** The chapter's scene as a full-screen wash (the board's own wash). */
export function washUrl(id: ChapterId): string | null {
  const key = tileOf(id)?.sceneKey;
  return key ? artUrl(`art/backdrops/${key}.png`) : null;
}

/** A character's face, as the party-prep column draws it. */
export function portraitUrl(id: string): string {
  return artUrl(`art/portraits/${id}.png`);
}
