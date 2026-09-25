/**
 * Chapter VII fix pass (the end-to-end run on commit 06338dbc), the four
 * presentation items that are not HUD text:
 *
 * - **(2) Seymour's body** (D-046, "falls and stays down"): it lay tilted and a
 *   body-length off his station, and the whole beat was over in about 1.5 s.
 *   The roll is now a flat quarter turn resting on the floor over his own
 *   station (`LieFlat.ts`), and the shot holds on it before the victory.
 * - **(3) Anima's paintings** (D-045 option A): the boss Anima draws only the
 *   board-approved aeon idle (`ChapterPoseLimits.ts`).
 * - **(6) Petrify reads as stone**: the painting drains to stone over a beat
 *   and holds, and a shatter breaks into stone chips (`StoneShards.ts`).
 *   Presentation only; whether a petrified figure shatters is unchanged.
 *
 * Game case: the Seymour and Anima tables are **FFX only** (Chapter VII); the
 * lie geometry, the pose filter and the stone beats are shared plumbing,
 * **both** [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import { Scene } from 'three';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { BODY_HOLD_MS, BODY_MS, departureMs } from '../../src/engine/BattlePresenterDepartures.ts';
import { STONE_MS } from '../../src/engine/BattlePresenterArrivals.ts';
import { lieOffset } from '../../src/engine/LieFlat.ts';
import { limitPoses } from '../../src/engine/ChapterPoseLimits.ts';
import { SHARD_LIFE, disposeStoneShards, stonePoolOf, stoneShatter } from '../../src/engine/StoneShards.ts';
import type { BattleEvent, CombatantId, StatusInstance } from '../../src/battle/common/types.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

function setup(enemies: CombatantId[], sleep: (ms: number) => Promise<void> = noSleep) {
  const stage = new FakeStage(['yuna', 'rikku'], enemies);
  const presenter = new BattlePresenter({ stage, sleep });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> =>
    presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { stage, play };
}

const status = (targetId: CombatantId, id: 'petrify' | 'eject', add = true): Unsequenced<BattleEvent> =>
  ({
    type: add ? 'status-add' : 'status-remove',
    targetId,
    status: id,
    ...(add
      ? { instance: { id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as StatusInstance }
      : { reason: 'cured' }),
  }) as Unsequenced<BattleEvent>;

describe('(2) Seymour lies flat, on his station, and the shot holds on him', () => {
  // Seymour's idle's content box, roughly: 1.6 units wide, 4.1 tall, feet at 0.
  const box = { x0: -0.8, x1: 0.8, y0: 0, y1: 4.1 };

  it('a full roll is a quarter turn: the whole long edge rests on the floor', () => {
    for (const facing of [1, -1] as const) {
      const angle = (Math.PI / 2) * facing;
      const [dx, lift] = lieOffset(box, false, angle);
      const s = Math.sin(angle);
      const c = Math.cos(angle);
      // Every corner of the rolled box, placed with the offset.
      const ys = [box.x0, box.x1].flatMap((x) => [box.y0, box.y1].map((y) => x * s + y * c + lift));
      const xs = [box.x0, box.x1].flatMap((x) => [box.y0, box.y1].map((y) => x * c - y * s + dx));
      expect(Math.min(...ys)).toBeCloseTo(0, 6); // on the floor, not through it
      // Head and feet both on the floor: lying flat, not tilted up at one end.
      const lowHead = [box.x0, box.x1].map((x) => x * s + box.y1 * c + lift);
      const lowFeet = [box.x0, box.x1].map((x) => x * s + box.y0 * c + lift);
      expect(Math.min(...lowHead)).toBeCloseTo(Math.min(...lowFeet), 6);
      // Its middle over the station (x = 0), not a half body-length off it.
      expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(0, 6);
    }
  });

  it('standing is untouched, and a mirrored plane lies the same way', () => {
    expect(lieOffset(box, false, 0)).toEqual([0, 0, 0]);
    const plain = lieOffset(box, false, Math.PI / 2);
    const mirrored = lieOffset(box, true, Math.PI / 2);
    expect(mirrored[0]).toBeCloseTo(plain[0], 6);
    expect(mirrored[1]).toBeCloseTo(plain[1], 6);
  });

  it('tipped back onto the floor: lower, still resting on it, its middle still at the station', () => {
    const angle = -Math.PI / 2; // an enemy faces -x
    const tilt = 1.0;
    const [, liftUp] = lieOffset(box, false, angle, 0);
    const [dx, lift, dz] = lieOffset(box, false, angle, tilt);
    expect(lift).toBeLessThan(liftUp); // a body on the floor, not a card on its edge
    // Rotated about z, then about x by -tilt: the lowest corner rests on the floor.
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const corners = [box.x0, box.x1].flatMap((x) => [box.y0, box.y1].map((y) => ({ x: x * c - y * s + dx, y: x * s + y * c })));
    const placed = corners.map((p) => ({ x: p.x, y: p.y * Math.cos(tilt) + lift, z: -p.y * Math.sin(tilt) + dz }));
    expect(Math.min(...placed.map((p) => p.y))).toBeCloseTo(0, 6);
    const zs = placed.map((p) => p.z);
    expect((Math.min(...zs) + Math.max(...zs)) / 2).toBeCloseTo(0, 6);
  });

  it('the body beat holds BODY_HOLD_MS on him before the victory, inside its own budget', async () => {
    const slept: number[] = [];
    // Every wait resolves at once except the departure's own outer deadline,
    // which here never fires, so the hold is taken rather than cut short.
    const { stage, play } = setup(['seymour-macalania'], (ms) => {
      slept.push(ms);
      return ms > departureMs('body') ? new Promise<void>(() => {}) : Promise.resolve();
    });
    await play([
      { type: 'ko', targetId: 'seymour-macalania' },
      { type: 'victory' } as Unsequenced<BattleEvent>,
    ]);
    expect(slept).toContain(BODY_HOLD_MS);
    expect(BODY_HOLD_MS).toBeGreaterThanOrEqual(1200);
    expect(departureMs('body')).toBe(BODY_MS + BODY_HOLD_MS);
    // Still down, still staged, never removed; the party's victory still plays.
    expect(stage.staged()).toContain('seymour-macalania');
    expect(stage.calls).not.toContain('remove:seymour-macalania');
    expect(stage.calls.indexOf('lieDown:seymour-macalania')).toBeLessThan(stage.calls.indexOf('pose=victory:yuna'));
    expect(stage.calls.filter((c) => c.endsWith(':seymour-macalania') && c.startsWith('pose=')).pop()).toBe('pose=ko:seymour-macalania');
  });
});

describe('(3) Anima draws only her approved idle in Chapter VII', () => {
  const folder = (id: string): Record<string, string> =>
    Object.fromEntries(['idle', 'attack', 'hurt', 'ko', 'overdrive'].map((p) => [p, `art/characters/${id}/${p}.png`]));

  it('the boss Anima keeps the idle and nothing else, so no other painting is ever fetched', () => {
    expect(limitPoses('anima-macalania', folder('anima'))).toEqual({ idle: 'art/characters/anima/idle.png' });
  });

  it('every other combatant, the party-summoned aeon Anima included, keeps its folder', () => {
    for (const id of ['anima', 'seymour-macalania', 'guado-guardian-a', 'yuna', 'evrae']) {
      expect(limitPoses(id, folder(id))).toEqual(folder(id));
    }
  });

  it('a limit that would leave nothing keeps the map, so she is never staged invisible', () => {
    const noIdle = { attack: 'a.png' };
    expect(limitPoses('anima-macalania', noIdle)).toEqual(noIdle);
  });
});

describe('(6) petrify reads as stone; a shatter breaks into stone', () => {
  it('petrify drains the painting to stone in steps, then holds before anything else', async () => {
    const slept: number[] = [];
    const { stage, play } = setup(['guado-guardian-a', 'seymour-macalania'], (ms) => {
      slept.push(ms);
      return Promise.resolve();
    });
    await play([status('guado-guardian-a', 'petrify')]);
    const stone = stage.calls.filter((c) => c.startsWith('stone=') && c.endsWith(':guado-guardian-a'));
    expect(stone[stone.length - 1]).toBe('stone=1:guado-guardian-a');
    expect(stone.length).toBeGreaterThan(1); // it creeps in, it does not snap
    expect(slept).toContain(STONE_MS.hold);
  });

  it('a petrified enemy that shatters plays the stone burst and crumbles in stone grey', async () => {
    const { stage, play } = setup(['guado-guardian-a', 'seymour-macalania']);
    await play([status('guado-guardian-a', 'petrify'), status('guado-guardian-a', 'eject')]);
    expect(stage.calls).toContain('vfx:stone-shatter@guado-guardian-a');
    expect(stage.calls).toContain('dissolve=1:guado-guardian-a');
    expect(stage.calls).toContain('remove:guado-guardian-a');
  });

  it('an ejection with no petrify before it is not stone (no burst)', async () => {
    const { stage, play } = setup(['guado-guardian-a']);
    await play([status('guado-guardian-a', 'eject')]);
    expect(stage.calls.some((c) => c.startsWith('vfx:stone-shatter'))).toBe(false);
    expect(stage.calls).toContain('remove:guado-guardian-a');
  });

  it('a Soft (status-remove petrify) brings the colour back', async () => {
    const { stage, play } = setup(['guado-guardian-a']);
    await play([status('yuna', 'petrify'), status('yuna', 'petrify', false)]);
    expect(stage.calls.filter((c) => c.endsWith(':yuna') && c.startsWith('stone=')).pop()).toBe('stone=0:yuna');
  });

  it('the stone burst is one pool per scene, lives SHARD_LIFE and then hides itself', () => {
    const scene = new Scene();
    stoneShatter(scene, { x: 2, y: 0, z: -1 }, 4.1);
    const pool = stonePoolOf(scene)!;
    expect(pool.visible).toBe(true);
    stoneShatter(scene, { x: -2, y: 0, z: -1 }, 4.1);
    expect(scene.children.filter((c) => c.name === 'stone-shards')).toHaveLength(1);
    for (let t = 0; t < SHARD_LIFE + 0.2; t += 0.05) pool.advance(0.05);
    expect(pool.visible).toBe(false);
    disposeStoneShards(scene);
    expect(stonePoolOf(scene)).toBeUndefined();
    expect(scene.children.some((c) => c.name === 'stone-shards')).toBe(false);
  });
});
