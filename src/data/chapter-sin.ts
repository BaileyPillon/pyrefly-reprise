/**
 * Chapter XVII — **Sin**, the assault from the *Fahrenheit* (FFX). Link 4,
 * Overdrive Sin, first.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; `research/ffx-sin.md` §0.3]: CTB,
 * the airship range, aeons, a boss with a turn clock ending in a scripted Game
 * Over. None of it exists in FFX-2.
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7 to
 * 15; the `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## Registered, reachable, NOT listed (the switch)
 *
 * Bailey, 2026-09-27: "all your recommendations" — Sin's end state is concept A
 * (Left Fin, Right Fin, Genais with the Core, the save, then Overdrive Sin)
 * reached through B: **link 4 first, shipped unlisted behind a switch**, then
 * links 1 to 3 in front (`docs/concepts/chapters/sin-2026-09-27/README.md`,
 * "Recommendation"). So this record sits in `UNLISTED_CHAPTERS`: `getChapter`,
 * the battle flow and `window.__pyrefly.gotoChapter('sin')` reach it by id;
 * chapter select shows **no card** and nothing counts it. Listing it is the
 * switch: moving the record into `CHAPTERS`, once its paintings, story and
 * cues are Bailey's picks.
 *
 * Every field a player would see or hear is a **placeholder**, and says so:
 *
 * - `title`, `subtitle`, `location`, `blurb` — our own summaries of research
 *   §1.1 and §9.1-§9.2 (no line is quoted). `number: 17`: the concept sheet
 *   reserved XVI, which Ixion at Djose took when it was listed first (merge of 2026-09-28).
 * - `sceneKey: 'evrae-airship-deck'` — **placeholder**. Link 4 is fought on the
 *   *Fahrenheit*'s deck, above Bevelle at dusk (§9.1, `[verified: 2 sources]`);
 *   that backdrop is not painted, so Chapter VIII's deck (the same ship, and the
 *   base the concept frames were composed on) stands in. Its range director
 *   follows the same `airship.range` flag this fight sets, FAR for the pulls.
 * - The enemy's art — **placeholder**: no painting exists; the stage draws its
 *   grey boss silhouette (`src/data/ffx/enemies/overdrive-sin.ts`).
 * - `music` — **placeholder** FFX cues (`scene-fahrenheit`, `boss-evrae`) until
 *   the countdown cue is written and picked by ear (rules 8 and 13). No source
 *   names the retail track for the head (S-21).
 * - `scriptsRef` — **placeholder**: a silent pre scene that opens the battle and
 *   a silent post scene that shows results. The beats (§9.2) are for the story
 *   track once the concept frames are picked.
 */

import type { Chapter } from './encounters.ts';
import type { ChapterScripts } from '../story/dsl.ts';
import { battleStart, results } from '../story/dsl.ts';
import { sinFahrenheitBuild } from './ffx/builds/sin-fahrenheit.ts';
import { overdriveSinGroup } from './ffx/enemies/overdrive-sin.ts';

/** **Placeholder** story layer: open the battle, show the results, say nothing. */
export const SIN_PLACEHOLDER_SCRIPTS: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

/** Chapter 17 (unlisted: `./chapters-unlisted.ts`). */
export const SIN: Chapter = {
  id: 'sin',
  game: 'ffx',
  number: 17, // the next free slot: XVI went to Ixion at Djose (listed 2026-09-27)
  title: 'Sin', // PLACEHOLDER — the concept sheet's working name
  // research §5.4, summarised: the fight is a race against the mouth.
  subtitle: 'Before the mouth is fully open',
  // research §9.1 [verified: 2 sources]: the Fahrenheit, above Bevelle.
  location: 'Deck of the Fahrenheit — above Bevelle',
  // research §9.2 beats 8-10, summarised; no line quoted.
  blurb:
    'Sin fell into Bevelle and rose again with wings. The main gun is still broken, ' +
    'so Cid flies the ship straight at its face, and the mouth begins to open.',
  sceneKey: 'evrae-airship-deck', // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-sin',
  buildRef: sinFahrenheitBuild,
  enemyGroupRef: overdriveSinGroup,
  scriptsRef: SIN_PLACEHOLDER_SCRIPTS, // PLACEHOLDER — see the file header
  music: {
    // PLACEHOLDER FFX cues (THEMES.md never crosses the scores); S-21.
    scene: 'scene-fahrenheit',
    battle: 'boss-evrae',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy record's own `sensorText`, as the contract asks.
  sensorTexts: {
    'overdrive-sin': 'Its mouth is the clock. End it before the mouth is fully open.',
  },
};
