/**
 * The light of pass 2's cast and item (`?anim=proto&style=P2`; both games, presentation only): additive glow sprites, no model. The game's own item use shows NO bottle and no object (measured on the Steam
 * copy, 2026-10-19): on an ally an orb of green light rises from the hand, is tossed overhand, arcs to the target and bursts into sparkles on it; on the user, glow particles rise around her. A cast
 * gathers a glow at the doll that grows through the looping hold and flashes out on the release.
 *
 * One `AnimFx` a figure, parented to the scene (like `VialProp`, which pass 1's styles still use). `gather` is called every frame with the hand's world position and the clip's glow level
 * (`RigAnimator.charge`): 0 draws nothing. `toss`, `aura` and `flashOut` start the one-shot parts; `update` advances them by real time. Sprites draw over the figure and the target (no depth test).
 * Deterministic (a fixed pseudo-random sequence a burst), no `Math.random`.
 */
import { AdditiveBlending, CanvasTexture, Group, LinearFilter, Sprite, SpriteMaterial, SRGBColorSpace, Vector3, type Object3D, type Texture } from 'three';

export type FxTone = 'cast' | 'item';
export interface Point3 {
  x: number;
  y: number;
  z: number;
}

const TONES: Readonly<Record<FxTone, { halo: number; core: number; spark: number }>> = {
  cast: { halo: 0x7cc4ff, core: 0xf0f8ff, spark: 0xcfe9ff },
  item: { halo: 0x3fe27a, core: 0xf2fff4, spark: 0xb8ffcc },
};

const SPARKS = 10;
const TRAIL = 9;
const BITS = 16;
const RISERS = 22;
const ORDER = 999;

/** A soft round glow (white centre falling off to nothing), 64 px, and a thin ring and a four-point star for the burst. Null where there is no 2D canvas (a unit test). */
function paint(kind: 'glow' | 'ring' | 'star'): Texture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  if (kind === 'glow') {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  } else if (kind === 'ring') {
    const r = g.createRadialGradient(32, 32, 20, 32, 32, 31);
    r.addColorStop(0, 'rgba(255,255,255,0)');
    r.addColorStop(0.55, 'rgba(255,255,255,0.9)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  } else {
    g.translate(32, 32);
    const arm = (len: number, w: number): void => {
      const gr = g.createLinearGradient(-len, 0, len, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, 'rgba(255,255,255,1)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(-len, -w / 2, len * 2, w);
    };
    arm(31, 5);
    g.rotate(Math.PI / 2);
    arm(31, 5);
    const core = g.createRadialGradient(0, 0, 0, 0, 0, 12);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = core;
    g.fillRect(-16, -16, 32, 32);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.minFilter = LinearFilter;
  return t;
}

interface Bit {
  s: Sprite;
  v: Vector3;
  life: number;
  max: number;
}

/** A tiny deterministic generator (the burst's directions): the same every time. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export class AnimFx {
  readonly group = new Group();
  private readonly tex = { glow: paint('glow'), ring: paint('ring'), star: paint('star') };
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
  private tone: FxTone = 'cast';
  private clock = 0;
  /** The orb's state: held at the hand, in flight, or gone. */
  private mode: 'hand' | 'flying' | 'burst' = 'hand';
  private readonly orb = new Vector3();
  private readonly from = new Vector3();
  private readonly to = new Vector3();
  private flightMs = 420;
  private flightT = 0;
  private trailTimer = 0;
  private flashT = -1;
  private flashAt = new Vector3();
  private burstT = -1;
  private auraT = -1;
  private auraAt = new Vector3();
  private auraH = 1.8;
  private unit = 1;
  private shown = false;
  private readonly rand = lcg(0x51f7);

  constructor() {
    this.halo = this.sprite('glow', 0x7cc4ff);
    this.core = this.sprite('glow', 0xf0f8ff);
    for (let i = 0; i < SPARKS; i++) this.sparks.push(this.sprite('star', 0xcfe9ff));
    for (let i = 0; i < TRAIL; i++) this.trail.push(this.sprite('glow', 0x3fe27a));
    this.flashS = this.sprite('glow', 0xffffff);
    this.ring = this.sprite('ring', 0xffffff);
    for (let i = 0; i < BITS; i++) this.bits.push({ s: this.sprite('star', 0xb8ffcc), v: new Vector3(), life: 0, max: 1 });
    for (let i = 0; i < RISERS; i++) this.risers.push({ s: this.sprite('star', 0xb8ffcc), v: new Vector3(), life: 0, max: 1 });
    this.glowTall = this.sprite('glow', 0x3fe27a);
    this.group.visible = false;
    this.group.renderOrder = ORDER;
  }

  private sprite(kind: 'glow' | 'ring' | 'star', color: number): Sprite {
    const m = new SpriteMaterial({ map: this.tex[kind], color, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, blending: AdditiveBlending, opacity: 0 });
    this.mats.push(m);
    const s = new Sprite(m);
    s.renderOrder = ORDER;
    s.visible = false;
    this.group.add(s);
    return s;
  }

  /** World units a figure is tall / 1.8: every size is a multiple of it. */
  setUnit(u: number): void {
    this.unit = Math.max(0.2, u);
  }

  /** True while something of this is on screen. */
  get active(): boolean {
    return this.shown;
  }

  /** The orb is in flight (the toss has left the hand and has not arrived). */
  get flying(): boolean {
    return this.mode === 'flying';
  }

  private set(s: Sprite, p: Vector3 | Point3, size: number, opacity: number, color?: number): void {
    const m = s.material;
    s.visible = opacity > 0.005 && size > 0;
    if (!s.visible) return;
    s.position.set(p.x, p.y, p.z);
    s.scale.set(size, size, 1);
    m.opacity = Math.min(1, opacity);
    if (color !== undefined) m.color.setHex(color);
  }

  /** Where the held orb is (the hand plus its rise): the point a toss starts from. */
  get orbAt(): Point3 {
    return this.orb;
  }

  /**
   * Every frame while the figure is gathering: `hand` is the hand's world position, `level` the clip's glow (0 none, 1 gathered, above 1 the squeeze before the release), `lift` how high above the hand the
   * orb floats (world units; 0 for a cast, which glows at the doll), `tone` the colours, `scale` a multiplier on the whole (an item used on the user keeps the hand glow small).
   */
  gather(hand: Point3, level: number, lift: number, tone: FxTone, scale = 1): void {
    this.tone = tone;
    if (this.mode !== 'hand') return;
    const L = Math.max(0, level);
    const c = TONES[tone];
    const u = this.unit * scale;
    this.orb.set(hand.x, hand.y + lift * this.unit, hand.z + 0.05);
    const flick = 1 + 0.07 * Math.sin(this.clock * 17) + 0.04 * Math.sin(this.clock * 41);
    this.set(this.halo, this.orb, (0.16 + 0.5 * L) * u * flick, 0.75 * Math.min(1.1, L * 1.3), c.halo);
    this.set(this.core, this.orb, (0.05 + 0.13 * Math.min(1.3, L)) * u * flick, Math.min(1, L * 1.6), c.core);
    const n = Math.round(Math.min(1, L) * SPARKS);
    for (let i = 0; i < SPARKS; i++) {
      if (i >= n) {
        this.sparks[i]!.visible = false;
        continue;
      }
      const a = this.clock * (1.7 + (i % 3) * 0.55) * (i % 2 ? 1 : -1) + i * 2.4;
      const r = (0.1 + 0.16 * ((i * 7) % 5) / 4) * u * (0.55 + 0.6 * Math.min(1.2, L));
      this.set(this.sparks[i]!, { x: this.orb.x + Math.cos(a) * r, y: this.orb.y + Math.sin(a * 1.3) * r * 0.9, z: this.orb.z }, (0.025 + 0.02 * ((i + 1) % 3)) * this.unit * (0.7 + 0.5 * Math.sin(this.clock * 9 + i)), 0.9 * Math.min(1, L), c.spark);
    }
    this.shown = true;
    this.group.visible = true;
  }

  /** The cast's release: the glow flashes out at the hand (a bright bloom and a ring that opens). */
  flashOut(at: Point3, tone: FxTone = 'cast'): void {
    this.tone = tone;
    this.flashAt.set(at.x, at.y, at.z + 0.06);
    this.flashT = 0;
    this.shown = true;
    this.group.visible = true;
  }

  /** The item's toss: the held orb leaves its place and arcs to `to` over `ms`, with a trail; it bursts into sparkles there. */
  toss(to: Point3, ms: number): void {
    this.from.copy(this.orb);
    this.to.set(to.x, to.y, to.z + 0.05);
    this.flightMs = Math.max(80, ms);
    this.flightT = 0;
    this.trailTimer = 0;
    this.mode = 'flying';
    this.shown = true;
    this.group.visible = true;
    this.core.visible = this.halo.visible = true;
    for (const s of this.sparks) s.visible = false;
  }

  /** An item used on the user: glow particles rise around her (`at` her feet, `height` her height, world units). */
  aura(at: Point3, height: number): void {
    this.auraAt.set(at.x, at.y, at.z + 0.05);
    this.auraH = height;
    this.auraT = 0;
    this.shown = true;
    this.group.visible = true;
    for (let i = 0; i < RISERS; i++) {
      const r = this.risers[i]!;
      const a = this.rand() * Math.PI * 2;
      const rad = (0.12 + 0.3 * this.rand()) * this.unit;
      r.s.position.set(at.x + Math.cos(a) * rad, at.y + this.rand() * height * 0.7, at.z + 0.05);
      r.v.set(0, (0.45 + 0.5 * this.rand()) * this.unit, 0);
      r.max = 700 + 500 * this.rand();
      r.life = -this.rand() * 350; // staggered starts
    }
  }

  /** Put everything away (the action was cut short). */
  hide(): void {
    this.mode = 'hand';
    this.flashT = this.burstT = this.auraT = -1;
    this.shown = false;
    this.group.visible = false;
    for (const m of this.mats) m.opacity = 0;
    for (const o of this.group.children) o.visible = false;
  }

  private burst(): void {
    this.mode = 'burst';
    this.burstT = 0;
    const c = TONES[this.tone];
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

  /** Advance by `dt` real seconds and keep the group under `parent` (the scene). */
  update(dt: number, parent: Object3D | null): void {
    if (parent && this.group.parent !== parent) parent.add(this.group);
    this.clock += dt;
    const ms = dt * 1000;
    const c = TONES[this.tone];
    const u = this.unit;
    if (this.mode === 'flying') {
      this.flightT += ms;
      const k = Math.min(1, this.flightT / this.flightMs);
      const e = k * (2 - k) * 0.4 + k * 0.6; // leaves fast
      this.orb.lerpVectors(this.from, this.to, e);
      this.orb.y += 4 * (0.16 + 0.2 * this.from.distanceTo(this.to) * 0.5) * u * k * (1 - k); // the arc
      this.set(this.halo, this.orb, 0.5 * u * (1 - 0.3 * k), 0.8, c.halo);
      this.set(this.core, this.orb, 0.17 * u * (1 - 0.3 * k), 1, c.core);
      this.trailTimer += ms;
      if (this.trailTimer >= 22) {
        this.trailTimer = 0;
        for (let i = TRAIL - 1; i > 0; i--) this.trail[i]!.position.copy(this.trail[i - 1]!.position);
        this.trail[0]!.position.copy(this.orb);
      }
      for (let i = 0; i < TRAIL; i++) {
        const t = this.trail[i]!;
        const f = 1 - (i + 1) / (TRAIL + 1);
        const live = this.flightT > 22 * (i + 1);
        t.visible = live;
        if (live) {
          t.scale.set(0.3 * u * f, 0.3 * u * f, 1);
          t.material.opacity = 0.6 * f;
          t.material.color.setHex(c.halo);
        }
      }
      if (k >= 1) this.burst();
    } else if (this.mode === 'burst') {
      this.burstT += ms;
      const k = Math.min(1, this.burstT / 620);
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
      if (k >= 1 && !alive) {
        this.mode = 'hand';
        this.flashS.visible = this.ring.visible = false;
        this.burstT = -1;
      }
    }
    if (this.flashT >= 0) {
      this.flashT += ms;
      const k = Math.min(1, this.flashT / 360);
      this.set(this.flashS, this.flashAt, (0.3 + 0.8 * k) * u, 0.95 * (1 - k) * (1 - k), c.core);
      this.set(this.ring, this.flashAt, (0.12 + 1.0 * (1 - (1 - k) * (1 - k))) * u, 0.85 * (1 - k), c.halo);
      if (k >= 1) {
        this.flashT = -1;
        this.flashS.visible = this.ring.visible = false;
      }
    }
    if (this.auraT >= 0) {
      this.auraT += ms;
      const k = this.auraT / 1500;
      const lift = Math.sin(Math.PI * Math.min(1, k));
      this.set(this.glowTall, { x: this.auraAt.x, y: this.auraAt.y + this.auraH * 0.5, z: this.auraAt.z - 0.02 }, this.auraH * (1.1 + 0.2 * lift), 0.38 * lift, c.halo);
      this.glowTall.scale.set(this.auraH * 0.75, this.auraH * 1.15, 1);
      for (const r of this.risers) {
        r.life += ms;
        if (r.life < 0) continue;
        const f = r.life / r.max;
        if (f >= 1) {
          r.s.visible = false;
          continue;
        }
        r.s.position.addScaledVector(r.v, dt);
        this.set(r.s, r.s.position, (0.05 + 0.04 * Math.sin(this.clock * 12 + r.max)) * u, Math.sin(Math.PI * f) * 0.95, c.spark);
      }
      if (k >= 1.35) {
        this.auraT = -1;
        this.glowTall.visible = false;
        for (const r of this.risers) r.s.visible = false;
      }
    }
    if (this.mode === 'hand' && this.flashT < 0 && this.auraT < 0 && this.burstT < 0 && !this.halo.visible) {
      this.shown = false;
      this.group.visible = false;
    }
  }

  /** The glow is hidden until `gather` runs again (call when the level has fallen to nothing and no toss is flying). */
  rest(): void {
    if (this.mode !== 'hand') return;
    this.halo.visible = this.core.visible = false;
    for (const s of this.sparks) s.visible = false;
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.mats) m.dispose();
    for (const t of Object.values(this.tex)) t?.dispose();
  }
}
