/**
 * Action clips for the animation prototype (`?anim=proto`; both games, presentation only; no `three`, no DOM, erasable TS so a Node tool may import it).
 *
 * A CLIP is a short timeline of key poses laid over the rig's existing keys: each SEGMENT is "move to this pose over `ms`, on this curve, then hold for `hold`". A pose is built from the rig's own
 * keys and bone transforms, so no new painting is needed (`PoseSpec`): a key, or a blend of two keys (`mix` may leave 0..1, which EXTRAPOLATES: `attack` mixed -0.35 toward `ready` is the strike
 * pulled further than the painted one, an overshoot; `ready` mixed -0.5 toward `attack` is the wind-up, the pose pulled back the other way), plus additive bone deltas.
 *
 * Deterministic and exact: `sampleClip(c, t)` is a pure function of the compiled clip and `t`; the pose at a segment's end time IS its target, to the last bit (every curve is exactly 1 at u = 1),
 * so the frame a `mark` names (the strike's contact, the spell's release) is the frame the pose is reached. The first segment starts from whatever the figure was doing and, given its velocity, leaves
 * at that speed (the same carry-over term as `RigKeys.RigTransition`), so a request that lands mid-move does not jerk.
 *
 * Channels are the rig's own (`RigSkeleton`: five numbers a bone, rot in radians, offsets in painting px, scales); the constants are repeated here so this file stays importable from a Node tool,
 * and `tests/unit/rig/anim-clip.test.ts` pins them to `RigSkeleton`'s.
 */
import { ease, type EaseSpec } from './AnimEase.ts';

export const CH = 5;
export const C_ROT = 0;
export const C_OX = 1;
export const C_OY = 2;
export const C_SX = 3;
export const C_SY = 4;

/** An addition to one bone's channels: `rot` radians clockwise, `dx` and `dy` painting px, `sx` and `sy` ADDED to the scale (0.1 = ten percent larger). */
export interface BoneDelta {
  rot?: number;
  dx?: number;
  dy?: number;
  sx?: number;
  sy?: number;
}

/** A pose from the rig's keys: `base`, or `base` blended `mix` of the way to `to` (outside 0..1 extrapolates), then `add` per bone and `root` on every root bone. */
export interface PoseSpec {
  base: string;
  to?: string;
  mix?: number;
  /** Blend only these bones toward `to` (an arm taken from another key, the body kept); absent = every bone. */
  only?: readonly string[];
  /** The most an EXTRAPOLATION (`mix` outside 0..1) may add to any bone: radians of rot, painting px of offset, scale. A key pair a whole arm apart would otherwise fling it a quarter of that again. */
  cap?: { rot: number; px: number; scale: number };
  add?: Readonly<Record<string, BoneDelta>>;
  root?: BoneDelta;
}

export interface Segment {
  pose: PoseSpec;
  /** Milliseconds to move into the pose (0 = at once). */
  ms: number;
  ease?: EaseSpec;
  /** Milliseconds held at the pose after the move. */
  hold?: number;
  /** Names the moment the pose is reached (the end of the move), or the start of the move with `markAt: 'start'`. */
  mark?: string;
  markAt?: 'start' | 'end';
  /** How much of the living layer (breath, weight shift, secondary motion) shows at the end of this move, 0..1 (default 1; an action that must read crisp lowers it). */
  alive?: number;
  /** The same for the secondary layer (the springs and the braid), 0..1 (default 1): a body going down keeps its arms flopping while the breath stops. */
  sec?: number;
}

export interface ClipDef {
  name: string;
  /** The rig key the figure is reported as while the clip plays and after it (`RigActor.pose`), and the pose a clip that ends is expected to rest at. */
  key: string;
  segments: readonly Segment[];
  /** Plays again from the start when it ends (a held stance with life in it). */
  loop?: boolean;
  /** Turn every bone the SHORT way round between one pose and the next (angle space: a rotation 270 degrees apart in the keys is 90 the other way), see {@link unwrapTargets}. Off by default: the gate scanned the linear path. */
  shortArc?: boolean;
}

/** What a clip needs of a rig: the bone names, the root bones, and every key compiled to channels. */
export interface ClipRig {
  readonly boneIndex: ReadonlyMap<string, number>;
  readonly roots: readonly number[];
  readonly keys: ReadonlyMap<string, Float64Array>;
  readonly channels: number;
}

export interface CompiledClip {
  readonly name: string;
  readonly key: string;
  readonly loop: boolean;
  readonly shortArc: boolean;
  readonly count: number;
  /** Per segment: the start of its move, the length of its move, its hold, in ms. */
  readonly start: readonly number[];
  readonly dur: readonly number[];
  readonly hold: readonly number[];
  readonly ease: readonly EaseSpec[];
  readonly alive: readonly number[];
  readonly sec: readonly number[];
  readonly target: readonly Float64Array[];
  /** Mark name to the ms it happens at. */
  readonly marks: Readonly<Record<string, number>>;
  /** Length of the whole clip in ms (the end of the last hold). */
  readonly total: number;
}

function addDelta(out: Float64Array, o: number, d: BoneDelta): void {
  out[o + C_ROT] = out[o + C_ROT]! + (d.rot ?? 0);
  out[o + C_OX] = out[o + C_OX]! + (d.dx ?? 0);
  out[o + C_OY] = out[o + C_OY]! + (d.dy ?? 0);
  out[o + C_SX] = out[o + C_SX]! + (d.sx ?? 0);
  out[o + C_SY] = out[o + C_SY]! + (d.sy ?? 0);
}

/** A pose spec as channels. Throws for an unknown key or bone (a clip authored against the wrong rig should fail loudly, once, when it is compiled). */
export function compilePose(rig: ClipRig, spec: PoseSpec, into?: Float64Array): Float64Array {
  const a = rig.keys.get(spec.base);
  if (!a) throw new Error(`anim: no key "${spec.base}"`);
  const out = into ?? new Float64Array(rig.channels);
  out.set(a);
  if (spec.to !== undefined) {
    const b = rig.keys.get(spec.to);
    if (!b) throw new Error(`anim: no key "${spec.to}"`);
    const m = spec.mix ?? 0.5;
    const mixOne = (c: number): void => {
      let d = (b[c]! - a[c]!) * m;
      if (spec.cap && (m < 0 || m > 1)) {
        const k = c % CH === C_ROT ? spec.cap.rot : c % CH === C_OX || c % CH === C_OY ? spec.cap.px : spec.cap.scale;
        d = Math.max(-k, Math.min(k, d));
      }
      out[c] = a[c]! + d;
    };
    if (spec.only) {
      for (const name of spec.only) {
        const bi = rig.boneIndex.get(name);
        if (bi === undefined) throw new Error(`anim: no bone "${name}"`);
        for (let c = bi * CH; c < bi * CH + CH; c++) mixOne(c);
      }
    } else for (let i = 0; i < out.length; i++) mixOne(i);
  }
  if (spec.add) {
    for (const [bone, d] of Object.entries(spec.add)) {
      const i = rig.boneIndex.get(bone);
      if (i === undefined) throw new Error(`anim: no bone "${bone}"`);
      addDelta(out, i * CH, d);
    }
  }
  if (spec.root) for (const r of rig.roots) addDelta(out, r * CH, spec.root);
  return out;
}

export function compileClip(rig: ClipRig, def: ClipDef): CompiledClip {
  const start: number[] = [];
  const dur: number[] = [];
  const hold: number[] = [];
  const easeOf: EaseSpec[] = [];
  const alive: number[] = [];
  const sec: number[] = [];
  const target: Float64Array[] = [];
  const marks: Record<string, number> = {};
  let t = 0;
  for (const s of def.segments) {
    const ms = Math.max(0, s.ms);
    const held = Math.max(0, s.hold ?? 0);
    start.push(t);
    dur.push(ms);
    hold.push(held);
    easeOf.push(s.ease ?? 'quadInOut');
    alive.push(Math.min(1, Math.max(0, s.alive ?? 1)));
    sec.push(Math.min(1, Math.max(0, s.sec ?? 1)));
    target.push(compilePose(rig, s.pose));
    if (s.mark !== undefined) marks[s.mark] = s.markAt === 'start' ? t : t + ms;
    t += ms + held;
  }
  return { name: def.name, key: def.key, loop: def.loop === true, shortArc: def.shortArc === true, count: def.segments.length, start, dur, hold, ease: easeOf, alive, sec, target, marks, total: t };
}

/** The ms a mark happens at (NaN for a name the clip does not have). */
export const markTime = (c: CompiledClip, name: string): number => c.marks[name] ?? NaN;

/** The first frame at `fps` whose time has reached `ms`: the frame a mark is on. */
export const frameOf = (ms: number, fps = 60): number => Math.max(0, Math.ceil((ms * fps) / 1000 - 1e-9));

/**
 * The pose `tMs` into the clip, in `out`; the idle's weight is returned (and both weights are written to `live` when given). `from` is the pose the figure was in when the clip began (segment 0 moves out of it); `v0` (channel units per
 * second) is the speed it had, carried into the first move the way `RigTransition` carries it. A looping clip wraps (its first move then leaves the last pose); a clip that is not looping holds
 * its last pose.
 */
export function sampleClip(c: CompiledClip, tMs: number, from: Float64Array, out: Float64Array, v0?: Float64Array, targets: readonly Float64Array[] = c.target, live?: ClipLive): number {
  if (c.count === 0) {
    out.set(from);
    if (live) { live.sec = live.alive = 1; live.seg = 0; live.e = 1; }
    return 1;
  }
  let t = Math.max(0, tMs);
  if (c.loop && c.total > 0) t %= c.total;
  let i = c.count - 1;
  for (let k = 0; k < c.count; k++) {
    if (t < c.start[k]! + c.dur[k]! + c.hold[k]!) {
      i = k;
      break;
    }
  }
  const d = c.dur[i]!;
  const u = d > 0 ? Math.min(1, Math.max(0, (t - c.start[i]!) / d)) : 1;
  const e = ease(c.ease[i]!, u);
  const goal = targets[i]!;
  const prev = i === 0 ? (c.loop ? targets[c.count - 1]! : from) : targets[i - 1]!;
  const carry = i === 0 && v0 !== undefined && !c.loop ? (d / 1000) * u * (1 - u) * (1 - u) : 0;
  for (let j = 0; j < out.length; j++) {
    const p0 = prev[j]!;
    out[j] = e === 1 ? goal[j]! : p0 + (goal[j]! - p0) * e + (carry !== 0 ? carry * v0![j]! : 0); // exactly the target at the end of the move
  }
  const w = ease('sineInOut', u);
  const a0 = i === 0 ? c.alive[0]! : c.alive[i - 1]!;
  const alive = a0 + (c.alive[i]! - a0) * w;
  if (live) {
    const s0 = i === 0 ? c.sec[0]! : c.sec[i - 1]!;
    live.alive = alive;
    live.seg = i;
    live.e = e;
    live.sec = s0 + (c.sec[i]! - s0) * w;
  }
  return alive;
}

/** The living-layer weights a clip asks for at a moment (the idle's breath and shift, the secondary layer's mix), each 0..1. */
export interface ClipLive {
  alive: number;
  sec: number;
  /** The segment the time is in, and the eased progress of its move (outside 0..1 on a back curve): what a derived value (a carried prop's offset) follows. */
  seg: number;
  e: number;
}

const TAU = Math.PI * 2;

/**
 * The clip's targets with every rotation turned the short way round from the pose before it (`from` for the first): each rot is shifted by whole turns until it lies within a half turn of its
 * predecessor, so a blend rotates the bone about its pivot through the smaller angle instead of sweeping the long way (angle-space blending; the researcher's takeaway 1). The offsets and
 * scales are untouched. Returns `c.target` itself when the clip does not ask for it or nothing needed turning.
 */
export function unwrapTargets(c: CompiledClip, from: Float64Array): readonly Float64Array[] {
  if (!c.shortArc) return c.target;
  let changed = false;
  const out = c.target.map((t) => Float64Array.from(t));
  let prev = from;
  for (const t of out) {
    for (let o = 0; o < t.length; o += CH) {
      const d = t[o]! - prev[o]!;
      const turns = Math.round(d / TAU);
      if (turns !== 0) {
        t[o] = t[o]! - turns * TAU;
        changed = true;
      }
    }
    prev = t;
  }
  return changed ? out : c.target;
}
