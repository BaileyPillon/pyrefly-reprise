/**
 * What the continuity harness does with a RIGGED figure's recording (`critic/runner/lib/continuity-rig.mjs`, reached through `analyzeRun`; R57-002 of the release 57 focused review): a change of
 * the rig's key is a swap, its head, feet and centroid are tracked on every frame like a painted figure's, and CHK-026 and CHK-027 judge them. Every recording here is synthetic: an aeon whose
 * idle plane is 400 x 600 px on the canvas, moving between three keys (idle, hurt, ko) with the head, feet and centroid where the test puts them in the plane's own coordinates. Nothing opens a
 * browser, and a painted figure's recording is untouched (`critic-continuity-analyze.test.ts` and the pose tests hold that).
 *
 * Game case: both (shared critic plumbing; the rigs it reads are FFX's Kimahri, Lulu and aeons and Valefor, which FFX-2's Besaid chapter shares).
 */
import { describe, expect, it } from 'vitest';
import { analyzeRun } from '../../critic/runner/lib/continuity-analyze.mjs';
import { continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import { analyzeRigSwap, bodyOf, idleBodyOf, rigConfig, rigProbeConfig, rigTrack } from '../../critic/runner/lib/continuity-rig.mjs';
import type { RigRecord } from '../../critic/runner/lib/continuity-rig.mjs';
import type { ProbeFrame, ProbeMeta } from '../../critic/runner/lib/continuity-probe.mjs';
import type { PoseMeasure } from '../../critic/runner/lib/continuity-silhouette.mjs';

const CFG = continuityConfig();
const FRAME_MS = 1000 / 60;
const PW = 400, PH = 600, X0 = 200, Y0 = 100; // the idle plane on the canvas

interface Key { hu: [number, number]; fu: [number, number]; cu: [number, number]; ha: number; ma: number; bh: number; bw: number; hv?: string; tu?: [number, number] }
/** The three keys of the test rig, in the plane's own coordinates. The head part is 0.01 of the plane, the box of the idle is 0.9 of the plane's height. */
const KEYS: Record<string, Key> = {
  idle: { hu: [0.5, 0.12], fu: [0.5, 1], cu: [0.5, 0.5], ha: 0.01, ma: 0.5, bh: 0.9, bw: 0.45 },
  hurt: { hu: [0.46, 0.15], fu: [0.5, 1], cu: [0.48, 0.52], ha: 0.01, ma: 0.5, bh: 0.88, bw: 0.45 },
  ko: { hu: [0.3, 0.7], fu: [0.45, 0.99], cu: [0.5, 0.78], ha: 0.01, ma: 0.5, bh: 0.5, bw: 0.9 },
};
const NAMES = ['idle', 'hurt', 'ko'];
const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
const mix2 = (a: [number, number], b: [number, number], t: number): [number, number] => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
const screen = (u: [number, number]): [number, number] => [X0 + u[0] * PW, Y0 + u[1] * PH];

interface Change { n: number; to: string; frames?: number; jump?: boolean }

/** A recording of one rigged figure: it starts on its idle and moves to `to` at frame `n` over `frames` frames (8 by default; `jump` cuts there in one frame). */
function build(changes: Change[], opts: { total?: number; seconds?: number; keys?: Partial<Record<string, Partial<Key>>> } = {}): { meta: ProbeMeta; records: ProbeFrame[] } {
  const total = opts.total ?? (changes.at(-1)!.n + 60);
  const keyOf = (name: string): Key => ({ ...KEYS[name]!, ...opts.keys?.[name] }); // a key the test makes wrong is wrong wherever the figure meets it
  const meta: ProbeMeta = {
    version: 2, figs: [{ id: 'valefor', side: 'party', kind: 'party', artId: 'valefor', rig: 'valefor' }],
    poses: NAMES.map((pose) => ({ fig: 0, pose, url: null, w: 0, h: 0, rig: 'valefor' })),
    swaps: [], logEvents: [], view: [0, 0, 1600, 900], errors: [],
    stats: { frames: total, battleFrames: total, battleSeconds: opts.seconds ?? 120, maxDtMs: 20, slowFrames: 0, fps: 59, copyMsMean: 0.03 }, strips: [],
  };
  const records: ProbeFrame[] = [];
  let from = 'idle', fromKey = keyOf('idle'), to = 'idle', toKey = keyOf('idle'), start = -1, len = 1;
  const pending = [...changes];
  for (let n = 0; n < total; n++) {
    if (pending[0] && pending[0].n === n) {
      const c = pending.shift()!;
      // the key the figure was moving to is where the next move starts from only when it had settled; an interrupted move starts from where it was (kept simple: from the last target)
      from = to; fromKey = toKey; to = c.to; toKey = keyOf(c.to);
      meta.swaps.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, i: 0, from: NAMES.indexOf(from), to: NAMES.indexOf(to), a: 1, rig: 1 });
      start = n; len = c.jump ? 0 : c.frames ?? 8;
    }
    const k = len === 0 ? 1 : Math.min(1, (n - start + 1) / len);
    const t = k * k * (3 - 2 * k);
    const moving = start >= 0 && len > 0 && n - start + 1 < len + 1 && k < 1;
    const A = start >= 0 ? fromKey : toKey, B = toKey;
    const hu = mix2(A.hu, B.hu, t), fu = mix2(A.fu, B.fu, t), cu = mix2(A.cu, B.cu, t);
    const h = screen(hu), f = screen(fu), c = screen(cu);
    const bh = mix(A.bh, B.bh, t), bw = mix(A.bw, B.bw, t);
    const hv = (t >= 0.5 ? B : A).hv; // a part a key brings in shows at the half way point of the move into the key (RigPartState)
    const rg: RigRecord = { b: moving ? 1 : 0, h, f, c, hu, fu, cu, ...(A.tu && B.tu ? { tu: mix2(A.tu, B.tu, t) } : {}), ha: mix(A.ha, B.ha, t), ma: mix(A.ma, B.ma, t), ...(hv ? { hv } : {}), bh, bw, pw: PW, ph: PH };
    const top = Y0 + PH * (fu[1] - bh), left = X0 + PW * (fu[0] - bw / 2), right = left + PW * bw, bottom = Y0 + PH * fu[1];
    const sa = [NAMES.indexOf(to), 1, 1, left, top, right, top, right, bottom, left, bottom];
    records.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, f: [{ i: 0, a: 1, act: 0, s: [sa, 0], g: [0, 0], rg }] });
  }
  return { meta, records };
}

/** `count` cycles of idle to hurt and back, 40 frames apart. */
const cycles = (count: number): Change[] => {
  const out: Change[] = [];
  for (let i = 0; i < count; i++) out.push({ n: 20 + 80 * i, to: 'hurt' }, { n: 60 + 80 * i, to: 'idle' });
  return out;
};

const run = (b: { meta: ProbeMeta; records: ProbeFrame[] }, cfg = CFG, measure: PoseMeasure | null = null) => analyzeRun({ meta: b.meta, records: b.records, anchors: b.meta.poses.map(() => null), cfg, measure });

describe('a rigged figure\'s changes of key are swaps', () => {
  const r = run(build(cycles(5)));

  it('counts every change of key, names the keys and reads each one to where the move settled', () => {
    expect(r.swaps).toHaveLength(10);
    expect(r.swaps.every((s) => s.counted && !s.notShowing)).toBe(true);
    expect(r.swaps.map((s) => `${s.fromPose}>${s.toPose}`).slice(0, 3)).toEqual(['idle>hurt', 'hurt>idle', 'idle>hurt']);
    expect(r.swaps[0]!.rig).toMatchObject({ name: 'valefor', settled: true, headMetric: 'head' });
    expect(r.swaps[0]!.blendFrames).toBe(7); // the move is in flight for the frames from the change to the one that settles it
    expect(r.swaps[0]!.hardCut).toBe(false);
  });

  it('judges a good rig at the registered tolerances and passes CHK-026 and CHK-027, having measured them', () => {
    expect(r.swaps[0]!.head).toMatchObject({ ratio: 1, source: 'rig', metric: 'head', label: 'rig' });
    expect(r.swaps[0]!.feet).toMatchObject({ standing: true, source: 'rig', gate: 'dy', px: 0 });
    expect(r.summary.size.headMeasured).toBe(10);
    expect(r.summary.size.headRig).toBe(10);
    expect(r.summary.size.feetMeasured).toBe(10);
    expect(r.summary.size.heightMeasured).toBe(10);
    expect(r.summary.checks['CHK-026'].result).toBe('PASS');
    expect(r.summary.checks['CHK-026'].note).toMatch(/10 were read from a rig's own head mesh/);
    expect(r.summary.checks['CHK-027'].result).toBe('PASS');
    expect(r.coverage.rigs).toEqual([{ figure: 'valefor', rig: 'valefor', keys: ['idle', 'hurt', 'ko'], swaps: 10, counted: 10, settled: 10, headMeasured: 10, feetMeasured: 10 }]);
    expect(r.coverage.measuredFromRig).toEqual(['valefor']);
  });

  it('follows the figure frame by frame: the head, the feet and the centroid as drawn, and the camera shift of each', () => {
    const t = r.access.trackAt(0, 5)!;
    expect(t.head).toEqual([400, 172]); // idle: 200 + 0.5 x 400, 100 + 0.12 x 600
    expect(t.feet).toEqual([400, 700]);
    expect(t.centroid).toEqual([400, 400]);
    expect(rigTrack({ ...({} as RigRecord), f: [1, 2], h: null, c: null, cs: [1, 2, 3, 4, 5, 6] })).toEqual({ feet: [1, 2], head: null, centroid: null, cams: { head: null, feet: [3, 4], centroid: null } });
    expect(rigTrack(undefined)).toBeNull();
  });
});

// R59, decision 146 (both games, review tooling): Lulu's defend and od-fury keys bring in a front-view upper body in front of the side head and shrink the side head to 0.8, so the head part's mesh read
// 0.80 going in and 1.25 coming out, a 25 percent head jump that nobody sees: the head the player sees is the front view's, whose size the painting's registration gives.
describe('a key that brings in another head (a front view) is judged by the head the player sees, not by the head part\'s mesh', () => {
  /** The key hurt stands for the front-view key: its head part shrinks to 0.8 linear (0.64 of the area) and the named variant part is drawn. */
  const front = (hv: string | undefined): Parameters<typeof build>[1] => ({ keys: { hurt: { ha: 0.0064, ...(hv ? { hv } : {}) } } });
  const registered = (headRatio: number | null): PoseMeasure => ({ path: 'x', sha256: 'x', count: 1, subjects: { valefor: { poses: headRatio === null ? {} : { hurt: { ruled: { headRatio } } } } } });

  it('reads the earlier way, a 25 percent head jump, when no part is named as the other head (the control: what the release 58 harness said of Lulu)', () => {
    const r = run(build(cycles(5), front(undefined)));
    expect(r.swaps[0]!.head).toMatchObject({ metric: 'head', ratio: 0.8 });
    expect(r.swaps[1]!.head).toMatchObject({ metric: 'head', ratio: 1.25 });
    expect(r.swaps.every((s) => s.failHead)).toBe(true);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
  });

  it('does not compare the head part\'s mesh across the change; the real head from the registration, inside the class band, passes', () => {
    const r = run(build(cycles(5), front('front')), CFG, registered(0.959));
    expect(r.swaps).toHaveLength(10);
    for (const s of r.swaps) {
      expect(s.rig).toMatchObject({ settled: true, headMetric: 'variant' });
      expect(s.head).toMatchObject({ metric: 'variant', ratio: null, label: 'front view' });
      expect(s.headReal).toMatchObject({ ratio: 0.959, band: [0.85, 1.15], outsideBand: false, source: 'registration' });
      expect(s.failHead).toBe(false);
      expect(s.failRealHead).toBe(false);
    }
    expect(r.summary.size.headOverTolerance).toBe(0);
    expect(r.summary.size.variantHeadSwaps).toBe(10);
    expect(r.summary.size.variantHeadOutsideBand).toBe(0);
    expect(r.summary.size.headMeasured).toBe(0); // no mesh ratio was read for any of the ten
    expect(r.summary.checks['CHK-026'].result).toBe('PASS');
    expect(r.coverage.rigs).toEqual([expect.objectContaining({ swaps: 10, counted: 10, headMeasured: 10 })]); // the swaps are measured: each has a head reading, of the other kind
  });

  it('fails the change when the head the registration gives the key is outside the class band, and says which kind of head it is', () => {
    const r = run(build(cycles(5), front('front')), CFG, registered(0.7));
    expect(r.swaps.every((s) => s.failRealHead && s.headReal!.outsideBand)).toBe(true);
    expect(r.summary.size.variantHeadOutsideBand).toBe(10);
    expect(r.summary.size.realHeadOutsideBand).toBe(0); // a recorded hold's count is its own
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
    expect(r.summary.checks['CHK-026'].reasons.join(' ')).toMatch(/10 rig swap\(s\) bring in another head \(a front view\) whose real head is outside its pose class's band/);
  });

  it('shows the change and judges nothing about the head when the registration has no record of the key', () => {
    for (const measure of [null, registered(null)]) {
      const r = run(build(cycles(5), front('front')), CFG, measure);
      expect(r.swaps.every((s) => s.head!.metric === 'variant' && s.head!.ratio === null && s.headReal === null && !s.failHead && !s.failRealHead)).toBe(true);
      expect(r.summary.checks['CHK-026'].result).toBe('PASS');
    }
  });

  it('still fails what the head swap does not hide: a front-view key drawn at two thirds of the idle\'s height; and a head part shrunk with no other head drawn is still read as a mesh', () => {
    const tall = run(build(cycles(5), { keys: { hurt: { ha: 0.0064, hv: 'front', bh: 0.6 } } }), CFG, registered(0.959));
    expect(tall.swaps.every((s) => s.failHeight && !s.failHead)).toBe(true);
    expect(tall.summary.checks['CHK-026'].result).toBe('FAIL');
    const plain = run(build(cycles(5), { keys: { hurt: { ha: 0.0064 } } }), CFG, registered(0.959)); // no variant part drawn: the mesh is read as before
    expect(plain.swaps.every((s) => s.head!.metric === 'head' && s.failHead)).toBe(true);
  });

  it('asks the page-side reader for the variant parts by name and the size at which one counts as drawn', () => {
    expect(rigProbeConfig(CFG)).toMatchObject({ headVariants: ['front', 'fdef', 'fod'], variantMinArea: 0.02 });
    expect(rigConfig({ ...CFG, rig: { headVariants: ['mask'] } })).toMatchObject({ headVariants: ['mask'], headPart: 'head' });
  });
});

describe('what a painted figure\'s checks would have missed in a rig', () => {
  const ko = (): Change[] => [...cycles(5), { n: 420, to: 'ko', frames: 14 }];

  it('sees a rigged knock-out that shrinks the head, and fails CHK-026 for it (the R57 gap: no swap, so no reading)', () => {
    const r = run(build(ko(), { keys: { ko: { ha: 0.0075 } } }));
    const s = r.swaps.find((x) => x.toPose === 'ko')!;
    expect(s.head!.ratio).toBeCloseTo(0.866, 3); // the square root of 0.75: a head a seventh smaller
    expect(s.failHead).toBe(true);
    expect(r.summary.size.headOverTolerance).toBe(1);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
    expect(r.summary.checks['CHK-026'].reasons.join(' ')).toMatch(/1 swap\(s\) change a head by more than the tolerance/);
    expect(r.worst.swaps[0]).toBe(s.id); // the first strip a reviewer opens
  });

  it('passes a knock-out that keeps the head, whatever it does to the lying figure\'s box (its length is report-only)', () => {
    const r = run(build(ko()));
    const s = r.swaps.find((x) => x.toPose === 'ko')!;
    expect(s.head!.ratio).toBe(1);
    expect(s.feet).toMatchObject({ standing: false }); // a lying figure's feet are shown, not judged
    expect(s.failFeet).toBe(false);
    expect(s.height).toMatchObject({ vs: 'idle', pose: 'ko', class: 'ko', length: 1, flags: [] });
    expect(r.summary.checks['CHK-026'].result).toBe('PASS');
  });

  it('reads the whole figure where a key hides the head part', () => {
    const r = run(build(ko(), { keys: { ko: { ha: 0, ma: 0.3 } } }));
    const s = r.swaps.find((x) => x.toPose === 'ko')!;
    expect(s.head).toMatchObject({ metric: 'mass', label: 'mass', source: 'rig' });
    expect(s.head!.ratio).toBeCloseTo(Math.sqrt(0.3 / 0.5), 3);
    expect(s.failHead).toBe(false); // the whole figure is judged at the coarse tolerance: 22.5 percent is inside 30
  });

  it('fails a planted key whose feet are off the ground line by more than 2 percent of the figure, and shows the sideways gap without judging it', () => {
    const r = run(build(cycles(5), { keys: { hurt: { fu: [0.8, 1.04] } } }));
    const s = r.swaps.find((x) => x.toPose === 'hurt')!;
    expect(s.feet!.dy).toBeCloseTo(24, 1); // 0.04 of the plane's 600 px
    expect(s.feet!.sidewaysPx).toBeCloseTo(120, 1);
    expect(s.feet!.gatePx).toBeCloseTo(24, 1); // only the ground line judges: the lowest foot is another foot in another key
    expect(s.failFeet).toBe(true);
    expect(r.summary.size.feetOverTolerance).toBe(10); // the key is wrong going there and coming back
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
  });

  it('fails a standing pose drawn at two thirds of the idle\'s height, the Lulu case, read from the key\'s own box', () => {
    const r = run(build(cycles(5), { keys: { hurt: { bh: 0.6 } } }));
    const s = r.swaps.find((x) => x.toPose === 'hurt')!;
    expect(s.height!.stature).toBeCloseTo(0.6667, 3);
    expect(s.height!.flags).toEqual(['stature-low']);
    expect(s.failHeight).toBe(true);
    expect(r.summary.size.heightOverBand).toBe(10);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
  });

  it('counts a cut that jumps the figure in one frame as a snap and a jerk at the swap (CHK-027), which a smooth move is not', () => {
    const r = run(build([...cycles(4), { n: 340, to: 'ko', jump: true }, { n: 400, to: 'idle', frames: 10 }]));
    const s = r.swaps.find((x) => x.toPose === 'ko')!;
    expect(s.hardCut).toBe(true);
    expect(s.snap).toBe(true);
    expect(s.rig!.cutJumpPx).toBeGreaterThan(100);
    expect(r.jerks.some((j) => j.atSwap && j.px > 100)).toBe(true);
    expect(r.summary.motion.snaps).toBe(1);
    expect(r.summary.motion.swapJerksWorstPx).toBeGreaterThan(100);
    expect(r.summary.checks['CHK-027'].result).toBe('FAIL');
  });

  it('does not read the feet of a change that another change interrupted, and says it never settled', () => {
    const r = run(build([...cycles(4), { n: 340, to: 'hurt', frames: 12 }, { n: 345, to: 'idle', frames: 12 }]));
    const s = r.swaps.find((x) => x.n === 340)!;
    expect(s.rig).toMatchObject({ settled: false, framesToSettle: null });
    expect(s.feet).toBeNull();
    expect(s.head).not.toBeNull(); // the head is never resized by a move, so it is still read
  });

  it('gives the earlier reading back when the policy switches rig reading off', () => {
    expect(rigConfig({ ...CFG, rig: false })).toBeNull();
    expect(rigProbeConfig({ ...CFG, rig: false })).toBeNull();
    expect(rigProbeConfig(CFG)).toMatchObject({ head: expect.arrayContaining(['head']), headPart: 'head' });
    expect(rigProbeConfig(CFG), 'the crown landmark reaches the page-side reader: without it every swap is read by its painted box again (review m2, mutant N19)').toMatchObject({ crown: ['crown', 'headTop'] });
    expect(rigProbeConfig({ ...CFG, rig: { crown: ['topknot'] } })).toMatchObject({ crown: ['topknot'] });
    const off = run(build(ko(), { keys: { ko: { ha: 0.0075 } } }), { ...CFG, rig: false });
    expect(off.swaps).toHaveLength(0);
    expect(off.summary.checks['CHK-026'].result).toBe('UNVERIFIED'); // nothing was measured: the earlier reading of a rig, which never showed a swap
  });
});

// rigs-v3 (2026-10-29; both games, shared critic plumbing; the rigs it reaches are Tidus FFX and Rikku's Dark Knight FFX-2, behind `?partyrigs=`): the harness read a rig's stature from the key's WHOLE painted box over the idle's (`rg.bh`), props
// included, and failed CHK-026 on rig runs the painting control passed (Rikku's cast, her greatsword raised above her head, read 1.19 by the box and 0.98 head to soles; ch4: 23 swaps out of band, ch1: 6, the painting controls 0 and 1). A rig that
// has a crown landmark is now read as a painted figure is: from the crown of the head to the stamped foot, in the idle plane's own units, over the idle's the same way.
describe('a rig with a crown landmark is read head to soles, as a painted figure is (rigs-v3)', () => {
  const idleTu: [number, number] = [0.5, 0.1]; // the idle's body is 1 - 0.1 = 0.9 of the plane
  const withCrown = (hurt: Partial<Key>): Parameters<typeof build>[1] => ({ keys: { idle: { tu: idleTu }, hurt: { tu: [0.46, 0.14], ...hurt } } });

  it('a raised weapon makes the box 1.2 times the idle\'s and the stature 0.96: the box reading fails it (the control), the body reading passes it and says how it read', () => {
    const control = run(build(cycles(5), { keys: { hurt: { bh: 1.08 } } }));
    expect(control.swaps.find((x) => x.toPose === 'hurt')!.height!.flags).toEqual(['stature-high']);
    expect(control.summary.checks['CHK-026'].result).toBe('FAIL');
    const r = run(build(cycles(5), withCrown({ bh: 1.08 })));
    const s = r.swaps.find((x) => x.toPose === 'hurt')!;
    expect(s.height).toMatchObject({ vs: 'idle', pose: 'hurt', class: 'standing', basis: 'body', flags: [] });
    expect(s.height!.stature).toBeCloseTo(0.86 / 0.9, 3);
    expect(s.failHeight).toBe(false);
    expect(r.summary.checks['CHK-026'].result).toBe('PASS');
  });

  it('a figure that really is short is still caught, whatever its box says: the body is the judge (stature 0.67, band 0.90 to 1.10)', () => {
    const r = run(build(cycles(5), withCrown({ tu: [0.46, 0.4], bh: 0.9 })));
    const s = r.swaps.find((x) => x.toPose === 'hurt')!;
    expect(s.height!.stature).toBeCloseTo(0.6667, 3);
    expect(s.height!.flags).toEqual(['stature-low']);
    expect(s.failHeight).toBe(true);
  });

  it('a rig with no crown reading (a recording from before, a rig with no crown landmark) is read by its box exactly as it was', () => {
    const r = run(build(cycles(5), { keys: { hurt: { bh: 0.6 } } }));
    const s = r.swaps.find((x) => x.toPose === 'hurt')!;
    expect(s.height!.stature).toBeCloseTo(0.6667, 3);
    expect(s.height!.basis).toBeUndefined();
  });

  it('bodyOf is the foot minus the crown in the plane\'s own units and null without both; idleBodyOf is the median over the idle frames in which no move was in flight', () => {
    expect(bodyOf({ fu: [0.5, 1], tu: [0.5, 0.1] })).toBeCloseTo(0.9, 12);
    expect(bodyOf({ fu: [0.5, 1] })).toBeNull();
    expect(bodyOf({ fu: [0.5, 0.1], tu: [0.5, 0.5] })).toBeNull(); // a crown below the foot is not a figure
    const poses = [{ pose: 'idle', fig: 0 }, { pose: 'hurt', fig: 0 }];
    const fr = (k: number, rg: object) => ({ n: 0, t: 0, fig: { s: [[k]], rg } });
    const list = [fr(0, { b: 0, fu: [0.5, 1], tu: [0.5, 0.1] }), fr(0, { b: 0, fu: [0.5, 1], tu: [0.5, 0.12] }), fr(0, { b: 0, fu: [0.5, 1], tu: [0.5, 0.11] }), fr(0, { b: 1, fu: [0.5, 1], tu: [0.5, 0.5] }), fr(1, { b: 0, fu: [0.5, 1], tu: [0.5, 0.6] })];
    expect(idleBodyOf(list as never, poses as never, 0)).toBeCloseTo(0.89, 12);
    expect(idleBodyOf([fr(0, { b: 0, fu: [0.5, 1] })] as never, poses as never, 0)).toBeNull();
  });

  it('a pose with props out (defend, victory) is judged head to soles too instead of being left unread, and is read as before without a crown', () => {
    const rgOf = (tu: number | null, bh: number) => ({ b: 0, h: [400, 170], f: [400, 700], c: [400, 400], hu: [0.5, 0.12], fu: [0.5, 1], cu: [0.5, 0.5], ...(tu === null ? {} : { tu: [0.5, tu] }), ha: 0.01, ma: 0.5, bh, bw: 0.45, pw: PW, ph: PH });
    const frames = (tu: number | null) => [0, 1, 2, 3, 4].map((n) => ({ n, t: n * FRAME_MS, fig: { rg: n < 2 ? rgOf(tu === null ? null : 0.1, 0.9) : rgOf(tu, 1.2) } }));
    const call = (tu: number | null, idleBody: number | null) => analyzeRigSwap({ frames: frames(tu) as never, at: 2, from: { pose: 'idle', rig: 'valefor' } as never, to: { pose: 'defend', rig: 'valefor' } as never, idleBh: 0.9, idleBody, k1600: 1, camCut: false, cfg: CFG });
    const body = call(0.12, 0.9);
    expect(body.height).toMatchObject({ basis: 'body', flags: [], report: [] });
    expect(body.height!.stature).toBeCloseTo(0.88 / 0.9, 3);
    const box = call(null, null);
    expect(box.height!.report).toEqual(['props-out-unread']);
    expect(box.height!.stature).toBeNull();
  });
});
