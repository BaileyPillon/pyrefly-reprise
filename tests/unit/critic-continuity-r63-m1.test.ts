/**
 * R63-M1 and R63-T1 (the release 63 focused review, traced 2026-10-24; shared critic plumbing, both games): what the continuity harness read of Chapter I that was not a pose defect.
 *   - UNSEEN: a figure off the view (Kimahri's knock-out under the frame, Yuna behind the lens in Auron's close-up) cannot be seen to jerk or to snap: 603 px, 1,132 px and 40,092 px "teleports";
 *   - ELASTIC: a planned smear whose flip landed late because the frames before it were long (a painting's first upload) is still that planned smear, not a snap;
 *   - THE SIZE OF THE STEP: a planned cut is excused up to half the figure's drawn height (the pro camera's push-in magnifies it), not 120 px;
 *   - COMMON MODE: the first frames of a lunge fall inside a blended swap by design; the figure travelling is a dash, a hard cut that moves the whole figure is still the swap's;
 *   - T1: a CRLF worktree reads its own pose table.
 * Nothing opens a browser: the recordings are drawn here (`critic-continuity-pose-fixtures.ts`).
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import { detectJerks } from '../../critic/runner/lib/continuity-pure.mjs';
import { loadPoseMeasure } from '../../critic/runner/lib/continuity-silhouette.mjs';
import { SMEAR_DEFAULTS, figureHeightPx, matchSmear, smearCapPx, smearPolicy, smearedJerk, type LoggedSmear } from '../../critic/runner/lib/continuity-smear.mjs';
import { candidateTableAt, judgeTable, tableSha256 } from '../../critic/runner/lib/continuity-table.mjs';
import { UNSEEN_DEFAULTS, unseenIn, unseenPolicy } from '../../critic/runner/lib/continuity-unseen.mjs';
import type { ContinuityConfig } from '../../critic/runner/lib/continuity-pure.mjs';
import { CFG, FRAME_MS, IDLE_HEAD, SOLE, build, measureOf, quad, rec, run } from './critic-continuity-pose-fixtures.ts';

vi.setConfig({ testTimeout: 60_000 });
const ROOT = resolve(__dirname, '..', '..');
const VIEW = [0, 0, 1600, 900];
const plane = (q: number[], fade = 1): number[] => [0, fade, 1, ...q];
const rect = (x: number, y: number, w: number, h: number): number[] => [x, y, x + w, y, x + w, y + h, x, y + h];

describe('R63-M1 unseen: is the figure on the view', () => {
  it('a figure with a plane on the view is seen, whatever the rest do', () => {
    expect(unseenIn({ s: [plane(rect(600, 200, 300, 500))] }, VIEW)).toBe(false);
    expect(unseenIn({ s: [plane(rect(-1000, 5000, 300, 500)), plane(rect(600, 200, 300, 500), 0.2)] }, VIEW)).toBe(false);
  });
  it('a plane under the frame or far beside it is unseen (Kimahri\'s knock-out at 28 s, Yuna in the victory close-up)', () => {
    expect(unseenIn({ s: [plane(rect(700, 880, 300, 229))] }, VIEW)).toBe(true); // top at y 880 of 900: a sliver of the box, under a tenth of it
    expect(unseenIn({ s: [plane(rect(700, 834, 300, 229))] }, VIEW)).toBe(false); // a quarter of it is on the view
    expect(unseenIn({ s: [plane(rect(-4000, -13000, 600, 6500))] }, VIEW)).toBe(true);
  });
  it('a close-up is seen as soon as a tenth of the view is under the plane', () => {
    expect(unseenIn({ s: [plane(rect(-300, -400, 2200, 1700))] }, VIEW)).toBe(false);
    expect(unseenIn({ s: [plane(rect(1500, 0, 3000, 3000))] }, VIEW)).toBe(true); // 100 px of the view's 1600
  });
  it('a plane through the lens (a box many views wide whose edges the projection threw out) is no figure on the view', () => {
    const lens = [-1605, -3450, -252, 1388, -9777, -32081, 238, 3086]; // Yuna, 69 s: 5,000 px across at the top, 36,000 at the bottom
    expect(unseenIn({ s: [plane(lens)] }, VIEW)).toBe(true);
    expect(unseenIn({ s: [plane(lens)] }, VIEW, { maxBoxViews: 1e9 })).toBe(false); // the earlier reading: its box covers the view
  });
  it('a faint plane counts only above the fade floor, and a figure with nothing drawn is not called unseen (it has no track either)', () => {
    expect(unseenIn({ s: [plane(rect(600, 200, 300, 500), 0.01), plane(rect(5000, 5000, 100, 100))] }, VIEW)).toBe(true);
    expect(unseenIn({ s: [0, 0] }, VIEW)).toBe(false);
    expect(unseenIn({ s: [plane(rect(600, 200, 300, 500), 0)] }, VIEW)).toBe(false);
    expect(unseenIn(null, VIEW)).toBe(false);
    expect(unseenIn({ s: [plane(rect(5000, 5000, 100, 100))] }, [0, 0, 0, 0])).toBe(false);
  });
  it('a rig is read by its tracked points', () => {
    expect(unseenIn({ s: [], rg: { h: [800, 100], f: [800, 700], c: [800, 400] } }, VIEW)).toBe(false);
    expect(unseenIn({ s: [], rg: { h: [800, 1100], f: [800, 1700], c: [800, 1400] } }, VIEW)).toBe(true);
    expect(unseenIn({ s: [], rg: { h: [800, 1100], f: [800, 700] } }, VIEW)).toBe(false); // the feet are on
    expect(unseenIn({ s: [], rg: {} }, VIEW)).toBe(false);
  });
  it('the policy is on by default and `excuse: false` gives the earlier reading back', () => {
    expect(unseenPolicy(undefined)).toMatchObject({ excuse: true, minShare: UNSEEN_DEFAULTS.minShare });
    expect(unseenPolicy({ unseen: { excuse: false } }).excuse).toBe(false);
    expect(unseenPolicy(CFG)).toMatchObject({ excuse: true, maxBoxViews: 16 });
  });
});

describe('R63-M1 unseen: what it removes from CHK-027, and no more', () => {
  const sample = (n: number, x: number, y: number, unseen = false) => ({ n, t: n * FRAME_MS, feet: [x, y + 300] as [number, number], head: [x, y] as [number, number], centroid: null, cam: [0, 0] as [number, number], unseen });
  const still = (n: number, y: number, unseen: boolean) => sample(n, 800, y, unseen);
  const track = (ys: Array<[number, boolean]>) => ys.map(([y, u], i) => still(i, y, u));

  it('a 600 px step with the figure off the view in both frames is not read; with one end on the view it is a teleport', () => {
    const off = detectJerks(track([[5000, true], [5000, true], [5000, true], [5600, true], [5600, true], [5600, true]]), 1, CFG);
    expect(off).toEqual([]);
    const leaves = detectJerks(track([[400, false], [400, false], [400, false], [1000, true], [1000, true], [1000, true]]), 1, CFG);
    expect(leaves).toHaveLength(1);
    expect(leaves[0]!.px).toBeGreaterThan(500);
    const unmarked = detectJerks(track([[5000, false], [5000, false], [5000, false], [5600, false], [5600, false], [5600, false]]), 1, CFG);
    expect(unmarked).toHaveLength(1); // the earlier reading: nobody said it was off the view
  });

  it('end to end: a figure that sits far below the frame and jumps there is no jerk; the same jump on the view still is', async () => {
    const measure = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }) });
    const build1 = (dy: number, offAfter: boolean) => {
      const b = build('lulu', 'attack', quad(1, 100, SOLE, 400, 470), 4, { hard: true });
      for (const r of b.records) {
        const jump = r.n >= 60;
        const shift = offAfter ? 5000 + (jump ? dy : 0) : (jump ? dy : 0);
        for (const f of r.f) for (const s of f.s) if (Array.isArray(s)) for (let i = 4; i < 11; i += 2) s[i] = (s[i] as number) + shift;
      }
      return b;
    };
    const offScreen = await run('lulu', 'attack', build1(600, true), measure);
    expect(offScreen.r.jerks.filter((j) => j.px >= 300)).toEqual([]);
    expect(offScreen.r.summary.motion.teleports).toBe(0);
    const onView = await run('lulu', 'attack', build1(-400, false), measure); // 400 px up in one frame, on the view
    expect(onView.r.jerks.some((j) => j.px >= 300)).toBe(true);
    expect(onView.r.summary.motion.teleports).toBe(1);
    const earlier = await run('lulu', 'attack', build1(600, true), measure, { cfg: { ...CFG, unseen: { excuse: false } } as ContinuityConfig });
    expect(earlier.r.summary.motion.teleports).toBe(1); // `unseen.excuse: false` is the earlier harness
  });
});

describe('R63-M1 smear: an elastic window and the size of the step', () => {
  const entry = (over: Partial<LoggedSmear> = {}): LoggedSmear => ({ actor: 'hero', from: 'idle', to: 'hurt', style: 'paint', kind: 'plane', at: 1000, cutAt: 1019, cutMs: 38, overlap: 0.2, anchorDistance: 0.21, strength: 0.9, flash: false, ...over });
  const swap = (over: Record<string, unknown> = {}) => ({ id: 0, figure: 'hero', fromPose: 'idle', toPose: 'hurt', tMs: 1000, snap: true, ...over });
  const ON = smearPolicy({ smear: { excuse: true, elastic: true, maxJerkShare: 0.5 } });
  const OFF = smearPolicy({ smear: { excuse: true } });

  it('the flip lands as late as the stalls before it, and no later', () => {
    const edge = 1000 + 38 + 12 + 2 * (1000 / 60);
    expect(matchSmear(swap({ tMs: 1177 }), [entry()], OFF)).toBeNull(); // Tidus's idle to hurt at 195 s: 177 ms after its log entry
    expect(matchSmear(swap({ tMs: 1177, stallMs: 177 }), [entry()], ON)?.index).toBe(0);
    expect(matchSmear(swap({ tMs: 1177, stallMs: 177 }), [entry()], OFF)).toBeNull(); // the switch is the policy's
    expect(matchSmear(swap({ tMs: edge + 100, stallMs: 99 }), [entry()], ON)).toBeNull();
    expect(matchSmear(swap({ tMs: edge + 100, stallMs: 101 }), [entry()], ON)).not.toBeNull();
    expect(matchSmear(swap({ tMs: 1177, stallMs: 177, figure: 'villain' }), [entry()], ON)).toBeNull(); // the figure and the pair still have to match
    expect(matchSmear(swap({ tMs: 1177, stallMs: 177, toPose: 'follow' }), [entry()], ON)).toBeNull();
    expect(matchSmear(swap({ tMs: 700, stallMs: 400 }), [entry()], ON)).toBeNull(); // a stall never lets a flip come BEFORE its entry
  });

  it('a step AT a planned smear is excused up to the larger of maxJerkPx and a share of the drawn height', () => {
    const s = { ...swap(), smear: { style: 'paint', kind: 'plane' }, figurePx: 582 };
    expect(smearCapPx(s, ON)).toBeCloseTo(291, 5); // Tidus in the push-in: 0.5 of 582 px
    expect(smearCapPx(s, OFF)).toBe(SMEAR_DEFAULTS.maxJerkPx);
    expect(smearCapPx({ ...s, figurePx: 150 }, ON)).toBe(120); // a small or distant figure keeps the absolute floor
    expect(smearCapPx({ ...s, figurePx: null }, ON)).toBe(120);
    expect(smearedJerk({ px: 237.3 }, s, ON)).toMatchObject({ swap: 0, share: 0.408 });
    expect(smearedJerk({ px: 237.3 }, s, OFF)).toBeNull();
    expect(smearedJerk({ px: 292 }, s, ON)).toBeNull(); // over half the drawn height: not a cut the engine planned
    expect(smearedJerk({ px: 100 }, { ...swap(), figurePx: 582 }, ON)).toBeNull(); // no planned smear on this swap
  });

  it('figureHeightPx is the tallest plane that shows, top edge to bottom edge, at 1600 wide', () => {
    const fr = (s: unknown[]) => ({ fig: { s } });
    expect(figureHeightPx([fr([plane(rect(0, 100, 200, 400))])], 1)).toBeCloseTo(400, 5);
    expect(figureHeightPx([fr([plane(rect(0, 100, 200, 400))]), fr([plane(rect(0, 0, 200, 300))])], 2)).toBeCloseTo(800, 5);
    expect(figureHeightPx([fr([plane(rect(0, 0, 200, 900), 0.1), plane(rect(0, 0, 200, 300))])], 1)).toBeCloseTo(300, 5); // the faint plane is not the figure
    expect(figureHeightPx([undefined, fr([0, 0])], 1)).toBeNull();
  });

  it('end to end: a hard cut 140 px off on a 300 px figure, logged as a planned smear that landed 100 ms late behind a long frame', async () => {
    const measure = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }), attack: rec(IDLE_HEAD, { x: 100, row: SOLE }) });
    const mk = () => {
      const b = build('lulu', 'attack', quad(1, 100, SOLE, 540, 470), 10, { hard: true });
      const first = b.meta.swaps[0]!;
      const entryAt = first.t - 19; // the engine's clock when the blend began
      for (const r of b.records) if (r.n >= first.n) r.t += 100; // a long frame in the flip's own: every frame from the flip on lands 100 ms late
      for (const s of b.meta.swaps) if (s.n >= first.n) s.t += 100;
      (b.meta as { smears?: LoggedSmear[] }).smears = [{ actor: 'lulu', from: 'idle', to: 'attack', style: 'paint', kind: 'plane', at: entryAt, cutAt: entryAt + 19, cutMs: 38, overlap: 0.2, anchorDistance: 0.3, strength: 0.9, flash: false }];
      return { b, flipN: first.n };
    };
    const cfg = (smear: object, extra: object = {}): ContinuityConfig => ({ ...CFG, smear: { ...CFG.smear!, ...smear }, ...extra } as ContinuityConfig);
    const on = await run('lulu', 'attack', mk().b, measure, { cfg: cfg({ excuse: true, elastic: true, maxJerkShare: 0.5 }) });
    const swap0 = on.r.swaps.find((s) => s.n === mk().flipN)!;
    expect(swap0.stallMs).toBeGreaterThanOrEqual(99);
    expect(swap0.figurePx).toBeCloseTo(300, 0);
    expect(swap0).toMatchObject({ snap: false, snapSmear: true });
    const j = on.r.jerks.find((x) => x.n === swap0.n)!;
    expect(j.px).toBeGreaterThan(130);
    expect(j.smeared).toBeTruthy(); // 140 px under 0.5 of 300
    expect(on.r.swaps.filter((s) => s.snap && s.n === swap0.n)).toEqual([]); // the nine other cuts of the recording have no log entry and stay what they were
    const noElastic = await run('lulu', 'attack', mk().b, measure, { cfg: cfg({ excuse: true, elastic: false, maxJerkShare: 0.5 }) });
    expect(noElastic.r.swaps.find((s) => s.n === mk().flipN)).toMatchObject({ snap: true });
    expect(noElastic.r.summary.motion.snaps).toBe(on.r.summary.motion.snaps + 1);
    const noShare = await run('lulu', 'attack', mk().b, measure, { cfg: cfg({ excuse: true, elastic: true, maxJerkShare: 0 }) });
    expect(noShare.r.jerks.find((x) => x.n === swap0.n)!.smeared).toBeFalsy(); // over the absolute 120 px
  });
});

describe('R63-M1 commonMode: the figure travelling is a dash, a swap that moves the whole figure is still the swap\'s', () => {
  const measure = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }), attack: rec(IDLE_HEAD, { x: 100, row: SOLE }) });
  const lunge = (hard: boolean) => {
    const b = build('lulu', 'attack', quad(1, 100, SOLE, 400, 470), 4, { hard });
    const first = b.meta.swaps[0]!.n;
    const OFFSET = [0, 50, 151, 232, 245]; // Auron's swing at 60 Hz: 50, 101, 81, 13 px in a frame
    for (const r of b.records) {
      if (r.n < first - 1) continue;
      const dx = OFFSET[Math.min(OFFSET.length - 1, r.n - (first - 1))]!;
      for (const f of r.f) for (const s of f.s) if (Array.isArray(s)) for (let i = 3; i < 11; i += 2) s[i] = (s[i] as number) + dx;
    }
    return { b, first };
  };
  const on = { ...CFG, jerks: { ...CFG.jerks, commonMode: true } } as ContinuityConfig;
  const off = { ...CFG, jerks: { ...CFG.jerks, commonMode: false } } as ContinuityConfig;

  it('a blended swap in the middle of a lunge: its 101 px step is a dash, reported with the pose part of it', async () => {
    const { b, first } = lunge(false);
    const { r } = await run('lulu', 'attack', b, measure, { cfg: on });
    const j = r.jerks.find((x) => x.px > 90 && Math.abs(x.n - first) <= 2)!;
    expect(j).toBeTruthy();
    expect(j).toMatchObject({ atSwap: true, commonMode: true, kind: 'dash' });
    expect(j.relPx).toBeLessThan(20);
    expect(r.summary.motion.swapJerks).toBe(r.jerks.filter((x) => x.atSwap && !x.commonMode).length);
    expect(r.summary.motion.dashes).toBeGreaterThan(0);
  });
  it('commonMode false (or no word) reads it as the swap\'s, as before', async () => {
    const { b, first } = lunge(false);
    for (const cfg of [off, { ...CFG, jerks: { dashesFail: false, teleportPx: 300 } } as ContinuityConfig]) {
      const { r } = await run('lulu', 'attack', b, measure, { cfg });
      expect(r.jerks.find((x) => x.px > 90 && Math.abs(x.n - first) <= 2)).toMatchObject({ atSwap: true, kind: 'swap' });
      expect(r.jerks.some((x) => x.commonMode)).toBe(false);
    }
  });
  it('a HARD cut that moves the whole figure is the swap\'s even with commonMode on', async () => {
    const { b, first } = lunge(true);
    const { r } = await run('lulu', 'attack', b, measure, { cfg: on });
    const j = r.jerks.find((x) => x.px > 90 && Math.abs(x.n - first) <= 2)!;
    expect(j).toMatchObject({ atSwap: true, kind: 'swap' });
    expect(j.commonMode).toBeFalsy();
  });
});

describe('R63-T1: a CRLF worktree reads its own pose table', () => {
  const LF = '{\n  "subjects": {\n    "tidus": { "poses": { "idle": { "size": [10, 10] } } }\n  }\n}\n';
  const CRLF = LF.replace(/\n/g, '\r\n');

  it('the hash reads CRLF as LF and nothing else', () => {
    expect(tableSha256(CRLF)).toBe(tableSha256(LF));
    expect(tableSha256(Buffer.from(CRLF))).toBe(tableSha256(LF));
    expect(tableSha256(LF.replace('idle', 'ilde'))).not.toBe(tableSha256(LF));
    expect(tableSha256('a\rb')).not.toBe(tableSha256('a\nb')); // a lone CR is a byte like any other
    expect(tableSha256('')).toBe(tableSha256(Buffer.alloc(0)));
  });
  it('the table a run loads from a CRLF file is the candidate\'s (git gives the LF blob) and is not stale', () => {
    const dir = mkdtempSync(join(tmpdir(), 'r63-t1-'));
    const file = join(dir, 'pose-measure.json');
    writeFileSync(file, CRLF);
    const loaded = loadPoseMeasure(file)!;
    expect(loaded.count).toBe(1);
    const candidate = candidateTableAt(dir, 'abcdef1', (() => Buffer.from(LF)) as never)!;
    expect(candidate.sha256).toBe(loaded.sha256);
    expect(judgeTable({ loaded, candidate, buildSha: 'abcdef1', source: 'harness-tree' })).toMatchObject({ checked: true, stale: false, fail: false });
    const other = candidateTableAt(dir, 'abcdef1', (() => Buffer.from(LF.replace('tidus', 'yuna'))) as never)!;
    expect(judgeTable({ loaded, candidate: other, buildSha: 'abcdef1', source: 'harness-tree' })).toMatchObject({ stale: true, fail: true }); // a real difference is still stale
  });
});

describe('the policy as shipped (critic/policy.json)', () => {
  const p = JSON.parse(readFileSync(resolve(ROOT, 'critic', 'policy.json'), 'utf8')) as { continuity: Record<string, Record<string, unknown>> };
  const cfg = continuityConfig();
  it('carries the four R63-M1 words, each with its reason', () => {
    expect(p.continuity['smear']).toMatchObject({ excuse: true, maxJerkPx: 120, maxJerkShare: 0.5, elastic: true });
    expect(String(p.continuity['smear']!['note'])).toMatch(/R63-M1/);
    expect(p.continuity['unseen']).toMatchObject({ excuse: true, minShare: 0.1, maxBoxViews: 16 });
    expect(String(p.continuity['unseen']!['note'])).toMatch(/Kimahri|Yuna/);
    expect(p.continuity['jerks']).toMatchObject({ commonMode: true, teleportPx: 300, dashesFail: false });
    expect(smearPolicy(cfg)).toMatchObject({ excuse: true, maxJerkShare: 0.5, elastic: true });
    expect(unseenPolicy(cfg).excuse).toBe(true);
  });
  it('a planned cut may never be excused up to the teleport line by the share alone at an ordinary size', () => {
    // half of an ordinary 400 px figure is 200 px: under teleportPx; a push-in to 580 px is 290: still under 300
    expect(0.5 * 580).toBeLessThan(cfg.jerks!.teleportPx!);
  });
});
