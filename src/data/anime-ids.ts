/**
 * The ids of the hidden anime chapter (FFX-2 only; `./chapter-exp-anime.ts`), in a module with no imports so that the door, the scene, the pyrefly canon and the chapter record can all name them without pulling each
 * other's graphs in (a scene must not import the chapter record, which imports the story and the party's builds; the door must not import the scene). The same shape as the Wind Waker chapter's (`./windwaker-ids.ts`).
 *
 * Game case: FFX-2 only. The chapter is hidden chapter 24's encounter (Valefor at Besaid, `research/ffx2-fallen-aeons.md` section 7.1) drawn as an anime cel-shaded 3D scene (the Genshin Impact / Guilty Gear Strive manner).
 */

/** The chapter's id: its key in the experiments' store and the id the board's door settles on. */
export const EXP_ANIME_ID = 'exp-anime' as const;

/** The chapter's scene key: the Wind Waker temple stage with the Meshy toon cast under the cel material (`../scenes/exp-anime-stage.ts`). */
export const EXP_ANIME_SCENE = 'exp-anime-stage' as const;

/**
 * The folder under the Wind Waker chapter's models folder that holds the three girls (`anime/yuna.glb`, `anime/rikku.glb`, `anime/paine.glb`: the Meshy toon cast's LOD1 files, 2048 px, 20k triangles each).
 * Valefor, the weapons and the temple pieces are the Wind Waker chapter's own files (`../data/windwaker-ids.ts`), so they are not copied. The folder SHIPS with the rest of `models-exp/windwaker/**`
 * (`tools/dist-filter.mjs`, `tools/ww-models.mjs`); a girl with no file stands on a neutral capsule and the chapter still plays.
 */
export const ANIME_GIRLS_DIR = 'anime' as const;
