/**
 * Pause-screen metadata of the chapters that are **registered but not listed** (`./chapters-unlisted.ts` and the hidden experiments, `./chapters-experiments.ts`): found by id
 * through `getChapterMeta`; `CHAPTER_META` stays one-to-one with the listed chapters. Listing a chapter moves its metadata from here into `CHAPTER_META`.
 *
 * Split out of `./chapter-meta.ts` for the house 400-line rule (AGENTS.md hard rule 7) on 2026-10-15, when the Biran and Yenke and Angra Mainyu chapters joined the list;
 * `chapter-meta.ts` re-exports {@link UNLISTED_CHAPTER_META}, so its surface is unchanged. Every import here is a metadata module that imports only the `ChapterMeta` TYPE from
 * `./chapter-meta.ts`, so there is no runtime cycle.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { EXP_LEBLANC_META } from './chapter-meta-exp-leblanc.ts';
import { EXPERIMENT_META } from './chapter-meta-ffx2-experiment.ts';
import { TOURIST_TRAP_META } from './chapter-meta-ffx2-tourist-trap.ts';
import { SINSPAWN_GUI_META } from './chapter-meta-sinspawn-gui.ts';
import { EXP_FAYTH_META } from './chapter-meta-exp-fayth.ts';
import { VALEFOR_BESAID_META } from './chapter-meta-ffx2-valefor-besaid.ts';
import { BIRAN_YENKE_META } from './chapter-meta-biran-yenke.ts';
import { ANGRA_MAINYU_META } from './chapter-meta-ffx2-angra-mainyu.ts';

/**
 * The hidden chapters' metadata, in registration order: the Leblanc preview (2026-10-06), the Experiment, Sinspawn Gui and Fayth (2026-10-10), the Tourist Trap and Valefor at
 * Besaid (2026-10-14), Biran and Yenke and Angra Mainyu (2026-10-15). Sin's two were listed 2026-09-29.
 */
export const UNLISTED_CHAPTER_META: readonly ChapterMeta[] = [
  EXP_LEBLANC_META,
  EXPERIMENT_META,
  SINSPAWN_GUI_META,
  EXP_FAYTH_META,
  TOURIST_TRAP_META,
  VALEFOR_BESAID_META,
  BIRAN_YENKE_META,
  ANGRA_MAINYU_META,
] as const;
