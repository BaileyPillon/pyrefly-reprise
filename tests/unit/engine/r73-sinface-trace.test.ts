/**
 * r73-sinface, the offline trace of Chapter XVIII's 17 one-frame hops (FFX only; `docs/handoff/r73-sinface.md`).
 *
 * **What this file pins: the hops are the house strike played at the `fast` playback speed (`SPEED_SCALE.fast`, 0.32), and at the speed the strike was designed for (`normal`) the same strike is smooth.** The presenter hands the strike
 * `moveScale(ctx)` = `SPEED_SCALE[speed] x timeScale` (`motion/CurveBeats.ts`) and `resolveStrike` multiplies every phase by it, so at `fast` the travel is about 5 frames long and the strike steps 0.46 of its reach in one frame
 * (0.15 at `normal`); today's `lunge` (what `?treated=pack` plays) is called with a fixed `LUNGE_MS` and no speed, so it steps the same at either. The first version of this file (92bb3779d) read every case at `timeScale: 1`
 * and concluded the strike "cannot" make the review's spikes and that the review's first three hops implied a reach "far past the solver's cap"; both were the wrong speed (review of 92bb3779d, majors 1 and 2).
 *
 * The REAL `PaintedActor` (real pose records and registration rows, the real mix and head lock) plays the REAL house strike (`StrikeCurve.PROFILES.ffx`, what `real` held falls back to) and today's `lunge` under a real camera that
 * draws the standing figure at a given height, 60 Hz, and every frame is read the way the continuity probe reads it: the registered head and feet through each plane's four projected corners, weighted by the planes' fade
 * (`figureTrack`), `detectJerks` with the policy's own thresholds. Chapter XVIII (`sin-face`) is off `TREATED_CHAPTERS`, so the strike cases read the nearest listed FFX chapter that plays the house curves (`evrae-airship`).
 *
 * What the review measured (`critic/reviews/4c01379d4-focused`, Chapter XVIII, `continuity.json`): Auron's hops 401.1 (feet), 278.3, 277.2, 256.4, 232.2, 230.6, 148.8, 148.6, 147.0, 147.0, 115.1, 115.0, 114.5, 113.6 px and Wakka's
 * 115.5, 114.2, 113.5, each at the frame a pose blend starts, the whole figure at once (head and feet together: `relPx` 4 to 8), the neighbouring steps 16 to 46 px (a one-frame spike, `localPx`), the ready>attack swap and the
 * attack>follow swap of one attack exactly 10 frames apart.
 */
import type { PerspectiveCamera } from 'three';
import { Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectJerks, median, unitSquareToQuad } from '../../../critic/runner/lib/continuity-pure.mjs';
import { CFG, FRAME, corners, ctxOf } from './ko-fall-fixture.ts';
import { PaintedActor, cameraAt, painting, reset, slotsOf, viewOf, type Actor } from './head-lock-fixture.ts';
import { LivingFigure } from '../../../src/engine/fx/mix/living.ts';
import { paceRate, setPaceGame } from '../../../src/engine/pace.ts';
import { setDemoChapter, setTreatedScope } from '../../../src/engine/motion/DemoGate.ts';
import { setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { PROFILES, resolveStrike, sampleAt } from '../../../src/engine/motion/StrikeCurve.ts';
import { LUNGE_MS } from '../../../src/engine/StrikeBeat.ts';
import { SPEED_SCALE } from '../../../src/engine/BattlePresenterUtil.ts';
import { moveScale, startAttackMove } from '../../../src/engine/motion/CurveBeats.ts';
import type { StrikePlan } from '../../../src/engine/motion/StrikePlan.ts';

const W = 1600;
const H = 900;
/** The nearest listed FFX chapter that plays the house curves (`real` held). */
const PLAYS = 'evrae-airship';

beforeEach(() => {
  setPaceGame('ffx');
  setTreatedScope('all');
  setCurvesMode('new');
  setDemoChapter(PLAYS);
});
afterEach(() => {
  setPaceGame('other');
  setTreatedScope(null);
  setCurvesMode(null);
  setDemoChapter(undefined);
  reset();
});

const project = (v: Vector3, cam: PerspectiveCamera): { x: number; y: number } => {
  const p = v.clone().project(cam);
  return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
};
const drawnPx = (a: Actor, cam: PerspectiveCamera): number => (1.82 * Math.abs(project(a.position, cam).y - project(a.headPoint(), cam).y)) / (a.headPoint().y - a.position.y);

/** A camera that draws the standing figure `px` tall on the 900 px canvas (bisection on the distance: it is monotone). */
function cameraDrawing(a: Actor, px: number): PerspectiveCamera {
  let lo = 2;
  let hi = 60;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (drawnPx(a, cameraAt(2.4, mid)) > px) lo = mid;
    else hi = mid;
  }
  return cameraAt(2.4, (lo + hi) / 2);
}

function figure(name: string, poses: readonly string[]): Actor {
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

interface Sample {
  n: number;
  t: number;
  feet: [number, number];
  head: [number, number];
  cam: [number, number];
}

/**
 * The figure's registered feet and head on the 1600 x 900 canvas, read the way the probe's `figureTrack` reads them (`critic/runner/lib/continuity-pure.mjs`): each showing plane's registered feet and head through that plane's own
 * projected corners, averaged over the planes WEIGHTED BY THEIR FADE, so a crossfade glides between the two paintings and does not hop at 50 percent. (The first version of this function read the dominant plane alone, which added
 * a plane-flip step of its own at every swap that the probe does not have; review of 92bb3779d, minor 3.)
 */
function sample(a: Actor, cam: PerspectiveCamera, n: number): Sample {
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

/** One attack at 60 Hz: the track of the registered head and feet, frame by frame. `strike`: the house strike with the pose swaps on its marks (ready to attack on the fastest travel frame, attack to follow on the fastest frame home); else today's lunge. */
function play(o: { name: string; drawn: number; reach: number; kind: 'strike' | 'lunge'; frames?: number; offsetMs?: number; timeScale?: number }): { track: Sample[]; marks: Record<string, number> } {
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
      marks: { travelPeak: () => { marks['travelPeak'] = track.length; a.setPose('attack'); }, settlePeak: () => { marks['settlePeak'] = track.length; a.setPose('follow'); }, end: () => { marks['end'] = track.length; a.setPose('idle'); } },
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
function worstSteps(track: Sample[], from = 1, to = track.length): { fwd: number; back: number } {
  let fwd = 0;
  let back = 0;
  for (let i = Math.max(1, from); i < Math.min(track.length, to); i++) {
    const d = track[i]!.head[0] - track[i - 1]!.head[0];
    fwd = Math.max(fwd, d);
    back = Math.max(back, -d);
  }
  return { fwd, back };
}

const NORMAL = SPEED_SCALE.normal;
const FAST = SPEED_SCALE.fast;

/** The worst one-frame share of the lunge distance of the house FFX strike's travel and of its way home, at a playback speed, walked at every offset of a 60 Hz frame at the game's default pace (what `play` plays). */
function houseShares(timeScale: number): { travel: number; home: number } {
  const shape = resolveStrike(PROFILES.ffx, { distance: 1, height: 1.82, heft: 0, timeScale, arcGain: 1 });
  const frame = FRAME * paceRate('action'); // paced ms one displayed frame advances the strike's clock
  let travel = 0;
  let home = 0;
  for (let t = 0; t + frame < shape.windupMs + shape.travelMs; t += 0.25) travel = Math.max(travel, sampleAt(shape, 'pre', t + frame).x - sampleAt(shape, 'pre', t).x);
  for (let t = 0; t + frame < shape.returnMs + shape.settleMs; t += 0.25) home = Math.max(home, sampleAt(shape, 'post', t).x - sampleAt(shape, 'post', t + frame).x);
  return { travel, home };
}

/** The largest one-frame step of the registered head over frames 1 to `to` of a track (px), the frame it arrives in, and the detector's own `local` ratio: that step over the median of its neighbours (`continuity-pure.mjs`). */
function fastest(track: Sample[], to = 60): { peak: number; n: number; ratio: number } {
  const steps = track.slice(1, to).map((s, i) => Math.abs(s.head[0] - track[i]!.head[0]));
  const peak = Math.max(...steps);
  const at = steps.indexOf(peak);
  const near = steps.filter((_, i) => i !== at && Math.abs(i - at) <= CFG.motion.localWindow);
  return { peak, n: at + 1, ratio: peak / Math.max(CFG.motion.jerkFloorPx, median(near)) };
}

/** The jerks the real detector reads in the first `to` frames of a track. */
const jerksOf = (track: Sample[], to = 60): Array<{ n: number; px: number; ratio: number }> => (detectJerks(track.slice(0, to), 1, CFG) as Array<{ n: number; px: number; ratio: number }>).filter((e) => e.n < to);

describe('the house strike\'s one-frame step is a law of the reach, the drawn size and the PLAYBACK SPEED', () => {
  it('the worst frame of the travel is 0.153 of the reach at normal speed and 0.461 of it at fast (the way home 0.081 and 0.251), whatever the figure is drawn at', () => {
    const normal = houseShares(NORMAL);
    expect(normal.travel).toBeGreaterThan(0.148);
    expect(normal.travel).toBeLessThan(0.158);
    expect(normal.home).toBeGreaterThan(0.077);
    expect(normal.home).toBeLessThan(0.085);
    const fast = houseShares(FAST);
    expect(fast.travel).toBeGreaterThan(0.45);
    expect(fast.travel).toBeLessThan(0.47);
    expect(fast.home).toBeGreaterThan(0.245);
    expect(fast.home).toBeLessThan(0.257);
    expect(fast.travel / normal.travel).toBeGreaterThan(2.9); // the playback speed multiplies the step by about 1 / 0.32
  });

  it.each([NORMAL, FAST])('on the real actor at speed %d: the head steps share x reach x (drawn / 1.82) px at the travel peak, at 1.4, 3 and 4.1 units of reach and 420 and 500 px (to 8 percent: the head sits a little above the feet, and the pull-back and overshoot do not scale with the reach)', (timeScale) => {
    const { travel } = houseShares(timeScale);
    for (const drawn of [420, 500]) {
      for (const reach of [1.4, 3, 4.1]) {
        const { fwd } = worstSteps(play({ name: 'auron', drawn, reach, kind: 'strike', timeScale }).track, 1, 40);
        const want = travel * reach * (drawn / 1.82);
        expect(fwd, `${drawn} px, reach ${reach}`).toBeGreaterThan(want * 0.92);
        expect(fwd, `${drawn} px, reach ${reach}`).toBeLessThan(want * 1.06);
      }
    }
  });

  it('the swap on the travel peak and the swap on the way-home peak are 10 frames apart at fast (the review: exactly 10 in all 13 hop swaps) and about 30 at normal (the review: 30 to 33 in the earlier attacks)', () => {
    const gap = (timeScale: number): number => {
      const { marks } = play({ name: 'auron', drawn: 420, reach: 1.4, kind: 'strike', timeScale });
      return marks['settlePeak']! - marks['travelPeak']!;
    };
    expect(gap(FAST)).toBe(10);
    expect(gap(NORMAL)).toBeGreaterThanOrEqual(27);
    expect(gap(NORMAL)).toBeLessThanOrEqual(33);
  });
});

describe('the presenter plays the house strike at the playback speed and today\'s lunge at no speed', () => {
  const ctxAt = (speed: 'normal' | 'fast' | 'skip') => ({ speed: () => speed, deps: {}, stage: {} }) as unknown as Parameters<typeof moveScale>[0];

  it('moveScale is SPEED_SCALE times the presenter\'s timeScale: 1 at normal, 0.32 at fast, floored at 0.02 at skip', () => {
    expect(moveScale(ctxAt('normal'))).toBe(1);
    expect(moveScale(ctxAt('fast'))).toBe(0.32);
    expect(moveScale(ctxAt('skip'))).toBe(0.02);
    expect(moveScale({ ...ctxAt('fast'), deps: { timeScale: 2 } } as never)).toBeCloseTo(0.64, 10);
  });

  it('startAttackMove hands the new strike that speed as its timeScale, and with the curves off calls the lunge with the fixed LUNGE_MS and no speed at all', () => {
    const plans: Array<{ timeScale: number; distance: number }> = [];
    const lunges: unknown[][] = [];
    const actor = {
      strike: (p: { timeScale: number; distance: number }) => (plans.push(p), Promise.resolve()),
      lunge: (...args: unknown[]) => (lunges.push(args), Promise.resolve()),
      squash: () => Promise.resolve(),
    };
    const contact = { hold: Promise.resolve(), reached: () => {} };
    for (const speed of ['normal', 'fast'] as const) startAttackMove(ctxAt(speed), actor as never, { distance: 3, house: 1.4 }, contact, false);
    expect(plans.map((p) => p.timeScale)).toEqual([1, 0.32]);
    expect(lunges).toHaveLength(0);
    setCurvesMode('today'); // `?curves=today`, and every chapter that is not on the list (Chapter XVIII as it ships): today's lunge
    for (const speed of ['normal', 'fast'] as const) startAttackMove(ctxAt(speed), actor as never, { distance: 3, house: 1.4 }, contact, false);
    expect(plans).toHaveLength(2);
    expect(lunges).toEqual([[3, LUNGE_MS, contact, 1.4], [3, LUNGE_MS, contact, 1.4]]);
  });
});

/** The review's 17 hops (`critic/reviews/4c01379d4-focused`, `continuity.json` `jerks`), each with the drawn height of its figure at the swap whose blend starts at that frame (`swaps[].figurePx`, px of 900) and the part that read it. */
const HOPS: ReadonlyArray<{ n: number; fig: 'auron' | 'wakka'; swap: 'ready>attack' | 'attack>follow'; px: number; drawn: number }> = [
  { n: 9148, fig: 'auron', swap: 'ready>attack', px: 401.1, drawn: 502 }, { n: 9157, fig: 'auron', swap: 'attack>follow', px: 256.4, drawn: 425 },
  { n: 9223, fig: 'wakka', swap: 'ready>attack', px: 114.2, drawn: 379 }, { n: 9675, fig: 'auron', swap: 'ready>attack', px: 278.3, drawn: 422 },
  { n: 9685, fig: 'auron', swap: 'attack>follow', px: 232.2, drawn: 399 }, { n: 9739, fig: 'wakka', swap: 'ready>attack', px: 115.5, drawn: 385 },
  { n: 10062, fig: 'auron', swap: 'ready>attack', px: 277.2, drawn: 426 }, { n: 10072, fig: 'auron', swap: 'attack>follow', px: 230.6, drawn: 404 },
  { n: 10511, fig: 'wakka', swap: 'ready>attack', px: 113.5, drawn: 386 }, { n: 10591, fig: 'auron', swap: 'ready>attack', px: 148.6, drawn: 413 },
  { n: 10601, fig: 'auron', swap: 'attack>follow', px: 115.1, drawn: 403 }, { n: 11112, fig: 'auron', swap: 'ready>attack', px: 148.8, drawn: 410 },
  { n: 11122, fig: 'auron', swap: 'attack>follow', px: 114.5, drawn: 399 }, { n: 11405, fig: 'auron', swap: 'ready>attack', px: 147, drawn: 410 },
  { n: 11415, fig: 'auron', swap: 'attack>follow', px: 113.6, drawn: 398 }, { n: 11733, fig: 'auron', swap: 'ready>attack', px: 147, drawn: 409 },
  { n: 11743, fig: 'auron', swap: 'attack>follow', px: 115, drawn: 414 },
];

describe('the review\'s hops, read at the speed the review ran (fast) and at normal', () => {
  const heads = HOPS.filter((h) => h.swap === 'ready>attack');
  const homes = HOPS.filter((h) => h.swap === 'attack>follow');
  const reachOf = (h: (typeof HOPS)[number], timeScale: number): number => {
    const s = houseShares(timeScale);
    return h.px / ((h.swap === 'ready>attack' ? s.travel : s.home) * (h.drawn / 1.82));
  };
  const later = heads.filter((h) => h.fig === 'auron' && h.n >= 10511);
  const first = heads.filter((h) => h.fig === 'auron' && h.n < 10511);
  const wakka = heads.filter((h) => h.fig === 'wakka');

  it('the data are the 17 hops: 10 ready>attack (Auron 7, Wakka 3) and 7 attack>follow (Auron)', () => {
    expect(HOPS).toHaveLength(17);
    expect([heads.length, later.length, first.length, wakka.length, homes.length]).toEqual([10, 4, 3, 3, 7]);
  });

  it('at FAST every ready>attack hop is a reach the game can ask for: Auron\'s four later ones are the house lunge of 1.4 (1.42 to 1.43), his first three a solved reach of 2.6 to 3.2 (inside the solver\'s cap of 4.4), and Wakka\'s three read 1.2 (under the 1.4 base: his lunge distance is the open item)', () => {
    for (const h of later) {
      expect(reachOf(h, FAST), `auron ${h.n}`).toBeGreaterThan(1.35);
      expect(reachOf(h, FAST), `auron ${h.n}`).toBeLessThan(1.5);
    }
    for (const h of first) {
      expect(reachOf(h, FAST), `auron ${h.n}`).toBeGreaterThan(2.4);
      expect(reachOf(h, FAST), `auron ${h.n}`).toBeLessThan(3.3);
    }
    for (const h of wakka) {
      expect(reachOf(h, FAST), `wakka ${h.n}`).toBeGreaterThan(1.1);
      expect(reachOf(h, FAST), `wakka ${h.n}`).toBeLessThan(1.25);
    }
  });

  it('the same hops read at NORMAL would need 7.7 to 9.5 units for Auron\'s first three, far past the cap of 4.4: that was the first version of this trace\'s "one strike law is not all seventeen hops", and it was the wrong speed', () => {
    for (const h of first) expect(reachOf(h, NORMAL), `auron ${h.n}`).toBeGreaterThan(7.5);
    for (const h of [...later, ...wakka]) expect(reachOf(h, NORMAL), `${h.fig} ${h.n}`).toBeGreaterThan(3.4);
  });

  it('OPEN: the seven attack>follow hops are 10 frames after their pair (matched) but about 1.5 times the size the way-home law gives (not matched: 2.0 to 2.1 units for a 1.42 travel, 4.1 to 4.4 for 2.6 to 3.2)', () => {
    const ratios = homes.map((h) => {
      const pair = heads.find((x) => x.fig === h.fig && h.n - x.n >= 9 && h.n - x.n <= 10)!; // the same attack's travel hop, 9 or 10 frames before
      return reachOf(h, FAST) / reachOf(pair, FAST);
    });
    for (const r of ratios) {
      expect(r).toBeGreaterThan(1.3);
      expect(r).toBeLessThan(1.7);
    }
  });
});

describe('the real jerk detector: smooth at the strike\'s own speed, a one-frame spike at fast', () => {
  it('at NORMAL a house strike of 4.1 units drawn 420 and 500 px, swaps on its travel peak and its way-home peak, reads no jerk in its first 60 frames, and the neighbours of its fastest frame are 60 to 100 percent of it', () => {
    for (const drawn of [420, 500]) {
      const { track, marks } = play({ name: 'auron', drawn, reach: 4.1, kind: 'strike', timeScale: NORMAL });
      expect(Object.keys(marks).sort()).toEqual(['end', 'settlePeak', 'travelPeak']); // the swaps really were made on the marks
      expect(jerksOf(track).map((e) => `${e.n}:${e.px}`), `${drawn} px`).toEqual([]);
      const steps = track.slice(1, 60).map((s, i) => Math.abs(s.head[0] - track[i]!.head[0]));
      const peak = Math.max(...steps);
      const at = steps.indexOf(peak);
      expect(steps[at - 1]! / peak, `${drawn} px`).toBeGreaterThan(0.6);
      expect(steps[at + 1]! / peak, `${drawn} px`).toBeGreaterThan(0.6);
    }
  });

  it('at NORMAL the ratio of the fastest step to its neighbours is at most 1.7 from 1.4 to 4.4 units and 280 to 600 px (under the detector\'s own ratio of 3); at FAST it is at least 6 for every one of them', () => {
    let normal = 0;
    let fast = Infinity;
    for (const drawn of [280, 420, 600]) {
      for (const reach of [1.4, 3, 4.4]) {
        normal = Math.max(normal, fastest(play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: NORMAL }).track, 40).ratio);
        fast = Math.min(fast, fastest(play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: FAST }).track, 40).ratio);
      }
    }
    expect(normal).toBeLessThan(1.7);
    expect(normal).toBeLessThan(CFG.motion.jerkRatio);
    expect(fast).toBeGreaterThan(6); // the review's spikes: ratio 4.1 to 18 against the neighbouring steps of 16 to 46 px
    expect(fast).toBeGreaterThan(CFG.motion.jerkRatio);
  });

  it.each([
    { drawn: 502, reach: 3.2, hop: 401.1, what: "Auron's first hop (his Dragon Fang)" },
    { drawn: 422, reach: 2.6, hop: 278.3, what: "Auron's second" },
    { drawn: 410, reach: 1.4, hop: 148.6, what: "Auron's later ones, the house lunge" },
  ])('at FAST the real detector calls the travel peak a jerk of the review\'s size, in the frame the swap is made ($what: $drawn px, $reach units, review $hop px)', ({ drawn, reach, hop }) => {
    const { track, marks } = play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: FAST });
    const first = jerksOf(track)[0]!;
    expect(first.n).toBe(marks['travelPeak']); // the blend starts in the frame the hop arrives in
    expect(first.px).toBeGreaterThan(hop * 0.96);
    expect(first.px).toBeLessThan(hop * 1.04);
    expect(first.ratio).toBeGreaterThan(6);
    expect(jerksOf(play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: NORMAL }).track)).toEqual([]);
  });

  it('today\'s lunge (what ?treated=pack plays, no speed in it) reads no jerk over 60 px (the review\'s control: none; its own 24 to 36 px one at the apex is the six before frame 9148) and steps under 40 percent of the strike at fast', () => {
    for (const [drawn, reach] of [[502, 3.2], [422, 2.6], [410, 1.4]] as const) {
      const lunge = play({ name: 'auron', drawn, reach, kind: 'lunge' }).track;
      expect(Math.max(0, ...jerksOf(lunge).map((e) => e.px)), `${drawn} px`).toBeLessThan(60);
      expect(worstSteps(lunge, 1, 40).fwd, `${drawn} px`).toBeLessThan(0.4 * worstSteps(play({ name: 'auron', drawn, reach, kind: 'strike', timeScale: FAST }).track, 1, 40).fwd);
    }
  });
});
