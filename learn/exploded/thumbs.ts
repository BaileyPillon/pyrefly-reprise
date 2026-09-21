/**
 * The bundled thumbnails: ~160px WebP previews of every painted piece, made
 * by `./make-thumbs.mjs` and picked up here with `import.meta.glob` so Vite
 * hashes and ships them with the page.
 *
 * The full paintings (832x1216 cutouts, 2688x1536 backdrops) are fetched
 * from the game's own origin through `artUrl` and are right for the five
 * cutouts the assembled frame is built from — and hopeless for the inventory
 * at `explode` 1, which lays out more than a hundred of them at once. So:
 * big art for the frame, these for the tiles.
 *
 * `index.json` carries each thumbnail's **measured** source size, read off
 * the PNG by sharp, so a card can say how big a painting really is without
 * anyone typing a number (AGENTS.md hard rule 6).
 */

import index from './thumbs/index.json';

/** One thumbnail's source painting: its real pixel size and its path under `public/art/`. */
export interface ThumbSize {
  readonly w: number;
  readonly h: number;
  readonly src: string;
}

const URLS = import.meta.glob('./thumbs/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const SIZES = index.sizes as unknown as Readonly<Record<string, ThumbSize | undefined>>;

/** `thumbUrl('sub-yunalesca-1')` -> the bundled WebP's URL, or undefined when no thumbnail was made. */
export function thumbUrl(key: string): string | undefined {
  return URLS[`./thumbs/${key}.webp`];
}

/** The measured size of the painting `key` was made from. */
export function thumbSize(key: string): ThumbSize | undefined {
  return SIZES[key];
}

/**
 * The thumbnail key for one of `assets.ts`'s inventory pieces. The four
 * prefixes match the four families `make-thumbs.mjs` writes; a piece with no
 * painting behind it (a HUD part, an audio cue family) has no key.
 */
export function thumbKeyForPiece(pieceId: string): string | undefined {
  const map: readonly (readonly [string, string])[] = [
    ['asset-subject-', 'sub-'],
    ['asset-backdrop-', 'bd-'],
    ['asset-portrait-', 'pt-'],
    ['asset-pause-', 'pp-'],
  ];
  for (const [prefix, short] of map) {
    if (pieceId.startsWith(prefix)) return `${short}${pieceId.slice(prefix.length)}`;
  }
  return undefined;
}

/** The painted poses of one subject, in the order `make-thumbs.mjs` found them — for the detail card's pose strip. */
export function poseThumbs(subjectId: string, states: readonly string[]): readonly { state: string; url: string }[] {
  const found: { state: string; url: string }[] = [];
  for (const state of states) {
    const url = thumbUrl(`pose-${subjectId}-${state}`);
    if (url !== undefined) found.push({ state, url });
  }
  return found;
}
