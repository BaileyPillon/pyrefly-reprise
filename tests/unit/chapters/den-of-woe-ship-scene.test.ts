// @vitest-environment jsdom
/**
 * Chapter XV (the Den of Woe): the Den scene.
 *
 * Tables through the pure exports; the factory under jsdom with a no-op 2D context and an empty
 * art manifest (the Chapter XI scene test's set-up: the backdrop goes straight to its placeholder,
 * no decode, no network). What it looks like is the browser pass's
 * (`docs/concepts/chapters/den-of-woe/ship/`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PerspectiveCamera, Vector3 } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getScene, getSceneFactory, isPlaceholderScene, loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import {
  DEN_BACKDROP,
  DEN_FIGURE_HEIGHTS,
  DEN_IDS,
  DEN_OF_WOE_SLOTS,
  DEN_PARTY_HEIGHT,
  DEN_RIGS,
  DEN_SPOTS,
} from '../../../src/scenes/den-of-woe.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { denBaralaiGroup } from '../../../src/data/ffx2/enemies/den-of-woe.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/index.ts';
import type { EnemyGroupDef } from '../../../src/battle/common/types.ts';

/** Every formation of the chain, from the registered first link. */
function chainGroups(): EnemyGroupDef[] {
  const out: EnemyGroupDef[] = [];
  let g: EnemyGroupDef | undefined = denBaralaiGroup;
  while (g) {
    out.push(g);
    g = g.nextGroupId ? (ENEMY_GROUPS_BY_ID as Record<string, EnemyGroupDef | undefined>)[g.nextGroupId] : undefined;
  }
  return out;
}

describe('the Den of Woe — tables', () => {
  it("is registered as a real scene under the plate's id, and Chapter XV points at it", () => {
    expect(getSceneFactory('den-of-woe')).toBeDefined();
    expect(isPlaceholderScene('den-of-woe')).toBe(false);
    expect(getScene('den-of-woe')?.slots).toBe(DEN_OF_WOE_SLOTS);
    expect(getChapter('ffx2-den-of-woe')?.sceneKey).toBe('den-of-woe');
    expect(existsSync(resolve('public/art/backdrops', 'den-of-woe.png'))).toBe(true);
  });

  it('stages every shade the three links field, and only those, one a link on the boss spot', () => {
    const groups = chainGroups();
    expect(groups).toHaveLength(3);
    const ids = groups.flatMap((g) => g.enemies.map((m) => m.id)).sort();
    expect(ids).toEqual(Object.values(DEN_IDS).sort());
    expect(Object.keys(DEN_SPOTS).sort()).toEqual(ids);
    for (const g of groups) expect(g.enemies, g.id).toHaveLength(1);
  });

  it('each shade stands over a girl at the size of the options frames, Nooj the tallest (bible 188 cm), Gippal the shortest', () => {
    for (const id of Object.values(DEN_IDS)) {
      expect(DEN_FIGURE_HEIGHTS[id]!, id).toBeGreaterThan(DEN_PARTY_HEIGHT * 1.3);
      expect(DEN_FIGURE_HEIGHTS[id]!, id).toBeLessThan(DEN_PARTY_HEIGHT * 1.7);
    }
    expect(DEN_FIGURE_HEIGHTS[DEN_IDS.nooj]!).toBeGreaterThan(DEN_FIGURE_HEIGHTS[DEN_IDS.baralai]!);
    expect(DEN_FIGURE_HEIGHTS[DEN_IDS.baralai]!).toBeGreaterThan(DEN_FIGURE_HEIGHTS[DEN_IDS.gippal]!);
  });

  it('every shade stands right of and behind the party, and in frame at the idle rig (16:9)', () => {
    const idle = DEN_RIGS['idle']!;
    const cam = new PerspectiveCamera(idle.fov, 16 / 9, 0.1, 200);
    cam.position.set(...(idle.position as [number, number, number]));
    cam.lookAt(new Vector3(...(idle.lookAt as [number, number, number])));
    cam.updateMatrixWorld();
    for (const [id, spot] of Object.entries(DEN_SPOTS)) {
      expect(spot[0], id).toBeGreaterThan(DEN_OF_WOE_SLOTS.party[2]![0]);
      expect(spot[2], id).toBeLessThan(DEN_OF_WOE_SLOTS.party[2]![2]);
      for (const y of [0, DEN_FIGURE_HEIGHTS[id]!]) {
        const p = new Vector3(spot[0], y, spot[2]).project(cam);
        expect(Math.abs(p.x), `${id} x at y ${y}`).toBeLessThan(1);
        expect(Math.abs(p.y), `${id} y at y ${y}`).toBeLessThan(1);
      }
    }
  });

  it("frames the plate as Chapter V frames its own (the same horizon-over-floor layout)", () => {
    expect(DEN_BACKDROP).toEqual({ width: 88, distance: -48, centreY: -0.5 });
  });
});

describe('the Den of Woe — the real factory', () => {
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
    const scene = await loadScene('den-of-woe', new PerspectiveCamera());
    loaded.push(scene);
    expect(scene.placeholder).toBe(false);
    expect(scene.slots.enemySpots?.[DEN_IDS.nooj]).toEqual(DEN_SPOTS[DEN_IDS.nooj]);
    expect(scene.slots.figureHeights?.[DEN_IDS.gippal]).toBe(DEN_FIGURE_HEIGHTS[DEN_IDS.gippal]);
    expect(scene.slots.holdParty).toBe(true);
    expect(() => scene.update(0.016)).not.toThrow();
  });
});
