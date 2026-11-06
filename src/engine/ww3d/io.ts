/**
 * **How bytes arrive and become a scene** (the hidden Wind Waker chapter; FFX-2 only): the one place the chapter touches `fetch` and three's glTF loader, so a test can hand it fakes. Used by the models
 * (`./model.ts`) and by the swappable props and temple pieces (`./swaps.ts`).
 *
 * The files are **kept out of git** (the repo is public and the files are large) and **ship in a production build** (`tools/dist-filter.mjs` names `models-exp/windwaker/**`; `tools/vite-ww-models.mjs` restores them before a build and fails a release build that lacks them), so a missing file is the case of a dev tree or a build made without them and a fetch
 * that fails, a status that is not OK, or a body that is not a binary glTF all mean the same thing: no file. Draco and Meshopt are not decoded.
 */

import type { AnimationClip, Object3D } from 'three';
import { disposeSkeletonsUnder } from '../skeletons.ts';
import { looksLikeGlb } from './layout.ts';

/** A parsed file: its scene (never drawn itself; each use draws a clone) and its clips. */
export interface Parsed {
  scene: Object3D;
  animations: AnimationClip[];
}

/** How bytes arrive and become a scene. The defaults are `fetch` and the glTF loader; a test hands its own. */
export interface LoaderIO {
  fetchBytes(url: string): Promise<ArrayBuffer | null>;
  parse(bytes: ArrayBuffer): Promise<Parsed>;
  /** Clone a parsed scene for one use (skeletons rebound); default `SkeletonUtils.clone`. */
  clone(scene: Object3D): Promise<Object3D>;
}

/** The bytes at `url`, or null when there is no such file: a missing file, a failed fetch, or a body that is not a binary glTF (a dev server answers an unknown path with its index page). */
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

/** The default IO: `fetch`, three's glTF loader (imported here, on use, so a build that never plays this chapter carries none of it) and `SkeletonUtils.clone`. */
export function defaultIO(): LoaderIO {
  return {
    fetchBytes: (url) => fetchGlb(url),
    async parse(bytes) {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const gltf = await new GLTFLoader().parseAsync(bytes, '');
      return { scene: gltf.scene, animations: gltf.animations };
    },
    async clone(scene) {
      const { clone } = await import('three/addons/utils/SkeletonUtils.js');
      return clone(scene);
    },
  };
}

/** A loader that parses each URL once however many ask (the models and the pieces share files), and says so once when a file will not parse. */
export class FileCache {
  private readonly parsed = new Map<string, Promise<Parsed | null>>();

  constructor(
    readonly io: LoaderIO,
    private readonly warn?: (message: string) => void,
  ) {}

  /** The parsed file at `url`, or null when there is no such file (or it does not parse). */
  get(url: string): Promise<Parsed | null> {
    let p = this.parsed.get(url);
    if (!p) {
      p = (async (): Promise<Parsed | null> => {
        const bytes = await this.io.fetchBytes(url);
        if (!bytes) return null;
        try {
          return await this.io.parse(bytes);
        } catch (e) {
          this.warn?.(`[ww3d] ${url} did not parse: ${e instanceof Error ? e.message : String(e)}`);
          return null;
        }
      })();
      this.parsed.set(url, p);
    }
    return p;
  }

  /**
   * Free the geometry, **every** texture and the materials of every file this cache parsed (once nothing draws from them), and the skeletons of its skinned meshes.
   *
   * Release 75 second code pass, the driver's decision 1 (FFX-2 only, the hidden Wind Waker chapter; the same two holes the 3D Bahamut chapter had, YR-11): the colour map alone was freed, so a file that kept its normal,
   * roughness, metalness or occlusion map left it behind; and a skinned mesh's skeleton keeps a bone texture that only `Skeleton.dispose()` frees (`../skeletons.ts`). The skeletons here are the file's own and the ones its
   * plain clones (`Object3D.clone`, a swapped prop or a temple piece) share; a `SkeletonUtils.clone` has skeletons of its own, freed with its model (`./toonify.ts`).
   */
  dispose(): void {
    void Promise.all(this.parsed.values()).then((files) => {
      for (const f of files) {
        if (!f) continue;
        f.scene.traverse((o) => {
          const mesh = o as { isMesh?: boolean; geometry?: { dispose(): void }; material?: unknown };
          if (!mesh.isMesh) return;
          mesh.geometry?.dispose();
          for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            const mat = m as ({ dispose?(): void } & Record<string, unknown>) | undefined;
            if (!mat) continue;
            for (const value of Object.values(mat)) {
              const texture = value as { isTexture?: boolean; dispose?(): void } | null;
              if (texture?.isTexture === true) texture.dispose?.();
            }
            mat.dispose?.();
          }
        });
        disposeSkeletonsUnder(f.scene);
      }
    });
    this.parsed.clear();
  }
}
