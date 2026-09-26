/**
 * Chapter XV — The Den of Woe, the three shades under Mushroom Rock Road (FFX-2).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB (Active only, Bailey
 * 2026-09-21), dresspheres, the FFX-2 status set (`research/ffx2-gippal-den-of-woe.md`
 * header). The registration itself is shared plumbing, "both" (critic/CHECKS.md CHK-020).
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7 to
 * 11; the `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## Registered, reachable, and (since 2026-09-26) LISTED
 *
 * Listed 2026-09-26 (Bailey: "I pick your recommendation for Den of Woe"): the ship layer over this
 * record (`./chapter-den-of-woe-ship.ts`) sits in `CHAPTERS` after Chapter XIV. The paragraphs below
 * are the history of the registration.
 *
 * Bailey answered every recommendation on 2026-09-25 ("I'll go with all your
 * recommendations": GP1–GP18 on `docs/plans/chapter-gippal-review.md`, after its
 * Review's corrections, and the options in `docs/concepts/chapters/gippal/`). The
 * engine, data and AI are here; the Den scene, the shade paintings, the story, the
 * guide, the tactic, the HUD chips and the cue are not built yet (GP18: ship
 * LOCKED if the art is late). So this record sits in `UNLISTED_CHAPTERS`, the
 * Chapter X and XI precedent: `getChapter`, the battle flow and
 * `window.__pyrefly.gotoChapter` reach it by id, and **chapter select does not show it**.
 *
 * Every field a player would see or hear is Bailey's pick or a **placeholder**:
 *
 * - `title: 'The Den of Woe'`, `location`, `number: 15` — **GP2** (picked): XV,
 *   after Isaaru's XIV, by registration order (D-058). Omnis (XII), Trema (XIII)
 *   and Isaaru (XIV) widen `Chapter.number` on their own branches; the integrator
 *   serialises the four.
 * - `buildRef: denOfWoeKit` (= `farplaneBuild` while GP5 b and GP6 b are off) — **GP5 a / GP6 a** (picked): the Chapter V preset and
 *   bag as they stand, Yuna White Mage (Lv 46), Rikku and Paine Dark Knight (Lv 48,
 *   50) `[estimate]` levels; the two Dark Knights on Darkness plus a healer is the
 *   sourced line `[verified: 4 sources]`. Bailey's pick of 2026-09-26 adds 3 Hero Drinks and 8
 *   levels (both `[estimate]`, `./ffx2/builds/den-of-woe.ts`): Invincible from a Hero Drink is
 *   the answer to Lightfall, and the guide teaches it.
 * - `sceneKey: 'bevelle-underground'` — **placeholder**: the approved FFX-2
 *   underground diorama, the nearest to a cave, until the Den scene (plan track T5,
 *   after the O-3 pick A, cold blue pyreflies) is built.
 * - `music` — **GP16 a, stand-in b**: `boss-shuyin` until `boss-den-of-woe` is
 *   auditioned (rule 13); field bed `scene-bevelle-underground` (placeholder, with the
 *   scene); the FFX-2 fanfare.
 * - `scriptsRef` — **placeholder**: a silent pre scene that opens the battle and a
 *   silent post scene that shows results. The beats (GP13 a silent shades, GP14 a
 *   Yuna's narration, GP15's callouts) are drafted for Bailey in
 *   `docs/plans/gippal-story-draft.md`; this track does not write `src/story`.
 * - `subtitle`, `blurb` and `sensorTexts` — our own words over research §2, §3 and
 *   §6.2's sourced beats; no line is quoted (rule 8).
 */

import type { Chapter } from './encounters.ts';
import type { ChapterScripts } from '../story/dsl.ts';
import { battleStart, results } from '../story/dsl.ts';
import { denOfWoeKit } from './ffx2/builds/den-of-woe.ts';
import { denBaralaiGroup } from './ffx2/enemies/den-of-woe.ts';

/**
 * **The options of `docs/plans/den-of-woe-options-2026-09-25.md`**, gathered here (each lives beside
 * what it changes), set to **Bailey's pick of 2026-09-26** ("I pick your recommendation for Den of
 * Woe" = "Den: both, drop the prep"): GP6 b `DEN_OF_WOE_HERO_DRINKS` = 3 and GP5 b
 * `DEN_OF_WOE_LEVEL_BONUS` = 8 (the kit, both `[estimate]`), M1 `DEN_OF_WOE_LIGHTFALL_PREP` = false
 * (the guide and tactic), and GP4 b `DEN_OF_WOE_RETRY_FROM_LINK` = false (not picked: a loss retries
 * from Baralai, as the game does). Pinned by `tests/unit/chapters/den-of-woe-options.test.ts`.
 */
export { DEN_OF_WOE_HERO_DRINKS, DEN_OF_WOE_LEVEL_BONUS } from './ffx2/builds/den-of-woe.ts';
export { DEN_OF_WOE_RETRY_FROM_LINK } from './ffx2/enemies/den-of-woe.ts';
export { DEN_OF_WOE_LIGHTFALL_PREP } from './guides/ffx2-den-of-woe.ts';

/** **Placeholder** story layer: open the battle, show the results, say nothing. */
export const DEN_OF_WOE_PLACEHOLDER_SCRIPTS: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

/** Chapter 15 (the engine record; `CHAPTERS` lists it with the ship layer on). */
export const FFX2_DEN_OF_WOE: Chapter = {
  id: 'ffx2-den-of-woe',
  game: 'ffx2',
  number: 15, // GP2: after Chapter XIV (Isaaru)
  title: 'The Den of Woe', // GP2 (picked)
  subtitle: 'Three men she knows, made of what they felt',
  location: 'Den of Woe — under Mushroom Rock Road', // GP2 (picked)
  // Research §1.1, §2 and §6.2, summarised in our own words. Placeholder card copy;
  // the card itself is not shown until the chapter is listed.
  blurb:
    'Ten old recordings open a sealed cave under the ravine, where a squad of recruits once turned on each other. ' +
    'The pyreflies still hold what the survivors felt: Baralai, then Gippal, then Nooj, one after another, no rest between.',
  sceneKey: 'bevelle-underground', // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-ffx2-den-of-woe',
  buildRef: denOfWoeKit, // Bailey's pick 2026-09-26: the Chapter V preset + 3 Hero Drinks + 8 levels [estimate]
  enemyGroupRef: denBaralaiGroup,
  scriptsRef: DEN_OF_WOE_PLACEHOLDER_SCRIPTS, // PLACEHOLDER — see the file header
  music: {
    scene: 'scene-bevelle-underground', // PLACEHOLDER, with the scene
    battle: 'boss-shuyin', // GP16 stand-in b
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    'shade-baralai': 'He counts every blow. At eight, the last girl to hit him loses three quarters of her maximum HP.',
    'shade-gippal': 'Grinder, a kick, Grinder, a kick, then Bullseye. Below a third of his HP the order breaks, and Mortar joins it.',
    'shade-nooj': 'Defense 144, Magic Defense 103. Once, near the end, Lightfall: 5,000 to everyone.',
  },
};
