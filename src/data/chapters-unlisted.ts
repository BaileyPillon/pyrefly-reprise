/**
 * Chapters that are **registered but not listed**: `getChapter` finds them, so
 * the battle flow and `window.__pyrefly.gotoChapter` run them end to end, but
 * they are not in `CHAPTERS` or `CHAPTER_IDS`, so chapter select, the jukebox
 * and every chapter-generic suite do not see them.
 *
 * This is one step short of Chapters 7 and 8's "registered and LOCKED as a
 * COMING card": it shows **no card at all**, because a card is perceivable and
 * the chapter's picks are still Bailey's to make (AGENTS.md hard rule 9).
 * Listing a chapter is moving its record from here into `CHAPTERS` (and its id
 * into `CHAPTER_IDS`), once its story, meta, scene, tactic and card exist.
 *
 * Split out of `./encounters.ts` for the house 400-line rule (AGENTS.md hard
 * rule 7); `encounters.ts` re-exports it, so the contract surface is unchanged.
 * The `Chapter` import is type-only, so there is no runtime cycle.
 */

import type { Chapter } from './encounters.ts';
import { YOJIMBO_CAVERN } from './chapter-yojimbo-cavern.ts';

/** Chapter IX, Yojimbo (FFX only) — `./chapter-yojimbo-cavern.ts`. */
export const UNLISTED_CHAPTERS: readonly Chapter[] = [YOJIMBO_CAVERN] as const;
