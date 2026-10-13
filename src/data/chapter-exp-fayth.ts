/**
 * **Experimental: Fayth** — Evrae on the Fahrenheit's deck, fought with FFX's own battle camera (branch `fayth-3d`; hidden chapter number 22; **FFX only**, AGENTS.md rule 14).
 *
 * Bailey, 2026-10-10 (~15:00 EDT, verbatim): "decompile all ffx art and assets as well as camera perspective and camera angles changes during battle then add an experimental new chapter with this 3d
 * presentation of an encounter we already have in game. add as a new experimental chapter please that is hidden. with a code word i need to type in at the chapter select menu please." His picks (~15:15 EDT):
 * one chapter in "both versions" (on his own PC the real FFX models from a local folder; on the website the same chapter and the same camera with our painted art), the encounter Evrae, the word `fayth`.
 * Standing decision D-632 (2026-10-08): replicate the real FFX battle camera, with test modes A and B shown beside the real game before anything ships. This chapter is the test chapter
 * (`docs/plans/fayth-3d.md`).
 *
 * **It is Chapter VIII's encounter** (`EVRAE_AIRSHIP` in `./chapter-evrae-airship.ts`: the Fahrenheit's deck; Evrae and Cid; the six guardians without Yuna), so every rule that holds for Chapter VIII
 * holds here: the same party build, the same formation and its AI, the same scripts, the same music cues and Sensor line, by reference. Nothing is copied and nothing in Chapter VIII is touched. The
 * Evrae suites and the FFX golden digests are the net; `tests/unit/exp-fayth.test.ts` proves it by playing both records to the same event log on several seeds.
 *
 * What differs is the scene and the label:
 *
 * - `sceneKey` is `exp-fayth-deck` (`../scenes/exp-fayth-deck.ts`): Chapter VIII's deck over Chapter VIII's plate, publishing a camera director (`SceneStaging.shotDirector`). The director is a stub that
 *   declines every beat, so the chapter plays Chapter VIII's camera, except on a dev server with Bailey's local camera folder, where FFX's own battle camera replaces it (`src/engine/ffxcam/`);
 * - the title is the working title below.
 *
 * **It is an experiment, not a listed chapter.** `experimental: true` sends its attempts, clears and play time to the experiments' own store (`../app/experiments/experimentRecords.ts`), never to the
 * save, so it is out of the board's "N of 18", the veteran check and total play time. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it (registered in
 * `./chapters-experiments.ts`) and `getChapter` finds it. **It is hidden**: chapter select has no card for it, and typing `fayth` on the board opens it
 * (`../app/screens/frontend/faythDoor.ts`, the table in `../app/screens/frontend/chapterDoors.ts`).
 *
 * A direct import of `EVRAE_AIRSHIP` is no cycle: that record imports only the `Chapter` type from `./encounters.ts`.
 */

import type { Chapter } from './encounters.ts';
import { EVRAE_AIRSHIP } from './chapter-evrae-airship.ts';
import { EXP_FAYTH_ID, EXP_FAYTH_SCENE } from './ffx/exp-fayth-ids.ts';

export { EXP_FAYTH_ID, EXP_FAYTH_SCENE };

/**
 * The card's words (the chapter record and the pause metadata, `./chapter-meta-exp-fayth.ts`, both read them): only the title is the chapter's own, and **it is a WORKING TITLE awaiting Bailey's
 * pick** (no source and no decision gives one; AGENTS.md rule 9). The subtitle, location, blurb and Sensor line are Chapter VIII's.
 */
export const EXP_FAYTH_TEXT = {
  title: 'Evrae, FFX Camera (Experimental)',
} as const;

/** The hidden Fayth chapter: Chapter VIII's record under its own id, number, scene and title. */
export const EXP_FAYTH: Chapter = {
  ...EVRAE_AIRSHIP,
  id: EXP_FAYTH_ID,
  number: 22, // after Leblanc's 19, the Experiment's 20 and Sinspawn Gui's 21; the card says EXP, not XXII (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...EXP_FAYTH_TEXT,
  sceneKey: EXP_FAYTH_SCENE,
};
