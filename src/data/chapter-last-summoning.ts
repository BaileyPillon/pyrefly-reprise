/**
 * **The Last Summoning**: a NEW, HIDDEN FFX chapter (branch `ch-last-summoning`, built 2026-10-15; hidden chapter number 28): Dream's End as a gauntlet whose order the player picks, with the full roster of aeons.
 *
 * Bailey, 2026-10-15, verbatim: "we definitely need an awesome chapter built with yojimbo AND magus sisters ... the most epic encounter ever!!!!!!!!!" and "I'll go with all your recommendations I like the last
 * summoning". The design is concept 2 of `aeons-chapter/concepts.md` (the concepts note of 2026-10-15, kept outside the repository) (section 3) and its offering screen the approved target `frame-2b-offering-menu.png`. The driver's decisions: the
 * chapter ships **hidden behind the typed word `summon`**, hidden chapter **number 28** (27 is the Dark Mirror lane's, word `yojimbo`), Chapter III itself stays **unchanged** (D-651), listing it on the board
 * waits for Bailey's word, no painting is new (the possessed aeons are the player's own paintings, as Dream's End presents them), the music is existing cues by reference. The paper preflight is
 * `docs/plans/ch-last-summoning-review.md`; the handoff `docs/handoff/ch-last-summoning.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: aeons, Summon, the Pay-and-free-attack Yojimbo, the Sisters' orders and the possession chain are FFX's; FFX-2's Yojimbo and Sisters are other fights and nothing here reads them.
 *
 * **Yu Yevon takes the player's aeons one at a time, in the order the player chooses on the offering screen**, and each aeon given is gone for the rest of the chain; the aeon given is fought next, as the game builds it
 * (a copy of the player's own, `research/re-ffx-last-summoning.md` section 7). The party is Dream's End's Tidus, Yuna and Auron holding all eight aeons (`./ffx/builds/last-summoning.ts`); the chain is nine battles
 * (`./ffx/enemies/last-summoning-chain.ts`: the opener, eight possessions, Yu Yevon). It starts at the offering screen, after Braska's Final Aeon (Chapter III covers Braska).
 *
 * **It is an experiment, not a listed chapter**, exactly as the Leblanc preview, Sinspawn Gui and Biran and Yenke are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's "N of 18", the veteran check and total play time. It is not in `CHAPTERS` or `CHAPTER_IDS` (every
 * chapter-generic suite and count stays the eighteen); `EXPERIMENT_CHAPTERS` lists it (`./chapters-experiments.ts`) and `getChapter` finds it. The board has no card for it.
 *
 * The record imports its data modules directly (it derives from no other chapter record), and `./encounters.ts` imports this file for the registry; this file imports only the `Chapter` TYPE from there.
 */

import type { Chapter } from './encounters.ts';
import { lastSummoningBuild } from './ffx/builds/last-summoning.ts';
import { SISTER_SENSOR_TEXT, lastSummoningOpener } from './ffx/enemies/last-summoning-chain.ts';
import { lastSummoningScripts } from '../story/scripts/last-summoning.ts';
import { LAST_SUMMONING_ID, LAST_SUMMONING_SCENE } from './ffx/last-summoning-ids.ts';

export { LAST_SUMMONING_ID, LAST_SUMMONING_SCENE }; // the ids live in `./ffx/last-summoning-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-last-summoning.ts`, both read them). Our own words; no number in them. */
export const LAST_SUMMONING_TEXT = {
  title: 'The Last Summoning',
  subtitle: 'Yu Yevon takes your aeons, one by one',
  blurb:
    'Inside Sin the fayth have nowhere left to hide, and the thing that eats them reaches for every aeon you hold. ' +
    'You choose the order. What it takes it wears, and you will have to fight it.',
} as const;

/**
 * Number 28: past the Dark Mirror lane's 27 (and Angra Mainyu's 26, Biran and Yenke's 25), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the
 * eyebrow EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const LAST_SUMMONING: Chapter = {
  id: LAST_SUMMONING_ID,
  game: 'ffx',
  number: 28,
  experimental: true,
  ...LAST_SUMMONING_TEXT,
  location: "Inside Sin \u2014 Dream's End",
  sceneKey: LAST_SUMMONING_SCENE,
  thumbnailKey: 'chapter-last-summoning',
  buildRef: lastSummoningBuild,
  enemyGroupRef: lastSummoningOpener,
  scriptsRef: lastSummoningScripts,
  music: {
    // Dream's End's own cues, by reference: the bed under the scenes, Yu Yevon's theme for every link (the opener is never fought) and the FFX fanfare. Nobody has heard them in this chapter (rule 13: Bailey's ear).
    scene: 'scene-dreams-end',
    battle: 'boss-yu-yevon',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy records' own `sensorText` (`./ffx/enemies/*.ts`), as the `Chapter` contract asks; the aeons' lines are Chapter III's.
  sensorTexts: {
    'possessed-valefor': 'Strike true. It wants this to end.',
    'possessed-ifrit': 'The fire remembers you. It still obeys.',
    'possessed-ixion': 'Lightning without a summoner to aim it.',
    'possessed-shiva': 'Cold all the way through, now.',
    'possessed-bahamut': 'Soon, it thinks. Soon it can rest.',
    'possessed-anima': 'It atones by attacking you.',
    'possessed-yojimbo': 'Paid for by someone who is no longer here.',
    'possessed-cindy': SISTER_SENSOR_TEXT.cindy,
    'possessed-sandy': SISTER_SENSOR_TEXT.sandy,
    'possessed-mindy': SISTER_SENSOR_TEXT.mindy,
    'yu-pagoda-left': 'Every kindness it performs is aimed at you.',
    'yu-pagoda-right': 'Every kindness it performs is aimed at you.',
    'yu-yevon': 'It cannot be reasoned with. It stopped being anyone a long time ago.',
  },
};
