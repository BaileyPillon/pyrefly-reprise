/**
 * **The hidden Wendigo chapter's 3D models** (FFX only; `../chapter-wendigo.ts`, branch `ch-wendigo`): which file draws which combatant, how big it stands, and which weapon hangs from which node. A module with no imports, so
 * the loader (`../../engine/lake3d/load.ts`), the dist filter and the tests can all read it without pulling each other's graphs in.
 *
 * The files are Meshy image-to-3D bodies rigged with a 24-joint Meshy rig, the party moved by the real FFX battle clips retargeted onto them (the clip names are the game's own kit: `idle1`, `attack1_00`, `magic2_00`,
 * `win_00`, `dead_00` ...), the weapons separate static models hung from the `Hook_R` and `Hook_L` nodes the retarget added under the hands (their rotation is the game's own `r_weapon` / `l_weapon` node in every clip).
 * **The Wendigo and the two Guado Guardians move by their own motion** (the finishing lane, 2026-11-09): the real `m212` and `m213` banks retargeted onto their Meshy rigs, joined into the clips the rig plays (`idle`,
 * `hurt`, `ko`, `attack`, `combo`, `cast`, `item`, `arms_up`, `stance_block1`, `stance_block2`, `sleep_in`, `sleep`, `wake`; each name's source motions are in the handoff note). **The four aeons of the chapter's roster
 * are Meshy models too** (`valefor`, `ifrit`, `ixion`, `shiva`): each made from renders of the real model in its bind pose and skinned to the REAL skeleton (weights carried over from the game's mesh), so the game's own
 * `s00N` motion drives it with no retarget (`idle`, `hurt`, `ko`, `attack`, `cast`). The files are local, gitignored (`public/models-exp/`), and loaded on use.
 *
 * **Heights are in metres on the stage's scale** (Tidus 1.75): the Wendigo 2.71 (1.55 times Tidus, the size table's drawn height) and the Guardian 1.89 (1.08 times); the party's are the art sizes of the paintings.
 * Game case: FFX only.
 */

/**
 * The party, the enemies and the aeons that carry a model. The aeons are the four of the chapter's roster (the Macalania preset's Valefor, Ifrit, Ixion and Shiva: `research/re-ffx-wendigo-lake-macalania.md` 12). **Bahamut is
 * not in it:** he is not owned at this point of the story (he comes at Zanarkand), so the fight can never summon him and a model of him would never be drawn.
 */
export const LAKE_PARTY = ['tidus', 'yuna', 'rikku', 'wakka', 'auron', 'lulu', 'kimahri'] as const;
export const LAKE_ENEMIES = ['wendigo', 'lake-guardian-a', 'lake-guardian-b'] as const;
export const LAKE_AEONS = ['valefor', 'ifrit', 'ixion', 'shiva'] as const;
export const LAKE_CAST = [...LAKE_PARTY, ...LAKE_ENEMIES, ...LAKE_AEONS] as const;
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
  valefor: 'valefor.glb',
  ifrit: 'ifrit.glb',
  ixion: 'ixion.glb',
  shiva: 'shiva.glb',
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
  // The aeons stand at the game's scale law (`data/ffx/fiend-stature.ts`: a model's drawn size is its bind-pose mesh height times the engine scale 4, on Tidus's 18.15 = 1.75 m): 7.799, 7.905 and 8.596 model units, so
  // 3.01, 3.05 and 3.32 m (the Isaaru chapter keeps its aeons at 3.2). **Valefor is the driver's pick, 3.4 m, not the law's 4.94 m:** the law's figure is the silhouette with the wings spread (the bind pose), which crops the frame at
  // the party's slot (the first GPU run) and which the paintings do not stand in (`research/ffx-isaaru-bevelle.md` 14.3); alternative: the law's 4.94 with a wider camera.
  valefor: 3.4,
  ifrit: 3.01,
  ixion: 3.05,
  shiva: 3.32,
};

/** The scale law's metres per model unit for an aeon (4 times `1.75 / 18.15`): what the aeon files' scene root carries. */
export const LAKE_AEON_METRES_PER_UNIT = 0.3857;

/**
 * **Where a clip's blow or effect lands, seconds from the clip's start: the game's own marks.** Each is the first `type 5, argument 0` event of the clip's motions (the signal the game's scripts read as the effect trigger; the
 * Evrae lane's reading, `runtime/evrae/clipmap.json`), joined with the offsets of the motions that make the clip: the Wendigo's `attack` is `attack1_00` (the trigger at frame 18 of 19) then `attack1_01`; its `combo` is
 * `sp3_00` (17 frames), `sp3_01` (8), `sp3_02` (the trigger at frame 24 of 25: the slam's landing) and `sp3_04`; the Guardians' `cast` is `magic2_00`, `magic2_01` and `magic2_02` (the trigger at frame 18) and their `item` is
 * `item_00`, `item_01` and `item_02_1` (frame 27); at 30 frames a second. A clip with no mark here has its strike read from its own motion (`engine/lake3d/monsterRig.ts`).
 */
export const LAKE_STRIKES: Readonly<Partial<Record<LakeId, Readonly<Record<string, number>>>>> = {
  wendigo: { attack: 0.6, combo: 1.6333 },
  'lake-guardian-a': { cast: 1.6, item: 1.9 },
  'lake-guardian-b': { cast: 1.6, item: 1.9 },
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
