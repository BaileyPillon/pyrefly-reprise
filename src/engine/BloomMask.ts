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
 */

import {
  CustomBlending,
  NormalBlending,
  OneMinusSrcAlphaFactor,
  SrcAlphaFactor,
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

/** Mask on while the painting is whole; plain normal blending while it dissolves. */
export function syncPaintedBloom(material: ShaderMaterial, dissolving: boolean): void {
  const want = dissolving ? NormalBlending : CustomBlending;
  if (material.blending !== want) material.blending = want;
}

/** The bright-pass, weighted by the frame's alpha (the mask above). */
const MASKED_HIGH_PASS = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec3 defaultColor;
  uniform float defaultOpacity;
  uniform float luminosityThreshold;
  uniform float smoothWidth;
  uniform float figureMask;
  varying vec2 vUv;
  void main() {
    vec4 texel = texture2D( tDiffuse, vUv );
    float v = luminance( texel.xyz );
    vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );
    float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );
    vec4 bright = mix( outputColor, texel, alpha );
    gl_FragColor = vec4( bright.rgb * mix( 1.0, clamp( texel.a, 0.0, 1.0 ), figureMask ), bright.a );
  }
`;

/** Swap the bloom pass's bright-pass for the masked one (strength 0 until a palette sets it). Idempotent. */
export function maskBloomHighPass(pass: UnrealBloomPass): void {
  const m = pass.materialHighPassFilter;
  m.uniforms['figureMask'] ??= { value: 0 };
  if (m.fragmentShader === MASKED_HIGH_PASS) return;
  m.fragmentShader = MASKED_HIGH_PASS;
  m.needsUpdate = true;
}

/** How much of the figure mask the bright-pass applies, 0..1 (see the header). */
export function setFigureBloomMask(pass: UnrealBloomPass, strength: number): void {
  maskBloomHighPass(pass);
  pass.materialHighPassFilter.uniforms['figureMask']!.value = Math.min(1, Math.max(0, strength));
}
