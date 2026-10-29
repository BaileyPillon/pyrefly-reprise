/**
 * The review of the load diet (2026-10-29; both games, shared presentation plumbing), pinned on the REAL `PaintedActor` with a loader whose files arrive when the test says so:
 *
 *  M1  a late painting of a pose set that was replaced meanwhile (a spherechange, a form change: `loadPoses(newMap)` on the same figure) is not installed over the new outfit, and the old set's
 *      queued loads are not started; a name the new set does not carry stays the old outfit's;
 *  m1  a pose that lands late does not re-place the plane that is showing (`resize` zeroed its align, meet and lock);
 *  m4  a pose map with no opening pose is waited for whole (nothing to build the figure on);
 *  and the claims behind M1 (`PoseClaims`), the per-task stop of the window, the demo prebuild's whole-set build (m7).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Texture } from 'three';
import type { PaintedActorOptions } from '../../src/engine/PaintedActor.ts';
import { PoseClaims, StreamStopped, startWindowed } from '../../src/engine/PoseStream.ts';
import { waitedForWhole } from '../../src/engine/LoadDiet.ts';

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
const starts = vi.hoisted(() => [] as string[]);
vi.mock('../../src/engine/PaintedArt.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/PaintedArt.ts')>();
  const { Texture: Tex } = await import('three');
  return {
    ...real,
    loadPainted: async (url: string) => {
      starts.push(url);
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
const tick = async (n = 20): Promise<void> => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

const dir = (outfit: string): string => `/art/characters/${outfit}`;
const set = (outfit: string, names: string[]): Record<string, string> => Object.fromEntries(names.map((n) => [n, `${dir(outfit)}/${n}.png`]));
const opts = (poses: Record<string, string>, extra: Partial<PaintedActorOptions> = {}): PaintedActorOptions => ({ name: 'x', worldHeight: 2, side: 'party', breathe: false, sway: false, life: false, interimYaw: false, poses, ...extra });

beforeEach(() => {
  gates.clear();
  made.length = 0;
  starts.length = 0;
});
afterEach(() => vi.restoreAllMocks());

describe('M1: a pose set replaced while the old one is still streaming', () => {
  it('a late painting of the old outfit does not overwrite the new outfit, and does not free its texture', async () => {
    const OLD = set('old', ['idle', 'ready', 'attack', 'victory']);
    const NEW = set('new', ['idle', 'ready', 'attack', 'victory']);
    const oldAttack = gate(OLD['attack']!);
    gate(OLD['victory']!); // never lands
    const a = await PaintedActor.create(opts(OLD, { streamCeilingMs: 20 }));
    expect(Object.keys(a.poseUrls).sort()).toEqual(['idle', 'ready']);
    await a.loadPoses(NEW, 'idle'); // the spherechange: the new outfit's whole set, as the stage's `setArt` loads it
    expect(a.poseUrls['attack']).toBe(NEW['attack']);
    const dispose = vi.spyOn(Texture.prototype, 'dispose');
    oldAttack.open();
    await tick();
    expect(a.poseUrls['attack']).toBe(NEW['attack']); // the stale landing is dropped
    const newAttack = made.find((m) => m.url === NEW['attack'])!.texture as Texture;
    expect(dispose.mock.contexts).not.toContain(newAttack); // and the new outfit's texture was not retired under it
    a.setPose('attack', { immediate: true });
    expect(a.pose).toBe('attack');
    a.dispose();
  });

  it('the old set\'s queued loads are not started for names the new set took (and the window goes on for the rest)', async () => {
    const late = ['attack', 'cast', 'hurt', 'item', 'defend', 'telegraph', 'ko', 'victory', 'sleep'];
    const OLD = set('old', ['idle', 'ready', ...late]);
    const NEW = set('new', ['idle', 'ready', ...late.filter((n) => n !== 'sleep')]); // the new outfit has no `sleep`
    for (const n of late) gate(OLD[n]!);
    const a = await PaintedActor.create(opts(OLD, { streamCeilingMs: 20 }));
    const inFlight = starts.filter((u) => u.startsWith(dir('old')) && !/(idle|ready)\.png$/.test(u));
    expect(inFlight).toHaveLength(6); // LATE_WINDOW loads started, three queued behind them
    await a.loadPoses(NEW, 'idle');
    const before = starts.length;
    for (const n of late.slice(0, 6)) (gates.get(OLD[n]!) as Gate).open(); // the six land: the window would start the queued three
    await tick(40);
    expect(starts.slice(before).filter((u) => u === OLD['ko'] || u === OLD['victory'])).toEqual([]); // names the new set took: not started
    expect(starts.slice(before)).toContain(OLD['sleep']); // `sleep` is the old outfit's still: its load goes on
    for (const n of late.slice(0, 6)) expect(a.poseUrls[n]).toBe(NEW[n]); // none of the old landings overwrote the new outfit
    (gates.get(OLD['sleep']!) as Gate).open();
    await tick(40);
    expect(a.poseUrls['sleep']).toBe(OLD['sleep']); // and a name only the old outfit carries lands as it did in release 67
    a.dispose();
  });

  it('a pose adopted (a borrowed painting) is not overwritten by a late landing of the same name either', async () => {
    const OLD = set('old', ['idle', 'ready', 'attack']);
    const oldAttack = gate(OLD['attack']!);
    const a = await PaintedActor.create(opts(OLD, { streamCeilingMs: 20 }));
    const borrowed = { texture: new Texture(), meta: { width: 600, height: 800, baselineY: 780, scale: 1 }, placeholder: false, url: '/art/characters/borrowed/attack.png', scale: 1 };
    a.adoptPoses({ attack: borrowed as never });
    oldAttack.open();
    await tick();
    expect(a.poseUrls['attack']).toBe(borrowed.url);
    a.dispose();
  });
});

describe('m1: a late pose does not re-place the plane that is showing', () => {
  it('align and meet of the showing plane survive a landing', async () => {
    const POSES = set('hero', ['idle', 'ready', 'attack']);
    const attack = gate(POSES['attack']!);
    const a = await PaintedActor.create(opts(POSES, { streamCeilingMs: 20 }));
    const guts = a as unknown as { slots: Array<{ align: number; meet: number }>; active: number };
    const s = guts.slots[guts.active]!;
    s.align = 0.31; // a cut anchor easing home, or an aligned dissolve in flight
    s.meet = 0.2;
    attack.open();
    await tick();
    expect(a.poseUrls['attack']).toBe(POSES['attack']); // it did land
    expect(s.align).toBe(0.31);
    expect(s.meet).toBe(0.2);
    a.dispose();
  });
});

describe('m4: a pose map with no opening pose', () => {
  it('is waited for whole, not built on nothing', async () => {
    const POSES = { stand: `${dir('z')}/stand.png`, hit: `${dir('z')}/hit.png` };
    const hit = gate(POSES.hit);
    let built = false;
    const p = PaintedActor.create(opts(POSES, { streamCeilingMs: 10 })).then((a) => ((built = true), a));
    await new Promise((r) => setTimeout(r, 60));
    expect(built).toBe(false); // the ceiling does not apply: there is no opening pose to build the figure on
    hit.open();
    const a = await p;
    expect(Object.keys(a.poseUrls).sort()).toEqual(['hit', 'stand']);
    expect(a.pose).toBe('stand');
    a.dispose();
  });
});

describe('PoseClaims', () => {
  it('a name belongs to the claim that installed it last', () => {
    const c = new PoseClaims();
    const a = c.next();
    const b = c.next();
    expect(a).not.toBe(b);
    expect(c.holds('attack', a)).toBe(false); // nothing installed it yet
    c.stamp(['attack', 'cast'], a);
    expect(c.holds('attack', a)).toBe(true);
    c.stamp(['attack'], b);
    expect(c.holds('attack', a)).toBe(false);
    expect(c.holds('attack', b)).toBe(true);
    expect(c.holds('cast', a)).toBe(true); // a name the newer set did not take stays with the older one
  });
});

describe('startWindowed with a stop per task', () => {
  it('skips only the tasks stop(i) names, and keeps the window going', async () => {
    const ran: number[] = [];
    const tasks = [0, 1, 2, 3].map((i) => async (): Promise<number> => (ran.push(i), i));
    const out = startWindowed(tasks, 2, (i) => i === 1 || i === 3);
    const settled = await Promise.allSettled(out);
    expect(settled.map((s) => s.status)).toEqual(['fulfilled', 'rejected', 'fulfilled', 'rejected']);
    expect((settled[1] as PromiseRejectedResult).reason).toBeInstanceOf(StreamStopped);
    expect(ran).toEqual([0, 2]);
  });
});

describe('m7: the demo prebuild builds a figure whole', () => {
  it('waitedForWhole drops the ceiling and nothing else', () => {
    const o = { name: 'x', streamCeilingMs: 3000, worldHeight: 2 };
    expect(waitedForWhole(o)).toEqual({ name: 'x', worldHeight: 2 });
    expect(o.streamCeilingMs).toBe(3000); // the request itself (and its fingerprint) is untouched
  });

  it('prebuildFigures builds through it', () => {
    const src = readFileSync(resolve(__dirname, '..', '..', 'src', 'app', 'demo', 'prebuildFigures.ts'), 'utf8');
    expect(src).toMatch(/PaintedActor\.create\(waitedForWhole\(spec\.request\.opts\)\)/);
  });
});
