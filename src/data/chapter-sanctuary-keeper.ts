/**
 * **The Sanctuary Keeper**: a NEW, HIDDEN FFX chapter (branch `ch-sanctuary-keeper`, built 2026-11-06; hidden chapter number 39): the beast that keeps the last road up Mt. Gagazet, fought at the summit (`mtgz08_00`).
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too" (to building every researched boss he never picked); and, 2026-10-31, "you make the executive decisions
 * for the next few days. i'll go with all of your recommendations." The driver's decisions under those words are in `docs/handoff/ch-sanctuary-keeper.md` ("driver's call, his to overturn"): the chapter ships **hidden behind the
 * typed word `beast`** (SK1), hidden chapter **number 39**, FFX only, Chapter I's Gagazet plate as the stage (SK4), the party Tidus, Yuna and Auron on Chapter I's preset with Lulu, Wakka, Kimahri and Rikku on the bench (SK2 changed from the preflight's
 * Tidus, Yuna, Lulu by the bench: 69 against 19.5 percent for the advisor's line; SK3), aeons allowed (SK8), the sweep fuse hidden as in the game (SK7), the area changes as flags only (SK6), stand-in music (SK9), Normal start (SK10), the painting owed (SK5: **not painted yet, a stand-in**), no boss number
 * touched. The paper preflight is `docs/plans/ch-beast-review.md`; the game's rules are `research/re-ffx-sanctuary-keeper.md`. **Not the Spectral Keeper** (chapter 29, the Zanarkand Dome): a different monster.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the fight is the last obstacle on the mountain, before the Zanarkand ruins; CTB, aeons and the FFX status set. FFX-2's Bevelle Underground guardians are separate fights in the
 * ATB engine and nothing here applies to them.
 *
 * **The fight in one paragraph.** Forty thousand HP, Defense and Magic Defense 100, and it heals nine thousand nine hundred and ninety-nine twice every six turns if nothing interferes, so plain blows cannot win it. It opens with
 * Photon Wings on the whole line (Curse, and rolls for Confuse, Sleep, Silence and Darkness), strikes twice, breathes for two to three thousand on one of you, and heals twice; and when it has been struck enough times (three to
 * seven, hidden) it lashes the whole line with its tail, takes your Haste and sets your turns back. The answer is to take the healing from it: put Reflect on it so its own Curaga mends you, keep it poisoned so a support turn goes
 * to Esuna, break its armour (it answers with Protect, a turn spent), Shell before the breath, Hastega again after the tail.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Spectral Keeper and Penance are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it. Listing it later is moving this record into `CHAPTERS` (`docs/handoff/ch-sanctuary-keeper.md` has the steps).
 */

import type { Chapter } from './encounters.ts';
import { sanctuaryKeeperBuild } from './ffx/builds/sanctuary-keeper.ts';
import { sanctuaryKeeperGroup } from './ffx/enemies/sanctuary-keeper.ts';
import { sanctuaryKeeperScripts } from '../story/scripts/sanctuary-keeper.ts';
import { SANCTUARY_KEEPER_CHAPTER_ID, SANCTUARY_KEEPER_ID, SANCTUARY_KEEPER_SCENE } from './ffx/sanctuary-keeper-ids.ts';

export { SANCTUARY_KEEPER_CHAPTER_ID, SANCTUARY_KEEPER_SCENE }; // the ids live in `./ffx/sanctuary-keeper-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-sanctuary-keeper.ts`, both read them). Our own words over the research's sourced rules; no number in them. */
export const SANCTUARY_KEEPER_TEXT = {
  title: 'The Sanctuary Keeper',
  subtitle: 'Take the mending from it',
  blurb:
    'The last beast on the mountain heals itself faster than you can wound it. ' +
    'Turn its own spell back on it, keep it poisoned, and be shielded before the breath comes round.',
} as const;

/**
 * Number 39: the program plan's row (33 to 38 and 40 on are the sibling chapter lanes'), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the eyebrow
 * EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const SANCTUARY_KEEPER: Chapter = {
  id: SANCTUARY_KEEPER_CHAPTER_ID,
  game: 'ffx',
  number: 39,
  experimental: true,
  ...SANCTUARY_KEEPER_TEXT,
  location: 'Mt. Gagazet — the summit',
  sceneKey: SANCTUARY_KEEPER_SCENE,
  thumbnailKey: 'chapter-seymour-flux', // a stand-in: Chapter I's card (the same mountain); the chapter's own card is owed (`docs/handoff/ch-sanctuary-keeper.md`, the art list)
  buildRef: sanctuaryKeeperBuild,
  enemyGroupRef: sanctuaryKeeperGroup,
  scriptsRef: sanctuaryKeeperScripts,
  music: {
    // The mountain's own bed under the scenes; the boss cue is `boss-seymour` as a flagged stand-in (preflight SK9: the game plays the Boss Theme; rule 13: Bailey's ear).
    scene: 'scene-gagazet',
    battle: 'boss-seymour',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy record's own `sensorText` (`./ffx/enemies/sanctuary-keeper.ts`), as the `Chapter` contract asks.
  sensorTexts: {
    [SANCTUARY_KEEPER_ID]: 'It mends itself faster than you can wound it. Take the mending from it, and mind the breath.',
  },
};
