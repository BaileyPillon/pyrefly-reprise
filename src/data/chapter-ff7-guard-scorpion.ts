/**
 * The hidden FF7 experiment: Guard Scorpion at the No. 1 Reactor core.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Bailey, 2026-09-27 ~00:35 EDT:
 * "go with guard scorpion first, full speed ahead, but make it a hidden
 * selectable encounter since it's experimental ... dont make it so obvious on
 * the encounter/chapter menu". Registered through `./chapters-unlisted.ts`, so
 * `getChapter` and `__pyrefly.gotoChapter` find it and nothing on the board
 * does: no card, no count, no ribbon, no group (`number: 0`). The way in is the
 * secret door Bailey approved (`app/screens/frontend/secretDoor.ts`), behind
 * `FF7_EXPERIMENT_READY` (`app/experiments/`) until the FF7 engine and HUD exist.
 *
 * Nothing here is shown today, so the words are plain facts from the research
 * (`research/ff7-guard-scorpion.md` §1, §10), not card copy. `music` is silence
 * (`null`): the retail cue may never ship (rule 8, gs §11) and an original one
 * needs Bailey's ear (rule 13). `sceneKey` names the planned scene
 * (`src/scenes/sector1-reactor.ts`, not built; the painted loader stands in).
 */

import type { Chapter } from './encounters.ts';
import { sector1ReactorBuild } from './ff7/builds/sector1-reactor.ts';
import { guardScorpionGroup } from './ff7/enemies/guard-scorpion.ts';
import { ff7GuardScorpionScripts } from '../story/scripts/ff7-guard-scorpion.ts';

export const FF7_GUARD_SCORPION: Chapter = {
  id: 'ff7-guard-scorpion',
  game: 'ff7',
  number: 0,
  experimental: true,
  title: 'Guard Scorpion',
  subtitle: 'The first boss of the bombing mission',
  location: 'No. 1 Reactor, the core',
  blurb: 'Cloud and Barret at the core of the No. 1 Reactor.',
  sceneKey: 'sector1-reactor',
  thumbnailKey: 'chapter-ff7-guard-scorpion',
  buildRef: sector1ReactorBuild,
  enemyGroupRef: guardScorpionGroup,
  scriptsRef: ff7GuardScorpionScripts,
  music: { scene: null, battle: null },
  sensorTexts: {},
};
