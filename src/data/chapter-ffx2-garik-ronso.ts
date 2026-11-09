/**
 * **Garik Ronso** (FFX-2 Chapter 3, the mission "Battle Blockade": Garik and the Ronso Youths at the top of Mt. Gagazet), a hidden chapter, number 47 (branch `ch-garik-ronso`).
 *
 * Authority (relayed by the release driver, verbatim): "implement all unimplemented chapters please" (2026-11-06), "yes on all these too" (every researched boss he never picked), 2026-11-07 "ok keep going we have full usage
 * here" and, 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." The driver's decisions, each the paper preflight's own recommendation (`docs/plans/ch-lionheart-review.md`;
 * `docs/handoff/ch-garik-ronso.md` lists every pick with its alternative, "driver's call, his to overturn"): hidden behind the typed word **`braveheart`** (`../app/screens/frontend/braveheartDoor.ts`), chapter number **47**, listing it on
 * the board waits for his word (GA9); the summit fight with **both outcomes** the game gives (GA1), chosen by a two-value setting, **Ronso trust**, low (the hostile fight) by default (GA2); the Djose preset unmodified (GA3);
 * each script exactly as the game has it (GA4).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, Curse as "cannot change dressphere", and the FFX-2 monster rows 181 and 182 (`research/re-ffx2-garik-ronso.md`). The shared plumbing it touches (the board's door
 * table, the chapter registry, the scene table) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * - `buildRef` - the Djose preset, Yuna 32, Rikku 33, Paine 34 (`./ffx2/builds/garik-ronso.ts`), levels `[estimate]`.
 * - `enemyGroupRef` - **a getter over the setting** (`./garik-ronso-trust.ts`): the hostile fight (two Youths and Garik) with Ronso trust low, the default, or the friendly bout (one Youth and Garik) with it high. One link either way,
 *   nothing chained; a defeat retries the same fight.
 * - `sceneKey` - the summit of Mt. Gagazet under the FFX-2 camera (`../scenes/gagazet-summit.ts`) on Chapter I's `gagazet` plate, a flagged stand-in (the summit has none of its own).
 * - `scriptsRef` - the story, a DRAFT for Bailey's read (`../story/scripts/ffx2-garik-ronso.ts`).
 * - `music` - existing cues only: the FFX-2 field bed, `boss-ffx2-fallen-aeons` (our own take, the duel cue; the Ronso chapter's is the alternative) and the FFX-2 fanfare. Bailey's ears (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the nineteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 * A clear goes to the experiments' own store (`experimental: true`), never the save: no save change, no migration.
 */

import type { Chapter } from './encounters.ts';
import type { EnemyGroupDef } from '../battle/common/types.ts';
import { garikRonsoBuild } from './ffx2/builds/garik-ronso.ts';
import { garikFirstGroup } from './garik-ronso-trust.ts';
import { GARIK_RONSO_ID, GARIK_RONSO_SCENE, X2_GARIK_BOUT_ID, X2_GARIK_ID, X2_YOUTH_A_ID, X2_YOUTH_B_ID, X2_YOUTH_BOUT_ID } from './garik-ronso-ids.ts';
import { x2GarikRonso, x2GarikRonsoBout, x2RonsoYouthA, x2RonsoYouthB, x2RonsoYouthBout } from './ffx2/enemies/garik-ronso.ts';
import { ffx2GarikRonsoScripts } from '../story/scripts/ffx2-garik-ronso.ts';

export { GARIK_RONSO_ID } from './garik-ronso-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-garik-ronso.ts`, both read them). Our own words over the sourced beats. */
export const GARIK_RONSO_TEXT = {
  title: 'Garik Ronso',
  subtitle: 'The mountain remembers how you spoke to it',
  location: 'Mt. Gagazet — the summit',
  blurb:
    'Garik has shut the teleporters and waits at the top with his lance across the path. ' +
    'How the Ronso were treated on the way up decides what he brings: one Youth and a bout, or two Youths and a fight. Same mountain, same lance.',
} as const;

/** Garik Ronso's chapter record. */
export const FFX2_GARIK_RONSO: Chapter = {
  id: GARIK_RONSO_ID,
  game: 'ffx2',
  number: 47, // the program plan's number for this row (hidden chapters 34 on); the card would say EXP, not XLVII (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...GARIK_RONSO_TEXT,
  sceneKey: GARIK_RONSO_SCENE,
  thumbnailKey: 'chapter-ffx2-garik-ronso',
  buildRef: garikRonsoBuild,
  /** The formation the Ronso trust setting names, read each time the record is read (the hostile fight by default). */
  get enemyGroupRef(): EnemyGroupDef {
    return garikFirstGroup();
  },
  scriptsRef: ffx2GarikRonsoScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed
    battle: 'boss-ffx2-fallen-aeons', // our own duel cue (GA8), a flagged stand-in; alternative: the Ronso chapter's
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [X2_GARIK_ID]: x2GarikRonso.sensorText ?? '',
    [X2_YOUTH_A_ID]: x2RonsoYouthA.sensorText ?? '',
    [X2_YOUTH_B_ID]: x2RonsoYouthB.sensorText ?? '',
    [X2_GARIK_BOUT_ID]: x2GarikRonsoBout.sensorText ?? '',
    [X2_YOUTH_BOUT_ID]: x2RonsoYouthBout.sensorText ?? '',
  },
};
