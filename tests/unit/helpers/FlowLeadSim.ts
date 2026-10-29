/**
 * THE RUN-IN TO DASH, AS A FRAME LOOP (release 68, `r68-flowlead`; FFX-2 ONLY: the run-in is FFX-2's alone, `research/ffx2-combat-core.md` section 1, D-354).
 *
 * Drives the REAL run-in port (`BattleScreenRunIn.RunInMotion`), the REAL strike beat (`CurveBeats.startAttackMove`, which picks the real or the flow profile), the REAL
 * lunge solver (`StrikeReach.lungePlan`) and the REAL curve driver (`CurveDriver`, `StrikeRun`, `StrikeCurve.sampleAt`) over a tween group, one frame at a time at a refresh rate
 * of your choice, in the order the game runs a frame (`PaintedActor.update`: tweens, then the curves; then the render; then the microtasks the frame's promises were waiting on).
 * The figure's world x is what `PaintedActor.update` writes: its root position plus the curves' x, along its facing. The pace is the game's default (FFX-2, `steady`, 1.1).
 *
 * What it measures is the live gap pass's own measure (`D:/Tools/pyrefly-scratch/2026-10-28/r67/gaps/lib/flow-world.mjs`): after the run's peak speed, the first frame whose world
 * speed is under 1 px per 60 Hz frame (60 px a second, whatever the refresh rate) and how long it stays under it. The camera is a pinhole at the stage's own pixel scale
 * (1600 x 900, 1100 / (8.2 - z) px a world unit, the number the other RUN-IN tests use), so a pixel here is the pass's pixel at that width.
 */
import { afterEach } from 'vitest';
import type { BattleEvent, BattleState } from '../../../src/battle/common/types.ts';
import type { MotionCtx } from '../../../src/engine/BattlePresenterMotion.ts';
import type { EventCtx } from '../../../src/engine/BattlePresenterEvents.ts';
import type { Point3 } from '../../../src/engine/BattlePresenterPorts.ts';
import { RunInMotion } from '../../../src/app/screens/BattleScreenRunIn.ts';
import { startAttackMove } from '../../../src/engine/motion/CurveBeats.ts';
import { CurveDriver, type LeapOptions } from '../../../src/engine/motion/CurveDriver.ts';
import { setCurvesChapter, setCurvesMode, type CurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { setMoveWord } from '../../../src/engine/motion/MoveSwitch.ts';
import type { StageMotionPort } from '../../../src/engine/motion/StageMotionPort.ts';
import { startStrike } from '../../../src/engine/motion/ActorCurves.ts';
import { lungePlan } from '../../../src/engine/motion/StrikeReach.ts';
import { setPace, setPaceGame, paceRate } from '../../../src/engine/pace.ts';
import { flowLeadMs } from '../../../src/engine/motion/RunEase.ts';
import { defaultPaceFactor } from '../../../src/engine/motion/StrikeCurve.ts';
import { TweenGroup, resolveEasing, type EasingFn, type EasingName } from '../../../src/engine/Tween.ts';
import { FakeStage, type FakeActor } from './FakeStage.ts';

/** Chapter IV as measured live (`__pyrefly.fx.snapshot().mix.framing.staging`): each girl's resting x (share included) and z; Bahamut's seat. */
const REST = { paine: { x: -0.746, z: -1.5 }, rikku: { x: -1.485, z: 0.1 }, yuna: { x: -2.218, z: 1.45 } } as const;
const BOSS = { x: 1.6, z: -5.8 };
const DRESS: Record<string, string> = { paine: 'warrior', rikku: 'dark-knight', yuna: 'gunner' };

/** A figure with `PaintedActor`'s root-motion code: `moveTo` and `waitMs` on a tween group, `strike` and `leap` on a curve driver, both on the paced clock. */
class Figure {
  readonly tweens = new TweenGroup();
  readonly curves = new CurveDriver();
  readonly position: Point3;
  readonly facing: 1 | -1;
  pose = 'ready';
  worldHeight = 1.82;
  swaps: Array<{ pose: string; at: number }> = [];
  /** Every `moveTo` this figure was asked for: when it began and ended (ms on the sim's clock) and its tween ms. */
  readonly moves: Array<{ from: number; to: number; ms: number; end: number }> = [];
  /** The model of release 67's code: rewrite the wait the run-in asks for (`waitMs(ms - lead)`), given the run's own ms. Absent: the wait as asked. */
  waitAs: ((asked: number, runMs: number) => number) | undefined;
  constructor(readonly id: string, x: number, z: number, facing: 1 | -1, private readonly clock: () => number) {
    this.position = { x, y: 0, z };
    this.facing = facing;
  }
  setPose(name: string): void {
    this.pose = name;
    this.swaps.push({ pose: name, at: this.clock() });
  }
  moveTo(to: Point3, ms = 400, easing: EasingName | EasingFn = 'quadInOut'): Promise<void> {
    const from = { ...this.position };
    const ease = resolveEasing(easing);
    const move = { from: this.clock(), to: to.x, ms, end: -1 };
    this.moves.push(move);
    return this.tweens
      .toAsync(0, 1, { durationMs: ms, easing: ease, onUpdate: (t) => void Object.assign(this.position, { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, z: from.z + (to.z - from.z) * t }) })
      .then(() => void (move.end = this.clock()));
  }
  waitMs(ms: number): Promise<void> {
    const run = this.moves[this.moves.length - 1];
    const asked = this.waitAs && run ? this.waitAs(ms, run.ms) : ms;
    return this.tweens.toAsync(0, 1, { durationMs: Math.max(1, asked), easing: 'linear', onUpdate: () => {} });
  }
  hop(_h?: number, ms = 1): Promise<void> {
    return this.waitMs(ms);
  }
  leap(height: number, ms: number, options?: LeapOptions): Promise<void> {
    return this.curves.leap(height, ms, options);
  }
  strike(plan: Parameters<typeof startStrike>[1]): Promise<void> {
    return startStrike(this.curves, plan, this.worldHeight);
  }
  strikeHeft(): number {
    return 0;
  }
  headPoint(): { x: number; y: number; z: number } {
    return { x: this.position.x, y: this.worldHeight, z: this.position.z };
  }
  /** `PaintedActor.update`'s first two lines, on the paced clock; returns the world x the frame draws. */
  update(dt: number): number {
    this.tweens.update(dt * paceRate('action'));
    this.curves.advance(dt * 1000 * paceRate('action'));
    return this.position.x + this.curves.out.x * this.facing;
  }
}

export interface FlowSimOptions {
  girl: 'paine' | 'rikku';
  /** Frames a second: 60, 120, 144. */
  hz: number;
  /** `?run=`. */
  run: 'today' | 'smooth' | 'flow' | 'pace';
  /** `?curves=`: `new` is release 66's house profile, `real-snappy` the pack's default since release 67. */
  curves: Extract<CurvesMode, 'new' | 'real-snappy'>;
  /** `?strikeshape=`. */
  strikeshape: 'today' | 'travel';
  speed?: 'normal' | 'fast';
  /** Where the girl begins, world x (default: her resting place in Chapter IV); a smaller number is a longer run. */
  startX?: number;
  /** Model release 67's code: the wait `RunInMotion.strike` asks for is rewritten to `runMs - min(0.6 * runMs, house lead)` (the strike asked for 140 ms before the run's end, timed from the HOUSE wind-up). */
  release67?: boolean;
  /** Model the reach read without `reachTruck` (the truck as it is part-way), the code before the final-truck read. */
  partTruck?: boolean;
}

export interface FlowSimResult {
  /** One entry per frame: the clock (ms since the run began), the world x (world units), the speed in px per 60 Hz frame (positive along her facing), her root x (the run alone, `gx` of the recordings) and the curves' x (the strike alone, `cx`). */
  frames: Array<{ t: number; x: number; v: number; gx: number; cx: number }>;
  hz: number;
  /** The run's length on screen, ms (the tween's ms times the pace). */
  runMs: number;
  /** When the run's tween ended, ms since it began. */
  runEndAt: number;
  /** When the strike was asked for (the beat after `strike()` returned), ms since the run began. */
  strikeAt: number;
  /** The strike's windup and travel as it played, paced ms. */
  windupMs: number;
  travelMs: number;
  /** The frame (index) of the run's peak speed, the first frame after it under 1 px per 60 Hz frame, and the first frame after that at or over it (the dash). */
  peakF: number;
  standFromF: number;
  standToF: number;
  /** The stand: ms between the first frame under 1 px per 60 Hz frame after the run's peak and the first one at or over it again (`flow-world.mjs`'s own definition). */
  standMs: number;
  /** All the time under the threshold between the peak and the contact (frames times the frame length), ms, however many pieces. */
  stillMs: number;
  /** The lowest signed speed between the run's peak and the dash's fastest frame (px per 60 Hz frame; a negative number is a backward drift). */
  minSpeed: number;
  /** The biggest speed change from one frame to the next between the run's peak and the contact (px per 60 Hz frame). */
  maxStep: number;
  /** When the strike's `travelPeak` mark ran the impact painting swap, ms since the run began, and the world speed on that frame (px per 60 Hz frame). */
  swapAt: number | null;
  swapSpeed: number | null;
  /** When the contact was reached, ms since the run began. */
  contactAt: number;
  /** Where the figure stood at the contact minus where the run's spot is, world units (the lunge reaches the same place whatever the lead). */
  contactReach: number;
  spotX: number;
  /** The lunge the solver gave (world units) and the camera truck the run ends under; the live truck's share done when the strike was asked for (0..1). */
  lunge: number;
  truck: Point3;
  truckDoneAtStrike: number;
}

const flush = async (): Promise<void> => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

const attackEvent = (id: string): Extract<BattleEvent, { type: 'action-start' }> =>
  ({ type: 'action-start', seq: 1, actorId: id, command: { kind: 'attack', targets: ['bahamut'] }, targets: ['bahamut'] }) as unknown as Extract<BattleEvent, { type: 'action-start' }>;

/** Put every switch back where a test found it (call from `afterEach`; this file registers it once). */
export function resetFlowSim(): void {
  setMoveWord('run', null);
  setMoveWord('strikeshape', null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setPaceGame('other');
  setPace('steady');
}
afterEach(resetFlowSim);

/** One plain Attack by a girl, from her action's start to well past the dash, as the game runs the frames. */
export async function simulateRunIn(o: FlowSimOptions): Promise<FlowSimResult> {
  setMoveWord('run', o.run);
  setMoveWord('strikeshape', o.strikeshape);
  setCurvesChapter('ffx2-bahamut');
  setCurvesMode(o.curves);
  setPace('steady');
  setPaceGame('ffx2');
  const speed = o.speed ?? 'normal';

  let now = 0;
  const stage = new FakeStage(['paine', 'rikku', 'yuna'], ['bahamut']);
  const fig: Record<string, Figure> = {};
  for (const id of ['paine', 'rikku', 'yuna'] as const) fig[id] = new Figure(id, id === o.girl && o.startX !== undefined ? o.startX : REST[id].x, REST[id].z, 1, () => now);
  fig['bahamut'] = new Figure('bahamut', BOSS.x, BOSS.z, -1, () => now);
  for (const [id, f] of Object.entries(fig)) stage.actors.set(id, f as unknown as FakeActor);
  const live = { x: 0, y: 0, z: 0 };
  const truckEnd = { x: 0, y: 0, z: 0 }; // the truck the run ends under: the first slide the run-in asks for
  const truckTweens = new TweenGroup();
  const at = (id: string, p: { at?: Point3; truck?: Point3; rig?: string }): { x: number; y: number; w: number; h: number } => {
    const pos = p.at ?? fig[id]!.position;
    const t = p.truck ?? (p.rig ? live : { x: 0, y: 0, z: 0 }); // `StageMotion.rect`: a cut rig keeps the truck the run is under, as it is NOW
    const k = 1100 / (8.2 + t.z - pos.z);
    return { x: 800 + (pos.x - 0.5 - t.x) * k - 0.45 * k, y: 450 + (2.3 + t.y) * k - 1.8 * k, w: 0.9 * k, h: 1.8 * k };
  };
  const motion: StageMotionPort = {
    span: (id) => {
      const p = fig[id]?.position;
      if (!p) return null;
      return id === 'bahamut' ? { x0: p.x - 2.5, x1: p.x + 2.3, y0: 0, y1: 6, z: p.z } : { x0: p.x - 0.45, x1: p.x + 0.45, y0: 0, y1: 1.8, z: p.z };
    },
    rect: (id, p) => at(id, p ?? {}),
    view: () => ({ w: 1600, h: 900 }),
    // `StageMotion.truck`: a quadInOut tween of the camera's slide on the UNPACED frame clock (`BattlePresenterStage.update`: `motion.update(dt)`), so it finishes before the paced run does
    truck: (dx, dy, dz, ms) => {
      if (truckEnd.x === 0 && truckEnd.y === 0 && truckEnd.z === 0) Object.assign(truckEnd, { x: dx, y: dy, z: dz });
      const from = { ...live };
      truckTweens.killAll();
      if (ms <= 1) return Promise.resolve(void Object.assign(live, { x: dx, y: dy, z: dz }));
      return truckTweens.toAsync(0, 1, { durationMs: ms, easing: 'quadInOut', onUpdate: (u) => void Object.assign(live, { x: from.x + (dx - from.x) * u, y: from.y + (dy - from.y) * u, z: from.z + (dz - from.z) * u }) });
    },
    smear: () => undefined,
  };
  (stage as unknown as { motion: StageMotionPort }).motion = motion;
  (stage as unknown as { paints: (id: string, pose: string) => boolean }).paints = () => true; // both girls have a ready and an attack painting
  const state = (): BattleState => ({ combatants: Object.fromEntries(Object.entries(DRESS).map(([id, current]) => [id, { id, side: 'party', dresspheres: { current } }])) }) as unknown as BattleState;
  const port = new RunInMotion(state);
  if (o.partTruck) (port as unknown as { reachTruck: undefined }).reachTruck = undefined;
  const id = o.girl;
  const girl = fig[id]!;
  if (o.release67) girl.waitAs = (_asked, runMs) => runMs - Math.min(runMs * 0.6, flowLeadMs(1, defaultPaceFactor('ffx2')));
  const mctx: MotionCtx = { stage, speed, sleep: async () => undefined };
  const ectx = { stage, speed: () => speed, deps: {}, sleep: async () => undefined } as unknown as EventCtx;

  const events = { strike: -1, contact: -1, impact: -1, truckAtStrike: 0 };
  let plan: { distance: number; house: number } | null = null;
  const presenter = (async (): Promise<void> => {
    await port.strike(attackEvent(id), mctx, 'attack'); // the beat awaits the run-in port; what it does next is `actionStart`'s own order
    events.strike = now;
    events.truckAtStrike = truckEnd.x === 0 ? 0 : live.x / truckEnd.x;
    plan = lungePlan(ectx, attackEvent(id), port, 'attack');
    startAttackMove(ectx, girl as never, plan, { hold: Promise.resolve(), reached: () => void (events.contact = now), impact: () => void (events.impact = now) }, port.lungeFor(id) !== undefined, id);
  })();

  const dtSec = 1 / o.hz;
  const frameMs = 1000 / o.hz;
  const k = 1100 / (8.2 - girl.position.z);
  const frames: FlowSimResult['frames'] = [];
  let prevX = girl.position.x;
  let shape: { windupMs: number; travelMs: number } | null = null;
  for (let f = 0; f < Math.ceil(o.hz * 2.4); f++) {
    now = f * frameMs;
    truckTweens.update(dtSec);
    const x = girl.update(dtSec);
    frames.push({ t: now, x, v: ((x - prevX) * k * o.hz) / 60, gx: girl.position.x, cx: girl.curves.out.x });
    prevX = x;
    shape ??= girl.curves.strike ? { windupMs: girl.curves.strike.shape.windupMs, travelMs: girl.curves.strike.shape.travelMs } : null;
    await flush();
  }
  await presenter;
  const run = girl.moves[0]!;
  const spotX = port.notes[0]!.spot.x;
  const at0 = (t: number): number => frames.findIndex((fr) => fr.t >= t);

  // The measure, as `flow-world.mjs` takes it: the run's peak, then the first frame under 1 px per 60 Hz frame and the frames until the speed is over it again, all before the dash's fastest frame
  // (the strike's `travelPeak` mark, where the impact painting goes up): past that the figure is at the foe and its hold is not a stand.
  const thr = 1;
  const runEndF = at0(run.end);
  const boundF = events.impact >= 0 ? at0(events.impact) : frames.length;
  let peakF = 1;
  for (let i = 1; i <= runEndF; i++) if (Math.abs(frames[i]!.v) > Math.abs(frames[peakF]!.v)) peakF = i;
  let i0 = peakF;
  while (i0 < boundF && Math.abs(frames[i0]!.v) >= thr) i0++;
  let i1 = i0;
  while (i1 < boundF && Math.abs(frames[i1]!.v) < thr) i1++;
  let still = 0;
  let minV = Infinity;
  let maxStep = 0;
  for (let i = peakF; i < boundF; i++) {
    if (Math.abs(frames[i]!.v) < thr) still++;
    minV = Math.min(minV, frames[i]!.v);
    if (i > peakF) maxStep = Math.max(maxStep, Math.abs(frames[i]!.v - frames[i - 1]!.v));
  }
  const contactF = at0(events.contact);
  return {
    frames,
    hz: o.hz,
    runMs: Math.round(run.ms / paceRate('action')),
    runEndAt: run.end,
    strikeAt: events.strike,
    windupMs: shape?.windupMs ?? 0,
    travelMs: shape?.travelMs ?? 0,
    peakF,
    standFromF: i0,
    standToF: i1,
    standMs: Math.round((i1 - i0) * frameMs),
    stillMs: Math.round(still * frameMs),
    minSpeed: minV,
    maxStep,
    swapAt: events.impact >= 0 ? events.impact : null,
    swapSpeed: events.impact >= 0 ? frames[at0(events.impact)]!.v : null,
    contactAt: events.contact,
    contactReach: frames[Math.max(0, contactF)]!.x - spotX,
    spotX,
    lunge: (plan as { distance: number } | null)?.distance ?? 0,
    truck: { ...truckEnd },
    truckDoneAtStrike: events.truckAtStrike,
  };
}

export type { FakeActor };
