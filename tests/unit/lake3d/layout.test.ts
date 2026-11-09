/**
 * The lake's numbers (`src/engine/lake3d/layout.ts`; FFX only): the rigs, the flights and the epilogue's clock, pure data read without a renderer.
 */
import { describe, expect, it } from 'vitest';
import { BENCH_SLOTS, EPILOGUE, FLY_RIG, ICE_BREAK_RIG, OPENING, RIGS, flightLength, haymakerFlight, layerStarts, overdriveFlight, raiseFlight, sampleFlight, winFlight, type Flight } from '../../../src/engine/lake3d/layout.ts';

const near = (a: readonly number[], b: readonly number[], tol = 1e-6): void => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, -Math.log10(tol)));

describe('the rigs', () => {
  it('has the four the engine guarantees, the close shots the presenter asks for, the epilogue\'s, the opening\'s first key and the director\'s seat', () => {
    for (const name of ['intro', 'idle', 'action', 'victory', 'party', 'enemy', ICE_BREAK_RIG, 'opening', FLY_RIG]) expect(RIGS[name], name).toBeDefined();
  });

  it('puts the story\'s `ice-break` rig high over the lake, looking down at the party', () => {
    const r = RIGS[ICE_BREAK_RIG]!;
    expect(r.position[1]).toBeGreaterThan(8);
    expect(r.lookAt[1]).toBeLessThan(1);
  });

  it('parks the director\'s seat with no sway (a flight is not swayed)', () => {
    expect(RIGS[FLY_RIG]!.sway).toBe(0);
    expect(RIGS['opening']!.sway).toBe(0);
  });

  it('keeps the bench off frame-left, four spots', () => {
    expect(BENCH_SLOTS).toHaveLength(4);
    for (const s of BENCH_SLOTS) expect(s[0]).toBeLessThan(-10);
  });
});

describe('the flights', () => {
  const flights: Flight[] = [OPENING, winFlight([0, 2, 10]), haymakerFlight([0, 2, 10], [0, 0, 1]), raiseFlight([0, 2, 10], [2.5, 0, -5.8]), overdriveFlight([0, 2, 10], [0, 0, 1])];

  it('have keys in time order, at least two, and a length', () => {
    for (const f of flights) {
      expect(f.keys.length, f.name).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < f.keys.length; i++) expect(f.keys[i]!.t, f.name).toBeGreaterThan(f.keys[i - 1]!.t);
      expect(flightLength(f)).toBeGreaterThan(0.5);
    }
  });

  it('start and end on their keys exactly (the spline passes through them)', () => {
    for (const f of flights) {
      const a = sampleFlight(f, f.keys[0]!.t);
      const b = sampleFlight(f, f.keys[f.keys.length - 1]!.t);
      near(a.pos, f.keys[0]!.pos);
      near(a.look, f.keys[0]!.look);
      near(b.pos, f.keys[f.keys.length - 1]!.pos);
      near(b.look, f.keys[f.keys.length - 1]!.look);
    }
  });

  it('clamps outside its time', () => {
    const a = sampleFlight(OPENING, -5);
    const b = sampleFlight(OPENING, 99);
    near(a.pos, OPENING.keys[0]!.pos);
    near(b.pos, OPENING.keys.at(-1)!.pos);
  });

  it('passes every inner key too, and is continuous between them', () => {
    for (const k of OPENING.keys) near(sampleFlight(OPENING, k.t).pos, k.pos);
    let prev = sampleFlight(OPENING, 0).pos;
    for (let t = 0.05; t <= flightLength(OPENING); t += 0.05) {
      const p = sampleFlight(OPENING, t).pos;
      expect(Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]), `t ${t}`).toBeLessThan(2.4);
      prev = p;
    }
  });

  it('the opening begins on the `opening` rig and ends on the `idle` rig to the digit (the presenter takes over with no jump)', () => {
    const first = OPENING.keys[0]!;
    const last = OPENING.keys.at(-1)!;
    near(first.pos, RIGS['opening']!.position);
    near(first.look, RIGS['opening']!.lookAt);
    expect(first.fov).toBe(RIGS['opening']!.fov);
    near(last.pos, RIGS['idle']!.position);
    near(last.look, RIGS['idle']!.lookAt);
    expect(last.fov).toBe(RIGS['idle']!.fov);
    expect(last.roll ?? 0).toBe(0);
  });

  it('the opening skims the ice at knee height at its low point and never goes under it', () => {
    let low = 99;
    for (let t = 0; t <= flightLength(OPENING); t += 0.02) low = Math.min(low, sampleFlight(OPENING, t).pos[1]);
    expect(low).toBeGreaterThanOrEqual(0.5);
    expect(low).toBeLessThan(1.2);
  });

  it('mixes the field of view and the roll between keys', () => {
    const mid = sampleFlight(OPENING, 0.85);
    expect(mid.fov).toBeLessThan(46);
    expect(mid.fov).toBeGreaterThan(42);
  });

  it('the win starts where the camera stands, passes the party low, and ends wide and high over the lake in the epilogue\'s own length', () => {
    const win = winFlight([3.3, 1.9, 9.1]);
    near(sampleFlight(win, 0).pos, [3.3, 1.9, 9.1]);
    const e = win.keys.at(-1)!;
    expect(e.pos[1]).toBeGreaterThan(12);
    expect(flightLength(win)).toBeCloseTo(EPILOGUE.length, 6);
    expect(win.keys[1]!.pos[1]).toBeLessThan(4); // round the party at eye height first
  });
});

describe('the epilogue\'s clock', () => {
  it('has twelve layers, one every layerGap from layerStart, the last starting before the party\'s own ice goes', () => {
    const s = layerStarts();
    expect(s).toHaveLength(12);
    expect(s[0]).toBe(EPILOGUE.layerStart);
    for (let i = 1; i < s.length; i++) expect(s[i]! - s[i - 1]!).toBeCloseTo(EPILOGUE.layerGap, 6);
    expect(s.at(-1)! + EPILOGUE.layerFall).toBeLessThanOrEqual(EPILOGUE.length);
    expect(s.at(-1)!).toBeLessThanOrEqual(EPILOGUE.lastFall);
  });

  it('shakes twice, in order, inside the run', () => {
    expect(EPILOGUE.shakes).toHaveLength(2);
    expect(EPILOGUE.shakes[0]!).toBeLessThan(EPILOGUE.shakes[1]!);
    expect(EPILOGUE.shakes[1]!).toBeLessThan(EPILOGUE.length);
  });
});


describe("the Overdrive flight and the caster's height (the aeons, 2026-11-09)", () => {
  it("is the hero's flight for a hero and orbits a taller caster from further out and looks higher up, in step with its height", () => {
    const hero = overdriveFlight([0, 2, 10], [1, 0, 2]);
    expect(overdriveFlight([0, 2, 10], [1, 0, 2], 1.75)).toEqual(hero); // the default
    expect(overdriveFlight([0, 2, 10], [1, 0, 2], 1.2)).toEqual(hero); // never closer than the hero's
    const aeon = overdriveFlight([0, 2, 10], [1, 0, 2], 3.5);
    const dist = (f: Flight, k: number): number => Math.hypot(f.keys[k]!.pos[0] - 1, f.keys[k]!.pos[2] - 2);
    expect(dist(aeon, 1)).toBeCloseTo(dist(hero, 1) * 2, 6);
    expect(dist(aeon, 2)).toBeGreaterThan(dist(hero, 2) * 1.8);
    expect(aeon.keys[1]!.look[1]).toBeCloseTo(hero.keys[1]!.look[1] * 2, 6);
    expect(aeon.keys[0]!.pos).toEqual(hero.keys[0]!.pos); // it still starts where the camera is
  });
});
