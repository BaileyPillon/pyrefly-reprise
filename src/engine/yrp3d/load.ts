/**
 * **Finding and loading the real models** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only): each figure's model, its clips and the clip map are read from the models folders under
 * `public/` (`YRP_MODEL_DIRS`, `data/yrp-ids.ts`), in the order the page asks for them (`modelDirs`):
 *
 * - **Which Bahamut** (`BossChoice`): by default the AI-made one with the game's own clips moved onto it (the v2 rig: `bahamut-ai-rigged.glb` and `bahamut-ai-anims.glb`, his own physically based look); with those files
 *   missing, or with `?bossrig=simple`, the plain mesh (`bahamut-ai.glb`, no clips, the procedural wing flap); `?boss=real` the game's (`bahamut.glb` and his clips). The files of each figure are `figurePlans`' (`./layout.ts`), tried in order.
 * - **The model** is `<id>.glb` (the plan's file) from the first folder that has it. The HD folder (`yrp-hd/`: 4x textures, one level of subdivision) comes before the base one (`yrp/`), so **HD is the default whenever its file is there**,
 *   figure by figure; `?models=base` takes the base folder alone (the comparison). A figure whose file is in neither stands on the neutral capsule (`./capsule.ts`); its `<id>-anims.glb` alone is enough to show the
 *   mesh that file carries (the clips file is the same skeleton with the mesh and every motion).
 * - **The clips** are `<id>-anims.glb`'s animations, from the **base** folder first (the same motions on the same skeleton as the HD model's, without its 4x textures: the clips file carries the mesh too, and the HD one is 20 MB a figure)
 *   and from the HD folder when the base has none.
 * - **The clip map** is `clipmap.json`, from the same folders in the same order; with none, the plans are built from the clip names (`./clipMap.ts`).
 *
 * - **The dressphere models** (`./dress.ts`, `./dressLib.ts`): when the page hands a `preload`, each girl is first asked for the model of the dressphere her battle starts in (the game's own armed model for it, with its own
 *   clip map); a girl it has no model for keeps the single model above, which is also what every figure stands on with no `dress/` folder. The skin swaps a girl's model later, when her dressphere changes (`YrpModels.replace`).
 *
 * The files are fetched, parsed once each and cloned per figure. A body that is not a binary glTF is refused (a dev server answers an unknown path under `public/` with its index page and status 200). Game case: FFX-2 only.
 */

import { type AnimationClip, type Mesh, type Object3D } from 'three';
import { capsuleFigure } from './capsule.ts';
import { plansFor } from './clipMap.ts';
import { clipMapUrl, figurePlans, fileUrl, looksLikeGlb, YRP_CAST, type BossChoice, type FigurePlan, type Look, type YrpId } from './layout.ts';
import { YrpModel } from './model.ts';
import { weaponCount, weaponUrl } from './weapons.ts';

/** A parsed file: its scene (never drawn itself; each model draws a clone), its clips and the scene's extras. */
export interface Parsed {
  scene: Object3D;
  animations: AnimationClip[];
  /** The scene's extras (`gltf.scene.userData`): the `.chr` scale is in them. */
  extras?: Record<string, unknown>;
}

/** How bytes arrive and become a scene. The defaults are `fetch` and the glTF loader; a test hands its own. */
export interface LoaderIO {
  fetchBytes(url: string): Promise<ArrayBuffer | null>;
  /** A JSON file, parsed, or null when there is none (or it is not JSON). */
  fetchJson(url: string): Promise<unknown>;
  parse(bytes: ArrayBuffer): Promise<Parsed>;
  /** Clone a parsed scene for one model (skeletons rebound); default `SkeletonUtils.clone`. */
  clone(scene: Object3D): Promise<Object3D>;
}

/** The bytes at `url`, or null when there is no such file: a missing file, a failed fetch, or a body that is not a binary glTF. */
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

/** The JSON at `url`, or null (no file, a failed fetch, an index page where there is no file). */
export async function fetchJson(url: string, fetcher: typeof fetch = fetch): Promise<unknown> {
  try {
    const res = await fetcher(url);
    return res.ok ? ((await res.json()) as unknown) : null;
  } catch {
    return null;
  }
}

/** The default IO: `fetch`, three's glTF loader (imported here, on use, so a build that never plays this chapter carries none of it) and `SkeletonUtils.clone`. */
export function defaultIO(): LoaderIO {
  return {
    fetchBytes: (url) => fetchGlb(url),
    fetchJson: (url) => fetchJson(url),
    async parse(bytes) {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().parseAsync(bytes, '');
      return { scene: gltf.scene, animations: gltf.animations, extras: gltf.scene.userData as Record<string, unknown> };
    },
    async clone(scene) {
      const { clone } = await import('three/addons/utils/SkeletonUtils.js');
      return clone(scene);
    },
  };
}

/** The `.chr` scale a file's extras say the game draws the model at: `ffx2.runtimeScale`, else the scale block's `base` times `actor`; 1 when there is none. */
export function chrScaleOf(extras: Record<string, unknown> | undefined): number {
  const ffx2 = extras?.['ffx2'] as { runtimeScale?: unknown; scaleBlock?: { base?: number; actor?: number }; scale?: { base?: number; actor?: number } } | undefined;
  if (typeof ffx2?.runtimeScale === 'number' && ffx2.runtimeScale > 0) return ffx2.runtimeScale;
  const block = ffx2?.scaleBlock ?? ffx2?.scale;
  const s = (block?.base ?? 1) * (block?.actor ?? 1);
  return Number.isFinite(s) && s > 0 ? s : 1;
}

/** The folders to look in, best first, for a page's query (`?models=base` takes the base folder alone; anything else prefers the HD folder and falls back to the base one per figure). */
export function modelDirs(search: string, dirs: { readonly base: string; readonly hd: string }): readonly string[] {
  return new URLSearchParams(search).get('models') === 'base' ? [dirs.base] : [dirs.hd, dirs.base];
}

export interface LoadOptions {
  /** The page's base (`import.meta.env.BASE_URL`). */
  base: string;
  /** The folders under it, best first (`modelDirs`). */
  dirs: readonly string[];
  /** The figure's world height per id, from the actors the stage staged (the skin refits when the stage disagrees later). */
  heights: Readonly<Record<YrpId, number>>;
  /** Which Bahamut and whether the moved clips are asked for; the default is the AI boss with the game's clips moved onto him (the plain mesh when the rigged files are not there). */
  choice?: BossChoice;
  io?: LoaderIO;
  /** Said once per problem, for the log. */
  warn?: (message: string) => void;
  /**
   * A source of ready-made models, asked first for each girl (the dressphere models: `DressLibrary.starter`, `./dressLib.ts`); null for a figure it has none for, and that figure loads from the folders as ever.
   * `dispose` is called when the loaded models are.
   */
  preload?: { starter(id: YrpId): Promise<{ model: YrpModel; source: FigureSource } | null>; dispose?(): void };
}

/** Where a figure's parts came from: the folder of its model and of its clips, null for none; the model file and the look it is shaded in. */
export interface FigureSource {
  readonly mesh: string | null;
  readonly clips: string | null;
  readonly file: string | null;
  readonly look: Look | null;
  /** What a girl holds: the game's own weapons (`real`: her weapon file and every locator were there), the procedural props (`props`) or nothing; absent for Bahamut. */
  readonly weapons?: 'real' | 'props' | 'none';
}

/** The models that loaded, by id, and what to free. */
export interface YrpModels {
  readonly models: ReadonlyMap<YrpId, YrpModel>;
  /** Ids whose own file was missing and that stand on the neutral capsule. */
  readonly capsules: readonly YrpId[];
  /** Which folder each figure's parts came from (the debug view's and the tests' read). */
  readonly sources: Readonly<Record<string, FigureSource>>;
  /** Put `model` in `id`'s place (a girl's dressphere changed: the skin swaps her model); the one it replaces is the caller's to dispose. */
  replace(id: YrpId, model: YrpModel, source?: FigureSource): void;
  dispose(): void;
}

/** Free a parsed scene's geometry and textures. */
export function freeScene(scene: Object3D): void {
  scene.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const mat = m as { map?: { dispose(): void } | null; dispose?(): void } | undefined;
      mat?.map?.dispose();
      mat?.dispose?.();
    }
  });
}

/** Load the four models, each from its own files; a figure whose file is missing (or does not parse) stands on the neutral capsule. Every id has an entry. */
export async function loadYrpModels(opts: LoadOptions): Promise<YrpModels> {
  const io = opts.io ?? defaultIO();
  const choice = opts.choice ?? { boss: 'ai', rig: true };
  const parsed = new Map<string, Promise<Parsed | null>>();
  const parseOnce = (url: string): Promise<Parsed | null> => {
    let p = parsed.get(url);
    if (!p) {
      p = (async () => {
        const bytes = await io.fetchBytes(url);
        if (!bytes) return null;
        try {
          return await io.parse(bytes);
        } catch (e) {
          opts.warn?.(`[yrp3d] ${url} did not parse: ${e instanceof Error ? e.message : String(e)}`);
          return null;
        }
      })();
      parsed.set(url, p);
    }
    return p;
  };
  const maps = new Map<string, Promise<unknown>>();
  const mapOnce = (url: string): Promise<unknown> => {
    let p = maps.get(url);
    if (!p) {
      p = io.fetchJson(url);
      maps.set(url, p);
    }
    return p;
  };
  const first = async <T>(dirs: readonly string[], pick: (dir: string) => Promise<T | null>): Promise<{ dir: string; value: T } | null> => {
    for (const dir of dirs) {
      const value = await pick(dir);
      if (value) return { dir, value };
    }
    return null;
  };
  /** A girl's weapon file, parsed once and cloned for each hand of her kit (`./weapons.ts`); null when the file is in no folder (she keeps the procedural props). */
  const weaponScenes = async (id: YrpId): Promise<Object3D[] | null> => {
    const url = weaponCount(id) ? (dir: string) => parseOnce(weaponUrl(opts.base, dir, id)!) : null;
    const file = url ? await first(opts.dirs, url) : null;
    if (!file) return null;
    return Promise.all(Array.from({ length: weaponCount(id) }, () => io.clone(file.value.scene)));
  };
  const models = new Map<YrpId, YrpModel>();
  const capsules: YrpId[] = [];
  const sources: Record<string, FigureSource> = {};
  await Promise.all(
    YRP_CAST.map(async (id) => {
      const made = await opts.preload?.starter(id).catch(() => null); // the dressphere model the girl's battle starts in, where there is one
      if (made) {
        models.set(id, made.model);
        sources[id] = made.source;
        return;
      }
      const clipOrder = [...opts.dirs].reverse(); // the base folder's clips first: the same motions without the HD textures' weight
      let found: { plan: FigurePlan; mesh: { dir: string; value: Parsed }; anims: { dir: string; value: Parsed } | null } | null = null;
      for (const plan of figurePlans(id, choice)) {
        const mesh = await first(opts.dirs, (d) => parseOnce(fileUrl(opts.base, d, plan.mesh)));
        const anims = plan.anims ? await first(clipOrder, (d) => parseOnce(fileUrl(opts.base, d, plan.anims!))) : null;
        const shown = mesh ?? anims; // the clips file carries the mesh too
        if (shown) {
          found = { plan, mesh: shown, anims };
          break;
        }
      }
      if (!found) {
        models.set(id, new YrpModel(id, capsuleFigure(id), [], opts.heights[id], 'capsule'));
        capsules.push(id);
        sources[id] = { mesh: null, clips: null, file: null, look: null };
        return;
      }
      const { plan, mesh, anims } = found;
      const clips = (anims ?? mesh).value.animations;
      const names = clips.map((c) => c.name);
      const map = await first(clipOrder, async (d) => (await mapOnce(clipMapUrl(opts.base, d))) ?? null);
      const plans = plansFor(id, map?.value ?? null, names);
      const scene = await io.clone(mesh.value.scene);
      const weapons = await weaponScenes(id);
      const model = new YrpModel(id, scene, clips, opts.heights[id], 'own', { plans, chrScale: chrScaleOf(mesh.value.extras ?? anims?.value.extras), look: plan.look, ...(weapons ? { weapons } : {}) });
      models.set(id, model);
      sources[id] = { mesh: mesh.dir, clips: anims?.dir ?? null, file: plan.mesh, look: plan.look, ...(weaponCount(id) ? { weapons: model.weaponKind } : {}) };
      if (anims && anims.value !== mesh.value) freeScene(anims.value.scene); // only its motions were wanted
    }),
  );
  return {
    models,
    capsules,
    sources,
    replace(id, model, source): void {
      models.set(id, model);
      if (source) sources[id] = source;
    },
    dispose(): void {
      for (const m of models.values()) m.dispose();
      models.clear();
      opts.preload?.dispose?.();
      void Promise.all(parsed.values()).then((files) => {
        for (const f of files) if (f) freeScene(f.scene);
      });
    },
  };
}
