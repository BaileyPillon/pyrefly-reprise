/**
 * Chapter XI — Fallen Aeons: **the ship layer** laid over the registered record.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * `./chapter-ffx2-fallen-aeons.ts` owns the fight (the three formations, the party, the Save
 * Sphere links) and is edited only by the engine track. This module adds what a player sees and
 * hears, built to Bailey's picks on `docs/plans/chapter-fallen-aeons-review.md` (2026-09-24, "I'll
 * go with your recommendations for all"), without editing that record:
 *
 * - `sceneKey: 'road-to-the-farplane'` — the Road scene (`src/scenes/road-to-the-farplane.ts`) on
 *   the installed O-3 A plate, with plate B between links (D-111, D-119);
 * - `scriptsRef` — the story (`src/story/scripts/ffx2-fallen-aeons.ts`, FA16 a, O-4 C, from
 *   `docs/plans/fallen-aeons-story-draft.md`);
 * - `music` — FA15 a as the record already has it (`boss-ffx2-aeon` on every link, the field bed
 *   `scene-farplane`, the FFX-2 fanfare), unchanged.
 *
 * **Listed** 2026-09-26 (Bailey, 2026-09-25: "All your recommendations", option A = 3 s of action
 * time on the three Road links), as commits ad3c3c36 and 28135f60 listed Chapters X and XIV:
 * `./encounters.ts` puts this result in `CHAPTERS` after Chapter X (it was in
 * `./chapters-unlisted.ts` until then: reachable by id, no card).
 */

import type { Chapter } from './encounters.ts';
import { FFX2_FALLEN_AEONS } from './chapter-ffx2-fallen-aeons.ts';
import { ffx2FallenAeonsScripts } from '../story/scripts/ffx2-fallen-aeons.ts';

/** The Road scene's key (`src/scenes/index.ts`), which is also plate A's id. */
export const FALLEN_AEONS_SCENE_KEY = 'road-to-the-farplane';

/** `chapter` with the ship layer on: the Road scene and the story. */
export function withFallenAeonsShip(chapter: Chapter): Chapter {
  return { ...chapter, sceneKey: FALLEN_AEONS_SCENE_KEY, scriptsRef: ffx2FallenAeonsScripts };
}

/** Chapter XI as registered: the engine track's record, with the ship layer on. */
export const FFX2_FALLEN_AEONS_SHIPPED: Chapter = withFallenAeonsShip(FFX2_FALLEN_AEONS);
