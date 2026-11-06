/**
 * **The Farplane Cup** (the Fiend Arena's three duels: Auron, Tidus and Seymour, the fighters of `monster.bin` rows 311, 317 and 319), a hidden chapter (branch `ch-farplane-cup`).
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too" (to building every researched boss he never picked); 2026-10-31: "you make the executive decisions
 * for the next few days. i'll go with all of your recommendations." The driver's decisions, each the paper preflight's own recommendation (`docs/handoff/ch-farplane-cup.md` lists every pick with its alternative, "driver's
 * call, his to overturn"): hidden behind the typed word **`duelist`** (`../app/screens/frontend/duelistDoor.ts`), chapter number **38**, listing it on the board waits for his word; three fixed duels, not a tournament
 * (DU1); the order of the rows, Auron, Tidus, Seymour (DU2); the second duelist's name masked in the fight and read out after it (DU3); the Lv 99 party of Chapter XIII, measured (DU4); the Den of Woe's stage as a flagged
 * stand-in (DU5); a flagged stand-in cue (DU6); no Escape.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 311, 317 and 319 (`research/re-ffx2-farplane-cup.md`); the three are FFX characters as FFX-2 enemy rows. The shared plumbing it
 * touches (the board's door table, the chapter registry, the kill-reward item table) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * - `buildRef` — Chapter XIII's Lv 99 party, as it is (`./ffx2/builds/farplane-cup.ts`).
 * - `enemyGroupRef` — duel 1's Auron; the chain follows `nextGroupId`: the masked duelist, Seymour (`./ffx2/enemies/farplane-cup.ts`). Links 2 and 3 enter at full HP and MP (the arena mends the party between duels), with no card.
 * - `sceneKey` — the Den of Woe's own stage (`../scenes/den-of-woe.ts`): the cup has no map in the files, so a plain arena with human-sized foes stands in (DU5).
 * - `scriptsRef` — the story, a DRAFT for Bailey's read (`../story/scripts/ffx2-farplane-cup.ts`).
 * - `music` — existing cues only: the FFX-2 field bed, `boss-trema` (the superboss cue: a flagged stand-in) and the FFX-2 fanfare. Bailey's ears (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the nineteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 * A clear goes to the experiments' own store (`experimental: true`), never the save: no save change, no migration.
 */

import type { Chapter } from './encounters.ts';
import { farplaneCupBuild } from './ffx2/builds/farplane-cup.ts';
import { duel1AuronGroup } from './ffx2/enemies/farplane-cup.ts';
import { FARPLANE_CUP_ID, FARPLANE_CUP_SCENE, X2_CUP_AURON_ID, X2_CUP_SEYMOUR_ID, X2_CUP_TIDUS_ID } from './farplane-cup-ids.ts';
import { ffx2FarplaneCupScripts } from '../story/scripts/ffx2-farplane-cup.ts';

export { FARPLANE_CUP_ID } from './farplane-cup-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-farplane-cup.ts`, both read them). Our own words over the sourced beats. */
export const FARPLANE_CUP_TEXT = {
  title: 'The Farplane Cup',
  subtitle: 'Three duels in the Fiend Arena, and no rounds between them',
  location: 'The Fiend Arena — a stand-in stage',
  blurb:
    'Three fighters wait in the arena, one after the other: a swordsman who walked a long road, a fast one whose name the arena keeps hidden, and a maester who feeds on black magic. ' +
    'The arena mends the girls between duels, and nothing else will.',
} as const;

/** The chapter record. */
export const FFX2_FARPLANE_CUP: Chapter = {
  id: FARPLANE_CUP_ID,
  game: 'ffx2',
  number: 38, // after the other hidden chapters (19 to 32; 33 to 37 are the first wave's and the rows between); the card would say EXP, not XXXVIII (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...FARPLANE_CUP_TEXT,
  sceneKey: FARPLANE_CUP_SCENE,
  thumbnailKey: 'chapter-ffx2-farplane-cup',
  buildRef: farplaneCupBuild,
  enemyGroupRef: duel1AuronGroup,
  scriptsRef: ffx2FarplaneCupScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (the Den of Woe's own is the same placeholder)
    battle: 'boss-trema', // a flagged stand-in (DU6): the Fiend Arena's superboss cue; Bailey's ears decide
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [X2_CUP_AURON_ID]: 'Heavy and steady. His shooting star does not kill: it removes one of you from the fight.',
    [X2_CUP_TIDUS_ID]: 'The fastest thing in the arena. He opens with nine blows on one of you, and hastes himself so that he can keep going.',
    [X2_CUP_SEYMOUR_ID]: 'He drinks fire, ice, thunder, water and Gravity. Meteor and Black Sky come down on all three of you.',
  },
};
