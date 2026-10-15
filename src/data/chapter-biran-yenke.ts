/**
 * **Biran and Yenke**, Kimahri's duel at the gate of Mt. Gagazet — a NEW, HIDDEN FFX chapter (2026-10-15).
 *
 * Bailey, 2026-10-15, verbatim: "Implement the unimplemented chapters please." and "I would like to add, don't just implement the unimplemented chapters. Implement the unimplemented
 * chapters end-to-end please. It needs to be a finished product." The unimplemented chapters are D-536's (2026-10-07, on D-520; D-838): this one (FFX) and Angra Mainyu (FFX-2).
 * The reading, following the precedent of his last two "add them in" (D-842, D-843, D-848): the chapter ships **hidden behind a typed word** (`kimahri`), listing it on the board
 * waits for his word after he has played it (D-848), the art is **provisional** (approved paintings reused, nothing replaced), the music is an existing cue by reference.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Kimahri, Lancet, Ronso Rage, the CTB and the FFX status set are FFX's. Research: `research/ffx-biran-yenke.md`.
 *
 * **It is an experiment, not a listed chapter**, as the other hidden chapters are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it and `getChapter`
 * finds it. The board has no card for it; typing `kimahri` on chapter select opens it (`../app/screens/frontend/kimahriDoor.ts`).
 */

import type { Chapter } from './encounters.ts';
import { gagazetGateBuild } from './ffx/builds/gagazet-gate.ts';
import { BIRAN_SENSOR, YENKE_SENSOR, biranYenkeGroup } from './ffx/enemies/biran-yenke.ts';
import { biranYenkeScripts } from '../story/scripts/biran-yenke.ts';
import { BIRAN_ID, BIRAN_YENKE_ID, BIRAN_YENKE_SCENE, YENKE_ID } from './ffx/biran-yenke-ids.ts';

export { BIRAN_YENKE_ID, BIRAN_YENKE_SCENE }; // the ids live in `./ffx/biran-yenke-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the record and the pause metadata, `./chapter-meta-biran-yenke.ts`, both read them). Our own words over the research's sourced beats (§1). */
export const BIRAN_YENKE_TEXT = {
  title: 'Biran and Yenke',
  subtitle: 'Kimahri alone, against the two who took his horn',
  location: 'Mt. Gagazet — the mountain gate',
  blurb:
    'Two Ronso bar the way up the sacred mountain, and the challenge is Kimahri\'s alone. They guard each other, and they know things he does not. ' +
    'Take their lessons before you take the gate.',
} as const;

/**
 * Number 25: past the Tourist Trap's 23 and Valefor at Besaid's 24, so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`; Angra Mainyu takes 26). It is no board
 * number: the card says EXP, the eyebrow EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const BIRAN_YENKE: Chapter = {
  id: BIRAN_YENKE_ID,
  game: 'ffx',
  number: 25,
  experimental: true,
  ...BIRAN_YENKE_TEXT,
  sceneKey: BIRAN_YENKE_SCENE,
  thumbnailKey: 'chapter-biran-yenke',
  buildRef: gagazetGateBuild,
  enemyGroupRef: biranYenkeGroup,
  scriptsRef: biranYenkeScripts,
  music: {
    // The game plays Mt. Gagazet's own theme through the duel (research §8, `[search: single source]`): ours in that role is `scene-gagazet`, the bed of the scenes and the fight
    // alike (the formation's start cue names it, so the battle does not restart it). Bailey's call by ear (rule 13); `boss-challenge` is the alternative if he wants a battle theme.
    scene: 'scene-gagazet',
    battle: 'scene-gagazet',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy records' own `sensorText`, as the `Chapter` contract asks.
  sensorTexts: {
    [BIRAN_ID]: BIRAN_SENSOR,
    [YENKE_ID]: YENKE_SENSOR,
  },
};
