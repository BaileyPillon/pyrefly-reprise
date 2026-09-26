// @vitest-environment jsdom
/**
 * Chapter XI (Fallen Aeons): the Road to the Farplane scene and its between-links shot.
 *
 * Tables through the pure exports; the factory under jsdom with a no-op 2D context and an empty
 * art manifest (the Cloister 100 test's set-up: the backdrops go straight to their placeholders,
 * no decode, no network). What it looks like is the browser pass's
 * (`docs/concepts/chapters/fallen-aeons/ship/`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getScene, getSceneFactory, isPlaceholderScene, loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import {
  ROAD_BACKDROP,
  ROAD_FIGURE_HEIGHTS,
  ROAD_IDS,
  ROAD_LINKS_RIG,
  ROAD_RIGS,
  ROAD_SPOTS,
  ROAD_TO_THE_FARPLANE_SLOTS,
  onLinksShot,
} from '../../../src/scenes/road-to-the-farplane.ts';
import { FALLEN_AEONS_LINKS_RIG } from '../../../src/story/scripts/ffx2-fallen-aeons.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { roadShivaGroup } from '../../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/index.ts';
import type { EnemyGroupDef } from '../../../src/battle/common/types.ts';

const at = (v: readonly number[] | Vector3): Vector3 => (v instanceof Vector3 ? v.clone() : new Vector3(v[0], v[1], v[2]));

/** Every formation of the chain, from the registered first link. */
function chainGroups(): EnemyGroupDef[] {
  const out: EnemyGroupDef[] = [];
  let g: EnemyGroupDef | undefined = roadShivaGroup;
  while (g) {
    out.push(g);
    g = g.nextGroupId ? (ENEMY_GROUPS_BY_ID as Record<string, EnemyGroupDef | undefined>)[g.nextGroupId] : undefined;
  }
  return out;
}

describe('the Road to the Farplane — tables', () => {
  it('is registered as a real scene under plate A\'s id, and Chapter XI points at it', () => {
    expect(getSceneFactory('road-to-the-farplane')).toBeDefined();
    expect(isPlaceholderScene('road-to-the-farplane')).toBe(false);
    expect(getScene('road-to-the-farplane')?.slots).toBe(ROAD_TO_THE_FARPLANE_SLOTS);
    expect(getChapter('ffx2-fallen-aeons')?.sceneKey).toBe('road-to-the-farplane');
  });

  it('both installed plates are on disk (O-3 A for the fights, B between links)', () => {
    for (const f of ['road-to-the-farplane.png', 'road-to-the-farplane-links.png']) {
      expect(existsSync(resolve('public/art/backdrops', f)), f).toBe(true);
    }
  });

  it('stages every fighter the three links field, and only those', () => {
    const ids = chainGroups().flatMap((g) => g.enemies.map((e) => e.id));
    expect(ids.sort()).toEqual(Object.values(ROAD_IDS).sort());
    expect(Object.keys(ROAD_SPOTS).sort()).toEqual([...ids].sort());
    expect(ROAD_TO_THE_FARPLANE_SLOTS.enemySpots).toBe(ROAD_SPOTS);
    expect(ROAD_TO_THE_FARPLANE_SLOTS.holdParty).toBe(true);
  });

  it('the Sisters at the concepts README\'s heights: Sandy tallest, Mindy smallest and hovering', () => {
    expect(ROAD_FIGURE_HEIGHTS[ROAD_IDS.sandy]).toBe(2.3);
    expect(ROAD_FIGURE_HEIGHTS[ROAD_IDS.cindy]).toBe(1.7);
    expect(ROAD_FIGURE_HEIGHTS[ROAD_IDS.mindy]).toBe(1.2);
    expect(ROAD_SPOTS[ROAD_IDS.mindy]![1]).toBeGreaterThan(0);
    for (const id of [ROAD_IDS.shiva, ROAD_IDS.sandy, ROAD_IDS.cindy, ROAD_IDS.anima]) expect(ROAD_SPOTS[id]![1], id).toBe(0);
  });

  it('every fighter stands right of and behind the party, and in frame at the idle rig (16:9)', () => {
    const rig = ROAD_RIGS['idle']!;
    const cam = new PerspectiveCamera(rig.fov, 16 / 9, 0.1, 200);
    cam.position.copy(at(rig.position as number[]));
    cam.lookAt(at(rig.lookAt as number[]));
    cam.updateMatrixWorld();
    const party = ROAD_TO_THE_FARPLANE_SLOTS.party;
    for (const [id, spot] of Object.entries(ROAD_SPOTS)) {
      const h = ROAD_FIGURE_HEIGHTS[id] ?? 3.4;
      for (const y of [spot[1], spot[1] + h]) {
        const p = new Vector3(spot[0], y, spot[2]).project(cam);
        expect(Math.abs(p.y), `${id} y`).toBeLessThan(0.95);
        // The FFX-2 command list starts at 0.745 of the width: x < 0.49 in NDC.
        expect(p.x, `${id} left of the command list`).toBeLessThan(0.49);
      }
      expect(spot[2], id).toBeLessThan(Math.min(...party.map((s) => s[2])));
    }
  });

  it('the between-links rig is the story\'s, and only a camera standing on it shows plate B', () => {
    expect(FALLEN_AEONS_LINKS_RIG).toBe(ROAD_LINKS_RIG);
    expect(onLinksShot(at(ROAD_RIGS[ROAD_LINKS_RIG]!.position as number[]))).toBe(true);
    for (const name of ['intro', 'idle', 'action', 'party', 'enemy', 'victory', 'reveal']) {
      expect(onLinksShot(at(ROAD_RIGS[name]!.position as number[])), name).toBe(false);
    }
    for (const name of ['intro', 'idle', 'action', 'victory']) expect(ROAD_RIGS[name], name).toBeDefined();
  });

  it('frames the plate larger than Chapter V does, so the painted platform runs under the party', () => {
    // Chapter V: 88 wide, centre -0.5 (`farplane.ts`). Raised and widened: the platform's top edge
    // (plate row 0.79) sits behind the fighters and the plate's foot below the frame.
    expect(ROAD_BACKDROP.width).toBeGreaterThan(88);
    expect(ROAD_BACKDROP.centreY).toBeGreaterThan(-0.5);
  });
});

describe('the Road to the Farplane — the real factory', () => {
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

  it('builds through loadScene, publishes the staging, and updates without throwing', async () => {
    const scene = await loadScene('road-to-the-farplane', new PerspectiveCamera());
    loaded.push(scene);
    expect(scene.placeholder).toBe(false);
    expect(scene.slots.enemySpots?.[ROAD_IDS.shiva]).toEqual(ROAD_SPOTS[ROAD_IDS.shiva]);
    expect(scene.slots.figureHeights?.[ROAD_IDS.mindy]).toBe(1.2);
    expect(scene.slots.holdParty).toBe(true);
    expect(() => scene.update(0.016)).not.toThrow();
  });

  it('swaps to plate B on the road-links rig and back to plate A off it', async () => {
    const build = await getSceneFactory('road-to-the-farplane')!({ watchAssets: false });
    const probe = build.group.children.find((c) => typeof (c as Object3D).onBeforeRender === 'function' && c.frustumCulled === false)!;
    expect(probe).toBeDefined();
    const plateA = build.backdrop.group;
    const plateB = build.group.children.find((c) => c !== plateA && c.type === 'Group' && c.visible === false)!;
    expect(plateB).toBeDefined();
    const render = (pos: Vector3): void => {
      const cam = new PerspectiveCamera();
      cam.position.copy(pos);
      probe.onBeforeRender(null as never, null as never, cam, null as never, null as never, null as never);
    };
    render(at(ROAD_RIGS[ROAD_LINKS_RIG]!.position as number[]));
    expect(plateB.visible).toBe(true);
    expect(plateA.visible).toBe(false);
    render(at(ROAD_RIGS['idle']!.position as number[]));
    expect(plateB.visible).toBe(false);
    expect(plateA.visible).toBe(true);
    build.dispose();
  });
});
