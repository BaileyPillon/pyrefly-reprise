/**
 * Chapter 7 — Seymour and Anima, Macalania Temple (FFX).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. An FFX encounter with an FFX
 * party (`research/ffx-seymour-anima-macalania.md`); nothing here applies to
 * an FFX-2 chapter.
 *
 * Kept out of `./encounters.ts` only for the house 400-line rule: that file
 * is the contract (it owns `ChapterId`, `Chapter` and `CHAPTERS`) and lists
 * this record in `CHAPTERS` like every other chapter. The `Chapter` import is
 * type-only, so there is no runtime cycle.
 *
 * **Registered, playable through `window.__pyrefly.gotoChapter`, and LOCKED
 * on chapter select** as a COMING card. The art is approved (D-141) except the
 * pause plate, whose redo is Bailey's pick, and the scene cue is his pick by
 * ear; `./chapter-macalania-ship.ts` lists both and where each lands. The lock
 * is one line in `src/app/screens/frontend/comingChapters.ts`'s
 * `LOCKED_CHAPTER_IDS`; see `docs/handoff/chapter-macalania.md`.
 *
 * Number 7: display order, after the six chapters already registered — the
 * same rule `docs/target/decisions.json` D-018 used for Leblanc's 6.
 * Narratively this fight comes before Chapter 1 (Seymour Flux is the same
 * man, unsent, later in the story) [research §9.7 beat 11].
 *
 * `music`: the battle has its own cue, `boss-seymour-macalania` ("The
 * Courtesy", cue map row 24), built 2026-09-24 from the mood sketch Bailey
 * picked (A) to the preflight's brief (`docs/plans/chapter-macalania-review.md`
 * §6.3, research §9.8: this fight's own theme, NOT the Flux chapter's
 * `boss-seymour`). A CANDIDATE until Bailey's ear rules on the full cue (hard
 * rule 13). The scene cue the preflight also names, `scene-macalania-temple`,
 * does not exist yet, so the scene plays `MACALANIA_SCENE_CUE`
 * (`./chapter-macalania-ship.ts`), today Chapter 1's `scene-gagazet` — a
 * recorded stopgap, not a claim — and the victory is the shared FFX fanfare
 * `victory-ffx`.
 */

import type { Chapter } from './encounters.ts';
import { MACALANIA_SCENE_CUE } from './chapter-macalania-ship.ts';
import { macalaniaBuild } from './ffx/builds/macalania.ts';
import { seymourAnimaMacalaniaGroup } from './ffx/enemies/seymour-anima-macalania.ts';
import { seymourAnimaMacalaniaScripts } from '../story/scripts/seymour-anima-macalania.ts';

/** Chapter 7. */
export const SEYMOUR_ANIMA_MACALANIA: Chapter = {
  id: 'seymour-anima-macalania',
  game: 'ffx',
  number: 7,
  title: 'Seymour and Anima',
  subtitle: 'A Maester, a sphere, and the thing he keeps under the floor',
  // The coming card's own wording [research §9.1 "the antechamber outside the
  // Chamber of the Fayth"].
  location: 'Macalania Temple — the antechamber',
  // research §9.6 beats 2, 5 and 6; §5.2 (the summon). Summarised, no line quoted.
  blurb:
    "Jyscal's sphere names his murderer, and the guardians reach the temple before Yuna leaves the Chamber. " +
    'Seymour does not deny it. He explains it, and when he is losing he calls something up through the ice.',
  // docs/handoff/chapter-macalania-scene.md §6 — the preflight's name (§6.2).
  sceneKey: 'macalania-temple',
  thumbnailKey: 'chapter-seymour-anima-macalania',
  buildRef: macalaniaBuild,
  enemyGroupRef: seymourAnimaMacalaniaGroup,
  scriptsRef: seymourAnimaMacalaniaScripts,
  music: {
    // Scene: Chapter 1's cue as a recorded stopgap until Bailey's pick lands
    // (`./chapter-macalania-ship.ts`) — see the file doc above.
    scene: MACALANIA_SCENE_CUE,
    // The chapter's own battle cue (FFX only), Bailey's pick of sketch A.
    battle: 'boss-seymour-macalania',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy records' own `sensorText`, as the `Chapter`
  // contract asks (`src/data/ffx/enemies/seymour-anima-macalania.ts`).
  sensorTexts: {
    'seymour-macalania':
      'Ice, lightning, water, fire. In that order, every time. He is telling you on purpose.',
    'guado-guardian-a': 'Carries potions. Steps in front of anything swung at his master.',
    'guado-guardian-b': 'Carries potions. Steps in front of anything swung at his master.',
    'anima-macalania': 'Bound. Her own son called her up out of the floor.',
  },
};
