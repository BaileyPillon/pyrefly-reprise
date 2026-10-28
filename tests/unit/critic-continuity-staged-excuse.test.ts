/**
 * **A jerk at a step of the spherechange's twirl is the twirl** (CHK-027; `continuity.staged.jerkExcusePx`; pc-residues lane, method check 2026-10-26 step 2: Rikku's twirl-mid to twirl-end read 44.7 px
 * as a gated swap jerk; FFX-2 only in effect, only the spherechange paints `twirl-*` keys). Moved out of `critic-continuity-instrument.test.ts` (house rule 7: no source file over 400 lines grows).
 * One figure, idle, five twirl keys, the new idle, cut by hard cuts; the going key is painted 120 px to the right so the figure steps there and back. Nothing here opens a browser.
 */
import { describe, expect, it } from 'vitest';
import { analyzeRun } from '../../critic/runner/lib/continuity-analyze.mjs';
import { continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import type { Anchors, ContinuityConfig, Mask } from '../../critic/runner/lib/continuity-pure.mjs';
import type { ProbeFrame, ProbeMeta } from '../../critic/runner/lib/continuity-probe.mjs';

const CFG: ContinuityConfig = continuityConfig();
const FRAME_MS = 1000 / 60;
const rect = (x: number, y: number, w: number, h: number): number[] => [x, y, x + w, y, x + w, y + h, x, y + h];
const solid = (w = 16, h = 16): Mask => ({ w, h, bits: new Uint8Array(w * h).fill(1) });
const leftHalf = (w = 16, h = 16): Mask => { const bits = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) bits[y * w + x] = 1; return { w, h, bits }; };
const rightHalf = (w = 16, h = 16): Mask => { const bits = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = w / 2; x < w; x++) bits[y * w + x] = 1; return { w, h, bits }; };
const plane = (k: number, fade: number, q: number[]): number[] => [k, fade, 1, ...q];
const HEAD = { u0: 0.4, t0: 0.05, u1: 0.6, t1: 0.15 };
const reg = (over: Partial<Anchors> = {}): Anchors => ({ head: HEAD, mass: 0.3, centroid: { u: 0.5, t: 0.5 }, stance: { u: 0.5, t: 0.98 }, stanceSrc: 'registration', mask: solid(), prone: false, ...over });
const art = (subject: string, pose: string): Partial<Anchors> => ({ subject, pose, url: `/art/characters/${subject}/${pose}.webp` });

/** One figure that changes painting by HARD CUTS: `segs[i]` shows pose key `key` in quad `q` for `frames` frames (planes alternate; the outgoing plane is kept at fade 0 for the next frames, as the probe does). */
function cutRun(segs: { key: number; q: number[]; frames: number }[], figId: string): { records: ProbeFrame[]; swaps: ProbeMeta['swaps']; total: number; figs: ProbeMeta['figs'] } {
  const records: ProbeFrame[] = [];
  const swaps: ProbeMeta['swaps'] = [];
  let n = 0;
  segs.forEach((seg, i) => {
    const slot = i % 2, prev = i > 0 ? segs[i - 1]! : null;
    if (prev) swaps.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, i: 0, from: prev.key, to: seg.key, a: 1 });
    for (let k = 0; k < seg.frames; k++, n++) {
      const sl: (number[] | 0)[] = [0, 0];
      sl[slot] = plane(seg.key, 1, seg.q);
      if (prev) sl[1 - slot] = plane(prev.key, 0, prev.q);
      records.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, f: [{ i: 0, a: 1, act: slot, s: sl, g: [0, 0] }] });
    }
  });
  return { records, swaps, total: n, figs: [{ id: figId, side: 'party', kind: 'party', artId: figId }] };
}

describe('the spherechange: idle, five keys, the new idle', () => {
  const KEYS = ['idle', 'twirl-start', 'twirl-going', 'twirl-mid', 'twirl-forming', 'twirl-end', 'idle'];
  const poses = KEYS.map((pose, i) => ({ fig: 0, pose: 'idle', url: `/art/characters/rikku-${i === 6 ? 'gunner' : 'thief'}/${pose}.png`, w: 800, h: 1000 }));
  const masks = [solid(), leftHalf(), rightHalf(), solid(), leftHalf(), rightHalf(), solid()];
  const anchors = KEYS.map((pose, i) => reg({ ...art(i === 6 ? 'rikku-gunner' : 'rikku-thief', pose), mask: masks[i]! }));
  const quad = (i: number): number[] => rect(i === 2 ? 420 : 300, 100, 300, 600);
  const c = cutRun(KEYS.map((_, i) => ({ key: i, q: quad(i), frames: i === 0 || i === 6 ? 40 : 10 })), 'rikku');
  const meta: ProbeMeta = {
    version: 1, figs: c.figs, poses, swaps: c.swaps, logEvents: [], view: [0, 0, 1600, 900], errors: [], strips: [],
    stats: { frames: c.total, battleFrames: c.total, battleSeconds: 120, maxDtMs: 20, slowFrames: 0, fps: 59, copyMsMean: 0.03 },
  };

  it('pc-residues: with staged.jerkExcusePx the twirl cuts\' own jerks up to that size are reported, not gated; a bigger one stays a swap jerk (Rikku\'s step 4 of 5 read 44.7 px)', () => {
    const wide = analyzeRun({ meta, records: c.records, anchors, cfg: { ...CFG, staged: { twirl: true, jerkExcusePx: 150 } } });
    const tagged = wide.jerks.filter((j) => j.staged);
    expect(tagged.length).toBeGreaterThanOrEqual(2);
    expect(tagged.every((j) => (j as { stagedExcused?: boolean }).stagedExcused === true)).toBe(true);
    expect(wide.summary.motion['jerksStagedExcused']).toBe(tagged.length);
    expect(wide.summary.motion['worstStagedExcusedJerkPx']).toBeGreaterThan(100);
    expect(wide.summary.motion.jerksAtStaged).toBe(tagged.length); // still counted at the staged steps
    expect(wide.summary.motion.jerksOverFail).toBe(0); // and out of the verdict
    expect(wide.summary.motion['swapJerksOverFail']).toBe(0);
    const narrow = analyzeRun({ meta, records: c.records, anchors, cfg: { ...CFG, staged: { twirl: true, jerkExcusePx: 60 } } });
    expect(narrow.summary.motion['jerksStagedExcused']).toBe(0); // 120 px each way is over 60: the keys are placed too far apart, a defect
    expect(narrow.summary.motion.jerksOverFail).toBe(tagged.length);
  });
});
