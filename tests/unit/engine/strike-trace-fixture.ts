/**
 * The fixture of the strike traces (`r73-sinface-trace.test.ts`, `r73-fast-floor.test.ts`; lane r73-sinface, moved here by r73-fast; both games' plumbing, FFX figures).
 *
 * The REAL `PaintedActor` (real pose records and registration rows, the real mix and head lock) plays the REAL house strike (`StrikeCurve.PROFILES`) or today's `lunge` under a real camera that draws the standing figure at a
 * given height, 60 Hz, and every frame is read the way the continuity probe reads it: the registered head and feet through each plane's four projected corners, weighted by the planes' fade (`figureTrack`), with
 * `detectJerks` and the policy's own thresholds. Nothing here reads the engine's own measure of a figure.
 */
import type { PerspectiveCamera } from 'three';
import { Vector3 } from 'three';
import { detectJerks, median, unitSquareToQuad } from '../../../critic/runner/lib/continuity-pure.mjs';
import { CFG, FRAME, corners, ctxOf } from './ko-fall-fixture.ts';
import { PaintedActor, cameraAt, painting, slotsOf, viewOf, type Actor } from './head-lock-fixture.ts';
import { LivingFigure } from '../../../src/engine/fx/mix/living.ts';
import { paceRate } from '../../../src/engine/pace.ts';
import { PROFILES, resolveStrike, sampleAt } from '../../../src/engine/motion/StrikeCurve.ts';
import { LUNGE_MS } from '../../../src/engine/StrikeBeat.ts';
import type { StrikePlan } from '../../../src/engine/motion/StrikePlan.ts';

export { CFG, FRAME };
export const W = 1600;
export const H = 900;

const project = (v: Vector3, cam: PerspectiveCamera): { x: number; y: number } => {
  const p = v.clone().project(cam);
  return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
};
const drawnPx = (a: Actor, cam: PerspectiveCamera): number => (1.82 * Math.abs(project(a.position, cam).y - project(a.headPoint(), cam).y)) / (a.headPoint().y - a.position.y);

/** A camera that draws the standing figure `px` tall on the 900 px canvas (bisection on the distance: it is monotone). */
export function cameraDrawing(a: Actor, px: number): PerspectiveCamera {
  let lo = 2;
  let hi = 60;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (drawnPx(a, cameraAt(2.4, mid)) > px) lo = mid;
    else hi = mid;
  }
  return cameraAt(2.4, (lo + hi) / 2);
}

export function figure(name: string, poses: readonly string[]): Actor {
  const a = new PaintedActor({ name, worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  const set: Record<string, ReturnType<typeof painting>> = {};
  for (const p of poses) set[p] = painting(name, p);
  a.adoptPoses(set, 'idle');
  a.position.set(0, 0, 0);
  return a;
}

const applyMap = (m: number[], u: number, t: number): [number, number] => {
  const w = m[6]! * u + m[7]! * t + m[8]!;
  return [(m[0]! * u + m[1]! * t + m[2]!) / w, (m[3]! * u + m[4]! * t + m[5]!) / w];
};

export interface Sample {
  n: number;
  t: number;
  feet: [number, number];
  head: [number, number];
  cam: [number, number];
}

/**
 * The figure's registered feet and head on the 1600 x 900 canvas, read the way the probe's `figureTrack` reads them (`critic/runner/lib/continuity-pure.mjs`): each showing plane's registered feet and head through that plane's own
 * projected corners, averaged over the planes WEIGHTED BY THEIR FADE, so a crossfade glides between the two paintings and does not hop at 50 percent.
 */
export function sample(a: Actor, cam: PerspectiveCamera, n: number): Sample {
  a.updateMatrixWorld(true);
  const planes = slotsOf(a) as unknown as Array<{ pose: string; fade: number; mesh: { matrixWorld: never }; meta: { stanceX: number; width: number; height: number; head: [number, number, number, number] }; scale: { anchorY: number } }>;
  let w = 0;
  const feet: [number, number] = [0, 0];
  const head: [number, number] = [0, 0];
  for (const s of planes) {
    if (!s.pose || s.fade <= 0.001) continue;
    const map = unitSquareToQuad(corners(cam, s.mesh.matrixWorld)) as unknown as number[];
    const m = s.meta;
    const f = applyMap(map, m.stanceX / m.width, s.scale.anchorY / m.height);
    const h = applyMap(map, (m.head[0] + m.head[2]) / 2, (m.head[1] + m.head[3]) / 2);
    w += s.fade;
    feet[0] += f[0] * s.fade;
    feet[1] += f[1] * s.fade;
    head[0] += h[0] * s.fade;
    head[1] += h[1] * s.fade;
  }
  return { n, t: n * FRAME, feet: [feet[0] / w, feet[1] / w], head: [head[0] / w, head[1] / w], cam: [0, 0] };
}

export interface PlayOptions {
  name: string;
  drawn: number;
  reach: number;
  kind: 'strike' | 'lunge';
  frames?: number;
  offsetMs?: number;
  timeScale?: number;
  /** false: the travel and the return play at the playback speed like every other phase (release 72 and before), the control arm of the cause trace. Absent: the game as it is. */
  floorCrossings?: false;
}

/** One attack at 60 Hz: the track of the registered head and feet, frame by frame. `strike`: the house strike with the pose swaps on its marks (ready to attack on the fastest travel frame, attack to follow on the fastest frame home); else today's lunge. */
export function play(o: PlayOptions): { track: Sample[]; marks: Record<string, number> } {
  const a = figure(o.name, ['idle', 'ready', 'attack', 'follow']);
  const living = new LivingFigure(a);
  const cam = cameraDrawing(a, o.drawn);
  const frame = (dt = FRAME): void => {
    living.update(ctxOf({ dt: dt / 1000, realDt: dt / 1000 }));
    a.update(dt / 1000, dt / 1000);
    a.holdHead(viewOf(cam));
    a.updateMatrixWorld(true);
  };
  a.setPose('ready', { immediate: true, force: true });
  frame();
  frame();
  const track = [sample(a, cam, 0)];
  const marks: Record<string, number> = {};
  if (o.kind === 'strike') {
    const plan: StrikePlan = {
      distance: o.reach, game: 'ffx', timeScale: o.timeScale ?? 1, arc: true,
      ...(o.floorCrossings === false ? { floorCrossings: false as const } : {}),
      marks: { travelPeak: () => { marks['travelPeak'] = track.length; a.setPose('attack'); }, contact: () => { marks['contact'] = track.length; }, settlePeak: () => { marks['settlePeak'] = track.length; a.setPose('follow'); }, end: () => { marks['end'] = track.length; a.setPose('idle'); } },
    };
    void a.strike(plan);
  } else {
    a.setPose('attack');
    void a.lunge(o.reach, LUNGE_MS, undefined, 1.4);
  }
  if (o.offsetMs) frame(Math.max(0.5, FRAME - o.offsetMs));
  for (let i = 1; i < (o.frames ?? 80); i++) {
    frame();
    track.push(sample(a, cam, i));
  }
  return { track, marks };
}

/** The largest one-frame step of the registered head, forward (+) and back (-), over frames `from` to `to` of a track. */
export function worstSteps(track: Sample[], from = 1, to = track.length): { fwd: number; back: number } {
  let fwd = 0;
  let back = 0;
  for (let i = Math.max(1, from); i < Math.min(track.length, to); i++) {
    const d = track[i]!.head[0] - track[i - 1]!.head[0];
    fwd = Math.max(fwd, d);
    back = Math.max(back, -d);
  }
  return { fwd, back };
}

/**
 * The worst one-frame share of the lunge distance of the house FFX strike's travel and of its way home, at a playback speed, walked at every offset of a 60 Hz frame at the game's default pace (what `play` plays).
 * `floorCrossings` false: the shape as release 72 resolved it.
 */
export function houseShares(timeScale: number, floorCrossings?: false): { travel: number; home: number } {
  const shape = resolveStrike(PROFILES.ffx, { distance: 1, height: 1.82, heft: 0, timeScale, arcGain: 1, ...(floorCrossings === false ? { floorCrossings } : {}) });
  const frame = FRAME * paceRate('action'); // paced ms one displayed frame advances the strike's clock
  let travel = 0;
  let home = 0;
  for (let t = 0; t + frame < shape.windupMs + shape.travelMs; t += 0.25) travel = Math.max(travel, sampleAt(shape, 'pre', t + frame).x - sampleAt(shape, 'pre', t).x);
  for (let t = 0; t + frame < shape.returnMs + shape.settleMs; t += 0.25) home = Math.max(home, sampleAt(shape, 'post', t).x - sampleAt(shape, 'post', t + frame).x);
  return { travel, home };
}

/** The largest one-frame step of the registered head over frames 1 to `to` of a track (px), the frame it arrives in, and the detector's own `local` ratio: that step over the median of its neighbours (`continuity-pure.mjs`). */
export function fastest(track: Sample[], to = 60): { peak: number; n: number; ratio: number } {
  const steps = track.slice(1, to).map((s, i) => Math.abs(s.head[0] - track[i]!.head[0]));
  const peak = Math.max(...steps);
  const at = steps.indexOf(peak);
  const near = steps.filter((_, i) => i !== at && Math.abs(i - at) <= CFG.motion.localWindow);
  return { peak, n: at + 1, ratio: peak / Math.max(CFG.motion.jerkFloorPx, median(near)) };
}

/** The jerks the real detector reads in the first `to` frames of a track. */
export const jerksOf = (track: Sample[], to = 60): Array<{ n: number; px: number; ratio: number }> => (detectJerks(track.slice(0, to), 1, CFG) as Array<{ n: number; px: number; ratio: number }>).filter((e) => e.n < to);
