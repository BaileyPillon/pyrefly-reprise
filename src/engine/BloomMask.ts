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
 * GAME-AWARE (AGENTS.md rule 14): **both games.** The renderer and the painted
 * actor are shared by every chapter; the white-costume case was observed in
 * FFX-2 (Yuna Gunner / White Mage, Leblanc), and FFX's paintings (Yuna's white
 * sleeves, Lulu's pale skin) take the same whole-frame bloom, so they are
 * covered by the same rule rather than by a per-game exception.
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
  varying vec2 vUv;
  void main() {
    vec4 texel = texture2D( tDiffuse, vUv );
    float v = luminance( texel.xyz );
    vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );
    float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );
    vec4 bright = mix( outputColor, texel, alpha );
    gl_FragColor = vec4( bright.rgb * clamp( texel.a, 0.0, 1.0 ), bright.a );
  }
`;

/** Swap the bloom pass's bright-pass for the masked one. Idempotent. */
export function maskBloomHighPass(pass: UnrealBloomPass): void {
  const m = pass.materialHighPassFilter;
  if (m.fragmentShader === MASKED_HIGH_PASS) return;
  m.fragmentShader = MASKED_HIGH_PASS;
  m.needsUpdate = true;
}
