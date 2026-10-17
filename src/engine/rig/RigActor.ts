/**
 * A figure drawn as ONE painting cut into parts on a bone rig, instead of one painting per pose.
 *
 * `RigActor extends PaintedActor`, so everything the stage and the presenter ask of a figure is already answered, by the same code that answers it for a painted
 * plane: the pose names and the life layer (the ready lean, the guard brace, the KO fall, the victory hop), lunge, recoil, hop, shake and squash, flash, tint, dim and
 * dissolve, facing and mirroring, scale and placement, the contact shadow and the rings, and every projection point. The actor loads only its idle painting (the
 * rig's costume) and draws no plane ("the carrier", `RigCarrier.ts`); the rig's parts hang under the same motion group and share the same uniform cells, so a
 * stage move that carries the plane carries them.
 *
 * What this class adds is the pose itself: `setPose` runs the actor's own (state, flinch tokens, ring) and then resolves the name to a key of the rig and moves
 * the bones there (`RigKeys.ts`: the game's ease, a start that keeps the speed the figure had), the idle and the lag chains play on top (`RigDynamics.ts`), and
 * every frame the parts are re-skinned. `pose` reads the key being shown, `blending` is "a move between keys is in flight", `poseNames` are the rig's keys.
 *
 * Feet: a planted key keeps its lowest foot on the bind row (`RigValidate.ts` proves it for every key of a rig); the idle and the chains never move a foot.
 * Clocks: transitions run on the field clock scaled by the pacing option (`pace.ts`, like the actor's own one-shot moves), so a hit-stop freezes the rig with the
 * rest of the picture; the idle and the chains run on the field clock.
 */
import { PaintedActor, type PaintedActorOptions } from '../PaintedActor.ts';
import { lifeStateForPose, nextLifeState } from '../BattlePresenterActors.ts';
import { paceRate } from '../pace.ts';
import { carrierOf, idleSlot, type CarrierInternals } from './RigCarrier.ts';
import type { RigData } from './RigData.ts';
import { applyIdle, RigChains } from './RigDynamics.ts';
import { RigFigure } from './RigFigure.ts';
import { compileKeys, resolveKeyName, RigTransition } from './RigKeys.ts';
import { CH } from './RigSkeleton.ts';
import { Vector3, type Texture } from 'three';
import type { PaintedTexture } from '../PaintedArt.ts';

/** What the loader hands the actor. */
export interface RigAsset {
  data: RigData;
  /** The URL folder the part PNGs are under (no trailing slash). */
  base: string;
  /** FFX-2 dressphere: cast, item and KO fall straight to the idle (D-179). */
  dressphere?: boolean;
  /** An idle painting already loaded, adopted instead of fetched (a share between actors; the unit tests). */
  idlePainting?: PaintedTexture;
  /** How a part PNG becomes a texture (default: three's `TextureLoader`); the unit tests hand textures that need no image. */
  loadTexture?: (url: string) => Promise<Texture>;
}

/** The idle plays in over this long when a figure stands up from a KO or a guard (seconds, the approach's time constant). */
const IDLE_TAU = 0.25;
/** The forward speed the chains read is smoothed over this long (seconds). */
const SPEED_TAU = 0.06;

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
  private key = 'idle';
  /** True while the draw-order overrides of the key being moved to are not on the parts yet (they go on halfway through the move). */
  private layersDue = false;
  private readonly crossMs: number;
  private readonly rigBloomMasked: boolean;
  private rigClock: number;
  private idleAmount = 1;
  private forwardSpeed = 0;
  private lastX = 0;
  private haveX = false;
  private readonly scratch = new Vector3();

  private constructor(opts: PaintedActorOptions, asset: RigAsset) {
    super({
      ...opts,
      figure: false,
      ...(asset.data.motion?.idle ? { breathe: false as const, sway: false as const } : {}), // the bones breathe; the whole card would double it
    });
    this.data = asset.data;
    this.dressphere = asset.dressphere === true;
    this.compiled = compileKeys(this.data);
    this.rigKeys = new Set(this.compiled.keys());
    this.trans = new RigTransition(this.data.bones.length * CH, this.compiled.get('idle')!);
    this.work = new Float64Array(this.data.bones.length * CH);
    this.crossMs = opts.crossfadeMs ?? 120;
    this.rigBloomMasked = opts.bloomMask !== false;
    this.rigClock = hashUnit(this.name) * 8;
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
      actor.rig = await RigFigure.load(asset.data, asset.base, carrier, asset.loadTexture);
      actor.chains = asset.data.motion?.chains?.length ? new RigChains(actor.rig.skeleton, asset.data.motion.chains) : null;
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
    this.key = key;
    const ms = opts?.immediate ? 0 : (this.data.keys.get(key)?.ms ?? this.crossMs);
    this.trans.retarget(target, ms);
    this.layersDue = true;
    if (ms <= 0) this.pose0();
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
  }

  /** The key's pose (mid-move or settled) plus the idle plus the chains, solved and skinned, the parts put where the plane is and drawn as opaque as the actor. */
  private compose(dt: number): void {
    if (this.layersDue && this.trans.progress >= 0.5) {
      this.layersDue = false;
      this.rig.setLayers(this.data.keys.get(this.key)?.layers ?? null);
    }
    this.work.set(this.trans.current);

    const down = this.lifeState === 'down';
    const idle = this.data.motion?.idle;
    if (idle) {
      const calm = this.still?.() === true;
      const target = down || calm ? 0 : 1;
      this.idleAmount += (target - this.idleAmount) * (dt > 0 ? 1 - Math.exp(-dt / IDLE_TAU) : 0);
      applyIdle(this.work, this.data, idle, this.rigClock, this.idleAmount);
    }

    const sk = this.rig.skeleton;
    sk.solve(this.work);
    if (this.chains) {
      this.trackSpeed(dt);
      this.chains.update(this.work, dt, this.forwardSpeed);
      sk.solve(this.work);
    }
    this.rig.skin();
    this.rig.sync();
    this.rig.setOpacity(this.alpha, this.visible);
    const dissolving = (this.carrier.u['dissolve']!.value as number) > 0;
    this.rig.syncBloom(dissolving, this.rigBloomMasked);
  }

  /** How fast the figure travels the way it faces, world units a second, from where its motion group stands in the world. */
  private trackSpeed(dt: number): void {
    const x = this.carrier.inner.getWorldPosition(this.scratch).x;
    if (this.haveX && dt > 0) {
      const v = ((x - this.lastX) * this.facingDir) / dt;
      this.forwardSpeed += (v - this.forwardSpeed) * (1 - Math.exp(-dt / SPEED_TAU));
    }
    this.lastX = x;
    this.haveX = true;
  }

  // ------------------------------------------------------------------- misc

  /** The rig's part meshes and skeleton, for tools and the tests. */
  get figure(): RigFigure {
    return this.rig;
  }

  /** For `window.__pyrefly.rigs()` and the tests: the rig as it stands. */
  rigInfo(): { name: string; key: string; keys: string[]; parts: number; vertices: number; bones: number; chains: number; idle: boolean } {
    return {
      name: this.data.name,
      key: this.key,
      keys: [...this.rigKeys],
      parts: this.rig.partCount,
      vertices: this.rig.vertexCount,
      bones: this.data.bones.length,
      chains: this.chains?.size ?? 0,
      idle: this.data.motion?.idle !== undefined,
    };
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
    this.ready = false;
    super.dispose();
  }
}

/** A stable 0..1 from a name, so a party does not breathe in step. */
function hashUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}
