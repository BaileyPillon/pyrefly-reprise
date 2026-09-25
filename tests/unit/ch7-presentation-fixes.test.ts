/**
 * Chapter VII fix pass (the end-to-end run on commit 06338dbc), the four
 * presentation items that are not HUD text:
 *
 * - **(2) Seymour's body** (D-046, "falls and stays down"): it lay tilted and a
 *   body-length off his station, and the whole beat was over in about 1.5 s.
 *   The roll is now a flat quarter turn resting on the floor over his own
 *   station (`LieFlat.ts`), and the shot holds on it before the victory.
 * - **(3) Anima's paintings**: D-045 option A drew her board-approved aeon idle
 *   only, filtered chapter-side by the now-deleted `ChapterPoseLimits.ts`. D-108
 *   approved her whole folder and D-150 ("Keep the stone look, use Anima's
 *   approved paintings", Bailey 2026-09-25) lifted the filter for Chapter VII:
 *   the boss Anima now draws her full approved set, same as the party's own
 *   summoned Anima always did.
 * - **(6) Petrify reads as stone**: the painting drains to stone over a beat
 *   and holds, and a shatter breaks into stone chips (`StoneShards.ts`). Kept
 *   as built (D-149, "Keep the stone look", Bailey 2026-09-25). Presentation
 *   only; whether a petrified figure shatters is unchanged.
 *
 * Game case: the Seymour table and Anima's paintings are **FFX only** (Chapter
 * VII); the lie geometry and the stone beats are shared plumbing, **both**
 * [AGENTS.md rule 14].
 */

import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Scene, Vector3 } from 'three';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { BODY_HOLD_MS, BODY_MS, BODY_RIG, BODY_SHOT, departureMs, departurePoses } from '../../src/engine/BattlePresenterDepartures.ts';
import { STONE_MS } from '../../src/engine/BattlePresenterArrivals.ts';
import { LIE_CLEARANCE, LIE_FLAT_TILT, lieOffset } from '../../src/engine/LieFlat.ts';
import { MACALANIA_TEMPLE_RIGS } from '../../src/scenes/macalania-temple.ts';
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

  it('tipped back flat onto the floor: every corner at the same height, just over it, its middle at the station', () => {
    // Repair pass: the fix pass's tilt of 1.0 left a plane 32.7 degrees up from
    // the floor with its far edge 1.46 units in the air ("Not flat").
    expect(LIE_FLAT_TILT).toBeCloseTo(Math.PI / 2, 9);
    const angle = -Math.PI / 2; // an enemy faces -x
    const tilt = LIE_FLAT_TILT;
    const [, liftUp] = lieOffset(box, false, angle, 0);
    const [dx, lift, dz] = lieOffset(box, false, angle, tilt);
    expect(lift).toBeLessThan(liftUp); // a body on the floor, not a card on its edge
    // Rotated about z, then about x by -tilt: the lowest corner rests on the floor.
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const corners = [box.x0, box.x1].flatMap((x) => [box.y0, box.y1].map((y) => ({ x: x * c - y * s + dx, y: x * s + y * c })));
    const placed = corners.map((p) => ({ x: p.x, y: p.y * Math.cos(tilt) + lift, z: -p.y * Math.sin(tilt) + dz }));
    // Flat: all four corners at one height, a hair over the floor (no depth fight).
    for (const p of placed) expect(p.y).toBeCloseTo(LIE_CLEARANCE, 6);
    expect(LIE_CLEARANCE).toBeGreaterThan(0);
    expect(LIE_CLEARANCE).toBeLessThanOrEqual(0.05);
    const zs = placed.map((p) => p.z);
    expect((Math.min(...zs) + Math.max(...zs)) / 2).toBeCloseTo(0, 6);
    // The plane's normal points straight up: a quarter turn about the long axis.
    const [a, b, c2] = placed;
    const u = new Vector3(b!.x - a!.x, b!.y - a!.y, b!.z - a!.z);
    const v = new Vector3(c2!.x - a!.x, c2!.y - a!.y, c2!.z - a!.z);
    const n = u.cross(v).normalize();
    expect(Math.abs(n.y)).toBeCloseTo(1, 6);
  });

  // Repair pass: held on the killing blow's framing, his head sat behind the
  // Tidus row of the party panel at 1280x960 for the whole hold, and a flat
  // body seen from that near-level camera is a sliver.
  it('the hold cuts to a shot registered around where the body actually lies', async () => {
    const { stage, play } = setup(['seymour-macalania']);
    const added: Array<{ name: string; rig: { position: number[]; lookAt: number[]; fov?: number } }> = [];
    const cam = stage.camera as unknown as { addRig: (name: string, rig: never) => void; rigNames: string[] };
    cam.addRig = (name, rig) => {
      added.push({ name, rig });
      if (!cam.rigNames.includes(name)) cam.rigNames.push(name);
    };
    const actor = stage.actor('seymour-macalania')!;
    Object.assign(actor.position, { x: 2.84, y: 0, z: -5.4 }); // where the field's relaxation left him at 1280x960
    await play([{ type: 'ko', targetId: 'seymour-macalania' }]);
    expect(added).toHaveLength(1);
    expect(added[0]!.name).toBe(BODY_RIG);
    expect(added[0]!.rig.position).toEqual([2.84 + BODY_SHOT.from[0], BODY_SHOT.from[1], -5.4 + BODY_SHOT.from[2]]);
    expect(added[0]!.rig.lookAt).toEqual([2.84 + BODY_SHOT.at[0], BODY_SHOT.at[1], -5.4 + BODY_SHOT.at[2]]);
    const moved = stage.calls.filter((c) => c === `camera:${BODY_RIG}` || c === `camera!:${BODY_RIG}`);
    expect(moved.length).toBe(1);
    expect(stage.calls.indexOf(moved[0]!)).toBeLessThan(stage.calls.indexOf('lieDown:seymour-macalania'));
  });

  it("a camera that cannot take a rig keeps the blow's framing (no body shot, no error)", async () => {
    const { stage, play } = setup(['seymour-macalania']);
    await play([{ type: 'ko', targetId: 'seymour-macalania' }]);
    expect(stage.calls.some((c) => c.endsWith(`:${BODY_RIG}`))).toBe(false);
    expect(stage.calls).toContain('lieDown:seymour-macalania');
  });

  // The flat body as measured live (repair-pass probe): 4.0 long, 2.7 deep.
  const flatBody = (cx: number, cz: number): Vector3[] =>
    [[-2.01, -1.35], [-2.01, 1.35], [2.01, 1.35], [2.01, -1.35]].map(([dx, dz]) => new Vector3(cx + dx!, LIE_CLEARANCE, cz + dz!));
  function screenBox(pos: number[], look: number[], fov: number, aspect: number, pts: Vector3[]) {
    const cam = new PerspectiveCamera(fov, aspect, 0.1, 200);
    cam.position.set(pos[0]!, pos[1]!, pos[2]!);
    cam.lookAt(new Vector3(look[0]!, look[1]!, look[2]!));
    cam.updateMatrixWorld();
    const ps = pts.map((p) => p.clone().project(cam));
    const xs = ps.map((p) => (p.x + 1) / 2);
    const ys = ps.map((p) => (1 - p.y) / 2);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }
  // The FFX HUD measured on the proof frames, as fractions of the viewport:
  // the turn list x >= 0.85 above y 0.56, the party panel x >= 0.63 below y 0.65,
  // the guide x <= 0.25 above y 0.34.
  const clearOfHud = (b: { x0: number; x1: number; y0: number; y1: number }): boolean =>
    b.x0 >= 0 && b.y0 >= 0 && b.y1 <= 1 && b.x1 <= 0.85 && !(b.x1 > 0.63 && b.y1 > 0.65) && !(b.x0 < 0.25 && b.y0 < 0.34);

  it('the body shot frames the flat body whole, clear of every HUD panel, at 16:9, 4:3 and 21:9', () => {
    for (const aspect of [16 / 9, 4 / 3, 21 / 9]) {
      for (const [cx, cz] of [[2.84, -5.4], [2.66, -5.4], [1.97, -2.7]] as const) {
        const pos = [cx + BODY_SHOT.from[0], BODY_SHOT.from[1], cz + BODY_SHOT.from[2]];
        const look = [cx + BODY_SHOT.at[0], BODY_SHOT.at[1], cz + BODY_SHOT.at[2]];
        const b = screenBox(pos, look, BODY_SHOT.fov, aspect, flatBody(cx, cz));
        expect(clearOfHud(b), `aspect ${aspect.toFixed(2)} at ${cx},${cz}: ${JSON.stringify(b)}`).toBe(true);
        expect(b.x1 - b.x0).toBeGreaterThan(0.25); // big enough to read as a body
        expect(b.y1 - b.y0).toBeGreaterThan(0.12); // seen from above, not edge-on
      }
    }
  });

  it("Macalania's victory shot keeps the body in frame, whole and clear of the turn list and party panel", () => {
    const rig = MACALANIA_TEMPLE_RIGS.victory!;
    const pos = rig.position as number[];
    const look = rig.lookAt as number[];
    for (const aspect of [16 / 9, 4 / 3]) {
      for (const [cx, cz] of [[2.84, -5.4], [2.66, -5.4], [1.97, -2.7], [2.16, -2.7]] as const) {
        const b = screenBox(pos, look, rig.fov ?? 32, aspect, flatBody(cx, cz));
        expect(clearOfHud(b), `aspect ${aspect.toFixed(2)} at ${cx},${cz}: ${JSON.stringify(b)}`).toBe(true);
      }
    }
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

describe('(3) Anima draws her whole approved folder in Chapter VII', () => {
  const folder = (id: string): Record<string, string> =>
    Object.fromEntries(['idle', 'attack', 'hurt', 'ko', 'overdrive'].map((p) => [p, `art/characters/${id}/${p}.png`]));

  it('the boss Anima keeps every approved painting: D-108/D-150 lifted D-045\'s idle-only filter, and ChapterPoseLimits.ts is gone', () => {
    expect(departurePoses('anima-macalania', folder('anima'))).toEqual(folder('anima'));
  });

  it('the boss and the party\'s own summoned Anima now draw the identical set', () => {
    expect(departurePoses('anima-macalania', folder('anima'))).toEqual(departurePoses('anima', folder('anima')));
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
