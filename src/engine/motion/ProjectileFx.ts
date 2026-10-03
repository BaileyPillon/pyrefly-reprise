/**
 * The scene half of `?motion=M3` (opt-motion prototype, never on main): the projectile itself.
 *
 * One additive glow sprite is the head, a short ring of fading sprites behind it is the trail, and when the head
 * arrives a hard starburst and a ring pop for about 150 ms (the impact frame). All of it is generated here as
 * canvas gradients: no texture file, no retail asset, nothing under `public/art`.
 *
 * Shapes: `orb` is a spell on a lifted arc; `tracer` is a thin fast shot on a flat line; `beam` is a long streak
 * that grows from the caster to the target and holds a beat. Colour follows the element the spell effect would
 * draw (`SpellFxRegistry`), and the dark knight's Darkness is violet.
 *
 * Cost: at most 4 heads x (1 + 12 trail) sprites alive, plus 2 for an impact; each is one draw call and no new
 * program. Nothing is allocated per frame after the first launch. Game case: both.
 */
import { AdditiveBlending, CanvasTexture, Scene, Sprite, SpriteMaterial, Vector3 } from 'three';

const TRAIL = 12;

const COLOURS: Readonly<Record<string, number>> = {
  fire: 0xff7a2e,
  ice: 0x8fe3ff,
  thunder: 0xffe14a,
  water: 0x5aa8ff,
  holy: 0xfff3c0,
  cure: 0x9dffc4,
  dark: 0xa66bff,
  hit: 0xffe6b0,
  bloom: 0xdfe9ff,
};

export interface FlightOptions {
  /** The spell effect id the stage resolved (`fire`, `ice`, ...) or `dark`. */
  look: string;
  kind: 'orb' | 'tracer' | 'beam';
  ms: number;
}

interface Flight {
  from: Vector3;
  to: Vector3;
  kind: FlightOptions['kind'];
  colour: number;
  age: number;
  total: number;
  head: Sprite;
  trail: Sprite[];
  burst: Sprite;
  ring: Sprite;
  burstAge: number;
  lift: number;
  size: number;
  done: () => void;
  landed: boolean;
}

function glowTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.75)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

/** A hard 8-ray star with a bright core, for the impact frame. */
function starTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.translate(64, 64);
  g.fillStyle = '#fff';
  for (let i = 0; i < 8; i++) {
    g.save();
    g.rotate((i * Math.PI) / 4);
    const len = i % 2 === 0 ? 62 : 38;
    g.beginPath();
    g.moveTo(0, -5);
    g.lineTo(len, 0);
    g.lineTo(0, 5);
    g.closePath();
    g.fill();
    g.restore();
  }
  const core = g.createRadialGradient(0, 0, 0, 0, 0, 26);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = core;
  g.fillRect(-64, -64, 128, 128);
  return new CanvasTexture(c);
}

function ringTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.strokeStyle = '#fff';
  g.lineWidth = 7;
  g.beginPath();
  g.arc(64, 64, 52, 0, Math.PI * 2);
  g.stroke();
  return new CanvasTexture(c);
}

export class ProjectileFx {
  private glow: CanvasTexture | null = null;
  private star: CanvasTexture | null = null;
  private ring: CanvasTexture | null = null;
  private readonly flights: Flight[] = [];
  private readonly spare: Sprite[] = [];

  constructor(private readonly scene: Scene) {}

  private sprite(map: CanvasTexture, colour: number): Sprite {
    const s = this.spare.pop() ?? new Sprite();
    const m = new SpriteMaterial({ map, color: colour, blending: AdditiveBlending, transparent: true, depthWrite: false, depthTest: true, opacity: 0 });
    s.material.dispose();
    s.material = m;
    s.renderOrder = 60;
    s.visible = false;
    s.frustumCulled = false;
    this.scene.add(s);
    return s;
  }

  /** Launch one projectile; resolves when it has landed (the impact frame has started). */
  launch(from: Vector3, to: Vector3, o: FlightOptions, size: number): Promise<void> {
    this.glow ??= glowTexture();
    this.star ??= starTexture();
    this.ring ??= ringTexture();
    const colour = COLOURS[o.look] ?? COLOURS['bloom']!;
    const head = this.sprite(this.glow, colour);
    const trail = Array.from({ length: TRAIL }, () => this.sprite(this.glow!, colour));
    const burst = this.sprite(this.star, 0xffffff);
    const ring = this.sprite(this.ring, colour);
    burst.scale.setScalar(size * 0.01);
    return new Promise<void>((resolve) => {
      this.flights.push({
        from: from.clone(),
        to: to.clone(),
        kind: o.kind,
        colour,
        age: 0,
        total: Math.max(1, o.ms) / 1000,
        head,
        trail,
        burst,
        ring,
        burstAge: -1,
        lift: o.kind === 'orb' ? Math.min(1.1, 0.25 + from.distanceTo(to) * 0.16) : 0,
        size,
        done: resolve,
        landed: false,
      });
    });
  }

  private at(f: Flight, t: number, out: Vector3): Vector3 {
    out.lerpVectors(f.from, f.to, t);
    out.y += Math.sin(Math.PI * t) * f.lift;
    return out;
  }

  update(dt: number): void {
    if (!this.flights.length) return;
    const p = new Vector3();
    for (let i = this.flights.length - 1; i >= 0; i--) {
      const f = this.flights[i]!;
      f.age += dt;
      const t = Math.min(1, f.age / f.total);
      const eased = f.kind === 'tracer' ? t : t * t * (3 - 2 * t) * 0.35 + t * 0.65; // a spell eases out of the hand
      const beam = f.kind === 'beam';
      const hm = f.head.material as SpriteMaterial;
      if (!f.landed) {
        this.at(f, eased, p);
        f.head.position.copy(p);
        f.head.visible = true;
        const base = f.size * (f.kind === 'tracer' ? 0.28 : beam ? 0.5 : 0.55);
        f.head.scale.setScalar(base * (1 + 0.12 * Math.sin(f.age * 60)));
        hm.opacity = 1;
      }
      for (let k = 0; k < f.trail.length; k++) {
        const lag = (k + 1) / f.trail.length;
        const tt = beam ? Math.max(0, eased - lag * eased) : Math.max(0, eased - lag * (f.kind === 'tracer' ? 0.5 : 0.28));
        const s = f.trail[k]!;
        this.at(f, tt, p);
        s.position.copy(p);
        s.visible = eased > 0.02;
        const fade = (1 - lag) ** 1.4;
        s.scale.setScalar(f.size * (f.kind === 'tracer' ? 0.2 : beam ? 0.4 : 0.5) * (1 - lag * 0.6));
        (s.material as SpriteMaterial).opacity = fade * (f.landed ? Math.max(0, 1 - (f.age - f.total) / 0.16) : 0.85);
      }
      if (t >= 1 && !f.landed) {
        f.landed = true;
        f.burstAge = 0;
        f.head.visible = false;
        f.burst.position.copy(f.to);
        f.ring.position.copy(f.to);
        f.done();
      }
      if (f.landed) {
        f.burstAge += dt;
        const b = f.burstAge / 0.16;
        const bm = f.burst.material as SpriteMaterial;
        const rm = f.ring.material as SpriteMaterial;
        if (b < 1) {
          f.burst.visible = f.ring.visible = true;
          f.burst.scale.setScalar(f.size * (0.5 + 2.1 * Math.sqrt(b)));
          f.ring.scale.setScalar(f.size * (0.4 + 3.4 * b));
          f.burst.material.rotation = b * 0.9;
          bm.opacity = (1 - b) ** 0.7;
          rm.opacity = (1 - b) * 0.8;
        } else {
          this.retire(f);
          this.flights.splice(i, 1);
        }
      }
    }
  }

  private retire(f: Flight): void {
    for (const s of [f.head, ...f.trail, f.burst, f.ring]) {
      s.visible = false;
      this.scene.remove(s);
      (s.material as SpriteMaterial).dispose();
      this.spare.push(s);
    }
  }

  dispose(): void {
    for (const f of this.flights) this.retire(f);
    this.flights.length = 0;
    this.glow?.dispose();
    this.star?.dispose();
    this.ring?.dispose();
  }
}
