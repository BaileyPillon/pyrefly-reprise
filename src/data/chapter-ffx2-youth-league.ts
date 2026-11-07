/**
 * **The Youth League Tournament** (Mushroom Rock Road, FFX-2 Chapter 5: Yaibal, four mobs, Elma and Lucil, seven fights in a row; `monster.bin` rows 183, 184, 279, 210, 211, 193, 214 and 215), a hidden chapter
 * (branch `ch-youth-league`).
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too" (to building every researched boss he never picked); 2026-10-31: "you make the executive decisions
 * for the next few days. i'll go with all of your recommendations." The driver's decisions, each the paper preflight's own recommendation (`docs/handoff/ch-youth-league.md` lists every pick with its alternative,
 * "driver's call, his to overturn"): hidden behind the typed word **`youth`** (`../app/screens/frontend/youthDoor.ts`), chapter number **42**, listing it on the board waits for his word; the seven Chapter 5 acts only
 * (YL1: Elma row 185 belongs to the other path of Chapter 2); the Chapter V preset, unmodified, measured (YL2); all seven acts unbroken with the party carried whole (YL3); a loss retries the act from the state the party
 * entered it (YL4); no Escape (YL5); every script as the game wrote it (YL6); the Den of Woe's stage as a flagged stand-in (YL7); a flagged stand-in cue (YL8).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows (`research/re-ffx2-youth-league-tournament.md`). The shared plumbing it touches (the board's door table, the chapter
 * registry, the kill-reward item table, the FFX-2 trigger `all-ko`) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * - `buildRef` — the Chapter V preset, as it is (`./ffx2/builds/youth-league.ts`).
 * - `enemyGroupRef` — act 1's Yaibal; the chain follows `nextGroupId` through the seven acts (`./ffx2/enemies/youth-league.ts`). Acts 2 to 7 carry the party whole and are the retry checkpoints; act 7, Lucil, is the last
 *   link: **her fall ends the tournament** (results, the closing words).
 * - `sceneKey` — the Den of Woe's own stage (`../scenes/den-of-woe.ts`): the files name the map "Mushroom Rock Road side path (first half)", for which the repo has a plate that belongs to the FFX chapter; a plain
 *   arena with human-sized foes stands in (YL7; the derived `mushroom-rock-road-league` plate is on the art list).
 * - `scriptsRef` — the story, a DRAFT for Bailey's read (`../story/scripts/ffx2-youth-league.ts`).
 * - `music` — existing cues only: the FFX-2 field bed, `boss-ffx2-fallen-aeons` (the brass-and-drums duel cue: a flagged stand-in) and the FFX-2 fanfare. Bailey's ears (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the nineteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 * A clear goes to the experiments' own store (`experimental: true`), never the save: no save change, no migration.
 */

import type { Chapter } from './encounters.ts';
import { youthLeagueBuild } from './ffx2/builds/youth-league.ts';
import { act1YaibalGroup, KINDS } from './ffx2/enemies/youth-league.ts';
import { ACT_ENEMY_IDS, ACT_TYPES, YOUTH_LEAGUE_ID, YOUTH_LEAGUE_SCENE } from './youth-league-ids.ts';
import { ffx2YouthLeagueScripts } from '../story/scripts/ffx2-youth-league.ts';

export { YOUTH_LEAGUE_ID } from './youth-league-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-youth-league.ts`, both read them). Our own words over the sourced beats. */
export const YOUTH_LEAGUE_TEXT = {
  title: 'The Youth League Tournament',
  subtitle: 'Seven bouts down the road, and nothing mends you between them',
  location: 'Mushroom Rock Road — a stand-in stage',
  blurb:
    'The Youth League has chalked a bracket on the cliff road: a young man with a sword, a few mages, veterans and slashers, then Elma, then Lucil. ' +
    'Seven fights, one after another, and whatever you spent in the first is gone for the last.',
} as const;

/** One Sensor line per fighter of the chapter: the type's own line (the enemy records carry the same strings). */
const SENSOR_TEXTS: Record<string, string> = Object.fromEntries(
  ACT_ENEMY_IDS.flatMap((ids, act) => ids.map((id, slot) => [id, KINDS[ACT_TYPES[act]![slot]!].sensorText] as const)),
);

/** The chapter record. */
export const FFX2_YOUTH_LEAGUE: Chapter = {
  id: YOUTH_LEAGUE_ID,
  game: 'ffx2',
  number: 42, // the hidden chapters' numbers are the program plan's (41 is Spherimorph's); the card would say EXP, not XLII (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...YOUTH_LEAGUE_TEXT,
  sceneKey: YOUTH_LEAGUE_SCENE,
  thumbnailKey: 'chapter-ffx2-youth-league',
  buildRef: youthLeagueBuild,
  enemyGroupRef: act1YaibalGroup,
  scriptsRef: ffx2YouthLeagueScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (the Den of Woe's own is the same placeholder)
    battle: 'boss-ffx2-fallen-aeons', // a flagged stand-in (YL8): the repo's brass-and-drums duel cue; Bailey's ears decide
    victory: 'victory-ffx2',
  },
  sensorTexts: SENSOR_TEXTS,
};
