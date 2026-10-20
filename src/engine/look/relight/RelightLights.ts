/**
 * Demo looks, light on the paintings: the coloured point lights. Each spell effect that lands (`spellTaps.landListeners`) lights the figures round its target in its own
 * colour (Fire orange, Thunder yellow-white with a flicker, Blizzard cyan, Water blue, Holy and Cure pale gold and green); the item orb lights them green as it
 * rises, flies and bursts (`fx/orbLight.ts`). At most four at once reach the shader (`MAX_POINT_LIGHTS`, the strongest). Positions are the frame's own uv, because the effects are
 * drawn in screen space; a light starts when its blow lands in the drawn effect (`tap.ms`). Both games.
 */
import { Vector3, type Camera } from 'three';
import { orbLights } from '../../fx/orbLight.ts';
import { landListeners, type SpellLandTap } from '../../fx/spellTaps.ts';
import { ORB_COLORS, MAX_POINT_LIGHTS, kindFor, pointEnvelope, type PointKind, type RelightParams } from './RelightConfig.ts';
import { relightCells } from './FigureRelight.ts';

interface Active {
  u: number;
  v: number;
  kind: PointKind;
  /** Seconds of the rig's clock. */
  start: number;
}

interface Candidate {
  u: number;
  v: number;
  s: number;
  c: readonly [number, number, number];
}

const flicker = (t: number): number => {
  const x = Math.sin(Math.floor(t * 30) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export class RelightLights {
  private active: Active[] = [];
  private now = 0;
  private on = false;
  private readonly tmp = new Vector3();
  private readonly listener = (tap: SpellLandTap): void => this.land(tap);
  /** For the debug API and the captures: what the last frame sent to the shader. */
  readonly stats = { count: 0, lights: [] as Array<{ u: number; v: number; s: number }> };

  install(): void {
    if (this.on) return;
    this.on = true;
    landListeners.add(this.listener);
  }

  remove(): void {
    this.on = false;
    landListeners.delete(this.listener);
    this.active = [];
    this.clear();
  }

  private land(tap: SpellLandTap): void {
    const r = tap.rect;
    if (!r || tap.view.w <= 0 || tap.view.h <= 0) return;
    this.active.push({ u: (r.x + r.w / 2) / tap.view.w, v: 1 - (r.y + r.h * 0.45) / tap.view.h, kind: kindFor(tap.fx), start: this.now + Math.max(0, tap.ms) / 1000 });
    if (this.active.length > 16) this.active.shift();
  }

  /** Write this frame's lights into the shared cells. `now` is the rig's clock in seconds. */
  update(now: number, camera: Camera, p: RelightParams): void {
    this.now = now;
    const cand: Candidate[] = [];
    this.active = this.active.filter((a) => now - a.start < a.kind.rise + a.kind.hold + a.kind.decay + 0.05);
    for (const a of this.active) {
      const s = pointEnvelope(now - a.start, a.kind, flicker(now)) * p.point;
      if (s > 0.01) cand.push({ u: a.u, v: a.v, s, c: a.kind.color });
    }
    for (const o of orbLights) {
      if (!o.active) continue;
      const { tone, k } = o.lightNow;
      this.tmp.set(o.orbAt.x, o.orbAt.y, o.orbAt.z).project(camera);
      if (this.tmp.z > 1) continue;
      const s = k * 0.9 * p.point;
      if (s > 0.01) cand.push({ u: this.tmp.x * 0.5 + 0.5, v: this.tmp.y * 0.5 + 0.5, s, c: ORB_COLORS[tone] ?? ORB_COLORS['heal']! });
    }
    cand.sort((a, b) => b.s - a.s);
    const A = relightCells.relightPtA.value;
    const C = relightCells.relightPtC.value;
    this.stats.count = Math.min(MAX_POINT_LIGHTS, cand.length);
    this.stats.lights = [];
    for (let i = 0; i < MAX_POINT_LIGHTS; i++) {
      const c = cand[i];
      if (c) {
        A[i]!.set(c.u, c.v, p.reach, c.s);
        C[i]!.set(c.c[0], c.c[1], c.c[2]);
        this.stats.lights.push({ u: Math.round(c.u * 1000) / 1000, v: Math.round(c.v * 1000) / 1000, s: Math.round(c.s * 100) / 100 });
      } else A[i]!.w = 0;
    }
  }

  /** Every light off. */
  clear(): void {
    for (const a of relightCells.relightPtA.value) a.w = 0;
    this.stats.count = 0;
    this.stats.lights = [];
  }
}
