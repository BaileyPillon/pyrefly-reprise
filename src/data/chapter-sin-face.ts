/**
 * Chapter XVIII — **Sin: the Face**, the assault from the *Fahrenheit* (FFX):
 * link 4, Overdrive Sin, over Bevelle.
 *
 * **Game case: FFX only** [AGENTS.md rule 14; `research/ffx-sin.md` §0.3]: CTB,
 * the airship range, aeons, a boss with a turn clock ending in a scripted Game
 * Over. None of it exists in FFX-2.
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7 to
 * 15; the `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## The split (D-270), and the rename
 *
 * Bailey, 2026-09-27 ~15:20 EDT, "all your recommendations": Sin is two
 * chapters, **split where the game saves**. Chapter XVII, "Sin: the Fins and
 * the Core" (`./chapter-sin-fins-core.ts`), runs links I to III on one party
 * state and ends at Sinfall; this chapter opens after the save, rested, and runs
 * link IV. Nothing carries across the save (§1.2 `[verified: 2 sources]`).
 *
 * This record was `sin` (Chapter XVII, link 4 first) on branch `chapter-sin`
 * only: never on main, never listed, never in a save. It is renamed `sin-face`
 * and renumbered **18** (`docs/plans/sin-two-chapters-plan.md` §1.4;
 * `docs/CONTRACT-CHANGES.md`).
 *
 * ## Registered, reachable, NOT listed (the switch)
 *
 * The record sits in `UNLISTED_CHAPTERS`: `getChapter`, the battle flow and
 * `window.__pyrefly.gotoChapter('sin-face')` reach it by id; chapter select shows
 * **no card** and nothing counts it. Listing it is the switch (plan §6), once its
 * paintings, story and cues are Bailey's picks.
 *
 * Every field a player would see or hear is a **placeholder**, and says so:
 *
 * - `title` — D-270's working title; Bailey confirms it at listing (Q13).
 *   `subtitle`, `location`, `blurb` — our own summaries of research §1.1 and
 *   §9.1-§9.2 (no line is quoted).
 * - `sceneKey: 'evrae-airship-deck'` — **placeholder**. Link 4 is fought on the
 *   *Fahrenheit*'s deck, above Bevelle at dusk (§9.1, `[verified: 2 sources]`);
 *   that backdrop is not painted, so Chapter VIII's deck (the same ship) stands
 *   in. Its range director follows the same `airship.range` flag this fight
 *   sets, FAR for the pulls.
 * - The enemy's art — **placeholder**: the stage's grey boss silhouette.
 * - `music` — **placeholder** FFX cues (`scene-fahrenheit`, `boss-evrae`) until
 *   the countdown cue is written and picked by ear (rules 8 and 13; S-21).
 * - `scriptsRef` — **placeholder** (`src/story/scripts/sin-face.ts`, a stub
 *   package P fills).
 */

import type { Chapter } from './encounters.ts';
import { sinFaceScripts } from '../story/scripts/sin-face.ts';
import { sinFahrenheitBuild } from './ffx/builds/sin-fahrenheit.ts';
import { overdriveSinGroup } from './ffx/enemies/overdrive-sin.ts';

/** Chapter 18 (unlisted: `./chapters-unlisted.ts`). */
export const SIN_FACE: Chapter = {
  id: 'sin-face',
  game: 'ffx',
  number: 18, // D-270: the second of Sin's two chapters (XVII is the Fins and the Core)
  title: 'Sin: the Face', // D-270's working title; Bailey confirms it at listing
  // research §5.4, summarised: the fight is a race against the mouth.
  subtitle: 'Before the mouth is fully open',
  // research §9.1 [verified: 2 sources]: the Fahrenheit, above Bevelle.
  location: 'Deck of the Fahrenheit — above Bevelle',
  // research §9.2 beats 8-10, summarised; no line quoted.
  blurb:
    'Sin fell into Bevelle and rose again with wings. The main gun is still broken, ' +
    'so Cid flies the ship straight at its face, and the mouth begins to open.',
  sceneKey: 'evrae-airship-deck', // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-sin-face',
  buildRef: sinFahrenheitBuild, // D-264; rested after the save (§1.2)
  enemyGroupRef: overdriveSinGroup,
  scriptsRef: sinFaceScripts, // PLACEHOLDER — see the file header
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
