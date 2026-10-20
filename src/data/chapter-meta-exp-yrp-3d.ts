/**
 * Pause-screen and prebattle-tab metadata — **Experimental: Bahamut in 3D** (`./chapter-exp-yrp-3d.ts`; FFX-2 only, hidden chapter number 29, Bailey 2026-10-19).
 *
 * Chapter IV's record with the chapter's working title: the objectives, the tip, the quote, the snapshots and the music keys are Chapter IV's (`FFX2_BAHAMUT_META` in `./chapter-meta.ts`, which owns it and
 * passes it in), because the encounter is, and so are its paintings. The numeral is `EXP` (the cutscene eyebrow and the prep header say so too).
 *
 * Registered in `UNLISTED_CHAPTER_META` (`./chapter-meta.ts`), found by `getChapterMeta`.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { EXP_YRP_ID, EXP_YRP_TEXT } from './chapter-exp-yrp-3d.ts';

/** The hidden chapter's metadata, derived from Chapter IV's (`base`). */
export function expYrpMeta(base: ChapterMeta): ChapterMeta {
  return { ...base, id: EXP_YRP_ID, numeral: 'EXP', ...EXP_YRP_TEXT };
}
