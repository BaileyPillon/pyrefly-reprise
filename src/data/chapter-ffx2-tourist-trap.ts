/**
 * **Tourist Trap** — Yojimbo and Daigoro in the Cavern of the Stolen Fayth, the optional FFX-2 mission (opens at the start of Chapter 3, done in Chapter 3 or 5): a hidden chapter
 * (branch `ch-tourist-trap`).
 *
 * Bailey, 2026-10-13/14 (chat, via the driver), verbatim: "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." and
 * "full speed ahead while I sleep". The driver's decisions: the chapter ships **hidden behind the typed word `daigoro`** (`app/screens/frontend/daigoroDoor.ts`), hidden chapter number 23,
 * listing it on the board waits for Bailey's word, and the art is provisional and reuses approved paintings where they fit (nothing is replaced).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, FFX-2 items and monster rows, and an action-counter AI whose Zanmato is NOT FFX's (it drops the party to 1 HP and 1 MP;
 * `research/ffx-yojimbo.md` section 0.3). The FFX Chapter IX (`yojimbo-cavern`) is a different fight with different rows; none of its data is reused, only its two paintings and its plate.
 *
 * - `buildRef` — the Chapter 3 preset (`djoseBuild`, Lv 32 / 33 / 34, `[estimate]`): the mission opens at the start of Chapter 3, the preset is the end of it, and it sits under the boss's
 *   Lv 36. The research names no party level for the mission; Chapter 5's preset is measured beside it (`tests/unit/chapters/tourist-trap-bench.test.ts`).
 * - `enemyGroupRef` — one formation, Yojimbo with Daigoro as an untargetable body (`./ffx2/enemies/tourist-trap.ts`). One fight: no chain, no checkpoint.
 * - `scriptsRef` — the story (`../story/scripts/ffx2-tourist-trap.ts`): our own words over the sourced beats.
 * - `music` — existing cues only: the field bed, the FFX-2 aeon cue ("Aeons", the slot the wiki names), the FFX-2 fanfare. Bailey's call by ear (rule 13).
 * - `sceneKey` — the Cavern of the Stolen Fayth under the FFX-2 camera (`../scenes/tourist-trap-cavern.ts`), on Chapter IX's approved plate.
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the eighteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it and `getChapter` finds it. Its attempts
 * and clears go to the experiments' own store (`experimental: true`), never `pyrefly-reprise:save:v1`.
 */

import type { Chapter } from './encounters.ts';
import { djoseBuild } from './ffx2/builds/djose.ts';
import { cavernYojimboGroup, X2_YOJIMBO_ID } from './ffx2/enemies/tourist-trap.ts';
import { TOURIST_TRAP_ID, TOURIST_TRAP_SCENE } from './tourist-trap-ids.ts';
import { ffx2TouristTrapScripts } from '../story/scripts/ffx2-tourist-trap.ts';

export { TOURIST_TRAP_ID } from './tourist-trap-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-tourist-trap.ts`, both read them). Our own words over the sourced beats. */
export const TOURIST_TRAP_TEXT = {
  title: 'Tourist Trap',
  subtitle: 'A swordsman, his dog, and a count that fills',
  location: 'Cavern of the Stolen Fayth — the former Chamber of the Fayth',
  blurb:
    'Fiends are pouring out of the old cavern, and the sightseers who wandered in cannot find the way out. ' +
    'At the bottom a swordsman waits beside his small stone dog, wearing a despair that is not his own. He keeps count of his moves, and so should you.',
} as const;

/** Tourist Trap's chapter record. */
export const FFX2_TOURIST_TRAP: Chapter = {
  id: TOURIST_TRAP_ID,
  game: 'ffx2',
  number: 23, // after the eighteen on the board and after the other hidden experiments (19 to 22); the card would say EXP, not XXIII (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...TOURIST_TRAP_TEXT,
  sceneKey: TOURIST_TRAP_SCENE,
  thumbnailKey: 'chapter-ffx2-tourist-trap',
  buildRef: djoseBuild,
  enemyGroupRef: cavernYojimboGroup,
  scriptsRef: ffx2TouristTrapScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (the cave's own theme, "Labyrinth", has no cue of ours)
    battle: 'boss-ffx2-fallen-aeons', // "Aeons" [single source: wiki Cavern page], the cue the Road and Ixion play too
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [X2_YOJIMBO_ID]: 'He keeps a count of his own moves. When it fills, he cuts the whole party down to a breath, so heal first.',
  },
};
