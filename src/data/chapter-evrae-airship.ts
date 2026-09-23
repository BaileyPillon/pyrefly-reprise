/**
 * Chapter 8 — Evrae, on the deck of the *Fahrenheit* (FFX).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The airship distance mechanic
 * "has no X-2 counterpart" (`research/ffx-evrae-airship.md` §0.4); the party is
 * FFX's six guardians without Yuna (`fahrenheitBuild`). Nothing here applies
 * to an FFX-2 chapter.
 *
 * Kept out of `./encounters.ts` only for the house 400-line rule, like
 * Chapter 7's record: that file is the contract and lists this record in
 * `CHAPTERS`. The `Chapter` import is type-only, so there is no runtime cycle.
 *
 * **Registered, playable through `window.__pyrefly.gotoChapter`, and LOCKED
 * on chapter select** as a COMING card until Bailey approves its art (every
 * Evrae painting is CANDIDATE; the order widget and the NEAR/FAR staging are
 * built to the driver's recommendation A + C, INFERRED in
 * `docs/target/targets.json`). The lock is one line in
 * `src/app/screens/frontend/comingChapters.ts`'s `LOCKED_CHAPTER_IDS`; see
 * `docs/handoff/chapter-evrae.md`.
 *
 * Id `evrae-airship`: the formation's id (`EVRAE_GROUP_ID`) and the COMING
 * row's id, so the coming card drops off by itself the day the lock line goes.
 * Number 8: display order after the seven registered chapters (the D-018 rule
 * Leblanc's 6 and Macalania's 7 used). Title `Evrae`, the COMING card's own,
 * REVERTED here pending Bailey's pick: Q11 (preflight
 * docs/plans/chapter-evrae-review.md, adopted by D-020, "Yes to all
 * recommendations") settles that the airship should name the chapter, but no
 * source and no decision gives the exact display string — the finish planner
 * flags this as "not sourced anywhere as an exact title, so this needs one
 * more small copy decision" (docs/plans/chapter-evrae-finish.md item f) and
 * even floats `The Fahrenheit` only as an example, not a pick. A prior pass
 * shipped the bare `Fahrenheit` anyway; that is a design choice no tile or
 * decision makes (AGENTS.md rule 9), so it is reverted here and left for
 * Bailey to pick from options (see
 * docs/screenshots/fix10c/evrae-title-options.png). `Evrae` stays the boss's
 * name throughout regardless of the chapter-title pick.
 *
 * `music`: the chapter's own two cues, the two the preflight reserved
 * (§6 / research §12.6): `scene-fahrenheit` ("Within the Hour") and
 * `boss-evrae` ("Open Sky, Closed Gate"), original compositions written to
 * §12.6's brief (docs/audio/THEMES.md cue map rows 22-23). C-16 stays true —
 * no source states which retail track plays for this battle — so these fill
 * the emotional slot, not a canon claim. Both are CANDIDATES until Bailey's
 * ear rules on them (hard rule 13; docs/audio/audition.html "Chapter VIII,
 * Evrae (new)"). The FFX fanfare `victory-ffx` is shared. FFX only.
 */

import type { Chapter } from './encounters.ts';
import { fahrenheitBuild } from './ffx/builds/fahrenheit.ts';
import { evraeGroup } from './ffx/enemies/evrae.ts';
import { evraeAirshipScripts } from '../story/scripts/evrae-airship.ts';

/** Chapter 8. */
export const EVRAE_AIRSHIP: Chapter = {
  id: 'evrae-airship',
  game: 'ffx',
  number: 8,
  title: 'Evrae',
  // research §12.5: "a fight with a doorman"; the approach to Bevelle (§9.1).
  subtitle: 'The wyrm posted at the door of Bevelle',
  // The COMING card's own wording [research header, §12.1].
  location: 'Deck of the Fahrenheit — the approach to Bevelle',
  // research §12.4 beats 1, 2 and 5; §4 (the range game). Summarised, no line quoted.
  blurb:
    'Home is gone and Yuna is being married in Bevelle within the hour, so Cid points a thousand-year-old ship at the city. ' +
    'Something was already waiting over the cloud line, and the only thing between it and the deck is how far away Cid can keep it.',
  // docs/handoff/chapter-evrae-scene.md §6: the key follows the installed backdrop's name.
  sceneKey: 'evrae-airship-deck',
  thumbnailKey: 'chapter-evrae-airship',
  buildRef: fahrenheitBuild,
  enemyGroupRef: evraeGroup,
  scriptsRef: evraeAirshipScripts,
  music: {
    // The chapter's own cues — see the file doc above.
    scene: 'scene-fahrenheit',
    battle: 'boss-evrae',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy record's own `sensorText`, as the `Chapter`
  // contract asks (`src/data/ffx/enemies/evrae.ts`). Cid is Sensor-immune
  // (§2.1 [decompiled]) and untargetable, so he has no line.
  sensorTexts: {
    evrae: 'It draws breath before it breathes. That is the turn you get.',
  },
};
