/**
 * **A scene's per-combatant height (`SceneStaging.figureHeights`).**
 *
 * The stage sizes every non-boss fiend at 0.7 of the scene's boss height
 * (`BattlePresenterArt.worldHeightFor`). Chapter IX's Daigoro is a dog at
 * Yojimbo's feet, and that rule stood him as tall as Lulu; the scene used to
 * scale his figure after the fact. `figureHeights` lets a scene name the height
 * instead, and the shadow and the turn ring shrink with it. Additive: a scene
 * that does not set it (every other chapter) gets exactly what it got before.
 *
 * Driven through the real `PaintedStage.add` with `PaintedActor.create`
 * recorded, not run (it needs a WebGL canvas).
 *
 * **Game case: both** [AGENTS.md rule 14]: shared stage plumbing; only
 * Chapter IX (FFX) sets the field today.
 */

import { Group, Object3D, PerspectiveCamera, Scene } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const created: Array<Record<string, unknown>> = [];

vi.mock('../../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      created.push(o);
      const f = new Object3D() as Object3D & Record<string, unknown>;
      f.name = String(o['name']);
      f['setPose'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      return f;
    }),
  },
}));
vi.mock('../../../src/engine/VFX.ts', () => ({ HitEffects: class extends Group {} }));
vi.mock('../../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => ({ artId: ids[0], poses: {} })),
}));

const { PaintedStage } = await import('../../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../../src/engine/BattleCamera.ts');
const { stagingOf } = await import('../../../src/scenes/types.ts');
const { CAVERN_STOLEN_FAYTH_SLOTS, CAVERN_ACTOR_HEIGHTS } = await import('../../../src/scenes/cavern-stolen-fayth.ts');

type Fiend = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
const fiend = (id: string, slot: number, isBoss: boolean): Fiend =>
  ({ id, side: 'enemy', slot, alive: true, spriteKey: id, flags: { isBoss } }) as unknown as Fiend;

function stageWith(slots: typeof CAVERN_STOLEN_FAYTH_SLOTS): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
  });
}

const optsFor = (id: string): Record<string, unknown> => created.find((o) => o['name'] === id)!;
const radius = (o: Record<string, unknown>, k: 'shadow' | 'turnRing'): number => (o[k] as { radius: number }).radius;

describe('PaintedStage — a per-combatant height from the scene', () => {
  beforeEach(() => {
    created.length = 0;
  });

  it("stands Daigoro at the Cavern's own height, with his shadow and ring shrunk by the same ratio", async () => {
    const stage = stageWith(CAVERN_STOLEN_FAYTH_SLOTS);
    await stage.add(fiend('daigoro', 2, false));
    const o = optsFor('daigoro');
    expect(o['worldHeight']).toBe(CAVERN_ACTOR_HEIGHTS.daigoro);
    const k = CAVERN_ACTOR_HEIGHTS.daigoro / (CAVERN_ACTOR_HEIGHTS.yojimbo * 0.7);
    expect(radius(o, 'shadow')).toBeCloseTo(1.5 * k, 9);
    expect(radius(o, 'turnRing')).toBeCloseTo(1.7 * k, 9);
  });

  it('leaves everyone the scene does not name on the stage rule', async () => {
    const stage = stageWith(CAVERN_STOLEN_FAYTH_SLOTS);
    await stage.add(fiend('yojimbo', 1, true));
    await stage.add(fiend('ginnem', 0, false));
    expect(optsFor('yojimbo')['worldHeight']).toBe(CAVERN_ACTOR_HEIGHTS.yojimbo);
    expect(radius(optsFor('yojimbo'), 'turnRing')).toBe(1.7);
    expect(optsFor('ginnem')['worldHeight']).toBeCloseTo(CAVERN_ACTOR_HEIGHTS.yojimbo * 0.7, 9);
    expect(radius(optsFor('ginnem'), 'shadow')).toBe(1.5);
  });

  it('changes nothing for a scene without the field', async () => {
    const { figureHeights: _drop, ...plain } = CAVERN_STOLEN_FAYTH_SLOTS;
    const stage = stageWith(plain);
    await stage.add(fiend('daigoro', 2, false));
    expect(optsFor('daigoro')['worldHeight']).toBeCloseTo(CAVERN_ACTOR_HEIGHTS.yojimbo * 0.7, 9);
    expect(radius(optsFor('daigoro'), 'shadow')).toBe(1.5);
  });

  it('an arrival director that names a height still wins over the scene table', async () => {
    const stage = stageWith(CAVERN_STOLEN_FAYTH_SLOTS);
    await stage.add(fiend('daigoro', 2, false), 1.2);
    expect(optsFor('daigoro')['worldHeight']).toBe(1.2);
    expect(radius(optsFor('daigoro'), 'turnRing')).toBe(1.7);
  });

  it('is carried from a SceneBuild to the stage by stagingOf, and only when set', () => {
    expect(stagingOf({ figureHeights: { daigoro: 0.73 } })).toEqual({ figureHeights: { daigoro: 0.73 } });
    expect(stagingOf({ holdParty: true })).toEqual({ holdParty: true });
  });
});
