/**
 * **Spherimorph**: a NEW, HIDDEN FFX chapter (branch `ch-spherimorph`, built 2026-11-06; hidden chapter number 41): the guardian of the spring in the Macalania Woods, fought on the way to the temple (`mcfr03_00`).
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too" (to building every researched boss he never picked); and, 2026-10-31, "you make the executive decisions
 * for the next few days. i'll go with all of your recommendations." The driver's decisions under those words are in `docs/handoff/ch-spherimorph.md` ("driver's call, his to overturn"): the chapter ships **hidden behind
 * the typed word `spherimorph`** (SP1), hidden chapter **number 41**, FFX only, the Macalania Temple's plate as the stage (SP4), the party Tidus, Yuna and Lulu on the Macalania preset without Shiva, with Auron, Wakka, Kimahri
 * and Rikku on the bench (SP2, SP3), aeons allowed (SP8), the current element hidden as in the game (SP7), three short lines of our own words (SP6), stand-in music (SP9), Normal start (SP10), the painting (SP5: **painted in the r77 art
 * install, the driver's pick**), no boss number touched. The paper preflight is `docs/plans/ch-spherimorph-review.md`; the game's rules are `research/re-ffx-spherimorph.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Spherimorph exists only in FFX (the fight between the Thunder Plains and Lake Macalania); CTB, aeons and the FFX status set. FFX-2 has no counterpart.
 *
 * **The fight in one paragraph.** Twelve thousand HP and Armored (a plain blow is divided by three), and it takes damage from **one element only**, which it picks at random when the fight starts and again every time
 * that element is struck; it **absorbs the other three and Holy** (the damage heals it). It answers a hit by what hit it: a plain blow draws a spell of the element **opposite** its weakness on the attacker, which tells the
 * player which element it is; magic of the wrong element is answered on the whole line; magic of the right element is not answered at all, it shifts. Its own turn is an Attack, and below half HP half of its turns are Press
 * on the whole line. The answer: probe with a plain blow, cast the opposite of what answers, read it again after every hit that lands.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Keepers and Penance are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it. Listing it later is moving this record into `CHAPTERS` (`docs/handoff/ch-spherimorph.md` has the steps).
 */

import type { Chapter } from './encounters.ts';
import { spherimorphBuild } from './ffx/builds/spherimorph.ts';
import { spherimorphGroup } from './ffx/enemies/spherimorph.ts';
import { spherimorphScripts } from '../story/scripts/spherimorph.ts';
import { SPHERIMORPH_CHAPTER_ID, SPHERIMORPH_ID, SPHERIMORPH_SCENE } from './ffx/spherimorph-ids.ts';

export { SPHERIMORPH_CHAPTER_ID, SPHERIMORPH_SCENE }; // the ids live in `./ffx/spherimorph-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-spherimorph.ts`, both read them). Our own words over the research's sourced rules; no number in them. */
export const SPHERIMORPH_TEXT = {
  title: 'Spherimorph',
  subtitle: 'Read the answer it gives',
  blurb:
    'At the spring in the Macalania Woods a guardian takes hurt from one element only and drinks the rest. ' +
    'Strike it plain, read the spell it answers with, and cast the opposite.',
} as const;

/**
 * Number 41: the program plan's row (33 to 40 and 42 on are the sibling chapter lanes'), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the eyebrow
 * EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const SPHERIMORPH: Chapter = {
  id: SPHERIMORPH_CHAPTER_ID,
  game: 'ffx',
  number: 41,
  experimental: true,
  ...SPHERIMORPH_TEXT,
  location: 'Macalania Woods — the spring',
  sceneKey: SPHERIMORPH_SCENE,
  thumbnailKey: 'chapter-seymour-anima-macalania', // a stand-in: the Macalania Temple's card (the next place on the road); the chapter's own card is owed (`docs/handoff/ch-spherimorph.md`, the art list)
  buildRef: spherimorphBuild,
  enemyGroupRef: spherimorphGroup,
  scriptsRef: spherimorphScripts,
  music: {
    // The Macalania bed under the scenes; the boss cue is `boss-challenge` as a flagged stand-in (preflight SP9: the game plays the Boss Theme; rule 13: Bailey's ear).
    scene: 'scene-macalania-temple',
    battle: 'boss-challenge',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy record's own `sensorText` (`./ffx/enemies/spherimorph.ts`), as the `Chapter` contract asks.
  sensorTexts: {
    [SPHERIMORPH_ID]: 'It takes hurt from one element only and drinks the rest. Strike it plainly: what answers shows which.',
  },
};
