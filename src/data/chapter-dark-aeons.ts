/**
 * **The Dark Aeons**: a NEW, HIDDEN FFX chapter (branch `ch-dark-aeons`, built 2026-11-06; hidden chapter number 34): the six other Dark Aeons of the International and HD builds, from Besaid to Mt. Gagazet, as one chain of seven
 * fresh fights (Dark Valefor, Dark Ifrit, Dark Ixion twice, Dark Shiva, Dark Anima, Dark Bahamut).
 *
 * Bailey, relayed by the release driver, verbatim: "implement all unimplemented chapters please" (2026-11-06 about 00:30 EST), "yes on all these too" (to building Penance, the Dark Aeons and every researched boss he never picked; about
 * 00:55 EST), and "you make the executive decisions for the next few days. i'll go with all of your recommendations" (2026-10-31). The picks (DA1 to DA16) are in `docs/plans/ch-dark-aeons-review.md` and the handoff
 * `docs/handoff/ch-dark-aeons.md` ("driver's call, his to overturn"): one chapter, six stops, seven links, the order Valefor, Ifrit, Ixion's two, Shiva, Anima, Bahamut, hidden behind the word `darkaeon`, not listed.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the Dark Aeons exist only in the International and HD Remaster builds of FFX; FFX-2 has none (`research/re-ffx-dark-aeons-six.md`). CTB, aeons, the Overdrive gauge and the FFX status
 * set. The Dark Magus Sisters and Dark Yojimbo are the Mirror Aeons chapter's (Chapter XXVII); Penance is another lane's.
 *
 * **The fights in one paragraph.** Every Dark Aeon is the same machine as Dark Yojimbo: an Overdrive gauge that gains on its own turns and on every hit it takes, and a full gauge is its Overdrive on the next turn
 * (Energy Blast, Hellfire, Aerospark, Thor's Hammer, Diamond Dust, Mega Flare, Oblivion: each KOs a person). **The gauge counts hit events, and a many-blow action is one event**, so the fights reward actions with many blows and an aeon
 * sent in as fodder for the Overdrive. Dark Ifrit and the first Dark Ixion answer every hit with their Attack; Dark Bahamut throws Impulse on every fifth; Dark Anima is immune to every spell and drinks four elements; Dark Shiva is quick.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Spectral Keeper and Sinspawn Gui are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { darkAeonsBuild } from './ffx/builds/dark-aeons.ts';
import { DARK_SIX_GROUPS } from './ffx/enemies/dark-aeons-six-groups.ts';
import { darkAeonsScripts } from '../story/scripts/dark-aeons.ts';
import { DARK_AEONS_CHAPTER_ID, DARK_AEONS_SCENE } from './ffx/dark-aeons-six-ids.ts';

export { DARK_AEONS_CHAPTER_ID, DARK_AEONS_SCENE }; // the ids live in `./ffx/dark-aeons-six-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-dark-aeons.ts`, both read them). Our own words over the research's sourced beats; no number in them. */
export const DARK_AEONS_TEXT = {
  title: 'The Dark Aeons',
  subtitle: 'Six of them, from Besaid to Gagazet',
  blurb:
    'Yevon has dressed the aeons in the wrong colours and set one at every place the pilgrimage touched. ' +
    'Each fills a fury with every blow it takes. Strike hard, strike seldom, and send a friend ahead of the worst of it.',
} as const;

/**
 * Number 34: past the Spectral Keeper's 29, the Fallen Maesters' 30, the hidden 3D Bahamut's 31, the Wind Waker's 32 and 33 (another lane's), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no
 * board number: the card says EXP, the eyebrow EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const DARK_AEONS: Chapter = {
  id: DARK_AEONS_CHAPTER_ID,
  game: 'ffx',
  number: 34,
  experimental: true,
  ...DARK_AEONS_TEXT,
  location: 'Besaid to Mt. Gagazet',
  sceneKey: DARK_AEONS_SCENE,
  thumbnailKey: 'chapter-dark-aeons', // a key only (the card and thumbnail are held until Bailey's word to list the chapter, D-848): nothing loads it while the chapter is hidden
  buildRef: darkAeonsBuild,
  enemyGroupRef: DARK_SIX_GROUPS[0]!,
  scriptsRef: darkAeonsScripts,
  music: {
    // No source names these fights' cues. The mountain's bed stands in under the scenes (the Mirror Aeons' choice); each link's cue is its formation's (`data/ffx/enemies/dark-aeons-six-groups.ts`: `boss-challenge`, then
    // `boss-yojimbo` for the last). Existing cues by reference, flagged stand-ins; Bailey's ear decides (rule 13).
    scene: 'scene-gagazet',
    battle: 'boss-challenge',
    phase2: 'boss-yojimbo',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy records' own `sensorText` (`./ffx/enemies/dark-aeons-six.ts`), as the `Chapter` contract asks.
  sensorTexts: {
    'dark-valefor': 'Every blow feeds her fury. End it quickly, or send something else in to take the great blast.',
    'dark-ifrit': 'He answers every blow. Fewer, heavier hits serve better than many light ones.',
    'dark-ixion': 'His blade strikes back and can be dodged. Let nothing find you.',
    'dark-ixion-2': 'His blade strikes back and can be dodged. Let nothing find you.',
    'dark-shiva': 'She is quick. Her cold kiss can kill outright.',
    'dark-bahamut': 'Fortune favours him. Every fifth blow draws a curse on all of you.',
    'dark-anima': 'No spell touches her, and the elements feed her. Strike with steel.',
  },
};
