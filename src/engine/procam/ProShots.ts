/**
 * The REAL SHOTS of Chapter I as runs (PRO CAMERA, `?camera=pro`; FFX only), and the few authored ones around them. Pure: no `three`, no DOM.
 *
 * `data/procam/proShots.ts` holds the real FFX camera shots the real-motion lane laid on our Gagazet stage (caster close shot, black-magic landings, Seymour's start and launch shots, the killing
 * blow, the victory close-ups, the skill start). This file picks a variant, lays it on the figures where they really stand (`ProTrack.registerKeys`), times it to the move it covers and wraps it
 * as a {@link ProRun}. What is OURS, and said so where it is: the registration and the 35-degree plate clamp (the lane's), the squeeze of a shot to our shorter move, the eased entrance and exit
 * (the real game hard-cuts in and out), the lens breathing, and the three authored stand-ins -- the low frame for Seymour's two big launches, the first half of the killing blow, FFX-2's
 * specials -- where the real shot does not survive our stage (the options book's mock-up measured it: the launch sweep reads far and small; the run's push has no vectors in the keys).
 */
import { PRO_SHOTS } from '../../data/procam/proShots.ts';
import { add3, lerp3, mul3, norm3, sub3, ease, DEG } from './ProMath.ts';
import { registerKeys, registrationOf, sampleKeys, timeScale, pickWeighted, type Key, type LiveSpot } from './ProTrack.ts';
import type { EaseName, Pose, ProFit, ProRun, ProShotRow, V3 } from './ProTypes.ts';

export type Character = 'tidus' | 'yuna' | 'kimahri';

/** The table's character for a combatant: its art id or its id; anyone else is read as Tidus (the shot is registered to the real feet, so only its look is borrowed). */
export function characterOf(artId: string | undefined, id: string): Character {
  const s = `${artId ?? ''} ${id}`.toLowerCase();
  if (s.includes('yuna')) return 'yuna';
  if (s.includes('kimahri')) return 'kimahri';
  return 'tidus';
}

/** The variants of a group (`cast.start.yuna`, `launch.flare`...), in the order of their `#n`. */
export function rowsOf(group: string): readonly ProShotRow[] {
  return PRO_SHOTS[group] ?? [];
}

/** One variant: a fixed number (clamped to what exists) or a weighted draw. */
export function pickRow(rows: readonly ProShotRow[], choice: number | 'random', draw: number): ProShotRow | undefined {
  if (rows.length === 0) return undefined;
  if (choice === 'random') return pickWeighted(rows, draw);
  return rows[Math.min(Math.max(0, choice), rows.length - 1)];
}

/** How a keyed shot is played. */
export interface KeyRunOpts {
  readonly inMs: number;
  readonly inEase?: EaseName;
  readonly outMs: number;
  readonly outEase?: EaseName;
  readonly fit?: ProFit | undefined;
  readonly breathe?: number | undefined;
  readonly maxMs?: number | undefined;
  readonly sway?: number | undefined;
  readonly focus?: readonly string[] | undefined;
  /** Reduce Motion: the shot's first frame, held (a cut in and a cut out). */
  readonly still?: boolean;
}

/** A run that plays a key list as it stands (absolute poses; the rig's own pose is only what it blends in from and out to). */
export function keyRun(id: string, keys: readonly Key[], o: KeyRunOpts): ProRun {
  return {
    id,
    inMs: o.still ? 0 : o.inMs,
    inEase: o.inEase ?? 'cubic',
    outMs: o.still ? 0 : o.outMs,
    outEase: o.outEase ?? 'cubic',
    fit: o.fit,
    breathe: o.still ? undefined : o.breathe,
    maxMs: o.maxMs,
    rate: o.still ? 0 : 1,
    sway: o.sway ?? 0.3,
    focus: o.focus,
    sample: (t) => sampleKeys(keys, t),
  };
}

/** A real shot laid on the figures and squeezed so it lasts `toMs` (null: its own length). */
export function laidShot(row: ProShotRow, live: LiveSpot, scaleMode: 'party' | 'live', toMs: number | null): Key[] {
  const keys = registerKeys(row, live, registrationOf(row, live, scaleMode));
  return toMs === null ? keys : timeScale(keys, toMs / Math.max(1, row.ms));
}

// ------------------------------------------------------------------------------ authored stand-ins (OURS)

/**
 * How far from its own aim a real launch sweep keeps its eye (OURS; review of 162c3fdbc, m3): Seymour's Flare, Banish and Full-Life launches stand 11 m up and 10 m back, so the party is 13 percent
 * of the frame and the plate's edges show; each key's eye is brought this share of the way to the key's own aim (the direction of the view, the lens and the roll stay the real ones).
 */
export const LAUNCH_CLOSER = 0.5;

/** The keys with every eye moved to `k` times its distance from its own aim, along the view. */
export function closerKeys(keys: readonly Key[], k: number): Key[] {
  return keys.map((key) => ({ ...key, pose: { ...key.pose, pos: add3(key.pose.look, mul3(sub3(key.pose.pos, key.pose.look), k)) } }));
}

/** The party's centre on the floor, from the feet. */
export function centreOf(feet: readonly V3[]): V3 {
  const n = Math.max(1, feet.length);
  return mul3(feet.reduce((a, f) => add3(a, f), [0, 0, 0] as V3), 1 / n);
}

/**
 * Seymour's two big launches (Total Annihilation, Cross Cleave): a low hero frame at the party's shoulder, the boss looming up the frame, a slow push and a dutch tilt through the barrage. The real
 * launch sweeps (10.6 and 6.4 to 14.2 s) clamp to the plate's front as far, small frames (plate coverage 0.11 to 0.48); the options book's mock-up replaced them with this and the board judged it.
 */
export function lowLaunchKeys(party: readonly V3[], boss: V3, ms: number): Key[] {
  const c = centreOf(party);
  const dir = norm3([boss[0] - c[0], 0, boss[2] - c[2]]);
  const e0: V3 = [c[0] - dir[0] * 1.2 - 1.0, 0.7, c[2] + 4.0];
  const l0: V3 = [c[0] + dir[0] * 2.2, 1.6, c[2] + dir[2] * 2.2];
  const e1: V3 = [e0[0] + 0.4, 0.8, e0[2] - 0.8];
  const l1: V3 = [l0[0] + 0.3, 1.9, l0[2]];
  return [
    { t: 0, pose: { pos: e0, look: l0, fov: 40, roll: -1.5 }, ease: 'linear' },
    { t: ms, pose: { pos: e1, look: l1, fov: 35, roll: -3 }, ease: 'cosine' },
  ];
}

/**
 * The killing blow: the first half authored on the live stage (a push behind and beside the attacker along his run, the lens opening for speed), then the real tilted close shot (the cut at
 * 0.53 s of the real 1.07 s: a long lens, roll -2 settling to +2) from the lane's keys. `real` is the registered real shot.
 */
export function finisherKeys(real: readonly Key[], attacker: V3, target: V3): Key[] {
  const u = norm3([target[0] - attacker[0], 0, target[2] - attacker[2]]);
  const r: V3 = [-u[2], 0, u[0]];
  const at = (a: number, b: number, h: number): V3 => [attacker[0] + u[0] * a + r[0] * b, h, attacker[2] + u[2] * a + r[2] * b];
  const tail = real.slice(2);
  if (tail.length === 0) return [...real];
  const shift = 450 - tail[0]!.t;
  return [
    { t: 0, pose: { pos: at(-3.0, 0.9, 1.4), look: at(0.4, 0, 1.1), fov: 34, roll: 0 }, ease: 'linear' },
    { t: 430, pose: { pos: at(-1.2, 0.9, 1.4), look: at(3.0, 0, 1.1), fov: 42, roll: 0 }, ease: 'cosine' },
    ...tail.map((k, i) => ({ t: k.t + shift, pose: k.pose, ease: i === 0 ? ('cut' as const) : k.ease })),
  ];
}

/** A point `dist` from `c` at azimuth `azDeg` (0 = +z, toward the camera) and elevation `elDeg`. */
export function eyeAt(c: V3, dist: number, azDeg: number, elDeg: number): V3 {
  const az = azDeg * DEG;
  const el = elDeg * DEG;
  return [c[0] + dist * Math.sin(az) * Math.cos(el), c[1] + dist * Math.sin(el), c[2] + dist * Math.cos(az) * Math.cos(el)];
}

const chest = (feet: V3, h: number, f = 0.62): V3 => [feet[0], feet[1] + f * h, feet[2]];

/**
 * FFX-2 special (Chapter IV; OURS): a push to a tighter frame on the special's caster and its target, an eased 1 s glide from the follower's pose, then a slow drift. The real FFX-2 camera has no
 * scripted shot for a special; this is the "push on a special" Bailey picked, built on the same pose the follower stands on (`base`).
 */
export function specialRun(id: string, actor: V3, actorH: number, target: V3, targetH: number, still: boolean, fit: ProFit): ProRun {
  const m = lerp3(chest(actor, actorH), chest(target, targetH, 0.55), 0.5);
  return {
    id,
    inMs: still ? 0 : 200,
    inEase: 'outCubic',
    outMs: still ? 0 : 900,
    outEase: 'cubic',
    fit,
    breathe: still ? undefined : 0.3,
    rate: still ? 0 : 1,
    sway: 0.35,
    sample(t: number, base: Pose): Pose {
      const D = Math.hypot(base.pos[0] - m[0], base.pos[1] - m[1], base.pos[2] - m[2]);
      const p1 = eyeAt(m, D * 0.56, 16, 9);
      const p2 = eyeAt(m, D * 0.5, 12, 8);
      const a = ease('cubic', Math.min(1, t / 1000));
      const b = ease('cosine', Math.min(1, Math.max(0, (t - 1000) / 2200)));
      const pos = lerp3(lerp3(base.pos, p1, a), p2, b);
      return { pos, look: lerp3(base.look, m, a), fov: base.fov + (28 - base.fov) * a, roll: 0 };
    },
  };
}

/** FFX-2 Mega Flare (Chapter IV; OURS): a low wide pull-back and hold on the whole group, an eased 1.1 s glide, then a slow settle. */
export function megaFlareRun(id: string, focus: V3, still: boolean, fit: ProFit): ProRun {
  const aim: V3 = [focus[0], focus[1] + 0.9, focus[2]];
  const low: V3 = [focus[0], focus[1] + 0.2, focus[2]];
  return {
    id,
    inMs: still ? 0 : 250,
    inEase: 'outCubic',
    outMs: still ? 0 : 1100,
    outEase: 'cubic',
    fit,
    breathe: still ? undefined : 0.25,
    rate: still ? 0 : 1,
    sway: 0.35,
    sample(t: number, base: Pose): Pose {
      const D = Math.hypot(base.pos[0] - focus[0], base.pos[1] - focus[1], base.pos[2] - focus[2]);
      const p1 = eyeAt(low, D * 0.82, 9, 4);
      const p2 = eyeAt(low, D * 0.76, 7, 3);
      const a = ease('cubic', Math.min(1, t / 1100));
      const b = ease('cosine', Math.min(1, Math.max(0, (t - 1100) / 3100)));
      return { pos: lerp3(lerp3(base.pos, p1, a), p2, b), look: lerp3(base.look, aim, a), fov: base.fov + (36 - base.fov) * a, roll: 0 };
    },
  };
}

export { sub3 };
