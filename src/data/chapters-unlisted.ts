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

/**
 * Chapter IX, Yojimbo, was listed on 2026-09-24 (now in `CHAPTERS`).
 * Chapter X, Seymour Natus, was listed on 2026-09-25 (now in `CHAPTERS`, after Chapter IX).
 * Chapter XI, Fallen Aeons, was listed on 2026-09-26 (now in `CHAPTERS`, after Chapter X).
 * Chapter XII, Seymour Omnis, was listed on 2026-09-25 (now in `CHAPTERS`, after Chapter XI).
 * Chapter XIII, Trema, was listed on 2026-09-25 (now in `CHAPTERS`, after Chapter XII).
 * Chapter XIV, Isaaru, was listed on 2026-09-25 (now in `CHAPTERS`, after Chapter XIII).
 * Chapter XV, The Den of Woe, was listed on 2026-09-26 (now in `CHAPTERS`, after Chapter XIV).
 */
export const UNLISTED_CHAPTERS: readonly Chapter[] = [] as const;
