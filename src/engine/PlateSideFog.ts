import { Color, Vector3, type Camera, type Mesh, type MeshBasicMaterial, type Object3D, type PlaneGeometry, type Scene } from 'three';

/**
 * Release 39.1, B11 (Bailey, 2026-10-05, "all of your recommendations"; **FFX only**: the FFX-2 plates have their painted wings): fogged edges where an
 * FFX painting's plane ends inside an ultrawide frame.
 *
 * A painted plane is as wide as its rig table was solved for at 16:9. At 21:9 (2560x1080) the establishing and boss shots swing the plane's own edge into the
 * frame and a flat band of the scene's background shows beside the plate (Chapter II's Zanarkand dome is the worst: about 15 percent a side), with the
 * plate ending at a straight line. Here every layer that draws the painting (the plane, its parallax bands, the depth plates that stand in for them when LIVING
 * PAINTINGS is on) fades toward the scene's background colour over the outermost {@link SIDE_FOG_WIDTH_NDC} of the frame's width at its own edge, so the
 * plate dissolves into the band instead of stopping. No new art, no new geometry: one colour mix in the plates' own fragment shader.
 *
 * It acts only where an edge is inside the frame. Each frame, for each layer, the edge's place on screen is read from the live camera; the fade's strength
 * runs from 0 (the edge at or beyond the frame's edge: the 16:9 shots, where nothing changes, pixel for pixel) to 1 once it stands
 * {@link SIDE_FOG_ONSET_NDC} inside it. The painting file is never edited; the colour it fades to is `scene.background` (the flat colour the band already is).
 *
 * Game case: FFX only (`setSideFogGame`, set by the battle screen); FFX-2 and FF7 are untouched.
 */

/** The fade runs over this much of the frame's width (NDC: the frame is 2 wide) inward from the plate's edge. */
export const SIDE_FOG_WIDTH_NDC = 0.16;
/** An edge this far inside the frame (NDC) gets the whole fade; at the frame's edge or beyond, none. */
export const SIDE_FOG_ONSET_NDC = 0.04;

let fogGame: string | null = null;

/** The battle screen: which game's battle is up (`ffx` only fogs). `null` leaves the plates as they are. */
export function setSideFogGame(game: string | null): void {
  fogGame = game;
}

export function sideFogOn(): boolean {
  return fogGame === 'ffx';
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * The fade for a plane whose left and right edges stand at `edgeL` and `edgeR` (NDC x, -1 the frame's left edge, +1 its right): the strength per side
 * (0 for an edge at or past the frame's edge, 1 once it is {@link SIDE_FOG_ONSET_NDC} inside) and the fade's width in the plane's own u (0..1).
 */
export function sideFogFor(edgeL: number, edgeR: number): { left: number; right: number; widthU: number } {
  const span = edgeR - edgeL;
  if (!(span > 1e-4)) return { left: 0, right: 0, widthU: 0.1 };
  return {
    left: clamp01((edgeL + 1) / SIDE_FOG_ONSET_NDC),
    right: clamp01((1 - edgeR) / SIDE_FOG_ONSET_NDC),
    widthU: Math.min(0.5, SIDE_FOG_WIDTH_NDC / span),
  };
}

/** The part of the fragment shader's `main` this adds, after the colour is read: a mix toward the fog colour near each fogged edge. */
export const SIDE_FOG_CHUNK = `
#ifdef USE_MAP
  float sfU = vMapUv.x;
  float sfK = mix(1.0, smoothstep(0.0, uSf.z, sfU), uSf.x) * mix(1.0, smoothstep(0.0, uSf.z, 1.0 - sfU), uSf.y);
  diffuseColor.rgb = mix(uSfColor, diffuseColor.rgb, sfK);
#endif`;

/** The layers that draw the painting, by name: the plane, its parallax bands, and LIVING PAINTINGS' depth plates (not their lamp overlays). */
const PLATE_NAME = /^(backdrop-painting|backdrop-layer-\d+|fx-b-plate-\d+)$/;

interface FogState {
  sf: { value: Vector3 };
  color: { value: Color };
}

const a = new Vector3();
const b = new Vector3();

/** Patch one layer's material (a `MeshBasicMaterial` with a map; anything else is left alone) and drive it from its own `onBeforeRender`. Once per mesh. */
export function patchSideFog(mesh: Mesh): void {
  const mat = mesh.material as MeshBasicMaterial;
  if (!mat?.isMeshBasicMaterial || !mat.map || mesh.userData['sideFog']) return;
  const state: FogState = { sf: { value: new Vector3(0, 0, 0.1) }, color: { value: new Color(0) } };
  mesh.userData['sideFog'] = state;
  const prevCompile = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey;
  mat.onBeforeCompile = (shader, renderer) => {
    prevCompile.call(mat, shader, renderer);
    shader.uniforms['uSf'] = state.sf;
    shader.uniforms['uSfColor'] = state.color;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform vec3 uSf;\nuniform vec3 uSfColor;\nvoid main() {')
      .replace('#include <color_fragment>', `#include <color_fragment>${SIDE_FOG_CHUNK}`);
  };
  mat.customProgramCacheKey = () => `${prevKey.call(mat)}|sidefog`;
  mat.needsUpdate = true;
  const prevBefore = mesh.onBeforeRender;
  mesh.onBeforeRender = function (this: Mesh, renderer, scene, camera, geometry, material, group) {
    driveSideFog(mesh, state, scene, camera);
    prevBefore.call(this, renderer, scene, camera, geometry, material, group);
  };
}

function driveSideFog(mesh: Mesh, state: FogState, scene: Scene, camera: Camera): void {
  const v = state.sf.value;
  const bg = scene.background as Color | null;
  const hw = ((mesh.geometry as PlaneGeometry).parameters?.width ?? 0) / 2;
  if (!sideFogOn() || !bg || !(bg as Color).isColor || !(hw > 0)) {
    v.set(0, 0, 0.1);
    return;
  }
  a.set(-hw, 0, 0).applyMatrix4(mesh.matrixWorld).project(camera);
  b.set(hw, 0, 0).applyMatrix4(mesh.matrixWorld).project(camera);
  const f = a.x <= b.x ? sideFogFor(a.x, b.x) : sideFogFor(b.x, a.x);
  v.set(f.left, f.right, f.widthU);
  state.color.value.copy(bg);
}

/** Patch every layer under `root` that draws a painting. Safe to call again (a layer is patched once). */
export function patchSideFogIn(root: Object3D): void {
  root.traverse((o) => {
    if (PLATE_NAME.test(o.name) && (o as Mesh).isMesh) patchSideFog(o as Mesh);
  });
}
