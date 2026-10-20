/**
 * The cast's CHANNEL, drawn so it reads (pass 3 of the animation prototype, `?anim=proto&style=P3`; both games' plumbing, presentation only): pass 2's hold was one small glow at the doll and a few orbiting
 * sparks, and in the recordings the figure barely moved, so the long middle of a cast (the game's `_01` hold, the spell's charge) read as nothing. This adds what a viewer reads as "she is gathering power":
 * two glyphs of light that turn against each other behind the doll, motes that spiral INTO the doll from a wide ring (the inflow is the sign that something is being gathered, not worn), and a faint tall glow
 * around the whole figure; all grow with the clip's glow level (`RigAnimator.charge`), so they build through the hold and are gone when the spell leaves (the release flash is pass 2's, `AnimFx.flashOut`).
 * Additive sprites over the figure like `AnimFx`; deterministic (no `Math.random`); the shapes are the ones `AnimFx` paints once in a canvas (null in a unit test: the sprites are then just untextured).
 */
import { AdditiveBlending, Group, Sprite, SpriteMaterial, type Object3D } from 'three';
import { paint } from './AnimFx.ts';

interface Point3 {
  x: number;
  y: number;
  z: number;
}

const RUNES = 2;
const MOTES = 14;
const ORDER = 998;
const BLUE = { halo: 0x7cc4ff, core: 0xf0f8ff, spark: 0xcfe9ff };

export class CastFx {
  readonly group = new Group();
  private readonly tex = { star: paint('star'), glow: paint('glow') };
  private readonly mats: SpriteMaterial[] = [];
  private readonly runes: Sprite[] = [];
  private readonly motes: Sprite[] = [];
  private readonly aura: Sprite;
  private clock = 0;
  private level = 0;
  private at: Point3 | null = null;
  private feet: Point3 = { x: 0, y: 0, z: 0 };
  private height = 1.8;
  private unit = 1;

  constructor() {
    this.aura = this.sprite('glow', BLUE.halo);
    for (let i = 0; i < RUNES; i++) this.runes.push(this.sprite('star', i ? BLUE.core : BLUE.halo));
    for (let i = 0; i < MOTES; i++) this.motes.push(this.sprite('glow', BLUE.spark));
    this.group.visible = false;
    this.group.renderOrder = ORDER;
  }

  private sprite(kind: 'star' | 'glow', color: number): Sprite {
    const m = new SpriteMaterial({ map: this.tex[kind], color, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, blending: AdditiveBlending, opacity: 0 });
    this.mats.push(m);
    const s = new Sprite(m);
    s.renderOrder = ORDER;
    s.visible = false;
    this.group.add(s);
    return s;
  }

  /** True while any of it is on screen. */
  get active(): boolean {
    return this.group.visible;
  }

  /** Every frame of the hold: `at` is the doll (what is being charged), `level` the clip's glow (0 none, 1 gathered, above it the squeeze before the release), `feet` and `height` the figure's, `unit` height / 1.8. */
  gather(at: Point3, level: number, feet: Point3, height: number, unit: number): void {
    this.at = at;
    this.level = Math.max(0, level);
    this.feet = feet;
    this.height = height;
    this.unit = Math.max(0.2, unit);
  }

  /** The glow is gone (the release, the end of the clip): the extras fade with the level. */
  rest(): void {
    this.level = 0;
  }

  /** Advance by `dt` seconds and keep the group under `parent` (the scene). */
  update(dt: number, parent: Object3D | null): void {
    this.clock += dt;
    const L = this.level;
    if (L <= 0.02 || !this.at) {
      if (this.group.visible) {
        this.group.visible = false;
        for (const o of this.group.children) o.visible = false;
      }
      return;
    }
    if (parent && this.group.parent !== parent) parent.add(this.group);
    this.group.visible = true;
    const u = this.unit;
    const a = this.at;
    const k = Math.min(1, L * 1.25);
    // the tall glow about the figure: she is lit from within
    const ap = this.aura;
    ap.visible = true;
    ap.position.set(this.feet.x, this.feet.y + this.height * 0.5, this.feet.z - 0.02);
    ap.scale.set(this.height * 0.8, this.height * 1.25, 1);
    ap.material.opacity = 0.2 * k * (0.85 + 0.15 * Math.sin(this.clock * 3));
    // two glyphs turning against each other behind the doll
    for (let i = 0; i < RUNES; i++) {
      const r = this.runes[i]!;
      const size = (i ? 0.95 : 0.7 + 0.1 * Math.sin(this.clock * 2)) * (0.8 + 0.7 * Math.min(1.3, L)) * u * (i ? 1.0 : 1.0);
      r.visible = true;
      r.position.set(a.x, a.y, a.z - 0.01);
      r.scale.set(size, size, 1);
      r.material.rotation = (i ? -1 : 1) * this.clock * (0.9 + 0.3 * i) + i * 0.7;
      r.material.opacity = (i ? 0.3 : 0.42) * k;
    }
    // motes spiral in from a wide ring
    for (let i = 0; i < MOTES; i++) {
      const m = this.motes[i]!;
      const p = (this.clock * 1.15 + i / MOTES) % 1; // 0 far, 1 arrived
      const r = (1 - p) * (0.55 + 0.35 * Math.min(1.2, L)) * u * 1.7 + 0.04 * u;
      const ang = i * 2.4 + this.clock * 1.4 + (1 - p) * 3.2;
      m.visible = true;
      m.position.set(a.x + Math.cos(ang) * r, a.y + Math.sin(ang) * r * 0.85, a.z + 0.02);
      const s = (0.045 + 0.05 * p) * u;
      m.scale.set(s, s, 1);
      m.material.opacity = Math.sin(Math.PI * p) * 0.9 * k;
    }
  }

  dispose(): void {
    this.group.removeFromParent();
    for (const m of this.mats) m.dispose();
    for (const t of Object.values(this.tex)) t?.dispose();
  }
}
