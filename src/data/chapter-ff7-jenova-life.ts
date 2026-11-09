/**
 * **Jenova LIFE at the Forgotten Capital**: a NEW, HIDDEN FF7 chapter (branch `ch-jenova-life`, built 2026-11-07; hidden chapter number 44): the boss at the end of Disc 1, fought on the altar right after Aerith's death.
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too" (every researched boss he never picked, FF7 included); 2026-11-07: "ok keep going we have full usage here";
 * and, on FF7, 2026-09-27: the art must be "higher fidelity than the original", with crisp menus and eye candy. The driver's decisions under those words are in `docs/handoff/ch-jenova-life.md` ("driver's call, his to overturn"): the
 * chapter ships **hidden behind the typed word `bluelight`** (J1), hidden chapter **number 44**, FF7 only, the party **Cloud, Tifa and Barret** at Level 38 (J2, J3), the leaner Materia set (J4), no Water Ring and no Reflect on the party
 * (J5, J6), the Limit chain with every reel a Hit (J7), RETRY straight back in (J8), the altar plate and the scenes **owed** (J10, J14: a stand-in plate and silent music), no boss number touched. The paper preflight is
 * `docs/plans/ch-jenova-life-review.md`; the game's rules are `research/ff7-jenova-life.md`.
 *
 * **Game case: FF7 only** [AGENTS.md rule 14]: the original 1997 fight (Remake's and Rebirth's are different and unused); ATB, Materia and the Limit gauge. Nothing here applies to FFX or FFX-2.
 *
 * **The fight in one paragraph.** Ten thousand HP, Water absorbed (it heals her) and Earth her weakness, and three moves that are all Water magic: Blue Light (a double one time in five), Blue Flame, and every few turns Aqualung on all three of you for
 * about a thousand each. Her turns come about 1.6 times as often as one of yours. The first spell that hits her lands, and a moment later she casts Reflect on herself: from then on every spell you cast at her turns on its caster, and a Bolt3 into the
 * Reflect kills the caster. Blows and Limits are not spells and go through. Her 300 MP is her only budget (8, 12 and 34 a move, 30 held back for the Reflect), so a long fight dries her up; MBarrier halves what she throws.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Guard Scorpion is not (but with a typed word instead of the secret door): `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it (`./chapters-experiments.ts`) and
 * `getChapter` finds it. The door is open while the FF7 switch is on (`app/experiments/ff7Flag.ts`).
 */

import type { Chapter } from './encounters.ts';
import { forgottenCapitalBuild } from './ff7/builds/forgotten-capital.ts';
import { jenovaLifeGroup } from './ff7/enemies/jenova-life.ts';
import { FORGOTTEN_CAPITAL_SCENE, JENOVA_LIFE_CHAPTER_ID, JENOVA_LIFE_ID } from './ff7/jenova-life-ids.ts';
import { ff7JenovaLifeScripts } from '../story/scripts/ff7-jenova-life.ts';

export { JENOVA_LIFE_CHAPTER_ID, FORGOTTEN_CAPITAL_SCENE };

/** The card's words (the chapter record reads them; there is no pause record for an FF7 chapter). Our own words over the research's sourced rules; no number in them. */
export const JENOVA_LIFE_TEXT = {
  title: 'Jenova LIFE',
  subtitle: 'The altar of the Forgotten Capital',
  blurb:
    'It rises from the black water at the end of the first night, and every spell you send it comes back. ' +
    'Strike it, do not cast at it, and keep the water off your party.',
} as const;

/**
 * Number 44: the program plan's row (41 to 43 and 45 on are the sibling chapter lanes'), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number.
 */
export const FF7_JENOVA_LIFE: Chapter = {
  id: JENOVA_LIFE_CHAPTER_ID,
  game: 'ff7',
  number: 44,
  experimental: true,
  ...JENOVA_LIFE_TEXT,
  location: 'The Forgotten Capital — the altar',
  sceneKey: FORGOTTEN_CAPITAL_SCENE,
  thumbnailKey: 'chapter-ff7-guard-scorpion', // a stand-in: the Guard Scorpion's card; the chapter's own card is owed (`docs/handoff/ch-jenova-life.md`, the art list)
  buildRef: forgottenCapitalBuild,
  enemyGroupRef: jenovaLifeGroup,
  scriptsRef: ff7JenovaLifeScripts,
  // Silence: the original plays "Aerith's Theme" through the scene and the fight, a retail cue; an original take needs Bailey's ear (rules 8, 13; pick J13).
  music: { scene: null, battle: null },
  sensorTexts: {
    [JENOVA_LIFE_ID]: 'It is made of the water it stands in. Spells turn back on you; blows do not.',
  },
};
