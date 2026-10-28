/**
 * **The dissolve-travel excuse, end to end through `analyzeRun`** (CHK-027; pc-residues lane review M4, 2026-10-28; both games, shared critic plumbing). `critic-continuity-dissolve.test.ts` holds the pure function;
 * this file holds the WIRING that turns CHK-027 from FAIL to PASS on Chapter I and IV's kept recordings: a swap jerk inside a long even dissolve is tagged `dissolveTravel`, left out of the gated list
 * (`swapJerksOverFail`) and counted in `jerksDissolveTravel`; the same step in a 50 ms blend, in a dissolve with one abrupt frame, or with the policy's `maxPx` at 0 stays a gated swap jerk.
 *
 * One figure, two registered paintings ("follow", head high; "idle", head 0.3 of the figure's height lower, 180 px apart in a 600 px quad), cross-faded by a given sequence of incoming shares. Nothing here
 * opens a browser; every frame is made in the test.
 */
import { describe, expect, it } from 'vitest';
import { analyzeRun } from '../../critic/runner/lib/continuity-analyze.mjs';
import { continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import type { Anchors, ContinuityConfig, Mask } from '../../critic/runner/lib/continuity-pure.mjs';
import type { ProbeFrame, ProbeMeta } from '../../critic/runner/lib/continuity-probe.mjs';

const CFG: ContinuityConfig = continuityConfig();
const FRAME_MS = 1000 / 60;
const solid = (w = 16, h = 16): Mask => ({ w, h, bits: new Uint8Array(w * h).fill(1) });
const rect = (x: number, y: number, w: number, h: number): number[] => [x, y, x + w, y, x + w, y + h, x, y + h];
const QUAD = rect(300, 100, 300, 600);
const plane = (k: number, fade: number): number[] => [k, fade, 1, ...QUAD];
const reg = (subject: string, pose: string, head: Anchors['head']): Anchors => ({ head, mass: 0.3, centroid: { u: 0.5, t: 0.5 }, stance: { u: 0.5, t: 0.98 }, stanceSrc: 'registration', mask: solid(), prone: false, subject, pose, url: `/art/characters/${subject}/${pose}.webp` });
/** The follow painting's head is high in the card (centre t 0.10), the idle's 0.3 lower (t 0.40): 180 px of a 600 px quad. */
const ANCHORS = [reg('kimahri', 'follow', { u0: 0.4, t0: 0.05, u1: 0.6, t1: 0.15 }), reg('kimahri', 'idle', { u0: 0.4, t0: 0.35, u1: 0.6, t1: 0.45 })];

/** A run of one figure whose incoming painting's share goes through `shares` (every value one frame; 20 still frames before and after). The swap is logged on the first frame the incoming painting dominates. */
function dissolveRun(shares: number[]): { meta: ProbeMeta; records: ProbeFrame[] } {
  const all = [...Array.from({ length: 20 }, () => 0), ...shares, ...Array.from({ length: 20 }, () => 1)];
  const records: ProbeFrame[] = all.map((s, n) => ({ n, t: Math.round(n * FRAME_MS * 10) / 10, f: [{ i: 0, a: 1, act: s >= 0.5 ? 1 : 0, s: [plane(0, 1 - s), plane(1, s)], g: [0, 0] }] }));
  const flip = all.findIndex((s) => s >= 0.5);
  const meta: ProbeMeta = {
    version: 1, figs: [{ id: 'kimahri', side: 'party', kind: 'party', artId: 'kimahri' }], view: [0, 0, 1600, 900], errors: [], logEvents: [], strips: [],
    poses: [{ fig: 0, pose: 'follow', url: '/art/characters/kimahri/follow.png', w: 800, h: 1000 }, { fig: 0, pose: 'idle', url: '/art/characters/kimahri/idle.png', w: 800, h: 1000 }],
    swaps: [{ n: flip, t: Math.round(flip * FRAME_MS * 10) / 10, i: 0, from: 0, to: 1, a: 1 }],
    stats: { frames: all.length, battleFrames: all.length, battleSeconds: 120, maxDtMs: 20, slowFrames: 0, fps: 59, copyMsMean: 0.03 },
  };
  return { meta, records };
}

/** Small even steps of 0.04 with ONE step of `big` at index `at` of the blend (the share must still reach 1). */
function evenWithOneStep(big: number, at = 4): number[] {
  const out = [0.04, 0.08, 0.12];
  let s = 0.12;
  for (let j = 3; j < 40 && s < 0.97; j++) { s = Math.min(1, s + (j === at ? big : 0.04)); out.push(Math.round(s * 1000) / 1000); }
  return out;
}

const run = (shares: number[], cfg: ContinuityConfig = CFG) => { const r = dissolveRun(shares); return analyzeRun({ meta: r.meta, records: r.records, anchors: ANCHORS, cfg }); };
const withDissolve = (over: Record<string, number>): ContinuityConfig => ({ ...CFG, jerks: { ...CFG.jerks, dissolveTravel: { ...(CFG.jerks as { dissolveTravel: object }).dissolveTravel, ...over } } } as ContinuityConfig);

describe('a swap jerk inside a long even dissolve (CHK-027, Kimahri\'s follow to idle, Tidus\'s hurt to critical)', () => {
  const shares = evenWithOneStep(0.25); // one step of 0.25 of the 180 px gap = 45 px, over jerkFailPx (40), under maxPx (80)

  it('is the dissolve\'s own travel: tagged with its share step, out of the gated swap jerks, counted in jerksDissolveTravel', () => {
    const r = run(shares);
    const m = r.summary.motion as unknown as Record<string, number>;
    const swapJerks = r.jerks.filter((j) => j.kind === 'swap');
    expect(swapJerks).toHaveLength(1);
    expect(swapJerks[0]!.px).toBeGreaterThanOrEqual(40);
    expect(swapJerks[0]!.px).toBeLessThan(50);
    expect((swapJerks[0] as unknown as { dissolveTravel?: { shareStep: number; blendFrames: number } }).dissolveTravel).toMatchObject({ shareStep: 0.25 });
    expect((swapJerks[0] as unknown as { dissolveTravel: { blendFrames: number } }).dissolveTravel.blendFrames).toBeGreaterThanOrEqual(5);
    expect(m['jerksDissolveTravel']).toBe(1);
    expect(m['worstDissolveTravelPx']).toBeCloseTo(swapJerks[0]!.px, 1);
    expect(m['swapJerksOverFail']).toBe(0);
    expect(m['jerksOverFail']).toBe(0);
    expect(r.swaps[0]!.hardCut).toBe(false);
  });

  it('is a gated swap jerk again when the policy\'s maxPx is 0 (the excuse off: the earlier reading, for an old-versus-new run of one recording)', () => {
    const r = run(shares, withDissolve({ maxPx: 0 }));
    const m = r.summary.motion as unknown as Record<string, number>;
    expect(m['jerksDissolveTravel']).toBe(0);
    expect(m['swapJerksOverFail']).toBe(1);
    expect(r.jerks.some((j) => (j as { dissolveTravel?: unknown }).dissolveTravel)).toBe(false);
  });

  it('is a gated swap jerk when the step is bigger than the policy cap (maxPx under the 45 px) or the incoming share steps by more than maxShareStep', () => {
    const capped = run(shares, withDissolve({ maxPx: 40 }));
    expect((capped.summary.motion as unknown as Record<string, number>)['swapJerksOverFail']).toBe(1);
    const tight = run(shares, withDissolve({ maxShareStep: 0.2 }));
    expect((tight.summary.motion as unknown as Record<string, number>)['swapJerksOverFail']).toBe(1);
    expect((tight.summary.motion as unknown as Record<string, number>)['jerksDissolveTravel']).toBe(0);
    const abrupt = run(evenWithOneStep(0.35)); // 63 px: under maxPx, over the 0.3 share step
    expect((abrupt.summary.motion as unknown as Record<string, number>)['swapJerksOverFail']).toBe(1);
    expect((abrupt.summary.motion as unknown as Record<string, number>)['jerksDissolveTravel']).toBe(0);
  });
});

describe('a 50 ms blend is not a dissolve: the pop the gate is for', () => {
  it('a three-frame blend (shares 0.33, 0.67, 1) is a swap jerk of about 60 px, gated, and not counted as dissolve travel', () => {
    const r = run([0.33, 0.67]);
    const m = r.summary.motion as unknown as Record<string, number>;
    expect(r.swaps[0]!.blendFrames).toBeLessThan(5);
    expect(m['jerksDissolveTravel']).toBe(0);
    expect(m['swapJerksOverFail']).toBeGreaterThanOrEqual(1);
  });

  it('and a hard cut is never dissolve travel (the figure jumps 180 px)', () => {
    const r = run([]);
    const m = r.summary.motion as unknown as Record<string, number>;
    expect(r.swaps[0]!.hardCut).toBe(true);
    expect(m['jerksDissolveTravel']).toBe(0);
    expect(m['swapJerksOverFail']).toBeGreaterThanOrEqual(1);
  });
});
