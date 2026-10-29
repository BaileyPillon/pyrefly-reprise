/**
 * R68-FLOWLEAD (release 68; FFX-2 ONLY: the run-in is FFX-2's alone, `research/ffx2-combat-core.md` section 1, D-354; FFX has none).
 *
 * The defect (measured on the live release 67, `D:/Tools/pyrefly-scratch/2026-10-28/r67/gaps/flow/world-stand.json`): Chapter IV, a girl's attack from a run-in under the defaults (`?run=flow`,
 * `?curves=real-snappy`, `?strikeshape=travel`): the world stand between the run's stop and the dash was 183 to 200 ms (Paine mean 192, Rikku 192), against 133 to 150 ms in release 66's look. The flow run
 * asks for the strike before the run ends, timed from the HOUSE wind-up (100 ms), but under a real profile the wind-up that plays is 300 ms (Paine and Rikku), so the dash began after the run had stopped.
 *
 * The repair: `RunEase.flowLeadMs` takes the wind-up of the profile that will play (`RealMotion.windupMsOf`, `CurveBeats.profileAfterRun`), and the cap is `RunEase.FLOW_LEAD_MAX_SHARE` of the run (0.85).
 * Because the strike is now asked for while most of the run (and the camera truck it rides with) is still to come, the reach is read through the truck the run ends under (`RunInMotion.reachTruck`).
 *
 * The frame loop (`helpers/FlowLeadSim.ts`) drives the real run-in port, strike beat, lunge solver and curve driver at 60, 120 and 144 Hz and takes the live pass's own measure. It reproduces the live release 67 and
 * the release 66 look before it is used for anything else (the first two tests of that block).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { RunInMotion, runMs } from '../../src/app/screens/BattleScreenRunIn.ts';
import { motionMs, type MotionCtx } from '../../src/engine/BattlePresenterMotion.ts';
import type { Point3 } from '../../src/engine/BattlePresenterPorts.ts';
import { profileAfterRun } from '../../src/engine/motion/CurveBeats.ts';
import { setCurvesChapter, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { realStrikeProfile, windupMsOf } from '../../src/engine/motion/RealMotion.ts';
import { FLOW_LEAD_MAX_SHARE, FLOW_OVERLAP_MS, FLOW_PROFILE, flowLeadMs } from '../../src/engine/motion/RunEase.ts';
import type { StageMotionPort } from '../../src/engine/motion/StageMotionPort.ts';
import { lungePlan } from '../../src/engine/motion/StrikeReach.ts';
import { PROFILES, defaultPaceFactor } from '../../src/engine/motion/StrikeCurve.ts';
import type { BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import { FakeActor, FakeStage } from './helpers/FakeStage.ts';
import { simulateRunIn, type FlowSimOptions } from './helpers/FlowLeadSim.ts';

const PACE = defaultPaceFactor('ffx2'); // 1.1: FFX-2's default pace
const R67: Pick<FlowSimOptions, 'run' | 'curves' | 'strikeshape'> = { run: 'flow', curves: 'real-snappy', strikeshape: 'travel' };
const R66: Pick<FlowSimOptions, 'run' | 'curves' | 'strikeshape'> = { run: 'today', curves: 'new', strikeshape: 'today' };
const HZ = [60, 120, 144] as const;
const GIRLS = ['paine', 'rikku'] as const;

afterEach(() => {
  setMoveWord('run', null);
  setMoveWord('strikeshape', null);
  setCurvesChapter(undefined);
  setCurvesMode(null);
});

describe('the lead is the wind-up that plays', () => {
  it('windupMsOf: the real wind-up with the frame floor, the heft stretch only on a house time', () => {
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('real-snappy');
    setMoveWord('strikeshape', 'travel');
    const paine = realStrikeProfile('ffx2', 'paine', 'snappy')!;
    const rikku = realStrikeProfile('ffx2', 'rikku', 'snappy')!;
    expect(windupMsOf(paine)).toBe(300); // Paine's 86 ms snappy wind-up is lifted to the 300 ms of `?strikeshape=travel`
    expect(windupMsOf(rikku)).toBe(300); // Rikku's 213 likewise
    expect(windupMsOf(PROFILES.ffx2)).toBe(100);
    expect(windupMsOf(PROFILES.ffx2, 1)).toBeCloseTo(130, 9); // a house time is stretched by a heavy body (a girl's heft is 0)
    expect(windupMsOf({ ...paine, windupMs: 5 })).toBe(20); // a real phase is at least REAL_MIN_MS long
    expect(windupMsOf({ ...paine, real: { ...paine.real!, exactTime: true } }, 1)).toBe(300); // the real times are not stretched again
  });

  it('flowLeadMs: no profile named reads the house flow wind-up (release 67\'s number to the bit); a named one reads its own', () => {
    expect(flowLeadMs(1, PACE)).toBe(((FLOW_PROFILE.windupMs + FLOW_OVERLAP_MS) * 1) / PACE);
    expect(flowLeadMs(1, PACE, 300)).toBeCloseTo(340 / PACE, 9);
    expect(flowLeadMs(0.32, PACE, 300)).toBeCloseTo((340 * 0.32) / PACE, 9);
    expect(flowLeadMs(1, PACE, 300)).toBeGreaterThan(flowLeadMs(1, PACE, 100));
  });

  it('profileAfterRun: her real profile in the default Chapter IV; the house flow profile with the new curves; none under run=today or smooth', () => {
    const stage = new FakeStage(['paine'], ['bahamut']);
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('real-snappy');
    setMoveWord('strikeshape', 'travel');
    setMoveWord('run', 'flow');
    expect(windupMsOf(profileAfterRun({ stage }, 'paine')!)).toBe(300);
    setCurvesMode('new'); // release 66's curves with the flow run: the house flow profile, so the lead is release 67's
    expect(profileAfterRun({ stage }, 'paine')).toBe(FLOW_PROFILE);
    for (const word of ['today', 'smooth'] as const) {
      setMoveWord('run', word);
      expect(profileAfterRun({ stage }, 'paine')).toBeUndefined();
    }
  });
});

// ------------------------------------------------------------------ the port asks for the strike by that profile

class FlowActor extends FakeActor {
  runs: Array<{ ms: number | undefined; easing: unknown }> = [];
  waits: number[] = [];
  constructor(id: string, log: string[], at: Point3) {
    super(id, log);
    Object.assign(this.position, at);
  }
  override moveTo(_to?: Point3, ms?: number, easing?: (t: number) => number): Promise<void> {
    this.runs.push({ ms, easing });
    return new Promise<void>(() => undefined); // the run never ends here: only what strike() asked for is read
  }
  waitMs(ms: number): Promise<void> {
    this.waits.push(ms);
    return new Promise<void>(() => undefined);
  }
}

function field(): { stage: FakeStage; paine: FlowActor } {
  const stage = new FakeStage(['paine'], ['bahamut']);
  const log: string[] = [];
  const paine = new FlowActor('paine', log, { x: -0.75, y: 0, z: -1.5 });
  stage.actors.set('paine', paine);
  stage.actors.set('bahamut', new FlowActor('bahamut', log, { x: 1.6, y: 0, z: -5.8 }));
  const motion: StageMotionPort = {
    span: (id) => {
      const p = stage.actors.get(id)?.position;
      return !p ? null : id === 'bahamut' ? { x0: -0.9, x1: 3.9, y0: 0, y1: 6, z: p.z } : { x0: p.x - 0.45, x1: p.x + 0.45, y0: 0, y1: 1.8, z: p.z };
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
  return { stage, paine };
}
const state = (): BattleState => ({ combatants: { paine: { id: 'paine', dresspheres: { current: 'warrior' } } } }) as unknown as BattleState;
const attack = { type: 'action-start', seq: 1, actorId: 'paine', command: { kind: 'attack', targets: ['bahamut'] }, targets: ['bahamut'] } as unknown as Extract<BattleEvent, { type: 'action-start' }>;
const mctx = (stage: FakeStage, o: Partial<MotionCtx> = {}): MotionCtx => ({ stage, speed: 'normal', sleep: async () => undefined, ...o });
const tick = async (): Promise<void> => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

describe('the run-in port asks for the strike by the profile it will play', () => {
  async function asked(speed: 'normal' | 'fast' = 'normal'): Promise<{ wait: number | undefined; ms: number }> {
    const { stage, paine } = field();
    const m = new RunInMotion(state);
    void m.strike(attack, mctx(stage, { speed }), 'attack');
    await tick();
    return { wait: paine.waits[0], ms: paine.runs[0]!.ms! };
  }

  it('the default Chapter IV (real-snappy, travel, flow): the real 300 ms wind-up plus the overlap, capped at 0.85 of the run', async () => {
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('real-snappy');
    setMoveWord('strikeshape', 'travel');
    setMoveWord('run', 'flow');
    const { wait, ms } = await asked();
    const lead = Math.min(ms * FLOW_LEAD_MAX_SHARE, flowLeadMs(1, PACE, 300));
    expect(wait).toBeCloseTo(ms - lead, 9);
    expect(ms - wait!).toBeGreaterThan(flowLeadMs(1, PACE)); // earlier than release 67's 127 ms
    expect(wait!).toBeGreaterThan(0.1 * ms); // and the run's first tenth is left alone
  });

  it('a longer run is not capped: the whole wind-up and the overlap fit', async () => {
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('real-snappy');
    setMoveWord('strikeshape', 'travel');
    setMoveWord('run', 'pace'); // 450 to 760 ms
    const { wait, ms } = await asked();
    expect(ms).toBeGreaterThanOrEqual(450);
    expect(ms - wait!).toBeCloseTo(flowLeadMs(1, PACE, 300), 9);
  });

  it('the lead scales with the playback speed as the run does (fast: 0.32 of both)', async () => {
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('real-snappy');
    setMoveWord('strikeshape', 'travel');
    setMoveWord('run', 'flow');
    const normal = await asked();
    const fast = await asked('fast');
    expect(fast.ms).toBe(motionMs(normal.ms, 'fast'));
    expect(fast.wait! / fast.ms).toBeCloseTo(normal.wait! / normal.ms, 1);
  });

  it('release 66\'s curves with the flow run keep release 67\'s lead to the bit (the house flow profile)', async () => {
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('new');
    setMoveWord('run', 'flow');
    const { wait, ms } = await asked();
    expect(wait).toBe(ms - Math.min(ms * 0.6, flowLeadMs(1, PACE)));
  });

  it('?run=today and ?run=smooth ask for nothing early: the strike waits for the arrival, with any curves', async () => {
    for (const [curves, strikeshape] of [['real-snappy', 'travel'], ['new', 'today']] as const) {
      for (const run of ['today', 'smooth'] as const) {
        setCurvesChapter('ffx2-bahamut');
        setCurvesMode(curves);
        setMoveWord('strikeshape', strikeshape);
        setMoveWord('run', run);
        const { wait, ms } = await asked();
        expect(wait).toBeUndefined();
        expect(ms).toBeGreaterThanOrEqual(motionMs(runMs(0).in, 'normal')); // the run itself is the house run, 320 ms or more
      }
    }
  });
});

// ------------------------------------------------------------------ the frame loop

describe('the model reproduces the live pass before it is used', () => {
  it('release 67 (the lead timed from the house wind-up): the stand the live pass measured, 183 to 200 ms, within a frame', async () => {
    for (const girl of GIRLS) {
      const r = await simulateRunIn({ girl, hz: 60, ...R67, release67: true, partTruck: true });
      expect(r.standMs).toBeGreaterThanOrEqual(166);
      expect(r.standMs).toBeLessThanOrEqual(217);
      expect(r.windupMs).toBeCloseTo(300 / PACE, 6); // the wind-up that plays is the real 300 ms (paced 273), not the house 100
    }
  });

  it('release 66\'s look (?stance..run=today, curves=new, strikeshape=today): the 133 to 150 ms the live pass measured', async () => {
    for (const girl of GIRLS) {
      const r = await simulateRunIn({ girl, hz: 60, ...R66 });
      expect(r.standMs).toBeGreaterThanOrEqual(116);
      expect(r.standMs).toBeLessThanOrEqual(166);
    }
  });
});

describe('after the repair: the stand at 60, 120 and 144 Hz', () => {
  it('is under 60 ms for Paine and Rikku, at every refresh rate, on the common short run and on a long one', async () => {
    for (const hz of HZ) {
      for (const girl of GIRLS) {
        for (const startX of [undefined, -4] as const) {
          const r = await simulateRunIn({ girl, hz, ...R67, ...(startX === undefined ? {} : { startX }) });
          expect(r.standMs, `${girl} ${hz} Hz ${startX ?? 'rest'}`).toBeLessThan(60);
          const before = await simulateRunIn({ girl, hz, ...R67, release67: true, partTruck: true, ...(startX === undefined ? {} : { startX }) });
          expect(r.standMs).toBeLessThan(before.standMs);
          const r66 = await simulateRunIn({ girl, hz, ...R66, ...(startX === undefined ? {} : { startX }) });
          expect(r.standMs).toBeLessThanOrEqual(r66.standMs); // never longer than release 66's
        }
      }
    }
  });

  it('adds no kink and no slide: the speed never steps more than release 67\'s did, never runs backward, and the swap is on the same speed', async () => {
    for (const hz of HZ) {
      for (const girl of GIRLS) {
        const before = await simulateRunIn({ girl, hz, ...R67, release67: true, partTruck: true });
        const after = await simulateRunIn({ girl, hz, ...R67 });
        expect(after.maxStep, `${girl} ${hz} Hz`).toBeLessThanOrEqual(before.maxStep + 0.25);
        expect(after.minSpeed).toBeGreaterThan(-0.5); // release 66 and 67 drift back 0.25 to 0.9 px a frame at the run's end (the pull-back); the repair does not
        expect(after.swapSpeed!).toBeCloseTo(before.swapSpeed!, 0); // the painting swap stays on the dash's fastest frame, at the same speed: the same swap class and smear
      }
    }
  });

  it('the dash starts as the run brakes (not after it) and the blow lands sooner: contact 100 to 200 ms earlier than release 67\'s, still after the run has ended', async () => {
    for (const girl of GIRLS) {
      const before = await simulateRunIn({ girl, hz: 120, ...R67, release67: true, partTruck: true });
      const after = await simulateRunIn({ girl, hz: 120, ...R67 });
      const gain = before.contactAt - after.contactAt;
      expect(gain).toBeGreaterThan(100);
      expect(gain).toBeLessThan(220);
      expect(after.contactAt).toBeGreaterThan(after.runEndAt);
      expect(after.strikeAt).toBeGreaterThanOrEqual(0.1 * after.runMs); // asked for no earlier than the cap
      expect(after.contactReach).toBeCloseTo(before.contactReach, 6); // the blow is where it was
    }
  });

  it('a longer attack at the fast speed still has no stand longer than release 66\'s', async () => {
    for (const girl of GIRLS) {
      const r = await simulateRunIn({ girl, hz: 144, ...R67, speed: 'fast' });
      const r66 = await simulateRunIn({ girl, hz: 144, ...R66, speed: 'fast' });
      expect(r.standMs).toBeLessThanOrEqual(r66.standMs);
    }
  });

  it('?run=today with release 66\'s curves is untouched: the numbers the model gave before this repair (Paine 133 ms, contact 650 ms at 60 Hz)', async () => {
    const r = await simulateRunIn({ girl: 'paine', hz: 60, ...R66 });
    expect(r.standMs).toBe(133);
    expect(Math.round(r.contactAt)).toBe(650);
    expect(r.strikeAt).toBeCloseTo(r.runEndAt, 6); // the strike is asked for when the run ends, as ever
    expect(r.minSpeed).toBeCloseTo(-0.69, 1);
  });
});

// ------------------------------------------------------------------ the reach

describe('the reach is read through the camera the run ends under', () => {
  /** A world whose near girl and far foe slide by different amounts under a camera truck (parallax), as the real stage's do. */
  function solved(o: { truck?: Point3; live: Point3 }): { distance: number; trucks: Array<Point3 | undefined> } {
    const trucks: Array<Point3 | undefined> = [];
    const stage = new FakeStage(['paine'], ['bahamut']);
    stage.actors.get('paine')!.position.x = -2;
    stage.actors.get('bahamut')!.position.x = 3;
    (stage as unknown as { motion: unknown }).motion = {
      view: () => ({ w: 1600, h: 900 }),
      rect: () => null,
      shape: (who: string, p?: { at?: Point3; truck?: Point3 }) => {
        trucks.push(p?.truck);
        const t = p?.truck ?? o.live;
        return who === 'paine' ? { rect: { x: 600 + 100 * (p?.at?.x ?? -2) - 110 * t.x, y: 400, w: 90, h: 180 } } : { rect: { x: 760 - 40 * t.x, y: 400, w: 90, h: 180 } };
      },
    };
    const port = { reachFor: () => true, lungeFor: () => 0.6, reachGap: () => 1.5, ...(o.truck ? { reachTruck: () => o.truck } : {}) };
    return { distance: lungePlan({ stage } as never, { actorId: 'paine', targets: ['bahamut'] }, port as never, 'attack').distance, trucks };
  }

  it('every shape read carries the run\'s final truck, and the lunge it solves is the one the camera of the blow gives, whatever the truck is part-way', () => {
    const final: Point3 = { x: 0.7, y: 0.1, z: 0 };
    const blow = solved({ live: final }); // the strike asked for after the run: the live truck IS the final one
    const early = solved({ truck: final, live: { x: 0.05, y: 0, z: 0 } }); // asked for early: the live truck is 7 percent along, the port says where it ends
    const unaided = solved({ live: { x: 0.05, y: 0, z: 0 } }); // release 67's read: the truck as it is
    expect(early.distance).toBeCloseTo(blow.distance, 9);
    expect(early.trucks.length).toBeGreaterThan(0);
    for (const t of early.trucks) expect(t).toBe(final);
    expect(Math.abs(unaided.distance - blow.distance)).toBeGreaterThan(0.3); // the part-way read is off by the camera's remaining slide times the parallax (0.45 world here, an exaggerated world)
    expect(unaided.distance).toBeLessThan(blow.distance); // the foe looks nearer under a camera that has not slid yet: the lunge stops short
    for (const t of unaided.trucks) expect(t).toBeUndefined(); // no truck named: the stage reads its own
  });

  it('RunInMotion names the truck the plan chose once she is out', async () => {
    setCurvesChapter('ffx2-bahamut');
    setCurvesMode('real-snappy');
    setMoveWord('run', 'flow');
    const { stage } = field();
    const m = new RunInMotion(state);
    expect(m.reachTruck('paine')).toBeUndefined();
    void m.strike(attack, mctx(stage), 'attack');
    await tick();
    expect(m.reachTruck('paine')).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number), z: expect.any(Number) }));
  });
});
