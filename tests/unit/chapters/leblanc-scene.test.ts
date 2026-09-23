// @vitest-environment jsdom
/**
 * **Chateau Leblanc, the Last Room — scene staging.**
 *
 * The slot and height tables are checked through the **pure exports** of
 * `src/scenes/leblanc-last-room.ts`. PR-0093 is checked through the path the
 * game actually takes: `loadScene('leblanc-last-room', camera)` runs the real
 * `SceneFactory` and the real `fromSceneBuild`, and the test reads the heights
 * on the `LoadedScene.slots` the battle stage is handed. The factory paints
 * its placeholder backdrop on a canvas, so this file runs under jsdom with a
 * no-op 2D context and an art manifest that lists no backdrops (the loader
 * goes straight to the placeholder, no image decode, no network). What the
 * painting looks like is not under test here; the browser pass in
 * `docs/handoff/chapter-leblanc-scene.md` and
 * `docs/screenshots/chapters/pr-0093-scale.png` is.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Nothing here exists in FFX;
 * the Gagazet check below pins that the shared fallback leaves chapters 1-5
 * where they were.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PerspectiveCamera } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  LEBLANC_LAST_ROOM_ACTOR_HEIGHTS,
  LEBLANC_LAST_ROOM_SLOTS,
} from '../../../src/scenes/leblanc-last-room.ts';
import { loadScene, resolveSceneHeights, type LoadedScene } from '../../../src/scenes/index.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { LEBLANC_ACT_III } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/index.ts';

describe('leblanc-last-room — the trio and the party marks', () => {
  it('publishes exactly one slot per active party member and at least one per enemy the formation can field', () => {
    expect(LEBLANC_LAST_ROOM_SLOTS.party).toHaveLength(3);
    const formation = ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III];
    expect(formation).toBeDefined();
    expect(LEBLANC_LAST_ROOM_SLOTS.enemy.length).toBeGreaterThanOrEqual(formation!.enemies.length);
  });

  it('every published slot is a finite [x, 0, z] on the ground plane', () => {
    for (const slot of [...LEBLANC_LAST_ROOM_SLOTS.party, ...LEBLANC_LAST_ROOM_SLOTS.enemy]) {
      expect(slot).toHaveLength(3);
      for (const n of slot) expect(Number.isFinite(n)).toBe(true);
      expect(slot[1]).toBe(0);
    }
  });

  it('stages Leblanc centre-back with Ormi and Logos flanking on either side of her, matching leblanc-syndicate.ts\'s slot order (0 Leblanc, 1 Logos, 2 Ormi)', () => {
    const formation = ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III]!;
    const bySlot = new Map(formation.enemies.map((e) => [e.slot, e.id]));
    expect(bySlot.get(0)).toBe('leblanc');
    expect(bySlot.get(1)).toBe('logos');
    expect(bySlot.get(2)).toBe('ormi');

    const [leblancPos, logosPos, ormiPos] = LEBLANC_LAST_ROOM_SLOTS.enemy;
    // "Flanking" means the two henchmen sit on either side of Leblanc's own
    // x — not both on the same side of her, which would read as a line, not
    // a trio blocking a door.
    expect(Math.sign(logosPos![0] - leblancPos![0])).not.toBe(0);
    expect(Math.sign(ormiPos![0] - leblancPos![0])).not.toBe(0);
    expect(Math.sign(logosPos![0] - leblancPos![0])).not.toBe(Math.sign(ormiPos![0] - leblancPos![0]));
  });

  it('keeps every enemy slot on the enemy side of the field and every party slot on the party side, per SceneSlots\' own contract ("party faces +x, enemies face -x")', () => {
    for (const slot of LEBLANC_LAST_ROOM_SLOTS.enemy) expect(slot[2]).toBeLessThan(0);
    for (const slot of LEBLANC_LAST_ROOM_SLOTS.party.slice(0, 3)) expect(slot[2]).toBeGreaterThan(-2);
  });

  it('gives every actor a positive, human-scaled world height, and keeps Ormi shorter and Logos taller than the party baseline (options.json: Ormi "short and stout", Logos "tall and slim")', () => {
    const h = LEBLANC_LAST_ROOM_ACTOR_HEIGHTS;
    for (const height of Object.values(h)) {
      expect(height).toBeGreaterThan(1.2);
      expect(height).toBeLessThan(2.3);
    }
    expect(h.ormi).toBeLessThan(h.yuna);
    expect(h.logos).toBeGreaterThan(h.paine);
  });

  it('gives partyHeight/enemyHeight sane fallbacks for a generic actor placed with no explicit height', () => {
    expect(LEBLANC_LAST_ROOM_SLOTS.partyHeight).toBeCloseTo(LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.yuna, 5);
    expect(LEBLANC_LAST_ROOM_SLOTS.enemyHeight).toBeCloseTo(LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc, 5);
  });
});

/**
 * A 2D context that accepts every call and draws nothing. `getImageData`
 * hands back real (black) pixel arrays, because the backdrop samples its
 * palette bands off the painting.
 */
function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const pixels = (w: number, h: number) => ({
    data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4),
    width: w,
    height: h,
  });
  const stub: object = new Proxy(function () {}, {
    get: (_t, prop) => (prop === 'then' ? undefined : stub),
    apply: () => stub,
    set: () => true,
  });
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

describe('leblanc-last-room — PR-0093: the trio stages at human scale, not the Gagazet-boss fallback', () => {
  const loaded: LoadedScene[] = [];

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      return noopContext(this) as never;
    });
    // No painting is indexed, so `loadPainted` goes straight to the placeholder.
    setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
  });

  afterAll(() => {
    for (const scene of loaded) scene.dispose();
    resetArtManifest();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function stage(key: string): Promise<LoadedScene> {
    const scene = await loadScene(key, new PerspectiveCamera(40, 16 / 9, 0.1, 200));
    loaded.push(scene);
    return scene;
  }

  it("loadScene hands the battle stage this scene's own heights, not 1.82 / 4.1", async () => {
    // Before the fix `fromSceneBuild` hard-coded partyHeight 1.82 and
    // enemyHeight 4.1 for every SceneFactory scene, so "short and stout" Ormi
    // stood 2.25x the party (round 09 PR-0093).
    const scene = await stage('leblanc-last-room');
    expect(scene.key).toBe('leblanc-last-room');
    expect(scene.slots.party).toHaveLength(3);
    expect(scene.slots.partyHeight).toBeCloseTo(LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.yuna, 5);
    expect(scene.slots.enemyHeight).toBeCloseTo(LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc, 5);
    expect(scene.slots.enemyHeight).toBeLessThan(2.3);
    // The stage and the published slot table agree.
    expect(scene.slots.partyHeight).toBeCloseTo(LEBLANC_LAST_ROOM_SLOTS.partyHeight!, 5);
    expect(scene.slots.enemyHeight).toBeCloseTo(LEBLANC_LAST_ROOM_SLOTS.enemyHeight!, 5);
  }, 60_000);

  it('a scene that publishes no heights (Gagazet, chapter 1) still stages at 1.82 / 4.1', async () => {
    const scene = await stage('gagazet');
    expect(scene.slots.partyHeight).toBe(1.82);
    expect(scene.slots.enemyHeight).toBe(4.1);
  }, 60_000);

  it('resolveSceneHeights falls back to the Gagazet-era 1.82/4.1 for a build that publishes neither', () => {
    expect(resolveSceneHeights({})).toEqual({ partyHeight: 1.82, enemyHeight: 4.1 });
    expect(resolveSceneHeights({ partyHeight: undefined, enemyHeight: undefined })).toEqual({
      partyHeight: 1.82,
      enemyHeight: 4.1,
    });
  });
});

describe('leblanc-last-room — FFX-2-only absence [AGENTS.md rule 14]', () => {
  it('imports nothing from the FFX (CTB) side of the data or engine tree', () => {
    // Read the module's own source rather than its runtime shape: an import of
    // `src/data/ffx/**` or `src/battle/ffx/**` would be a game-case violation
    // even if nothing it exported were used.
    // `join` rather than `new URL(...)`: under jsdom the global URL is jsdom's.
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../src/scenes/leblanc-last-room.ts'), 'utf8');
    expect(src).not.toMatch(/from ['"].*\/battle\/ffx\//);
    expect(src).not.toMatch(/from ['"].*\/data\/ffx\//);
  });
});
