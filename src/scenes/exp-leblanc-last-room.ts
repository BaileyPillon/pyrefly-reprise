import { EXP_LEBLANC_SCENE, SCENE_ART_NAMESPACE } from '../data/art/artNamespace.ts';
import { ScenePalettes } from '../engine/ScenePalettes.ts';
import type { SceneSlots } from './index.ts';
import { LEBLANC_LAST_ROOM_SLOTS, makeLeblancLastRoomScene, type LeblancPlate, type LeblancPlateLook } from './leblanc-last-room.ts';

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
/**
 * The moonlit hall's own light (the approved target "Moonlit Blue Hall": cool, soft, lavender and periwinkle, a polished reflective floor).
 * Chapter VI's room lights a hot-magenta plate: a tinted 3D floor over this plate's marble would bury it, its warm and magenta pools and
 * its cyan rim would fight the cool light, and its grade turned the plate electric blue. So: the floor only receives shadows, the pools and
 * the rim are pale lavender, and the grade is `ScenePalettes.expMoonlitHall` (the plate drawn as it was painted, brought to the mockup's air: pale, milky, soft;
 * `docs/handoff/exp-leblanc.md` 14.5). Everything else (rigs, slots, camera, heights) is Chapter VI's.
 */
export const EXP_LEBLANC_LOOK: LeblancPlateLook = {
  palette: ScenePalettes.expMoonlitHall,
  ground: { size: 42, shadowOnly: true, shadowOpacity: 0.3, center: [0, -1.6] },
  fog: { near: 22, far: 60, colorMix: 0.3 },
  background: 0x3e4276, // mid blue-violet, close to the plate's own edges (a held shot swings past the plate: Chapter VI's near-black showed as a black band)
  fogPlanes: [
    { z: -26, y: 3.2, width: 60, height: 16, opacity: 0.08, speed: 0.008 },
    { z: -14, y: 1.6, width: 36, height: 8, opacity: 0.06, speed: 0.02, additive: true },
  ],
  lights: { keyIntensity: 0.9, rimColor: 0xcfd9ff, rimIntensity: 0.55, fillIntensity: 1.0, ambientIntensity: 0.7 },
  pools: { party: { color: 0xc9c8ff, opacity: 0.1 }, trio: { color: 0xe7b9ff, opacity: 0.12 } },
  dust: { colors: [0xe6e2ff, 0xffffff, 0xffe4f2], opacity: 0.3 },
};

export const EXP_LEBLANC_PLATE: LeblancPlate = { key: EXP_LEBLANC_SCENE, artNamespace: SCENE_ART_NAMESPACE[EXP_LEBLANC_SCENE], look: EXP_LEBLANC_LOOK };

/** Chapter VI's room, over the experimental plate and namespace, as a {@link SceneFactory} (`./index.ts` `SCENE_FACTORIES`). */
export const buildExpLeblancLastRoomScene = makeLeblancLastRoomScene(EXP_LEBLANC_PLATE);

/** The scene-table row's slots: Chapter VI's, plus the namespace (the factory's own build says the same). */
export const EXP_LEBLANC_LAST_ROOM_SLOTS: SceneSlots = {
  ...LEBLANC_LAST_ROOM_SLOTS,
  ...(EXP_LEBLANC_PLATE.artNamespace ? { artNamespace: EXP_LEBLANC_PLATE.artNamespace } : {}),
};
