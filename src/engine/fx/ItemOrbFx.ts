/**
 * The light of an FFX item use (`BattlePresenterItem.ts`; FFX only; presentation only): additive glow sprites, no model. The game draws no flask and no object when an item is used (measured on the Steam copy,
 * `research/re-ffx-party-motion-timing.md` section 6): on an ally an orb of green light rises from the user's hand, is tossed overhand, arcs to the target and bursts into sparkles on it; on the user, glow particles
 * rise around the figure. (Ported from pass 2 of the animation prototype, which Bailey liked: "I like the orb toss".)
 *
 * One `ItemOrbFx` a stage, parented to the scene on its first frame. `toss` and `glow` start a timeline (the hand, the target and the figure's feet are read each frame through the getters, so a figure that bobs
 * or a rig that moves its arm carries the light with it); `update` advances it by seconds of the effect clock. Sprites draw over the figure and the target (no depth test). Deterministic: a fixed
 * pseudo-random sequence for the burst and the risers, no `Math.random`. No texture is loaded: the three shapes (a soft glow, a ring, a four-point star) are drawn once in a 2D canvas, or left out where there is none (a unit test).
 */
import { AdditiveBlending, Group, Sprite, SpriteMaterial, Vector3, type Object3D } from 'three';
import { lcg, paintShape, type Shape } from './ItemOrbShapes.ts';
import { orbLights } from './orbLight.ts';

export interface P3 {
  x: number;
  y: number;
  z: number;
}

export type ItemTone = 'heal' | 'foe';
/** `orb`: FFX's green orb (a held orb that swells over the hand, a toss with a trail, a glow around the user). `spark`: FFX-2's quick small toss of a white-blue spark with no trail, and just a white-blue burst on the user. */
export type ItemStyle = 'orb' | 'spark';

const TONES: Readonly<Record<ItemTone | 'spark', { halo: number; core: number; spark: number }>> = {
  heal: { halo: 0x3fe27a, core: 0xf2fff4, spark: 0xb8ffcc },
  foe: { halo: 0xffa63d, core: 0xfff6e4, spark: 0xffe2a6 },
  spark: { halo: 0x9fd8ff, core: 0xffffff, spark: 0xdff0ff }, // FFX-2: white-blue
};

const SPARKS = 10;
const TRAIL = 9;
const BITS = 16;
const RISERS = 22;
const ORDER = 999;
const BURST_MS = 620;
const AURA_MS = 1500;

interface Bit {
  s: Sprite;
  v: Vector3;
  life: number;
  max: number;
}

/** What `toss` takes: the live hand and target, the times (milliseconds of the effect clock), the colours, the figure's size in 1.8-unit figures. */
export interface TossSpec {
  hand: () => P3;
  target: () => P3;
  formMs: number;
  flightMs: number;
  tone: ItemTone;
  /** Default `orb`. */
  style?: ItemStyle;
  unit: number;
}

/** What `sparkle` takes: the live middle of the user, the time before the burst (milliseconds of the effect clock), the figure's size in 1.8-unit figures. */
export interface SparkleSpec {
  at: () => P3;
  formMs: number;
  unit: number;
}

/** What `glow` takes: the live hand, the figure's feet and height (world units), the time the hand glow forms, the colours, the size. */
export interface GlowSpec {
  hand: () => P3;
  feet: () => P3;
  height: number;
  formMs: number;
  tone: ItemTone;
  unit: number;
}

type Mode = 'rest' | 'form' | 'flight' | 'burst' | 'self' | 'sparkle';

export class ItemOrbFx {
  readonly group = new Group();
  private readonly tex = { glow: paintShape('glow'), ring: paintShape('ring'), star: paintShape('star') };
  private readonly mats: SpriteMaterial[] = [];
  private readonly halo: Sprite;
  private readonly core: Sprite;
  private readonly sparks: Sprite[] = [];
  private readonly trail: Sprite[] = [];
  private readonly flashS: Sprite;
  private readonly ring: Sprite;
  private readonly bits: Bit[] = [];
  private readonly risers: Bit[] = [];
  private readonly glowTall: Sprite;
  private readonly orb = new Vector3();
  private readonly from = new Vector3();
  private readonly to = new Vector3();
  private readonly tmp = new Vector3();
  private readonly rand = lcg(0x51f7);
  private mode: Mode = 'rest';
  private spec: TossSpec | null = null;
  private sparkSpec: SparkleSpec | null = null;
  /** The colours of the burst in play (set when the toss or the sparkle starts). */
  private pal: ItemTone | 'spark' = 'heal';
  private selfSpec: GlowSpec | null = null;
  private clock = 0;
  private t = 0;
  private trailTimer = 0;
  private burstT = 0;
  private auraT = -1;
  private auraBegun = false;
  private unit = 1;

  constructor() {
    this.halo = this.sprite('glow', 0x3fe27a);
    this.core = this.sprite('glow', 0xf2fff4);
    for (let i = 0; i < SPARKS; i++) this.sparks.push(this.sprite('star', 0xb8ffcc));
    for (let i = 0; i < TRAIL; i++) this.trail.push(this.sprite('glow', 0x3fe27a));
    this.flashS = this.sprite('glow', 0xffffff);
    this.ring = this.sprite('ring', 0xffffff);
    for (let i = 0; i < BITS; i++) this.bits.push({ s: this.sprite('star', 0xb8ffcc), v: new Vector3(), life: 0, max: 1 });
    for (let i = 0; i < RISERS; i++) this.risers.push({ s: this.sprite('star', 0xb8ffcc), v: new Vector3(), life: 0, max: 1 });
    this.glowTall = this.sprite('glow', 0x3fe27a);
    this.group.visible = false;
    this.group.renderOrder = ORDER;
    orbLights.add(this); // demo looks: the figures near it are lit (`orbLight.ts`)
  }

  private sprite(kind: Shape, color: number): Sprite {
    const m = new SpriteMaterial({ map: this.tex[kind], color, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, blending: AdditiveBlending, opacity: 0 });
    this.mats.push(m);
    const s = new Sprite(m);
    s.renderOrder = ORDER;
    s.visible = false;
    this.group.add(s);
    return s;
  }

  /** True while any of it is on screen or still to come. */
  get active(): boolean { return this.mode !== 'rest'; }

  /** Where the orb is now (the hand plus its rise, in flight the arc, after it lands the target): for the tests and the debug snapshot. */
  get orbAt(): P3 {
    return this.mode === 'burst' ? this.to : this.orb;
  }

  get phase(): Mode {
    return this.mode;
  }
  /** Demo looks: its colours and how strongly it is lit (`orbLight.ts`). */
  get lightNow(): { tone: ItemTone | 'spark'; k: number } { return { tone: this.pal, k: this.mode === 'burst' ? Math.max(0, 1 - this.burstT / BURST_MS) : this.mode === 'form' || this.mode === 'self' ? 0.55 : 1 }; }

  private set(s: Sprite, p: Vector3 | P3, size: number, opacity: number, color?: number): void {
    s.visible = opacity > 0.005 && size > 0;
    if (!s.visible) return;
    s.position.set(p.x, p.y, p.z);
    s.scale.set(size, size, 1);
    s.material.opacity = Math.min(1, opacity);
    if (color !== undefined) s.material.color.setHex(color);
  }

  /** An orb forms over the hand, is tossed to the target and bursts on it. */
  toss(spec: TossSpec): void {
    this.hide();
    this.spec = spec;
    this.pal = spec.style === 'spark' ? 'spark' : spec.tone;
    this.unit = Math.max(0.2, spec.unit);
    this.mode = 'form';
    this.t = 0;
    this.group.visible = true;
  }

  /** A small glow forms at the hand, then glow particles rise around the figure (an item used on the user). */
  glow(spec: GlowSpec): void {
    this.hide();
    this.selfSpec = spec;
    this.unit = Math.max(0.2, spec.unit);
    this.mode = 'self';
    this.t = 0;
    this.auraT = -1;
    this.auraBegun = false;
    this.group.visible = true;
  }

  /** FFX-2's item on the user: nothing in the hand, a white-blue burst on the user after `formMs`. */
  sparkle(spec: SparkleSpec): void {
    this.hide();
    this.sparkSpec = spec;
    this.pal = 'spark';
    this.unit = Math.max(0.2, spec.unit);
    this.mode = 'sparkle';
    this.t = 0;
    this.group.visible = true;
  }

  /** The rising glow begins: every riser gets its place around the figure's feet and a staggered start. */
  private beginAura(): void {
    const spec = this.selfSpec!;
    const at = spec.feet();
    this.auraBegun = true;
    this.auraT = 0;
    for (const r of this.risers) {
      const a = this.rand() * Math.PI * 2;
      const rad = (0.12 + 0.3 * this.rand()) * this.unit;
      r.s.position.set(at.x + Math.cos(a) * rad, at.y + this.rand() * spec.height * 0.7, at.z + 0.05);
      r.v.set(0, (0.45 + 0.5 * this.rand()) * this.unit, 0);
      r.max = 700 + 500 * this.rand();
      r.life = -this.rand() * 350;
    }
  }

  /** Put everything away (the action was cut short, or a new one begins). */
  hide(): void {
    this.mode = 'rest';
    this.spec = null;
    this.sparkSpec = null;
    this.selfSpec = null;
    this.auraT = -1;
    this.auraBegun = false;
    this.group.visible = false;
    for (const m of this.mats) m.opacity = 0;
    for (const o of this.group.children) o.visible = false;
  }

  /** The held orb (or the user's hand glow): `level` 0..1 and up, `lift` the rise over the hand in world units, `scale` a multiplier on the whole. */
  private gather(hand: P3, level: number, lift: number, tone: ItemTone, scale: number): void {
    const L = Math.max(0, level);
    const c = TONES[tone];
    const u = this.unit * scale;
    this.orb.set(hand.x, hand.y + lift * this.unit, hand.z + 0.05);
    const flick = 1 + 0.07 * Math.sin(this.clock * 17) + 0.04 * Math.sin(this.clock * 41);
    this.set(this.halo, this.orb, (0.16 + 0.5 * L) * u * flick, 0.75 * Math.min(1.1, L * 1.3), c.halo);
    this.set(this.core, this.orb, (0.05 + 0.13 * Math.min(1.3, L)) * u * flick, Math.min(0.85, L * 1.4), c.core); // the game's bloom streaks a full-white core: kept just under
    const n = Math.round(Math.min(1, L) * SPARKS);
    for (let i = 0; i < SPARKS; i++) {
      if (i >= n) {
        this.sparks[i]!.visible = false;
        continue;
      }
      const a = this.clock * (1.7 + (i % 3) * 0.55) * (i % 2 ? 1 : -1) + i * 2.4;
      const r = (0.1 + (0.16 * ((i * 7) % 5)) / 4) * u * (0.55 + 0.6 * Math.min(1.2, L));
      this.set(
        this.sparks[i]!,
        { x: this.orb.x + Math.cos(a) * r, y: this.orb.y + Math.sin(a * 1.3) * r * 0.9, z: this.orb.z },
        (0.025 + 0.02 * ((i + 1) % 3)) * this.unit * (0.7 + 0.5 * Math.sin(this.clock * 9 + i)),
        0.9 * Math.min(1, L),
        c.spark,
      );
    }
  }

  private startFlight(): void {
    const s = this.spec!;
    this.from.copy(this.orb);
    this.to.copy(toV(s.target(), this.tmp));
    this.to.z += 0.05;
    this.t = 0;
    this.trailTimer = 0;
    this.mode = 'flight';
    for (const sp of this.sparks) sp.visible = false;
  }

  private startBurst(): void {
    this.mode = 'burst';
    this.burstT = 0;
    const c = TONES[this.pal];
    for (const t of this.trail) t.visible = false;
    this.core.visible = this.halo.visible = false;
    for (const b of this.bits) {
      const a = this.rand() * Math.PI * 2;
      const sp = (0.35 + 0.8 * this.rand()) * this.unit;
      b.s.position.copy(this.to);
      b.v.set(Math.cos(a) * sp, Math.sin(a) * sp * 0.8 + 0.5 * this.unit, 0);
      b.max = 500 + 450 * this.rand();
      b.life = 0;
      b.s.material.color.setHex(c.spark);
    }
  }

  /** Advance by `dt` seconds of the effect clock and keep the group under `parent` (the scene). */
  update(dt: number, parent: Object3D | null): void {
    if (this.mode === 'rest') return;
    if (parent && this.group.parent !== parent) parent.add(this.group);
    this.clock += dt;
    const ms = dt * 1000;
    const u = this.unit;
    if (this.mode === 'form' && this.spec) {
      this.t += ms;
      const k = Math.min(1, this.t / Math.max(1, this.spec.formMs));
      const level = 1 - (1 - k) * (1 - k); // eases out: it swells fast and settles
      if (this.spec.style === 'spark') this.orb.copy(toV(this.spec.hand(), this.tmp)); // FFX-2: the gesture shows nothing until the spark is let go
      else this.gather(this.spec.hand(), level, 0.04 + 0.1 * level, this.spec.tone, 1);
      if (this.t >= this.spec.formMs) this.startFlight();
    } else if (this.mode === 'flight' && this.spec) {
      this.t += ms;
      const k = Math.min(1, this.t / Math.max(1, this.spec.flightMs));
      const spark = this.spec.style === 'spark';
      const c = TONES[this.pal];
      this.to.copy(toV(this.spec.target(), this.tmp)); // the target is read live: a figure that sways carries the landing with it
      this.to.z += 0.05;
      const e = k * (2 - k) * 0.4 + k * 0.6; // leaves fast
      this.orb.lerpVectors(this.from, this.to, e);
      this.orb.y += 4 * (spark ? 0.1 : 0.16 + 0.2 * this.from.distanceTo(this.to) * 0.5) * u * k * (1 - k); // the arc (a spark's is a short low lob)
      this.set(this.halo, this.orb, (spark ? 0.2 : 0.5) * u * (1 - 0.3 * k), 0.8, c.halo);
      this.set(this.core, this.orb, (spark ? 0.075 : 0.17) * u * (1 - 0.3 * k), 1, c.core);
      if (spark) {
        if (k >= 1) this.startBurst();
        return;
      }
      this.trailTimer += ms;
      if (this.trailTimer >= 22) {
        this.trailTimer = 0;
        for (let i = TRAIL - 1; i > 0; i--) this.trail[i]!.position.copy(this.trail[i - 1]!.position);
        this.trail[0]!.position.copy(this.orb);
      }
      for (let i = 0; i < TRAIL; i++) {
        const t = this.trail[i]!;
        const f = 1 - (i + 1) / (TRAIL + 1);
        const live = this.t > 22 * (i + 1);
        t.visible = live;
        if (live) {
          t.scale.set(0.3 * u * f, 0.3 * u * f, 1);
          t.material.opacity = 0.6 * f;
          t.material.color.setHex(c.halo);
        }
      }
      if (k >= 1) this.startBurst();
    } else if (this.mode === 'sparkle' && this.sparkSpec) {
      this.t += ms;
      if (this.t >= this.sparkSpec.formMs) {
        this.to.copy(toV(this.sparkSpec.at(), this.tmp));
        this.to.z += 0.05;
        this.startBurst();
      }
    } else if (this.mode === 'burst') {
      this.burstT += ms;
      const k = Math.min(1, this.burstT / BURST_MS);
      const c = TONES[this.pal];
      this.set(this.flashS, this.to, (0.22 + 0.7 * k) * u, 0.95 * (1 - k) * (1 - k), c.core);
      this.set(this.ring, this.to, (0.1 + 1.1 * (1 - (1 - k) * (1 - k))) * u, 0.9 * (1 - k), c.halo);
      let alive = false;
      for (const b of this.bits) {
        b.life += ms;
        const r = b.life / b.max;
        if (r < 1) {
          alive = true;
          b.v.y -= dt * 1.3 * u;
          b.s.position.addScaledVector(b.v, dt);
          b.s.visible = true;
          b.s.scale.set(0.07 * u * (1 - 0.5 * r), 0.07 * u * (1 - 0.5 * r), 1);
          b.s.material.opacity = (1 - r) * (0.7 + 0.3 * Math.sin(this.clock * 40 + b.max));
        } else b.s.visible = false;
      }
      if (k >= 1 && !alive) this.hide();
    } else if (this.mode === 'self' && this.selfSpec) {
      this.t += ms;
      const s = this.selfSpec;
      const k = Math.min(1, this.t / Math.max(1, s.formMs));
      this.gather(s.hand(), (1 - (1 - k) * (1 - k)) * 0.45 * Math.max(0, 1 - Math.max(0, this.t - s.formMs) / 500), 0.02, s.tone, 0.6); // a small glow at the hand that gives way to the rising glow
      if (!this.auraBegun && this.t >= s.formMs) this.beginAura();
      this.updateAura(ms);
      if (this.auraBegun && this.auraT < 0) this.hide();
    }
  }

  private updateAura(ms: number): void {
    const s = this.selfSpec!;
    if (this.auraT < 0) return;
    this.auraT += ms;
    const c = TONES[s.tone];
    const k = this.auraT / AURA_MS;
    const lift = Math.sin(Math.PI * Math.min(1, k));
    const at = s.feet();
    this.set(this.glowTall, { x: at.x, y: at.y + s.height * 0.5, z: at.z - 0.02 }, s.height * (1.1 + 0.2 * lift), 0.38 * lift, c.halo);
    this.glowTall.scale.set(s.height * 0.75, s.height * 1.15, 1);
    for (const r of this.risers) {
      r.life += ms;
      if (r.life < 0) continue;
      const f = r.life / r.max;
      if (f >= 1) {
        r.s.visible = false;
        continue;
      }
      r.s.position.addScaledVector(r.v, ms / 1000);
      this.set(r.s, r.s.position, (0.05 + 0.04 * Math.sin(this.clock * 12 + r.max)) * this.unit, Math.sin(Math.PI * f) * 0.95, c.spark);
    }
    if (k >= 1.35) {
      this.auraT = -1;
      this.glowTall.visible = false;
      for (const r of this.risers) r.s.visible = false;
    }
  }

  dispose(): void {
    orbLights.delete(this);
    this.group.removeFromParent();
    for (const m of this.mats) m.dispose();
    for (const t of Object.values(this.tex)) t?.dispose();
  }
}

function toV(p: P3, out: Vector3): Vector3 {
  return out.set(p.x, p.y, p.z);
}
