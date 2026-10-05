/**
 * CHK-026 (size continuity across pose changes) and CHK-027 (continuity of motion), the maths of the harness
 * (`critic/runner/lib/continuity-pure.mjs`), held to known answers. Bailey, 2026-10-04 (D-420 to D-426): "As poses change for
 * the characters their size changes too sometimes and that looks really bad"; "pose sizing jumps and pose changes snapping
 * around in a discontinuous half motion". Nothing here opens a browser: the in-page probe records plane corners and fades,
 * and these are the functions that turn them into head sizes, feet, outline jumps, ghost frames, jerks and verdicts.
 *
 * Game case: both (shared critic plumbing; a size jump or a snap is a defect in either game).
 */
import { describe, expect, it } from 'vitest';
import {
  analyzeSwap, applyH, detectJerks, distinctFirst, feetPoint, figureTrack, headCentre, headSizePx, invertH, median, outlineJump, planeOf, polygonArea,
  scale1600, summarize, swapBadness, unitSquareToQuad, verdicts, worstSwaps,
} from '../../critic/runner/lib/continuity-pure.mjs';
import type { Anchors, ContinuityConfig, FigRec, FrameOfFig, Jerk, Mask, SwapRow } from '../../critic/runner/lib/continuity-pure.mjs';

const CFG: ContinuityConfig = {
  minBattleSeconds: 60, minSwaps: 8, minFps: 30,
  size: { headTolerancePct: 3, feetTolerancePx: 2, headTolerancePctCoarse: 30, feetTolerancePxCoarse: 6 },
  motion: { windowFrames: 14, blendFadeMin: 0.02, ghostFadeMin: 0.15, ghostOutlineMin: 0.1, ghostSeverityFail: 0.2, snapOutlineMin: 0.05, snapCentroidMinPx: 4, snapsPerMinuteMax: 2, jerkMinPx: 24, jerkFloorPx: 2, jerkRatio: 3, jerkFailPx: 40, localWindow: 5, mergeFrames: 2, ballisticChain: 3, cutPx: 120 },
  strips: { worstSwaps: 10, worstJerks: 5, worstGhosts: 5, beforeFrames: 6, afterFrames: 6 },
};

const rect = (x: number, y: number, w: number, h: number): number[] => [x, y, x + w, y, x + w, y + h, x, y + h];
const solid = (w = 16, h = 16): Mask => ({ w, h, bits: new Uint8Array(w * h).fill(1) });
/** Left half solid, right half empty. */
const leftHalf = (w = 16, h = 16): Mask => { const bits = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) bits[y * w + x] = 1; return { w, h, bits }; };
const plane = (k: number, fade: number, q: number[]): number[] => [k, fade, 1, ...q];
const figure = (s0: number[] | 0, s1: number[] | 0, g: [number, number] = [0, 0]): FigRec => ({ i: 0, a: 1, act: 1, s: [s0, s1], g });
const frame = (n: number, fig: FigRec): FrameOfFig => ({ n, t: n * (1000 / 60), fig });

const HEAD = { u0: 0.4, t0: 0.05, u1: 0.6, t1: 0.15 };
const anchor = (over: Partial<Anchors> = {}): Anchors => ({ head: HEAD, mass: 0.3, stance: { u: 0.5, t: 0.98 }, stanceSrc: 'registration', mask: solid(), prone: false, ...over });

describe('the geometry', () => {
  it('maps the unit square onto an axis-aligned quad exactly', () => {
    const H = unitSquareToQuad(rect(100, 200, 300, 600));
    expect(applyH(H, 0, 0)).toEqual([100, 200]);
    expect(applyH(H, 1, 1)).toEqual([400, 800]);
    const [x, y] = applyH(H, 0.5, 0.25);
    expect(x).toBeCloseTo(250, 9);
    expect(y).toBeCloseTo(350, 9);
  });

  it('maps a keystoned quad (a plane yawed in perspective) corner for corner, and inverts', () => {
    const q = [120, 80, 420, 110, 400, 700, 100, 650];
    const H = unitSquareToQuad(q);
    const corners: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    corners.forEach(([u, t], i) => {
      const [x, y] = applyH(H, u, t);
      expect(x).toBeCloseTo(q[i * 2]!, 6);
      expect(y).toBeCloseTo(q[i * 2 + 1]!, 6);
    });
    const inv = invertH(H)!;
    const [px, py] = applyH(H, 0.3, 0.7);
    const back = applyH(inv, px, py);
    expect(back[0]).toBeCloseTo(0.3, 6);
    expect(back[1]).toBeCloseTo(0.7, 6);
  });

  it('refuses to invert a collapsed quad', () => {
    expect(invertH([1, 2, 3, 2, 4, 6, 0, 0, 1])).toBeNull();
  });

  it('measures areas', () => {
    expect(polygonArea([[0, 0], [10, 0], [10, 5], [0, 5]])).toBe(50);
    expect(polygonArea([[0, 0], [4, 0], [0, 3]])).toBe(6);
  });

  it('puts the owner thresholds on a 1600-wide canvas whatever the window', () => {
    expect(scale1600(1600)).toBe(1);
    expect(scale1600(800)).toBe(2);
    expect(scale1600(0)).toBe(1);
  });

  it('measures a head as the square root of its box, the same on a mirrored plane', () => {
    const q = rect(0, 0, 1000, 1000);
    expect(headSizePx(unitSquareToQuad(q), HEAD)).toBeCloseTo(Math.sqrt(200 * 100), 6);
    // a mirrored plane lists its painting corners right to left; the box is the same box
    const mirrored = [1000, 0, 0, 0, 0, 1000, 1000, 1000];
    expect(headSizePx(unitSquareToQuad(mirrored), HEAD)).toBeCloseTo(Math.sqrt(200 * 100), 6);
    const c = headCentre(unitSquareToQuad(q), HEAD);
    expect(c[0]).toBeCloseTo(500, 6);
    expect(c[1]).toBeCloseTo(100, 6);
    expect(feetPoint(unitSquareToQuad(q), { u: 0.25, t: 0.9 })).toEqual([250, 900]);
  });

  it('takes the median of an even and an odd list', () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});

describe('the outline jump between two silhouettes', () => {
  const q = rect(100, 100, 200, 400);
  const H = unitSquareToQuad(q);

  it('is overlap 1 and no shift for the same silhouette drawn twice', () => {
    const r = outlineJump(solid(), H, solid(), H, q, q)!;
    expect(r.iou).toBeCloseTo(1, 6);
    expect(r.centroidShift).toBeCloseTo(0, 6);
  });

  it('is half the overlap for a silhouette that fills half of the other', () => {
    const r = outlineJump(solid(), H, leftHalf(), H, q, q)!;
    expect(r.iou).toBeGreaterThan(0.45);
    expect(r.iou).toBeLessThan(0.55);
    expect(r.centroidShift).toBeGreaterThan(40); // the centres of mass are a quarter of the plane apart: about 50 px
    expect(r.centroidShift).toBeLessThan(60);
  });

  it('sees a slide: the same silhouette 30 px to the right overlaps less and its centre is 30 px away', () => {
    const q2 = rect(130, 100, 200, 400);
    const r = outlineJump(solid(), H, solid(), unitSquareToQuad(q2), q, q2)!;
    expect(r.centroidShift).toBeGreaterThan(28);
    expect(r.centroidShift).toBeLessThan(32);
    expect(r.iou).toBeGreaterThan(0.72); // 170 px of the 200 px width overlap: 170 / 230
    expect(r.iou).toBeLessThan(0.76);
  });

  it('is zero overlap for planes that do not meet', () => {
    const q2 = rect(1000, 100, 200, 400);
    expect(outlineJump(solid(), H, solid(), unitSquareToQuad(q2), q, q2)!.iou).toBe(0);
  });

  it('answers null for a collapsed plane', () => {
    const flat = [0, 0, 0, 0, 0, 0, 0, 0];
    expect(outlineJump(solid(), unitSquareToQuad(flat), solid(), H, flat, q)).toBeNull();
  });
});

describe('where a figure is, frame by frame', () => {
  const anchors = [anchor(), anchor({ stance: { u: 0.5, t: 0.98 } })];

  it('glides between the two planes of a crossfade instead of hopping at half', () => {
    const a = plane(0, 0.75, rect(100, 100, 200, 400)), b = plane(1, 0.25, rect(160, 100, 200, 400));
    const tr = figureTrack(figure(a, b), anchors)!;
    // feet of a: (200, 492), of b: (260, 492); weighted 0.75 / 0.25
    expect(tr.feet![0]).toBeCloseTo(215, 6);
    expect(tr.feet![1]).toBeCloseTo(492, 6);
  });

  it('follows the head only while every plane that shows has a registered head', () => {
    const a = plane(0, 0.5, rect(100, 100, 200, 400)), b = plane(1, 0.5, rect(100, 100, 200, 400));
    expect(figureTrack(figure(a, b), [anchor(), anchor({ head: null })])!.head).toBeNull();
    expect(figureTrack(figure(a, b), [anchor(), anchor()])!.head).not.toBeNull();
    expect(figureTrack(figure(a, 0), [anchor(), anchor({ head: null })])!.head).not.toBeNull(); // the plane without a head is not showing
  });

  it('is null for a figure with nothing showing or no anchors', () => {
    expect(figureTrack(figure(0, 0), anchors)).toBeNull();
    expect(figureTrack(figure(plane(0, 1, rect(0, 0, 10, 10)), 0), [null])).toBeNull();
  });

  it('reads a plane record', () => {
    expect(planeOf([3, 0.5, 1, 1, 2, 3, 4, 5, 6, 7, 8])).toEqual({ k: 3, fade: 0.5, vis: true, q: [1, 2, 3, 4, 5, 6, 7, 8] });
    expect(planeOf(0)).toBeNull();
  });
});

/** A crossfade of one figure from plane 0 to plane 1: fades of the planes frame by frame. */
const crossfade = (qa: number[], qb: number[], fades: [number, number][], first = 100): FrameOfFig[] =>
  fades.map(([fa, fb], j) => frame(first + j, figure(plane(0, fa, qa), plane(1, fb, qb))));
const FADES: [number, number][] = [[1, 0], [0.9, 0.1], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.1, 0.9], [0, 1], [0, 1]];
const CUT: [number, number][] = [[1, 0], [1, 0], [0, 1], [0, 1], [0, 1]];
const swapOf = (frames: FrameOfFig[], anchors: (Anchors | null)[], at: number, camCut = false, k1600 = 1) => analyzeSwap({ frames, at, swap: { from: 0, to: 1 }, anchors, k1600, camCut, cfg: CFG });

describe('size continuity at a swap (CHK-026)', () => {
  const qa = rect(100, 100, 300, 600);
  // the same figure standing on the same spot: plane b is 1.2 times as big and placed so its feet sit where a's do
  const feetA = [100 + 150, 100 + 0.98 * 600]; // (250, 688)
  const big = (s: number): number[] => rect(feetA[0]! - 150 * s, feetA[1]! - 0.98 * 600 * s, 300 * s, 600 * s);

  it('passes a pose whose head and feet are where the idle\'s are', () => {
    const r = swapOf(crossfade(qa, big(1), FADES), [anchor(), anchor()], 4);
    expect(r.head!.ratio).toBeCloseTo(1, 3);
    expect(r.head!.source).toBe('registration');
    expect(r.head!.metric).toBe('head');
    expect(r.failHead).toBe(false);
    expect(r.feet!.px).toBeLessThan(0.01);
    expect(r.failFeet).toBe(false);
  });

  it('fails a head that grows by 20 percent, and reports the ratio', () => {
    const r = swapOf(crossfade(qa, big(1.2), FADES), [anchor(), anchor()], 4);
    expect(r.head!.ratio).toBeCloseTo(1.2, 3);
    expect(r.failHead).toBe(true);
  });

  it('holds the registered tolerance at 3 percent: 2.9 passes and 3.2 fails', () => {
    expect(swapOf(crossfade(qa, big(1.029), FADES), [anchor(), anchor()], 4).failHead).toBe(false);
    expect(swapOf(crossfade(qa, big(1.032), FADES), [anchor(), anchor()], 4).failHead).toBe(true);
    expect(swapOf(crossfade(qa, big(0.968), FADES), [anchor(), anchor()], 4).failHead).toBe(true); // shrinking is a jump too
  });

  it('measures on a canvas of any size in 1600-wide pixels', () => {
    const r = swapOf(crossfade(qa, big(1), FADES), [anchor(), anchor()], 4, false, 2);
    expect(r.head!.fromPx).toBeCloseTo(Math.sqrt(0.2 * 300 * 0.1 * 600) * 2, 1);
  });

  it('fails feet that slide 5 px and passes 1.5 px', () => {
    const slid = (dx: number): number[] => big(1).map((v, i) => (i % 2 === 0 ? v + dx : v));
    const a = swapOf(crossfade(qa, slid(5), FADES), [anchor(), anchor()], 4);
    expect(a.feet!.px).toBeCloseTo(5, 3);
    expect(a.feet!.dx).toBeCloseTo(5, 3);
    expect(a.failFeet).toBe(true);
    expect(swapOf(crossfade(qa, slid(1.5), FADES), [anchor(), anchor()], 4).failFeet).toBe(false);
  });

  it('does not ask a lying figure to keep its feet where they were', () => {
    const slid = big(1).map((v, i) => (i % 2 === 0 ? v + 40 : v));
    const r = swapOf(crossfade(qa, slid, FADES), [anchor(), anchor({ prone: true })], 4);
    expect(r.feet!.standing).toBe(false);
    expect(r.failFeet).toBe(false);
  });

  it('never compares a head with a mass: with no registered head on one side both poses are read as masses, against the wide tolerance', () => {
    const noHead = anchor({ head: null });
    // the masses are the same fraction of both planes, so a 1.2 plane is a 1.2 figure: inside 30 percent
    const ok = swapOf(crossfade(qa, big(1.2), FADES), [anchor(), noHead], 4);
    expect(ok.head!.source).toBe('silhouette');
    expect(ok.head!.metric).toBe('mass');
    expect(ok.head!.ratio).toBeCloseTo(1.2, 3);
    expect(ok.failHead).toBe(false);
    expect(swapOf(crossfade(qa, big(1.4), FADES), [anchor(), noHead], 4).failHead).toBe(true);
  });

  it('holds silhouette-read feet to the wide tolerance (6 px), not 2', () => {
    const slid = big(1).map((v, i) => (i % 2 === 0 ? v + 4 : v));
    expect(swapOf(crossfade(qa, slid, FADES), [anchor(), anchor({ stanceSrc: 'silhouette' })], 4).failFeet).toBe(false);
    const far = big(1).map((v, i) => (i % 2 === 0 ? v + 9 : v));
    expect(swapOf(crossfade(qa, far, FADES), [anchor(), anchor({ stanceSrc: 'silhouette' })], 4).failFeet).toBe(true);
  });

  it('is unmeasured, never a pass, when a plane of the swap was not recorded', () => {
    const frames = [frame(100, figure(plane(0, 1, qa), 0))];
    expect(swapOf(frames, [anchor(), anchor()], 0).unmeasured).toMatch(/not recorded/);
  });

  it('finds the old painting in the frame before when its plane was re-pointed while it still showed', () => {
    const before = frame(99, figure(plane(0, 0.76, qa), plane(1, 0.24, big(1))));
    const at = frame(100, figure(0, plane(1, 0.57, big(1.2))));
    const r = swapOf([before, at], [anchor(), anchor()], 1);
    expect(r.unmeasured).toBeUndefined();
    expect(r.head!.ratio).toBeCloseTo(1.2, 3);
  });

  describe('what counts as a change of pose (r391)', () => {
    const slid = big(1.2).map((v, i) => (i % 2 === 0 ? v + 30 : v)); // a 20 percent bigger head AND feet 30 px away: both would fail
    const art = (subject: string, pose: string, url = `/art/characters/${subject}/${pose}.webp`): Partial<Anchors> => ({ subject, pose, url } as Partial<Anchors>);

    it('judges two poses of one subject, whatever their names', () => {
      const r = swapOf(crossfade(qa, slid, FADES), [anchor(art('yuna-gunner', 'idle')), anchor(art('yuna-gunner', 'ready'))], 4);
      expect(r.costume).toBe(false);
      expect(r.sameArt).toBe(false);
      expect(r.failHead).toBe(true);
      expect(r.failFeet).toBe(true);
    });

    it('does not judge a change of dressphere or of a boss\'s form: it is a costume change, measured and shown', () => {
      const r = swapOf(crossfade(qa, slid, FADES), [anchor(art('paine-warrior', 'idle')), anchor(art('paine-gunner', 'idle'))], 4);
      expect(r.costume).toBe(true);
      expect(r.head!.ratio).toBeCloseTo(1.2, 3); // still read, so the summary can show the worst one
      expect(r.feet!.px).toBeGreaterThan(20);
      expect(r.failHead).toBe(false);
      expect(r.failFeet).toBe(false);
    });

    it('does not judge two pose names that draw one painting: the size cannot change and what moves is the pose state\'s own motion', () => {
      const r = swapOf(crossfade(qa, slid, FADES), [anchor(art('seymour-flux', 'idle')), anchor(art('seymour-flux', 'hurt', '/art/characters/seymour-flux/idle.webp'))], 4);
      expect(r.sameArt).toBe(true);
      expect(r.costume).toBe(false);
      expect(r.failHead).toBe(false);
      expect(r.failFeet).toBe(false);
    });

    it('keeps everything judged when a painting says nothing about its subject (an older build, a stand-in)', () => {
      const r = swapOf(crossfade(qa, slid, FADES), [anchor(), anchor()], 4);
      expect(r.costume).toBe(false);
      expect(r.sameArt).toBe(false);
      expect(r.failHead).toBe(true);
    });

    it('counts them in the summary and keeps them out of the size numbers', () => {
      const counted = (over: Partial<SwapRow>): SwapRow => ({ counted: true, camCut: false, notShowing: false, ghost: { frames: 0, ms: 0, peak: 0, severity: 0, worstFrame: null }, snap: false, hardCut: false, failHead: false, failFeet: false, ...over });
      const head = (ratio: number) => ({ fromPx: 100, toPx: 100 * ratio, ratio, source: 'registration' as const, metric: 'head' as const });
      const feet = (px: number) => ({ dx: px, dy: 0, px, standing: true, source: 'registration' });
      const s = summarize({
        swaps: [
          counted({ head: head(1.01), feet: feet(0.3) }),
          counted({ costume: true, head: head(1.3), feet: feet(40) }),
          counted({ sameArt: true, head: head(1), feet: feet(36) }),
        ],
        jerks: [], battleSeconds: 120, cfg: CFG,
      });
      expect(s.size.judged).toBe(1);
      expect(s.size.costumeSwaps).toBe(1);
      expect(s.size.sameArtSwaps).toBe(1);
      expect(s.size.costumeWorstHeadPct).toBeCloseTo(30, 1);
      expect(s.size.costumeWorstFeetPx).toBeCloseTo(40, 1);
      expect(s.size.maxHeadJumpPct).toBeCloseTo(1, 1);
      expect(s.size.maxFeetShiftPx).toBeCloseTo(0.3, 1);
      expect(s.size.headOverTolerance).toBe(0);
      expect(s.size.feetOverTolerance).toBe(0);
    });
  });
});

describe('snaps, blends and double images at a swap (CHK-027)', () => {
  const qa = rect(100, 100, 300, 600);
  const same = rect(100, 100, 300, 600);

  it('counts the in-between frames of a crossfade, and no ghost when the two silhouettes are one', () => {
    const r = swapOf(crossfade(qa, same, FADES), [anchor(), anchor()], 4);
    expect(r.blendFrames).toBe(5);
    expect(r.hardCut).toBe(false);
    expect(r.snap).toBe(false);
    expect(r.outline!.iou).toBeCloseTo(1, 3);
    expect(r.ghost.frames).toBe(0);
  });

  it('counts the double image of a crossfade between two different silhouettes, and the worst frame', () => {
    const r = swapOf(crossfade(qa, same, FADES), [anchor(), anchor({ mask: leftHalf() })], 4);
    expect(r.outline!.iou).toBeGreaterThan(0.45);
    expect(r.outline!.iou).toBeLessThan(0.55);
    expect(r.ghost.frames).toBe(3); // the frames where both planes are at 0.15 or more: 0.3, 0.5, 0.3
    expect(r.ghost.peak).toBe(0.5);
    expect(r.ghost.severity).toBeGreaterThan(0.22);
    expect(r.ghost.severity).toBeLessThan(0.28);
    expect(r.ghost.worstFrame).toBe(103);
    expect(r.ghost.ms).toBeGreaterThan(40);
    expect(r.ghost.ms).toBeLessThan(60);
  });

  it('calls a cut with no in-between frames a hard cut, and a snap when the picture jumps', () => {
    const r = swapOf(crossfade(qa, same, CUT), [anchor(), anchor({ mask: leftHalf() })], 2);
    expect(r.blendFrames).toBe(0);
    expect(r.hardCut).toBe(true);
    expect(r.snap).toBe(true);
    expect(r.ghost.frames).toBe(0);
  });

  it('does not call a cut a snap when nothing on screen moves', () => {
    const r = swapOf(crossfade(qa, same, CUT), [anchor(), anchor()], 2);
    expect(r.hardCut).toBe(true);
    expect(r.snap).toBe(false);
  });

  it('calls a cut a snap when the head jumps even though the outlines match', () => {
    const grown = rect(80, 60, 360, 720);
    const r = swapOf(crossfade(qa, grown, CUT), [anchor(), anchor()], 2);
    expect(r.failHead).toBe(true);
    expect(r.snap).toBe(true);
  });

  it('flags a camera cut at the swap so it can be left out', () => {
    expect(swapOf(crossfade(qa, same, FADES), [anchor(), anchor()], 4, true).camCut).toBe(true);
  });
});

const sample = (n: number, x: number, y: number, cam: [number, number] = [0, 0]) => ({ n, t: n * 16.7, feet: [x, y] as [number, number], head: [x, y - 300] as [number, number], cam });
const walk = (from: number, steps: number[], x0 = 500) => { let x = x0; return steps.map((s, i) => sample(from + i, (x += s), 700)); };

describe('jerks and teleports (CHK-027)', () => {
  it('leaves a smooth move alone, however fast', () => {
    expect(detectJerks(walk(0, Array(30).fill(10)), 1, CFG)).toEqual([]);
    expect(detectJerks(walk(0, Array(30).fill(45)), 1, CFG)).toEqual([]); // a lunge at 45 px a frame: fast, and its own speed
    const eased = [1, 3, 8, 16, 26, 38, 48, 52, 48, 38, 26, 16, 8, 3, 1];
    expect(detectJerks(walk(0, eased), 1, CFG)).toEqual([]);
  });

  it('flags a figure that pops 150 px in one frame during a walk', () => {
    const steps = [...Array(10).fill(4), 150, ...Array(10).fill(4)];
    const j = detectJerks(walk(0, steps), 1, CFG);
    expect(j).toHaveLength(1);
    expect(j[0]!.n).toBe(10);
    expect(j[0]!.px).toBeCloseTo(150, 0);
    expect(j[0]!.localPx).toBe(4);
    expect(j[0]!.ratio).toBeGreaterThan(30);
  });

  it('reports a lunge that pops back to its seat', () => {
    const out = [...Array(8).fill(30)]; // 240 px out in 8 frames
    const back = [-240]; // and home in one
    const j = detectJerks(walk(0, [...out, ...back, 0, 0, 0, 0]), 1, CFG);
    expect(j).toHaveLength(1);
    expect(j[0]!.px).toBeCloseTo(240, 0);
  });

  it('does not call a dash that starts at speed and slows a jerk, and does call a knock-back that jumps and then holds', () => {
    // 85 px in the first frame, then 66, 48, 32, 20, 12: the move's own profile (the Bahamut and Valefor attack runs of release 38)
    expect(detectJerks(walk(0, [0, 0, 0, 0, 0, 85, 66, 48, 32, 20, 12, 8, 4]), 1, CFG)).toEqual([]);
    // 71 px at once, then nothing for a frame, then a slow spring home (Tidus's hit recoil of release 38)
    const j = detectJerks(walk(0, [0, 0, 0, 0, 0, 71, 0, 23, 49, 30, 12, 4]), 1, CFG);
    expect(j.length).toBeGreaterThan(0);
    expect(j[0]!.px).toBeCloseTo(71, 0);
  });

  it('merges a two-frame pop into one event with the larger step', () => {
    const j = detectJerks(walk(0, [...Array(8).fill(2), 90, 70, ...Array(8).fill(2)]), 1, CFG);
    expect(j).toHaveLength(1);
    expect(j[0]!.px).toBeCloseTo(90, 0);
  });

  it('ignores a jump the camera made (a cut or a whip), not the figure', () => {
    const s = walk(0, [...Array(8).fill(3), 300, ...Array(8).fill(3)]);
    s[8]!.cam = [300, 0];
    expect(detectJerks(s, 1, CFG)).toEqual([]);
    // but a figure that moves while the camera moves slowly is still the figure's own
    const t = walk(0, [...Array(8).fill(3), 300, ...Array(8).fill(3)]);
    t[8]!.cam = [20, 0];
    expect(detectJerks(t, 1, CFG)).toHaveLength(1);
  });

  it('does not bridge a gap in the frames (the figure hid, the battle paused)', () => {
    const a = walk(0, Array(5).fill(3)), b = walk(100, Array(5).fill(3), 900);
    expect(detectJerks([...a, ...b], 1, CFG)).toEqual([]);
  });

  it('measures in 1600-wide pixels', () => {
    const j = detectJerks(walk(0, [...Array(10).fill(2), 40, ...Array(10).fill(2)]), 2, CFG);
    expect(j).toHaveLength(1);
    expect(j[0]!.px).toBeCloseTo(80, 0);
    expect(detectJerks(walk(0, [...Array(10).fill(2), 40, ...Array(10).fill(2)]), 0.5, CFG)).toEqual([]); // 20 px is under the 24 px floor
  });

  it('reads the head as well as the feet', () => {
    const s = walk(0, Array(12).fill(2));
    s[6]!.head = [s[6]!.head![0] + 120, s[6]!.head![1]]; // the head pops sideways for a frame, the feet stay
    const j = detectJerks(s, 1, CFG);
    expect(j.length).toBeGreaterThan(0);
    expect(j[0]!.part).toBe('head');
  });
});

const row = (over: Partial<SwapRow> = {}): SwapRow => ({
  id: 0, figure: 'tidus', fromPose: 'idle', toPose: 'attack', counted: true, camCut: false, notShowing: false, hardCut: false, snap: false,
  head: { fromPx: 60, toPx: 60, ratio: 1, source: 'registration', metric: 'head' }, feet: { dx: 0, dy: 0, px: 0, standing: true, source: 'registration' },
  outline: { iou: 0.9, centroidShiftPx: 2, areaRatio: 1 }, ghost: { frames: 0, ms: 0, peak: 0, severity: 0, worstFrame: null }, blendFrames: 6, failHead: false, failFeet: false, ...over,
});

describe('the summary and the two verdicts', () => {
  const jerk = (px: number, atSwap = false): Jerk => ({ n: 10, t: 1, px, localPx: 3, ratio: px / 3, part: 'feet', dx: px, dy: 0, atSwap });

  it('passes a clean minute and a half of battle', () => {
    const swaps = Array.from({ length: 10 }, (_, i) => row({ id: i }));
    const s = summarize({ swaps, jerks: [], battleSeconds: 90, cfg: CFG });
    expect(s.counted).toBe(10);
    expect(s.swapsPerMinute).toBe(6.67);
    expect(s.checks['CHK-026'].result).toBe('PASS');
    expect(s.checks['CHK-027'].result).toBe('PASS');
  });

  it('says what a CHK-026 result rests on: how many swaps had a registered head and how many were read by mass', () => {
    const mass = row({ id: 50, head: { fromPx: 60, toPx: 61, ratio: 1.02, source: 'silhouette', metric: 'mass' } });
    const s = summarize({ swaps: [...Array.from({ length: 9 }, (_, i) => row({ id: i })), mass], jerks: [], battleSeconds: 90, cfg: CFG });
    expect(s.checks['CHK-026'].note).toMatch(/9 of 10 measured swaps had a registered head \(tolerance 3 percent\); 1 were read by the figure's mass \(tolerance 30 percent/);
  });

  it('fails CHK-026 on one head over tolerance and says how bad', () => {
    const swaps = [...Array.from({ length: 9 }, (_, i) => row({ id: i })), row({ id: 9, head: { fromPx: 60, toPx: 84, ratio: 1.4, source: 'registration', metric: 'head' }, failHead: true })];
    const s = summarize({ swaps, jerks: [], battleSeconds: 90, cfg: CFG });
    expect(s.size.headOverTolerance).toBe(1);
    expect(s.size.maxHeadJumpPct).toBe(40);
    expect(s.size.maxHeadJumpPctRegistration).toBe(40);
    expect(s.checks['CHK-026'].result).toBe('FAIL');
    expect(s.checks['CHK-026'].reasons.join(' ')).toMatch(/1 swap\(s\) change a head/);
    expect(s.checks['CHK-027'].result).toBe('PASS');
  });

  it('fails CHK-026 on feet that slid, and keeps a lying figure out of the feet count', () => {
    const slid = row({ id: 1, feet: { dx: 30, dy: 0, px: 30, standing: true, source: 'registration' }, failFeet: true });
    const lying = row({ id: 2, feet: { dx: 200, dy: 0, px: 200, standing: false, source: 'silhouette' } });
    const s = summarize({ swaps: [row(), slid, lying, ...Array.from({ length: 8 }, (_, i) => row({ id: 10 + i }))], jerks: [], battleSeconds: 90, cfg: CFG });
    expect(s.size.feetMeasured).toBe(10);
    expect(s.size.maxFeetShiftPx).toBe(30);
    expect(s.size.feetOverTolerance).toBe(1);
    expect(s.checks['CHK-026'].result).toBe('FAIL');
  });

  it('counts snaps per minute of battle and fails CHK-027 past the threshold', () => {
    const snaps = [row({ id: 1, snap: true, hardCut: true, toPose: 'ko' }), row({ id: 2, snap: true, hardCut: true, toPose: 'ko' }), row({ id: 3, snap: true, hardCut: true, toPose: 'item' })];
    const s = summarize({ swaps: [...snaps, ...Array.from({ length: 8 }, (_, i) => row({ id: 10 + i }))], jerks: [], battleSeconds: 60, cfg: CFG });
    expect(s.motion.snaps).toBe(3);
    expect(s.motion.snapsPerMinute).toBe(3);
    expect(s.motion.snapsByToPose).toEqual({ ko: 2, item: 1 });
    expect(s.checks['CHK-027'].result).toBe('FAIL');
    expect(s.checks['CHK-027'].reasons.join(' ')).toMatch(/3 snaps per minute is over 2/);
  });

  it('fails CHK-027 on one jerk of the failing size, and not on a small one', () => {
    const swaps = Array.from({ length: 10 }, (_, i) => row({ id: i }));
    expect(summarize({ swaps, jerks: [jerk(60)], battleSeconds: 90, cfg: CFG }).checks['CHK-027'].result).toBe('FAIL');
    expect(summarize({ swaps, jerks: [jerk(30)], battleSeconds: 90, cfg: CFG }).checks['CHK-027'].result).toBe('PASS');
    const s = summarize({ swaps, jerks: [jerk(60, true), jerk(90)], battleSeconds: 90, cfg: CFG });
    expect(s.motion.jerks).toBe(2);
    expect(s.motion.jerksMidMove).toBe(1);
    expect(s.motion.worstJerkPx).toBe(90);
  });

  it('fails CHK-027 on a double image of the failing severity', () => {
    const ghost = row({ id: 1, ghost: { frames: 4, ms: 67, peak: 0.5, severity: 0.31, worstFrame: 12 } });
    const s = summarize({ swaps: [ghost, ...Array.from({ length: 9 }, (_, i) => row({ id: 10 + i }))], jerks: [], battleSeconds: 90, cfg: CFG });
    expect(s.motion.ghostSwaps).toBe(1);
    expect(s.motion.ghostFrames).toBe(4);
    expect(s.motion.ghostOverFail).toBe(1);
    expect(s.checks['CHK-027'].result).toBe('FAIL');
  });

  it('leaves swaps under a camera cut or off screen out of every count', () => {
    const swaps = [row({ id: 1, camCut: true, counted: false, snap: true }), row({ id: 2, notShowing: true, counted: false }), ...Array.from({ length: 9 }, (_, i) => row({ id: 10 + i }))];
    const s = summarize({ swaps, jerks: [], battleSeconds: 90, cfg: CFG });
    expect(s.counted).toBe(9);
    expect(s.excludedByCut).toBe(1);
    expect(s.excludedNotShowing).toBe(1);
    expect(s.motion.snaps).toBe(0);
  });

  it('is UNVERIFIED, never PASS, when it saw too little to judge', () => {
    const swaps = Array.from({ length: 10 }, (_, i) => row({ id: i }));
    const short = summarize({ swaps, jerks: [], battleSeconds: 20, cfg: CFG });
    expect(short.checks['CHK-026'].result).toBe('UNVERIFIED');
    expect(short.checks['CHK-026'].reasons[0]).toMatch(/only 20 s of battle/);
    const few = summarize({ swaps: swaps.slice(0, 3), jerks: [], battleSeconds: 90, cfg: CFG });
    expect(few.checks['CHK-027'].result).toBe('UNVERIFIED');
    const slow = verdicts(summarize({ swaps, jerks: [], battleSeconds: 90, cfg: CFG }), CFG, { fps: 12 });
    expect(slow['CHK-026'].result).toBe('UNVERIFIED');
    expect(slow['CHK-026'].reasons[0]).toMatch(/12 fps/);
    const broke = verdicts(summarize({ swaps, jerks: [], battleSeconds: 90, cfg: CFG }), CFG, { error: 'boom' });
    expect(broke['CHK-027'].result).toBe('UNVERIFIED');
  });

  it('shows one strip per figure and pose pair before any repeat of one, then fills with the repeats', () => {
    // six copies of the same Auron swap are the worst six, then two Yuna swaps and one Tidus swap
    const auron = (id: number, px: number): SwapRow => row({ id, figure: 'auron', fromPose: 'attack', toPose: 'follow', feet: { dx: px, dy: 0, px, standing: true, source: 'registration' }, failFeet: true });
    const swaps = [...Array.from({ length: 6 }, (_, i) => auron(i, 130 - i)), row({ id: 10, figure: 'yuna', fromPose: 'item', toPose: 'idle', feet: { dx: 70, dy: 0, px: 70, standing: true, source: 'registration' }, failFeet: true }), row({ id: 11, figure: 'yuna', fromPose: 'item', toPose: 'idle', feet: { dx: 69, dy: 0, px: 69, standing: true, source: 'registration' }, failFeet: true }), row({ id: 12, figure: 'tidus', fromPose: 'idle', toPose: 'victory', head: { fromPx: 60, toPx: 37, ratio: 0.62, source: 'registration', metric: 'head' }, failHead: true })];
    const ids = worstSwaps(swaps, 5, CFG).map((s) => s.id);
    expect(ids.slice(0, 3)).toEqual([0, 10, 12]); // the worst of each pair first, worst pair first (130 px of feet, 70 px, a 38 percent head)
    expect(ids).toHaveLength(5);
    expect(ids.slice(3)).toEqual([1, 2]); // then the repeats, worst first
    expect(distinctFirst([1, 2, 3, 4, 5, 6], (x) => String(x % 2), 4)).toEqual([1, 2, 3, 4]);
    expect(distinctFirst(['a', 'a', 'b'], (x) => x, 2)).toEqual(['a', 'b']);
  });

  it('orders the worst swaps by how far past the thresholds each one went', () => {
    const mild = row({ id: 1, head: { fromPx: 60, toPx: 62, ratio: 1.033, source: 'registration', metric: 'head' }, failHead: true });
    const slide = row({ id: 2, feet: { dx: 119, dy: 0, px: 119, standing: true, source: 'registration' }, failFeet: true });
    const big = row({ id: 3, head: { fromPx: 60, toPx: 84, ratio: 1.4, source: 'registration', metric: 'head' }, failHead: true, snap: true });
    const fine = row({ id: 4 });
    const order = worstSwaps([fine, mild, slide, big], 3, CFG).map((s) => s.id);
    expect(order).toEqual([2, 3, 1]);
    expect(swapBadness(fine, CFG)).toBeLessThan(swapBadness(mild, CFG));
    expect(swapBadness(big, CFG)).toBeGreaterThan(swapBadness(row({ id: 5, head: big.head!, failHead: true }), CFG)); // a snap adds weight
  });
});
