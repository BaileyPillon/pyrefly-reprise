/**
 * The load diet on the REAL `PaintedActor` (lane "load-diet", 2026-10-29; both games, shared presentation plumbing): `loadPoses` with a ceiling waits for the opening poses, gives the rest at most
 * the ceiling, and builds the figure without the ones that have not landed; they install when they do (nothing is shown or restarted), a figure disposed first frees them, and a set that lands
 * inside the ceiling is the set release 67 built, in the same order. Without a ceiling (`?loaddiet=off`) it waits for every pose as it always did. The loader is a stand-in whose files arrive when the
 * test says so.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Texture } from 'three';
import type { PaintedActorOptions } from '../../src/engine/PaintedActor.ts';

vi.mock('../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

interface Gate {
  open: () => void;
  opened: Promise<void>;
}
const gates = vi.hoisted(() => new Map<string, unknown>());
const made = vi.hoisted(() => [] as Array<{ url: string; texture: unknown }>);
vi.mock('../../src/engine/PaintedArt.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/PaintedArt.ts')>();
  const { Texture: Tex } = await import('three');
  return {
    ...real,
    loadPainted: async (url: string) => {
      const gate = gates.get(url) as Gate | undefined;
      if (gate) await gate.opened;
      const texture = new Tex();
      made.push({ url, texture });
      return { texture, meta: { width: 600, height: 800, baselineY: 780, scale: 1 }, placeholder: false, url, scale: 1 };
    },
  };
});

const { PaintedActor } = await import('../../src/engine/PaintedActor.ts');

function gate(url: string): Gate {
  let open!: () => void;
  const opened = new Promise<void>((r) => (open = r));
  const g = { open, opened };
  gates.set(url, g);
  return g;
}
const tick = async (n = 12): Promise<void> => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const POSES = {
  idle: '/art/characters/tidus/idle.png',
  ready: '/art/characters/tidus/ready.png',
  attack: '/art/characters/tidus/attack.png',
  cast: '/art/characters/tidus/attack.png',
  hurt: '/art/characters/tidus/hurt.png',
  victory: '/art/characters/tidus/victory.png',
};
const opts = (extra: Partial<PaintedActorOptions> = {}): PaintedActorOptions => ({ name: 'tidus', worldHeight: 2, side: 'party', breathe: false, sway: false, life: false, interimYaw: false, poses: POSES, ...extra });
const urls = (a: InstanceType<typeof PaintedActor>): string[] => Object.keys(a.poseUrls).sort();

beforeEach(() => {
  gates.clear();
  made.length = 0;
});
afterEach(() => vi.restoreAllMocks());

describe('PaintedActor.loadPoses with a stream ceiling', () => {
  it('everything inside the ceiling: the same set release 67 built, in the same order', async () => {
    const a = await PaintedActor.create(opts({ streamCeilingMs: 200 }));
    expect(urls(a)).toEqual(Object.keys(POSES).sort());
    expect(Object.keys(a.poseUrls)).toEqual(Object.keys(POSES)); // insertion order is the pose map's own
    const b = await PaintedActor.create(opts());
    expect(Object.keys(b.poseUrls)).toEqual(Object.keys(a.poseUrls));
    expect(a.pose).toBe('idle');
  });

  it('late poses past the ceiling: the figure is built with the opening ones, the rest install when they land', async () => {
    const attack = gate(POSES.attack);
    const hurt = gate(POSES.hurt);
    const victory = gate(POSES.victory);
    const t0 = Date.now();
    const a = await PaintedActor.create(opts({ streamCeilingMs: 40 }));
    expect(Date.now() - t0).toBeGreaterThanOrEqual(35);
    expect(Date.now() - t0).toBeLessThan(400);
    expect(urls(a)).toEqual(['idle', 'ready']); // built without the ones still in flight
    expect(a.pose).toBe('idle');
    // a request for a pose that has not landed draws its fallback chain's painting: cast -> attack -> ready? no: cast, attack are absent, so idle
    a.setPose('cast');
    expect(a.pose).toBe('idle');

    attack.open();
    await tick();
    expect(urls(a)).toEqual(['attack', 'cast', 'idle', 'ready']); // attack and cast share a file
    a.setPose('attack', { immediate: true });
    expect(a.pose).toBe('attack');
    hurt.open();
    victory.open();
    await tick();
    expect(urls(a)).toEqual(Object.keys(POSES).sort());
    a.dispose();
  });

  it('a figure disposed before the late poses land frees them and installs nothing', async () => {
    const attack = gate(POSES.attack);
    gate(POSES.hurt);
    gate(POSES.victory);
    const a = await PaintedActor.create(opts({ streamCeilingMs: 20 }));
    expect(urls(a)).toEqual(['idle', 'ready']);
    a.dispose();
    const spy = vi.spyOn(Texture.prototype, 'dispose');
    attack.open();
    await tick();
    await sleep(5);
    expect(urls(a)).toEqual(['idle', 'ready']);
    const attackTexture = made.find((m) => m.url === POSES.attack)!.texture as Texture;
    expect(spy.mock.contexts).toContain(attackTexture);
  });

  it('without a ceiling it waits for every pose, however long (release 67)', async () => {
    const hurt = gate(POSES.hurt);
    let built = false;
    const p = PaintedActor.create(opts()).then((a) => ((built = true), a));
    await sleep(60);
    expect(built).toBe(false);
    hurt.open();
    const a = await p;
    expect(urls(a)).toEqual(Object.keys(POSES).sort());
  });

  it('the opening poses are waited for without a limit, whatever the ceiling', async () => {
    const ready = gate(POSES.ready);
    let built = false;
    const p = PaintedActor.create(opts({ streamCeilingMs: 10 })).then((a) => ((built = true), a));
    await sleep(60);
    expect(built).toBe(false);
    ready.open();
    const a = await p;
    expect(urls(a)).toContain('ready');
    expect(urls(a)).toContain('idle');
  });

  it('a blend reload (a pose set swapped under a figure on screen) never streams', async () => {
    const a = await PaintedActor.create(opts());
    const newAttack = '/art/characters/tidus/attack2.png';
    const g = gate(newAttack);
    let done = false;
    const p = a.loadPoses({ ...POSES, attack: newAttack }, 'idle', { blend: true, streamCeilingMs: 10 }).then(() => (done = true));
    await sleep(60);
    expect(done).toBe(false);
    g.open();
    await p;
    expect(a.poseUrls['attack']).toBe(newAttack);
  });
});
