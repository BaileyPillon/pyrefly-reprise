/**
 * The livelier item toss (motion pass, lane "fx"; Bailey 2026-10-22: "items (Potion/Hi-Potion/Phoenix Down + the orb toss livelier: trails, a shockwave ring, sparks)"; `spellfx/FxSwitch.ts`).
 * It rides on the item light that already ships (`ItemOrbFx.ts`, the one effect Bailey said he likes) and changes none of its timing: it only reads the light's `phase` and `orbAt` each frame and
 * adds, in the same additive sprite pass:
 *
 * - **FFX (the orb): a painted comet trail** behind the orb in flight (a tapered brush stroke through where the orb has been, 14 segments, thinning toward the tail), and
 * - **both games: a burst** when the light lands on its target (the orb's burst on an ally, FFX-2's spark and its burst on an ally or the user): two shockwave rings that burst outward on an
 *   ease-out and thin as they fade, a ripple on the ground under the target, painted sparks on eased paths drawn as strokes that stretch while they are fast, and a few dabs of paint.
 *
 * Game case (rule 14): FFX's orb gets the trail; FFX-2's spark keeps its source: a small white-blue spark, no trail (`docs/handoff/anim-orb-ship.md`; secondhand, the report did not land), so it gets
 * the burst only. The burst's shapes are [ours]; the gesture itself is sourced ([M], `research/re-ffx-party-motion-timing.md` section 6).
 *
 * The frame-time guard thins it first (`FxPerfGuard.fxShare`: sparks, then the trail), and REDUCE MOTION / LOW EFFECTS never reach it (the presenter draws no gesture then, `BattlePresenterItem.ts`).
 * Deterministic: a fixed pseudo-random sequence, no `Math.random`. The two painted textures are drawn once in a 2D canvas (none in a unit test, where the sprites draw nothing).
 */
import { AdditiveBlending, CanvasTexture, Group, LinearFilter, SRGBColorSpace, Sprite, SpriteMaterial, Vector3, type Object3D, type Texture } from 'three';
import { fxShare } from '../spellfx/FxPerfGuard.ts';
import { outCubic, outExpo, outQuart } from '../spellfx/fxMath.ts';
import { lcg, paintShape } from './ItemOrbShapes.ts';
import type { ItemOrbFx } from './ItemOrbFx.ts';

const ORDER = 1000;
const TRAIL = 14;
const SPARKS = 18;
const DABS = 6;
/** The comet trail's points are this far apart in time at every frame rate (review m1): 14 gaps are 0.233 s of the orb's travel, the length the trail has at 60 Hz. */
const TRAIL_STEP = 1 / 60;

const COLORS: Readonly<Record<string, { halo: number; core: number; spark: number }>> = {
  heal: { halo: 0x3fe27a, core: 0xf2fff4, spark: 0xb8ffcc },
  foe: { halo: 0xffa63d, core: 0xfff6e4, spark: 0xffe2a6 },
  spark: { halo: 0x9fd8ff, core: 0xffffff, spark: 0xdff0ff },
};

/** A painted comet drawn once: a round bright head at +x, a tail tapering to a point at -x, and a few bristle lines through it. Null where there is no 2D canvas. */
function paintComet(): Texture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 32;
  const g = c.getContext('2d');
  if (!g) return null;
  const r = lcg(0xc0de);
  const grad = g.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(0, 16);
  g.quadraticCurveTo(70, 2, 116, 5);
  g.arc(116, 16, 11, -Math.PI / 2, Math.PI / 2);
  g.quadraticCurveTo(70, 30, 0, 16);
  g.fill();
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 7; i++) {
    g.strokeStyle = `rgba(0,0,0,${0.18 + 0.3 * r()})`;
    g.lineWidth = 0.7 + r();
    g.beginPath();
    g.moveTo(8 + 30 * r(), 4 + 24 * r());
    g.lineTo(100 + 26 * r(), 4 + 24 * r());
    g.stroke();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.minFilter = LinearFilter;
  return t;
}

/** A painted ring drawn once: a stroke of uneven weight with a soft halo. Null where there is no 2D canvas. */
function paintRing(): Texture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (!g) return null;
  const r = lcg(0x91d6);
  g.translate(64, 64);
  const n = 64;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1.15) / n) * Math.PI * 2;
    g.strokeStyle = `rgba(255,255,255,${0.55 + 0.45 * r()})`;
    g.lineWidth = 3 + 3.2 * r();
    g.beginPath();
    g.arc(0, 0, 52 + 4 * (r() - 0.5), a0, a1);
    g.stroke();
  }
  g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.lineWidth = 12;
  g.beginPath();
  g.arc(0, 0, 52, 0, Math.PI * 2);
  g.stroke();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.minFilter = LinearFilter;
  return t;
}

interface Spark {
  s: Sprite;
  ang: number;
  dist: number;
  life: number;
  grav: number;
  thick: number;
}

export class OrbFlourish {
  readonly group = new Group();
  /** The figure's size in 1.8-unit figures (set by the stage when a gesture starts). */
  unit = 1;
  private readonly tex = { comet: paintComet(), ring: paintRing(), glow: paintShape('glow') };
  private readonly mats: SpriteMaterial[] = [];
  private readonly trail: Sprite[] = [];
  private readonly rings: Sprite[] = [];
  private readonly ripple: Sprite;
  private readonly sparks: Spark[] = [];
  private readonly dabs: Sprite[] = [];
  private readonly hist: Vector3[] = [];
  /** The orb's place at each frame of the flight (newest last), and the flight's clock in seconds: the trail's points are read off it at fixed ages. */
  private readonly track: Array<{ t: number; v: Vector3 }> = [];
  private clock = 0;
  private readonly burstAt = new Vector3();
  private readonly rand = lcg(0x7e57);
  private prev = 'rest';
  private burstT = -1;
  private tone = 'heal';
  private nSparks = SPARKS;

  constructor() {
    for (let i = 0; i < TRAIL; i++) this.trail.push(this.sprite(this.tex.comet));
    for (let i = 0; i < 2; i++) this.rings.push(this.sprite(this.tex.ring));
    this.ripple = this.sprite(this.tex.ring);
    for (let i = 0; i < SPARKS; i++) this.sparks.push({ s: this.sprite(this.tex.comet), ang: 0, dist: 0, life: 1, grav: 0, thick: 0 });
    for (let i = 0; i < DABS; i++) this.dabs.push(this.sprite(this.tex.glow));
    this.group.visible = false;
    this.group.renderOrder = ORDER;
  }

  private sprite(map: Texture | null): Sprite {
    const m = new SpriteMaterial({ map, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, blending: AdditiveBlending, opacity: 0 });
    this.mats.push(m);
    const s = new Sprite(m);
    s.renderOrder = ORDER;
    s.visible = false;
    this.group.add(s);
    return s;
  }

  /** A stroke sprite from `a` (the tail) to `b` (the head): positioned between them, as long as they are apart, turned along them. */
  private stroke(s: Sprite, a: Vector3, b: Vector3, thick: number, opacity: number, color: number): void {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    s.visible = opacity > 0.01 && thick > 0;
    if (!s.visible) return;
    s.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, b.z);
    const l = Math.max(len * 1.25, thick * 1.1);
    s.scale.set(l, thick, 1);
    s.material.rotation = Math.atan2(b.y - a.y, b.x - a.x);
    s.material.opacity = Math.min(1, opacity);
    s.material.color.setHex(color);
  }

  private ring(s: Sprite, at: Vector3, size: number, squash: number, opacity: number, color: number): void {
    s.visible = opacity > 0.01 && size > 0;
    if (!s.visible) return;
    s.position.set(at.x, at.y, at.z);
    s.scale.set(size, size * squash, 1);
    s.material.rotation = 0;
    s.material.opacity = Math.min(1, opacity);
    s.material.color.setHex(color);
  }

  private beginBurst(at: Vector3, tone: string): void {
    this.burstAt.copy(at);
    this.burstT = 0;
    this.tone = tone;
    const u = this.unit;
    this.nSparks = Math.max(4, Math.round(SPARKS * fxShare.particles));
    for (let i = 0; i < SPARKS; i++) {
      const sp = this.sparks[i]!;
      sp.ang = this.rand() * Math.PI * 2;
      sp.dist = (0.45 + 0.75 * this.rand()) * u;
      sp.life = 360 + 280 * this.rand();
      sp.grav = (1.5 + this.rand()) * u;
      sp.thick = (0.035 + 0.03 * this.rand()) * u;
    }
    for (const d of this.dabs) d.userData['a'] = this.rand() * Math.PI * 2;
  }

  /** The place spark `sp` is at, `u` of its life in (writes `out`). */
  private sparkAt(sp: Spark, u: number, out: Vector3): Vector3 {
    const e = outQuart(u);
    const age = (u * sp.life) / 1000;
    return out.set(this.burstAt.x + Math.cos(sp.ang) * sp.dist * e, this.burstAt.y + Math.sin(sp.ang) * sp.dist * e * 0.9 - 0.5 * sp.grav * age * age, this.burstAt.z + 0.02);
  }

  private readonly a = new Vector3();
  private readonly b = new Vector3();

  /** Advance by `dt` seconds of the effect clock, following `fx`; keeps the group under `parent` (the scene). */
  update(dt: number, fx: Pick<ItemOrbFx, 'phase' | 'orbAt' | 'lightNow'>, parent: Object3D | null): void {
    const phase = fx.phase;
    const tone = fx.lightNow.tone;
    if (parent && this.group.parent !== parent) parent.add(this.group);
    const ms = dt * 1000;
    // The comet trail: FFX's orb only (the spark has none, by its source).
    if (phase === 'flight' && tone !== 'spark') {
      this.clock += dt;
      this.record(fx.orbAt);
      this.layTrail();
      this.drawTrail(tone);
    } else if (this.hist.length || this.track.length) {
      this.hist.length = 0;
      this.track.length = 0;
      this.clock = 0;
      for (const s of this.trail) s.visible = false;
    }
    if ((this.prev === 'flight' || this.prev === 'sparkle') && phase === 'burst') this.beginBurst(new Vector3(fx.orbAt.x, fx.orbAt.y, fx.orbAt.z), tone);
    this.prev = phase;
    if (this.burstT >= 0) this.drawBurst(ms);
    this.group.visible = this.hist.length > 0 || this.burstT >= 0;
  }

  /** This frame's place of the orb (the oldest frame nothing reads any more is dropped and its slot reused). */
  private record(at: { x: number; y: number; z: number }): void {
    const old = this.track.length > 2 && this.track[1]!.t <= this.clock - TRAIL * TRAIL_STEP ? this.track.shift()! : { t: 0, v: new Vector3() };
    old.t = this.clock;
    old.v.set(at.x, at.y, at.z);
    this.track.push(old);
  }

  /** The trail's points: the orb's place `i * TRAIL_STEP` seconds ago (between the two frames either side of that time), as far back as the flight has lasted. */
  private layTrail(): void {
    const tr = this.track;
    let j = tr.length - 1;
    let n = 0;
    for (let i = 0; i <= TRAIL; i++) {
      const t = this.clock - i * TRAIL_STEP;
      if (t < tr[0]!.t) break;
      while (j > 0 && tr[j]!.t > t) j--;
      const a = tr[j]!;
      const b = tr[j + 1];
      const v = (this.hist[n] ??= new Vector3());
      if (b && b.t > a.t) v.lerpVectors(a.v, b.v, (t - a.t) / (b.t - a.t));
      else v.copy(a.v);
      n++;
    }
    this.hist.length = n;
  }

  private drawTrail(tone: string): void {
    const c = COLORS[tone] ?? COLORS['heal']!;
    const n = Math.min(TRAIL, Math.max(0, Math.round(TRAIL * fxShare.trails)));
    for (let i = 0; i < TRAIL; i++) {
      const s = this.trail[i]!;
      const head = this.hist[i];
      const tail = this.hist[i + 1];
      if (i >= n || !head || !tail) {
        s.visible = false;
        continue;
      }
      const f = 1 - i / TRAIL; // the head end is thick and bright
      this.stroke(s, tail, head, (0.2 * f + 0.02) * this.unit, 0.85 * f * f + 0.05, i < 3 ? c.core : c.halo);
    }
  }

  private drawBurst(ms: number): void {
    this.burstT += ms;
    const u = this.unit;
    const c = COLORS[this.tone] ?? COLORS['heal']!;
    const k = this.burstT / 460;
    this.ring(this.rings[0]!, this.burstAt, (0.12 + 1.6 * outExpo(k)) * u, 1, 0.9 * Math.pow(Math.max(0, 1 - k), 1.5), c.halo);
    const k2 = (this.burstT - 90) / 460;
    this.ring(this.rings[1]!, this.burstAt, (0.1 + 1.05 * outExpo(k2)) * u, 1, k2 > 0 ? 0.75 * Math.pow(Math.max(0, 1 - k2), 1.5) : 0, c.core);
    const g = new Vector3(this.burstAt.x, this.burstAt.y - 0.85 * u, this.burstAt.z - 0.02);
    const k3 = (this.burstT - 40) / 520;
    this.ring(this.ripple, g, (0.2 + 1.9 * outExpo(k3)) * u, 0.28, k3 > 0 ? 0.7 * Math.pow(Math.max(0, 1 - k3), 1.4) : 0, c.spark);
    let alive = k < 1 || k2 < 1 || k3 < 1;
    for (let i = 0; i < SPARKS; i++) {
      const sp = this.sparks[i]!;
      const f = this.burstT / sp.life;
      if (i >= this.nSparks || f >= 1) {
        sp.s.visible = false;
        continue;
      }
      alive = true;
      this.sparkAt(sp, f, this.b);
      this.sparkAt(sp, Math.max(0, f - 0.09), this.a);
      this.stroke(sp.s, this.a, this.b, sp.thick * (1 - 0.45 * f), (1 - f * f) * 0.95, i % 3 === 0 ? c.core : c.spark);
    }
    for (let i = 0; i < DABS; i++) {
      const d = this.dabs[i]!;
      const f = this.burstT / 520;
      if (f >= 1 || i >= Math.ceil(DABS * fxShare.particles)) {
        d.visible = false;
        continue;
      }
      alive = true;
      const a = d.userData['a'] as number;
      d.visible = true;
      d.position.set(this.burstAt.x + Math.cos(a) * 0.5 * u * outCubic(f), this.burstAt.y + Math.sin(a) * 0.42 * u * outCubic(f) - 0.2 * u * f * f, this.burstAt.z + 0.03);
      d.scale.set(0.09 * u * (1 - 0.5 * f), 0.09 * u * (1 - 0.5 * f), 1);
      d.material.opacity = 0.85 * (1 - f * f);
      d.material.color.setHex(c.spark);
    }
    if (!alive) this.hide();
  }

  /** Put it all away (the gesture was cut short, or the burst is over). */
  hide(): void {
    this.burstT = -1;
    this.hist.length = 0;
    this.track.length = 0;
    this.clock = 0;
    this.prev = 'rest';
    this.group.visible = false;
    for (const o of this.group.children) o.visible = false;
  }

  /** True while any of it is on screen. */
  get active(): boolean {
    return this.group.visible;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.mats) m.dispose();
    for (const t of Object.values(this.tex)) t?.dispose();
  }
}
