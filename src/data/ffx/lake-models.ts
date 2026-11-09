/**
 * **The hidden Wendigo chapter's 3D models** (FFX only; `../chapter-wendigo.ts`, branch `ch-wendigo`): which file draws which combatant, how big it stands, and which weapon hangs from which node. A module with no imports, so
 * the loader (`../../engine/lake3d/load.ts`), the dist filter and the tests can all read it without pulling each other's graphs in.
 *
 * The files are Meshy image-to-3D bodies rigged with a 24-joint Meshy rig, the party moved by the real FFX battle clips retargeted onto them (the clip names are the game's own kit: `idle1`, `attack1_00`, `magic2_00`,
 * `win_00`, `dead_00` ...), the weapons separate static models hung from the `Hook_R` and `Hook_L` nodes the retarget added under the hands (their rotation is the game's own `r_weapon` / `l_weapon` node in every clip). The
 * Wendigo and the two Guado Guardians have Meshy library motion only (idle, attack, combo, cast, hurt, ko ...). The files are local, gitignored (`public/models-exp/`), and loaded on use.
 *
 * **Heights are in metres on the stage's scale** (Tidus 1.75): the Wendigo 2.71 (1.55 times Tidus, the size table's drawn height) and the Guardian 1.89 (1.08 times); the party's are the art sizes of the paintings.
 * Game case: FFX only.
 */

/** The party and the enemies that carry a model. The aeons keep their paintings. */
export const LAKE_PARTY = ['tidus', 'yuna', 'rikku', 'wakka', 'auron', 'lulu', 'kimahri'] as const;
export const LAKE_ENEMIES = ['wendigo', 'lake-guardian-a', 'lake-guardian-b'] as const;
export const LAKE_CAST = [...LAKE_PARTY, ...LAKE_ENEMIES] as const;
export type LakeId = (typeof LAKE_CAST)[number];

/** Where the page reads them (under `import.meta.env.BASE_URL`). */
export const LAKE_MODEL_DIR = 'models-exp/lake/';
export const LAKE_WEAPON_DIR = 'models-exp/lake/weapons/';

/** The model file of each combatant. The second Guardian is the other reading of the same model (a second Meshy run from another input). */
export const LAKE_FILES: Readonly<Record<LakeId, string>> = {
  tidus: 'tidus.glb',
  yuna: 'yuna.glb',
  rikku: 'rikku.glb',
  wakka: 'wakka.glb',
  auron: 'auron.glb',
  lulu: 'lulu.glb',
  kimahri: 'kimahri.glb',
  wendigo: 'wendigo.glb',
  'lake-guardian-a': 'guardian.glb',
  'lake-guardian-b': 'guardianb.glb',
};

/** The files of the weapons (the weapon folder). */
export const LAKE_WEAPON_FILES = ['brotherhood', 'staff', 'ball', 'doll', 'katana', 'jug', 'lance', 'claw', 'gclaw'] as const;
export type LakeWeapon = (typeof LAKE_WEAPON_FILES)[number];

/** Each model's native height in metres (its bounding box in the rest pose). The skin fits a model to the actor's world height when it is within `LAKE_FIT_RANGE` of this. */
export const LAKE_NATIVE_HEIGHT: Readonly<Record<LakeId, number>> = {
  tidus: 1.75,
  yuna: 1.65,
  rikku: 1.55,
  wakka: 1.85,
  auron: 1.9,
  lulu: 1.75,
  kimahri: 2.2,
  wendigo: 2.71,
  'lake-guardian-a': 1.89,
  'lake-guardian-b': 1.89,
};

/** A stage height within this share of the native one refits the model to it (so the HUD's anchors land on the figure); anything further keeps the native size. */
export const LAKE_FIT_RANGE = 0.25;

/** One weapon on one node: the fixed rotation (x, y, z, w) from the weapon's frame (origin at the grip, +Y to the tip, metres) onto the node's, the offset in metres in the node's axes, and a mirror for a left-hand copy. */
export interface LakeWeaponRow {
  readonly weapon: LakeWeapon;
  readonly node: string;
  readonly offsetM: readonly [number, number, number];
  readonly quat: readonly [number, number, number, number];
  readonly mirrorX: boolean;
}

/** The attach table (the asset lane's `attach-table.json`; the hook rows carry the game's own weapon-node rotation, the Guardians' claws and Auron's jug are placed by eye). */
export const LAKE_WEAPONS: Readonly<Partial<Record<LakeId, readonly LakeWeaponRow[]>>> = {
  tidus: [{ weapon: 'brotherhood', node: 'Hook_R', offsetM: [0, 0, 0], quat: [-0.00018, -0.0001, -0.71551, 0.69861], mirrorX: false }],
  yuna: [{ weapon: 'staff', node: 'Hook_R', offsetM: [0, 0, 0], quat: [0.4998, 0.5002, 0.5002, -0.4998], mirrorX: false }],
  wakka: [{ weapon: 'ball', node: 'Hook_R', offsetM: [0, 0, 0], quat: [0, 0, 0, 1], mirrorX: false }],
  lulu: [{ weapon: 'doll', node: 'Hook_R', offsetM: [0, 0, 0], quat: [-0.0254, 0.00101, -0.00348, 0.99967], mirrorX: false }],
  auron: [
    { weapon: 'katana', node: 'Hook_R', offsetM: [0, 0, 0], quat: [0.69574, 0.7183, -0.00017, 0.00004], mirrorX: false },
    { weapon: 'jug', node: 'Hips', offsetM: [0.27, 0, 0], quat: [0, 0, 0, 1], mirrorX: false },
  ],
  kimahri: [{ weapon: 'lance', node: 'Hook_R', offsetM: [0, 0, 0], quat: [0.00085, 0.00005, 1, 0.00065], mirrorX: false }],
  rikku: [
    { weapon: 'claw', node: 'Hook_R', offsetM: [0, 0, 0], quat: [0.00331, -0.02139, -0.69533, 0.71836], mirrorX: false },
    { weapon: 'claw', node: 'Hook_L', offsetM: [0, 0, 0], quat: [0.00331, -0.02139, -0.69533, 0.71836], mirrorX: false },
  ],
  'lake-guardian-a': [
    { weapon: 'gclaw', node: 'RightHand', offsetM: [0, 0, 0], quat: [0, 0, 0, 1], mirrorX: false },
    { weapon: 'gclaw', node: 'LeftHand', offsetM: [0, 0, 0], quat: [0, 0, 0, 1], mirrorX: true },
  ],
  'lake-guardian-b': [
    { weapon: 'gclaw', node: 'RightHand', offsetM: [0, 0, 0], quat: [0, 0, 0, 1], mirrorX: false },
    { weapon: 'gclaw', node: 'LeftHand', offsetM: [0, 0, 0], quat: [0, 0, 0, 1], mirrorX: true },
  ],
};

/** The frozen-lake props (Meshy, static: the asset lane's phase 1): a crystal cluster, the Macalania Temple's ice cathedral for the far shore, ice slabs, frozen reeds and a snow drift (the banks along the ice's edge and the hill under the Temple). Their textures are re-encoded for the lake (2048 base, 1024 the rest). */
export const LAKE_PROP_DIR = 'models-exp/lake/props/';
export const LAKE_PROP_FILES = ['crystals', 'temple', 'slabs', 'reeds', 'drift'] as const;
export type LakeProp = (typeof LAKE_PROP_FILES)[number];

/** The files that make the chapter's whole model set (the dist filter and the verifier read this): 10 bodies, 9 weapons and 5 props. */
export const LAKE_SHIPPED_FILES: readonly string[] = [...Object.values(LAKE_FILES).filter((f, i, a) => a.indexOf(f) === i), ...LAKE_WEAPON_FILES.map((w) => `weapons/${w}.glb`), ...LAKE_PROP_FILES.map((p) => `props/${p}.glb`)];
