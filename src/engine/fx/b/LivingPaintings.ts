import { Group, Vector3, type PerspectiveCamera, type Scene } from 'three';
import { artUrl } from '../../PaintedArt.ts';
import type { BattleCamera } from '../../BattleCamera.ts';
import { eyeCandy, type FxTier } from '../EyeCandy.ts';
import { DRIFT_FFX, DRIFT_FFX2, DriftEnvelope, arcTurn, driftAt, easeWeight } from './CameraDrift.ts';
import { DepthPlates, paintPoint } from './DepthPlates.ts';
import { Lamps } from './Lamps.ts';
import { QuadField } from './QuadField.ts';
import { Haze } from './Haze.ts';
import { Figures } from './Figures.ts';
import { FloorReflection } from './FloorReflection.ts';
import { Arcs } from './Arcs.ts';
import { ROOMS } from './ambient/index.ts';
import type { RoomSpec } from './ambient/room.ts';
import { bindMaxMix, releaseMaxMix, updateMaxMix } from '../mix/MaxMix.ts'; // the MAX mix (D-316), every FFX and FFX-2 battle

/**
 * Option B "Living Paintings" (eye-candy options round, 2026-09-29): the paintings breathe in 3D.
 * Switched on by `?fx=b` (or `__pyrefly.fx.set('b', true)`); with no switch nothing here runs and
 * the battle is exactly main's.
 *
 * What it adds, per room (`ambient/*.ts`): B1 depth plates, B2 the arcing camera drift on the
 * idle rig, B3 the room's own air and lights (weather, haze between the plates, lamp flicker and
 * halos, ice and hole shimmer, arcs, lightning), B4 figure sway (sub-switch `sway`, a re-offer),
 * B5 cast shadows (sub-switch `shadow`) and a reflecting floor (sub-switch `reflect`).
 *
 * Tiers: `full`; `phone` (2 plates at 1024, particles 55 %, no reflection, drift x0.6);
 * `low` (Low effects: 2 plates, particles 30 %, no haze, no reflection, no shadows, no sway,
 * flicker x0.5, drift x0.5). **Reduce motion**: no drift, no idle sway, no arcs, no lightning,
 * no sway; the plates, the weather (held still), lamp halos (static), shadows and reflection (still) stay.
 *
 * Game case: FFX rooms (Gagazet, Macalania) and FFX-2 rooms (Bevelle, Djose) each carry their own
 * recipe; FFX-2 drifts a touch faster (ATB pace). Nothing is shared across the games but plumbing.
 */

export interface LivingBind {
  key: string;
  game: string;
  scene: Scene;
  camera: PerspectiveCamera;
  rigName: () => string;
  battleCamera: BattleCamera;
}

const TIER_PARTICLES: Record<FxTier, number> = { full: 1, phone: 0.55, low: 0.3 };
const TIER_DRIFT: Record<FxTier, number> = { full: 1, phone: 0.6, low: 0.5 };

class Living {
  private readonly a: LivingBind;
  private readonly room: RoomSpec;
  private readonly root = new Group();
  private readonly env = new DriftEnvelope();
  private readonly prevRaw = new Vector3();
  private hasPrev = false;
  private built: FxTier | null = null;
  private building = false;
  private plates: DepthPlates | null = null;
  private plateMs = 0;
  private lamps: Lamps[] = [];
  private fields: QuadField[] = [];
  private haze: Haze[] = [];
  private arcs: Arcs | null = null;
  private reflection: FloorReflection | null = null;
  private readonly figures: Figures;
  private time = 0;
  /** The weather's clock: it stops under REDUCE MOTION, so the snow and steam hold still. */
  private weatherT = 0;
  private swayBase: number | null = null;
  private strikeIn = 3;
  private strikeAge = 99;
  private strikes = 0;
  private seed = 11;
  private disposed = false;
  private readonly off: () => void;
  private driftNow = 0;

  constructor(a: LivingBind, room: RoomSpec) {
    this.a = a;
    this.room = room;
    this.root.name = 'fx-b';
    this.root.visible = false;
    a.scene.add(this.root);
    this.figures = new Figures(a.scene, this.root, room.shadow);
    this.off = eyeCandy.onChange(() => this.sync());
    this.sync();
  }

  private get on(): boolean {
    return eyeCandy.enabled('b');
  }

  private backdropGroup(): Group | null {
    return (this.a.scene.getObjectByName('backdrop') as Group | undefined) ?? null;
  }

  private sync(): void {
    if (this.disposed) return;
    const on = this.on;
    const tier = eyeCandy.tier;
    if (on && this.built !== tier && !this.building) void this.build(tier);
    this.root.visible = on;
    this.plates?.show(on && eyeCandy.sub('b', 'plates'));
    for (const l of this.lamps) l.mesh.visible = on;
    if (!on) {
      this.figures.setSway(false);
      this.restoreSway();
    }
  }

  private async build(tier: FxTier): Promise<void> {
    this.building = true;
    this.teardownParts();
    const room = this.room;
    const group = this.backdropGroup();
    const layout = tier === 'full' ? room.plates : room.phonePlates;
    const t0 = performance.now();
    try {
      this.plates = group ? await DepthPlates.build(group, artUrl(`fx/${room.key}/depth.png`), layout) : null;
    } catch (err) {
      console.warn('[fx-b] depth plates unavailable', err);
      this.plates = null;
    }
    this.plateMs = Math.round(performance.now() - t0);
    if (this.disposed) {
      this.plates?.dispose();
      return;
    }
    const plates = this.plates;
    if (plates) {
      plates.meshes.forEach((m, i) => {
        if (plates.floored && i === plates.meshes.length - 1) return;
        if (room.lamps.warm || room.lamps.cool) this.lamps.push(new Lamps(m, plates.textures[i]!, room.lamps));
      });
    }
    const scale = TIER_PARTICLES[tier];
    room.fields.forEach((f, i) => {
      const q = new QuadField(f, scale, i + 3);
      this.fields.push(q);
      this.root.add(q.mesh);
    });
    if (plates && group) {
      const g = plates.geometry;
      const toWorld = (u: number, v: number): Vector3 => {
        const k = plates.plateAt(u, v);
        const z = plates.floored && k === plates.meshes.length - 1 ? plates.zs[Math.max(0, k - 1)]! : plates.zs[k]!;
        return paintPoint(g, u, v, z).add(group.position);
      };
      for (const d of room.lampDust ?? []) {
        const c = toWorld(d.at[0], d.at[1]);
        const f = new QuadField({ ...d.field, min: [c.x - d.box[0] / 2, c.y - d.box[1] / 2, c.z - d.box[2] / 2], size: d.box }, scale, 29);
        this.fields.push(f);
        this.root.add(f.mesh);
      }
      if (room.arcs && tier !== 'low') {
        const at = room.arcs.at.map(([u, v]) => toWorld(u, v).toArray() as [number, number, number]);
        const k = at.length ? Math.abs(at[0]![2] - this.a.camera.position.z) / 30 : 1;
        this.arcs = new Arcs({ ...room.arcs, at, reach: room.arcs.reach * k, width: room.arcs.width * k });
        this.root.add(this.arcs.mesh);
      }
    }
    if (tier !== 'low') {
      room.haze.forEach((h, i) => {
        const hz = new Haze(h, i + 1);
        this.haze.push(hz);
        this.root.add(hz.mesh);
      });
    }
    if (room.reflect && tier === 'full') {
      const ground = this.a.scene.getObjectByName('ground');
      const gp = ground ? ground.getWorldPosition(new Vector3()) : null;
      const center = room.reflect.center ?? (gp ? [gp.x, gp.z] : [0, -4]);
      const size = room.reflect.size ?? [36, 30];
      const canvas = document.querySelector('canvas');
      this.reflection = new FloorReflection({ ...room.reflect, center: center as [number, number], size }, canvas?.width ?? 1600, canvas?.height ?? 900);
      this.root.add(this.reflection.mesh);
    }
    this.built = tier;
    this.building = false;
    this.sync();
  }

  private teardownParts(): void {
    this.plates?.dispose();
    this.plates = null;
    for (const l of this.lamps) l.dispose();
    for (const f of this.fields) f.dispose();
    for (const h of this.haze) h.dispose();
    this.lamps = [];
    this.fields = [];
    this.haze = [];
    this.arcs?.dispose();
    this.arcs = null;
    this.reflection?.dispose();
    this.reflection = null;
  }

  private rnd(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /** Reduce motion zeroes the rig's idle sway while option B is on (main never did). */
  private holdSway(zero: boolean): void {
    const bc = this.a.battleCamera as unknown as { swayAmplitude: number };
    if (zero) {
      if (this.swayBase === null) this.swayBase = bc.swayAmplitude;
      bc.swayAmplitude = 0;
    } else this.restoreSway();
  }

  private restoreSway(): void {
    if (this.swayBase === null) return;
    (this.a.battleCamera as unknown as { swayAmplitude: number }).swayAmplitude = this.swayBase;
    this.swayBase = null;
  }

  update(dt: number): void {
    if (!this.on || this.disposed) return;
    if (this.built !== eyeCandy.tier && !this.building) void this.build(eyeCandy.tier);
    const tier = this.built ?? eyeCandy.tier;
    const rm = eyeCandy.reduceMotion;
    const low = tier === 'low';
    this.time += dt;
    const t = this.time;
    this.holdSway(rm);
    this.drift(dt, rm, tier);

    // REDUCE MOTION keeps the room's weather on screen, held still (D, 2026-09-29: "keep light and
    // weather still"); the drift, the sway, the arcs' crackle and the lightning flash stop.
    if (!rm) this.weatherT += dt;
    const weather = eyeCandy.dial('weather');
    for (const f of this.fields) {
      f.mesh.visible = weather > 0;
      f.update(this.weatherT, weather);
    }
    for (const h of this.haze) {
      h.mesh.visible = weather > 0;
      h.update(this.weatherT, weather);
    }
    const lampGain = eyeCandy.dial('lamps');
    const flicker = rm ? 0 : low ? 0.5 : 1;
    // Reduce motion: the halos stay, but the clock under the flicker and caustics stops.
    for (const l of this.lamps) l.update(rm ? 0 : t, lampGain, flicker, this.plates?.visible ?? false);
    this.arcs?.update(rm ? 0 : dt, rm ? 0 : weather, this.a.camera);
    if (this.arcs) this.arcs.mesh.visible = !rm && weather > 0;
    this.reflection?.update(rm ? 0 : t, low ? 0 : eyeCandy.dial('reflect') * (eyeCandy.sub('b', 'reflect') ? 1 : 0), !rm);
    this.lightning(dt, rm);

    const shadow = low || !eyeCandy.sub('b', 'shadow') ? 0 : eyeCandy.dial('shadow');
    const swayOn = !rm && !low && eyeCandy.sub('b', 'sway');
    this.figures.setSway(swayOn);
    this.figures.update(dt, t, shadow, 0.012 * eyeCandy.dial('sway'));
  }

  private drift(dt: number, rm: boolean, tier: FxTier): void {
    const cam = this.a.camera;
    let moving = false;
    if (dt > 0) {
      if (this.hasPrev) moving = cam.position.distanceTo(this.prevRaw) / dt > 0.25;
      this.prevRaw.copy(cam.position);
      this.hasPrev = true;
    }
    const bc = this.a.battleCamera;
    const rig = this.a.rigName();
    const allowed = !rm && rig === 'idle' && bc.pushAmount === 0 && bc.rollDeg === 0 && !moving && eyeCandy.sub('b', 'drift');
    const w = easeWeight(this.env.update(dt, allowed)) * eyeCandy.dial('drift') * TIER_DRIFT[tier];
    this.driftNow = w;
    if (w <= 0) return;
    const d = driftAt(this.time, this.room.game === 'ffx2' ? DRIFT_FFX2 : DRIFT_FFX, w);
    const q = cam.quaternion;
    const right = new Vector3(1, 0, 0).applyQuaternion(q);
    const up = new Vector3(0, 1, 0).applyQuaternion(q);
    const fwd = new Vector3(0, 0, -1).applyQuaternion(q);
    cam.position.addScaledVector(right, d.x).addScaledVector(up, d.y).addScaledVector(fwd, d.z);
    const look = bc.getRig(rig)?.lookAt;
    const dist = look ? cam.position.distanceTo(look instanceof Vector3 ? look : new Vector3(...look)) : 11;
    const turn = arcTurn(d.x, d.y, dist);
    cam.rotateY(turn.yaw);
    cam.rotateX(turn.pitch);
    cam.updateMatrixWorld();
  }

  private lightning(dt: number, rm: boolean): void {
    const L = this.room.lightning;
    const plates = this.plates;
    if (!L || !plates) return;
    if (rm || eyeCandy.dial('weather') <= 0) {
      for (let i = 0; i < plates.meshes.length; i++) plates.lift(i, 1, 1, 1);
      return;
    }
    this.strikeIn -= dt;
    this.strikeAge += dt;
    if (this.strikeIn <= 0) {
      this.strikeIn = L.every[0] + this.rnd() * (L.every[1] - L.every[0]);
      this.strikeAge = 0;
      this.strikes++;
    }
    // Two quick pulses (about two frames each), then a short tail.
    const a = this.strikeAge;
    const env = a < 0.05 ? 1 : a < 0.1 ? 0.25 : a < 0.15 ? 0.8 : Math.max(0, 0.8 * (1 - (a - 0.15) / 0.3));
    const k = L.peak * env;
    for (let i = 0; i < plates.meshes.length; i++) plates.lift(i, 1 + k * L.tint[0], 1 + k * L.tint[1], 1 + k * L.tint[2]);
  }

  stats(): Record<string, unknown> {
    return {
      room: this.room.key,
      game: this.room.game,
      tier: this.built,
      plates: this.plates ? { count: this.plates.meshes.length, coverage: this.plates.coverage, buildMs: this.plateMs, floored: this.plates.floored } : null,
      lamps: this.lamps.length,
      fields: this.fields.map((f) => `${f.spec.shape}:${(f.mesh.geometry as { instanceCount?: number }).instanceCount ?? 0}`),
      haze: this.haze.length,
      arcs: !!this.arcs,
      reflection: !!this.reflection,
      figures: this.figures.count,
      drift: Math.round(this.driftNow * 100) / 100,
      strikes: this.strikes,
      time: Math.round(this.time * 100) / 100,
    };
  }

  dispose(): void {
    this.disposed = true;
    this.off();
    this.restoreSway();
    this.figures.dispose();
    this.teardownParts();
    this.root.removeFromParent();
  }
}

let current: Living | null = null;
let pending: { a: LivingBind; room: RoomSpec; stop: () => void } | null = null;

/**
 * Called by `BattleScreen` once the diorama is loaded. Nothing is built, added or listened to
 * beyond one switch listener until option B is actually on, so a build without `?fx=b` renders
 * exactly as main. A room option B does not know is left alone.
 */
export function bindLivingScene(a: LivingBind): void {
  releaseLivingScene();
  bindMaxMix(a);
  const room = ROOMS[a.key];
  if (!room) return;
  const start = (): void => {
    if (current || !pending || !eyeCandy.enabled('b')) return;
    const p = pending;
    p.stop();
    pending = null;
    current = new Living(p.a, p.room);
  };
  pending = { a, room, stop: eyeCandy.onChange(start) };
  start();
}

/** Every frame, after the rig has placed the camera and before the render. */
export function updateLivingScene(dt: number): void {
  current?.update(dt);
  updateMaxMix(dt);
}

export function releaseLivingScene(): void {
  releaseMaxMix();
  pending?.stop();
  pending = null;
  current?.dispose();
  current = null;
}

/** `__pyrefly.fx.snapshot().b`. */
export function livingStats(): Record<string, unknown> | null {
  return current?.stats() ?? null;
}

/** For tests: which rooms option B dresses. */
export function livingRooms(): string[] {
  return Object.keys(ROOMS);
}
