/**
 * The chapter grid behind chapter select.
 *
 * Approved end state: `docs/concepts/chapter-select-v2/` option C (D-183,
 * Bailey 2026-09-25, "I'll go with C a victory ribbon", "All
 * recommendations"), which replaces the silhouette cards of
 * `docs/concepts/polish/showpiece-frontend/chapter-select.png`: a fixed list
 * in chapter-number order per game, every card the boss painted on its scene
 * (`chapterPlates.ts`), a beaten chapter marked by the gold ribbon.
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
import { COMING_CHAPTERS, LOCKED_CHAPTER_IDS, type ComingChapter } from './comingChapters.ts';

/**
 * Which boss painting a built chapter's plate and card show (named for the
 * silhouettes it once cut; `chapterPlates.ts` composes the paintings now).
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
  // Seymour, not his Guardian (the formation's first enemy) and not Anima,
  // who is the chapter's mid-battle reveal. Used once the card is unlocked.
  'seymour-anima-macalania': ['seymour-macalania'],
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
  /**
   * The chapter's number in the registry, or `null` for a coming row with no
   * registered chapter behind it. A locked (registered) chapter keeps its
   * number, so its COMING card sits in number order (VII between III and
   * VIII): Bailey, 2026-09-25, "All recommendations" (D-183).
   */
  readonly number: number | null;
  /** `'I'`..`'XIII'` from `number`, `null` when there is no number. */
  readonly numeral: string | null;
  readonly title: string;
  readonly location: string;
  /** `art/backdrops/<sceneKey>.png`, or `null` when nothing is painted yet. */
  readonly sceneKey: string | null;
  /** The boss paintings, `art/characters/<key>/idle.png`, back to front. May be empty. */
  readonly silhouetteKeys: readonly string[];
  /** True once the player has cleared it: the card and plate wear the victory ribbon. */
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
    number: chapter.number,
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

/**
 * A coming card. When its id is a registered (locked) chapter, the card
 * borrows that chapter's number and scene, never its data: the chapter record
 * itself stays `null` so nothing can start it.
 */
function tileForComing(coming: ComingChapter, registered: Chapter | undefined): ChapterTile {
  return {
    kind: 'coming',
    id: coming.id,
    game: coming.game,
    number: registered?.number ?? null,
    numeral: registered ? romanNumeral(registered.number) : null,
    title: coming.title,
    location: coming.location,
    sceneKey: registered?.sceneKey ?? null,
    silhouetteKeys: coming.silhouetteKeys,
    cleared: false,
    playable: false,
    chapter: null,
  };
}

/**
 * The two lists the board is built from. Both default to the real registries;
 * a test passes its own so the "a coming chapter has landed" branch can be
 * exercised for real, without writing a fake chapter into `src/data` (hard
 * rule 6) and without waiting for one of the three to be built.
 */
export interface ChapterRegistries {
  readonly chapters?: readonly Chapter[];
  readonly coming?: readonly ComingChapter[];
  /** Registered chapters still shown as COMING. Defaults to `LOCKED_CHAPTER_IDS`. */
  readonly locked?: ReadonlySet<string>;
}

/**
 * Every card on the board, FFX chapters first, then FFX-2, each game's cards
 * in chapter-number order. A coming card with a registered number sits at its
 * number's place (Chapter VII between III and VIII); a coming row with no
 * number yet goes after its game's numbered cards.
 *
 * A coming row whose id **or** title has since appeared in `CHAPTERS` is
 * dropped: the real chapter is already in the list, so the card lights up by
 * itself the day the data lands and nobody has to remember to delete a row.
 * A registered chapter whose id is in `LOCKED_CHAPTER_IDS` is the exception:
 * its tile is withheld and its coming row stays, until the lock line goes.
 */
export function buildChapterTiles(
  save: ClearedLookup,
  registries: ChapterRegistries = {},
): ChapterTile[] {
  const locked = registries.locked ?? LOCKED_CHAPTER_IDS;
  const registered = registries.chapters ?? CHAPTERS;
  const chapters = registered.filter((c) => !locked.has(c.id));
  const comingRows = registries.coming ?? COMING_CHAPTERS;
  const liveIds = new Set(chapters.map((c) => c.id as string));
  const liveTitles = new Set(chapters.map((c) => c.title.toLowerCase()));
  const coming = comingRows.filter(
    (c) => !liveIds.has(c.id) && !liveTitles.has(c.title.toLowerCase()),
  );

  const tiles: ChapterTile[] = [];
  for (const game of ['ffx', 'ffx2'] as const) {
    const own: ChapterTile[] = [];
    for (const chapter of chapters) {
      if (chapter.game === game) own.push(tileForChapter(chapter, save));
    }
    for (const row of coming) {
      if (row.game !== game) continue;
      const behind = locked.has(row.id) ? registered.find((c) => c.id === row.id) : undefined;
      own.push(tileForComing(row, behind));
    }
    // Stable: equal numbers (and every un-numbered row) keep registry order.
    own.sort((a, b) => byNumber(a.number) - byNumber(b.number));
    tiles.push(...own);
  }
  return tiles;
}

/** A sort key that puts an un-numbered coming row after every numbered card. */
function byNumber(n: number | null): number {
  return n ?? Number.MAX_SAFE_INTEGER;
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
