/**
 * The chapter grid behind the showpiece chapter select.
 *
 * Approved end state: `docs/concepts/polish/showpiece-frontend/after.png` and
 * `chapter-select.png` — "A front end that moves: parallax title and
 * silhouette chapter cards" (Bailey, 2026-09-19). The board reads as *the
 * encounters*, not as five thumbnails, so every card carries its boss as an
 * ink silhouette until the chapter has been cleared, and then it carries the
 * painting.
 *
 * Pure: no DOM, no `three`, no timers. Everything the screen draws is decided
 * here and pinned by `tests/unit/frontend-chapter-grid.test.ts`.
 *
 * Game-aware (AGENTS.md rule 14): **both**. This is shared front-end plumbing;
 * the only per-game thing in it is which group heading a tile lands under, and
 * that comes from `Chapter.game`.
 */

import type { GameId } from '../../../battle/common/types.ts';
import { CHAPTERS, type Chapter } from '../../../data/encounters.ts';
import { romanNumeral } from '../../../ui/common/roman.ts';
import { COMING_CHAPTERS, type ComingChapter } from './comingChapters.ts';

/**
 * Which painting is cut into the ink silhouette for a built chapter.
 *
 * Defaults to the formation's first enemy `spriteKey`; this table overrides
 * that where the default cutout is unusable or uninteresting, with the reason.
 * It lives here rather than in `src/data` because it is a *presentation*
 * choice about a PNG, not game data (hard rule 6), and because the concept
 * board made exactly these substitutions
 * (`docs/concepts/polish/showpiece-frontend/card.json` "risk").
 */
const SILHOUETTE_OVERRIDES: Readonly<Record<string, readonly string[]>> = {
  // card.json: "seymour-flux/idle.png is 90 percent opaque (rembg kept the
  // whole aura) and had to be replaced by mortiorchis plus seymour-flux-body".
  'seymour-flux': ['mortiorchis', 'seymour-flux-body'],
  // Her first form is the one the player meets; forms 2 and 3 are the turn.
  yunalesca: ['yunalesca-1'],
  // Jecht wearing the aeon — the thing in the arena, not Yu Yevon behind it.
  'braskas-final-aeon': ['braskas-final-aeon-1'],
  // The gun, not the boy inside it: Shuyin is the chapter's last reveal.
  'ffx2-vegnagun-shuyin': ['vegnagun-body'],
};

/** What a chapter tile needs to know about the save. `SaveStore` satisfies it. */
export interface ClearedLookup {
  isCleared(id: string): boolean;
}

/** One card on the board — a built chapter, or an approved one still coming. */
export interface ChapterTile {
  readonly kind: 'chapter' | 'coming';
  readonly id: string;
  readonly game: GameId;
  /** `'I'`..`'VIII'` for a built chapter, `null` for a coming one. */
  readonly numeral: string | null;
  readonly title: string;
  readonly location: string;
  /** `art/backdrops/<sceneKey>.png`, or `null` when nothing is painted yet. */
  readonly sceneKey: string | null;
  /** `art/characters/<key>/idle.png`, back to front. May be empty. */
  readonly silhouetteKeys: readonly string[];
  /** True once the player has cleared it: the card shows the painting instead. */
  readonly cleared: boolean;
  /** False for a coming chapter — the card is inert and reads COMING. */
  readonly playable: boolean;
  /** The record itself, for the dossier. `null` for a coming chapter. */
  readonly chapter: Chapter | null;
}

/** A game's half of the board. */
export interface ChapterGroup {
  readonly game: GameId;
  readonly label: string;
  readonly tiles: readonly ChapterTile[];
}

const GROUP_LABELS: Readonly<Record<GameId, string>> = {
  ffx: 'Final Fantasy X',
  ffx2: 'Final Fantasy X-2',
};

/** The silhouette paintings for one built chapter. */
export function silhouetteKeysFor(chapter: Chapter): readonly string[] {
  const override = SILHOUETTE_OVERRIDES[chapter.id];
  if (override) return override;
  const first = chapter.enemyGroupRef.enemies[0];
  return first ? [first.spriteKey] : [];
}

function tileForChapter(chapter: Chapter, save: ClearedLookup): ChapterTile {
  return {
    kind: 'chapter',
    id: chapter.id,
    game: chapter.game,
    numeral: romanNumeral(chapter.number),
    title: chapter.title,
    location: chapter.location,
    sceneKey: chapter.sceneKey,
    silhouetteKeys: silhouetteKeysFor(chapter),
    cleared: save.isCleared(chapter.id),
    playable: true,
    chapter,
  };
}

function tileForComing(coming: ComingChapter): ChapterTile {
  return {
    kind: 'coming',
    id: coming.id,
    game: coming.game,
    numeral: null,
    title: coming.title,
    location: coming.location,
    sceneKey: null,
    silhouetteKeys: coming.silhouetteKeys,
    cleared: false,
    playable: false,
    chapter: null,
  };
}

/**
 * Every card on the board, FFX chapters first, then FFX-2, each game's built
 * chapters in play order followed by that game's approved-but-coming ones.
 *
 * A coming row whose id **or** title has since appeared in `CHAPTERS` is
 * dropped: the real chapter is already in the list, so the card lights up by
 * itself the day the data lands and nobody has to remember to delete a row.
 */
export function buildChapterTiles(save: ClearedLookup): ChapterTile[] {
  const liveIds = new Set(CHAPTERS.map((c) => c.id as string));
  const liveTitles = new Set(CHAPTERS.map((c) => c.title.toLowerCase()));
  const coming = COMING_CHAPTERS.filter(
    (c) => !liveIds.has(c.id) && !liveTitles.has(c.title.toLowerCase()),
  );

  const tiles: ChapterTile[] = [];
  for (const game of ['ffx', 'ffx2'] as const) {
    for (const chapter of CHAPTERS) {
      if (chapter.game === game) tiles.push(tileForChapter(chapter, save));
    }
    for (const row of coming) {
      if (row.game === game) tiles.push(tileForComing(row));
    }
  }
  return tiles;
}

/** The same tiles, split into the two game groups the board shows. */
export function groupChapterTiles(tiles: readonly ChapterTile[]): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  for (const game of ['ffx', 'ffx2'] as const) {
    const own = tiles.filter((t) => t.game === game);
    if (own.length > 0) groups.push({ game, label: GROUP_LABELS[game], tiles: own });
  }
  return groups;
}

/**
 * Move the cursor `delta` places through the *playable* tiles, wrapping.
 *
 * A coming chapter is skipped rather than landed on and refused: a cursor that
 * stops on a card that cannot be entered reads as a bug, and the board is
 * meant to say "three more are coming", not "try this one".
 */
export function stepSelection(tiles: readonly ChapterTile[], from: number, delta: number): number {
  const n = tiles.length;
  if (n === 0) return 0;
  const dir = delta >= 0 ? 1 : -1;
  let steps = Math.abs(delta);
  let index = from;
  // At most one full lap per step, so an all-unplayable board terminates.
  for (let guard = 0; steps > 0 && guard < n * Math.max(1, Math.abs(delta)); guard++) {
    index = (index + dir + n) % n;
    if (tiles[index]?.playable) steps--;
  }
  return tiles[index]?.playable ? index : from;
}

/**
 * The first playable tile of the next (or previous) game group, for up/down.
 * Returns `from` when there is nowhere else to go.
 */
export function stepGroup(tiles: readonly ChapterTile[], from: number, delta: number): number {
  const games = groupChapterTiles(tiles).map((g) => g.game);
  if (games.length < 2) return from;
  const current = tiles[from]?.game;
  const at = current ? games.indexOf(current) : 0;
  const next = games[(at + (delta >= 0 ? 1 : -1) + games.length) % games.length];
  const target = tiles.findIndex((t) => t.game === next && t.playable);
  return target >= 0 ? target : from;
}
