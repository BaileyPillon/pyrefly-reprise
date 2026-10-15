/**
 * **Biran and Yenke Ronso**, Kimahri's solo trial at the Mountain Gate of Mt. Gagazet: a NEW, HIDDEN FFX chapter (branch `ch-biran-yenke`, built 2026-10-14; hidden chapter number 25).
 *
 * Bailey, 2026-10-07 (D-536, his blanket yes to the driver's recommendation): "Biran and Yenke Ronso (FFX, Kimahri's solo trial)"; 2026-10-14, relayed by the driver: "Please work on finishing the
 * unimplemented chapters STAT". The driver's decisions: the chapter ships **hidden behind the typed word `gagazet`** (`../app/screens/frontend/gagazetDoor.ts`), listing it on the board waits for Bailey's word,
 * the art is **provisional** (two new subjects, never replacing an approved painting), the stage is Chapter I's Mt. Gagazet backdrop reused, the music an existing cue by reference. The paper preflight is
 * `docs/plans/ch-biran-yenke-review.md`; the handoff `docs/handoff/ch-biran-yenke.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, Kimahri's Lancet and Ronso Rage, and the two brothers at the Mountain Gate are FFX's; FFX-2's Gagazet mission (Garik and the Youths) is another fight.
 *
 * **Every number of the fight is the game's own**, read from its files by the reverse-engineering session (`research/re-ffx-biran-yenke.md`): the two records, the loot, the move rows, the formation, the party
 * rules and the two scripts. Kimahri's own numbers are **Chapter I's preset** (`./ffx/builds/kimahri-trial.ts`: the same mountain, minutes later in the game; the brothers' stats are derived from his).
 *
 * **It is an experiment, not a listed chapter**, exactly as the Leblanc preview and Sinspawn Gui are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's "N of 18", the veteran check and total play time. It is not in `CHAPTERS` or
 * `CHAPTER_IDS` (every chapter-generic suite and count stays the eighteen); `EXPERIMENT_CHAPTERS` lists it (`./chapters-experiments.ts`) and `getChapter` finds it. The board has no card for it.
 *
 * The record imports its data modules directly (it derives from no other chapter), and `./encounters.ts` imports this file for the registry; this file imports only the `Chapter` TYPE from there.
 */

import type { Chapter } from './encounters.ts';
import { kimahriTrialBuild } from './ffx/builds/kimahri-trial.ts';
import { biranYenkeGroup } from './ffx/enemies/biran-yenke.ts';
import { biranYenkeScripts } from '../story/scripts/biran-yenke.ts';
import { BIRAN_ID, BIRAN_YENKE_ID, GAGAZET_RONSO_SCENE, YENKE_ID } from './ffx/biran-yenke-ids.ts';

export { BIRAN_YENKE_ID, GAGAZET_RONSO_SCENE }; // the ids live in `./ffx/biran-yenke-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-biran-yenke.ts`, both read them). Our own words over the research's sourced beats; no number in them. */
export const BIRAN_YENKE_TEXT = {
  title: 'Biran and Yenke',
  subtitle: 'Kimahri alone, and what the Ronso teach him',
  blurb:
    'Two Ronso stand at the gate of their mountain, and Kimahri faces them by himself. ' +
    'Lancet reads what they carry, and every new thing he learns fills his gauge. ' +
    'Watch which brother stands guard for the other.',
} as const;

/**
 * Number 25: past Valefor at Besaid's 24 (and the Tourist Trap's 23, Fayth's 22 and Sinspawn Gui's 21), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board
 * number: the card says EXP, the eyebrow EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const BIRAN_YENKE: Chapter = {
  id: BIRAN_YENKE_ID,
  game: 'ffx',
  number: 25,
  experimental: true,
  ...BIRAN_YENKE_TEXT,
  location: 'Mt. Gagazet — the Mountain Gate',
  sceneKey: GAGAZET_RONSO_SCENE,
  thumbnailKey: 'chapter-biran-yenke',
  buildRef: kimahriTrialBuild,
  enemyGroupRef: biranYenkeGroup,
  scriptsRef: biranYenkeScripts,
  music: {
    // No source names this fight's cue; the game's one generic boss track is "Challenge" (`boss-challenge`, our original take, shared with Chapter II and the Gui guest hour). The mountain's own bed under the scenes.
    scene: 'scene-gagazet',
    battle: 'boss-challenge',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy records' own `sensorText` (`./ffx/enemies/biran-yenke.ts`), as the `Chapter` contract asks.
  sensorTexts: {
    [BIRAN_ID]: 'He fights for the one who stands behind him.',
    [YENKE_ID]: 'He fights for the one who stands behind him.',
  },
};
