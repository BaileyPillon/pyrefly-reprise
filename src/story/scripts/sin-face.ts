/**
 * Chapter XVIII — **Sin: the Face** (FFX), the story layer. **STUB.**
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3].
 *
 * Package S wrote this stub so the chapter record can import its scripts now
 * (`docs/plans/sin-two-chapters-plan.md` §2.2); package P fills it with beats 9
 * to 11 of research §9.2, paraphrased in the writing bible's voice (plan §3.3):
 * Yuna on the deck, Evenfall, and the dive into the open mouth. Until then it is
 * a **placeholder**: a silent pre scene that opens the battle and a silent post
 * scene that shows results, exactly what link 4 shipped with.
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, results } from '../dsl.ts';

/** **Placeholder** story layer (package P fills it): open the battle, show the results, say nothing. */
export const sinFaceScripts: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

export default sinFaceScripts;
