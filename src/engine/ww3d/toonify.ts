/**
 * **Making a loaded model toon** (the hidden Wind Waker chapter; FFX-2 only): every mesh under a root gets the Wind Waker toon material (`./toon.ts`) in place of the file's own, keeping the base-colour map, the colour, the
 * side and the transparency; casts shadows, receives them where asked, and is never frustum-culled (a skinned mesh's bounding sphere is its bind pose's, and a bent wing leaves it). The file's other maps (normal,
 * roughness, metal, occlusion, emissive) are never read, so their decoded bitmaps are closed.
 *
 * {@link driveToon} then moves the set's colour, glow and opacity once a frame: the hit flash, the cast glow, the hurt tint, the stone grey and the fade, the channels the painted actor carries (`./skin.ts`).
 */

import { Color, Vector2, Vector4, type IUniform, type Material, type Mesh, type MeshToonMaterial, type Object3D, type Texture } from 'three';
import { disposeSkeletonsOf } from '../skeletons.ts';
import type { WwId } from './layout.ts';
import type { PropStyle } from './props.ts';
import { toonFrom, withUniforms, type ShaderLike, type ToonUniforms } from './toon.ts';

/** One toon material and the colour it started with. */
export interface ToonEntry {
  readonly material: MeshToonMaterial;
  readonly base: Color;
}

/** The materials a model was made, to drive and to free. */
export interface ToonSet {
  readonly entries: readonly ToonEntry[];
  readonly meshes: readonly Mesh[];
  /** The opacity last driven (the contact shadow under a figure fades with it). */
  opacity: number;
  /** This set's own cast-aura cell (`uToonGlow`, `./glow.ts`): rgb the rim colour, a the strength. Every material of the set reads it; the other figures' are separate. */
  readonly glow: IUniform<Vector4>;
  /** The figure's own aura shape cell (`uToonGlowShape`): where the two steps of the rim end on N.V. */
  readonly glowShape: IUniform<Vector2>;
  /** What a style of shading adds to the set (the anime chapter's outline hulls, `./celify.ts`): driven with the channels and freed with the set. Absent for the Wind Waker toon. */
  readonly extras?: SetExtras;
}

/** The parts of a set that are not materials of its entries (optional; additive). */
export interface SetExtras {
  drive?(c: Channels): void;
  dispose?(): void;
}

export interface ToonifyOptions {
  /** Meshes cast shadows (default true). */
  cast?: boolean;
  /** Meshes receive shadows (default true). */
  receive?: boolean;
  /** Part of the program cache key (Valefor's wing flap). */
  cacheKey?: string;
  /** Patch each program's vertex shader (Valefor's wing flap). */
  onVertex?: (shader: ShaderLike) => void;
  /** A depth material for the shadow pass (Valefor's wings flap in their shadow too). */
  depthMaterial?: Material;
  /** Keep three's frustum culling (default false: a skinned mesh's bounds are its bind pose's, and a bent wing leaves them; a static temple piece keeps its culling, which is what lets a wall of many tiles draw only the ones in view). */
  cull?: boolean;
}

/**
 * **How a chapter shades its figures, when it is not the Wind Waker toon** (the hidden anime chapter, `./celify.ts`; FFX-2 only; optional, additive). Omitted, a model is made toon by `toonify` over the context's uniforms,
 * exactly as before. `figure` receives the loaded scene, the figure it is, and the options the model decided (the wing flap's vertex hook and depth material for Valefor, whether it receives shadows) and returns the set the
 * model drives; `props` is how its weapons are made and sized (`./props.ts`).
 */
export interface ModelShading {
  readonly figure: (scene: Object3D, id: WwId, opts: ToonifyOptions) => ToonSet;
  readonly props?: PropStyle;
}

type MapKey = 'normalMap' | 'roughnessMap' | 'metalnessMap' | 'aoMap' | 'emissiveMap' | 'bumpMap' | 'displacementMap';
const UNREAD_MAPS: readonly MapKey[] = ['normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap'];

/** Close the bitmaps of the maps the toon material never reads, so a 4096 px normal map does not sit in memory for nothing. */
function releaseUnread(src: Material): void {
  const m = src as unknown as Partial<Record<MapKey, Texture | null>>;
  for (const k of UNREAD_MAPS) {
    const t = m[k];
    if (t) {
      t.dispose();
      const img = t.image as { close?: () => void } | undefined;
      img?.close?.();
    }
  }
}

/**
 * The material each mesh had before it was made toon. Kept in a WeakMap and NOT on `mesh.userData`: three's `Object3D.copy` clones `userData` with `JSON.parse(JSON.stringify(...))`, which serialises a material and
 * every texture it holds (`toDataURL` of each 2048 px map, about 100 ms each), and a temple piece is cloned 75 times (polish 1 measured it at 8 of the 9 seconds the BATTLE START card held).
 */
const SOURCE_MATERIALS = new WeakMap<Mesh, Material | Material[]>();

/** The material `mesh` had before {@link toonify} replaced it, or undefined. */
export function sourceMaterialOf(mesh: Mesh): Material | Material[] | undefined {
  return SOURCE_MATERIALS.get(mesh);
}

/** Replace every material under `root` with a toon one over `uniforms`; returns the set. */
export function toonify(root: Object3D, shared: Record<string, IUniform>, opts: ToonifyOptions = {}): ToonSet {
  // the figure's own cast-aura cell: the other cells stay shared, so one `applyVariant` still moves them all
  const glow: IUniform<Vector4> = { value: new Vector4(1, 0.78, 0.3, 0) };
  const glowShape: IUniform<Vector2> = { value: new Vector2(0.34, 0.5) };
  const uniforms = withUniforms(shared as ToonUniforms, { uToonGlow: glow, uToonGlowShape: glowShape });
  const entries: ToonEntry[] = [];
  const meshes: Mesh[] = [];
  const cast = opts.cast ?? true;
  const receive = opts.receive ?? true;
  const made = new Map<Material, MeshToonMaterial>();
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    meshes.push(mesh);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    mesh.frustumCulled = opts.cull === true;
    if (opts.depthMaterial) mesh.customDepthMaterial = opts.depthMaterial;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const out = list.map((src) => {
      let toon = made.get(src);
      if (!toon) {
        toon = toonFrom(src as unknown as Parameters<typeof toonFrom>[0], uniforms, { ...(opts.cacheKey !== undefined ? { cacheKey: opts.cacheKey } : {}), ...(opts.onVertex ? { onVertex: opts.onVertex } : {}) });
        releaseUnread(src);
        made.set(src, toon);
        entries.push({ material: toon, base: toon.color.clone() });
      }
      return toon;
    });
    SOURCE_MATERIALS.set(mesh, mesh.material);
    mesh.material = Array.isArray(mesh.material) ? out : out[0]!;
  });
  return { entries, meshes, opacity: 1, glow, glowShape };
}

/** The channels a figure drives on its materials. */
export interface Channels {
  /** Multiplies the base colour (the hurt tint, the brightness, the stone grey). */
  colour: Color;
  /** The glow colour and how much of it (the hit flash, the cast glow). */
  emissive: Color;
  amount: number;
  /** 0 (gone) to 1 (solid). */
  opacity: number;
  /** The cast aura: a thin rim of `colour` at `strength` (0 none). Optional: left out, the rim is off. */
  rim?: { colour: readonly [number, number, number]; strength: number; /** Where the two steps end on N.V (default the girl's). */ shape?: readonly [number, number] };
}

const BLEND_ON = 0.999;

/** Drive the set's materials: colour times the base, the emissive glow, and the opacity (a material is transparent only while it is not solid, so a standing figure sorts as an opaque one). */
export function driveToon(set: ToonSet, c: Channels): void {
  set.opacity = c.opacity;
  if (c.rim) {
    set.glow.value.set(c.rim.colour[0], c.rim.colour[1], c.rim.colour[2], c.rim.strength);
    if (c.rim.shape) set.glowShape.value.set(c.rim.shape[0], c.rim.shape[1]);
  }
  else set.glow.value.w = 0;
  set.extras?.drive?.(c);
  const fading = c.opacity < BLEND_ON;
  for (const { material, base } of set.entries) {
    material.color.copy(base).multiply(c.colour);
    material.emissive.copy(c.emissive);
    material.emissiveIntensity = c.amount;
    if (material.transparent !== fading || material.opacity !== c.opacity) {
      material.transparent = fading;
      material.opacity = c.opacity;
    }
  }
}

/**
 * Free the materials this set made (the geometry and the maps belong to the file and are freed with its cache, except a capsule's, which is its own: pass `ownGeometry`).
 *
 * **The skeletons are always freed (release 75 second code pass, the driver's decision 1; FFX-2 only, the hidden Wind Waker chapter).** `SkeletonUtils.clone` (the loader's default `clone`, `./io.ts`) gives each clone of a
 * file a `Skeleton` of its own for every skinned mesh, and the first draw gives each a bone texture that only `Skeleton.dispose()` frees (`../skeletons.ts`): the geometry, the materials and the file's maps going leaves it on
 * the GPU, one texture per skinned mesh every time the scene is entered again. A capsule has no skinned mesh, so for it this does nothing.
 */
export function disposeToon(set: ToonSet, ownGeometry: boolean): void {
  for (const { material } of set.entries) {
    material.dispose(); // the map is the file's, shared with the clones of it, and freed with its cache
  }
  set.extras?.dispose?.();
  disposeSkeletonsOf(set.meshes);
  if (ownGeometry) for (const m of set.meshes) m.geometry.dispose();
}
