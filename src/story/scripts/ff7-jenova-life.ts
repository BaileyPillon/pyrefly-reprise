/**
 * The hidden Jenova LIFE chapter's story layer: the minimum the flow needs (FF7 only; chapter 44).
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** No lines, no quips and no mid beats. The scene around the fight (Aerith at the apex of the pillars,
 * Sephiroth, the lake) is the preflight's pick J10 and is Bailey's to see before it is built (hard rule 9; `docs/plans/ch-jenova-life-review.md` §9):
 * the recommended compact scenes need the FF7 blue dialogue window and three scene stills, none of which exists. `pre` only starts the battle and
 * `post` only brings up the results, exactly as the Guard Scorpion's does (`./ff7-guard-scorpion.ts`).
 */

import type { ChapterScripts } from '../dsl.ts';
import { battleStart, results } from '../dsl.ts';

export const ff7JenovaLifeScripts: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};
