// @vitest-environment jsdom
/**
 * **The FFX giants at Bailey's picks (FFX only; branch r3942-giants-ffx, wave 2).**
 *
 * `src/data/ffx/fiend-stature.ts` `FFX_GIANT_STATURE` holds what the live PS2 game draws of Seymour Flux, Braska's Final Aeon and the Yu Pagodas, Natus, Sinspawn Genais and
 * the Core (silhouettes read in PCSX2 by the sizes lane, `research/ffx-seymour-flux.md` section 13 and its sisters) and, per row, Bailey's pick of 2026-10-08 ("I'll go with all
 * of your recommendations"): the share of it the build draws. These tests pin the rows and their arithmetic, that the scenes' heights come from the table, that the giants the
 * options study left alone stay out, and that the table is pure data that says how sure it is.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PerspectiveCamera } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { FFX_FIEND_STATURE, FFX_GIANT_FOLLOWER, FFX_GIANT_STATURE, giantFigureHeights, giantHeight } from '../../src/data/ffx/fiend-stature.ts';
import { TIDUS_TOP } from '../../src/data/ffx/party-stature.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { loadScene, resolveSceneHeights, type LoadedScene } from '../../src/scenes/index.ts';
import { GAGAZET_PARTY_HEIGHT, GAGAZET_STAGING } from '../../src/scenes/gagazet.ts';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string): string => readFileSync(join(here, '../..', rel), 'utf8');

describe('the table: what the live game draws, and the pick', () => {
  it('Flux: 100 units on the PS2 screen (91.1 to 103 as he breathes), m142, static law 100.5, E 45; Bailey took 0.6 of it', () => {
    const r = FFX_GIANT_STATURE['seymour-flux']!;
    expect(r.model).toBe('m142');
    expect(r.height).toBe(100);
    expect(r.read).toEqual([91.1, 103]);
    expect(r.staticLaw).toBe(100.5);
    expect(r.engine).toBe(45);
    expect(r.share).toBe(0.6);
    expect(r.lowerBound).toBe(false);
  });

  it("says how sure each number is: Flux's scale is shaky (medium-low), and no row claims more than the lane did (medium)", () => {
    expect(FFX_GIANT_STATURE['seymour-flux']!.confidence).toBe('medium-low');
    for (const [id, r] of Object.entries(FFX_GIANT_STATURE)) expect(['medium', 'medium-low', 'low-medium'], id).toContain(r.confidence);
  });

  it('every row keeps its read range around its height and its share is a pick (0.6, 0.75 or 1)', () => {
    for (const [id, r] of Object.entries(FFX_GIANT_STATURE)) {
      expect(r.read[0], id).toBeLessThanOrEqual(r.height);
      expect(r.read[1], id).toBeGreaterThanOrEqual(r.height - 1e-9);
      expect([0.6, 0.75, 1], id).toContain(r.share);
    }
  });

  it('the giants are not in the wave-1 table, which is raw mesh x C and nothing else', () => {
    for (const id of Object.keys(FFX_GIANT_STATURE)) expect(FFX_FIEND_STATURE[id], id).toBeUndefined();
    for (const id of Object.keys(FFX_GIANT_FOLLOWER)) expect(FFX_FIEND_STATURE[id], id).toBeUndefined();
  });

  it('holds no giant the study left alone: Yunalesca, Evrae, Omnis, the Fins, the head, Yojimbo and every FFX-2 boss', () => {
    for (const id of ['yunalesca', 'evrae', 'seymour-omnis', 'left-fin', 'right-fin', 'overdrive-sin', 'yojimbo', 'bahamut', 'ffx2-bahamut', 'anima', 'paragon']) {
      expect(FFX_GIANT_STATURE[id], id).toBeUndefined();
    }
  });
});

describe('the heights: party height x height x share over Tidus (18.15), to the millimetre', () => {
  it("Flux at 0.6 of 100 against Tidus's 1.82 is 6.017 (4.1 before), and Mortiorchis keeps its 0.55 of him: 3.309 (2.255 before)", () => {
    expect(TIDUS_TOP).toBe(18.15);
    expect(giantHeight('seymour-flux', 1.82)).toBe(6.017);
    expect(giantHeight('mortiorchis', 1.82)).toBe(3.309);
    expect(giantHeight('mortiorchis', 1.82)! / giantHeight('seymour-flux', 1.82)!).toBeCloseTo(0.55, 3);
    expect(giantFigureHeights(['seymour-flux', 'mortiorchis', 'nobody'], 1.82)).toEqual({ 'seymour-flux': 6.017, mortiorchis: 3.309 });
    expect(giantHeight('nobody', 1.82)).toBeUndefined();
  });

  it("Flux reads 5.29 times Chapter I's party at one distance (his 100 over its tops 18.15, 16.53 and 21.98), and the build draws 60 percent of that", () => {
    const partyMean = (18.15 + 16.53 + 21.98) / 3;
    expect(100 / partyMean).toBeCloseTo(5.29, 2);
    expect((giantHeight('seymour-flux', 1.82)! / 1.82) * TIDUS_TOP).toBeCloseTo(60, 1);
  });
});

describe("Chapter I stands Flux and Mortiorchis from the table, and the camera backs off for him", () => {
  it('the scene names both heights from the table over the stage default party height, and pins Mortiorchis against him', () => {
    expect(GAGAZET_PARTY_HEIGHT).toBe(resolveSceneHeights({}).partyHeight);
    expect(GAGAZET_STAGING.figureHeights).toEqual({ 'seymour-flux': 6.017, mortiorchis: 3.309 });
    // Flux stays where live pinned him; Mortiorchis's offset from him (2.51 left, 1.01 up) grew by the same factor as he did (6.017 / 4.1)
    const grow = 6.017 / 4.1;
    const [fx, fy, fz] = GAGAZET_STAGING.enemySpots['seymour-flux'];
    const [mx, my, mz] = GAGAZET_STAGING.enemySpots.mortiorchis;
    expect([fx, fy, fz]).toEqual([3.54, 0, -7.6]);
    expect(mx - fx).toBeCloseTo(-2.51 * grow, 2);
    expect(my - fy).toBeCloseTo(1.01 * grow, 2);
    expect(mz).toBe(fz);
  });
});

describe('the real factory publishes the heights (jsdom, a no-op 2D context, an empty art manifest)', () => {
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

  it('Chapter I: the loaded Gagazet scene hands the stage the giants\' heights, at the stage\'s own party height', async () => {
    const scene = await loadScene('gagazet', new PerspectiveCamera());
    loaded.push(scene);
    expect(scene.slots.partyHeight).toBe(GAGAZET_PARTY_HEIGHT);
    expect(scene.slots.figureHeights).toEqual({ 'seymour-flux': 6.017, mortiorchis: 3.309 });
    expect(scene.slots.enemySpots?.mortiorchis).toEqual(GAGAZET_STAGING.enemySpots.mortiorchis);
  });
});

describe('the table is pure data, cites its sources and says how sure it is', () => {
  const src = read('src/data/ffx/fiend-stature.ts');

  it('imports nothing but the party table, and no DOM or three', () => {
    const imports = [...src.matchAll(/^import .* from '(.+)';$/gm)].map((m) => m[1]);
    expect(imports).toEqual(['./party-stature.ts']);
    expect(src).not.toMatch(/document\.|window\.|from 'three'/);
  });

  it('carries the tags the citation rules want: the live read is one lane\'s own measurement, the static law is datamined', () => {
    expect(src).toContain('[single source: own measurement]');
    expect(src).toContain('[datamined: FFX HD Remaster build 25501027, bind pose, one reader]');
    expect(src).toContain('research/ffx-seymour-flux.md');
    expect(src).toContain('section 13');
  });

  it("Chapter I's research section exists, names the method and the disc, and flags the shaky scale", () => {
    const doc = read('research/ffx-seymour-flux.md');
    expect(doc).toMatch(/## 13\. Research addendum \(2026-10-08\): how tall Seymour Flux stands/);
    expect(doc).toContain('[single source: own measurement]');
    expect(doc).toContain('SLUS-20312');
    expect(doc).toMatch(/medium-low/);
  });
});
