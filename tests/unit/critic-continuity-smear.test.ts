/**
 * CHK-027 and the PLANNED SMEAR (conference demo, motion pass, lane "core", step 2; Bailey 2026-10-22: "Yes, only planned smears."). `critic/runner/lib/continuity-smear.mjs`:
 * a swap that matches a cut the engine logged as a smear on a big change (same figure, same pair of paintings or rig keys, the flip inside its window, one entry per swap) is not a snap, and a
 * jerk AT it of at most the policy's `maxJerkPx` is not counted; every other fast swap is judged as before. Also what the probe reads (`meta.smears`, in its own clock) and the policy block.
 *
 * Game case: both (shared critic plumbing).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { analyzeRun, anchorsForPoses } from '../../critic/runner/lib/continuity-analyze.mjs';
import { continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import { createProbe } from '../../critic/runner/lib/continuity-probe.mjs';
import { SMEAR_DEFAULTS, loggedAsBig, matchSmear, smearPolicy, smearedJerk, tagSmears, type LoggedSmear } from '../../critic/runner/lib/continuity-smear.mjs';
import type { PoseMeasure } from '../../critic/runner/lib/continuity-silhouette.mjs';
import type { ProbeFrame, ProbeMeta } from '../../critic/runner/lib/continuity-probe.mjs';

const ROOT = resolve(__dirname, '..', '..');
const CFG = continuityConfig();
const ON = smearPolicy({ smear: { excuse: true } });

const entry = (over: Partial<LoggedSmear> = {}): LoggedSmear => ({ actor: 'hero', from: 'idle', to: 'attack', style: 'paint', kind: 'plane', at: 1000, cutAt: 1015, cutMs: 30, overlap: 0.2, anchorDistance: 0.1, strength: 0.9, flash: true, ...over });
const swap = (over: Record<string, unknown> = {}) => ({ id: 0, figure: 'hero', fromPose: 'idle', toPose: 'attack', tMs: 1018, snap: true, ...over });

describe('the policy', () => {
  it('excuses nothing without a block, and nothing unless the block says true', () => {
    expect(smearPolicy(undefined).excuse).toBe(false);
    expect(smearPolicy({}).excuse).toBe(false);
    expect(smearPolicy({ smear: { slackMs: 20 } }).excuse).toBe(false);
    expect(smearPolicy({ smear: { excuse: true, slackMs: 20 } })).toMatchObject({ excuse: true, slackMs: 20, maxJerkPx: SMEAR_DEFAULTS.maxJerkPx });
  });
  it('critic/policy.json switches it on, quoting Bailey by date and his words', () => {
    const p = JSON.parse(readFileSync(resolve(ROOT, 'critic', 'policy.json'), 'utf8')) as { continuity: { smear: { excuse: boolean; note: string; maxJerkPx: number } } };
    expect(p.continuity.smear.excuse).toBe(true);
    expect(p.continuity.smear.note).toMatch(/Bailey 2026-10-22/);
    expect(p.continuity.smear.note).toMatch(/only planned smears/);
    expect(p.continuity.smear.maxJerkPx).toBeLessThanOrEqual(CFG.motion.cutPx);
    expect(smearPolicy(CFG).excuse).toBe(true);
  });
});

describe('matching a swap to a planned smear', () => {
  it('the same figure, the same pair, the flip inside the window', () => {
    expect(matchSmear(swap(), [entry()], ON)?.index).toBe(0);
    expect(matchSmear(swap({ tMs: 1000 }), [entry()], ON)).not.toBeNull(); // the swap frame can be the first
    expect(matchSmear(swap({ tMs: 1030 + 12 + 2 * (1000 / 60) }), [entry()], ON)).not.toBeNull(); // the last it may fall on
  });
  it('another figure, another pair, or outside the window is not it', () => {
    expect(matchSmear(swap({ figure: 'villain' }), [entry()], ON)).toBeNull();
    expect(matchSmear(swap({ fromPose: 'ready' }), [entry()], ON)).toBeNull();
    expect(matchSmear(swap({ toPose: 'follow' }), [entry()], ON)).toBeNull();
    expect(matchSmear(swap({ tMs: 1000 - 12 - 17 - 1 }), [entry()], ON)).toBeNull();
    expect(matchSmear(swap({ tMs: 1030 + 12 + 2 * (1000 / 60) + 1 }), [entry()], ON)).toBeNull();
    expect(matchSmear(swap({ tMs: undefined }), [entry()], ON)).toBeNull();
  });
  it('a rig key change is seen when the move BEGINS, so its window is the whole move, not the cut inside it', () => {
    const rig = entry({ kind: 'rig', actor: 'boss', from: 'idle', to: 'attack', at: 1000, cutMs: 34, moveMs: 140, overlap: null, anchorDistance: null });
    expect(matchSmear(swap({ figure: 'boss', tMs: 1008 }), [rig], ON)?.index).toBe(0); // the first frame of the move
    expect(matchSmear(swap({ figure: 'boss', tMs: 1000 + 140 }), [rig], ON)).not.toBeNull();
    expect(matchSmear(swap({ figure: 'boss', tMs: 1000 + 140 + 12 + 2 * (1000 / 60) + 1 }), [rig], ON)).toBeNull();
    expect(matchSmear(swap({ figure: 'boss', tMs: 1008, toPose: 'cast' }), [rig], ON)).toBeNull(); // another key
    // a painting set's entry has no such slack: its window is the cut's own
    expect(matchSmear(swap({ tMs: 1000 + 34 + 12 + 2 * (1000 / 60) + 1 }), [entry({ cutMs: 34 })], ON)).toBeNull();
  });
  it('only a BIG change the policy\'s own numbers call big', () => {
    expect(loggedAsBig(entry(), ON)).toBe(true);
    expect(loggedAsBig(entry({ overlap: 0.9, anchorDistance: 0.02 }), ON)).toBe(false);
    expect(loggedAsBig(entry({ overlap: 0.9, anchorDistance: 0.2 }), ON)).toBe(true);
    expect(loggedAsBig(entry({ overlap: null, anchorDistance: null }), ON)).toBe(false);
    expect(loggedAsBig(entry({ kind: 'rig', overlap: null, anchorDistance: null }), ON)).toBe(true);
    expect(loggedAsBig(entry({ overlap: null, anchorDistance: null, big: true }), ON)).toBe(true); // a knock-out's standing and lying bodies: no outline to read, the engine says it is big
    expect(loggedAsBig(entry({ overlap: 0.9, anchorDistance: 0.02, big: false }), ON)).toBe(false);
    expect(matchSmear(swap(), [entry({ overlap: 0.9, anchorDistance: 0.02 })], ON)).toBeNull();
  });
  it('one entry excuses one swap', () => {
    const swaps = [swap({ id: 0 }), swap({ id: 1, tMs: 1020 })];
    const t = tagSmears(swaps, [entry()], ON);
    expect(t).toEqual({ planned: 1, matched: 1, unmatched: 0, snapsExcused: 1 });
    expect(swaps[0]).toMatchObject({ snap: false, snapSmear: true });
    expect(swaps[1]).toMatchObject({ snap: true });
  });
  it('with the excuse off nothing is tagged', () => {
    const swaps = [swap()];
    expect(tagSmears(swaps, [entry()], smearPolicy({}))).toEqual({ planned: 1, matched: 0, unmatched: 1, snapsExcused: 0 });
    expect(swaps[0]!.snap).toBe(true);
  });
  it('a jerk at the cut is excused up to maxJerkPx and not past it', () => {
    const s = { ...swap(), smear: { style: 'paint', kind: 'plane' } };
    expect(smearedJerk({ px: 60 }, s, ON)).not.toBeNull();
    expect(smearedJerk({ px: ON.maxJerkPx }, s, ON)).not.toBeNull();
    expect(smearedJerk({ px: ON.maxJerkPx + 1 }, s, ON)).toBeNull();
    expect(smearedJerk({ px: 60 }, swap(), ON)).toBeNull(); // a swap with no smear
    expect(smearedJerk({ px: 60 }, s, smearPolicy({}))).toBeNull();
  });
});

// ---------------------------------------------------------------- end to end, on the synthetic recording of critic-continuity-analyze.test.ts

const W = 200, H = 300;
async function painting(): Promise<Buffer> {
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const head = (x - 100) ** 2 + (y - 55) ** 2 <= 28 ** 2;
    const body = x >= 72 && x <= 128 && y >= 85 && y <= 270;
    if (head || body) { const i = (y * W + x) * 4; px[i] = 200; px[i + 1] = 120; px[i + 2] = 90; px[i + 3] = 255; }
  }
  return sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}
const pose = { size: [W, H], head: [80, 20, 120, 60], stance: { x: 100, row: 270 }, prone: false, standing: true };
const MEASURE: PoseMeasure = { path: 'test', sha256: 'x', count: 1, subjects: { hero: { poses: { idle: pose, attack: pose } } } };
const QA = [300, 200, 500, 200, 500, 500, 300, 500];
const QB = [275, 132.5, 525, 132.5, 525, 507.5, 275, 507.5];
const FROM = [1, 0.85, 0.65, 0.45, 0.25, 0.1, 0, 0];
const TO = [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1, 1];
const slot = (k: number, fade: number, q: number[]): number[] => [k, fade, 1, ...q];
const FRAME_MS = 1000 / 60;
const tOf = (n: number): number => Math.round(n * FRAME_MS * 10) / 10;

function build(swaps: number, cutSwap: number): { meta: ProbeMeta; records: ProbeFrame[] } {
  const records: ProbeFrame[] = [];
  const meta: ProbeMeta = {
    version: 1, figs: [{ id: 'hero', side: 'party', kind: 'party', artId: 'hero' }],
    poses: [{ fig: 0, pose: 'idle', url: '/art/characters/hero/idle.png', w: W, h: H }, { fig: 0, pose: 'attack', url: '/art/characters/hero/attack.png', w: W, h: H }],
    swaps: [], logEvents: [], view: [0, 0, 1600, 900], errors: [],
    stats: { frames: 30 * (swaps + 2), battleFrames: 30 * (swaps + 2), battleSeconds: 120, maxDtMs: 20, slowFrames: 0, fps: 59, copyMsMean: 0.03 }, strips: [],
  };
  let current = 0;
  for (let n = 0; n < 30 * (swaps + 2); n++) {
    const s = Math.floor((n - 20) / 30);
    const start = 20 + s * 30;
    const k = n - start;
    let slots: (number[] | 0)[];
    if (s >= 0 && s < swaps && k >= 0 && k < FROM.length) {
      const from = s % 2, to = 1 - (s % 2);
      const q = (key: number): number[] => (key === 0 ? QA : QB);
      if (s === cutSwap) {
        const fa = k < 3 ? 1 : 0; // a hard cut: the fades jump in one frame
        slots = [slot(0, fa, QA), slot(1, 1 - fa, QB)];
      } else slots = [slot(from, FROM[k]!, q(from)), slot(to, TO[k]!, q(to))];
      if (k === 3) meta.swaps.push({ n, t: tOf(n), i: 0, from: s === cutSwap ? 0 : from, to: s === cutSwap ? 1 : to, a: 1 });
      if (k === FROM.length - 1) current = to;
    } else slots = [slot(current, 1, current === 0 ? QA : QB), 0];
    records.push({ n, t: tOf(n), f: [{ i: 0, a: 1, act: 0, s: slots, g: [0, 0] }] });
  }
  return { meta, records };
}
const fetchImage = async (): Promise<Buffer> => painting();

/** The swap `cutSwap` (an idle to attack, the 0th) starts at frame 20; its flip is the frame the harness logs as `swaps[].n`. */
const CUT_AT = 20 + 3;

describe('analysing a recording with a planned smear', () => {
  const planned = (over: Partial<LoggedSmear> = {}): LoggedSmear => ({ actor: 'hero', from: 'idle', to: 'attack', style: 'paint', kind: 'plane', at: tOf(CUT_AT) - 6, cutAt: tOf(CUT_AT) + 9, cutMs: 30, overlap: 0.14, anchorDistance: 0.2, strength: 0.9, flash: true, ...over });
  async function run(smears: LoggedSmear[] | undefined, cfg = CFG) {
    const { meta, records } = build(10, 0);
    if (smears) meta.smears = smears;
    const { anchors } = await anchorsForPoses({ poses: meta.poses, fetchImage, measure: MEASURE });
    return analyzeRun({ meta, records, anchors, cfg });
  }

  it('the control: a hard cut with no log is a snap, and the head jumps with it', async () => {
    const r = await run(undefined);
    const cut = r.swaps[0]!;
    expect(cut.hardCut).toBe(true);
    expect(cut.snap).toBe(true);
    expect(r.summary.motion.snaps).toBe(1);
    expect(r.summary.motion.smearSwaps).toBe(0);
    expect(r.smear).toMatchObject({ planned: 0, matched: 0 });
  });

  it('the same cut, logged as a planned smear on a big change, is not a snap; it stays a hard cut and keeps what it would have been', async () => {
    const r = await run([planned()]);
    const cut = r.swaps[0]!;
    expect(cut.hardCut).toBe(true);
    expect(cut.snap).toBe(false);
    expect(cut.snapSmear).toBe(true);
    expect((cut as unknown as { smear: { style: string } }).smear.style).toBe('paint');
    expect(r.summary.motion.snaps).toBe(0);
    expect(r.summary.motion.hardCuts).toBe(1);
    expect(r.summary.motion.smearsPlanned).toBe(1);
    expect(r.summary.motion.smearSwaps).toBe(1);
    expect(r.summary.motion.smearSnapsExcused).toBe(1);
    expect(r.smear).toMatchObject({ planned: 1, matched: 1, unmatched: 0, snapsExcused: 1 });
    expect(r.summary.checks['CHK-027'].note).toMatch(/cut\(s\) the engine planned as a smear/);
    expect(r.summary.checks['CHK-027'].result).toBe('PASS');
  });

  it('CHK-026 is not touched: the head is still 25 percent bigger', async () => {
    const r = await run([planned()]);
    expect(r.swaps[0]!.head!.ratio).toBeCloseTo(1.25, 2);
    expect(r.swaps[0]!.failHead).toBe(true);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
  });

  it('a log entry for another pair, another figure, another time, a small change, or the excuse switched off leaves the snap', async () => {
    for (const smears of [[planned({ to: 'follow' })], [planned({ actor: 'villain' })], [planned({ at: tOf(CUT_AT) + 400, cutAt: tOf(CUT_AT) + 415 })], [planned({ overlap: 0.9, anchorDistance: 0.01 })]]) {
      const r = await run(smears);
      expect(r.swaps[0]!.snap).toBe(true);
      expect(r.summary.motion.snaps).toBe(1);
    }
    const off = await run([planned()], { ...CFG, smear: { excuse: false } });
    expect(off.swaps[0]!.snap).toBe(true);
    expect(off.summary.motion.smearSnapsExcused).toBe(0);
  });

  it('a jerk at the cut is not counted up to maxJerkPx, and is a jerk past it', async () => {
    const plain = await run(undefined);
    const jerkAtCut = plain.jerks.find((j) => j.atSwap);
    if (!jerkAtCut) return; // the fixture's cut moves the head less than a jerk: nothing to excuse
    const px = jerkAtCut.px;
    const excused = await run([planned()], { ...CFG, smear: { excuse: true, maxJerkPx: Math.ceil(px) + 1 } });
    expect(excused.jerks.find((j) => j.id === jerkAtCut.id)?.smeared).toBeTruthy();
    expect(excused.summary.motion.jerks).toBe(plain.summary.motion.jerks - 1);
    expect(excused.summary.motion.jerksSmeared).toBe(1);
    const tooBig = await run([planned()], { ...CFG, smear: { excuse: true, maxJerkPx: Math.floor(px) - 1 } });
    expect(tooBig.jerks.some((j) => j.smeared)).toBe(false);
    expect(tooBig.summary.motion.jerks).toBe(plain.summary.motion.jerks);
  });
});

describe('what the probe hands over', () => {
  it('reads window.__pyrefly.smearLog() into its own clock; a build without the log gives none; a throwing log gives none', () => {
    const cfg = { ringScale: 0.6, ringFrames: 20, maxStrips: 10, cellHeight: 100, encodePerFrame: 1, jpegQuality: 0.6, recentFrames: 14, pendingFrames: 40, jerkCandidatePx: 28, jerkCandidateRatio: 3, candidateWindow: 8, beforeFrames: 14, afterFrames: 6, cutPx: 120, washSelector: null };
    const now = { v: 5000 };
    const mk = (win: Record<string, unknown>) => createProbe(cfg as never, { window: win, document: {}, performance: { now: () => now.v } } as never);
    const log = [{ actor: 'hero', from: 'idle', to: 'attack', style: 'blur', kind: 'plane', cutMs: 30, strength: 0.9, flash: true, overlap: 0.1, anchorDistance: 0.2, speed: 4, at: 5400, cutAt: 5415 }];
    const withLog = mk({ __pyrefly: { smearLog: () => log } }).meta();
    expect(withLog.smears).toEqual([{ actor: 'hero', from: 'idle', to: 'attack', style: 'blur', kind: 'plane', cutMs: 30, strength: 0.9, flash: true, overlap: 0.1, anchorDistance: 0.2, speed: 4, at: 400, cutAt: 415 }]);
    expect(mk({ __pyrefly: {} }).meta().smears).toEqual([]);
    expect(mk({ __pyrefly: { smearLog: () => { throw new Error('x'); } } }).meta().smears).toEqual([]);
    expect(mk({ __pyrefly: { smearLog: () => log } }).meta().errors).toEqual([]);
  });
});
