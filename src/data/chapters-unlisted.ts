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
import { FF7_GUARD_SCORPION } from './chapter-ff7-guard-scorpion.ts';
import { SIN_FINS_CORE } from './chapter-sin-fins-core.ts';
import { SIN_FACE } from './chapter-sin-face.ts';

/**
 * Chapter IX, Yojimbo, was listed on 2026-09-24 (now in `CHAPTERS`).
 * Chapter X, Seymour Natus, was listed on 2026-09-25 (now in `CHAPTERS`, after Chapter IX).
 * Chapter XI, Fallen Aeons, was listed on 2026-09-26 (now in `CHAPTERS`, after Chapter X).
 * Chapter XII, Seymour Omnis, was listed on 2026-09-25 (now in `CHAPTERS`, after Chapter XI).
 * Chapter XIII, Trema, was listed on 2026-09-25 (now in `CHAPTERS`, after Chapter XII).
 * Chapter XIV, Isaaru, was listed on 2026-09-25 (now in `CHAPTERS`, after Chapter XIII).
 * Chapter XV, The Den of Woe, was listed on 2026-09-26 (now in `CHAPTERS`, after Chapter XIV).
 *
 * The hidden FF7 experiment, Guard Scorpion, was registered here on 2026-09-27 (FF7 only; never listed:
 * `experimental`, `number: 0`, reached by the secret door, `./chapter-ff7-guard-scorpion.ts`).
 *
 * Ixion at Djose was registered here on 2026-09-27 (FFX-2 only; concept A, unlisted behind a switch) and
 * listed the same day as Chapter XVI (now in `CHAPTERS`, after Chapter XV; Bailey: "ixion needs to be in the
 * next build as well").
 * Chapter XVII, Sin (link 4, Overdrive Sin, first), was registered here on 2026-09-27 as XVI (FFX only;
 * Bailey's "all your recommendations": concept A reached through B, link 4 shipped unlisted behind
 * a switch; `./chapter-sin.ts`, since renamed), and took the next number, XVII, when Ixion was listed as XVI (merge of
 * 2026-09-28). Listing it is the switch.
 * On 2026-09-29 Sin became two chapters, split where the game saves (D-270, FFX only): Chapter XVII,
 * "Sin: the Fins and the Core" (`sin-fins-core`, links I to III, `./chapter-sin-fins-core.ts`), and Chapter
 * XVIII, "Sin: the Face" (`sin-face`, link IV; the branch-only `sin` renamed and renumbered,
 * `./chapter-sin-face.ts`). Both stay unlisted until Bailey's picks.
 */
export const UNLISTED_CHAPTERS: readonly Chapter[] = [FF7_GUARD_SCORPION, SIN_FINS_CORE, SIN_FACE] as const;
