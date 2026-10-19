/**
 * A figure drawn as ONE painting cut into parts on a bone rig, instead of one painting per pose.
 *
 * `RigActor extends PaintedActor`, so everything the stage and the presenter ask of a figure is already answered by the code that answers it for a painted plane (pose names and the life
 * layer, lunge, recoil, hop, shake and squash, flash, tint, dim and dissolve, facing, placement, the shadow and rings, every projection point). The actor loads only its idle painting (the rig's
 * costume) and draws no plane ("the carrier", `RigCarrier.ts`); the rig's parts hang under the same motion group and share the same uniform cells.
 *
 * What this class adds is the pose itself: `setPose` runs the actor's own (state, flinch tokens, ring), resolves the name to a key of the rig and moves the bones there (`RigKeys.ts`: the game's
 * ease, a start that keeps the speed the figure had), the idle and the lag chains play on top (`RigDynamics.ts`), and every frame the parts are re-skinned (a part a v2 key hides is not:
 * `RigPartState.ts`). `pose` reads the key shown, `blending` is "a move between keys is in flight", `poseNames` are the rig's keys. With the animation prototype on (`anim/`, dev only) the
 * layer plays a pose as a clip and carries the secondary motion; without it nothing below changes.
 *
 * Feet: a planted key keeps its lowest foot on the bind row (`RigValidate.ts`); the idle and the chains never move a foot. Clocks: transitions run on the field clock scaled by the pacing option
 * (`pace.ts`), so a hit-stop freezes the rig with the rest of the picture; the idle and the chains run on the field clock.
 */
import { PaintedActor, type PaintedActorOptions, type PoseShape } from '../PaintedActor.ts';
import { pixelsPer1xTexel } from '../ArtMeasure.ts';
import { artBudget } from '../ArtDevice.ts';
import type { Profile } from '../motion/Silhouette.ts';
import type { KeyShape } from './RigSilhouette.ts';
import { lifeStateForPose, nextLifeState } from '../BattlePresenterActors.ts';
import { paceRate } from '../pace.ts';
import { carrierOf, idleSlot, type CarrierInternals } from './RigCarrier.ts';
import type { RigData } from './RigData.ts';
import { applyIdle, RigChains } from './RigDynamics.ts';
import { RigFigure } from './RigFigure.ts';
import { compileKeys, resolveKeyName, RigTransition } from './RigKeys.ts';
import { compileStates, partStateAt } from './RigPartState.ts';
import { CH } from './RigSkeleton.ts';
import { ShapeTrack } from './RigShape.ts';
import { pageAnimStyle, RigAnimLayer } from './anim/RigAnimLayer.ts';
import { RIG_SHARE, rigLedger, rigTextureMB, tierPartsOf, wantsMaster, type RigTextures } from './RigTier.ts';
import { Vector3, type Texture } from 'three';
import type { RigAsset } from './RigAsset.ts';

export type { RigAsset };

const IDLE_TAU = 0.25; // seconds: the idle plays in over this when a figure stands up from a KO or a guard (the approach's time constant)
const SPEED_TAU = 0.06; // seconds: the forward speed the chains read is smoothed over this
const RAISE_EVERY = 15; // frames: a figure on its 1x maps measures the magnification of the idle's texel this often

export class RigActor extends PaintedActor {
  /** The keys of the rig, by name (`KoFallback.lacksKoPainting` asks for `ko`). */
  readonly rigKeys: ReadonlySet<string>;
  private readonly data: RigData;
  private readonly dressphere: boolean;
  private rig!: RigFigure;
  private carrier!: CarrierInternals;
  private ready = false;
  private readonly compiled: Map<string, Float64Array>;
  private readonly trans: RigTransition;
  private readonly work: Float64Array;
  private chains: RigChains | null = null;
  private anim: RigAnimLayer | null = null; // the animation prototype (`anim/`): null unless asked for and the rig has the keys it needs
  private key = 'idle';
  private layersDue = false; // the draw-order overrides of the key being moved to are not on the parts yet (they go on halfway through the move)
  /** Format v2: each key's part state, the state the parts are in now, and the two the move in flight is between (`partStateAt` picks one at progress 0.5). */
  private readonly states: Map<string, Int16Array>;
  private appliedState: Int16Array;
  private stateFrom: Int16Array;
  private stateTo: Int16Array;
  private readonly crossMs: number;
  private readonly rigBloomMasked: boolean;
  private rigClock: number;
  private idleAmount = 1;
  private forwardSpeed = 0;
  private lastX = 0;
  private haveX = false;
  private readonly scratch = new Vector3();
  private readonly track: ShapeTrack; // each key's posed silhouette as the gate stamped it, and where the figure's painted shape is now (`RigShape.ts`)
  // ---- texture tier (RigTier.ts)
  private readonly base: string;
  private readonly loadTexture: ((url: string) => Promise<Texture>) | undefined;
  private textures: RigTextures;
  private readonly tiers: readonly number[] | undefined;
  private releaseTextures: (() => void) | null;
  private textureMB = 0;
  private raising = false;
  private raiseBlocked = false;
  private raiseTick = 0;

  private constructor(opts: PaintedActorOptions, asset: RigAsset) {
    super({
      ...opts,
      figure: false,
      ...(asset.data.motion?.idle ? { breathe: false as const, sway: false as const } : {}), // the bones breathe; the whole card would double it
    });
    this.data = asset.data;
    this.dressphere = asset.dressphere === true;
    this.compiled = compileKeys(this.data);
    this.states = compileStates(this.data);
    this.appliedState = this.stateFrom = this.stateTo = this.states.get('idle')!;
    this.rigKeys = new Set(this.compiled.keys());
    this.trans = new RigTransition(this.data.bones.length * CH, this.compiled.get('idle')!);
    this.work = new Float64Array(this.data.bones.length * CH);
    this.crossMs = opts.crossfadeMs ?? 120;
    this.rigBloomMasked = opts.bloomMask !== false;
    this.rigClock = hashUnit(this.name) * 8;
    this.track = new ShapeTrack(asset.data.gate, asset.data.image, () => idleSlot(this.carrier).mesh);
    this.base = asset.base;
    this.loadTexture = asset.loadTexture;
    this.textures = asset.textures ?? { map: 2, rim: 2 };
    this.tiers = asset.tiers;
    this.releaseTextures = asset.release ?? null;
    this.textureMB = rigTextureMB(tierPartsOf(this.data), this.textures);
  }

  /**
   * Build the actor for a gated rig. `opts` are the options the stage gives `PaintedActor.create`; only `poses.idle` is loaded. Rejects when the idle painting does
   * not load, has another shape than the rig's image, or a texture of the rig is missing: the caller then builds the painting set.
   */
  static async createRigged(opts: PaintedActorOptions, asset: RigAsset): Promise<RigActor> {
    const actor = new RigActor(opts, asset);
    try {
      const idle = opts.poses?.['idle'];
      if (asset.idlePainting) actor.adoptPoses({ idle: asset.idlePainting }, 'idle');
      else if (!idle) throw new Error('no idle painting to carry the rig');
      else await actor.loadPoses({ idle }, 'idle');
      if (actor.isPlaceholder) throw new Error('the idle painting did not load');
      const carrier = carrierOf(actor);
      const meta = idleSlot(carrier).meta;
      const aspect = meta.width / meta.height;
      const want = asset.data.image.w / asset.data.image.h;
      if (!Number.isFinite(aspect) || Math.abs(aspect / want - 1) > 0.01) {
        throw new Error(`the idle painting is ${meta.width}x${meta.height}, the rig was cut from ${asset.data.image.w}x${asset.data.image.h}`);
      }
      actor.carrier = carrier;
      actor.rig = await RigFigure.load(asset.data, asset.base, carrier, asset.loadTexture, actor.textures);
      actor.chains = asset.data.motion?.chains?.length ? new RigChains(actor.rig.skeleton, asset.data.motion.chains) : null;
      actor.anim = RigAnimLayer.create(actor, asset.data, actor.compiled, asset.anim !== undefined ? asset.anim : pageAnimStyle());
      actor.ready = true;
      actor.trans.snap(actor.compiled.get('idle')!);
      actor.pose0();
      return actor;
    } catch (e) {
      actor.dispose();
      throw e;
    }
  }

  // ------------------------------------------------------------------- pose

  /** The key being shown (or moved to). */
  override get pose(): string {
    return this.ready ? this.key : super.pose;
  }

  /** True while a move between two keys is in flight. */
  override get blending(): boolean {
    return this.ready ? this.trans.busy : super.blending;
  }

  override get poseNames(): string[] {
    return this.ready ? [...this.rigKeys] : super.poseNames;
  }

  override get isPlaceholder(): boolean {
    return this.ready ? false : super.isPlaceholder;
  }

  override setPose(name: string, opts?: { immediate?: boolean; force?: boolean }): void {
    const refused = this.refuses(name, opts);
    super.setPose(name, opts); // the life layer, the ring, the flinch tokens; the carrier itself stays on its idle
    if (!this.ready || refused) return;
    const key = resolveKeyName(name, this.rigKeys, this.dressphere);
    if (key === null) return; // a name this rig and the game's chains know nothing of: the figure stays as it is, like a painting it cannot draw
    if (key === this.key && !opts?.force) return;
    const target = this.compiled.get(key)!;
    this.track.leave(this.key, this.trans.busy, this.trans.progress);
    const clip = this.anim !== null && this.tryClip(key, opts?.immediate === true); // the animation prototype plays the pose as a clip
    this.key = key;
    this.stateFrom = this.appliedState; // what is on the parts now stays until the move is half way
    this.stateTo = this.states.get(key)!;
    const ms = opts?.immediate ? 0 : (this.data.keys.get(key)?.ms ?? this.crossMs);
    if (clip) this.trans.drive(this.trans.current, this.trans.velocity);
    else this.trans.retarget(target, ms);
    this.layersDue = true;
    if (ms <= 0 && !clip) this.pose0();
  }

  private tryClip(key: string, immediate: boolean): boolean {
    const want = this.states.get(key)!; // a clip never changes which parts show: only between keys with the same part state
    const ok = !immediate && this.appliedState.every((v, i) => v === want[i]) && this.anim!.request(key, this.key, this.trans);
    if (!ok) this.anim!.anim.cancel(); // snapped, or a pose the clips do not play
    return ok;
  }

  /** A body on the ground ignores a pose the life layer refuses (`PaintedActor.setPose`'s first rule), judged before the call moves the state. */
  private refuses(name: string, opts?: { immediate?: boolean }): boolean {
    const life = carrierOf(this).life;
    if (!life || opts?.immediate) return false;
    const want = lifeStateForPose(name);
    return nextLifeState(life.state as Parameters<typeof nextLifeState>[0], want) !== want;
  }

  /** Solve and skin the pose as it stands, advancing nothing (staging, a snap). */
  private pose0(): void {
    this.compose(0);
  }

  // ----------------------------------------------------------------- update

  override update(dt: number, realDt: number = dt): void {
    super.update(dt, realDt);
    if (!this.ready) return;
    this.trans.step(dt * paceRate('action'));
    this.rigClock += dt;
    this.compose(dt);
    this.maybeRaise();
  }

  /** The key's pose (mid-move or settled) plus the idle plus the chains, solved and skinned, the parts put where the plane is and drawn as opaque as the actor. */
  private compose(dt: number): void {
    if (this.layersDue && this.trans.progress >= 0.5) {
      this.layersDue = false;
      this.rig.setLayers(this.data.keys.get(this.key)?.layers ?? null);
    }
    const shown = partStateAt(this.stateFrom, this.stateTo, this.trans.progress); // format v2: which parts show, with which image
    if (shown !== this.appliedState) {
      this.rig.setPartState(shown);
      this.appliedState = shown;
    }
    this.work.set(this.trans.current);

    const down = this.lifeState === 'down';
    const idle = this.anim ? undefined : this.data.motion?.idle;
    if (idle) {
      const target = down || this.still?.() === true ? 0 : 1;
      this.idleAmount += (target - this.idleAmount) * (dt > 0 ? 1 - Math.exp(-dt / IDLE_TAU) : 0);
      applyIdle(this.work, this.data, idle, this.rigClock, this.idleAmount);
    }

    const sk = this.rig.skeleton;
    if (this.anim) this.anim.compose(this.work, this.trans, sk, { dt, rate: paceRate('action'), forward: this.trackSpeed(dt), calm: down || this.still?.() === true });
    else {
      sk.solve(this.work);
      if (this.chains) { this.chains.update(this.work, dt, this.trackSpeed(dt)); sk.solve(this.work); }
    }
    this.rig.skin();
    this.rig.sync();
    this.rig.setOpacity(this.alpha, this.visible);
    this.rig.syncBloom((this.carrier.u['dissolve']!.value as number) > 0, this.rigBloomMasked);
    this.anim?.afterSync(dt);
  }

  /** How fast the figure travels the way it faces, world units a second, from where its motion group stands in the world. */
  private trackSpeed(dt: number): number {
    const x = this.carrier.inner.getWorldPosition(this.scratch).x;
    if (this.haveX && dt > 0) {
      const v = ((x - this.lastX) * this.facingDir) / dt;
      this.forwardSpeed += (v - this.forwardSpeed) * (1 - Math.exp(-dt / SPEED_TAU));
    }
    this.lastX = x;
    this.haveX = true;
    return this.forwardSpeed;
  }

  // ----------------------------------------- the animation prototype's beats (`anim/RigAnimator.ts`; no-ops without it)

  override lunge(distance?: number, ms?: number, contact?: { hold: Promise<unknown>; reached: () => void }, house?: number): Promise<void> {
    this.anim?.lunge(ms ?? 320); // the strike clip's contact lands on the lunge's apex
    return super.lunge(distance, ms, contact, house);
  }

  /** The presenter's action start: begin the clip for `pose`, aimed at `targets` (world points). */
  animBegin(pose: string, targets: ReadonlyArray<{ x: number; y: number; z: number }>): void {
    this.anim?.begin(pose, targets, this.trans);
  }

  /** Base ms the presenter should still wait for `pose`'s clip to reach its beat (0: it has; -1: no clip plays, wait as ever). */
  animLead(pose: string): number {
    return this.anim?.lead(pose) ?? -1;
  }

  /** A blow landed: the hit-stop and the springs' impulse happen here; the camera punch the style asks for (a fraction, its length in ms) is answered. */
  animBeat(kind: string, hitIndex = 0, hitCount = 1): { punch: number; ms: number } {
    return { punch: this.anim?.anim.beat(kind, hitIndex, hitCount).punch ?? 0, ms: this.anim?.style.camera.ms ?? 0 };
  }

  // ------------------------------------------------------------------- misc

  /** The rig's part meshes and skeleton, for tools and the tests. */
  get figure(): RigFigure {
    return this.rig;
  }

  /** For `window.__pyrefly.rigs()` and the tests: the rig as it stands. */
  rigInfo(): { name: string; key: string; keys: string[]; parts: number; vertices: number; bones: number; chains: number; idle: boolean; anim: string | null; textures: RigTextures; textureMB: number } {
    return {
      name: this.data.name,
      key: this.key,
      keys: [...this.rigKeys],
      parts: this.rig.partCount,
      vertices: this.rig.vertexCount,
      bones: this.data.bones.length,
      chains: this.chains?.size ?? 0,
      idle: this.data.motion?.idle !== undefined,
      anim: this.anim?.style.id ?? null,
      textures: { ...this.textures },
      textureMB: Math.round(this.textureMB * 10) / 10,
    };
  }

  // -------------------------------------------------------------- textures (RigTier.ts)

  /** A figure on its 1x maps whose idle texel the camera shows larger than a pixel loads the 2x maps, if the rigs' share of the budget has room. Never throws; a failure leaves the 1x maps. */
  private maybeRaise(): void {
    if (!this.ready || this.raising || this.raiseBlocked || this.textures.map >= 2 || this.tiers?.includes(2) !== true) return;
    if (++this.raiseTick % RAISE_EVERY !== 0) return;
    const view = this.rig.view;
    if (!view) return;
    const slot = idleSlot(this.carrier);
    slot.mesh.updateWorldMatrix(true, false);
    if (wantsMaster(pixelsPer1xTexel(slot.mesh.matrixWorld, view.camera, view.height, slot.meta))) void this.raise();
  }

  private async raise(): Promise<void> {
    this.raising = true;
    try {
      const next: RigTextures = { map: 2, rim: this.textures.rim };
      const mb = rigTextureMB(tierPartsOf(this.data), next);
      if (rigLedger.usedMB - this.textureMB + mb > artBudget().textureMB * RIG_SHARE) {
        this.raiseBlocked = true;
        return;
      }
      await this.rig.swapMaps(this.base, 2, this.loadTexture);
      if (!this.ready) return;
      const give = this.releaseTextures;
      this.releaseTextures = rigLedger.reserve(mb);
      give?.();
      this.textures = next;
      this.textureMB = mb;
    } catch {
      this.raiseBlocked = true;
    } finally {
      this.raising = false;
    }
  }

  // ------------------------------------------------- silhouette per key (RigShape.ts)

  private shape(): KeyShape | null {
    return this.track.current(this.key, this.trans.busy, this.trans.progress);
  }

  /** The painted box of the pose SHOWN, not of the idle plane the rig is mapped onto: a raised spear widens a target bracket. */
  override contentQuad(out?: [Vector3, Vector3, Vector3, Vector3]): [Vector3, Vector3, Vector3, Vector3] {
    const s = this.ready ? this.shape() : null;
    return s ? this.track.quad(s.box, out) : super.contentQuad(out);
  }

  /** The box of the key a request for `name` would show, as the strike solver's look at the pose a blow lands in (`engine/motion/Silhouette.ts`). */
  override poseShape(name: string): PoseShape | null {
    const key = this.ready ? resolveKeyName(name, this.rigKeys, this.dressphere) : null;
    return this.track.poseShape(key, idleSlot(this.carrier).material.uniforms['map']!.value as Texture) ?? super.poseShape(name);
  }

  /** Where the lowest foot of the pose showing now stands, in the world (the gate's reading of the posed rig): for a landing, a dust puff, a shadow; null where it stamped none. */
  feetPoint(): Vector3 | null {
    return this.ready ? this.track.feet(this.shape()) : null;
  }

  /** The painted front, in rows, of the pose showing now or (with `pose`) of the key a request for it would show; `Silhouette.profileOfActor` asks for it before it reads the idle painting's alpha. */
  rigProfile(pose?: string): Profile | undefined {
    if (!this.ready) return undefined;
    return this.track.profile(pose === undefined ? null : resolveKeyName(pose, this.rigKeys, this.dressphere), this.shape());
  }

  /**
   * A landmark of the posed rig in the actor's local space (world units, x along the stage, y up; add `position` for the world), or null for an unknown name. For
   * the strike and the effects that want the hand or the spear tip.
   */
  landmark(name: string): { x: number; y: number } | null {
    const p = this.rig.skeleton.landmark(name);
    if (!p) return null;
    const v = this.scratch.set(p.x / this.data.image.w - 0.5, 0.5 - p.y / this.data.image.h, 0);
    this.rig.plane.updateMatrix();
    v.applyMatrix4(this.rig.plane.matrix);
    this.carrier.inner.updateMatrix();
    v.applyMatrix4(this.carrier.inner.matrix);
    return { x: v.x, y: v.y };
  }

  override dispose(): void {
    if (this.ready) this.rig.dispose();
    this.anim?.dispose();
    this.ready = false;
    this.releaseTextures?.();
    this.releaseTextures = null;
    super.dispose();
  }
}

/** A stable 0..1 from a name, so a party does not breathe in step. */
function hashUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}
