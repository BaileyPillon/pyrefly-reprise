/**
 * **The painted-toon look for a loaded model** (the hidden 3D Bahamut chapter; FFX-2 only): a stepped, softly blended light ramp and an ink outline, built from the model's own base colour map. Presentation only: it reads
 * the file's meshes and materials and gives each a toon material and an inverted-hull outline; it touches no battle state.
 *
 * - **The ramp.** `MeshToonMaterial` with a gradient map: the light's cosine is looked up in a small ramp texture instead of used straight. The ramp is {@link rampAt} of `./layout.ts` (three plateaus, the steps blended
 *   over a brush's width, not a cel's hard edge), sampled at 64 texels with linear filtering so the blend survives. Only the **base colour map** and colour of the file's material are kept: the normal and
 *   metal-rough maps a scan or a generator ships would put highlights back into a painted shape, so they are left unused.
 * - **The ink.** An inverted hull: the same geometry drawn a second time with its back faces only, pushed out along its normals by a fixed thickness in the model's units, in a flat ink colour. The silhouette is where
 *   the hull shows beyond the model. A skinned mesh's hull is a skinned mesh bound to the same skeleton, so it moves with the bones; its normal is the skinned normal.
 * - **Glow.** The materials' emissive is the one channel the figure's flash, cast glow and tint drive (`./skin.ts`): `setEmissive`.
 *
 * Needs three.js only; no DOM (the ramp is a `DataTexture`). Game case: FFX-2 only.
 */

import {
  BackSide,
  Color,
  DataTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  RGBAFormat,
  SkinnedMesh,
  SRGBColorSpace,
  UnsignedByteType,
  type BufferGeometry,
  type Material,
  type Object3D,
  type Texture,
} from 'three';
import { rampAt, TOON } from './layout.ts';

/** The gradient map: {@link rampAt} sampled across `width` texels, grey, linearly filtered so the blends between the steps stay soft. One per model set; free it with `dispose()`. */
export function toonRamp(width = 64): DataTexture {
  const data = new Uint8Array(width * 4);
  for (let i = 0; i < width; i++) {
    const v = Math.round(255 * rampAt((i + 0.5) / width));
    data.set([v, v, v, 255], i * 4);
  }
  const ramp = new DataTexture(data, width, 1, RGBAFormat, UnsignedByteType);
  ramp.minFilter = LinearFilter;
  ramp.magFilter = LinearFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  return ramp;
}

/** What a toon material remembers of the file's own, so the figure's colour channels can multiply it later. */
export interface ToonBase {
  readonly color: Color;
}

/** The base colour map and colour of a loaded material (a glTF PBR material, or anything with `map` and `color`). */
function baseOf(src: Material): { map: Texture | null; color: Color } {
  const s = src as Material & { map?: Texture | null; color?: Color };
  return { map: s.map ?? null, color: s.color ? s.color.clone() : new Color(0xffffff) };
}

/** The toon material for a loaded one: its base colour map and colour, the ramp, front faces only (the hull draws the back), and an emissive of black to be driven. */
export function toonMaterialOf(src: Material, ramp: DataTexture): MeshToonMaterial {
  const base = baseOf(src);
  if (base.map) {
    base.map.colorSpace = SRGBColorSpace;
    base.map.anisotropy = 8; // the renderer clamps it to what the card has
  }
  const m = new MeshToonMaterial({ name: src.name, color: base.color, map: base.map, gradientMap: ramp, emissive: new Color(0x000000), transparent: false, opacity: 1 });
  m.userData['toonBase'] = { color: base.color.clone() } satisfies ToonBase;
  return m;
}

/** The hull's material: a flat ink colour on the back faces, each vertex pushed out along its normal by `uInk` (a uniform, in the model's units). Shared by every hull of a model. */
export function inkMaterial(thickness: number, colour: number = TOON.ink): MeshBasicMaterial {
  const m = new MeshBasicMaterial({ color: colour, side: BackSide, fog: false, toneMapped: false });
  const uInk = { value: thickness }; // the one uniform cell every compile of this material reads, so a later thickness needs no recompile
  m.userData['uInk'] = uInk;
  m.onBeforeCompile = (shader) => {
    shader.uniforms['uInk'] = uInk;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uInk;')
      .replace(
        '#include <skinning_vertex>',
        '#include <skinning_vertex>\n#ifdef USE_SKINNING\n  transformed += normalize( objectNormal ) * uInk;\n#else\n  transformed += normalize( normal ) * uInk;\n#endif',
      );
  };
  m.customProgramCacheKey = () => 'yrp-ink-hull';
  return m;
}

/** Set the hull's thickness (in the model's units): the uniform cell the compiled program reads. */
export function setInkThickness(m: MeshBasicMaterial, thickness: number): void {
  (m.userData['uInk'] as { value: number }).value = thickness;
}

/** A model made toon: the materials and hulls it made (to drive and to free), and the ramp it shares. */
export interface ToonSet {
  readonly materials: MeshToonMaterial[];
  readonly hulls: Mesh[];
  readonly hullMaterial: MeshBasicMaterial;
  readonly ramp: DataTexture;
  /** Geometry and textures of the file, freed once with the set (each is counted once). */
  readonly geometries: Set<BufferGeometry>;
  readonly textures: Set<Texture>;
}

/**
 * Make every mesh under `root` toon: its materials swapped for toon ones, a hull beside it. Meshes are never frustum-culled (a skinned mesh's bounds are the bind pose's and an arm swung out would pop). Returns what was
 * made. `thickness` is the hull's thickness in the units of `root`'s own space (world thickness over the fit's scale).
 */
export function toonify(root: Object3D, thickness: number, ramp: DataTexture = toonRamp()): ToonSet {
  const made = new Map<Material, MeshToonMaterial>();
  const set: ToonSet = { materials: [], hulls: [], hullMaterial: inkMaterial(thickness), ramp, geometries: new Set(), textures: new Set() };
  const meshes: Mesh[] = [];
  root.traverse((o) => {
    if ((o as Mesh).isMesh && !(o as Mesh).userData['yrpHull']) meshes.push(o as Mesh);
  });
  for (const mesh of meshes) {
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const swapped = list.map((m) => {
      let t = made.get(m);
      if (!t) {
        t = toonMaterialOf(m, ramp);
        made.set(m, t);
        set.materials.push(t);
        if (t.map) set.textures.add(t.map);
      }
      return t;
    });
    mesh.material = Array.isArray(mesh.material) ? swapped : swapped[0]!;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    set.geometries.add(mesh.geometry);
    const hull = (mesh as SkinnedMesh).isSkinnedMesh ? hullOfSkinned(mesh as SkinnedMesh, set.hullMaterial) : new Mesh(mesh.geometry, set.hullMaterial);
    hull.name = `${mesh.name || 'mesh'}-ink`;
    hull.userData['yrpHull'] = true;
    hull.castShadow = false;
    hull.receiveShadow = false;
    hull.frustumCulled = false;
    hull.renderOrder = mesh.renderOrder;
    hull.position.copy(mesh.position);
    hull.quaternion.copy(mesh.quaternion);
    hull.scale.copy(mesh.scale);
    mesh.parent?.add(hull);
    set.hulls.push(hull);
  }
  return set;
}

/** The hull of a skinned mesh: another skinned mesh on the same geometry, bound to the same skeleton and bind matrix. */
function hullOfSkinned(mesh: SkinnedMesh, material: MeshBasicMaterial): SkinnedMesh {
  const hull = new SkinnedMesh(mesh.geometry, material);
  hull.bind(mesh.skeleton, mesh.bindMatrix);
  hull.bindMode = mesh.bindMode;
  return hull;
}

/** Drive the figure's channels on every toon material of a set: `colour` multiplies the file's colour, `emissive` is the glow (a colour scaled by `amount`), `opacity` fades the figure and its hull together. */
export function drive(set: ToonSet, channels: { colour: Color; emissive: Color; amount: number; opacity: number }): void {
  const solid = channels.opacity >= 0.999;
  for (const m of set.materials) {
    const base = (m.userData['toonBase'] as ToonBase).color;
    m.color.copy(base).multiply(channels.colour);
    m.emissive.copy(channels.emissive).multiplyScalar(channels.amount);
    if (m.transparent === solid) {
      m.transparent = !solid;
      m.needsUpdate = true;
    }
    m.opacity = channels.opacity;
  }
  const hm = set.hullMaterial;
  if (hm.transparent === solid) {
    hm.transparent = !solid;
    hm.needsUpdate = true;
  }
  hm.opacity = channels.opacity;
}

/** Free what a set made. The file's own geometry and textures are freed here too (the set owns them: the loader's cache hands each clone the same ones, and frees them once when the last user is gone). */
export function disposeToon(set: ToonSet, geometries = false): void {
  for (const m of set.materials) m.dispose();
  set.hullMaterial.dispose();
  set.ramp.dispose();
  for (const h of set.hulls) h.removeFromParent();
  if (geometries) {
    for (const g of set.geometries) g.dispose();
    for (const t of set.textures) t.dispose();
  }
}
