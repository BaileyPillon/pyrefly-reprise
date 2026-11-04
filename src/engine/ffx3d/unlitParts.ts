/**
 * **The unlit material of a loaded FFX model, and what a model made and must free** (the hidden Fayth chapter's `ffx` skin; FFX only). Moved out of `./models.ts` unchanged in the release 75 second code pass (the file was at
 * 392 of the 400 lines the house allows) when the skeletons joined what is freed; `./models.ts` re-exports {@link unlitMaterial}, so every importer is as it was.
 *
 * Game case: FFX only (the files are FFX's).
 */

import { Color, DoubleSide, Mesh, MeshBasicMaterial, NoColorSpace, SkinnedMesh, type BufferGeometry, type Material, type Object3D, type Skeleton, type Texture } from 'three';
import { skeletonsOf } from '../skeletons.ts';
import { applyPassState, passStateOf } from './passState.ts';

/**
 * The unlit material for a loaded one: the diffuse map and tint, vertex colours when the mesh has them, the file's own cut-out threshold, no fog. Sidedness, blending and depth are the **game's own state for
 * the material** when the file carries it (`extras.ffx.pass`, `./passState.ts`: an alpha-enabled variant is a cut-out whose survivors are blended, which is Evrae's see-through wing; every actor and most of the
 * stage are single sided); a file without it keeps the glTF material's own sidedness and blending (a blended one does not write depth). Reads only the fields a glTF material has, so it takes the loader's
 * `MeshStandardMaterial` and nothing else is needed. The state is kept in `userData.ffxPass` for the stage's mirrored meshes (`shapeStage`).
 */
export function unlitMaterial(src: Material): MeshBasicMaterial {
  const s = src as Material & { map?: Texture | null; color?: Color };
  const material = new MeshBasicMaterial({
    name: src.name,
    map: s.map ?? null,
    color: s.color ? s.color.clone() : new Color(0xffffff),
    vertexColors: src.vertexColors,
    side: src.side === DoubleSide ? DoubleSide : src.side,
    alphaTest: src.alphaTest,
    transparent: src.transparent,
    opacity: src.opacity,
    depthWrite: src.depthWrite,
    fog: false,
  });
  const state = passStateOf(src.userData);
  applyPassState(material, state);
  material.userData['ffxPass'] = state;
  material.userData['baseTransparent'] = material.transparent;
  if (material.map) {
    material.map.anisotropy = 8; // the renderer clamps it to what the card has
    material.map.colorSpace = NoColorSpace; // the game's textures are display values (its shader writes `tone(texture * colour)` as it is): not decoded, so the chain shows them as authored
  }
  return material;
}

/** What a model made and its owner must free: the unlit materials, the file's geometry and maps, and the skeletons of its skinned meshes (their bone textures). */
export interface UnlitParts {
  materials: MeshBasicMaterial[];
  geometries: BufferGeometry[];
  textures: Texture[];
  skeletons: Skeleton[];
}

/**
 * Every mesh below `root` takes the unlit material; returns what the caller must free later. Skinned meshes are never culled (their box is the bind pose's).
 *
 * **The skeletons are returned to be freed (release 75 second code pass, the driver's decision 1; FFX only, the hidden Fayth chapter).** The converter's skinned actors are drawn straight from the loader's scene, and
 * the first draw of a skinned mesh gives its `Skeleton` a bone texture that only `Skeleton.dispose()` frees (`../skeletons.ts`): the geometry, the materials and the maps going leaves it on the GPU, one texture per
 * skinned mesh every time the chapter is entered again. The textures of the loader's material that the unlit one does not take (a normal or emissive map) are returned too, so no file texture outlives the model.
 */
export function unlit(root: Object3D): UnlitParts {
  const swapped = new Map<Material, MeshBasicMaterial>();
  const geometries = new Set<BufferGeometry>();
  const textures = new Set<Texture>();
  const meshes: Object3D[] = [];
  const swap = (m: Material): MeshBasicMaterial => {
    let made = swapped.get(m);
    if (!made) {
      made = unlitMaterial(m);
      swapped.set(m, made);
      for (const value of Object.values(m)) if ((value as Texture | null)?.isTexture === true) textures.add(value as Texture); // the colour map (now the unlit one's) and any the unlit material leaves unused
      m.dispose(); // the loader's material only; its texture lives on in the new one
    }
    return made;
  };
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material as Material);
    o.castShadow = false;
    o.receiveShadow = false;
    if (o instanceof SkinnedMesh) o.frustumCulled = false;
    geometries.add(o.geometry);
    meshes.push(o);
  });
  return { materials: [...new Set(swapped.values())], geometries: [...geometries], textures: [...textures], skeletons: skeletonsOf(meshes) };
}

/** Free everything {@link unlit} returned. */
export const freeAll = (parts: UnlitParts): void => {
  for (const g of parts.geometries) g.dispose();
  for (const m of parts.materials) m.dispose();
  for (const t of parts.textures) t.dispose();
  for (const s of parts.skeletons) s.dispose();
};
