/**
 * **Bailey's own converted motions, as three.js clips** (the hidden Fayth chapter's `ffx` skin; FFX only; `docs/plans/fayth-3d.md`, phase 5a). Local only, like the models (`./models.ts`): the files are his own
 * copy of the game, converted on his PC, served read-only by the dev server (`tools/vite-ffx-local.mjs`). Nothing here is reachable from a production build (the scene reaches it through the DEV-gated dynamic
 * `import()`), and it loads nothing until the probe has found the folder.
 *
 * `clipmap.json` (beside the models: `D:\Tools\ffx-parity\assets\runtime\evrae\clipmap.json`) says which clips each actor plays for which row (`./clipMap.ts`) and which file holds them (the actor's
 * `<name>-anims.glb`: the skinned model plus every motion of the game's banks, 100 or so, named by the game's own motion names). Only the clips the table uses are kept; the rest of each file (the model it
 * carries, its textures) is freed at once, so the cost of a load is the parse. A clip's tracks name the skeleton's nodes (`SkeletonNode_<n>`), which the posed model the skin shows has under the same
 * names: the mixer binds them by name.
 *
 * No clipmap, or one that is not of the shape {@link parseClipMap} reads, is `null`, quietly: the models then hold their idle pose, as in phase 3. A file that will not load costs only that actor.
 *
 * Game case: FFX only (the files are FFX's).
 */

import type { AnimationClip, BufferGeometry, Material, Mesh, Object3D, Texture } from 'three';
import { clipNamesOf, parseClipMap, type ClipMap } from './clipMap.ts';
import { ffxLocalUrl, type FfxLocalManifest } from './localAssets.ts';
import { folderOf } from './models.ts';

export interface FfxClips {
  readonly map: ClipMap;
  /** By actor id: the clips the table uses, by name. */
  readonly clips: Readonly<Record<string, ReadonlyMap<string, AnimationClip>>>;
  /** What did not load, in words, for the log. */
  readonly problems: readonly string[];
}

type Loader = { loadAsync(url: string): Promise<{ scene: Object3D; animations: AnimationClip[] }> };

/** Free a loaded scene's geometry, materials and textures: only its clips are wanted. */
function discard(scene: Object3D): void {
  const textures = new Set<Texture>();
  scene.traverse((o) => {
    const mesh = o as Partial<Mesh>;
    if (!mesh.isMesh) return;
    (mesh.geometry as BufferGeometry | undefined)?.dispose();
    for (const m of ([] as Material[]).concat((mesh.material as Material | Material[] | undefined) ?? [])) {
      for (const value of Object.values(m)) if (value && (value as Texture).isTexture) textures.add(value as Texture);
      m.dispose();
    }
  });
  for (const t of textures) t.dispose();
}

async function loadJson(path: string): Promise<unknown> {
  try {
    const res = await fetch(ffxLocalUrl(path), { cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * The clips for every actor of `actorIds` the table has a row table and a file for, in parallel. `null` when the folder has no usable `clipmap.json`. The glTF loader is imported here, on demand, so a page
 * that never reaches this (production, a dev server without the folder) never loads it.
 */
export async function loadFfxClips(manifest: FfxLocalManifest, actorIds: readonly string[]): Promise<FfxClips | null> {
  const folder = folderOf(Object.values(manifest.actors)[0]?.file ?? manifest.stage.file);
  const map = parseClipMap(await loadJson(`${folder}clipmap.json`));
  if (!map) return null;
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const loader = new GLTFLoader() as unknown as Loader;
  const problems: string[] = [];
  const clips: Record<string, ReadonlyMap<string, AnimationClip>> = {};
  await Promise.all(
    actorIds.map(async (id) => {
      const actor = map.actors[id];
      if (!actor) return;
      try {
        const loaded = await loader.loadAsync(ffxLocalUrl(actor.file));
        const wanted = new Set(clipNamesOf(actor));
        const kept = new Map(loaded.animations.filter((a) => wanted.has(a.name)).map((a) => [a.name, a] as const));
        discard(loaded.scene);
        for (const name of wanted) if (!kept.has(name)) problems.push(`${id}: no clip ${name} in ${actor.file}`);
        clips[id] = kept;
      } catch (e) {
        problems.push(`${id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }),
  );
  return { map, clips, problems };
}
