/**
 * What the frame is drawn with right now, for the places that must follow the rung without importing the rig: the MAX mix's SMOOTH EDGES
 * pass (`fx/mix/gates.ts aaKind`) is switched off while the scene is supersampled. `CrispRig` writes it before every frame and the mix
 * reads it in its own update, so a rung change reaches the pass list one frame later. A shared cell, as `sceneScale.ts` is.
 *
 * `rung` is the name of the rung or end state in force (`fplus`, `f`, `a2`, `phone`, a pinned preset, or `custom`); `aaPre` is whether the
 * MAX mix's SMOOTH EDGES pass may run.
 */
export const crispLive: { rung: string; aaPre: boolean } = { rung: 'a2', aaPre: true };
