// @vitest-environment jsdom
/**
 * **A scene that draws its own hits** (`SceneStaging.ownImpacts`, `src/engine/ownImpacts.ts`; the hidden Wind Waker chapter, FFX-2 only in use; shared plumbing, additive for every other scene).
 *
 * Polish 1 left the stage's shared impact effects painting a white blob over the girl a spell landed on (stills 55 and 60: the impact bloom, the drawn `hit` effect's 300 px bloom and SKILL TRAVEL's impact frame).
 * The scene now declares `ownImpacts`; this pins the flag (carried by `stagingOf`, published by the real scene factory and by no other), the wrapper (every effect of a blow off for a scene that owns its hits, everything else
 * through, the identical port for every other scene) and the real `PaintedStage` (its bloom, sparks and slash never play for such a scene and play as before for every other).
 */

import { Group, Object3D, PerspectiveCamera, Scene } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const played = { flash: vi.fn(), sparks: vi.fn(), slash: vi.fn(async () => undefined) };

vi.mock('../../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      const f = new Object3D() as Object3D & Record<string, unknown>;
      f.name = String(o['name']);
      f['height'] = 1.5;
      f['centerPoint'] = (v: { set: (x: number, y: number, z: number) => unknown }): unknown => v.set(0, 0.9, 0);
      f['setPose'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      return f;
    }),
  },
}));
vi.mock('../../../src/engine/VFX.ts', () => ({
  HitEffects: class extends Group {
    flash = { play: played.flash };
    sparks = { emit: played.sparks };
    slash = { play: played.slash };
  },
}));
vi.mock('../../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => ({ artId: ids[0], poses: {} })),
}));

const { PaintedStage } = await import('../../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../../src/engine/BattleCamera.ts');
const { impactsOwned, withOwnImpacts, withOwnImpactsFx } = await import('../../../src/engine/ownImpacts.ts');
const { fxHit } = await import('../../../src/engine/fx/c/presenterHooks.ts');
const { stagingOf } = await import('../../../src/scenes/types.ts');
const { EXP_WINDWAKER_SLOTS } = await import('../../../src/scenes/exp-windwaker-stage.ts');
import type { VfxPort } from '../../../src/engine/BattlePresenterPorts.ts';
import type { FxStagePort } from '../../../src/engine/fx/c/presenterHooks.ts';
import type { SceneSlots } from '../../../src/scenes/index.ts';
import type { SceneBuild } from '../../../src/scenes/types.ts';

/** A VfxPort whose every method is a spy, so a test reads which ones a wrapper let through. */
function spyPort(): { port: VfxPort; calls: Record<string, ReturnType<typeof vi.fn>> } {
  const calls = {
    play: vi.fn(async () => undefined),
    impact: vi.fn(async () => undefined),
    screenFlash: vi.fn(),
    land: vi.fn(() => 480),
    pendingLand: vi.fn(() => 0),
    markIn: vi.fn(() => 0),
    travel: vi.fn(() => ({ ms: 300, landed: Promise.resolve() })),
    canTravel: vi.fn(() => true),
    itemToss: vi.fn(),
    itemGlow: vi.fn(),
  };
  return { port: calls as unknown as VfxPort, calls };
}

describe('impactsOwned — the one place the flag is read', () => {
  it('is true only for a scene that says true', () => {
    expect(impactsOwned({ ownImpacts: true })).toBe(true);
    expect(impactsOwned({ ownImpacts: false })).toBe(false);
    expect(impactsOwned({})).toBe(false);
    expect(impactsOwned({ ownImpacts: 'yes' as unknown as boolean })).toBe(false);
  });
});

describe('withOwnImpacts — the stage\'s own impact effects off for a scene that draws its own', () => {
  it('hands back the very same port for a scene that does not (every other chapter reads exactly as before)', () => {
    const { port } = spyPort();
    expect(withOwnImpacts(port, false)).toBe(port);
  });

  it('draws no impact, no effect on a combatant, no spell landing and no shot: the bloom, the drawn hit and SKILL TRAVEL\'s impact frame are all off', async () => {
    const { port, calls } = spyPort();
    const own = withOwnImpacts(port, true);
    await own.impact('yuna', { element: 'none', crit: true });
    await own.play('slash', 'yuna');
    await own.play('fire', 'x2-valefor');
    expect(calls['impact']).not.toHaveBeenCalled();
    expect(calls['play']).not.toHaveBeenCalled();
    expect(own.land!('yuna', { abilityId: 'x2-valefor-energy-blast', hitIndex: 0 })).toBe(0); // nothing to wait for: the numeral lands at once
    expect(calls['land']).not.toHaveBeenCalled();
    expect(own.canTravel!('x2-valefor-energy-ray', 'x2-valefor')).toBe(false); // so the presenter sends no shot and holds no numeral for one
    expect(own.travel!('yuna', 'x2-valefor', { kind: 'tracer', ms: 150 }).ms).toBe(0);
    await expect(own.travel!('yuna', 'x2-valefor', { kind: 'orb', ms: 480 }).landed).resolves.toBeUndefined();
    expect(calls['canTravel']).not.toHaveBeenCalled();
    expect(calls['travel']).not.toHaveBeenCalled();
  });

  it('still plays a full-screen effect, a stone figure\'s shards, the screen flash, the item gestures and the waits it did not touch', async () => {
    const { port, calls } = spyPort();
    const own = withOwnImpacts(port, true);
    await own.play('impact', 'screen');
    expect(calls['play']).toHaveBeenCalledWith('impact', 'screen');
    await own.play('stone-shatter', 'rikku');
    expect(calls['play']).toHaveBeenCalledWith('stone-shatter', 'rikku');
    own.screenFlash('#ffffff', 200);
    expect(calls['screenFlash']).toHaveBeenCalledWith('#ffffff', 200);
    own.itemGlow!('yuna', { formMs: 100 });
    expect(calls['itemGlow']).toHaveBeenCalled();
    expect(own.pendingLand!('yuna', 1)).toBe(0);
    expect(own.markIn!('yuna', 1)).toBe(0);
  });
});

describe('withOwnImpactsFx — BATTLE SPECTACLE (option C) keeps its splash and its arc, and loses its hit', () => {
  /** An option-C port whose every method is a spy. */
  function spyFx(on = true): { port: FxStagePort; calls: Record<string, ReturnType<typeof vi.fn>> } {
    const calls = {
      enabled: vi.fn(() => on),
      actionOpen: vi.fn(async () => undefined),
      hit: vi.fn(() => ({ freezeMs: 140, shook: true })),
      dissolve: vi.fn(),
      freeze: vi.fn(),
      victory: vi.fn(() => 900),
      opening: vi.fn(),
    };
    return { port: calls as unknown as FxStagePort, calls };
  }
  const ctxOf = (fx: FxStagePort | undefined): never => ({ stage: { fx }, speed: () => 'normal', burst: undefined }) as never;
  const blow = { type: 'damage', targetId: 'yuna', amount: 295, hitIndex: 0, hitCount: 1 } as never;

  it('is a port with no hit, so the presenter answers null and keeps its own shake and hit-stop; the same event on the raw port asks it', () => {
    const { port, calls } = spyFx();
    expect(fxHit(ctxOf(port), blow, true)).toEqual({ waitMs: 140, shook: true });
    expect(calls['hit']).toHaveBeenCalledTimes(1);
    const own = withOwnImpactsFx(port);
    expect('hit' in own).toBe(false);
    expect(fxHit(ctxOf(own), blow, true)).toBeNull();
    expect(calls['hit']).toHaveBeenCalledTimes(1); // not asked again
  });

  it('forwards the Overdrive splash, the dissolve, the victory arc and the opening, and follows the option live', async () => {
    const { port, calls } = spyFx();
    const own = withOwnImpactsFx(port);
    await own.actionOpen!({ actorId: 'x2-valefor', name: 'Energy Blast', kind: 'overdrive' });
    expect(calls['actionOpen']).toHaveBeenCalledWith({ actorId: 'x2-valefor', name: 'Energy Blast', kind: 'overdrive' });
    own.dissolve!('x2-valefor');
    expect(calls['dissolve']).toHaveBeenCalledWith('x2-valefor');
    expect(own.victory!('pose')).toBe(900);
    own.opening!();
    expect(calls['opening']).toHaveBeenCalled();
    expect(own.enabled()).toBe(true);
    const off = withOwnImpactsFx(spyFx(false).port);
    expect(off.enabled()).toBe(false);
  });

  it('forwards the freeze on the last blow of a fight: it holds the clock of the field and is not an impact (it was dropped before the review of 2026-11-02)', () => {
    const { port, calls } = spyFx();
    const own = withOwnImpactsFx(port);
    expect(own.freeze).toBeTypeOf('function');
    own.freeze!(850);
    expect(calls['freeze']).toHaveBeenCalledWith(850);
  });

  it('leaves out a method the option did not have', () => {
    const bare = withOwnImpactsFx({ enabled: () => true });
    expect(Object.keys(bare)).toEqual(['enabled']);
  });
});

describe('stagingOf carries ownImpacts, only when it is true', () => {
  const base = { group: new Group() } as unknown as SceneBuild;
  it('copies it from a build that says true and from no other', () => {
    expect(stagingOf({ ...base, ownImpacts: true } as SceneBuild).ownImpacts).toBe(true);
    expect('ownImpacts' in stagingOf({ ...base, ownImpacts: false } as SceneBuild)).toBe(false);
    expect('ownImpacts' in stagingOf(base)).toBe(false);
  });
});

describe('the real PaintedStage', () => {
  const slotsFor = (own: boolean): SceneSlots => ({
    party: [[0, 0, 0]],
    enemy: [[3, 0, -3]],
    ...(own ? { ownImpacts: true } : {}),
  });

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
  const girl = { id: 'yuna', side: 'party', slot: 0, alive: true, spriteKey: 'yuna', flags: {} } as unknown as Parameters<InstanceType<typeof PaintedStage>['add']>[0];

  beforeEach(() => {
    played.flash.mockClear();
    played.sparks.mockClear();
    played.slash.mockClear();
  });

  it('plays the impact bloom, the sparks and the slash for a blow, as it always has, in a scene that does not own its hits', async () => {
    const stage = stageWith(slotsFor(false));
    await stage.add(girl);
    await stage.vfx.impact('yuna', { element: 'none' });
    expect(played.flash).toHaveBeenCalledTimes(1);
    expect(played.sparks).toHaveBeenCalledTimes(1);
    expect(played.slash).toHaveBeenCalledTimes(1);
    expect(stage.vfx.canTravel?.('x2-valefor-energy-ray', 'x2-valefor')).not.toBe(false);
  });

  it('says whether its scene owns its hits (the getter app/screens/battleSpectacle.ts reads before it installs the Spectacle port)', () => {
    expect(stageWith(slotsFor(true)).ownImpacts).toBe(true);
    expect(stageWith(slotsFor(false)).ownImpacts).toBe(false);
  });

  it('plays none of it for a blow in a scene that owns its hits, nor a vfx key on a figure, nor a spell landing, and sends no shot', async () => {
    const stage = stageWith(slotsFor(true));
    await stage.add(girl);
    await stage.vfx.impact('yuna', { element: 'none' });
    await stage.vfx.impact('yuna', { element: 'fire', crit: true });
    await stage.vfx.play('slash', 'yuna');
    expect(played.flash).not.toHaveBeenCalled();
    expect(played.sparks).not.toHaveBeenCalled();
    expect(played.slash).not.toHaveBeenCalled();
    expect(stage.vfx.land?.('yuna', { abilityId: 'x2-valefor-energy-blast', hitIndex: 0, action: 1 })).toBe(0);
    expect(stage.vfx.canTravel?.('x2-valefor-energy-ray', 'x2-valefor')).toBe(false);
    expect(stage.vfx.travel?.('x2-valefor', 'yuna', { kind: 'orb', ms: 480 }).ms).toBe(0);
  });
});

describe('the Wind Waker scene-table row', () => {
  it('declares ownImpacts on its slots (the factory build itself is pinned in own-grade.test.ts, through loadScene)', () => {
    expect(EXP_WINDWAKER_SLOTS.ownImpacts).toBe(true);
    expect(impactsOwned(EXP_WINDWAKER_SLOTS)).toBe(true);
  });
});
