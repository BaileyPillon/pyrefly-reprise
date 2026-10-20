/**
 * **A loaded model, made toon and fitted to a figure** (the hidden 3D Bahamut chapter; FFX-2 only): `yuna.glb`, `rikku.glb`, `paine.glb` and `bahamut.glb` from `public/models-exp/yrp/`. The files are **local only**:
 * gitignored, never committed (the repo is public and the files are large) and never shipped (`tools/dist-filter.mjs`). A slot whose file is missing stands on the neutral toon capsule (`./capsule.ts`), so the
 * chapter always plays in frame A with something on every mark.
 *
 * ## What a file must be (the contract the real models are made to)
 *
 * A binary glTF (`.glb`), **Y up, facing +Z, the feet on y 0** (their centre does not matter: the fit centres the footprint), in any scale (the fit scales the box's height to the figure's world height, so a
 * model of 2.3 units and one of 180 both stand 1.9 tall). Skinned or not; if it carries animation clips they are named for what they are (`idle`, `attack`, `hit`, `cast`, `victory`; `./clips.ts`): the idle loops under the procedural motion and the others play on the battle's events. Draco and Meshopt are not decoded. Its base colour map is
 * what the toon look uses (`./toon.ts`).
 *
 * ## Layers
 *
 * `root` (parent it to the actor's motion group) holds `lie` (a KO tips the body about the feet), which holds `yaw` (the way the figure is turned), which holds `fit` (the scale and the offset that stand the model on
 * the floor), which holds the file's scene. Everything the stage does to the actor (lunge, recoil, hop, squash, shake) moves `root`'s parent, so the model rides it.
 *
 * Needs three.js (and the glTF loader, imported on use); no DOM beyond `fetch`. Game case: FFX-2 only.
 */

import { Box3, Color, Group, Vector3, type AnimationClip, type Object3D } from 'three';
import { ClipRig, roleClips } from './clips.ts';
import { attachProps, type Attached } from './props.ts';
import { flapSpecOf, makeFlap, setFlap, type FlapUniforms } from './toon.ts';
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

/** How far a rigid winged model's wingtips swing at rest, and the most they add when it acts, as shares of the half-span; and the flap's speed at rest and the most it adds, radians a second. */
export const FLAP = { rest: 0.03, active: 0.11, rate: 1.6, rateActive: 3.4 } as const;

/** How far a model rears back at full strength (radians about its feet, top toward the back) and how much it swells: Bahamut's Mega Flare. */
export const REAR = { tilt: 0.3, swell: 0.04 } as const;

/** How far a body lying down is lifted off the floor so it rests on it instead of sinking through (a share of the figure's height). */
const LIE_LIFT = 0.12;


export class YrpModel {
  readonly id: YrpId;
  readonly source: ModelSource;
  /** Parent this to the actor's motion group. */
  readonly root = new Group();
  private readonly lie = new Group();
  private readonly yaw = new Group();
  /** Between the yaw and the fit: the body rears back about its feet (`setRear`). */
  private readonly rear = new Group();
  private readonly fit = new Group();
  private readonly set: ToonSet;
  private readonly natural: BoxData;
  /** The model's clips driven by the battle (`./clips.ts`), or null for a model with no idle clip (Bahamut is unrigged; a capsule has none): it stays procedural. */
  private readonly rig: ClipRig | null;
  /** The weapons parented to the hand bones (`./props.ts`), or none. */
  private readonly props: Attached;
  /** Bahamut's gathering orb (his Mega Flare's windup); the girls have none. */
  private readonly orb: Orb | null;
  /** The wing flap of a rigid model with wings (Bahamut's), or null: the cells every material and the ink hull read, and the half-span in the file's units. */
  private readonly flap: { cells: FlapUniforms; halfSpan: number } | null;
  private flapClock = 0;
  private activity = 0;
  /** Seconds left of the pulse a model with no clips (Bahamut) takes from an attack or cast opening: his wings beat harder for it. */
  private pulse = 0;
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
    this.props = attachProps(id, scene, this.natural.max[1] - this.natural.min[1]); // after the box is measured (a sword must not change the fit), before the toon pass (so it becomes toon too)
    const fit = fitBox(this.natural, height);
    const byRole = roleClips(clips);
    const spec = id === YRP_BOSS_ID && !byRole.has('idle') ? flapSpecOf(scene) : null; // a rigid winged model (Bahamut's): the wings flap in the vertex shader
    this.flap = spec ? { cells: makeFlap(spec), halfSpan: spec.halfSpan } : null;
    this.set = toonify(scene, TOON.inkWorld / fit.scale, toonRamp(), this.flap?.cells ?? null);
    this.root.name = `yrp-${id}`;
    this.fit.add(scene);
    this.rear.add(this.fit);
    this.yaw.add(this.rear);
    this.lie.add(this.yaw);
    this.root.add(this.lie);
    this.orb = id === YRP_BOSS_ID ? new Orb() : null;
    if (this.orb) this.rear.add(this.orb.sprite); // the orb rears with the chest it hangs at
    this.place();
    this.rig = byRole.has('idle') ? new ClipRig(scene, byRole, id) : null;
  }

  /** The figure's height now, world units. */
  get height(): number {
    return this.figureHeight;
  }

  /** The model's footprint over its height, from its box (the camera and the lunge's reach read it). */
  get widthOverHeight(): number {
    return fitBox(this.natural, this.figureHeight).widthOverHeight;
  }

  /** True when the file has an idle clip playing (and so the battle's clips: `noteOpen`, `noteImpact`, `notePose`). */
  get animated(): boolean {
    return this.rig !== null;
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

  /** How much a flapping model is acting now: what the skin says (its pose) or a pulse from an action that opened. */
  private get acting(): number {
    return Math.max(this.activity, this.pulse > 0 ? 1 : 0);
  }

  /** How much the model is acting, 0..1 (an attack, a cast): a flapping model flaps harder and faster. A no-op for a model with no flap. */
  setActivity(activity: number): void {
    this.activity = Math.min(1, Math.max(0, activity));
  }

  /** Rear back about the feet, 0 standing to 1 at full (`REAR`): Bahamut's Mega Flare. */
  setRear(amount: number): void {
    const a = Math.min(1, Math.max(0, amount));
    this.rear.rotation.x = -REAR.tilt * a;
    this.rear.scale.setScalar(1 + REAR.swell * a);
  }

  /** The flap's amplitude now in the file's units, or 0 for a model with no flap (a test's read). */
  get flapAmplitude(): number {
    return this.flap ? (FLAP.rest + FLAP.active * this.acting) * this.flap.halfSpan : 0;
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

  /** The clip role playing now, or null for a model with no rig. */
  get playing(): string | null {
    return this.rig?.current ?? null;
  }

  /** An action by this figure opened (`attack` or `cast` start their clips), the blow lands `lead` seconds on; `paceRate` is the pacing option's rate for one-shots. A model with no rig has no clips to start and takes a pulse on its wings instead. */
  noteOpen(kind: string, lead: number | undefined, paceRate = 1): void {
    if (this.rig) this.rig.open(kind, lead, paceRate);
    else if (kind === 'attack' || kind === 'cast') this.pulse = 1.4; // no clips: the wings beat harder for a moment
  }

  /** The blow landed. */
  noteImpact(paceRate = 1): void {
    this.rig?.impact(paceRate);
  }

  /** The pose the actor shows and whether it is down, once a frame (a hit and a victory start their clips). */
  notePose(pose: string, down: boolean, paceRate = 1): void {
    this.rig?.pose(pose, down, paceRate);
  }

  /** Advance the clips by `dt` seconds; `frozen` (a body that is down, REDUCE MOTION) holds the pose. */
  update(dt: number, frozen = false): void {
    this.rig?.update(dt, frozen);
    if (this.pulse > 0) this.pulse = Math.max(0, this.pulse - dt);
    if (this.flap) {
      if (!frozen) this.flapClock += dt * (FLAP.rate + FLAP.rateActive * this.acting);
      setFlap(this.set, this.flapClock, this.flapAmplitude);
    }
  }

  dispose(): void {
    this.rig?.dispose();
    this.props.dispose();
    disposeToon(this.set, this.source === 'capsule'); // a capsule's geometry is its own; a file's is shared with the clones of it and freed with the loader
    this.orb?.dispose();
    this.root.removeFromParent();
  }
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
