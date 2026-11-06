/**
 * **The Flooded Ways**: a NEW, HIDDEN FFX chapter (branch `ch-flooded-ways`, built 2026-11-06; hidden chapter number 36): Evrae Altana and the two Gate Locks in the flooded tunnels of the Via Purifico (three areas, one
 * Evrae), then Geosgaeno in the Baaj Temple (the second, winnable fight), with the three who can swim: Tidus, Wakka and Rikku.
 *
 * Bailey, relayed by the release driver, verbatim: "implement all unimplemented chapters please" (2026-11-06 about 00:30 EST), "yes on all these too" (to building every researched boss he never picked; about 00:55 EST),
 * and "you make the executive decisions for the next few days. i'll go with all of your recommendations" (2026-10-31). The picks (GV1 to GV12) are in `docs/plans/ch-geosgaeno-review.md` and the handoff
 * `docs/handoff/ch-flooded-ways.md` ("driver's call, his to overturn"): one chapter, two places in story order, hidden behind the word `geosgaeno`, not listed.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: both fights are FFX's; CTB, the Trigger-style commands and the FFX status set. FFX-2 has none of them (`research/re-ffx-geosgaeno-evrae-altana.md`).
 *
 * **The fights in one paragraph.** Under Bevelle the three swimmers fight an Evrae that is already dead: a Zombie, so healing is damage and two Phoenix Downs end it. It gazes (a Petrify that, **in the water, shatters whoever it
 * lands on**) and rains light in turn, and in the first two areas it strikes back at whoever wounds it; two Gate Locks stand in each of those areas, and opening both carries the party on with Evrae's HP as it was and the
 * shattered returned. In the Baaj Temple, Geosgaeno, armoured and weak to every element, punches three times and **swallows one of the party**: the swallowed one can only Struggle (which costs them their place and spares the
 * rest) or Defend, and next turn it spits them out for their HP minus 1 on all three. Kill it while it holds someone and it bursts for 9,999 on everyone.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Spectral Keeper and the Dark Aeons are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { swimmersBuild } from './ffx/builds/swimmers.ts';
import { FLOODED_GROUPS } from './ffx/enemies/flooded-ways-groups.ts';
import { floodedWaysScripts } from '../story/scripts/flooded-ways.ts';
import { EVRAE_ALTANA_ID, FLOODED_WAYS_CHAPTER_ID, FLOODED_WAYS_SCENE, GEOSGAENO_ID } from './ffx/flooded-ways-ids.ts';

export { FLOODED_WAYS_CHAPTER_ID, FLOODED_WAYS_SCENE }; // the ids live in `./ffx/flooded-ways-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-flooded-ways.ts`, both read them). Our own words over the research's sourced beats; no number in them. */
export const FLOODED_WAYS_TEXT = {
  title: 'The Flooded Ways',
  subtitle: 'Only three of them can swim',
  blurb:
    'Under Bevelle the water stands to the ceiling, and a dead Evrae guards the gates. Far from there, in a temple under the sea, something swallows one of you whole. ' +
    'Stone breaks in the water. Healing hurts the dead. What is inside decides what the rest of you take.',
} as const;

/**
 * Number 36: past the Spectral Keeper's 29, the Fallen Maesters' 30, the hidden 3D Bahamut's 31, the Wind Waker's 32 and the wave-one lanes' 33 (anime), 34 (Dark Aeons) and 35 (Penance), so no two chapters share a number
 * (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the eyebrow EXPERIMENTAL (`ui/common/roman.ts`).
 */
export const FLOODED_WAYS: Chapter = {
  id: FLOODED_WAYS_CHAPTER_ID,
  game: 'ffx',
  number: 36,
  experimental: true,
  ...FLOODED_WAYS_TEXT,
  location: 'The Via Purifico and the Baaj Temple',
  sceneKey: FLOODED_WAYS_SCENE,
  thumbnailKey: 'chapter-flooded-ways', // a key only (the card and thumbnail are held until Bailey's word to list the chapter): nothing loads it while the chapter is hidden
  buildRef: swimmersBuild,
  enemyGroupRef: FLOODED_GROUPS[0]!,
  scriptsRef: floodedWaysScripts,
  music: {
    // No source names these fights' cues (the game plays its Boss Theme for all five launches). The scenes are silent beds; each link's cue is its formation's (`data/ffx/enemies/flooded-ways-groups.ts`:
    // `battle-ffx`). Existing cues by reference, flagged stand-ins; Bailey's ear decides (rule 13).
    scene: 'scene-gagazet', // the Via Purifico chapter's own bed (Isaaru's, Natus's): no source names a bed for these places
    battle: 'battle-ffx',
    victory: 'victory-ffx',
  },
  // Duplicated from the enemy records' own `sensorText` (`./ffx/enemies/flooded-ways.ts`), as the `Chapter` contract asks.
  sensorTexts: {
    [EVRAE_ALTANA_ID]: 'It is dead already. What heals the living hurts it.',
    [GEOSGAENO_ID]: 'It swallows one of you whole. What it does next depends on what the one inside does.',
  },
};
