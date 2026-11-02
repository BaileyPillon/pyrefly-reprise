/**
 * The ids of the hidden 3D Bahamut chapter (FFX-2 only; `./chapter-exp-yrp-3d.ts`), in a module with no imports so that the door, the scene, the pyrefly canon and the chapter record can all name them
 * without pulling each other's graphs in (a scene must not import the chapter record, which imports the story and the party's builds; the door must not import the scene). The same shape as the
 * Fayth chapter's (`./ffx/exp-fayth-ids.ts`).
 *
 * Game case: FFX-2 only. The chapter is Chapter IV's Bahamut fight (`research/ffx2-bahamut.md`) drawn as a real 3D scene.
 */

/** The chapter's id: its key in the experiments' store and the id the board's door settles on. */
export const EXP_YRP_ID = 'exp-yrp-3d' as const;

/** The chapter's scene key: the Bevelle chamber under the 3D stage's camera, with the real FFX-2 models, softly lit, on the actors (`../scenes/exp-yrp-3d-stage.ts`). */
export const EXP_YRP_SCENE = 'exp-yrp-3d-stage' as const;

/**
 * The folders the real FFX-2 models are dropped into, under `public/` (gitignored, never committed, never shipped: `tools/dist-filter.mjs`; branch `exp-yrp-real`). Each holds `yuna.glb`, `rikku.glb`, `paine.glb` and
 * `bahamut.glb` (the models in their bind pose), `<id>-anims.glb` (the same skeletons with every battle motion) and `clipmap.json` (which motion is which pose). `base` is the extracted set; `hd` the same figures with
 * 4x textures and one level of subdivision. A figure takes the HD folder's file when it is there and the base folder's when it is not; `?models=base` or `?models=hd` forces one (`../engine/yrp3d/load.ts`).
 * A missing file is replaced by a neutral capsule (`../engine/yrp3d/capsule.ts`).
 */
export const YRP_MODEL_DIRS = { base: 'models-exp/yrp', hd: 'models-exp/yrp-hd' } as const;

/** The base folder (kept as the one name older code and the tests use). */
export const YRP_MODEL_DIR = YRP_MODEL_DIRS.base;
