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
 * The folders the real FFX-2 models are dropped into, under `public/` (gitignored, never committed; a build ships part of them: `YRP_SHIPPED_*` below, `tools/dist-filter.mjs`). Each holds `yuna.glb`, `rikku.glb`, `paine.glb` and
 * `bahamut.glb` (the models in their bind pose), `<id>-anims.glb` (the same skeletons with every battle motion) and `clipmap.json` (which motion is which pose). `base` is the extracted set; `hd` the same figures with
 * 4x textures and one level of subdivision. A figure takes the HD folder's file when it is there and the base folder's when it is not; `?models=base` or `?models=hd` forces one (`../engine/yrp3d/load.ts`).
 * A missing file is replaced by a neutral capsule (`../engine/yrp3d/capsule.ts`).
 */
export const YRP_MODEL_DIRS = { base: 'models-exp/yrp', hd: 'models-exp/yrp-hd' } as const;

/** The base folder (kept as the one name older code and the tests use). */
export const YRP_MODEL_DIR = YRP_MODEL_DIRS.base;

/**
 * **What a production build ships of the models** (ch-yrp, 2026-11-02; `tools/dist-filter.mjs` reads these, `tests/unit/yrp-ship-set.test.ts` pins them). The rest stays on this disk: the AI boss's files, the HD figures of the three
 * girls, the HD tier of every dressphere (688 MB, six files over the host's 25 MiB per-file limit) and the dresspheres no Garment Grid of Chapter IV reaches.
 *
 * - **The base set** (`models-exp/yrp/`, next to the dress folder): each figure's model, its clips file and the weapon files, and the clip map; plus the game's Bahamut's HD model (`models-exp/yrp-hd/bahamut.glb`, 16.7 MB, the one figure the
 *   dress library does not stand in for) and the HD clip map.
 * - **The dress library** (`models-exp/yrp/dress/`): only the folders in {@link YRP_SHIPPED_DRESS_FOLDERS}, each `anims.glb` (the armed model with every clip, base textures, 3.8 to 6.3 MB) and its `clipmap.json`; the shipped
 *   `index.json` lists just those, with `hd` off (the build rewrites it), so the page never asks for a file that is not there.
 */
export const YRP_SHIPPED_BASE_FILES = [
  'yuna.glb', 'rikku.glb', 'paine.glb', 'bahamut.glb',
  'yuna-anims.glb', 'rikku-anims.glb', 'paine-anims.glb', 'bahamut-anims.glb',
  'yuna-gunner-pistol.glb', 'rikku-thief-dagger.glb', 'paine-warrior-sword.glb',
  'clipmap.json',
] as const;

/** The HD files that ship (`models-exp/yrp-hd/`): the game's Bahamut and the clip map. */
export const YRP_SHIPPED_HD_FILES = ['bahamut.glb', 'clipmap.json'] as const;

/**
 * The dress folders that ship: every dressphere on the three Garment Grids of Chapter IV's build (`data/ffx2/builds/bevelle.ts`, laid out by `gridNodeContents`: Yuna on the Protection Halo, Rikku on the Hour of Need, Paine on the
 * Stonehewn), which is every model a spherechange in this chapter can ask for. `tests/unit/yrp-ship-set.test.ts` recomputes the list from the build, so a changed grid fails there and not in the live chapter.
 */
export const YRP_SHIPPED_DRESS_FOLDERS = [
  'yuna-white-mage', 'yuna-gunner', 'yuna-thief', 'yuna-warrior', 'yuna-black-mage',
  'rikku-dark-knight', 'rikku-gunner', 'rikku-thief', 'rikku-warrior', 'rikku-black-mage',
  'paine-warrior', 'paine-gunner', 'paine-thief', 'paine-black-mage',
] as const;
