/**
 * **The Luca Opener** (Logos and Ormi, then Leblanc, on the docks of Luca: the first fights of FFX-2's Chapter 1), a hidden chapter, number 52 (branch `ch-luca-opener`).
 *
 * Authority (relayed by the release driver, verbatim): 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too" (every researched boss he never picked); 2026-11-09 "Keep going please with
 * everything you were doing"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations". The decisions, each the paper preflight's own recommendation
 * (`docs/plans/ch-debut-review.md`; `docs/handoff/ch-luca-opener.md` lists every pick with its alternative, "driver's call, his to overturn"): hidden behind the typed word **`debut`**
 * (`../app/screens/frontend/debutDoor.ts`), chapter number **52**, listing it on the board waits for his word; two links, Logos and Ormi then Leblanc (LO1; the concert fight before them is not built); a new Lv 2 / 2 / 3
 * party, measured (LO2); Yuna held to the Songstress and Darkness Dance in the second link (LO3); the Leblanc chapters' stage as a flagged stand-in for the docks (LO4); Ormi's lone-45 rule not ported (LO5); the
 * Syndicate's cue (LO6).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 129, 130 and 131 (`research/re-ffx2-luca-opener.md`). The shared plumbing it touches (the board's door table, the chapter registry,
 * the kill-reward and held-item tables, one additive field of `EnemyGroupDef`) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * - `buildRef` - the girls in the dresspheres they start in (`./ffx2/builds/luca-opener.ts`); the second link carries its own party template (Yuna a Songstress).
 * - `enemyGroupRef` - act 1's Logos and Ormi; the chain follows `nextGroupId`: Leblanc (`./ffx2/enemies/luca-opener.ts`). Link 2 enters at full HP and MP, with no card.
 * - `sceneKey` - `leblanc-last-room`, the Leblanc chapters' stage, a flagged stand-in for the docks of Luca (no plate of them exists).
 * - `scriptsRef` - the story, a DRAFT for Bailey's read (`../story/scripts/ffx2-luca-opener.ts`).
 * - `music` - existing cues only: the Syndicate's field bed and boss cue (`scene-chateau-leblanc`, `boss-leblanc`: flagged stand-ins) and the FFX-2 fanfare. Bailey's ears (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays as it was); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 * A clear goes to the experiments' own store (`experimental: true`), never the save: no save change, no migration.
 */

import type { Chapter } from './encounters.ts';
import { lucaOpenerBuild } from './ffx2/builds/luca-opener.ts';
import { lucaLogosOrmiGroup } from './ffx2/enemies/luca-opener.ts';
import { LUCA_OPENER_ID, LUCA_OPENER_SCENE, X2_LUCA_LEBLANC_ID, X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID } from './luca-opener-ids.ts';
import { ffx2LucaOpenerScripts } from '../story/scripts/ffx2-luca-opener.ts';

export { LUCA_OPENER_ID } from './luca-opener-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-luca-opener.ts`, both read them). Our own words over the sourced beats. */
export const LUCA_OPENER_TEXT = {
  title: 'The Luca Opener',
  subtitle: 'A shield, a pistol, and a borrowed gown',
  location: 'Luca — Harbour No. 3',
  blurb:
    'The concert is over and the dock is not empty. Two lieutenants of the Leblanc Syndicate want a word about the stage, ' +
    'and behind them, in a gown Yuna knows too well, the boss who wants it back.',
} as const;

/** The chapter record. */
export const FFX2_LUCA_OPENER: Chapter = {
  id: LUCA_OPENER_ID,
  game: 'ffx2',
  number: 52, // assigned by the program plan (row 52); the card would say EXP, not LII (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...LUCA_OPENER_TEXT,
  sceneKey: LUCA_OPENER_SCENE,
  thumbnailKey: 'chapter-ffx2-leblanc', // a flagged stand-in: Chapter VI's card, the same three people (the chapter's own card is on the handoff's art list)
  buildRef: lucaOpenerBuild,
  enemyGroupRef: lucaLogosOrmiGroup,
  scriptsRef: ffx2LucaOpenerScripts,
  music: {
    scene: 'scene-chateau-leblanc', // the Syndicate's field bed (a flagged stand-in for Luca's own, which has no cue of ours)
    battle: 'boss-leblanc', // LO6, a flagged stand-in: the Syndicate chapters' brass-and-funk cue, for both links
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [X2_LUCA_ORMI_ID]: 'Two blows, then the shield, at whoever stands farthest.',
    [X2_LUCA_LOGOS_ID]: 'Two shots a turn. Once, when Ormi is nearly gone, a Potion.',
    [X2_LUCA_LEBLANC_ID]: 'Three blows, then Thunder at whoever has most life.',
  },
};
