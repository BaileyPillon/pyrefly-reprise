import { Vector3 } from 'three';
import { UP, type Actor, type Pose } from './geometry.ts';
import type { FramingReport } from './framingReport.ts';
import type { Shift } from './staging.ts';

/**
 * OPT-RESTAGE PROTOTYPE (FFX only; PR-0310 and PR-0331; behind `?stage=`, never merged into main; rules 9 and 10).
 * Re-stages the party and the boss so no member stands inside a boss's painted silhouette at rest (the rest gap,
 * `plate.restGap`), by the smallest move that clears it:
 *
 * - A: the party moves, screen-left and toward the camera;
 * - B: the boss (every fiend, so the formation stays whole) moves, screen-right and away from the camera;
 * - C: both, half of each.
 *
 * `?stage=A|B|C` picks it (no flag = today, option D); `?stagegoal=colossus` asks for the smallest move at which
 * the D-316 colossus master comes back instead of the smallest that clears the gap. `?stage=N` (alone or as
 * `A,N`) is the Sensor-card option (`sensorPlace.ts`). The same switches are on `__pyrefly.fx.mix.stage(...)`.
 *
 * Presentation only (rule 1): the figures' world x and z through `Staging.shift`, the moves as a screen-axis
 * pair so they mean left / right / toward / away in every scene whatever its yaw. Game case: FFX only
 * (Ch II, III, VIII, and X for N); FFX-2's chapters are not touched (`game` gate in `framing.ts`).
 */

export type StageMove = 'A' | 'B' | 'C';

export interface StageFlags {
  move: StageMove | null;
  /** Steer the Sensor card off the boss so Natus's colossus master may stand (option N). */
  sensor: boolean;
  /** `gap`: the smallest move that clears the rest gap; `colossus`: the smallest at which the colossus master returns. */
  goal: 'gap' | 'colossus';
  /** The largest move size tried (`?stagemax=`, 1 to 3; default 1.6): a probe for how far a chapter would need to go. */
  max: number;
}

export function parseStage(search: string): StageFlags {
  let q: URLSearchParams;
  try {
    q = new URLSearchParams(search);
  } catch {
    return { move: null, sensor: false, goal: 'gap', max: 1.6 };
  }
  const parts = (q.get('stage') ?? '').toUpperCase().split(',').map((s) => s.trim());
  const move = (['A', 'B', 'C'] as const).find((m) => parts.includes(m)) ?? null;
  const max = Number(q.get('stagemax'));
  return { move, sensor: parts.includes('N'), goal: q.get('stagegoal') === 'colossus' ? 'colossus' : 'gap', max: max >= 1 && max <= 3 ? max : 1.6 };
}

let flags: StageFlags = parseStage(typeof location === 'undefined' ? '' : location.search);

export const stageFlags = (): StageFlags => flags;
export const setStageFlags = (f: Partial<StageFlags>): void => {
  flags = { ...flags, ...f };
};

/** The largest move of each side at t = 1, in world units: [screen-sideways, toward the camera]. */
export const STAGE_MAX = { party: [2.6, 1.0], boss: [2.4, 1.6] } as const;

/** The world axes of the screen: the camera's right and "toward the camera", flat on the floor. */
export function screenAxes(base: Pose): { right: Vector3; toward: Vector3 } {
  const f = new Vector3().subVectors(base.look, base.pos).setY(0).normalize();
  return { right: new Vector3().crossVectors(f, UP).normalize(), toward: f.clone().negate() };
}

/** The move at size `t` (0..1) for option `move`: every party member shares one offset, every fiend another. */
export function shiftFor(move: StageMove, t: number, actors: readonly Actor[], base: Pose): Map<Actor, Shift> {
  const { right, toward } = screenAxes(base);
  const pk = move === 'A' ? 1 : move === 'C' ? 0.5 : 0;
  const bk = move === 'B' ? 1 : move === 'C' ? 0.5 : 0;
  const party = new Vector3().addScaledVector(right, -STAGE_MAX.party[0] * pk * t).addScaledVector(toward, STAGE_MAX.party[1] * pk * t);
  const boss = new Vector3().addScaledVector(right, STAGE_MAX.boss[0] * bk * t).addScaledVector(toward, -STAGE_MAX.boss[1] * bk * t);
  const out = new Map<Actor, Shift>();
  for (const a of actors) {
    const v = a.facing >= 0 ? party : boss;
    if (v.lengthSq() > 0) out.set(a, { dx: v.x, dz: v.z });
  }
  return out;
}

/** What one try of the plan at move size `t` came to. */
export interface StageEval {
  t: number;
  /** The rest gap of the pick (px, field); positive = nobody stands inside a boss. */
  gap: number;
  /** The pick keeps every figure in view and off the HUD, and the plate no worse than today's rig. */
  clean: boolean;
  /** The pick is the colossus master. */
  colossus: boolean;
  /** What made it not clean (checks only). */
  why?: string;
}

export interface StageSolve<D> {
  d: D;
  t: number;
  evals: StageEval[];
  note: string;
}

/** Steps of margin taken past the first size that clears, each of them also clearing (a step is about a quarter of a world unit of separation). */
const MARGIN = 2;

/** The move sizes tried, in order: 0 (today's stage) to 1.6 in tenths (1 = the largest move of `STAGE_MAX`; Evrae's coil needs more). */
const stepsTo = (max: number): number[] => Array.from({ length: Math.round(max * 10) + 1 }, (_, i) => i / 10);

/**
 * The smallest move. Every size in `STEPS` is planned (the whole curve is the report's table), because the pick's rest gap is
 * not monotone in the move: the camera fit may choose a different pose from one size to the next, and a gap that clears at one size
 * can be lost at the next. The winner is the first size that meets the goal AND whose next size does too, taken at that next
 * size (one step of margin; the gap's "1" is a hairline on the silhouette, not air); else the first size that meets it alone
 * (the note says "knife-edge"); else the cleanest try with the best gap, never a cropped or hidden one. `run` plans at a move
 * size and returns the decision with its reading.
 */
export function solveStage<D>(goal: 'gap' | 'colossus', run: (t: number) => { d: D; e: StageEval } | null, max = 1.6): StageSolve<D> | null {
  const STEPS = stepsTo(max);
  const meets = (e: StageEval): boolean => e.gap >= 1 && e.clean && (goal === 'gap' || e.colossus);
  const got: ({ d: D; e: StageEval } | null)[] = STEPS.map((t) => run(t));
  const evals = got.flatMap((g) => (g ? [g.e] : []));
  const ok = (i: number): boolean => !!got[i] && meets(got[i]!.e);
  const done = (i: number, note: string): StageSolve<D> => ({ d: got[i]!.d, t: got[i]!.e.t, evals, note });
  for (let m = MARGIN; m >= 1; m--)
    for (let i = 0; i + m < STEPS.length; i++)
      if (Array.from({ length: m + 1 }, (_, k) => ok(i + k)).every(Boolean)) return done(i + m, `smallest move that holds: ${STEPS[i]!.toFixed(3)} clears, ${STEPS[i + m]!.toFixed(3)} taken (${m} step(s) of margin)`);
  for (let i = 0; i < STEPS.length; i++) if (ok(i)) return done(i, `knife-edge: only ${STEPS[i]!.toFixed(3)} clears (the next size loses it)`);
  const rank = (g: { e: StageEval } | null): number => (g ? (g.e.clean ? 1e6 : 0) + g.e.gap : -1e9);
  let best = 0;
  got.forEach((g, i) => {
    if (rank(g) > rank(got[best]!)) best = i;
  });
  if (!got[best]) return null;
  return done(best, `goal not met at any move size (best t ${got[best]!.e.t.toFixed(3)}, gap ${Math.round(got[best]!.e.gap)}, clean ${got[best]!.e.clean})`);
}

/**
 * Is the pick clean (every member in view and off the HUD, every boss part in view as far as today's allowance, the plate shown
 * no worse than today's rig), and is it the colossus master (a BOSS SCALE step was chosen)?
 */
export function cleanOf(r: Partial<FramingReport>, ref: Partial<FramingReport> | null): { clean: boolean; colossus: boolean; why: string } {
  const figs = r.fit?.figs ?? [];
  // A member may be under a panel as much as 12 % or as much as today's stage already has her (+ 3 %): the Evrae frame has Wakka's feet under the command list before any move.
  const today = new Map((ref?.fit?.figs ?? []).map((f) => [f.id, f.underHud] as const));
  const bad = figs.filter((f) => (f.enemy ? f.inView < 0.85 : f.inView < 0.97 || f.underHud > Math.max(0.12, (today.get(f.id) ?? 0) + 0.03)));
  const plate = r.plate ? r.plate.chosen <= r.plate.today + 0.004 : true;
  const why = [...bad.map((f) => `${f.id} ${f.inView}/${f.underHud}`), ...(plate ? [] : ['plate edge shown'])].join('; ');
  return { clean: !bad.length && plate, colossus: !!r.colossus && (r.scale ?? -1) >= 0, why };
}

/** The solve for `framing.ts`: plan at each move size through `decide`, keep the smallest that meets the goal, write its reading into the report. */
export function runStage<D extends { keep: boolean; report: Partial<FramingReport> }>(f: StageFlags, actors: readonly Actor[], base: Pose, decide: (shift: Map<Actor, Shift> | null) => D | null): D | null {
  const t0 = performance.now();
  let ref: Partial<FramingReport> | null = null;
  const s = solveStage(f.goal, (t) => {
    const d = decide(t > 0 ? shiftFor(f.move!, t, actors, base) : null);
    if (d && !d.keep && t === 0) ref = d.report;
    return d && !d.keep ? { d, e: { t, gap: d.report.plate?.restGap ?? 1, ...cleanOf(d.report, ref) } } : null;
  }, f.max);
  if (!s) return null;
  s.d.report.restage = { move: f.move!, goal: f.goal, t: +s.t.toFixed(3), note: s.note, evals: s.evals.map((e) => ({ ...e, t: +e.t.toFixed(3), gap: Math.round(e.gap) })), ms: Math.round(performance.now() - t0) };
  return s.d;
}
