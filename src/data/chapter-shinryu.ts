/**
 * **Shinryu**: a NEW, HIDDEN FFX chapter (branch `ch-shinryu`, built 2026-11-07; hidden chapter number 48): the Monster Arena's deep-water dragon (monster file `m283`, formation `zzzz02_83`), fought by the three who can
 * swim, Tidus, Wakka and Rikku, with the best weapons they have.
 *
 * Bailey, relayed by the release driver, verbatim: "implement all unimplemented chapters please" (2026-11-06) and "yes on all these too" (to building every researched boss he never picked); "ok keep going we have full usage
 * here" (2026-11-07); and, 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." The picks (SH1 to SH9) are in `docs/plans/ch-shinryu-review.md` and the handoff
 * `docs/handoff/ch-shinryu.md` ("driver's call, his to overturn"): one fight as the arena gives it (a single link), hidden behind the typed word `shinryu`, hidden chapter **number 48**, FFX only and not desktop-only (painted
 * 2D), the Penance preset's three swimmers with their Celestial weapons (SH2), the submerged Via Purifico plate as the stage (SH3), the script followed exactly (SH4), Eraser as the row has it and the water breaking the stone (SH5),
 * a Normal start (SH6), the boss bar unchanged (SH7: the segmented bar is an owed option, not built), stand-in music (SH8).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Shinryu is a creature of the FFX Monster Arena (CTB, the FFX monster files, the swimmers' water rules); FFX-2 has no such row.
 *
 * **The fight in one paragraph.** Two million hit points, no weakness and almost no ailment it can catch. Each turn it flares in eight small bursts across the swimmers, points the Eraser at one of them (a Petrify the water
 * breaks, so whoever it catches leaves the fight for good; the last swimmer standing is only ever clawed), or claws; and every blow that hurts it is answered with a claw at the one who struck. It is a race: twenty-one blows of
 * 99,999 end it.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Flooded Ways and Penance are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { shinryuBuild } from './ffx/builds/shinryu.ts';
import { shinryuGroup } from './ffx/enemies/shinryu.ts';
import { shinryuScripts } from '../story/scripts/shinryu.ts';
import { SHINRYU_CHAPTER_ID, SHINRYU_ID, SHINRYU_SCENE } from './ffx/shinryu-ids.ts';

export { SHINRYU_CHAPTER_ID, SHINRYU_SCENE }; // the ids live in `./ffx/shinryu-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-shinryu.ts`, both read them). Our own words over the research's sourced beats; no number in them. */
export const SHINRYU_TEXT = {
  title: 'Shinryu',
  subtitle: 'The dragon of the deep water',
  blurb:
    'The arena keeps one dragon at the bottom of the sea, and only three of you can swim down to it. ' +
    'It answers every wound with a claw, and in this water the stone it makes does not stay whole. End it quickly.',
} as const;

/**
 * Number 48: past the Sanctuary Keeper's 39 and Yuna's Ballad's 40 (41 to 47 are the sibling wave-four lanes'), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP,
 * the eyebrow EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const SHINRYU: Chapter = {
  id: SHINRYU_CHAPTER_ID,
  game: 'ffx',
  number: 48,
  experimental: true,
  ...SHINRYU_TEXT,
  location: 'The Monster Arena — deep water',
  sceneKey: SHINRYU_SCENE,
  thumbnailKey: 'chapter-shinryu', // a key only (the card and thumbnail are held until Bailey's word to list the chapter): nothing loads it while the chapter is hidden
  buildRef: shinryuBuild,
  enemyGroupRef: shinryuGroup,
  scriptsRef: shinryuScripts,
  music: {
    // No source names this fight's cue (the arena plays the game's Boss Theme). The scenes are silent beds; the battle cue is the formation's (`data/ffx/enemies/shinryu.ts`: `boss-challenge`).
    // Existing cues by reference, flagged stand-ins; Bailey's ear decides (rule 13).
    scene: 'scene-gagazet', // the Via Purifico chapter's own bed, as the Flooded Ways has: no source names a bed for this place
    battle: 'boss-challenge',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy record's own `sensorText` (`./ffx/enemies/shinryu.ts`), as the `Chapter` contract asks.
  sensorTexts: {
    [SHINRYU_ID]: 'A shadow too large for any sensor to hold. In this water stone shatters, so end it quickly.',
  },
};
