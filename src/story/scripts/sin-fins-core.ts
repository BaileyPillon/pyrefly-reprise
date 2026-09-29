/**
 * Chapter XVII — **Sin: the Fins and the Core** (FFX), the story layer. **STUB.**
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3].
 *
 * Package S wrote this stub so the chapter record can import its scripts now
 * (`docs/plans/sin-two-chapters-plan.md` §2.2); package P fills it with beats 1
 * to 8 of research §9.2, paraphrased in the writing bible's voice (plan §3.3):
 * the Hymn plan, the deck, the two Fins, the jump onto Sin's back, and Sinfall.
 * Until then it is a **placeholder**: a silent pre scene that opens the battle
 * and a silent post scene that shows results.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, results } from '../dsl.ts';

/** **Placeholder** story layer (package P fills it): open the battle, show the results, say nothing. */
export const sinFinsCoreScripts: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

export default sinFinsCoreScripts;
