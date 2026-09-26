/**
 * Chapter XI — Fallen Aeons, the Road to the Farplane (FFX-2).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the
 * aeons' action counter (`research/ffx2-fallen-aeons.md` §0). The registration
 * itself is shared plumbing, "both" (critic/CHECKS.md CHK-020).
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7 to
 * 10; the `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## Registered, reachable, and (since 2026-09-26) LISTED
 *
 * Listed 2026-09-26 (Bailey, 2026-09-25: "All your recommendations", option A): the ship
 * layer over this record (`./chapter-fallen-aeons-ship.ts`) sits in `CHAPTERS` after Chapter X.
 * The paragraph below is the history of the registration.
 *
 * Bailey answered every recommendation on 2026-09-24 ("I'll go with your
 * recommendations for all": FA1–FA19, O-1..O-4 on
 * `docs/plans/chapter-fallen-aeons-review.md`). The engine, data and AI are
 * here; the Road scene, the link transitions, the story, the guide and the
 * tactic are not built yet (FA18 = ship LOCKED if the art is late). So this
 * record sits in `UNLISTED_CHAPTERS`, the Chapter IX and X precedent:
 * `getChapter`, the battle flow and `window.__pyrefly.gotoChapter` reach it by
 * id, and **chapter select does not show it**.
 *
 * Every field a player would see or hear is Bailey's pick or a **placeholder**:
 *
 * - `title: 'Fallen Aeons'`, `number: 11`, `location` — **FA17** (picked).
 * - `buildRef: farplaneBuild` — **FA4 a / FA5 a** (picked): the Chapter V
 *   preset and bag as they stand, Yuna White Mage, Rikku and Paine Dark
 *   Knights `[verified: 3 sources]` clear; levels 46 / 48 / 50 `[estimate]`.
 *   **FA6 a**: no Stop protection is modelled; Remedy cures Stop.
 * - `sceneKey: 'farplane'` — **placeholder**: the approved Farplane scene.
 *   The Road plate (O-3 A, with B between links) is painted and installed, but
 *   the Road scene that draws it (plan track T5) is not built.
 * - `music` — **FA15 a** (picked): `boss-ffx2-aeon` on all three links, field
 *   bed `scene-farplane`, and the FFX-2 fanfare.
 * - `scriptsRef` — **placeholder**: a silent pre scene that opens the battle
 *   and a silent post scene that shows results. The beats and FA16's callouts
 *   are drafted in `docs/plans/fallen-aeons-story-draft.md`; this track does
 *   not write `src/story`.
 * - `subtitle`, `blurb` and `sensorTexts` — our own words over research §2 and
 *   §6.2's sourced beats; no line is quoted.
 */

import type { Chapter } from './encounters.ts';
import type { ChapterScripts } from '../story/dsl.ts';
import { battleStart, results } from '../story/dsl.ts';
import { farplaneBuild } from './ffx2/builds/farplane.ts';
import { roadShivaGroup } from './ffx2/enemies/fallen-aeons-road.ts';

/** **Placeholder** story layer: open the battle, show the results, say nothing. */
export const FALLEN_AEONS_PLACEHOLDER_SCRIPTS: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

/** Chapter 11 (the engine record; `CHAPTERS` lists it with the ship layer on). */
export const FFX2_FALLEN_AEONS: Chapter = {
  id: 'ffx2-fallen-aeons',
  game: 'ffx2',
  number: 11, // FA17: after Chapter IX (Yojimbo) and X (Seymour Natus)
  title: 'Fallen Aeons', // FA17 (picked)
  subtitle: 'Three platforms, three of her own',
  location: 'Road to the Farplane', // FA17 (picked)
  // Research §2 and §6.2, summarised in our own words. Placeholder card copy; the
  // card itself is not shown until the chapter is listed.
  blurb:
    'The road down into the Farplane runs over three platforms, and an aeon Yuna once called waits on each. ' +
    'Shiva, then the Magus Sisters, then Anima.',
  sceneKey: 'farplane', // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-ffx2-fallen-aeons',
  buildRef: farplaneBuild,
  enemyGroupRef: roadShivaGroup,
  scriptsRef: FALLEN_AEONS_PLACEHOLDER_SCRIPTS, // PLACEHOLDER — see the file header
  music: {
    scene: 'scene-farplane',
    battle: 'boss-ffx2-aeon',
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    'x2-shiva': 'Fire hurts her. Ice feeds her. Every blow you land brings the storm sooner.',
    sandy: 'Evasion 33. Kill any one sister and Delta Attack is gone for good.',
    cindy: 'Guards her sisters on her first turn. Dispel undoes it.',
    mindy: 'Evasion 76, the lowest HP of the three.',
    'x2-anima': 'Holy is the one way in. Cure what Pain takes, or it keeps taking.',
  },
};
