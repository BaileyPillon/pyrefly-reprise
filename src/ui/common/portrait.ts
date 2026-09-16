/**
 * Shared portrait-image markup: `public/art/portraits/<id>.png` when present,
 * silently absent otherwise (no broken-image icon). Same `onerror` trick
 * `HudMock` uses for its CTB icons, pulled out so `DialogueBox` and
 * `ChapterSelectScreen`/`ResultsScreen` don't each reinvent it.
 */

import { artUrl } from '../../engine/PaintedArt.ts';

/** `<img>` markup for a portrait, or `''` when `id` is falsy. Removes itself on a 404. */
export function portraitImgHtml(id: string | undefined, alt = ''): string {
  if (!id) return '';
  const src = artUrl(`art/portraits/${id}.png`);
  return `<img src="${src}" alt="${alt}" draggable="false" onerror="this.remove()" />`;
}

/** `<img>` markup for a chapter-select/results backdrop thumbnail. Same miss behaviour. */
export function backdropImgHtml(sceneKey: string | undefined, alt = ''): string {
  if (!sceneKey) return '';
  const src = artUrl(`art/backdrops/${sceneKey}.png`);
  return `<img src="${src}" alt="${alt}" draggable="false" onerror="this.remove()" />`;
}
