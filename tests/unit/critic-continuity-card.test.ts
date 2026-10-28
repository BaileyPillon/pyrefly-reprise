/**
 * **The head as the card carries it** (PR-0459; `critic/runner/lib/continuity-card.mjs`, probe version 3). CHK-026 reads the head through the camera; the engine's head lock holds it to the idle's
 * within a band of 0.9 to 1.1. Beside the projected ratio the harness now reads the card's own (the head box times the plane's world size), and says which of four things a head change is:
 * ok, lock (the lock compensating), camera (the lens alone), lock-band (the lock at the edge of its band) or registration (the table is off).
 *
 * Game case: both (shared critic plumbing).
 */
import { describe, expect, it } from 'vitest';
import { cardHeadSize, headClassOf, planeExt, readCardHead } from '../../critic/runner/lib/continuity-card.mjs';
import { analyzeSwap, summarize } from '../../critic/runner/lib/continuity-pure.mjs';
import type { Anchors, ContinuityConfig, FigRec, FrameOfFig, Mask } from '../../critic/runner/lib/continuity-pure.mjs';

const HEAD = { u0: 0.4, t0: 0.05, u1: 0.6, t1: 0.15 };
const tol = 3;

describe('which of the four a head change is', () => {
  it('ok when both readings are inside the tolerance', () => {
    expect(headClassOf({ projected: 1.01, card: 0.99, tolerancePct: tol, lockFrom: 1, lockTo: 1 })).toBe('ok');
  });
  it('lock when the card changed and the camera head did not: the lock doing its job', () => {
    expect(headClassOf({ projected: 1.001, card: 1.06, tolerancePct: tol, lockFrom: 1, lockTo: 1.06 })).toBe('lock');
  });
  it('camera when the projected head changed and the card head did not: only the lens', () => {
    expect(headClassOf({ projected: 0.92, card: 1.0, tolerancePct: tol, lockFrom: 1, lockTo: 1 })).toBe('camera');
  });
  it('lock-band when both changed and a plane lock sits at the edge of its band (Auron follow in the close-up: lock 1.10, the head still x0.92)', () => {
    expect(headClassOf({ projected: 0.9238, card: 1.11, tolerancePct: tol, lockFrom: 1, lockTo: 1.1 })).toBe('lock-band');
    expect(headClassOf({ projected: 1.09, card: 0.9, tolerancePct: tol, lockFrom: 0.9, lockTo: 1 })).toBe('lock-band');
  });
  it('registration when both changed and no lock is at the band', () => {
    expect(headClassOf({ projected: 0.95, card: 0.95, tolerancePct: tol, lockFrom: 1, lockTo: 1.02 })).toBe('registration');
  });
});

describe('the card head', () => {
  it('is the head box times the plane world size, square-rooted: independent of any camera', () => {
    expect(cardHeadSize({ wx: 2, wy: 4 }, HEAD)).toBeCloseTo(Math.sqrt(0.2 * 0.1 * 8), 9);
  });

  it('is read from the probe-3 extension of the plane with the painting key, and from nothing else', () => {
    const fig = { i: 0, a: 1, act: 0, g: [0, 0], s: [[7, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1], [9, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1]], pl: [[2, 4, 1], [3, 5, 1.1]] } as unknown as FigRec;
    expect(planeExt(fig, 9)).toEqual({ wx: 3, wy: 5, lock: 1.1 });
    expect(planeExt(fig, 8)).toBeNull();
    expect(planeExt({ ...fig, pl: undefined } as unknown as FigRec, 7)).toBeNull(); // a recording from probe 1 or 2
    expect(planeExt({ ...fig, pl: [0, [3, 5, 1]] } as unknown as FigRec, 7)).toBeNull();
  });

  it('reads the card ratio and the class of a swap (the follow card at the band: world head 1.10 of the idle, projected 0.92)', () => {
    const fig = { i: 0, a: 1, act: 1, g: [0, 0], s: [[0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1], [1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1]], pl: [[2, 4, 1], [2.2, 4.4, 1.1]] } as unknown as FigRec;
    const a = { head: HEAD } as Pick<Anchors, 'head'>;
    const r = readCardHead({ fig, kFrom: 0, kTo: 1, aFrom: a, aTo: a, projected: 0.92, tolerancePct: tol })!;
    expect(r.ratio).toBeCloseTo(1.1, 3);
    expect(r.lockTo).toBe(1.1);
    expect(r.class).toBe('lock-band');
    expect(readCardHead({ fig, kFrom: 0, kTo: 1, aFrom: { head: null }, aTo: a, projected: 1, tolerancePct: tol })).toBeNull();
  });
});

// ---------------------------------------------------------------------------------------------- in analyzeSwap

const CFG = (gate?: 'projected' | 'card'): ContinuityConfig => ({
  minBattleSeconds: 60, minSwaps: 8, minFps: 30,
  ...(gate ? { headGate: gate } : {}),
  size: { headTolerancePct: 3, feetTolerancePx: 2, headTolerancePctCoarse: 30, feetTolerancePxCoarse: 6 },
  motion: { windowFrames: 14, blendFadeMin: 0.02, ghostFadeMin: 0.15, ghostOutlineMin: 0.1, ghostSeverityFail: 0.2, snapOutlineMin: 0.05, snapCentroidMinPx: 4, snapsPerMinuteMax: 2, jerkMinPx: 24, jerkRatioMin: 3, jerkFailPx: 40 } as ContinuityConfig['motion'],
  strips: { worstSwaps: 10, worstJerks: 5, worstGhosts: 5, beforeFrames: 6, afterFrames: 6 },
});
const solid = (w = 16, h = 16): Mask => ({ w, h, bits: new Uint8Array(w * h).fill(1) });
const anchor = (): Anchors => ({ head: HEAD, mass: 0.3, stance: { u: 0.5, t: 0.98 }, stanceSrc: 'registration', mask: solid(), prone: false });
const rect = (x: number, y: number, w: number, h: number): number[] => [x, y, x + w, y, x + w, y + h, x, y + h];
const plane = (k: number, fade: number, q: number[]): number[] => [k, fade, 1, ...q];

/** A hard cut from plane 0 to plane 1 (the swap frame is index 2); the second plane is drawn `scale` times the size on screen, about the same bottom centre. */
function cut(scale: number, pl: [number, number, number][] | undefined): FrameOfFig[] {
  const fades: [number, number][] = [[1, 0], [1, 0], [0, 1], [0, 1], [0, 1]];
  return fades.map(([fa, fb], j) => ({
    n: 100 + j,
    t: (100 + j) * (1000 / 60),
    fig: { i: 0, a: 1, act: 1, s: [plane(0, fa, rect(300, 100, 200, 400)), plane(1, fb, rect(400 - 100 * scale, 500 - 400 * scale, 200 * scale, 400 * scale))], g: [0, 0], ...(pl ? { pl } : {}) } as FigRec,
  }));
}

describe('in a swap', () => {
  it('adds head.card and head.class to the projected reading when the recording has probe 3, and leaves the gate on the projected head by default', () => {
    // the follow plane is drawn 8 percent smaller on screen (scale 0.92) and its world size is 10 percent bigger: the lock at its band
    const r = analyzeSwap({ frames: cut(0.92, [[2, 4, 1], [2.2, 4.4, 1.1]]), at: 2, swap: { from: 0, to: 1 }, anchors: [anchor(), anchor()], k1600: 1, camCut: false, cfg: CFG() });
    expect(r.head!.ratio).toBeCloseTo(0.92, 2);
    expect(r.head!.card!.ratio).toBeCloseTo(1.1, 3);
    expect(r.head!.card!.class).toBe('lock-band');
    expect(r.failHead).toBe(true); // the projected 0.92 is 8 percent off
  });

  it('with the policy headGate on the card, the gate reads the card: a lens-only change (card 1.00) passes and a card at 1.10 fails', () => {
    const lens = analyzeSwap({ frames: cut(0.92, [[2, 4, 1], [2, 4, 1]]), at: 2, swap: { from: 0, to: 1 }, anchors: [anchor(), anchor()], k1600: 1, camCut: false, cfg: CFG('card') });
    expect(lens.head!.card!.class).toBe('camera');
    expect(lens.failHead).toBe(false);
    const band = analyzeSwap({ frames: cut(0.92, [[2, 4, 1], [2.2, 4.4, 1.1]]), at: 2, swap: { from: 0, to: 1 }, anchors: [anchor(), anchor()], k1600: 1, camCut: false, cfg: CFG('card') });
    expect(band.failHead).toBe(true);
    const projected = analyzeSwap({ frames: cut(0.92, [[2, 4, 1], [2, 4, 1]]), at: 2, swap: { from: 0, to: 1 }, anchors: [anchor(), anchor()], k1600: 1, camCut: false, cfg: CFG() });
    expect(projected.failHead).toBe(true); // today's gate, the same swap
  });

  it('a recording without probe 3 reads exactly as before: no card field', () => {
    const r = analyzeSwap({ frames: cut(0.92, undefined), at: 2, swap: { from: 0, to: 1 }, anchors: [anchor(), anchor()], k1600: 1, camCut: false, cfg: CFG() });
    expect(r.head!.card).toBeUndefined();
    expect(r.failHead).toBe(true);
  });

  it('the summary counts the card readings and who owns the changes', () => {
    const read = (scale: number, pl: [number, number, number][]) => analyzeSwap({ frames: cut(scale, pl), at: 2, swap: { from: 0, to: 1 }, anchors: [anchor(), anchor()], k1600: 1, camCut: false, cfg: CFG() });
    const swaps = [read(0.92, [[2, 4, 1], [2.2, 4.4, 1.1]]), read(1, [[2, 4, 1], [2, 4, 1]])].map((r, i) => ({ ...r, id: i, counted: true, figure: 'a', fromPose: 'attack', toPose: 'follow', n: 10 + i, tMs: 0 }));
    const sum = summarize({ swaps: swaps as never, jerks: [], battleSeconds: 120, cfg: CFG() });
    expect(sum.size.cardHead).toEqual({ measured: 2, maxPct: 10, byClass: { 'lock-band': 1, ok: 1 } });
  });
});
