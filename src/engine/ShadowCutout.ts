/**
 * **Figure-shaped cast shadows** (VP-1001-31; both games, seen in FFX-2's Chapter XIII).
 *
 * Every painted figure casts its shadow through a `MeshDepthMaterial` carrying the pose's
 * texture and an alpha test, so only the painted silhouette reaches the shadow map. But
 * three (r186, `WebGLShadowMap.getDepthMaterial`) copies the *object's* material `map` and
 * `alphaTest` onto the depth material on every shadow pass, custom depth materials included.
 * A figure's material is a `ShaderMaterial` whose texture lives in a uniform, so both came
 * across empty (map undefined, alphaTest 0) and every figure cast the whole quad: the
 * rectangular slabs behind Rikku and Paine on Trema's floor (critic-svc/trema-shadow-crop).
 *
 * The fix gives the figure's `ShaderMaterial` the same `map` and `alphaTest` as plain
 * properties, so what three copies is the right thing. The painted shader uses no three
 * chunks, so the `USE_MAP` / `USE_ALPHATEST` defines this adds to its program change nothing
 * on screen; the values are stable per pose, so no program churns per frame.
 */
import type { MeshDepthMaterial, ShaderMaterial, Texture } from 'three';

/** Point the figure's shadow at the pose's painting, cut at `alphaTest` (call on every pose swap). */
export function cutoutShadow(material: ShaderMaterial, depth: MeshDepthMaterial, texture: Texture, alphaTest: number): void {
  (material as ShaderMaterial & { map?: Texture | null }).map = texture;
  material.alphaTest = alphaTest; // what three copies onto `depth` each shadow pass
  depth.map = texture;
  depth.alphaTest = alphaTest;
  depth.needsUpdate = true;
}
