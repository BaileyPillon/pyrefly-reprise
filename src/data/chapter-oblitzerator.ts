/**
 * **The Oblitzerator**: a NEW, HIDDEN FFX chapter (branch `ch-oblitzerator`, built 2026-11-09; hidden chapter number 50): the blitzball machine and the dock crane at Luca (`cdsp02_00`), the fight at the Number 4 Dock between
 * the blitzball final and Auron's return.
 *
 * Bailey, 2026-11-06, "implement all unimplemented chapters please" and "yes on all these too" (to building every researched boss he never picked); 2026-10-31, "you make the executive decisions for the next few days. i'll go
 * with all of your recommendations." The paper preflight is `docs/plans/ch-oblitzerator-review.md`; the game's rules are `research/re-ffx-oblitzerator-crane.md`. Every pick is the driver's, "his to overturn".
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, the FFX status set and the Trigger Command system; the fight comes in Chapter 4, between the blitzball final and Auron's return. FFX-2 has no counterpart.
 *
 * **The fight in one paragraph.** A blitzball-throwing machine with 6,000 HP and a crane standing by with its power cut. The machine throws ten balls at once, spread at random over whoever is standing, and it answers a blow with a
 * ball of its own, one time in three (a Blind Ball for a physical blow, a Mute Ball for a spell). It runs faster the more it is hurt. The way through is the crane: cast Thunder at it, three times (Lulu's, or one Thunder Fury), and it
 * wakes; then Tidus's Use crane drops the machine to a sixteenth of its HP and it stops acting. A party that ignores the crane can still win, against a machine that doubles its pace.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Wendigo and Spherimorph chapters are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { lucaBuild } from './ffx/builds/luca.ts';
import { oblitzeratorGroup } from './ffx/enemies/oblitzerator.ts';
import { oblitzeratorScripts } from '../story/scripts/oblitzerator.ts';
import { LUCA_CRANE_ID, OBLITZERATOR_CHAPTER_ID, OBLITZERATOR_ID, OBLITZERATOR_SCENE } from './ffx/oblitzerator-ids.ts';

export { OBLITZERATOR_CHAPTER_ID, OBLITZERATOR_SCENE }; // the ids live in `./ffx/oblitzerator-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-oblitzerator.ts`, both read them). Our own words over the research's sourced rules; no number in them. */
export const OBLITZERATOR_TEXT = {
  title: 'The Oblitzerator',
  subtitle: 'Wake the crane',
  blurb:
    'A blitzball machine on the Number 4 Dock throws a handful of balls at once and answers every blow with a ball of its own. ' +
    'The crane beside it has no power. Give it some.',
} as const;

/** The sensor lines, one per combatant: our own words, in-world advice that is allowed to be wrong (writing bible 5.3). */
export const OBLITZERATOR_SENSOR_TEXTS: Record<string, string> = {
  [OBLITZERATOR_ID]: 'A blitzball machine gone to war. It throws a handful of balls at once, and it answers a blow with a ball of its own. Look at the crane.',
  [LUCA_CRANE_ID]: 'A dock crane with its power cut. Something with Thunder in it might wake it.',
};

/**
 * Number 50: the program plan's row (50), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the eyebrow EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const OBLITZERATOR: Chapter = {
  id: OBLITZERATOR_CHAPTER_ID,
  game: 'ffx',
  number: 50,
  experimental: true,
  ...OBLITZERATOR_TEXT,
  location: 'Luca — the Number 4 Dock',
  sceneKey: OBLITZERATOR_SCENE,
  thumbnailKey: 'chapter-sinspawn-gui', // a stand-in: the Ridge's card (the coast road this stage is drawn on); the chapter's own card is owed (`docs/handoff/ch-oblitzerator.md`)
  buildRef: lucaBuild,
  enemyGroupRef: oblitzeratorGroup,
  scriptsRef: oblitzeratorScripts,
  music: {
    // No source names this fight's cue (RE 2: the formation sets no music; the field launches the battle). The ordinary FFX battle cue and the coast bed, existing cues by reference, flagged stand-ins; Bailey's ear decides (rule 13).
    scene: 'scene-gagazet',
    battle: 'battle-ffx',
    victory: 'victory-ffx',
  },
  sensorTexts: OBLITZERATOR_SENSOR_TEXTS,
};
