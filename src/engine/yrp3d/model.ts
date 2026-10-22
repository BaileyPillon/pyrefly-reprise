/**
 * **A real model, softly shaded and fitted to a figure** (the hidden 3D Bahamut chapter, the real-models branch `exp-yrp-real`; FFX-2 only): `yuna.glb`, `rikku.glb`, `paine.glb` and `bahamut.glb`, Bailey's own Steam
 * FFX-2 HD models converted locally (`./load.ts` finds the files in `public/models-exp/yrp-hd/` and `yrp/`). The files are **local only**: gitignored, never committed (the repo is public and the files are large) and never
 * shipped (`tools/dist-filter.mjs`). A slot whose file is missing stands on the neutral capsule (`./capsule.ts`), so the chapter always plays in frame A with something on every mark.
 *
 * ## What a file is (the contract the extracted models keep)
 *
 * A binary glTF (`.glb`), **Y up, facing +Z, the feet on y 0** (their centre does not matter: the fit centres the footprint), in the game's own units (a girl is about 16.5 tall; the fit scales the box's height to the
 * figure's world height, so a model of 2.3 units and one of 180 both stand 1.9 tall), skinned on `SkeletonNode_<n>` bones. The scene's extras carry the **`.chr` scale** the game draws the model at (`ffx2.runtimeScale`:
 * 1 for the girls and 4 for Bahamut, "applied to the loaded scene root"): it is applied here, so a model's measured box is its size in the game and the ratio between two figures' boxes is the game's (`trueHeight`).
 * Its clips come from `<id>-anims.glb`, named as the developers' `btlmot.ath` names them, and are played in the order of the clip map (`./clipMap.ts`, `./clips.ts`). Draco and Meshopt are not decoded.
 *
 * The AI-made Bahamut (`bahamut-ai.glb`, Meshy, one rigid mesh) is a different file with no clips: it keeps the wing flap and breath of this chapter's first branch (`./flap.ts`) and is shaded in its own physically based look.
 *
 * ## Layers
 *
 * `root` (parent it to the actor's motion group) holds `lie` (a body with no fall clip tips about the feet), which holds `yaw` (the way the figure is turned), which holds `rear` (Bahamut's Mega Flare), which holds
 * `fit` (the scale and the offset that stand the model on the floor), which holds the file's scene. Everything the stage does to the actor (lunge, recoil, hop, squash, shake) moves `root`'s parent, so the model rides it.
 *
 * Needs three.js (and the glTF loader, imported on use by `./load.ts`); no DOM. The look is `./shade.ts`'s.
 */

import { Box3, Color, Group, type AnimationClip, type Mesh, type Object3D } from 'three';
import { ClipRig } from './clips.ts';
import { plansFor, type PlanTable } from './clipMap.ts';
import { attachProps, type Attached } from './props.ts';
import { attachWeapons, type WeaponsAttached } from './weapons.ts';
import { disposeShade, drive, shadeify, type ShadeSet } from './shade.ts';
import { flapSpecOf, makeFlap, setFlap, type FlapUniforms } from './flap.ts';
import { fitBox, YRP_BOSS_ID, type BoxData, type Look, type YrpId } from './layout.ts';
import { Orb } from './orb.ts';

/** Where a model came from: its own file, or the neutral capsule that stands in for a missing one. */
export type ModelSource = 'own' | 'capsule';

/** The channels a figure's flash, cast glow and tint drive on its model (`./skin.ts`). */
export interface Channels {
  colour: Color;
  emissive: Color;
  amount: number;
  opacity: number;
}

/** How far a rigid winged model's wingtips swing at rest, and the most they add when it acts, as shares of the half-span; and the flap's speed at rest and the most it adds, radians a second (the AI Bahamut's procedural motion). */
export const FLAP = { rest: 0.03, active: 0.11, rate: 1.6, rateActive: 3.4 } as const;

/** How far a model rears back at full strength (radians about its feet, top toward the back) and how much it swells: Bahamut's Mega Flare. */
export const REAR = { tilt: 0.3, swell: 0.04 } as const;

/** How far a body lying down is lifted off the floor so it rests on it instead of sinking through (a share of the figure's height). */
const LIE_LIFT = 0.12;

/** What the loader knows of a file that the model needs. */
export interface ModelOptions {
  /** The pose plans (`./clipMap.ts`), when the clip map file was read; else they are built from the clip names. */
  plans?: PlanTable;
  /** The `.chr` scale from the file's extras (`chrScaleOf`, `./load.ts`); 1 when there is none. */
  chrScale?: number;
  /** The look it is shaded in (`./shade.ts`): the real humans' diffuse look (the default), or the AI boss's own physically based material. */
  look?: Look;
  /** The girl's real weapon scenes, one per hand of her kit (`./weapons.ts`), when the weapon file was read; with none, or when her skeleton lacks a locator, she holds the procedural props. */
  weapons?: readonly Object3D[];
}

/** Remove the meshes that are not part of the figure: in a scene with a skinned mesh, a mesh with no skin and no bone above it (Bahamut's file carries an unskinned ring that no animation moves; the extraction notes say leave it hidden). */
export function removeStrays(scene: Object3D): number {
  let skinned = false;
  scene.traverse((o) => {
    if ((o as { isSkinnedMesh?: boolean }).isSkinnedMesh) skinned = true;
  });
  if (!skinned) return 0;
  const strays: Object3D[] = [];
  scene.traverse((o) => {
    if (!(o as Mesh).isMesh || (o as { isSkinnedMesh?: boolean }).isSkinnedMesh) return;
    for (let p = o.parent; p; p = p.parent) if ((p as { isBone?: boolean }).isBone) return;
    strays.push(o);
  });
  for (const o of strays) o.removeFromParent();
  return strays.length;
}

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
  private readonly set: ShadeSet;
  private readonly natural: BoxData;
  /** The model's clips driven by the battle (`./clips.ts`), or null for a model with no idle clip (a capsule has none): it stays procedural. */
  private readonly rig: ClipRig | null;
  /** The procedural weapons parented to the hands (`./props.ts`), or none (the real ones replaced them, or the figure holds nothing). */
  private readonly props: Attached;
  /** The real FFX-2 weapons parented under the game's weapon locators (`./weapons.ts`), or null. */
  private readonly realWeapons: WeaponsAttached | null;
  /** Bahamut's gathering orb (his Mega Flare's windup); the girls have none. */
  private readonly orb: Orb | null;
  /** The wing flap of a rigid model with wings and no clips (the AI Bahamut's): the cells every material reads, and the half-span in the file's units. Null for a model with clips (the game's own motion) and for the girls. */
  private readonly flap: { cells: FlapUniforms; halfSpan: number } | null;
  private flapClock = 0;
  private activity = 0;
  /** Seconds left of the pulse a model with no clips takes from an attack or cast opening: its wings beat harder for it. */
  private pulse = 0;
  private figureHeight: number;
  private opacityNow = 1;
  private lieAmount = 0;
  /** The `.chr` scale applied to the file's scene. */
  readonly chrScale: number;

  /** `scene` is the file's scene (or a clone of it), `clips` its animations. The model applies the `.chr` scale, measures it, hands the girls their weapons and then softens every material. */
  constructor(id: YrpId, scene: Object3D, clips: readonly AnimationClip[], height: number, source: ModelSource = 'own', opts: ModelOptions = {}) {
    this.id = id;
    this.source = source;
    this.figureHeight = height;
    this.chrScale = opts.chrScale && opts.chrScale > 0 ? opts.chrScale : 1;
    removeStrays(scene);
    scene.scale.multiplyScalar(this.chrScale); // the game draws the model at its .chr scale: the measured box is the size in the game
    scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(scene);
    this.natural = { min: [box.min.x, box.min.y, box.min.z], max: [box.max.x, box.max.y, box.max.z] };
    // the weapons go on after the box is measured (a sword must not change the fit) and before the soft pass (so they are covered too): the game's own where their files and locators are there, else the procedural props
    this.realWeapons = opts.weapons ? attachWeapons(id, scene, opts.weapons) : null;
    this.props = this.realWeapons ? { props: [], dispose: () => undefined } : attachProps(id, scene, (this.natural.max[1] - this.natural.min[1]) / this.chrScale);
    const names = clips.map((c) => c.name);
    const plans = opts.plans ?? plansFor(id, null, names);
    const rigged = !!plans.idle?.hold && names.includes(plans.idle.hold);
    const spec = id === YRP_BOSS_ID && !rigged ? flapSpecOf(scene) : null; // a rigid winged model (the AI Bahamut): the wings flap in the vertex shader
    this.flap = spec ? { cells: makeFlap(spec), halfSpan: spec.halfSpan } : null;
    this.set = shadeify(scene, { look: opts.look ?? 'diffuse', flap: this.flap?.cells ?? null });
    this.root.name = `yrp-${id}`;
    this.fit.add(scene);
    this.rear.add(this.fit);
    this.yaw.add(this.rear);
    this.lie.add(this.yaw);
    this.root.add(this.lie);
    this.orb = id === YRP_BOSS_ID ? new Orb() : null;
    if (this.orb) this.rear.add(this.orb.sprite); // the orb rears with the chest it hangs at
    this.place();
    this.rig = rigged ? new ClipRig(scene, clips, plans, id) : null;
  }

  /** The figure's height now, world units. */
  get height(): number {
    return this.figureHeight;
  }

  /** The model's height in the game's units (the `.chr` scale applied), from its box: the ratio of two figures' is the game's. */
  get trueHeight(): number {
    return this.natural.max[1] - this.natural.min[1];
  }

  /** The model's footprint over its height, from its box (the camera and the lunge's reach read it). */
  get widthOverHeight(): number {
    return fitBox(this.natural, this.figureHeight).widthOverHeight;
  }

  /** Which weapons the figure holds: the game's own (`real`), the procedural props (`props`), or none (Bahamut, a capsule). */
  get weaponKind(): 'real' | 'props' | 'none' {
    return this.realWeapons ? 'real' : this.props.props.length ? 'props' : 'none';
  }

  /** True when the file has an idle clip playing (and so the battle's clips: `noteOpen`, `noteImpact`, `noteClose`, `notePose`). */
  get animated(): boolean {
    return this.rig !== null;
  }

  /** True when the model plays its own fall (the real KO clip): the skin then does not tip the body over as well. */
  get playsKo(): boolean {
    return this.rig?.playsKo ?? false;
  }

  /** Refit to a figure of another height (the stage re-sizes a boss). */
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

  /** The flap's amplitude now in the file's units, or 0 for a model with no flap (a test's read). */
  get flapAmplitude(): number {
    return this.flap ? (FLAP.rest + FLAP.active * this.acting) * this.flap.halfSpan : 0;
  }

  /** True when the model moves by the wing flap (a rigid winged model with no clips). */
  get flaps(): boolean {
    return this.flap !== null;
  }

  /** Rear back about the feet, 0 standing to 1 at full (`REAR`): Bahamut's Mega Flare. */
  setRear(amount: number): void {
    const a = Math.min(1, Math.max(0, amount));
    this.rear.rotation.x = -REAR.tilt * a;
    this.rear.scale.setScalar(1 + REAR.swell * a);
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

  /** Tip the body onto its back, 0 standing to 1 lying: it falls away from the way it faces (`facing`, +1 toward +x), about its feet, and rests a little off the floor. Only a body with no fall clip of its own is tipped. */
  setLie(amount: number, facing: 1 | -1): void {
    this.lieAmount = amount;
    this.lieFacing = facing;
    this.lie.rotation.z = facing * amount * (Math.PI / 2);
    this.lie.position.y = amount * LIE_LIFT * this.figureHeight;
  }

  /** The figure's colour, glow and opacity (the shade set's channels). */
  setChannels(c: Channels): void {
    this.opacityNow = c.opacity;
    drive(this.set, c);
  }

  /** How opaque the figure is now, 0..1 (a figure that fades takes its contact shadow with it). */
  get opacity(): number {
    return this.opacityNow;
  }

  /** The visible meshes, for a test and the debug view. */
  get meshCount(): number {
    return this.set.meshes.length;
  }

  /** The materials, for a test and the debug view. */
  get materials(): ShadeSet['materials'] {
    return this.set.materials;
  }

  /** The pose playing now (`idle`, `attack` ...), or null for a model with no rig. */
  get playing(): string | null {
    return this.rig?.current ?? null;
  }

  /** The clip playing now, by the game's name, or null for a model with no rig. */
  get playingClip(): string | null {
    return this.rig?.clip ?? null;
  }

  /** An action by this figure opened (`attack`, `cast` and `item` start their poses), the blow lands `lead` seconds on; `paceRate` is the pacing option's rate for one-shots. A model with no rig has no clips to start. */
  noteOpen(kind: string, lead: number | undefined, paceRate = 1): void {
    if (this.rig) this.rig.open(kind, lead, paceRate);
    else if (kind === 'attack' || kind === 'cast') this.pulse = 1.4; // no clips: the wings beat harder for a moment
  }

  /** The blow landed. */
  noteImpact(): void {
    this.rig?.impact();
  }

  /** The action is over. */
  noteClose(): void {
    this.rig?.close();
  }

  /** The pose the actor shows, whether it is down and whether its HP is low, once a frame (a hit, a victory, a fall and the kneel start their poses). */
  notePose(pose: string, down: boolean, low: boolean, paceRate = 1): void {
    this.rig?.pose(pose, down, low, paceRate);
  }

  /** Advance the clips by `dt` seconds; `frozen` (REDUCE MOTION) holds the pose but lets a fall or a celebration run to its end. */
  update(dt: number, frozen = false): void {
    this.rig?.update(dt, frozen);
    if (this.pulse > 0) this.pulse = Math.max(0, this.pulse - dt);
    if (this.flap) {
      if (!frozen) this.flapClock += dt * (FLAP.rate + FLAP.rateActive * this.acting);
      setFlap(this.flap.cells, this.flapClock, this.flapAmplitude);
    }
  }

  dispose(): void {
    this.rig?.dispose();
    this.props.dispose();
    this.realWeapons?.dispose();
    disposeShade(this.set, this.source === 'capsule'); // a capsule's geometry is its own; a file's is shared with the clones of it and freed with the loader
    this.orb?.dispose();
    this.root.removeFromParent();
  }
}
