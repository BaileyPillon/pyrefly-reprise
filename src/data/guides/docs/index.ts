/**
 * Every chapter's guide document, in play order.
 *
 * One entry per chapter that has a guide (`../index.ts`'s `GUIDES`); `tests/unit/guide-doc.test.ts`
 * pins that the two lists name the same chapters with the same boss ids, because the panel finds the
 * document for the board by asking which of its `bossIds` is on the enemy side, exactly as
 * `src/engine/tactics/lookup.ts` finds a chapter for the move advisor. The advisor never reads a
 * document and a document never reads the advisor.
 */

import type { GuideDoc } from '../doc-types.ts';
import { SEYMOUR_FLUX_DOC } from './seymour-flux.ts';
import { YUNALESCA_DOC } from './yunalesca.ts';
import { BRASKAS_FINAL_AEON_DOC } from './braskas-final-aeon.ts';
import { FFX2_BAHAMUT_DOC } from './ffx2-bahamut.ts';
import { FFX2_VEGNAGUN_SHUYIN_DOC } from './ffx2-vegnagun-shuyin.ts';
import { FFX2_LEBLANC_DOC } from './ffx2-leblanc.ts';
import { SEYMOUR_ANIMA_MACALANIA_DOC } from './seymour-anima-macalania.ts';
import { EVRAE_DOC } from './evrae.ts';
import { YOJIMBO_CAVERN_DOC } from './yojimbo-cavern.ts';
import { FFX2_TREMA_DOC } from './ffx2-trema.ts';
import { FFX2_DEN_OF_WOE_DOC } from './ffx2-den-of-woe.ts';
import { FFX2_IXION_DJOSE_DOC } from './ffx2-ixion-djose.ts';
import { FFX2_FALLEN_AEONS_DOC } from './ffx2-fallen-aeons.ts';
import { SEYMOUR_OMNIS_DOC } from './seymour-omnis.ts';
import { SEYMOUR_NATUS_DOC } from './seymour-natus.ts';
import { ISAARU_DOC } from './ffx-isaaru.ts';
import { SINSPAWN_GUI_DOC } from './sinspawn-gui.ts';
import { SIN_FINS_CORE_DOC } from './sin-fins-core.ts';
import { SIN_FACE_DOC } from './sin-face.ts';

export const GUIDE_DOCS: readonly GuideDoc[] = [
  SEYMOUR_FLUX_DOC,
  YUNALESCA_DOC,
  BRASKAS_FINAL_AEON_DOC,
  FFX2_BAHAMUT_DOC,
  FFX2_VEGNAGUN_SHUYIN_DOC,
  FFX2_LEBLANC_DOC,
  SEYMOUR_ANIMA_MACALANIA_DOC,
  EVRAE_DOC,
  YOJIMBO_CAVERN_DOC,
  FFX2_TREMA_DOC,
  FFX2_FALLEN_AEONS_DOC,
  FFX2_DEN_OF_WOE_DOC,
  FFX2_IXION_DJOSE_DOC,
  SEYMOUR_OMNIS_DOC,
  SEYMOUR_NATUS_DOC,
  ISAARU_DOC,
  SINSPAWN_GUI_DOC, // the hidden Sinspawn Gui chapter (FFX only)
  SIN_FINS_CORE_DOC,
  SIN_FACE_DOC,
];

/** The document for one chapter id, if it has one. */
export function docForChapter(id: string): GuideDoc | undefined {
  return GUIDE_DOCS.find((d) => d.id === id);
}
