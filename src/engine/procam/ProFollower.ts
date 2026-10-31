/**
 * THE FFX-2 AUTO CAMERA, re-staged on Chapter IV's 2.5D set (PRO CAMERA, `?camera=pro`; FFX-2 only). Pure: no `three`, no DOM.
 *
 * What the real game does (the real-motion lane's `shots.json`, `ffx2AutoCamera`; DECODED from the exe and its scripts, no PS2/FFX-2 recording exists, so none of it is PROVEN): FFX-2 has no shot
 * per action in this fight. One camera looks at the centroid of the living group (each member aimed at 0.9 of its height) from the best of a grid of angles, follows that choice with a
 * smoothing follower (the focus 25 percent of the error per 1/30 s step, the eye angles 12.5 percent, the radius 12.5 percent: a glide of about a second), re-picks the next-ranked angle
 * when a script calls Next (a girl in or out, an effect ending) and on its own on an idle timer, and never cuts per action.
 *
 * What this file does with it, on the painted plate (OURS where marked):
 *
 * - the focus is the same centroid, aimed at 0.9 of each member's height, and it is followed by a critically damped glide (`ProSmooth.ts`), not an exponential: no jolt at the start;
 * - the angle is chosen from the real, plate-clamped candidates (`PRO_AUTO_CAMERA.cands`: four, ranked by the real score) and the camera stands {@link FOLLOW_BLEND} of the way from the
 *   game's own resting rig (`idle`, the composition the HUD and the light are tuned to) toward that candidate [ours]. The faithful candidate alone makes the girls about 20 percent of the
 *   frame's height (the options book measured it); the blend keeps them near the resting 31 percent and still moves with the group and with every re-pick;
 * - a re-pick glides to the next candidate, at most every {@link REPICK_EVERY} effect ends [ours: the real camera re-picks at each one], and on an idle timer drawn from the real range;
 * - the eye never moves faster than {@link MAX_EYE_SPEED} m/s (about 12 degrees a second at the resting distance: under the `calm` preset's 20 [D-291]);
 * - nobody is cropped: the glide's pose is dollied back until the girls and Bahamut's body sit inside the safe rectangle (`ProFit.ts`);
 * - while a command menu holds the target frame (D-357) the camera is back on the resting rig in the hold's own 320 ms (a reticle is projected once, when the cursor opens, so a camera that keeps
 *   gliding puts it off its target); while REDUCE MOTION is on it glides back and stays there.
 */
import { lerpPose, lerp3, add3, sub3, mul3, dampK, clamp, ease } from './ProMath.ts';
import { DampedV3, smoothDamp, type Damped } from './ProSmooth.ts';
import type { Pose, ProAutoCamera, V3 } from './ProTypes.ts';

/** How far from the resting rig toward the real auto-camera candidate the camera stands (0 = the resting rig, 1 = the faithful candidate). OURS. */
export const FOLLOW_BLEND = 0.5;
/** The follower re-picks the next-ranked angle at every this-many effect ends (the real camera: every one). OURS. */
export const REPICK_EVERY = 2;
/** The most the eye moves, metres a second (the `calm` preset caps a rig move at 20 degrees a second; at the resting 10 m this is 12). */
export const MAX_EYE_SPEED = 2.2;
/** The glide times, seconds: the eye, the look-at, the lens (the real follower's gains give about 0.3 s; OURS is slower, on a second-order glide). */
export const GLIDE = { eye: 0.9, look: 0.55, fov: 0.9 } as const;
/** The never-crop rectangle (NDC half extents) the girls and Bahamut are kept inside. */
export const FOLLOW_SAFE = { x: 0.84, y: 0.9 } as const;
/** The way back to the resting rig when a command menu holds the target frame (or the switch goes off), ms: the hold's own settle, `TARGET_FRAME_SETTLE_MS` (D-357, PR-0150). */
export const HOME_MS = 320;

/** A member of the camera group, as the stage reports it. */
export interface Member {
  readonly id: string;
  readonly feet: V3;
  readonly height: number;
}

export interface FollowerHost {
  /** The group: the party and the boss, with the live feet and height of each. */
  members(): readonly Member[];
  /** A command menu holds the target frame. */
  held(): boolean;
  /**
   * A mid-battle script has CUT the camera to a shot of its own (`ProAutoStage.scriptedShot`: Chapter XI's `road-links` rig, the between-links shot whose plate the scene draws by the camera's position): the
   * follower is the rig's own at once, a cut stays a cut, and it eases back in from there when the script cuts away. Optional and additive (booth-ffx2-b2, FFX-2 only): a host without it never stands down.
   */
  scripted?(): boolean;
  /** REDUCE MOTION. */
  still(): boolean;
  /** The never-crop dolly factor for this pose (1 = nobody is cropped). */
  fitK(pose: Pose): number;
}

/** A small deterministic generator (the camera's own dice, repeatable). */
export function lcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export class ProFollower {
  private readonly eye = new DampedV3([0, 0, 0]);
  private readonly look = new DampedV3([0, 0, 0]);
  private readonly fov: Damped = { value: 0, velocity: 0 };
  private started = false;
  private idx = 0;
  private effectEnds = 0;
  private idleT = 0;
  private fitK = 1;
  private homeT = -1;
  private homeFrom: Pose | null = null;
  private readonly dice: () => number;
  private nextIdle: number;
  /** The weight toward the candidate this frame (0..1), for the debug surface. */
  weight = 0;
  /** The last pose answered. */
  pose: Pose | null = null;

  constructor(
    private readonly host: FollowerHost,
    private readonly cfg: ProAutoCamera,
    seed = 7,
  ) {
    this.dice = lcg(seed);
    this.nextIdle = this.drawIdle();
  }

  private drawIdle(): number {
    // the real timer: uniform 0..1200 steps (40 s), the next-ranked angle at 600 steps (20 s) or more; here no sooner than the real 20 s and no later than the real 40 s
    const lo = (this.cfg.idle.repickAtOrAbove / 30);
    const hi = (this.cfg.idle.uniformMax / 30);
    return lo + this.dice() * (hi - lo);
  }

  /** An effect ended (a girl's action closed): every {@link REPICK_EVERY}th one glides to the next-ranked angle. */
  effectEnd(): void {
    this.idleT = 0;
    if (++this.effectEnds % REPICK_EVERY === 0) this.repick();
  }

  repick(): void {
    this.idx = (this.idx + 1) % Math.max(1, this.cfg.cands.length);
    this.idleT = 0;
    this.nextIdle = this.drawIdle();
  }

  /** The candidate now chosen (index into the ranked list). */
  get candidate(): number {
    return this.idx;
  }

  /** The group's focus: the centroid of the members, each at 0.9 of its height (the real rule). */
  focus(): V3 | null {
    const m = this.host.members();
    if (m.length === 0) return null;
    let f: V3 = [0, 0, 0];
    for (const x of m) f = add3(f, [x.feet[0], x.feet[1] + 0.9 * x.height, x.feet[2]]);
    return mul3(f, 1 / m.length);
  }

  /**
   * Held: the pose goes home in {@link HOME_MS} on one curve (from where it stood when the hold began to the rig's own, which is on its way to the same frame), then it is the rig's. `cut`: a script cut the camera
   * (`FollowerHost.scripted`), so there is no way home to glide: the rig's own pose at once.
   */
  private home(dt: number, base: Pose, cut = false): Pose {
    if (cut) {
      this.homeT = HOME_MS;
      this.homeFrom = base;
    } else if (this.homeT < 0 || this.homeFrom === null) {
      this.homeT = 0;
      this.homeFrom = this.pose ?? base;
    }
    this.homeT += dt * 1000;
    const pose = this.homeT >= HOME_MS ? base : lerpPose(this.homeFrom, base, ease('cubic', this.homeT / HOME_MS));
    this.eye.set(pose.pos); // a release continues from here: no velocity left over, no jump
    this.look.set(pose.look);
    this.fov.value = pose.fov;
    this.fov.velocity = 0;
    this.weight = 0;
    this.fitK = 1;
    this.started = !cut; // a cut ends in a cut: the first free step takes the rig the script returns to whole, it does not glide there from the cut shot
    this.pose = pose;
    return pose;
  }

  /** The pose the camera stands on this frame, given the game's own resting rig as `base`. */
  step(dt: number, base: Pose): Pose {
    const cut = this.host.scripted?.() === true;
    if (cut || this.host.held()) return this.home(dt, base, cut);
    this.homeT = -1;
    const f = this.focus();
    const calm = this.host.still() || f === null;
    const wT = calm ? 0 : FOLLOW_BLEND;
    this.weight += (wT - this.weight) * dampK(2.2, dt);
    let target = base;
    if (f && this.weight > 0.001) {
      const c = this.cfg.cands[this.idx % this.cfg.cands.length]!;
      const d = sub3(f, this.cfg.focus);
      const cand: Pose = { pos: add3(c.eye, d), look: f, fov: this.cfg.lensDeg, roll: 0 };
      target = lerpPose(base, cand, this.weight);
    }
    if (!this.started || this.host.still()) {
      this.eye.set(target.pos);
      this.look.set(target.look);
      this.fov.value = target.fov;
      this.fov.velocity = 0;
      this.started = true;
    } else {
      this.eye.step(target.pos, GLIDE.eye, dt, MAX_EYE_SPEED);
      this.look.step(target.look, GLIDE.look, dt);
      smoothDamp(this.fov, target.fov, GLIDE.fov, dt, 8);
    }
    let pose: Pose = { pos: this.eye.value, look: this.look.value, fov: this.fov.value, roll: 0 };
    let kT = 1;
    if (!calm) {
      this.idleT += dt;
      if (this.idleT > this.nextIdle) this.repick();
      kT = this.host.fitK(pose);
    }
    this.fitK = kT >= this.fitK ? kT : this.fitK + (kT - this.fitK) * dampK(2.5, dt); // widens at once, relaxes at a measured rate: no pop
    if (this.fitK > 1.0001) pose = { ...pose, pos: add3(pose.look, mul3(sub3(pose.pos, pose.look), clamp(this.fitK, 1, 2.2))) };
    this.pose = pose;
    return pose;
  }

  /** The look-at as a blend of the base and the candidate, for tests. */
  static blend(base: Pose, cand: Pose, w: number): Pose {
    return { pos: lerp3(base.pos, cand.pos, w), look: lerp3(base.look, cand.look, w), fov: base.fov + (cand.fov - base.fov) * w, roll: 0 };
  }
}
