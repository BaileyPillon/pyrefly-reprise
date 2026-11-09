/**
 * **A Meshy model fitted to a figure** (the hidden Wendigo chapter's 3D stage; FFX only): one of the ten bodies of `../../data/ffx/lake-models.ts`, with its weapons on their nodes (`./weapons.ts`), its motion (the party's
 * real FFX kit on the sequencer of `../yrp3d/clips.ts`, or a monster's library clips on `./monsterRig.ts`) and the channels the skin drives from the actor (colour, flash, opacity, the epilogue's sink).
 *
 * Layers: `root` (parent it to the actor's motion group) holds `lie` (a body with no fall clip tips about its feet), which holds `yaw`, which holds `sink` (the epilogue's fall through the broken ice), which holds `fit`
 * (the scale that stands the model the stage's height), which holds the file's scene. A file is metres, Y up, facing +Z, the feet on y 0 and centred on its footprint (`tools` of the asset lane keep that), so the fit is a
 * uniform scale. Everything the presenter does to the actor (lunge, recoil, hop, squash, shake) moves `root`'s parent, so the model rides it.
 *
 * **The look.** The files carry Meshy's physically based material (a base colour, a normal and a metal-rough map); it stays, lit by the stage's cold key, fill and rim and the sky's environment, with the four channels the
 * skin drives (tint, flash, glow, stone) laid over it by an emissive rim accent (`ACCENT`), never a flat tint. Both sides are drawn (the files ask for it: Meshy's hair and cloth are open shells).
 *
 * Needs three.js (the glTF loader is imported on use by `./load.ts`); no DOM. Game case: FFX only.
 */

import { Box3, Color, Group, Mesh, MeshStandardMaterial, type AnimationClip, type Object3D } from 'three';
import { disposeSkeletonsUnder } from '../skeletons.ts';
import { ClipRig } from '../yrp3d/clips.ts';
import { ACCENT, patchRim } from '../yrp3d/rim.ts';
import type { PlanTable } from '../yrp3d/clipMap.ts';
import { LAKE_FIT_RANGE, LAKE_NATIVE_HEIGHT, type LakeId } from '../../data/ffx/lake-models.ts';
import { MonsterRig } from './monsterRig.ts';

export { ACCENT }; // the caps of the flash and the glow (the Bahamut chapter's: a rim accent, never a flat tint of the body)

/** The box of a scene's skinned bodies (the figure itself, weapons left out: a lance must not change how tall a figure stands); the whole scene's box when it has none (a capsule). */
export function bodyBox(scene: Object3D): Box3 {
  const box = new Box3();
  let any = false;
  scene.traverse((o) => {
    if (!(o as { isSkinnedMesh?: boolean }).isSkinnedMesh) return;
    box.expandByObject(o, true);
    any = true;
  });
  return any ? box : new Box3().setFromObject(scene);
}

/** The channels the skin drives each frame. */
export interface Channels {
  readonly colour: Color;
  readonly emissive: Color;
  readonly amount: number;
  readonly opacity: number;
}

/** How far a body lying down is lifted off the floor (a share of its height). */
const LIE_LIFT = 0.1;

interface MaterialState {
  readonly material: MeshStandardMaterial;
  readonly colour: Color;
  readonly emissive: Color;
  readonly emissiveIntensity: number;
  readonly opacity: number;
  readonly transparent: boolean;
}

/** The standard materials under `scene`, each with what the file gave it (so the channels can be laid over it and taken off again). */
function collect(scene: Object3D): { meshes: Mesh[]; states: MaterialState[] } {
  const meshes: Mesh[] = [];
  const states: MaterialState[] = [];
  const seen = new Set<MeshStandardMaterial>();
  scene.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    meshes.push(mesh);
    mesh.frustumCulled = false; // a skinned body's box is its bind pose's: a lunge or a fall leaves it
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of list) {
      const std = m as MeshStandardMaterial;
      if (!std.isMeshStandardMaterial || seen.has(std)) continue;
      seen.add(std);
      patchRim(std); // the flash and the glow are a rim accent: a flat emissive turned a dark body into one gold silhouette (the first GPU run)
      states.push({ material: std, colour: std.color.clone(), emissive: std.emissive.clone(), emissiveIntensity: std.emissiveIntensity, opacity: std.opacity, transparent: std.transparent });
    }
  });
  return { meshes, states };
}

export class LakeModel {
  readonly id: LakeId;
  /** Parent this to the actor's motion group. */
  readonly root = new Group();
  private readonly lie = new Group();
  private readonly yaw = new Group();
  private readonly sink = new Group();
  private readonly fit = new Group();
  private readonly meshes: Mesh[];
  private readonly states: MaterialState[];
  private readonly party: ClipRig | null;
  private readonly monster: MonsterRig | null;
  private readonly native: number;
  private figureHeight: number;
  private opacityNow = 1;
  private lieAmount = 0;
  private lieFacing: 1 | -1 = 1;
  private readonly onDispose: (() => void) | null;
  private disposed = false;

  /** `scene` is a clone of the file's scene with the weapons already on it, `clips` its animations; `plans` the party's plan table (a monster passes none). */
  constructor(id: LakeId, scene: Object3D, clips: readonly AnimationClip[], height: number, plans: PlanTable | null, onDispose: (() => void) | null = null) {
    this.id = id;
    this.onDispose = onDispose;
    scene.updateMatrixWorld(true);
    const box = bodyBox(scene);
    const measured = box.max.y - box.min.y;
    this.native = Number.isFinite(measured) && measured > 0.2 ? measured : LAKE_NATIVE_HEIGHT[id];
    this.figureHeight = this.pickHeight(height);
    const { meshes, states } = collect(scene);
    this.meshes = meshes;
    this.states = states;
    this.root.name = `lake-${id}`;
    this.fit.add(scene);
    this.sink.add(this.fit);
    this.yaw.add(this.sink);
    this.lie.add(this.yaw);
    this.root.add(this.lie);
    this.place();
    this.party = plans && plans.idle?.hold && clips.some((c) => c.name === plans.idle!.hold) ? new ClipRig(scene, clips, plans, id) : null;
    this.monster = !this.party && clips.some((c) => c.name === 'idle') ? new MonsterRig(scene, clips, id) : null;
  }

  /** The height this model stands at for a stage height: the stage's own when it is near the native one (so the HUD's anchors land on the figure), else the native size. */
  private pickHeight(stage: number): number {
    const native = LAKE_NATIVE_HEIGHT[this.id];
    return stage > 0 && Math.abs(stage - native) / native <= LAKE_FIT_RANGE ? stage : native;
  }

  /** The figure's height now, world units. */
  get height(): number {
    return this.figureHeight;
  }

  /** The model's own measured height in metres. */
  get nativeHeight(): number {
    return this.native;
  }

  /** The monster rig, when this is a monster (the skin drives the stance through it). */
  get monsterRig(): MonsterRig | null {
    return this.monster;
  }

  /** True when the file has an idle clip playing (and so the battle's clips). */
  get animated(): boolean {
    return this.party !== null || this.monster !== null;
  }

  /** True when the model plays its own fall (the skin then does not tip the body over as well). */
  get playsKo(): boolean {
    return this.party?.playsKo ?? this.monster?.playsKo ?? false;
  }

  /** The pose playing now, or the monster's clip name; null for a model with no rig. */
  get playing(): string | null {
    return this.party?.current ?? this.monster?.clip ?? null;
  }

  /** The clip playing now, by name. */
  get playingClip(): string | null {
    return this.party?.clip ?? this.monster?.clip ?? null;
  }

  /** Refit to a stage height. */
  fitTo(height: number): void {
    const h = this.pickHeight(height);
    if (Math.abs(h - this.figureHeight) < 1e-4) return;
    this.figureHeight = h;
    this.place();
    this.setLie(this.lieAmount, this.lieFacing);
  }

  private place(): void {
    this.fit.scale.setScalar(this.figureHeight / this.native);
  }

  /** Turn the figure to `radians` about +Y (0 faces +Z). */
  setYaw(radians: number): void {
    this.yaw.rotation.y = radians;
  }

  /** Tip the body onto its back, 0 standing to 1 lying (only for a body with no fall clip). */
  setLie(amount: number, facing: 1 | -1): void {
    this.lieAmount = amount;
    this.lieFacing = facing;
    this.lie.rotation.z = facing * amount * (Math.PI / 2);
    this.lie.position.y = amount * LIE_LIFT * this.figureHeight;
  }

  /** The epilogue's fall: metres down and a tilt (radians) about the footprint, 0 for none. */
  setSink(down: number, tilt: number): void {
    this.sink.position.y = -down;
    this.sink.rotation.x = tilt;
  }

  /** The channels over the file's own material: tint multiplies the base colour, the emissive accent adds the flash or glow, the opacity fades the body (a faded body is drawn transparent, written to the depth buffer last). */
  setChannels(c: Channels): void {
    this.opacityNow = c.opacity;
    const fading = c.opacity < 0.999;
    for (const s of this.states) {
      s.material.color.copy(s.colour).multiply(c.colour);
      s.material.emissive.copy(c.emissive);
      s.material.emissiveIntensity = c.amount;
      s.material.opacity = s.opacity * c.opacity;
      const wantTransparent = s.transparent || fading;
      if (s.material.transparent !== wantTransparent) {
        s.material.transparent = wantTransparent;
        s.material.needsUpdate = true;
      }
    }
  }

  /** How opaque the figure is now, 0..1. */
  get opacity(): number {
    return this.opacityNow;
  }

  /** The meshes, for a test and the debug view. */
  get meshCount(): number {
    return this.meshes.length;
  }

  /** Set the shadow flags on every mesh. */
  castShadows(on: boolean): void {
    for (const m of this.meshes) m.castShadow = on;
  }

  /** Which weapons the figure holds, by the names of the nodes the weapons hang from (a test's read). */
  get weaponCount(): number {
    let n = 0;
    this.root.traverse((o) => {
      if (o.name.startsWith('lake-weapon-')) n++;
    });
    return n;
  }

  /** An action opened (`attack`, `cast`, `item`); the blow lands `lead` seconds on. `abilityId` picks a monster's clip. */
  noteOpen(kind: string, lead: number | undefined, paceRate: number, abilityId?: string): void {
    if (this.party) this.party.open(kind, lead, paceRate);
    else this.monster?.open(abilityId, kind, lead);
  }

  /** The seconds a blow would have to wait, beyond `lead`, for the action to play from its first part. */
  windup(kind: string, lead: number | undefined, abilityId?: string): number {
    if (this.party) return this.party.windup(kind, lead);
    return this.monster ? this.monster.windup(abilityId, kind, lead) : 0;
  }

  /** The blow landed. */
  noteImpact(): void {
    this.party?.impact();
  }

  /** The action is over. */
  noteClose(): void {
    this.party?.close();
  }

  /** The Wendigo's arms go up or down. */
  setStance(up: boolean): void {
    this.monster?.setStance(up);
  }

  /** The pose the actor shows, whether it is down and whether its HP is low, once a frame. */
  notePose(pose: string, down: boolean, low: boolean, paceRate = 1): void {
    if (this.party) this.party.pose(pose, down, low, paceRate);
    else this.monster?.notePose(pose, down);
  }

  /** Advance the clips by `dt` seconds; `frozen` (REDUCE MOTION) holds the pose but lets a fall or a celebration run to its end. */
  update(dt: number, frozen = false): void {
    if (this.party) this.party.update(dt, frozen);
    else this.monster?.update(dt, frozen);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.party?.dispose();
    this.monster?.dispose();
    disposeSkeletonsUnder(this.root); // every clone of a file has a skeleton of its own, and the first draw gave it a bone texture that nothing else frees (the Bahamut chapter's YR-11)
    this.root.removeFromParent();
    this.onDispose?.();
  }
}
