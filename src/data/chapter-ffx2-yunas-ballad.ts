/**
 * **Yuna's Ballad** (the possessed Rikku and the possessed Paine, fought by Yuna alone: the first two of the Den of Woe's five back-to-back fights; FFX-2's Chapter 5 mission in the cave under Mushroom Rock Road), a hidden
 * chapter (branch `ch-yunas-ballad`).
 *
 * Bailey, 2026-11-06 (relayed by the release driver, verbatim): "implement all unimplemented chapters please" (~00:30 EST) and "yes on all these too" (~00:55 EST, to building every researched boss he never picked); and,
 * 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." The driver's decisions, each the paper preflight's own recommendation (`docs/plans/ch-wraith-review.md`;
 * `docs/handoff/ch-yunas-ballad.md` lists every pick with its alternative, "driver's call, his to overturn"): hidden behind the typed word **`wraith`** (`../app/screens/frontend/wraithDoor.ts`), chapter number **40**,
 * listing it on the board waits for his word (YB10); two links (YB1), Yuna alone (YB4), HP and MP carried from the first duel to the second (YB2), the Den's own kit (YB3), the Den's own stage and plate (YB6), the Den's
 * cue (YB8).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 254 and 256 (`research/re-ffx2-yunas-ballad.md`). The shared plumbing it touches (the board's door table, the chapter registry, the
 * widened party of one) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * - `buildRef` - Yuna alone, as the Den of Woe's kit has her (`./ffx2/builds/yunas-ballad.ts`).
 * - `enemyGroupRef` - duel 1's possessed Rikku; the chain follows `nextGroupId`: the possessed Paine (`./ffx2/enemies/yunas-ballad.ts`). Duel 2 is entered with the HP and MP of the first, and is the retry checkpoint.
 * - `sceneKey` - the Den of Woe's own (`../scenes/den-of-woe.ts`): the game fights the duels in the same map as the three shades.
 * - `scriptsRef` - the story, a DRAFT for Bailey's read (`../story/scripts/ffx2-yunas-ballad.ts`).
 * - `music` - existing cues only: the FFX-2 field bed, `boss-den-of-woe` (the Den's cue, a flagged stand-in for the duels) and the FFX-2 fanfare. Bailey's ears (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the nineteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 * A clear goes to the experiments' own store (`experimental: true`), never the save: no save change, no migration.
 */

import type { Chapter } from './encounters.ts';
import { yunasBalladBuild } from './ffx2/builds/yunas-ballad.ts';
import { rikkuDuelGroup } from './ffx2/enemies/yunas-ballad.ts';
import { X2_POSSESSED_PAINE_ID, X2_POSSESSED_RIKKU_ID, YUNAS_BALLAD_ID, YUNAS_BALLAD_SCENE } from './yunas-ballad-ids.ts';
import { ffx2YunasBalladScripts } from '../story/scripts/ffx2-yunas-ballad.ts';

export { YUNAS_BALLAD_ID } from './yunas-ballad-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-yunas-ballad.ts`, both read them). Our own words over the sourced beats. */
export const YUNAS_BALLAD_TEXT = {
  title: "Yuna's Ballad",
  subtitle: 'Two friends who cannot see her, and one girl who will not look away',
  location: 'Den of Woe — under Mushroom Rock Road',
  blurb:
    'The pyreflies in the sealed cave have taken Rikku and Paine, and each of them thinks Yuna is a guard with a gun. ' +
    'There is no one else to stand in front of them. Two fights, no rest between, and the same girl at the end of both.',
} as const;

/** The chapter record. */
export const FFX2_YUNAS_BALLAD: Chapter = {
  id: YUNAS_BALLAD_ID,
  game: 'ffx2',
  number: 40, // the program plan's number (section 4); after the other hidden chapters (19 to 32); the card would say EXP, not XL (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...YUNAS_BALLAD_TEXT,
  sceneKey: YUNAS_BALLAD_SCENE,
  thumbnailKey: 'chapter-ffx2-yunas-ballad',
  buildRef: yunasBalladBuild,
  enemyGroupRef: rikkuDuelGroup,
  scriptsRef: ffx2YunasBalladScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed, and the Den's own
    battle: 'boss-den-of-woe', // the Den's cue (YB8), a flagged stand-in for the duels; alternative: `boss-shuyin` for Paine only
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [X2_POSSESSED_RIKKU_ID]: 'Her throws are all one size. Four in ten are a flurry; the rest are fire, ice, lightning, water and a grenade.',
    [X2_POSSESSED_PAINE_ID]: 'One sword stroke at whoever has the most HP, and a long breath between. Her blade is armoured; her mind is not.',
  },
};
