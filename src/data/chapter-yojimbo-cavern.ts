/**
 * Chapter IX — Yojimbo, in the Cavern of the Stolen Fayth (FFX).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, aeons, an enemy Overdrive
 * gauge and Ronso Rage Doom (`research/ffx-yojimbo.md` §0.3, "None of these
 * facts transfers across games"). The FFX-2 Yojimbo is a different fight and
 * belongs to the planned FFX-2 fallen-aeons chapter.
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7
 * and 8; the `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## Registered, reachable, and UNLISTED
 *
 * It sits in `UNLISTED_CHAPTERS`, not in `CHAPTERS`: `getChapter`, the battle
 * flow and `window.__pyrefly.gotoChapter` reach it by id, but **chapter select
 * does not show it**. Moving it into `CHAPTERS` is the integrator's one line.
 *
 * Bailey's picks (docs/target/decisions.json D-049 to D-076): title "Yojimbo"
 * (D-053), Chapter IX (D-058), line-up Lulu, Kimahri, Yuna (D-066), no Candle
 * of Life (D-067), Kimahri with Doom (D-056), battle music O-6 A (D-063).
 *
 * - `scriptsRef` — the pre and post scenes of
 *   `docs/plans/yojimbo-story-draft.md` (`src/story/scripts/yojimbo-cavern.ts`),
 *   **without** the four mid-battle callouts, held until Bailey reads the
 *   draft (D-068).
 * - `music` — `boss-yojimbo` ("The Summoner's Sorrow", Bailey's O-6 pick) for
 *   the battle, in the slot where the game plays "Lulu's Theme" (§6.4
 *   [verified: 2 sources]). The scene fallback is `scene-gagazet`, a
 *   **stand-in** for the cave's own theme, which has no cue of ours (the
 *   Chapter VII precedent); the pre scene moves to `boss-yojimbo` itself when
 *   Ginnem appears.
 * - `sceneKey: 'cavern-stolen-fayth'` — the Cavern's last chamber (O-4 A, with
 *   the night-sakura arrival), `src/scenes/cavern-stolen-fayth.ts`.
 * - Subtitle and blurb are summaries of research §6.2's sourced beats, in our
 *   own words; none is a quoted line.
 */

import type { Chapter } from './encounters.ts';
import { yojimboCavernScripts } from '../story/scripts/yojimbo-cavern.ts';
import { yojimboCavernBuild } from './ffx/builds/yojimbo-cavern.ts';
import { yojimboGroup } from './ffx/enemies/yojimbo.ts';

/** Chapter 9 (registered, unlisted). */
export const YOJIMBO_CAVERN: Chapter = {
  id: 'yojimbo-cavern',
  game: 'ffx',
  number: 9, // B10, D-058
  title: 'Yojimbo', // B5, D-053
  // research §6.2 beats 3-4, summarised: Lulu's last duty as Ginnem's guardian.
  subtitle: "A guardian's last duty to her first summoner",
  // research §1.1 / §6.1 [verified: 2 sources]: the last chamber of the Cavern.
  location: 'Cavern of the Stolen Fayth — the last chamber',
  // research §6.2 beats 3-4 and §4.1, summarised. Placeholder card copy; the
  // card itself is not shown until Bailey picks it.
  blurb:
    'Lulu guarded one summoner before Yuna, and she died in this cave. She never left it. ' +
    'Her aeon still answers her, and it strikes harder every time it is struck.',
  sceneKey: 'cavern-stolen-fayth', // O-4 A (D-061) + arrival (D-072), src/scenes/cavern-stolen-fayth.ts
  thumbnailKey: 'chapter-yojimbo-cavern',
  buildRef: yojimboCavernBuild,
  enemyGroupRef: yojimboGroup,
  scriptsRef: yojimboCavernScripts,
  music: {
    // Stand-in scene cue (see the file header); FFX cues only (THEMES.md
    // never crosses the scores).
    scene: 'scene-gagazet',
    // O-6 A, D-063: the original cue in the "Lulu's Theme" slot [§6.4].
    battle: 'boss-yojimbo',
    victory: 'victory-ffx',
  },
  // Yojimbo, Ginnem and Daigoro are all Sensor- and Scan-immune
  // (research §2.1, §2.3 "No Scan text exists"), so there is no line to show.
  sensorTexts: {},
};
