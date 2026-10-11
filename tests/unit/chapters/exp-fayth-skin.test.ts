// @vitest-environment jsdom
/**
 * **The hidden Fayth chapter's skins on its scene** (`src/scenes/exp-fayth-deck.ts` and `exp-fayth-skin.ts`; FFX only; dev server only). The deck factory is run for real under jsdom (a no-op 2D context and
 * an art manifest that lists no backdrops: the shape of `exp-fayth-scene.test.ts`), once per case, and what it hands the battle is read. What this file pins:
 *
 * 1. **No manifest, no skin: exactly phase 1.** With nothing behind the dev route (a 404, as for every test, the website and a dev server without the folder) the factory returns the build as Chapter VIII's
 *    deck made it: its own `RIGS` object, its slots and pins, no `bindCamera`, the director on its painted staging. A manifest that is found but whose files all fail to load changes nothing either.
 *    `?skin=classic` forces the same even with the folder there, and does not ask for the manifest.
 * 2. **`?skin=painted` is the painted skin at FFX's staging**: the party's slots and Evrae's pin at FFX's numbers through the one transform, the bodies turned toward each other, the camera rigs FFX's NEAR
 *    and FAR default views, the range director staged with the same spots and rigs, the deck and the sky plate laid under and behind the party. **Chapter VIII's tables are never written**: its `RIGS`, its
 *    `RANGE_STAGING` and its slot arrays are the numbers they were (the scene is a derived build; the base's getters stay getters).
 * 3. **The `ffx` skin** (a found manifest, the models stood in by fakes): the painted deck, sky plate, light pools and grit are hidden, the stage is added with only the deck (mirrored) and the sky (brightened
 *    and on the camera) drawn, the grade is neutral, and `dispose` frees the models.
 *
 * Game case: FFX only.
 */
import { Group, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Vector3, BufferGeometry } from 'three';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { FFX_EVRAE_SPOTS, FFX_PARTY_SLOTS, FFX_SKY_GAIN } from '../../../src/engine/ffx3d/ffxStaging.ts';
import { ffxPointTuple, ffxRig } from '../../../src/engine/ffx3d/ffxWorld.ts';
import { FFX_NEAR_VIEW, FFX_FAR_VIEW } from '../../../src/engine/ffx3d/ffxStaging.ts';
import type { FfxModels } from '../../../src/engine/ffx3d/models.ts';
import { EVRAE_AIRSHIP_DECK_RIGS, EVRAE_AIRSHIP_DECK_SLOTS, buildEvraeAirshipDeckScene } from '../../../src/scenes/evrae-airship-deck.ts';
import { airshipRangeDirectorOf } from '../../../src/scenes/evrae-airship-director.ts';
import { RANGE_STAGING } from '../../../src/scenes/evrae-airship-range.ts';
import { buildExpFaythDeckScene } from '../../../src/scenes/exp-fayth-deck.ts';
import { animParam, faythRigs, listenerOf, skinParam } from '../../../src/scenes/exp-fayth-skin.ts';
import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import type { FfxAnimator } from '../../../src/engine/ffx3d/ffxAnimator.ts';
import { loadScene } from '../../../src/scenes/index.ts';
import type { SceneBuild } from '../../../src/scenes/types.ts';

// The models and the probe are stood in for where a case needs them; every other case runs with fetch answering 404 (no folder).
const fake = vi.hoisted(() => ({ models: null as unknown, loads: 0 }));
vi.mock('../../../src/engine/ffx3d/models.ts', async (orig) => ({
  ...(await orig<typeof import('../../../src/engine/ffx3d/models.ts')>()),
  loadFfxModels: vi.fn(async () => {
    fake.loads++;
    return fake.models;
  }),
}));

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

const MANIFEST = { version: 1, encounter: 'evrae-airship', upAxis: 'y', units: 'ffx', stage: { file: 'evrae/stage.glb' }, actors: { tidus: { file: 'evrae/tidus.glb', rawHeight: 18.1 } }, source: 'test' };
let fetched: string[] = [];
const serve = (found: boolean): void => {
  vi.stubGlobal('fetch', async (url: string) => {
    fetched.push(String(url));
    return found && String(url).endsWith('manifest.json') ? new Response(JSON.stringify(MANIFEST), { status: 200 }) : new Response(null, { status: 404 });
  });
};

const builds: SceneBuild[] = [];
async function build(): Promise<SceneBuild> {
  const b = await buildExpFaythDeckScene();
  builds.push(b);
  return b;
}
const query = (q: string): void => window.history.replaceState({}, '', `/${q}`);

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return noopContext(this) as never;
  });
  setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
});

beforeEach(() => {
  fetched = [];
  fake.models = null;
  fake.loads = 0;
  query('');
  serve(false);
});

afterEach(() => {
  query('');
  vi.unstubAllGlobals();
});

afterAll(() => {
  for (const b of builds) b.dispose();
  resetArtManifest();
  vi.restoreAllMocks();
});

const near = (got: readonly number[], want: readonly number[], digits = 5): void => want.forEach((w, i) => expect(got[i], `component ${i}`).toBeCloseTo(w, digits));

describe('no manifest, no skin: phase 1 exactly', () => {
  it('returns Chapter VIII\'s build as it was made: its own rigs object, its slots and pins, no camera hook, the director on its painted staging', async () => {
    const b = await build();
    expect(b.rigs).toBe(EVRAE_AIRSHIP_DECK_RIGS); // the very object: nothing was derived
    expect(b.partySlots.slice(0, 3).map((v) => v.toArray())).toEqual(EVRAE_AIRSHIP_DECK_SLOTS.party);
    expect(b.enemySlots.map((v) => v.toArray())).toEqual(EVRAE_AIRSHIP_DECK_SLOTS.enemy);
    expect(b.enemySpots).toEqual(EVRAE_AIRSHIP_DECK_SLOTS.enemySpots);
    expect(b.holdParty).toBe(true);
    expect(b.sideFacing).toBeUndefined();
    expect(b.bindCamera).toBeUndefined();
    expect(airshipRangeDirectorOf(b.group)!.staging).toBeNull();
    expect(b.group.getObjectByName('ffx-stage')).toBeUndefined();
    expect(b.palette.name).toBe('evrae-airship-deck');
    expect(fetched).toEqual(['/__ffx-local/manifest.json']); // it asked once, for the manifest
    expect(fake.loads).toBe(0);
    // Chapter VIII's own deck is the same build, with no probe at all
    const eight = await buildEvraeAirshipDeckScene();
    builds.push(eight);
    expect(eight.rigs).toBe(EVRAE_AIRSHIP_DECK_RIGS);
    expect(Object.keys(b).filter((k) => !(k in eight))).toEqual(['shotDirector']); // the one thing phase 1 added: the stub director
    expect(Object.keys(eight).filter((k) => !(k in b))).toEqual([]);
  }, 60_000);

  it('a manifest that is found but whose files all fail to load changes nothing', async () => {
    serve(true);
    fake.models = { stage: null, actors: {}, problems: ['stage: 404', 'tidus: 404'], dispose: () => {} } satisfies FfxModels;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const b = await build();
    expect(fake.loads).toBe(1);
    expect(b.rigs).toBe(EVRAE_AIRSHIP_DECK_RIGS);
    expect(b.bindCamera).toBeUndefined();
    expect(warn).toHaveBeenCalledWith('[ffx-local] stage: 404');
    warn.mockRestore();
  }, 60_000);

  it('?skin=classic forces it with the folder there, and never asks for the manifest', async () => {
    serve(true);
    query('?skin=classic');
    const b = await build();
    expect(b.rigs).toBe(EVRAE_AIRSHIP_DECK_RIGS);
    expect(fetched).toEqual([]);
    expect(fake.loads).toBe(0);
  }, 60_000);

  it('reads the query: painted, classic, or nothing', () => {
    expect(skinParam('?skin=painted')).toBe('painted');
    expect(skinParam('?x=1&skin=classic')).toBe('classic');
    expect(skinParam('?skin=ffx')).toBeNull();
    expect(skinParam('?skin=')).toBeNull();
    expect(skinParam('')).toBeNull();
  });

  it('reads the switch for the motions: off, or nothing', () => {
    expect(animParam('?ffxanim=off')).toBe('off');
    expect(animParam('?skin=painted&ffxanim=off')).toBe('off');
    expect(animParam('?ffxanim=on')).toBeNull();
    expect(animParam('?ffxanim=')).toBeNull();
    expect(animParam('')).toBeNull();
  });

  it('tells the animator the beats it wants: the action opening (who, which ability, the painted pose, the apex of the lunge as the lead), a blow, the close', () => {
    const calls: Array<[string, ...unknown[]]> = [];
    const animator = {
      noteOpen: (id: string, info: unknown) => calls.push(['open', id, info]),
      noteImpact: (id: string) => calls.push(['impact', id]),
      noteClose: (id: string) => calls.push(['close', id]),
    } as unknown as FfxAnimator;
    const listener = listenerOf(animator);
    const ms = (base: number): number => base * 1.2; // the pacing option stretches the presenter's waits
    listener.open!('actionOpen', { ms, actor: { id: 'evrae', side: 'enemy' }, targets: [], action: { kind: 'cast', abilityId: 'evrae-poison-breath' } } as never);
    listener.impact!('impact', { actor: { id: 'evrae', side: 'enemy' }, target: { id: 'tidus', side: 'party' } } as never);
    listener.impact!('impact', { target: { id: 'tidus', side: 'party' } } as never); // a blow with no known actor is not told
    listener.close!('actionClose', { actor: { id: 'evrae', side: 'enemy' } } as never);
    listener.close!('actionClose', {} as never);
    expect(calls).toHaveLength(3);
    expect(calls[0]![0]).toBe('open');
    expect(calls[0]![1]).toBe('evrae');
    const info = calls[0]![2] as { abilityId: string; kind: string; lead: number };
    expect([info.abilityId, info.kind]).toEqual(['evrae-poison-breath', 'cast']);
    expect(info.lead).toBeCloseTo((440 * ATTACK_IMPACT * 1.2) / 1000, 12); // 440 ms of lunge to its apex, at the live speed, in seconds
    expect(calls[1]).toEqual(['impact', 'evrae']);
    expect(calls[2]).toEqual(['close', 'evrae']);
  });
});

describe('?skin=painted: the painted skin at FFX\'s staging', () => {
  it('stands the party and Evrae at FFX\'s points, turns the bodies toward each other, and stages the range director with the same numbers', async () => {
    query('?skin=painted');
    const b = await build();
    expect(fetched).toEqual(['/__ffx-local/camera/evrae/index.json']); // a comparison mode: no manifest needed, only the camera folder is asked for (a 404 here: the stub stays)
    for (let i = 0; i < 3; i++) near(b.partySlots[i]!.toArray(), ffxPointTuple(FFX_PARTY_SLOTS[i]!), 12);
    expect(b.partySlots).toHaveLength(7); // three active, four reserve
    near(b.partySlots[0]!.toArray(), [-2.41047, 3.37466, -11.57025]);
    near(b.enemySpots!['evrae']!, [-13.49862, 3.37466, -7.7135]);
    near(b.enemySpots!['cid']!, b.enemySpots!['evrae']!);
    expect(b.holdParty).toBe(true); // Chapter VIII's, inherited
    expect(b.sideFacing).toEqual({ party: -1, enemy: 1 });
    expect(b.palette.name).toBe('evrae-airship-deck'); // the painted grade stays: this is the painted look at FFX's positions

    const director = airshipRangeDirectorOf(b.group)!;
    near(director.staging!.near.evrae, ffxPointTuple(FFX_EVRAE_SPOTS.near), 12);
    near(director.staging!.far.evrae, ffxPointTuple(FFX_EVRAE_SPOTS.far), 12);
    near(director.staging!.near.rigs.idle.position, ffxRig(FFX_NEAR_VIEW).position, 12);
    near(director.staging!.far.rigs.enemy.lookAt, ffxRig(FFX_FAR_VIEW).lookAt, 12);
  }, 60_000);

  it('publishes FFX\'s NEAR default view under every near rig name and the FAR default under the -far names, plus an overview', async () => {
    query('?skin=painted');
    const b = await build();
    const nearRig = ffxRig(FFX_NEAR_VIEW);
    for (const name of ['intro', 'idle', 'action', 'enemy', 'party', 'victory']) {
      const r = b.rigs[name as 'idle'];
      near(r.position as number[], nearRig.position, 12);
      near(r.lookAt as number[], nearRig.lookAt, 12);
      expect(r.fov, name).toBeCloseTo(26.3812, 4);
      expect(r.sway, name).toBe(0);
    }
    const farRig = ffxRig(FFX_FAR_VIEW);
    for (const name of ['idle-far', 'action-far', 'enemy-far']) near((b.rigs as Record<string, { position: number[] }>)[name]!.position, farRig.position, 12);
    expect((b.rigs as Record<string, unknown>)['overview']).toBeDefined();
    // the rigs the scene hands over are a fresh object; the factory's own are untouched
    expect(b.rigs).not.toBe(EVRAE_AIRSHIP_DECK_RIGS);
  }, 60_000);

  it('through loadScene the camera starts on FFX\'s NEAR default view at the lens of 26.38 degrees', async () => {
    query('?skin=painted');
    const scene = await loadScene('exp-fayth-deck', new PerspectiveCamera(34, 16 / 9, 0.1, 400));
    builds.push({ dispose: () => scene.dispose() } as unknown as SceneBuild);
    scene.update(0.016);
    expect(scene.battleCamera.rigName).toBe('idle');
    near(scene.battleCamera.camera.position.toArray(), [-9.25309, 13.12182, -32.16921]);
    expect(scene.battleCamera.camera.fov).toBeCloseTo(26.3812, 4);
    near(scene.slots.party[0]!, [-2.41047, 3.37466, -11.57025]);
    expect(scene.slots.sideFacing).toEqual({ party: -1, enemy: 1 });
  }, 60_000);

  it('never writes Chapter VIII\'s tables: its rigs, its range staging and its slots are the numbers they were', async () => {
    const idleBefore = [...EVRAE_AIRSHIP_DECK_RIGS['idle']!.position as number[]];
    const evraeBefore = [...RANGE_STAGING.near.evrae];
    const nearIdleBefore = [...RANGE_STAGING.near.rigs.idle.position];
    const slotsBefore = JSON.stringify(EVRAE_AIRSHIP_DECK_SLOTS);
    query('?skin=painted');
    const b = await build();
    (b.rigs as Record<string, { position: number[] }>)['idle']!.position[0] = 999; // a scene may edit its own rigs
    b.partySlots[0]!.x = 999;
    expect(EVRAE_AIRSHIP_DECK_RIGS['idle']!.position).toEqual(idleBefore);
    expect(RANGE_STAGING.near.evrae).toEqual(evraeBefore);
    expect(RANGE_STAGING.near.rigs.idle.position).toEqual(nearIdleBefore);
    expect(JSON.stringify(EVRAE_AIRSHIP_DECK_SLOTS)).toBe(slotsBefore);
    query('');
    const plain = await build();
    expect(plain.rigs).toBe(EVRAE_AIRSHIP_DECK_RIGS);
    expect(airshipRangeDirectorOf(plain.group)!.staging).toBeNull(); // a Chapter VIII scene built after it is untouched
  }, 60_000);

  it('lays the deck a quarter turn under the party\'s column on Evrae\'s side, the sky plate behind them facing the camera, and hides the grit and the painted air', async () => {
    query('?skin=painted');
    const b = await build();
    const deck = b.group.getObjectByName('airship-deck')!;
    expect(deck.rotation.y).toBeCloseTo(Math.PI / 2, 12);
    near(deck.position.toArray(), [-2.41047 + 0.5, 3.37466, (-11.57025 - 7.7135 - 3.85675) / 3], 4); // the nearest slot's x + 0.5, the floor the party stands on, the column's middle z
    let painted = 0;
    deck.traverse((o) => {
      if (o instanceof Mesh && o.renderOrder < 0) {
        painted++;
        expect(o.visible).toBe(false); // the cloud sheets and the haze belong to the other camera
      }
    });
    expect(painted).toBeGreaterThan(0);
    for (const p of b.particles) expect(p.visible).toBe(false);
    const sky = b.group.getObjectByName('sky-roll')!;
    expect(sky.scale.x).toBeCloseTo(1.8, 12);
    const eye = new Vector3(...ffxRig(FFX_NEAR_VIEW).position);
    expect(sky.position.distanceTo(eye)).toBeCloseTo(80, 6); // 80 units down the camera's view line
    const meshes = b.group.children.filter((c): c is Mesh => c instanceof Mesh);
    expect(meshes).toHaveLength(3); // the light pools, now under the party's feet
    near(meshes[0]!.position.toArray(), [-2.41047, 3.37466 + 0.02, -11.57025]);
  }, 60_000);

  it('keeps the base build\'s getters as getters (the backdrop a hot swap replaces is still read live) and runs its update and dispose', async () => {
    query('?skin=painted');
    const b = await build();
    expect(typeof Object.getOwnPropertyDescriptor(b, 'backdrop')?.get).toBe('function');
    expect(b.backdrop).toBe(b.backdrop);
    expect(() => b.update(0.016)).not.toThrow();
    const group = b.group;
    expect(() => b.dispose()).not.toThrow();
    expect(group.parent).toBeNull();
  }, 60_000);
});

describe('the ffx skin (a found manifest; the models stood in)', () => {
  /** A stage shaped like the converter's, a sky node, and one actor; with the spies the case needs. */
  function standIn(): { models: FfxModels; dispose: ReturnType<typeof vi.fn>; stageRoot: Group; sky: Object3D; bowl: Mesh; deck: Mesh; other: Mesh } {
    const stageRoot = new Group();
    stageRoot.name = 'ffx-stage';
    const sky = new Object3D();
    sky.name = 'sky';
    const mesh = (name: string): Mesh => Object.assign(new Mesh(new BufferGeometry(), new MeshBasicMaterial()), { name });
    const deck = mesh('polySurfaceShape5_1');
    const other = mesh('FBXASC050_0Shape_4');
    const bowl = mesh('FBXASC0490_0Shape');
    sky.add(bowl);
    stageRoot.add(deck, other, sky);
    const dispose = vi.fn();
    return { models: { stage: { root: stageRoot, sky, background: null, dispose: () => {} }, actors: {}, problems: [], dispose }, dispose, stageRoot, sky, bowl, deck, other };
  }

  it('hides the painted deck, sky plate, light pools and grit, adds the stage with only the deck (mirrored) and the sky drawn (the file colours brightened when there is no exported sky), and grades neutrally', async () => {
    serve(true);
    const s = standIn();
    fake.models = s.models;
    const b = await build();
    expect(fake.loads).toBe(1);
    expect(b.group.getObjectByName('airship-deck')!.visible).toBe(false);
    expect(b.group.getObjectByName('sky-roll')!.visible).toBe(false);
    for (const p of b.group.children.filter((c): c is Mesh => c instanceof Mesh && c !== s.deck && c !== s.other)) expect(p.visible).toBe(false); // the pools
    for (const p of b.particles) expect(p.visible).toBe(false);

    expect(s.stageRoot.parent).toBe(b.group);
    expect(s.deck.visible).toBe(true);
    expect(s.deck.scale.y).toBe(-1);
    expect(s.other.visible).toBe(false);
    expect(s.bowl.visible).toBe(true);
    expect((s.bowl.material as MeshBasicMaterial).color.r).toBeCloseTo(FFX_SKY_GAIN, 12);
    expect(s.sky.scale.x).toBe(0.5);

    expect(b.palette.name).toBe('fayth-ffx');
    expect(b.palette.tiltMaxBlur).toBe(0);
    expect(b.palette.vignette).toBe(0);
    near(b.partySlots[0]!.toArray(), [-2.41047, 3.37466, -11.57025]);
    expect(b.sideFacing).toEqual({ party: -1, enemy: 1 });
    expect(b.bindCamera).toBeTypeOf('function');
    expect(airshipRangeDirectorOf(b.group)!.staging).not.toBeNull();
  }, 60_000);

  it('rides the sky bowl on the camera once the camera is bound, and frees the models on dispose', async () => {
    serve(true);
    const s = standIn();
    fake.models = s.models;
    const b = await build();
    const camera = new PerspectiveCamera(26.38, 16 / 9, 0.1, 400);
    camera.position.set(-9.5, 13.5, -33.4);
    camera.updateMatrixWorld(true);
    b.bindCamera!({ camera } as never);
    const scene = new Group(); // the stage root is under the build's group, which a real scene mounts at the origin
    scene.add(b.group);
    scene.updateMatrixWorld(true);
    b.update(0.016);
    s.sky.parent!.updateMatrixWorld(true);
    const world = s.sky.getWorldPosition(new Vector3());
    near(world.toArray(), [-9.5, 13.5, -33.4], 9); // on the camera
    b.dispose();
    expect(s.dispose).toHaveBeenCalledTimes(1);
  }, 60_000);

  it('builds the rigs from the two default views with a fresh object each time', () => {
    const a = faythRigs({ views: { near: ffxRig(FFX_NEAR_VIEW), far: ffxRig(FFX_FAR_VIEW) }, overview: ffxRig(FFX_NEAR_VIEW) } as never);
    const c = faythRigs({ views: { near: ffxRig(FFX_NEAR_VIEW), far: ffxRig(FFX_FAR_VIEW) }, overview: ffxRig(FFX_NEAR_VIEW) } as never);
    expect(Object.keys(a).sort()).toEqual(['action', 'action-far', 'enemy', 'enemy-far', 'idle', 'idle-far', 'intro', 'overview', 'party', 'victory']);
    expect(a['idle']).not.toBe(c['idle']);
    expect(a['idle']!.position).not.toBe(a['intro']!.position);
  });
});
