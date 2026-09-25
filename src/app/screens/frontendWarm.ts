/**
 * The front end's paintings, fetched and decoded before the screens that show
 * them (PR-0065).
 *
 * Round 11 photographed a cold launch: Auron's briefing arriving without Auron
 * or its backdrop, and the chapter board's party tiles as grey placeholder
 * busts (now on Chapter VIII too) while their 1.1-1.4 MB portraits loaded.
 * The title screen waits for a key, so it is where this starts: the briefing's
 * two paintings first, then everything the board's first card shows, then the
 * portraits of every other card. The briefing and the board each wait for
 * their own set before they go up, with a ceiling so a slow network delays a
 * screen and never holds it.
 *
 * The URLs are read off the board's own markup (`chapterCards.ts`), so this
 * warms exactly what the screen will ask for and cannot drift from it.
 *
 * Game case: both, one shared front end.
 */

import type { App } from '../App.ts';
import { artUrl } from '../../engine/PaintedArt.ts';
import { untilWarm, warmImages } from '../imageWarm.ts';
import { asideHtml, heroHtml, railHtml } from './frontend/chapterCards.ts';
import { buildChapterTiles, groupChapterTiles, type ChapterTile } from './frontend/chapterGrid.ts';

/** Longest the briefing or the board waits for its paintings. */
export const FRONTEND_WARM_CEILING_MS = 2500;

/** What Auron's briefing paints (`ui/coach/Briefing.ts`). */
export function briefingArtUrls(): string[] {
  return [artUrl('art/characters/auron/idle.png'), artUrl('art/backdrops/dreams-end.png')];
}

/** Every `src="..."` in a piece of markup, in order. */
function srcsIn(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/\bsrc="([^"]+)"/g)) out.push(m[1]!.replace(/&amp;/g, '&'));
  return out;
}

/** The board's paintings: what its first paint waits for, then everything else. */
export function boardArtUrls(save: Parameters<typeof buildChapterTiles>[0]): { first: string[]; rest: string[] } {
  const tiles = buildChapterTiles(save);
  let selected = tiles.findIndex((t) => t.playable);
  if (selected < 0) selected = 0;
  const cardSet = (tile: ChapterTile, index: number): string[] => [
    ...(tile.sceneKey ? [artUrl(`art/backdrops/${tile.sceneKey}.png`)] : []),
    ...srcsIn(heroHtml(tile, index)),
    ...srcsIn(asideHtml(tile, null)),
  ];
  const head = tiles[selected];
  // Waited on: the first card's own set and every card's party faces, since a
  // face is what the critic photographs the moment the cursor reaches a card
  // (round 11: Chapter VIII's Wakka and Rikku as grey busts).
  const others = tiles.filter((_, i) => i !== selected);
  const faces = others.flatMap((t) => srcsIn(asideHtml(t, null)));
  const first = [...(head ? cardSet(head, selected) : []), ...faces];
  // Not waited on: the rail's thumbnails (the full 5 MB backdrops; measured at
  // 100 Mbit/s they held a cold board to its ceiling) and the other cards'
  // paintings. They still load first thing, in this order.
  const rail = srcsIn(railHtml(groupChapterTiles(tiles), tiles, selected));
  const plates = others.flatMap((t, i) => cardSet(t, i));
  const seen = new Set(first);
  const rest = [...rail, ...plates].filter((u) => !seen.has(u) && (seen.add(u), true));
  return { first: [...new Set(first)], rest };
}

/** Start everything the front end will show, most urgent first. Called by the title. */
export function warmFrontEnd(app: Pick<App, 'save'>): void {
  try {
    const board = boardArtUrls(app.save);
    void warmImages([...briefingArtUrls(), ...board.first, ...board.rest]);
  } catch {
    /* a harness without chapters: the screens load their own art */
  }
}

/** Wait (with a ceiling) for the board's first card, then build the screen. */
export async function boardWhenWarm<T>(app: Pick<App, 'save'>, make: () => T): Promise<T> {
  try {
    const board = boardArtUrls(app.save);
    const ready = untilWarm(board.first, FRONTEND_WARM_CEILING_MS);
    void warmImages(board.rest);
    await ready;
  } catch {
    /* never hold the board over its paintings */
  }
  return make();
}
