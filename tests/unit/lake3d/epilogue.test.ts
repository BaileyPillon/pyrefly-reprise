/**
 * The ice break's clock (`src/engine/lake3d/epilogue.ts`; FFX only): the field event's four things (a magic effect, the twelve layers hidden, two shakes, the party's own ice going) in order, pure.
 */
import { describe, expect, it } from 'vitest';
import { Epilogue, PULSE_REACH, SINK, bandOf, epilogueAt, sinkFor } from '../../../src/engine/lake3d/epilogue.ts';
import { EPILOGUE, layerStarts } from '../../../src/engine/lake3d/layout.ts';

describe('epilogueAt', () => {
  it('is the unbroken ice before it starts', () => {
    for (const t of [-1, 0]) {
      const f = epilogueAt(t);
      expect(f.ice.pulse).toBe(0);
      expect(f.ice.crack).toBe(0);
      expect(f.ice.layers.every((v) => v === 0)).toBe(true);
      expect(f.shakesDue).toBe(0);
    }
  });

  it('runs the magic effect out from under the party and ends it', () => {
    const early = epilogueAt(0.1);
    const late = epilogueAt(EPILOGUE.pulseEnd + 0.01);
    expect(early.ice.pulse).toBeGreaterThan(0.8);
    expect(late.ice.pulse).toBe(0);
    expect(epilogueAt(EPILOGUE.pulseEnd * 0.5).ice.pulseR).toBeGreaterThan(early.ice.pulseR);
    expect(epilogueAt(EPILOGUE.pulseEnd).ice.pulseR).toBeCloseTo(PULSE_REACH, 6);
  });

  it('grows the cracks monotonically to the full and holds', () => {
    let prev = 0;
    for (let t = 0; t <= 4; t += 0.2) {
      const c = epilogueAt(t).ice.crack;
      expect(c).toBeGreaterThanOrEqual(prev);
      prev = c;
    }
    expect(epilogueAt(3.5).ice.crack).toBe(1);
  });

  it('drops the twelve layers outermost first, each over layerFall, none before its start', () => {
    const starts = layerStarts();
    const mid = epilogueAt(starts[3]! + EPILOGUE.layerFall / 2);
    expect(mid.ice.layers[0]).toBe(1); // the outermost is gone
    expect(mid.ice.layers[3]).toBeCloseTo(0.5, 6);
    expect(mid.ice.layers[4]!).toBeLessThan(mid.ice.layers[3]!); // the next is behind it (the falls overlap: a layer takes longer than the gap)
    expect(mid.ice.layers[11]).toBe(0);
    const end = epilogueAt(EPILOGUE.length);
    expect(end.ice.layers.every((v) => v === 1)).toBe(true);
    for (let i = 1; i < 12; i++) expect(epilogueAt(starts[i]! + 0.3).ice.layers[i]!).toBeLessThanOrEqual(epilogueAt(starts[i]! + 0.3).ice.layers[i - 1]!);
  });

  it('fades to white at the end and not before', () => {
    expect(epilogueAt(EPILOGUE.whiteFrom - 0.01).white).toBe(0);
    expect(epilogueAt(EPILOGUE.whiteFrom + 0.5).white).toBeGreaterThan(0);
    expect(epilogueAt((EPILOGUE.whiteFrom + EPILOGUE.length) / 2).white).toBeCloseTo(0.5, 6);
    expect(epilogueAt(EPILOGUE.length).white).toBe(1);
    expect(epilogueAt(99).white).toBe(1);
    expect(epilogueAt(0).white).toBe(0);
  });

  it('counts the shakes as they fall due: twice', () => {
    expect(epilogueAt(EPILOGUE.shakes[0]! - 0.01).shakesDue).toBe(0);
    expect(epilogueAt(EPILOGUE.shakes[0]!).shakesDue).toBe(1);
    expect(epilogueAt(EPILOGUE.shakes[1]!).shakesDue).toBe(2);
    expect(epilogueAt(99).shakesDue).toBe(2);
  });

  it('lets whoever stands on a layer fall with it: the outer ground first, the party on the innermost layer last, none before its layer is half gone', () => {
    const party: [number, number] = [0.9, 1.0];
    const brute: [number, number] = [2.6, -5.8];
    expect(bandOf(party[0], party[1])).toBe(11);
    expect(bandOf(brute[0], brute[1])).toBe(10);
    expect(bandOf(0, 45)).toBe(0);
    expect(bandOf(0, 500)).toBe(0);
    const none = Array.from({ length: 12 }, () => 0);
    expect(sinkFor(none, ...party)).toEqual({ down: 0, tilt: 0 });
    const half = none.map((_, i) => (i === 11 ? SINK.from : 0));
    expect(sinkFor(half, ...party).down).toBe(0);
    const gone = none.map((_, i) => (i === 11 ? 1 : 0));
    expect(sinkFor(gone, ...party).down).toBeCloseTo(SINK.down, 6);
    expect(sinkFor(gone, ...party).tilt).toBeCloseTo(SINK.tilt, 6);
    expect(sinkFor(gone, ...brute).down).toBe(0); // its layer still stands
    let prev = 0;
    for (let t = 0; t <= EPILOGUE.length; t += 0.1) {
      const d = sinkFor(epilogueAt(t).ice.layers, ...party).down;
      expect(d).toBeGreaterThanOrEqual(prev);
      prev = d;
    }
    expect(sinkFor(epilogueAt(EPILOGUE.length).ice.layers, ...party).down).toBeCloseTo(SINK.down, 6);
    // the brute goes before the party: its layer is the one before theirs
    expect(sinkFor(epilogueAt(4.5).ice.layers, ...brute).down).toBeGreaterThan(sinkFor(epilogueAt(4.5).ice.layers, ...party).down);
  });
});

describe('Epilogue', () => {
  it('stays calm until started, then fires each shake once as time passes', () => {
    const shakes: number[] = [];
    const e = new Epilogue((n) => shakes.push(n));
    expect(e.running).toBe(false);
    expect(e.update(5).ice.layers.every((v) => v === 0)).toBe(true);
    expect(shakes).toEqual([]);
    e.start();
    expect(e.running).toBe(true);
    for (let i = 0; i < 100; i++) e.update(0.1);
    expect(shakes).toEqual([0, 1]);
    e.update(5);
    expect(shakes).toEqual([0, 1]);
  });

  it('starting again does not restart it, and reset puts the lake back', () => {
    const e = new Epilogue();
    e.start();
    e.update(2);
    e.start();
    expect(e.time).toBeCloseTo(2, 6);
    e.reset();
    expect(e.running).toBe(false);
    expect(e.time).toBe(-1);
  });
});
