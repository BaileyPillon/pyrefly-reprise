/**
 * The shared fixture of the r73-fit pace tests (`booth-b4-r73-return-pace.test.ts`, `booth-b4-r73-return-pace-actor.test.ts`; FFX only): a real `PaintedActor` (the KO fixture's Wakka and Lulu), a real camera that draws the
 * figure's 1.82-unit height as many px of a 1600 x 900 canvas as asked, and `play`, which plays the strike the presenter asks for (`returnPaceOf` and all) frame by frame and reads the idle plane's centre through the camera.
 * A helper, not a test file.
 */
import { afterEach, beforeEach } from 'vitest';
import { Vector3, type PerspectiveCamera } from 'three';
import type { BattleStage } from '../../../src/engine/BattlePresenterPorts.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setDemoChapter, setTreatedScope } from '../../../src/engine/motion/DemoGate.ts';
import { setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { returnPaceOf } from '../../../src/engine/motion/ReturnPace.ts';
import { realStrikeProfile } from '../../../src/engine/motion/RealMotion.ts';
import type { StrikePlan } from '../../../src/engine/motion/StrikePlan.ts';
import { cameraAt, reset } from './head-lock-fixture.ts';
import { corners, slots } from './ko-fall-fixture.ts';
import type { Actor } from './head-lock-fixture.ts';

export const W = 1600;
export const H = 900;
export const g = globalThis as { innerHeight?: number };
/** Register the environment every r73 pace test runs in (a 900 px page, FFX's steady pace, the treated scope all) and put it back after each test. Call once at the top of a test file. */
export function useReturnPaceEnv(): void {
  let savedHeight: number | undefined;
  beforeEach(() => {
    savedHeight = g.innerHeight;
    g.innerHeight = H;
    setPaceGame('ffx'); // the game's own default pace (steady, 1.2): the profile's milliseconds are on screen
    setPace('steady');
    setTreatedScope('all');
  });
  afterEach(() => {
    if (savedHeight === undefined) delete g.innerHeight;
    else g.innerHeight = savedHeight;
    setPaceGame('other');
    setPace('steady');
    setTreatedScope(null);
    setCurvesMode(null);
    setDemoChapter(undefined);
    reset();
  });
}

export const EVRAE = 'evrae-airship';
export const MIRROR = 'mirror-aeons';
export const FIRST = 'seymour-flux';
export const FOURTH = 'ffx2-bahamut';
/** The drawn size of the standing figure's world height, px of 900: Chapter I's (the flip's cap is read off it), Chapter VIII's (Tidus's flip there steps 234.9 px against Chapter I's 169: 387), Chapter III's. */
export const SIZES = [280, 390, 462] as const;
/** The lunge, world units: the house lunge, a solved reach, and the longest one Chapter VIII's Wakka showed (619 px of lunge at 390 px drawn is 2.9 units: 619 / (390 / 1.82)). */
export const LUNGES = [1.4, 2.2, 2.9] as const;

export const project = (v: Vector3, cam: PerspectiveCamera): { x: number; y: number } => {
  const p = v.clone().project(cam);
  return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
};
export const drawnPx = (a: Actor, cam: PerspectiveCamera): number => (1.82 * Math.abs(project(a.position, cam).y - project(a.headPoint(), cam).y)) / (a.headPoint().y - a.position.y);
export function cameraDrawing(a: Actor, px: number): PerspectiveCamera {
  let lo = 2;
  let hi = 40;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (drawnPx(a, cameraAt(2.4, mid)) > px) lo = mid;
    else hi = mid;
  }
  return cameraAt(2.4, (lo + hi) / 2);
}
export function stageOf(a: Actor, camera: PerspectiveCamera | (() => PerspectiveCamera)): { stage: BattleStage } {
  const camOf = typeof camera === 'function' ? camera : (): PerspectiveCamera => camera;
  const stage = {
    actor: () => a,
    project: (_id: string, anchor: 'head' | 'chest' | 'feet' = 'head') => project(anchor === 'feet' ? a.position : a.headPoint(), camOf()),
  };
  return { stage: stage as unknown as BattleStage };
}

export const WAKKA = realStrikeProfile('ffx', 'wakka', 'snappy')!;
export const LULU = realStrikeProfile('ffx', 'lulu', 'snappy')!;
export const FRAME = 1000 / 60;
export const RATE = 1 / 1.2;

export interface Run {
  /** The idle plane's centre x per frame, px of the 1600 px canvas. */
  cx: number[];
  /** The largest one-frame move of the centre, px. */
  step: number;
  /** The frame the strike's driver let go of it (the move is over), and the frame its `settlePeak` mark fired. */
  endFrame: number;
  settleFrame: number;
}

/** The strike the presenter asks for, played on the actor at `hz` with the first frame `offsetMs` short; `pace` asks `returnPaceOf` for the plan's pace in `chapter`, false plays the plan as release 72 played it. */
export function play(cam: PerspectiveCamera, a: Actor, o: { id: string; profile: typeof WAKKA; distance: number; hz: number; offsetMs?: number; pace: boolean; chapter?: string; timeScale?: number; stageCam?: () => PerspectiveCamera; onHoldEnd?: () => void }): Run {
  setDemoChapter(o.chapter ?? EVRAE);
  let frame = 0;
  let settleFrame = -1;
  const { stage } = stageOf(a, o.stageCam ?? cam); // `stageCam`: the camera the stage answers from at the moment it is asked, which a test may move between the contact and the hold's end
  const returnPace = o.pace ? returnPaceOf({ stage }, o.id, o.profile, o.timeScale ?? 1, o.distance) : undefined;
  const plan: StrikePlan = { distance: o.distance, game: 'ffx', timeScale: o.timeScale ?? 1, arc: true, profile: o.profile, marks: { settlePeak: () => (settleFrame = frame), ...(o.onHoldEnd ? { holdEnd: o.onHoldEnd } : {}) }, ...(returnPace ? { returnPace } : {}) };
  a.setPose('idle', { immediate: true, force: true });
  a.update(0.001, 0.001);
  const idle = slots(a).find((s) => s.pose === 'idle')!;
  const cxOf = (): number => {
    a.updateMatrixWorld(true);
    const q = corners(cam, idle.mesh.matrixWorld);
    return (q[0]! + q[2]! + q[4]! + q[6]!) / 4;
  };
  const driver = (a as unknown as { curves: { strike: unknown } }).curves;
  void a.strike(plan);
  const dt = 1 / o.hz;
  const cx = [cxOf()];
  let endFrame = -1;
  a.update(Math.max(0.0005, dt - (o.offsetMs ?? 0) / 1000), dt);
  cx.push(cxOf());
  for (let i = 0; i < Math.round(2.4 * o.hz); i++) {
    frame = i + 1;
    a.update(dt, dt);
    cx.push(cxOf());
    if (endFrame < 0 && driver.strike === null) endFrame = frame;
  }
  let step = 0;
  for (let i = 1; i < cx.length; i++) step = Math.max(step, Math.abs(cx[i]! - cx[i - 1]!));
  return { cx, step, endFrame, settleFrame };
}

export const worst = (cam: PerspectiveCamera, a: Actor, o: Parameters<typeof play>[2]): Run => [0, 4, 8, 12].map((offsetMs) => play(cam, a, { ...o, offsetMs })).reduce((m, r) => (r.step > m.step ? r : m));

