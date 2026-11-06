/**
 * Pause-screen and prebattle-tab metadata - **Experimental: Valefor at Besaid (Anime Style)** (`./chapter-exp-anime.ts`; FFX-2 only, hidden chapter, number 33, driver pick 2026-11-06).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Chapter 24's record with the chapter's working title: the objectives, the tip, the quote, the snapshots and the music keys are chapter 24's
 * (`VALEFOR_BESAID_META` in `./chapter-meta-ffx2-valefor-besaid.ts`), because the encounter is, and so are its paintings. The numeral is `EXP` (the cutscene eyebrow and the prep header say so too).
 *
 * Registered in `UNLISTED_CHAPTER_META` (`./chapter-meta.ts`), found by `getChapterMeta`.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { VALEFOR_BESAID_META } from './chapter-meta-ffx2-valefor-besaid.ts';
import { EXP_ANIME_ID, EXP_ANIME_TEXT } from './chapter-exp-anime.ts';

/** The hidden chapter's metadata, derived from chapter 24's. */
export const EXP_ANIME_META: ChapterMeta = { ...VALEFOR_BESAID_META, id: EXP_ANIME_ID, numeral: 'EXP', ...EXP_ANIME_TEXT };
