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
import { FFX2_LEBLANC_GUIDE } from './ffx2-leblanc.ts';
import { SEYMOUR_ANIMA_MACALANIA_GUIDE } from './seymour-anima-macalania.ts';
import { EVRAE_GUIDE } from './evrae.ts';
import { YOJIMBO_CAVERN_GUIDE } from './yojimbo-cavern.ts';
import { FFX2_TREMA_GUIDE } from './ffx2-trema.ts';
import { FFX2_FALLEN_AEONS_GUIDE } from './ffx2-fallen-aeons.ts';
import { SEYMOUR_OMNIS_GUIDE } from './seymour-omnis.ts';
import { SEYMOUR_NATUS_GUIDE } from './seymour-natus.ts';
import { ISAARU_GUIDE } from './ffx-isaaru.ts';

export type {
  ChapterGuide,
  GuideClock,
  GuideHint,
  GuideHintMatch,
  GuidePhase,
  GuideRule,
  GuideWatch,
} from './types.ts';
export { rulesOnClock } from './types.ts';

export {
  SEYMOUR_FLUX_GUIDE,
  YUNALESCA_GUIDE,
  BRASKAS_FINAL_AEON_GUIDE,
  FFX2_BAHAMUT_GUIDE,
  FFX2_VEGNAGUN_SHUYIN_GUIDE,
  FFX2_LEBLANC_GUIDE,
  SEYMOUR_ANIMA_MACALANIA_GUIDE,
  EVRAE_GUIDE,
  YOJIMBO_CAVERN_GUIDE,
  FFX2_TREMA_GUIDE,
  FFX2_FALLEN_AEONS_GUIDE,
  SEYMOUR_OMNIS_GUIDE,
  SEYMOUR_NATUS_GUIDE,
  ISAARU_GUIDE,
};

export const GUIDES: readonly ChapterGuide[] = [
  SEYMOUR_FLUX_GUIDE,
  YUNALESCA_GUIDE,
  BRASKAS_FINAL_AEON_GUIDE,
  FFX2_BAHAMUT_GUIDE,
  FFX2_VEGNAGUN_SHUYIN_GUIDE,
  FFX2_LEBLANC_GUIDE,
  // Chapter 7 — registered with `src/data/encounters.ts` and the tactic, in
  // the integrator's one commit [docs/plans/chapter-macalania-review.md §8.1].
  SEYMOUR_ANIMA_MACALANIA_GUIDE,
  // Chapter 8 — registered with `src/data/encounters.ts` and the tactic, in
  // the integrator's one commit [docs/handoff/chapter-evrae-guide.md].
  EVRAE_GUIDE,
  // Chapter IX (FFX only), registered and unlisted like its chapter.
  YOJIMBO_CAVERN_GUIDE,
  // Chapter XIII (FFX-2 only), registered and unlisted like its chapter; its lines follow the
  // chapter's shape (`../trema-shape.ts`).
  FFX2_TREMA_GUIDE,
  // Chapter XI (FFX-2 only), registered and unlisted like its chapter.
  FFX2_FALLEN_AEONS_GUIDE,
  SEYMOUR_OMNIS_GUIDE,
  // Chapter X (FFX only), listed 2026-09-25: the research's line, Haste only Tidus and Auron.
  SEYMOUR_NATUS_GUIDE,
  // Chapter XIV (FFX only), listed 2026-09-25 as is (125/200 on the bench).
  ISAARU_GUIDE,
];

/** The guide for one chapter id, if it has one. */
export function guideForChapter(id: string): ChapterGuide | undefined {
  return GUIDES.find((g) => g.id === id);
}
