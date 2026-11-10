/**
 * The pins of step C2 of the FFX-2 Special look, taken BEFORE the first source edit of the step (game case: FFX-2 only in what is pinned; the three things pinned are shared plumbing for both
 * games, and with the switch `specialDressUp` OFF they must not move):
 *
 *  1. `artCandidatesFor` for ordinary combatants: the party and the first enemy formation (a boss group) of every listed FFX and FFX-2 chapter, each with and without an art namespace.
 *     The step adds `specialArtCandidates` to this function; for anything that is not a Special, nothing may change.
 *  2. The request list `preloadBattle` makes for Chapters IV and V with the switch OFF (the paintings it warms, the images it asks for and the probes it sends). The step adds Special paintings to
 *     it only when the state says `specialDressUp`.
 *  3. `PaintedStage`'s `figureEnv().slots` is the stage's own `slots` object (the step wraps it in `formSlots`, which must hand the same object back with no form up).
 *
 * Written once at the head the step starts from (`PYREFLY_WRITE_PINS=1`), compared on every run after (`helpers/offPins.ts`).
 *
 * Removal check: change one candidate (a prefix in `artIdFor`) and pin 1 fails; ask for one more painting in `battlePreload` and pin 2 fails.
 */

import { Group, Object3D, PerspectiveCamera, Scene } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prewarmed: string[] = [];
vi.mock('../../src/engine/PaintedArt.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/PaintedArt.ts')>();
  return {
    ...real,
    prewarmPainted: vi.fn(async (url: string) => {
      prewarmed.push(url);
      return true;
    }),
  };
});

const created: Array<Record<string, unknown>> = [];
vi.mock('../../src/engine/PaintedActor.ts', () => ({
  PaintedActor: {
    create: vi.fn(async (o: Record<string, unknown>) => {
      created.push(o);
      const f = new Object3D() as Object3D & Record<string, unknown>;
      f.name = String(o['name']);
      f['setPose'] = (): void => {};
      f['setAlpha'] = (): void => {};
      f['lieDown'] = async (): Promise<void> => {};
      f['dispose'] = (): void => {};
      return f;
    }),
  },
}));
vi.mock('../../src/engine/VFX.ts', () => ({ HitEffects: class extends Group {} }));

import type { AnyCombatant } from '../../src/battle/common/types.ts';
import { CHAPTERS, UNLISTED_CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { preloadBattle } from '../../src/app/screens/battlePreload.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { createEngine } from '../../src/app/screens/BattleScreenWiring.ts';
import { resetImageWarm } from '../../src/app/imageWarm.ts';
import { releaseAllPrefetch } from '../../src/app/screens/preloadFetch.ts';
import { artCandidatesFor, artIdFor } from '../../src/engine/BattlePresenterArt.ts';
import { inArtNamespace } from '../../src/data/art/artNamespace.ts';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { PaintedStage } from '../../src/engine/BattlePresenterStage.ts';
import type { SceneSlots } from '../../src/scenes/index.ts';
import { expectPinned } from './helpers/offPins.ts';

/** The fields `artIdFor` reads, which is all a candidate list depends on. */
interface Descriptor {
  id: string;
  side: string;
  spriteKey: string | undefined;
  dress: string | undefined;
  level: number | undefined;
  enemy: { formIndex: number | undefined; level: number | undefined } | undefined;
}

const descriptorOf = (c: AnyCombatant): Descriptor => {
  const x = c as unknown as { level?: number; dresspheres?: { current?: string }; enemy?: { formIndex?: number; level?: number } };
  return { id: c.id, side: c.side, spriteKey: c.spriteKey, dress: x.dresspheres?.current, level: x.level, enemy: x.enemy ? { formIndex: x.enemy.formIndex, level: x.enemy.level } : undefined };
};

const combatantOf = (d: Descriptor): AnyCombatant =>
  ({
    id: d.id,
    side: d.side,
    spriteKey: d.spriteKey,
    flags: {},
    ...(d.level !== undefined ? { level: d.level } : {}),
    ...(d.dress !== undefined ? { dresspheres: { current: d.dress } } : {}),
    ...(d.enemy ? { enemy: { ...(d.enemy.formIndex !== undefined ? { formIndex: d.enemy.formIndex } : {}), ...(d.enemy.level !== undefined ? { level: d.enemy.level } : {}) } } : {}),
  }) as unknown as AnyCombatant;

describe('pin 1: artCandidatesFor for ordinary combatants', () => {
  it('is what it is at the head: the parties and the first enemy formation of every listed FFX and FFX-2 chapter, bare and in an art namespace', async () => {
    const seen = new Map<string, Descriptor>();
    for (const chapter of CHAPTERS.filter((c) => c.game !== 'ff7')) {
      const state = (await createEngine(chapter.game, setupForChapter(chapter, 1), { automated: true })).state();
      const ids = [...state.activeIds, ...state.enemyIds];
      for (const id of ids) {
        const c = state.combatants[id];
        if (!c) continue;
        const d = descriptorOf(c);
        seen.set(JSON.stringify(d), d);
      }
    }
    const rows = [...seen.values()]
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
      .map((d) => ({ d, bare: artCandidatesFor(combatantOf(d)), ns: artCandidatesFor(combatantOf(d), 'exp-leblanc') }));
    expect(rows.length, 'at least forty ordinary combatants').toBeGreaterThanOrEqual(40);
    expectPinned('c2-art-candidates', rows);
    // The rows are replayed from their descriptors, so the pin does not depend on the chapter data staying the same.
    for (const r of rows) expect(artCandidatesFor(combatantOf(r.d))).toEqual(r.bare);
  }, 120_000);
});

describe('pin 1b: artCandidatesFor for the FF7 chapters (the same function is on the FF7 path, which pin 1 leaves out)', () => {
  it('is the literal old body for every combatant of every FF7 chapter\'s party and first formation, bare and in an art namespace: no Special\'s painting, no part ever appears', async () => {
    const ff7 = [...CHAPTERS, ...UNLISTED_CHAPTERS].filter((c) => c.game === 'ff7'); // the FF7 chapters are hidden ones (`UNLISTED_CHAPTERS`), so pin 1's filter on CHAPTERS never met one
    expect(ff7.length, 'there are FF7 chapters to read').toBeGreaterThan(0);
    const special = /(^|-)(floral-fallal|machina-maw|full-throttle)$/;
    let checked = 0;
    for (const chapter of ff7) {
      const state = (await createEngine(chapter.game, setupForChapter(chapter, 1), { automated: true })).state();
      for (const id of [...state.activeIds, ...state.enemyIds]) {
        const c = state.combatants[id];
        if (!c) continue;
        for (const ns of [undefined, 'exp-leblanc']) {
          const old = [artIdFor(c), c.spriteKey, c.id].map((x) => (x ? inArtNamespace(ns, x) : x)); // the body of `artCandidatesFor` before the step
          expect(artCandidatesFor(c, ns), `${chapter.id}/${id}`).toEqual(old);
          for (const candidate of old) expect(special.test(candidate ?? ''), `${chapter.id}/${id}: ${candidate}`).toBe(false);
        }
        checked++;
      }
    }
    expect(checked, 'a party and a formation per chapter').toBeGreaterThanOrEqual(ff7.length * 2);
  }, 120_000);
});

describe('pin 2: the preload request list of Chapters IV and V with the switch off', () => {
  const images: string[] = [];
  const fetched: string[] = [];
  beforeEach(() => {
    prewarmed.length = 0;
    images.length = 0;
    fetched.length = 0;
    resetImageWarm();
    releaseAllPrefetch();
    class FakeImage {
      src = '';
      decoding = '';
      crossOrigin: string | null = null;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      constructor() {
        images.push('');
        const at = images.length - 1;
        Object.defineProperty(this, 'src', {
          set: (v: string) => {
            images[at] = String(v);
            queueMicrotask(() => this.onload?.());
          },
          get: () => images[at] ?? '',
        });
      }
      decode(): Promise<void> {
        return Promise.resolve();
      }
      removeAttribute(): void {}
    }
    vi.stubGlobal('Image', FakeImage);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        fetched.push(String(url));
        return new Response(null, { status: 404 });
      }),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetImageWarm();
    releaseAllPrefetch();
  });

  it.each(['ffx2-bahamut', 'ffx2-vegnagun-shuyin'])('%s asks for exactly these paintings, images and probes', async (id) => {
    await preloadBattle(getChapter(id)!, 1);
    const asked = { paintings: [...prewarmed], images: images.filter((s) => s !== ''), probes: [...new Set(fetched)] };
    expect(asked.paintings.length).toBeGreaterThan(10);
    expectPinned(`c2-preload-${id}`, asked);
  }, 60_000);
});

describe('pin 3: figureEnv().slots is the stage\'s own slots object', () => {
  it('with no form up, the figure request reads the very object the stage was built with', () => {
    created.length = 0;
    const cam = new PerspectiveCamera();
    const slots = { party: [[0, 0, 0]], enemy: [[3, 0, 0]], partyHeight: 1.82, enemyHeight: 4.1 } as unknown as SceneSlots;
    const stage = new PaintedStage({
      scene: new Scene(),
      camera: cam,
      battleCamera: new BattleCamera(cam, { rigs: { idle: { position: [0, 3, 10], lookAt: [0, 1, 0] } } }),
      slots,
      canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) } as unknown as HTMLCanvasElement,
    });
    const env = (stage as unknown as { figureEnv(): { slots: SceneSlots; specialFit: unknown } }).figureEnv();
    expect(env.slots).toBe(slots);
    expect(env.specialFit).toBeUndefined();
  });
});
