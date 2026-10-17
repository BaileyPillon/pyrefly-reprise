/**
 * Poses of a rig: a pose name resolves to a key, a key compiles to a channel array, and the figure moves between keys on a velocity-continuous ease.
 * Pure TypeScript: no `three`, no DOM.
 *
 * **Names.** The presenter asks for the game's pose names (`attack`, `hurt`, `ko`, `victory`, `od-<ability>`, ...). A pose with no key resolves down the game's
 * own chain (`BattlePresenterActors.resolvePoseName`: `attack` to `ready` to `idle`) over the rig's key names; a name the chain does not list goes to `idle`.
 * `idle` always exists (the file is refused without it).
 *
 * **Easing.** From the current value `p0` (moving at `v0`) to the target `p1` over `d` seconds, with `u = t / d`:
 *
 *     p(u) = p0 + (p1 - p0) * ease(u) + d * v0 * u * (1 - u)^2
 *
 * `ease` is the game's own `quadInOut` (the one every actor tween and the pose cross-fade use). The last term has slope `v0` at `u = 0` and vanishes, with its slope,
 * at `u = 1`: a transition that begins while the figure is already moving (a hit lands mid-lunge) starts at the speed it had, so nothing steps or jerks, and a
 * transition that begins at rest is the plain eased move.
 */
import { Easing } from '../Tween.ts';
import { POSE_FALLBACKS } from '../BattlePresenterActors.ts';
import type { RigKey } from '../../data/art/rigTypes.ts';
import type { RigData } from './RigData.ts';
import { C_OX, C_OY, C_ROT, C_SX, C_SY, CH, bindPose } from './RigSkeleton.ts';

/**
 * The names the presenter asks for that `POSE_FALLBACKS` (the actor's own chain) does not list, as the art loader's chain has them
 * (`BattlePresenterArt.resolvePoseMap`): a `follow` is the attack's follow-through, the rest fall to the idle.
 */
const ART_EXTRA: Readonly<Record<string, readonly string[]>> = {
  follow: ['follow', 'attack', 'ready', 'idle'],
  sleep: ['sleep', 'idle'],
  critical: ['critical', 'idle'],
  telegraph: ['telegraph', 'idle'],
};

/** FFX-2 dresspheres never borrow another action's painting (D-179, Bailey 2026-09-25): cast, item and KO fall straight to the idle. FFX-2 only. */
const DRESSPHERE: Readonly<Record<string, readonly string[]>> = { cast: ['cast', 'idle'], item: ['item', 'idle'], ko: ['ko', 'idle'] };

/** The poses to try for a request, best first: the name itself, then the game's chain for it. */
export function poseChain(name: string, dressphere = false): readonly string[] {
  return (dressphere ? DRESSPHERE[name] : undefined) ?? ART_EXTRA[name] ?? POSE_FALLBACKS[name] ?? [name];
}

/**
 * The rig key a pose request lands on: the first of its chain the rig has. **Null when nothing on the chain is a key** (a name the game has no chain for and the
 * rig has no key of): the figure stays in the pose it is in, as `PaintedActor.setPose` does for a pose it cannot draw. `idle` always exists, so every name with a
 * chain resolves.
 */
export function resolveKeyName(name: string, keys: ReadonlySet<string> | ReadonlyMap<string, unknown>, dressphere = false): string | null {
  for (const p of poseChain(name, dressphere)) if (keys.has(p)) return p;
  return keys.has(name) ? name : null;
}

/** A key as channels (radians). The whole-figure `root` offset is added to every root bone. */
export function compileKey(data: RigData, key: RigKey, into?: Float64Array): Float64Array {
  const out = bindPose(data.bones.length, into);
  for (const [name, x] of Object.entries(key.bones)) {
    const o = data.boneIndex.get(name)! * CH;
    out[o + C_ROT] = x.rot ?? 0;
    out[o + C_OX] = x.dx ?? 0;
    out[o + C_OY] = x.dy ?? 0;
    out[o + C_SX] = x.sx ?? 1;
    out[o + C_SY] = x.sy ?? 1;
  }
  if (key.root) {
    for (const r of data.roots) {
      const o = r * CH;
      out[o + C_ROT] = out[o + C_ROT]! + (key.root.rot ?? 0);
      out[o + C_OX] = out[o + C_OX]! + (key.root.dx ?? 0);
      out[o + C_OY] = out[o + C_OY]! + (key.root.dy ?? 0);
    }
  }
  return out;
}

/** Every key of the rig, compiled once. */
export function compileKeys(data: RigData): Map<string, Float64Array> {
  const out = new Map<string, Float64Array>();
  for (const [name, key] of data.keys) out.set(name, compileKey(data, key));
  return out;
}

/** d ease / du by a central difference on the game's own ease (so a change to `Easing.quadInOut` cannot leave this behind). */
function easeSlope(u: number): number {
  const h = 1e-4;
  const a = Math.max(0, u - h);
  const b = Math.min(1, u + h);
  return b > a ? (Easing.quadInOut(b) - Easing.quadInOut(a)) / (b - a) : 0;
}

/**
 * The figure's pose between keys. `current` is what to draw; `velocity` is its time derivative (channel units per second), kept analytic so a retarget in the middle
 * of a move can carry it.
 */
export class RigTransition {
  readonly current: Float64Array;
  readonly velocity: Float64Array;
  private readonly from: Float64Array;
  private readonly to: Float64Array;
  private readonly fromVelocity: Float64Array;
  private elapsed = 0;
  private dur = 0;
  private moving = false;

  constructor(readonly channels: number, rest: Float64Array) {
    this.current = Float64Array.from(rest);
    this.velocity = new Float64Array(channels);
    this.from = Float64Array.from(rest);
    this.to = Float64Array.from(rest);
    this.fromVelocity = new Float64Array(channels);
  }

  /** True while a move is in flight. */
  get busy(): boolean {
    return this.moving;
  }

  /** Jump to `target` at once and stop. */
  snap(target: Float64Array): void {
    this.current.set(target);
    this.to.set(target);
    this.from.set(target);
    this.velocity.fill(0);
    this.moving = false;
    this.elapsed = 0;
  }

  /** Start moving to `target` over `ms`, from where the figure is and at the speed it has. `ms <= 0` snaps. */
  retarget(target: Float64Array, ms: number): void {
    if (ms <= 0) return this.snap(target);
    this.from.set(this.current);
    this.to.set(target);
    this.fromVelocity.set(this.velocity);
    this.elapsed = 0;
    this.dur = ms / 1000;
    this.moving = true;
  }

  /** Advance by `dt` seconds (0 holds: a hit-stop freezes the figure where it is). */
  step(dt: number): void {
    if (!this.moving || dt <= 0) return;
    this.elapsed += dt;
    const d = this.dur;
    const u = Math.min(1, this.elapsed / d);
    if (u >= 1) {
      this.current.set(this.to);
      this.velocity.fill(0);
      this.moving = false;
      return;
    }
    const e = Easing.quadInOut(u);
    const de = easeSlope(u) / d;
    const w = u * (1 - u) * (1 - u);
    const dw = (1 - u) * (1 - u) - 2 * u * (1 - u);
    for (let i = 0; i < this.channels; i++) {
      const p0 = this.from[i]!;
      const delta = this.to[i]! - p0;
      const v0 = this.fromVelocity[i]!;
      this.current[i] = p0 + delta * e + d * v0 * w;
      this.velocity[i] = delta * de + v0 * dw;
    }
  }
}
