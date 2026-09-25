// @vitest-environment jsdom
/**
 * Chapter X (Seymour Natus): the Highbridge scene and Natus's turning ring.
 *
 * Tables through the pure exports; the framing by projecting every fighter through the idle rig
 * at the four checked sizes' aspects; the ring against the installed sidecars and on a staged
 * figure; the factory through `loadScene('bevelle-highbridge', camera)` under jsdom with a no-op
 * 2D context and an empty art manifest (the Cloister 100 test's set-up). What it looks like is the
 * browser pass's (`docs/concepts/chapters/natus/ship/`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getScene, getSceneFactory, isPlaceholderScene, loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import {
  HIGHBRIDGE_ACTOR_HEIGHTS,
  HIGHBRIDGE_ENEMY_SLOT,
  HIGHBRIDGE_PLATE,
  HIGHBRIDGE_RIGS,
  HIGHBRIDGE_SLOTS,
} from '../../../src/scenes/highbridge.ts';
import { NATUS_FIGURE_ID, NATUS_RING, NatusRing } from '../../../src/scenes/highbridge-ring.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { seymourNatusGroup } from '../../../src/data/ffx/enemies/seymour-natus.ts';

const sidecar = (p: string): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(process.cwd(), 'public/art', p), 'utf8')) as Record<string, unknown>;

describe('the Highbridge — tables', () => {
  it('is registered as a real scene, and Chapter X points at it', () => {
    expect(getSceneFactory('bevelle-highbridge')).toBeDefined();
    expect(isPlaceholderScene('bevelle-highbridge')).toBe(false);
    expect(getScene('bevelle-highbridge')?.slots).toBe(HIGHBRIDGE_SLOTS);
    expect(getChapter('seymour-natus')?.sceneKey).toBe('bevelle-highbridge');
  });

  it("each enemy's slot is the record's own, and each has its own spot and height", () => {
    const slot = Object.fromEntries(seymourNatusGroup.enemies.map((e) => [e.id, e.slot]));
    expect(slot['seymour-natus']).toBe(HIGHBRIDGE_ENEMY_SLOT.natus);
    expect(slot['mortibody']).toBe(HIGHBRIDGE_ENEMY_SLOT.mortibody);
    expect(HIGHBRIDGE_SLOTS.enemySpots?.['seymour-natus']).toEqual(HIGHBRIDGE_SLOTS.enemy[HIGHBRIDGE_ENEMY_SLOT.natus]);
    expect(HIGHBRIDGE_SLOTS.enemySpots?.['mortibody']).toEqual(HIGHBRIDGE_SLOTS.enemy[HIGHBRIDGE_ENEMY_SLOT.mortibody]);
    expect(HIGHBRIDGE_SLOTS.holdParty).toBe(true);
    // O-1 staging: Natus at 1.3 times Chapter VII Seymour's 1.87.
    expect(HIGHBRIDGE_ACTOR_HEIGHTS.natus).toBeCloseTo(1.87 * 1.3, 2);
  });

  it('the party stands in front of the enemy line, Mortibody at Natus\'s screen-left (O-2 A)', () => {
    const [natus, morti] = [HIGHBRIDGE_SLOTS.enemy[0]!, HIGHBRIDGE_SLOTS.enemy[1]!];
    expect(morti[0]).toBeLessThan(natus[0]);
    for (const p of HIGHBRIDGE_SLOTS.party) expect(p[2]).toBeGreaterThan(Math.max(natus[2], morti[2]));
  });

  it('the rig set has every rig the contract needs', () => {
    for (const name of ['intro', 'idle', 'action', 'enemy', 'party', 'victory']) expect(HIGHBRIDGE_RIGS[name], name).toBeDefined();
  });

  it.each([
    ['1280x720 and 1600x900', 16 / 9],
    ['2000x1012', 2000 / 1012],
  ])('%s: the idle rig frames every fighter, feet to head, inside the picture', (_n, aspect) => {
    const rig = HIGHBRIDGE_RIGS['idle']!;
    const cam = new PerspectiveCamera(rig.fov, aspect, 0.1, 200);
    const at = (v: [number, number, number] | Vector3): Vector3 => (v instanceof Vector3 ? v.clone() : new Vector3(...v));
    cam.position.copy(at(rig.position));
    cam.lookAt(at(rig.lookAt));
    cam.updateMatrixWorld();
    const onScreen = (x: number, y: number, z: number): void => {
      const p = new Vector3(x, y, z).project(cam);
      expect(Math.abs(p.x), `x of ${x},${y},${z}`).toBeLessThan(0.9);
      expect(Math.abs(p.y), `y of ${x},${y},${z}`).toBeLessThan(0.95);
    };
    const h = HIGHBRIDGE_ACTOR_HEIGHTS;
    for (const [x, , z] of HIGHBRIDGE_SLOTS.party) for (const y of [0, h.party]) onScreen(x, y, z);
    const [natus, morti] = [HIGHBRIDGE_SLOTS.enemy[0]!, HIGHBRIDGE_SLOTS.enemy[1]!];
    for (const y of [0, h.natus * (1 + NATUS_RING.centreY)]) onScreen(natus[0], y, natus[2]);
    for (const y of [0, h.mortibody]) onScreen(morti[0], y, morti[2]);
  });

  it('the plate is the installed O-3 C painting at its own size', () => {
    const plate = sidecar('backdrops/bevelle-highbridge.json');
    expect([plate['width'], plate['height']]).toEqual([HIGHBRIDGE_PLATE.w, HIGHBRIDGE_PLATE.h]);
  });
});

describe("Natus's ring", () => {
  it('sits where the idle sidecar says: 974 px across, centred at (346, 469) over feet at 1148', () => {
    const idle = sidecar('characters/seymour-natus/idle.json') as { baselineY: number; width: number; layers: { ringDiameterPx: number; ringCentre: [number, number] } };
    const ring = sidecar('characters/seymour-natus-ring/idle.json') as { width: number };
    expect(NATUS_RING.diameter).toBeCloseTo(idle.layers.ringDiameterPx / idle.baselineY, 6);
    expect(NATUS_RING.centreY).toBeCloseTo((idle.baselineY - idle.layers.ringCentre[1]) / idle.baselineY, 6);
    expect(NATUS_RING.plane).toBeCloseTo(ring.width / idle.baselineY, 6);
    // Horizontally centred on the figure (within 2 % of the idle's width).
    expect(Math.abs(idle.layers.ringCentre[0] - idle.width / 2) / idle.width).toBeLessThan(0.02);
  });

  it('follows the staged Natus behind him, turns, fades with him, and hides with no Natus', () => {
    const ring = new NatusRing(HIGHBRIDGE_ACTOR_HEIGHTS.natus);
    (ring as unknown as { texture: object }).texture = { dispose: () => undefined }; // as if the painting loaded
    const root = new Object3D();
    ring.update(0.1, root);
    expect(ring.mesh.visible).toBe(false);
    const natus = new Object3D() as Object3D & { alpha: number; setAlpha(a: number): void };
    natus.name = NATUS_FIGURE_ID;
    natus.alpha = 1;
    natus.setAlpha = (a: number) => (natus.alpha = a); // a staged figure, as the stage parents it
    natus.position.set(2.9, 0, -2.6);
    root.add(natus);
    ring.update(1, root);
    expect(ring.mesh.visible).toBe(true);
    expect(ring.mesh.position.x).toBeCloseTo(2.9, 6);
    expect(ring.mesh.position.z).toBeLessThan(-2.6);
    expect(ring.mesh.position.y).toBeCloseTo(NATUS_RING.centreY * HIGHBRIDGE_ACTOR_HEIGHTS.natus, 6);
    expect(ring.mesh.rotation.z).toBeCloseTo(NATUS_RING.turnPerSecond, 6);
    natus.alpha = 0.4;
    ring.update(0.016, root);
    expect((ring.mesh.material as { opacity: number }).opacity).toBeCloseTo(0.4, 6);
    natus.alpha = 0;
    ring.update(0.016, root);
    expect(ring.mesh.visible).toBe(false);
    ring.dispose();
  });
});

describe('the Highbridge — the real factory through loadScene', () => {
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

  it('builds, publishes the staging switches and heights, and updates without throwing', async () => {
    const scene = await loadScene('bevelle-highbridge', new PerspectiveCamera());
    loaded.push(scene);
    expect(scene.placeholder).toBe(false);
    expect(scene.slots.enemySpots?.['seymour-natus']).toEqual(HIGHBRIDGE_SLOTS.enemy[0]);
    expect(scene.slots.holdParty).toBe(true);
    expect(scene.slots.enemyHeight).toBe(HIGHBRIDGE_ACTOR_HEIGHTS.natus);
    expect(() => scene.update(0.016)).not.toThrow();
  });
});
