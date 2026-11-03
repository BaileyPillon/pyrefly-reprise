/**
 * **A scene with no painted rigs** (the hidden Wind Waker chapter, `scenes/exp-windwaker-stage.ts`; shared plumbing, additive, FFX-2 only in use).
 *
 * A figure with a gated rig under `/art/rigs/` (Valefor's, on a machine that has the rigs dir; `rig/RigLoad.ts`) is drawn as a painted puppet, a `RigActor` whose parts hang on the actor's `inner` group and switch their own
 * visibility every frame. The 3D chapter swaps a model onto each actor and switches the actor's painted planes off (`ww3d/skin.ts` `hidePaintedFigure`), but a rig's parts are not planes: Valefor stood twice, the painting
 * in front of the camera and the toon model above it (phase 2, stills 64 to 75). A scene that sets `noRigs` draws every figure as its painting set, so the skin's one switch takes it away. Every other scene keeps the
 * `fxRig` setting's answer.
 */

/** The switch the battle screen hands the stage (`BattlePresenterStage` `rigs`): the setting's own answer, or "no rigs" for a scene that says so. */
export function rigsForScene(slots: { readonly noRigs?: boolean }, setting: () => boolean): () => boolean {
  return slots.noRigs === true ? (): boolean => false : setting;
}
