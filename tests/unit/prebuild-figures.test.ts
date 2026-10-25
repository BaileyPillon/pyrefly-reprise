/**
 * LANE "PREBUILD" (2026-10-24; both games: Chapter I is FFX, Chapter IV is FFX-2; the conference demo only, `?demo=1&pack=demo`, off with `?prebuild=off`).
 *
 * The demo's fights have their figures built behind the title and the picker (`app/demo/prebuildFigures.ts`), parked (`engine/FigureCache.ts`) under the fingerprint of the question `PaintedStage.add`
 * asks (`engine/StageFigureRequest.ts`), and taken by `add` instead of being built at the battle's entry. This pins the parts that are logic and not GPU:
 *
 *  1. the switch: on with the pack, `?prebuild=off` is r63-play, `?prebuild=on` without the pack, nothing outside demo mode;
 *  2. the cache: a figure is taken once, only for the question it answers, never for another scope; an unanswered figure is disposed; nothing is held after a drop;
 *  3. the question: equal inputs give equal fingerprints; a height, a side or the rig switch that differs gives another; functions are left out;
 *  4. `PaintedStage.add` takes a parked figure and does not build one; a parked figure for another question is disposed and the figure is built as it always was;
 *  5. which combatants the prebuild stages (the same selection as `PaintedStage.stage`);
 *  6. the GPU half's contract: paintings go up idle first, one `initTexture` each; a figure is in the scene only inside one synchronous draw and everything else is hidden for it; a stop mid-way leaves
 *     nothing in the scene and marks nothing warmed.
 */

import { Group, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Scene, Texture } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const created: Array<Record<string, unknown>> = [];
const disposed: string[] = [];

vi.mock('../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      created.push(o);
      const f = new Object3D() as Object3D & Record<string, unknown>;
      f.name = String(o['name']);
      f['setPose'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => void disposed.push(`built:${String(o['name'])}`);
      return f;
    }),
  },
}));
vi.mock('../../src/engine/VFX.ts', () => ({ HitEffects: class extends Group {} }));
vi.mock('../../src/engine/BattlePresenterArt.ts', async (orig) => ({
  ...(await orig<typeof import('../../src/engine/BattlePresenterArt.ts')>()),
  resolveArt: vi.fn(async (ids: string[]) => ({ artId: ids[0], poses: {} })),
}));

const { PaintedStage } = await import('../../src/engine/BattlePresenterStage.ts');
const { BattleCamera } = await import('../../src/engine/BattleCamera.ts');
const { figureSpec, figureKind } = await import('../../src/engine/StageFigureRequest.ts');
const cache = await import('../../src/engine/FigureCache.ts');
const { groundLumaOf } = await import('../../src/engine/ContactShadow.ts');
const { CAVERN_STOLEN_FAYTH_SLOTS } = await import('../../src/scenes/cavern-stolen-fayth.ts');
const { prebuildFromSearch } = await import('../../src/app/demo/prebuildSwitch.ts');
const { stageableCombatants } = await import('../../src/app/demo/prebuildFigures.ts');
const { uploadFigure, drawFigures, isWarmed, newDrawStats } = await import('../../src/app/demo/prebuildDraw.ts');
const alpha = await import('../../src/engine/look/AlphaPrime.ts');
const { prebuildGate, setPrebuildGate } = await import('../../src/engine/PrebuildGate.ts');

type Fiend = Parameters<InstanceType<typeof PaintedStage>['add']>[0];
const fiend = (id: string, slot: number, side: 'enemy' | 'party' = 'enemy'): Fiend =>
  ({ id, side, slot, alive: true, spriteKey: id, flags: { isBoss: false } }) as unknown as Fiend;

function stageFor(scene: Scene, sceneKey?: string): InstanceType<typeof PaintedStage> {
  const cam = new PerspectiveCamera();
  return new PaintedStage({
    scene,
    camera: cam,
    battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
    slots: CAVERN_STOLEN_FAYTH_SLOTS,
    canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
    ...(sceneKey ? { sceneKey } : {}),
  });
}

const fakeFigure = (name: string): { actor: never; rig: null } => {
  const f = new Object3D() as Object3D & Record<string, unknown>;
  f.name = name;
  f['setPose'] = (): void => {};
  f['lieDown'] = async (): Promise<void> => {};
  f['dispose'] = (): void => void disposed.push(`parked:${name}`);
  return { actor: f as never, rig: null };
};

beforeEach(() => {
  created.length = 0;
  disposed.length = 0;
  cache.dropParked();
  disposed.length = 0;
});

describe('1. the switch', () => {
  it('is on with the pack, off with ?prebuild=off, on with ?prebuild=on alone', () => {
    expect(prebuildFromSearch('?demo=1&pack=demo')).toBe(true);
    expect(prebuildFromSearch('?demo=1&pack=demo&prebuild=off')).toBe(false);
    expect(prebuildFromSearch('?demo=1&pack=demo&prebuild=today')).toBe(false);
    expect(prebuildFromSearch('?demo=1&prebuild=on')).toBe(true);
    expect(prebuildFromSearch('?demo=1')).toBe(true); // r64 (item 200b): the conference pack is the default
    expect(prebuildFromSearch('')).toBe(true);
    expect(prebuildFromSearch('?demo=1&pack=off')).toBe(false); // the old behaviour stays reachable
    expect(prebuildFromSearch('?demo=1&pack=off&prebuild=on')).toBe(true);
    expect(prebuildFromSearch('?demo=1&prebuild=off')).toBe(false);
    expect(prebuildFromSearch(undefined)).toBe(false);
  });
});

describe('2. the cache', () => {
  it('hands a figure over once, for the question it answers', () => {
    cache.parkFigure('room', 'tidus', 'fp1', fakeFigure('tidus'));
    expect(cache.hasParked('room', 'tidus', 'fp1')).toBe(true);
    expect(cache.hasParked('room', 'tidus', 'other')).toBe(false);
    const got = cache.takeParkedFigure('room', 'tidus', 'fp1');
    expect(got?.actor.name).toBe('tidus');
    expect(cache.takeParkedFigure('room', 'tidus', 'fp1')).toBeNull();
    expect(disposed).toEqual([]);
  });

  it('disposes a figure parked for another question and offers nothing', () => {
    cache.parkFigure('room', 'tidus', 'fp1', fakeFigure('tidus'));
    expect(cache.takeParkedFigure('room', 'tidus', 'fp2')).toBeNull();
    expect(disposed).toEqual(['parked:tidus']);
    expect(cache.parkedSummary().count).toBe(0);
  });

  it('never offers a figure to another scope, and a stage with no scene key takes nothing', () => {
    cache.parkFigure('room-a', 'tidus', 'fp1', fakeFigure('tidus'));
    expect(cache.takeParkedFigure('room-b', 'tidus', 'fp1')).toBeNull();
    expect(cache.takeParkedFigure(undefined, 'tidus', 'fp1')).toBeNull();
    expect(cache.hasParked('room-a', 'tidus')).toBe(true);
  });

  it('parking again disposes the older figure; a drop frees one scope or all', () => {
    cache.parkFigure('a', 'x', 'f', fakeFigure('x1'));
    cache.parkFigure('a', 'x', 'f', fakeFigure('x2'));
    expect(disposed).toEqual(['parked:x1']);
    cache.parkFigure('b', 'y', 'f', fakeFigure('y1'));
    expect(cache.dropParked('a')).toBe(1);
    expect(cache.parkedSummary().ids).toEqual(['b:y']);
    expect(cache.dropParked()).toBe(1);
    expect(cache.parkedSummary().count).toBe(0);
  });
});

describe('3. the question a figure answers', () => {
  const env = { slots: CAVERN_STOLEN_FAYTH_SLOTS, rim: undefined, rigs: undefined, groundLuma: 0.3, game: undefined };
  const art = { artId: 'yojimbo', poses: { idle: '/art/characters/yojimbo/idle.png' } };

  it('is the same string for the same inputs and carries no functions', () => {
    const a = figureSpec(env, fiend('yojimbo', 0), art);
    const b = figureSpec(env, fiend('yojimbo', 0), art);
    expect(a.fingerprint).toBe(b.fingerprint);
    expect(a.fingerprint).not.toContain('=>');
    expect(a.fingerprint).not.toContain('function');
    expect(typeof a.request.opts.placeholder).toBe('function'); // the request keeps it; the fingerprint leaves it out
  });

  it('changes with a height, a side, the art and the rig switch', () => {
    const base = figureSpec(env, fiend('yojimbo', 0), art).fingerprint;
    expect(figureSpec(env, fiend('yojimbo', 0), art, 2.2).fingerprint).not.toBe(base);
    expect(figureSpec(env, fiend('yojimbo', 0, 'party'), art).fingerprint).not.toBe(base);
    expect(figureSpec(env, fiend('yojimbo', 0), { ...art, artId: 'yojimbo-2' }).fingerprint).not.toBe(base);
    expect(figureSpec({ ...env, rigs: () => false }, fiend('yojimbo', 0), art).fingerprint).not.toBe(base);
    expect(figureSpec({ ...env, groundLuma: 0.9 }, fiend('yojimbo', 0), art).fingerprint).not.toBe(base);
  });

  it('draws a combatant as a party figure unless it is an enemy', () => {
    expect(figureKind({ side: 'enemy' })).toBe('enemy');
    expect(figureKind({ side: 'party' })).toBe('party');
    expect(figureKind({ side: 'aeon' })).toBe('party');
  });
});

describe('4. PaintedStage.add takes a parked figure', () => {
  const askOf = async (scene: Scene, c: Fiend): Promise<string> => {
    const art = { artId: String((c as unknown as { spriteKey: string }).spriteKey), poses: {} };
    return figureSpec({ slots: CAVERN_STOLEN_FAYTH_SLOTS, rim: undefined, rigs: undefined, groundLuma: groundLumaOf(scene), game: undefined }, c, art).fingerprint;
  };

  it('uses the parked figure and builds nothing', async () => {
    const scene = new Scene();
    const c = fiend('yojimbo', 0);
    cache.parkFigure('room', 'yojimbo', await askOf(scene, c), fakeFigure('yojimbo'));
    const stage = stageFor(scene, 'room');
    const actor = await stage.add(c);
    expect(created).toHaveLength(0);
    expect(actor?.name).toBe('yojimbo');
    expect(stage.actor('yojimbo')).toBe(actor);
    expect(scene.children).toContain(actor);
    expect(cache.parkedSummary().count).toBe(0);
  });

  it('builds as it always did, and disposes the parked one, when the question differs', async () => {
    const scene = new Scene();
    const c = fiend('yojimbo', 0);
    cache.parkFigure('room', 'yojimbo', 'not-this-question', fakeFigure('yojimbo'));
    const stage = stageFor(scene, 'room');
    await stage.add(c);
    expect(created).toHaveLength(1);
    expect(disposed).toContain('parked:yojimbo');
  });

  it('builds as it always did with no scene key, and with nothing parked', async () => {
    const stage = stageFor(new Scene());
    await stage.add(fiend('a', 0));
    await stageFor(new Scene(), 'room').add(fiend('b', 0));
    expect(created.map((o) => o['name'])).toEqual(['a', 'b']);
  });
});

describe('5. which combatants the prebuild stages', () => {
  it('is the active party, the aeons, the enemies and the visible parts, never a hidden or removed one', () => {
    const mk = (id: string, flags: Record<string, unknown> = {}, removed = false): unknown => ({ id, flags, removed });
    const state = {
      activeIds: ['tidus', 'yuna'],
      aeonIds: ['ifrit'],
      enemyIds: ['boss', 'gone'],
      combatants: {
        tidus: mk('tidus'),
        yuna: mk('yuna'),
        wakka: mk('wakka'), // on the bench: not staged
        ifrit: mk('ifrit'),
        boss: mk('boss'),
        gone: mk('gone', {}, true),
        leg: mk('leg', { isPart: true }),
        arm: mk('arm', { isPart: true, hidden: true }),
      },
    };
    const ids = stageableCombatants(state as never).map((c) => c.id);
    expect(ids.sort()).toEqual(['boss', 'ifrit', 'leg', 'tidus', 'yuna']);
  });

  it('falls back to the single aeon id', () => {
    const state = { activeIds: ['tidus'], aeonId: 'valefor', enemyIds: [], combatants: { tidus: { id: 'tidus', flags: {} }, valefor: { id: 'valefor', flags: {} } } };
    expect(stageableCombatants(state as never).map((c) => c.id).sort()).toEqual(['tidus', 'valefor']);
  });
});

describe('6. the GPU half', () => {
  const tex = (name: string): Texture => {
    const t = new Texture();
    t.name = name;
    return t;
  };
  function fakeActor(name: string, textures: Texture[]): Object3D & { heldTextures(): Texture[] } {
    const g = new Group() as Group & { heldTextures(): Texture[] };
    g.name = name;
    g.heldTextures = () => textures;
    const m = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial());
    m.visible = false; // a plane that is not showing yet is a program the fight needs too
    m.name = `${name}-plane`;
    g.add(m);
    return g;
  }
  const pause = async (): Promise<void> => undefined;

  it('uploads the idle painting first and the rest after, one initTexture each, and stops when asked', async () => {
    const order: string[] = [];
    const r = { renderer: { initTexture: (t: Texture) => void order.push(t.name) } } as never;
    const a = fakeActor('tidus', [tex('idle'), tex('attack'), tex('hurt')]) as never;
    const stats = newDrawStats();
    expect(await uploadFigure(r, a, pause, () => true, stats, 'idle')).toBe(true);
    expect(order).toEqual(['idle']);
    expect(await uploadFigure(r, a, pause, () => true, stats, 'rest')).toBe(true);
    expect(order).toEqual(['idle', 'attack', 'hurt']);
    expect(stats.textures).toBe(3);
    let n = 0;
    order.length = 0;
    expect(await uploadFigure(r, a, pause, () => n++ < 1, stats, 'rest')).toBe(false);
    expect(order).toEqual(['attack']);
  });

  it('puts a figure in the scene only inside one synchronous draw, with the rest of the scene hidden', async () => {
    const scene = new Scene();
    const backdrop = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial());
    backdrop.name = 'backdrop';
    scene.add(backdrop);
    const actor = fakeActor('tidus', [tex('idle')]) as never as Object3D & { heldTextures(): Texture[] };
    const seen: Array<{ inScene: boolean; backdrop: boolean; plane: boolean }> = [];
    const target = {} as never;
    let bound: unknown = null;
    const r = {
      renderer: {
        getRenderTarget: () => bound,
        setRenderTarget: (t: unknown) => void (bound = t),
        compileAsync: async () => undefined,
        render: (s: Scene) => {
          const plane = s.getObjectByName('tidus-plane') as Mesh | undefined;
          seen.push({ inScene: !!plane, backdrop: backdrop.visible, plane: !!plane?.visible });
        },
      },
      composer: { readBuffer: target },
      camera: new PerspectiveCamera(),
    } as never;
    const stats = newDrawStats();
    expect(await drawFigures(r, scene, [actor as never], () => true, stats)).toBe(true);
    expect(seen.length).toBeGreaterThan(0);
    for (const s of seen) expect(s).toEqual({ inScene: true, backdrop: false, plane: true });
    expect(scene.children).toEqual([backdrop]); // the figure is out again
    expect(backdrop.visible).toBe(true); // and the scene is as it was
    expect((actor.getObjectByName('tidus-plane') as Mesh).visible).toBe(false);
    expect(isWarmed(actor as never)).toBe(true);
    expect(bound).toBeNull();
  });

  it('leaves the scene empty of figures and the figure unmarked when it is stopped', async () => {
    const scene = new Scene();
    const actor = fakeActor('yuna', [tex('idle')]) as never as Object3D & { heldTextures(): Texture[] };
    const r = {
      renderer: { getRenderTarget: () => null, setRenderTarget: () => undefined, compileAsync: async () => undefined, render: () => undefined },
      composer: { readBuffer: {} },
      camera: new PerspectiveCamera(),
    } as never;
    expect(await drawFigures(r, scene, [actor as never], () => false, newDrawStats())).toBe(false);
    expect(scene.children).toEqual([]);
    expect(isWarmed(actor as never)).toBe(false);
  });
});

describe("7. the look's reads, ahead", () => {
  it("reads a painting's extents once and keeps the answer for the page", () => {
    const t = new Texture();
    t.image = { width: 1664, height: 1948 } as never; // no canvas here: the read cannot be made, and that answer is kept too (null: the look default stands in)
    expect(alpha.hasExtents(t)).toBe(false);
    expect(alpha.readExtents(t)).toBeNull();
    expect(alpha.hasExtents(t)).toBe(true);
    expect(alpha.extentsKey(t)).toBe(`${t.uuid}:1664x1948`);
  });

  it('has no key for a painting that is not there yet (a placeholder), so nothing is read or kept for it', () => {
    const t = new Texture();
    expect(alpha.extentsKey(t)).toBeNull();
    t.image = { width: 4, height: 4 } as never;
    expect(alpha.extentsKey(t)).toBeNull();
    expect(alpha.readExtents(t)).toBeNull();
    expect(alpha.hasExtents(t)).toBe(false);
  });

  it("the engine gate is off until the page says otherwise", () => {
    expect(prebuildGate()).toBe(false);
    setPrebuildGate(true);
    expect(prebuildGate()).toBe(true);
    setPrebuildGate(false);
  });
});
