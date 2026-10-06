import { afterEach, beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { Object3D, PerspectiveCamera } from 'three';
import { DRIFT_FFX, driftAt } from '../../src/engine/fx/b/CameraDrift.ts';
import { Framing } from '../../src/engine/fx/mix/framing.ts';
import type { Actor } from '../../src/engine/fx/mix/geometry.ts';
import { CALM_EASE_SECONDS, calmStep, calmedDrift, menuCalm } from '../../src/engine/fx/mix/menuCalm.ts';
import { ALL_ROWS, CHAPTER_III_STAGED, setStageTable, setStandOverride, standFor, STAGE_TABLE } from '../../src/engine/fx/mix/stageTable.ts';

/**
 * Chapter III, option 1 (release 39; FFX only, Braska's Final Aeon; Bailey 2026-10-04): a calmer camera while a command menu is open, with the boss
 * 2.6 right and 0.95 back. What the calm does to the drift, when a fight arms it, how it eases, and how the row and its one switch relate.
 * Pure: no GPU, no browser (`Framing` is driven with fake actors, a stub document for the menu).
 */
const CALM = { drift: 0.15, lean: 0.5 };

const actor = (name: string, facing: number, x = 0, z = 0): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  a.position.set(x, 0, z);
  return a;
};

afterEach(() => {
  menuCalm.reset();
  setStandOverride(null);
  vi.unstubAllGlobals();
});

describe('the eased weight', () => {
  it('rises to 1 over a second while a menu is open, and falls to 0 over a second after', () => {
    let w = 0;
    for (let i = 0; i < 30; i++) w = calmStep(w, true, 1 / 60);
    expect(w).toBeCloseTo(0.5, 6);
    for (let i = 0; i < 30; i++) w = calmStep(w, true, 1 / 60);
    expect(w).toBeCloseTo(1, 6);
    for (let i = 0; i < 60; i++) w = calmStep(w, true, 1 / 60);
    expect(w).toBe(1); // never past 1
    for (let i = 0; i < 60; i++) w = calmStep(w, false, 1 / 60);
    expect(w).toBeCloseTo(0, 6);
    expect(CALM_EASE_SECONDS).toBe(1);
  });

  it('holds on a frame of no time, never leaves 0..1, and takes a long frame in one step', () => {
    expect(calmStep(0.4, true, 0)).toBe(0.4);
    expect(calmStep(0.4, true, -1)).toBe(0.4);
    expect(calmStep(0.4, true, 9)).toBe(1);
    expect(calmStep(0.4, false, 9)).toBe(0);
    expect(calmStep(0.4, true, 0.1, 0)).toBe(1); // an ease of nothing is a cut
  });
});

describe('the calmed drift', () => {
  const raw = { x: 0.4, y: 0.1, z: -0.12 };

  it('is the drift unchanged at weight 0', () => {
    expect(calmedDrift(raw, CALM, 0, 1)).toEqual(raw);
  });

  it('keeps 15 percent of the amplitude and leans half a unit right at weight 1 and the drift at full weight', () => {
    const d = calmedDrift(raw, CALM, 1, 1);
    expect(d.x).toBeCloseTo(0.4 * 0.15 + 0.5, 9);
    expect(d.y).toBeCloseTo(0.1 * 0.15, 9);
    expect(d.z).toBeCloseTo(-0.12 * 0.15, 9);
  });

  it('is halfway at weight 0.5: amplitude 0.575 of the drift, and half the lean', () => {
    const d = calmedDrift(raw, CALM, 0.5, 1);
    expect(d.x).toBeCloseTo(0.4 * 0.575 + 0.25, 9);
    expect(d.y).toBeCloseTo(0.1 * 0.575, 9);
  });

  it('brings the lean in and out with the drift itself: none while the drift has no weight, half at half weight (the tier and the dial)', () => {
    expect(calmedDrift({ x: 0, y: 0, z: 0 }, CALM, 1, 0).x).toBe(0);
    expect(calmedDrift({ x: 0, y: 0, z: 0 }, CALM, 1, 0.5).x).toBeCloseTo(0.25, 9);
  });

  it('puts the camera on its right half for the whole swing: never left of 0.42, never right of 0.58 (the drift alone swings 0.5 each way)', () => {
    let lo = Infinity;
    let hi = -Infinity;
    let rawLo = Infinity;
    let rawHi = -Infinity;
    for (let t = 0; t <= 120; t += 0.05) {
      const r = driftAt(t, DRIFT_FFX, 1);
      const d = calmedDrift(r, CALM, 1, 1);
      lo = Math.min(lo, d.x);
      hi = Math.max(hi, d.x);
      rawLo = Math.min(rawLo, r.x);
      rawHi = Math.max(rawHi, r.x);
    }
    expect(rawLo).toBeLessThan(-0.45); // the control: the full drift does go well left of centre
    expect(rawHi).toBeGreaterThan(0.45);
    expect(lo).toBeGreaterThan(0.42);
    expect(hi).toBeLessThan(0.58);
  });
});

describe('the shared state', () => {
  it('does nothing until a fight arms it, and eases in only while its menu is open', () => {
    expect(menuCalm.active).toBeNull();
    menuCalm.arm(null, true);
    for (let i = 0; i < 90; i++) menuCalm.step(1 / 60);
    expect(menuCalm.weight).toBe(0);
    expect(menuCalm.active).toBeNull();
    menuCalm.arm(CALM, false);
    for (let i = 0; i < 90; i++) menuCalm.step(1 / 60);
    expect(menuCalm.weight).toBe(0);
    menuCalm.arm(CALM, true);
    for (let i = 0; i < 30; i++) menuCalm.step(1 / 60);
    expect(menuCalm.weight).toBeCloseTo(0.5, 6);
    expect(menuCalm.active).toBe(CALM);
  });

  it('eases back out between menus, keeping the amounts it was easing with, and is gone after a second', () => {
    menuCalm.arm(CALM, true);
    for (let i = 0; i < 90; i++) menuCalm.step(1 / 60);
    expect(menuCalm.weight).toBe(1);
    menuCalm.arm(CALM, false);
    for (let i = 0; i < 30; i++) menuCalm.step(1 / 60);
    expect(menuCalm.weight).toBeCloseTo(0.5, 6);
    expect(menuCalm.active).toBe(CALM);
    menuCalm.arm(null, false); // the row went away mid-ease (the fight ended): it still finishes its second with the amounts it had
    for (let i = 0; i < 20; i++) menuCalm.step(1 / 60);
    expect(menuCalm.active).toBe(CALM);
    for (let i = 0; i < 20; i++) menuCalm.step(1 / 60);
    expect(menuCalm.weight).toBeCloseTo(0, 6);
    expect(menuCalm.active).toBeNull();
  });

  it('is cleared by a reset: nothing carries into the next fight', () => {
    menuCalm.arm(CALM, true);
    for (let i = 0; i < 90; i++) menuCalm.step(1 / 60);
    menuCalm.reset();
    expect(menuCalm.weight).toBe(0);
    expect(menuCalm.active).toBeNull();
    expect(menuCalm.armed).toEqual({ spec: null, open: false });
  });
});

describe("Chapter III's row: one switch plays the placement and the calm camera together", () => {
  const ch3 = ['braskas-final-aeon-1', 'yu-pagoda', 'yu-pagoda'];
  const row = ALL_ROWS.find((r) => r.chapter === 'braskas-final-aeon')!;

  it('is on: Chapter III plays option 1 (release 39), and the table has it', () => {
    expect(CHAPTER_III_STAGED).toBe(true);
    expect(STAGE_TABLE.map((r) => r.chapter)).toEqual(['yunalesca', 'braskas-final-aeon', 'seymour-natus', 'seymour-omnis']); // Chapter X's row is r39-natus's (the colossus pin), merged beside Chapter III's; Chapter XII's (the party apart) is r391-ui's
  });

  it('stands the boss 2.6 right and 0.95 back, the party and the Yu Pagodas where the built row put them', () => {
    expect(row.enemy).toEqual({ right: 2.6, toward: -0.95 });
    expect(row.party).toEqual({ right: 0.35, toward: 0 });
    expect(row.enemyBy?.map((e) => [e.id.source, e.move])).toEqual([
      ['^yu-pagoda-left', { right: 0.7, toward: -2.4 }],
      ['^yu-pagoda-right', { right: 2.0, toward: -2.4 }],
    ]);
  });

  it('carries the calm camera: a drift that keeps 15 percent and leans half a unit right', () => {
    expect(row.calm).toEqual(CALM);
    expect(standFor('ffx', ch3, false)?.calm).toEqual(CALM);
  });

  it('gives Chapter II no calm camera (its menus drift as they always did) and a check override none either', () => {
    expect(standFor('ffx', ['yunalesca-1'], false)?.calm).toBeNull();
    setStandOverride({ party: { right: 0.35, toward: 0 }, enemy: { right: 2.6, toward: -0.95 } });
    expect(standFor('ffx', ch3, false)?.calm).toBeNull();
    setStandOverride('off');
    expect(standFor('ffx', ch3, false)).toBeNull();
  });

  it('is FFX only and desktop only, as every row is (the phone keeps its own fit)', () => {
    expect(standFor('ffx2', ch3, false)).toBeNull();
    expect(standFor('ffx', ch3, true)).toBeNull();
  });

  describe('with the switch off in the table (what release 38 played)', () => {
    beforeAll(() => setStageTable(ALL_ROWS.filter((r) => r.chapter !== 'braskas-final-aeon')));
    afterAll(() => setStageTable(STAGE_TABLE));
    it('Chapter III is the stage\'s own: no placement and no calm', () => {
      expect(standFor('ffx', ch3, false)).toBeNull();
    });
  });
});

describe('Framing arms the calm for the fights whose row has one, from the menu it already reads', () => {
  const framing = (game: 'ffx' | 'ffx2'): Framing => new Framing(null, new PerspectiveCamera(32, 16 / 9), game);
  const roster = (): Actor[] => [actor('tidus', 1, -1.47, 1.6), actor('braskas-final-aeon', -1, 2.03, -8), actor('yu-pagoda-left', -1, 1.27, -5.15), actor('yu-pagoda-right', -1, 3.33, -6.25)];

  /** A document with one command list up (or none): what `menuOpen()` and `phoneBattle()` read. */
  const stubDocument = (menu: boolean): void => {
    const el = { hidden: false, closest: () => null, getBoundingClientRect: () => ({ width: 240, height: 160 }), querySelector: () => ({}) };
    vi.stubGlobal('document', { documentElement: { dataset: {} }, querySelector: () => null, querySelectorAll: () => (menu ? [el] : []) });
  };

  it('arms Chapter III\'s calm with the menu closed, and reads the menu open', () => {
    stubDocument(false);
    const f = framing('ffx');
    f.update(0.016, roster(), true);
    expect(menuCalm.armed).toEqual({ spec: CALM, open: false });
    stubDocument(true);
    f.update(0.016, roster(), true);
    expect(menuCalm.armed).toEqual({ spec: CALM, open: true });
  });

  it('arms nothing in another chapter, in FFX-2, or with CHAPTER FRAMING off', () => {
    stubDocument(true);
    framing('ffx').update(0.016, [actor('tidus', 1), actor('yunalesca-1', -1)], true);
    expect(menuCalm.armed.spec).toBeNull();
    framing('ffx').update(0.016, [actor('tidus', 1), actor('seymour-natus', -1)], true);
    expect(menuCalm.armed.spec).toBeNull();
    framing('ffx2').update(0.016, roster(), true);
    expect(menuCalm.armed.spec).toBeNull();
    framing('ffx').update(0.016, roster(), false);
    expect(menuCalm.armed.spec).toBeNull();
  });

  it('arms nothing on the upright phone', () => {
    vi.stubGlobal('window', { matchMedia: (q: string) => ({ matches: q.includes('max-width: 599px') }) });
    stubDocument(true);
    framing('ffx').update(0.016, roster(), true);
    expect(menuCalm.armed.spec).toBeNull();
  });

  it('is let go with the fight: the next link\'s fiends carry no row, so the calm goes with them', () => {
    stubDocument(true);
    const f = framing('ffx');
    f.update(0.016, roster(), true);
    expect(menuCalm.armed.spec).toEqual(CALM);
    f.update(0.016, [actor('tidus', 1), actor('aeon-valefor', -1)], true);
    expect(menuCalm.armed.spec).toBeNull();
  });
});
