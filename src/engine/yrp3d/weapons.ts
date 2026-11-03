/**
 * **The girls' real FFX-2 weapons** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only): the game's own weapon models, converted from Bailey's Steam FFX-2 HD copy (local only, gitignored,
 * never committed or shipped, like the figures), parented under the game's own **weapon locators** so each follows the placement the battle clips give it in every motion. When a weapon file (or the locator it hangs from)
 * is not there, the figure keeps the procedural props of `./props.ts` instead: nothing here is needed to play.
 *
 * ## What the data says (`yrp-weapons/weapons.json`, read from the game's `job.bin` and the PS2 `.chr` hand bones)
 *
 * - **Yuna** (Gunner, `w101`): `yuna-gunner-pistol.glb` in both hands, on locators `SkeletonNode_39` (the figure's left, +X when it faces +Z) and `SkeletonNode_67` (the right).
 * - **Rikku** (Thief, `w111`): `rikku-thief-dagger.glb` in both hands, on `SkeletonNode_140` (left) and `SkeletonNode_66` (right).
 * - **Paine** (Warrior, `w121`): `paine-warrior-sword.glb` in her right hand, on `SkeletonNode_101`.
 * - Every weapon file's scene root goes under its locator with the **local rotation quaternion `[1, 0, 0, 0]`** (x, y, z, w: the half turn about X that undoes the converter's `x, y, z -> x, -y, -z`, which is baked into every
 *   file while the skeleton chain already carries it), **translation 0 and scale 1**, the same for either hand. The locator is the game's own bone, a child of the hand bone; the clips animate it (at rest a quarter turn
 *   about Z, in the clips usually a little back along the hand), so nothing else positions a weapon.
 * - Rikku's and Paine's locators are already in `rikku.glb` and `paine.glb` (and their clips files). Yuna's are not in her extracted file: `yrp-weapons/actors/yuna.glb` and `yuna-anims.glb` are her HD files with `_39` and `_67`
 *   added under her hand bones `_38` and `_66` and tracks for all 52 clips; with the plain file she has no locators and keeps the procedural pistols.
 *
 * The weapons are attached before the model's soft pass (`./model.ts`), so they are shaded with the figure, and after its box is measured (a sword must not change the fit). Needs three.js only; no DOM.
 */

import { Quaternion, type Object3D } from 'three';
import { fileUrl, type YrpId } from './layout.ts';
import type { Side } from './props.ts';

/** One hand of a kit: its side and the name of the locator node it hangs from (the game's own `SkeletonNode_<n>`). */
export interface WeaponHand {
  readonly side: Side;
  readonly locator: string;
}

/** A girl's weapon: the file it is in and the hands that hold one (one scene per hand). */
export interface WeaponKit {
  readonly file: string;
  readonly hands: readonly WeaponHand[];
}

/** Which weapon each girl holds and where (`weapons.json`'s `hands[].locatorNode`, `weaponModel` and `file`). Bahamut has none. */
export const WEAPON_KITS: Readonly<Partial<Record<YrpId, WeaponKit>>> = {
  yuna: {
    file: 'yuna-gunner-pistol.glb',
    hands: [
      { side: 'left', locator: 'SkeletonNode_39' },
      { side: 'right', locator: 'SkeletonNode_67' },
    ],
  },
  rikku: {
    file: 'rikku-thief-dagger.glb',
    hands: [
      { side: 'left', locator: 'SkeletonNode_140' },
      { side: 'right', locator: 'SkeletonNode_66' },
    ],
  },
  paine: { file: 'paine-warrior-sword.glb', hands: [{ side: 'right', locator: 'SkeletonNode_101' }] },
};

/** How a weapon's scene root sits under its locator, the same for every hand: the quaternion as glTF writes it (x, y, z, w), the translation and the scale (`weapons.json` `howToAttach`). */
export const WEAPON_TO_LOCATOR = { quaternion: [1, 0, 0, 0], translation: [0, 0, 0], scale: 1 } as const;

/** What was attached: each weapon's scene by side. `dispose` takes them off again (their geometry and textures are the parsed file's, which the loader frees). */
export interface WeaponsAttached {
  readonly weapons: ReadonlyArray<{ readonly side: Side; readonly object: Object3D }>;
  dispose(): void;
}

/** The URL of a girl's weapon file in a models folder, or null for a figure with no weapon (Bahamut). */
export function weaponUrl(base: string, dir: string, id: YrpId): string | null {
  const kit = WEAPON_KITS[id];
  return kit ? fileUrl(base, dir, kit.file) : null;
}

/** How many scenes a figure's kit needs (one per hand); 0 for a figure with no kit. */
export const weaponCount = (id: YrpId): number => WEAPON_KITS[id]?.hands.length ?? 0;

/** The locator nodes of `id`'s kit that `root` does not have, by name (empty when the figure can hold its real weapons). */
export function missingLocators(id: YrpId, root: Object3D): string[] {
  return (WEAPON_KITS[id]?.hands ?? []).map((h) => h.locator).filter((name) => !root.getObjectByName(name));
}

/**
 * Parent each of `scenes` (one per hand of `id`'s kit, in the kit's order) under its locator in `root`, as {@link WEAPON_TO_LOCATOR} says. Returns what was attached, or **null** when the figure cannot hold them all (no
 * kit, fewer scenes than hands, or a locator the skeleton does not have): nothing is attached then, so the caller keeps the procedural props.
 */
export function attachWeapons(id: YrpId, root: Object3D, scenes: readonly Object3D[]): WeaponsAttached | null {
  const kit = WEAPON_KITS[id];
  if (!kit || scenes.length < kit.hands.length || missingLocators(id, root).length) return null;
  const q = WEAPON_TO_LOCATOR.quaternion;
  const weapons: Array<{ side: Side; object: Object3D }> = [];
  kit.hands.forEach((hand, i) => {
    const object = scenes[i]!;
    object.name = `weapon-${id}-${hand.side}`;
    object.quaternion.copy(new Quaternion(q[0], q[1], q[2], q[3]));
    object.position.set(WEAPON_TO_LOCATOR.translation[0], WEAPON_TO_LOCATOR.translation[1], WEAPON_TO_LOCATOR.translation[2]);
    object.scale.setScalar(WEAPON_TO_LOCATOR.scale);
    root.getObjectByName(hand.locator)!.add(object);
    weapons.push({ side: hand.side, object });
  });
  return {
    weapons,
    dispose(): void {
      for (const { object } of weapons) object.removeFromParent();
    },
  };
}
