/**
 * T-02 of the motion-fluidity pass (lane L5): the probe reads the swap log (`window.__pyrefly.swapReasons()`, engine/motion/SwapLog.ts, lane L1) into `meta.swapLog` in the PROBE'S clock, a build without
 * it gives an empty log, and a log that throws never voids the probe. The probe runs in node against a minimal page; the rest of what it reads is pinned in critic-continuity-probe.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { createProbe } from '../../critic/runner/lib/continuity-probe.mjs';
import type { ProbeConfig } from '../../critic/runner/lib/continuity-probe.mjs';

const CFG = { ringScale: 0.6, ringFrames: 16, maxStrips: 50, cellHeight: 120, encodePerFrame: 2, jpegQuality: 0.7, recentFrames: 14, jerkCandidatePx: 28, jerkCandidateRatio: 3, candidateWindow: 8 } as unknown as ProbeConfig;

function probeWith(swapLog: unknown) {
  const pyrefly: Record<string, unknown> = { app: { screens: [], nextFrame: () => Promise.resolve() }, battleState: () => ({ log: [] }) };
  if (swapLog !== undefined) pyrefly['swapReasons'] = swapLog;
  return createProbe(CFG, { window: { __pyrefly: pyrefly }, document: {}, performance: { now: () => 1000 } } as never);
}

describe('meta.swapLog', () => {
  it('carries the reasons and the designed blends, their times moved into the probe\'s clock (the page clock less the probe\'s start)', () => {
    const p = probeWith(() => ({
      reasons: [{ at: 1500, actor: 'paine', pose: 'ready', reason: 'menu' }],
      designed: [{ at: 2250.04, actor: 'paine', from: 'hurt', to: 'idle', cls: 'recover', ms: 50 }],
    }));
    const m = (p.meta() as unknown as { swapLog: { reasons: Array<Record<string, unknown>>; designed: Array<Record<string, unknown>> } }).swapLog;
    expect(m.reasons).toEqual([{ at: 500, actor: 'paine', pose: 'ready', reason: 'menu' }]);
    expect(m.designed).toEqual([{ at: 1250, actor: 'paine', from: 'hurt', to: 'idle', cls: 'recover', ms: 50 }]);
  });
  it('is empty on a build with no swap log, and when the log throws or returns nothing', () => {
    for (const log of [undefined, () => { throw new Error('boom'); }, () => null, () => ({})]) {
      const p = probeWith(log);
      expect((p.meta() as unknown as { swapLog: unknown }).swapLog).toEqual({ reasons: [], designed: [] });
      expect((p.meta() as unknown as { errors: unknown[] }).errors).toEqual([]); // never a probe error: the harness then reads the neighbours
    }
  });
});
