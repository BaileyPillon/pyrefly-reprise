// @vitest-environment jsdom
/**
 * **A scene's per-form height (`SceneStaging.formHeights`): Lady Yunalesca's first form at her wing tips (FFX only, Chapter II; branch r3943-int).**
 *
 * Her painting swaps with the form (`PaintedStage.setArt`, called by the form-change beat), so her height is per painting. Driven through the real `PaintedStage.add` / `setArt` with
 * `PaintedActor.create` recorded, not run (it needs a WebGL canvas), the way `stage-figure-heights.test.ts` does it. Held here:
 *
 * - the first painting is staged at the scene's form height, with her shadow and her ring at the same ratio over the stage's rule as a scene-named height always scaled them;
 * - the swap to her second painting puts the actor back at the shared boss height **before** the new poses load, with the shadow and the ring at today's radii **bit for bit**
 *   (1.5 and 1.7: the stage rule for a boss), so her second and third forms are drawn exactly as they were;
 * - the swap from her second to her third touches nothing (no scene height names either), and a figure staged at her second form stands at the shared height from the start;
 * - the framing is **not** told: the actor records the factor (`STATURE_KEY`, the form's height over the shared one) so the camera is planned as if she stood at the shared 4.1, as it always was
 *   (the phone's slice fit and CHAPTER FRAMING read her at the shared height), and the key is gone from her other forms;
 * - a scene that names no form heights, a swap between two paintings neither of which is named, and a combatant the scene names by id are left exactly as they were.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the fiend is Chapter II's; the plumbing is a field only that scene sets.
 */

import { Group, Object3D, PerspectiveCamera, Scene } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const created: Array<Record<string, unknown>> = [];
/** The figures the mocked `PaintedActor.create` returned, in order (the stage writes the factor the framing plans her by on the actor). */
const actorsOut: Array<Object3D> = [];
/** What the recorded actor was told, in order: `setWorldHeight` and `loadPoses`. */
const calls: Array<{ id: string; what: 'setWorldHeight' | 'loadPoses'; args: unknown[] }> = [];

vi.mock('../../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      created.push(o);
      const name = String(o['name']);
      const f = new Object3D() as Object3D & Record<string, unknown>;
      f.name = name;
      f['setPose'] = (): void => {};
      f['setAlpha'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      f['setWorldHeight'] = (...args: unknown[]): void => void calls.push({ id: name, what: 'setWorldHeight', args });
      f['loadPoses'] = async (...args: unknown[]): Promise<void> => void calls.push({ id: name, what: 'loadPoses', args });
      actorsOut.push(f);
      return f;
    }),
  },
}));
vi.mock('../../../src/engine/VFX.ts', () => ({ HitEffects: class extends Group {} }));
vi.mock('../../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => ({ artId: ids[0], poses: {} })),
  resolvePoseMap: vi.fn(async () => ({ idle: 'idle.png' })),
}));

const { PaintedStage } = await import('../../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../../src/engine/BattleCamera.ts');
const { ZANARKAND_FORM_HEIGHTS } = await import('../../../src/scenes/zanarkand-dome-giants.ts');
const { STATURE_KEY } = await import('../../../src/engine/PartyStature.ts');

import type { BattleState } from '../../../src/battle/common/types.ts';
import type { SceneSlots } from '../../../src/scenes/index.ts';

const SHARED = 4.1;
const FIRST = ZANARKAND_FORM_HEIGHTS['yunalesca-1']!;

const SLOTS: SceneSlots = {
  party: [[-1.95, 0, 1.5]],
  enemy: [[2.5, 0, -4]],
  partyHeight: 1.82,
  enemyHeight: SHARED,
  holdParty: true,
  enemySpots: { yunalesca: [2.8, 0, -4] },
  formHeights: ZANARKAND_FORM_HEIGHTS,
};

function stageWith(slots: SceneSlots): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
  });
}

type Fiend = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
/** A multi-form boss as the stage reads one: `artIdFor` gives `<id>-<formIndex + 1>` for `yunalesca` and `braskas-final-aeon`. */
const boss = (id: string, formIndex = 0): Fiend =>
  ({ id, name: id, side: 'enemy', slot: 0, alive: true, removed: false, spriteKey: `${id}-${formIndex + 1}`, flags: { isBoss: true }, enemy: { formIndex } }) as unknown as Fiend;

/** Just enough of a `BattleState` for the stage to read the combatant at a swap (`lastState`): nobody is staged by it. */
function stateWith(...fiends: Fiend[]): BattleState {
  return { game: 'ffx', combatants: Object.fromEntries(fiends.map((f) => [f.id, f])), activeIds: [], reserveIds: [], enemyIds: [], aeonId: null, flags: {} } as unknown as BattleState;
}

const optsFor = (id: string): Record<string, unknown> => created.filter((o) => o['name'] === id).at(-1)!;
const radius = (o: Record<string, unknown>, k: 'shadow' | 'turnRing'): number => (o[k] as { radius: number }).radius;
/** The factor the stage recorded on the figure it made last for `id` (undefined: none, the framing reads the figure as drawn). */
const plannedBy = (id: string): unknown => actorsOut.filter((a) => a.name === id).at(-1)!.userData[STATURE_KEY];
const callsFor = (id: string): Array<{ what: string; args: unknown[] }> => calls.filter((c) => c.id === id).map(({ what, args }) => ({ what, args }));

beforeEach(() => {
  created.length = 0;
  calls.length = 0;
  actorsOut.length = 0;
});

describe('PaintedStage: Chapter II stages her first painting at the form height', () => {
  it('draws form 1 at 2.577 (from 4.1), with her shadow and her ring at the same ratio over the stage rule', async () => {
    const yuna = boss('yunalesca');
    const stage = stageWith(SLOTS);
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    const o = optsFor('yunalesca');
    expect(o['worldHeight']).toBe(FIRST);
    expect(FIRST).toBe(2.577);
    const k = FIRST / SHARED;
    expect(radius(o, 'shadow')).toBeCloseTo(1.5 * k, 9);
    expect(radius(o, 'turnRing')).toBeCloseTo(1.7 * k, 9);
    expect(plannedBy('yunalesca'), 'the framing plans her at the shared height: the key is her form height over it').toBeCloseTo(k, 12);
  });

  it('draws a figure staged at her second form at the shared height from the start, at the stage rule\'s radii', async () => {
    const yuna = boss('yunalesca', 1);
    const stage = stageWith(SLOTS);
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    const o = optsFor('yunalesca');
    expect(o['worldHeight']).toBe(SHARED);
    expect(radius(o, 'shadow')).toBe(1.5);
    expect(radius(o, 'turnRing')).toBe(1.7);
    expect(plannedBy('yunalesca'), 'no key: the framing reads her as drawn, which is the shared height').toBeUndefined();
  });
});

describe('PaintedStage.setArt: the form change', () => {
  it('puts her back at the shared height for her second painting, before its poses load, at today\'s radii bit for bit', async () => {
    const yuna = boss('yunalesca');
    const stage = stageWith(SLOTS);
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    calls.length = 0;
    await stage.setArt('yunalesca', 'yunalesca-2');
    const seen = callsFor('yunalesca');
    expect(seen.map((c) => c.what)).toEqual(['setWorldHeight', 'loadPoses']);
    const [height, radii] = seen[0]!.args as [number, { shadow: number; ring: number }];
    expect(height).toBe(SHARED);
    expect(Object.is(radii.shadow, 1.5)).toBe(true);
    expect(Object.is(radii.ring, 1.7)).toBe(true);
    expect(plannedBy('yunalesca'), 'the key written for her first form is gone').toBeUndefined();
  });

  it('touches nothing at her second form\'s change to her third: neither painting is named', async () => {
    const yuna = boss('yunalesca');
    const stage = stageWith(SLOTS);
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    await stage.setArt('yunalesca', 'yunalesca-2');
    calls.length = 0;
    await stage.setArt('yunalesca', 'yunalesca-3');
    expect(callsFor('yunalesca').map((c) => c.what)).toEqual(['loadPoses']);
  });

  it('does nothing for a swap to the painting already up', async () => {
    const yuna = boss('yunalesca');
    const stage = stageWith(SLOTS);
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    calls.length = 0;
    await stage.setArt('yunalesca', 'yunalesca-1');
    expect(calls).toEqual([]);
  });

  it('sizes the form that is coming in from the scene: a swap back to her first painting stands her at 2.577 again, at the form\'s radii', async () => {
    const yuna = boss('yunalesca', 1);
    const stage = stageWith(SLOTS);
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    calls.length = 0;
    await stage.setArt('yunalesca', 'yunalesca-1');
    const [height, radii] = callsFor('yunalesca')[0]!.args as [number, { shadow: number; ring: number }];
    expect(height).toBe(FIRST);
    expect(radii.shadow).toBeCloseTo(1.5 * (FIRST / SHARED), 9);
    expect(radii.ring).toBeCloseTo(1.7 * (FIRST / SHARED), 9);
    expect(plannedBy('yunalesca')).toBeCloseTo(FIRST / SHARED, 12);
  });
});

describe('everything else stays exactly as it was', () => {
  it('a scene that names no form heights is never resized at a swap (Chapter III\'s Braska\'s Final Aeon, form 1 to form 2)', async () => {
    const aeon = boss('braskas-final-aeon');
    const stage = stageWith({ ...SLOTS, formHeights: undefined, enemySpots: {} });
    await stage.stage(stateWith(aeon));
    await stage.add(aeon);
    expect(optsFor('braskas-final-aeon')['worldHeight']).toBe(SHARED);
    calls.length = 0;
    await stage.setArt('braskas-final-aeon', 'braskas-final-aeon-2');
    expect(callsFor('braskas-final-aeon').map((c) => c.what)).toEqual(['loadPoses']);
  });

  it('a boss the scene names no form for is not resized by Yunalesca\'s table (a swap between two unnamed paintings)', async () => {
    const aeon = boss('braskas-final-aeon');
    const stage = stageWith(SLOTS);
    await stage.stage(stateWith(aeon));
    await stage.add(aeon);
    expect(optsFor('braskas-final-aeon')['worldHeight']).toBe(SHARED);
    calls.length = 0;
    await stage.setArt('braskas-final-aeon', 'braskas-final-aeon-2');
    expect(callsFor('braskas-final-aeon').map((c) => c.what)).toEqual(['loadPoses']);
  });

  it('a height the scene names for the combatant by id is the figure\'s own and wins over the form\'s', async () => {
    const yuna = boss('yunalesca');
    const stage = stageWith({ ...SLOTS, figureHeights: { yunalesca: 3.3 } });
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    expect(optsFor('yunalesca')['worldHeight']).toBe(3.3);
    expect(plannedBy('yunalesca'), 'a height named by id is the figure own and is not planned back').toBeUndefined();
  });

  it('a scene with no form heights draws her at the shared height at every form, as every chapter did before', async () => {
    const yuna = boss('yunalesca');
    const stage = stageWith({ ...SLOTS, formHeights: undefined });
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    expect(optsFor('yunalesca')['worldHeight']).toBe(SHARED);
    expect(radius(optsFor('yunalesca'), 'shadow')).toBe(1.5);
    expect(plannedBy('yunalesca')).toBeUndefined();
    calls.length = 0;
    await stage.setArt('yunalesca', 'yunalesca-2');
    expect(callsFor('yunalesca').map((c) => c.what)).toEqual(['loadPoses']);
    expect(plannedBy('yunalesca')).toBeUndefined();
  });
});
