/**
 * **The soft, faithful look for a loaded model** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only). It replaces the painted-toon pass of the AI-model branch (a stepped ramp and an ink
 * hull), which Bailey found "plastic": the real FFX-2 HD models carry their look in their own base colour maps, and the game lights them with plain diffuse light, so each material here keeps the file's colour map
 * and colour under a high-roughness, non-metal standard material (`SHADE`, `./layout.ts`): **no specular gloss, no ramp, no outline**. The warm key, the soft fill and the cool rim that light it are the scene's
 * (`LOOK.rig`, `./look.ts`; built by `./rig.ts`).
 *
 * - **Two looks.** `diffuse` is the real FFX-2 humans' (and the game's own Bahamut's): the base colour map only, `SHADE`'s roughness, no gloss. `pbr` is the AI-made Bahamut's (Meshy; the look of the turntable Bailey picked): the
 *   file's own material kept whole, so whatever maps it carries (base colour, normal, roughness, metallic) and its own roughness and metalness stay, under the same lights and with no outline.
 * - **What is kept** of the file's material in the diffuse look: the base colour map and colour, the alpha test (a glTF `MASK` material, which the hair, the cloth and the wings use), and the sidedness (double-sided cloth and wings). The
 *   normal, metal-rough and emissive maps and the vertex data a scan or a converter ships are left unused, so a highlight never comes back.
 * - **Channels.** The materials' colour and emissive are what the figure's tint, flash and cast glow drive (`./skin.ts`): `drive`; the emissive reaches the surface as a rim accent (`./rim.ts`). A fading figure goes transparent only while it is fading (a solid one keeps its alpha test and
 *   depth writes, so the hair's cut-outs sort right).
 * - **Meshes** are never frustum-culled (a skinned mesh's bounds are the bind pose's, and an arm swung out would pop), cast but do not receive shadows (a figure shadowing itself shows acne on soft light) and are on the figure
 *   layer as well as the default one (`LAYER.figure`: the wet floor's mirror draws that layer alone). **Fog** does not reach them (`LOOK.figure.fog`): a figure takes its colour from the light, not from the distance.
 *
 * Needs three.js only; no DOM. Game case: FFX-2 only.
 */

import { Color, MeshStandardMaterial, SRGBColorSpace, type BufferGeometry, type Material, type Mesh, type Object3D, type Texture } from 'three';
import { patchFlap, type FlapUniforms } from './flap.ts';
import { SHADE, type Look } from './layout.ts';
import { LAYER, LOOK } from './look.ts';
import { patchRim } from './rim.ts';

/** What a material remembers of the file's own, so the figure's colour channels can multiply it later. */
export interface ShadeBase {
  readonly color: Color;
}

/** The base colour map, colour and alpha test and sidedness of a loaded material (a glTF PBR material, or anything with `map` and `color`). */
function baseOf(src: Material): { map: Texture | null; color: Color; alphaTest: number; side: Material['side'] } {
  const s = src as Material & { map?: Texture | null; color?: Color };
  return { map: s.map ?? null, color: s.color ? s.color.clone() : new Color(0xffffff), alphaTest: s.alphaTest, side: s.side };
}

/** The AI boss's material: the file's own standard material kept whole (every map it has, its roughness and metalness), with the glow channel ours (black, to be driven) and the environment as `SHADE` says. */
function pbrMaterialOf(src: Material): MeshStandardMaterial {
  const std = src as Partial<MeshStandardMaterial> & Material;
  const m = (std.isMeshStandardMaterial ? (std as MeshStandardMaterial).clone() : new MeshStandardMaterial({ name: src.name, color: baseOf(src).color, map: baseOf(src).map, roughness: 0.85, metalness: 0, side: src.side, alphaTest: src.alphaTest })) as MeshStandardMaterial;
  m.emissive = new Color(0x000000);
  m.emissiveMap = null;
  m.emissiveIntensity = 1;
  m.envMapIntensity = SHADE.envMapIntensity;
  m.transparent = false;
  m.opacity = 1;
  m.fog = LOOK.figure.fog;
  for (const t of [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.aoMap]) if (t) t.anisotropy = SHADE.anisotropy;
  if (m.map) m.map.colorSpace = SRGBColorSpace;
  m.userData['shadeBase'] = { color: m.color.clone() } satisfies ShadeBase;
  return m;
}

/** The soft material for a loaded one: in the `diffuse` look its colour map and colour, the alpha test and sidedness, `SHADE`'s roughness and no metal, and an emissive of black to be driven; in the `pbr` look the file's own. */
export function shadeMaterialOf(src: Material, look: Look = 'diffuse'): MeshStandardMaterial {
  if (look === 'pbr') return pbrMaterialOf(src);
  const base = baseOf(src);
  if (base.map) {
    base.map.colorSpace = SRGBColorSpace;
    base.map.anisotropy = SHADE.anisotropy; // the renderer clamps it to what the card has
  }
  const m = new MeshStandardMaterial({
    name: src.name,
    color: base.color,
    map: base.map,
    roughness: SHADE.roughness,
    metalness: SHADE.metalness,
    envMapIntensity: SHADE.envMapIntensity,
    emissive: new Color(0x000000),
    alphaTest: base.alphaTest,
    side: base.side,
    transparent: false,
    opacity: 1,
    fog: LOOK.figure.fog,
  });
  m.userData['shadeBase'] = { color: base.color.clone() } satisfies ShadeBase;
  return m;
}

/** A model made soft: the materials it made (to drive and to free), and the geometry and textures of the file it owns. */
export interface ShadeSet {
  readonly materials: MeshStandardMaterial[];
  readonly meshes: Mesh[];
  /** Geometry and textures of the file, freed with the set when it owns them (each is counted once). */
  readonly geometries: Set<BufferGeometry>;
  readonly textures: Set<Texture>;
}

/** How a model is shaded: the look, and the wing flap's cells for a rigid winged model (every material then flaps with them). */
export interface ShadeOptions {
  readonly look?: Look;
  readonly flap?: FlapUniforms | null;
}

/** Give every mesh under `root` its own soft material (one per source material, shared between the meshes that shared it). Returns what was made. */
export function shadeify(root: Object3D, opts: ShadeOptions = {}): ShadeSet {
  const made = new Map<Material, MeshStandardMaterial>();
  const set: ShadeSet = { materials: [], meshes: [], geometries: new Set(), textures: new Set() };
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const swapped = list.map((m) => {
      let t = made.get(m);
      if (!t) {
        t = shadeMaterialOf(m, opts.look);
        if (opts.flap) patchFlap(t, opts.flap);
        patchRim(t); // the flash and the glow are a rim accent, never a flat tint of the whole body (`./rim.ts`)
        made.set(m, t);
        set.materials.push(t);
        if (t.map) set.textures.add(t.map);
      }
      return t;
    });
    mesh.material = Array.isArray(mesh.material) ? swapped : swapped[0]!;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    mesh.layers.enable(LAYER.figure);
    set.geometries.add(mesh.geometry);
    set.meshes.push(mesh);
  });
  return set;
}

/** Drive the figure's channels on every material of a set: `colour` multiplies the file's colour, `emissive` is the glow (a colour scaled by `amount`), `opacity` fades the figure. */
export function drive(set: ShadeSet, channels: { colour: Color; emissive: Color; amount: number; opacity: number }): void {
  const solid = channels.opacity >= 0.999;
  for (const m of set.materials) {
    const base = (m.userData['shadeBase'] as ShadeBase).color;
    m.color.copy(base).multiply(channels.colour);
    m.emissive.copy(channels.emissive).multiplyScalar(channels.amount);
    if (m.transparent === solid) {
      m.transparent = !solid;
      m.needsUpdate = true;
    }
    m.opacity = channels.opacity;
  }
}

/** Free what a set made. The file's own geometry and textures are freed too when `geometries` is set (a capsule's are its own; a file's are shared with the clones of it and freed with the loader). */
export function disposeShade(set: ShadeSet, geometries = false): void {
  for (const m of set.materials) m.dispose();
  if (geometries) {
    for (const g of set.geometries) g.dispose();
    for (const t of set.textures) t.dispose();
  }
}
