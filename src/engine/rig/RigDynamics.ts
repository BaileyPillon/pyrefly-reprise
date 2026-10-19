/**
 * Secondary motion for a rig: the prototype's `dyn.ts` (a second-order spring and a lag chain) ported to the rig file's `motion` block, plus the idle.
 * Pure TypeScript: no `three`, no DOM.
 *
 * - {@link Spring}: second-order dynamics (after t3ssel8r): `f` natural frequency in Hz, `z` damping (1 critical, below 1 rings), `r` initial response. Stable for
 *   any step (the step is clamped to 1/30 s and `k2` is floored), and **bounded**: velocity is capped and a non-finite state resets.
 * - {@link RigChains}: tail, mane, sash, beard, hair. Each chain bone's ABSOLUTE angle chases the bone it follows through its own spring, plus a constant `bias`
 *   and a `drag` proportional to how fast the figure is moving forward (a streaming mane swings back as the body lunges), plus a share of gravity (`hang`: how much
 *   of the followed bone's tilt the chain refuses to follow). The angle of one chain bone from its parent is clamped to `limit`. A chain bone's `rot` in a key is
 *   replaced by the chain's.
 * - {@link applyIdle}: small sinusoids added on top of the key (breath in the spine and chest, the weight in the pelvis).
 */
import type { RigChain, RigIdle } from '../../data/art/rigTypes.ts';
import type { RigData } from './RigData.ts';
import { C_OX, C_OY, C_ROT, CH, DEG, type RigSkeleton } from './RigSkeleton.ts';

export const clamp = (x: number, a: number, b: number): number => Math.min(b, Math.max(a, x));

/** The most a spring may move in one second (rad/s): far past anything a tail does, so only a runaway reaches it. */
const MAX_RATE = 120;

export class Spring {
  private y: number;
  private yd = 0;
  private xp: number;
  private k1 = 0;
  private k2 = 0;
  private k3 = 0;

  constructor(public f: number, public z: number, public r: number, x0 = 0) {
    this.y = x0;
    this.xp = x0;
    this.retune();
  }

  retune(f = this.f, z = this.z, r = this.r): void {
    this.f = f;
    this.z = z;
    this.r = r;
    const w = 2 * Math.PI * f;
    this.k1 = z / (Math.PI * f);
    this.k2 = 1 / (w * w);
    this.k3 = (r * z) / w;
  }

  get value(): number {
    return this.y;
  }

  get velocity(): number {
    return this.yd;
  }

  reset(x: number, v = 0): void {
    this.y = x;
    this.yd = v;
    this.xp = x;
  }

  kick(dv: number): void {
    this.yd = clamp(this.yd + dv, -MAX_RATE, MAX_RATE);
  }

  update(dt: number, x: number, xd?: number): number {
    if (!(dt > 0)) return this.y;
    if (!Number.isFinite(x)) return this.y;
    const T = Math.min(dt, 1 / 30);
    const vel = xd ?? (x - this.xp) / T;
    this.xp = x;
    const k2 = Math.max(this.k2, (T * T) / 2 + (T * this.k1) / 2, T * this.k1);
    this.y += T * this.yd;
    this.yd += (T * (x + this.k3 * vel - this.y - this.k1 * this.yd)) / k2;
    this.yd = clamp(this.yd, -MAX_RATE, MAX_RATE);
    if (!Number.isFinite(this.y) || !Number.isFinite(this.yd)) this.reset(x);
    return this.y;
  }
}

interface ChainRt {
  spec: RigChain;
  bones: number[];
  follow: number;
  springs: Spring[];
  hang: number;
  limit: number;
}

/** The chains of a rig, driven against a skeleton. */
export class RigChains {
  private readonly chains: ChainRt[];

  constructor(private readonly skel: RigSkeleton, specs: readonly RigChain[]) {
    const idx = skel.data.boneIndex;
    this.chains = specs.map((spec) => ({
      spec,
      bones: spec.bones.map((b) => idx.get(b)!),
      follow: idx.get(spec.follow)!,
      springs: spec.bones.map((_, i) => new Spring(spec.f * Math.pow(spec.fFalloff ?? 0.88, i), spec.z, spec.r ?? 0)),
      hang: clamp(spec.hang ?? 0.15, 0, 1),
      limit: Math.abs(spec.limit ?? 70) * DEG,
    }));
  }

  get size(): number {
    return this.chains.length;
  }

  reset(): void {
    for (const c of this.chains) for (const s of c.springs) s.reset(0);
  }

  /** Give every chain bone a push (a hit's beat); `falloff` weakens it down the chain. */
  kick(dv: number, falloff = 1): void {
    for (const c of this.chains) c.springs.forEach((s, i) => s.kick(dv * Math.pow(falloff, i)));
  }

  /** The largest angle (radians) any chain bone may take from its parent. */
  get maxLimit(): number {
    return this.chains.reduce((m, c) => Math.max(m, c.limit), 0);
  }

  /**
   * Set the chain bones' `rot` in `pose`. The skeleton must have been solved with this pose's non-chain bones just before (`follow` bones' absolute angles are
   * read from it). `forward` is the figure's speed toward the way it faces, world units a second.
   */
  update(pose: Float64Array, dt: number, forward: number): void {
    const fwd = clamp(forward, -12, 12);
    for (const c of this.chains) {
      let parentAbs = this.skel.absAngle(c.follow);
      for (let i = 0; i < c.bones.length; i++) {
        const bias = ((c.spec.bias?.[i] ?? 0) + (c.spec.drag?.[i] ?? 0) * fwd) * DEG;
        const target = parentAbs * (1 - c.hang) + bias;
        const abs = c.springs[i]!.update(dt, target);
        const rel = clamp(abs - parentAbs, -c.limit, c.limit);
        pose[c.bones[i]! * CH + C_ROT] = rel;
        parentAbs += rel;
      }
    }
  }
}

/** Add the idle's sinusoids to `pose`. `t` seconds on the actor's own clock; `amount` 0..1 scales them all (0 holds the figure still). */
export function applyIdle(pose: Float64Array, data: RigData, idle: RigIdle, t: number, amount: number): void {
  if (amount <= 0) return;
  const w = 2 * Math.PI * idle.hz * t;
  for (const [name, a] of Object.entries(idle.bones)) {
    const o = data.boneIndex.get(name)! * CH;
    const s = Math.sin(w + (a.phase ?? 0)) * amount;
    pose[o + C_ROT] = pose[o + C_ROT]! + (a.rot ?? 0) * DEG * s;
    pose[o + C_OX] = pose[o + C_OX]! + (a.dx ?? 0) * s;
    pose[o + C_OY] = pose[o + C_OY]! + (a.dy ?? 0) * s;
  }
}
