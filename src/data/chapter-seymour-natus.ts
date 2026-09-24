/**
 * Chapter X — Seymour Natus, the Highbridge of Bevelle (FFX).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, aeons, Banish, Trigger
 * Commands and the FFX status set (`research/ffx-seymour-natus-highbridge.md`
 * §0.3: FFX-2 has no Natus, no Mortibody and no Highbridge boss).
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7
 * to 9; the `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## Registered, reachable, and UNLISTED
 *
 * Bailey answered every recommendation on 2026-09-24 ("I'll go with your
 * recommendations for all"), but the art, the arena, the portrait, the HUD
 * reads and the music those picks approve are not painted, built or composed
 * yet (B16 = ship LOCKED if the art is late). So this record sits in
 * `UNLISTED_CHAPTERS`, the Chapter IX precedent: `getChapter`, the battle flow
 * and `window.__pyrefly.gotoChapter` reach it by id, and **chapter select does
 * not show it**. Listing it is the integrator's one line, once its story,
 * meta, scene, guide, tactic and card exist.
 *
 * Every field below that a player would see or hear is either Bailey's pick or
 * a **placeholder**, and says which:
 *
 * - `title: 'Seymour Natus'` and `location` — **B1** (picked).
 * - `sceneKey: 'gagazet'` — **placeholder**. The Highbridge plate (O-3 C,
 *   night with the city lit) is picked and not painted. Chapter 1's diorama is
 *   the one every FFX chapter falls back on. Not `bevelle-underground`: that
 *   is the FFX-2 Bahamut arena (research §0.3).
 * - `music.battle: 'boss-seymour-macalania'` — **placeholder**, B15's named
 *   stand-in (Chapter VII's cue) until the new Noble Rot cue is sketched and
 *   picked by ear (rules 8 and 13).
 * - `scriptsRef` — **placeholder**: a silent pre scene that opens the battle
 *   and a silent post scene that shows results. The story beats are drafted
 *   for Bailey in `docs/plans/natus-story-draft.md`; this track does not write
 *   `src/story`.
 * - `subtitle` and `blurb` — our own summaries of research §8.2's sourced
 *   beats; no line is quoted.
 */

import type { Chapter } from './encounters.ts';
import type { ChapterScripts } from '../story/dsl.ts';
import { battleStart, results } from '../story/dsl.ts';
import { highbridgeBuild } from './ffx/builds/highbridge.ts';
import { seymourNatusGroup } from './ffx/enemies/seymour-natus.ts';

/**
 * **Placeholder** story layer: open the battle, show the results, say nothing.
 * `ChapterScripts` requires a pre scene ending in `battleStart` and a post
 * scene containing `results` (`src/story/dsl.ts`).
 */
export const NATUS_PLACEHOLDER_SCRIPTS: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

/** Chapter 10 (registered, unlisted). */
export const SEYMOUR_NATUS: Chapter = {
  id: 'seymour-natus',
  game: 'ffx',
  number: 10, // D-058: registration order after Chapter IX
  title: 'Seymour Natus', // B1 (picked)
  // research §8.2 beats 8-9, summarised: the one Seymour fight the party turns back into.
  subtitle: 'The guardians turn back on the bridge',
  location: 'Highbridge of Bevelle — before the Main Gate', // B1 (picked)
  // research §8.2 beats 7-9 and §4.1, summarised. Placeholder card copy; the
  // card itself is not shown until the chapter is listed.
  blurb:
    'Seymour meets them at the end of the bridge and offers death as a mercy. ' +
    'Kimahri stands his ground, and the others come back for him.',
  sceneKey: 'gagazet', // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-seymour-natus',
  buildRef: highbridgeBuild,
  enemyGroupRef: seymourNatusGroup,
  scriptsRef: NATUS_PLACEHOLDER_SCRIPTS, // PLACEHOLDER — see the file header
  music: {
    // PLACEHOLDER — B15's stand-in until the new cue is picked (O-6). FFX cues
    // only (THEMES.md never crosses the scores).
    scene: 'scene-gagazet',
    battle: 'boss-seymour-macalania',
    victory: 'victory-ffx',
  },
  // research §1.5 and §2.3, in our own words (the enemy records carry the same lines).
  sensorTexts: {
    'seymour-natus': 'Casts elemental magic, then Break, then Flare.',
    mortibody: 'Watch what it casts: its master answers in kind.',
  },
};
