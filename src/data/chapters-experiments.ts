/**
 * The **hidden experiments' registrations**: chapters that `getChapter` finds (so the battle flow, the pause screen, the guides and
 * `window.__pyrefly.gotoChapter` run them end to end) but that are in neither `CHAPTERS` nor `CHAPTER_IDS`, so every count stays eighteen
 * and the board has no card for them. Each is reached by typing its word on chapter select; its attempts and clears go to the experiments'
 * store, never the save (`app/experiments/`).
 *
 * - **The Leblanc preview** (`'exp-leblanc'`, 2026-10-06; FFX-2 only): Chapter VI's mission in new paintings, derived from the listed chapter.
 * - **The Experiment** (`'ffx2-masterpiece-theatre'`, 2026-10-10; FFX-2 only): the Machine Faction's weapon at Djose Temple, fought twice.
 *
 * A further hidden chapter registers here, by adding its record to the list below, not by editing `./encounters.ts`.
 *
 * Split out of `./encounters.ts` for the house 400-line rule (AGENTS.md hard rule 7); `encounters.ts` still exports `EXPERIMENT_CHAPTERS`
 * (built by this function), so the contract surface is unchanged. The `Chapter` import is type-only and the listed Chapter VI arrives as an
 * argument, so there is no runtime cycle with `./encounters.ts`.
 */

import type { Chapter } from './encounters.ts';
import { experimentalLeblanc } from './chapter-exp-leblanc.ts';
import { FFX2_EXPERIMENT } from './chapter-ffx2-experiment.ts';

/** The hidden experiments in registration order; `ffx2Leblanc` is the listed Chapter VI, which the Leblanc preview is derived from. */
export function experimentChapters(ffx2Leblanc: Chapter): readonly Chapter[] {
  return [experimentalLeblanc(ffx2Leblanc), FFX2_EXPERIMENT] as const;
}
