/**
 * Keep the whole-frame bloom off the painted characters.
 *
 * Critic PR-0097: the bloom pass blooms the *whole frame* above a luminance
 * threshold (0.82-0.92 per scene, `ScenePalettes.ts`), which was tuned for the
 * backdrop's sun bands, glowing inlays and the VFX. An approved painting whose
 * costume is mostly white — Yuna's Gunner top and White Mage robe, Leblanc's
 * dress and hair — sits above that threshold everywhere, so the bloom haloed it
 * into a flat white blob and erased the painted detail. The paintings carry
 * their own light; the bloom has no business relighting them.
 *
 * How, without a second scene render: the frame's **alpha channel** becomes a
 * bloom mask. Everything else keeps writing alpha 1 (the clear is opaque and
 * normal blending leaves 1 at 1), while a painted plane, drawn with
 * {@link PAINTED_BLENDING}, *multiplies* the destination alpha by
 * `1 - its own alpha` — so where a painting covers the frame the mask reads 0.
 * {@link maskBloomHighPass} then scales the bloom's bright-pass by that alpha.
 * Additive VFX drawn over a figure raise the alpha again, so a hit spark or a
 * spell landing on someone still blooms; a painting mid-dissolve goes back to
 * normal blending ({@link syncPaintedBloom}) so a fiend's death glow blooms as
 * it always did.
 *
 * ## How much of the mask a scene uses ({@link setFigureBloomMask})
 *
 * The mask is a strength, `ScenePalette.figureBloomMask`, 0 (the figures bloom
 * as they always did) to 1 (no bloom on them at all), set per scene. A full
 * mask over-corrects: under the renderer's display transform an unbloomed
 * figure reads about 0.8 of its painting's luminance, so the whole mask left
 * FFX-2's Yuna 21 percent darker than her approved PNG and pushed FFX's Yuna,
 * who matched hers (0.999), down to 0.78 (verifier, fix10b). The strength
 * keeps just enough of the bloom to land the figure on its painting.
 *
 * GAME-AWARE (AGENTS.md rule 14): the plumbing is shared (**both games**), but
 * the mask is **FFX-2 only**: the blow-out was observed only on the FFX-2
 * stages (Bevelle Underground, the Farplane, Chateau Leblanc, whose palettes
 * bloom harder under white costumes: Yuna Gunner / White Mage, Leblanc), and
 * the FFX stages measured their Yuna at her painting's own luminance without
 * it. FFX palettes leave the field unset, which is 0: the live FFX look.
 *
 * ## One subject on an FFX stage ({@link figureBloomMasked})
 *
 * A scene may name the art ids the mask covers (`SceneSlots.figureBloomMaskArt`);
 * every other figure there draws with normal blending, so it blooms exactly as
 * it does with no mask. Chapter VII (FFX only): the Guado Guardian's approved r3
 * idle has 16 percent of its opaque pixels above luma 0.9 (white robe
 * highlights), and Macalania's generous bloom (threshold 0.8, strength 0.7)
 * haloed them in battle, while FFX's Yuna and Tidus's blade glow there stay as
 * they are. So Macalania masks the Guardian alone.
 */

import {
  CustomBlending,
  NormalBlending,
  OneMinusSrcAlphaFactor,
  SrcAlphaFactor,
  Vector2,
  Vector3,
  ZeroFactor,
  type ShaderMaterial,
} from 'three';
import type { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/**
 * Material blending for a painted plane: colour blends exactly as normal
 * (src-alpha over), destination alpha becomes `dstA * (1 - srcA)`.
 */
export const PAINTED_BLENDING = {
  blending: CustomBlending,
  blendSrc: SrcAlphaFactor,
  blendDst: OneMinusSrcAlphaFactor,
  blendSrcAlpha: ZeroFactor,
  blendDstAlpha: OneMinusSrcAlphaFactor,
} as const;

/**
 * Mask on while the painting is whole; plain normal blending while it
 * dissolves, or always for a figure the scene does not mask (`masked` false).
 */
export function syncPaintedBloom(material: ShaderMaterial, dissolving: boolean, masked = true): void {
  const want = dissolving || (!masked && !maskEveryFigure) ? NormalBlending : CustomBlending;
  if (material.blending !== want) material.blending = want;
}

/**
 * Eye-candy option A (`src/engine/fx/a/`, prototype behind `?fx=a`): every whole figure writes
 * the mask, so the selective bloom, the shafts and the streaks never light a painted costume.
 * False (every build without the switch) leaves the per-scene choice above exactly as it was.
 */
let maskEveryFigure = false;
export function setMaskEveryFigure(on: boolean): void {
  maskEveryFigure = on;
}

/** The bright-pass, weighted by the frame's alpha (the mask above). */
const MASKED_HIGH_PASS = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec3 defaultColor;
  uniform float defaultOpacity;
  uniform float luminosityThreshold;
  uniform float smoothWidth;
  uniform float figureMask;
  uniform float selective;
  uniform float whiteDamp;
  uniform vec3 bloomTint;
  uniform vec2 uTexel;
  varying vec2 vUv;
  void main() {
    vec4 texel = texture2D( tDiffuse, vUv );
    float v = luminance( texel.xyz );
    vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );
    float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );
    if ( selective > 0.5 ) {
      // Eye-candy A1 (fx/a/GoldenHour.ts): an emissive weight instead of a luma cut. A light is
      // brighter than what surrounds it (a lamp, a brazier, the moon, a spell core); a big
      // evenly bright field (a sky, the inside of an ice window, a snowfield) is paint, not a
      // light, so only its edges glow. Pale paint (snow, white robes) is damped further.
      float mean = 0.0;
      for ( int k = 0; k < 8; k ++ ) {
        float a = float( k ) * 0.785398;
        vec2 d = vec2( cos( a ), sin( a ) ) * uTexel;
        mean += luminance( texture2D( tDiffuse, vUv + d * 14.0 ).rgb ) + luminance( texture2D( tDiffuse, vUv + d * 32.0 ).rgb );
      }
      mean /= 16.0;
      float mx = max( texel.r, max( texel.g, texel.b ) );
      float mn = min( texel.r, min( texel.g, texel.b ) );
      float sat = ( mx - mn ) / max( mx, 1e-3 );
      float lit = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );
      float stands = smoothstep( 0.03, 0.2, v - mean );
      float coloured = mix( whiteDamp, 1.0, smoothstep( 0.18, 0.5, sat ) );
      float blown = smoothstep( 1.0, 1.3, v );
      alpha = clamp( lit * stands * coloured + blown, 0.0, 1.0 );
      texel.rgb *= bloomTint;
    }
    vec4 bright = mix( outputColor, texel, alpha );
    gl_FragColor = vec4( bright.rgb * mix( 1.0, clamp( texel.a, 0.0, 1.0 ), figureMask ), bright.a );
  }
`;

/** Swap the bloom pass's bright-pass for the masked one (strength 0 until a palette sets it). Idempotent. */
export function maskBloomHighPass(pass: UnrealBloomPass): void {
  const m = pass.materialHighPassFilter;
  m.uniforms['figureMask'] ??= { value: 0 };
  // Eye-candy option A's selective bright-pass: 0 = the plain luma cut above (every build without `?fx=a`).
  m.uniforms['selective'] ??= { value: 0 };
  m.uniforms['whiteDamp'] ??= { value: 1 };
  m.uniforms['bloomTint'] ??= { value: new Vector3(1, 1, 1) };
  m.uniforms['uTexel'] ??= { value: new Vector2(1 / 1600, 1 / 900) };
  if (m.fragmentShader === MASKED_HIGH_PASS) return;
  m.fragmentShader = MASKED_HIGH_PASS;
  m.needsUpdate = true;
}

/** How much of the figure mask the bright-pass applies, 0..1 (see the header). */
export function setFigureBloomMask(pass: UnrealBloomPass, strength: number): void {
  maskBloomHighPass(pass);
  pass.materialHighPassFilter.uniforms['figureMask']!.value = Math.min(1, Math.max(0, strength));
}

/**
 * Whether a figure painted from `artId` writes the mask: every figure when the
 * scene names none (`only` unset), otherwise only the named ones.
 */
export function figureBloomMasked(only: readonly string[] | undefined, artId: string): boolean {
  return !only || only.includes(artId);
}
