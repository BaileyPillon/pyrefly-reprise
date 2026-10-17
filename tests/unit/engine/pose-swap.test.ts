/**
 * W5 (pose swap smoothing, 2026-10-17; both games): the switch, the frame clock and the pair policy of `PoseSwap.ts`. Pure: no `three`, no DOM.
 *
 * The policy is a function of the pair's overlap (intersection over union of the two silhouettes) and the distance between their anchors, plus whether the
 * game holds still and whether a blend is already running. The table below is the contract the driver read: overlap 0.30 or more is an aligned dissolve, under
 * it a cut where the game holds still, the aligned dissolve where it does not, and the plain dissolve when the heads are already together.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  ALIGN_MIN_DISTANCE,
  ALIGN_MIN_OVERLAP,
  CUT_MAX_DISTANCE,
  MAX_DELTA_SMOOTH,
  MAX_DELTA_TODAY,
  POSE_SWAP_DEFAULT,
  STILL_SPEED,
  figureHolding,
  frameClockMax,
  poseSwapMode,
  poseSwapPart,
  poseSwapSmooth,
  setPoseSwapMode,
  setPoseSwapParts,
  swapPolicy,
  type SwapPairFacts,
} from '../../../src/engine/PoseSwap.ts';

afterEach(() => {
  setPoseSwapMode(null);
  setPoseSwapParts(null);
});

const far = 0.4; // anchors 40 percent of the figure's height apart
const facts = (over: Partial<SwapPairFacts> = {}): SwapPairFacts => ({ overlap: 0.5, anchorDistance: far, hold: false, blending: false, ...over });

describe('the switch', () => {
  it('defaults to today until the driver flips the constant', () => {
    expect(POSE_SWAP_DEFAULT).toBe('today');
    expect(poseSwapMode()).toBe('today');
    expect(poseSwapSmooth()).toBe(false);
  });

  it('setPoseSwapMode forces either mode, and null reads the address again', () => {
    setPoseSwapMode('smooth');
    expect(poseSwapMode()).toBe('smooth');
    expect(poseSwapSmooth()).toBe(true);
    setPoseSwapMode('today');
    expect(poseSwapSmooth()).toBe(false);
    setPoseSwapMode(null);
    expect(poseSwapMode()).toBe(POSE_SWAP_DEFAULT);
  });
});

describe('the frame clock (change 4)', () => {
  it('clamps at 1/20 s today and 1/40 s under smooth', () => {
    expect(MAX_DELTA_TODAY).toBeCloseTo(0.05, 12);
    expect(MAX_DELTA_SMOOTH).toBeCloseTo(0.025, 12);
    expect(frameClockMax('today')).toBe(MAX_DELTA_TODAY);
    expect(frameClockMax('smooth')).toBe(MAX_DELTA_SMOOTH);
  });

  it('follows the mode in force when none is named', () => {
    expect(frameClockMax()).toBe(MAX_DELTA_TODAY);
    setPoseSwapMode('smooth');
    expect(frameClockMax()).toBe(MAX_DELTA_SMOOTH);
  });

  it('smooth is a stricter clamp than today (a hitch is a slow frame, not a skipped one)', () => {
    expect(MAX_DELTA_SMOOTH).toBeLessThan(MAX_DELTA_TODAY);
    expect(MAX_DELTA_SMOOTH).toBeGreaterThan(1 / 60); // but never under one frame of a 60 Hz game: a steady frame is untouched
  });
});

describe('the pair policy (changes 1 and 2)', () => {
  it('a pair that overlaps by 0.30 or more, heads apart: the aligned dissolve, held or not', () => {
    expect(swapPolicy(facts({ overlap: ALIGN_MIN_OVERLAP }))).toBe('aligned');
    expect(swapPolicy(facts({ overlap: 0.9 }))).toBe('aligned');
    expect(swapPolicy(facts({ overlap: 0.9, hold: true }))).toBe('aligned');
  });

  it('a pair under 0.30 whose heads are close, where the game holds still and nothing blends: a cut', () => {
    const near = 0.04;
    expect(swapPolicy(facts({ overlap: 0.29, hold: true, anchorDistance: near }))).toBe('cut');
    expect(swapPolicy(facts({ overlap: 0, hold: true, anchorDistance: near }))).toBe('cut');
    expect(swapPolicy(facts({ overlap: 0.135, hold: true, anchorDistance: 0.01 }))).toBe('cut'); // heads together: still a different painting, still a cut
    expect(swapPolicy(facts({ overlap: 0.135, hold: true, anchorDistance: CUT_MAX_DISTANCE }))).toBe('cut');
  });

  it('a cut moves the head the whole distance in one frame, so heads further apart than CUT_MAX_DISTANCE are never cut: aligned from ALIGN_MIN_DISTANCE, else the plain dissolve', () => {
    expect(swapPolicy(facts({ overlap: 0.1, hold: true, anchorDistance: far }))).toBe('aligned');
    expect(swapPolicy(facts({ overlap: 0.1, hold: true, anchorDistance: ALIGN_MIN_DISTANCE }))).toBe('aligned');
    expect(swapPolicy(facts({ overlap: 0.1, hold: true, anchorDistance: (CUT_MAX_DISTANCE + ALIGN_MIN_DISTANCE) / 2 }))).toBe('dissolve');
    expect(CUT_MAX_DISTANCE).toBeLessThan(ALIGN_MIN_DISTANCE);
  });

  it('cutMaxDistance: Infinity is the first version (a cut at any distance, known or not), kept as the cutany ablation', () => {
    const all = { align: true, cut: true, cutMaxDistance: Infinity };
    expect(swapPolicy(facts({ overlap: 0.1, hold: true, anchorDistance: far }), all)).toBe('cut');
    expect(swapPolicy(facts({ overlap: 0.1, hold: true, anchorDistance: null }), all)).toBe('cut');
  });

  it('a pair under 0.30 with no hold near: the aligned dissolve, never a cut', () => {
    expect(swapPolicy(facts({ overlap: 0.135, hold: false }))).toBe('aligned');
  });

  it('never a cut while another blend runs (two paintings are already on screen), the aligned dissolve instead', () => {
    expect(swapPolicy(facts({ overlap: 0.1, hold: true, blending: true }))).toBe('aligned');
  });

  it('heads already together (under the minimum distance): the plain dissolve, whatever the overlap, unless it is a cut', () => {
    const near = ALIGN_MIN_DISTANCE - 0.001;
    expect(swapPolicy(facts({ anchorDistance: near }))).toBe('dissolve');
    expect(swapPolicy(facts({ overlap: 0.1, anchorDistance: near }))).toBe('dissolve');
    expect(swapPolicy(facts({ anchorDistance: ALIGN_MIN_DISTANCE }))).toBe('aligned');
  });

  it('unknown anchors: the plain dissolve; unknown overlap is never a cut', () => {
    expect(swapPolicy(facts({ anchorDistance: null }))).toBe('dissolve');
    expect(swapPolicy(facts({ overlap: 0.1, hold: true, anchorDistance: null }))).toBe('dissolve'); // a cut that cannot say how far the head jumps is not made
    expect(swapPolicy(facts({ overlap: null, hold: true }))).toBe('aligned');
    expect(swapPolicy(facts({ overlap: null, hold: true, anchorDistance: null }))).toBe('dissolve');
    expect(swapPolicy(facts({ overlap: Number.NaN, hold: true, anchorDistance: Number.NaN }))).toBe('dissolve');
  });
});

describe('holding still', () => {
  it('a field clock frozen while the real frame runs (a hit-stop, a paused field) is a hold', () => {
    expect(figureHolding(0, 1 / 60, 0)).toBe(true);
    expect(figureHolding(0, 1 / 60, 5)).toBe(true); // whatever the offset did
  });

  it('a figure that moves no faster than STILL_SPEED is a hold: a strike waiting at its apex, a figure at rest', () => {
    expect(figureHolding(1 / 60, 1 / 60, 0)).toBe(true);
    expect(figureHolding(1 / 60, 1 / 60, (STILL_SPEED / 60) * 0.99)).toBe(true);
  });

  it('a figure in motion is not: the step of a lunge, the return leg, a recoil', () => {
    expect(figureHolding(1 / 60, 1 / 60, (STILL_SPEED / 60) * 1.5)).toBe(false);
    expect(figureHolding(1 / 60, 1 / 60, 0.2)).toBe(false); // the lunge's step moves 0.2 to 0.4 units a frame
  });

  it('the speed is per second of FIELD time, so a long frame that moves further is judged on its own dt', () => {
    expect(figureHolding(1 / 20, 1 / 20, (STILL_SPEED / 20) * 0.9)).toBe(true);
    expect(figureHolding(1 / 20, 1 / 20, (STILL_SPEED / 20) * 1.1)).toBe(false);
  });

  it('no real time passed (a degenerate frame) is no hold', () => {
    expect(figureHolding(0, 0, 0)).toBe(false);
    expect(figureHolding(Number.NaN, Number.NaN, 0)).toBe(false);
  });
});

describe('the parts (ablations: ?swapparts=)', () => {
  it('under smooth all four changes are on unless the address names some', () => {
    setPoseSwapMode('smooth');
    for (const part of ['align', 'cut', 'lunge', 'clock'] as const) expect(poseSwapPart(part)).toBe(true);
  });

  it('under today none is on, whatever the parts say', () => {
    setPoseSwapParts(['align', 'cut', 'lunge', 'clock']);
    for (const part of ['align', 'cut', 'lunge', 'clock'] as const) expect(poseSwapPart(part)).toBe(false);
    expect(frameClockMax('today')).toBe(MAX_DELTA_TODAY);
  });

  it('cutany is a part of its own: not in smooth by default, named it turns on and the others off', () => {
    setPoseSwapMode('smooth');
    expect(poseSwapPart('cutany')).toBe(false);
    setPoseSwapParts(['cutany']);
    expect(poseSwapPart('cutany')).toBe(true);
    expect(poseSwapPart('cut')).toBe(false);
  });

  it('naming parts turns the others off, the clock included', () => {
    setPoseSwapMode('smooth');
    setPoseSwapParts(['lunge']);
    expect(poseSwapPart('lunge')).toBe(true);
    expect(poseSwapPart('align')).toBe(false);
    expect(poseSwapPart('cut')).toBe(false);
    expect(frameClockMax()).toBe(MAX_DELTA_TODAY);
    setPoseSwapParts(['clock']);
    expect(frameClockMax()).toBe(MAX_DELTA_SMOOTH);
  });

  it('the policy honours what it is allowed to do', () => {
    const f = facts({ overlap: 0.1, hold: true, anchorDistance: 0.05 });
    expect(swapPolicy(f)).toBe('cut');
    expect(swapPolicy(f, { align: true, cut: false })).toBe('dissolve'); // 0.05 is under the alignment's minimum too
    expect(swapPolicy(facts({ overlap: 0.1, hold: true }), { align: true, cut: false })).toBe('aligned');
    expect(swapPolicy(f, { align: false, cut: false })).toBe('dissolve');
    expect(swapPolicy(facts({ overlap: 0.9 }), { align: false, cut: true })).toBe('dissolve');
  });
});
