/**
 * **The hidden chapters' scenes, in one side table** (`./index.ts` adds them to its registry with one loop and one spread). The registry file is over the house 400 lines, and a hidden chapter's
 * scene should not grow it, so the rows of the chapters that have no card on the board live here:
 *
 * - the experimental Leblanc chapter's room (FFX-2 only): Chapter VI's room over its own plate and art namespace (`./exp-leblanc-last-room.ts`);
 * - the Experiment's grounds (FFX-2 only): the Machine Faction's grounds at Djose Temple, on a provisional plate (`./experiment-grounds.ts`, `../data/experiment-plates.ts`);
 * - Mushroom Rock Road (FFX only): the hidden Sinspawn Gui chapter, on a provisional plate (`./mushroom-rock-road.ts`);
 * - the hidden Fayth chapter's deck (FFX only): Chapter VIII's deck with a camera director on it (`./exp-fayth-deck.ts`);
 * - the hidden Tourist Trap chapter's cavern (FFX-2 only): the Cavern of the Stolen Fayth under the FFX-2 camera, on Chapter IX's approved plate (`./tourist-trap-cavern.ts`);
 * - the hidden Biran and Yenke chapter's Mountain Gate (FFX only): Chapter I's Mt. Gagazet scene with this fight's staging (`./gagazet-ronso.ts`);
 * - the hidden Angra Mainyu chapter's desert (FFX-2 only): the Bikanel Desert under the FFX-2 camera, on a provisional new plate (`./angra-mainyu-desert.ts`);
 * - the hidden Last Summoning chapter's Dream's End (FFX only): Chapter III's scene with the staging of the aeons Chapter III never fields (`./last-summoning.ts`).
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
import { buildTouristTrapCavernScene, TOURIST_TRAP_SLOTS } from './tourist-trap-cavern.ts'; // the Tourist Trap's cavern (FFX-2 only, hidden chapter)
import { TOURIST_TRAP_SCENE } from '../data/tourist-trap-ids.ts';
import { buildGagazetRonsoScene, GAGAZET_RONSO_SLOTS } from './gagazet-ronso.ts'; // the Mountain Gate (FFX only, hidden chapter): Chapter I's mountain with two Ronso
import { GAGAZET_RONSO_SCENE } from '../data/ffx/biran-yenke-ids.ts';
import { buildAngraMainyuDesertScene, ANGRA_MAINYU_SLOTS } from './angra-mainyu-desert.ts'; // Angra Mainyu's desert (FFX-2 only, hidden chapter)
import { ANGRA_MAINYU_SCENE } from '../data/angra-mainyu-ids.ts';
import { buildMirrorAeonsScene, MIRROR_SLOTS } from './mirror-aeons.ts'; // Mirror Aeons (FFX only, hidden chapter): Mushroom Rock Road, then the Cavern's plate
import { MIRROR_AEONS_SCENE } from '../data/ffx/mirror-aeons-ids.ts';
import { buildLastSummoningScene, LAST_SUMMONING_SLOTS } from './last-summoning.ts'; // the Last Summoning's Dream's End (FFX only, hidden chapter): Chapter III's scene with Yojimbo, the Sisters and Anima staged
import { LAST_SUMMONING_SCENE } from '../data/ffx/last-summoning-ids.ts';

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
  // The Tourist Trap's fight (FFX-2 only, hidden chapter): the Cavern of the Stolen Fayth under the FFX-2 camera, on Chapter IX's approved plate.
  { key: TOURIST_TRAP_SCENE, title: 'Cavern of the Stolen Fayth — the Tourist Trap', build: buildDemoScene, slots: TOURIST_TRAP_SLOTS, placeholder: false },
  // Biran and Yenke (FFX only, hidden chapter): Chapter I's Mt. Gagazet plate, as the provisional stand-in for the Mountain Gate, with Kimahri alone and the two Ronso.
  { key: GAGAZET_RONSO_SCENE, title: 'Mt. Gagazet — the Mountain Gate (Biran and Yenke)', build: buildDemoScene, slots: GAGAZET_RONSO_SLOTS, placeholder: false },
  // Angra Mainyu's fight (FFX-2 only, hidden chapter): the Bikanel Desert under the FFX-2 camera, on a provisional painted plate.
  { key: ANGRA_MAINYU_SCENE, title: 'Bikanel Desert — Angra Mainyu', build: buildDemoScene, slots: ANGRA_MAINYU_SLOTS, placeholder: false },
  // Mirror Aeons (FFX only, hidden chapter): Mushroom Rock Road for the Dark Magus Sisters, the Cavern of the Stolen Fayth's plate for Dark Yojimbo (one stage, two plates).
  { key: MIRROR_AEONS_SCENE, title: 'Mushroom Rock Road and the Cavern of the Stolen Fayth — Mirror Aeons', build: buildDemoScene, slots: MIRROR_SLOTS, placeholder: false },
  // The Last Summoning (FFX only, hidden chapter): Dream's End as Chapter III builds it, with the full roster's possessed aeons staged.
  { key: LAST_SUMMONING_SCENE, title: "Dream's End — the Last Summoning", build: buildDemoScene, slots: LAST_SUMMONING_SLOTS, placeholder: false },
];

/** The factories (`SCENE_FACTORIES` in `./index.ts`). */
export const EXPERIMENT_SCENE_FACTORIES: Readonly<Record<string, SceneFactory>> = {
  [EXPERIMENT_GROUNDS_PLATE]: buildExperimentGroundsScene, // the Experiment (FFX-2 only, hidden chapter)
  [EXP_LEBLANC_SCENE]: buildExpLeblancLastRoomScene, // the experimental Leblanc chapter (FFX-2 only)
  [MUSHROOM_ROCK_SCENE]: buildMushroomRockRoadScene, // the hidden Sinspawn Gui chapter (FFX only)
  [EXP_FAYTH_SCENE]: buildExpFaythDeckScene, // the hidden Fayth chapter (FFX only)
  [TOURIST_TRAP_SCENE]: buildTouristTrapCavernScene, // the hidden Tourist Trap chapter (FFX-2 only)
  [GAGAZET_RONSO_SCENE]: buildGagazetRonsoScene, // the hidden Biran and Yenke chapter (FFX only)
  [ANGRA_MAINYU_SCENE]: buildAngraMainyuDesertScene, // the hidden Angra Mainyu chapter (FFX-2 only)
  [MIRROR_AEONS_SCENE]: buildMirrorAeonsScene, // the hidden Mirror Aeons chapter (FFX only)
  [LAST_SUMMONING_SCENE]: buildLastSummoningScene, // the hidden Last Summoning chapter (FFX only)
};
