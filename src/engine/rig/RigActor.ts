/**
 * A figure drawn as ONE painting cut into parts on a bone rig, instead of one painting per pose.
 *
 * `RigActor extends PaintedActor`, so everything the stage and the presenter ask of a figure is answered by the same code that answers it for a painted plane (the pose names and the life layer, lunge,
 * recoil, hop, shake, squash, flash, tint, dim, dissolve, facing, mirroring, scale, placement, shadow, rings, every projection point). The actor loads only its idle painting (the rig's costume) and
 * draws no plane ("the carrier", `RigCarrier.ts`); the rig's parts hang under the same motion group and share its uniform cells, so a stage move that carries the plane carries them.
 *
 * This class adds the pose itself: `setPose` runs the actor's own (state, flinch tokens, ring), then `moveKey` resolves the name to a key and moves the bones there (`RigKeys.ts`: the game's ease, a
 * start that keeps the speed the figure had); the idle and the lag chains play on top (`RigDynamics.ts`) and every frame the parts are re-skinned (a part a v2 key hides is not: `RigPartState.ts`).
 * `pose` reads the key being shown, `blending` is "a move between keys is in flight", `poseNames` are the rig's keys. Feet: a planted key keeps its lowest foot on the bind row (`RigValidate.ts`).
 * Clocks: transitions run on the field clock scaled by the pacing option (`pace.ts`), so a hit-stop freezes the rig with the rest of the picture; the idle and the chains run on the field clock.
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
import { foldMs, shortestWay } from './RigFold.ts'; // rigs-v3: a pose-drawn figure's move takes the short way round and, where a bone still turns far, is a short one
import { makeRigKoHost, type RigKoHost } from './RigKoHost.ts'; // rigs-v3: what the KO run (`fx/mix/living.ts`) needs of a rig that draws its lying pose by pieces
import { compileStates, partStateAt } from './RigPartState.ts';
import { fadeMsFor, fadeStart, partAreas, swapShare } from './RigFade.ts'; // `?motion=demo`: part changes cross-fade (format v2.1 `fadeMs`; shorter the larger the share of the figure that changes)
import { demoMotionOn } from '../motion/DemoMotion.ts';
import { RigSmearWindow } from './RigSmearWindow.ts'; // motion pass (lane "core", step 2): a whole-figure image flip is a cut inside a smear
import { hashUnit } from './RigHash.ts';
import { attachRigHandoff } from './RigHandoff.ts'; // MF-11 (`?rigko=whole`): the ko key is the whole fall, the idle key waits for the strike to be over
import { CH } from './RigSkeleton.ts';
import { ShapeTrack } from './RigShape.ts';
import { RIG_SHARE, rigLedger, rigNormalMB, rigTextureMB, tierPartsOf, wantsMaster, type RigTextures } from './RigTier.ts';
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
  /** The scales the textures load at (`RigTier.planRigTextures`); default the full-size files for both. */
  textures?: RigTextures;
  /** The scales the art manifest lists for this rig (`rigTiers`): a figure on its 1x maps raises them to the 2x when the camera magnifies a texel past a pixel (and the budget has room). */
  tiers?: readonly number[];
  /** Gives back the texture memory this figure reserved in `rigLedger`; called once, when the figure goes (or fails to build). */
  release?: () => void;
  normals?: boolean; // the HD-2D look (release 61): load the normal pieces the file carries and light the parts with them (`RigLoad.chooseRig` says yes when a look is armed and the budget has room); default off
}

/** The idle plays in over this long when a figure stands up from a KO or a guard (seconds, the approach's time constant). */
const IDLE_TAU = 0.25;
/** The forward speed the chains read is smoothed over this long (seconds). */
const SPEED_TAU = 0.06;
/** A figure on its 1x maps measures the magnification of the idle's texel every this many frames. */
const RAISE_EVERY = 15;

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
  /** Format v2: each key's part state, the state the parts are in now, and the two the move in flight is between (`partStateAt` picks one at progress 0.5). */
  private readonly states: Map<string, Int16Array>;
  private appliedState: Int16Array;
  private stateFrom: Int16Array;
  private stateTo: Int16Array;
  /** The cross-fade of the move into the key being shown (`RigFade.fadeMsFor`, 0 for a snap or a build without the demo switch) and the progress at which the state flips, centred on half way. */
  private fade: { ms: number; flipAt: number | undefined } = { ms: 0, flipAt: undefined };
  private readonly crossMs: number;
  private readonly smearWin = new RigSmearWindow(this);
  private koHost: RigKoHost | null | undefined;
  private readonly rigBloomMasked: boolean;
  private rigClock: number;
  private idleAmount = 1;
  private forwardSpeed = 0;
  private lastX = 0; private haveX = false;
  private readonly scratch = new Vector3();
  /** Each key's posed silhouette as the gate stamped it, and where the figure's painted shape is now (`RigShape.ts`). */
  private readonly track: ShapeTrack;
  // ---- texture tier (RigTier.ts)
  private readonly base: string;
  private readonly loadTexture: ((url: string) => Promise<Texture>) | undefined;
  private textures: RigTextures;
  private readonly tiers: readonly number[] | undefined;
  private releaseTextures: (() => void) | null;
  private textureMB = 0;
  private readonly normalMB: number; // the normal pieces' share of textureMB (the HD-2D look): one size, whatever the tier
  private raising = false;
  private raiseBlocked = false; private raiseTick = 0;

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
    this.normalMB = asset.normals === true ? rigNormalMB(tierPartsOf(this.data)) : 0;
    this.textureMB = rigTextureMB(tierPartsOf(this.data), this.textures) + this.normalMB;
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
      actor.rig = await RigFigure.load(asset.data, asset.base, carrier, asset.loadTexture, actor.textures, asset.normals === true);
      actor.chains = asset.data.motion?.chains?.length ? new RigChains(actor.rig.skeleton, asset.data.motion.chains) : null;
      actor.ready = true;
      attachRigHandoff(actor);
      actor.trans.snap(actor.compiled.get('idle')!);
      actor.pose0();
      return actor;
    } catch (e) {
      actor.dispose();
      throw e;
    }
  }

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

  override setPose(name: string, opts?: { immediate?: boolean; force?: boolean; paint?: string }): void {
    const refused = this.refuses(name, opts);
    super.setPose(name, opts); // the life layer, the ring, the flinch tokens; the carrier itself stays on its idle
    if (this.ready && !refused) this.moveKey(opts?.paint ?? name, opts); // `paint`: the stance look's "the ready STATE on the idle painting" (`StanceSwap`), as `PaintedActor.setPose` reads it
  }

  /** The key move a pose request asks for, without the life layer's half (`rigKo.flip`: the KO run's cut). */
  moveKey(name: string, opts?: { immediate?: boolean; force?: boolean }): void {
    const key = resolveKeyName(name, this.rigKeys, this.dressphere);
    if (key === null) return; // a name this rig and the game's chains know nothing of: the figure stays as it is, like a painting it cannot draw
    if (key === this.key && !opts?.force) return;
    const drawn = this.poseDrawnParty; // rigs-v3 (`RigFold.ts`): a figure drawn by pose turns the short way round, and does not play a long turn of a bone slowly
    const target = drawn ? shortestWay(this.trans.current, this.compiled.get(key)!) : this.compiled.get(key)!;
    this.track.leave(this.key, this.trans.busy, this.trans.progress);
    const leaving = this.key; this.key = key;
    this.stateFrom = this.appliedState; // what is on the parts now stays until the move is half way
    this.stateTo = this.states.get(key)!;
    const own = this.data.keys.get(key)?.ms ?? this.crossMs;
    const ms = opts?.immediate ? 0 : drawn ? foldMs(own, this.trans.current, target) : own;
    const fadeMs = demoMotionOn() && ms > 0 ? fadeMsFor(this.data, this.data.keys.get(key), this.stateFrom, this.stateTo) : 0;
    this.fade = { ms: fadeMs, flipAt: fadeMs > 0 ? fadeStart(ms, fadeMs) : undefined };
    if (this.smearWin.begin({ name: this.name, from: leaving, to: key, share: swapShare(partAreas(this.data), this.stateFrom, this.stateTo), moveMs: ms, state: this.smear.state, worldHeight: this.bodyHeight, facing: this.facingDir })) this.fade = { ms: 0, flipAt: undefined }; // a whole-figure flip is a cut and the smear covers it
    this.trans.retarget(target, ms);
    this.layersDue = true;
    if (ms <= 0) this.pose0();
  }

  /** A figure drawn by pose (a part's image per key) on the party's side: the painting set's behaviour is the model for it (no held return, a short fold, the painting's fall), not the bosses' (`RigHandoff.ts`). */
  get poseDrawnParty(): boolean { return this.facing >= 0 && this.data.parts.some((p) => p.variants.length > 0); }

  /** What the KO run needs when this rig's `ko` key is drawn by pose; null for every other rig (`RigKoHost.ts`). */
  get rigKo(): RigKoHost | null {
    return this.koHost !== undefined ? this.koHost : (this.koHost = this.poseDrawnParty ? makeRigKoHost(this.data, (n) => resolveKeyName(n, this.rigKeys, this.dressphere), (k, ms) => { if (ms) this.rig.holdPose(ms); this.moveKey(k, { immediate: true, force: true }); }) : null);
  }

  protected override smearsPlanes(): boolean { return false; } // the parts are what is drawn: the smear is `smearWin`'s, not the carrier planes' cut

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

  override update(dt: number, realDt: number = dt): void {
    super.update(dt, realDt);
    if (!this.ready) return;
    this.trans.step(dt * paceRate('action'));
    this.rigClock += dt;
    this.compose(dt, realDt);
    this.maybeRaise();
  }

  /** The key's pose (mid-move or settled) plus the idle plus the chains, solved and skinned, the parts put where the plane is and drawn as opaque as the actor. */
  private compose(dt: number, realDt: number = dt): void {
    if (this.layersDue && this.trans.progress >= 0.5) {
      this.layersDue = false;
      this.rig.setLayers(this.data.keys.get(this.key)?.layers ?? null);
    }
    // format v2: which parts show, with which image. `?motion=demo`: the change cross-fades, centred on the half-way point (`RigFade.ts`); a snap (no move) stays a flip.
    const shown = partStateAt(this.stateFrom, this.stateTo, this.trans.progress, this.fade.flipAt);
    if (shown !== this.appliedState) {
      this.rig.setPartState(shown, this.fade.ms);
      this.appliedState = shown;
    }
    this.smearWin.step(this.trans.progress, this.trans.busy, this.smear.state, this.carrier.u, idleSlot(this.carrier));
    this.rig.advanceFades(realDt * 1000); // on the real clock: a hit-stop that holds the field never freezes a half-mixed pair of images
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

  /** The rig's part meshes and skeleton, for tools and the tests. */
  get figure(): RigFigure {
    return this.rig;
  }

  /** For `window.__pyrefly.rigs()` and the tests: the rig as it stands. */
  rigInfo(): { name: string; key: string; keys: string[]; parts: number; vertices: number; bones: number; chains: number; idle: boolean; textures: RigTextures; textureMB: number; relight: { lit: boolean; pieces: number } } {
    return {
      name: this.data.name, key: this.key, keys: [...this.rigKeys], parts: this.rig.partCount, vertices: this.rig.vertexCount, bones: this.data.bones.length, chains: this.chains?.size ?? 0,
      idle: this.data.motion?.idle !== undefined, textures: { ...this.textures }, textureMB: Math.round(this.textureMB * 10) / 10, relight: this.rig.relightInfo,
    };
  }

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
      const mb = rigTextureMB(tierPartsOf(this.data), next) + this.normalMB;
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
    this.ready = false;
    this.releaseTextures?.();
    this.releaseTextures = null;
    super.dispose();
  }
}
