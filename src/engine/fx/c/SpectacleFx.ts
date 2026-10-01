/**
 * Option C, "Spectacle Combat" (eye-candy options round, 2026-09-29; `?fx=c`): the stage side.
 * Implements the presenter's optional `BattleStage.fx` port (`presenterHooks.ts`) and owns
 * everything C draws: the impact frame and heat haze (`SpectaclePass`), the hit-stop clock and
 * the trauma camera (`Trauma.ts`), the GPU pools (`FxPools.ts`), the spell layers
 * (`SpellLayers.ts`), the splash (through `splash`), the victory arc.
 *
 * Presentation only: the engine, the seeded RNG and the ATB clock never see it. With the option
 * switched off at runtime it goes inert and clears what it drew, so a capture takes the same
 * frozen frame ON and OFF. Game case: both, skins per game (`SpectacleRules.ts`).
 */

import { Group, Quaternion, Vector2, Vector3, type PerspectiveCamera, type Scene } from 'three';
import type { CombatantId } from '../../../battle/common/types.ts';
import type { PaintedActor } from '../../PaintedActor.ts';
import { SegmentPool, SpritePool } from './FxPools.ts';
import { hitBurst, iceGlints, poolsOf, sendOff, sparkleSweep, type Pools } from './HitDraw.ts';
import type { FxStagePort } from './presenterHooks.ts';
import { easeInOut, FlashBudget, planHit, planVictory, SPECTACLE_TUNING, type OrbitPlan, type SpectacleFlags, type SpectacleGame } from './SpectacleRules.ts';
import { FireColumns, IceBurst, ShockSpheres } from './SpellLayers.ts';
import { bigMoment, castOnto, spellMoment, type MomentCtx } from './SpellMoments.ts';
import { SpectaclePass } from './SpectaclePass.ts';
import { HitStop, Trauma } from './Trauma.ts';

export interface SpectacleStage {
  actor(id: CombatantId): PaintedActor | undefined;
  staged(): CombatantId[];
  sideOf(id: CombatantId): 'party' | 'enemy' | 'aeon' | undefined;
  snapshot(): Array<{ id: string; art: string }>;
}

export interface SplashPort {
  play(o: { art: string | null; name: string; at: { x: number; y: number } | null; mode: 'full' | 'repeat' | 'calm'; staticLines: boolean; holdMs: number; from: 'left' | 'right' }): Promise<void>;
  stop(): void;
}

export interface SpectacleDeps {
  game: SpectacleGame;
  scene: Scene;
  camera: PerspectiveCamera;
  stage: SpectacleStage;
  pass: SpectaclePass;
  enabled(): boolean;
  flags(): SpectacleFlags;
  /** A strength dial (`?fxdial=`), 1 = as tuned. */
  dial(name: 'orbit' | 'splash' | 'heat'): number;
  sub(id: string): boolean;
  splash: SplashPort | null;
  /** The painting a splash shows for an actor, or null. */
  splashArt(id: CombatantId, art: string, kind: 'overdrive' | 'special'): string | null;
  /** CSS px per drawing-buffer px, and the canvas CSS size. */
  view(): { w: number; h: number; dpr: number };
}

/** The victory arc starts once the rig move is under way. */
const VICTORY_LEAD_S = 0.35;

export class SpectacleFx implements FxStagePort {
  private readonly d: SpectacleDeps;
  private readonly tune;
  private readonly pools: Pools;
  private readonly fire: FireColumns;
  private readonly ice: IceBurst;
  private readonly shell: ShockSpheres;
  private readonly stop = new HitStop();
  private readonly mctx: MomentCtx;
  /** Captures only: freeze the page on the next impact frame (`__pyrefly.fx.c.armImpact()`). */
  armImpact: (() => void) | null = null;
  private readonly trauma: Trauma;
  private readonly budget = new FlashBudget(3);
  private stageDtLast = 0;
  private impactFrames: number[] = [];
  private lift = 0;
  private haze = 0;
  private hazeAt = new Vector2(0.5, 0.5);
  private hazeTarget: CombatantId | null = null;
  private readonly timers: Array<{ at: number; fn: () => void }> = [];
  private clock = 0;
  private orbit: (OrbitPlan & { t: number; pivot: Vector3 }) | null = null;
  private readonly splashed = new Set<string>();
  private special: string | null = null;
  private wasOn = false;
  private offAt = 0;
  /** Everything C draws in the field, so switching C off hides it in the same frozen frame. */
  private readonly root = new Group();
  private readonly q = new Quaternion();
  private readonly v = new Vector3();
  private readonly w = new Vector3();
  /** For the debug snapshot and the capture harness. */
  readonly stats = { hits: 0, impactFrames: 0, freezes: 0, spells: 0, splashes: 0, sends: 0, lastHitAt: -1, lastKind: '' };

  constructor(d: SpectacleDeps) {
    this.d = d;
    this.tune = SPECTACLE_TUNING[d.game];
    const t = this.tune;
    this.trauma = new Trauma({ max: t.shakeMax, rollMaxDeg: t.rollMaxDeg, hz: t.shakeHz, decay: t.decay });
    const seg = new SegmentPool(1024);
    const spr = new SpritePool(512);
    const [floor, back] = [new SpritePool(64, true), SpritePool.behind(128)];
    this.root.name = 'fx-c';
    d.scene.add(this.root);
    this.pools = { seg, spr, floor, back, px: 1 };
    for (const p of poolsOf(this.pools)) p.attach(this.root);
    this.fire = new FireColumns(this.root);
    this.ice = new IceBurst(this.root);
    this.ice.onShatter = (tip, big): void => iceGlints(this.pools, tip, big, this.tune.stars);
    this.shell = new ShockSpheres(this.root);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.mctx = {
      game: d.game,
      tune: t,
      pools: this.pools,
      fire: this.fire,
      ice: this.ice,
      shell: this.shell,
      stage: d.stage,
      after: (sec, fn) => this.after(sec, fn),
      lift: (v) => (this.lift = Math.max(this.lift, v)),
      haze: (id) => {
        this.haze = Math.min(1, d.dial('heat'));
        this.hazeTarget = id;
      },
      sub: (id) => d.sub(id),
      get special(): string | null {
        return self.special;
      },
    };
    const u = d.pass.uniforms;
    (u['uInk']!.value as Vector3).set(...t.ink);
    (u['uPaper']!.value as Vector3).set(...t.paper);
    (u['uEdge']!.value as Vector3).set(...t.edge);
  }

  enabled(): boolean { return this.d.enabled(); }
  /** PR-0300: a new link's opening lets go of the last link's victory arc, which would else frame the next fight yawed. */
  opening(): void { this.orbit = null; }

  // ------------------------------------------------------------- the port

  async actionOpen(o: { actorId: CombatantId; name: string; kind: 'overdrive' | 'special' | 'other' }): Promise<void> {
    this.special = o.kind === 'other' ? null : o.name.trim().toLowerCase();
    if (o.kind === 'other' || !this.d.splash || !this.d.sub('splash')) return;
    const f = this.d.flags();
    const art = this.d.stage.snapshot().find((s) => s.id === o.actorId)?.art ?? '';
    const key = `${o.actorId}:${o.name}`;
    const mode = f.reduceMotion ? 'calm' : this.splashed.has(key) ? 'repeat' : 'full';
    this.splashed.add(key);
    this.stats.splashes++;
    const side = this.d.stage.sideOf(o.actorId);
    await this.d.splash.play({
      art: this.d.splashArt(o.actorId, art, o.kind === 'overdrive' ? 'overdrive' : 'special'),
      name: o.name,
      at: this.screenOf(o.actorId),
      mode,
      staticLines: f.tier === 'low',
      holdMs: this.d.game === 'ffx' ? 700 : 500,
      from: side === 'enemy' ? 'right' : 'left',
    });
  }

  hit(o: Parameters<NonNullable<FxStagePort['hit']>>[0]): { freezeMs: number; shook: boolean } {
    const a = this.d.stage.actor(o.targetId);
    if (!a) return { freezeMs: 0, shook: false };
    const f = this.d.flags();
    const plan = planHit(this.d.game, o, f);
    const at = a.centerPoint(new Vector3());
    const foot = a.position.clone();
    const h = a.height;
    this.stats.hits++;
    this.stats.lastHitAt = this.clock;
    this.stats.lastKind = o.big ? 'big' : (plan.spell ?? (o.heavy ? 'heavy' : 'hit'));
    if (plan.freezeMs > 0 && this.d.sub('hitstop')) {
      this.stop.freeze(plan.freezeMs);
      this.stats.freezes++;
    }
    if (plan.impactFrame && this.budget.take(performance.now(), o.action)) {
      this.impactFrames = plan.impactFrame === 'soft' ? [1] : [1, 0.5];
      this.armImpact?.();
      this.armImpact = null;
      this.d.pass.uniforms['uSoft']!.value = plan.impactFrame === 'soft' ? 1 : 0;
      const s = this.uvOf(at);
      if (s) (this.d.pass.uniforms['uCenter']!.value as Vector2).copy(s);
      this.stats.impactFrames++;
    }
    this.trauma.add(plan.trauma);
    this.trauma.kick(plan.kick);
    this.pools.px = this.d.view().dpr;
    hitBurst(this.pools, this.tune, at, h, { streaks: plan.streaks, ring: plan.ring, element: plan.spell ?? undefined, heavy: o.heavy || o.big, foot });
    if (plan.cast > 0) castOnto(this.mctx, o.targetId, at, plan.spell, plan.cast);
    if (plan.spell && o.hitIndex === 0) {
      this.stats.spells++;
      spellMoment(this.mctx, plan.spell, o.targetId, a, f);
    }
    if (o.big && o.hitIndex === 0 && f.tier !== 'low') bigMoment(this.mctx, this.special, a, f);
    return { freezeMs: plan.freezeMs, shook: plan.trauma > 0 };
  }

  dissolve(id: CombatantId): void {
    const a = this.d.stage.actor(id);
    const f = this.d.flags();
    if (!a || f.tier === 'low' || f.reduceMotion) return;
    this.stats.sends++;
    const [w] = a.poseSize;
    sendOff(this.pools, this.d.game, a.position.clone(), a.height, Math.max(0.8, w), { pillar: f.tier === 'full', motes: f.tier === 'full' ? 36 : 22 });
  }

  victory(kind: 'pose' | 'hold'): number {
    const f = this.d.flags();
    const plan = planVictory(this.d.game, kind, f, this.d.dial('orbit'));
    if (!plan || !this.d.sub('orbit')) return 0;
    const party = this.d.stage.staged().filter((id) => this.d.stage.sideOf(id) === 'party');
    const pts = party.map((id) => this.d.stage.actor(id)).filter((a): a is PaintedActor => !!a && a.visible);
    if (!pts.length) return 0;
    const pivot = new Vector3();
    for (const a of pts) pivot.add(a.position);
    pivot.multiplyScalar(1 / pts.length);
    pivot.y += 1;
    this.after(VICTORY_LEAD_S, () => {
      this.orbit = { ...plan, t: 0, pivot };
      if (kind === 'pose') {
        for (const a of pts) a.flash(this.d.game === 'ffx' ? 0xffe3a0 : 0xf7b6d9, 1400, 0.42);
        const warm: [number, number, number] = this.d.game === 'ffx' ? [0.9, 0.68, 0.3] : [0.8, 0.32, 0.68];
        this.pools.floor.emit({ pos: [pivot.x, pivot.y - 0.94, pivot.z], life: plan.ms / 1000 + 0.6, color: warm, size: 2.5, sizeEnd: 5.5, shape: 'glow', flat: true, fadeFrom: 0.75 });
        if (plan.sparkleSweep && pts.length > 1) {
          const xs = pts.map((a) => a.headPoint(new Vector3())).sort((p, q) => p.x - q.x);
          this.after((plan.ms / 1000) * 0.35, () => sparkleSweep(this.pools, xs[0]!, xs[xs.length - 1]!));
        }
      }
    });
    return VICTORY_LEAD_S * 1000 + plan.ms;
  }

  // ------------------------------------------------------------ the frame

  /** The dt the field (scene, figures, particles) should see: 0 during a hit-stop. */
  stageDt(dt: number): number {
    const s = this.enabled() ? this.stop.scale(dt) : dt;
    this.stageDtLast = s;
    return s;
  }

  /** After the scene has placed the camera: C's layers, the trauma camera, the victory arc and the pass. */
  update(dt: number): void {
    const on = this.enabled();
    if (!on) {
      // Hidden, not cleared: a capture switches C off for the OFF shot of a frozen frame and back
      // on, and the effect must still be there. Off for longer than 1.5 s, it is cleared.
      if (this.wasOn) {
        this.root.visible = false;
        this.d.pass.enabled = false;
        this.d.splash?.stop();
        this.offAt = performance.now();
      }
      this.wasOn = false;
      return;
    }
    if (!this.wasOn) {
      this.root.visible = true;
      if (this.offAt && performance.now() - this.offAt > 1500) this.clearAll();
    }
    this.wasOn = true;
    const sdt = this.stageDtLast;
    this.stageDtLast = 0;
    this.clock += sdt;
    for (let i = this.timers.length - 1; i >= 0; i--) {
      if (this.timers[i]!.at > this.clock) continue;
      const fn = this.timers.splice(i, 1)[0]!.fn;
      fn();
    }
    const v = this.d.view();
    for (const p of poolsOf(this.pools)) {
      p.setViewport(v.w * v.dpr, v.h * v.dpr);
      p.update(sdt);
    }
    this.fire.update(sdt, this.d.camera);
    this.ice.update(sdt);
    this.shell.update(sdt);
    this.trauma.update(dt);
    this.applyCamera(dt);
    this.updatePass(dt, v);
  }

  private applyCamera(dt: number): void {
    const cam = this.d.camera;
    if (this.orbit) {
      const o = this.orbit;
      o.t += dt * 1000;
      const k = easeInOut(o.t / o.ms);
      this.v.copy(cam.position).sub(o.pivot);
      this.q.setFromAxisAngle(this.w.set(0, 1, 0), ((o.yawDeg * Math.PI) / 180) * k);
      this.v.applyQuaternion(this.q);
      cam.position.copy(o.pivot).add(this.v);
      cam.position.y += o.rise * k;
      cam.quaternion.premultiply(this.q);
      cam.position.lerp(o.pivot, o.push * k);
    }
    if (this.trauma.active && this.d.sub('shake')) {
      const off = this.trauma.offset();
      this.v.set(1, 0, 0).applyQuaternion(cam.quaternion);
      this.w.set(0, 1, 0).applyQuaternion(cam.quaternion);
      cam.position.addScaledVector(this.v, off.x).addScaledVector(this.w, off.y);
      this.v.set(0, 0, -1).applyQuaternion(cam.quaternion);
      cam.position.addScaledVector(this.v, off.dolly * 9);
      cam.rotateZ(off.roll);
    }
    cam.updateMatrixWorld();
  }

  private updatePass(dt: number, v: { w: number; h: number; dpr: number }): void {
    const u = this.d.pass.uniforms;
    let impact = 0;
    if (this.impactFrames.length) {
      impact = this.impactFrames[0]!;
      if (dt > 0) this.impactFrames.shift();
    }
    u['uImpact']!.value = impact;
    if (dt > 0) this.lift = Math.max(0, this.lift - dt * 9);
    u['uLift']!.value = this.lift;
    if (this.hazeTarget && this.haze > 0) {
      const a = this.d.stage.actor(this.hazeTarget);
      const s = a ? this.uvOf(a.centerPoint(this.v)) : null;
      if (s) this.hazeAt.copy(s);
      this.haze = Math.max(0, this.haze - this.stageDtLastFor(dt) * 0.95);
    }
    u['uHaze']!.value = this.haze * (this.d.flags().tier === 'full' ? 1 : 0);
    (u['uHazeCenter']!.value as Vector2).copy(this.hazeAt);
    u['uTime']!.value = this.clock;
    u['uAspect']!.value = v.w / Math.max(1, v.h);
    (u['uTexel']!.value as Vector2).set(1 / Math.max(1, v.w * v.dpr), 1 / Math.max(1, v.h * v.dpr));
    this.d.pass.enabled = impact > 0 || this.lift > 0.001 || (u['uHaze']!.value as number) > 0.001;
  }

  private stageDtLastFor(dt: number): number {
    return this.stop.frozen ? 0 : dt;
  }

  // --------------------------------------------------------------- helpers

  private after(sec: number, fn: () => void): void {
    this.timers.push({ at: this.clock + sec, fn });
  }

  private uvOf(p: Vector3): Vector2 | null {
    const s = this.w.copy(p).project(this.d.camera);
    if (s.z > 1) return null;
    return new Vector2(s.x * 0.5 + 0.5, s.y * 0.5 + 0.5);
  }

  private screenOf(id: CombatantId): { x: number; y: number } | null {
    const a = this.d.stage.actor(id);
    const s = a ? this.uvOf(a.centerPoint(new Vector3())) : null;
    if (!s) return null;
    const v = this.d.view();
    return { x: s.x * v.w, y: (1 - s.y) * v.h };
  }

  private clearAll(): void {
    for (const p of poolsOf(this.pools)) {
      p.clear();
      p.update(0);
    }
    this.fire.clear();
    this.ice.clear();
    this.shell.clear();
    this.stop.clear();
    this.trauma.reset();
    this.orbit = null;
    this.impactFrames = [];
    this.lift = 0;
    this.haze = 0;
    this.timers.length = 0;
    this.d.pass.enabled = false;
    this.d.splash?.stop();
  }

  snapshot(): Record<string, unknown> {
    return {
      ...this.stats,
      clock: Number(this.clock.toFixed(3)),
      frozen: this.stop.frozen,
      trauma: Number(this.trauma.amount.toFixed(3)),
      impact: this.impactFrames.length,
      fire: this.fire.live,
      ice: this.ice.live,
      orbit: this.orbit ? Number((this.orbit.t / this.orbit.ms).toFixed(2)) : null,
      pass: this.d.pass.enabled,
    };
  }

  dispose(): void {
    this.clearAll();
    this.root.removeFromParent();
    for (const p of poolsOf(this.pools)) p.dispose();
    this.fire.dispose();
    this.ice.dispose();
    this.shell.dispose();
  }
}
