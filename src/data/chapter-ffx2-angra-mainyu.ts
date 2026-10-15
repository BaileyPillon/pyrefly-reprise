/**
 * **Angra Mainyu** (FFX-2 Chapter 5, the story mission "Showdown in the Sands" in the Bikanel Desert; the fiend the Cactuars sealed away, and its two arms Zarich and Tawrich), a hidden chapter (branch
 * `ch-angra-mainyu`).
 *
 * Bailey adopted the chapter on 2026-10-07 (D-536: "Angra Mainyu (FFX-2, the Bikanel Desert superboss)") and on 2026-10-14 wrote, relayed by the driver: "Please work on finishing the unimplemented chapters
 * STAT". The driver's decisions: the chapter ships **hidden behind the typed word `angra`** (`../app/screens/frontend/angraDoor.ts`), as the Leblanc preview, the Experiment, Sinspawn Gui, Fayth, the Tourist Trap and
 * Valefor at Besaid do, so he plays it when he wakes; hidden chapter number **26** (25 is the Biran and Yenke lane's, word `gagazet`); listing it on the board waits for his word; the art is **provisional**
 * and replaces no approved painting; the music is one of our own original cues; the full fight only, never the capped encounters of the dig; the numbers are the game's own rows and scripts.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 268 to 270 (`research/re-ffx2-angra-mainyu.md`; the first build was `research/ffx2-angra-mainyu.md`: the FF Wiki and
 * Jegged). The shared plumbing it touches (the board's door table, the chapter registry, the scene table) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * **The shape.** One formation (`./ffx2/enemies/angra-mainyu.ts`): Angra Mainyu, Lv 47, HP 333,444, and its arms Zarich (Lv 36, immune to physical damage) and Tawrich (Lv 38, immune to magical damage), HP 5,440 each, as
 * **parts**. The body opens with Perdition's Flame, keeps its Flame on a clock of 15 polls and rolls Flare, Curaga on an arm, Bio or Demi in between; it revives a fallen arm with Full-Life and drinks the party's MP
 * when its own runs low; Zarich casts and saps, Tawrich punches and breathes. **The fight ends when the body falls**, the arms standing or not. No second act, no prep tab, no dial. The chapter's attempts, clears and time
 * go to the experiments' own store (`experimental: true`), never `pyrefly-reprise:save:v1`.
 *
 * - `buildRef` — the Chapter V preset carried over (`./ffx2/builds/angra-mainyu.ts`): the Experiment's, the nearest chapter in story order (`[estimate]`: no source gives a level for the mission), **with its three levels raised
 *   by 20 in release candidate r49-rc** (a party-side estimate; the boss rows are untouched; the Chapter V preset is one constant away: `ANGRA_MAINYU_LEVEL_BONUS`).
 * - `enemyGroupRef` — the three bodies, the game's rows (every field tagged in `./ffx2/enemies/angra-mainyu*.ts`).
 * - `sceneKey` — the Bikanel Desert on a provisional plate (`../scenes/angra-mainyu-desert.ts`); the painting is a new file in the art mirror.
 * - `scriptsRef` — the story (`../story/scripts/ffx2-angra-mainyu.ts`): our own words over the sourced beats.
 * - `music` — existing cues only, by sourced mood: the FFX-2 field bed, `boss-ffx2-fallen-aeons` (our own take on "Aeons", which the FF Wiki's OST page says plays in this fight, `[single source]`; never the retail
 *   track) and the FFX-2 fanfare. Bailey's call by ear (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the eighteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { angraMainyuBuild } from './ffx2/builds/angra-mainyu.ts';
import { angraMainyuGroup } from './ffx2/enemies/angra-mainyu.ts';
import { ANGRA_MAINYU_ID, ANGRA_MAINYU_SCENE, X2_ANGRA_MAINYU_ID, X2_TAWRICH_ID, X2_ZARICH_ID } from './angra-mainyu-ids.ts';
import { ffx2AngraMainyuScripts } from '../story/scripts/ffx2-angra-mainyu.ts';

export { ANGRA_MAINYU_ID } from './angra-mainyu-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-angra-mainyu.ts`, both read them). Our own words over the sourced beats. */
export const ANGRA_MAINYU_TEXT = {
  title: 'Angra Mainyu',
  subtitle: 'A fiend the Cactuars buried, and the two arms it fights with',
  location: 'Bikanel Desert — the Al Bhed excavation camp',
  blurb:
    'The Al Bhed dug deep, and what the Cactuars sealed under the sand has woken. It comes for the dig camp with a second pair of hands, and the Gullwings have three bodies to get through.',
} as const;

/** Angra Mainyu's chapter record. */
export const FFX2_ANGRA_MAINYU: Chapter = {
  id: ANGRA_MAINYU_ID,
  game: 'ffx2',
  number: 26, // after the other hidden experiments (19 to 24; 25 is the Biran and Yenke lane's); the card would say EXP, not XXVI (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...ANGRA_MAINYU_TEXT,
  sceneKey: ANGRA_MAINYU_SCENE,
  thumbnailKey: 'chapter-ffx2-angra-mainyu',
  buildRef: angraMainyuBuild,
  enemyGroupRef: angraMainyuGroup,
  scriptsRef: ffx2AngraMainyuScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (the game's Bikanel theme has no cue of ours)
    battle: 'boss-ffx2-fallen-aeons', // our own take on "Aeons" [single source: FF Wiki OST page], the cue the Road, Ixion, Valefor and the Tourist Trap play
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [X2_ANGRA_MAINYU_ID]: 'Its flame lands ten times, on whoever it picks. Keep everyone high, and keep the arms down.',
    [X2_ZARICH_ID]: 'The left arm. Blows pass through it. It casts, and it saps MP and strength.',
    [X2_TAWRICH_ID]: 'The right arm. Spells pass through it. It punches, and it breathes ruin.',
  },
};
