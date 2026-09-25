/**
 * Chapter XIII — Trema: **the ship layer** laid over the registered record.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * `./chapter-ffx2-trema.ts` owns the fight (the formations, the party, the kit switch) and is
 * edited only by the engine track, which builds Bailey's options there as OFF switches
 * (`docs/plans/trema-options-2026-09-25.md`). This module adds what a player sees and hears,
 * built to Bailey's picks on `docs/plans/chapter-trema-review.md`, and **reads the fight's shape
 * from that record** (`./trema-shape.ts`) instead of assuming it:
 *
 * - `sceneKey: 'via-infinito'` — the Cloister 100 scene (`src/scenes/cloister-100.ts`) on the
 *   installed O-3 B plate (TR18: LOCKED art, used as installed);
 * - `scriptsRef` — the story (`src/story/scripts/ffx2-trema.ts`, TR13, TR14 a, TR15 out), in
 *   the shape's variant: the link seam and the kill link with a Paragon link, Trema's reveal in
 *   the pre scene without one;
 * - `music` — TR16 a as the record has it; with Trema alone, his stand-in cue
 *   (`boss-ffx2-aeon`) scores the first and only link.
 *
 * Still **UNLISTED**: `./chapters-unlisted.ts` registers the result, and chapter select does not
 * show it. Listing it is a later switch (Bailey's).
 */

import type { Chapter } from './encounters.ts';
import type { EnemyGroupDef } from '../battle/common/types.ts';
import { FFX2_TREMA } from './chapter-ffx2-trema.ts';
import { ENEMY_GROUPS_BY_ID } from './ffx2/index.ts';
import { tremaShapeOf, type TremaShape } from './trema-shape.ts';
import { tremaScriptsFor } from '../story/scripts/ffx2-trema.ts';

/** The Cloister 100 scene's key (`src/scenes/index.ts`), which is also the plate's id. */
export const TREMA_SCENE_KEY = 'via-infinito';

/** Trema's cue in TR16 a: the stand-in until a `boss-trema` sketch is picked by ear (rule 13). */
export const TREMA_STAND_IN_CUE = 'boss-ffx2-aeon';

/** A formation by id, from the FFX-2 data. */
function findGroup(id: string): EnemyGroupDef | undefined {
  return (ENEMY_GROUPS_BY_ID as Readonly<Record<string, EnemyGroupDef | undefined>>)[id];
}

/** The shape `chapter`'s own formations give it. */
export function shapeOfChapter(chapter: Pick<Chapter, 'enemyGroupRef'>): TremaShape {
  return tremaShapeOf(chapter.enemyGroupRef, findGroup);
}

/** `chapter` with the ship layer on: scene, story and music, all read off its own shape. */
export function withTremaShip(chapter: Chapter): Chapter {
  const shape = shapeOfChapter(chapter);
  const music = shape.paragonLink
    ? chapter.music
    : { ...chapter.music, battle: chapter.music.phase2 ?? TREMA_STAND_IN_CUE };
  return {
    ...chapter,
    sceneKey: TREMA_SCENE_KEY,
    scriptsRef: tremaScriptsFor(shape),
    music,
  };
}

/** Chapter XIII as registered: the engine track's record, with the ship layer on. */
export const FFX2_TREMA_SHIPPED: Chapter = withTremaShip(FFX2_TREMA);
