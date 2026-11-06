/**
 * **Penance**: a NEW, HIDDEN FFX chapter (branch `ch-penance`, built 2026-11-06; hidden chapter number 35): the colossus and its two hands, fought on the Fahrenheit's deck (the airship map `hiku15`, formation `hiku15_70`).
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too" (to building Penance, the Dark Aeons and every researched boss he never picked); and, 2026-10-31, "you make the
 * executive decisions for the next few days. i'll go with all of your recommendations." The driver's decisions under those words are in `docs/handoff/ch-penance.md` ("driver's call, his to overturn"): the chapter ships
 * **hidden behind the typed word `judgment`** (P1), hidden chapter **number 35**, FFX only and not desktop-only (painted 2D, P2), Chapter VIII's deck plate as the stage (P3), the party Tidus, Yuna and Rikku at the stat caps
 * with the seven Celestial weapons (P4, P5), no Escape (P6), painted billboards with the arm set painted once and copied to the other hand (P7, painted at the r76 art install: `docs/handoff/r76-art-install.md`), stand-in music (P8), the arms paying at every death (P9), the
 * five story aeons only (P10), the usual retry (P11), no boss number touched (P12). The paper preflight is `docs/plans/ch-penance-review.md`; the game's rules are `research/re-ffx-penance.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Penance exists in the International and HD Remaster releases of FFX only; CTB, aeons and the FFX status set. FFX-2 has nothing like it and nothing here reads it.
 *
 * **The fight in one paragraph.** Twelve million HP and two hands of half a million each, all three absorbing every element. While it stands whole it can only crush the front line; once a quarter of it is gone it splits, drops its
 * Protect and strikes one of you at a time, and a hidden count of its turns and the blows it takes climbs towards a Judgment Day that takes everyone, if both hands are up. A hand that falls grows back whole twelve ticks later, so the
 * fight is a dance of *which part to hit when*: keep at least one hand down at every one of Penance's turns.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Spectral Keeper and the Last Summoning are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it. Listing it later is moving this record into `CHAPTERS` (`docs/handoff/ch-penance.md` has the steps).
 */

import type { Chapter } from './encounters.ts';
import { penanceBuild } from './ffx/builds/penance.ts';
import { penanceGroup } from './ffx/enemies/penance.ts';
import { penanceScripts } from '../story/scripts/penance.ts';
import { PENANCE_CHAPTER_ID, PENANCE_ID, PENANCE_LEFT_ARM_ID, PENANCE_RIGHT_ARM_ID, PENANCE_SCENE } from './ffx/penance-ids.ts';

export { PENANCE_CHAPTER_ID, PENANCE_SCENE }; // the ids live in `./ffx/penance-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-penance.ts`, both read them). Our own words over the research's sourced rules; no number in them. */
export const PENANCE_TEXT = {
  title: 'Penance',
  subtitle: 'Keep one hand down',
  blurb:
    'The last of the old defenders waits above the deck, two hands at its sides that grow back whole. ' +
    'Strike the hands, break its stride, and never let both stand at once.',
} as const;

/**
 * Number 35: past the Wind Waker's 32 (33 and 34 are the sibling chapter lanes'), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the eyebrow EXPERIMENTAL
 * (`ui/common/roman.ts`).
 */
export const PENANCE: Chapter = {
  id: PENANCE_CHAPTER_ID,
  game: 'ffx',
  number: 35,
  experimental: true,
  ...PENANCE_TEXT,
  location: 'The Fahrenheit — the deck',
  sceneKey: PENANCE_SCENE,
  thumbnailKey: 'chapter-evrae-airship', // a stand-in: Chapter VIII's card (the same deck); the chapter's own card is owed (`docs/handoff/ch-penance.md`, the art list)
  buildRef: penanceBuild,
  enemyGroupRef: penanceGroup,
  scriptsRef: penanceScripts,
  music: {
    // The Fahrenheit's own bed under the scenes; the boss cue is `boss-challenge` as a flagged stand-in (preflight P8: the guides' name for the sourced track is "A Contest of Aeons"; rule 13: Bailey's ear).
    scene: 'scene-fahrenheit',
    battle: 'boss-challenge',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy records' own `sensorText` (`./ffx/enemies/penance.ts`), as the `Chapter` contract asks.
  sensorTexts: {
    [PENANCE_ID]: 'A thing that was made to be fought by many hands, not one. Keep at least one hand down.',
    [PENANCE_RIGHT_ARM_ID]: 'A thing that was made to be fought by many hands, not one. Keep at least one hand down.',
    [PENANCE_LEFT_ARM_ID]: 'A thing that was made to be fought by many hands, not one. Keep at least one hand down.',
  },
};
