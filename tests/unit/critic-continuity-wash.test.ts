/**
 * The Save Sphere's wash in the continuity harness (r43 instrument edit; docs/handoff/r41-aeonjump.md, FOC40-02). Chapter XI's Save Sphere card washes the whole frame,
 * HUD included, to a pale lilac white and restages the next link under it; Anima's group scale lands 0.6 s later, still under the wash, and her head climbs about 900 px in
 * one frame. The probe copies the canvas and the wash is an HTML overlay, so the harness counted a pop the player sees only through a veil that is 74 percent opaque, and that
 * one outlier failed CHK-027 on its own (967.7 px in round 25). The probe now records the wash element's opacity on every frame it is up; a jerk whose step was under a wash that
 * hides at least `continuity.wash.minCover` of the picture is tagged `covered` and left out of the numbers, and the policy can switch that off.
 *
 * Held to a synthetic recording and a fake page: nothing opens a browser. Game case: FFX-2 only in effect (only Chapter XI plays a Save Sphere card; `restoresPartyOnEntry`,
 * `SaveSphereCard.ts`); the harness plumbing is shared and does nothing in FFX, where no wash exists.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { analyzeRun } from '../../critic/runner/lib/continuity-analyze.mjs';
import { aggregate, continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import type { ChapterResult } from '../../critic/runner/lib/continuity.mjs';
import { createProbe } from '../../critic/runner/lib/continuity-probe.mjs';
import type { ProbeConfig, ProbeFrame, ProbeMeta } from '../../critic/runner/lib/continuity-probe.mjs';
import { continuityReportLine } from '../../critic/runner/lib/continuity-pure.mjs';
import type { Anchors, ContinuityConfig, Jerk } from '../../critic/runner/lib/continuity-pure.mjs';
import { WASH_MIN_COVER, WASH_SELECTOR, tagWash, washCover, washOverStep, washPolicy, washReport, washTable } from '../../critic/runner/lib/continuity-wash.mjs';

const ROOT = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const FRAME_MS = 1000 / 60;
const ALPHA = 0.74; // .ssphere__wash { background: rgba(246, 240, 250, 0.74) }

afterEach(() => { delete process.env['CONT_CFG']; });

// ================================================================== the policy

describe('the wash block of the policy', () => {
  const c = continuityConfig();

  it('excuses a jerk under a wash that hides 70 percent of the picture, reads the Save Sphere\'s wash, and is on by default', () => {
    expect(c.wash).toMatchObject({ excuse: true, minCover: 0.7, selector: WASH_SELECTOR });
    expect(WASH_SELECTOR).toBe('[data-testid="save-sphere"] .ssphere__wash');
    expect(WASH_MIN_COVER).toBe(0.7);
    expect(washPolicy(c)).toEqual({ excuse: true, minCover: 0.7, selector: WASH_SELECTOR });
  });

  it('needs the veil essentially all the way up: its full cover is 0.74, so a minCover above that would excuse nothing and one far below it would excuse a half-hidden jump', () => {
    expect(c.wash!.minCover!).toBeLessThanOrEqual(ALPHA);
    expect(c.wash!.minCover!).toBeGreaterThanOrEqual(0.5);
  });

  it('can be switched off, or told to stop reading the page, by the environment, block by block, and a policy without the block excuses nothing', () => {
    process.env['CONT_CFG'] = '{"wash":{"excuse":false}}';
    const off = continuityConfig();
    expect(off.wash).toMatchObject({ excuse: false, minCover: 0.7, selector: WASH_SELECTOR }); // merged: the rest of the block stays
    expect(washPolicy(off).excuse).toBe(false);
    process.env['CONT_CFG'] = '{"wash":{"selector":null}}';
    expect(washPolicy(continuityConfig()).selector).toBeNull();
    delete process.env['CONT_CFG'];
    expect(washPolicy({})).toEqual({ excuse: false, minCover: WASH_MIN_COVER, selector: null });
    expect(washPolicy(null)).toEqual({ excuse: false, minCover: WASH_MIN_COVER, selector: null });
    expect(washPolicy({ wash: { excuse: true, minCover: 7 } }).minCover).toBe(1); // clamped
  });
});

// ================================================================== the pure half

describe('how much of the picture the wash hides', () => {
  it('is its opacity times its background alpha, and an alpha that was not read hides nothing', () => {
    expect(washCover(1, ALPHA)).toBeCloseTo(0.74, 5);
    expect(washCover(0.5, ALPHA)).toBeCloseTo(0.37, 5);
    expect(washCover(0, ALPHA)).toBe(0);
    expect(washCover(1, null)).toBe(0);
    expect(washCover(1, undefined)).toBe(0);
    expect(washCover(2, 1)).toBe(1); // clamped
  });

  it('takes a step to be under the veil only when BOTH of its frames are: the less covered of the two', () => {
    const t = new Map<number, number>([[10, 1], [11, 1], [12, 0.6], [13, 0.2]]);
    expect(washOverStep(11, t, ALPHA)).toEqual({ opacity: 1, cover: 0.74, frames: [10, 11] });
    expect(washOverStep(12, t, ALPHA)).toEqual({ opacity: 0.6, cover: 0.444, frames: [11, 12] });
    expect(washOverStep(10, t, ALPHA)).toEqual({ opacity: 0, cover: 0, frames: [9, 10] }); // the card was just added: no wash on the frame before
    expect(washOverStep(14, t, ALPHA)).toEqual({ opacity: 0, cover: 0, frames: [13, 14] }); // the card was just taken away: no wash on frame 14
    expect(washOverStep(15, t, ALPHA)).toBeNull();
  });

  it('has nothing to say about a step with no wash on either frame', () => {
    const t = new Map<number, number>([[10, 1]]);
    expect(washOverStep(50, t, ALPHA)).toBeNull();
    expect(washOverStep(5, new Map(), ALPHA)).toBeNull();
  });

  it('reads the table from the frame records that carry a wash, and only those', () => {
    const recs = [{ n: 1 }, { n: 2, w: 0.4 }, { n: 3, w: 1 }, { n: 4, w: Number.NaN }] as { n: number; w?: number }[];
    expect([...washTable(recs).entries()]).toEqual([[2, 0.4], [3, 1]]);
  });
});

describe('tagging the jerks', () => {
  const jerk = (n: number, px = 100): Jerk => ({ n, t: n * FRAME_MS, px, localPx: 1, ratio: 50, part: 'head', dx: 0, dy: -px });
  const records = (from: number, to: number, w: number): { n: number; w: number }[] => Array.from({ length: to - from + 1 }, (_, i) => ({ n: from + i, w }));
  const POLICY = { excuse: true, minCover: 0.7 };

  it('marks a jerk in the middle of the veil covered, with the wash over it', () => {
    const jerks = [jerk(120, 960.2)];
    expect(tagWash(jerks, { records: records(100, 200, 1), alpha: ALPHA, policy: POLICY })).toBe(1);
    expect(jerks[0]).toMatchObject({ covered: true, wash: { opacity: 1, cover: 0.74, frames: [119, 120] } });
  });

  it('leaves a jerk outside the veil alone, and a jerk the veil only half hides (the wash fading in or out)', () => {
    const jerks = [jerk(50), jerk(150), jerk(300)];
    const recs = [...records(100, 200, 1), ...records(201, 215, 0.5)];
    tagWash(jerks, { records: [...recs, { n: 299, w: 0.5 }, { n: 300, w: 0.5 }], alpha: ALPHA, policy: POLICY });
    expect(jerks[0]).not.toHaveProperty('wash'); // no wash on frames 49, 50
    expect(jerks[1]).toMatchObject({ covered: true });
    expect(jerks[2]).toMatchObject({ wash: { opacity: 0.5, cover: 0.37 } });
    expect(jerks[2]).not.toHaveProperty('covered'); // 37 percent of the picture is hidden, 63 percent shows through
  });

  it('keeps the wash on a jerk and excuses none of them when the policy says excuse: false (the earlier reading)', () => {
    const jerks = [jerk(120)];
    expect(tagWash(jerks, { records: records(100, 200, 1), alpha: ALPHA, policy: { excuse: false, minCover: 0.7 } })).toBe(0);
    expect(jerks[0]).toMatchObject({ wash: { cover: 0.74 } });
    expect(jerks[0]).not.toHaveProperty('covered');
  });

  it('excuses nothing when the veil\'s alpha could not be read, and a cover exactly at the line counts', () => {
    const jerks = [jerk(120)];
    expect(tagWash(jerks, { records: records(100, 200, 1), alpha: null, policy: POLICY })).toBe(0);
    expect(jerks[0]).toMatchObject({ wash: { cover: 0 } });
    const edge = [jerk(120)];
    expect(tagWash(edge, { records: records(100, 200, 1), alpha: 0.7, policy: POLICY })).toBe(1); // 1 x 0.7 is 0.7: at the line
    const under = [jerk(120)];
    expect(tagWash(under, { records: records(100, 200, 1), alpha: 0.69, policy: POLICY })).toBe(0);
  });

  it('does nothing, cheaply, for a recording with no wash at all (every chapter but XI, and every recording made before this edit)', () => {
    const jerks = [jerk(120)];
    expect(tagWash(jerks, { records: [{ n: 119 }, { n: 120 }] as { n: number; w?: number }[], alpha: null, policy: POLICY })).toBe(0);
    expect(jerks[0]).not.toHaveProperty('wash');
  });

  it('reports where the wash was up, as spans of consecutive frames, and what the policy did', () => {
    const recs = [...records(100, 219, 1), ...records(900, 959, 1)];
    const jerks = [jerk(150, 960.2), jerk(400, 80)];
    tagWash(jerks, { records: recs, alpha: ALPHA, policy: POLICY });
    const rep = washReport({ records: recs, meta: { wash: { selector: WASH_SELECTOR, alpha: ALPHA, frames: 180, maxOpacity: 1, error: null } }, policy: { ...POLICY, selector: WASH_SELECTOR }, jerks });
    expect(rep).toMatchObject({ selector: WASH_SELECTOR, alpha: ALPHA, excuse: true, minCover: 0.7, framesSeen: 180, maxOpacity: 1, jerksUnderWash: 1, jerksCovered: 1, worstCoveredPx: 960.2 });
    expect(rep.spans).toEqual([{ from: 100, to: 219, frames: 120, ms: 2000 }, { from: 900, to: 959, frames: 60, ms: 1000 }]);
  });
});

// ================================================================== the probe, on a fake page

const PROBE_CFG: ProbeConfig = { ringScale: 0.6, ringFrames: 16, maxStrips: 50, cellHeight: 120, encodePerFrame: 2, jpegQuality: 0.7, recentFrames: 14, jerkCandidatePx: 28, jerkCandidateRatio: 3, candidateWindow: 8, beforeFrames: 6, afterFrames: 6, cutPx: 120 };
const PROJ = [1 / 800, 0, 0, 0, 0, 1 / 450, 0, 0, 0, 0, 1, 0, -1, -1, 0, 1];
const IDENT = (): number[] => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

interface WashEl { style: { opacity: string; display: string; visibility: string; backgroundColor: string } }

/** A fake page with one standing figure and, when `card` is set, a wash element the probe can query and compute the style of. */
function washRig(over: Partial<ProbeConfig> = {}) {
  let now = 1000;
  const waiters: (() => void)[] = [];
  const wash: WashEl = { style: { opacity: '0', display: 'block', visibility: 'visible', backgroundColor: 'rgba(246, 240, 250, 0.74)' } };
  const state = { card: false, queries: [] as string[], throwOnStyle: false };
  const mesh = () => ({ visible: true, matrixWorld: { elements: [200, 0, 0, 0, 0, 400, 0, 0, 0, 0, 1, 0, 400, 500, 0, 1] } });
  const actor = { visible: true, showFigure: true, _alpha: 1, active: 0, slots: [{ pose: 'idle', fade: 1, meta: { width: 800, height: 1000 }, mesh: mesh() }, { pose: 'attack', fade: 0, meta: { width: 800, height: 1000 }, mesh: mesh() }], poseUrls: { idle: '/art/idle.png' } as Record<string, string>, matrixWorld: { elements: IDENT() } };
  const camera = { projectionMatrix: { elements: PROJ }, matrixWorldInverse: { elements: IDENT() } };
  const canvas = { width: 1600, height: 900, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) };
  const screen = { name: 'battle', fieldShown: true, stage: { actors: new Map([['hero', { actor, side: 'party', kind: 'party', artId: 'hero' }]]), opts: { camera, canvas } } };
  const app = { screens: [screen], nextFrame: () => new Promise<void>((resolveFrame) => waiters.push(resolveFrame)) };
  const win = {
    __pyrefly: { app, battleState: () => ({ log: [] }) },
    getComputedStyle: (el: WashEl) => { if (state.throwOnStyle) throw new Error('style read failed'); return el.style; },
  };
  const doc = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: () => undefined }), toDataURL: () => 'data:image/jpeg;base64,QUJD' }),
    querySelector: (sel: string) => { state.queries.push(sel); return state.card ? wash : null; },
  };
  const probe = createProbe({ ...PROBE_CFG, ...over }, { window: win, document: doc, performance: { now: () => now } });
  const step = async (dt = 16.7): Promise<void> => { now += dt; for (const w of waiters.splice(0)) w(); await new Promise((r) => setTimeout(r, 0)); };
  return { probe, wash, state, step };
}

describe('what the probe records of the wash', () => {
  it('records the wash element\'s opacity on each frame the card is up, its background alpha once, and nothing before or after', async () => {
    const r = washRig({ washSelector: WASH_SELECTOR });
    r.probe.start();
    await r.step(); // no card
    r.state.card = true;
    for (const o of ['0', '0.4', '0.9', '1', '1']) { r.wash.style.opacity = o; await r.step(); }
    r.state.card = false;
    await r.step();
    const w = r.probe.records.map((rec) => rec.w);
    expect(w).toEqual([undefined, 0, 0.4, 0.9, 1, 1, undefined]);
    expect('w' in r.probe.records[0]!).toBe(false); // a frame with no card has no `w` key at all: the records of every other chapter are unchanged
    const meta = r.probe.meta();
    expect(meta.wash).toEqual({ selector: WASH_SELECTOR, alpha: 0.74, frames: 5, maxOpacity: 1, error: null });
    expect(meta.errors).toEqual([]);
    expect(r.state.queries.every((q) => q === WASH_SELECTOR)).toBe(true);
  });

  it('reads nothing at all, and says nothing, when no selector is set (the earlier probe)', async () => {
    const r = washRig();
    r.state.card = true;
    r.probe.start();
    for (let i = 0; i < 3; i++) await r.step();
    expect(r.state.queries).toEqual([]);
    expect(r.probe.records.every((rec) => !('w' in rec))).toBe(true);
    expect(r.probe.meta().wash).toBeNull();
    const off = washRig({ washSelector: null });
    off.state.card = true;
    off.probe.start();
    await off.step();
    expect(off.state.queries).toEqual([]);
  });

  it('does not record a wash that is not displayed (display none, visibility hidden, an opacity it cannot read)', async () => {
    const r = washRig({ washSelector: WASH_SELECTOR });
    r.state.card = true;
    r.probe.start();
    r.wash.style.opacity = '1';
    r.wash.style.display = 'none';
    await r.step();
    r.wash.style.display = 'block';
    r.wash.style.visibility = 'hidden';
    await r.step();
    r.wash.style.visibility = 'visible';
    r.wash.style.opacity = '';
    await r.step();
    r.wash.style.opacity = '1';
    await r.step();
    expect(r.probe.records.map((rec) => rec.w)).toEqual([undefined, undefined, undefined, 1]);
  });

  it('reads the alpha of every colour form a browser gives, and says null for one it cannot read (the veil then hides nothing)', async () => {
    const cases: [string, number | null][] = [['rgba(246, 240, 250, 0.74)', 0.74], ['rgb(246 240 250 / 0.74)', 0.74], ['rgba(0, 0, 0, 50%)', 0.5], ['rgb(246, 240, 250)', 1], ['transparent', 0], ['rgba(0, 0, 0, 0)', 0], ['color(srgb 1 1 1 / 0.5)', null], ['', null]];
    for (const [css, want] of cases) {
      const r = washRig({ washSelector: WASH_SELECTOR });
      r.state.card = true;
      r.wash.style.opacity = '1';
      r.wash.style.backgroundColor = css;
      r.probe.start();
      await r.step();
      expect(r.probe.meta().wash?.alpha, css).toBe(want);
    }
  });

  it('survives a style read that throws: no `w`, the error is kept on the wash meta and NOT in the probe\'s errors (it must not void the verdicts or stop the probe)', async () => {
    const r = washRig({ washSelector: WASH_SELECTOR });
    r.state.card = true;
    r.state.throwOnStyle = true;
    r.probe.start();
    for (let i = 0; i < 40; i++) await r.step(); // more than the 30 errors that stop the probe
    expect(r.probe.records).toHaveLength(40);
    expect(r.probe.records.every((rec) => !('w' in rec))).toBe(true);
    const meta = r.probe.meta();
    expect(meta.errors).toEqual([]);
    expect(meta.wash).toMatchObject({ alpha: null, frames: 0, error: 'style read failed' });
  });
});

// ================================================================== the analysis, end to end

const HEAD = { u0: 0.4, t0: 0.05, u1: 0.6, t1: 0.15 };
const ANCHORS: Anchors[] = [{ head: HEAD, mass: 0.3, centroid: { u: 0.5, t: 0.5 }, stance: { u: 0.5, t: 0.98 }, stanceSrc: 'registration', mask: { w: 16, h: 16, bits: new Uint8Array(256).fill(1) }, prone: false }];
const rect = (x: number, y: number, w: number, h: number): number[] => [x, y, x + w, y, x + w, y + h, x, y + h];

/**
 * One hero standing still for `frames` frames; at frame `at` the whole figure is `dy` px higher on the screen (Anima's group scale landing, in effect) and stays there.
 * `washFrom..washTo` carry the wash at opacity `w` (the card), as the probe would record them.
 */
function recording(o: { frames?: number; at?: number; dy?: number; wash?: { from: number; to: number; w: number }[]; alpha?: number | null }): { meta: ProbeMeta; records: ProbeFrame[] } {
  const frames = o.frames ?? 240, at = o.at ?? 150, dy = o.dy ?? -900;
  const records: ProbeFrame[] = [];
  for (let n = 0; n < frames; n++) {
    const q = rect(300, 200 + (n >= at ? dy : 0), 200, 400);
    const rec: ProbeFrame = { n, t: Math.round(n * FRAME_MS * 10) / 10, f: [{ i: 0, a: 1, act: 0, s: [[0, 1, 1, ...q], 0], g: [0, 0] }] };
    const span = (o.wash ?? []).find((s) => n >= s.from && n <= s.to);
    if (span) rec.w = span.w;
    records.push(rec);
  }
  const alpha = o.alpha === undefined ? ALPHA : o.alpha;
  const meta: ProbeMeta = {
    version: 1, figs: [{ id: 'x2-anima', side: 'enemy', kind: 'enemy', artId: 'x2-anima' }], poses: [{ fig: 0, pose: 'idle', url: '/art/x2-anima/idle.png', w: 800, h: 1000 }], swaps: [], logEvents: [], view: [0, 0, 1600, 900], errors: [],
    stats: { frames, battleFrames: frames, battleSeconds: 120, maxDtMs: 20, slowFrames: 0, fps: 59, copyMsMean: 0.03 }, strips: [],
    ...((o.wash ?? []).length ? { wash: { selector: WASH_SELECTOR, alpha, frames: (o.wash ?? []).reduce((n, s) => n + s.to - s.from + 1, 0), maxOpacity: 1, error: null } } : {}),
  };
  return { meta, records };
}

// minSwaps 0: this figure never changes pose, and the verdict must say FAIL or PASS about its motion, not UNVERIFIED for want of swaps.
const CFG: ContinuityConfig = { ...continuityConfig(), minSwaps: 0 };
const withWash = (wash: Partial<NonNullable<ContinuityConfig['wash']>>): ContinuityConfig => ({ ...CFG, wash: { ...CFG.wash, ...wash } });

describe('a head that jumps 900 px in one frame', () => {
  it('without any wash is a jerk and fails CHK-027, as it always did', () => {
    const { meta, records } = recording({});
    const r = analyzeRun({ meta, records, anchors: ANCHORS, cfg: CFG });
    expect(r.jerks).toHaveLength(1);
    expect(r.jerks[0]).toMatchObject({ n: 150 });
    expect(r.jerks[0]!.px).toBeGreaterThan(800);
    expect(r.jerks[0]).not.toHaveProperty('wash');
    expect(r.summary.motion.jerks).toBe(1);
    expect(r.summary.motion.jerksCovered).toBe(0);
    expect(r.summary.checks['CHK-027'].result).toBe('FAIL');
    expect(r.summary.checks['CHK-027']).not.toHaveProperty('note');
    expect(r.worst.jerks).toEqual([r.jerks[0]!.id]);
    expect(r.wash).toMatchObject({ framesSeen: 0, jerksUnderWash: 0, jerksCovered: 0, spans: [] });
  });

  it('under the full Save Sphere wash is tagged covered, listed, and not counted: no jerk, no failure, no strip, the exception said in the verdict', () => {
    const { meta, records } = recording({ wash: [{ from: 100, to: 210, w: 1 }] });
    const r = analyzeRun({ meta, records, anchors: ANCHORS, cfg: CFG });
    expect(r.jerks).toHaveLength(1); // still in the report
    expect(r.jerks[0]).toMatchObject({ n: 150, covered: true, wash: { opacity: 1, cover: 0.74, frames: [149, 150] } });
    expect(r.summary.motion.jerks).toBe(0);
    expect(r.summary.motion.jerksOverFail).toBe(0);
    expect(r.summary.motion.worstJerkPx).toBe(0);
    expect(r.summary.motion.jerksCovered).toBe(1);
    expect(r.summary.motion.worstCoveredJerkPx).toBeGreaterThan(800);
    expect(r.summary.checks['CHK-027'].result).toBe('PASS');
    expect(r.summary.checks['CHK-027'].note).toMatch(/1 jerk\(s\) \(worst [\d.]+ px\) happened under the Save Sphere's wash and are not counted/);
    expect(r.worst.jerks).toEqual([]); // no strip is made of a jerk nobody sees
    expect(r.wash).toMatchObject({ framesSeen: 111, maxOpacity: 1, jerksUnderWash: 1, jerksCovered: 1, spans: [{ from: 100, to: 210, frames: 111, ms: 1850 }], alpha: ALPHA, excuse: true });
  });

  it('with `excuse: false` in the policy is counted again, and still shows the wash that was over it', () => {
    const { meta, records } = recording({ wash: [{ from: 100, to: 210, w: 1 }] });
    const r = analyzeRun({ meta, records, anchors: ANCHORS, cfg: withWash({ excuse: false }) });
    expect(r.jerks[0]).toMatchObject({ wash: { cover: 0.74 } });
    expect(r.jerks[0]).not.toHaveProperty('covered');
    expect(r.summary.motion.jerks).toBe(1);
    expect(r.summary.motion.jerksCovered).toBe(0);
    expect(r.summary.checks['CHK-027'].result).toBe('FAIL');
    expect(r.worst.jerks).toHaveLength(1);
  });

  it('on a policy with no wash block at all is counted (the earlier harness)', () => {
    const { meta, records } = recording({ wash: [{ from: 100, to: 210, w: 1 }] });
    const bare: ContinuityConfig = { ...CFG };
    delete bare.wash;
    const r = analyzeRun({ meta, records, anchors: ANCHORS, cfg: bare });
    expect(r.summary.motion.jerks).toBe(1);
    expect(r.summary.checks['CHK-027'].result).toBe('FAIL');
  });

  it('while the wash is only fading in is NOT hidden: 37 percent of the picture shows nothing of it', () => {
    const { meta, records } = recording({ wash: [{ from: 100, to: 210, w: 0.5 }] });
    const r = analyzeRun({ meta, records, anchors: ANCHORS, cfg: CFG });
    expect(r.jerks[0]).toMatchObject({ wash: { opacity: 0.5, cover: 0.37 } });
    expect(r.jerks[0]).not.toHaveProperty('covered');
    expect(r.summary.motion.jerks).toBe(1);
    expect(r.summary.checks['CHK-027'].result).toBe('FAIL');
  });

  it('after the wash has gone is a jerk (the veil lifted before the figure moved)', () => {
    const { meta, records } = recording({ wash: [{ from: 60, to: 140, w: 1 }] });
    const r = analyzeRun({ meta, records, anchors: ANCHORS, cfg: CFG });
    expect(r.jerks[0]).not.toHaveProperty('wash');
    expect(r.summary.motion.jerks).toBe(1);
  });

  it('on the first frame of the wash is a jerk: the frame before it has no veil, so the step is not under it', () => {
    const { meta, records } = recording({ wash: [{ from: 150, to: 210, w: 1 }] });
    const r = analyzeRun({ meta, records, anchors: ANCHORS, cfg: CFG });
    expect(r.jerks[0]).toMatchObject({ wash: { opacity: 0, cover: 0, frames: [149, 150] } });
    expect(r.summary.motion.jerks).toBe(1);
  });

  it('is still a jerk when the veil\'s alpha was not read (cover 0), and the record says why', () => {
    const { meta, records } = recording({ wash: [{ from: 100, to: 210, w: 1 }], alpha: null });
    const r = analyzeRun({ meta, records, anchors: ANCHORS, cfg: CFG });
    expect(r.jerks[0]).toMatchObject({ wash: { cover: 0 } });
    expect(r.summary.motion.jerks).toBe(1);
    expect(r.wash.alpha).toBeNull();
  });

  it('a recording made before the edit (no `w`, no meta.wash) is analysed exactly as it was', () => {
    const { meta, records } = recording({});
    delete (meta as { wash?: unknown }).wash;
    const r = analyzeRun({ meta, records, anchors: ANCHORS, cfg: CFG });
    expect(r.summary.motion.jerks).toBe(1);
    expect(r.wash).toMatchObject({ framesSeen: 0, selector: WASH_SELECTOR, alpha: null });
  });

  it('keeps a visible jerk in the same chapter: only the one under the veil is excused', () => {
    // the figure also drops 300 px at frame 40, before the card
    const { meta, records } = recording({ wash: [{ from: 100, to: 210, w: 1 }] });
    for (const rec of records) if (rec.n >= 40 && rec.n < 150) rec.f[0]!.s = [[0, 1, 1, ...rect(300, 500, 200, 400)], 0];
    const r = analyzeRun({ meta, records, anchors: ANCHORS, cfg: CFG });
    const early = r.jerks.find((j) => j.n === 40)!;
    expect(early).not.toHaveProperty('covered');
    expect(r.jerks.filter((j) => j.covered).map((j) => j.n)).toEqual([150]);
    expect(r.summary.motion.jerks).toBe(r.jerks.length - 1);
    expect(r.summary.checks['CHK-027'].result).toBe('FAIL'); // for the visible one
    expect(r.worst.jerks).toContain(early.id);
  });
});

// ================================================================== the whole run

describe('the whole run\'s aggregate', () => {
  const chapter = (name: string, jerks: number, covered: number, worstCovered: number): ChapterResult => ({
    chapter: name, summary: {
      battleSeconds: 300, counted: 20, swaps: 20,
      size: { judged: 20, headMeasured: 20, headRegistration: 20, headSilhouette: 0, headUnmeasured: 0, maxHeadJumpPct: 0, maxHeadJumpPctRegistration: 0, headOverTolerance: 0, maxFeetShiftPx: 0, feetOverTolerance: 0 },
      motion: { snaps: 0, hardCuts: 0, ghostSwaps: 0, ghostFrames: 0, worstGhostSeverity: 0, ghostOverFail: 0, jerks, worstJerkPx: jerks ? 50 : 0, jerksOverFail: jerks, lowestIou: 1, maxCentroidShiftPx: 0, jerksCovered: covered, worstCoveredJerkPx: worstCovered },
    }, checks: { 'CHK-026': { result: 'PASS' }, 'CHK-027': { result: 'PASS' } },
  });

  it('adds up the covered jerks and keeps the worst, and a covered jerk is never a failure of the run', () => {
    const agg = aggregate([chapter('ffx2-fallen-aeons', 0, 4, 967.7), chapter('seymour-flux', 0, 0, 0)], CFG);
    expect(agg.motion['jerksCovered']).toBe(4);
    expect(agg.motion['worstCoveredJerkPx']).toBe(967.7);
    expect(agg.motion['jerks']).toBe(0);
    expect(agg.checks['CHK-027'].result).toBe('PASS');
    expect(agg.checks['CHK-027']).toHaveProperty('note');
  });

  it('shows, per chapter, how many jerks were under the wash, the frame rate the chapter ran at, and whether the dedicated harness ran it (PR-0450 d)', () => {
    const fa: ChapterResult = { ...chapter('ffx2-fallen-aeons', 0, 4, 967.7), probe: { fps: 59.6 }, dedicated: true };
    const inline: ChapterResult = { ...chapter('seymour-flux', 0, 0, 0), probe: { fps: 46 } }; // an older file: no `dedicated`
    const rows = aggregate([fa, inline, { chapter: 'broken', summary: null }], CFG).chapters;
    expect(rows.map((r) => [r.chapter, r.jerksCovered, r.fps, r.dedicated])).toEqual([['ffx2-fallen-aeons', 4, 59.6, true], ['seymour-flux', 0, 46, null], ['broken', 0, null, null]]);
  });

  it('prints one report line: the chapters, the battle, the frame rates, how many the dedicated harness ran, both verdicts with their reasons, and the jerks the wash covered (PR-0450)', () => {
    const rows: ChapterResult[] = [{ ...chapter('ffx2-fallen-aeons', 0, 4, 967.7), probe: { fps: 59.6 }, dedicated: true }, { ...chapter('seymour-flux', 1, 0, 0), probe: { fps: 46 }, dedicated: true }];
    const line = aggregate(rows, CFG).reportLine;
    expect(line).not.toContain('\n');
    expect(line).toContain('continuity harness (CHK-026/CHK-027): 2 chapter(s), 600 s of battle, 46 to 59.6 fps, 2 of 2 run by the dedicated harness');
    expect(line).toContain('CHK-026 PASS;');
    expect(line).toContain('CHK-027 FAIL (1 jerk(s) of 40 px or more in one frame (worst 50 px))');
    expect(line).toContain("4 jerk(s) (worst 967.7 px) under the Save Sphere's wash are not counted");
    expect(line).not.toContain('not scored');
  });

  it('says so when a chapter was not run by the dedicated harness (an older file, or a failed run), and when no frame rate was read', () => {
    const line = aggregate([{ ...chapter('seymour-flux', 0, 0, 0), probe: { fps: 59 } }, { chapter: 'broken', summary: null }], CFG).reportLine;
    expect(line).toContain('0 of 2 run by the dedicated harness');
    expect(line).toContain('2 chapter(s) were not run by the dedicated harness (no marker: an older file or a failed run), so their numbers are not scored');
    expect(line).toContain('59 to 59 fps');
    expect(continuityReportLine({ battleSeconds: 0, checks: {} })).toBe('continuity harness (CHK-026/CHK-027): 0 chapter(s), 0 s of battle, frame rate not read, 0 of 0 run by the dedicated harness; CHK-026 not read; CHK-027 not read');
  });

  it('counts a chapter summarised before the edit as having none', () => {
    const old = chapter('seymour-flux', 1, 0, 0);
    delete (old.summary!['motion'] as Record<string, unknown>)['jerksCovered'];
    delete (old.summary!['motion'] as Record<string, unknown>)['worstCoveredJerkPx'];
    const agg = aggregate([old], CFG);
    expect(agg.motion['jerksCovered']).toBe(0);
    expect(agg.checks['CHK-027'].result).toBe('FAIL');
  });
});

// ================================================================== the page the probe reads

describe('the DOM the wash probe reads, pinned to the card\'s source', () => {
  const card = read('src/app/screens/SaveSphereCard.ts');
  const css = read('src/app/screens/save-sphere-card.css');
  const WHY = 'rename it in critic/policy.json continuity.wash.selector and critic/runner/lib/continuity-wash.mjs too (docs/handoff/r41-aeonjump.md says what the probe reads)';

  it('the card is data-testid save-sphere and holds a .ssphere__wash', () => {
    expect(card, `data-testid: ${WHY}`).toMatch(/el\.dataset\['testid'\] = 'save-sphere';/);
    expect(card, `.ssphere__wash: ${WHY}`).toContain('<div class="ssphere__wash"></div>');
    expect(WASH_SELECTOR).toBe('[data-testid="save-sphere"] .ssphere__wash');
  });

  it('the wash is the whole frame, rgba(246, 240, 250, 0.74), and its opacity goes 0 to 1 by a transition the probe can read mid-way', () => {
    const wash = /\.ssphere__wash \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(wash, `the wash rule: ${WHY}`).toMatch(/inset: 0;/);
    expect(wash, `the veil's alpha is what ALPHA in this test and the probe's meta.wash.alpha say: ${WHY}`).toMatch(/background: rgba\(246, 240, 250, 0\.74\);/);
    expect(wash).toMatch(/opacity: 0;/);
    expect(wash).toMatch(/transition: opacity 520ms/);
    expect(css).toMatch(/\.ssphere--in \.ssphere__wash \{\s*opacity: 1;/);
    expect(css).toMatch(/\.ssphere--out \.ssphere__wash/);
  });

  it('the card is a child of the battle screen\'s root, so the battle stays the top screen and the probe keeps sampling while it shows', () => {
    expect(card).toMatch(/opts\.root\.appendChild\(el\);/);
    expect(read('src/app/screens/BattleScreen.ts')).toMatch(/playSaveSphereCard\(\{\s*root: this\.root,/); // the battle screen's own root, not a new screen on the stack
    expect(read('src/app/screens/BattleEncounterChain.ts')).toMatch(/await opts\.saveSphere\(async \(\) => \{/); // the next link is restaged inside the card's swap, under the wash
  });

  it('the probe and the analysis know the policy name of the switch', () => {
    expect(read('critic/runner/lib/continuity-probe.mjs')).toContain('cfg.washSelector');
    expect(read('critic/runner/lib/continuity.mjs')).toContain('washSelector: washPolicy(cfg).selector');
    expect(read('critic/runner/lib/continuity-analyze.mjs')).toContain('tagWash(jerks, { records, alpha: meta.wash?.alpha ?? null, policy: wash })');
  });
});
