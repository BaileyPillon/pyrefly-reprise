/**
 * Chapter IX — Yojimbo, in the Cavern of the Stolen Fayth (FFX).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, aeons, an enemy Overdrive
 * gauge and Ronso Rage Doom (`research/ffx-yojimbo.md` §0.3, "None of these
 * facts transfers across games"). The FFX-2 Yojimbo is a different fight and
 * belongs to the planned FFX-2 fallen-aeons chapter.
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7
 * and 8; the `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## Registered, reachable, and UNLISTED
 *
 * Bailey: "Let's add Yojimbo first please. He goes in next build!" His picks
 * on the preflight (`docs/plans/chapter-yojimbo-review.md` §5, B1-B10) and on
 * the options rounds O-1 to O-6 are **still pending**, so this record carries
 * only what depends on none of them. It sits in `UNLISTED_CHAPTERS`, not in
 * `CHAPTERS`: `getChapter`, the battle flow and `window.__pyrefly.gotoChapter`
 * reach it by id, but **chapter select does not show it** — no new card, and
 * no COMING card either, because a card is perceivable and waits for Bailey
 * (AGENTS.md hard rule 9). Moving it into `CHAPTERS` is the integrator's one
 * line, the day its story, meta, scene, tactic and card are picked and built.
 *
 * Every field below that a player would see or hear is a **placeholder**, and
 * says so:
 *
 * - `sceneKey: 'gagazet'` — **placeholder**. No Cavern diorama exists (O-4
 *   is unpicked). Mt. Gagazet is the next stop after the Cavern (§1.1), and
 *   Chapter 1's diorama is the one every FFX chapter already falls back on.
 * - `music` — **placeholder**, Chapter 1's cues, the stopgap Chapter 8 used
 *   before its own cues existed. The chapter's own slot is "Lulu's Theme", the
 *   only place that track plays (§6.4 [verified: 2 sources]); ours must be an
 *   original cue, auditioned first (O-6, rules 8 and 13).
 * - `scriptsRef` — **placeholder**: a silent pre scene that opens the battle
 *   and a silent post scene that shows results, and nothing else. The story
 *   beats are drafted for Bailey in `docs/plans/yojimbo-story-draft.md`; this
 *   track does not write `src/story`.
 * - `title: 'Yojimbo'` — B5, the preflight's recommendation (the encounter's
 *   name, the Evrae precedent), **pending**. Subtitle and blurb are summaries of
 *   research §6.2's sourced beats, in our own words; none is a quoted line.
 *
 * Built on assumptions B1 (this is Lady Ginnem's Yojimbo, candidate A) and B10
 * (it is Chapter IX), both the driver's recommendations, both pending.
 */

import type { Chapter } from './encounters.ts';
import type { ChapterScripts } from '../story/dsl.ts';
import { battleStart, results } from '../story/dsl.ts';
import { yojimboCavernBuild } from './ffx/builds/yojimbo-cavern.ts';
import { yojimboGroup } from './ffx/enemies/yojimbo.ts';

/**
 * **Placeholder** story layer: open the battle, show the results, say nothing.
 * `ChapterScripts` requires a pre scene ending in `battleStart` and a post
 * scene containing `results` (`src/story/dsl.ts`); this is the least that
 * satisfies it without writing a line of story.
 */
export const YOJIMBO_PLACEHOLDER_SCRIPTS: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

/** Chapter 9 (registered, unlisted). */
export const YOJIMBO_CAVERN: Chapter = {
  id: 'yojimbo-cavern',
  game: 'ffx',
  number: 9, // B10 (pending): registration order after Chapter VIII
  title: 'Yojimbo', // B5 (pending)
  // research §6.2 beats 3-4, summarised: Lulu's last duty as Ginnem's guardian.
  subtitle: "A guardian's last duty to her first summoner",
  // research §1.1 / §6.1 [verified: 2 sources]: the last chamber of the Cavern.
  location: 'Cavern of the Stolen Fayth — the last chamber',
  // research §6.2 beats 3-4 and §4.1, summarised. Placeholder card copy; the
  // card itself is not shown until Bailey picks it.
  blurb:
    'Lulu guarded one summoner before Yuna, and she died in this cave. She never left it. ' +
    'Her aeon still answers her, and it strikes harder every time it is struck.',
  sceneKey: 'gagazet', // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-yojimbo-cavern',
  buildRef: yojimboCavernBuild,
  enemyGroupRef: yojimboGroup,
  scriptsRef: YOJIMBO_PLACEHOLDER_SCRIPTS, // PLACEHOLDER — see the file header
  music: {
    // PLACEHOLDER — Chapter 1's cues until the "Lulu's Theme" slot is composed
    // and picked (O-6). FFX cues only (THEMES.md never crosses the scores).
    scene: 'scene-gagazet',
    battle: 'boss-seymour',
    victory: 'victory-ffx',
  },
  // Yojimbo, Ginnem and Daigoro are all Sensor- and Scan-immune
  // (research §2.1, §2.3 "No Scan text exists"), so there is no line to show.
  sensorTexts: {},
};
