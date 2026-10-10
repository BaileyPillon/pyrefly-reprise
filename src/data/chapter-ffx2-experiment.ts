/**
 * **The Experiment** — the Machine Faction's weapon at Djose Temple (FFX-2 Chapter 5, the mission Masterpiece Theatre), a hidden chapter (branch `ch-experiment`).
 *
 * Bailey, 2026-10-10 (chat), verbatim: "I'll add in those 2 chapter recommendations" and "i want those chapters added in over night while im sleep along with
 * what you are working on now. also include the reverse engineered and decompiled game mechanics please. this is really important." The driver's reading, recorded
 * as his delegation: end state first is waived for tonight because he asked to build now; the chapter ships **hidden behind a typed word**, as the Leblanc preview
 * does, so he plays it in the morning, and listing it on the board waits for his word; the art is **provisional** (new subjects only, never replacing an approved
 * painting); game case FFX-2 only. **The driver's concept pick: B, the game's own two-act Rematch** (research `concepts.md`; Bailey's product brief puts "one more try"
 * in the fight itself, with no modifiers, and the game has no pre-battle upgrade menu, so there is no dial and no prep tab).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, FFX-2 items and the FFX-2 monster rows. The shared plumbing it touches (the hidden word on chapter
 * select, the chapter registry) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * **The shape.** Two formations chained by `nextGroupId` (`./ffx2/enemies/experiment.ts`): **Act I**, the machine at Attack 1, Defense 1, Special 1 (the game's first test, a plain
 * strike every action), then a story seam (the first win's gag, the rebuild, the confession that it is out of control: `../story/scripts/ffx2-experiment.ts`), then **Act II**, the
 * full weapon at 5 / 5 / 5, the chapter's retry checkpoint (a loss reopens Act II and skips Act I and the seam). The levels are story, stated twice, never a setting. The chapter's
 * attempts, clears and time go to the experiments' own store (`experimental: true`), never `pyrefly-reprise:save:v1`.
 *
 * - `buildRef` — the Chapter 5 preset (`farplaneBuild`): the Experiment is a Chapter 5 mission and the research's party band is that chapter's (levels `[estimate]`: no source gives one).
 * - `scriptsRef` — the story (`../story/scripts/ffx2-experiment.ts`): our own words over the sourced beats.
 * - `music` — existing cues only, by sourced mood; Bailey's call by ear (rule 13).
 * - `sceneKey` — the Fayth Antechamber of Djose Temple, the Machine Faction's hall, on a provisional plate (`./experiment-plates.ts`).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the eighteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it and `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { farplaneBuild } from './ffx2/builds/farplane.ts';
import { EXPERIMENT_ENEMY_ID, EXPERIMENT_PROTOTYPE_ID, experimentActOneGroup } from './ffx2/enemies/experiment.ts';
import { EXPERIMENT_GROUNDS_PLATE } from './experiment-plates.ts';
import { ffx2ExperimentScripts } from '../story/scripts/ffx2-experiment.ts';

/** The chapter's id: its key in the experiments' store. Named for the mission, not "experiment": the project already means a hidden preview by that word (`Chapter.experimental`). */
export const EXPERIMENT_ID = 'ffx2-masterpiece-theatre' as const;

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-experiment.ts`, both read them). Our own words over the sourced beats. */
export const EXPERIMENT_TEXT = {
  title: 'The Experiment',
  subtitle: 'Built to stop a gun, then souped up past stopping',
  location: 'Djose Temple — the Fayth Antechamber',
  blurb:
    'The Machine Faction built a weapon out of desert scrap and dared the Gullwings to break it. They did. ' +
    'The Faction swore it would build something stronger, and then could not stop what it built.',
} as const;

/** The Experiment's chapter record. */
export const FFX2_EXPERIMENT: Chapter = {
  id: EXPERIMENT_ID,
  game: 'ffx2',
  number: 20, // after the eighteen on the board and after the other hidden experiments (19: the Leblanc preview and Sinspawn Gui); the card would say EXP, not XX (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...EXPERIMENT_TEXT,
  sceneKey: EXPERIMENT_GROUNDS_PLATE,
  thumbnailKey: 'chapter-ffx2-experiment',
  buildRef: farplaneBuild,
  enemyGroupRef: experimentActOneGroup, // Act I; `nextGroupId` chains Act II
  scriptsRef: ffx2ExperimentScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (the game's Machine Faction theme has no cue of ours)
    battle: 'boss-ffx2-aeon', // Act I, the lighter bed (`docs/audio/THEMES.md` row 17)
    phase2: 'boss-vegnagun', // Act II, the mechanised cue: "Something enormous, and nobody is driving" (row 18), the out-of-control act
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [EXPERIMENT_PROTOTYPE_ID]: 'Only a first test. Put Protect up before it learns anything.',
    [EXPERIMENT_ENEMY_ID]: 'Plain swings barely scratch it. Find what goes through, and keep a Phoenix Down ready.',
  },
};
