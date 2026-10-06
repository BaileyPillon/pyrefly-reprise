import { EXP_LEBLANC_SCENE, SCENE_ART_NAMESPACE } from '../data/art/artNamespace.ts';
import type { SceneSlots } from './index.ts';
import { LEBLANC_LAST_ROOM_SLOTS, makeLeblancLastRoomScene, type LeblancPlate } from './leblanc-last-room.ts';

/**
 * **Chateau Leblanc, the Last Room, over its own paintings** — the scene of the experimental Leblanc chapter
 * (`../data/chapter-exp-leblanc.ts`; Bailey, 2026-10-06: "the leblanc preview will be an additional experimental chapter. keep the
 * current leblanc chapter").
 *
 * Game case: FFX-2 only [AGENTS.md rule 14]; nothing here is read by an FFX chapter.
 *
 * It is Chapter VI's room exactly (`./leblanc-last-room.ts`: the rigs, the party and trio slots, the lights, the dust, the
 * trio pool, the enemy lane) with two differences, both data:
 *
 * - the plate is `public/art/backdrops/exp-leblanc-last-room.png` (the scene key is the file stem, as everywhere), today a
 *   copy of `leblanc-last-room.png` and replaced by new art when it is installed (`tools/exp-install.mjs backdrop`);
 * - it publishes the art namespace `exp-leblanc` (`SceneStaging.artNamespace`), so the stage reads every figure from
 *   `characters/exp-leblanc-<id>/` (`src/data/art/artNamespace.ts`).
 *
 * A new plate may need its own camera and slots once it is painted differently; they are Chapter VI's until Bailey's picks say
 * otherwise (the approved target is `docs/handoff/exp-leblanc.md`).
 */
export const EXP_LEBLANC_PLATE: LeblancPlate = { key: EXP_LEBLANC_SCENE, artNamespace: SCENE_ART_NAMESPACE[EXP_LEBLANC_SCENE] };

/** Chapter VI's room, over the experimental plate and namespace, as a {@link SceneFactory} (`./index.ts` `SCENE_FACTORIES`). */
export const buildExpLeblancLastRoomScene = makeLeblancLastRoomScene(EXP_LEBLANC_PLATE);

/** The scene-table row's slots: Chapter VI's, plus the namespace (the factory's own build says the same). */
export const EXP_LEBLANC_LAST_ROOM_SLOTS: SceneSlots = {
  ...LEBLANC_LAST_ROOM_SLOTS,
  ...(EXP_LEBLANC_PLATE.artNamespace ? { artNamespace: EXP_LEBLANC_PLATE.artNamespace } : {}),
};
