import type { Material, Mesh, MeshBasicMaterial } from 'three';
import type { DriftOffset, DriftSpec } from './CameraDrift.ts';
import { eyeCandyOn } from '../eyeCandyFlags.ts';
import { eyeCandy, type FxTier } from '../EyeCandy.ts';
import { FOCUS_MAX_BIAS, driftExtent, focusAmounts, focusWeight, plateBiases } from './focusMaths.ts';

/**
 * LIVING PAINTINGS, A-7 "Backdrops with a floor and a sky": the plate defocus, aimed at the plate the
 * party stands on. Each upright depth plate samples its own mip chain with a bias the room's camera
 * drift drives (`focusMaths.ts`): the far ridge and the sky go soft, the plate in focus stays sharp,
 * and at rest, under REDUCE MOTION and under LOW EFFECTS the bias is 0, so the plate samples exactly
 * as it did before and the resting frame is the approved painting.
 *
 * Same method as option A4's backdrop focus (`fx/a/BackdropFocus.ts`, a patched `map_fragment`), but
 * on the plates, which A4 never sees (it patches the painting planes the plates hide). The painted
 * pixels are never changed. Game case: both (shared plumbing); each room caps its own blur.
 */

const FOCUS_KEY = 'fxPlateFocus';

export interface FocusSpec {
  /** Index of the plate in focus; defaults to the nearest upright plate (the one the party stands against). */
  plate?: number;
  /** Cap on the mip bias of the farthest plate at the extreme of the drift. */
  max?: number;
}

export interface FocusState {
  weight: number;
  extent: number;
  biases: number[];
}

export class PlateFocus {
  readonly amounts: number[];
  readonly focusPlate: number;
  private readonly uniforms: Array<{ value: number }>;
  private readonly patched: Array<{ mat: MeshBasicMaterial; compile: Material['onBeforeCompile']; key: Material['customProgramCacheKey'] }> = [];
  private readonly max: number;
  readonly state: FocusState;

  /**
   * @param meshes the plates, far to near
   * @param distances world distance of each plate from the reference camera
   * @param floored the nearest plate is the projected floor (a shader of its own, the focus plane itself)
   */
  constructor(meshes: readonly Mesh[], distances: readonly number[], floored: boolean, spec: FocusSpec = {}) {
    const upright = floored ? meshes.length - 1 : meshes.length;
    this.focusPlate = Math.min(Math.max(0, upright - 1), Math.max(0, spec.plate ?? upright - 1));
    this.max = spec.max ?? FOCUS_MAX_BIAS;
    this.amounts = focusAmounts(distances, this.focusPlate);
    this.uniforms = meshes.map(() => ({ value: 0 }));
    this.state = { weight: 0, extent: 0, biases: meshes.map(() => 0) };
    meshes.forEach((mesh, i) => {
      const mat = mesh.material as MeshBasicMaterial;
      // The floor plate is a ShaderMaterial of its own (no `map_fragment`): it is in focus, and left alone.
      if (!mat.isMeshBasicMaterial || !mat.map) return;
      const u = this.uniforms[i]!;
      const prev = { mat, compile: mat.onBeforeCompile, key: mat.customProgramCacheKey };
      this.patched.push(prev);
      mat.onBeforeCompile = (shader, renderer) => {
        prev.compile.call(mat, shader, renderer);
        shader.uniforms['uFxPlateBias'] = u;
        shader.fragmentShader = shader.fragmentShader
          .replace('void main() {', 'uniform float uFxPlateBias;\nvoid main() {')
          .replace(
            '#include <map_fragment>',
            `#ifdef USE_MAP
              vec4 sampledDiffuseColor = texture2D( map, vMapUv, uFxPlateBias );
              diffuseColor *= sampledDiffuseColor;
            #endif`,
          );
      };
      mat.customProgramCacheKey = () => `${prev.key.call(mat)}|${FOCUS_KEY}`;
      mat.needsUpdate = true;
    });
  }

  /**
   * One frame: `d` is the drift's offset this frame (already scaled by the drift's own weight), or null
   * when nothing drifts; `dial` the strength (0 turns the defocus off).
   */
  update(d: DriftOffset | null, spec: DriftSpec, dial: number): FocusState {
    const extent = d && dial > 0 ? driftExtent(d, spec) : 0;
    const weight = focusWeight(extent);
    const biases = plateBiases(this.amounts, weight, this.max, dial);
    biases.forEach((b, i) => {
      this.uniforms[i]!.value = b;
    });
    this.state.extent = extent;
    this.state.weight = weight;
    this.state.biases = biases;
    return this.state;
  }

  /** Back to the sampling every plate had before (the programs stay compiled; the bias is 0). */
  reset(): void {
    for (const u of this.uniforms) u.value = 0;
    this.state.weight = 0;
    this.state.extent = 0;
    this.state.biases = this.state.biases.map(() => 0);
  }

  dispose(): void {
    this.reset();
    for (const { mat, compile, key } of this.patched) {
      mat.onBeforeCompile = compile;
      mat.customProgramCacheKey = key;
      mat.needsUpdate = true;
    }
    this.patched.length = 0;
  }
}

/**
 * The defocus strength for this frame: 0 under REDUCE MOTION (the drift is off, the painting stays as
 * painted) and LOW EFFECTS (the flat fallback), 0.8 on the phone tier, the `focus` dial, and the EYE CANDY
 * seam's LIVING PAINTINGS row and `?fxsub=-focus`. Pure but for the two switch modules.
 */
export function focusDial(reduceMotion: boolean, tier: FxTier): number {
  if (reduceMotion || tier === 'low' || !eyeCandyOn('livingPaintings') || !eyeCandy.sub('b', 'focus')) return 0;
  return eyeCandy.dial('focus') * (tier === 'phone' ? 0.8 : 1);
}
