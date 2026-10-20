/**
 * **The wing flap and breath of the rigid AI Bahamut** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only): the AI-made boss model (`bahamut-ai.glb`, Meshy, unrigged: one rigid mesh) has no
 * clips, so its motion is procedural, as on the branch it was built for (`exp-yrp-3d`): a few lines of vertex shader that lift the vertices out beyond the shoulders by a travelling sine, more toward the wingtips, the body
 * still. The materials of one model read one set of uniform cells, so one write moves every material at once (`setFlap`). The real game's Bahamut has his own clips and needs none of this.
 *
 * Needs three.js only; no DOM. Game case: FFX-2 only.
 */

import type { Material, Mesh, Object3D } from 'three';

/** What the wing flap needs to know of the model: where the shoulders end and where the wingtips are, along x in the file's units (from the centre). */
export interface FlapSpec {
  readonly shoulder: number;
  readonly halfSpan: number;
}

/** The uniform cells the flap reads, shared by reference between every material of one model. */
export interface FlapUniforms {
  uFlapTime: { value: number };
  uFlapAmp: { value: number };
  uFlapShoulder: { value: number };
  uFlapHalf: { value: number };
}

/** The shoulder width as a share of the whole wingspan, from the centre (Bailey's brief for the rigid Bahamut: about 0.18). */
export const SHOULDER_SHARE = 0.18;

/** The flap's cells for `spec`, at rest (no amplitude). */
export function makeFlap(spec: FlapSpec): FlapUniforms {
  return { uFlapTime: { value: 0 }, uFlapAmp: { value: 0 }, uFlapShoulder: { value: spec.shoulder }, uFlapHalf: { value: spec.halfSpan } };
}

/** The wingspan of a scene along x, read from its meshes' own bounding boxes (the file's units): the half of it and the shoulder (`SHOULDER_SHARE` of the whole span from the centre). Null for a scene with no mesh. */
export function flapSpecOf(root: Object3D): FlapSpec | null {
  let half = 0;
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    const b = mesh.geometry.boundingBox!;
    half = Math.max(half, Math.abs(b.min.x), Math.abs(b.max.x));
  });
  return half > 0 ? { shoulder: SHOULDER_SHARE * 2 * half, halfSpan: half } : null;
}

/** The vertex shader's uniforms and the displacement: past the shoulder, a sine that travels out along the wing (the tip lags the root), growing toward the tip, mostly up and down with a little forward. */
const FLAP_UNIFORMS_GLSL = ['uniform float uFlapTime;', 'uniform float uFlapAmp;', 'uniform float uFlapShoulder;', 'uniform float uFlapHalf;'].join('\n');
const FLAP_GLSL = [
  'float yrpAx = abs( position.x );',
  'float yrpW = smoothstep( uFlapShoulder, uFlapHalf, yrpAx );',
  'float yrpFlap = sin( uFlapTime - yrpAx * ( 3.0 / uFlapHalf ) ) * yrpW * yrpW * uFlapAmp;',
  'transformed.y += yrpFlap;',
  'transformed.z += yrpFlap * 0.22;',
].join('\n');

/** Add the flap to a vertex shader (after `begin_vertex`, so every later step sees the displaced vertex). */
export function withFlap(shader: { vertexShader: string }): void {
  shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${FLAP_UNIFORMS_GLSL}`).replace('#include <begin_vertex>', `#include <begin_vertex>\n${FLAP_GLSL}`);
}

/** Make `material` flap with the shared cells `flap`: its compile gets the displacement and the cells themselves as its uniforms (so one write moves every material), under a program key of its own. */
export function patchFlap(material: Material, flap: FlapUniforms): void {
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    Object.assign(shader.uniforms, flap);
    withFlap(shader);
  };
  const key = material.customProgramCacheKey;
  material.customProgramCacheKey = () => `${key.call(material)}|yrp-flap`;
}

/** The flap's clock (radians of the sine) and its amplitude (the file's units: how far the wingtips swing). */
export function setFlap(flap: FlapUniforms, time: number, amplitude: number): void {
  flap.uFlapTime.value = time;
  flap.uFlapAmp.value = amplitude;
}
