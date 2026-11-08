/**
 * **The weapons on their nodes** (the hidden Wendigo chapter's 3D stage; FFX only): each of the nine static weapon models (`public/models-exp/lake/weapons/`, origin at the grip, +Y to the tip, metres) is parented to the
 * node its row names (`../../data/ffx/lake-models.ts` `LAKE_WEAPONS`). The party's hooks, `Hook_R` and `Hook_L`, are nodes the asset lane's retarget added under the Meshy hands: **their rotation is the game's own
 * `r_weapon` and `l_weapon` node in every clip**, so a weapon parented there is held the way the game holds its own (the Brotherhood rides up behind Tidus's head in the idle, the blade follows the arm in a lunge). The
 * Guardians' claws sit on their wrists, Auron's jug on his hip by its rope.
 *
 * The Meshy bones sit under an `Armature` node scaled 0.01 (joints in centimetres), so a child of a bone is scaled by 1 over the bone's world scale to stand in metres (`attachWeapon`, the asset lane's `attachWeapons.js`).
 * Each weapon gets materials of its own: the skin tints a figure through its materials, and a weapon file parsed once is cloned for several figures. Hooks are not skin joints: the mixer must run on the character's scene root.
 *
 * Needs three.js only. Game case: FFX only.
 */

import { Group, Vector3, type Material, type Mesh, type Object3D } from 'three';
import { LAKE_WEAPONS, type LakeId, type LakeWeapon, type LakeWeaponRow } from '../../data/ffx/lake-models.ts';

/** What was attached. `dispose` takes the pivots off again (the geometry and textures are the parsed file's, freed with the loader; the cloned materials are freed here). */
export interface WeaponsAttached {
  readonly pivots: readonly Group[];
  dispose(): void;
}

/** The weapon scenes the model needs, by weapon name: the ones of `id`'s rows. */
export function weaponsFor(id: LakeId): readonly LakeWeaponRow[] {
  return LAKE_WEAPONS[id] ?? [];
}

/** The distinct weapon files `id` needs. */
export function weaponNamesFor(id: LakeId): LakeWeapon[] {
  return [...new Set(weaponsFor(id).map((r) => r.weapon))];
}

/** Give every mesh under `scene` its own copy of its material(s), so a tint on one figure's weapon never reaches another's. Returns the copies. */
function ownMaterials(scene: Object3D): Material[] {
  const made: Material[] = [];
  scene.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((m) => m.clone());
    else mesh.material = mesh.material.clone();
    made.push(...(Array.isArray(mesh.material) ? mesh.material : [mesh.material]));
  });
  return made;
}

/**
 * Parent a clone of each row's weapon scene (`scenes` maps a weapon name to its parsed scene; a clone is made here) to the node the row names under `root`. A row whose node or weapon is missing is skipped (the figure
 * stands unarmed there), and `missing` says which. `clone` copies a parsed scene (the loader passes `SkeletonUtils.clone`; a static weapon needs only `Object3D.clone`).
 */
export function attachWeapons(
  id: LakeId,
  root: Object3D,
  scenes: ReadonlyMap<LakeWeapon, Object3D>,
  clone: (scene: Object3D) => Object3D = (s) => s.clone(true),
): WeaponsAttached & { readonly missing: readonly string[] } {
  root.updateMatrixWorld(true);
  const pivots: Group[] = [];
  const owned: Material[] = [];
  const missing: string[] = [];
  for (const row of weaponsFor(id)) {
    const node = root.getObjectByName(row.node);
    const scene = scenes.get(row.weapon);
    if (!node || !scene) {
      missing.push(`${row.weapon}@${row.node}`);
      continue;
    }
    const k = 1 / (node.getWorldScale(new Vector3()).x || 1);
    const pivot = new Group();
    pivot.name = `lake-weapon-${row.weapon}`;
    pivot.position.set(row.offsetM[0] * k, row.offsetM[1] * k, row.offsetM[2] * k);
    pivot.quaternion.set(row.quat[0], row.quat[1], row.quat[2], row.quat[3]);
    pivot.scale.setScalar(k);
    if (row.mirrorX) pivot.scale.x *= -1;
    const weapon = clone(scene);
    owned.push(...ownMaterials(weapon));
    pivot.add(weapon);
    node.add(pivot);
    pivots.push(pivot);
  }
  return {
    pivots,
    missing,
    dispose(): void {
      for (const p of pivots) p.removeFromParent();
      for (const m of owned) m.dispose();
    },
  };
}
