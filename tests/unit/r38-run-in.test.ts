/**
 * r38-motion RUN-IN (D-354; FFX-2 only, sourced): a short-range girl's attack runs to her target and home, under BATTLE SPECTACLE
 * only, never under REDUCE MOTION, never over an open command menu. The port (`BattleScreenRunIn.ts`), the presenter's gate and its
 * hooks (`strike`, `lungeFor`, `close`), the ATB overlap, and that FFX and FF7 are untouched.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import type { ActionMotionPort, MotionCtx } from '../../src/engine/BattlePresenterMotion.ts';
import type { Point3, MomentsPort } from '../../src/engine/BattlePresenterPorts.ts';
import type { StageMotionPort } from '../../src/engine/motion/StageMotionPort.ts';
import { eyeCandy } from '../../src/engine/fx/EyeCandy.ts';
import { RunInMotion, runMs, STRIKE_LUNGE } from '../../src/app/screens/BattleScreenRunIn.ts';
import { FakeActor, FakeStage } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;
type Ev = Unsequenced<BattleEvent>;

afterEach(() => {
  eyeCandy.setSub('runin', true);
  eyeCandy.setTier(null);
});

/** An actor that remembers where it was told to go and how far it was told to lunge. */
class RunActor extends FakeActor {
  moves: Point3[] = [];
  lunges: number[] = [];
  constructor(id: string, log: string[], at: Point3) {
    super(id, log);
    Object.assign(this.position, at);
  }
  override async moveTo(to?: Point3): Promise<void> {
    if (to) {
      this.moves.push({ ...to });
      Object.assign(this.position, to);
    }
  }
  override async lunge(distance?: number): Promise<void> {
    this.lunges.push(distance ?? NaN);
  }
}

const HOME: Record<string, Point3> = { paine: { x: -0.75, y: 0, z: -1.5 }, rikku: { x: -1.5, y: 0, z: 0.1 }, yuna: { x: -2.2, y: 0, z: 1.45 } };

/** A field of three girls and a boss, with a stage `motion` port that answers from plain numbers (a pinhole, boss far behind). */
function field(): { stage: FakeStage; actors: Record<string, RunActor>; truck: number[][]; smear: string[] } {
  const stage = new FakeStage(['paine', 'rikku', 'yuna'], ['bahamut']);
  const log: string[] = [];
  const actors: Record<string, RunActor> = {};
  for (const id of ['paine', 'rikku', 'yuna']) stage.actors.set(id, (actors[id] = new RunActor(id, log, HOME[id]!)));
  stage.actors.set('bahamut', new RunActor('bahamut', log, { x: 1.6, y: 0, z: -5.8 }));
  const truck: number[][] = [];
  const smear: string[] = [];
  const at = (id: string, o?: { at?: Point3; truck?: Point3 }): { x: number; y: number; w: number; h: number } => {
    const p = o?.at ?? stage.actors.get(id)!.position;
    const t = o?.truck ?? { x: 0, y: 0, z: 0 };
    const k = 1100 / (8.2 + t.z - p.z);
    return { x: 800 + (p.x - 0.5 - t.x) * k - 0.45 * k, y: 450 + (2.3 + t.y) * k - 1.8 * k - 2.3 * k + 2.3 * k, w: 0.9 * k, h: 1.8 * k };
  };
  const motion: StageMotionPort = {
    span: (id) => {
      const p = stage.actors.get(id)?.position;
      if (!p) return null;
      return id === 'bahamut' ? { x0: -0.9, x1: 3.9, y0: 0, y1: 6, z: p.z } : { x0: p.x - 0.45, x1: p.x + 0.45, y0: 0, y1: 1.8, z: p.z };
    },
    rect: at,
    view: () => ({ w: 1600, h: 900 }),
    truck: async (...a) => void truck.push(a),
    smear: (id, ms) => void smear.push(`${id}:${Math.round(ms)}`),
  };
  (stage as unknown as { motion: StageMotionPort }).motion = motion;
  (stage as unknown as { fx: { enabled(): boolean } }).fx = { enabled: () => true };
  return { stage, actors, truck, smear };
}

const state = (spheres: Record<string, string>): (() => BattleState) => () =>
  ({ combatants: Object.fromEntries(Object.entries(spheres).map(([id, current]) => [id, { id, dresspheres: { current } }])) }) as unknown as BattleState;

const attackEvent = (actorId: string, target = 'bahamut') => ({ type: 'action-start', seq: 1, actorId, command: { kind: 'attack', targets: [target] }, targets: [target] }) as unknown as Extract<BattleEvent, { type: 'action-start' }>;

const mctx = (stage: FakeStage, o: Partial<MotionCtx> = {}): MotionCtx => ({ stage, speed: 'normal', sleep: async () => undefined, ...o });

describe('RunInMotion', () => {
  const dress = state({ paine: 'warrior', rikku: 'dark-knight', yuna: 'gunner' });

  it('runs a short-range girl to a stop, then only the strike\'s own lunge is left', async () => {
    const f = field();
    const m = new RunInMotion(dress);
    expect(m.lungeFor('paine')).toBeUndefined();
    await m.strike(attackEvent('paine'), mctx(f.stage), 'attack');
    expect(f.actors['paine']!.moves).toHaveLength(1);
    expect(f.actors['paine']!.moves[0]!.x).toBeGreaterThan(HOME['paine']!.x + 1); // toward the boss, a run you can see
    expect(m.lungeFor('paine')).toBe(STRIKE_LUNGE);
    expect(f.truck[0]![0]).toBeGreaterThan(0); // the camera follows part of the way
    expect(f.smear[0]).toMatch(/^paine:\d+$/);
    expect(m.notes).toHaveLength(1);
    expect(m.notes[0]).toMatchObject({ actor: 'paine', target: 'bahamut' });
  });

  it('runs her home again, brings the camera back, and the lunge is the house\'s again', async () => {
    const f = field();
    const m = new RunInMotion(dress);
    await m.strike(attackEvent('paine'), mctx(f.stage), 'attack');
    await m.close('paine', mctx(f.stage));
    expect(f.actors['paine']!.moves.at(-1)).toEqual(HOME['paine']);
    expect(f.truck.at(-1)).toEqual([0, 0, 0, 1]); // never leaves the frame off true
    expect(m.lungeFor('paine')).toBeUndefined();
  });

  it('a long-range girl fires from where she stands (sourced): no run', async () => {
    const f = field();
    const m = new RunInMotion(dress);
    expect(m.longRange('yuna')).toBe(true);
    expect(m.longRange('paine')).toBe(false);
    await m.strike(attackEvent('yuna'), mctx(f.stage), 'attack');
    expect(f.actors['yuna']!.moves).toEqual([]);
  });

  it('only a plain attack by a girl on the party\'s side: not an ability, not an enemy, not a part with no dressphere', async () => {
    const f = field();
    const m = new RunInMotion(dress);
    const ability = { ...attackEvent('paine'), command: { kind: 'ability', id: 'x', targets: ['bahamut'] } } as never;
    await m.strike(ability, mctx(f.stage), 'attack');
    await m.strike(attackEvent('paine'), mctx(f.stage), 'cast');
    await m.strike(attackEvent('bahamut', 'paine'), mctx(f.stage), 'attack');
    await new RunInMotion(state({})).strike(attackEvent('paine'), mctx(f.stage), 'attack');
    expect(Object.values(f.actors).flatMap((a) => a.moves)).toEqual([]);
  });

  it('plays nothing while stilled (REDUCE MOTION, an open menu), and a run that is out when the gate closes snaps home', async () => {
    const f = field();
    const m = new RunInMotion(dress);
    await m.strike(attackEvent('paine'), mctx(f.stage, { still: true }), 'attack');
    expect(f.actors['paine']!.moves).toEqual([]);
    await m.strike(attackEvent('paine'), mctx(f.stage), 'attack');
    const before = f.smear.length;
    await m.close('paine', mctx(f.stage, { still: true }));
    expect(f.smear.length).toBe(before); // no smear on the way home: she is simply home again
    expect(f.actors['paine']!.moves.at(-1)).toEqual(HOME['paine']);
  });

  it('a girl knocked out out there is simply home again: no slide, no smear', async () => {
    const f = field();
    const m = new RunInMotion(dress);
    await m.strike(attackEvent('paine'), mctx(f.stage), 'attack');
    (f.actors['paine'] as unknown as { pose: string }).pose = 'ko';
    const smears = f.smear.length;
    await m.close('paine', mctx(f.stage));
    expect(f.smear.length).toBe(smears);
    expect(f.actors['paine']!.moves.at(-1)).toEqual(HOME['paine']);
  });

  it('keeps a run per girl, so two overlapping ATB attacks each go home by their own id', async () => {
    const f = field();
    const m = new RunInMotion(dress);
    await m.strike(attackEvent('paine'), mctx(f.stage), 'attack');
    await m.strike(attackEvent('rikku'), mctx(f.stage), 'attack');
    await m.close('paine', mctx(f.stage));
    expect(f.actors['paine']!.moves.at(-1)).toEqual(HOME['paine']);
    expect(f.actors['rikku']!.position).not.toEqual(HOME['rikku']); // still out
    await m.close('rikku', mctx(f.stage));
    expect(f.actors['rikku']!.moves.at(-1)).toEqual(HOME['rikku']);
  });

  it('times: 0.32 to 0.47 s in and three quarters of that home, longer for a longer run, 0.56 to 0.82 s a whole attack', () => {
    expect(runMs(0.5).in).toBe(320);
    expect(runMs(10).in).toBe(470);
    expect(runMs(3).home).toBe(Math.round(runMs(3).in * 0.75));
    const whole = (d: number): number => runMs(d).in + runMs(d).home;
    expect(whole(0)).toBeGreaterThanOrEqual(560);
    expect(whole(99)).toBeLessThanOrEqual(825);
  });
});

// ------------------------------------------------------------------ through the presenter

function rig(o: { reduce?: boolean; ffx2?: boolean; withMotion?: boolean; sub?: boolean; low?: boolean } = {}) {
  const f = field();
  if (o.low === true) eyeCandy.setTier('low'); // LOW EFFECTS (the tier it resolves to)
  const motion = new RunInMotion(state({ paine: 'warrior', rikku: 'dark-knight', yuna: 'gunner' }));
  const moments: MomentsPort = { letterbox: async () => undefined, nameSlab: async () => undefined, vignette: () => undefined, clear: () => undefined, reduceMotion: () => o.reduce === true };
  const presenter = new BattlePresenter({ stage: f.stage, moments, sleep: async () => undefined, actionMotion: o.withMotion === false ? null : motion });
  presenter.moments.shots.ffx2Framing = o.ffx2 !== false;
  if (o.sub === false) eyeCandy.setSub('runin', false);
  const play = (events: Ev[]): Promise<unknown> => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { ...f, motion, presenter, play };
}
const attack = (actorId: string): Ev => ({ type: 'action-start', actorId, command: { kind: 'attack', targets: ['bahamut'] } as never, targets: ['bahamut'] });
const hit = (sourceId: string): Ev => ({ type: 'damage', targetId: 'bahamut', sourceId, amount: 300, element: 'none', crit: false, hitIndex: 0, hitCount: 1 }) as Ev;
const end = (actorId: string): Ev => ({ type: 'action-end', actorId });

describe('through the presenter', () => {
  it('runs in before the strike, lunges the short strike, and runs home at action-end', async () => {
    const r = rig();
    await r.play([attack('paine'), hit('paine'), end('paine')]);
    const a = r.actors['paine']!;
    expect(a.moves).toHaveLength(2); // in, then home
    expect(a.moves[1]).toEqual(HOME['paine']);
    expect(a.lunges).toEqual([STRIKE_LUNGE]);
  });

  it('is today\'s attack with no port (FFX): the 1.4 house lunge from where she stands, no run', async () => {
    const r = rig({ withMotion: false, ffx2: false });
    await r.play([attack('paine'), hit('paine'), end('paine')]);
    expect(r.actors['paine']!.moves).toEqual([]);
    expect(r.actors['paine']!.lunges).toEqual([1.4]);
  });

  it('plays today\'s attack under REDUCE MOTION, under LOW EFFECTS, with the look switched off, and without the spectacle port', async () => {
    for (const o of [{ reduce: true }, { low: true }, { sub: false }]) {
      const r = rig(o);
      await r.play([attack('paine'), hit('paine'), end('paine')]);
      expect(r.actors['paine']!.moves, JSON.stringify(o)).toEqual([]);
      expect(r.actors['paine']!.lunges).toEqual([1.4]);
      expect(r.truck, JSON.stringify(o)).toEqual([]); // no camera truck either: today's frame
      eyeCandy.setTier(null);
    }
    const bare = rig();
    delete (bare.stage as unknown as { fx?: unknown }).fx;
    await bare.play([attack('paine'), hit('paine'), end('paine')]);
    expect(bare.actors['paine']!.moves).toEqual([]);
  });

  it('sends the girl whose action ended home, even when ATB overlap left another girl as the one acting', async () => {
    const r = rig();
    await r.play([attack('paine'), attack('rikku'), hit('rikku'), end('paine'), hit('paine'), end('rikku')]);
    // Paine's action ended first while Rikku's was the latest started: Paine goes home then, Rikku at her own end.
    expect(r.actors['paine']!.moves.at(-1)).toEqual(HOME['paine']);
    expect(r.actors['rikku']!.moves.at(-1)).toEqual(HOME['rikku']);
    expect(r.actors['paine']!.moves).toHaveLength(2);
    expect(r.actors['rikku']!.moves).toHaveLength(2);
  });
});

describe('FF7 is untouched: its port is closed by the same figure as before', () => {
  it('a sequential action ends with the figure that started it, so `endedId` and `actingId` agree', async () => {
    const closed: string[] = [];
    const port: ActionMotionPort = { open: () => undefined, close: (id) => void closed.push(id) };
    const stage = new FakeStage(['cloud', 'barret'], ['guard-scorpion']);
    const presenter = new BattlePresenter({ stage, sleep: async () => undefined, actionMotion: port });
    const evs: Ev[] = [
      { type: 'action-start', actorId: 'cloud', command: { kind: 'attack', targets: ['guard-scorpion'] } as never, targets: ['guard-scorpion'] },
      { type: 'damage', targetId: 'guard-scorpion', sourceId: 'cloud', amount: 50, element: 'none', crit: false, hitIndex: 0, hitCount: 1 } as Ev,
      { type: 'action-end', actorId: 'cloud' },
      { type: 'action-start', actorId: 'guard-scorpion', command: { kind: 'ability', id: 'rifle', targets: ['barret'] } as never, targets: ['barret'] },
      { type: 'action-end', actorId: 'guard-scorpion' },
    ];
    await presenter.play(evs.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
    expect(closed).toEqual(['cloud', 'guard-scorpion']);
  });
});
