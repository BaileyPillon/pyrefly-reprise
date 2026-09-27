/**
 * **PR-0164 and PR-0212: the paintings that touch their own canvas edge get a
 * feathered edge on the battle stage.**
 *
 * FFX only (Chapter II's Yunalesca, and the aeons Yuna summons in I, X and XIV).
 * Several approved paintings run off the side or top of their PNG
 * (`yunalesca-1/attack.png` touches the left and top border, `valefor/idle.png`
 * the right one), so the plane's own rectangle showed as a hard straight line
 * through her hair and through Valefor's wing. The files stay byte-identical;
 * the stage asks the shader to feather the plane's sides and top instead, and
 * keeps the base (the feet and Yunalesca-3's coils stand on the floor).
 *
 * Driven through the real `PaintedStage.add` with `PaintedActor.create`
 * recorded, not run (it needs a WebGL canvas).
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
const { ZANARKAND_DOME_SLOTS } = await import('../../../src/scenes/zanarkand-dome.ts');
const { EDGE_FEATHER_ART, edgeFeatherFor } = await import('../../../src/engine/ActorEdgeFeather.ts');

type Who = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
const who = (id: string, side: 'enemy' | 'aeon' | 'party'): Who =>
  ({ id, side, slot: 0, alive: true, spriteKey: id, flags: { isBoss: side === 'enemy' } }) as unknown as Who;

function stage(): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene: new Scene(),
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots: ZANARKAND_DOME_SLOTS,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
  });
}

const optsFor = (id: string): Record<string, unknown> => created.find((o) => o['name'] === id)!;

describe('PR-0164 / PR-0212: a feathered edge for paintings that touch their canvas (FFX)', () => {
  beforeEach(() => {
    created.length = 0;
  });

  it('names the three Yunalesca forms, Valefor and Ixion, each inside the 0.12-0.2 band', () => {
    for (const id of ['yunalesca-1', 'yunalesca-2', 'yunalesca-3', 'valefor', 'ixion']) {
      const f = EDGE_FEATHER_ART[id];
      expect(f, id).toBeDefined();
      expect(f!).toBeGreaterThanOrEqual(0.12);
      expect(f!).toBeLessThanOrEqual(0.2);
    }
    expect(edgeFeatherFor('tidus')).toBeNull();
  });

  it('asks the actor to feather Yunalesca and Valefor, sides and top only', async () => {
    const s = stage();
    await s.add(who('yunalesca-1', 'enemy'));
    await s.add(who('valefor', 'aeon'));
    for (const id of ['yunalesca-1', 'valefor']) {
      const o = optsFor(id);
      expect(o['edgeFade'], id).toBe(EDGE_FEATHER_ART[id]);
      expect(o['edgeFadeBase'], id).toBe(false);
      // L-0 browser check (2026-09-27): a feather parallel to the plane's side still read as a soft
      // straight column through her hair (Ch II, 2000x1012) and Valefor's wing (Ch XIV, 1600x900).
      expect(o['edgeJag'], id).toBeGreaterThan(0);
    }
  });

  it('wanders the fade start along the edge in the shader, and still reaches 0 at the plate edge', async () => {
    const { paintedFragmentShader } = await import('../../../src/engine/shaders/PaintedShader.ts');
    expect(paintedFragmentShader).toMatch(/uniform float edgeJag;/);
    // The fade ends at the plate edge (box 1.0) whatever the wander; only its start moves inward.
    expect(paintedFragmentShader).toMatch(/smoothstep\(fadeStart, 1\.0, box\)/);
    expect(paintedFragmentShader).toMatch(/fadeStart -= edgeJag \*/);
  });

  it('leaves everyone else exactly as before (no feather option at all)', async () => {
    const s = stage();
    await s.add(who('tidus', 'party'));
    await s.add(who('seymour-flux', 'enemy'));
    for (const id of ['tidus', 'seymour-flux']) {
      expect('edgeFade' in optsFor(id), id).toBe(false);
      expect('edgeFadeBase' in optsFor(id), id).toBe(false);
    }
  });
});
