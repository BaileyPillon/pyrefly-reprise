/**
 * **Experimental: Valefor at Besaid, in Wind Waker HD style** (branch `exp-windwaker`; hidden chapter, placeholder number 30; **FFX-2 only**, AGENTS.md rule 14).
 *
 * Bailey, 2026-10-20 (chat, verbatim): "a new experimental hidden chapter (separate from the ones we're working ) and make it like wind waker hd esque graphics for for our ffx/ffx-2 game". His picks: the
 * encounter "C: YRP vs Valefor" (FFX-2 only: Yuna, Rikku and Paine against Valefor at Besaid), the proportions "Wind Waker short", the secret word `waker`; after seeing the look lab in motion: "Build the chapter"
 * and the shading "HD". The approved picture is `TARGET-C` (Besaid, "toon 3-head"); the approved look is the look lab's `hd` variant (`../engine/ww3d/toon.ts`).
 *
 * **It is hidden chapter 24's encounter** (`FFX2_VALEFOR_BESAID` in `./chapter-ffx2-valefor-besaid.ts`: the possessed aeon, `research/ffx2-fallen-aeons.md` section 7.1, `[verified: 2 sources]`), so every rule that
 * holds for chapter 24 holds here: the same party build, the same formation and its AI, the same scripts, the same music cues and Sensor line, by reference. Nothing is copied and nothing in chapter 24 is touched.
 * **Never invent numbers (AGENTS.md rule 6):** this chapter adds no battle data of its own; the game numbers are chapter 24's.
 *
 * What differs is the picture and the label:
 *
 * - `sceneKey` is `exp-windwaker-stage` (`../scenes/exp-windwaker-stage.ts`): a procedural toon temple chamber under the target shot's low camera, with toon-shaded GLB models on the stage's actors
 *   (`public/models-exp/windwaker/<id>.glb`, `../engine/ww3d/`); a slot whose file is missing stands on a neutral capsule;
 * - the title is the working title below (no source and no decision gives one; AGENTS.md rule 9).
 *
 * **It is an experiment, not a listed chapter.** `experimental: true` sends its attempts, clears and play time to the experiments' own store, never to the save, so it is out of the board's "N of 19", the veteran
 * check and total play time. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it (`./chapters-experiments.ts`) and `getChapter` finds it. **It is hidden**: chapter select has no card for it, and
 * typing `waker` on the board opens it (`../app/screens/frontend/windwakerDoor.ts`, the table in `../app/screens/frontend/chapterDoors.ts`).
 *
 * **The number and the word are placeholders.** The release driver assigns the real ones at merge (the 3D Bahamut branch uses 29 and `yrp`).
 *
 * A direct import of `FFX2_VALEFOR_BESAID` is no cycle: that record imports only the `Chapter` type from `./encounters.ts`.
 */

import type { Chapter } from './encounters.ts';
import { FFX2_VALEFOR_BESAID } from './chapter-ffx2-valefor-besaid.ts';
import { EXP_WINDWAKER_ID, EXP_WINDWAKER_SCENE } from './windwaker-ids.ts';

export { EXP_WINDWAKER_ID, EXP_WINDWAKER_SCENE };

/**
 * The card's words (the chapter record and the pause metadata, `./chapter-meta-exp-windwaker.ts`, both read them): only the title is the chapter's own, and **it is a WORKING TITLE awaiting Bailey's pick**.
 * The subtitle, location, blurb and Sensor line are chapter 24's.
 */
export const EXP_WINDWAKER_TEXT = {
  title: 'Valefor at Besaid (Wind Waker)',
} as const;

/** The hidden Wind Waker chapter: chapter 24's record under its own id, number, scene and title. */
export const EXP_WINDWAKER: Chapter = {
  ...FFX2_VALEFOR_BESAID,
  id: EXP_WINDWAKER_ID,
  number: 30, // PLACEHOLDER: the release driver assigns the real number at merge (29 is the 3D Bahamut branch's); the card says EXP, not XXX (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...EXP_WINDWAKER_TEXT,
  sceneKey: EXP_WINDWAKER_SCENE,
};
