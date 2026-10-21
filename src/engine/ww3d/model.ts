/**
 * **A loaded model, made toon and fitted to a figure** (the hidden Wind Waker chapter; FFX-2 only): `yuna.glb`, `rikku.glb`, `paine.glb` and `valefor.glb`. The files are **local only**: gitignored, never committed (the repo
 * is public and the files are large) and never shipped (`tools/dist-filter.mjs`). A slot with no file stands on the neutral capsule (`./capsule.ts`), so the chapter always plays with something on every mark.
 *
 * ## What a file must be (the contract the real models are made to)
 *
 * A binary glTF (`.glb`), **Y up, facing +Z, the feet on y 0** in any scale (the fit scales the box's height to the figure's world height, so a 1.2 m model and a 180 cm one both stand the same). Skinned or not; if it
 * carries clips they are named for what they are (`idle_combat`, `idle`, `attack`, `hit`, `cast`, `victory`; `./clips.ts`): the stance loops under the procedural motion and the others play on the battle's events. The three
 * girls carry the same 24 bones (`Head`, `headfront`, `LeftHand`, `RightHand`, `LeftForeArm`, ... : the head turn, the weapons and the facing read them). Valefor is one static mesh. Draco and Meshopt are not decoded.
 *
 * ## Layers
 *
 * `root` (parent it to the actor's motion group) holds `lie` (a KO tips the body about the feet), which holds `yaw` (the way the figure is turned), which holds `hover` (Valefor floats and bobs; the girls stand), which
 * holds `fit` (the scale and the offset that stand the model on the floor), which holds the file's scene. Everything the stage does to the actor (lunge, recoil, hop, squash, shake) moves `root`'s parent, so the model rides it.
 *
 * Needs three.js (the glTF loader is imported on use); no DOM beyond `fetch`. Game case: FFX-2 only.
 */

import { Box3, Group, Vector3, type AnimationClip, type IUniform, type Object3D } from 'three';
import { capsuleFigure } from './capsule.ts';
import { ClipRig, roleClips, windowsOfClips } from './clips.ts';
import { FileCache, defaultIO, type LoaderIO } from './io.ts';
import {
  BODY_OFF_DEG,
  BOSS_ANCHOR,
  BOSS_BOB,
  BOSS_HEIGHT,
  BOSS_HOVER,
  BOSS_YAW_DEG,
  FACE_OFF_DEG,
  WW_BOSS_ID,
  WW_CAST,
  bodyYaw,
  fitBox,
  modelUrl,
  rad,
  type BoxData,
  type V3,
  type WwId,
} from './layout.ts';
import { HeadTurn, readAt, stanceFacing, yawOffsetsOf } from './pose.ts';
import { aimProps, attachProps, disposeProps, type Attached, type PropSwaps } from './props.ts';
import { disposeToon, driveToon, toonify, type Channels, type ToonSet } from './toonify.ts';
import { advanceFlap, createWingUniforms, makeWingDepthMaterial, patchWingVertex, type WingUniforms } from './wing.ts';
import type { ShaderLike } from './toon.ts';

export type { Channels };

/** Where a model came from: its own file or the neutral capsule that stands in for a missing one. */
export type ModelSource = 'own' | 'capsule';

/** Valefor's mouth and chest in her file's own units (measured off `valefor.glb`: the beak's tip at about (-0.1, 2.4, 1.0), the chest front below the neck): where her beams and her orb start. */
export const MOUTH_LOCAL: V3 = [-0.1, 2.5, 1.0];
export const CHEST_LOCAL: V3 = [0.1, 1.9, 0.4];

/** How far a body lying down is lifted off the floor so it rests on it instead of sinking through (a share of the figure's height). */
const LIE_LIFT = 0.12;

/** What a model needs from the stage that is not its file. */
export interface ModelContext {
  /** The toon uniforms (one set per look). */
  readonly uniforms: Record<string, IUniform>;
  /** The weapons found as files, if any. */
  readonly swaps?: PropSwaps | undefined;
  /** Where the lens is (the idle rig's position): the girls' bodies and faces are turned toward it. */
  readonly camera: V3;
}

export class WwModel {
  readonly id: WwId;
  readonly source: ModelSource;
  /** Parent this to the actor's motion group. */
  readonly root = new Group();
  private readonly lie = new Group();
  private readonly yawGroup = new Group();
  private readonly hoverGroup = new Group();
  private readonly fitGroup = new Group();
  private readonly scene: Object3D;
  private readonly set: ToonSet;
  private readonly natural: BoxData;
  private readonly groundY: number | null;
  /** The facing of the body in the stance at yaw 0, or null (a capsule, a model without the bones). */
  readonly stanceYaw: number | null;
  private readonly rig: ClipRig | null;
  private readonly props: Attached;
  private readonly head: HeadTurn | null;
  private readonly wing: { uniforms: WingUniforms } | null;
  private readonly camera: V3;
  private figureHeight: number;
  private baseYaw = 0;
  private lieAmount = 0;
  private lieFacing: 1 | -1 = 1;
  private activity = 0;
  private clock = 0;

  /** `scene` is the file's scene (or a clone of it), `clips` its animations. The model measures it first, then makes it toon. */
  constructor(id: WwId, scene: Object3D, clips: readonly AnimationClip[], height: number, source: ModelSource, ctx: ModelContext) {
    this.id = id;
    this.source = source;
    this.scene = scene;
    this.figureHeight = height;
    this.camera = ctx.camera;
    const boss = id === WW_BOSS_ID;
    const byRole = roleClips(clips);
    const idle = byRole.get('idle');

    // measure first: the bind pose's box (the scale), the stance's facing, and the lowest point of the standing pose (the feet; the combat stance is a crouch about 10 percent shorter than the bind pose)
    scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(scene);
    this.natural = { min: [box.min.x, box.min.y, box.min.z], max: [box.max.x, box.max.y, box.max.z] };
    this.stanceYaw = stanceFacing(scene, idle);
    this.groundY = idle ? readAt(scene, idle, 0, () => new Box3().setFromObject(scene, true).min.y) : null;

    // the wing flap (Valefor's file is one static mesh): a vertex patch on every program and on the shadow's depth material
    const wu = boss && source === 'own' && clips.length === 0 ? createWingUniforms() : null;
    this.wing = wu ? { uniforms: wu } : null;
    this.set = toonify(scene, ctx.uniforms, {
      ...(wu
        ? {
            cacheKey: '-wing',
            depthMaterial: makeWingDepthMaterial(wu),
            onVertex: (shader: ShaderLike): void => {
              const r = patchWingVertex(shader, wu, true);
              if (!r.ok) console.error(`[ww3d] wing patch failed: ${r.problems.join('; ')}`);
            },
          }
        : {}),
      receive: !boss,
    });
    this.props = boss || source === 'capsule' ? { props: [], swapped: 0 } : attachProps(scene, id, ctx.uniforms, ctx.swaps); // after the box is measured (a sword must not change the fit)

    this.root.name = `ww-${id}`;
    this.fitGroup.add(scene);
    this.hoverGroup.add(this.fitGroup);
    this.yawGroup.add(this.hoverGroup);
    this.lie.add(this.yawGroup);
    this.root.add(this.lie);
    this.place();

    if (idle && source === 'own') {
      const yawOffsets = yawOffsetsOf(scene, byRole, windowsOfClips(byRole));
      this.rig = new ClipRig(scene, byRole, id, yawOffsets);
    } else this.rig = null;
    this.head = !boss && source === 'own' ? new HeadTurn(scene) : null;
    this.baseYaw = boss ? rad(BOSS_YAW_DEG) : 0;
    this.applyYaw();
    this.applyHover();
  }

  /** The figure's height now, world units. */
  get height(): number {
    return this.figureHeight;
  }

  /** True when the file has an idle clip playing (and so the battle's clips: `noteOpen`, `noteImpact`, `notePose`). */
  get animated(): boolean {
    return this.rig !== null;
  }

  /** True when the file has a knock-out clip: its own fall to the floor, which the skin lets play (and holds) instead of tipping the body over. */
  get falls(): boolean {
    return this.rig?.sequencer.has('ko') ?? false;
  }

  /** The weapons parented to the hand bones. */
  get weapons(): readonly Object3D[] {
    return this.props.props;
  }

  /** How many of the weapons came from files in the props folder. */
  get swappedProps(): number {
    return this.props.swapped;
  }

  /** The toon materials of the model (a test's and the debug view's read). */
  get materials(): ToonSet['entries'] {
    return this.set.entries;
  }

  /** The clip role playing now, or null for a model with no rig. */
  get playing(): string | null {
    return this.rig?.current ?? null;
  }

  /** True while the head turn is available (a girl with the `Head` and `headfront` bones). */
  get turnsHead(): boolean {
    return this.head?.available ?? false;
  }

  /** The wing flap's uniforms (a test's read), or null for a model with no flap. */
  get flap(): WingUniforms | null {
    return this.wing?.uniforms ?? null;
  }

  /** Refit to a figure of another height (the stage re-sizes a figure): the scale and the offset follow. */
  fitTo(height: number): void {
    if (!(height > 0) || Math.abs(height - this.figureHeight) < 1e-4) return;
    this.figureHeight = height;
    this.place();
    this.setLie(this.lieAmount, this.lieFacing);
  }

  private place(): void {
    const boss = this.id === WW_BOSS_ID;
    const f = fitBox(this.natural, this.figureHeight, { ...(boss ? { anchor: BOSS_ANCHOR } : {}), ...(this.groundY !== null ? { groundY: this.groundY } : {}) });
    this.fitGroup.scale.setScalar(f.scale);
    this.fitGroup.position.set(f.offset[0], f.offset[1], f.offset[2]);
  }

  private applyYaw(): void {
    this.yawGroup.rotation.y = this.baseYaw + (this.rig?.yawOffset ?? 0);
  }

  /** Turn the figure to `radians` about +Y (0 faces +Z). The clips' own pelvis correction is added on top. */
  setYaw(radians: number): void {
    this.baseYaw = radians;
    this.applyYaw();
  }

  /** The root yaw that points a girl's body `BODY_OFF_DEG` off the direction to the lens from `slot`. A model with no measured stance counts its stance as square (yaw 0). */
  bodyYawAt(slot: V3, bodyOffDeg: number = BODY_OFF_DEG): number {
    return bodyYaw(slot, this.camera, this.stanceYaw ?? 0, bodyOffDeg);
  }

  /** Aim the weapons at `target` (a world point) at their stance elevations; call once the model is in its place, posed in the stance, at its final yaw. */
  aimWeapons(target: Vector3): void {
    aimProps(this.scene, this.props.props, target);
  }

  /** Tip the body onto its back, 0 standing to 1 lying: it falls away from the way it faces (`facing`, +1 toward +x), about its feet, and rests a little off the floor. */
  setLie(amount: number, facing: 1 | -1): void {
    this.lieAmount = amount;
    this.lieFacing = facing;
    this.lie.rotation.z = facing * amount * (Math.PI / 2);
    this.lie.position.y = amount * LIE_LIFT * this.figureHeight;
  }

  /** The figure's colour, glow and opacity (the toon set's channels). */
  setChannels(c: Channels): void {
    driveToon(this.set, c);
  }

  /** The figure's opacity now (what the last `setChannels` said). */
  get opacity(): number {
    return this.set.opacity;
  }

  /** How much the model is acting, 0..1 (an attack, a cast): Valefor's wings flap faster and wider. A no-op for a model with no flap. */
  setActivity(activity: number): void {
    this.activity = Math.min(1, Math.max(0, activity));
  }

  /** Where a point of the file (in its own units) is in world space now (Valefor's mouth and chest). */
  worldPointOf(local: V3, into: Vector3 = new Vector3()): Vector3 {
    this.scene.updateMatrixWorld(true);
    return this.scene.localToWorld(into.set(local[0], local[1], local[2]));
  }

  /** An action by this figure opened (`attack` or `cast` start their clips), the blow lands `lead` seconds on; `paceRate` is the pacing option's rate for one-shots. */
  noteOpen(kind: string, lead: number | undefined, paceRate = 1): void {
    this.rig?.open(kind, lead, paceRate);
  }

  /** The blow landed. */
  noteImpact(paceRate = 1): void {
    this.rig?.impact(paceRate);
  }

  /** The pose the actor shows and whether it is down, once a frame (a hit and a victory start their clips). */
  notePose(pose: string, down: boolean, paceRate = 1): void {
    this.rig?.pose(pose, down, paceRate);
  }

  /** Advance the clips by `dt` seconds; `frozen` (a body that is down, REDUCE MOTION) holds the pose. The head turn follows the clip, every frame; Valefor's wings flap and her body bobs. */
  update(dt: number, frozen = false): void {
    this.clock += frozen ? 0 : dt;
    this.rig?.update(dt, frozen);
    this.applyYaw();
    this.head?.apply(this.camera, FACE_OFF_DEG);
    if (this.wing) advanceFlap(this.wing.uniforms, frozen ? 0 : dt, this.activity);
    this.applyHover();
  }

  /** Valefor floats a metre off the floor and bobs on it, and falls to the ground when she is down; the girls stand. */
  private applyHover(): void {
    if (this.id !== WW_BOSS_ID) return;
    const k = this.figureHeight / BOSS_HEIGHT;
    this.hoverGroup.position.y = (BOSS_HOVER + BOSS_BOB.amplitude * Math.sin(this.clock * Math.PI * 2 * BOSS_BOB.hz)) * k * (1 - Math.min(1, this.lieAmount * 2));
  }

  dispose(): void {
    this.rig?.dispose();
    disposeProps(this.props);
    disposeToon(this.set, this.source === 'capsule'); // a capsule's geometry is its own; a file's is shared with the clones of it and freed with its cache
    this.root.removeFromParent();
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

export interface LoadOptions {
  /** The page's base (`import.meta.env.BASE_URL`). */
  base: string;
  /** The folder under it that the models are looked for in (`WW_MODEL_DIR`). */
  dir: string;
  /** The figure's world height per id, from the actors the stage staged (the skin refits when the stage disagrees later). */
  heights: Readonly<Record<WwId, number>>;
  /** What each model needs from the stage. */
  context: ModelContext;
  /** The loader (shared with the swaps, so a file is parsed once); default a fresh cache over the real IO. */
  files?: FileCache;
  io?: LoaderIO;
  /** Said once per problem, for the log. */
  warn?: (message: string) => void;
  /** Said once per figure that stands on the capsule, for the log (which file, and why). */
  log?: (message: string) => void;
}

/** The models that loaded, by id, and what to free. */
export interface WwModels {
  readonly models: ReadonlyMap<WwId, WwModel>;
  /** Ids whose own file was missing and that stand on the neutral capsule. */
  readonly capsules: readonly WwId[];
  dispose(): void;
}

/** Load the four models: each from its own file (`dir`), else the neutral capsule (a file that does not parse counts as missing). Every id has an entry; `capsules` says which are not their own, and each is said once to `log`. */
export async function loadWwModels(opts: LoadOptions): Promise<WwModels> {
  const ownsFiles = opts.files === undefined;
  const files = opts.files ?? new FileCache(opts.io ?? defaultIO(), opts.warn);
  const models = new Map<WwId, WwModel>();
  const capsules: WwId[] = [];
  await Promise.all(
    WW_CAST.map(async (id) => {
      const own = await files.get(modelUrl(opts.base, opts.dir, id));
      if (own) {
        models.set(id, new WwModel(id, await files.io.clone(own.scene), own.animations, opts.heights[id], 'own', opts.context));
        return;
      }
      models.set(id, new WwModel(id, capsuleFigure(id), [], opts.heights[id], 'capsule', opts.context));
      capsules.push(id);
      opts.log?.(`[ww3d] ${id}: no model at ${opts.dir}/, standing on the neutral capsule`);
    }),
  );
  return {
    models,
    capsules,
    dispose(): void {
      for (const m of models.values()) m.dispose();
      models.clear();
      if (ownsFiles) files.dispose(); // a cache the caller handed in is the caller's to free
    },
  };
}
