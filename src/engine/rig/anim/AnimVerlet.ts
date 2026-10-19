/**
 * A position-based Verlet chain of two to four joints (the VRM spring bone's update, our own code; both games, presentation only; erasable TS, no `three`), for a braid, a lock of hair, a sash.
 *
 * Per fixed step, joint by joint from the anchor out (the researcher's takeaway 3, `anim-refs/notes.md`): INERTIA (how far the joint moved last step, less drag), STIFFNESS (a push along
 * the joint's rest direction, so the chain springs back to its shape), the body's TRAIL (the figure's own travel, which the painting space does not contain, taken off the particles so a lunge
 * throws the braid back), then a LENGTH constraint (the joint stays one bone from the one before it) and an ANGLE limit from rest (a part never folds through its neighbours). The rest direction of a
 * joint is its bind direction turned by the actual angle of the joint before it, so the whole braid keeps its curl. Output is each bone's rotation relative to its parent.
 *
 * At rest the chain IS the bind shape, so the rig's gated pose is untouched; `mix` (0..1) blends the simulated rotations with the rest ones (a crisp action frame asks for less), and
 * `preroll` settles the chain from rest before the first frame (a scene or a clip that starts does not pop). Fixed step and fixed order, no randomness: the same inputs give the same bits.
 */

export interface VerletSpec {
  /** The chain's bones, root end first (each bone's joint is where its segment starts). */
  bones: readonly string[];
  /** How much of the parent's tilt the chain refuses to follow, 0..1 (a braid keeps hanging down while the head leans). */
  hang: number;
  /** Rest push a second (the joint's return to its curl), about 1.5 to 5. */
  stiffness: number;
  /** Share of last step's velocity lost each step, 0..1. */
  drag: number;
  /** Share of the figure's travel the chain lags by, 0..1. */
  trail: number;
  /** Largest angle from rest, degrees. */
  limit: number;
}

const wrap = (a: number): number => {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x <= -Math.PI) x += 2 * Math.PI;
  return x;
};

export class VerletChain {
  readonly n: number;
  /** Bind angle of each segment (radians, y down, the bone's direction at rest) and its length (px). */
  private readonly phi: Float64Array;
  private readonly len: Float64Array;
  private readonly x: Float64Array;
  private readonly y: Float64Array;
  private readonly px: Float64Array;
  private readonly py: Float64Array;
  private readonly seg: Float64Array;
  private readonly spec: VerletSpec;
  private primed = false;

  /** `joints`: the bind-pose joint of each bone, then one more point for the tail of the last (so `joints.length === bones.length + 1`), painting px. */
  constructor(joints: ReadonlyArray<{ x: number; y: number }>, spec: VerletSpec) {
    this.spec = spec;
    this.n = spec.bones.length;
    if (joints.length !== this.n + 1) throw new Error('verlet: one joint a bone plus the tail');
    this.phi = new Float64Array(this.n);
    this.len = new Float64Array(this.n);
    for (let i = 0; i < this.n; i++) {
      const dx = joints[i + 1]!.x - joints[i]!.x;
      const dy = joints[i + 1]!.y - joints[i]!.y;
      this.phi[i] = Math.atan2(dy, dx);
      this.len[i] = Math.max(1e-6, Math.hypot(dx, dy));
    }
    this.x = new Float64Array(this.n);
    this.y = new Float64Array(this.n);
    this.px = new Float64Array(this.n);
    this.py = new Float64Array(this.n);
    this.seg = new Float64Array(this.n);
  }

  /** Put every joint at its rest place for an anchor at (ax, ay) whose parent has absolute angle `parentAbs`, at rest. */
  reset(ax: number, ay: number, parentAbs: number): void {
    let hx = ax;
    let hy = ay;
    const eff = parentAbs * (1 - this.spec.hang);
    for (let i = 0; i < this.n; i++) {
      const a = this.phi[i]! + eff;
      hx += Math.cos(a) * this.len[i]!;
      hy += Math.sin(a) * this.len[i]!;
      this.x[i] = this.px[i] = hx;
      this.y[i] = this.py[i] = hy;
      this.seg[i] = a;
    }
    this.primed = true;
  }

  /** Settle the chain: `steps` fixed steps with the anchor held (the first frame of a scene). */
  preroll(h: number, ax: number, ay: number, parentAbs: number, steps = 30): void {
    this.reset(ax, ay, parentAbs);
    for (let k = 0; k < steps; k++) this.step(h, ax, ay, parentAbs, 0);
  }

  /** One fixed step. `shiftX` is how far the figure travelled toward the way it faces this step, in painting px (the trail comes from it). */
  step(h: number, ax: number, ay: number, parentAbs: number, shiftX: number): void {
    if (!this.primed) this.reset(ax, ay, parentAbs);
    if (!Number.isFinite(ax + ay + parentAbs + shiftX)) return;
    const s = this.spec;
    const keep = 1 - Math.min(1, Math.max(0, s.drag));
    const eff = parentAbs * (1 - s.hang);
    const limit = (s.limit * Math.PI) / 180;
    const push = h * s.stiffness;
    let hx = ax;
    let hy = ay;
    let prevAbs = eff;
    let prevPhi = 0;
    for (let i = 0; i < this.n; i++) {
      const rest = i === 0 ? this.phi[0]! + eff : prevAbs + (this.phi[i]! - prevPhi);
      const L = this.len[i]!;
      const vx = (this.x[i]! - this.px[i]!) * keep;
      const vy = (this.y[i]! - this.py[i]!) * keep;
      let nx = this.x[i]! + vx + Math.cos(rest) * L * push - shiftX * s.trail;
      let ny = this.y[i]! + vy + Math.sin(rest) * L * push;
      let ang = Math.atan2(ny - hy, nx - hx);
      const dev = Math.max(-limit, Math.min(limit, wrap(ang - rest)));
      ang = rest + dev;
      nx = hx + Math.cos(ang) * L;
      ny = hy + Math.sin(ang) * L;
      if (!Number.isFinite(nx + ny)) {
        nx = hx + Math.cos(rest) * L;
        ny = hy + Math.sin(rest) * L;
        ang = rest;
      }
      this.px[i] = this.x[i]!;
      this.py[i] = this.y[i]!;
      this.x[i] = nx;
      this.y[i] = ny;
      this.seg[i] = ang;
      hx = nx;
      hy = ny;
      prevAbs = ang;
      prevPhi = this.phi[i]!;
    }
  }

  /** Each bone's rotation relative to its parent (radians), blended `mix` of the way from the rest shape (the bone following the parent's tilt by `1 - hang`) to the simulated one. */
  rots(parentAbs: number, mix: number, out: Float64Array | number[]): void {
    const m = Math.min(1, Math.max(0, mix));
    const eff = parentAbs * (1 - this.spec.hang);
    let prevTheta = parentAbs;
    for (let i = 0; i < this.n; i++) {
      const theta = this.seg[i]! - this.phi[i]!;
      const simRel = wrap(theta - prevTheta);
      const restRel = i === 0 ? eff - parentAbs : 0;
      out[i] = restRel + (simRel - restRel) * m;
      prevTheta = theta;
    }
  }
}
