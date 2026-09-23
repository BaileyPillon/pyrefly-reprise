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
 * on chapter select** as a COMING card until Bailey approves its art (every
 * Macalania painting is CANDIDATE; Anima's arrival is built to the driver's
 * recommendation, INFERRED in `docs/target/targets.json`). The lock is one
 * line in `src/app/screens/frontend/comingChapters.ts`'s
 * `LOCKED_CHAPTER_IDS`; see `docs/handoff/chapter-macalania.md`.
 *
 * Number 7: display order, after the six chapters already registered — the
 * same rule `docs/target/decisions.json` D-018 used for Leblanc's 6.
 * Narratively this fight comes before Chapter 1 (Seymour Flux is the same
 * man, unsent, later in the story) [research §9.7 beat 11].
 *
 * `music`: no cue for this chapter is routed yet. The preflight
 * (`docs/plans/chapter-macalania-review.md` §6.3) and research §9.8 call for
 * two NEW compositions (`scene-macalania-temple`, `boss-seymour-macalania`);
 * neither `docs/audio/THEMES.md` nor `docs/plans/music-modern-sound.md` has
 * one, and Bailey judges audio by ear (hard rule 13). Until one is picked
 * this falls back to the cues Chapter 1 uses — `scene-gagazet` and
 * `boss-seymour` — and the shared FFX fanfare `victory-ffx`. §9.8 is explicit
 * that `boss-seymour` is NOT this fight's own theme; the stopgap is recorded,
 * not claimed.
 */

import type { Chapter } from './encounters.ts';
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
    // Fallback to Chapter 1's cues — see the file doc above.
    scene: 'scene-gagazet',
    battle: 'boss-seymour',
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
