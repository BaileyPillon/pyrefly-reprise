/**
 * Chapter XV — the Den of Woe: **the ship layer** laid over the registered record.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * `./chapter-ffx2-den-of-woe.ts` owns the fight (the three shades, the party, the chain carry) and
 * is edited only by the engine track. This module adds what a player sees and hears, built to
 * Bailey's picks on `docs/plans/chapter-gippal-review.md` (2026-09-25, "I'll go with all your
 * recommendations", D-148), without editing that record:
 *
 * - `sceneKey: 'den-of-woe'` — the Den scene (`src/scenes/den-of-woe.ts`) on the installed O-3 A
 *   plate, used as installed;
 * - `scriptsRef` — the story (`src/story/scripts/ffx2-den-of-woe.ts`, GP13 a, GP14 a, GP15, from
 *   `docs/plans/gippal-story-draft.md`);
 * - `music` — GP16 as the record already has it (the stand-in `boss-shuyin` until a
 *   `boss-den-of-woe` is picked by ear, rule 13; the field bed `scene-bevelle-underground`; the
 *   FFX-2 fanfare), unchanged.
 *
 * **Listed** 2026-09-26 (Bailey, 2026-09-26: "I pick your recommendation for Den of Woe", "Den: both,
 * drop the prep"), as commit 430736bf listed Chapter XI: `./encounters.ts` puts this result in
 * `CHAPTERS` after Chapter XIV (it was in `./chapters-unlisted.ts` until then: reachable by id, no card).
 */

import type { Chapter } from './encounters.ts';
import { FFX2_DEN_OF_WOE } from './chapter-ffx2-den-of-woe.ts';
import { ffx2DenOfWoeScripts } from '../story/scripts/ffx2-den-of-woe.ts';

/** The Den scene's key (`src/scenes/index.ts`), which is also the plate's id. */
export const DEN_OF_WOE_SCENE_KEY = 'den-of-woe';

/** `chapter` with the ship layer on: the Den scene and the story. */
export function withDenOfWoeShip(chapter: Chapter): Chapter {
  return { ...chapter, sceneKey: DEN_OF_WOE_SCENE_KEY, scriptsRef: ffx2DenOfWoeScripts };
}

/** Chapter XV as registered: the engine track's record, with the ship layer on. */
export const FFX2_DEN_OF_WOE_SHIPPED: Chapter = withDenOfWoeShip(FFX2_DEN_OF_WOE);
