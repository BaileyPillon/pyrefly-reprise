/**
 * **The flash and the glow as a rim accent** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only). A hit's flash and a cast's glow used to be a flat emissive added to the whole body: on the AI
 * Bahamut's near-black armour that turned him into one salmon or pink silhouette for the length of the flash (his armour, gold trim and wings gone), and the casters flared to white. Bailey rejected flat silhouettes and bloom.
 *
 * The accent now **follows the surface's angle to the camera**: a face looking at the camera takes `ACCENT.body` of the accent, a face turned away takes all of it (a fresnel falloff of power `ACCENT.power`), so a hit
 * still reads as a bright edge and a flush of colour, and the armour's own shading, the gold and the wings stay visible through the middle of the body. The strength itself is capped far lower than the old whole-body
 * flat (`ACCENT.flash`, `ACCENT.glow`: a share of the full emissive, for the boss and for the girls). The flash's own length is the presenter's (a hit's is 200 ms, with a quadratic ease-out: half gone in about 60 ms).
 *
 * The rim is a few lines of fragment shader after three's own emissive step (the normal, normal map included, is known by then): `patchRim`, chained after anything else a material patches (the wing flap), under a program key of its
 * own. Game case: FFX-2 only. Needs three.js only; no DOM.
 */

import type { Material } from 'three';

/**
 * **THE CAPS.** Shares of full emissive the flash (a hit's colour, a heal's, a caster's glow-up) and the cast glow reach, for the boss and for the party: the old whole-body gains were 0.42 and 0.3 for everyone, which
 * washed the figures out. `body` is the share of the accent a surface facing the camera takes (0 would leave the middle of the body bare), `power` how fast the accent falls toward the middle (higher keeps it to the very edge).
 */
export const ACCENT = {
  flash: { boss: 0.3, party: 0.24 },
  glow: { boss: 0.2, party: 0.16 },
  body: 0.25,
  power: 2.2,
} as const;

/** The fraction of the accent a surface takes when its normal makes `facing` (0 to 1: the cosine to the camera) with the view: the shader's own formula, for the tests. */
export function rimShare(facing: number): number {
  const f = Math.min(1, Math.max(0, facing));
  return ACCENT.body + (1 - ACCENT.body) * Math.pow(1 - f, ACCENT.power);
}

const num = (n: number): string => (Number.isInteger(n) ? `${n}.0` : String(n));

/** The fragment step: after `emissivemap_fragment` (where the emissive is final and `normal` is set), scale the emissive by the rim share. */
const RIM_GLSL = [
  '#include <emissivemap_fragment>',
  '{',
  '  float yrpFacing = clamp( dot( normal, normalize( vViewPosition ) ), 0.0, 1.0 );',
  `  totalEmissiveRadiance *= ${num(ACCENT.body)} + ${num(1 - ACCENT.body)} * pow( 1.0 - yrpFacing, ${num(ACCENT.power)} );`,
  '}',
].join('\n');

/** Add the rim to a fragment shader. */
export function withRim(shader: { fragmentShader: string }): void {
  shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', RIM_GLSL);
}

/** Make `material`'s emissive a rim accent: its compile gets the rim step (after whatever it already patches), under a program key of its own. */
export function patchRim(material: Material): void {
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    withRim(shader);
  };
  const key = material.customProgramCacheKey;
  material.customProgramCacheKey = () => `${key.call(material)}|yrp-rim`;
}
