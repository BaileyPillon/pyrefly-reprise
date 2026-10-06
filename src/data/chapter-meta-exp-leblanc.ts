/**
 * Pause-screen and prebattle-tab metadata — **Experimental: Leblanc (new art)**, the Leblanc preview
 * (`./chapter-exp-leblanc.ts`; FFX-2 only, Bailey 2026-10-06).
 *
 * Chapter VI's record with the preview's name: the objectives, the tip, the quote, the snapshots and the music keys are Chapter VI's
 * (`./chapter-meta-ffx2-leblanc.ts`), because the encounter is. The hero art stays Chapter VI's `pause/leblanc` close-up until a
 * new one is installed for the preview. The numeral is `EXP` (the card, the cutscene eyebrow and the prep header say so too).
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { FFX2_LEBLANC_META } from './chapter-meta-ffx2-leblanc.ts';
import { EXP_LEBLANC_ID, EXP_LEBLANC_TEXT } from './chapter-exp-leblanc.ts';

export const EXP_LEBLANC_META: ChapterMeta = {
  ...FFX2_LEBLANC_META,
  id: EXP_LEBLANC_ID,
  numeral: 'EXP',
  ...EXP_LEBLANC_TEXT,
};
