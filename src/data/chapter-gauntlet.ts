/**
 * **The Gauntlet**: a NEW, HIDDEN FFX chapter (branch `ch-gauntlet`, built 2026-11-09 and 2026-11-10; hidden chapter number 54): nine Monster Arena creations in the Calm Lands, fought one after another (Cactuar King, Don
 * Tonberry, Jormungand, Earth Eater, the Greater Sphere, Catastrophe, Th'uban, Neslug, the Ultima Buster with its Head and two Arms), the endgame party, a full heal between the acts.
 *
 * Bailey, relayed by the release driver, verbatim: "implement all unimplemented chapters please" (2026-11-06 about 00:30 EST), "yes on all these too" (to building every researched boss he never picked; about 00:55 EST), "you
 * make the executive decisions for the next few days. i'll go with all of your recommendations" (2026-10-31) and "Keep going please with everything you were doing" (2026-11-09). The picks (GA1 to GA13) are in
 * `docs/plans/ch-gauntlet-review.md` and the handoff `docs/handoff/ch-gauntlet.md` ("driver's call, his to overturn"): one chapter, nine acts in three tiers of three, hidden behind the typed word `gauntlet`, not listed.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the Monster Arena and its creations are FFX content (CTB, the FFX monster files); FFX-2 has the Fiend Arena, a different system with different creatures
 * (`research/re-ffx-monster-arena-creations.md`).
 *
 * **The fights in one paragraph.** The party is the endgame party (HP 9,999, every other stat at its cap, Auto-Haste, Auto-Phoenix, Auto-Protect), so the ordinary moves are small and the cost is length and a handful of
 * lethal answers: the Cactuar King's needles on every blow, Don Tonberry's Karma on whoever strikes it while it walks in, Earth Eater's punch and the Flare its own Reflect throws back, the Greater Sphere's element puzzle (one
 * element hurts it, three heal it), Catastrophe's change, Th'uban's Convergence, Neslug's shell (only magic opens it) and the Ultima Buster's gate (an Arm must fall before a blade does anything). Nothing in a creature's
 * numbers is tuned; the difficulty is the party and the line you play.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Dark Aeons and the Spectral Keeper are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it.
 *
 * **Card lines (picks GA7 and GA8):** the card names the arena's own unlock rule in one line (the game opens its creations by what you have caught; here every act is open) and the game's stacked prize as not in this
 * build (the chapter pays the file's drops only).
 */

import type { Chapter } from './encounters.ts';
import { gauntletBuild } from './ffx/builds/gauntlet.ts';
import { GAUNTLET_GROUPS } from './ffx/enemies/gauntlet-groups.ts';
import { gauntletScripts } from '../story/scripts/gauntlet.ts';
import { GAUNTLET_CHAPTER_ID, GAUNTLET_CHAPTER_NUMBER, GAUNTLET_SCENE } from './ffx/gauntlet-ids.ts';

export { GAUNTLET_CHAPTER_ID, GAUNTLET_SCENE }; // the ids live in `./ffx/gauntlet-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/**
 * The card's words (the chapter record and the pause metadata, `./chapter-meta-gauntlet.ts`, both read them). Our own words over the research's sourced beats; no number in them.
 * The blurb's two sentences carry the two card lines of the preflight: GA7 (the unlock rule, one line) and GA8 (the prize, not in this build).
 */
export const GAUNTLET_TEXT = {
  title: 'The Gauntlet',
  subtitle: 'Nine creations, one arena',
  blurb:
    'The arena in the Calm Lands opens its creations one by one to whoever has caught enough fiends; here every door is already open. ' +
    "Nine of them wait in a row, the smallest first, and the stacked prize the game pays for each first win is not in this build.",
} as const;

/**
 * Number 54: past the Wendigo's 49 (50 to 53 are the sibling lanes'), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the eyebrow EXPERIMENTAL
 * (`ui/common/roman.ts`).
 */
export const GAUNTLET: Chapter = {
  id: GAUNTLET_CHAPTER_ID,
  game: 'ffx',
  number: GAUNTLET_CHAPTER_NUMBER,
  experimental: true,
  ...GAUNTLET_TEXT,
  location: 'The Monster Arena, the Calm Lands',
  sceneKey: GAUNTLET_SCENE,
  thumbnailKey: 'chapter-gauntlet', // a key only (the card and thumbnail are held until Bailey's word to list the chapter): nothing loads it while the chapter is hidden
  buildRef: gauntletBuild,
  enemyGroupRef: GAUNTLET_GROUPS[0]!,
  scriptsRef: gauntletScripts,
  music: {
    // No source names these fights' cues (the arena formations set none; the field does: RE n 0). The Dome's bed stands in under the scenes (the plate is the Dome's); each act's cue is its formation's
    // (`data/ffx/enemies/gauntlet-groups.ts`: `boss-challenge`, then `boss-yojimbo` for the last act, the Dark Aeons chapter's choice). Existing cues by reference, flagged stand-ins; Bailey's ear decides (rule 13).
    scene: 'scene-zanarkand-dome',
    battle: 'boss-challenge',
    phase2: 'boss-yojimbo',
    victory: 'victory-ffx',
  },
  // None: all nine bodies are immune to Sensor and to Scan (`./ffx/enemies/gauntlet-records.ts`), so no text is ever shown (the Shinryu and Guard Scorpion chapters are empty the same way).
  sensorTexts: {},
};
