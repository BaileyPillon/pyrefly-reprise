/**
 * **The Omega Ruins**: a NEW, HIDDEN FFX chapter (branch `ch-omega-ruins`, built 2026-11-06; hidden chapter number 43): Ultima Weapon, Omega Weapon and Nemesis, three fights in a row (`omeg00_10`, `omeg01_10`, `zzzz02_76`).
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too" (to building every researched boss he never picked); and, 2026-10-31, "you make the executive decisions
 * for the next few days. i'll go with all of your recommendations." The driver's decisions under those words are in `docs/handoff/ch-omega-ruins.md` ("driver's call, his to overturn"): the chapter ships **hidden behind the
 * typed word `weapon`** (WP1), hidden chapter **number 43**, FFX only, **one three-act chain** (WP2) with the party and the aeons restored between the acts, the Mirror Aeons party with the preset levers the bench set (WP3),
 * the Cavern of the Stolen Fayth's plate for all three acts (WP5 (a)), the hidden counters and Nemesis's reply hidden as in the game (WP7), aeons allowed (WP8), Yojimbo and the Sisters on the roster (WP9), stand-in music
 * (WP10), Normal start (WP11), the paintings owed (WP6: **not painted yet, stand-ins**), no boss number touched. The paper preflight is `docs/plans/ch-weapon-review.md`; the game's rules are
 * `research/re-ffx-omega-ultima-nemesis.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the Omega Ruins and the Monster Arena's last creation, CTB, aeons and the FFX status set. FFX-2 has none of these monsters and nothing here applies to it.
 *
 * **The chapter in one paragraph.** Three guardians, one after the other. Ultima Weapon keeps a fixed six-turn round and does not react to anything but an aeon on the field (which swaps its curses for more spells). Omega Weapon
 * absorbs all five elements, takes no ailment, and counts: every Attack it throws adds five to a hidden count and every special two, and at thirty it burns the whole line with Nova. Nemesis acts every nine ticks, kills with every
 * blow, and has a count of its own that ends in Armageddon on all of you; it answers every special-class command (every Overdrive, every Mix, every Steal) with an Ultima on the whole line. Against the endgame party the first two
 * are checks of preparation and **only the third act is a fight**: the answer is Auto-Life on all three, a Piercing weapon, and no flourish.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Spectral Keeper and the Sanctuary Keeper are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it. Listing it later is moving this record into `CHAPTERS` (`docs/handoff/ch-omega-ruins.md` has the steps).
 */

import type { Chapter } from './encounters.ts';
import { omegaRuinsBuild } from './ffx/builds/omega-ruins.ts';
import { ultimaWeaponGroup } from './ffx/enemies/weapons-groups.ts';
import { omegaRuinsScripts } from '../story/scripts/omega-ruins.ts';
import { NEMESIS_ID, OMEGA_RUINS_CHAPTER_ID, OMEGA_RUINS_SCENE, OMEGA_WEAPON_ID, ULTIMA_WEAPON_ID } from './ffx/omega-ruins-ids.ts';

export { OMEGA_RUINS_CHAPTER_ID, OMEGA_RUINS_SCENE }; // the ids live in `./ffx/omega-ruins-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-omega-ruins.ts`, both read them). Our own words over the research's sourced rules; no number in them. */
export const OMEGA_RUINS_TEXT = {
  title: 'The Omega Ruins',
  subtitle: 'The oldest guardians do not sleep',
  blurb:
    'Under the world lie the ruins of the oldest war. Two machines keep the way, and past them waits the last creation, built to end every battle it joins. ' +
    'Come ready to stand twice.',
} as const;

/**
 * Number 43: the program plan's row (33 to 42 and 44 on are the sibling chapter lanes'), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the eyebrow
 * EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const OMEGA_RUINS: Chapter = {
  id: OMEGA_RUINS_CHAPTER_ID,
  game: 'ffx',
  number: 43,
  experimental: true,
  ...OMEGA_RUINS_TEXT,
  location: 'The Omega Ruins',
  sceneKey: OMEGA_RUINS_SCENE,
  thumbnailKey: 'chapter-yojimbo-cavern', // a stand-in: the cavern's card (the plate is the cavern's); the chapter's own card is owed (`docs/handoff/ch-omega-ruins.md`, the art list)
  buildRef: omegaRuinsBuild,
  enemyGroupRef: ultimaWeaponGroup,
  scriptsRef: omegaRuinsScripts,
  music: {
    // The Dome's bed under the scenes (ruins; exists) and `boss-challenge` for the two Weapons, flagged stand-ins (preflight section 7; rule 13: Bailey's ear). Nemesis's group starts `boss-yu-yevon` (the alternative: `boss-sin-assault`).
    scene: 'scene-zanarkand-dome',
    battle: 'boss-challenge',
    phase2: 'boss-yu-yevon',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy records' own `sensorText` (`./ffx/enemies/weapons.ts`), as the `Chapter` contract asks.
  sensorTexts: {
    [ULTIMA_WEAPON_ID]: 'An old engine of war, waiting. It strikes by a fixed round; an aeon in front of you changes the round.',
    [OMEGA_WEAPON_ID]: 'Every element feeds it, and no ailment takes. Something in it is gathering.',
    [NEMESIS_ID]: 'The last of the creations. It acts as fast as you do, and it does not stop.',
  },
};
