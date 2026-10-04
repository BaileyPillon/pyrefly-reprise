/**
 * r38-motion repair (AGENTS.md rule 15, one cycle): RUN-IN must leave the party where the MAX mix's staging put it.
 *
 * The independent check of `r38-motion` found one major: in Chapter IV every plain Attack by Paine or Rikku moved that girl's
 * resting place by the mix's spacing share (Rikku -0.071 world an attack, on top of Yuna after about ten; Paine +0.022), while
 * origin/main keeps them constant. Cause: `Staging.write` reads any foreign write to a figure's x as the stage re-seating it,
 * drops its record of the share and puts the share on top again; the run's own `moveTo` is such a write, and its home was
 * captured with the share already in it, so each run added the share once more.
 *
 * Here the real `RunInMotion` runs the real `Staging` over a real `TweenGroup` actor (`moveTo` is `PaintedActor.moveTo`'s own
 * code) in the order the game runs a frame (the stage's actors first, then the mix). The fake stage is the one the other
 * RUN-IN tests use (a pinhole camera and plain numbers). The control is origin/main: no run, so each girl's resting x is
 * simply her seat plus her share, forever.
 */
import { describe, expect, it } from 'vitest';
import { Object3D, Vector3 } from 'three';
import type { BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import type { MotionCtx } from '../../src/engine/BattlePresenterMotion.ts';
import type { Point3 } from '../../src/engine/BattlePresenterPorts.ts';
import { RunInMotion } from '../../src/app/screens/BattleScreenRunIn.ts';
import type { Actor } from '../../src/engine/fx/mix/geometry.ts';
import { Staging } from '../../src/engine/fx/mix/staging.ts';
import type { StageMotionPort } from '../../src/engine/motion/StageMotionPort.ts';
import { TweenGroup, type EasingName } from '../../src/engine/Tween.ts';
import { FakeStage, type FakeActor } from './helpers/FakeStage.ts';

/** A figure with `PaintedActor`'s root-motion code: `moveTo` tweens the group's own position, absolute, from where it stands. */
class Figure extends Object3D {
  readonly tweens = new TweenGroup();
  facing: number;
  pose = 'idle';
  worldHeight = 1.8;
  constructor(name: string, x: number, z: number, facing = 1) {
    super();
    this.name = name;
    this.facing = facing;
    this.position.set(x, 0, z);
  }
  setPose(name: string): void {
    this.pose = name;
  }
  moveTo(pos: Point3, ms = 400, easing: EasingName = 'quadInOut'): Promise<void> {
    const from = this.position.clone();
    const to = new Vector3(pos.x, pos.y, pos.z);
    return this.tweens.toAsync(0, 1, { durationMs: ms, easing, onUpdate: (t) => void this.position.lerpVectors(from, to, t) });
  }
  hop(_height?: number, ms = 1): Promise<void> {
    return this.tweens.toAsync(0, 1, { durationMs: ms, onUpdate: () => undefined });
  }
  update(dt: number): void {
    this.tweens.update(dt);
  }
}

/** Chapter IV as measured live (`__pyrefly.fx.snapshot().mix.framing.staging`): each figure's resting x with its share, and the share. */
const CH4 = {
  paine: { rest: -0.746, dx: 0.022, z: -1.5 },
  rikku: { rest: -1.485, dx: -0.071, z: 0.1 },
  yuna: { rest: -2.218, dx: -0.17, z: 1.45 },
} as const;
type Girl = keyof typeof CH4;
const GIRLS: Girl[] = ['paine', 'rikku', 'yuna'];
const BOSS = { seat: 1.6, k: 1.39, dx: 0.56, z: -5.8 };

const DRESS: Record<string, string> = { paine: 'warrior', rikku: 'dark-knight', yuna: 'gunner' };
const state = (): BattleState =>
  ({ combatants: Object.fromEntries(Object.entries(DRESS).map(([id, current]) => [id, { id, dresspheres: { current } }])) }) as unknown as BattleState;
const attackEvent = (actorId: string): Extract<BattleEvent, { type: 'action-start' }> =>
  ({ type: 'action-start', seq: 1, actorId, command: { kind: 'attack', targets: ['bahamut'] }, targets: ['bahamut'] }) as unknown as Extract<BattleEvent, { type: 'action-start' }>;

/** The three girls and Bahamut on a stage whose `motion` port answers from plain numbers (a pinhole camera, the boss far behind). */
function field(): { stage: FakeStage; fig: Record<string, Figure>; all: Actor[] } {
  const stage = new FakeStage(GIRLS, ['bahamut']);
  const fig: Record<string, Figure> = {};
  for (const id of GIRLS) fig[id] = new Figure(id, CH4[id].rest - CH4[id].dx, CH4[id].z);
  fig['bahamut'] = new Figure('bahamut', BOSS.seat, BOSS.z, -1);
  for (const [id, f] of Object.entries(fig)) stage.actors.set(id, f as unknown as FakeActor);
  const at = (id: string, o?: { at?: Point3; truck?: Point3 }): { x: number; y: number; w: number; h: number } => {
    const p = o?.at ?? fig[id]!.position;
    const t = o?.truck ?? { x: 0, y: 0, z: 0 };
    const k = 1100 / (8.2 + t.z - p.z);
    return { x: 800 + (p.x - 0.5 - t.x) * k - 0.45 * k, y: 450 + (2.3 + t.y) * k - 1.8 * k, w: 0.9 * k, h: 1.8 * k };
  };
  const motion: StageMotionPort = {
    span: (id) => {
      const p = fig[id]?.position;
      if (!p) return null;
      return id === 'bahamut' ? { x0: p.x - 2.5, x1: p.x + 2.3, y0: 0, y1: 6, z: p.z } : { x0: p.x - 0.45, x1: p.x + 0.45, y0: 0, y1: 1.8, z: p.z };
    },
    rect: at,
    view: () => ({ w: 1600, h: 900 }),
    truck: async () => undefined,
    smear: () => undefined,
  };
  (stage as unknown as { motion: StageMotionPort }).motion = motion;
  return { stage, fig, all: Object.values(fig) as unknown as Actor[] };
}

/** The game's frame: the stage's actors tick, then the MAX mix writes its staging (`PaintedStage.update`, then `Framing.update`). */
const DT = 1 / 60;
const flush = async (): Promise<void> => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

interface Rig {
  frame(): void;
  frames(seconds: number): Promise<void>;
  until<T>(p: Promise<T>): Promise<T>;
}

function rig(f: ReturnType<typeof field>, apply: () => void): Rig {
  const frame = (): void => {
    for (const a of f.all) (a as unknown as Figure).update(DT);
    apply();
  };
  const frames = async (seconds: number): Promise<void> => {
    for (let i = 0; i < Math.round(seconds / DT); i++) {
      frame();
      await flush();
    }
  };
  const until = async <T>(p: Promise<T>): Promise<T> => {
    let done = false;
    let out!: T;
    void p.then((v) => {
      done = true;
      out = v;
    });
    for (let i = 0; i < 1200 && !done; i++) {
      frame();
      await flush();
    }
    if (!done) throw new Error('a motion step never finished');
    return out;
  };
  return { frame, frames, until };
}

/** One plain Attack the way the presenter plays it: the run in, the blow's lunge on the spot, the run home at action-end, a settle. */
async function attack(r: Rig, m: RunInMotion, stage: FakeStage, girl: string): Promise<void> {
  const ctx: MotionCtx = { stage, speed: 'normal', sleep: async () => undefined };
  await r.until(m.strike(attackEvent(girl), ctx, 'attack'));
  await r.frames(0.45);
  await r.until(m.close(girl, ctx));
  await r.frames(0.4);
}

/** The ten-line version of Chapter IV's plan: every girl's and the boss's share, written by the mix. */
function chapterFourPlan(st: { plan: Map<Actor, { k: number; dx: number }> }, f: ReturnType<typeof field>): void {
  for (const id of GIRLS) st.plan.set(f.fig[id] as unknown as Actor, { k: 1, dx: CH4[id].dx });
  st.plan.set(f.fig['bahamut'] as unknown as Actor, { k: BOSS.k, dx: BOSS.dx });
}

const restOf = (f: ReturnType<typeof field>): Record<string, [number, number, number]> =>
  Object.fromEntries(Object.entries(f.fig).map(([id, a]) => [id, [a.position.x, a.position.y, a.position.z]]));

describe('Chapter IV: the run leaves the party where the mix put it (origin/main: constant)', () => {
  it('stages the chapter (control): resting places are seat plus share and never move without a run', async () => {
    const f = field();
    const st = new Staging();
    chapterFourPlan(st, f);
    const r = rig(f, () => st.apply(f.all, true));
    await r.frames(1);
    for (const id of GIRLS) expect(f.fig[id]!.position.x).toBeCloseTo(CH4[id].rest, 6);
    const before = restOf(f);
    await r.frames(5);
    expect(restOf(f)).toEqual(before);
  });

  for (const girl of ['paine', 'rikku'] as const) {
    it(`30 plain Attacks by ${girl}: every figure's resting place stays within 0.001 of origin/main's, attack by attack`, async () => {
      const f = field();
      const st = new Staging();
      chapterFourPlan(st, f);
      const r = rig(f, () => st.apply(f.all, true));
      await r.frames(1);
      const control = restOf(f); // origin/main: no run, so this is where everyone rests all fight
      const m = new RunInMotion(state);
      const drift: number[] = [];
      for (let n = 1; n <= 30; n++) {
        await attack(r, m, f.stage, girl);
        const now = restOf(f);
        for (const id of Object.keys(control)) for (let k = 0; k < 3; k++) expect(Math.abs(now[id]![k]! - control[id]![k]!), `attack ${n}, ${id} axis ${k}`).toBeLessThan(0.001);
        drift.push(f.fig[girl]!.position.x - control[girl]![0]);
      }
      // Her whole drift over the 30 (0 within float noise; the old code walked her 0.66 (Paine) or -2.1 (Rikku) away).
      expect(Math.abs(drift[29]!)).toBeLessThan(1e-6);
    });
  }

  it('alternating Paine, Rikku and Yuna (a Gunner: she fires from where she stands) for 30 rounds: nobody walks', async () => {
    const f = field();
    const st = new Staging();
    chapterFourPlan(st, f);
    const r = rig(f, () => st.apply(f.all, true));
    await r.frames(1);
    const control = restOf(f);
    const m = new RunInMotion(state);
    for (let n = 1; n <= 30; n++) {
      for (const girl of GIRLS) await attack(r, m, f.stage, girl);
      const now = restOf(f);
      for (const id of Object.keys(control)) for (let k = 0; k < 3; k++) expect(Math.abs(now[id]![k]! - control[id]![k]!), `round ${n}, ${id} axis ${k}`).toBeLessThan(0.001);
    }
  });

  it('the run itself is seen where it was planned: she is out at the spot the stand-off chose, not a share beyond it', async () => {
    const f = field();
    const st = new Staging();
    chapterFourPlan(st, f);
    const r = rig(f, () => st.apply(f.all, true));
    await r.frames(1);
    const m = new RunInMotion(state);
    const ctx: MotionCtx = { stage: f.stage, speed: 'normal', sleep: async () => undefined };
    await r.until(m.strike(attackEvent('rikku'), ctx, 'attack'));
    await r.frames(0.1);
    expect(m.notes).toHaveLength(1);
    expect(f.fig['rikku']!.position.x).toBeCloseTo(m.notes[0]!.spot.x, 6);
    expect(f.fig['rikku']!.position.z).toBeCloseTo(m.notes[0]!.spot.z, 6);
    await r.until(m.close('rikku', ctx));
    await r.frames(0.4);
    expect(f.fig['rikku']!.position.x).toBeCloseTo(CH4.rikku.rest, 6);
  });

  it('a re-plan that lands while she is out puts the new share on her once, when she is home', async () => {
    const f = field();
    const st = new Staging();
    chapterFourPlan(st, f);
    const r = rig(f, () => st.apply(f.all, true));
    await r.frames(1);
    const m = new RunInMotion(state);
    const ctx: MotionCtx = { stage: f.stage, speed: 'normal', sleep: async () => undefined };
    await r.until(m.strike(attackEvent('rikku'), ctx, 'attack'));
    // The framing commits a new plan (a menu closed on a decision made earlier): release, new plan, apply.
    st.release();
    st.plan.set(f.fig['rikku'] as unknown as Actor, { k: 1, dx: -0.2 });
    st.apply(f.all, true);
    await r.frames(0.3);
    await r.until(m.close('rikku', ctx));
    await r.frames(0.4);
    const seat = CH4.rikku.rest - CH4.rikku.dx;
    expect(f.fig['rikku']!.position.x).toBeCloseTo(seat - 0.2, 6);
    await r.frames(2);
    expect(f.fig['rikku']!.position.x).toBeCloseTo(seat - 0.2, 6);
  });
});
