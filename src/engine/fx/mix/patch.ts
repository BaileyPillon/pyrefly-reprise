import type { ShaderMaterial } from 'three';
import { patchDefringe } from './defringe.ts';
import { patchLiving } from './livingShader.ts';

/**
 * The MAX mix (D-316): ONE compile hook per painted figure material for both of its shader patches,
 * SMOOTH EDGES' defringe (fragment) and BREATHING / KO COLLAPSE's grid deformation (vertex), so either
 * can be switched on or off in any order without unhooking the other. With both off the material's own
 * hook and program key are put back exactly. Both games (plumbing).
 */

type Which = 'defringe' | 'live';

interface Hook {
  prevCompile: ShaderMaterial['onBeforeCompile'];
  prevKey: ShaderMaterial['customProgramCacheKey'];
  defringe: boolean;
  live: boolean;
}

const KEY = 'mixHook';

/** Switch one patch on a material (recompiles once when it changes). */
export function setMixPatch(mat: ShaderMaterial, which: Which, on: boolean): void {
  const ud = mat.userData as Record<string, unknown>;
  let h = ud[KEY] as Hook | undefined;
  if (!h) {
    if (!on) return;
    const hook: Hook = { prevCompile: mat.onBeforeCompile, prevKey: mat.customProgramCacheKey, defringe: false, live: false };
    h = hook;
    ud[KEY] = hook;
    mat.onBeforeCompile = (shader, renderer) => {
      hook.prevCompile.call(mat, shader, renderer);
      if (hook.defringe) shader.fragmentShader = patchDefringe(shader.fragmentShader) ?? shader.fragmentShader;
      if (hook.live) shader.vertexShader = patchLiving(shader.vertexShader) ?? shader.vertexShader;
    };
    mat.customProgramCacheKey = () => `${hook.prevKey.call(mat)}|mix${+hook.defringe}${+hook.live}`;
  }
  if (h[which] === on) return;
  h[which] = on;
  mat.needsUpdate = true;
  if (!h.defringe && !h.live) {
    mat.onBeforeCompile = h.prevCompile;
    mat.customProgramCacheKey = h.prevKey;
    delete ud[KEY];
  }
}

/** Is a patch on for this material? */
export function mixPatchOn(mat: ShaderMaterial, which: Which): boolean {
  const h = (mat.userData as Record<string, unknown>)[KEY] as Hook | undefined;
  return !!h?.[which];
}

/** SMOOTH EDGES' defringe on a figure material: its uniform cell (set to 1), or null if it is not a painted figure. */
export function injectDefringe(mat: ShaderMaterial): { value: number } | null {
  const ud = mat.userData as Record<string, unknown>;
  let cell = ud['mixDefringeCell'] as { value: number } | undefined;
  if (!cell) {
    if (!patchDefringe(mat.fragmentShader)) return null;
    cell = { value: 1 };
    ud['mixDefringeCell'] = cell;
  }
  mat.uniforms['mixDefringe'] = cell;
  setMixPatch(mat, 'defringe', true);
  return cell;
}

/** Take the defringe back out (the program compiles as before once no patch is left). */
export function ejectDefringe(mat: ShaderMaterial): void {
  setMixPatch(mat, 'defringe', false);
  delete (mat.uniforms as Record<string, unknown>)['mixDefringe'];
}
