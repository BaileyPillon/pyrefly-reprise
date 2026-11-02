// @vitest-environment jsdom
/**
 * **The art id on the actor** (`PaintedStage.add` and `setArt`, `BattlePresenterArt.ART_KEY`; both games, additive). The stage keeps the art id it staged a figure under on the actor's `userData`, at the opening and again when
 * `setArt` swaps the painting (a form change, an FFX-2 spherechange), **at once, before the new paintings load**: a model that stands in for the painting (the hidden 3D Bahamut chapter's dressphere models,
 * `engine/yrp3d/skin.ts`) reads it off the actor to know what the battle says the figure is now, and swaps with the presenter's flash, not after the files. Nothing else reads it and no actor behaves differently for having it.
 * Driven through the real `PaintedStage.add` / `setArt` with `PaintedActor.create` recorded, not run, the way `stage-form-heights.test.ts` does it.
 */

import { Group, Object3D, PerspectiveCamera, Scene } from 'three';
import { describe, expect, it, vi } from 'vitest';

const actorsOut: Array<Object3D> = [];
/** The art id the actor held at each moment `loadPoses` was called (it is written before the paintings load). */
const keyAtLoad: unknown[] = [];

vi.mock('../../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      const f = new Object3D() as Object3D & Record<string, unknown>;
      f.name = String(o['name']);
      f['setPose'] = (): void => {};
      f['setAlpha'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      f['setWorldHeight'] = (): void => {};
      f['loadPoses'] = async (): Promise<void> => void keyAtLoad.push(f.userData['artId']);
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
const { ART_KEY } = await import('../../../src/engine/BattlePresenterArt.ts');

import type { BattleState } from '../../../src/battle/common/types.ts';
import type { SceneSlots } from '../../../src/scenes/index.ts';

const SLOTS: SceneSlots = { party: [[-1.95, 0, 1.5]], enemy: [[2.5, 0, -4]], partyHeight: 1.82, enemyHeight: 4.1 };

function stageWith(): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots: SLOTS,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
  });
}

type Girl = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
/** An FFX-2 girl as the stage reads one: `artIdFor` gives `<id>-<current dressphere>`. */
const girl = (id: string, dress: string): Girl =>
  ({ id, name: id, side: 'party', slot: 0, alive: true, removed: false, spriteKey: id, flags: {}, dresspheres: { current: dress } }) as unknown as Girl;
const stateWith = (...c: Girl[]): BattleState => ({ game: 'ffx2', combatants: Object.fromEntries(c.map((f) => [f.id, f])), activeIds: [], reserveIds: [], enemyIds: [], aeonId: null, flags: {} }) as unknown as BattleState;

describe('the art id on the actor', () => {
  it('is written when the figure is staged: the id the battle says she is (`yuna-white-mage`)', async () => {
    expect(ART_KEY).toBe('artId');
    const yuna = girl('yuna', 'white-mage');
    const stage = stageWith();
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    expect(actorsOut.at(-1)!.userData[ART_KEY]).toBe('yuna-white-mage');
  });

  it('is rewritten by a swap of her painting (a spherechange), before the new paintings load', async () => {
    const yuna = girl('yuna', 'white-mage');
    const stage = stageWith();
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    const actor = actorsOut.at(-1)!;
    keyAtLoad.length = 0;
    await stage.setArt('yuna', 'yuna-black-mage');
    expect(actor.userData[ART_KEY]).toBe('yuna-black-mage');
    expect(keyAtLoad, 'already the new id when the paintings began to load').toEqual(['yuna-black-mage']);
  });

  it('is left alone by a swap to the painting she already has (nothing changed, so nothing is rewritten)', async () => {
    const yuna = girl('yuna', 'white-mage');
    const stage = stageWith();
    await stage.stage(stateWith(yuna));
    await stage.add(yuna);
    const actor = actorsOut.at(-1)!;
    actor.userData[ART_KEY] = 'marker';
    await stage.setArt('yuna', 'yuna-white-mage');
    expect(actor.userData[ART_KEY], 'the early return: no rewrite').toBe('marker');
  });
});
