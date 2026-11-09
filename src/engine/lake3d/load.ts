/**
 * **Finding and loading the lake's models** (the hidden Wendigo chapter's 3D stage; FFX only): the ten bodies and nine weapons of `../../data/ffx/lake-models.ts`, read from `public/models-exp/lake/`, parsed **once each**
 * and cloned per figure (skeletons rebound). The front line and the three enemies load before the fight opens (a fight must not start on a half-loaded figure); the four bench members load **in the background** after it, and
 * the skin picks each up the frame it is ready (a switched-in member whose model is not in yet stands as the stage made it for those frames). A file that is not there, or is not a binary glTF (a dev server answers an
 * unknown path under `public/` with its index page and status 200), is replaced by the neutral capsule (`./capsule.ts`), so the chapter always plays; `warn` says so once.
 *
 * `dispose` frees what the loader parsed (geometry, material, textures) and every model's own parts. Needs three.js and the glTF loader (imported here, on use). Game case: FFX only.
 */

import type { AnimationClip, Material, Mesh, Object3D, Texture } from 'three';
import { LAKE_CAST, LAKE_FILES, LAKE_MODEL_DIR, LAKE_NATIVE_HEIGHT, LAKE_PARTY, LAKE_WEAPON_DIR, LAKE_WEAPON_FILES, type LakeId, type LakeWeapon } from '../../data/ffx/lake-models.ts';
import { capsuleFigure } from './capsule.ts';
import { partyPlans } from './clipMap.ts';
import { LakeModel } from './model.ts';
import { attachWeapons, weaponNamesFor } from './weapons.ts';

/** A parsed file: its scene (never drawn itself; each model draws a clone) and its clips. */
export interface Parsed {
  scene: Object3D;
  animations: AnimationClip[];
}

/** How bytes arrive and become a scene. The defaults are `fetch` and three's glTF loader; a test hands its own. */
export interface LoaderIO {
  /** The bytes at `url`, or null when there is no such file (a missing file, a failed fetch, a body that is not a binary glTF). */
  fetchBytes(url: string): Promise<ArrayBuffer | null>;
  parse(bytes: ArrayBuffer): Promise<Parsed>;
  /** Clone a parsed scene for one model (skeletons rebound). */
  clone(scene: Object3D): Promise<Object3D>;
}

/** Whether `bytes` start with the binary glTF magic. */
export const looksLikeGlb = (bytes: ArrayBuffer): boolean => bytes.byteLength > 12 && new DataView(bytes).getUint32(0, true) === 0x46546c67;

export async function fetchGlb(url: string, fetcher: typeof fetch = fetch): Promise<ArrayBuffer | null> {
  try {
    const res = await fetcher(url);
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer();
    return looksLikeGlb(bytes) ? bytes : null;
  } catch {
    return null;
  }
}

/** The default IO: `fetch`, the glTF loader and `SkeletonUtils.clone`, both imported on use. */
export function defaultIO(): LoaderIO {
  return {
    fetchBytes: (url) => fetchGlb(url),
    async parse(bytes) {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().parseAsync(bytes, '');
      gltf.scene.traverse((o) => {
        const mat = (o as Mesh).material as { map?: Texture | null; normalMap?: Texture | null; metalnessMap?: Texture | null } | undefined;
        for (const t of [mat?.map, mat?.normalMap, mat?.metalnessMap]) if (t) t.anisotropy = 8;
      });
      return { scene: gltf.scene, animations: gltf.animations };
    },
    async clone(scene) {
      const { clone } = await import('three/addons/utils/SkeletonUtils.js');
      return clone(scene);
    },
  };
}

/** The URL of a model file under the page's base. */
export const modelUrl = (base: string, id: LakeId): string => `${base}${LAKE_MODEL_DIR}${LAKE_FILES[id]}`;
/** The URL of a weapon file. */
export const weaponUrl = (base: string, weapon: LakeWeapon): string => `${base}${LAKE_WEAPON_DIR}${weapon}.glb`;

/** Free every geometry, material and texture under a parsed scene. */
function freeScene(scene: Object3D): void {
  const maps = new Set<Texture>();
  scene.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      for (const v of Object.values(m as Material & Record<string, unknown>)) if ((v as Texture | null)?.isTexture === true) maps.add(v as Texture);
      m.dispose();
    }
  });
  for (const t of maps) t.dispose();
}

export interface LakeModels {
  /** The models by id, filled as they load (the bench's arrive in the background). */
  readonly models: Map<LakeId, LakeModel>;
  /** The ids that stand on the neutral capsule because their file was missing. */
  readonly capsules: LakeId[];
  /** Where each id's model came from. */
  readonly sources: Map<LakeId, 'own' | 'capsule'>;
  /** Resolves when the bench members are in (or failed). */
  readonly background: Promise<void>;
  dispose(): void;
}

export interface LoadOptions {
  /** The page's base (`import.meta.env.BASE_URL`). */
  readonly base: string;
  /** The stage's world height per id (a model refits to the actor's height later, in the skin). */
  readonly heights: Readonly<Partial<Record<LakeId, number>>>;
  readonly io?: LoaderIO;
  /** Said once per problem, for the log. */
  readonly warn?: (message: string) => void;
  /** Ids to load before the scene is handed back; the rest load in the background. Default: Tidus, Yuna, Rikku and the three enemies. */
  readonly eager?: readonly LakeId[];
  /** Ids not to load at all (a test). */
  readonly skip?: readonly LakeId[];
}

/** The ids loaded before the fight opens. */
export const EAGER: readonly LakeId[] = ['tidus', 'yuna', 'rikku', 'wendigo', 'lake-guardian-a', 'lake-guardian-b'];

/**
 * Load the cast. Resolves once the eager ids are in; the rest follow (`background`). The weapons are parsed first (each once), then each body parsed and cloned, its weapons hung, and a model made of it.
 */
export async function loadLakeModels(opts: LoadOptions): Promise<LakeModels> {
  const io = opts.io ?? defaultIO();
  const warn = opts.warn ?? ((): void => undefined);
  const models = new Map<LakeId, LakeModel>();
  const sources = new Map<LakeId, 'own' | 'capsule'>();
  const capsules: LakeId[] = [];
  const parsed: Parsed[] = [];
  let gone = false;
  const eager = new Set(opts.eager ?? EAGER);
  const skip = new Set(opts.skip ?? []);
  const wanted = LAKE_CAST.filter((id) => !skip.has(id));

  const weaponScenes = new Map<LakeWeapon, Object3D>();
  const weaponsNeeded = new Set<LakeWeapon>(wanted.flatMap((id) => weaponNamesFor(id)));
  await Promise.all(
    LAKE_WEAPON_FILES.filter((w) => weaponsNeeded.has(w)).map(async (w) => {
      const bytes = await io.fetchBytes(weaponUrl(opts.base, w));
      if (!bytes) return void warn(`[lake3d] weapon file missing: ${w}`);
      try {
        const p = await io.parse(bytes);
        parsed.push(p);
        weaponScenes.set(w, p.scene);
      } catch (e) {
        warn(`[lake3d] weapon file unreadable: ${w} (${String(e).slice(0, 80)})`);
      }
    }),
  );

  const build = async (id: LakeId): Promise<void> => {
    const height = opts.heights[id] ?? LAKE_NATIVE_HEIGHT[id];
    let model: LakeModel | null = null;
    let weapons: ReturnType<typeof attachWeapons> | null = null;
    try {
      const bytes = await io.fetchBytes(modelUrl(opts.base, id));
      if (bytes) {
        const p = await io.parse(bytes);
        parsed.push(p);
        if (gone) return;
        const scene = await io.clone(p.scene);
        scene.traverse((o) => {
          const mesh = o as Mesh;
          if (!mesh.isMesh) return;
          mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone(); // a figure's channels never reach another's
        });
        weapons = attachWeapons(id, scene, weaponScenes, (s) => s.clone(true));
        if (weapons.missing.length > 0) warn(`[lake3d] ${id}: unarmed where ${weapons.missing.join(', ')} is missing`);
        const names = p.animations.map((c) => c.name);
        const plans = (LAKE_PARTY as readonly string[]).includes(id) ? partyPlans(names) : null;
        const w = weapons;
        model = new LakeModel(id, scene, p.animations, height, plans, () => w.dispose());
        sources.set(id, 'own');
      }
    } catch (e) {
      warn(`[lake3d] ${id}: the model could not be read (${String(e).slice(0, 100)})`);
    }
    if (gone) {
      model?.dispose();
      return;
    }
    if (!model) {
      warn(`[lake3d] ${id}: no model file, standing on the neutral capsule`);
      model = new LakeModel(id, capsuleFigure(id), [], height, null);
      sources.set(id, 'capsule');
      capsules.push(id);
    }
    models.set(id, model);
  };

  await Promise.all(wanted.filter((id) => eager.has(id)).map(build));
  const background = (async (): Promise<void> => {
    for (const id of wanted.filter((i) => !eager.has(i))) await build(id); // one at a time: the bench is never the reason the first frames stutter
  })();

  return {
    models,
    capsules,
    sources,
    background,
    dispose(): void {
      gone = true;
      for (const m of models.values()) m.dispose();
      models.clear();
      for (const p of parsed) freeScene(p.scene);
      parsed.length = 0;
    },
  };
}
