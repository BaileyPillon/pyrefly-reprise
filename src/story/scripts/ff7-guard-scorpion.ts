/**
 * The hidden FF7 experiment's story layer: the minimum the flow needs.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** No lines, no quips and no mid
 * beats: the fight's story (the reactor core scene, Cloud's hint line, gs §7)
 * waits for Bailey's options round (rule 9). `pre` only starts the battle and
 * `post` only brings up the results (`docs/plans/ff7-guard-scorpion-architecture.md` §1.6).
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, results } from '../dsl.ts';

export const ff7GuardScorpionScripts: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};
