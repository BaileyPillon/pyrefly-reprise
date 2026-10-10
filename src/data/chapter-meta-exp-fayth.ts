/**
 * Pause-screen and prebattle-tab metadata — **Experimental: Fayth**, Evrae with FFX's own battle camera (`./chapter-exp-fayth.ts`; FFX only, hidden chapter number 22, Bailey 2026-10-10).
 *
 * Chapter VIII's record with the chapter's working title (`EXP_FAYTH_TEXT`): the objectives, the tip, the quote, the snapshots and the music keys are Chapter VIII's (`./chapter-meta-evrae.ts`),
 * because the encounter is, and so are its paintings (the hero plate `pause/evrae-chapter-card`, the deck and Evrae's own idles), since the chapter stands on Chapter VIII's plate. The numeral is
 * `EXP` (the cutscene eyebrow and the prep header say so too).
 *
 * Registered in `UNLISTED_CHAPTER_META` (`./chapter-meta.ts`), found by `getChapterMeta`.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { EVRAE_META } from './chapter-meta-evrae.ts';
import { EXP_FAYTH_ID, EXP_FAYTH_TEXT } from './chapter-exp-fayth.ts';

export const EXP_FAYTH_META: ChapterMeta = {
  ...EVRAE_META,
  id: EXP_FAYTH_ID,
  numeral: 'EXP',
  ...EXP_FAYTH_TEXT,
};
