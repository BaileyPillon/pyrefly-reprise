/**
 * **Wendigo**: a NEW, HIDDEN FFX chapter (branch `ch-wendigo`, built 2026-11-06; hidden chapter number 49, the Meshy tech-demo chapter): Wendigo and its two Guado Guardians on frozen Lake Macalania (`maca02_01`), the
 * fight between the Temple and the lake bottom.
 *
 * Bailey, 2026-11-06: "make 1 brand new chapter using meshy extensively please", then "like a tech demo"; earlier "you can spend as much meshy credits as you see fit. use your own judgment." The driver's pick of the
 * subject (his to overturn): card B, **the Wendigo on frozen Lake Macalania**, FFX only, the party moved by the real FFX animations retargeted onto the Meshy rigs, every model Meshy's, desktop only, the hidden word
 * `wendigo`. The paper preflight is `docs/plans/ch-wendigo-review.md`; the game's rules are `research/re-ffx-wendigo-lake-macalania.md`. This record is the **battle side** (the engine, the data, the door, the guide and
 * the tactic); the Meshy 3D stage is the next lane's, and until it lands the fight plays on the Macalania Temple's painted stage with procedural stand-ins (`../scenes/wendigo-lake.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, aeons and the FFX status set; the fight comes after the Temple and before the party wakes on the lake bottom. FFX-2 has no counterpart.
 *
 * **The fight in one paragraph.** Eighteen thousand HP and a punch that kills a full-HP member, with two Guado Guardians whose whole job is to keep it that way. They Berserk it at once (a Berserk Wendigo throws one
 * punch and a half, and nothing else), cure its blindness, drink a potion when hit, and cast a last shield on it as they fall. Under half HP it raises its arms for three turns and answers every physical blow it takes,
 * unless an aeon stands on the field; and while its arms are up the Guardians Berserk your party into that counter. The answer is to take its fury out: Power Break and Protect on the front line, Steal from the Guardians
 * so their potions and drops dry up, Darkness once they are gone, an aeon when the arms go up.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Sanctuary Keeper and Penance are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { wendigoBuild } from './ffx/builds/wendigo.ts';
import { wendigoGroup } from './ffx/enemies/wendigo.ts';
import { wendigoScripts } from '../story/scripts/wendigo.ts';
import { LAKE_GUARDIAN_A_ID, LAKE_GUARDIAN_B_ID, WENDIGO_CHAPTER_ID, WENDIGO_ID, WENDIGO_SCENE } from './ffx/wendigo-ids.ts';

export { WENDIGO_CHAPTER_ID, WENDIGO_SCENE }; // the ids live in `./ffx/wendigo-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-wendigo.ts`, both read them). Our own words over the research's sourced rules; no number in them. */
export const WENDIGO_TEXT = {
  title: 'Wendigo',
  subtitle: 'Take the fury out of it',
  blurb:
    'The Guado cannot let the pilgrimage cross the lake, so they send a brute and two keepers to make it hit harder. ' +
    'Weaken the blows, rob the keepers, and keep the arms from answering.',
} as const;

/** The sensor lines, one per combatant: our own words, in-world advice that is allowed to be wrong (writing bible 5.3). */
export const WENDIGO_SENSOR_TEXTS: Record<string, string> = {
  [WENDIGO_ID]: 'It hits like a falling wall. Take the fury out of it, and keep its Guardians from putting it back.',
  [LAKE_GUARDIAN_A_ID]: 'A Guado retainer. It keeps its master furious and mends him, and it casts a last shield for him as it falls.',
  [LAKE_GUARDIAN_B_ID]: 'A Guado retainer. It keeps its master furious and mends him, and it casts a last shield for him as it falls.',
};

/**
 * Number 49: the program plan's row (49), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the eyebrow EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const WENDIGO: Chapter = {
  id: WENDIGO_CHAPTER_ID,
  game: 'ffx',
  number: 49,
  experimental: true,
  ...WENDIGO_TEXT,
  location: 'Lake Macalania — the frozen lake',
  sceneKey: WENDIGO_SCENE,
  thumbnailKey: 'chapter-seymour-anima-macalania', // a stand-in: Chapter VII's card (the same snows); the chapter's own card is owed (`docs/handoff/ch-wendigo.md`)
  buildRef: wendigoBuild,
  enemyGroupRef: wendigoGroup,
  scriptsRef: wendigoScripts,
  music: {
    // The Temple's bed under the scenes; the boss cue is `boss-challenge`, the neutral FFX boss cue, as a flagged stand-in (RE 2: the battle's own theme is not read; rule 13: Bailey's ear).
    scene: 'scene-macalania-temple',
    battle: 'boss-challenge',
    victory: 'victory-ffx',
  },
  sensorTexts: WENDIGO_SENSOR_TEXTS,
};
