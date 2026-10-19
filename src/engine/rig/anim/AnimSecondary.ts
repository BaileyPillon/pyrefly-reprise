/**
 * Secondary motion for the animation prototype (`?anim=proto`; both games, presentation only; no `three`, no DOM, erasable TS so a Node tool may import it).
 *
 * Arms that trail the shoulder and whip past where they stop, a skirt that lags the hips and swings back, a doll that bobs behind the hand, a braid that streams back in a lunge: overlapping
 * action, from springs and one Verlet chain. Three rules keep it safe to lay over a rig that was gated at rest:
 *
 * - **It is a RESIDUAL.** A spring chases the pose the clip asks for; what is added to the pose is only `gain * (spring - base)`, the lag, the overshoot and the wind. A figure at rest has none, so
 *   its pose is exactly the authored key (the geometry the gate proved), and the residual is bounded (`limit`).
 * - **It is a fixed step.** The solver runs at {@link SUBSTEP} (120 Hz) whatever the frame time, from an accumulator of the presentation clock the caller hands it (a frame's `dt`, clamped), so two
 *   runs with the same frames give the same bits and a slow frame cannot blow a spring up. It never reads a battle timer. The first step pre-rolls from rest.
 * - **It has a mix** (0..1, a clip may key it down): 0 is the authored pose, 1 is all of the secondary motion.
 *
 * A rotation spring chases the bone's ABSOLUTE angle (its parent's actual angle, residual included, plus its own rot), so the forearm lags the upper arm and the hand lags the forearm: the whip
 * travels down the chain. A point spring chases a bone's `dx` and `dy`. `drag` (rotation: degrees, point: px, per world unit a second of forward travel) trails a figure that lunges. A Verlet chain
 * (`AnimVerlet.ts`) drives a braid of up to four joints.
 */
import { VerletChain, type VerletSpec } from './AnimVerlet.ts';

/** The solver's step in seconds. */
export const SUBSTEP = 1 / 120;
/** The most time one frame may hand the solver, seconds (a stalled tab does not run a second of steps). */
export const MAX_FRAME = 1 / 15;
const DEG = Math.PI / 180;

const clamp = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, x));

/** A fixed-step accumulator: `steps(dt)` is how many {@link SUBSTEP}s this frame owes; the remainder carries to the next. */
export class FixedStep {
  private acc = 0;
  steps(dt: number): number {
    if (!(dt > 0)) return 0;
    this.acc += Math.min(dt, MAX_FRAME);
    const n = Math.floor(this.acc / SUBSTEP + 1e-9);
    this.acc -= n * SUBSTEP;
    if (this.acc < 0) this.acc = 0;
    return n;
  }
  reset(): void {
    this.acc = 0;
  }
}

/** A critically damped spring in its half-life form (Holden): frame-rate independent, unconditionally stable. `halflife` seconds to close half the gap to the goal. For single-axis lag (an amount, a weight). */
export function halfLifeStep(x: number, v: number, goal: number, halflife: number, dt: number): [number, number] {
  const y = (2 * Math.LN2) / Math.max(1e-5, halflife);
  const j0 = x - goal;
  const j1 = v + j0 * y;
  const e = Math.exp(-y * dt);
  return [e * (j0 + j1 * dt) + goal, e * (v - j1 * y * dt)];
}

/** A damped spring, semi-implicit Euler: `f` Hz natural frequency, `z` damping ratio (1 critical, below 1 rings). Stable for `f * SUBSTEP * 2 pi < 2`, bounded, finite. */
export class Spring1 {
  y = 0;
  v = 0;
  /** Largest speed, units a second. */
  vmax: number;
  constructor(vmax = 60) {
    this.vmax = vmax;
  }
  reset(x: number, v = 0): void {
    this.y = x;
    this.v = v;
  }
  step(h: number, x: number, f: number, z: number): void {
    if (!Number.isFinite(x)) return;
    const w = 2 * Math.PI * Math.max(0.05, f);
    const a = w * w * (x - this.y) - 2 * Math.max(0, z) * w * this.v;
    this.v = clamp(this.v + a * h, -this.vmax, this.vmax);
    this.y += this.v * h;
    if (!Number.isFinite(this.y) || !Number.isFinite(this.v)) this.reset(x);
  }
}

export interface RotSpring {
  bone: string;
  f: number;
  z: number;
  /** How much of the lag shows, 0..1 and above (0 = none). */
  gain: number;
  /** Largest residual, degrees. */
  limit: number;
  /** Degrees of trail per world unit a second of forward travel. */
  drag?: number;
}

export interface PointSpring {
  bone: string;
  f: number;
  z: number;
  gain: number;
  /** Largest residual on either axis, painting px. */
  limit: number;
  /** Painting px of trail per world unit a second of forward travel. */
  drag?: number;
}

/** A Verlet chain over bones; `tail` is the bind point past the last bone's joint (default: one more bone's length the same way). */
export interface ChainSpec extends VerletSpec {
  tail?: readonly [number, number];
}

export interface SecondarySpec {
  rots: readonly RotSpring[];
  points: readonly PointSpring[];
  chains?: readonly ChainSpec[];
}

/** A style's say over the springs: frequency and damping multipliers and a gain multiplier. */
export interface SecondaryTune {
  f: number;
  z: number;
  gain: number;
}

/** The bones of a rig as the layer reads them: the bind joint (painting px) and the parent (-1 for a root). */
export interface LayerBone {
  x: number;
  y: number;
  parent: number;
}

interface RotRt extends RotSpring {
  i: number;
  s: Spring1;
  /** The spring's target and the pose's own value last step, for the residual. */
  base: number;
}
interface PointRt extends PointSpring {
  i: number;
  sx: Spring1;
  sy: Spring1;
  bx: number;
  by: number;
}
interface ChainRt {
  chain: VerletChain;
  bones: number[];
  parent: number;
  out: Float64Array;
}

/** The residual layer over a rig's channel array (five numbers a bone, as `RigSkeleton`). */
export class SecondaryLayer {
  private readonly rots: RotRt[] = [];
  private readonly points: PointRt[] = [];
  private readonly chains: ChainRt[] = [];
  private readonly rotAt: (RotRt | undefined)[];
  private readonly abs: Float64Array;
  private readonly fixed = new FixedStep();
  private primed = false;
  private readonly bones: readonly LayerBone[];
  private readonly ch: number;
  /** Painting px per world unit (the trail of a lunge); the owner sets it once the figure's plane has a size. */
  pxPerUnit: number;

  /** Unknown bones in the spec are skipped (a rig without that bone has nothing to swing there). `pxPerUnit` is painting px per world unit (the trail of a lunge). */
  constructor(bones: readonly LayerBone[], boneIndex: ReadonlyMap<string, number>, spec: SecondarySpec, tune: SecondaryTune, pxPerUnit = 1200, ch = 5) {
    this.bones = bones;
    this.ch = ch;
    this.pxPerUnit = pxPerUnit;
    this.abs = new Float64Array(bones.length);
    this.rotAt = new Array<RotRt | undefined>(bones.length).fill(undefined);
    for (const r of spec.rots) {
      const i = boneIndex.get(r.bone);
      if (i === undefined) continue;
      const rt: RotRt = { ...r, i, f: r.f * tune.f, z: r.z * tune.z, gain: r.gain * tune.gain, s: new Spring1(40), base: 0 };
      this.rots.push(rt);
      this.rotAt[i] = rt;
    }
    for (const p of spec.points) {
      const i = boneIndex.get(p.bone);
      if (i === undefined) continue;
      this.points.push({ ...p, i, f: p.f * tune.f, z: p.z * tune.z, gain: p.gain * tune.gain, sx: new Spring1(4000), sy: new Spring1(4000), bx: 0, by: 0 });
    }
    for (const c of spec.chains ?? []) {
      const idx = c.bones.map((b) => boneIndex.get(b));
      if (idx.some((i) => i === undefined) || idx.length < 1) continue;
      const ids = idx as number[];
      const joints = ids.map((i) => ({ x: bones[i]!.x, y: bones[i]!.y }));
      const last = joints[joints.length - 1]!;
      const prev = joints[joints.length - 2] ?? { x: last.x, y: last.y - 100 };
      joints.push(c.tail ? { x: c.tail[0], y: c.tail[1] } : { x: 2 * last.x - prev.x, y: 2 * last.y - prev.y });
      this.chains.push({ chain: new VerletChain(joints, c), bones: ids, parent: bones[ids[0]!]!.parent, out: new Float64Array(ids.length) });
    }
  }

  get size(): number {
    return this.rots.length + this.points.length + this.chains.length;
  }

  /** The next step starts every spring and chain at rest on its target (a figure placed or snapped to a pose does not swing to it). */
  settle(): void {
    this.primed = false;
    this.fixed.reset();
  }

  /** A velocity impulse: every rotation spring gets `rot` radians a second times its gain, every point spring `px` px a second times its gain (a hit's beat, a release's thrust). */
  impulse(rot: number, px: number): void {
    for (const r of this.rots) r.s.v = clamp(r.s.v + rot * r.gain, -r.s.vmax, r.s.vmax);
    for (const p of this.points) {
      p.sx.v = clamp(p.sx.v + px * p.gain, -p.sx.vmax, p.sx.vmax);
      p.sy.v = clamp(p.sy.v + px * p.gain * 0.5, -p.sy.vmax, p.sy.vmax);
    }
  }

  /** The residual a rotation spring adds to its bone now (radians, before `mix`); 0 for a bone with none. For the tests and the tools. */
  residual(bone: number): number {
    const r = this.rotAt[bone];
    return r ? clamp(r.s.y - r.base, -r.limit * DEG, r.limit * DEG) : 0;
  }

  /**
   * Lay the secondary motion on `work` (the rig's channel array: the clip's pose plus the idle). `forward` is the figure's speed toward the way it faces, world units a second; `m` is the
   * skeleton's world matrices as last solved from `work` (six numbers a bone: a joint's place is the translation); `mix` 0..1 scales every residual.
   */
  step(work: Float64Array, dt: number, forward: number, m: Float64Array, mix: number): void {
    const fwd = clamp(forward, -12, 12);
    const gm = clamp(mix, 0, 1);
    let n = 0;
    if (!this.primed) {
      this.pass(work, m, fwd, gm, true);
      this.primed = true;
    } else n = this.fixed.steps(dt);
    for (let k = 0; k < n; k++) this.pass(work, m, fwd, gm, false);
    this.apply(work, gm);
  }

  /** One fixed step of every spring and chain, bones in order (parents before children). */
  private pass(work: Float64Array, m: Float64Array, fwd: number, gm: number, init: boolean): void {
    const ch = this.ch;
    const total = this.bones.length;
    for (let i = 0; i < total; i++) {
      const p = this.bones[i]!.parent;
      const base = (p >= 0 ? this.abs[p]! : 0) + work[i * ch]!;
      const r = this.rotAt[i];
      if (!r) {
        this.abs[i] = base;
        continue;
      }
      const wind = (r.drag ?? 0) * DEG * fwd;
      r.base = base;
      if (init) r.s.reset(base + wind);
      else r.s.step(SUBSTEP, base + wind, r.f, r.z);
      this.abs[i] = base + gm * r.gain * clamp(r.s.y - base, -r.limit * DEG, r.limit * DEG);
    }
    for (const q of this.points) {
      q.bx = work[q.i * ch + 1]!;
      q.by = work[q.i * ch + 2]!;
      if (init) {
        q.sx.reset(q.bx - (q.drag ?? 0) * fwd);
        q.sy.reset(q.by);
      } else {
        q.sx.step(SUBSTEP, q.bx - (q.drag ?? 0) * fwd, q.f, q.z);
        q.sy.step(SUBSTEP, q.by, q.f, q.z);
      }
    }
    for (const c of this.chains) {
      const q = c.bones[0]! * 6;
      const parentAbs = c.parent >= 0 ? this.abs[c.parent]! : 0;
      if (init) c.chain.preroll(SUBSTEP, m[q + 4]!, m[q + 5]!, parentAbs);
      else c.chain.step(SUBSTEP, m[q + 4]!, m[q + 5]!, parentAbs, fwd * SUBSTEP * this.pxPerUnit);
    }
  }

  private apply(work: Float64Array, gm: number): void {
    const ch = this.ch;
    for (const r of this.rots) work[r.i * ch] = work[r.i * ch]! + gm * r.gain * clamp(r.s.y - r.base, -r.limit * DEG, r.limit * DEG);
    for (const q of this.points) {
      work[q.i * ch + 1] = work[q.i * ch + 1]! + gm * q.gain * clamp(q.sx.y - q.bx, -q.limit, q.limit);
      work[q.i * ch + 2] = work[q.i * ch + 2]! + gm * q.gain * clamp(q.sy.y - q.by, -q.limit, q.limit);
    }
    for (const c of this.chains) {
      const parentAbs = c.parent >= 0 ? this.abs[c.parent]! : 0;
      c.chain.rots(parentAbs, gm, c.out);
      c.bones.forEach((b, k) => (work[b * ch] = c.out[k]!));
    }
  }
}
