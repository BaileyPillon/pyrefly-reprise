/**
 * **The stage lifts a figure while its scene names a lift for the painting that is up (`BattlePresenterStage.add` and `.setArt`; `SceneStaging.formLifts`; release 76).**
 *
 * Driven through the real `PaintedStage` with `PaintedActor.create` replaced by a plain group that records `setPerch` (the real actor needs a WebGL canvas; its lift is pinned in `form-lift.test.ts`). What it pins:
 *  - Penance's Separation (`form-change` to `penance-split`, played by `PaintedStage.setArt`) stands the actor `PENANCE_SPLIT_LIFT` of its height higher, and a swap back would put it on the floor again;
 *  - a figure staged already in the half disc's painting (a re-stage mid-fight) is lifted on `add`;
 *  - nothing else is ever touched: the whole disc on `add`, a swap in a scene that names no lift (including a boss's own form swap) and the arms never call `setPerch`, so a test double or a rig without it is not asked for it.
 *
 * **Game case: FFX only** for the lift's use [AGENTS.md rule 14]; the stage plumbing is shared and inert where no scene names a lift.
 */

import { Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Scene } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface Fake extends Group {
  height: number;
  setPerch: ReturnType<typeof vi.fn>;
}
const made = new Map<string, Fake>();

vi.mock('../../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      const name = String(o['name']);
      const f = new Group() as Fake & Record<string, unknown>;
      f.name = name;
      const blob = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ transparent: true, opacity: 0.5 }));
      f.add(blob);
      f['shadow'] = blob;
      f['levitates'] = false;
      f.height = Number(o['worldHeight'] ?? 1.8);
      f.setPerch = vi.fn();
      f['setPose'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['loadPoses'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      made.set(name, f);
      return f;
    }),
  },
}));
vi.mock('../../../src/engine/VFX.ts', () => ({ HitEffects: class extends Group {} }));
vi.mock('../../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => ({ artId: ids[0], poses: {} })),
  resolvePoseMap: vi.fn(async () => ({})),
}));

const { PaintedStage } = await import('../../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../../src/engine/BattleCamera.ts');
const { PENANCE_SLOTS } = await import('../../../src/scenes/penance.ts');
const { CAVERN_STOLEN_FAYTH_SLOTS } = await import('../../../src/scenes/cavern-stolen-fayth.ts');
const { PENANCE_SPLIT_LIFT } = await import('../../../src/data/ffx/penance-ids.ts');

type Combatant = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
const enemy = (id: string, spriteKey: string, slot: number): Combatant =>
  ({ id, side: 'enemy', slot, alive: true, spriteKey, flags: slot === 0 ? { isBoss: true } : {} }) as unknown as Combatant;

function newStage(slots: typeof PENANCE_SLOTS): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
  });
}

beforeEach(() => made.clear());

describe('Penance\'s half disc is lifted by the stage (FFX only)', () => {
  it('the Separation: setArt to penance-split lifts the actor by the scene\'s fraction of its height (5.6), once', async () => {
    const stage = newStage(PENANCE_SLOTS);
    await stage.add(enemy('penance', 'penance', 0));
    const disc = made.get('penance')!;
    expect(disc.height).toBe(5.6);
    expect(disc.setPerch, 'the whole disc stands on the floor and is not touched').not.toHaveBeenCalled();
    await stage.setArt('penance', 'penance-split');
    expect(disc.setPerch).toHaveBeenCalledTimes(1);
    expect(disc.setPerch.mock.calls[0]![0]).toBeCloseTo(PENANCE_SPLIT_LIFT * 5.6, 12);
    expect(stage.artOf('penance')).toBe('penance-split');
  });

  it('a swap back to the whole disc puts it on the floor again (a revive, a retry), and the same painting twice asks for nothing', async () => {
    const stage = newStage(PENANCE_SLOTS);
    await stage.add(enemy('penance', 'penance', 0));
    const disc = made.get('penance')!;
    await stage.setArt('penance', 'penance-split');
    await stage.setArt('penance', 'penance-split');
    expect(disc.setPerch).toHaveBeenCalledTimes(1);
    await stage.setArt('penance', 'penance');
    expect(disc.setPerch).toHaveBeenCalledTimes(2);
    expect(disc.setPerch.mock.calls[1]![0]).toBe(0);
  });

  it('a figure staged already in the half disc\'s painting (a re-stage mid-fight) is lifted when it is added', async () => {
    const stage = newStage(PENANCE_SLOTS);
    await stage.add(enemy('penance', 'penance-split', 0));
    const disc = made.get('penance')!;
    expect(disc.setPerch).toHaveBeenCalledTimes(1);
    expect(disc.setPerch.mock.calls[0]![0]).toBeCloseTo(PENANCE_SPLIT_LIFT * 5.6, 12);
  });

  it('the arms never call it (they are never swapped), and a swap that names no lift touches nothing', async () => {
    const stage = newStage(PENANCE_SLOTS);
    await stage.add(enemy('penance-right-arm', 'penance-arm-right', 1));
    await stage.add(enemy('penance-left-arm', 'penance-arm-left', 2));
    await stage.setArt('penance-right-arm', 'penance-arm-right-hurt-form');
    expect(made.get('penance-right-arm')!.setPerch).not.toHaveBeenCalled();
    expect(made.get('penance-left-arm')!.setPerch).not.toHaveBeenCalled();
  });
});

describe('a scene that names no lift is staged exactly as before (both games)', () => {
  it('adding a boss and swapping its painting (a form change) never calls setPerch', async () => {
    const stage = newStage(CAVERN_STOLEN_FAYTH_SLOTS as typeof PENANCE_SLOTS);
    await stage.add(enemy('boss', 'boss', 0));
    await stage.setArt('boss', 'penance-split'); // even the half disc's own art id lifts nothing where the scene names none
    await stage.setArt('boss', 'boss-2');
    expect(made.get('boss')!.setPerch).not.toHaveBeenCalled();
  });
});
