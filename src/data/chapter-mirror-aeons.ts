/**
 * **Mirror Aeons**, the Dark Magus Sisters and Dark Yojimbo against Yuna's own Magus Sisters and Yojimbo: a NEW, HIDDEN FFX chapter in two acts (branch `ch-mirror-aeons`, scaffolded 2026-10-15; hidden chapter number 27).
 *
 * Bailey, 2026-10-15, verbatim: "we definitely need an awesome chapter built with yojimbo AND magus sisters that would be so awesome. the most epic encounter ever!!!!!!!!!" and then "keep going full speed ahead, i'll go
 * with all of your recommendations i like the mirror match but make the difficulty appropriate not too easy not too hard". The driver's decisions: the chapter is FFX only, ships **hidden behind the typed word `yojimbo`**
 * (`../app/screens/frontend/yojimboDoor.ts`), listing it on the board waits for Bailey's word, the art is **provisional** (the aeons' own paintings stand in for the Dark ones; two existing backdrops), the music existing cues
 * by reference. The paper preflight is `docs/plans/ch-mirror-aeons-review.md`; the written sources `research/ffx-mirror-aeons.md`; the handoff `docs/handoff/ch-mirror-aeons.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the Dark Aeons (International and HD releases), the player's Yojimbo and Magus Sisters and CTB are FFX's. FFX-2's Yojimbo ("Tourist Trap") is another record.
 *
 * ## Two acts, one chain
 *
 * **Act I, the Dark Magus Sisters, on Mushroom Rock Road** (the pair `kino01_72`: Dark Mindy and Dark Sandy, both gauges starting at 0); then, with no menu between, **Act II, Dark Yojimbo, in the Cavern of the Stolen Fayth** (tier `nagi05_71`),
 * on the second plate (`EnemyGroupDef.plate`). The seam between them is a mid-battle script on the sisters' fall (`all-ko`). The two picks are the chapter's choice among the game's own formations, `[estimate]` until the
 * bench has measured the ladders (`../data/ffx/mirror-aeons-ids.ts`: `MIRROR_ACT_I`, `MIRROR_ACT_II`).
 *
 * **Every enemy number is the game's own** (`research/re-ffx-yojimbo-sisters-feasibility.md`); the party is an `[estimate]` preset (`./ffx/builds/mirror-aeons.ts`); **the Dark aeons' AI and Yuna's Yojimbo and Sisters in
 * the engine are the reverse-engineering session's work in progress** and plug in at the seams in `../battle/ffx/ai/dark-aeons-seams.ts`.
 *
 * **It is an experiment, not a listed chapter**, exactly as the other hidden chapters are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's "N of 18", the veteran check and total play time. It is not in `CHAPTERS` or `CHAPTER_IDS`;
 * `EXPERIMENT_CHAPTERS` lists it (`./chapters-experiments.ts`) and `getChapter` finds it. The board has no card for it.
 */

import type { Chapter } from './encounters.ts';
import { mirrorAeonsBuild } from './ffx/builds/mirror-aeons.ts';
import { darkAeonsGroupOf } from './ffx/enemies/dark-aeons-groups.ts';
import { mirrorAeonsScripts } from '../story/scripts/mirror-aeons.ts';
import { DARK_CINDY_ID, DARK_MINDY_ID, DARK_SANDY_ID, DARK_YOJIMBO_ID, MIRROR_ACT_I, MIRROR_AEONS_ID, MIRROR_AEONS_SCENE } from './ffx/mirror-aeons-ids.ts';

export { MIRROR_AEONS_ID, MIRROR_AEONS_SCENE }; // the ids live in `./ffx/mirror-aeons-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-mirror-aeons.ts`, both read them). Our own words over the research's sourced beats; no number in them. */
export const MIRROR_AEONS_TEXT = {
  title: 'Mirror Aeons',
  subtitle: "Yevon turns Yuna's own aeons against her",
  blurb:
    'Yevon has put Yuna\'s friends in the wrong colours. Two sisters bar Mushroom Rock Road, and a swordsman waits below in the cavern where she found him. ' +
    'Call your own sisters and your own blade, and send the shadows home.',
} as const;

/**
 * Number 27: past Angra Mainyu's 26 (and Biran and Yenke's 25, Valefor at Besaid's 24, the Tourist Trap's 23), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board
 * number: the card says EXP, the eyebrow EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const MIRROR_AEONS: Chapter = {
  id: MIRROR_AEONS_ID,
  game: 'ffx',
  number: 27,
  experimental: true,
  ...MIRROR_AEONS_TEXT,
  location: 'Mushroom Rock Road, and the Cavern of the Stolen Fayth',
  sceneKey: MIRROR_AEONS_SCENE,
  thumbnailKey: 'chapter-mirror-aeons',
  buildRef: mirrorAeonsBuild,
  enemyGroupRef: darkAeonsGroupOf(MIRROR_ACT_I),
  scriptsRef: mirrorAeonsScripts,
  music: {
    // No source names these fights' cues. Act I's `boss-challenge` (the game's one generic boss track, our original take) and Act II's `boss-yojimbo` ("The Summoner's Sorrow", Chapter IX's, Yojimbo's own) are
    // existing cues by reference; the formations' start cues name them. The mountain's bed stands in for the scene (the Gui and Yojimbo chapters' stand-in). Bailey's ear decides (rule 13).
    scene: 'scene-gagazet',
    battle: 'boss-challenge',
    phase2: 'boss-yojimbo',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy records' own `sensorText` (`./ffx/enemies/dark-aeons.ts`), as the `Chapter` contract asks.
  sensorTexts: {
    [DARK_CINDY_ID]: 'Together they are a storm. Take them one at a time.',
    [DARK_SANDY_ID]: 'Together they are a storm. Take them one at a time.',
    [DARK_MINDY_ID]: 'Together they are a storm. Take them one at a time.',
    [DARK_YOJIMBO_ID]: 'He is paid in steel. Strike before his blade is ready.',
  },
};
