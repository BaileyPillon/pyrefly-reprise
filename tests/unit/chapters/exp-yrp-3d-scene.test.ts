// @vitest-environment jsdom
/**
 * **The hidden 3D Bahamut chapter's scene, built for real** (`src/scenes/exp-yrp-3d-stage.ts`; FFX-2 only): Chapter IV's chamber restaged under frame A, with the skin of real models on its actors (the real-models branch).
 *
 * `loadScene` runs the real `SceneFactory` and the real `fromSceneBuild` under jsdom (a no-op 2D context, an art manifest that lists no backdrops so the loader goes straight to the placeholder plate, and a `fetch` that
 * answers 404 so every model file is missing and each slot stands on its neutral capsule), and the test reads what the battle stage is handed. What it pins:
 *
 * 1. **The staging reaches the stage**: the party's slots and Bahamut's pin are frame A's, the heights, the facing (party toward -x, Bahamut toward +x), `holdParty`, and the shot director that takes Mega Flare.
 * 2. **The rigs**: every name the presenter and the scripts ask for, plus the overdrive; the battle opens on `idle`.
 * 3. **It is Chapter IV's room otherwise**: the light pools stand at the new spots; Chapter IV's own scene is untouched, its grade, deck and lights included.
 * 4. **The look**: the studio's lights (three suns and an ambient, on the figure layer) are added and none casts a shadow; the chamber's own key, fill, rim and ambient are down to the table's share; the wet floor replaces the deck,
 *    a contact shadow stands under each figure, the backdrop is on its layer, and the grade is the chapter's own, neutral and encoding.
 * 5. **The skin**: with no model file every slot is a capsule (the chapter always plays in frame A); `?yrp=painted` keeps the figures painted in Chapter IV's own room, lights and grade, and builds no skin; `dispose` frees the skin,
 *    the look, the lights and the debug handle.
 *
 * What the scene looks like is not under test here (the browser pass is).
 */
import { AmbientLight, DirectionalLight, PerspectiveCamera, type Light, type Mesh, type Object3D } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { YRP_SHOT_DIRECTOR } from '../../../src/engine/yrp3d/director.ts';
import { BOSS_HEIGHT, BOSS_SPOT, ENEMY_SLOTS, PARTY_HEIGHT, PARTY_SLOTS, RIGS, YRP_CAST } from '../../../src/engine/yrp3d/layout.ts';
import { LAYER, LOOK, frameALights } from '../../../src/engine/yrp3d/look.ts';
import { HIDDEN_DECK, YRP_PALETTE } from '../../../src/engine/yrp3d/stageLook.ts';
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
    // within the idle sway (0.055 m at a random phase: BattleCamera's `swayClock`), which a tolerance of 0.05 did not allow for (it failed about one run in ten)
    expect(Math.abs(cam.position.x - RIGS['idle']!.position[0])).toBeLessThan(0.1);
    expect(Math.abs(cam.position.y - RIGS['idle']!.position[1])).toBeLessThan(0.1);
    expect(Math.abs(cam.position.z - RIGS['idle']!.position[2])).toBeLessThan(0.1);
  }, 60_000);

  it('is Chapter IV\'s room otherwise: Chapter IV\'s own scene untouched (its grade, deck and lights included), and the light pools stand at the new spots', async () => {
    const yrp = await stage('exp-yrp-3d-stage');
    const four = await stage('bevelle-underground');
    expect(yrp.palette).not.toEqual(four.palette); // the look's own grade (below)
    expect(four.palette.name).toBe('bevelle-underground');
    expect(four.palette.exposure).toBe(1.26);
    expect(four.scene.getObjectByName('machina-deck')!.visible).toBe(true); // Chapter IV keeps its deck
    expect((four.scene.getObjectByName('key') as DirectionalLight).intensity).toBeGreaterThan(2); // and its own lights, at full
    expect(four.scene.getObjectByName('yrp-key')).toBeUndefined();
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

  it('adds the studio\'s light for the figures: three suns and a grey world, none casting a shadow, along the directions fixed from frame A and on the figure layer too', async () => {
    const scene = await stage('exp-yrp-3d-stage');
    const dir = frameALights().dir;
    for (const name of ['key', 'fill', 'rim'] as const) {
      const sun = scene.scene.getObjectByName(`yrp-${name}`) as DirectionalLight;
      expect(sun, name).toBeInstanceOf(DirectionalLight);
      expect(sun.castShadow).toBe(false);
      expect(sun.intensity).toBe(LOOK.rig[name].intensity);
      expect(sun.layers.isEnabled(LAYER.figure)).toBe(true);
      const toward = sun.position.clone().sub(sun.target.position).normalize();
      expect(toward.x).toBeCloseTo(dir[name][0], 9);
      expect(toward.z).toBeCloseTo(dir[name][2], 9);
    }
    const ambient = scene.scene.getObjectByName('yrp-ambient') as AmbientLight;
    expect(ambient).toBeInstanceOf(AmbientLight);
    expect(ambient.intensity).toBeCloseTo(LOOK.rig.ambient.intensity, 9);
    for (const old of ['yrp-warm-rim', 'yrp-toon-key']) expect(scene.scene.getObjectByName(old), old).toBeUndefined();
  }, 60_000);

  it('takes the chamber\'s own key, fill, rim and ambient down to the table\'s share, so the cyan and the cold no longer swamp the figures, and the key casts no shadow map', async () => {
    const scene = await stage('exp-yrp-3d-stage');
    const four = await stage('bevelle-underground');
    const own = (s: LoadedScene, name: string): Light => s.scene.getObjectByName(name) as Light;
    const names = ['key', 'fill', 'rim'] as const;
    const shares = [LOOK.room.key, LOOK.room.fill, LOOK.room.rim];
    names.forEach((n, i) => {
      expect(own(four, n).intensity, `Chapter IV's ${n}`).toBeGreaterThan(0.8);
      expect(own(scene, n).intensity, n).toBeCloseTo(own(four, n).intensity * shares[i]!, 9);
    });
    expect((own(scene, 'key') as DirectionalLight).castShadow).toBe(false); // the deck that received it is hidden
    expect((own(four, 'key') as DirectionalLight).castShadow).toBe(true);
    // the lamps keep their flicker, at the table's share
    scene.update(0.016);
    four.update(0.016);
    const lamps = (s: LoadedScene): number[] => {
      const out: number[] = [];
      s.scene.traverse((o) => o.name === 'practical-rust' && out.push((o as Light).intensity));
      return out;
    };
    const mine = lamps(scene);
    const theirs = lamps(four);
    expect(mine).toHaveLength(4);
    mine.forEach((v, i) => expect(v / theirs[i]!, `lamp ${i}`).toBeCloseTo(LOOK.room.practicals, 1));
  }, 60_000);

  it('gives the stage the look: the wet floor in place of the deck, a contact shadow under each figure, the backdrop on its layer', async () => {
    const scene = await stage('exp-yrp-3d-stage');
    const floor = scene.scene.getObjectByName('yrp-wet-floor') as Mesh;
    expect(floor).toBeDefined();
    expect(floor.renderOrder).toBe(-50); // where the deck drew
    for (const name of HIDDEN_DECK) expect(scene.scene.getObjectByName(name)!.visible, name).toBe(false);
    for (const id of YRP_CAST) expect(scene.scene.getObjectByName(`yrp-contact-${id}`), id).toBeDefined();
    expect(scene.scene.getObjectByName('yrp-ink')).toBeUndefined(); // the toon ink is not part of this branch
    const backdrop = scene.scene.getObjectByName('backdrop')!;
    let meshes = 0;
    backdrop.traverse((o) => {
      if ((o as Mesh).isMesh) {
        meshes++;
        expect(o.layers.isEnabled(LAYER.backdrop), `${o.name || 'backdrop mesh'} is on the backdrop layer`).toBe(true);
        expect(o.layers.isEnabled(0)).toBe(true);
      }
    });
    expect(meshes).toBeGreaterThan(0);
    expect(floor.layers.isEnabled(LAYER.backdrop)).toBe(false); // the floor is not part of its own streaks
  }, 60_000);

  it('grades with the chapter\'s own palette: neutral and encoding (gamma 2.2), no lift, no split tone, no tilt-shift, a faint bloom', async () => {
    const scene = await stage('exp-yrp-3d-stage');
    expect(scene.palette).toEqual(YRP_PALETTE);
    expect(YRP_PALETTE.gamma).toEqual([2.2, 2.2, 2.2]);
    expect(YRP_PALETTE.lift).toEqual([0, 0, 0]);
    expect(YRP_PALETTE.gain).toEqual([1, 1, 1]);
    expect([YRP_PALETTE.saturation, YRP_PALETTE.shadowTintAmount, YRP_PALETTE.tiltMaxBlur]).toEqual([1, 0, 0]);
    expect(YRP_PALETTE.bloomStrength!).toBeLessThan(0.3);
    expect(YRP_PALETTE.vignette!).toBeLessThan(0.2);
  }, 60_000);

  it('with no model file on disk every slot stands on its neutral capsule, so the chapter always plays in frame A; dispose frees the skin and the debug handle', async () => {
    const scene = await stage('exp-yrp-3d-stage');
    const h = handle()!;
    expect(h).toBeDefined();
    expect([...h.models.models.keys()].sort()).toEqual([...YRP_CAST].sort());
    expect([...h.models.capsules].sort()).toEqual([...YRP_CAST].sort());
    const group = scene.scene;
    scene.dispose();
    loaded.pop();
    expect(handle()).toBeUndefined();
    for (const name of ['yrp-wet-floor', 'yrp-contact-yuna', 'yrp-key', 'yrp-fill', 'yrp-rim', 'yrp-ambient']) expect(group.getObjectByName(name), name).toBeUndefined(); // the look left with the scene
  }, 60_000);

  it('?yrp=painted keeps every figure a painted billboard: no skin, no handle', async () => {
    window.history.replaceState({}, '', '/?yrp=painted');
    expect(paintedForced(window.location.search)).toBe(true);
    const scene = await stage('exp-yrp-3d-stage');
    expect(handle()).toBeUndefined();
    expect(scene.slots.shotDirector).toBe(YRP_SHOT_DIRECTOR); // no skin to tell the beats to: the plain director
    expect(scene.slots.sideFacing).toEqual({ party: -1, enemy: 1 }); // the staging and the camera are still frame A's
    expect(scene.palette.name).toBe('bevelle-underground'); // Chapter IV's own room, grade and all
    expect(scene.scene.getObjectByName('machina-deck')!.visible).toBe(true);
    expect(scene.scene.getObjectByName('yrp-wet-floor')).toBeUndefined();
    expect(scene.scene.getObjectByName('yrp-key')).toBeUndefined(); // no studio light for a painted billboard
    expect((scene.scene.getObjectByName('key') as DirectionalLight).intensity).toBeGreaterThan(2); // the chamber's own lights, at full
    expect(() => scene.update(0.016)).not.toThrow();
  }, 60_000);

  it('the query switch reads only yrp=painted', () => {
    expect([paintedForced(''), paintedForced('?yrp=painted'), paintedForced('?a=1&yrp=painted'), paintedForced('?yrp=3d'), paintedForced('?yrp=')]).toEqual([false, true, true, false, false]);
  });
});
