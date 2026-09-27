/**
 * The one pyrefly emitter (presentation plan A-5, reused by A-6 and A-9): lights
 * released at world points that then rise, sway and fade on their own clocks.
 *
 * Unlike `ParticleField` (a fixed swarm wrapped in a box, animated on the GPU),
 * each mote here is born somewhere (the eroding edge of a dissolving fiend),
 * lives 2.2 to 4.5 s and dies, so the simulation is on the CPU: a few hundred
 * motes, one attribute upload a frame. The motion and the look follow the
 * approved tile's prototype (`docs/concepts/polish/pyrefly-death/_src/dissolve.py`):
 * a hot core in a soft halo, a flicker, a rise that slows and a sway that
 * widens with age, warm white (PYRE 1.0, 0.93, 0.72) with a few cool ones.
 *
 * Game case: both (shared plumbing; the rules for who dissolves and where are
 * `pyreflyCanon.ts`).
 */

import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from 'three';

const vertexShader = /* glsl */ `
  uniform float uPixelScale;
  attribute float aSize;
  attribute float aBright;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vBright;
  void main() {
    vColor = aColor;
    vBright = aBright;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // As ParticleField: pixels at 10 world units from the camera, scaled with the render height.
    gl_PointSize = aSize * uPixelScale * (10.0 / max(-mv.z, 0.001));
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vBright;
  void main() {
    if (vBright <= 0.003) discard;
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0) discard;
    // The prototype's kernel: a small hard core inside a wide soft halo.
    float core = pow(clamp(1.0 - r * 3.4, 0.0, 1.0), 1.6);
    float halo = pow(1.0 - r, 2.6);
    float a = clamp(core * 1.4 + halo * 0.62, 0.0, 1.0) * vBright * uOpacity;
    if (a < 0.004) discard;
    // Hot enough at the core to cross the bloom threshold, as the tile's lights do.
    gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.6) * (1.0 + core * 0.8), a);
  }
`;

/** Warm white (the prototype's PYRE), gold, and two cool whites. */
export const PYREFLY_COLOURS: readonly number[] = [0xffedb8, 0xfff6d2, 0xffdb85, 0xe9fff4, 0xd8f0ff];

export interface MoteSpec {
  x: number;
  y: number;
  z: number;
  /** World units a second. */
  vx?: number;
  vy?: number;
  vz?: number;
  /** Seconds. */
  life?: number;
  /** ParticleField size units (pixels at 10 world units). */
  size?: number;
}

/** A tiny seeded generator, so a capture replays the same motes. */
function lcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class PyreflyEmitter extends Points {
  readonly capacity: number;
  private n = 0;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly age: Float32Array;
  private readonly life: Float32Array;
  private readonly size: Float32Array;
  private readonly bright: Float32Array;
  private readonly col: Float32Array;
  private readonly rand: () => number;
  private readonly palette: Color[];
  private disposed = false;

  constructor(opts: { capacity?: number; colours?: readonly number[]; opacity?: number; seed?: number } = {}) {
    const cap = Math.max(1, opts.capacity ?? 900);
    const geo = new BufferGeometry();
    const pos = new Float32Array(cap * 3);
    const size = new Float32Array(cap);
    const bright = new Float32Array(cap);
    const col = new Float32Array(cap * 3);
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new BufferAttribute(size, 1));
    geo.setAttribute('aBright', new BufferAttribute(bright, 1));
    geo.setAttribute('aColor', new BufferAttribute(col, 3));
    geo.setDrawRange(0, 0);
    const mat = new ShaderMaterial({
      uniforms: { uPixelScale: { value: 1 }, uOpacity: { value: opts.opacity ?? 0.95 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    super(geo, mat);
    this.name = 'pyrefly-emitter';
    this.frustumCulled = false;
    this.renderOrder = 21;
    this.capacity = cap;
    this.pos = pos;
    this.size = size;
    this.bright = bright;
    this.col = col;
    this.vel = new Float32Array(cap * 3);
    this.age = new Float32Array(cap);
    this.life = new Float32Array(cap);
    this.rand = lcg(opts.seed ?? 11);
    this.palette = (opts.colours ?? PYREFLY_COLOURS).map((c) => new Color(c));
  }

  /** Motes alive now. */
  get alive(): number {
    return this.n;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  /** Release one mote; false when the emitter is full or gone. */
  spawn(m: MoteSpec): boolean {
    if (this.disposed || this.n >= this.capacity) return false;
    const r = this.rand;
    const i = this.n++;
    this.pos.set([m.x, m.y, m.z], i * 3);
    this.vel.set([m.vx ?? (r() - 0.5) * 0.5, m.vy ?? 0.35 + r() * 1.25, m.vz ?? (r() - 0.5) * 0.2], i * 3);
    this.age[i] = 0;
    this.life[i] = m.life ?? 2.2 + r() * 2.3;
    // The prototype stamps kernels 10 to 54 px across on a 1080-line frame: about 12 to 34 here at 10 units.
    this.size[i] = m.size ?? 12 + r() * 22;
    this.bright[i] = 0;
    const c = this.palette[Math.floor(r() * this.palette.length)] ?? this.palette[0]!;
    this.col.set([c.r, c.g, c.b], i * 3);
    return true;
  }

  /** @param dt seconds */
  update(dt: number): void {
    if (this.disposed) return;
    const decay = Math.pow(0.995, dt * 24);
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      const age = this.age[i]! + dt;
      const life = this.life[i]!;
      if (age >= life) continue;
      const i3 = i * 3;
      const x = this.pos[i3]!;
      // The prototype's sway: widening with age.
      const sway = Math.sin(age * 1.7 + x * 0.4) * (0.1 + age * 0.08);
      const vy = this.vel[i3 + 1]! * decay;
      if (w !== i) {
        this.vel[w * 3] = this.vel[i3]!;
        this.vel[w * 3 + 2] = this.vel[i3 + 2]!;
        this.life[w] = life;
        this.size[w] = this.size[i]!;
        this.col.copyWithin(w * 3, i3, i3 + 3);
      }
      this.vel[w * 3 + 1] = vy;
      this.pos[w * 3] = x + (this.vel[w * 3]! + sway) * dt;
      this.pos[w * 3 + 1] = this.pos[i3 + 1]! + vy * dt;
      this.pos[w * 3 + 2] = this.pos[i3 + 2]! + this.vel[w * 3 + 2]! * dt;
      this.age[w] = age;
      const t = age / life;
      const flicker = 0.62 + 0.38 * Math.sin(age * 4.6 + x * 1.3);
      this.bright[w] = Math.pow(Math.sin(Math.PI * t), 0.6) * flicker;
      w++;
    }
    this.n = w;
    const g = this.geometry;
    g.setDrawRange(0, this.n);
    for (const name of ['position', 'aSize', 'aBright', 'aColor']) (g.getAttribute(name) as BufferAttribute).needsUpdate = true;
  }

  setPixelScale(v: number): void {
    (this.material as ShaderMaterial).uniforms['uPixelScale']!.value = v;
  }

  /** Every mote's world position, for the tests and the debug snapshot. */
  positions(): Array<[number, number, number]> {
    const out: Array<[number, number, number]> = [];
    for (let i = 0; i < this.n; i++) out.push([this.pos[i * 3]!, this.pos[i * 3 + 1]!, this.pos[i * 3 + 2]!]);
    return out;
  }

  override dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.n = 0;
    this.geometry.dispose();
    (this.material as ShaderMaterial).dispose();
    this.removeFromParent();
  }
}
