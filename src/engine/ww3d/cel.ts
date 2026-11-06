/**
 * **The anime cel material** (the hidden anime chapter; FFX-2 only): ported from the look lab's `anime.mjs` (the Genshin Impact / Guilty Gear Strive manner on the Meshy toon cast). The method is the Wind Waker toon's
 * (`./toon.ts`): a stock `MeshToonMaterial`, so skinning, fog, the sun's shadow map and the base-colour map keep working, whose lighting chunks are replaced in `onBeforeCompile`. The fragment program is the cel; the
 * vertex program gets ONE extra per-vertex attribute (`aFace`, the face mask, `./faceMask.ts`) and nothing else, so animation is untouched.
 *
 * ```
 * shade = mix( shadowColour, litColour, lit )     lit = smoothstep terminator on N.L x sun-shadow band   (the width is widened to the pixel, so the edge never aliases)
 * shadowColour = pow( albedo, shadowSat ) x RAMP( g )   RAMP = a 64 x 1 texture: g is how deep into the shadow ( 0 = deepest, 1 = at the terminator ), so the shadow side keeps a soft, tinted gradient, never grey
 * ```
 *
 * - **The face** (`aFace` 0..1, from the head bones' skin weights): no received shadow, no terminator, no ramp darkening and no rim, one even light, so a face has no blotches and no nose shadow.
 * - **The rim**: a fresnel band on the lit side, soft for Genshin and narrow and bright for Guilty Gear; a dark surface (brown hair, black cloth) rims in a lighter shade of itself, so hair keeps its real colour.
 * - **Flat mode** (`uAFlat`, Guilty Gear and the blend): one flat tinted mid-tone in shadow in place of the ramp, floored so it never goes near black.
 * - **The cast aura and the ceiling** are the Wind Waker toon's (`uToonGlow`, `uToonGlowShape`, `uToonCeil`), under the same names, so the skin's cast glow, the hit flash and the stone grey (`./toonify.ts` `driveToon`) drive a cel
 *   figure unchanged, and the game's whole-colour bloom (`./post.ts`) still sees only the glows.
 *
 * **Three looks, one table** ({@link CEL_LOOKS}): `genshin` (the default: soft terminator, soft gradient inside the shadow, a pale warm rim, a thin brown line), `gg` (a razor terminator, one flat violet shadow, a narrow bright
 * rim, a thick near-black line) and `blend` (Guilty Gear's lines and shadows on Genshin's light). Every number is a starting point judged by eye (Bailey has not picked: he picks by playing, `?look=gg|blend`).
 *
 * Pure string work on the shader ({@link patchCelShader}), so a test runs it against three's own chunks without a GPU. Game case: FFX-2 only.
 */

import {
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  FrontSide,
  LinearFilter,
  MeshToonMaterial,
  NoColorSpace,
  RGBAFormat,
  ShaderChunk,
  Vector2,
  Vector3,
  Vector4,
  type IUniform,
  type Side,
  type Texture,
} from 'three';
import { TOON_CEILING, patchLightsBegin, type ShaderLike } from './toon.ts';
import type { ToonVariantName } from './toon.ts';

export type CelLookName = 'genshin' | 'gg' | 'blend';
export const CEL_LOOK_NAMES: readonly CelLookName[] = ['genshin', 'gg', 'blend'];

/** The default look (the survey's recommendation: Genshin is the clearest of the three frames and has the least artefact risk; Bailey has not chosen). */
export const DEFAULT_CEL_LOOK: CelLookName = 'genshin';

/** A ramp stop: a position 0..1 along the ramp and a linear colour multiplier. */
export type RampStop = readonly [number, readonly [number, number, number]];

/** The outline of a look: width in metres at 4 m from the lens, the depth exponent, the share kept facing the lens, the line colour, and how much of the albedo tints it. */
export interface OutlineRow {
  readonly width: number;
  readonly pow: number;
  readonly inner: number;
  readonly dark: string;
  readonly albedoMix: number;
  readonly albedoDark: number;
}

/** One look: the shader's numbers, the outline, the stage's variant and how thin the line runs round a face. */
export interface CelLook {
  readonly label: string;
  /** x terminator on N.L, y its width, z the sun-shadow band's width, w (unused: the face is handled by the mask). */
  readonly at: readonly [number, number, number, number];
  /** x shadow saturation exponent, y rim starts at this N.V, z its width, w its strength. */
  readonly shade: readonly [number, number, number, number];
  readonly rim: string;
  /** A linear multiplier of the lit side: neutralises the stage's warm key light so a lit pixel is the texture's own colour. */
  readonly lit: readonly [number, number, number];
  /** x albedo saturation, y flatten amount, z flatten levels, w exposure. */
  readonly alb: readonly [number, number, number, number];
  /** Flat-shadow mode: rgb the multiplier of the albedo in shadow (0 = use the ramp), a a floor. */
  readonly flat: readonly [number, number, number, number];
  readonly ramp: readonly RampStop[];
  readonly outline: OutlineRow;
  /** The Wind Waker toon variant the temple and the weapons' stand-ins take (`./toon.ts`): `hd` has bloom, `classic` none. */
  readonly stage: ToonVariantName;
  /** The share of the outline kept round the face's edge (0 = none). */
  readonly faceThin: number;
}

// The stage's key light is warm (sun fff0d0 plus a warm ground bounce: measured on a lit face, light/raw = 1.16, 1.06, 0.78 in R, G, B), so the CHARACTERS get a neutralising multiplier.
const LIT = (k: number): readonly [number, number, number] => [0.864 * k, 0.945 * k, 1.29 * k];

export const CEL_LOOKS: Readonly<Record<CelLookName, CelLook>> = {
  genshin: {
    label: 'Soft cel', // the labels ship in the bundle: no brand name in them (the look keys are the dev query words)
    at: [0.2, 0.06, 0.12, 0],
    shade: [1.22, 0.45, 0.4, 0.3],
    rim: '#ffe3c2',
    lit: LIT(0.98),
    alb: [1.02, 0, 7, 1.0],
    flat: [0, 0, 0, 0],
    ramp: [[0, [0.5, 0.48, 0.78]], [0.55, [0.7, 0.62, 0.84]], [1, [0.9, 0.78, 0.86]]],
    outline: { width: 0.0075, pow: 0.9, inner: 0.6, dark: '#2b160c', albedoMix: 0.35, albedoDark: 0.22 },
    stage: 'hd',
    faceThin: 0.55,
  },
  gg: {
    label: 'Hard cel',
    at: [0.12, 0.004, 0.02, 0],
    shade: [1.5, 0.6, 0.07, 0.6],
    rim: '#e6f0ff',
    lit: LIT(1.0),
    alb: [1.2, 0, 6, 1.0],
    // flat is in LINEAR light: [0.34, 0.36, 0.5] is about 0.63 of the lit colour as displayed (sRGB), a cool violet mid-tone
    flat: [0.34, 0.36, 0.5, 0.012],
    ramp: [[0, [0.46, 0.42, 0.78]], [1, [0.5, 0.46, 0.8]]],
    outline: { width: 0.021, pow: 1.25, inner: 0.35, dark: '#0b0710', albedoMix: 0.55, albedoDark: 0.15 }, // thick, and thinner inside the figure than at its silhouette
    stage: 'classic',
    faceThin: 0.4,
  },
  blend: {
    label: 'Blend: soft light, hard shadows and lines',
    at: [0.14, 0.006, 0.03, 0],
    shade: [1.35, 0.5, 0.2, 0.6],
    rim: '#ffe9cf',
    lit: LIT(0.98),
    alb: [1.12, 0, 6, 1.0],
    flat: [0.34, 0.36, 0.5, 0.012],
    ramp: [[0, [0.48, 0.45, 0.78]], [0.6, [0.62, 0.55, 0.82]], [1, [0.7, 0.62, 0.82]]],
    outline: { width: 0.021, pow: 1.25, inner: 0.35, dark: '#0b0710', albedoMix: 0.55, albedoDark: 0.15 }, // Guilty Gear's lines exactly
    stage: 'hd',
    faceThin: 0.4,
  },
};

/** The look a page asks for with `?look=genshin|gg|blend`; anything else, or nothing, is {@link DEFAULT_CEL_LOOK}. */
export function lookFromSearch(search: string): CelLookName {
  const v = new URLSearchParams(search).get('look');
  return v !== null && Object.prototype.hasOwnProperty.call(CEL_LOOKS, v) ? (v as CelLookName) : DEFAULT_CEL_LOOK;
}

/** The uniforms every cel material of one look shares. */
export interface CelUniforms {
  uAT: IUniform<Vector4>;
  uAShade: IUniform<Vector4>;
  uARim: IUniform<Vector3>;
  uALit: IUniform<Vector3>;
  uAAlb: IUniform<Vector4>;
  uARamp: IUniform<Texture>;
  uAFlat: IUniform<Vector4>;
  /** 0 = shaded, 1 = the face mask (red = face), 2 = the raw base colour. */
  uADbg: IUniform<number>;
  /** The Wind Waker toon's, under the same names (`./toon.ts`): the ceiling, and this set's cast aura (a figure replaces the two aura cells with its own). */
  uToonCeil: IUniform<number>;
  uToonGlow: IUniform<Vector4>;
  uToonGlowShape: IUniform<Vector2>;
  [name: string]: IUniform;
}

export const CEL_PARS = /* glsl */ `
varying vec3 vViewPosition;
varying float vFace;

uniform vec4 uAT;      // x terminator on N.L, y terminator width, z sun-shadow band width, w unused
uniform vec4 uAShade;  // x shadow saturation exponent, y rim start (N.V), z rim width, w rim strength
uniform vec3 uARim;    // rim colour
uniform vec3 uALit;    // multiplier of the lit side
uniform vec4 uAAlb;    // x albedo saturation, y flatten amount, z flatten levels, w exposure
uniform sampler2D uARamp;
uniform vec4 uAFlat;   // flat-shadow mode: rgb = multiplier of the albedo in shadow (0 = use the ramp), a = floor
uniform float uADbg;   // 1 = show the face mask (red) instead of the shading, 2 = the raw base colour
uniform float uToonCeil;       // the most a lit surface may reach (linear)
uniform vec4 uToonGlow;        // the cast aura: rgb the rim colour, a the strength (0 = none)
uniform vec2 uToonGlowShape;   // where the aura's two steps end on N.V: x the strong band, y the lighter step

float gToonShadow = 1.0;       // sun shadow band, written by the patched shadow line in lights_fragment_begin
float gCelLit = 0.0;
float gCelG = 1.0;
float gCelRim = 0.0;
vec3 gCelSun = vec3( 0.0 );

float toonShadowBand( float s ) {

	return smoothstep( 0.5 - uAT.z, 0.5 + uAT.z, s );

}

struct ToonMaterial {

	vec3 diffuseColor;

};

void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {

	float NdL = dot( geometryNormal, directLight.direction );
	float w = max( uAT.y, fwidth( NdL ) * 0.6 );
	float faceK = smoothstep( 0.3, 0.75, vFace );    // the FACE (every look): no received shadow, no terminator, no ramp darkening, no rim: one even light
	float sh = mix( gToonShadow, 1.0, faceK );
	gToonShadow = 1.0;

	float lit = smoothstep( uAT.x - w, uAT.x + w, NdL ) * sh;
	lit = mix( lit, 1.0, faceK );
	float g = smoothstep( -0.65, uAT.x, NdL );          // 0 deep in the shadow .. 1 at the terminator
	g = mix( g, 0.32, 1.0 - sh );                       // a cast shadow takes the middle of the ramp
	float NdV = max( dot( geometryNormal, geometryViewDir ), 0.0 );
	float rim = ( 1.0 - smoothstep( uAShade.y, uAShade.y + uAShade.z, NdV ) ) * smoothstep( -0.1, 0.4, NdL ) * mix( sh, 1.0, 0.5 ) * ( 1.0 - faceK );

	gCelSun += directLight.color;
	gCelLit = max( gCelLit, lit );
	gCelG = g;
	gCelRim = max( gCelRim, rim );

}

void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {

	vec3 base = material.diffuseColor;
	vec3 shadowAlbedo = pow( base, vec3( uAShade.x ) );
	vec3 ramp = texture2D( uARamp, vec2( clamp( gCelG, 0.0, 1.0 ), 0.5 ) ).rgb;
	vec3 litAlbedo = base * uALit;
	if ( uAFlat.r > 0.0 ) {                          // gg / blend: ONE flat tinted mid-tone, a fixed share of the lit colour, floored so it never goes near black
		shadowAlbedo = min( max( base * uAFlat.rgb, vec3( uAFlat.a ) * vec3( 0.8, 0.8, 1.2 ) ), litAlbedo * 0.92 );
		ramp = vec3( 1.0 );
	}
	vec3 col = mix( shadowAlbedo * ramp, litAlbedo, gCelLit ) * ( gCelSun + irradiance );
	float baseL = dot( base, vec3( 0.2126, 0.7152, 0.0722 ) );
	vec3 rimCol = mix( base * 1.6, uARim, smoothstep( 0.08, 0.5, baseL ) );   // dark surfaces rim in a lighter shade of themselves, never a pale tint: hair keeps its real colour
	col += rimCol * ( uAShade.w * gCelRim ) * ( 0.35 + 0.65 * base );
	if ( uADbg > 1.5 ) col = base;
	else if ( uADbg > 0.5 ) col = vec3( vFace, 0.12, 1.0 - vFace ) * 0.6;
	// the cast aura (the Wind Waker toon's, ./toon.ts): two hard-edged steps of the silhouette in the spell's colour, mixed over the lit colour, zero everywhere else
	float glowNdV = max( dot( geometryNormal, geometryViewDir ), 0.0 );
	float glowW = max( 0.02, fwidth( glowNdV ) );
	float glowInner = 1.0 - smoothstep( uToonGlowShape.x - glowW, uToonGlowShape.x + glowW, glowNdV );
	float glowOuter = 1.0 - smoothstep( uToonGlowShape.y - glowW, uToonGlowShape.y + glowW, glowNdV );
	float glowBand = max( glowInner, 0.2 * glowOuter ); // the cel girl: the outer step is half the Wind Waker toon's (0.4): at 0.4 the whole white top of a cast Yuna washed yellow (part 1 stills)
	reflectedLight.indirectDiffuse += mix( min( col, vec3( uToonCeil ) ), uToonGlow.rgb * 1.15, glowBand * uToonGlow.a );

}

#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon
`;

export const CEL_FRAG = /* glsl */ `
ToonMaterial material;
{
	vec3 c = diffuseColor.rgb;
	float l = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );
	c = max( mix( vec3( l ), c, uAAlb.x ), vec3( 0.0 ) );
	vec3 q = floor( c * uAAlb.z + 0.5 ) / uAAlb.z;
	material.diffuseColor = mix( c, q, uAAlb.y ) * uAAlb.w;
}
`;

/**
 * Patch a toon program into the cel: the fragment program's lighting chunks and the shadow line, the ceiling on the final colour, and the vertex program's one attribute. Returns what went wrong, if anything; on a problem the
 * shader is left untouched (the material then draws as three's stock toon).
 */
export function patchCelShader(shader: ShaderLike, uniforms: Record<string, IUniform>): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  let f = shader.fragmentShader;
  let v = shader.vertexShader;
  const swapF = (include: string, text: string): void => {
    if (!f.includes(include)) {
      problems.push(`missing ${include}`);
      return;
    }
    f = f.replace(include, () => text);
  };
  swapF('#include <lights_toon_pars_fragment>', CEL_PARS);
  swapF('#include <lights_toon_fragment>', CEL_FRAG);
  const OUT = 'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;';
  if (!f.includes(OUT)) problems.push('outgoingLight line of meshtoon_frag not found');
  else f = f.replace(OUT, () => `${OUT}\n\toutgoingLight = min( outgoingLight, vec3( uToonCeil ) );`);
  const begin = patchLightsBegin(ShaderChunk['lights_fragment_begin']);
  if (!begin) problems.push('directional shadow line of lights_fragment_begin not found');
  else swapF('#include <lights_fragment_begin>', begin);
  if (!v.includes('#include <common>') || !v.includes('#include <begin_vertex>')) problems.push('vertex includes missing');
  else {
    v = v.replace('#include <common>', () => '#include <common>\nattribute float aFace;\nvarying float vFace;');
    v = v.replace('#include <begin_vertex>', () => '#include <begin_vertex>\nvFace = aFace;');
  }
  if (problems.length === 0) {
    shader.fragmentShader = f;
    shader.vertexShader = v;
    Object.assign(shader.uniforms, uniforms);
  }
  return { ok: problems.length === 0, problems };
}

/** The ramp texture: 64 x 1, left = deep in the shadow, right = at the terminator; a plain multiplier of the (already linear) albedo. */
export function makeRamp(stops: readonly RampStop[]): DataTexture {
  const n = 64;
  const data = new Uint8Array(n * 4);
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    let k = 0;
    while (k < stops.length - 2 && u > stops[k + 1]![0]) k++;
    const [u0, c0] = stops[k]!;
    const [u1, c1] = stops[k + 1]!;
    const t = Math.min(1, Math.max(0, (u - u0) / Math.max(1e-6, u1 - u0)));
    for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(255 * lerp(c0[c]!, c1[c]!, t));
    data[i * 4 + 3] = 255;
  }
  const tex = new DataTexture(data, n, 1, RGBAFormat);
  tex.colorSpace = NoColorSpace;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/** The shared uniforms of a look (a figure replaces the two aura cells with its own, `./celify.ts`). */
export function createCelUniforms(look: CelLook): CelUniforms {
  const rim = new Color(look.rim);
  return {
    uAT: { value: new Vector4(...look.at) },
    uAShade: { value: new Vector4(...look.shade) },
    uARim: { value: new Vector3(rim.r, rim.g, rim.b) },
    uALit: { value: new Vector3(...look.lit) },
    uAAlb: { value: new Vector4(...look.alb) },
    uARamp: { value: makeRamp(look.ramp) },
    uAFlat: { value: new Vector4(...look.flat) },
    uADbg: { value: 0 },
    uToonCeil: { value: TOON_CEILING },
    uToonGlow: { value: new Vector4(1, 0.78, 0.3, 0) },
    uToonGlowShape: { value: new Vector2(0.34, 0.5) },
  };
}

/** What a cel material is made from. */
export interface CelOptions {
  color?: number | Color;
  map?: Texture | null;
  side?: Side;
  transparent?: boolean;
  opacity?: number;
  alphaTest?: number;
  /** Part of the program cache key, for a variant of the vertex shader (the wing flap). */
  cacheKey?: string;
  /** Called with the program in `onBeforeCompile`, after the cel patch (the wing flap patches the vertex shader here). */
  onVertex?: (shader: ShaderLike) => void;
}

/** A cel material over the shared `uniforms`. */
export function makeCelMaterial(uniforms: Record<string, IUniform>, opts: CelOptions = {}): MeshToonMaterial {
  const m = new MeshToonMaterial({
    color: opts.color ?? 0xffffff,
    map: opts.map ?? null,
    side: opts.side ?? FrontSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    alphaTest: opts.alphaTest ?? 0,
    fog: true,
  });
  m.onBeforeCompile = (shader): void => {
    const r = patchCelShader(shader as unknown as ShaderLike, uniforms);
    if (!r.ok) console.error(`[ww3d] cel patch failed: ${r.problems.join('; ')}`);
    opts.onVertex?.(shader as unknown as ShaderLike);
  };
  m.customProgramCacheKey = (): string => `ww-cel-v1${opts.cacheKey ?? ''}`;
  m.userData['ww'] = 'cel';
  m.userData['uniforms'] = uniforms;
  return m;
}
