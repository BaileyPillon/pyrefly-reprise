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
import { LAST_SUMMONING_GUIDE } from './last-summoning.ts';
import { FFX2_BAHAMUT_GUIDE } from './ffx2-bahamut.ts';
import { FFX2_VEGNAGUN_SHUYIN_GUIDE } from './ffx2-vegnagun-shuyin.ts';
import { FFX2_LEBLANC_GUIDE } from './ffx2-leblanc.ts';
import { SEYMOUR_ANIMA_MACALANIA_GUIDE } from './seymour-anima-macalania.ts';
import { EVRAE_GUIDE } from './evrae.ts';
import { YOJIMBO_CAVERN_GUIDE } from './yojimbo-cavern.ts';
import { FFX2_TREMA_GUIDE } from './ffx2-trema.ts';
import { FFX2_DEN_OF_WOE_GUIDE } from './ffx2-den-of-woe.ts';
import { FFX2_IXION_DJOSE_GUIDE } from './ffx2-ixion-djose.ts';
import { FFX2_FALLEN_AEONS_GUIDE } from './ffx2-fallen-aeons.ts';
import { SEYMOUR_OMNIS_GUIDE } from './seymour-omnis.ts';
import { SEYMOUR_NATUS_GUIDE } from './seymour-natus.ts';
import { ISAARU_GUIDE } from './ffx-isaaru.ts';
import { SINSPAWN_GUI_GUIDE } from './sinspawn-gui.ts';
import { BIRAN_YENKE_GUIDE } from './biran-yenke.ts';
import { MIRROR_AEONS_GUIDE } from './mirror-aeons.ts';
import { DARK_AEONS_GUIDE } from './dark-aeons.ts';
import { SIN_FINS_CORE_GUIDE } from './sin-fins-core.ts';
import { SIN_FACE_GUIDE } from './sin-face.ts';
import { FFX2_EXPERIMENT_GUIDE } from './ffx2-experiment.ts';
import { FFX2_TOURIST_TRAP_GUIDE } from './ffx2-tourist-trap.ts';
import { FFX2_VALEFOR_BESAID_GUIDE } from './ffx2-valefor-besaid.ts';
import { FFX2_ANGRA_MAINYU_GUIDE } from './ffx2-angra-mainyu.ts';
import { SANCTUARY_KEEPER_GUIDE } from './sanctuary-keeper.ts';
import { WENDIGO_GUIDE } from './wendigo.ts';
import { BELGEMINE_GUIDE } from './belgemine.ts';
import { OBLITZERATOR_GUIDE } from './oblitzerator.ts';
import { PENANCE_GUIDE } from './penance.ts';
import { FFX2_YUNAS_BALLAD_GUIDE } from './ffx2-yunas-ballad.ts';
import { SPHERIMORPH_GUIDE } from './spherimorph.ts';
import { FFX2_YOUTH_LEAGUE_GUIDE } from './ffx2-youth-league.ts';
import { OMEGA_RUINS_GUIDE } from './omega-ruins.ts';
import { FF7_JENOVA_LIFE_GUIDE } from './ff7-jenova-life.ts';
import { FFX2_IFRIT_KILIKA_GUIDE } from './ffx2-ifrit-kilika.ts';
import { FFX2_GARIK_RONSO_GUIDE } from './ffx2-garik-ronso.ts';
import { SHINRYU_GUIDE } from './shinryu.ts';
import { FFX2_LUCA_OPENER_GUIDE } from './ffx2-luca-opener.ts';

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
  LAST_SUMMONING_GUIDE,
  FFX2_BAHAMUT_GUIDE,
  FFX2_VEGNAGUN_SHUYIN_GUIDE,
  FFX2_LEBLANC_GUIDE,
  SEYMOUR_ANIMA_MACALANIA_GUIDE,
  EVRAE_GUIDE,
  YOJIMBO_CAVERN_GUIDE,
  FFX2_TREMA_GUIDE,
  FFX2_DEN_OF_WOE_GUIDE,
  FFX2_IXION_DJOSE_GUIDE,
  FFX2_FALLEN_AEONS_GUIDE,
  SEYMOUR_OMNIS_GUIDE,
  SEYMOUR_NATUS_GUIDE,
  ISAARU_GUIDE,
  SINSPAWN_GUI_GUIDE,
  BIRAN_YENKE_GUIDE,
  MIRROR_AEONS_GUIDE,
  DARK_AEONS_GUIDE,
  SIN_FINS_CORE_GUIDE,
  SIN_FACE_GUIDE,
  FFX2_EXPERIMENT_GUIDE,
};

export const GUIDES: readonly ChapterGuide[] = [
  SEYMOUR_FLUX_GUIDE,
  YUNALESCA_GUIDE,
  // The hidden Last Summoning (FFX only, chapter 28; `EXPERIMENT_CHAPTERS`, not listed) fields Chapter III's possessed aeons and Yu Yevon under the same ids, so its card is listed AHEAD of Chapter III's
  // and found only on its own board (`src/engine/tactics/lookup.ts#chapterOnBoard`: the "Taken by Yu Yevon" locks); Chapter III's answers every other board.
  LAST_SUMMONING_GUIDE,
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
  // Chapter XI (FFX-2 only), listed 2026-09-26 with its chapter.
  FFX2_FALLEN_AEONS_GUIDE,
  // Chapter XV (FFX-2 only), listed 2026-09-26 with its chapter: the three shades.
  FFX2_DEN_OF_WOE_GUIDE,
  // Chapter XVI (FFX-2 only), listed 2026-09-27 with its chapter: Ixion at Djose.
  FFX2_IXION_DJOSE_GUIDE,
  SEYMOUR_OMNIS_GUIDE,
  // Chapter X (FFX only), listed 2026-09-25: the research's line, Haste only Tidus and Auron.
  SEYMOUR_NATUS_GUIDE,
  // Chapter XIV (FFX only), listed 2026-09-25 as is (125/200 on the bench).
  ISAARU_GUIDE,
  // The hidden Sinspawn Gui chapter (FFX only, `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel and the tactic find it by boss id.
  SINSPAWN_GUI_GUIDE,
  // Chapters XVII and XVIII (FFX only), listed 2026-09-29 with their chapters: the Fins and the Core, the Face.
  SIN_FINS_CORE_GUIDE,
  SIN_FACE_GUIDE,
  // The hidden Experiment (FFX-2 only, Chapter 5 at Djose Temple; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel and the tactic find it by boss id.
  FFX2_EXPERIMENT_GUIDE,
  // The hidden Tourist Trap (FFX-2 only, the optional mission in the Cavern of the Stolen Fayth; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here for the same reason.
  FFX2_TOURIST_TRAP_GUIDE,
  // The hidden Valefor at Besaid (FFX-2 only, Chapter 3; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here too.
  FFX2_VALEFOR_BESAID_GUIDE,
  // The hidden Biran and Yenke chapter (FFX only, Kimahri's solo trial; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel and the tactic find it by boss id.
  BIRAN_YENKE_GUIDE,
  MIRROR_AEONS_GUIDE,
  // The hidden Dark Aeons (FFX only, 2026-11-06; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel and the tactic find it by boss id.
  DARK_AEONS_GUIDE,
  // The hidden Angra Mainyu (FFX-2 only, Chapter 5; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here too.
  FFX2_ANGRA_MAINYU_GUIDE,
  // The hidden Sanctuary Keeper chapter (FFX only, the beast on the Mt. Gagazet summit; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel and the tactic find it by boss id.
  SANCTUARY_KEEPER_GUIDE,
  // The hidden Penance chapter (FFX only, the colossus and its two hands on the Fahrenheit's deck; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel finds it by boss id. No tactic is registered for it: the NEXT line is the generic ladder's.
  PENANCE_GUIDE,
  // The hidden Yuna Ballad chapter (FFX-2 only, the possessed Rikku and Paine; EXPERIMENT_CHAPTERS, not listed): its guide rides here so the panel and the tactic find it by boss id.
  FFX2_YUNAS_BALLAD_GUIDE,
  // The hidden Spherimorph chapter (FFX only, the guardian of the spring in the Macalania Woods; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel and the tactic find it by boss id.
  SPHERIMORPH_GUIDE,
  FFX2_YOUTH_LEAGUE_GUIDE,
  // The hidden Omega Ruins chapter (FFX only; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel and the tactic find it by boss id.
  OMEGA_RUINS_GUIDE,
  // The hidden Jenova LIFE chapter (FF7 only, the altar of the Forgotten Capital; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel finds it by boss id the day FF7 has one. No tactic (the advisor is off for FF7).
  FF7_JENOVA_LIFE_GUIDE,
  BELGEMINE_GUIDE, // the hidden Belgemine's Challenge (FFX only)
  // The hidden Ifrit at Kilika Temple chapter (FFX-2 only, the possessed fire aeon; EXPERIMENT_CHAPTERS, not listed): its guide rides here so the panel and the tactic find it by boss id.
  FFX2_IFRIT_KILIKA_GUIDE,
  // The hidden Garik Ronso chapter (FFX-2 only, Garik and the Ronso Youths at the summit; EXPERIMENT_CHAPTERS, not listed): its guide rides here so the panel and the tactic find it by boss id.
  FFX2_GARIK_RONSO_GUIDE,
  // The hidden Shinryu chapter (FFX only, the Monster Arena's deep-water dragon; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel and the tactic find it by boss id.
  SHINRYU_GUIDE,
  // The hidden Luca Opener chapter (FFX-2 only, Logos and Ormi then Leblanc; EXPERIMENT_CHAPTERS, not listed): its guide rides here so the panel and the tactic find it by boss id.
  FFX2_LUCA_OPENER_GUIDE,
  // The hidden Wendigo chapter (FFX only, Wendigo and its two Guado Guardians on frozen Lake Macalania; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel and the tactic find it by boss id.
  WENDIGO_GUIDE,
  // The hidden Oblitzerator chapter (FFX only, the blitzball machine and the dock crane at Luca; `EXPERIMENT_CHAPTERS`, not listed): its guide rides here so the panel and the tactic find it by boss id.
  OBLITZERATOR_GUIDE,
];

/** The guide for one chapter id, if it has one. */
export function guideForChapter(id: string): ChapterGuide | undefined {
  return GUIDES.find((g) => g.id === id);
}
