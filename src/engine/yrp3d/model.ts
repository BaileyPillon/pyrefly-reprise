/**
 * **A loaded model, made toon and fitted to a figure** (the hidden 3D Bahamut chapter; FFX-2 only): `yuna.glb`, `rikku.glb`, `paine.glb` and `bahamut.glb` from `public/models-exp/yrp/`. The files are **local only**:
 * gitignored, never committed (the repo is public and the files are large) and never shipped (`tools/dist-filter.mjs`). A slot whose file is missing stands on the neutral toon capsule (`./capsule.ts`), so the
 * chapter always plays in frame A with something on every mark.
 *
 * ## What a file must be (the contract the real models are made to)
 *
 * A binary glTF (`.glb`), **Y up, facing +Z, the feet on y 0** (their centre does not matter: the fit centres the footprint), in any scale (the fit scales the box's height to the figure's world height, so a
 * model of 2.3 units and one of 180 both stand 1.9 tall). Skinned or not; if it carries animation clips, one named like `idle` loops under the procedural motion. Draco and Meshopt are not decoded. Its base colour map is
 * what the toon look uses (`./toon.ts`).
 *
 * ## Layers
 *
 * `root` (parent it to the actor's motion group) holds `lie` (a KO tips the body about the feet), which holds `yaw` (the way the figure is turned), which holds `fit` (the scale and the offset that stand the model on
 * the floor), which holds the file's scene. Everything the stage does to the actor (lunge, recoil, hop, squash, shake) moves `root`'s parent, so the model rides it.
 *
 * Needs three.js (and the glTF loader, imported on use); no DOM beyond `fetch`. Game case: FFX-2 only.
 */

import { AnimationMixer, Box3, Color, Group, LoopRepeat, Vector3, type AnimationAction, type AnimationClip, type Object3D } from 'three';
import { capsuleFigure } from './capsule.ts';
import { fitBox, looksLikeGlb, modelUrl, TOON, YRP_BOSS_ID, YRP_CAST, type BoxData, type YrpId } from './layout.ts';
import { Orb } from './orb.ts';
import { disposeToon, drive, setInkThickness, toonify, toonRamp, type ToonSet } from './toon.ts';

/** Where a model came from: its own file, or the neutral capsule that stands in for a missing one. */
export type ModelSource = 'own' | 'capsule';

/** The channels a figure's flash, cast glow and tint drive on its model (`./skin.ts`). */
export interface Channels {
  colour: Color;
  emissive: Color;
  amount: number;
  opacity: number;
}

/** How far a body lying down is lifted off the floor so it rests on it instead of sinking through (a share of the figure's height). */
const LIE_LIFT = 0.08;

const idleOf = (clips: readonly AnimationClip[]): AnimationClip | undefined => clips.find((c) => /idle|breath|stand/i.test(c.name));

export class YrpModel {
  readonly id: YrpId;
  readonly source: ModelSource;
  /** Parent this to the actor's motion group. */
  readonly root = new Group();
  private readonly lie = new Group();
  private readonly yaw = new Group();
  private readonly fit = new Group();
  private readonly set: ToonSet;
  private readonly natural: BoxData;
  private readonly mixer: AnimationMixer | null;
  private readonly idle: AnimationAction | null;
  /** Bahamut's gathering orb (his Mega Flare's windup); the girls have none. */
  private readonly orb: Orb | null;
  private figureHeight: number;
  private lieAmount = 0;

  /** `scene` is the file's scene (or a clone of it), `clips` its animations. The model measures it first, then adds the toon hulls. */
  constructor(id: YrpId, scene: Object3D, clips: readonly AnimationClip[], height: number, source: ModelSource = 'own') {
    this.id = id;
    this.source = source;
    this.figureHeight = height;
    scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(scene);
    this.natural = { min: [box.min.x, box.min.y, box.min.z], max: [box.max.x, box.max.y, box.max.z] };
    const fit = fitBox(this.natural, height);
    this.set = toonify(scene, TOON.inkWorld / fit.scale, toonRamp());
    this.root.name = `yrp-${id}`;
    this.fit.add(scene);
    this.yaw.add(this.fit);
    this.lie.add(this.yaw);
    this.root.add(this.lie);
    this.orb = id === YRP_BOSS_ID ? new Orb() : null;
    if (this.orb) this.yaw.add(this.orb.sprite);
    this.place();
    const idle = idleOf(clips);
    if (idle) {
      this.mixer = new AnimationMixer(scene);
      this.idle = this.mixer.clipAction(idle);
      this.idle.setLoop(LoopRepeat, Infinity);
      this.idle.play();
      this.mixer.setTime(phaseOf(id) * idle.duration); // the party does not breathe in step
    } else {
      this.mixer = null;
      this.idle = null;
    }
  }

  /** The figure's height now, world units. */
  get height(): number {
    return this.figureHeight;
  }

  /** The model's footprint over its height, from its box (the camera and the lunge's reach read it). */
  get widthOverHeight(): number {
    return fitBox(this.natural, this.figureHeight).widthOverHeight;
  }

  /** True when the file has an idle clip playing. */
  get animated(): boolean {
    return this.idle !== null;
  }

  /** Refit to a figure of another height (the stage re-sizes a boss): the scale, the offset and the ink's thickness in the file's units follow. */
  fitTo(height: number): void {
    if (!(height > 0) || Math.abs(height - this.figureHeight) < 1e-4) return;
    this.figureHeight = height;
    this.place();
    this.setLie(this.lieAmount, this.lieFacing);
  }

  private place(): void {
    const f = fitBox(this.natural, this.figureHeight);
    this.fit.scale.setScalar(f.scale);
    this.fit.position.set(f.offset[0], f.offset[1], f.offset[2]);
    setInkThickness(this.set.hullMaterial, TOON.inkWorld / f.scale);
    this.orb?.place(this.figureHeight);
  }

  /** The orb's strength, 0..1 (the cast glow); a no-op for a figure with no orb. */
  setOrb(strength: number): void {
    this.orb?.set(strength, this.figureHeight);
  }

  /** Turn the figure to `radians` about +Y (0 faces +Z). */
  setYaw(radians: number): void {
    this.yaw.rotation.y = radians;
  }

  private lieFacing: 1 | -1 = 1;

  /** Tip the body onto its back, 0 standing to 1 lying: it falls away from the way it faces (`facing`, +1 toward +x), about its feet, and rests a little off the floor. */
  setLie(amount: number, facing: 1 | -1): void {
    this.lieAmount = amount;
    this.lieFacing = facing;
    this.lie.rotation.z = facing * amount * (Math.PI / 2);
    this.lie.position.y = amount * LIE_LIFT * this.figureHeight;
  }

  /** The figure's colour, glow and opacity (the toon set's channels). */
  setChannels(c: Channels): void {
    drive(this.set, c);
  }

  /** The visible toon meshes and hulls, for a test and the debug view. */
  get meshCount(): number {
    return this.set.hulls.length;
  }

  update(dt: number): void {
    this.mixer?.update(dt);
  }

  dispose(): void {
    this.mixer?.stopAllAction();
    disposeToon(this.set, this.source === 'capsule'); // a capsule's geometry is its own; a file's is shared with the clones of it and freed with the loader
    this.orb?.dispose();
    this.root.removeFromParent();
  }
}

/** A fraction in [0, 1) that is the same for the same id: where in its idle each model starts. */
export function phaseOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** A parsed file: its scene (never drawn itself; each model draws a clone) and its clips. */
export interface Parsed {
  scene: Object3D;
  animations: AnimationClip[];
}

/** How bytes arrive and become a scene. The defaults are `fetch` and the glTF loader; a test hands its own. */
export interface LoaderIO {
  fetchBytes(url: string): Promise<ArrayBuffer | null>;
  parse(bytes: ArrayBuffer): Promise<Parsed>;
  /** Clone a parsed scene for one model (skeletons rebound); default `SkeletonUtils.clone`. */
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

export interface LoadOptions {
  /** The page's base (`import.meta.env.BASE_URL`). */
  base: string;
  /** The folder under it (`YRP_MODEL_DIR`). */
  dir: string;
  /** The figure's world height per id, from the actors the stage staged (the skin refits when the stage disagrees later). */
  heights: Readonly<Record<YrpId, number>>;
  io?: LoaderIO;
  /** Said once per problem, for the log. */
  warn?: (message: string) => void;
}

/** The models that loaded, by id, and what to free. */
export interface YrpModels {
  readonly models: ReadonlyMap<YrpId, YrpModel>;
  /** Ids whose own file was missing and that stand on the neutral capsule. */
  readonly capsules: readonly YrpId[];
  dispose(): void;
}

/** Load the four models, each from its own file; a figure whose file is missing (or does not parse) stands on the neutral capsule. Every id has an entry. */
export async function loadYrpModels(opts: LoadOptions): Promise<YrpModels> {
  const io = opts.io ?? defaultIO();
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
  const models = new Map<YrpId, YrpModel>();
  const capsules: YrpId[] = [];
  await Promise.all(
    YRP_CAST.map(async (id) => {
      const file = await parseOnce(modelUrl(opts.base, opts.dir, id));
      if (file) {
        models.set(id, new YrpModel(id, await io.clone(file.scene), file.animations, opts.heights[id], 'own'));
      } else {
        models.set(id, new YrpModel(id, capsuleFigure(id), [], opts.heights[id], 'capsule'));
        capsules.push(id);
      }
    }),
  );
  return {
    models,
    capsules,
    dispose(): void {
      for (const m of models.values()) m.dispose();
      models.clear();
      void Promise.all(parsed.values()).then((files) => {
        for (const f of files) f?.scene.traverse((o) => {
          const mesh = o as { isMesh?: boolean; geometry?: { dispose(): void }; material?: unknown };
          if (!mesh.isMesh) return;
          mesh.geometry?.dispose();
          for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            const mat = m as { map?: { dispose(): void } | null; dispose?(): void } | undefined;
            mat?.map?.dispose();
            mat?.dispose?.();
          }
        });
      });
    },
  };
}

/** The size a model measures, in its own units (for the log and the tests). */
export function sizeOf(object: Object3D): Vector3 {
  return new Box3().setFromObject(object).getSize(new Vector3());
}
