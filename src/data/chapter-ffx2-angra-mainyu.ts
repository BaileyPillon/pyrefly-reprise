/**
 * **Angra Mainyu**, the fiend the Bikanel dig woke (FFX-2 Chapter 5, the Al Bhed excavation camp, after the mission "Find the Ten Gatekeepers") — a NEW, HIDDEN FFX-2 chapter (2026-10-15).
 *
 * Bailey, 2026-10-15, verbatim: "Implement the unimplemented chapters please." and "I would like to add, don't just implement the unimplemented chapters. Implement the unimplemented
 * chapters end-to-end please. It needs to be a finished product." The unimplemented chapters are D-536's (2026-10-07, on D-520; D-838): Biran and Yenke (FFX) and this one (FFX-2). The reading,
 * following the precedent of his last two "add them in" (D-842, D-843, D-848): the chapter ships **hidden behind a typed word** (`angra`), listing it on the board waits for his word after he has
 * played it (D-848), the art is **provisional** (approved paintings reused, nothing replaced), the music is an existing cue by reference.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 status set; Angra Mainyu exists only in FFX-2. Research: `research/ffx2-angra-mainyu.md` (**the weakest-sourced chapter
 * of the project**: no game row of the three monsters was read, §0.2; the handoff lists what the reverse-engineering session should read before it is listed).
 *
 * **The shape.** One formation (`./ffx2/enemies/angra-mainyu.ts`): Angra Mainyu, 333,444 HP, with his two arms as parts (Tawrich, immune to magic; Zarich, immune to physical blows); Perdition's Flame
 * while both arms stand, the arms raised by Full-Life while he has the MP. The chapter's attempts, clears and time go to the experiments' own store (`experimental: true`), never the save.
 *
 * - `buildRef` — the Chapter 5 preset (`./ffx2/builds/farplane.ts`): the band he is met in, and the party every strategy source describes (two Dark Knights and a healer, research §5).
 * - `sceneKey` — the Machine Faction's grounds, the hidden Experiment's plate, the **provisional stand-in** for the excavation camp (research §6).
 * - `scriptsRef` — the story (`../story/scripts/ffx2-angra-mainyu.ts`): our own words over the sourced beats.
 * - `music` — existing cues only: the FFX-2 field bed, `boss-ffx2-fallen-aeons` (our own take on the "Aeons" role the game gives this fight, research §8) and the FFX-2 fanfare. Bailey's call by ear.
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it (`./chapters-experiments.ts`) and `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { farplaneBuild } from './ffx2/builds/farplane.ts';
import { angraMainyuGroup, x2AngraMainyu, x2Tawrich, x2Zarich } from './ffx2/enemies/angra-mainyu.ts';
import { ffx2AngraMainyuScripts } from '../story/scripts/ffx2-angra-mainyu.ts';
import { ANGRA_MAINYU_ID, ANGRA_MAINYU_SCENE } from './angra-mainyu-ids.ts';

export { ANGRA_MAINYU_ID, ANGRA_MAINYU_SCENE }; // the ids live in `./angra-mainyu-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the record and the pause metadata, `./chapter-meta-ffx2-angra-mainyu.ts`, both read them). Our own words over the sourced beats (research §1). */
export const ANGRA_MAINYU_TEXT = {
  title: 'Angra Mainyu',
  subtitle: 'What the dig woke under the sand',
  location: 'Bikanel Desert — the excavation camp',
  blurb:
    'The Cactuar Gatekeepers turned the sandstorm away, and the thing it hid has turned on the Al Bhed dig. ' +
    'It has two arms that will not stay down, and a flame that answers only while both stand.',
} as const;

/**
 * Number 26: past Biran and Yenke's 25, so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the eyebrow EXPERIMENTAL
 * (`ui/common/roman.ts`).
 */
export const FFX2_ANGRA_MAINYU: Chapter = {
  id: ANGRA_MAINYU_ID,
  game: 'ffx2',
  number: 26,
  experimental: true,
  ...ANGRA_MAINYU_TEXT,
  sceneKey: ANGRA_MAINYU_SCENE,
  thumbnailKey: 'chapter-ffx2-angra-mainyu',
  buildRef: farplaneBuild,
  enemyGroupRef: angraMainyuGroup,
  scriptsRef: ffx2AngraMainyuScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (the game's Bikanel theme has no cue of ours)
    battle: 'boss-ffx2-fallen-aeons', // our own aeon cue in the role the game gives "Aeons" here (research §8, [single source])
    victory: 'victory-ffx2',
  },
  // Duplicated from the enemy records' own `sensorText`, as the `Chapter` contract asks.
  sensorTexts: {
    [x2AngraMainyu.id]: x2AngraMainyu.sensorText ?? '',
    [x2Tawrich.id]: x2Tawrich.sensorText ?? '',
    [x2Zarich.id]: x2Zarich.sensorText ?? '',
  },
};
