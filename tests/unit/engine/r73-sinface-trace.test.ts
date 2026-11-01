/**
 * r73-sinface, the offline trace of Chapter XVIII's 17 one-frame hops (FFX only; `docs/handoff/r73-sinface.md`). **No fix and no lift is in this file: it pins what the real actor, the real strike and the real jerk detector say, so the next
 * lane starts from facts and not from the suspects' list.** Chapter XVIII (`sin-face`) is off `TREATED_CHAPTERS`, so these cases read the nearest listed FFX chapter that plays the house curves with the same holds that matter here
 * (`evrae-airship`: `real`, `moments` held; `smear` plays) and, for the held-smear half, `yunalesca` (`smear` held, as in Chapter XVIII).
 *
 * The REAL `PaintedActor` (real pose records and registration rows, the real mix and head lock) plays the REAL house strike (`StrikeCurve.PROFILES.ffx`, what `real` held falls back to) and today's `lunge` (what `?treated=pack` plays) under a
 * real camera that draws the standing figure at a given height, 60 Hz, and every frame is read the way the continuity probe reads it: the registered head and feet through the plane's four projected corners, `detectJerks` with the policy's
 * own thresholds.
 *
 * What the review measured (`critic/reviews/4c01379d4-focused`, Chapter XVIII, `continuity.json`): Auron's hops 401.1 (feet), 278.3, 277.2, 256.4, 232.2, 230.6, 148.8, 148.6, 147.0, 147.0, 115.1, 115.0, 114.5, 113.6 px and Wakka's
 * 115.5, 114.2, 113.5, each at the frame a pose blend starts, the whole figure at once (head and feet together: `relPx` 4 to 8), the neighbouring steps 16 to 46 px (a one-frame spike, `localPx`), the first of each pair one frame from a camera cut.
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import type { PerspectiveCamera } from 'three';
import { Vector3 } from 'three';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectJerks, unitSquareToQuad } from '../../../critic/runner/lib/continuity-pure.mjs';
import { CFG, FRAME, corners, ctxOf } from './ko-fall-fixture.ts';
import { PaintedActor, cameraAt, painting, reset, slotsOf, viewOf, type Actor } from './head-lock-fixture.ts';
import { coarseMask, type CoarseMask } from '../../../src/engine/PoseAlign.ts';
import { LivingFigure } from '../../../src/engine/fx/mix/living.ts';
import { paceRate, setPaceGame } from '../../../src/engine/pace.ts';
import { setDemoChapter, setTreatedScope } from '../../../src/engine/motion/DemoGate.ts';
import { setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setCutAnchorMode } from '../../../src/engine/motion/CutAnchor.ts';
import { setSmearStyle } from '../../../src/engine/motion/SmearSwitch.ts';
import { setSwapScope } from '../../../src/engine/motion/SwapSwitch.ts';
import { resetSmearLog } from '../../../src/engine/motion/SmearLog.ts';
import { PROFILES, resolveStrike, sampleAt } from '../../../src/engine/motion/StrikeCurve.ts';
import { LUNGE_MS } from '../../../src/engine/StrikeBeat.ts';
import type { StrikePlan } from '../../../src/engine/motion/StrikePlan.ts';

const W = 1600;
const H = 900;
/** The nearest listed FFX chapter that plays the house curves (`real` held) and the smear; the chapter whose held smear Chapter XVIII shares. */
const PLAYS = 'evrae-airship';
const HOLDS_SMEAR = 'yunalesca';

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
  setCutAnchorMode(null);
  setSmearStyle(null);
  setSwapScope(null);
  resetSmearLog();
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

function figure(name: string, poses: readonly string[], masks?: Record<string, CoarseMask>): Actor {
  const a = new PaintedActor({ name, worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  const set: Record<string, ReturnType<typeof painting>> = {};
  for (const p of poses) set[p] = painting(name, p, masks?.[p] ? { silhouette: masks[p]! } : {});
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

/** The dominant plane's registered feet and head on the 1600 x 900 canvas, the way `figureTrack` reads them. */
function sample(a: Actor, cam: PerspectiveCamera, n: number): Sample {
  a.updateMatrixWorld(true);
  const planes = slotsOf(a) as unknown as Array<{ pose: string; fade: number; mesh: { matrixWorld: never }; meta: { stanceX: number; width: number; height: number; head: [number, number, number, number] }; scale: { anchorY: number } }>;
  let best = planes[0]!;
  for (const s of planes) if (s.pose && s.fade > best.fade) best = s;
  const map = unitSquareToQuad(corners(cam, best.mesh.matrixWorld)) as unknown as number[];
  const m = best.meta;
  return { n, t: n * FRAME, feet: applyMap(map, m.stanceX / m.width, best.scale.anchorY / m.height), head: applyMap(map, (m.head[0] + m.head[2]) / 2, (m.head[1] + m.head[3]) / 2), cam: [0, 0] };
}

/** One attack at 60 Hz: the track of the registered head and feet, frame by frame. `strike`: the house strike with the pose swaps on its marks (ready to attack on the fastest travel frame, attack to follow on the fastest frame home); else today's lunge. */
function play(o: { name: string; drawn: number; reach: number; kind: 'strike' | 'lunge'; frames?: number; offsetMs?: number }): { track: Sample[]; marks: Record<string, number> } {
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
      distance: o.reach, game: 'ffx', timeScale: 1, arc: true,
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

/** The worst one-frame share of the lunge distance of the house FFX strike's travel and of its way home, walked at every offset of a 60 Hz frame at the game's default pace (what `play` plays). */
function houseShares(): { travel: number; home: number } {
  const shape = resolveStrike(PROFILES.ffx, { distance: 1, height: 1.82, heft: 0, timeScale: 1, arcGain: 1 });
  const frame = FRAME * paceRate('action'); // paced ms one displayed frame advances the strike's clock
  let travel = 0;
  let home = 0;
  for (let t = 0; t + frame < shape.windupMs + shape.travelMs; t += 0.25) travel = Math.max(travel, sampleAt(shape, 'pre', t + frame).x - sampleAt(shape, 'pre', t).x);
  for (let t = 0; t + frame < shape.returnMs + shape.settleMs; t += 0.25) home = Math.max(home, sampleAt(shape, 'post', t).x - sampleAt(shape, 'post', t + frame).x);
  return { travel, home };
}

describe('the house strike\'s one-frame step is a law of the reach and the drawn size, and today\'s lunge steps as much', () => {
  const REACH = 4.1; // world units: about the solver's longest (the house 1.4 plus `REACH_CAP` 3.0 is 4.4)

  it('the worst frame of the travel is 0.149 of the reach and of the way home 0.080 of it, whatever the figure is drawn at', () => {
    const { travel, home } = houseShares();
    expect(travel).toBeGreaterThan(0.145);
    expect(travel).toBeLessThan(0.155);
    expect(home).toBeGreaterThan(0.075);
    expect(home).toBeLessThan(0.085);
  });

  it.each([420, 500])('on the real actor drawn %d px tall: the head steps share x reach x (drawn / 1.82) px at the travel peak, at 1.4, 3 and 4.1 units of reach (to 6 percent, the head sits a little above the feet)', (drawn) => {
    const { travel } = houseShares();
    for (const reach of [1.4, 3, REACH]) {
      const { fwd } = worstSteps(play({ name: 'auron', drawn, reach, kind: 'strike' }).track, 1, 40);
      const want = travel * reach * (drawn / 1.82);
      expect(fwd, `${drawn} px, reach ${reach}`).toBeGreaterThan(want * 0.94);
      expect(fwd, `${drawn} px, reach ${reach}`).toBeLessThan(want * 1.06);
    }
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

  it("read as the strike's travel peak (a reach is `px / (0.149 x drawn / 1.82)`), the review's ready>attack hops split in two: Auron's four later ones and Wakka's three imply 3.6 to 4.4 units (inside the solver's cap of 4.4) and Auron's first three imply 7.9 to 9.7 (outside it): one strike law is not all seventeen hops", () => {
    const { travel } = houseShares();
    const reachOf = (h: (typeof HOPS)[number]): number => h.px / (travel * (h.drawn / 1.82));
    const heads = HOPS.filter((h) => h.swap === 'ready>attack');
    expect(heads).toHaveLength(10); // 7 of Auron's pairs and 3 of Wakka's
    const inside = heads.filter((h) => h.n >= 10511 || h.fig === 'wakka');
    const outside = heads.filter((h) => !inside.includes(h));
    expect(outside.map((h) => h.n)).toEqual([9148, 9675, 10062]);
    for (const h of inside) {
      expect(reachOf(h), `${h.fig} ${h.n}`).toBeGreaterThan(3.5);
      expect(reachOf(h), `${h.fig} ${h.n}`).toBeLessThan(4.5);
    }
    for (const h of outside) expect(reachOf(h), `${h.fig} ${h.n}`).toBeGreaterThan(7.5); // far past the solver's cap: no strike of this curve at that size steps that far
  });

  it('today\'s lunge (what ?treated=pack plays) carries the same reach at the same one-frame step to within 12 percent: the strike is not what makes the step bigger', () => {
    for (const drawn of [420, 500]) {
      const s = worstSteps(play({ name: 'auron', drawn, reach: REACH, kind: 'strike' }).track, 1, 40).fwd;
      const l = worstSteps(play({ name: 'auron', drawn, reach: REACH, kind: 'lunge' }).track, 1, 40).fwd;
      expect(Math.abs(s - l) / l, `${drawn} px: strike ${s.toFixed(0)}, lunge ${l.toFixed(0)}`).toBeLessThan(0.12);
    }
  });
});

describe('the real jerk detector reads the strike as a smooth move, so the live one-frame spikes are not this curve', () => {
  it('a house strike of 4.1 units drawn 420 and 500 px, with its pose swaps on the travel peak and the way-home peak, reads no jerk of 24 px or more on its travel and its way home (frames 1 to 60); the neighbours of its fastest frame are 60 to 100 percent of it', () => {
    for (const drawn of [420, 500]) {
      const { track, marks } = play({ name: 'auron', drawn, reach: 4.1, kind: 'strike' });
      expect(Object.keys(marks).sort()).toEqual(['end', 'settlePeak', 'travelPeak']); // the swaps really were made on the marks
      const events = (detectJerks(track.slice(0, 60), 1, CFG) as Array<{ n: number; px: number }>).filter((e) => e.n < 60);
      expect(events.map((e) => `${e.n}:${e.px}`), `${drawn} px`).toEqual([]);
      const steps = track.slice(1, 60).map((s, i) => Math.abs(s.head[0] - track[i]!.head[0]));
      const peak = Math.max(...steps);
      const at = steps.indexOf(peak);
      expect(steps[at - 1]! / peak, `${drawn} px`).toBeGreaterThan(0.6);
      expect(steps[at + 1]! / peak, `${drawn} px`).toBeGreaterThan(0.6);
    }
  });

  it("the live spikes were isolated: the neighbouring steps were 16 to 46 px against a spike of 113 to 401 (ratio 4.1 to 18); no reach and no drawn size of the strike makes that ratio, which is at most 1.7 on the real actor from 1.4 to 4.4 units and from 280 to 600 px", () => {
    let worst = 0;
    for (const drawn of [280, 420, 600]) {
      for (const reach of [1.4, 3, 4.4]) {
        const { track } = play({ name: 'auron', drawn, reach, kind: 'strike' });
        const steps = track.slice(1, 40).map((s, i) => Math.abs(s.head[0] - track[i]!.head[0]));
        const peak = Math.max(...steps);
        const at = steps.indexOf(peak);
        const near = steps.slice(Math.max(0, at - 5), at + 6).filter((_, i, all) => i !== all.indexOf(peak));
        const sorted = [...near].sort((x, y) => x - y);
        worst = Math.max(worst, peak / Math.max(2, sorted[sorted.length >> 1]!)); // the detector's own `local`: the median of the neighbours (`continuity-pure.mjs`)
      }
    }
    expect(worst).toBeLessThan(1.7);
    expect(worst).toBeLessThan(CFG.motion.jerkRatio); // under the detector's own ratio of 3, so it never calls it a pop
  });
});

// ------------------------------------------------------------------ the cut anchor is inert where the smear is held

const art = process.env['PYREFLY_ART_DIR'] ?? resolve('public/art');
const haveArt = existsSync(join(art, 'characters', 'auron', 'idle.png')) && existsSync(resolve('docs/target/pose-measure.json'));

async function silhouetteOf(file: string): Promise<CoarseMask> {
  const meta = await sharp(file).metadata();
  const sw = Math.min(meta.width!, 256);
  const sh = Math.min(meta.height!, 1024);
  const { data } = await sharp(file).ensureAlpha().resize(sw, sh, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return coarseMask(data, sw, sh, Math.round(0.35 * 255))!;
}

describe.skipIf(!haveArt)('the chapter row of the cut anchor never shifts a plane in a chapter that holds the smear (Chapter XVIII holds it: `PieceHoldsLast.ts`)', () => {
  /** The largest drift (`slot.align`, world units) either plane carries in the frames after a ready to attack swap made on a moving figure's fastest frame. */
  async function drift(chapter: string): Promise<number> {
    setDemoChapter(chapter);
    setSmearStyle('paint'); // the page's default under the pack
    setSwapScope('wide'); // the page's default (`SwapSwitch.SCOPE_DEFAULT`): the exceptions (Yunalesca, Chapter XVIII, Ixion at Djose) keep release 67's look; `all` is the measuring word that ignores them
    setCutAnchorMode('on'); // the word Chapter XVIII's row carries (`CutAnchor.CUT_ANCHOR_CHAPTERS`)
    const masks: Record<string, CoarseMask> = {};
    for (const p of ['idle', 'ready', 'attack', 'follow']) masks[p] = await silhouetteOf(join(art, 'characters', 'auron', `${p}.png`));
    const a = figure('auron', ['idle', 'ready', 'attack', 'follow'], masks);
    a.setPose('ready', { immediate: true, force: true });
    a.update(0.001, 0.001);
    let worst = 0;
    let swapped = false;
    void a.strike({
      distance: 3, game: 'ffx', timeScale: 1, arc: true,
      marks: { travelPeak: () => { swapped = true; a.setPose('attack'); }, settlePeak: () => a.setPose('follow') },
    });
    for (let i = 0; i < 90; i++) {
      a.update(1 / 60, 1 / 60);
      for (const s of slotsOf(a) as unknown as Array<{ align: number }>) worst = Math.max(worst, Math.abs(s.align));
    }
    expect(swapped, chapter).toBe(true);
    return worst;
  }

  it('where the smear plays (positive control) the anchor shifts the incoming plane; where it is held (Yunalesca, as Chapter XVIII) it never does', async () => {
    expect(await drift(PLAYS)).toBeGreaterThan(0.05);
    expect(await drift(HOLDS_SMEAR)).toBe(0);
  });
});
