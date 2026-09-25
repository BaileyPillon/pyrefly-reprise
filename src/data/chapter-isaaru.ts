/**
 * Chapter XIV — **Isaaru**, the Via Purifico beneath Bevelle (FFX).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Yuna's aeons, Summon, Grand
 * Summon, CTB and the FFX status set; in FFX-2 Isaaru is a tour guide and
 * nobody summons (`research/ffx-isaaru-bevelle.md` §0.3).
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7
 * to 10; the `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## Registered, reachable, and UNLISTED
 *
 * Bailey took every recommendation on 2026-09-25 ("I'll go with all your
 * recommendations": `docs/plans/chapter-isaaru-review.md` B1-B22 and
 * `docs/concepts/chapters/isaaru/README.md` O-1 to O-5, after the review's
 * corrections), but the art, the chamber, the portrait, the HUD reads and the
 * cue those picks approve are not painted, built or composed yet (B22 = ship
 * LOCKED if the art is late). So this record sits in `UNLISTED_CHAPTERS`, the
 * Chapter IX and X precedent: `getChapter`, the battle flow and
 * `window.__pyrefly.gotoChapter` reach it by id, and **chapter select does not
 * show it**.
 *
 * Every field a player would see or hear is Bailey's pick or a
 * **placeholder**, and says which:
 *
 * - `title: 'Isaaru'`, `location`, `number: 14` — **B1** (picked): the
 *   bestiary's boss name; XIV by registration order (D-058) after Omnis and
 *   Trema; story order VIII, then this, then X.
 * - `sceneKey: 'macalania-temple'` — **placeholder**. The chamber (O-3 A,
 *   red-lit stone with the hallway behind) is picked and not painted. Chapter
 *   VII's temple is the staging the options frames were composed on. Not
 *   `bevelle-underground`: that is the FFX-2 arena (research §7).
 * - `music.battle: 'boss-yojimbo'` — **placeholder**, B21 = b's "reuse an
 *   existing boss cue" stand-in until the new HYMN-family cue ("Still Water")
 *   is sketched and picked by ear (rules 8 and 13). FFX cues only.
 * - `scriptsRef` — **placeholder**: a silent pre scene that opens the battle
 *   and a silent post scene that shows results. The beats are drafted for
 *   Bailey in `docs/plans/isaaru-story-draft.md`; nothing is in `src/story`.
 * - `subtitle` and `blurb` — our own summaries of research §8.2's sourced
 *   beats; no line is quoted.
 * - `sensorTexts` — **empty on purpose**: all four enemies are Sensor- and
 *   Scan-immune, so the game has no line to paraphrase (research §3.4).
 */

import type { Chapter } from './encounters.ts';
import type { ChapterScripts } from '../story/dsl.ts';
import { battleStart, results } from '../story/dsl.ts';
import { viaPurificoBuild } from './ffx/builds/via-purifico.ts';
import { isaaruGrothiaGroup } from './ffx/enemies/isaaru.ts';

/**
 * **Placeholder** story layer: open the battle, show the results, say nothing.
 * `ChapterScripts` requires a pre scene ending in `battleStart` and a post
 * scene containing `results` (`src/story/dsl.ts`).
 */
export const ISAARU_PLACEHOLDER_SCRIPTS: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

/** Chapter 14 (registered, unlisted). */
export const ISAARU_VIA_PURIFICO: Chapter = {
  id: 'isaaru-via-purifico',
  game: 'ffx',
  number: 14, // B1 / D-058: registration order after Chapters XII and XIII
  title: 'Isaaru', // B1 (picked)
  // research §1.2 and §8.2 beats 5-6, summarised: the one fight the player commands only aeons.
  subtitle: 'A summoner against a summoner',
  location: 'Via Purifico — beneath Bevelle', // B1 (picked)
  // research §8.2 beats 5-7, summarised. Placeholder card copy; no card shows until the chapter is listed.
  blurb:
    'At the way out of the prison, Isaaru waits under orders to stop her. ' +
    'Yuna stands alone, and only her aeons can answer his.',
  sceneKey: 'macalania-temple', // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-isaaru-via-purifico',
  buildRef: viaPurificoBuild,
  enemyGroupRef: isaaruGrothiaGroup,
  scriptsRef: ISAARU_PLACEHOLDER_SCRIPTS, // PLACEHOLDER — see the file header
  music: {
    // PLACEHOLDER — B21 = b's stand-in until the new cue is picked (O-6). FFX
    // cues only (THEMES.md never crosses the scores).
    scene: 'scene-gagazet',
    battle: 'boss-yojimbo',
    victory: 'victory-ffx',
  },
  sensorTexts: {}, // Sensor- and Scan-immune, all four (research §3.4)
};
