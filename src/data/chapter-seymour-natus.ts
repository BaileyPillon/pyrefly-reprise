/**
 * Chapter X — Seymour Natus, the Highbridge of Bevelle (FFX).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, aeons, Banish, Trigger
 * Commands and the FFX status set (`research/ffx-seymour-natus-highbridge.md`
 * §0.3: FFX-2 has no Natus, no Mortibody and no Highbridge boss).
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7
 * to 9; the `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## Registered, reachable, and UNLISTED
 *
 * Bailey answered every recommendation on 2026-09-24 ("I'll go with your
 * recommendations for all"), but the art, the arena, the portrait, the HUD
 * reads and the music those picks approve are not painted, built or composed
 * yet (B16 = ship LOCKED if the art is late). So this record sits in
 * `UNLISTED_CHAPTERS`, the Chapter IX precedent: `getChapter`, the battle flow
 * and `window.__pyrefly.gotoChapter` reach it by id, and **chapter select does
 * not show it**. Listing it is the integrator's one line, once its story,
 * meta, scene, guide, tactic and card exist.
 *
 * The ship layer (2026-09-25; Bailey took every recommendation on the new
 * chapters) replaced the placeholders with Bailey's picks. Every field a
 * player sees or hears says which it is:
 *
 * - `title: 'Seymour Natus'` and `location` — **B1** (picked, D-077).
 * - `sceneKey: 'bevelle-highbridge'` — the Highbridge scene
 *   (`src/scenes/highbridge.ts`) on the installed O-3 C plate (night, the
 *   city lit, D-095), with Natus's turning ring (O-1 A, D-093). Not
 *   `bevelle-underground`: that is the FFX-2 Bahamut arena (research §0.3).
 * - `music.battle: 'boss-seymour-macalania'` — **B15's named stand-in**
 *   (D-091, Chapter VII's cue) until a Natus cue is sketched and picked by ear
 *   (rules 8 and 13). `music.scene: 'scene-gagazet'` stays the stand-in under
 *   the narration (no FFX Bevelle cue of ours exists; THEMES.md never crosses
 *   the scores).
 * - `scriptsRef` — the story (`src/story/scripts/seymour-natus.ts`) from
 *   `docs/plans/natus-story-draft.md`, B11 = a; the B9 callouts are held
 *   until Bailey reads the draft (D-085).
 * - `subtitle` and `blurb` — our own summaries of research §8.2's sourced
 *   beats; no line is quoted.
 */

import type { Chapter } from './encounters.ts';
import { seymourNatusScripts } from '../story/scripts/seymour-natus.ts';
import { highbridgeBuild } from './ffx/builds/highbridge.ts';
import { seymourNatusGroup } from './ffx/enemies/seymour-natus.ts';

/** Chapter 10 (registered, unlisted). */
export const SEYMOUR_NATUS: Chapter = {
  id: 'seymour-natus',
  game: 'ffx',
  number: 10, // D-058: registration order after Chapter IX
  title: 'Seymour Natus', // B1 (picked)
  // research §8.2 beats 8-9, summarised: the one Seymour fight the party turns back into.
  subtitle: 'The guardians turn back on the bridge',
  location: 'Highbridge of Bevelle — before the Main Gate', // B1 (picked)
  // research §8.2 beats 7-9 and §4.1, summarised. Placeholder card copy; the
  // card itself is not shown until the chapter is listed.
  blurb:
    'Seymour meets them at the end of the bridge and offers death as a mercy. ' +
    'Kimahri stands his ground, and the others come back for him.',
  sceneKey: 'bevelle-highbridge', // O-3 C (D-095): src/scenes/highbridge.ts
  thumbnailKey: 'chapter-seymour-natus',
  buildRef: highbridgeBuild,
  enemyGroupRef: seymourNatusGroup,
  scriptsRef: seymourNatusScripts, // docs/plans/natus-story-draft.md (B11 = a)
  music: {
    // B15's stand-in (D-091) until the new cue is picked by ear (O-6). FFX cues
    // only (THEMES.md never crosses the scores).
    scene: 'scene-gagazet',
    battle: 'boss-seymour-macalania',
    victory: 'victory-ffx',
  },
  // research §1.5 and §2.3, in our own words (the enemy records carry the same lines).
  sensorTexts: {
    'seymour-natus': 'Casts elemental magic, then Break, then Flare.',
    mortibody: 'Watch what it casts: its master answers in kind.',
  },
};
