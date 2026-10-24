// @vitest-environment jsdom
/**
 * r64-fixes, item 6 (both games; the conference demo): the room's dressing (Living Paintings) is built behind the picker, its programs drawn once, and adopted by the battle's bind.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, ShaderMaterial } from 'three';
import { dropParkedRooms, parkRoom, parkedRoomCount, takeParkedRoom, type ParkKey, type Parkable } from '../../src/engine/fx/b/LivingPark.ts';
import { drawParts, newDrawStats } from '../../src/app/demo/prebuildDraw.ts';
import { livingPrebuildFromSearch } from '../../src/app/demo/prebuildLiving.ts';

const REPO = join(__dirname, '..', '..');
const src = (rel: string): string => readFileSync(join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');

const key = (over: Partial<ParkKey> = {}): ParkKey => ({ key: 'room-a', scene: new Scene(), camera: new PerspectiveCamera(), renderer: undefined, battleCamera: {} as never, ...over });
const room = (): Parkable & { disposed: number } => {
  const r = { disposed: 0, dispose: () => void r.disposed++, whenBuilt: async () => true, parts: () => [] };
  return r;
};

afterEach(() => {
  dropParkedRooms();
  vi.useRealTimers();
});

describe('LivingPark: a room parked for a scene is adopted by the bind of that scene and by nothing else', () => {
  it('the same scene, camera, renderer and battle camera: handed over once, and no longer held', () => {
    const k = key();
    const r = room();
    parkRoom(k, r);
    expect(parkedRoomCount()).toBe(1);
    expect(takeParkedRoom(k)).toBe(r);
    expect(parkedRoomCount()).toBe(0);
    expect(takeParkedRoom(k)).toBeNull();
    expect(r.disposed).toBe(0);
  });

  it('another scene object (a battle that built its own), camera or battle camera: the parked room is disposed, never adopted', () => {
    for (const other of [{ scene: new Scene() }, { camera: new PerspectiveCamera() }, { battleCamera: {} as never }] as Array<Partial<ParkKey>>) {
      const k = key();
      const r = room();
      parkRoom(k, r);
      expect(takeParkedRoom({ ...k, ...other })).toBeNull();
      expect(r.disposed).toBe(1);
      expect(parkedRoomCount()).toBe(0);
    }
  });

  it('a second park for the same scene key disposes the first; rooms of other keys are held side by side', () => {
    const a1 = room();
    const a2 = room();
    const b = room();
    parkRoom(key({ key: 'room-a' }), a1);
    parkRoom(key({ key: 'room-b' }), b);
    parkRoom(key({ key: 'room-a' }), a2);
    expect(a1.disposed).toBe(1);
    expect(b.disposed).toBe(0);
    expect(parkedRoomCount()).toBe(2);
    dropParkedRooms();
    expect([a2.disposed, b.disposed]).toEqual([1, 1]);
  });
});

describe('the switch', () => {
  it('?livingpre=off (or today, or 0) builds the room at the bind as r63-play does; nothing else turns it off', () => {
    expect(livingPrebuildFromSearch('?demo=1&pack=demo')).toBe(true);
    expect(livingPrebuildFromSearch('?demo=1&pack=demo&livingpre=off')).toBe(false);
    expect(livingPrebuildFromSearch('?livingpre=today')).toBe(false);
    expect(livingPrebuildFromSearch('?livingpre=0')).toBe(false);
    expect(livingPrebuildFromSearch('?prebuild=off')).toBe(true); // the figures' switch is the plan's own gate, not this one
    expect(livingPrebuildFromSearch(undefined)).toBe(true);
  });
});

describe('drawParts: one draw per program family of the parts, everything else hidden, visibility put back', () => {
  it('draws the visible meshes of the parts by family, skips a hidden one, and leaves the scene as it was', async () => {
    vi.useFakeTimers();
    const scene = new Scene();
    const plain = new MeshBasicMaterial();
    const shader = new ShaderMaterial({ vertexShader: 'void main(){}', fragmentShader: 'void main(){}' });
    const geo = new BoxGeometry();
    const backdrop = new Mesh(geo, plain); // not a part: hidden during every slice
    const root = new Group();
    const m1 = new Mesh(geo, plain);
    const m2 = new Mesh(geo, shader);
    const hidden = new Mesh(geo, new MeshBasicMaterial({ transparent: true }));
    hidden.visible = false;
    root.add(m1, m2, hidden);
    scene.add(backdrop, root);
    const drawn: string[][] = [];
    const name = (o: unknown): string => (o === backdrop ? 'backdrop' : o === m1 ? 'm1' : o === m2 ? 'm2' : o === hidden ? 'hidden' : '?');
    const target = {};
    const gl = {
      getRenderTarget: () => null,
      setRenderTarget: () => undefined,
      compileAsync: async () => undefined,
      render: (s: Scene) => {
        const seen: string[] = [];
        s.traverse((o) => {
          if ((o as Mesh).isMesh && o.visible) seen.push(name(o));
        });
        drawn.push(seen);
      },
      getContext: () => undefined,
    };
    const r = { renderer: gl, composer: { readBuffer: target }, camera: new PerspectiveCamera() } as never;
    const stats = newDrawStats();
    const p = drawParts(r, scene, [root], () => true, stats);
    await vi.runAllTimersAsync();
    expect(await p).toBe(true);
    expect(drawn).toEqual([['m1'], ['m2']]); // two families; the backdrop and the hidden mesh are never in a slice
    expect(stats.slices).toBe(2);
    expect([backdrop.visible, m1.visible, m2.visible, hidden.visible]).toEqual([true, true, true, false]);
  });

  it('stops at the next family when a fight is picked, and still puts everything back', async () => {
    vi.useFakeTimers();
    const scene = new Scene();
    const geo = new BoxGeometry();
    const root = new Group();
    const a = new Mesh(geo, new MeshBasicMaterial());
    const b = new Mesh(geo, new ShaderMaterial({ vertexShader: 'void main(){}', fragmentShader: 'void main(){}' }));
    root.add(a, b);
    scene.add(root);
    let calm = true;
    let draws = 0;
    const gl = { getRenderTarget: () => null, setRenderTarget: () => undefined, compileAsync: async () => undefined, render: () => { draws++; calm = false; }, getContext: () => undefined };
    const r = { renderer: gl, composer: { readBuffer: {} }, camera: new PerspectiveCamera() } as never;
    const p = drawParts(r, scene, [root], () => calm, newDrawStats());
    await vi.runAllTimersAsync();
    expect(await p).toBe(false);
    expect(draws).toBe(1);
    expect([a.visible, b.visible]).toEqual([true, true]);
  });
});

describe('the wiring (source)', () => {
  it('the battle\'s bind takes a parked room before it releases the old one, and keeps it as the room; the warm parks it behind the figures', () => {
    const living = src('src/engine/fx/b/LivingPaintings.ts');
    expect(living).toContain('const adopted = takeParkedRoom<Living>(parkKeyOf(a));');
    expect(living.indexOf('takeParkedRoom<Living>')).toBeLessThan(living.indexOf('  releaseLivingScene();\n  bindMaxMix(a);'));
    expect(living).toContain('if (adopted) return void (current = adopted);');
    expect(living).toContain('export async function parkLivingScene(');
    expect(living).toContain("if (!room || room.arcs || !roomPlays(room, eyeCandy.enabled('b'), eyeCandy.tier)) return null;"); // a room whose arcs read the camera at the build is never parked early
    expect(living.split('\n').length).toBeLessThan(400);
    const plan = src('src/app/demo/prebuildFigures.ts');
    expect(plan).toContain('await prebuildLiving(app, chapter, scene, renderer(), calm, stats, note);');
    expect(plan.indexOf('prebuildLiving(app')).toBeGreaterThan(plan.indexOf('programs built in'));
    expect(plan.indexOf('prebuildLiving(app')).toBeLessThan(plan.indexOf("the looks' alpha reads of each figure's idle painting"));
  });

  it('the bind the warm makes is the one BattleScreen.enter makes, field for field', () => {
    const screen = src('src/app/screens/BattleScreen.ts');
    expect(screen).toContain('bindLivingScene({ key: scene.key, game: chapter.game, scene: scene.scene, camera: this.app.renderer.camera, rigName: () => scene.battleCamera.rigName, battleCamera: scene.battleCamera, renderer: this.app.renderer.renderer });');
    const warm = src('src/app/demo/prebuildLiving.ts');
    for (const f of ['key: scene.key', 'game: chapter.game', 'scene: scene.scene', 'camera: app.renderer.camera', 'rigName: () => scene.battleCamera.rigName', 'battleCamera: scene.battleCamera']) expect(warm).toContain(f);
  });
});
