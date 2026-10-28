/**
 * The three edits to the continuity harness that Bailey approved on 2026-10-10 (P5 of the visual and feel pass, plan item FI-1; "I'll go with all
 * your recommendations"), landed as their own commit before any fix is measured, held to synthetic frame data:
 *   (a) a figure with no registration is followed by its silhouette's CENTROID, not by "the lowest thick part" (continuity-pure.mjs `figureTrack`,
 *       continuity-analyze.mjs);
 *   (b) a swap with a figure's `twirl-*` key on either side is ONE staged costume change, not a snap (continuity-staged.mjs); this settles FD-1, P4 keeping
 *       the twirl stepped;
 *   (c) a swap carries 14 frames of evidence before it: the strips show 14 before and 6 after (laid out in two rows), the probe's ring holds them, and the
 *       longest freeze in the middle of a blend is counted (continuity-held.mjs).
 * Nothing here opens a browser; every frame is made in the test.
 *
 * Game case: (a) and (c) both games (shared critic plumbing; the hit-stop that freezes a blend is longer in FFX); (b) FFX-2 only in effect, because only the
 * spherechange paints `twirl-*` keys (research/ffx-vs-ffx2-presentation.md section 6).
 */
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { analyzeRun } from '../../critic/runner/lib/continuity-analyze.mjs';
import { aggregate, continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import type { ChapterResult } from '../../critic/runner/lib/continuity.mjs';
import { HELD_MIN_FRAMES, heldPlateau } from '../../critic/runner/lib/continuity-held.mjs';
import { analyzeSwap, detectJerks, figureTrack, summarize, swapBadness, worstSwaps } from '../../critic/runner/lib/continuity-pure.mjs';
import type { Anchors, ContinuityConfig, FigRec, FrameOfFig, Mask, StagedStep, SwapRow } from '../../critic/runner/lib/continuity-pure.mjs';
import type { ProbeFrame, ProbeMeta } from '../../critic/runner/lib/continuity-probe.mjs';
import { MAX_ONE_ROW, composeStrip } from '../../critic/runner/lib/continuity-strips.mjs';
import { STAGED_GAP_FRAMES, groupStaged, isTwirlKey, stagedStepOf, twirlKeyOf } from '../../critic/runner/lib/continuity-staged.mjs';

const CFG: ContinuityConfig = continuityConfig();
const FRAME_MS = 1000 / 60;

// ------------------------------------------------------------------ small builders

const rect = (x: number, y: number, w: number, h: number): number[] => [x, y, x + w, y, x + w, y + h, x, y + h];
const solid = (w = 16, h = 16): Mask => ({ w, h, bits: new Uint8Array(w * h).fill(1) });
const leftHalf = (w = 16, h = 16): Mask => { const bits = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) bits[y * w + x] = 1; return { w, h, bits }; };
const rightHalf = (w = 16, h = 16): Mask => { const bits = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = w / 2; x < w; x++) bits[y * w + x] = 1; return { w, h, bits }; };
const plane = (k: number, fade: number, q: number[]): number[] => [k, fade, 1, ...q];
const figure = (s0: number[] | 0, s1: number[] | 0, g: [number, number] = [0, 0]): FigRec => ({ i: 0, a: 1, act: 1, s: [s0, s1], g });
const frame = (n: number, fig: FigRec): FrameOfFig => ({ n, t: n * FRAME_MS, fig });
const HEAD = { u0: 0.4, t0: 0.05, u1: 0.6, t1: 0.15 };
/** A registered, standing painting. */
const reg = (over: Partial<Anchors> = {}): Anchors => ({ head: HEAD, mass: 0.3, centroid: { u: 0.5, t: 0.5 }, stance: { u: 0.5, t: 0.98 }, stanceSrc: 'registration', mask: solid(), prone: false, ...over });
/** A painting with no registration: the stance and the centroid are read from its silhouette. */
const unreg = (over: Partial<Anchors> = {}): Anchors => ({ head: null, mass: 0.3, centroid: { u: 0.5, t: 0.55 }, stance: { u: 0.5, t: 0.98 }, stanceSrc: 'silhouette', mask: solid(), prone: false, ...over });
const art = (subject: string, pose: string): Partial<Anchors> => ({ subject, pose, url: `/art/characters/${subject}/${pose}.webp` });

/** The probe's meta for a recording of one or more figures. */
function metaOf(o: { figs: ProbeMeta['figs']; poses: ProbeMeta['poses']; swaps: ProbeMeta['swaps']; frames: number; battleSeconds?: number }): ProbeMeta {
  return {
    version: 1, figs: o.figs, poses: o.poses, swaps: o.swaps, logEvents: [], view: [0, 0, 1600, 900], errors: [],
    stats: { frames: o.frames, battleFrames: o.frames, battleSeconds: o.battleSeconds ?? 120, maxDtMs: 20, slowFrames: 0, fps: 59, copyMsMean: 0.03 }, strips: [],
  };
}

/**
 * One figure that changes painting by HARD CUTS: `segs[i]` shows pose key `key` in quad `q` for `frames` frames. The planes alternate (slot i % 2); at each cut the
 * incoming plane is at 1 and the outgoing one at 0, both recorded (the probe keeps the outgoing plane for 14 frames after a flip).
 */
function cutRun(segs: { key: number; q: number[]; frames: number }[], figId = 'hero', kind = 'party'): { records: ProbeFrame[]; swaps: ProbeMeta['swaps']; total: number; figs: ProbeMeta['figs'] } {
  const records: ProbeFrame[] = [];
  const swaps: ProbeMeta['swaps'] = [];
  let n = 0;
  segs.forEach((seg, i) => {
    const slot = i % 2, prev = i > 0 ? segs[i - 1]! : null;
    if (prev) swaps.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, i: 0, from: prev.key, to: seg.key, a: 1 });
    for (let k = 0; k < seg.frames; k++, n++) {
      const s: (number[] | 0)[] = [0, 0];
      s[slot] = plane(seg.key, 1, seg.q);
      if (prev) s[1 - slot] = plane(prev.key, 0, prev.q);
      records.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, f: [{ i: 0, a: 1, act: slot, s, g: [0, 0] }] });
    }
  });
  return { records, swaps, total: n, figs: [{ id: figId, side: kind === 'enemy' ? 'enemy' : 'party', kind, artId: figId }] };
}

// ================================================================== (a) the centroid

describe('r40 instrument edit (a): a figure with no registration is followed by its centroid', () => {
  const q = rect(100, 100, 300, 600);

  it('follows the silhouette\'s centroid, weighted by how visible each plane is, and leaves feet and head null', () => {
    const anchors = [unreg({ centroid: { u: 0.5, t: 0.5 } }), unreg({ centroid: { u: 0.25, t: 0.5 } })];
    const tr = figureTrack(figure(plane(0, 0.75, q), plane(1, 0.25, q)), anchors, true)!;
    // plane 0's centroid is (250, 400); plane 1's is (175, 400): 0.75 / 0.25
    expect(tr.centroid![0]).toBeCloseTo(231.25, 6);
    expect(tr.centroid![1]).toBeCloseTo(400, 6);
    expect(tr.feet).toBeNull();
    expect(tr.head).toBeNull();
  });

  it('keeps following the feet and the head, and gives no centroid, when the figure is registered (the default call)', () => {
    const tr = figureTrack(figure(plane(0, 1, q), 0), [reg()])!;
    expect(tr.feet![1]).toBeCloseTo(100 + 0.98 * 600, 6);
    expect(tr.head).not.toBeNull();
    expect(tr.centroid).toBeNull();
  });

  it('is null when no painting that shows has a centroid, and for a figure that is not showing', () => {
    expect(figureTrack(figure(plane(0, 1, q), 0), [unreg({ centroid: null })], true)).toBeNull();
    expect(figureTrack(figure(0, 0), [unreg()], true)).toBeNull();
    expect(figureTrack(figure(plane(0, 1, q), 0), [null], true)).toBeNull();
  });

  it('reports a centroid jerk through detectJerks, as its own part', () => {
    const track = Array.from({ length: 24 }, (_, i) => ({ n: i, t: i * FRAME_MS, feet: null, head: null, centroid: [500 + (i < 12 ? 0 : 90), 400] as [number, number], cam: [0, 0] as [number, number] }));
    const j = detectJerks(track, 1, CFG);
    expect(j).toHaveLength(1);
    expect(j[0]!.part).toBe('centroid');
    expect(j[0]!.px).toBeCloseTo(90, 0);
  });

  describe('end to end (analyzeRun) on a foe whose lowest thick part jumps between its poses', () => {
    // Two paintings of one serpent drawn in the same place with the same body: in the first the lowest thick part is the tail on the ground (stance at 0.98 of the
    // painting), in the second a fin hangs there instead (0.30). The figure did not move; a stance read from the silhouette says it moved 408 px.
    const poses = [
      { fig: 0, pose: 'idle', url: '/art/foes/serpent/idle.png', w: 800, h: 1000 },
      { fig: 0, pose: 'cast', url: '/art/foes/serpent/cast.png', w: 800, h: 1000 },
    ];
    const run = (secondCentroid = { u: 0.5, t: 0.55 }) => {
      const c = cutRun([{ key: 0, q, frames: 40 }, { key: 1, q, frames: 40 }, { key: 0, q, frames: 40 }], 'serpent', 'enemy');
      const meta = metaOf({ figs: c.figs, poses, swaps: c.swaps, frames: c.total });
      const anchors = [unreg({ stance: { u: 0.5, t: 0.98 } }), unreg({ stance: { u: 0.5, t: 0.30 }, centroid: secondCentroid })];
      return { meta, records: c.records, anchors };
    };

    it('reads no jump where the figure did not move, and says it followed the centroid', () => {
      const { meta, records, anchors } = run();
      const r = analyzeRun({ meta, records, anchors, cfg: CFG });
      expect(r.coverage['trackedByCentroid']).toEqual(['serpent']);
      expect(r.coverage['tracking']).toBe('centroid');
      expect(r.jerks).toEqual([]);
      const t = r.access.trackAt(0, 10)!;
      expect(t.feet).toBeNull();
      expect(t.centroid![0]).toBeCloseTo(250, 6); // 100 + 0.5 * 300
      expect(t.centroid![1]).toBeCloseTo(430, 6); // 100 + 0.55 * 600
      const p = r.access.planeAt(0, 10, 0)!;
      expect(p.feet).toBeNull();
      expect(p.centroid![1]).toBeCloseTo(430, 6);
    });

    it('reads a real jump of the visible mass as a jerk of the centroid, whatever the feet say', () => {
      const { meta, records, anchors } = run({ u: 0.5, t: 0.40 }); // the second painting's mass sits 90 px higher
      const r = analyzeRun({ meta, records, anchors, cfg: CFG });
      const atCut = r.jerks.filter((j) => j.atSwap);
      expect(atCut.length).toBeGreaterThan(0);
      expect(atCut.every((j) => j.part === 'centroid')).toBe(true);
      expect(atCut[0]!.px).toBeCloseTo(90, 0);
    });

    it('gives the earlier reading back with tracking.unregistered = "feet": the same cut is a 408 px jerk of the "feet"', () => {
      const { meta, records, anchors } = run();
      const r = analyzeRun({ meta, records, anchors, cfg: { ...CFG, tracking: { unregistered: 'feet' } } });
      expect(r.coverage['trackedByCentroid']).toEqual([]);
      const top = r.jerks[0]!;
      expect(top.part).toBe('feet');
      expect(top.px).toBeCloseTo(408, 0);
      expect(r.summary.motion.worstJerkPx).toBeCloseTo(408, 0);
    });

    it('keeps a figure with a registered pose on its feet: only a figure with none is followed by its centroid', () => {
      const { meta, records } = run();
      const mixed = [reg({ stance: { u: 0.5, t: 0.98 } }), unreg({ stance: { u: 0.5, t: 0.30 } })]; // one registered painting is a registered figure
      const r = analyzeRun({ meta, records, anchors: mixed, cfg: CFG });
      expect(r.coverage['trackedByCentroid']).toEqual([]);
      expect(r.access.trackAt(0, 10)!.feet).not.toBeNull();
      expect(r.jerks[0]!.part).toBe('feet');
    });
  });
});

// ================================================================== (b) the twirl is one staged change

describe('r40 instrument edit (b): a swap between a figure\'s twirl-* keys is one staged costume change', () => {
  const qa = rect(100, 100, 300, 600);
  const FADES_CUT: [number, number][] = [[1, 0], [1, 0], [0, 1], [0, 1], [0, 1]];

  describe('which swaps are steps of the twirl', () => {
    it('knows a twirl key by its file or its pose name, and nothing else', () => {
      expect(isTwirlKey('twirl-start')).toBe(true);
      expect(isTwirlKey('twirl-mid')).toBe(true);
      expect(isTwirlKey('idle')).toBe(false);
      expect(isTwirlKey('twirling')).toBe(false);
      expect(isTwirlKey(undefined)).toBe(false);
      expect(twirlKeyOf({ pose: 'twirl-going' } as Anchors)).toBe('twirl-going');
      expect(twirlKeyOf({ pose: null, url: '/art/characters/rikku-thief/twirl-forming@2x.webp' } as unknown as Anchors)).toBe('twirl-forming');
      expect(twirlKeyOf({ pose: 'idle', url: '/art/characters/rikku-thief/idle.webp' } as Anchors)).toBeNull();
      expect(twirlKeyOf(null, 'twirl-end')).toBe('twirl-end');
      expect(twirlKeyOf(null, 'idle')).toBeNull();
    });

    it('calls a swap between two keys, into the first and out of the last a step, and says which; any other swap is not one', () => {
      const idle = art('rikku-thief', 'idle') as Anchors, start = art('rikku-thief', 'twirl-start') as Anchors, going = art('rikku-thief', 'twirl-going') as Anchors;
      expect(stagedStepOf(start, going)).toMatchObject({ kind: 'twirl', edge: 'between-keys', from: 'twirl-start', to: 'twirl-going' });
      expect(stagedStepOf(idle, start)).toMatchObject({ kind: 'twirl', edge: 'enters', from: null, to: 'twirl-start' });
      expect(stagedStepOf(going, idle)).toMatchObject({ kind: 'twirl', edge: 'leaves', from: 'twirl-going', to: null });
      expect(stagedStepOf(idle, art('rikku-thief', 'attack') as Anchors)).toBeNull();
      expect(stagedStepOf(null, null)).toBeNull();
      // the plane's own pose name stands in when a painting says nothing about its file
      expect(stagedStepOf(null, null, CFG, { from: 'twirl-mid', to: 'twirl-forming' })).toMatchObject({ edge: 'between-keys' });
    });

    it('can be switched off in the policy for an old-versus-new run', () => {
      const start = art('rikku-thief', 'twirl-start') as Anchors, going = art('rikku-thief', 'twirl-going') as Anchors;
      expect(stagedStepOf(start, going, { ...CFG, staged: { twirl: false } })).toBeNull();
    });
  });

  describe('what a step does to the swap', () => {
    // a hard cut to a painting whose head is 20 percent bigger and whose feet stand 30 px away: between two poses that is a snap and a size and feet fail
    const feetA = [250, 100 + 0.98 * 600];
    const big = (k: number, dx: number): number[] => rect(feetA[0]! - 150 * k + dx, feetA[1]! - 0.98 * 600 * k, 300 * k, 600 * k);
    const cutBig = (anchors: (Anchors | null)[], cfg: ContinuityConfig = CFG) =>
      analyzeSwap({ frames: FADES_CUT.map(([fa, fb], j) => frame(100 + j, figure(plane(0, fa, qa), plane(1, fb, big(1.2, 30))))), at: 2, swap: { from: 0, to: 1 }, anchors, k1600: 1, camCut: false, cfg });

    it('is a costume swap: never a snap, never judged for size or feet, and the excused cut is kept as snapStaged', () => {
      const poseSwap = cutBig([reg({ ...art('rikku-thief', 'idle'), mask: solid() }), reg({ ...art('rikku-thief', 'ready'), mask: leftHalf() })]);
      expect(poseSwap.costume).toBe(false);
      expect(poseSwap.failHead).toBe(true);
      expect(poseSwap.failFeet).toBe(true);
      expect(poseSwap.snap).toBe(true); // the control: the same cut between two poses is a snap
      expect(poseSwap.staged).toBeNull();
      expect(poseSwap.snapStaged).toBe(false);
      const step = cutBig([reg({ ...art('rikku-thief', 'twirl-start'), mask: solid() }), reg({ ...art('rikku-thief', 'twirl-going'), mask: leftHalf() })]);
      expect(step.staged).toMatchObject({ kind: 'twirl', edge: 'between-keys' });
      expect(step.costume).toBe(true);
      expect(step.hardCut).toBe(true); // it is a cut, and it says so
      expect(step.snap).toBe(false);
      expect(step.snapStaged).toBe(true);
      expect(step.failHead).toBe(false);
      expect(step.failFeet).toBe(false);
      // and the old reading comes back with the switch
      const old = cutBig([reg({ ...art('rikku-thief', 'twirl-start'), mask: solid() }), reg({ ...art('rikku-thief', 'twirl-going'), mask: leftHalf() })], { ...CFG, staged: { twirl: false } });
      expect(old.staged).toBeNull();
      expect(old.snap).toBe(true);
    });

    it('is not ranked among the worst swaps, and never first in the strips', () => {
      const row = (over: Partial<SwapRow>): SwapRow => ({ id: 0, figure: 'rikku', fromPose: 'idle', toPose: 'idle', counted: true, camCut: false, notShowing: false, hardCut: true, snap: false, ghost: { frames: 0, ms: 0, peak: 0, severity: 0, worstFrame: null }, outline: { iou: 0.1, centroidShiftPx: 90, areaRatio: 1 }, ...over });
      const step = row({ id: 1, costume: true, staged: { kind: 'twirl', edge: 'between-keys', from: 'twirl-start', to: 'twirl-going', seq: 0, step: 1, of: 5 }, snapStaged: true });
      const mild = row({ id: 2, fromPose: 'idle', toPose: 'ready', outline: { iou: 0.8, centroidShiftPx: 4, areaRatio: 1 }, hardCut: false });
      expect(swapBadness(step, CFG)).toBe(0);
      expect(swapBadness(mild, CFG)).toBeGreaterThan(0);
      expect(worstSwaps([step, mild], 1, CFG).map((s) => s.id)).toEqual([2]);
    });
  });

  describe('which steps are one change', () => {
    interface Step { fi: number; n: number; from: number; to: number; staged: StagedStep | null }
    const step = (fi: number, n: number, from: number, to: number): Step => ({ fi, n, from, to, staged: { kind: 'twirl', edge: 'between-keys', from: null, to: null } });

    it('numbers the steps of a chain from one key to the next as one change', () => {
      const swaps = [step(0, 100, 0, 1), step(0, 108, 1, 2), step(0, 116, 2, 3), step(0, 128, 3, 4), step(0, 136, 4, 5)];
      const changes = groupStaged(swaps);
      expect(changes).toHaveLength(1);
      expect(swaps.map((s) => s.staged!.seq)).toEqual([0, 0, 0, 0, 0]);
      expect(swaps.map((s) => s.staged!.step)).toEqual([1, 2, 3, 4, 5]);
      expect(swaps.every((s) => s.staged!.of === 5)).toBe(true);
    });

    it('starts a new change when a step does not continue from the last key, or comes after the gap, and keeps two figures apart', () => {
      const swaps = [
        step(0, 100, 0, 1), step(1, 102, 10, 11), step(0, 108, 1, 2), step(1, 110, 11, 12),
        step(0, 400, 5, 6), // the same figure much later, from another key: a second change
        step(0, 410, 6, 7),
        step(0, 400 + STAGED_GAP_FRAMES + 50, 7, 8), // continues from the key but after the gap: a third
      ];
      groupStaged(swaps);
      expect(swaps.map((s) => s.staged!.seq)).toEqual([0, 1, 0, 1, 2, 2, 3]);
      expect(swaps.map((s) => s.staged!.of)).toEqual([2, 2, 2, 2, 2, 2, 1]);
      // a swap that is not a step is left alone
      const mixed: Step[] = [step(0, 100, 0, 1), { fi: 0, n: 104, from: 1, to: 9, staged: null }, step(0, 108, 1, 2)];
      groupStaged(mixed);
      expect(mixed[1]!.staged).toBeNull();
      expect(mixed[0]!.staged!.seq).toBe(mixed[2]!.staged!.seq);
    });

    it('counts changes, not steps, in the summary, and the cuts it excused', () => {
      const base = { counted: true, camCut: false, notShowing: false, ghost: { frames: 0, ms: 0, peak: 0, severity: 0, worstFrame: null } };
      const st = (seq: number, step: number): Partial<SwapRow> => ({ ...base, figure: 'rikku', costume: true, hardCut: true, snap: false, snapStaged: true, staged: { kind: 'twirl', edge: 'between-keys', from: null, to: null, seq, step, of: 3 } });
      const swaps = [st(0, 1), st(0, 2), st(0, 3), st(1, 1), st(1, 2), { ...base, figure: 'tidus', snap: true, hardCut: true }] as unknown as SwapRow[];
      const s = summarize({ swaps, jerks: [{ n: 5, t: 1, px: 200, localPx: 2, ratio: 100, part: 'feet', dx: 200, dy: 0, atSwap: true, staged: { kind: 'twirl', seq: 0 } }, { n: 90, t: 2, px: 60, localPx: 2, ratio: 30, part: 'feet', dx: 60, dy: 0 }], battleSeconds: 120, cfg: CFG });
      expect(s.motion.stagedChanges).toBe(2);
      expect(s.motion.stagedSteps).toBe(5);
      expect(s.motion.stagedSnapsExcused).toBe(5);
      expect(s.motion.snaps).toBe(1); // only the ordinary snap counts
      expect(s.motion.jerksAtStaged).toBe(1);
      expect(s.motion.jerks).toBe(2); // the jerk at a step stays a jerk, and in the verdict
      expect(s.motion.jerksOverFail).toBe(2);
      expect(s.size.costumeSwaps).toBe(5);
    });
  });

  describe('end to end (analyzeRun) on one spherechange: idle, five keys, the new idle', () => {
    const KEYS = ['idle', 'twirl-start', 'twirl-going', 'twirl-mid', 'twirl-forming', 'twirl-end', 'idle'];
    const poses = KEYS.map((pose, i) => ({ fig: 0, pose: 'idle', url: `/art/characters/rikku-${i === 6 ? 'gunner' : 'thief'}/${pose}.png`, w: 800, h: 1000 }));
    const masks = [solid(), leftHalf(), rightHalf(), solid(), leftHalf(), rightHalf(), solid()];
    const anchors = KEYS.map((pose, i) => reg({ ...art(i === 6 ? 'rikku-gunner' : 'rikku-thief', pose), mask: masks[i]! }));
    // the going key is painted 120 px to the right of the others, so the figure steps there and back
    const quad = (i: number): number[] => rect(i === 2 ? 420 : 300, 100, 300, 600);
    const segs = KEYS.map((_, i) => ({ key: i, q: quad(i), frames: i === 0 || i === 6 ? 40 : 10 }));
    const c = cutRun(segs, 'rikku');
    const meta = metaOf({ figs: c.figs, poses, swaps: c.swaps, frames: c.total });

    it('reads the six cuts as one staged change, no snap among them', () => {
      const r = analyzeRun({ meta, records: c.records, anchors, cfg: CFG });
      expect(r.swaps).toHaveLength(6);
      expect(r.swaps.every((s) => s.staged)).toBe(true);
      expect(r.swaps.map((s) => s.staged!.edge)).toEqual(['enters', 'between-keys', 'between-keys', 'between-keys', 'between-keys', 'leaves']);
      expect(r.swaps.map((s) => s.staged!.seq)).toEqual([0, 0, 0, 0, 0, 0]);
      expect(r.swaps.map((s) => s.staged!.step)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(r.swaps.every((s) => s.costume && !s.snap && s.hardCut)).toBe(true);
      expect(r.summary.motion.snaps).toBe(0);
      expect(r.summary.motion.stagedChanges).toBe(1);
      expect(r.summary.motion.stagedSteps).toBe(6);
      expect(r.summary.motion.stagedSnapsExcused).toBeGreaterThanOrEqual(4);
    });

    it('still counts the jerks at its steps, and tags them: the step out to the right and back is 120 px each way', () => {
      const r = analyzeRun({ meta, records: c.records, anchors, cfg: CFG });
      const tagged = r.jerks.filter((j) => j.staged);
      expect(tagged.length).toBeGreaterThanOrEqual(2);
      expect(tagged.every((j) => j.atSwap && j.px > 100)).toBe(true);
      expect(r.summary.motion.jerksAtStaged).toBe(tagged.length);
      expect(r.summary.motion.jerksOverFail).toBe(r.jerks.length); // none excused
    });

    it('reads the same recording as snaps again with staged.twirl switched off', () => {
      const r = analyzeRun({ meta, records: c.records, anchors, cfg: { ...CFG, staged: { twirl: false } } });
      expect(r.swaps.every((s) => !s.staged)).toBe(true);
      expect(r.summary.motion.snaps).toBeGreaterThanOrEqual(4);
      expect(r.summary.motion.stagedChanges).toBe(0);
      expect(r.jerks.some((j) => j.staged)).toBe(false);
    });
  });
});

// ================================================================== (c) 14 frames of evidence, and the freeze counted

describe('r40 instrument edit (c): a freeze in the middle of a blend is counted', () => {
  const qa = rect(100, 100, 300, 600);
  /** A crossfade of one figure from plane 0 to plane 1: the fades of the planes, frame by frame. */
  const crossfade = (fades: [number, number][], first = 100): FrameOfFig[] => fades.map(([fa, fb], j) => frame(first + j, figure(plane(0, fa, qa), plane(1, fb, qa))));
  const held = (fades: [number, number][]) => heldPlateau(crossfade(fades), { from: 0, to: 1 }, 0.02, FRAME_MS);

  it('finds the plateau of a blend the hit-stop froze: eight frames at one pair of fades', () => {
    // round 23's FFX attack-to-follow: the blend started, froze for 8 frames, then finished
    const r = held([[1, 0], [0.9, 0.1], [0.7, 0.3], ...Array.from({ length: 8 }, () => [0.5, 0.5] as [number, number]), [0.3, 0.7], [0.1, 0.9], [0, 1]]);
    expect(r.frames).toBe(8);
    expect(r.from).toBe(103);
    expect(r.ms).toBeGreaterThan(125);
    expect(r.ms).toBeLessThan(140); // eight frames at 60 fps
  });

  it('finds none in a smooth blend, in a cut, or where one plane is already gone', () => {
    expect(held([[1, 0], [0.9, 0.1], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.1, 0.9], [0, 1]]).frames).toBe(0);
    expect(held([[1, 0], [1, 0], [0, 1], [0, 1], [0, 1], [0, 1]]).frames).toBe(0); // a cut holds one painting, not two
    expect(held([[1, 0], [0.5, 0.5], [0.01, 0.99], [0.01, 0.99], [0.01, 0.99]]).frames).toBe(0); // the old plane is under the blend threshold
  });

  it('reports the longest of several plateaus, and does not bridge a gap in the frames', () => {
    const a = crossfade([[0.8, 0.2], [0.8, 0.2], [0.8, 0.2], [0.5, 0.5], [0.4, 0.6], [0.4, 0.6], [0.4, 0.6], [0.4, 0.6], [0.4, 0.6], [0.2, 0.8]]);
    expect(heldPlateau(a, { from: 0, to: 1 }, 0.02, FRAME_MS).frames).toBe(5);
    const gap = [...crossfade([[0.5, 0.5], [0.5, 0.5]]), ...crossfade([[0.5, 0.5], [0.5, 0.5]], 120)];
    expect(heldPlateau(gap, { from: 0, to: 1 }, 0.02, FRAME_MS).frames).toBe(2);
  });

  it('is carried by every analysed swap, and the summary counts the freezes of the minimum length or more', () => {
    const fr = crossfade([[1, 0], [0.9, 0.1], ...Array.from({ length: 6 }, () => [0.6, 0.4] as [number, number]), [0.3, 0.7], [0, 1], [0, 1]]);
    const r = analyzeSwap({ frames: fr, at: 4, swap: { from: 0, to: 1 }, anchors: [reg(), reg()], k1600: 1, camCut: false, cfg: CFG });
    expect(r.held).toMatchObject({ frames: 6, from: 102 });
    expect(HELD_MIN_FRAMES).toBe(3);
    const none = analyzeSwap({ frames: crossfade([[1, 0], [0.5, 0.5], [0, 1], [0, 1]]), at: 2, swap: { from: 0, to: 1 }, anchors: [reg(), reg()], k1600: 1, camCut: false, cfg: CFG });
    expect(none.held.frames).toBe(0);
    const row = (held: SwapRow['held']): SwapRow => ({ counted: true, camCut: false, notShowing: false, ghost: { frames: 0, ms: 0, peak: 0, severity: 0, worstFrame: null }, held });
    const s = summarize({ swaps: [row(r.held), row({ frames: 2, ms: 33, from: 1 }), row(none.held), row({ frames: 9, ms: 150, from: 5 })], jerks: [], battleSeconds: 120, cfg: CFG });
    expect(s.motion.heldSwaps).toBe(2);
    expect(s.motion.longestHeldFrames).toBe(9);
  });

  it('is summed over chapters, and an older chapter summary without it counts as none', () => {
    const chapter = (motion: Record<string, number>): ChapterResult => ({ chapter: 'x', summary: { battleSeconds: 100, counted: 20, swaps: 20, size: { headMeasured: 0, headRegistration: 0, headSilhouette: 0, headUnmeasured: 0, maxHeadJumpPct: 0, maxHeadJumpPctRegistration: 0, headOverTolerance: 0, maxFeetShiftPx: 0, feetOverTolerance: 0 }, motion: { snaps: 0, hardCuts: 0, ghostSwaps: 0, ghostFrames: 0, worstGhostSeverity: 0, ghostOverFail: 0, jerks: 0, worstJerkPx: 0, jerksOverFail: 0, lowestIou: 1, maxCentroidShiftPx: 0, ...motion } }, checks: {} });
    const agg = aggregate([chapter({ heldSwaps: 3, longestHeldFrames: 8, stagedChanges: 2, stagedSteps: 11, stagedSnapsExcused: 9, jerksAtStaged: 4 }), chapter({ heldSwaps: 1, longestHeldFrames: 5 }), chapter({})], CFG);
    expect(agg.motion['heldSwaps']).toBe(4);
    expect(agg.motion['longestHeldFrames']).toBe(8);
    expect(agg.motion['stagedChanges']).toBe(2);
    expect(agg.motion['stagedSteps']).toBe(11);
    expect(agg.motion['stagedSnapsExcused']).toBe(9);
    expect(agg.motion['jerksAtStaged']).toBe(4);
  });
});

describe('r40 instrument edit (c): the strips show 14 frames before an event, in two rows', () => {
  const geometry = { view: [0, 0, 1600, 900], ring: [960, 540], crop: [0, 0, 960, 540], cell: [40, 60] };
  /** A grey 40 x 60 cell, as a data URL, the way the page hands them over. */
  const cellUrl = async (): Promise<string> => `data:image/jpeg;base64,${(await sharp({ create: { width: 40, height: 60, channels: 3, background: '#303030' } }).jpeg().toBuffer()).toString('base64')}`;
  const compose = async (n: number, extra: Partial<Parameters<typeof composeStrip>[0]> = {}): Promise<Buffer> => {
    const url = await cellUrl();
    return composeStrip({ strip: geometry, frames: Array.from({ length: n }, () => url), marks: Array.from({ length: n }, () => null), guide: { headY: null, feetY: null }, title: 'x', captions: Array.from({ length: n }, (_, i) => String(i)), eventCell: 14, ...extra });
  };

  it('lays a 20-cell strip (14 before, the event, 5 after) out in two rows, and keeps a 12-cell one as the one row it was', async () => {
    expect(MAX_ONE_ROW).toBe(12);
    const size = async (n: number, extra: Partial<Parameters<typeof composeStrip>[0]> = {}): Promise<number[]> => { const m = await sharp(await compose(n, extra)).metadata(); return [m.width!, m.height!]; };
    expect(await size(12, { eventCell: 6 })).toEqual([12 * 40 + 11 * 2, 24 + 60 + 16]); // exactly the old layout
    expect(await size(20)).toEqual([10 * 40 + 9 * 2, 24 + 2 * (60 + 16)]);
    expect(await size(13, { eventCell: 6 })).toEqual([7 * 40 + 6 * 2, 24 + 2 * (60 + 16)]); // seven, then six
  });

  it('draws the centroid of a figure with no registration in magenta: a guide line across every cell and a cross at the cell it belongs to, on the second row too', async () => {
    const n = 20, marks = Array.from({ length: n }, () => null) as Parameters<typeof composeStrip>[0]['marks'];
    // (400, 300) CSS px is (0.25, 0.333) of the crop: (10, 20) inside a 40 x 60 cell. The guide is the row of pixels 20 (y 20.5 inside the cell).
    marks[15] = { feet: null, head: null, centroid: [400, 300] };
    const buf = await compose(n, { marks, guide: { headY: null, feetY: null, centroidY: 307.5 }, quality: 95 });
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    const redness = (x: number, y: number): number => { const i = (y * info.width + x) * info.channels; return data[i]! - data[i + 1]!; }; // red over green: magenta is far above 0, grey is 0
    const cell = (i: number): [number, number] => [(i % 10) * 42, 24 + Math.floor(i / 10) * 76];
    const [x15, y15] = cell(15), [x16, y16] = cell(16), [x3, y3] = cell(3);
    expect(redness(x15 + 10, y15 + 17)).toBeGreaterThan(35); // the cross's upright, above the guide line
    expect(redness(x16 + 10, y16 + 17)).toBeLessThan(15); // the next cell has no cross
    expect(redness(x16 + 30, y16 + 20)).toBeGreaterThan(35); // but the guide line crosses it, on the second row...
    expect(redness(x3 + 30, y3 + 20)).toBeGreaterThan(35); // ...and the first
    expect(redness(x3 + 30, y3 + 40)).toBeLessThan(15); // and nothing else in the cell is magenta
  });
});
