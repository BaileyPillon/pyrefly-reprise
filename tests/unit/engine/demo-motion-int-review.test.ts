/**
 * The fixes of the integration review (branch demo-motion-int, tip 813c364f3; both games; Chapter I and Chapter IV only): M1 the turn-start landing thud, M2 the double stop and double swell on
 * Mega Flare and Total Annihilation, m1 a sourceless poison tick read as the boss move's blow. (The switchboard's keys are in `demo-motion-int-board.test.ts`.)
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './head-lock-fixture.ts';
import { setPace, setPaceGame } from '../../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../../src/engine/motion/CurvesSwitch.ts';
import { resetFeelForTests, setFeelChapter, setFeelPack } from '../../../src/engine/feel/FeelSwitch.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import { setFxChapter, setFxMode } from '../../../src/engine/spellfx/FxSwitch.ts';
import { setFxMotionHooks } from '../../../src/engine/spellfx/FxMotionAdapter.ts';
import { setMotionBeatSink, type MotionBeat } from '../../../src/engine/feel/MotionBeats.ts';
import { MIN_LAND_STRENGTH, newMotionMemory, planMotionSfx, type MotionGate } from '../../../src/engine/feel/MotionSfx.ts';
import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import { FakeDamageNumbers, FakeMessageBar, FakeStage } from '../helpers/FakeStage.ts';

beforeEach(() => {
  setPaceGame('ffx');
  setPace('steady');
});
afterEach(() => {
  setDemoChapter(undefined);
  setCurvesMode(null);
  setFxMode(null);
  resetFeelForTests();
  setMotionBeatSink(null);
  setFxMotionHooks({});
  setPaceGame('other');
  reset();
});

describe('M1: the turn-start weight shift under the curves makes no landing sound', () => {
  const gate = (over: Partial<MotionGate> = {}): MotionGate => ({ on: true, game: 'ffx', speed: 'normal', now: 1000, ...over });
  const step = (a: Actor, ms: number): void => {
    for (let i = 0; i < Math.round(ms / (1000 / 120)); i++) a.update(1000 / 120 / 1000);
  };

  it('the floor sits above the turn-start leap\'s landing (0.011 of the 0.06 cap) and below the smallest real landing (0.30)', () => {
    expect(MIN_LAND_STRENGTH).toBeGreaterThan(0.011 / 0.06);
    expect(MIN_LAND_STRENGTH).toBeLessThan(0.3);
  });
  it('the real actor\'s turn-start cue reports a landing the sound planner refuses; a dodge-sized landing still plays', () => {
    setCurvesChapter('seymour-flux');
    setCurvesMode('new');
    const beats: MotionBeat[] = [];
    setMotionBeatSink((b) => void beats.push(b));
    const a = new PaintedActor({ name: 'auron', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
    a.adoptPoses({ idle: painting('auron', 'idle') }, 'idle');
    (a as unknown as { playCue(cue: string): void }).playCue('step'); // `LifeCue` 'step': it is their turn
    step(a, 700);
    const lands = beats.filter((b) => b.kind === 'land');
    expect(lands).toHaveLength(1);
    expect(lands[0]!.strength).toBeCloseTo(0.011 / 0.06, 5);
    const answer = planMotionSfx(lands[0]!, gate(), newMotionMemory());
    expect(answer).toEqual({ ok: false, why: 'small' });
    expect(planMotionSfx({ kind: 'land', strength: 0.3 }, gate(), newMotionMemory()).ok).toBe(true);
  });
});

describe('through the real presenter: one stop, one punch, one pulse per big move', () => {
  type Seq<T> = T extends unknown ? Omit<T, 'seq'> : never;
  function rig(): { play: (e: Array<Seq<BattleEvent>>) => Promise<unknown>; seen: Array<Record<string, unknown>> } {
    const stage = new FakeStage(['tidus', 'yuna', 'kimahri'], ['seymour-flux', 'mortiorchis']);
    stage.vfx.land = (_at, o) => (o.deco ? 0 : 200);
    const seen: Array<Record<string, unknown>> = [];
    (stage as unknown as { fx: unknown }).fx = { enabled: () => true, hit: (o: Record<string, unknown>) => (seen.push({ ...o }), { freezeMs: 0, shook: false }) };
    const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), sleep: () => Promise.resolve() });
    return { seen, play: (events) => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent)) };
  }
  const dmg = (target: string, hit: number, count: number, source?: string, amount = 500): Seq<BattleEvent> =>
    ({ type: 'damage', targetId: target, ...(source === undefined ? {} : { sourceId: source }), amount, element: 'none', crit: false, hitIndex: hit, hitCount: count }) as Seq<BattleEvent>;
  const bossMove = (abilityId: string, abilityName: string, hits: number): Array<Seq<BattleEvent>> => [
    { type: 'action-start', actorId: 'mortiorchis', command: { kind: 'ability' } as never, abilityId, abilityName, targets: ['tidus', 'yuna', 'kimahri'] },
    ...['tidus', 'yuna', 'kimahri'].slice(0, hits).map((t, i) => dmg(t, i, hits, 'mortiorchis')),
    { type: 'action-end', actorId: 'mortiorchis' },
  ];

  it('M2: Mega Flare and Total Annihilation are NOT claimed (feel\'s own rules stop them once); Cross Cleave still is, once', async () => {
    setFxChapter('seymour-flux');
    setFxMode('new');
    const beats: string[] = [];
    setFxMotionHooks({ hitStop: (f) => beats.push(`hitStop${f}`) }); // the fx lane's own hooks still see the beat (only the claim is skipped)
    const mega = rig();
    await mega.play(bossMove('mega-flare', 'Mega Flare', 3));
    expect(mega.seen).toHaveLength(3);
    expect(mega.seen.every((o) => o['fxBig'] === undefined)).toBe(true);
    expect(beats).toEqual(['hitStop4']);
    const annihilation = rig();
    await annihilation.play(bossMove('total-annihilation', 'Total Annihilation', 3));
    expect(annihilation.seen.every((o) => o['fxBig'] === undefined)).toBe(true);
    expect(beats).toEqual(['hitStop4', 'hitStop4']);
    const cleave = rig();
    await cleave.play(bossMove('cross-cleave', 'Cross Cleave', 3));
    expect(cleave.seen.map((o) => o['fxBig'] === true)).toEqual([true, false, false]);
  });

  it('m1: with the pack on, a sourceless tick after a boss headline move takes none of the move\'s facts; sourced blows still do; with every switch at today the old reading stays', async () => {
    setFeelChapter('seymour-flux');
    setFeelPack(true);
    const tick = (): Array<Seq<BattleEvent>> => [...bossMove('lance-of-atrophy', 'Lance of Atrophy', 1), dmg('seymour-flux', 0, 1, undefined, 1400)];
    const on = rig();
    await on.play(tick());
    expect(on.seen).toHaveLength(2);
    expect(on.seen[0]!['bossBig']).toBe(true); // the Lance's own blow
    expect(on.seen[1]!['bossBig']).toBe(false); // the poison tick is no blow of the Lance
    expect(on.seen[1]!['big']).toBe(false);

    resetFeelForTests(); // every switch at today: the latest action is read as it always was (release 62's reading; the field is unused there)
    setFeelChapter('seymour-flux');
    const off = rig();
    await off.play(tick());
    expect(off.seen[1]!['bossBig']).toBe(true);
  });
});
