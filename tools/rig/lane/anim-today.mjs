/**
 * **The rig engine as it ships today, as an animator** (the baseline of `anim-sim.mjs --style today`; both games; `docs/handoff/anim-proto.md`): a pose request moves the bones from where the figure is
 * to the key over 120 ms on the game's ease with a start that keeps the speed it had (`RigKeys.RigTransition`), the file's idle plays on top (`RigDynamics.applyIdle`: small sines, in degrees),
 * and the file's lag chain streams the braid (`RigDynamics.RigChains`: a second-order spring a bone chasing the parent's angle). Written out here (those modules need the game's stage) with the
 * same formulas; it answers the calls the simulation makes of the prototype's `RigAnimator`, so one script runs both.
 */
const DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const quadInOut = (u) => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
const slope = (u) => { const h = 1e-4; const a = Math.max(0, u - h), b = Math.min(1, u + h); return b > a ? (quadInOut(b) - quadInOut(a)) / (b - a) : 0; };

class Spring {
  constructor(f, z, r = 0) { this.f = f; this.z = z; this.y = 0; this.yd = 0; this.xp = 0; this.k1 = z / (Math.PI * f); this.k2 = 1 / (2 * Math.PI * f) ** 2; this.k3 = (r * z) / (2 * Math.PI * f); }
  update(dt, x) {
    const T = Math.min(dt, 1 / 30);
    const vel = (x - this.xp) / T;
    this.xp = x;
    const k2 = Math.max(this.k2, (T * T) / 2 + (T * this.k1) / 2, T * this.k1);
    this.y += T * this.yd;
    this.yd = clamp(this.yd + (T * (x + this.k3 * vel - this.y - this.k1 * this.yd)) / k2, -120, 120);
    return this.y;
  }
}

export function makeToday(rt, rig, crossMs = 120) {
  const n = rig.channels;
  const from = new Float64Array(n), to = new Float64Array(n), fromVel = new Float64Array(n);
  const cur = new Float64Array(n), curVel = new Float64Array(n);
  let elapsed = 0, dur = 0, moving = false, clock = 0, finished = false;
  const motion = rt.raw.motion ?? {};
  const idle = motion.idle;
  const chains = (motion.chains ?? []).map((c) => ({ ...c, bi: c.bones.map((b) => rig.boneIndex.get(b)), fi: rig.boneIndex.get(c.follow), sp: c.bones.map((_, i) => new Spring(c.f * Math.pow(c.fFalloff ?? 0.88, i), c.z, c.r ?? 0)) }));
  return {
    handLandmark: 'fist',
    smearing: null,
    playing: '',
    request(key, _fromKey, pose, vel) {
      from.set(pose); fromVel.set(vel); to.set(rig.keys.get(key));
      elapsed = 0; dur = crossMs / 1000; moving = true; finished = false;
      return true;
    },
    begin() {}, lunge() {}, settle() {}, cancel() { moving = false; },
    lead: () => -1,
    beat: () => ({ punch: 0 }),
    drain: () => [],
    /** The move in flight, as `RigTransition.step` computes it (`p0 + (p1 - p0) ease(u) + d v0 u (1 - u)^2`); true while it moves and on the frame it lands. */
    step(f, out, vel) {
      clock += f.dt;
      if (!moving) { if (finished) { finished = false; return false; } return false; }
      elapsed += f.dt * f.rate;
      const d = dur;
      const u = Math.min(1, elapsed / d);
      if (u >= 1) { out.set(to); vel.fill(0); moving = false; finished = true; return true; }
      const e = quadInOut(u), de = slope(u) / d, w = u * (1 - u) * (1 - u), dw = (1 - u) * (1 - u) - 2 * u * (1 - u);
      for (let i = 0; i < n; i++) {
        const p0 = from[i], delta = to[i] - p0, v0 = fromVel[i];
        out[i] = p0 + delta * e + d * v0 * w;
        vel[i] = delta * de + v0 * dw;
      }
      cur.set(out); curVel.set(vel);
      return true;
    },
    idle(work, f) {
      if (!idle || f.calm) return;
      const w = 2 * Math.PI * idle.hz * clock;
      for (const [name, a] of Object.entries(idle.bones)) {
        const o = rig.boneIndex.get(name) * 5;
        const s = Math.sin(w + (a.phase ?? 0));
        work[o] += (a.rot ?? 0) * DEG * s;
        work[o + 1] += (a.dx ?? 0) * s;
        work[o + 2] += (a.dy ?? 0) * s;
      }
    },
    /** The lag chains, over the skeleton solved from `work` (`m`: six numbers a bone). */
    secondaryStep(work, f, m) {
      const fwd = clamp(f.forward, -12, 12);
      for (const c of chains) {
        const q = c.fi * 6;
        let parentAbs = Math.atan2(m[q + 1], m[q]);
        const limit = Math.abs(c.limit ?? 70) * DEG;
        for (let i = 0; i < c.bi.length; i++) {
          const bias = ((c.bias?.[i] ?? 0) + (c.drag?.[i] ?? 0) * fwd) * DEG;
          const target = parentAbs * (1 - clamp(c.hang ?? 0.15, 0, 1)) + bias;
          const abs = c.sp[i].update(f.dt, target);
          const rel = clamp(abs - parentAbs, -limit, limit);
          work[c.bi[i] * 5] = rel;
          parentAbs += rel;
        }
      }
    },
  };
}
