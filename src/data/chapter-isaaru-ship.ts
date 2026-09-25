/**
 * Chapter XIV — Isaaru: **the ship layer** laid over the registered record.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * `./chapter-isaaru.ts` owns the fight (the three formations, the solo build,
 * the duel's rules) and is edited only by the engine track. This module adds
 * what a player sees and hears, built to Bailey's picks on
 * `docs/plans/chapter-isaaru-review.md` (D-147, "I'll go with all your
 * recommendations"), without editing that record (the Chapter XIII pattern):
 *
 * - `sceneKey: 'via-purifico'` — the last chamber of the maze
 *   (`src/scenes/via-purifico.ts`) on the installed O-3 A plate (B22: the art is
 *   used as installed, judge-locked);
 * - `scriptsRef` — the story (`src/story/scripts/ffx-isaaru.ts`, from
 *   `docs/plans/isaaru-story-draft.md`: B14 a, B15 a, B17);
 * - `music` — the record's own: B21's new "Still Water" cue is not sketched
 *   yet, so the stand-ins stay (`scene-gagazet` under the walk in,
 *   `boss-yojimbo` for the duel; FFX cues only).
 *
 * **Unlisted** (the brief: the driver lists it, as commit 5c8706d6 listed
 * Chapter XIII). `./chapters-unlisted.ts` registers this result, so the battle
 * flow and the debug API reach it by id and chapter select does not show it.
 */

import type { Chapter } from './encounters.ts';
import { ISAARU_VIA_PURIFICO } from './chapter-isaaru.ts';
import { isaaruScripts } from '../story/scripts/ffx-isaaru.ts';

/** The Via Purifico scene's key (`src/scenes/index.ts`), which is also the plate's id. */
export const ISAARU_SCENE_KEY = 'via-purifico';

/** `chapter` with the ship layer on: scene and story. */
export function withIsaaruShip(chapter: Chapter): Chapter {
  return { ...chapter, sceneKey: ISAARU_SCENE_KEY, scriptsRef: isaaruScripts };
}

/** Chapter XIV as registered: the engine track's record, with the ship layer on. */
export const ISAARU_VIA_PURIFICO_SHIPPED: Chapter = withIsaaruShip(ISAARU_VIA_PURIFICO);
