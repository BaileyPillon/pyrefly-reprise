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
 * Leblanc's 6 and Macalania's 7 used). Title `Evrae`, the COMING card's own:
 * whether the airship names the chapter instead (preflight Q11) is recorded as
 * undecided on the chapter's target tile, so the card is not renamed here.
 *
 * `music`: no cue for this chapter is routed. `docs/audio/THEMES.md` names no
 * Evrae or airship cue; the preflight reserves two NEW compositions
 * (`scene-fahrenheit`, `boss-evrae`, §6 / research §12.6, C-16 "no source
 * states which track plays for the Evrae battle") and Bailey judges audio by
 * ear (hard rule 13). Until one is picked this falls back to the cues Chapter
 * 1 uses — `scene-gagazet` and `boss-seymour` — and the shared FFX fanfare
 * `victory-ffx`. A recorded stopgap, not a claim that either is this fight's
 * theme.
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
    // Fallback to Chapter 1's cues — see the file doc above.
    scene: 'scene-gagazet',
    battle: 'boss-seymour',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy record's own `sensorText`, as the `Chapter`
  // contract asks (`src/data/ffx/enemies/evrae.ts`). Cid is Sensor-immune
  // (§2.1 [decompiled]) and untargetable, so he has no line.
  sensorTexts: {
    evrae: 'It draws breath before it breathes. That is the turn you get.',
  },
};
