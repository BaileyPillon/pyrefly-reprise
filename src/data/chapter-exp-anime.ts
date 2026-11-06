/**
 * **Experimental: Valefor at Besaid, in an anime style** (branch `ch-anime`; hidden chapter, number 33, word `gear`, assigned 2026-11-06; **FFX-2 only**, AGENTS.md rule 14).
 *
 * Bailey, 2026-10-22 (chat, verbatim): "make a genshin / guilty gear version of the chapter"; his pick of the models, 2026-11-01 14:30 EST: "Meshy toon (Recommended)" (the only set that reads as anime); his
 * blanket words of 2026-10-31 and 2026-11-06 ("you make the executive decisions for the next few days. i'll go with all of your recommendations"; "implement all unimplemented chapters please") make the rest the
 * driver's: the look default, the word, the number and the title are **driver picks, his to overturn** (`docs/handoff/ch-anime.md`).
 *
 * **It is hidden chapter 24's encounter** (`FFX2_VALEFOR_BESAID` in `./chapter-ffx2-valefor-besaid.ts`: the possessed aeon, `research/ffx2-fallen-aeons.md` section 7.1, `[verified: 2 sources]`), so every rule that
 * holds for chapter 24 holds here: the same party build, the same formation and its AI, the same scripts, the same music cues and Sensor line, by reference. Nothing is copied and nothing in chapter 24 is touched.
 * **Never invent numbers (AGENTS.md rule 6):** this chapter adds no battle data of its own; the game numbers are chapter 24's. It is the Wind Waker chapter's sibling (`./chapter-exp-windwaker.ts`): the same encounter,
 * the same temple stage, a different cast (the Meshy toon girls, about five heads tall) under a different material (the anime cel shader, `../engine/ww3d/cel.ts`).
 *
 * What differs is the picture and the label:
 *
 * - `sceneKey` is `exp-anime-stage` (`../scenes/exp-anime-stage.ts`): the temple chamber under the anime lab's low camera, the girls under the cel material with outlines, Valefor at 5 m; a slot whose file is missing stands
 *   on a neutral capsule;
 * - the title is the working title below. **It names no brand** (the site is public): "anime style" says what the picture is.
 *
 * **It is an experiment, not a listed chapter.** `experimental: true` sends its attempts, clears and play time to the experiments' own store, never to the save, so it is out of the board's "N of 19", the veteran
 * check and total play time. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it (`./chapters-experiments.ts`) and `getChapter` finds it. **It is hidden**: chapter select has no card for it, and
 * typing `gear` on the board opens it (`../app/screens/frontend/animeDoor.ts`, the table in `../app/screens/frontend/chapterDoors.ts`). It is desktop-only like the other two hidden 3D chapters.
 *
 * A direct import of `FFX2_VALEFOR_BESAID` is no cycle: that record imports only the `Chapter` type from `./encounters.ts`.
 */

import type { Chapter } from './encounters.ts';
import { FFX2_VALEFOR_BESAID } from './chapter-ffx2-valefor-besaid.ts';
import { EXP_ANIME_ID, EXP_ANIME_SCENE } from './anime-ids.ts';

export { EXP_ANIME_ID, EXP_ANIME_SCENE };

/**
 * The card's words (the chapter record and the pause metadata, `./chapter-meta-exp-anime.ts`, both read them): only the title is the chapter's own, and **it is a WORKING TITLE awaiting Bailey's pick**.
 * The subtitle, location, blurb and Sensor line are chapter 24's.
 */
export const EXP_ANIME_TEXT = {
  title: 'Valefor at Besaid (Anime Style)',
} as const;

/** The hidden anime chapter: chapter 24's record under its own id, number, scene and title. */
export const EXP_ANIME: Chapter = {
  ...FFX2_VALEFOR_BESAID,
  id: EXP_ANIME_ID,
  number: 33, // assigned 2026-11-06 (29 the Spectral Keeper, 30 the Fallen Maesters, 31 the 3D Bahamut, 32 the Wind Waker chapter); the card says EXP, not XXXIII (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...EXP_ANIME_TEXT,
  sceneKey: EXP_ANIME_SCENE,
};
