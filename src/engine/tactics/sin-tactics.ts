/**
 * The two Sin chapters' tactic slots, for `./index.ts`'s registry (one spread line there) — **FFX only**
 * [AGENTS.md rule 14].
 *
 * Chapter XVII chains three formations with four boss ids, so its one tactic is registered under every id,
 * the way Chapters III and V are. Chapter XVIII fields Overdrive Sin alone. Both chapters were listed on
 * 2026-09-29 (D-279); `./lookup.ts#CHAPTER_GAME` names both, so the lookup finds them by game.
 */

import type { Tactic } from './common.ts';
import { SIN_FACE_BOSS_IDS, sinFace } from './sin-face.ts';
import { SIN_FINS_CORE_BOSS_IDS, sinFinsCore } from './sin-fins-core.ts';

export { sinFace, SIN_FACE_BOSS_IDS } from './sin-face.ts';
export { sinFinsCore, SIN_FINS_CORE_BOSS_IDS } from './sin-fins-core.ts';

/** The registry rows, the shape of `./index.ts#TacticEntry`. */
export const SIN_TACTIC_ENTRIES: ReadonlyArray<{ chapterId: string; bossId: string; tactic: Tactic }> = [
  ...SIN_FINS_CORE_BOSS_IDS.map((bossId) => ({ chapterId: 'sin-fins-core', bossId, tactic: sinFinsCore })),
  ...SIN_FACE_BOSS_IDS.map((bossId) => ({ chapterId: 'sin-face', bossId, tactic: sinFace })),
];
