/**
 * **The shot director's path from a scene to `BattleMoments`** (`SceneStaging.shotDirector`): `stagingOf` passes it through to the slots the stage is handed, `PaintedStage.shotDirector` reads it off
 * them, and `BattleMoments` asks it through the stage. Additive and inert: a scene with no director gives the stage none, and a stage without one plays every beat's own shot.
 *
 * Driven through the real `PaintedStage` (constructed as `stage-figure-heights.test.ts` does, with `PaintedActor` and the hit effects stubbed: they need a WebGL canvas, and no figure is added here) and
 * the real `BattleMoments` over its real camera chain. The beats' behaviour is `shot-director.test.ts`'s; the scene that publishes one is `chapters/exp-fayth-scene.test.ts`'s.
 *
 * **Game case: both** [AGENTS.md rule 14]: shared stage plumbing; only the hidden Fayth chapter (FFX) publishes a director today.
 */

import { Group, Object3D, PerspectiveCamera, Scene } from 'three';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/engine/PaintedActor.ts', () => ({ PaintedActor: { create: vi.fn(async () => new Object3D()) } }));
vi.mock('../../../src/engine/VFX.ts', () => ({ HitEffects: class extends Group {} }));

const { PaintedStage } = await import('../../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../../src/engine/BattleCamera.ts');
const { BattleMoments } = await import('../../../src/engine/BattleMoments.ts');
const { stagingOf } = await import('../../../src/scenes/types.ts');
const { STUB_SHOT_DIRECTOR } = await import('../../../src/engine/ffxcam/stubDirector.ts');
const { EVRAE_AIRSHIP_DECK_SLOTS } = await import('../../../src/scenes/evrae-airship-deck.ts');

type Slots = ConstructorParameters<typeof PaintedStage>[0]['slots'];

function stageWith(slots: Slots): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] }, victory: { position: [0, 2, 6], lookAt: [0, 1, 0] } } }),
    slots,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
  });
}

describe('stagingOf', () => {
  it('passes a scene\'s director through, and adds no key for a scene without one', () => {
    expect(stagingOf({ shotDirector: STUB_SHOT_DIRECTOR })).toEqual({ shotDirector: STUB_SHOT_DIRECTOR });
    expect('shotDirector' in stagingOf({ holdParty: true })).toBe(false);
    expect(stagingOf({})).toEqual({});
  });
});

describe('PaintedStage.shotDirector', () => {
  it('is the scene\'s director when the slots carry one, and undefined for every scene that publishes none', () => {
    expect(stageWith({ ...EVRAE_AIRSHIP_DECK_SLOTS, shotDirector: STUB_SHOT_DIRECTOR }).shotDirector).toBe(STUB_SHOT_DIRECTOR);
    expect(stageWith(EVRAE_AIRSHIP_DECK_SLOTS).shotDirector).toBeUndefined();
    expect(stageWith({ party: [[0, 0, 0]], enemy: [[1, 0, 0]] }).shotDirector).toBeUndefined();
  });

  it('is asked by BattleMoments through the stage: the director gets the stage\'s own camera, and a beat it takes makes no camera move', async () => {
    /** The stage's camera chain with its moves recorded and finished at once (the real tween waits for the render loop's updates). */
    const recorded = (stage: InstanceType<typeof PaintedStage>): string[] => {
      const moves: string[] = [];
      stage.camera.snapTo = (rig) => void moves.push(`snap:${rig}`);
      stage.camera.moveTo = (rig) => (moves.push(`move:${rig}`), Promise.resolve());
      return moves;
    };

    const seen: unknown[] = [];
    const directed = stageWith({ ...EVRAE_AIRSHIP_DECK_SLOTS, shotDirector: { victory: (ctx) => (seen.push(ctx.camera), true) } });
    const moves = recorded(directed);
    await new BattleMoments({ stage: directed, sleep: () => Promise.resolve(), speed: () => 'normal' }).victory();
    expect(seen).toEqual([directed.camera]);
    expect(moves, 'the director took the victory rig').toEqual([]);

    // The same stage with no director: BattleMoments moves to the victory rig itself.
    const plain = stageWith(EVRAE_AIRSHIP_DECK_SLOTS);
    const plainMoves = recorded(plain);
    await new BattleMoments({ stage: plain, sleep: () => Promise.resolve(), speed: () => 'normal' }).victory();
    expect(plainMoves).toEqual(['move:victory']);
  });
});
