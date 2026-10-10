/**
 * **The hidden chapters' scenes, in one side table** (`./index.ts` adds them to its registry with one loop and one spread). The registry file is over the house 400 lines, and a hidden chapter's
 * scene should not grow it, so the rows of the chapters that have no card on the board live here:
 *
 * - the experimental Leblanc chapter's room (FFX-2 only): Chapter VI's room over its own plate and art namespace (`./exp-leblanc-last-room.ts`);
 * - the Experiment's grounds (FFX-2 only): the Machine Faction's grounds at Djose Temple, on a provisional plate (`./experiment-grounds.ts`, `../data/experiment-plates.ts`);
 * - Mushroom Rock Road (FFX only): the hidden Sinspawn Gui chapter, on a provisional plate (`./mushroom-rock-road.ts`);
 * - the hidden Fayth chapter's deck (FFX only): Chapter VIII's deck with a camera director on it (`./exp-fayth-deck.ts`).
 *
 * Each row is real (the factory wins); `build` is the unreachable demo diorama, as for every scene with a factory of its own. Moved here unchanged from `./index.ts`, except Fayth's, which is new.
 * Game case: each row is its own chapter's game's, as tagged; the table is shared plumbing.
 */

import type { SceneEntry } from './index.ts';
import type { SceneFactory } from './types.ts';
import { buildDemoScene } from './demo.ts';
import { buildExpLeblancLastRoomScene, EXP_LEBLANC_LAST_ROOM_SLOTS } from './exp-leblanc-last-room.ts';
import { EXP_LEBLANC_SCENE } from '../data/art/artNamespace.ts';
import { buildExperimentGroundsScene, EXPERIMENT_GROUNDS_SLOTS } from './experiment-grounds.ts'; // the Experiment's grounds (FFX-2 only, hidden chapter)
import { EXPERIMENT_GROUNDS_PLATE } from '../data/experiment-plates.ts';
import { buildMushroomRockRoadScene, MUSHROOM_SLOTS } from './mushroom-rock-road.ts';
import { MUSHROOM_ROCK_SCENE } from '../data/ffx/sinspawn-gui-ids.ts';
import { buildExpFaythDeckScene, EXP_FAYTH_SCENE_ENTRY } from './exp-fayth-deck.ts';
import { EXP_FAYTH_SCENE } from '../data/ffx/exp-fayth-ids.ts';

/** The scene-table rows (`SCENES` in `./index.ts`), in the order the chapters were added. */
export const EXPERIMENT_SCENE_ENTRIES: readonly SceneEntry[] = [
  // The Experiment's fight (FFX-2 only, hidden chapter): the Machine Faction's grounds at Djose Temple, on a provisional plate.
  { key: EXPERIMENT_GROUNDS_PLATE, title: "Djose Temple — the Machine Faction's grounds", build: buildDemoScene, slots: EXPERIMENT_GROUNDS_SLOTS, placeholder: false },
  // The experimental Leblanc chapter's room (FFX-2 only): the same room over its own plate and art namespace.
  { key: EXP_LEBLANC_SCENE, title: 'Chateau Leblanc — the Last Room (new art)', build: buildDemoScene, slots: EXP_LEBLANC_LAST_ROOM_SLOTS, placeholder: false },
  // Mushroom Rock Road (the hidden Sinspawn Gui chapter, FFX only, a provisional plate).
  { key: MUSHROOM_ROCK_SCENE, title: "Mushroom Rock Road — Operation Mi'ihen", build: buildDemoScene, slots: MUSHROOM_SLOTS, placeholder: false },
  // The hidden Fayth chapter's deck (FFX only): Chapter VIII's deck and plate, with a camera director.
  EXP_FAYTH_SCENE_ENTRY,
];

/** The factories (`SCENE_FACTORIES` in `./index.ts`). */
export const EXPERIMENT_SCENE_FACTORIES: Readonly<Record<string, SceneFactory>> = {
  [EXPERIMENT_GROUNDS_PLATE]: buildExperimentGroundsScene, // the Experiment (FFX-2 only, hidden chapter)
  [EXP_LEBLANC_SCENE]: buildExpLeblancLastRoomScene, // the experimental Leblanc chapter (FFX-2 only)
  [MUSHROOM_ROCK_SCENE]: buildMushroomRockRoadScene, // the hidden Sinspawn Gui chapter (FFX only)
  [EXP_FAYTH_SCENE]: buildExpFaythDeckScene, // the hidden Fayth chapter (FFX only)
};
