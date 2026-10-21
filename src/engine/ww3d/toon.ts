/**
 * **The Wind Waker toon material** (the hidden Wind Waker chapter; FFX-2 only): ported from the look lab's `js/toon.mjs`, the approved look.
 *
 * Method: a stock `MeshToonMaterial` (so skinning, morph targets, instancing, fog, sun shadows and the base-colour map keep working) whose lighting chunks are replaced in `onBeforeCompile`. Only the FRAGMENT shader
 * changes; the vertex shader, and with it `SkinnedMesh` animation, is untouched (a vertex hook is offered for Valefor's wing flap, `./wing.ts`).
 *
 * ```
 * final = albedo x ( sun + sky fill ) x mix( shadowTint, 1, lit )          lit = N.L band x sun-shadow band
 * ```
 *
 * - two bands with a hard terminator (a smoothstep `termW` wide, widened to the pixel footprint so it never aliases);
 * - the sun shadow-map result is thresholded into the same band (`toonShadowBand`);
 * - the shadow side is the albedo times a cool blue-violet tint, never toward grey or black;
 * - no specular, no environment: metalness and roughness do not exist in this model;
 * - an optional very thin highlight band and an optional thin warm rim on the lit edge;
 * - **a ceiling** (`uToonCeil`): the lit colour is clamped just under 1.0, so an ordinary lit surface never reaches the bloom's threshold and only the glows (the flames, the light shaft, the sky's sun) do. The lab
 *   passed only the excess above 1.0 to its bloom; the game's bloom keeps the whole colour of a pixel above its threshold, and this ceiling is what makes the two the same picture.
 *
 * Two variants of the numbers (the lab's, judged by Bailey in motion; **`hd` is the default**, "HD (Recommended)"): `hd` (a soft-edged terminator, a thin warm rim, a little more saturation, bloom on) and `classic`
 * (a razor-hard terminator, no rim, more saturation, no bloom). `hd-soft` is `hd` with half the bloom.
 *
 * Pure string work on the shader (`patchToonShader`) so a test can run it against three's own chunks without a GPU. Game case: FFX-2 only.
 */

import { Color, FrontSide, MeshToonMaterial, ShaderChunk, SRGBColorSpace, Vector2, Vector4, type IUniform, type Side, type Texture } from 'three';

/** The uniforms every toon material shares (one set per look; a few surfaces take a copy with one cell changed, `withUniforms`). */
export interface ToonUniforms {
  /** x terminator on N.L, y terminator width, z shadow-band width, w highlight band on. */
  uToonBand: IUniform<Vector4>;
  /** x highlight threshold on N.L, y highlight gain. */
  uToonHi: IUniform<Vector2>;
  /** Multiplier for the shadow side (linear working space). */
  uToonShadowTint: IUniform<Color>;
  /** rgb rim colour, a strength. */
  uToonRim: IUniform<Vector4>;
  /** x N.V where the rim starts to fade in, y its width. */
  uToonRimShape: IUniform<Vector2>;
  /** Albedo saturation (1 = as painted). */
  uToonSat: IUniform<number>;
  /** The most a lit surface may reach (linear), just under the bloom's threshold. */
  uToonCeil: IUniform<number>;
  [name: string]: IUniform;
}

/** The look's numbers. */
export interface ToonVariant {
  readonly label: string;
  /** Bloom strength, threshold and radius (the scene palette's, `./post.ts`). */
  readonly bloom: number;
  readonly bloomThreshold: number;
  readonly bloomRadius: number;
  /** The terminator on N.L, its width, and the shadow-band width. */
  readonly term: number;
  readonly termW: number;
  readonly shadowW: number;
  /** The rim strength and the albedo saturation. */
  readonly rim: number;
  readonly sat: number;
  readonly highlight: boolean;
  /** The shadow tint (a hex colour) and how far white is pulled toward it. */
  readonly tint: string;
  readonly tintStrength: number;
}

export const TOON_VARIANTS = {
  // Wind Waker HD: bloom on, a soft-edged terminator about 0.03 wide, a thin warm rim.
  hd: { label: 'Wind Waker HD', bloom: 0.6, bloomThreshold: 1.0, bloomRadius: 0.5, term: 0.15, termW: 0.03, shadowW: 0.1, rim: 0.5, sat: 1.15, highlight: false, tint: '#6a6fb5', tintStrength: 0.65 },
  // The same with half the bloom (the lab's `hd-soft`).
  'hd-soft': { label: 'Wind Waker HD, soft bloom', bloom: 0.3, bloomThreshold: 1.0, bloomRadius: 0.5, term: 0.15, termW: 0.03, shadowW: 0.1, rim: 0.5, sat: 1.15, highlight: false, tint: '#6a6fb5', tintStrength: 0.65 },
  // 2003 GameCube flatness: no bloom, a razor-hard terminator, no rim, slightly more saturated albedo.
  classic: { label: 'Classic 2003', bloom: 0, bloomThreshold: 0.95, bloomRadius: 0.5, term: 0.15, termW: 0.002, shadowW: 0.02, rim: 0, sat: 1.32, highlight: false, tint: '#6a6fb5', tintStrength: 0.65 },
} as const satisfies Record<string, ToonVariant>;

export type ToonVariantName = keyof typeof TOON_VARIANTS;

/** The shipped default, Bailey's pick ("HD (Recommended)"). */
export const DEFAULT_VARIANT: ToonVariantName = 'hd';

/** The variant a page asks for with `?ww=<name>` (`hd`, `hd-soft`, `classic`); anything else, or nothing, is {@link DEFAULT_VARIANT}. */
export function variantFromSearch(search: string): ToonVariantName {
  const v = new URLSearchParams(search).get('ww');
  return v !== null && Object.prototype.hasOwnProperty.call(TOON_VARIANTS, v) ? (v as ToonVariantName) : DEFAULT_VARIANT;
}

/** The ceiling of a lit surface, linear: just under the palette's bloom threshold (1.0), so only a glow blooms. */
export const TOON_CEILING = 0.995;

export const TOON_PARS = /* glsl */ `
varying vec3 vViewPosition;

uniform vec4 uToonBand;        // x terminator on N.L, y terminator width, z shadow-band width, w highlight band on
uniform vec2 uToonHi;          // x highlight threshold on N.L, y highlight gain
uniform vec3 uToonShadowTint;  // multiplier for the shadow side (linear working space)
uniform vec4 uToonRim;         // rgb rim colour, a strength
uniform vec2 uToonRimShape;    // x N.V where the rim starts to fade in, y its width
uniform float uToonSat;        // albedo saturation (1 = as painted)
uniform float uToonCeil;       // the most a lit surface may reach (linear)

float gToonShadow = 1.0;       // sun shadow band, written by the patched shadow line in lights_fragment_begin
float gToonLit = 0.0;
float gToonHi = 0.0;
float gToonRim = 0.0;
vec3 gToonSun = vec3( 0.0 );

float toonShadowBand( float s ) {

	return smoothstep( 0.5 - uToonBand.z, 0.5 + uToonBand.z, s );

}

struct ToonMaterial {

	vec3 diffuseColor;

};

void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {

	float NdL = dot( geometryNormal, directLight.direction );
	float w = max( uToonBand.y, fwidth( NdL ) * 0.5 );
	float sh = gToonShadow;
	gToonShadow = 1.0;

	float lit = smoothstep( uToonBand.x - w, uToonBand.x + w, NdL ) * sh;
	float hi = smoothstep( uToonHi.x - w, uToonHi.x + w, NdL ) * sh * uToonBand.w;
	float NdV = max( dot( geometryNormal, geometryViewDir ), 0.0 );
	float rim = ( 1.0 - smoothstep( uToonRimShape.x, uToonRimShape.x + uToonRimShape.y, NdV ) ) * smoothstep( 0.0, 0.35, NdL ) * sh;

	gToonSun += directLight.color;
	gToonLit = max( gToonLit, lit );
	gToonHi = max( gToonHi, hi );
	gToonRim = max( gToonRim, rim );

}

void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {

	vec3 fullLit = gToonSun + irradiance;
	vec3 shade = mix( uToonShadowTint, vec3( 1.0 ), gToonLit );
	vec3 col = material.diffuseColor * fullLit * shade;
	col *= 1.0 + uToonHi.y * gToonHi;
	col += uToonRim.rgb * ( uToonRim.a * gToonRim ) * ( 0.35 + 0.65 * material.diffuseColor );
	reflectedLight.indirectDiffuse += min( col, vec3( uToonCeil ) );

}

#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon
`;

export const TOON_FRAG = /* glsl */ `
ToonMaterial material;
{
	float toonLum = dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
	material.diffuseColor = max( mix( vec3( toonLum ), diffuseColor.rgb, uToonSat ), vec3( 0.0 ) );
}
`;

// The one line of lights_fragment_begin we change: the directional-light shadow no longer dims the light colour continuously, it is thresholded and handed to RE_Direct_Toon through gToonShadow.
const SHADOW_LINE = /^(\s*)directLight\.color \*= (\( directLight\.visible && receiveShadow \) \? )(getShadow\( directionalShadowMap\[ i \].*\))( : 1\.0;)\s*$/m;

/** `lights_fragment_begin` with its directional shadow line replaced, or null when the chunk no longer has that line (a three upgrade: the test in `tests/unit/ww3d/toon.test.ts` catches it). */
export function patchLightsBegin(chunk: string): string | null {
  if (!SHADOW_LINE.test(chunk)) return null;
  return chunk.replace(SHADOW_LINE, (_m, ind: string, cond: string, call: string, tail: string) => `${ind}gToonShadow = ${cond}toonShadowBand( ${call} )${tail}`);
}

/** The part of a program three hands to `onBeforeCompile`. */
export interface ShaderLike {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, IUniform>;
}

/** Patch a toon program's fragment shader and add the uniforms. Returns what went wrong, if anything; on a problem the shader is left untouched (the material then draws as three's stock toon). */
export function patchToonShader(shader: ShaderLike, uniforms: Record<string, IUniform>): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  let f = shader.fragmentShader;
  const swap = (include: string, text: string): void => {
    if (!f.includes(include)) {
      problems.push(`missing ${include}`);
      return;
    }
    f = f.replace(include, () => text);
  };
  swap('#include <lights_toon_pars_fragment>', TOON_PARS);
  swap('#include <lights_toon_fragment>', TOON_FRAG);
  const begin = patchLightsBegin(ShaderChunk['lights_fragment_begin']);
  if (!begin) problems.push('directional shadow line of lights_fragment_begin not found');
  else swap('#include <lights_fragment_begin>', begin);
  if (problems.length === 0) {
    shader.fragmentShader = f;
    Object.assign(shader.uniforms, uniforms);
  }
  return { ok: problems.length === 0, problems };
}

export function createToonUniforms(): ToonUniforms {
  return {
    uToonBand: { value: new Vector4(0.15, 0.03, 0.1, 0) },
    uToonHi: { value: new Vector2(0.9, 0.12) },
    uToonShadowTint: { value: new Color(0.34, 0.36, 0.63) },
    uToonRim: { value: new Vector4(1, 0.8, 0.45, 0) },
    uToonRimShape: { value: new Vector2(0.36, 0.24) },
    uToonSat: { value: 1 },
    uToonCeil: { value: TOON_CEILING },
  };
}

/**
 * Shadow tint: the display-space multiplier is white pulled toward `tint` by `strength`, so the shadow side stays bright (0.65 of #6a6fb5 gives about #a1a2d4, a lavender, never grey) and only the hue is cool.
 * Returned in linear working space.
 */
export function shadowTintLinear(tintHex: string, strength: number): Color {
  const c = { r: 0, g: 0, b: 0 };
  new Color(tintHex).getRGB(c, SRGBColorSpace);
  const mix = (v: number): number => 1 - strength * (1 - v);
  return new Color().setRGB(mix(c.r), mix(c.g), mix(c.b), SRGBColorSpace);
}

/** Set the shared uniforms to a variant's numbers. */
export function applyVariant(uniforms: ToonUniforms, v: ToonVariant): void {
  uniforms.uToonBand.value.set(v.term, v.termW, v.shadowW, v.highlight ? 1 : 0);
  uniforms.uToonShadowTint.value.copy(shadowTintLinear(v.tint, v.tintStrength));
  const rim = new Color('#ffd98a');
  uniforms.uToonRim.value.set(rim.r, rim.g, rim.b, v.rim);
  uniforms.uToonSat.value = v.sat;
}

/** A copy of `uniforms` with some cells replaced (a surface that takes its own shadow tint, or no rim): the other cells stay shared, so one `applyVariant` still moves them all. */
export function withUniforms(uniforms: ToonUniforms, over: Record<string, IUniform>): ToonUniforms {
  return { ...uniforms, ...over } as ToonUniforms;
}

/** What a toon material is made from. */
export interface ToonOptions {
  color?: number | Color;
  map?: Texture | null;
  side?: Side;
  transparent?: boolean;
  opacity?: number;
  alphaTest?: number;
  fog?: boolean;
  vertexColors?: boolean;
  /** Part of the program cache key, for a variant of the vertex shader (the wing flap). */
  cacheKey?: string;
  /** Called with the program in `onBeforeCompile`, after the fragment patch (the wing flap patches the vertex shader here). */
  onVertex?: (shader: ShaderLike) => void;
}

/** A toon material over the shared `uniforms`. */
export function makeToonMaterial(uniforms: Record<string, IUniform>, opts: ToonOptions = {}): MeshToonMaterial {
  const m = new MeshToonMaterial({
    color: opts.color ?? 0xffffff,
    map: opts.map ?? null,
    side: opts.side ?? FrontSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    alphaTest: opts.alphaTest ?? 0,
    fog: opts.fog ?? true,
    vertexColors: opts.vertexColors ?? false,
  });
  m.onBeforeCompile = (shader): void => {
    const r = patchToonShader(shader as unknown as ShaderLike, uniforms);
    if (!r.ok) console.error(`[ww3d] toon patch failed: ${r.problems.join('; ')}`);
    opts.onVertex?.(shader as unknown as ShaderLike);
  };
  m.customProgramCacheKey = (): string => `ww-toon-v2${opts.cacheKey ?? ''}`;
  m.userData['ww'] = 'toon';
  m.userData['uniforms'] = uniforms;
  return m;
}

/** The pieces of a source material a toon copy keeps. */
interface SourceMaterial {
  map?: Texture | null;
  color?: Color;
  side?: Side;
  transparent?: boolean;
  opacity?: number;
  alphaTest?: number;
}

/** A toon material that keeps `src`'s base-colour map, colour, side and transparency. */
export function toonFrom(src: SourceMaterial, uniforms: Record<string, IUniform>, extra: Pick<ToonOptions, 'cacheKey' | 'onVertex'> = {}, anisotropy = 8): MeshToonMaterial {
  if (src.map) src.map.anisotropy = anisotropy;
  return makeToonMaterial(uniforms, {
    map: src.map ?? null,
    color: src.color ? src.color.clone() : 0xffffff,
    side: src.side ?? FrontSide,
    transparent: src.transparent ?? false,
    opacity: src.opacity ?? 1,
    alphaTest: src.alphaTest ?? 0,
    ...extra,
  });
}
