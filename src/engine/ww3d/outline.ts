/**
 * **Inverted-hull outlines that work on skinned meshes** (the hidden anime chapter; FFX-2 only): ported from the look lab's `outline.mjs`. For a `SkinnedMesh` the hull is a SECOND `SkinnedMesh` that shares the original's
 * skeleton and bind matrix and is drawn back faces only, so the line follows every pose. Its vertex program (a patched `MeshBasicMaterial`, so three's own skinning chunks run first) pushes every vertex out along its
 * skinned normal in VIEW space, so the line has the same width whatever the model's scale:
 *
 * ```
 * width = uOutline.x x ( depth / 4 m ) ^ uOutline.y x aThick x mix( uOutline.z, 1, silhouette )
 *   uOutline.x   the width in metres at 4 m from the lens,
 *   uOutline.y   1 = constant screen width, above 1 = thinner near the lens,
 *   uOutline.z   the share of the width kept where the surface faces the lens (thicker at silhouettes, thinner inside them),
 *   aThick       a per-vertex weight (zero inside the face, `./faceMask.ts`).
 * ```
 *
 * The hull's normals are WELDED (vertices at the same position share one averaged normal), so a hard edge or a UV seam does not tear the line apart. A surface facing straight away from the lens is not a silhouette and is
 * discarded (hidden by the body, or a shard seen through a hole). Needs three.js only. Game case: FFX-2 only.
 */

import { BackSide, BufferAttribute, Color, DoubleSide, Mesh, MeshBasicMaterial, SkinnedMesh, Vector3, Vector4, type BufferGeometry, type IUniform, type Material } from 'three';
import type { ShaderLike } from './toon.ts';

/** The outline's numbers (a look's row, `./cel.ts`). */
export interface OutlineParams {
  /** Width in metres at 4 m from the lens. */
  readonly width: number;
  /** 1 = constant screen width; above 1 the line is thinner near the lens. */
  readonly pow: number;
  /** The share of the width kept where the surface faces the lens. */
  readonly inner: number;
  /** The line colour. */
  readonly dark: string;
  /** How much of the surface's albedo tints the line, and how dark that albedo is made. */
  readonly albedoMix: number;
  readonly albedoDark: number;
  /** A surface whose view-space normal points away from the lens by more than this is dropped (default 0.5). */
  readonly discard?: number;
}

export interface OutlineUniforms {
  uOutline: IUniform<Vector4>;
  uOutDark: IUniform<Color>;
  uOutMix: IUniform<Vector3>;
  [name: string]: IUniform;
}

export function createOutlineUniforms(o: OutlineParams): OutlineUniforms {
  return {
    uOutline: { value: new Vector4(o.width, o.pow, o.inner, o.discard ?? 0.5) },
    uOutDark: { value: new Color(o.dark) },
    uOutMix: { value: new Vector3(o.albedoMix, o.albedoDark, 0) },
  };
}

/** Normals welded across vertices at (nearly) the same position: each vertex gets the unit sum of the `normals` (or the geometry's own) of every vertex within 1/400 of its place. */
export function weldedNormals(geometry: BufferGeometry, normals: ArrayLike<number> | null = null): Float32Array {
  const pos = geometry.attributes['position']!;
  const nor = geometry.attributes['normal']!;
  const nx = (i: number): number => (normals ? normals[i * 3]! : nor.getX(i));
  const ny = (i: number): number => (normals ? normals[i * 3 + 1]! : nor.getY(i));
  const nz = (i: number): number => (normals ? normals[i * 3 + 2]! : nor.getZ(i));
  const sums = new Map<string, [number, number, number]>();
  const keys = new Array<string>(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) * 400)},${Math.round(pos.getY(i) * 400)},${Math.round(pos.getZ(i) * 400)}`;
    keys[i] = k;
    const s = sums.get(k) ?? [0, 0, 0];
    s[0] += nx(i);
    s[1] += ny(i);
    s[2] += nz(i);
    sums.set(k, s);
  }
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const s = sums.get(keys[i]!)!;
    const l = Math.hypot(s[0], s[1], s[2]) || 1;
    out[i * 3] = s[0] / l;
    out[i * 3 + 1] = s[1] / l;
    out[i * 3 + 2] = s[2] / l;
  }
  return out;
}

const VERT_PARS = /* glsl */ `
attribute float aThick;
uniform vec4 uOutline;
varying float vHullNz;
`;
const VERT_PROJECT = /* glsl */ `
	vec4 mvPosition = vec4( transformed, 1.0 );
	mvPosition = modelViewMatrix * mvPosition;
	#ifdef USE_SKINNING
		vec3 hullN = objectNormal;
	#else
		vec3 hullN = normal;
	#endif
	vec3 nV = normalize( normalMatrix * hullN );
	vHullNz = nV.z;
	float depth = max( - mvPosition.z, 0.05 );
	float silh = smoothstep( 0.0, 0.85, 1.0 - abs( nV.z ) );
	float wOut = uOutline.x * pow( depth / 4.0, uOutline.y ) * aThick * mix( uOutline.z, 1.0, silh );
	mvPosition.xyz += nV * wOut;
	gl_Position = projectionMatrix * mvPosition;
`;
const FRAG_PARS = /* glsl */ `
varying float vHullNz;
uniform vec4 uOutline;
uniform vec3 uOutDark;
uniform vec3 uOutMix;
`;
const FRAG_COLOUR = /* glsl */ `
	if ( vHullNz < - uOutline.w ) discard; // a surface facing straight away from the lens is not a silhouette
	{
		vec3 alb = diffuseColor.rgb;
		diffuseColor.rgb = mix( uOutDark, alb * uOutMix.y + uOutDark * 0.25, uOutMix.x );
	}
`;

/** Patch a `MeshBasicMaterial` program into the hull's (pure string work). Returns what went wrong; on a problem the shader is left untouched. */
export function patchOutlineShader(shader: ShaderLike, uniforms: Record<string, IUniform>): { ok: boolean; problems: string[] } {
  const problems: string[] = [];
  let v = shader.vertexShader;
  let f = shader.fragmentShader;
  const swap = (src: string, include: string, text: string, keep = false): string => {
    if (!src.includes(include)) {
      problems.push(`missing ${include}`);
      return src;
    }
    return src.replace(include, () => (keep ? `${include}\n${text}` : text));
  };
  v = swap(v, '#include <common>', VERT_PARS, true);
  v = swap(v, '#include <project_vertex>', VERT_PROJECT);
  f = swap(f, '#include <common>', FRAG_PARS, true);
  f = swap(f, '#include <alphatest_fragment>', `${FRAG_COLOUR}#include <alphatest_fragment>`);
  if (problems.length === 0) {
    shader.vertexShader = v;
    shader.fragmentShader = f;
    Object.assign(shader.uniforms, uniforms);
  }
  return { ok: problems.length === 0, problems };
}

interface SourceLook {
  map?: unknown;
  alphaTest?: number;
}

/** The hull's material: back faces only, the source's base-colour map (it tints the line), no fog. `extraVertex` runs after the patch (Valefor's wing flap bends the hull with her). */
export function makeOutlineMaterial(uniforms: Record<string, IUniform>, src: SourceLook, extraVertex: ((shader: ShaderLike) => void) | null = null): MeshBasicMaterial {
  const m = new MeshBasicMaterial({ color: 0xffffff, map: (src.map as MeshBasicMaterial['map']) ?? null, side: BackSide, fog: false, alphaTest: src.alphaTest ?? 0 });
  m.onBeforeCompile = (shader): void => {
    const r = patchOutlineShader(shader as unknown as ShaderLike, uniforms);
    if (!r.ok) console.error(`[ww3d] outline patch failed: ${r.problems.join('; ')}`);
    extraVertex?.(shader as unknown as ShaderLike);
  };
  m.customProgramCacheKey = (): string => `ww-outline-v1${extraVertex ? '-x' : ''}`;
  m.userData['ww'] = 'outline';
  return m;
}

export interface OutlineOptions {
  /** A width weight per vertex (zero inside a face). */
  weights?: Float32Array | null;
  /** Skip this mesh. */
  skip?: boolean;
  /** The normals to weld, when the geometry's own have been changed (the head's smoothed normals). */
  normals?: ArrayLike<number> | null;
  /** Draw a hull for a double-sided or cut-out mesh too (default: such a mesh has none, its hull would be a shifted copy of a card). */
  force?: boolean;
  extraVertex?: ((shader: ShaderLike) => void) | null;
}

/** Add the hull of `mesh` next to it. Returns the hull, or null when the mesh is skipped. */
export function addOutline(mesh: Mesh, uniforms: Record<string, IUniform>, opts: OutlineOptions = {}): Mesh | null {
  const first = Array.isArray(mesh.material) ? mesh.material[0]! : mesh.material;
  const src = first as Material & SourceLook & { side?: number };
  if (opts.skip === true || (opts.force !== true && (src.side === DoubleSide || (src.alphaTest ?? 0) > 0))) return null;
  const parent = mesh.parent;
  if (!parent) return null;
  const g = mesh.geometry.clone();
  g.setAttribute('normal', new BufferAttribute(weldedNormals(mesh.geometry, opts.normals ?? null), 3));
  const n = g.attributes['position']!.count;
  const w = opts.weights;
  g.setAttribute('aThick', new BufferAttribute(w && w.length === n ? w : new Float32Array(n).fill(1), 1));
  const mat = makeOutlineMaterial(uniforms, src, opts.extraVertex ?? null);
  const skinned = mesh as Partial<SkinnedMesh>;
  let hull: Mesh;
  if (skinned.isSkinnedMesh === true && skinned.skeleton && skinned.bindMatrix) {
    const s = new SkinnedMesh(g, mat);
    s.bind(skinned.skeleton, skinned.bindMatrix);
    hull = s;
  } else hull = new Mesh(g, mat);
  hull.name = `${mesh.name}:outline`;
  hull.frustumCulled = false;
  hull.castShadow = false;
  hull.receiveShadow = false;
  hull.renderOrder = 1;
  hull.matrixAutoUpdate = mesh.matrixAutoUpdate;
  hull.position.copy(mesh.position);
  hull.quaternion.copy(mesh.quaternion);
  hull.scale.copy(mesh.scale);
  parent.add(hull);
  hull.userData['outlineOf'] = mesh.uuid;
  return hull;
}
