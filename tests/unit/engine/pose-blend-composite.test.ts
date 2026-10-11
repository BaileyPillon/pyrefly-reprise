/**
 * FB-2 (visual-and-feel pass, 2026-10-10; plan item 2, "the composite check"; both games): the stepped dissolve, read three ways on the REAL `PaintedActor`.
 *
 * 1. **The harness's own reading.** The actor's per-frame plane fades (its two slots' painting and `fade`, frame by frame, from a random phase at 30 / 60 /
 *    120 / 144 fps) are fed to `analyzeSwap` (`critic/runner/lib/continuity-pure.mjs`, with the policy's real thresholds) with synthetic silhouettes whose overlap
 *    is 0.061 (Rikku ready to attack), 0.14 (Tidus attack to follow) and 0.30: ghost severity under the check's 0.40, no snap, at least one blend frame.
 * 2. **Pixels.** The harness reads plane fades, not the picture. So at the worst frames of each run the two planes are composited the way the material draws them
 *    (`PAINTED_BLENDING`: the blend factors are READ from it, so a change of material blending changes this test) over a black and a white background, and the
 *    figure's opacity per pixel is recovered from the pair. Two things are asserted on those pixels: the lesser painting's own pixels never show above the cap
 *    (the pixel form of the harness's `ghost.peak`, and the pixel severity matches the harness's within a hair), and the share of the overlap the figure still
 *    covers never dips below a stated floor: a plain dissolve's middle frame leaves a quarter of the body showing the background through (0.75 covered), the
 *    stepped dissolve never less than 0.79.
 * 3. **It can fail.** The same matrix on today's plain dissolve (`?poseblend=legacy`) reads severity 0.40 or more at IoU 0.061 and a dip to 0.75.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OneFactor, OneMinusSrcAlphaFactor, SrcAlphaFactor, ZeroFactor, CustomBlending } from 'three';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './head-lock-fixture.ts';
import { PAINTED_BLENDING } from '../../../src/engine/BloomMask.ts';
import { STEPPED_CAP, setPoseBlendLegacy } from '../../../src/engine/PoseBlend.ts';
import { analyzeSwap } from '../../../critic/runner/lib/continuity-pure.mjs';
import type { Anchors, ContinuityConfig, FrameOfFig } from '../../../critic/runner/lib/continuity-pure.mjs';

const CFG = (JSON.parse(readFileSync(resolve(__dirname, '..', '..', '..', 'critic', 'policy.json'), 'utf8')) as { continuity: ContinuityConfig }).continuity;

afterEach(() => {
  reset();
  setPoseBlendLegacy(null);
});

// ---------------------------------------------------------------- silhouettes and the pixel compositor

const W = 128;
const H = 96;
type Mask = Uint8Array;

/** A standing figure: a body and a head, centred on column `cx`. */
function figure(cx: number): Mask {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const body = ((px - cx) / 13) ** 2 + ((py - 58) / 30) ** 2 <= 1;
      const head = (px - cx) ** 2 + (py - 18) ** 2 <= 81;
      if (body || head) m[y * W + x] = 1;
    }
  }
  return m;
}

function iouOf(a: Mask, b: Mask): number {
  let i = 0;
  let u = 0;
  for (let p = 0; p < a.length; p++) {
    if (a[p] && b[p]) i++;
    if (a[p] || b[p]) u++;
  }
  return u ? i / u : 0;
}

/** The second figure, moved right until the pair overlaps by `target` (bisection on the shift). */
function pair(target: number): { a: Mask; b: Mask; iou: number } {
  const a = figure(34);
  let lo = 0;
  let hi = 80;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (iouOf(a, figure(34 + mid)) > target) lo = mid;
    else hi = mid;
  }
  const b = figure(34 + (lo + hi) / 2);
  return { a, b, iou: iouOf(a, b) };
}

interface Layer {
  color: [number, number, number];
  mask: Mask;
  alpha: number;
}

/** A blend factor, read from the material's constants. A constant this does not know is a change of material blending: it throws, so the test is re-read. */
function factor(f: number, srcA: number): number {
  if (f === ZeroFactor) return 0;
  if (f === OneFactor) return 1;
  if (f === SrcAlphaFactor) return srcA;
  if (f === OneMinusSrcAlphaFactor) return 1 - srcA;
  throw new Error(`the material's blend factor ${f} is not one this compositor knows`);
}

/** Draw the layers in order over a flat background of grey level `bg` and alpha 1, with `PAINTED_BLENDING`: the red channel of every pixel, and the destination alpha. */
function composite(layers: Layer[], bg: number): { red: Float64Array; dstA: Float64Array } {
  const N = W * H;
  const red = new Float64Array(N).fill(bg);
  const dstA = new Float64Array(N).fill(1);
  for (const l of layers) {
    for (let p = 0; p < N; p++) {
      const sa = l.mask[p] ? l.alpha : 0;
      red[p] = l.color[0] * factor(PAINTED_BLENDING.blendSrc, sa) + red[p]! * factor(PAINTED_BLENDING.blendDst, sa);
      dstA[p] = sa * factor(PAINTED_BLENDING.blendSrcAlpha, sa) + dstA[p]! * factor(PAINTED_BLENDING.blendDstAlpha, sa);
    }
  }
  return { red, dstA };
}

/** The figure's opacity per pixel, recovered from the same layers drawn over black and over white (`white - black = 1 - opacity`), checked against the destination alpha the material leaves (`1 - opacity`). */
function opacity(layers: Layer[]): Float64Array {
  const black = composite(layers, 0);
  const white = composite(layers, 1);
  const out = new Float64Array(W * H);
  for (let p = 0; p < out.length; p++) {
    out[p] = 1 - (white.red[p]! - black.red[p]!);
    if (Math.abs(out[p]! - (1 - white.dstA[p]!)) > 1e-9) throw new Error('the colour and the destination alpha of the blend disagree');
  }
  return out;
}

const RED: [number, number, number] = [0.85, 0.25, 0.2];
const BLUE: [number, number, number] = [0.2, 0.3, 0.85];

describe('the compositor is the material\'s blending', () => {
  it('PAINTED_BLENDING is plain source-over for colour (src alpha, one minus src alpha) and leaves the destination alpha times one minus src alpha', () => {
    expect(PAINTED_BLENDING.blending).toBe(CustomBlending);
    expect(PAINTED_BLENDING.blendSrc).toBe(SrcAlphaFactor);
    expect(PAINTED_BLENDING.blendDst).toBe(OneMinusSrcAlphaFactor);
    expect(PAINTED_BLENDING.blendSrcAlpha).toBe(ZeroFactor);
    expect(PAINTED_BLENDING.blendDstAlpha).toBe(OneMinusSrcAlphaFactor);
  });

  it('known answers: one layer at 0.5 covers 0.5; two at 0.5 and 0.5 cover 0.75, in either order; a layer at 1 over a 0.7 one covers 1', () => {
    const m = new Uint8Array(W * H).fill(1);
    expect(opacity([{ color: RED, mask: m, alpha: 0.5 }])[0]).toBeCloseTo(0.5, 12);
    const ab = opacity([{ color: RED, mask: m, alpha: 0.5 }, { color: BLUE, mask: m, alpha: 0.5 }])[0]!;
    const ba = opacity([{ color: BLUE, mask: m, alpha: 0.5 }, { color: RED, mask: m, alpha: 0.5 }])[0]!;
    expect(ab).toBeCloseTo(0.75, 12);
    expect(ba).toBeCloseTo(0.75, 12);
    expect(opacity([{ color: RED, mask: m, alpha: 0.7 }, { color: BLUE, mask: m, alpha: 1 }])[0]).toBeCloseTo(1, 12);
    // and the colour is the source-over colour: 0.5 of red over black
    expect(composite([{ color: RED, mask: m, alpha: 0.5 }], 0).red[0]).toBeCloseTo(0.425, 12);
  });

  it('the silhouettes hit their overlaps (0.061, 0.14, 0.30)', () => {
    for (const t of [0.061, 0.14, 0.3]) expect(Math.abs(pair(t).iou - t)).toBeLessThan(0.01);
  });
});

// ---------------------------------------------------------------- the real actor, frame by frame

/** Tidus as the stage stages him; the blend runs on whichever shape is on when he is built. */
function tidus(crossfadeMs: number): Actor {
  const a = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false, crossfadeMs });
  const poses: Record<string, ReturnType<typeof painting>> = {};
  for (const p of ['idle', 'ready', 'attack']) poses[p] = painting('tidus', p);
  a.adoptPoses(poses, 'idle');
  return a;
}

const QUAD = [0, 0, W, 0, W, H, 0, H];
const keyOf = (pose: string): number => (pose === 'ready' ? 0 : pose === 'attack' ? 1 : 2);

interface Run {
  frames: FrameOfFig[];
  at: number;
  fades: Array<[number, number]>; // [ready, attack] per frame
}

/** `ready` showing, then the request for `attack`, then frames of `1000 / fps` ms from `phase` ms into one, until it has settled. Each frame is the probe's record of the two planes. */
function swapRun(a: Actor, fps: number, phase: number): Run {
  a.setPose('ready', { immediate: true, force: true });
  const frames: FrameOfFig[] = [];
  const fades: Array<[number, number]> = [];
  const record = (t: number): void => {
    const s = slotsOf(a);
    const fade = (pose: string): number => s.reduce((n, sl) => n + (sl.pose === pose ? sl.fade : 0), 0);
    frames.push({ n: frames.length, t, fig: { i: 0, a: 1, act: 0, s: s.map((sl) => [keyOf(sl.pose), sl.fade, 1, ...QUAD]), g: [0, 0] } });
    fades.push([fade('ready'), fade('attack')]);
  };
  record(0);
  a.setPose('attack');
  const frame = 1000 / fps;
  let t = 0;
  let step = phase;
  for (let settled = 0; settled < 3; step = frame) {
    a.update(step / 1000, step / 1000);
    t += step;
    record(t);
    if (!a.blending) settled++;
  }
  const at = Math.max(1, fades.findIndex((f, i) => i > 0 && f[1] >= f[0]));
  return { frames, at, fades };
}

interface Reading {
  severity: number; // the harness's, over the matrix
  pixelSeverity: number; // the pixel form of the same
  worstGhost: number; // the lesser painting's own pixels: the most they ever show
  minCovered: number; // the least share of the overlap the figure covers
  blendFrames: number; // the fewest blend frames any run shows
  snaps: number;
  iou: number;
}

const PHASES = 16;

/** The whole matrix for one overlap: every frame rate, `PHASES` phases each, the harness's reading and the pixels at each run's worst frames. */
function matrix(a: Actor, target: number): Reading {
  const { a: ma, b: mb, iou } = pair(target);
  const anchor = (mask: Mask): Anchors => ({ head: null, mass: null, stance: null, stanceSrc: null, mask: { w: W, h: H, bits: mask }, prone: false });
  const anchors = [anchor(ma), anchor(mb)];
  const both = new Uint8Array(W * H);
  const onlyA = new Uint8Array(W * H);
  const onlyB = new Uint8Array(W * H);
  for (let p = 0; p < both.length; p++) {
    both[p] = ma[p] && mb[p] ? 1 : 0;
    onlyA[p] = ma[p] && !mb[p] ? 1 : 0;
    onlyB[p] = mb[p] && !ma[p] ? 1 : 0;
  }
  const mean = (op: Float64Array, over: Mask): number => {
    let s = 0;
    let n = 0;
    for (let p = 0; p < op.length; p++) if (over[p]) { s += op[p]!; n++; }
    return s / n;
  };
  const maxOf = (op: Float64Array, over: Mask): number => {
    let m = 0;
    for (let p = 0; p < op.length; p++) if (over[p]) m = Math.max(m, op[p]!);
    return m;
  };
  const r: Reading = { severity: 0, pixelSeverity: 0, worstGhost: 0, minCovered: 1, blendFrames: Infinity, snaps: 0, iou };
  for (const fps of [30, 60, 120, 144]) {
    for (let k = 0; k < PHASES; k++) {
      const run = swapRun(a, fps, ((k + 0.5) / PHASES) * (1000 / fps));
      const res = analyzeSwap({ frames: run.frames, at: run.at, swap: { from: 0, to: 1 }, anchors, k1600: 1, camCut: false, cfg: CFG });
      r.severity = Math.max(r.severity, res.ghost.severity);
      r.blendFrames = Math.min(r.blendFrames, res.blendFrames);
      if (res.snap) r.snaps++;
      expect(Math.abs((res.outline?.iou ?? 0) - iou), 'the harness reads the overlap the silhouettes were built to').toBeLessThan(0.025);
      // the worst frame for the double image (the lesser painting highest) and for the overlap (the figure thinnest in it)
      const lo = run.fades.map(([f, t]) => Math.min(f, t));
      const thin = run.fades.map(([f, t]) => 1 - (1 - f) * (1 - t));
      const ghostAt = lo.indexOf(Math.max(...lo));
      const thinAt = thin.indexOf(Math.min(...thin));
      for (const j of new Set([ghostAt, thinAt])) {
        const [f, t] = run.fades[j]!;
        const op = opacity([{ color: RED, mask: ma, alpha: f }, { color: BLUE, mask: mb, alpha: t }]);
        r.minCovered = Math.min(r.minCovered, mean(op, both));
        if (j === ghostAt) {
          const ghost = f < t ? maxOf(op, onlyA) : maxOf(op, onlyB); // the lesser painting's own pixels
          r.worstGhost = Math.max(r.worstGhost, ghost);
          if (ghost >= CFG.motion.ghostFadeMin) r.pixelSeverity = Math.max(r.pixelSeverity, ghost * (1 - iou));
          expect(ghost, 'the pixels of the lesser painting show exactly what its plane fade says').toBeCloseTo(Math.min(f, t), 9);
        }
      }
    }
  }
  return r;
}

/** The stated floor: the share of the overlap the figure covers, at the least. A plain dissolve's middle reads 0.75; the stepped one's step reads 0.79. */
const FLOOR = 0.78;
const CHECK_LIMIT = CFG.motion.ghostSeverityFail;
const IOUS = [0.061, 0.14, 0.3];

describe.each([[120], [140]])('the stepped dissolve on the real PaintedActor, %i ms blends: the harness\'s reading and the composited pixels', (ms) => {
  it('the check\'s limit is the policy\'s 0.40', () => {
    expect(CHECK_LIMIT).toBe(0.4);
  });

  for (const target of IOUS) {
    it(`IoU ${target}: severity under 0.40 (and under ${STEPPED_CAP} x (1 - IoU)), no snap, a blend frame in every run, the lesser painting\'s pixels never above ${STEPPED_CAP}, the overlap covered at ${FLOOR} or more`, () => {
      setPoseBlendLegacy(false);
      const r = matrix(tidus(ms), target);
      expect(r.severity).toBeLessThan(CHECK_LIMIT);
      expect(r.severity).toBeLessThanOrEqual(STEPPED_CAP * (1 - r.iou) + 0.002); // the cap, in the harness's own units
      expect(r.snaps).toBe(0);
      expect(r.blendFrames).toBeGreaterThanOrEqual(1);
      expect(r.worstGhost).toBeLessThanOrEqual(STEPPED_CAP + 1e-9);
      expect(r.minCovered).toBeGreaterThanOrEqual(FLOOR);
      expect(r.minCovered).toBeLessThan(0.8); // (and the step is where it dips: the floor is tight, not vacuous)
      expect(Math.abs(r.pixelSeverity - r.severity), 'the pixels and the plane fades give the harness the same number').toBeLessThan(0.015);
    }, 60_000);

    it(`IoU ${target}, the guard: today's plain dissolve (?poseblend=legacy) reads ${target <= 0.14 ? 'a severity of 0.40 or more' : 'a dip under the floor'}, so the same checks can fail`, () => {
      setPoseBlendLegacy(true);
      const r = matrix(tidus(ms), target);
      expect(r.minCovered).toBeLessThan(FLOOR); // the middle of a plain dissolve: 0.75
      expect(r.worstGhost).toBeGreaterThan(0.45);
      if (target <= 0.14) expect(r.severity).toBeGreaterThanOrEqual(CHECK_LIMIT);
      expect(r.severity).toBeGreaterThan(STEPPED_CAP * (1 - r.iou) + 0.05);
    }, 60_000);
  }
});
