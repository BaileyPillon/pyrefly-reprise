// @vitest-environment jsdom
/**
 * The Experiment's room (FFX-2 Chapter 5, Djose Temple; the hidden chapter): the Machine Faction's grounds. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Tables through the pure exports; the factory under jsdom with a no-op 2D context and an empty art manifest (the Den scene test's set-up: the backdrop goes straight to its placeholder,
 * no decode, no network). What it looks like is the browser pass's (`docs/screenshots/ch-experiment/`). The painting is PROVISIONAL (rule 9): the plate is a stand-in until the art run's lands,
 * so nothing here pins a pixel, only the staging that survives a new plate: the registered key, the party slots, the one spot both bodies stand on, and the height the game gives the machine.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PerspectiveCamera, Vector3 } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getScene, getSceneFactory, isPlaceholderScene, loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import {
  EXPERIMENT_FIGURE_HEIGHT,
  EXPERIMENT_GIRLS_MEAN,
  EXPERIMENT_GROUNDS_FRAME,
  EXPERIMENT_GROUNDS_SLOTS,
  EXPERIMENT_PHONE_FIGURE_HEIGHT,
  EXPERIMENT_PHONE_SHARE,
  EXPERIMENT_REAL_HEIGHT,
  EXPERIMENT_SPOT,
} from '../../../src/scenes/experiment-grounds.ts';
import { DJOSE_PARTY_HEIGHT, DJOSE_RIGS } from '../../../src/scenes/djose-chamber.ts';
import { EXPERIMENT_GROUNDS_PLATE } from '../../../src/data/experiment-plates.ts';
import { FFX2_EXPERIMENT } from '../../../src/data/chapter-ffx2-experiment.ts';
import { EXPERIMENT_BODY_IDS } from '../../../src/data/ffx2/enemies/experiment.ts';
import { FFX2_GIRLS_MEAN } from '../../../src/data/ffx2/fiend-stature.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';

describe('the Experiment grounds: registration and staging', () => {
  it('is a real scene under the plate\'s id, and the chapter points at it', () => {
    expect(EXPERIMENT_GROUNDS_PLATE).toBe('ffx2-experiment-grounds');
    expect(FFX2_EXPERIMENT.sceneKey).toBe(EXPERIMENT_GROUNDS_PLATE);
    expect(getSceneFactory(EXPERIMENT_GROUNDS_PLATE)).toBeDefined();
    expect(isPlaceholderScene(EXPERIMENT_GROUNDS_PLATE)).toBe(false);
    expect(getScene(EXPERIMENT_GROUNDS_PLATE)?.slots).toBe(EXPERIMENT_GROUNDS_SLOTS);
  });

  it('has its plate on disk (the stand-in or the art run\'s), with its sidecar', () => {
    expect(existsSync(resolve('public/art/backdrops', `${EXPERIMENT_GROUNDS_PLATE}.png`))).toBe(true);
    expect(existsSync(resolve('public/art/backdrops', `${EXPERIMENT_GROUNDS_PLATE}.json`))).toBe(true);
  });

  it('seats the three girls where Chapter XVI seats them (the FFX-2 HUD is solved against those slots) and both bodies on one spot', () => {
    expect(EXPERIMENT_GROUNDS_SLOTS.party).toHaveLength(3);
    expect(EXPERIMENT_GROUNDS_SLOTS.partyHeight).toBe(DJOSE_PARTY_HEIGHT);
    const slots = EXPERIMENT_GROUNDS_SLOTS;
    expect(Object.keys(slots.enemySpots ?? {}).sort()).toEqual([...EXPERIMENT_BODY_IDS].sort());
    for (const id of EXPERIMENT_BODY_IDS) expect(slots.enemySpots?.[id], id).toEqual(EXPERIMENT_SPOT);
    expect(slots.holdParty).toBe(true);
  });

  it('stands both bodies at the game\'s own height over the girls: 50.78 over the party\'s 17.727 mean, 2.86 times, 5.098 over the Chamber\'s 1.78 (RE note section 2 and 12 Q7)', () => {
    expect(EXPERIMENT_REAL_HEIGHT).toBe(50.78);
    expect(EXPERIMENT_GIRLS_MEAN).toBeCloseTo((16.77 + 18.54 + 17.87) / 3, 6);
    // the same mean Chapters XI, XV and XVI read in the shared stature table
    expect(EXPERIMENT_GIRLS_MEAN).toBeCloseTo(FFX2_GIRLS_MEAN['ffx2-fallen-aeons']!, 3);
    expect(EXPERIMENT_FIGURE_HEIGHT / DJOSE_PARTY_HEIGHT).toBeCloseTo(50.78 / EXPERIMENT_GIRLS_MEAN, 2);
    expect(EXPERIMENT_FIGURE_HEIGHT).toBeCloseTo(5.098, 2);
    for (const id of EXPERIMENT_BODY_IDS) expect(EXPERIMENT_GROUNDS_SLOTS.figureHeights?.[id], id).toBe(EXPERIMENT_FIGURE_HEIGHT);
    expect(EXPERIMENT_GROUNDS_SLOTS.enemyHeight).toBe(EXPERIMENT_FIGURE_HEIGHT);
  });

  it('stands the machine at 0.7 of its real height on an upright phone, the share Bailey picked for the giants (2026-10-08); a desktop keeps the real height', () => {
    expect(EXPERIMENT_PHONE_SHARE).toBe(0.7);
    expect(EXPERIMENT_PHONE_FIGURE_HEIGHT).toBeCloseTo(EXPERIMENT_FIGURE_HEIGHT * 0.7, 3);
    expect(EXPERIMENT_PHONE_FIGURE_HEIGHT).toBeCloseTo(3.569, 2);
    expect(EXPERIMENT_PHONE_FIGURE_HEIGHT).toBeLessThan(EXPERIMENT_FIGURE_HEIGHT);
    expect(EXPERIMENT_PHONE_FIGURE_HEIGHT).toBeGreaterThan(DJOSE_PARTY_HEIGHT * 1.5); // still a machine twice the girls, not a figure the girls could look in the eye
  });

  it('keeps the whole machine in frame at the idle rig on a 16:9 desktop (feet on the spot, head at its full height)', () => {
    const idle = DJOSE_RIGS['idle']!;
    const cam = new PerspectiveCamera(idle.fov, 16 / 9, 0.1, 200);
    cam.position.set(...(idle.position as [number, number, number]));
    cam.lookAt(new Vector3(...(idle.lookAt as [number, number, number])));
    cam.updateMatrixWorld();
    for (const y of [0, EXPERIMENT_FIGURE_HEIGHT]) {
      const p = new Vector3(EXPERIMENT_SPOT[0], y, EXPERIMENT_SPOT[2]).project(cam);
      expect(Math.abs(p.x), `x at y ${y}`).toBeLessThan(1);
      expect(Math.abs(p.y), `y at y ${y}`).toBeLessThan(1);
    }
  });

  it('frames the plate with the numbers the frame row names (re-solved when the art run\'s plate is installed; nothing else moves)', () => {
    expect(EXPERIMENT_GROUNDS_FRAME.width).toBeGreaterThan(0);
    expect(EXPERIMENT_GROUNDS_FRAME.distance).toBeLessThan(0);
    expect(EXPERIMENT_GROUNDS_FRAME.horizon[0]).toBeLessThan(EXPERIMENT_GROUNDS_FRAME.horizon[1]);
  });
});

describe('the Experiment grounds: the real factory', () => {
  const loaded: LoadedScene[] = [];

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      const pixels = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
      const stub: object = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : stub), apply: () => stub, set: () => true });
      return new Proxy({} as Record<string | symbol, unknown>, {
        get(target, prop) {
          if (prop in target) return target[prop];
          if (prop === 'getImageData') return (_x: number, _y: number, w: number, h: number) => pixels(w, h);
          if (prop === 'createImageData') return (w: number, h: number) => pixels(w, h);
          if (prop === 'measureText') return () => ({ width: 10 });
          return () => stub;
        },
        set(target, prop, value) {
          target[prop] = value;
          return true;
        },
      }) as never;
    });
    setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
  });

  afterAll(() => {
    for (const s of loaded) s.dispose();
    resetArtManifest();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('builds through loadScene, publishes the staging for both bodies, and updates without throwing', async () => {
    const scene = await loadScene(EXPERIMENT_GROUNDS_PLATE, new PerspectiveCamera());
    loaded.push(scene);
    expect(scene.placeholder).toBe(false);
    for (const id of EXPERIMENT_BODY_IDS) {
      expect(scene.slots.enemySpots?.[id], id).toEqual(EXPERIMENT_SPOT);
      expect(scene.slots.figureHeights?.[id], id).toBe(EXPERIMENT_FIGURE_HEIGHT);
    }
    expect(scene.slots.holdParty).toBe(true);
    expect(() => scene.update(0.016)).not.toThrow();
  });

  it('on an upright phone (the phone battle HUD\'s media query) it publishes the phone height for both bodies, and nothing else changes', async () => {
    const win = window as unknown as { matchMedia?: (q: string) => { matches: boolean } };
    const before = win.matchMedia;
    win.matchMedia = (q: string) => ({ matches: q.includes('max-width: 599px') });
    try {
      const scene = await loadScene(EXPERIMENT_GROUNDS_PLATE, new PerspectiveCamera());
      loaded.push(scene);
      for (const id of EXPERIMENT_BODY_IDS) {
        expect(scene.slots.figureHeights?.[id], id).toBe(EXPERIMENT_PHONE_FIGURE_HEIGHT);
        expect(scene.slots.enemySpots?.[id], id).toEqual(EXPERIMENT_SPOT);
      }
      expect(scene.slots.enemyHeight).toBe(EXPERIMENT_PHONE_FIGURE_HEIGHT);
      expect(() => scene.update(0.016)).not.toThrow();
    } finally {
      if (before) win.matchMedia = before;
      else delete win.matchMedia;
    }
  });
});
