/**
 * Chapter XII — Seymour Omnis: **the ship layer** laid over the registered record.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Seymour's last form, inside Sin, with the FFX
 * cast and the FFX score (`research/ffx-seymour-omnis.md` §0.3: *X-2* has no Seymour fight).
 *
 * `./chapter-seymour-omnis.ts` owns the fight (the formation, the Garden of Pain party) and is
 * the engine track's. This module adds what a player sees and hears, built to Bailey's picks on
 * `docs/plans/chapter-omnis-review.md` (2026-09-25, "I'll go with all your recommendations"; then
 * "all recommendations please" for Omnis first), without editing that record:
 *
 * - `sceneKey: 'garden-of-pain'` — the Garden of Pain scene (`src/scenes/garden-of-pain.ts`) on
 *   the installed O-3 C plate, with Seymour (O-1 A) and the four painted discs (O-2 B), all
 *   LOCKED art used as installed (B21 a new plate, not Chapter III's Dream's End);
 * - `scriptsRef` — the story (`src/story/scripts/seymour-omnis.ts`: B15 callouts, B16 a, B3 a,
 *   B17 c), every line from `docs/plans/omnis-story-draft.md`;
 * - `music` — **B18 = a is not written yet** (a new cue that spends `SEYMOUR_UNMOORED`, to be
 *   sketched and picked by ear, rules 9 and 13), so the battle keeps B18's named stand-in,
 *   Chapter I's `boss-seymour`; the scene cue is `scene-dreams-end`, the score's one cue for the
 *   inside of Sin (Chapter III's dungeon, the same one), also a stand-in. FFX cues only.
 *
 * **Unlisted.** B8 holds the listing until Bailey confirms the ring order (O-7) and the reset
 * cycle (O-11): the result sits in `UNLISTED_CHAPTERS` (`./chapters-unlisted.ts`), reached by id
 * (`getChapter`, `window.__pyrefly.gotoChapter`), not shown on chapter select.
 */

import type { Chapter } from './encounters.ts';
import { SEYMOUR_OMNIS } from './chapter-seymour-omnis.ts';
import { seymourOmnisScripts } from '../story/scripts/seymour-omnis.ts';

/** The Garden of Pain scene's key (`src/scenes/index.ts`), which is also the plate's id. */
export const OMNIS_SCENE_KEY = 'garden-of-pain';

/** The stand-in cues until B18's own cue is sketched and picked (see the module note). */
export const OMNIS_STAND_IN_CUES = { scene: 'scene-dreams-end', battle: 'boss-seymour' } as const;

/** `chapter` with the ship layer on: scene, story and music. */
export function withOmnisShip(chapter: Chapter): Chapter {
  return {
    ...chapter,
    sceneKey: OMNIS_SCENE_KEY,
    scriptsRef: seymourOmnisScripts,
    music: { ...chapter.music, scene: OMNIS_STAND_IN_CUES.scene, battle: OMNIS_STAND_IN_CUES.battle },
  };
}

/** Chapter XII as registered: the engine track's record, with the ship layer on. */
export const SEYMOUR_OMNIS_SHIPPED: Chapter = withOmnisShip(SEYMOUR_OMNIS);
