/**
 * **The Fiend Arena Superbosses** (Almighty Shinra, then the Major Numerus with its seven actors: `monster.bin` rows 329 and 330 to 336), a hidden chapter (branch `ch-fiend-superbosses`, program row 53).
 *
 * Bailey, 2026-11-06: "implement all unimplemented chapters please" and "yes on all these too" (to building every researched boss he never picked); 2026-10-31: "you make the executive decisions for the next few days.
 * i'll go with all of your recommendations." The driver's decisions, each the paper preflight's own recommendation (`docs/plans/ch-fiend-superbosses-review.md` section 9 and `docs/handoff/ch-fiend-superbosses.md` list every
 * pick with its alternative, "driver's call, his to overturn"): hidden behind the typed word **`legion`** (`../app/screens/frontend/legionDoor.ts`), chapter number **53**, listing it on the board waits for his word; ONE chapter in
 * TWO acts (LG1), Shinra first and the Numerus last (LG8), the arena mending the party between them; all four heads with the hidden body, pod and tail, the last head down ends the fight (LG2); the Lv 99 party of Chapter XIII,
 * measured (LG3); the Den of Woe's stage as a flagged stand-in (LG5); flagged stand-in cues (LG9); no Escape.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 329 to 336 (`research/re-ffx2-fiend-arena-superbosses.md`); Shinra is the FFX-2 boy and the Major Numerus is not an FFX monster. The
 * shared plumbing it touches (the board's door table, the chapter registry, the tactic and guide registries, the kill-reward table) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * - `buildRef`: Chapter XIII's Lv 99 party, as it is (`./ffx2/builds/fiend-superbosses.ts`).
 * - `enemyGroupRef`: act 1's Almighty Shinra; the chain follows `nextGroupId`: the Major Numerus (`./ffx2/enemies/fiend-superbosses.ts`). Act 2 enters at full HP and MP (the arena mends the party between the acts), with no card.
 * - `sceneKey`: the Den of Woe's own stage (`../scenes/den-of-woe.ts`): the arena has no map in the files, so a plain arena stands in (LG5). The four heads and the three hidden parts are placed by their engine slots.
 * - `scriptsRef`: the story, a DRAFT for Bailey's read (`../story/scripts/ffx2-fiend-superbosses.ts`).
 * - `music`: existing cues only: the FFX-2 field bed, `boss-trema` (the arena's superboss cue: a flagged stand-in, LG9) and the FFX-2 fanfare. Bailey's ears (rule 13).
 * - `thumbnailKey` and the pause hero are KEYS ONLY or an existing plate (the meta's `heroArt` is Chapter XIII's Trema plate as a stand-in): nothing is painted for this chapter yet; the handoff carries the art list.
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the nineteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 * A clear goes to the experiments' own store (`experimental: true`), never the save: no save change, no migration.
 */

import type { Chapter } from './encounters.ts';
import { fiendSuperbossBuild } from './ffx2/builds/fiend-superbosses.ts';
import { act1ShinraGroup, x2AlmightyShinra, x2NumerusDuo, x2NumerusQuattour, x2NumerusTria, x2NumerusUnum } from './ffx2/enemies/fiend-superbosses.ts';
import {
  FIEND_SUPERBOSSES_ID,
  FIEND_SUPERBOSSES_SCENE,
  X2_ALMIGHTY_SHINRA_ID,
  X2_NUMERUS_DUO_ID,
  X2_NUMERUS_QUATTOUR_ID,
  X2_NUMERUS_TRIA_ID,
  X2_NUMERUS_UNUM_ID,
} from './fiend-superbosses-ids.ts';
import { ffx2FiendSuperbossesScripts } from '../story/scripts/ffx2-fiend-superbosses.ts';

export { FIEND_SUPERBOSSES_ID } from './fiend-superbosses-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-fiend-superbosses.ts`, both read them). Our own words over the sourced beats. */
export const FIEND_SUPERBOSSES_TEXT = {
  title: 'The Fiend Arena Superbosses',
  subtitle: 'Two fights at the top of the arena, and one of them has four heads',
  location: 'The Fiend Arena — a stand-in stage',
  blurb:
    'The arena keeps its two strongest fighters for the end: a boy grown to the size of the hall, who repeats himself on purpose, and then four heads on one frame, each with its own song. ' +
    'The arena mends the girls between them, and nothing else will.',
} as const;

/** The chapter record. */
export const FFX2_FIEND_SUPERBOSSES: Chapter = {
  id: FIEND_SUPERBOSSES_ID,
  game: 'ffx2',
  number: 53, // the program plan's number for this row (hidden chapters 34 on); the card would say EXP, not LIII (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...FIEND_SUPERBOSSES_TEXT,
  sceneKey: FIEND_SUPERBOSSES_SCENE,
  thumbnailKey: 'chapter-ffx2-fiend-superbosses',
  buildRef: fiendSuperbossBuild,
  enemyGroupRef: act1ShinraGroup,
  scriptsRef: ffx2FiendSuperbossesScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (the Den of Woe's own is the same placeholder)
    battle: 'boss-trema', // a flagged stand-in (LG9): the Fiend Arena's superboss cue; Bailey's ears decide
    victory: 'victory-ffx2',
  },
  // The Sensor lines are the enemy records' own (written in `./ffx2/enemies/fiend-superbosses.ts`); the three hidden parts are never targeted, so they carry none.
  sensorTexts: {
    [X2_ALMIGHTY_SHINRA_ID]: x2AlmightyShinra.sensorText ?? '',
    [X2_NUMERUS_UNUM_ID]: x2NumerusUnum.sensorText ?? '',
    [X2_NUMERUS_DUO_ID]: x2NumerusDuo.sensorText ?? '',
    [X2_NUMERUS_TRIA_ID]: x2NumerusTria.sensorText ?? '',
    [X2_NUMERUS_QUATTOUR_ID]: x2NumerusQuattour.sensorText ?? '',
  },
};
