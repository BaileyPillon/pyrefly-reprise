/**
 * The ids of the hidden Wind Waker chapter (FFX-2 only; `./chapter-exp-windwaker.ts`), in a module with no imports so that the door, the scene, the pyrefly canon and the chapter record can all name them without
 * pulling each other's graphs in (a scene must not import the chapter record, which imports the story and the party's builds; the door must not import the scene). The same shape as the Fayth chapter's
 * (`./ffx/exp-fayth-ids.ts`) and the 3D Bahamut's (`yrp-ids.ts` on branch `exp-yrp-3d`).
 *
 * Game case: FFX-2 only. The chapter is hidden chapter 24's encounter (Valefor at Besaid, `research/ffx2-fallen-aeons.md` section 7.1) drawn as a Wind Waker HD style 3D scene.
 */

/** The chapter's id: its key in the experiments' store and the id the board's door settles on. */
export const EXP_WINDWAKER_ID = 'exp-windwaker' as const;

/** The chapter's scene key: a toon temple chamber with toon models on the actors (`../scenes/exp-windwaker-stage.ts`). */
export const EXP_WINDWAKER_SCENE = 'exp-windwaker-stage' as const;

/**
 * The folder the figures' models are dropped into, under `public/` (gitignored, never committed, never shipped: `tools/dist-filter.mjs` leaves `models-exp/` out of every build): `yuna.glb`, `rikku.glb`,
 * `paine.glb` and `valefor.glb`. A figure with no file here stands on a neutral capsule (`../engine/ww3d/capsule.ts`) and the chapter still plays.
 */
export const WW_MODEL_DIR = 'models-exp/windwaker' as const;

/** The folder of swappable weapons (`pistol.glb`, `dagger.glb`, `sword.glb`): a file here replaces the procedural prop of the same name. Origin at the grip, +Z along the blade or barrel, +Y up. */
export const WW_PROP_DIR = 'models-exp/windwaker/props' as const;

/** The folder of swappable temple pieces (`wall.glb`, `door.glb`, `brazier.glb`, `pillar.glb`): a file here replaces the procedural piece of the same name. */
export const WW_TEMPLE_DIR = 'models-exp/windwaker/temple' as const;
