/**
 * **Experimental: Bahamut in 3D** (branch `exp-yrp-3d`; hidden chapter number 29; **FFX-2 only**, AGENTS.md rule 14).
 *
 * Bailey, 2026-10-19 (verbatim): "I like it can we do an experimental 3d chapter that's hidden?" His picks: the FFX-2 trio against a boss, the look "Painted toon", the boss Bahamut, the secret word `yrp`; on
 * the plan "Yes that's fine"; then "I'll go with all of your recommendations. I'm going to bed so you have all the freedom from here. Surprise me and amaze me when I wake up!"
 *
 * **It is Chapter IV's encounter** (`FFX2_BAHAMUT` in `./encounters.ts`: Bevelle Underground; Bahamut against Yuna, Rikku and Paine), so every rule that holds for Chapter IV holds here: the same party build, the same
 * formation and its AI, the same scripts, the same music cues and Sensor line, by reference. Nothing is copied and nothing in Chapter IV is touched. `tests/unit/chapters/exp-yrp-3d.test.ts` proves it by playing both
 * records to the same event log on several seeds. **Never invent numbers (AGENTS.md rule 6):** this chapter adds no battle data of its own.
 *
 * What differs is the picture and the label:
 *
 * - `sceneKey` is `exp-yrp-3d-stage` (`../scenes/exp-yrp-3d-stage.ts`): Chapter IV's chamber under frame A's camera ("classic, now in 3D": a high three-quarter view, the trio in a loose row on the right, Bahamut filling
 *   the left half), with toon-shaded GLB models on the stage's actors (`public/models-exp/yrp/<id>.glb`, `../engine/yrp3d/`); a slot whose file is missing stands on a neutral toon capsule;
 * - the title is the working title below (no source and no decision gives one; AGENTS.md rule 9).
 *
 * **It is an experiment, not a listed chapter.** `experimental: true` sends its attempts, clears and play time to the experiments' own store, never to the save, so it is out of the board's "N of 18", the veteran
 * check and total play time. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it (`./chapters-experiments.ts`) and `getChapter` finds it. **It is hidden**: chapter select has no card for it, and
 * typing `yrp` on the board opens it (`../app/screens/frontend/yrpDoor.ts`, the table in `../app/screens/frontend/chapterDoors.ts`).
 *
 * The record is derived from Chapter IV's by a function, because `./encounters.ts` owns `FFX2_BAHAMUT` and this file may import only the `Chapter` type from it (a value import would be a cycle).
 */

import type { Chapter } from './encounters.ts';
import { EXP_YRP_ID, EXP_YRP_SCENE } from './yrp-ids.ts';

export { EXP_YRP_ID, EXP_YRP_SCENE };

/**
 * The card's words (the chapter record and the pause metadata, `./chapter-meta-exp-yrp-3d.ts`, both read them): the title is a **WORKING TITLE awaiting Bailey's pick**. The subtitle, location, blurb
 * and Sensor line are Chapter IV's.
 */
export const EXP_YRP_TEXT = {
  title: 'Bahamut, in 3D (Experimental)',
} as const;

/** The hidden 3D Bahamut chapter, derived from Chapter IV's record (`base`, `FFX2_BAHAMUT`) under its own id, number, scene and title. */
export function experimentalYrp(base: Chapter): Chapter {
  return {
    ...base,
    id: EXP_YRP_ID,
    number: 29, // after the Last Summoning's 28; the card says EXP, not XXIX (`ui/common/roman.ts` `chapterNumeral`)
    experimental: true,
    ...EXP_YRP_TEXT,
    sceneKey: EXP_YRP_SCENE,
  };
}
