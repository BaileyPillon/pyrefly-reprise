// @vitest-environment jsdom
/**
 * **The hidden 3D Bahamut chapter's scene, built for real** (`src/scenes/exp-yrp-3d-stage.ts`; FFX-2 only): Chapter IV's chamber restaged under frame A, with the toon skin on its actors.
 *
 * `loadScene` runs the real `SceneFactory` and the real `fromSceneBuild` under jsdom (a no-op 2D context, an art manifest that lists no backdrops so the loader goes straight to the placeholder plate, and a `fetch` that
 * answers 404 so every model file is missing and each slot stands on its neutral capsule), and the test reads what the battle stage is handed. What it pins:
 *
 * 1. **The staging reaches the stage**: the party's slots and Bahamut's pin are frame A's, the heights, the facing (party toward -x, Bahamut toward +x), `holdParty`, and the shot director that takes Mega Flare.
 * 2. **The rigs**: every name the presenter and the scripts ask for, plus the overdrive; the battle opens on `idle`.
 * 3. **It is Chapter IV's room otherwise**: the same palette and the same plate; the light pools stand at the new spots; two toon lights are added and cast no shadow; Chapter IV's own scene is untouched.
 * 4. **The skin**: with no model file every slot is a capsule (the chapter always plays in frame A); `?yrp=painted` keeps the figures painted and builds no skin; `dispose` frees the skin and the debug handle.
 *
 * What the scene looks like is not under test here (the browser pass is).
 */
import { DirectionalLight, PerspectiveCamera, type Object3D } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { YRP_SHOT_DIRECTOR } from '../../../src/engine/yrp3d/director.ts';
import { BOSS_HEIGHT, BOSS_SPOT, ENEMY_SLOTS, PARTY_HEIGHT, PARTY_SLOTS, RIGS, YRP_CAST } from '../../../src/engine/yrp3d/layout.ts';
import { paintedForced } from '../../../src/scenes/exp-yrp-3d-stage.ts';
import { loadScene, type LoadedScene } from '../../../src/scenes/index.ts';

const loaded: LoadedScene[] = [];

async function stage(key: string): Promise<LoadedScene> {
  const scene = await loadScene(key, new PerspectiveCamera(34, 16 / 9, 0.1, 400));
  loaded.push(scene);
  return scene;
}

/** A 2D context that accepts every call (the scenes paint placeholder canvases; jsdom has no canvas): the shape `exp-fayth-scene.test.ts` uses. */
function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const pixels = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
  const stub: object = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : stub), apply: () => stub, set: () => true });
  return new Proxy({} as Record<string | symbol, unknown>, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'canvas') return canvas;
      if (prop === 'getImageData') return (_x: number, _y: number, w: number, h: number) => pixels(w, h);
      if (prop === 'createImageData') return (w: number, h: number) => pixels(w, h);
      if (prop === 'measureText') return () => ({ width: 10 });
      return () => stub;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return noopContext(this) as never;
  });
  setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
  vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
});

afterEach(() => {
  window.history.replaceState({}, '', '/');
  for (const scene of loaded.splice(0)) scene.dispose();
});

afterAll(() => {
  resetArtManifest();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const handle = (): { skin: { carrying: Record<string, string> }; models: { capsules: string[]; models: Map<string, unknown> } } | undefined =>
  (globalThis as { __yrp3d?: never }).__yrp3d;

describe('exp-yrp-3d-stage, built through loadScene', () => {
  it('publishes frame A\'s staging to the stage: the slots, the boss\'s pin and height, the facing, the held party and the director', async () => {
    const scene = await stage('exp-yrp-3d-stage');
    expect(scene.key).toBe('exp-yrp-3d-stage');
    expect(scene.placeholder).toBe(false);
    const s = scene.slots;
    expect(s.party).toEqual(PARTY_SLOTS.slice(0, 3).map((p) => [...p]));
    expect(s.enemy).toEqual(ENEMY_SLOTS.map((p) => [...p]));
    expect([s.partyHeight, s.enemyHeight]).toEqual([PARTY_HEIGHT, BOSS_HEIGHT]);
    expect(s.sideFacing).toEqual({ party: -1, enemy: 1 });
    expect(s.holdParty).toBe(true);
    expect(s.enemySpots).toEqual({ bahamut: [...BOSS_SPOT] });
    expect(s.figureHeights).toEqual({ bahamut: BOSS_HEIGHT });
    // the director is the tapped one (the skin hears the beats): all ten beats have a handler, and Mega Flare still takes the overdrive rig
    expect(Object.keys(s.shotDirector!).sort()).toEqual(['actionClose', 'actionOpen', 'battleStart', 'formChange', 'impact', 'overdriveEnd', 'overdriveStart', 'telegraph', 'turnStart', 'victory']);
    const moves: string[] = [];
    const ctx = {
      camera: { moveTo: (rig: string) => (moves.push(rig), Promise.resolve()), snapTo: (rig: string) => void moves.push(`snap:${rig}`) },
      speed: 'normal',
      skipping: false,
      ms: (n: number) => n,
      actor: { id: 'bahamut', side: 'enemy' },
      targets: [{ id: 'yuna', side: 'party' }],
      action: { kind: 'cast', abilityId: 'x2-bahamut-mega-flare' },
    };
    expect(await (s.shotDirector!.actionOpen as (c: unknown) => Promise<boolean>)(ctx)).toBe(true);
    expect(moves).toEqual(['overdrive']);
    expect(await (s.shotDirector!.actionOpen as (c: unknown) => Promise<boolean>)({ ...ctx, action: { kind: 'attack', abilityId: 'x2-bahamut-attack' } })).toBe(false);
    expect(moves).toEqual(['overdrive']);
    expect(() => scene.update(0.016)).not.toThrow();
  }, 60_000);

  it('publishes every rig the presenter and the scripts ask for, and opens on the idle', async () => {
    const scene = await stage('exp-yrp-3d-stage');
    expect([...scene.battleCamera.rigNames].sort()).toEqual(Object.keys(RIGS).sort());
    expect(scene.battleCamera.rigName).toBe('idle');
    const cam = scene.battleCamera.camera;
    scene.update(0.016);
    expect(cam.position.x).toBeCloseTo(RIGS['idle']!.position[0], 1);
    expect(cam.position.y).toBeCloseTo(RIGS['idle']!.position[1], 1);
    expect(cam.position.z).toBeCloseTo(RIGS['idle']!.position[2], 1);
  }, 60_000);

  it('is Chapter IV\'s room otherwise: the same palette and plate, Chapter IV\'s own scene untouched, and the light pools stand at the new spots', async () => {
    const yrp = await stage('exp-yrp-3d-stage');
    const four = await stage('bevelle-underground');
    expect(yrp.palette).toEqual(four.palette);
    expect(four.slots.sideFacing).toBeUndefined();
    expect(four.slots.shotDirector).toBeUndefined();
    expect('enemySpots' in four.slots).toBe(false);
    expect(four.battleCamera.rigName).toBe('idle');
    expect([...four.battleCamera.rigNames]).not.toContain('overdrive');
    const pools: Object3D[] = [];
    yrp.scene.traverse((o) => o.name === 'light-pool' && pools.push(o));
    expect(pools.length).toBeGreaterThanOrEqual(3);
    PARTY_SLOTS.slice(0, 3).forEach((p, i) => {
      expect(pools[i]!.position.x).toBeCloseTo(p[0], 6);
      expect(pools[i]!.position.z).toBeCloseTo(p[2] - 0.55, 6);
    });
    const boss = yrp.scene.getObjectByName('enemy-pool')!;
    expect([boss.position.x, boss.position.z]).toEqual([BOSS_SPOT[0], BOSS_SPOT[2]]);
    expect(yrp.scene.getObjectByName('enemy-reflection')!.position.z).toBeCloseTo(BOSS_SPOT[2] + 2.6, 6);
  }, 60_000);

  it('adds two toon lights, a key from the front left and a warm rim from behind, and neither casts a shadow', async () => {
    const scene = await stage('exp-yrp-3d-stage');
    const key = scene.scene.getObjectByName('yrp-toon-key') as DirectionalLight;
    const rim = scene.scene.getObjectByName('yrp-warm-rim') as DirectionalLight;
    for (const light of [key, rim]) {
      expect(light).toBeInstanceOf(DirectionalLight);
      expect(light.castShadow).toBe(false);
    }
    expect([key.position.x < 0, key.position.z > 0, key.position.y > 0]).toEqual([true, true, true]); // front left, above
    expect(rim.position.z).toBeLessThan(-5); // behind the figures
    expect(rim.color.r).toBeGreaterThan(rim.color.b); // the lamps' orange
    const chamberKey = scene.scene.getObjectByName('key') as DirectionalLight;
    expect(chamberKey.castShadow).toBe(true); // the chamber's own key still casts the models' shadows
  }, 60_000);

  it('with no model file on disk every slot stands on its neutral capsule, so the chapter always plays in frame A; dispose frees the skin and the debug handle', async () => {
    const scene = await stage('exp-yrp-3d-stage');
    const h = handle()!;
    expect(h).toBeDefined();
    expect([...h.models.models.keys()].sort()).toEqual([...YRP_CAST].sort());
    expect([...h.models.capsules].sort()).toEqual([...YRP_CAST].sort());
    scene.dispose();
    loaded.pop();
    expect(handle()).toBeUndefined();
  }, 60_000);

  it('?yrp=painted keeps every figure a painted billboard: no skin, no handle', async () => {
    window.history.replaceState({}, '', '/?yrp=painted');
    expect(paintedForced(window.location.search)).toBe(true);
    const scene = await stage('exp-yrp-3d-stage');
    expect(handle()).toBeUndefined();
    expect(scene.slots.shotDirector).toBe(YRP_SHOT_DIRECTOR); // no skin to tell the beats to: the plain director
    expect(scene.slots.sideFacing).toEqual({ party: -1, enemy: 1 }); // the staging and the camera are still frame A's
    expect(() => scene.update(0.016)).not.toThrow();
  }, 60_000);

  it('the query switch reads only yrp=painted', () => {
    expect([paintedForced(''), paintedForced('?yrp=painted'), paintedForced('?a=1&yrp=painted'), paintedForced('?yrp=3d'), paintedForced('?yrp=')]).toEqual([false, true, true, false, false]);
  });
});
