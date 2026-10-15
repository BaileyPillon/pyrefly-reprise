/**
 * Parity tests for the Overdrive minigame controllers (re-parity RC9, lane FFX-A). **Game case: FFX only** (FFX-2 has no Swordplay,
 * Bushido, Fury or Wakka reels).
 *
 * Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: Tidus's Swordplay (VA 0x00892320), Auron's Bushido (0x00890F70), Lulu's
 * Fury (0x00891B80, tables 0x00A5CC70 and 0x0089A2F0), the shared limit timer (0x00891AC0) and Wakka's reel line classifier (0x007B1710);
 * the private note `FFX-G01` sections 6 and 7. Hand-worked blocks first, each number with its arithmetic in the comment; then the vectors in
 * `tests/fixtures/parity/ffx/minigame_swordplay.json`, `minigame_bushido.json`, `minigame_fury.json` and `reel_line.json` (runs of the real
 * controllers over scripted pad input and a scripted clock, made by `tools/..` of the private harness, an independent model agreeing on each).
 * Mutants must disagree with the vectors, so the replay is shown to be able to fail.
 */

import { describe, expect, it } from 'vitest';
import { FRAME_MS, framesDue, timerA } from '../../src/battle/ffx/kernel/minigame-timer.ts';
import {
  SWORDPLAY_CATEGORIES,
  type SwordplayGeometry,
  swordplayFrame,
  swordplayGeometry,
  swordplayStart,
  swordplayWindowFractions,
} from '../../src/battle/ffx/kernel/minigame-swordplay.ts';
import { BUSHIDO_CATEGORIES, Pad, bushidoFrame, bushidoMove, bushidoStart } from '../../src/battle/ffx/kernel/minigame-bushido.ts';
import {
  FURY_LIMIT_SECONDS,
  FURY_ROWS,
  furyCasts,
  furyCastsAfterRotations,
  furyRowIndex,
  furyThresholds,
  furyVariantOfCommand,
} from '../../src/battle/ffx/kernel/minigame-fury-tables.ts';
import {
  FuryController,
  type FuryPad,
  type FuryTweaks,
  furyQuadrant,
  isFuryCycle,
  runFury,
} from '../../src/battle/ffx/kernel/minigame-fury.ts';
import { classifyReelLine } from '../../src/battle/ffx/kernel/reel-line.ts';
import { loadFfxParityFixture, type ParityVector } from './helpers/ffxParityFixture.ts';

const bits = (x: number): number => {
  const b = new DataView(new ArrayBuffer(4));
  b.setFloat32(0, x);
  return b.getUint32(0);
};

function fixture(name: string): ParityVector[] {
  const fx = loadFfxParityFixture(name);
  expect(fx, `tests/fixtures/parity/ffx/${name}.json is missing`).not.toBeNull();
  return (fx as { vectors: ParityVector[] }).vectors;
}

// ------------------------------------------------------------------------------------------------------------------------ the timer

describe('the limit timer (0x00891AC0)', () => {
  it('A is float32(B - ticks / 30), 0 once it is not above 0, B itself at tick 0', () => {
    expect(timerA(3, 0)).toBe(3);
    expect(timerA(3, 13)).toBe(Math.fround(3 - 13 / 30)); // 3 - 0.43333 = 2.56667
    expect(Math.fround(timerA(3, 13))).toBe(timerA(3, 13));
    expect(timerA(3, 90)).toBe(0); // 3 - 90/30 = 0
    expect(timerA(3, 91)).toBe(0); // negative -> 0
    expect(timerA(2, 59)).toBe(Math.fround(2 - 59 / 30));
    expect(timerA(4, 119)).toBeGreaterThan(0);
    expect(timerA(4, 120)).toBe(0);
  });
  it('PAL runs 25 ticks a second: a 3 s limit ends at tick 75, not 90', () => {
    expect(timerA(3, 74, true)).toBeGreaterThan(0);
    expect(timerA(3, 75, true)).toBe(0);
  });
  it('a frame is 1/30 s and frames come due on whole multiples of it', () => {
    expect(FRAME_MS).toBeCloseTo(33.3333, 3);
    expect(framesDue(0)).toBe(0);
    expect(framesDue(33)).toBe(0);
    expect(framesDue(34)).toBe(1);
    expect(framesDue(100)).toBe(3); // 3 x 33.333 = 100.000, not 99.99999
    expect(framesDue(3000)).toBe(90);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ Swordplay

describe("Swordplay (0x00892320): the bar, the window, the frame a press lands in", () => {
  it('the bar is 275 units from 118; the window is centred; the four moves', () => {
    // lo = (275 / 2 - width / 2) + 118 with integer halves: (137 - 12) + 118 = 243; hi = 12 + 137 + 118 = 267
    expect(swordplayGeometry(0x20)).toEqual({ limit: 3, speed: 11, width: 24, x0: 118, bar: 275, lo: 243, hi: 267 });
    expect(swordplayGeometry(0x30)).toEqual({ limit: 3, speed: 12, width: 20, x0: 118, bar: 275, lo: 245, hi: 265 }); // (137 - 10) + 118, 10 + 137 + 118
    expect(swordplayGeometry(0x40)).toEqual({ limit: 3, speed: 13, width: 20, x0: 118, bar: 275, lo: 245, hi: 265 });
    expect(swordplayGeometry(0x50)).toEqual({ limit: 2, speed: 14, width: 18, x0: 118, bar: 275, lo: 246, hi: 264 }); // (137 - 9) + 118, 9 + 137 + 118
    expect(() => swordplayGeometry(0x22)).toThrow(RangeError);
  });
  it('the window is 8.7, 7.3, 7.3 and 6.5 percent of the bar', () => {
    // width / bar: 24/275 = 0.0873, 20/275 = 0.0727, 18/275 = 0.0655
    const pct = SWORDPLAY_CATEGORIES.map((c) => Math.round(swordplayWindowFractions(swordplayGeometry(c)).width * 1000) / 10);
    expect(pct).toEqual([8.7, 7.3, 7.3, 6.5]);
  });
  it('Spiral Cut: the marker moves 11 a frame, so presses land on frames 13-14, 38-39, 63-64 and 88-89', () => {
    // the marker before frame f is 118 + 11 (f - 1) on the way out: frame 13 -> 118 + 132 = 250 in [243, 267]; frame 14 -> 261; frame 15 -> 272 > 267
    const g = swordplayGeometry(0x20);
    const hitFrames: number[] = [];
    for (let f = 1; f <= 99; f++) {
      const s = swordplayStart(g);
      let r = swordplayFrame(s, g, false);
      for (let i = 1; i < f - 1 && !r.done; i++) r = swordplayFrame(s, g, false);
      const last = f === 1 ? swordplayFrame(swordplayStart(g), g, true) : swordplayFrame(s, g, true);
      if (last.done && last.grade === 1) hitFrames.push(f);
    }
    expect(hitFrames).toEqual([13, 14, 38, 39, 63, 64, 88, 89]);
  });
  it('a hit at frame 13 is graded A = 3 - 13/30 = 2.5667 s; a free run fails on frame 91 with A = 0', () => {
    const g = swordplayGeometry(0x20);
    const s = swordplayStart(g);
    let r = swordplayFrame(s, g, false);
    for (let f = 2; f <= 12; f++) r = swordplayFrame(s, g, false);
    expect(r).toEqual({ done: false });
    r = swordplayFrame(s, g, true);
    expect(r).toEqual({ done: true, grade: 1, a: Math.fround(3 - 13 / 30), frame: 13 });
    const t = swordplayStart(g);
    let q = swordplayFrame(t, g, false);
    for (let f = 2; f <= 90; f++) q = swordplayFrame(t, g, false);
    expect(q).toEqual({ done: false }); // frame 90: A(89) = 3 - 89/30 > 0, still taking input
    expect(swordplayFrame(t, g, false)).toEqual({ done: true, grade: 0, a: 0, frame: 91 });
  });
  it('a press outside the window sends the marker back to the left end and the move goes on', () => {
    const g = swordplayGeometry(0x20);
    const s = swordplayStart(g);
    for (let f = 1; f <= 5; f++) swordplayFrame(s, g, false); // marker after 5 frames: 118 + 55 = 173
    expect(s.pos).toBe(173);
    const r = swordplayFrame(s, g, true); // frame 6: the marker was at 173, outside [243, 267]
    expect(r).toEqual({ done: false });
    expect(s.misses).toBe(1);
    expect(s.pos).toBe(118 + 11); // back at 118, then moved 11
    expect(s.vel).toBe(11);
  });
  it('the marker reflects at the right end: after the out-sweep it comes back at -11 a frame', () => {
    const g = swordplayGeometry(0x20);
    const s = swordplayStart(g);
    const seen: number[] = [];
    for (let f = 1; f <= 30; f++) {
      seen.push(s.pos);
      swordplayFrame(s, g, false);
    }
    // seen[n] is the marker after n moves = 118 + 11 n: n = 25 gives 393 = the right end exactly; n = 26 would be 404 -> reflected to 2 x 393 - 404 = 382, then 371
    expect(seen[25]).toBe(393);
    expect(seen[26]).toBe(382);
    expect(seen[27]).toBe(371);
  });
});

interface SwordplayRun {
  grade: number;
  aBits: number;
  frame: number;
  misses: number;
  markers: number[];
}

/** Replay one Swordplay vector's press frames through the kernel; `geom` can be a mutant's. */
function replaySwordplay(cat: number, pal: boolean, presses: readonly number[], geom: SwordplayGeometry = swordplayGeometry(cat)): SwordplayRun {
  const s = swordplayStart(geom);
  const set = new Set(presses);
  const markers: number[] = [];
  for (let f = 1; f < 400; f++) {
    markers.push(s.pos);
    const r = swordplayFrame(s, geom, set.has(f), pal);
    if (r.done) return { grade: r.grade, aBits: bits(r.a), frame: r.frame, misses: s.misses, markers };
  }
  throw new Error('a Swordplay script never ended');
}

describe('Swordplay: the real controller, scripted presses (tests/fixtures/parity/ffx/minigame_swordplay.json)', () => {
  const vectors = fixture('minigame_swordplay');
  const replayAll = (mutate?: (g: SwordplayGeometry) => SwordplayGeometry): string[] => {
    const bad: string[] = [];
    for (const v of vectors) {
      if (v.class === 'geometry') continue;
      const i = v.in as { cat: number; pal: number; presses: number[] };
      const o = v.out as { grade: number; aBits: number; bBits: number; frame: number; misses: number; markers?: number[] };
      const g = swordplayGeometry(i.cat);
      const got = replaySwordplay(i.cat, i.pal === 1, i.presses, mutate ? mutate(g) : g);
      const same = got.grade === o.grade && got.aBits === o.aBits && got.frame === o.frame && got.misses === o.misses && bits(g.limit) === o.bBits &&
        (o.markers === undefined || o.markers.every((m, k) => got.markers[k] === m) && got.markers.length >= o.markers.length);
      if (!same) bad.push(`#${v.id} ${v.class} cat ${i.cat.toString(16)} pal ${i.pal} presses ${i.presses.join(',')}`);
    }
    return bad;
  };
  it('holds 1,000+ scripts over the four moves, with and without the PAL tick rate', () => {
    const real = vectors.filter((v) => v.class !== 'geometry');
    expect(real.length).toBeGreaterThanOrEqual(1000);
    expect(new Set(real.map((v) => (v.in as { cat: number }).cat))).toEqual(new Set([0x20, 0x30, 0x40, 0x50]));
    expect(new Set(real.map((v) => (v.in as { pal: number }).pal))).toEqual(new Set([0, 1]));
    expect(real.filter((v) => (v.out as { grade: number }).grade === 1).length).toBeGreaterThan(100);
    expect(real.filter((v) => (v.out as { grade: number }).grade === 0).length).toBeGreaterThan(100);
    expect(real.filter((v) => (v.out as { misses: number }).misses > 0).length).toBeGreaterThan(100);
  });
  it('the set-up the real code wrote is the geometry of the kernel', () => {
    for (const v of vectors.filter((x) => x.class === 'geometry')) {
      const cat = (v.in as { cat: number }).cat;
      const o = v.out as { barX: number; barW: number; winLo: number; winHi: number; winW: number; marker: number; vel: number; B: number };
      expect(swordplayGeometry(cat)).toEqual({ limit: o.B, speed: o.vel, width: o.winW, x0: o.barX, bar: o.barW, lo: o.winLo, hi: o.winHi });
      expect(o.marker).toBe(o.barX); // the marker starts at the left end
    }
  });
  it('the kernel agrees with the real controller on every script: grade, A, frame, misses, the marker', () => {
    expect(replayAll()).toEqual([]);
  });
  it('mutants disagree: a window shifted or wider by one step of the marker, a faster marker, the wrong limit, a shorter bar', () => {
    // The ends are inclusive in the game, but no marker ever stands on an end of a window for these four speeds (lo - 118 and hi - 118 are
    // 125/149, 127/147, 127/147 and 128/146, none a multiple of 11, 12, 13 or 14), so an exclusive end cannot be told apart by any script:
    // the mutants below move an end by more than a step instead.
    expect(replayAll((g) => ({ ...g, hi: g.hi + g.speed })).length).toBeGreaterThan(0);
    expect(replayAll((g) => ({ ...g, lo: g.lo + g.speed })).length).toBeGreaterThan(0);
    expect(replayAll((g) => ({ ...g, lo: g.lo - g.speed })).length).toBeGreaterThan(0);
    expect(replayAll((g) => ({ ...g, speed: g.speed + 1 })).length).toBeGreaterThan(0);
    expect(replayAll((g) => ({ ...g, limit: g.limit - 0.5 })).length).toBeGreaterThan(0);
    expect(replayAll((g) => ({ ...g, bar: g.bar - 1 })).length).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ Bushido

describe("Bushido (0x00890F70): the four sequences and the frame a press lands in", () => {
  it('lengths and limits: Shooting Star 7, Dragon Fang 8, Banishing Blade 7 (4 s each), Tornado 6 (3 s)', () => {
    expect(bushidoMove(0x22)).toMatchObject({ limit: 4, words: { length: 7 } });
    expect(bushidoMove(0x32)).toMatchObject({ limit: 4, words: { length: 8 } });
    expect(bushidoMove(0x42)).toMatchObject({ limit: 4, words: { length: 7 } });
    expect(bushidoMove(0x52)).toMatchObject({ limit: 3, words: { length: 6 } });
    expect(() => bushidoMove(0x20)).toThrow(RangeError);
  });
  it('the words, in the pad bits of the PS2 layout: 0x10 Triangle, 0x20 Circle, 0x40 Cross, 0x80 Square, 0x04 L1, 0x08 R1', () => {
    expect(bushidoMove(0x22).words).toEqual([0x10, 0x40, 0x80, 0x20, 0x8000, 0x2000, 0x20]);
    expect(bushidoMove(0x32).words).toEqual([0x4000, 0x8000, 0x1000, 0x2000, 0x04, 0x08, 0x40, 0x20]);
    expect(bushidoMove(0x42).words).toEqual([0x1000, 0x04, 0x4000, 0x08, 0x2000, 0x8000, 0x10]);
    expect(bushidoMove(0x52).words).toEqual([0x20, 0x2000, 0x08, 0x8000, 0x04, 0x10]);
    expect(Pad.Circle).toBe(0x20);
  });
  it('a clean run takes one input a frame; the last press in frame 6 of Tornado is graded A = 3 - 6/30 = 2.8 s', () => {
    const m = bushidoMove(0x52);
    const s = bushidoStart();
    let r = bushidoFrame(s, m, 0);
    r = bushidoFrame(s, m, m.words[0] as number); // frame 2 .. use the next five frames
    for (let i = 1; i < m.words.length - 1; i++) r = bushidoFrame(s, m, m.words[i] as number);
    expect(r).toEqual({ done: false, wrong: false });
    r = bushidoFrame(s, m, m.words[m.words.length - 1] as number); // frame 7
    expect(r).toEqual({ done: true, grade: 1, a: Math.fround(3 - 7 / 30), frame: 7 });
  });
  it('a wrong press (two buttons at once included) sends the index to 0, the timer runs on, the wrong press is not tried as input 1', () => {
    const m = bushidoMove(0x22); // Triangle first
    const s = bushidoStart();
    bushidoFrame(s, m, Pad.Triangle);
    bushidoFrame(s, m, Pad.Cross);
    expect(s.index).toBe(2);
    expect(bushidoFrame(s, m, Pad.Square | Pad.Circle)).toEqual({ done: false, wrong: true }); // 0x80 | 0x20 is not 0x20
    expect(s.index).toBe(0);
    expect(bushidoFrame(s, m, Pad.Triangle)).toEqual({ done: false, wrong: false }); // Triangle IS input 1: it counts only when pressed after the reset
    expect(s.index).toBe(1);
    // a wrong press that happens to be input 1 does not count as input 1
    const t = bushidoStart();
    bushidoFrame(t, m, Pad.Triangle);
    expect(bushidoFrame(t, m, Pad.Triangle)).toEqual({ done: false, wrong: true }); // input 2 is Cross, so a second Triangle is wrong
    expect(t.index).toBe(0);
  });
  it('the limit ends it: 4 s accepts frames 1-120 and fails on frame 121 with A = 0', () => {
    const m = bushidoMove(0x32);
    const s = bushidoStart();
    let r = bushidoFrame(s, m, 0);
    for (let f = 2; f <= 120; f++) r = bushidoFrame(s, m, 0);
    expect(r).toEqual({ done: false, wrong: false });
    expect(bushidoFrame(s, m, 0)).toEqual({ done: true, grade: 0, a: 0, frame: 121 });
  });
});

interface BushidoRun {
  grade: number;
  aBits: number;
  frame: number;
  wrong: number;
  trace: number[];
}

type BushidoMutant = { noReset?: boolean; tryAsFirst?: boolean; swap?: boolean };

function replayBushido(cat: number, pal: boolean, presses: ReadonlyArray<readonly [number, number]>, mutant: BushidoMutant = {}): BushidoRun {
  const move = bushidoMove(cat);
  const words = mutant.swap ? [...move.words.slice(0, -2), move.words[move.words.length - 1] as number, move.words[move.words.length - 2] as number] : move.words;
  const m = { limit: move.limit, words };
  const at = new Map(presses.map(([f, w]) => [f, w]));
  const s = bushidoStart();
  const trace: number[] = [];
  for (let f = 1; f < 400; f++) {
    const word = at.get(f) ?? 0;
    const before = s.index;
    const r = bushidoFrame(s, m, word, pal);
    if (r.done) {
      trace.push(s.index); // the real run records the index after the frame that ends the move too
      return { grade: r.grade, aBits: bits(r.a), frame: r.frame, wrong: s.wrong, trace };
    }
    if (r.wrong && mutant.noReset) s.index = before;
    if (r.wrong && mutant.tryAsFirst && word === m.words[0]) s.index = 1;
    trace.push(s.index);
  }
  throw new Error('a Bushido script never ended');
}

describe('Bushido: the real controller, scripted presses (tests/fixtures/parity/ffx/minigame_bushido.json)', () => {
  const vectors = fixture('minigame_bushido');
  const replayAll = (mutant: BushidoMutant = {}): string[] => {
    const bad: string[] = [];
    for (const v of vectors) {
      if (v.class === 'sequence') continue;
      const i = v.in as { cat: number; pal: number; presses: Array<[number, number]> };
      const o = v.out as { grade: number; aBits: number; frame: number; wrong: number; indexTrace?: number[] };
      const got = replayBushido(i.cat, i.pal === 1, i.presses, mutant);
      const traceOk = o.indexTrace === undefined || o.indexTrace.every((x, k) => got.trace[k] === x);
      if (got.grade !== o.grade || got.aBits !== o.aBits || got.frame !== o.frame || got.wrong !== o.wrong || !traceOk) bad.push(`#${v.id} ${v.class} cat ${i.cat.toString(16)}`);
    }
    return bad;
  };
  it('holds the four sequences the real set-up wrote, and 350+ scripts over them', () => {
    for (const v of vectors.filter((x) => x.class === 'sequence')) {
      const cat = (v.in as { cat: number }).cat;
      const o = v.out as { length: number; bBits: number; words: number[] };
      expect(bushidoMove(cat).words).toEqual(o.words);
      expect(bushidoMove(cat).words.length).toBe(o.length);
      expect(bits(bushidoMove(cat).limit)).toBe(o.bBits);
    }
    expect(vectors.filter((v) => v.class !== 'sequence').length).toBeGreaterThanOrEqual(350);
    expect(new Set(vectors.filter((v) => v.class !== 'sequence').map((v) => (v.in as { cat: number }).cat))).toEqual(new Set(BUSHIDO_CATEGORIES));
    const real = vectors.filter((v) => v.class !== 'sequence');
    expect(real.filter((v) => (v.out as { grade: number }).grade === 1).length).toBeGreaterThan(80);
    expect(real.filter((v) => (v.out as { grade: number }).grade === 0).length).toBeGreaterThan(80);
    expect(real.filter((v) => (v.out as { wrong: number }).wrong > 0).length).toBeGreaterThan(80);
  });
  it('the kernel agrees with the real controller on every script: grade, A, frame, wrong presses, the index after each frame', () => {
    expect(replayAll()).toEqual([]);
  });
  it('mutants disagree: no reset on a wrong press, a wrong press tried as input 1, the last two words swapped', () => {
    expect(replayAll({ noReset: true }).length).toBeGreaterThan(0);
    expect(replayAll({ tryAsFirst: true }).length).toBeGreaterThan(0);
    expect(replayAll({ swap: true }).length).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ Fury tables

describe("Fury's tables (0x00A5CC70, 0x0089A2F0)", () => {
  it('the 17 rows: the first cast is free, the digits add up to the thresholds', () => {
    expect(FURY_ROWS).toHaveLength(17);
    for (const row of FURY_ROWS) expect(row).toMatch(/^[1-7]{16}$/);
    // row 1 (Fire Fury at Magic 40): 1111222222233333 -> 1 2 3 4 6 8 10 12 14 16 18 21 24 27 30 33
    expect(furyThresholds(1, 40)).toEqual([1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 21, 24, 27, 30, 33]);
  });
  it('brackets: group A (Blizzard to Water) 0-34, 35-59, 60-99, 100-199, 200-254, 255', () => {
    const rows = [0, 34, 35, 59, 60, 99, 100, 199, 200, 254, 255].map((m) => furyRowIndex(0, m));
    expect(rows).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5]);
    // Magic 255 is its own best bracket; 254 is not
    expect(furyRowIndex(4, 254)).toBe(3);
    expect(furyRowIndex(4, 255)).toBe(5);
    expect(furyRowIndex(8, 255)).toBe(3); // Firaga and the rest keep 200-255 together
    expect(furyRowIndex(17, 254)).toBe(11); // Flare
    expect(furyRowIndex(17, 255)).toBe(12);
    expect(furyRowIndex(18, 149)).toBe(8); // Ultima 75-149
    expect(furyRowIndex(18, 150)).toBe(15);
  });
  it('a variant is the command id minus 0x3078; only the 19 Fury ids have one', () => {
    expect(furyVariantOfCommand(0x3078)).toBe(0);
    expect(furyVariantOfCommand(0x3079)).toBe(1); // Fire Fury
    expect(furyVariantOfCommand(0x308a)).toBe(18); // Ultima Fury
    expect(furyVariantOfCommand(0x308b)).toBeUndefined();
    expect(furyVariantOfCommand(0x3067)).toBeUndefined();
  });
  it('casts after rotations: the note\'s examples (group 0-3 at Magic 0: 4 / 5 / 7 / 8 / 11 after 5 / 10 / 15 / 20 / 30 rotations)', () => {
    // Magic 0 is row 0, T = 1 2 4 6 9 12 15 18 22 26 30 34 38 42 46 50; counter = 1 + rotations
    expect(furyThresholds(0, 0)).toEqual([1, 2, 4, 6, 9, 12, 15, 18, 22, 26, 30, 34, 38, 42, 46, 50]);
    const at = (r: number): number => furyCasts(0, 0, r);
    expect([5, 10, 15, 20, 30].map(at)).toEqual([4, 5, 7, 8, 11]); // counter 6 -> T up to 6 -> 4 casts; counter 11 -> 9 -> 5; 16 -> 15 -> 7; 21 -> 18 -> 8; 31 -> 30 -> 11
    expect([5, 10, 15, 20, 30].map((r) => furyCasts(0, 128, r))).toEqual([6, 9, 12, 14, 16]);
    expect([5, 10, 15, 20, 30].map((r) => furyCasts(0, 255, r))).toEqual([6, 11, 16, 16, 16]);
    expect([5, 10, 15, 20, 30].map((r) => furyCasts(17, 128, r))).toEqual([3, 4, 6, 7, 10]); // Flare at 128
    expect([5, 10, 15, 20, 30].map((r) => furyCasts(18, 128, r))).toEqual([2, 3, 4, 5, 6]); // Ultima at 128 (row 8)
  });
  it('at least one cast with no rotation at all; 16 at the most', () => {
    expect(furyCasts(18, 0, 0)).toBe(1);
    expect(furyCasts(5, 255, 1000)).toBe(16);
    expect(furyCastsAfterRotations(furyThresholds(0, 0), -3)).toBe(1);
    expect(FURY_LIMIT_SECONDS).toBe(4);
  });
});

describe('Fury tables: the real selector over all 19 spells and 256 Magic values (minigame_fury.json)', () => {
  const vectors = fixture('minigame_fury');
  it('every (variant, Magic) takes the row the real selector chose, with the game\'s limit', () => {
    const rowsVec = vectors.find((v) => v.class === 'rows');
    expect((rowsVec?.out as { digits: string[] }).digits).toEqual([...FURY_ROWS]);
    const sel = vectors.filter((v) => v.class === 'selector');
    expect(sel).toHaveLength(19);
    let n = 0;
    for (const v of sel) {
      const variant = (v.in as { variant: number }).variant;
      const o = v.out as { rowByMagic: number[]; limit: number };
      expect(o.limit).toBe(FURY_LIMIT_SECONDS);
      for (let magic = 0; magic < 256; magic++) {
        expect(furyRowIndex(variant, magic), `variant ${variant} Magic ${magic}`).toBe(o.rowByMagic[magic]);
        n += 1;
      }
    }
    expect(n).toBe(4864);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ Fury controller

describe('the Fury quadrants and the rotation (0x00891B80)', () => {
  it('a sample is a diagonal quadrant only with BOTH axes past the dead zone (0xA0 or above, or below 0x60)', () => {
    expect(furyQuadrant(0xc8, 0x20)).toBe(4); // x high, y low
    expect(furyQuadrant(0xc8, 0xc8)).toBe(5);
    expect(furyQuadrant(0x20, 0xc8)).toBe(6);
    expect(furyQuadrant(0x20, 0x20)).toBe(7);
    expect(furyQuadrant(0xa0, 0xa0)).toBe(5); // 0xA0 counts
    expect(furyQuadrant(0x9f, 0xc8)).toBeNull(); // 0x9F is dead zone
    expect(furyQuadrant(0x5f, 0x5f)).toBe(7); // below 0x60 counts
    expect(furyQuadrant(0x60, 0x20)).toBeNull(); // 0x60 is dead zone
    expect(furyQuadrant(0x80, 0xff)).toBeNull(); // straight up
    expect(furyQuadrant(0xc8, 0x80)).toBeNull(); // straight right
  });
  it('five quadrants are a rotation only in cyclic order, either way', () => {
    expect(isFuryCycle([4, 5, 6, 7, 4])).toBe(true);
    expect(isFuryCycle([7, 6, 5, 4, 7])).toBe(true);
    expect(isFuryCycle([5, 6, 7, 4, 5])).toBe(true);
    expect(isFuryCycle([4, 5, 4, 5, 4])).toBe(false);
    expect(isFuryCycle([4, 6, 7, 4, 5])).toBe(false);
    expect(isFuryCycle([7, 6, 5, 4, 7], false)).toBe(false); // the mutant: only the increasing run
  });
  it('digital: a cast is gained when (counter + 1) / 2 reaches the threshold, so two steps are one rotation', () => {
    // row 1 (Fire Fury at Magic 40): T = 1 2 3 4 6 ..., the counter starts at T[0] = 1 and a step adds 1.
    // step 1: counter 2 -> (2 + 1) / 2 = 1, below T[1] = 2; step 2: counter 3 -> 4 / 2 = 2 >= 2 -> cast 2;
    // step 3: counter 4 -> 5 / 2 = 2, below T[2] = 3; step 4: counter 5 -> 6 / 2 = 3 >= 3 -> cast 3.
    const t = furyThresholds(1, 40);
    const c = new FuryController(t, 4, false, false, true);
    // one frame of a left-only reading, the next of a right-only reading: a step every two frames (the stall clock is far away)
    const pad: FuryPad = { stick: () => [0x80, 0x80], buttons: (k) => (k % 4 < 2 ? [true, false] : [false, true]) };
    const seen: Array<[number, number]> = [];
    for (let f = 0; f < 20 && c.steps < 4; f++) {
      const before = c.steps;
      c.frame(f / 30, pad);
      if (c.steps !== before) seen.push([c.steps, c.level]);
    }
    expect(seen).toEqual([[1, 1], [2, 2], [3, 2], [4, 3]]);
    expect(c.rotations()).toBe(2);
  });
  it('the cast count is a function of the rotations: digital steps count half, whatever the pad did', () => {
    // the identity over every scripted run of the fixture (both pads): the casts equal the table's casts for the rotations the counter stands for
    for (const v of fixture('minigame_fury').filter((x) => x.class.startsWith('analog-') || x.class.startsWith('digital-'))) {
      const i = v.in as { variant: number; magic: number; pal: number; analog: boolean; frameTime: number; stream?: string; buttons?: string };
      const t = furyThresholds(i.variant, i.magic);
      const c = new FuryController(t, FURY_LIMIT_SECONDS, i.analog, i.pal === 1);
      runFury(c, padOf(i.analog, (i.analog ? i.stream : i.buttons) as string), i.frameTime);
      expect(c.level, `#${v.id} ${v.class}`).toBe(furyCastsAfterRotations(t, c.rotations()));
    }
  });
});

function streamOf(hex: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i + 3 < hex.length; i += 4) out.push([parseInt(hex.slice(i, i + 2), 16), parseInt(hex.slice(i + 2, i + 4), 16)]);
  return out;
}

function padOf(analog: boolean, data: string): FuryPad {
  if (analog) {
    const st = streamOf(data);
    return { stick: (i) => st[i] ?? [0x80, 0x80], buttons: () => [false, false] };
  }
  return { stick: () => [0x80, 0x80], buttons: (i) => (i >= 0 && i < data.length ? [(Number(data[i]) & 1) === 1, (Number(data[i]) & 2) === 2] : [false, false]) };
}

describe('Fury: the real controller, scripted pad streams and clock (tests/fixtures/parity/ffx/minigame_fury.json)', () => {
  const vectors = fixture('minigame_fury');
  const scripts = vectors.filter((v) => v.class.startsWith('analog-') || v.class.startsWith('digital-'));
  const replayAll = (tweaks: FuryTweaks = {}, only?: (v: ParityVector) => boolean): string[] => {
    const bad: string[] = [];
    for (const v of scripts) {
      if (only && !only(v)) continue;
      const i = v.in as { variant: number; magic: number; pal: number; analog: boolean; frameTime: number; stream?: string; buttons?: string };
      const o = v.out as { level: number; counter: number; frames: number; calls: number; grade: number; aBits: number; bBits: number; thresholds: number[] };
      const t = furyThresholds(i.variant, i.magic);
      if (JSON.stringify(t) !== JSON.stringify(o.thresholds)) {
        bad.push(`#${v.id} thresholds`);
        continue;
      }
      const c = new FuryController(t, FURY_LIMIT_SECONDS, i.analog, i.pal === 1, false, tweaks);
      const got = runFury(c, padOf(i.analog, (i.analog ? i.stream : i.buttons) as string), i.frameTime);
      const same = got.level === o.level && got.counter === o.counter && got.frames === o.frames && got.calls === o.calls &&
        got.result !== null && got.result.level === o.grade && bits(got.result.a) === o.aBits && bits(got.result.b) === o.bBits;
      if (!same) bad.push(`#${v.id} ${v.class}`);
    }
    return bad;
  };
  it('holds 90+ scripts, both pads, reaching every number of casts from 1 to 16', () => {
    expect(scripts.length).toBeGreaterThanOrEqual(90);
    expect(new Set(scripts.map((v) => (v.out as { level: number }).level)).size).toBe(16);
    expect(scripts.filter((v) => (v.in as { analog: boolean }).analog).length).toBeGreaterThan(40);
    expect(scripts.filter((v) => !(v.in as { analog: boolean }).analog).length).toBeGreaterThan(40);
    expect(new Set(scripts.map((v) => (v.in as { variant: number }).variant)).size).toBeGreaterThan(10);
  });
  it('the kernel agrees with the real controller on every script: casts, counter, frames run, calls made, the result (A = B = 0)', () => {
    expect(replayAll()).toEqual([]);
  });
  it('the timeline: play takes ticks 0-119 and the move ends in frame 123 with two controller calls in most frames', () => {
    // an empty pad: frames 1-2 intro (1 call each), frame 3 state 3 + the second call already in play, frames 4..123 two calls
    const c = new FuryController(furyThresholds(1, 40), 4, true, false);
    const r = runFury(c, { stick: () => [0x80, 0x80], buttons: () => [false, false] });
    expect(r.frames).toBe(123);
    expect(r.result).toEqual({ level: 1, a: 0, b: 0 });
    expect(c.ticks).toBe(120);
    // frames 1 and 2 have one call each (the extra-poll flag is not set yet); frame 3 sets it in its first call and already makes a second; every later
    // frame makes two, frame 123's first call ends the move (state 6) and its second delivers the result: 2 x 123 - 2
    expect(r.calls).toBe(2 * 123 - 2);
  });
  it('mutants disagree: the dead-zone edge 0x9F, no halving of the digital counter, only one rotation direction, a stall clock of 0.6 s, a threshold plus one', () => {
    expect(replayAll({ quadEdge: 0x9f }).length).toBeGreaterThan(0);
    expect(replayAll({ halveDigital: false }).length).toBeGreaterThan(0);
    expect(replayAll({ bothDirections: false }).length).toBeGreaterThan(0);
    expect(replayAll({ stallSeconds: 0.6 }).length).toBeGreaterThan(0);
    expect(replayAll({ thresholdBias: 1 }).length).toBeGreaterThan(0);
  });
  it('the rotation ladder: exact rotations 0-40 either way give the casts of the table', () => {
    const CW: Array<[number, number]> = [[0xc8, 0x20], [0xc8, 0xc8], [0x20, 0xc8], [0x20, 0x20]];
    const ladders = vectors.filter((v) => v.class === 'ladder');
    expect(ladders).toHaveLength(21);
    for (const v of ladders) {
      const i = v.in as { variant: number; magic: number };
      const o = v.out as { levelsCw: number[]; levelsCcw: number[] };
      const t = furyThresholds(i.variant, i.magic);
      for (const [dir, expected] of [[0, o.levelsCw], [1, o.levelsCcw]] as const) {
        for (let n = 0; n <= 40; n++) {
          const seq = dir === 0 ? CW : [...CW].reverse();
          const samples: Array<[number, number]> = [[0x80, 0x80], [0x80, 0x80], [0x80, 0x80]];
          if (n === 0) samples.length = 0;
          else for (let k = 0; k < 4 * n + 1; k++) samples.push(seq[k % 4] as [number, number]);
          const c = new FuryController(t, FURY_LIMIT_SECONDS, true);
          runFury(c, { stick: (idx) => samples[idx] ?? [0x80, 0x80], buttons: () => [false, false] });
          expect(c.level, `variant ${i.variant} Magic ${i.magic} ${n} rotations dir ${dir}`).toBe(expected[n]);
          expect(furyCastsAfterRotations(t, n), `closed form ${n}`).toBe(expected[n]);
        }
      }
    }
  });
  it('the digital ladder: left/right pairs fed to the real controller give the casts of the halved rule on the steps it counted', () => {
    // a step is lost when the 0.5001 s stall clock clears the flags between its left reading and its right reading, so the levels are
    // compared with the steps the controller actually took (steps / 2 rotations), and the replay matches the real run's level
    const ladders = vectors.filter((v) => v.class === 'ladder-digital');
    expect(ladders).toHaveLength(21);
    let lost = 0;
    for (const v of ladders) {
      const i = v.in as { variant: number; magic: number };
      const o = v.out as { levelsByTwoSteps: number[] };
      const t = furyThresholds(i.variant, i.magic);
      o.levelsByTwoSteps.forEach((expected, j) => {
        const steps = 2 * j;
        const bt: Array<readonly [boolean, boolean]> = [];
        for (let s = 0; s < steps; s++) bt.push([true, false], [false, false], [false, true], [false, false]);
        const c = new FuryController(t, FURY_LIMIT_SECONDS, false);
        runFury(c, { stick: () => [0x80, 0x80], buttons: (idx) => bt[idx] ?? [false, false] });
        expect(c.level, `variant ${i.variant} Magic ${i.magic} ${steps} pairs`).toBe(expected);
        expect(furyCastsAfterRotations(t, c.rotations()), `closed form, ${c.steps} steps taken`).toBe(expected);
        if (c.steps < steps) lost += 1;
      });
    }
    expect(lost).toBeGreaterThanOrEqual(0);
  });
});

// ------------------------------------------------------------------------------------------------------------------------ the reels

describe("Wakka's reel line classifier (0x007B1710)", () => {
  it('hand-worked lines', () => {
    const c = (a: number, b: number, d: number) => classifyReelLine([a, b, d]);
    expect(c(0xff, 0, 0)).toEqual({ result: 0, hits: 0 }); // an invalid symbol: nothing
    expect(c(10, 10, 10)).toEqual({ result: 15, hits: 1 }); // three Aurochs symbols
    expect(c(10, 10, 0)).toEqual({ result: 16, hits: 1 }); // a PAIR of 10 is no match: Power Shot
    expect(c(0, 0, 0)).toEqual({ result: 2, hits: 1 }); // three of 0: result 2 (all enemies)
    expect(c(3, 1, 3)).toEqual({ result: 7, hits: 1 }); // a pair of 3: result 2 x 3 + 1 = 7
    expect(c(0, 0, 4)).toEqual({ result: 1, hits: 1 }); // a pair of 0 and an unknown symbol: Fire, not Power Shot
    expect(c(9, 9, 9)).toEqual({ result: 14, hits: 1 });
    expect(c(8, 2, 8)).toEqual({ result: 11, hits: 1 });
    expect(c(6, 6, 6)).toEqual({ result: 17, hits: 12 });
    expect(c(5, 5, 5)).toEqual({ result: 17, hits: 6 });
    expect(c(5, 6, 4)).toEqual({ result: 17, hits: 3 }); // one 1-hit and one 2-hit: 1 + 2
    expect(c(5, 5, 4)).toEqual({ result: 17, hits: 2 });
    expect(c(4, 4, 4)).toEqual({ result: 16, hits: 1 }); // no 5 and no 6: Power Shot
  });
  const vectors = fixture('reel_line');
  const lineOf = (a: number, b: number, d: number): [number, number] => {
    const r = classifyReelLine([a, b, d]);
    return [r.result, r.hits];
  };
  it('all 4,913 triples of the 17 symbols agree with the real classifier', () => {
    const v = vectors.find((x) => x.class === 'triples') as ParityVector;
    const alphabet = (v.in as { alphabet: number[] }).alphabet;
    const results = (v.out as { results: Array<[number, number]> }).results;
    expect(results).toHaveLength(17 ** 3);
    let k = 0;
    for (const a of alphabet) for (const b of alphabet) for (const d of alphabet) {
      expect(lineOf(a, b, d), `${a},${b},${d}`).toEqual(results[k]);
      k += 1;
    }
  });
  it('1,500 random lines agree too', () => {
    const v = vectors.find((x) => x.class === 'random') as ParityVector;
    const lines = (v.in as { lines: Array<[number, number, number]> }).lines;
    const results = (v.out as { results: Array<[number, number]> }).results;
    expect(lines).toHaveLength(1500);
    lines.forEach((l, k) => expect(lineOf(l[0], l[1], l[2]), l.join(',')).toEqual(results[k]));
  });
  it('a mutant that lets a pair of 10 count is caught', () => {
    const v = vectors.find((x) => x.class === 'triples') as ParityVector;
    const alphabet = (v.in as { alphabet: number[] }).alphabet;
    const results = (v.out as { results: Array<[number, number]> }).results;
    let disagreements = 0;
    let k = 0;
    for (const a of alphabet) for (const b of alphabet) for (const d of alphabet) {
      const mutant = [a, b, d].filter((s) => s === 10).length === 2 ? [15, 1] : lineOf(a, b, d);
      if (JSON.stringify(mutant) !== JSON.stringify(results[k])) disagreements += 1;
      k += 1;
    }
    expect(disagreements).toBeGreaterThan(10);
  });
});
