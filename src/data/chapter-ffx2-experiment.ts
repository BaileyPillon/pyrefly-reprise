/**
 * **The Experiment** — the Machine Faction's walking weapon at Djose Temple (FFX-2 Chapter 5), a hidden chapter (branch `ch-experiment`).
 *
 * Bailey, 2026-10-10 (chat), verbatim: "I'll add in those 2 chapter recommendations" and "i want those chapters added in over night while im sleep along with
 * what you are working on now. also include the reverse engineered and decompiled game mechanics please. this is really important." The driver's reading, recorded
 * as his delegation: end state first is waived for tonight because he asked to build now; the chapter ships **hidden behind a typed word**, as the Leblanc preview
 * does, so he plays it in the morning, and listing it on the board waits for his word; the art is **provisional** (new subjects only, never replacing an approved
 * painting); game case FFX-2 only.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, FFX-2 items and the FFX-2 monster rows. The shared plumbing it touches (the hidden word on chapter
 * select, one prep tab, the chapter registry) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * **What makes it new: the player chooses the Experiment's parts before the fight.** In the game its three upgrade tracks, Attack, Defense and Special, rise as the
 * player digs up Assembly pieces in Bikanel Desert; here the prep screen's EXPERIMENT tab sets the three levels (`../app/experiments/`, `./ffx2/enemies/experiment-levels.ts`).
 * The choice lives in **session memory only** (`./ffx2/enemies/experiment-loadout.ts`): the save schema is untouched, and the chapter's attempts and clears go to the
 * experiments' own store (`experimental: true`), never `pyrefly-reprise:save:v1`.
 *
 * **`enemyGroupRef` is an accessor.** Everything that reads the chapter's formation (`BattleScreen`, the preload, `setupForChapter`, the cards) reads this one property,
 * so it returns the formation for the levels in memory: the same object for the same levels (`experimentGroup` memoises), a new one only when the player changes them.
 * Nothing in a shared screen changes and `Chapter` (a contract type) is not widened.
 *
 * - `buildRef` — the Chapter 5 preset (`farplaneBuild`): the Experiment is a Chapter 5 mission and the research's party band is that chapter's.
 * - `scriptsRef` — the story (`../story/scripts/ffx2-experiment.ts`): our own words over the sourced beats.
 * - `music` — existing cues only, by sourced mood; Bailey's call by ear (rule 13).
 * - `sceneKey` — the Machine Faction's grounds on a provisional plate (`./experiment-plates.ts`).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the eighteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it and `getChapter` finds it.
 */

import type { EnemyGroupDef } from '../battle/common/types.ts';
import type { Chapter } from './encounters.ts';
import { farplaneBuild } from './ffx2/builds/farplane.ts';
import { experimentGroup } from './ffx2/enemies/experiment.ts';
import { experimentLevels } from './ffx2/enemies/experiment-loadout.ts';
import { EXPERIMENT_GROUNDS_PLATE } from './experiment-plates.ts';
import { ffx2ExperimentScripts } from '../story/scripts/ffx2-experiment.ts';

/** The chapter's id: its key in the experiments' store and on the board. */
export const EXPERIMENT_ID = 'ffx2-experiment' as const;

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-experiment.ts`, both read them). Our own words over the sourced beats. */
export const EXPERIMENT_TEXT = {
  title: 'The Experiment',
  subtitle: 'A weapon built from spare parts, and the parts are yours to choose',
  location: "Djose Temple — the Machine Faction's grounds",
  blurb:
    'The Machine Faction built a walking weapon from everything the desert gave up, and they dare you to take it on. ' +
    'Choose what it is made of before it starts. It does exactly what its parts say.',
} as const;

/** The Experiment's chapter record. */
export const FFX2_EXPERIMENT: Chapter = {
  id: EXPERIMENT_ID,
  game: 'ffx2',
  number: 19, // after the eighteen on the board, like the Leblanc preview; the card would say EXP, not XIX (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...EXPERIMENT_TEXT,
  sceneKey: EXPERIMENT_GROUNDS_PLATE,
  thumbnailKey: 'chapter-ffx2-experiment',
  buildRef: farplaneBuild,
  /** The formation for the levels the player chose (session memory); one object per choice, so every reader sees the same one. */
  get enemyGroupRef(): EnemyGroupDef {
    return experimentGroup(experimentLevels());
  },
  scriptsRef: ffx2ExperimentScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (the game's Machine Faction theme has no cue of ours)
    battle: 'boss-vegnagun', // the mechanised cue: a weapon built to take on Vegnagun (`docs/audio/THEMES.md` row 18, "Something enormous, and nobody is driving")
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    'x2-experiment': 'Its parts decide what it can do. Read what it is built from.',
  },
};
