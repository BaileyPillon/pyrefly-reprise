/**
 * Every chapter's written strategy-guide content, in play order.
 *
 * `src/engine/tactics/guide.ts` finds the right entry by asking which of a
 * guide's `bossIds` is on the board, exactly as `src/engine/tactics/index.ts`
 * finds a tactic — so a chapter that chains through several bosses must list
 * all of them, and two chapters must never claim the same id.
 */

import type { ChapterGuide } from './types.ts';
import { SEYMOUR_FLUX_GUIDE } from './seymour-flux.ts';
import { YUNALESCA_GUIDE } from './yunalesca.ts';
import { BRASKAS_FINAL_AEON_GUIDE } from './braskas-final-aeon.ts';
import { FFX2_BAHAMUT_GUIDE } from './ffx2-bahamut.ts';
import { FFX2_VEGNAGUN_SHUYIN_GUIDE } from './ffx2-vegnagun-shuyin.ts';

export type {
  ChapterGuide,
  GuideHint,
  GuideHintMatch,
  GuidePhase,
  GuideRule,
  GuideWatch,
} from './types.ts';

export {
  SEYMOUR_FLUX_GUIDE,
  YUNALESCA_GUIDE,
  BRASKAS_FINAL_AEON_GUIDE,
  FFX2_BAHAMUT_GUIDE,
  FFX2_VEGNAGUN_SHUYIN_GUIDE,
};

export const GUIDES: readonly ChapterGuide[] = [
  SEYMOUR_FLUX_GUIDE,
  YUNALESCA_GUIDE,
  BRASKAS_FINAL_AEON_GUIDE,
  FFX2_BAHAMUT_GUIDE,
  FFX2_VEGNAGUN_SHUYIN_GUIDE,
];

/** The guide for one chapter id, if it has one. */
export function guideForChapter(id: string): ChapterGuide | undefined {
  return GUIDES.find((g) => g.id === id);
}
