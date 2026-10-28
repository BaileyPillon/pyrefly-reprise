/**
 * CHK-026 and the CUT-SIDE ANCHOR (post-conference motion plan MF-18, lane pc-scope, 2026-10-28; review M-1 and M-2; shared critic plumbing, both games). `critic/runner/lib/continuity-smear.mjs`:
 * the anchor draws the incoming plane of a big cut back toward the old head ON PURPOSE and eases it home, so on that one swap the two paintings' feet stand apart sideways by the logged share of the
 * figure's height. CHK-026 reads feet through the planes in one frame with a 2 px line, so without this word every anchored cut would FAIL it. With `glideFeet` the SIDEWAYS part of that reading is
 * excused up to the logged share (plus the policy's slack and what the reading tolerates anyway); a vertical move, a slide bigger than designed and every swap with no glide in the log are judged as
 * before, and the excused reading is kept and counted on its own line. Also: the probe keeps `glide` and `cause` of the planned-smear log (the CONT_RAW_DIR recording and the harness read them).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { analyzeRun, anchorsForPoses } from '../../critic/runner/lib/continuity-analyze.mjs';
import { continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import { createProbe } from '../../critic/runner/lib/continuity-probe.mjs';
import { SMEAR_DEFAULTS, excuseGlideFeet, smearPolicy, type LoggedSmear } from '../../critic/runner/lib/continuity-smear.mjs';
import type { PoseMeasure } from '../../critic/runner/lib/continuity-silhouette.mjs';
import type { ProbeFrame, ProbeMeta } from '../../critic/runner/lib/continuity-probe.mjs';

const ROOT = resolve(__dirname, '..', '..');
const CFG = continuityConfig();
const ON = smearPolicy({ smear: { excuse: true, glideFeet: true } });
const SIZE = { feetTolerancePx: 2, feetTolerancePxCoarse: 6 };

describe('the policy word', () => {
  it('is off unless the block says true, and critic/policy.json says true with the review and the delegation named', () => {
    expect(SMEAR_DEFAULTS.glideFeet).toBe(false);
    expect(smearPolicy({ smear: { excuse: true } }).glideFeet).toBe(false);
    expect(smearPolicy({ smear: { glideFeet: true } }).glideFeet).toBe(true);
    const p = JSON.parse(readFileSync(resolve(ROOT, 'critic', 'policy.json'), 'utf8')) as { continuity: { smear: { glideFeet: boolean; glideSlackShare: number; note: string } } };
    expect(p.continuity.smear.glideFeet).toBe(true);
    expect(p.continuity.smear.glideSlackShare).toBeGreaterThan(0);
    expect(p.continuity.smear.glideSlackShare).toBeLessThanOrEqual(0.25);
    expect(p.continuity.smear.note).toMatch(/MF-18/);
    expect(p.continuity.smear.note).toMatch(/delegation/);
    expect(smearPolicy(CFG).glideFeet).toBe(true);
  });
});

// ---------------------------------------------------------------- excuseGlideFeet, on hand-made swap rows

const row = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 0, figurePx: 500, failFeet: true, failFeetSil: false,
  feet: { dx: -92.2, dy: 0, px: 92.2, standing: true, source: 'registration' },
  smear: { style: 'paint', kind: 'plane', glide: { share: 0.2, ms: 120 } },
  ...over,
});

describe('excuseGlideFeet', () => {
  it('excuses the sideways part of the feet reading up to the logged share of the drawn height and keeps the reading', () => {
    const s = row();
    const t = excuseGlideFeet([s], ON, SIZE);
    expect(s['failFeet']).toBe(false);
    expect(s['feetDesigned']).toMatchObject({ px: 92.2, dx: -92.2, dy: 0, share: 0.2 });
    expect((s['feetDesigned'] as { limitPx: number }).limitPx).toBeCloseTo(0.2 * 500 * 1.1 + 2, 1);
    expect(t).toMatchObject({ cuts: 1, feetExcused: 1, feetSilExcused: 0 });
    expect(t.worstPx).toBeCloseTo(92.2, 1);
    expect(t.worstShare).toBeCloseTo(92.2 / 500, 3);
  });

  it('a slide bigger than designed (past the share, the slack and the tolerance) stays a feet failure', () => {
    const s = row({ feet: { dx: -140, dy: 0, px: 140, standing: true, source: 'registration' } });
    excuseGlideFeet([s], ON, SIZE);
    expect(s['failFeet']).toBe(true);
    expect(s['feetDesigned']).toBeUndefined();
  });

  it('the vertical part is not excused: the anchor is sideways only, so a feet drop of more than the tolerance stays', () => {
    const s = row({ feet: { dx: -60, dy: 5, px: 60.2, standing: true, source: 'registration' } });
    excuseGlideFeet([s], ON, SIZE);
    expect(s['failFeet']).toBe(true);
    const ok = row({ feet: { dx: -60, dy: 1.5, px: 60, standing: true, source: 'registration' } }); // within the 2 px line
    excuseGlideFeet([ok], ON, SIZE);
    expect(ok['failFeet']).toBe(false);
  });

  it('a silhouette-read stance is held to the coarse 6 px line in y', () => {
    const s = row({ feet: { dx: -60, dy: 5, px: 60.2, standing: true, source: 'silhouette' } });
    excuseGlideFeet([s], ON, SIZE);
    expect(s['failFeet']).toBe(false); // 5 px is under the coarse line
    const t = row({ feet: { dx: -60, dy: 8, px: 60.5, standing: true, source: 'silhouette' } });
    excuseGlideFeet([t], ON, SIZE);
    expect(t['failFeet']).toBe(true);
  });

  it('a swap with no glide in the log, a smear without one, or no drawn height is judged as before', () => {
    const a = row({ smear: { style: 'paint', kind: 'plane', glide: null } });
    const b = row({ smear: undefined });
    const c = row({ figurePx: null });
    const t = excuseGlideFeet([a, b, c], ON, SIZE);
    expect([a, b, c].map((s) => s['failFeet'])).toEqual([true, true, true]);
    expect(t.feetExcused).toBe(0);
    expect(t.cuts).toBe(1); // the third matched a glide, but its height is unknown: counted, not excused
  });

  it('the word off, or the whole smear excuse off, excuses nothing (the cuts are still counted)', () => {
    for (const p of [smearPolicy({ smear: { excuse: true } }), smearPolicy({ smear: { glideFeet: true } })]) {
      const s = row();
      const t = excuseGlideFeet([s], p, SIZE);
      expect(s['failFeet']).toBe(true);
      expect(t).toMatchObject({ cuts: 1, feetExcused: 0 });
    }
  });

  it('the silhouette feet reading is excused the same way where it is judged in x and y; where both stances are registered (dy only) a sideways slide never failed it', () => {
    const s = row({ failFeet: false, failFeetSil: true, feetSil: { dx: 80, dy: 1, px: 80, gate: 'xy', gatePx: 80, standing: true, tolerancePx: 10 } });
    const t = excuseGlideFeet([s], ON, SIZE);
    expect(s['failFeetSil']).toBe(false);
    expect((s['feetSil'] as { designed?: unknown }).designed).toMatchObject({ dx: 80 });
    expect(t.feetSilExcused).toBe(1);
    const dyGate = row({ failFeet: false, failFeetSil: true, feetSil: { dx: 80, dy: 30, px: 85, gate: 'dy', gatePx: 30, standing: true, tolerancePx: 10 } });
    excuseGlideFeet([dyGate], ON, SIZE);
    expect(dyGate['failFeetSil']).toBe(true); // a real drop of 30 px
  });
});

// ---------------------------------------------------------------- end to end, on the synthetic recording of critic-continuity-smear.test.ts

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
/** The same drawing, drawn `dx` px to the right: the incoming plane of an anchored cut (same size, so the head and the height read 1.000; only the feet and the head's place move). */
const shifted = (dx: number): number[] => QA.map((v, i) => (i % 2 === 0 ? v + dx : v));
const FROM = [1, 0.85, 0.65, 0.45, 0.25, 0.1, 0, 0];
const TO = [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1, 1];
const slot = (k: number, fade: number, q: number[]): number[] => [k, fade, 1, ...q];
const FRAME_MS = 1000 / 60;
const tOf = (n: number): number => Math.round(n * FRAME_MS * 10) / 10;

/** Ten swaps; swap 0 is a hard cut whose incoming plane is `incoming`; the other nine are plain crossfades of the one drawing (no feet move). */
function build(incoming: number[]): { meta: ProbeMeta; records: ProbeFrame[] } {
  const records: ProbeFrame[] = [];
  const swaps = 10;
  const meta: ProbeMeta = {
    version: 1, figs: [{ id: 'hero', side: 'party', kind: 'party', artId: 'hero' }],
    poses: [{ fig: 0, pose: 'idle', url: '/art/characters/hero/idle.png', w: W, h: H }, { fig: 0, pose: 'attack', url: '/art/characters/hero/attack.png', w: W, h: H }],
    swaps: [], logEvents: [], view: [0, 0, 1600, 900], errors: [],
    stats: { frames: 30 * (swaps + 2), battleFrames: 30 * (swaps + 2), battleSeconds: 120, maxDtMs: 20, slowFrames: 0, fps: 59, copyMsMean: 0.03 }, strips: [],
  };
  let current = 0;
  for (let n = 0; n < 30 * (swaps + 2); n++) {
    const s = Math.floor((n - 20) / 30);
    const k = n - (20 + s * 30);
    let slots: (number[] | 0)[];
    if (s >= 0 && s < swaps && k >= 0 && k < FROM.length) {
      const from = s % 2, to = 1 - (s % 2);
      if (s === 0) {
        const fa = k < 3 ? 1 : 0;
        slots = [slot(0, fa, QA), slot(1, 1 - fa, incoming)];
      } else slots = [slot(from, FROM[k]!, QA), slot(to, TO[k]!, QA)];
      if (k === 3) meta.swaps.push({ n, t: tOf(n), i: 0, from: s === 0 ? 0 : from, to: s === 0 ? 1 : to, a: 1 });
      if (k === FROM.length - 1) current = to;
    } else slots = [slot(current, 1, QA), 0];
    records.push({ n, t: tOf(n), f: [{ i: 0, a: 1, act: 0, s: slots, g: [0, 0] }] });
  }
  return { meta, records };
}
const fetchImage = async (): Promise<Buffer> => painting();
const CUT_AT = 20 + 3;
const planned = (glide?: { share: number; ms: number }): LoggedSmear => ({ actor: 'hero', from: 'idle', to: 'attack', style: 'paint', kind: 'plane', at: tOf(CUT_AT) - 6, cutAt: tOf(CUT_AT) + 9, cutMs: 30, overlap: 0.14, anchorDistance: 0.4, strength: 0.9, flash: true, ...(glide ? { glide } : {}) });

async function run(incoming: number[], smears: LoggedSmear[], cfg = CFG) {
  const { meta, records } = build(incoming);
  meta.smears = smears;
  const { anchors } = await anchorsForPoses({ poses: meta.poses, fetchImage, measure: MEASURE });
  return analyzeRun({ meta, records, anchors, cfg });
}

describe('analysing a recording with an anchored cut', () => {
  it('the control: the same slide with no glide in the log is a feet failure and CHK-026 FAILs, as it must be for a painting that really moves the feet', async () => {
    const r = await run(shifted(60), [planned()]);
    const cut = r.swaps[0]!;
    expect(cut.feet!.px).toBeCloseTo(60, 0);
    expect(cut.failFeet).toBe(true);
    expect(r.summary.size.feetOverTolerance).toBe(1);
    expect(r.summary.size.feetDesigned).toBe(0);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
  });

  it('with the glide in the log (a share of 0.2 of a 300 px figure is 60 px) the slide is a designed shift: not a failure, kept, counted on its own line, and left out of the registration\'s numbers', async () => {
    const r = await run(shifted(60), [planned({ share: 0.2, ms: 120 })]);
    const cut = r.swaps[0]! as unknown as { failFeet: boolean; feet: { px: number }; feetDesigned?: { px: number; share: number; limitPx: number } };
    expect(cut.feet.px).toBeCloseTo(60, 0); // the reading itself is kept
    expect(cut.failFeet).toBe(false);
    expect(cut.feetDesigned).toMatchObject({ share: 0.2 });
    expect(r.summary.size.feetOverTolerance).toBe(0);
    expect(r.summary.size.feetDesigned).toBe(1);
    expect(r.summary.size.feetDesignedWorstPx).toBeCloseTo(60, 0);
    expect(r.summary.size.maxFeetShiftPx).toBeLessThan(2); // the registration's own worst feet move: the other nine swaps move none
    expect(r.summary.checks['CHK-026'].result).toBe('PASS');
    expect(r.smear).toMatchObject({ planned: 1, matched: 1, glide: { logged: 1, matched: 1, feetExcused: 1 } });
  });

  it('a slide bigger than the logged share stays a failure (the anchor did not do what it said)', async () => {
    const r = await run(shifted(60), [planned({ share: 0.05, ms: 80 })]); // designed 0.05 * 300 * 1.1 = 16.5 px (+ 2)
    expect(r.swaps[0]!.failFeet).toBe(true);
    expect(r.summary.size.feetOverTolerance).toBe(1);
    expect(r.summary.size.feetDesigned).toBe(0);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
  });

  it('the word off in the policy gives the earlier reading back', async () => {
    const r = await run(shifted(60), [planned({ share: 0.2, ms: 120 })], { ...CFG, smear: { ...CFG.smear, glideFeet: false } });
    expect(r.swaps[0]!.failFeet).toBe(true);
    expect(r.summary.size.feetDesigned).toBe(0);
    expect(r.smear).toMatchObject({ glide: { logged: 1, matched: 1, feetExcused: 0 } });
  });
});

// ---------------------------------------------------------------- what the probe keeps of the log

describe('the probe keeps the glide and the cause of a planned smear (review M-2)', () => {
  it('copies glide { share, ms } and cause into meta().smears (the CONT_RAW_DIR recording), and leaves them out when the entry has none', () => {
    const cfg = { ringScale: 0.6, ringFrames: 20, maxStrips: 10, cellHeight: 100, encodePerFrame: 1, jpegQuality: 0.6, recentFrames: 14, pendingFrames: 40, jerkCandidatePx: 28, jerkCandidateRatio: 3, candidateWindow: 8, beforeFrames: 14, afterFrames: 6, cutPx: 300 };
    const mk = (log: unknown[]) => createProbe(cfg as never, { window: { __pyrefly: { smearLog: () => log } }, document: {}, performance: { now: () => 5000 } } as never);
    const base = { actor: 'hero', from: 'idle', to: 'attack', style: 'paint', kind: 'plane', cutMs: 30, strength: 0.9, flash: true, overlap: 0.1, anchorDistance: 0.4, speed: 0, at: 5400, cutAt: 5415 };
    const [a, b] = mk([{ ...base, cause: 'hit', glide: { share: 0.28, ms: 117, extra: 'x' } }, base]).meta().smears!;
    expect(a).toMatchObject({ cause: 'hit', glide: { share: 0.28, ms: 117 } });
    expect((a as { glide: object }).glide).not.toHaveProperty('extra');
    expect(JSON.parse(JSON.stringify(b))).not.toHaveProperty('glide');
    expect(JSON.parse(JSON.stringify(b))).not.toHaveProperty('cause');
  });
});
