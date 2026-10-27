/**
 * MF-04, the numbers of the plan measured in the engine (no GPU): the REAL `PaintedActor` runs in through the REAL `RunInMotion`, the strike is the real sampled one started where the presenter starts it
 * (`CurveBeats.startAttackMove`, right after `strike()` settles), at 60, 120 and 144 Hz on a virtual clock, and the figure's world x and lift are read every frame.
 *
 * The plan's targets (curves audit C-05 to C-07): the run peak no more than 0.67 of today's, the lift in the first flight frame 5 px or less (15 today), the speed at touch-down 3 px or less (9 to 10),
 * and under `flow` no stand between the run's end and the lunge (92 to 100 ms today), with contact where it was. `MF_LOG=1` prints the numbers (px per 60 Hz frame at 1600 wide, ms).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './engine/head-lock-fixture.ts';
import { RunInMotion } from '../../src/app/screens/BattleScreenRunIn.ts';
import { startAttackMove } from '../../src/engine/motion/CurveBeats.ts';
import { setCurvesChapter, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import type { BattleState } from '../../src/battle/common/types.ts';
import type { MotionCtx } from '../../src/engine/BattlePresenterMotion.ts';
import type { StageMotionPort } from '../../src/engine/motion/StageMotionPort.ts';
import { FakeActor, FakeStage } from './helpers/FakeStage.ts';

afterEach(() => {
  reset();
  setMoveWord('run', null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setPaceGame('other');
  setPace('steady');
});

const PX = 146;
const FRAME: Record<number, number> = { 60: 1000 / 60, 120: 1000 / 120, 144: 1000 / 144 };

interface Track {
  /** Per frame: ms since the run began, world x (px), lift (px). */
  t: number[];
  /** The index of the first frame after the strike was asked for. */
  askedIdx: number;
  x: number[];
  lift: number[];
  /** ms at which the run's own tween ended, at which the strike was asked for, and at which the blow's contact mark fired. */
  arrivedAt: number;
  askedAt: number;
  contactAt: number;
  /** World x of the figure at contact, px. */
  contactX: number;
  spotX: number;
  homeX: number;
}

async function play(word: 'today' | 'smooth' | 'flow' | 'pace', hz: number): Promise<Track> {
  setMoveWord('run', word);
  setCurvesChapter('ffx2-bahamut');
  setCurvesMode('new');
  setPaceGame('ffx2');
  setPace('steady');
  const a = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: painting('yuna', 'idle'), hurt: painting('yuna', 'hurt') }, 'idle');
  const home = { x: -0.75, y: 0, z: -1.5 };
  a.position.set(home.x, home.y, home.z);
  a.setPose('idle', { immediate: true, force: true });
  const stage = new FakeStage(['yuna'], ['bahamut']);
  stage.actors.set('yuna', a as unknown as FakeActor);
  stage.actors.set('bahamut', Object.assign(new FakeActor('bahamut', []), { position: { x: 1.6, y: 0, z: -5.8 } }));
  const motion: StageMotionPort = {
    span: (id) => {
      const p = stage.actors.get(id)?.position;
      if (!p) return null;
      return id === 'bahamut' ? { x0: -0.9, x1: 3.9, y0: 0, y1: 6, z: p.z } : { x0: p.x - 0.45, x1: p.x + 0.45, y0: 0, y1: 1.8, z: p.z };
    },
    rect: (id, o) => {
      const p = o?.at ?? stage.actors.get(id)!.position;
      const k = 1100 / (8.2 - p.z);
      return { x: 800 + (p.x - 0.5) * k - 0.45 * k, y: 450, w: 0.9 * k, h: 1.8 * k };
    },
    view: () => ({ w: 1600, h: 900 }),
    truck: async () => undefined,
    smear: () => undefined,
  };
  (stage as unknown as { motion: StageMotionPort }).motion = motion;
  const port = new RunInMotion(() => ({ combatants: { yuna: { id: 'yuna', side: 'party', dresspheres: { current: 'warrior' } } } }) as unknown as BattleState);
  const mctx: MotionCtx = { stage, speed: 'normal', sleep: async () => undefined };
  const dt = FRAME[hz]!;
  const t: number[] = [];
  const x: number[] = [];
  const lift: number[] = [];
  let released = false;
  let askedAt = -1;
  let contactAt = -1;
  let contactX = NaN;
  const ev = { type: 'action-start', seq: 1, actorId: 'yuna', command: { kind: 'attack', targets: ['bahamut'] }, targets: ['bahamut'] } as never;
  let now = 0;
  void port.strike(ev, mctx, 'attack').then(() => {
    released = true;
  });
  const spot = port.notes[0] ? port.notes[0].spot : null;
  let started = false;
  let arrivedAt = -1;
  let askedIdx = -1;
  const flush = async (): Promise<void> => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
  };
  const innerX = (): number => (a as unknown as { inner: { position: { x: number } } }).inner.position.x;
  const innerY = (): number => (a as unknown as { inner: { position: { y: number } } }).inner.position.y;
  await flush();
  for (let f = 0; f < Math.round(6000 / dt); f++) {
    a.update(dt / 1000);
    now += dt;
    await flush();
    if (released && !started) {
      started = true;
      askedAt = now;
      askedIdx = t.length + 1;
      const ctxE = { speed: () => 'normal', deps: {} } as never;
      startAttackMove(ctxE, a as never, { distance: 0.6, house: 0.6 }, { hold: Promise.resolve(), reached: () => { contactAt = now; contactX = (a.position.x + innerX()) * PX; } }, true, 'yuna');
    }
    if (arrivedAt < 0 && spot && Math.abs(a.position.x - spot.x) < 1e-9) arrivedAt = now;
    t.push(now);
    x.push((a.position.x + innerX()) * PX);
    lift.push(innerY() * PX);
    if (contactAt >= 0 && now > contactAt + 2200) break;
  }
  return { t, x, lift, askedIdx, arrivedAt, askedAt, contactAt, contactX, spotX: (spot?.x ?? NaN) * PX, homeX: home.x * PX };
}

/** px per 60 Hz frame, per frame. */
const speedOf = (v: number[], hz: number): number[] => v.map((p, i) => (i ? (p - v[i - 1]!) * (hz / 60) : 0));

describe('MF-04 in the engine: the run, the lift, the stand', () => {
  for (const hz of [60, 120, 144]) {
    it(`at ${hz} Hz: today's run peaks at twice its mean; smooth is 1.33 times (no more than 0.67 of today's)`, async () => {
      const today = await play('today', hz);
      const smooth = await play('smooth', hz);
      // the run is the span up to the strike's asking (today: arrival; the trapezoid: the same time)
      const run = (tr: Track): number[] => speedOf(tr.x, hz).slice(1, tr.askedIdx);
      const peak = (tr: Track): number => Math.max(...run(tr));
      const mean = (tr: Track): number => (tr.spotX - tr.homeX) / ((tr.askedAt / 1000) * 60);
      if (process.env['MF_LOG']) console.log(JSON.stringify({ hz, runPeakToday: +peak(today).toFixed(2), runPeakSmooth: +peak(smooth).toFixed(2), meanToday: +mean(today).toFixed(2), runMsToday: Math.round(today.askedAt), runMsSmooth: Math.round(smooth.askedAt) }));
      expect(peak(smooth) / peak(today)).toBeLessThanOrEqual(0.7); // 0.667 in theory; a frame's sampling of a peak
      expect(Math.abs(smooth.askedAt - today.askedAt)).toBeLessThanOrEqual(2 * FRAME[hz]!); // the same run time
    });

    it(`at ${hz} Hz: the lift leaves the floor in 5 px or less and touches down in 3 px or less (today 15 and 9 to 10)`, async () => {
      const today = await play('today', hz);
      const smooth = await play('smooth', hz);
      const per60 = hz / 60;
      const takeOff = (tr: Track): number => {
        const i = tr.lift.findIndex((v) => v > 0.2);
        return Math.max((tr.lift[i]! - tr.lift[i - 1]!) * per60, (tr.lift[i + 1]! - tr.lift[i]!) * per60);
      };
      const firstFrame = (tr: Track): number => {
        const i = tr.lift.findIndex((v) => v > 0.2);
        return (tr.lift[i]! - tr.lift[i - 1]!) * per60;
      };
      const touchDown = (tr: Track): number => {
        const win = tr.lift.slice(0, Math.round(900 / FRAME[hz]!)); // the run in: the first leap
        const apex = win.indexOf(Math.max(...win));
        let last = apex;
        while (last < win.length - 1 && win[last + 1]! > 1e-6) last++;
        // the mean descent over the last three frames in the air (the audit: they are 60 to 70 percent of the peak, 9 to 10 px a frame, today)
        return (win[Math.max(apex, last - 2)]! / Math.min(3, last - apex + 1)) * per60;
      };
      if (process.env['MF_LOG']) console.log(JSON.stringify({ hz, takeOffToday: +takeOff(today).toFixed(1), takeOffSmooth: +takeOff(smooth).toFixed(1), firstFrameSmooth: +firstFrame(smooth).toFixed(1), touchDownToday: +touchDown(today).toFixed(1), touchDownSmooth: +touchDown(smooth).toFixed(1) }));
      expect(takeOff(today)).toBeGreaterThan(8);
      expect(firstFrame(smooth)).toBeLessThanOrEqual(5);
      expect(touchDown(today)).toBeGreaterThan(3);
      expect(touchDown(smooth)).toBeLessThanOrEqual(3);
    });

    it(`at ${hz} Hz: flow has no stand between the run and the lunge, contact is where it was, the whole attack is shorter`, async () => {
      const today = await play('today', hz);
      const flow = await play('flow', hz);
      // the longest stretch where the figure's net speed is under 1.5 px per 60 Hz frame, from 150 ms before the strike is asked for to the blow's contact
      const stand = (tr: Track): number => {
        const v = speedOf(tr.x, hz);
        const from = Math.max(1, tr.askedIdx - Math.round(150 / FRAME[hz]!));
        const to = tr.t.findIndex((s) => s >= tr.contactAt);
        let best = 0;
        let run = 0;
        for (let i = from; i < to; i++) {
          if (Math.abs(v[i]!) < 1.5) run += FRAME[hz]!;
          else run = 0;
          best = Math.max(best, run);
        }
        return best;
      };
      const contactMs = (tr: Track): number => tr.contactAt;
      const peakTo = (tr: Track): number => Math.max(...speedOf(tr.x, hz).slice(1, tr.t.findIndex((s) => s >= tr.contactAt)));
      const accel = (tr: Track): number => { const v = speedOf(tr.x, hz).slice(1, tr.t.findIndex((s) => s >= tr.contactAt)); return Math.max(...v.map((s, i) => (i ? Math.abs(s - v[i - 1]!) : 0))); };
      if (process.env['MF_LOG']) console.log(JSON.stringify({ hz, standToday: Math.round(stand(today)), standFlow: Math.round(stand(flow)), contactMsToday: Math.round(contactMs(today)), contactMsFlow: Math.round(contactMs(flow)), contactXToday: +today.contactX.toFixed(1), contactXFlow: +flow.contactX.toFixed(1), peakToday: +peakTo(today).toFixed(1), peakFlow: +peakTo(flow).toFixed(1), stepToday: +accel(today).toFixed(1), stepFlow: +accel(flow).toFixed(1), askedToday: Math.round(today.askedAt), askedFlow: Math.round(flow.askedAt) }));
      expect(stand(today)).toBeGreaterThanOrEqual(60); // the standing the audit measured: about 100 ms
      expect(stand(flow)).toBeLessThanOrEqual(35);
      expect(Math.abs(flow.contactX - today.contactX)).toBeLessThan(3); // px: contact is where it was
      expect(flow.contactAt).toBeLessThan(today.contactAt - 40); // the blow lands sooner by about the wind-up
    });
  }

  it('pace: the run lasts the real pace\'s time', async () => {
    const today = await play('today', 120);
    const pace = await play('pace', 120);
    expect(pace.askedAt).toBeGreaterThan(today.askedAt + 80);
  });
});
