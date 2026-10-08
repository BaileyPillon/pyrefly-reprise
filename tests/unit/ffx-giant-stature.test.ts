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
import { PerspectiveCamera, Vector3 } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { FFX_FIEND_STATURE, FFX_GIANT_FOLLOWER, FFX_GIANT_STATURE, giantFigureHeights, giantHeight, giantStand } from '../../src/data/ffx/fiend-stature.ts';
import { TIDUS_TOP } from '../../src/data/ffx/party-stature.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { loadScene, resolveSceneHeights, type LoadedScene } from '../../src/scenes/index.ts';
import { GAGAZET_PARTY_HEIGHT, GAGAZET_STAGING } from '../../src/scenes/gagazet.ts';
import { SIN_BEVELLE_PLATE, SIN_FLIGHT_PLATE, SIN_GENAIS_CORE_STAGING, SIN_PARTY_HEIGHT } from '../../src/scenes/evrae-airship-sin.ts';
import { HIGHBRIDGE_ACTOR_HEIGHTS, HIGHBRIDGE_REAL_SIZE, HIGHBRIDGE_SLOTS, highbridgeHeights } from '../../src/scenes/highbridge.ts';
import { DREAMS_END_BFA_PIN, DREAMS_END_PARTY_HEIGHT, DREAMS_END_RIGS, DREAMS_END_ROW_SHIFT, DREAMS_END_STAGING } from '../../src/scenes/dreams-end.ts';
import { ALL_ROWS, sideShift } from '../../src/engine/fx/mix/stageTable.ts';

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
    // Flux stays where live pinned him; Mortiorchis's offset from him (2.51 left, 1.01 up) grew by the same factor as he did (6.017 / 4.1), and it stands 0.22 further back than live so that
    // it is no nearer the party than live (Bailey, 2026-10-08, "original spacing, real sizes"): the nearest member, Kimahri (-0.61, -1.05), is 6.79 away against live's 6.75
    const grow = 6.017 / 4.1;
    const [fx, fy, fz] = GAGAZET_STAGING.enemySpots['seymour-flux'];
    const [mx, my, mz] = GAGAZET_STAGING.enemySpots.mortiorchis;
    expect([fx, fy, fz]).toEqual([3.54, 0, -7.6]);
    expect(mx - fx).toBeCloseTo(-2.51 * grow, 2);
    expect(my - fy).toBeCloseTo(1.01 * grow, 2);
    expect(mz).toBeLessThan(fz);
    expect(Math.hypot(mx - -0.61, mz - -1.05)).toBeGreaterThanOrEqual(Math.hypot(1.03 - -0.61, -7.6 - -1.05));
  });
});

describe("Chapter III: Braska's Final Aeon and the two Yu Pagodas at 0.75 of the live game's sizes", () => {
  it('the aeon is m132, 92 on the PS2 screen (79 to 95, a floor: the HELP banner covers his top), the pagodas m174 and m173 at 75.8 and 83.9 (floors too), all at 0.75', () => {
    const a = FFX_GIANT_STATURE['braskas-final-aeon']!;
    const [l, r] = [FFX_GIANT_STATURE['yu-pagoda-left']!, FFX_GIANT_STATURE['yu-pagoda-right']!];
    expect([a.model, a.height, a.read, a.lowerBound, a.staticLaw, a.engine, a.share, a.confidence]).toEqual(['m132', 92, [79, 95], true, 204.7, 90, 0.75, 'medium']);
    expect([l.model, l.height, l.lowerBound, l.staticLaw, l.share, l.confidence]).toEqual(['m174', 75.8, true, 34.7, 0.75, 'low-medium']);
    expect([r.model, r.height, r.lowerBound, r.staticLaw, r.share, r.confidence]).toEqual(['m173', 83.9, true, 50.2, 0.75, 'low-medium']);
    // the static law is more than twice too big for the aeon (the model is read with its parts spread) and E agrees with the live number
    expect(a.staticLaw! / a.height).toBeGreaterThan(2);
    expect(Math.abs(a.engine - a.height) / a.height).toBeLessThan(0.05);
  });

  it('the game stands the pagodas 60 units either side of him and 70 behind (boss (0, 0, 40), pagodas (-60, 0, 110) and (60, 0, 110)), and the build scales that by the same 0.75', () => {
    expect(FFX_GIANT_STATURE['yu-pagoda-left']!.stand).toMatchObject({ of: 'braskas-final-aeon', dx: -60, dz: 70 });
    expect(FFX_GIANT_STATURE['yu-pagoda-right']!.stand).toMatchObject({ of: 'braskas-final-aeon', dx: 60, dz: 70 });
    const l = giantStand('yu-pagoda-left', 1.82)!;
    const r = giantStand('yu-pagoda-right', 1.82)!;
    expect(l.dx).toBeCloseTo(-4.512, 3);
    expect(r.dx).toBeCloseTo(4.512, 3);
    expect(l.dz).toBeCloseTo(5.264, 3);
    expect(l.dy).toBeCloseTo(0.963, 3);
    expect(giantStand('seymour-natus', 1.75)).toBeNull();
    expect(giantStand('nobody', 1.82)).toBeNull();
  });

  it('the heights, 0.75 of the live read over the stage party height 1.82: the aeon 6.919 (from 4.1), the pagodas 5.701 and 6.31 (from 2.255)', () => {
    expect(giantFigureHeights(['braskas-final-aeon', 'yu-pagoda-left', 'yu-pagoda-right'], 1.82)).toEqual({ 'braskas-final-aeon': 6.919, 'yu-pagoda-left': 5.701, 'yu-pagoda-right': 6.31 });
    // 5.11 times the party's tops (Tidus 18.15, Yuna 16.53, Auron 19.28: mean 17.99) at one distance; the build draws three quarters of that, 3.83 over the shared height
    expect(92 / ((18.15 + 16.53 + 19.28) / 3)).toBeCloseTo(5.11, 2);
    expect(6.919 / 1.82).toBeCloseTo(3.8, 1);
  });

  it('the scene stages them from the table over the stage default party height, with the aeon and both pagodas pinned', () => {
    expect(DREAMS_END_PARTY_HEIGHT).toBe(resolveSceneHeights({}).partyHeight);
    expect(DREAMS_END_STAGING.holdParty).toBe(true);
    expect(DREAMS_END_STAGING.figureHeights).toEqual({ 'braskas-final-aeon': 6.919, 'yu-pagoda-left': 5.701, 'yu-pagoda-right': 6.31 });
    expect(Object.keys(DREAMS_END_STAGING.enemySpots).sort()).toEqual(['braskas-final-aeon', 'yu-pagoda-left', 'yu-pagoda-right']);
    expect(DREAMS_END_STAGING.enemySpots['braskas-final-aeon']).toEqual([2.03, 0, -8.45]);
  });

  it("CHAPTER FRAMING's Chapter III row moves each figure on a desktop by the numbers the pins carry off (read from the row and this scene's idle rig, so a change to either fails here)", () => {
    const row = ALL_ROWS.find((r) => r.chapter === 'braskas-final-aeon')!;
    const idle = DREAMS_END_RIGS['idle']!;
    const side = sideShift(row, { pos: new Vector3(...idle.position), look: new Vector3(...idle.lookAt), fov: idle.fov ?? 32 }, row.boss);
    const boss = DREAMS_END_ROW_SHIFT['braskas-final-aeon'];
    expect(side.enemy.dx).toBeCloseTo(boss[0], 2);
    expect(side.enemy.dz).toBeCloseTo(boss[1], 2);
    for (const id of ['yu-pagoda-left', 'yu-pagoda-right'] as const) {
      const shift = side.enemyBy!.find((e) => e.id.test(id))!.shift;
      expect(shift.dx, id).toBeCloseTo(DREAMS_END_ROW_SHIFT[id][0], 2);
      expect(shift.dz, id).toBeCloseTo(DREAMS_END_ROW_SHIFT[id][1], 2);
    }
  });

  it("with the row's moves on (a desktop) the pagodas end in the game's arrangement about the aeon: 4.51 either side, 5.26 behind, hung 0.96 off the floor; on a phone they stand on the pins", () => {
    const pin = DREAMS_END_STAGING.enemySpots;
    const at = (id: 'braskas-final-aeon' | 'yu-pagoda-left' | 'yu-pagoda-right', rowOn: boolean): [number, number, number] => [pin[id][0] + (rowOn ? DREAMS_END_ROW_SHIFT[id][0] : 0), pin[id][1], pin[id][2] + (rowOn ? DREAMS_END_ROW_SHIFT[id][1] : 0)];
    const boss = at('braskas-final-aeon', true);
    const [l, r] = [at('yu-pagoda-left', true), at('yu-pagoda-right', true)];
    expect(l[0] - boss[0]).toBeCloseTo(-4.512, 2);
    expect(r[0] - boss[0]).toBeCloseTo(4.512, 2);
    expect(l[2] - boss[2]).toBeCloseTo(-5.264, 2);
    expect(r[2] - boss[2]).toBeCloseTo(-5.264, 2);
    expect(l[1]).toBeCloseTo(0.963, 3);
    expect(boss).toEqual([DREAMS_END_BFA_PIN[0] + DREAMS_END_ROW_SHIFT['braskas-final-aeon'][0], 0, DREAMS_END_BFA_PIN[2] + DREAMS_END_ROW_SHIFT['braskas-final-aeon'][1]]);
    expect(at('braskas-final-aeon', false)).toEqual(DREAMS_END_BFA_PIN);
  });
});

describe('Chapter X: Seymour Natus at his real size, and Mortibody with him', () => {
  it('Natus is m126: the body reads 46.2 on the PS2 screen (with the scythe tip 52.2), the static law 42.0, E 40; Bailey took the whole of it', () => {
    const r = FFX_GIANT_STATURE['seymour-natus']!;
    expect([r.model, r.height, r.read, r.lowerBound, r.staticLaw, r.engine, r.share, r.confidence]).toEqual(['m126', 46.2, [46.2, 52.2], false, 42.0, 40, 1, 'medium']);
    // 2.45 times Chapter X's party (Tidus 18.15, Yuna 16.53, Kimahri 21.98), 2.55 over Tidus
    expect(46.2 / ((18.15 + 16.53 + 21.98) / 3)).toBeCloseTo(2.45, 2);
    expect(46.2 / 18.15).toBeCloseTo(2.55, 2);
    expect(Math.abs(r.staticLaw! - r.height) / r.height).toBeLessThan(0.1);
  });

  it('the heights over the party\'s 1.75: Natus 4.455 (from 2.43) and Mortibody 1.912 (from 1.7), 0.43 of him as on a desktop before', () => {
    expect(giantFigureHeights(['seymour-natus', 'mortibody'], 1.75)).toEqual({ 'seymour-natus': 4.455, mortibody: 1.912 });
    expect(FFX_GIANT_FOLLOWER['mortibody']).toEqual({ of: 'seymour-natus', share: 0.4293 });
    expect(1.7 / 3.96).toBeCloseTo(0.4293, 3); // what it stood at against the 3.96 BOSS SCALE gave him on a desktop
  });

  it("the scene's real-size heights come from the table over its own party height, and are switched OFF until the framing engine's BOSS SCALE entry for him is retired", () => {
    expect(highbridgeHeights(true)).toEqual({ party: 1.75, natus: 4.455, mortibody: 1.912 });
    expect(highbridgeHeights(false)).toEqual({ party: 1.75, natus: 2.43, mortibody: 1.7 });
    // Bailey, 2026-10-08, "original spacing, real sizes": built and off, since on a desktop it would stand him 0.8 nearer the party than live while BOSS SCALE still names him
    expect(HIGHBRIDGE_REAL_SIZE).toBe(false);
    expect(HIGHBRIDGE_ACTOR_HEIGHTS).toEqual(highbridgeHeights(false));
    expect(HIGHBRIDGE_SLOTS.figureHeights).toEqual({ 'seymour-natus': 2.43, mortibody: 1.7 });
    expect(HIGHBRIDGE_SLOTS.enemyHeight).toBe(2.43);
  });

  // The one thing in the way of his picture on a desktop is a line in a folder this lane does not own (docs/handoff/r3942-giants-ffx.md, "What needs the framing engine").
  it.todo("masters.ts scaleTarget no longer names seymour-natus (BOSS SCALE retired): the chapter's pinned colossus master then plays at his real size, as the options study pictured it");
});

describe("Chapter XVII, link 3: Sinspawn Genais and Sin's Core at their real sizes, at today's spots", () => {
  it('Genais is m139 (mesh m102, script scale 0.8): 49 on the PS2 screen (44.2 to 52), the static law 80.3 is the default pose; the Core is m138: 30 (28.7 to 31.7), static 27.2, E 16; both medium, whole', () => {
    const g = FFX_GIANT_STATURE['sinspawn-genais']!;
    const c = FFX_GIANT_STATURE['sin-core']!;
    expect([g.model, g.height, g.read, g.lowerBound, g.staticLaw, g.engine, g.share, g.confidence]).toEqual(['m139', 49, [44.2, 52], false, 80.3, 40, 1, 'medium']);
    expect([c.model, c.height, c.read, c.lowerBound, c.staticLaw, c.engine, c.share, c.confidence]).toEqual(['m138', 30, [28.7, 31.7], false, 27.2, 16, 1, 'medium']);
    // 2.72 and 1.67 times Chapter XVII's party (Tidus 18.15, Yuna 16.53, Auron 19.28: mean 17.99)
    expect(49 / ((18.15 + 16.53 + 19.28) / 3)).toBeCloseTo(2.72, 2);
    expect(30 / ((18.15 + 16.53 + 19.28) / 3)).toBeCloseTo(1.67, 2);
  });

  it('the heights over the deck\'s party height 1.82: Genais 4.913 (+20 percent from the stage\'s 4.1) and the Core 3.008 (-27 percent)', () => {
    expect(SIN_PARTY_HEIGHT).toBe(resolveSceneHeights({}).partyHeight);
    expect(giantFigureHeights(['sinspawn-genais', 'sin-core'], SIN_PARTY_HEIGHT)).toEqual({ 'sinspawn-genais': 4.913, 'sin-core': 3.008 });
    expect(4.913 / 4.1 - 1).toBeCloseTo(0.2, 2);
    expect(3.008 / 4.1 - 1).toBeCloseTo(-0.27, 2);
  });

  it("the Sin flight plate names both and pins them at the spots they stood on, so the solver cannot swap them; no other plate on the deck names either", () => {
    expect(SIN_GENAIS_CORE_STAGING.figureHeights).toEqual({ 'sinspawn-genais': 4.913, 'sin-core': 3.008 });
    expect(SIN_GENAIS_CORE_STAGING.enemySpots).toEqual({ 'sinspawn-genais': [-0.93, 0, -4.1], 'sin-core': [5.89, 0, -5.3] });
    expect(SIN_FLIGHT_PLATE).toBe('sin-fahrenheit-flight');
    expect(SIN_BEVELLE_PLATE).toBe('sin-fahrenheit-bevelle');
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

  it("Chapter X: the loaded Highbridge scene publishes Natus's and Mortibody's heights as the switch has them, at its own party height", async () => {
    const scene = await loadScene('bevelle-highbridge', new PerspectiveCamera());
    loaded.push(scene);
    expect(scene.slots.partyHeight).toBe(HIGHBRIDGE_ACTOR_HEIGHTS.party);
    expect(scene.slots.figureHeights).toEqual({ 'seymour-natus': HIGHBRIDGE_ACTOR_HEIGHTS.natus, mortibody: HIGHBRIDGE_ACTOR_HEIGHTS.mortibody });
    expect(scene.slots.enemyHeight).toBe(HIGHBRIDGE_ACTOR_HEIGHTS.natus);
  });

  it("Chapter XVII: the loaded Sin flight plate hands the stage Genais's and the Core's heights and pins on top of the deck's own; the head's plate and Evrae's deck do not", async () => {
    const flight = await loadScene(SIN_FLIGHT_PLATE, new PerspectiveCamera());
    loaded.push(flight);
    expect(flight.slots.figureHeights).toEqual({ 'sinspawn-genais': 4.913, 'sin-core': 3.008 });
    expect(flight.slots.enemySpots?.['sinspawn-genais']).toEqual([-0.93, 0, -4.1]);
    expect(flight.slots.enemySpots?.['sin-core']).toEqual([5.89, 0, -5.3]);
    expect(Object.keys(flight.slots.enemySpots ?? {}).sort()).toEqual(['cid', 'evrae', 'sin-core', 'sinspawn-genais']); // the deck's own pins stay
    expect(flight.slots.holdParty).toBe(true);
    const head = await loadScene(SIN_BEVELLE_PLATE, new PerspectiveCamera());
    loaded.push(head);
    expect(head.slots.figureHeights).toBeUndefined();
    expect(Object.keys(head.slots.enemySpots ?? {}).sort()).toEqual(['cid', 'evrae']);
  });

  it("Chapter III: the loaded Dream's End scene publishes the aeon's and the pagodas' heights and pins, at the stage's own party height", async () => {
    const scene = await loadScene('dreams-end', new PerspectiveCamera());
    loaded.push(scene);
    expect(scene.slots.partyHeight).toBe(DREAMS_END_PARTY_HEIGHT);
    expect(scene.slots.figureHeights).toEqual(DREAMS_END_STAGING.figureHeights);
    expect(scene.slots.enemySpots).toEqual(DREAMS_END_STAGING.enemySpots);
    expect(scene.slots.holdParty).toBe(true);
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

  it("Chapter X's research section exists and names the body and the tip", () => {
    const doc = read('research/ffx-seymour-natus-highbridge.md');
    expect(doc).toMatch(/## 13\. Research addendum \(2026-10-08\): how tall Seymour Natus stands/);
    expect(doc).toContain('[single source: own measurement]');
    expect(doc).toMatch(/46\.2/);
    expect(doc).toMatch(/52\.2/);
  });

  it("Chapter XVII's research section exists and says the Fins are not built", () => {
    const doc = read('research/ffx-sin.md');
    expect(doc).toMatch(/## 13\. Research addendum \(2026-10-08\): how tall Sinspawn Genais and Sin's Core stand/);
    expect(doc).toContain('[single source: own measurement]');
    expect(doc).toMatch(/Fins and the head are not here/);
    expect(doc).toMatch(/4\.913/);
  });

  it("Chapter III's research section exists and says the aeon's and the pagodas' numbers are floors", () => {
    const doc = read('research/ffx-bfa-yu-yevon.md');
    expect(doc).toMatch(/## 9\. Research addendum \(2026-10-08\): how tall Braska's Final Aeon and the Yu Pagodas stand/);
    expect(doc).toContain('[single source: own measurement]');
    expect(doc).toMatch(/lower bound|floor/i);
    expect(doc).toContain('low-medium');
  });

  it("Chapter I's research section exists, names the method and the disc, and flags the shaky scale", () => {
    const doc = read('research/ffx-seymour-flux.md');
    expect(doc).toMatch(/## 13\. Research addendum \(2026-10-08\): how tall Seymour Flux stands/);
    expect(doc).toContain('[single source: own measurement]');
    expect(doc).toContain('SLUS-20312');
    expect(doc).toMatch(/medium-low/);
  });
});
