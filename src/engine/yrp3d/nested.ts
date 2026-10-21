/**
 * **A second render from inside a draw** (the hidden 3D Bahamut chapter; FFX-2 only): the wet floor's backdrop-only render (`./wetFloor.ts`) draws the scene again, from the camera that
 * is drawing it, into a target of their own, from the `onBeforeRender` of an object in the scene (the look lab's silhouette ink did the same for its G-buffer; that pass is not part of this branch). That is how three's own `Reflector` does it, and it needs the same care: the renderer and the scene are left exactly as they were found.
 *
 * What is narrowed for the nested render: the camera's layers (only objects on `layer` are drawn: the figures, or the painted backdrop), the scene's override material (the G-buffer's), the scene's background (the G-buffer
 * wants none; the backdrop pass wants the flat colour it is painted on), the render target, the clear colour and alpha, `autoClear`, and the shadow map's `autoUpdate` (the nested render must not recompute shadows). All are put back.
 *
 * Needs three.js types only; no DOM.
 */

import { Color, type Camera, type Material, type Scene, type Vector2, type WebGLRenderTarget, type WebGLRenderer } from 'three';

export interface NestedOptions {
  /** The target to draw into. */
  target: WebGLRenderTarget;
  /** The only layer the camera sees for this render. */
  layer: number;
  /** An override material for the whole scene, or null for each object's own. */
  override?: Material | null;
  /** Keep the scene's background (drawn behind everything), or take it off for this render. */
  keepBackground: boolean;
  /** The colour and alpha the target is cleared to first. */
  clear: { colour: number; alpha: number };
}

const scratch = new Color();

/** Render `scene` from `camera` as `o` says, then put everything back (the render target that was current included). */
export function renderNested(renderer: WebGLRenderer, scene: Scene, camera: Camera, o: NestedOptions): void {
  const target = renderer.getRenderTarget();
  const saved = {
    mask: camera.layers.mask,
    override: scene.overrideMaterial,
    background: scene.background,
    autoClear: renderer.autoClear,
    shadows: renderer.shadowMap.autoUpdate,
    alpha: renderer.getClearAlpha(),
  };
  renderer.getClearColor(scratch);
  const colour = scratch.getHex();

  camera.layers.set(o.layer);
  scene.overrideMaterial = o.override ?? null;
  if (!o.keepBackground) scene.background = null;
  renderer.shadowMap.autoUpdate = false;
  renderer.autoClear = false;
  renderer.setRenderTarget(o.target);
  renderer.setClearColor(o.clear.colour, o.clear.alpha);
  renderer.clear(true, true, false);
  renderer.render(scene, camera);

  renderer.setClearColor(colour, saved.alpha);
  renderer.autoClear = saved.autoClear;
  renderer.shadowMap.autoUpdate = saved.shadows;
  scene.background = saved.background;
  scene.overrideMaterial = saved.override;
  camera.layers.mask = saved.mask;
  renderer.setRenderTarget(target);
}

/** The size of what is being rendered to: the current target's, or the canvas's drawing buffer when there is none. Whole pixels, at least 1. */
export function frameSize(renderer: WebGLRenderer, into: Vector2): { width: number; height: number } {
  const target = renderer.getRenderTarget();
  if (target) into.set(target.width, target.height);
  else renderer.getDrawingBufferSize(into);
  return { width: Math.max(1, Math.round(into.x)), height: Math.max(1, Math.round(into.y)) };
}
