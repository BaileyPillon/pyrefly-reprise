import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { ATTACK_BEATS, ATTACK_IMPACT, attackOffset, reachOffset } from '../../src/engine/BattlePresenterActors.ts';
import type { ActionMotionPort } from '../../src/engine/BattlePresenterMotion.ts';
import type { MomentsPort } from '../../src/engine/BattlePresenterPorts.ts';
import { PaintedActor } from '../../src/engine/PaintedActor.ts';
import { REACH_CAP } from '../../src/engine/motion/StandReach.ts';
import type { StageMotionPort } from '../../src/engine/motion/StageMotionPort.ts';
import { CALM_REACH_SHARE, HOUSE_LUNGE, calmLunge, lungeDistance, lungePlan } from '../../src/engine/motion/StrikeReach.ts';
import { TweenGroup } from '../../src/engine/Tween.ts';
import { FakeActor, FakeStage, noSleep } from './helpers/FakeStage.ts';

/**
 * r392-motion: REDUCE MOTION shortens the attack lunge (Bailey, 2026-10-06). Release 39.1's reach (r391-reach) solves the house lunge against the painted target and can add up
 * to 3 world units to it; the setting was not read there. With it on, a strike travels half of what the solver added (`calmLunge`), on the same eased step, in the same 440 ms.
 * Game case: both (shared plumbing). FFX: party and fiends reach, so both shorten. FFX-2: fiends reach and shorten; a girl has no run-in under REDUCE MOTION, her lunge is the house
 * 1.4 with or without the setting (nothing solved, nothing to shorten).
 */

const figs: object[] = [];
afterEach(() => {
  figs.length = 0;
});

/** A fake actor that records what the presenter asked of its lunge. */
class LungeActor extends FakeActor {
  readonly asked: number[] = [];
  readonly houses: Array<number | undefined> = [];
  readonly ms: Array<number | undefined> = [];
  override async lunge(distance?: number, ms?: number, _contact?: unknown, house?: number): Promise<void> {
    this.asked.push(distance ?? Number.NaN);
    this.houses.push(house);
    this.ms.push(ms);
  }
}

/** The stage of `stand-reach.test.ts`'s `chapter()`: Tidus at -1.12, the boss far to the right at 9 (113 px of air at the 1.4 strike), Yuna and a pagoda; a pinhole model behind `stage.motion`. */
function chapter(): { stage: FakeStage; at: (id: string) => LungeActor } {
  const party = ['tidus', 'yuna'];
  const enemies = ['seymour-flux', 'yu-pagoda'];
  const stage = new FakeStage(party, enemies);
  for (const id of [...party, ...enemies]) stage.actors.set(id, new LungeActor(id, stage.calls));
  for (const id of enemies) stage.actors.get(id)!.setFacing(-1);
  for (const [id, z] of Object.entries({ tidus: 1.6, yuna: 0.4, 'seymour-flux': -7.6, 'yu-pagoda': -7.6 })) stage.actors.get(id)!.position.z = z;
  for (const f of stage.actors.values()) figs.push(f);
  stage.actors.get('tidus')!.position.x = -1.12;
  stage.actors.get('yuna')!.position.x = 0.6;
  stage.actors.get('seymour-flux')!.position.x = 9;
  stage.actors.get('yu-pagoda')!.position.x = 5;
  const box = (id: string, at?: { x: number }): { x: number; y: number; w: number; h: number } | null => {
    const a = stage.actors.get(id);
    if (!a) return null;
    const near = stage.sides.get(id) !== 'enemy';
    return { x: 800 + (near ? 220 : 54) * (at ? at.x : a.position.x), y: 300, w: near ? 311 : 413, h: 400 };
  };
  const motion: Partial<StageMotionPort> = {
    rect: (id, opts) => box(id, opts?.at),
    shape: (id, opts) => {
      const rect = box(id, opts?.at);
      return rect ? { rect } : null;
    },
    view: () => ({ w: 1600, h: 900 }),
  };
  (stage as unknown as { motion: Partial<StageMotionPort> }).motion = motion;
  return { stage, at: (id) => stage.actors.get(id) as LungeActor };
}

const moments = (reduce: boolean): MomentsPort => ({ letterbox: async () => undefined, nameSlab: async () => undefined, vignette: () => undefined, clear: () => undefined, reduceMotion: () => reduce });

/** One physical attack played through the presenter, REDUCE MOTION `reduce`, with the game's port (`motion`; FFX has none). */
async function attack(stage: FakeStage, reduce: boolean, actorId: string, target: string, motion?: ActionMotionPort): Promise<void> {
  const events = [
    { type: 'action-start', actorId, command: { kind: 'attack', targets: [target] }, targets: [target] },
    { type: 'damage', targetId: target, amount: 900, element: 'none', crit: false, hitIndex: 0, hitCount: 1 },
    { type: 'action-end', actorId },
  ].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
  await new BattlePresenter({ stage, moments: moments(reduce), sleep: noSleep, ...(motion ? { actionMotion: motion } : {}) }).play(events);
}

const port = (over: Partial<ActionMotionPort> = {}): ActionMotionPort => ({ open() {}, close() {}, ...over });

describe('calmLunge: the start plus half of what the solver added', () => {
  it('is half way between the house lunge and the solved lunge, and the share is a half', () => {
    expect(CALM_REACH_SHARE).toBe(0.5);
    expect(calmLunge(1.4, 3)).toBeCloseTo(2.2, 12);
    expect(calmLunge(1.4, 4.4)).toBeCloseTo(2.9, 12); // the cap (+3) shortens to +1.5
    expect(calmLunge(0.6, 2.2)).toBeCloseTo(1.4, 12); // a counter (0.6), or a girl after a run-in
  });

  it('is the house lunge where the strike already reaches, never under its start, never over what was solved', () => {
    expect(calmLunge(1.4, 1.4)).toBe(1.4);
    expect(calmLunge(1.4, 1.2)).toBe(1.4); // a solver that answered under its start (it never does) cannot shorten the start
    expect(calmLunge(1.4, 1.4000001)).toBeLessThanOrEqual(1.4000001);
    for (let solved = 1.4; solved <= 1.4 + REACH_CAP + 1e-9; solved += 0.05) {
      const c = calmLunge(1.4, solved);
      expect(c).toBeGreaterThanOrEqual(1.4 - 1e-12);
      expect(c).toBeLessThanOrEqual(solved + 1e-12);
    }
  });

  it('is never more than the house lunge plus half the cap: 2.9 world units, against 4.4 with the setting off', () => {
    expect(calmLunge(1.4, 1.4 + REACH_CAP)).toBeCloseTo(1.4 + REACH_CAP / 2, 12);
    expect(1.4 + REACH_CAP / 2).toBeCloseTo(2.9, 12);
  });
});

describe('FFX (no port): REDUCE MOTION off reaches as it does, on carries half of the extra', () => {
  it('off: the lunge that reaches, its house part 1.4; on: shorter but longer than the house lunge, the same house part', async () => {
    const off = chapter();
    await attack(off.stage, false, 'tidus', 'seymour-flux');
    const on = chapter();
    await attack(on.stage, true, 'tidus', 'seymour-flux');
    const reach = off.at('tidus').asked[0]!;
    const calm = on.at('tidus').asked[0]!;
    expect(reach).toBeGreaterThan(HOUSE_LUNGE);
    expect(off.at('tidus').houses[0]).toBe(HOUSE_LUNGE);
    expect(calm).toBeLessThan(reach);
    expect(calm).toBeGreaterThan(HOUSE_LUNGE);
    expect(calm).toBeCloseTo(HOUSE_LUNGE + (reach - HOUSE_LUNGE) * CALM_REACH_SHARE, 9);
    expect(on.at('tidus').houses[0]).toBe(HOUSE_LUNGE); // the house part is as it was: the extra alone is halved, on the same eased step
  });

  it('keeps the same 440 ms (the timing, the apex and the contact hold are the move\'s own)', async () => {
    const off = chapter();
    const on = chapter();
    await attack(off.stage, false, 'tidus', 'seymour-flux');
    await attack(on.stage, true, 'tidus', 'seymour-flux');
    expect(off.at('tidus').ms).toEqual([440]);
    expect(on.at('tidus').ms).toEqual([440]);
  });

  it('shortens a fiend\'s strike too (party and fiends both reach in FFX)', async () => {
    const off = chapter();
    const on = chapter();
    await attack(off.stage, false, 'seymour-flux', 'tidus');
    await attack(on.stage, true, 'seymour-flux', 'tidus');
    expect(off.at('seymour-flux').asked[0]!).toBeGreaterThan(HOUSE_LUNGE);
    expect(on.at('seymour-flux').asked[0]!).toBeGreaterThan(HOUSE_LUNGE);
    expect(on.at('seymour-flux').asked[0]!).toBeLessThan(off.at('seymour-flux').asked[0]!);
  });

  it('a counter (its own 0.6 start) is shortened the same way', async () => {
    const counter = async (stage: FakeStage, reduce: boolean): Promise<void> => {
      const events = [{ type: 'counter', actorId: 'seymour-flux', targetId: 'tidus', abilityId: 'counterattack', cause: 'counterattack' }].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
      await new BattlePresenter({ stage, moments: moments(reduce), sleep: noSleep }).play(events);
    };
    const off = chapter();
    const on = chapter();
    await counter(off.stage, false);
    await counter(on.stage, true);
    const reach = off.at('seymour-flux').asked[0]!;
    const calm = on.at('seymour-flux').asked[0]!;
    expect(reach).toBeGreaterThan(0.6);
    expect(calm).toBeCloseTo(0.6 + (reach - 0.6) * CALM_REACH_SHARE, 9);
    expect(on.at('seymour-flux').houses[0]).toBe(0.6);
  });

  it('leaves a strike that already reaches exactly the house lunge, on or off', async () => {
    for (const reduce of [false, true]) {
      const f = chapter();
      f.at('seymour-flux').position.x = 2.39; // the boss starts at 929 and the 1.4 strike ends at 1172.6: overlapped by 243 px
      await attack(f.stage, reduce, 'tidus', 'seymour-flux');
      expect(f.at('tidus').asked).toEqual([1.4]);
    }
  });

  it('reads REDUCE MOTION where the beats read it (the presenter\'s moments port); a stage with no port plays as asked, as before', async () => {
    const f = chapter();
    await new BattlePresenter({ stage: f.stage, sleep: noSleep }).play(
      [{ type: 'action-start', actorId: 'tidus', command: { kind: 'attack', targets: ['seymour-flux'] }, targets: ['seymour-flux'] }, { type: 'action-end', actorId: 'tidus' }].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent),
    );
    const off = chapter();
    await attack(off.stage, false, 'tidus', 'seymour-flux');
    expect(f.at('tidus').asked).toEqual(off.at('tidus').asked);
  });
});

describe('FFX-2 (the run-in port): fiends shorten, girls have nothing solved to shorten', () => {
  it('a fiend (`reachFor`) is shortened', async () => {
    const motion = port({ reachFor: (id) => id === 'seymour-flux' });
    const off = chapter();
    const on = chapter();
    await attack(off.stage, false, 'seymour-flux', 'tidus', motion);
    await attack(on.stage, true, 'seymour-flux', 'tidus', motion);
    const reach = off.at('seymour-flux').asked[0]!;
    expect(reach).toBeGreaterThan(HOUSE_LUNGE);
    expect(on.at('seymour-flux').asked[0]!).toBeCloseTo(HOUSE_LUNGE + (reach - HOUSE_LUNGE) * CALM_REACH_SHARE, 9);
  });

  it('a girl who does not run (a long-range dressphere, a menu open, and every girl under REDUCE MOTION) is the house 1.4 with the setting off or on', async () => {
    const motion = port({ reachFor: () => false });
    for (const reduce of [false, true]) {
      const f = chapter();
      await attack(f.stage, reduce, 'tidus', 'seymour-flux', motion);
      expect(f.at('tidus').asked).toEqual([1.4]);
    }
  });

  it('a girl out on a run-in (the port\'s own 0.6 start, reaching): shortened from 0.6 if the setting is on', () => {
    const f = chapter();
    const ctx = { stage: f.stage };
    const ev = { actorId: 'tidus', targets: ['seymour-flux'] };
    const run = port({ lungeFor: () => 0.6, reachFor: () => true });
    const reach = lungeDistance(ctx, ev, run);
    expect(reach).toBeGreaterThan(0.6);
    expect(lungeDistance({ ...ctx, moments: { reducedMotion: true } }, ev, run)).toBeCloseTo(0.6 + (reach - 0.6) * CALM_REACH_SHARE, 9);
  });

  it('FF7 (a port that does not answer): 1.4 with the setting off or on', () => {
    const f = chapter();
    const ev = { actorId: 'tidus', targets: ['seymour-flux'] };
    for (const reducedMotion of [false, true]) expect(lungeDistance({ stage: f.stage, moments: { reducedMotion } }, ev, port({ ownsWindUp: () => false }))).toBe(1.4);
  });
});

describe('lungePlan: the plan the beat plays', () => {
  it('is distance and house, the house part the start in both cases', () => {
    const f = chapter();
    const ev = { actorId: 'tidus', targets: ['seymour-flux'] };
    const off = lungePlan({ stage: f.stage, moments: { reducedMotion: false } }, ev, undefined, 'attack');
    const on = lungePlan({ stage: f.stage, moments: { reducedMotion: true } }, ev, undefined, 'attack');
    expect(off.house).toBe(1.4);
    expect(on.house).toBe(1.4);
    expect(on.distance).toBeLessThan(off.distance);
    expect(on.distance - 1.4).toBeCloseTo((off.distance - 1.4) / 2, 9);
    expect(lungePlan({ stage: f.stage }, ev, undefined, 'attack').distance).toBe(off.distance); // no moments at all: the setting is off
  });
});

describe('PaintedActor.lunge with the shortened extra: no kick, no overshoot, the same move', () => {
  function lungeActor(): { actor: PaintedActor; tweens: TweenGroup; offset: () => number } {
    const actor = Object.create(PaintedActor.prototype) as Record<string, unknown>;
    const tweens = new TweenGroup();
    actor['tweens'] = tweens;
    actor['lungeOffset'] = 0;
    return { actor: actor as unknown as PaintedActor, tweens, offset: () => actor['lungeOffset'] as number };
  }

  it('never travels past the distance asked, reaches it at the apex (0.58 of the move) and ends at 0, as the move always has', () => {
    const distance = calmLunge(1.4, 4.4);
    const { actor, tweens, offset } = lungeActor();
    void actor.lunge(distance, 440, undefined, 1.4);
    let peak = 0;
    let elapsed = 0;
    const seen: number[] = [];
    for (let ms = 5; ms <= 440; ms += 5) {
      tweens.update((ms - elapsed) / 1000);
      elapsed = ms;
      peak = Math.max(peak, offset());
      seen.push(offset());
      expect(offset()).toBeLessThanOrEqual(distance + 1e-9); // no overshoot
      expect(offset()).toBeGreaterThanOrEqual(-1e-9);
    }
    expect(peak).toBeCloseTo(distance, 1);
    expect(offset()).toBeCloseTo(0, 6);
    // the apex is where the full move puts it: ATTACK_IMPACT of 440 ms
    const apex = lungeActor();
    void apex.actor.lunge(distance, 440, undefined, 1.4);
    apex.tweens.update((ATTACK_IMPACT * 440) / 1000);
    expect(apex.offset()).toBeCloseTo(distance, 3);
  });

  it('carries the extra on the eased step: its first frame travels the house lunge\'s first frame and almost none of the (halved) extra', () => {
    const frame = 1000 / 60 / 440;
    expect(reachOffset(frame)).toBeLessThan(attackOffset(frame) / 5);
    expect(ATTACK_BEATS.step).toBeGreaterThan(0);
    const { actor, tweens, offset } = lungeActor();
    const distance = calmLunge(1.4, 4.4);
    void actor.lunge(distance, 440, undefined, 1.4);
    tweens.update(1 / 60);
    expect(offset()).toBeCloseTo(1.4 * attackOffset(frame) + (distance - 1.4) * reachOffset(frame), 3);
  });
});
