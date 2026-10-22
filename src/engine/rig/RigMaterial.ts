/**
 * The painted shader of the game (`shaders/PaintedShader.ts`: tint, brightness, additive hit flash, rim light, ground bounce, contact darkening, quiet dim, dissolve)
 * for a rig's part meshes, with four string patches of the game's own source (the prototype's three, plus the dissolve's noise):
 *   - the contact darkening, the ground bounce and the dissolve's sweep read the vertex's HEIGHT above the figure's ground (`vH`, 0 at the plane's foot to 1 at its
 *     top), not the part's own UV: a lifted foot is not dark and a part is not eaten on its own schedule;
 *   - the dissolve's noise reads FIGURE coordinates (`vFig`), so the pyrefly death is one pattern across all the parts, not one per part;
 *   - the rim light runs only along the painting's own outline (`rimMask`, baked per part) and never along a cut between two parts (`rimOn`), and a part with no
 *     rim at all takes none (`rimGain` 0);
 *   - everything else (uniform names, blending, alpha cut, flash maths) is the game's, so a flash, tint or dim on the actor lands on the parts the same way.
 * The uniform cells the actor owns are shared BY REFERENCE, so every state the stage sets on the actor reaches the parts. The seam-makers are NOT shared: the
 * edge feather and the erode work on a texture's border, and a part's border is a cut (they are zero here).
 *
 * The mesh positions are the idle plane's own normalised coordinates (x -0.5..0.5, y -0.5..0.5), so `vH` is `position.y + 0.5`.
 */
import { DoubleSide, ShaderMaterial, Vector2, type Texture } from 'three';
import { PAINTED_BLENDING } from '../BloomMask.ts';
import { RELIGHT_VARYINGS, RELIGHT_VERTEX, paintedFragmentShader } from '../shaders/PaintedShader.ts';
import { RELIGHT_DEFINES, relightUniforms } from '../look/relight/RigRelight.ts'; // the HD-2D look: a part lit with its normal piece (release 61)

export type SharedUniforms = Record<string, { value: unknown }>;

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vH;
  varying vec2 vFig;
  ${RELIGHT_VARYINGS}
  void main() {
    vUv = uv;
    vH = position.y + 0.5;
    vFig = vec2(position.x + 0.5, vH);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    ${RELIGHT_VERTEX}
  }
`;

/** The patches, in order. Exported so a test can prove each one still applies to the game's shader. */
export const SHADER_PATCHES: ReadonlyArray<readonly [from: string, to: string]> = [
  ['varying vec2 vUv;', 'varying vec2 vUv;\n  varying float vH;\n  varying vec2 vFig;\n  uniform sampler2D rimMask;\n  uniform float rimOn;\n  uniform float rimGain;'],
  ['float edge = clamp(a - inward, 0.0, 1.0);', 'float edge = clamp(a - inward, 0.0, 1.0) * mix(1.0, texture2D(rimMask, uv).r, rimOn) * rimGain;'],
  ['float up = 1.0 - smoothstep(0.0, max(0.08, contactBand * 4.2), vUv.y);', 'float up = 1.0 - smoothstep(0.0, max(0.08, contactBand * 4.2), vH);'],
  ['float contact = mix(1.0 - groundShade, 1.0, smoothstep(0.0, max(0.01, contactBand), vUv.y));', 'float contact = mix(1.0 - groundShade, 1.0, smoothstep(0.0, max(0.01, contactBand), vH));'],
  ['float n = texture2D(noiseMap, uv * vec2(1.6, 2.4)).r;', 'float n = texture2D(noiseMap, vFig * vec2(1.6, 2.4)).r;'],
  ['float plain = clamp(n * 0.72 + (1.0 - vUv.y) * 0.34, 0.0, 1.0);', 'float plain = clamp(n * 0.72 + (1.0 - vH) * 0.34, 0.0, 1.0);'],
  ['float sweep = clamp(n * 0.56 + vUv.y * 0.44, 0.0, 1.0);', 'float sweep = clamp(n * 0.56 + vH * 0.44, 0.0, 1.0);'],
  // the smear (motion pass, step 2): the streak is given in the FIGURE's coordinates (vFig); a part's uv is its own cut of the painting, and a limb is turned, so the streak is carried into the
  // part's uv through the screen-space derivatives of the two coordinates (duv/dFig = [dUv/dx dUv/dy] * inverse([dFig/dx dFig/dy])).
  [
    'vec2 smearUvVec(vec2 v) { return v; }',
    `vec2 smearUvVec(vec2 v) {
    vec2 fx = dFdx(vFig);
    vec2 fy = dFdy(vFig);
    float det = fx.x * fy.y - fx.y * fy.x;
    if (abs(det) < 1e-12) return v;
    vec2 w = vec2(fy.y * v.x - fy.x * v.y, fx.x * v.y - fx.y * v.x) / det;
    return dFdx(vUv) * w.x + dFdy(vUv) * w.y;
  }`,
  ],
];

/** Apply the patches to `src`; throws when the game's shader no longer contains one of them (the stage then draws the painting set). */
export function patchPaintedShader(src: string): string {
  let s = src;
  for (const [from, to] of SHADER_PATCHES) {
    if (!s.includes(from)) throw new Error(`painted shader changed: cannot find ${from.slice(0, 60)}`);
    s = s.split(from).join(to);
  }
  return s;
}

let FRAG: string | null = null;
const fragment = (): string => (FRAG ??= patchPaintedShader(paintedFragmentShader));

export interface PartMaterialOptions {
  /** The actor's own uniform cells, shared by reference. */
  shared: SharedUniforms;
  /** The idle plane's contact band cell (`contactBandFor` of its height), shared by reference so a resize follows. */
  contactBand: { value: unknown };
  map: Texture;
  rimMask: Texture;
  rimMode: 'mask' | 'all' | 'off';
  /** The part's box size in painting px, and painting px per texel of the texture the game binds for the idle (the rim's width is measured in those). */
  boxW: number;
  boxH: number;
  rimTexelK: number;
  /** The HD-2D look (release 61): the material is built lit (the painted shader's relight block compiles in, the light cells are shared); a normal piece is bound per look with `setPartNormal`. Default off. */
  relight?: boolean;
}

export function makePartMaterial(o: PartMaterialOptions): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      ...(o.shared as Record<string, { value: unknown }>),
      map: { value: o.map },
      rimMask: { value: o.rimMask },
      rimOn: { value: o.rimMode === 'mask' ? 1 : 0 },
      rimGain: { value: o.rimMode === 'off' ? 0 : 1 },
      opacity: { value: 1 },
      texel: { value: new Vector2(o.rimTexelK / Math.max(1, o.boxW), o.rimTexelK / Math.max(1, o.boxH)) },
      contactBand: o.contactBand,
      // a part's border is a cut: no feather, no erode (see the file header)
      edgeFade: { value: 0 },
      edgeFadeBase: { value: 1 },
      edgeJag: { value: 0 },
      erode: { value: 0 },
      ...(o.relight ? relightUniforms() : {}),
    },
    ...(o.relight ? { defines: { ...RELIGHT_DEFINES } } : {}),
    vertexShader: VERT,
    fragmentShader: fragment(),
    transparent: true,
    ...PAINTED_BLENDING,
    depthWrite: false,
    depthTest: true,
    side: DoubleSide,
  });
}

/** Re-measure a part's rim width after the game bound a different tier of the idle (`rimTexelK` changed). */
export function setPartTexel(m: ShaderMaterial, rimTexelK: number, boxW: number, boxH: number): void {
  (m.uniforms['texel']!.value as Vector2).set(rimTexelK / Math.max(1, boxW), rimTexelK / Math.max(1, boxH));
}
