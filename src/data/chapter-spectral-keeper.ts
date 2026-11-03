/**
 * **The Spectral Keeper**: a NEW, HIDDEN FFX chapter (branch `ch-keeper`, built 2026-11-02; hidden chapter number 29): the beast that keeps the door before Yunalesca, fought on six glyph platforms (Zanarkand Dome, `dome02_00`).
 *
 * Bailey, 2026-10-18, picked "Spectral Keeper + Fallen Maesters (Recommended)" (D-1039: the route is sourced research plus RE data and AI, a paper preflight per chapter, end-state options for his pick, then a build behind a
 * hidden word) and, 2026-11-02, "i'll go with all of your recommendations please implement all the unimplemented chapters that i decided on". The driver's decisions under that blanket yes are in `docs/handoff/ch-keeper.md`
 * ("driver pick, his to overturn"): the chapter ships **hidden behind the typed word `keeper`** (the preflight's SK9: listing it on the board is Bailey's word), hidden chapter **number 29**, the Dome's own plate as the stage
 * (SK2 a), the party Tidus, Yuna and Auron on Chapter II's build (SK5), aeon mode built (SK6), the mine's fuse at the likelier base 84 `[estimate]` (SK7), the music Yunalesca's cue as a stand-in (SK10). The paper preflight is
 * `docs/plans/ch-keeper-review.md`; the game's rules are `research/re-ffx-spectral-keeper.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, aeons, Trigger-style commands and the FFX status set. FFX-2's Bevelle Underground guardians are other fights in the ATB engine and nothing here reads them.
 *
 * **The fight in one paragraph.** The front line stands on glyph platforms (a ring of six round the Keeper, a seventh for an aeon) and all three act before it does. Every hit that can hurt it makes it answer with a sweep over the
 * platform in front and the two beside it; every fourth damaging hit lets it light two platforms to explode; **Move** costs a turn and takes a person to a free platform. Where you stand matters more than what you strike.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as Sinspawn Gui, Biran and Yenke and the Last Summoning are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it. Listing it later is moving this record into `CHAPTERS` (`docs/handoff/ch-keeper.md` has the steps).
 */

import type { Chapter } from './encounters.ts';
import { zanarkandBuild } from './ffx/builds/zanarkand.ts';
import { spectralKeeperGroup } from './ffx/enemies/spectral-keeper.ts';
import { spectralKeeperScripts } from '../story/scripts/spectral-keeper.ts';
import { SPECTRAL_KEEPER_CHAPTER_ID, SPECTRAL_KEEPER_ID, SPECTRAL_KEEPER_SCENE } from './ffx/spectral-keeper-ids.ts';

export { SPECTRAL_KEEPER_CHAPTER_ID, SPECTRAL_KEEPER_SCENE }; // the ids live in `./ffx/spectral-keeper-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-spectral-keeper.ts`, both read them). Our own words over the research's sourced rules; no number in them. */
export const SPECTRAL_KEEPER_TEXT = {
  title: 'The Spectral Keeper',
  subtitle: 'Where you stand matters more than what you strike',
  blurb:
    'Something was set at the foot of the lift to keep the door. It answers every blow with a sweep across the glyphs, ' +
    'and every few blows it lights two of them to burn. Move, or be moved.',
} as const;

/**
 * Number 29: past the Last Summoning's 28 (and the Dark Mirror lane's 27, Angra Mainyu's 26, Biran and Yenke's 25), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card
 * says EXP, the eyebrow EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const SPECTRAL_KEEPER: Chapter = {
  id: SPECTRAL_KEEPER_CHAPTER_ID,
  game: 'ffx',
  number: 29,
  experimental: true,
  ...SPECTRAL_KEEPER_TEXT,
  location: 'Zanarkand Dome — the foot of the lift',
  sceneKey: SPECTRAL_KEEPER_SCENE,
  thumbnailKey: 'chapter-yunalesca', // a stand-in: Chapter II's card (the same hall); the chapter's own card is owed (docs/handoff/ch-keeper.md "ART NEEDS")
  buildRef: zanarkandBuild,
  enemyGroupRef: spectralKeeperGroup,
  scriptsRef: spectralKeeperScripts,
  music: {
    // The Dome's own bed under the scenes; the boss cue is Yunalesca's `boss-challenge` as a flagged stand-in (preflight SK10: nobody has heard a cue for this fight; rule 13: Bailey's ear).
    scene: 'scene-zanarkand-dome',
    battle: 'boss-challenge',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy records' own `sensorText` (`./ffx/enemies/spectral-keeper.ts`), as the `Chapter` contract asks.
  sensorTexts: {
    [SPECTRAL_KEEPER_ID]: 'Where you stand matters more than what you strike. The glyphs behind it are not for decoration.',
  },
};
