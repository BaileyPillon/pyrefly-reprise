/**
 * **Experimental: Leblanc (new art)** — the Leblanc preview, an additional chapter beside Chapter VI (branch `exp-leblanc`).
 *
 * Bailey, 2026-10-06 (chat): "the experimental new chapter will be the leblanc preview"; "so the leblanc preview will be an
 * additional experimental chapter. keep the current leblanc chapter."; "the artwork for that experimental chapter will be chatgpt
 * images 2.5, flare for mockups and sunburst for anything mission critical, stuff that ships"; "You make the selections for me as
 * far as the experimental chapter goes."; "the priority is the experimental chapter right now. devote all resources to the
 * playable experimental chapter."
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. It is Chapter VI's encounter (`FFX2_LEBLANC` in `./encounters.ts`: Chateau
 * Leblanc, Guadosalam; Act I the entrance, Act II Logos' room, Act III the Last Room with Leblanc, Logos and Ormi), so every
 * rule that holds for Chapter VI holds here: the same party build, the same three formations and their AI, the same scripts, the
 * same music cues and Sensor lines, by reference — nothing is copied and nothing in Chapter VI is touched.
 *
 * What differs is two things only, and both are about paintings:
 *
 * - `sceneKey` is `exp-leblanc-last-room`: the scene draws `backdrops/exp-leblanc-last-room.png` (every screen that shows the
 *   chapter's backdrop reads it by scene key) and says its art namespace is `exp-leblanc`
 *   (`../scenes/exp-leblanc-last-room.ts`);
 * - the stage therefore reads every figure from `characters/exp-leblanc-<subject>/` (`./art/artNamespace.ts`).
 *
 * **It is an experiment, not a listed chapter.** `experimental: true` sends its attempts, clears and play time to the
 * experiments' own store (`../app/experiments/experimentRecords.ts`), never to the save (`pyrefly-reprise:save:v1`), so it is out of
 * the board's "N of 18", the veteran check and total play time. It is not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic
 * suite and count stays the eighteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it and `getChapter` finds it. **It is hidden**
 * (Bailey, 2026-10-06: "put the experimental new chapter in the live build but make it hidden like you did with ff7 how i had to type
 * limit at the main menu"; the word "leblanc"): chapter select has no card for it and shows only the eighteen; typing the word on the board
 * opens it, as "limit" opens FF7's (`../app/screens/frontend/leblancDoor.ts`).
 *
 * The record is derived from Chapter VI's by a function, because `./encounters.ts` owns `FFX2_LEBLANC` and this file may import only
 * the `Chapter` type from it (a value import would be a cycle).
 */

import type { Chapter } from './encounters.ts';
import { EXP_LEBLANC_SCENE } from './art/artNamespace.ts';

/** The experimental chapter's id: its key in the experiments' store and on the board. */
export const EXP_LEBLANC_ID = 'exp-leblanc' as const;

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-exp-leblanc.ts`, both read them). The title is Bailey's brief's. */
export const EXP_LEBLANC_TEXT = {
  title: 'Experimental: Leblanc (new art)',
  subtitle: 'Chapter VI, in new paintings',
  blurb:
    "Chapter VI's ambush at Chateau Leblanc, fought exactly as it is, over new paintings made with ChatGPT " +
    'Images. A figure not repainted yet is still the old painting, and nothing here is saved to your progress.',
} as const;

/**
 * The experimental Leblanc chapter, derived from Chapter VI's record (`base`, `FFX2_LEBLANC`).
 *
 * Everything the spread carries over is Chapter VI's by reference: `buildRef`, `enemyGroupRef` (and so the `nextGroupId` chain
 * through Acts II and III), `scriptsRef`, `music`, `sensorTexts`, `location` and `thumbnailKey`.
 */
export function experimentalLeblanc(base: Chapter): Chapter {
  return {
    ...base,
    id: EXP_LEBLANC_ID,
    number: 19, // after the eighteen on the board; the card says EXP, not XIX (`ui/common/roman.ts` `chapterNumeral`)
    experimental: true,
    ...EXP_LEBLANC_TEXT,
    sceneKey: EXP_LEBLANC_SCENE,
  };
}
