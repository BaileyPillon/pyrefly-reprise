/**
 * Pose continuity in the critic, the ledger, the holds, CHK-027 and the camera (W4, CHK-026 and CHK-027; both games). Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a
 * permanent fix for this please." and, on Lulu's hurt, "lulu looks tiny when hurt - this problem again? ugh".
 *
 * CHK-026 read the head from the registration table the engine draws with, so it passed any registered pose by construction (Lulu's hurt was drawn at 0.667 of her
 * idle's height for ten releases with CHK-026 green). These are the replay cases that must FAIL the new readings, and the ones that must not:
 *   - HEIGHT, from the alpha masks and the planes' quads: Lulu's hurt at 0.667 of her idle; the same pose held to 0.90 passes;
 *   - FEET, from the silhouette's own stance: a knee-planted row (the registered stance passes, the pixels do not); a Dark Aeon painting with no stance at all;
 *   - the HEAD reading stays and is labelled control; r50.1's nine holds show their real head cost instead of hiding it behind 1.000;
 *   - a waived pose is read and shown, never failed; a waiver for another painting (a stale sha) is not honoured;
 *   - CHK-027 split: a jerk at a swap is gated, a mid-move dash is reported with the frame it fell on; the camera is projected per tracked point.
 * Nothing opens a browser: the paintings are drawn here and served through a fake `fetchImage`.
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { analyzeRun, anchorsForPoses } from '../../critic/runner/lib/continuity-analyze.mjs';
import { waiverPathFor } from '../../critic/runner/lib/continuity.mjs';
import { cameraShiftAt } from '../../critic/runner/lib/continuity-camera.mjs';
import { detectJerks, figureTrack, frameTimeOf, planeOf } from '../../critic/runner/lib/continuity-pure.mjs';
import type { Anchors, FigRec } from '../../critic/runner/lib/continuity-pure.mjs';
import { readRealHead } from '../../critic/runner/lib/continuity-readings.mjs';
import { anchorsFor } from '../../critic/runner/lib/continuity-silhouette.mjs';
import { loadPoseWaivers, waiverFor } from '../../critic/runner/lib/continuity-waivers.mjs';
import type { PoseWaivers } from '../../critic/runner/lib/continuity-waivers.mjs';
import type { ProbeFrame } from '../../critic/runner/lib/continuity-probe.mjs';
import { CFG, FRAME_MS, IDLE_HEAD, IDLE_Q, SOLE, build, fetcher, measureOf, painting, quad, rec, run } from './critic-continuity-pose-fixtures.ts';
import type { Built } from './critic-continuity-pose-fixtures.ts';

const ROOT = resolve(__dirname, '..', '..');

// decoding real paintings and importing the model's tables is slow on a loaded machine; nothing here is timing-sensitive
vi.setConfig({ testTimeout: 60_000 });

// ------------------------------------------------------------------ the waiver ledger

describe('the waiver ledger (docs/target/pose-waivers.json)', () => {
  const SHA = 'ab12cd34ef567890'.repeat(4);
  const hurtQ = quad(0.667, 100, SOLE, 400, 470);
  const measure = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }), hurt: rec([70, 10, 130, 70], { x: 100, row: SOLE }, { sha: SHA }) });
  const ledger = (rows: object[]): PoseWaivers => {
    const dir = mkdtempSync(join(tmpdir(), 'w4-waivers-'));
    const file = join(dir, 'pose-waivers.json');
    writeFileSync(file, JSON.stringify({ version: 1, rows }));
    return loadPoseWaivers(file) as PoseWaivers;
  };
  const row = (sha: string) => ({ subject: 'lulu', pose: 'hurt', sha, reason: 'legacy: drawn as live r50.1; awaiting the ruler pick (W3)', words: "driver, under Bailey's 2026-10-16 permanent-fix request", date: '2026-10-16', legacy: true });

  it('reads a ledger and finds the row for a painting by subject, pose and sha prefix', () => {
    const w = ledger([row(SHA.slice(0, 16)), { subject: 'x', pose: 'y' }, { bad: true }]);
    expect(w.count).toBe(2);
    const a = anchorsFor({ url: '/art/characters/lulu/hurt.webp', mask: { w: 8, h: 8, bits: new Uint8Array(64).fill(1), srcW: 200, srcH: 300 }, measure });
    expect(waiverFor(w, a)).toMatchObject({ legacy: true, shaChecked: true, date: '2026-10-16' });
    expect(waiverFor(w, { ...a, sha: 'ffffffffffffffff' })).toBeNull(); // another painting than the one waived
    expect(waiverFor(w, { ...a, sha: null })).toMatchObject({ shaChecked: false }); // no record to compare: the waiver stands and says so
    expect(waiverFor(null, a)).toBeNull();
    expect(loadPoseWaivers(join(tmpdir(), 'w4-none', 'nope.json'))).toBeNull();
  });

  it('SHOWS a waived 0.667 and does not fail it; the swaps still carry the reading and the waiver', async () => {
    const { r } = await run('lulu', 'hurt', build('lulu', 'hurt', hurtQ), measure, { waivers: ledger([row(SHA.slice(0, 16))]) });
    const s = r.swaps.find((x) => x.fromPose === 'idle')!;
    expect(s.height!.flags).toEqual(['stature-low']);
    expect(s.height!.waived).toMatchObject({ legacy: true });
    expect(s.failHeight).toBe(false);
    expect(r.summary.size).toMatchObject({ heightOverBand: 0, heightWaived: 10 });
    expect(r.summary.checks['CHK-026'].result).toBe('PASS');
    expect(r.summary.checks['CHK-026'].note).toMatch(/10 out of band but waived/);
    expect(r.coverage['waived']).toEqual([{ pose: 'lulu/hurt', legacy: true, shaChecked: true }]);
  });

  it('does NOT honour a waiver for another painting: a re-installed painting loses its waiver', async () => {
    const { r } = await run('lulu', 'hurt', build('lulu', 'hurt', hurtQ), measure, { waivers: ledger([row('0000000000000000')]) });
    expect(r.swaps.find((x) => x.fromPose === 'idle')!.failHeight).toBe(true);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
    expect(r.coverage['waived']).toEqual([]);
  });

  it('finds the ledger beside the registration records of a run, else the repository\'s own, and none when the policy does not honour waivers (the way back)', () => {
    expect(waiverPathFor({ poseMeasurePath: null, poseWaiversPath: 'x.json', cfg: { waivers: { honour: false } } as never })).toBeNull();
    expect(waiverPathFor({ poseMeasurePath: null, poseWaiversPath: 'x.json', cfg: CFG })).toBe('x.json');
    const dir = mkdtempSync(join(tmpdir(), 'w4-beside-'));
    writeFileSync(join(dir, 'pose-waivers.json'), JSON.stringify({ version: 1, rows: [] }));
    expect(waiverPathFor({ poseMeasurePath: join(dir, 'pose-measure.json'), poseWaiversPath: null, cfg: CFG })).toBe(join(dir, 'pose-waivers.json'));
    expect(waiverPathFor({ poseMeasurePath: null, poseWaiversPath: null, cfg: CFG, root: dir })).toBeNull(); // no docs/target/pose-waivers.json under that root
  });
});

// ------------------------------------------------------------------ r50.1's nine holds

describe('r50.1\'s nine holds read honestly (their real head cost, not hidden behind the lock\'s 1.000)', () => {
  /**
   * The nine FFX poses r50.1 held to a stature, with the head ratio the W3 sizing rule records for them now (docs/target/pose-measure.json: `held.headRatio`, or `ruled.headRatio` for the two the mean
   * leaves inside the band, Wakka's cast and Yuna's attack): subject, pose, headRatio. Bailey 2026-10-16: "lulu looks tiny when hurt - this problem again? ugh".
   */
  const NINE: [string, string, number][] = [
    ['auron', 'attack', 1.284], ['auron', 'critical', 1.281], ['auron', 'hurt', 1.241], ['lulu', 'critical', 1.368], ['lulu', 'hurt', 1.345],
    ['rikku', 'attack', 1.138], ['wakka', 'cast', 0.947], ['yuna', 'attack', 1.068], ['yuna', 'hurt', 1.163],
  ];
  const mask = { w: 8, h: 8, bits: new Uint8Array(64).fill(1), srcW: 200, srcH: 300 };

  it.each(NINE)('%s %s: the head the player sees is %f of the idle\'s, and the reading says so', (subject, pose, headRatio) => {
    const measure = measureOf(subject, { [pose]: rec([70, 10, 130, 70], { x: 100, row: SOLE }, { held: { headRatio } }) });
    const a = anchorsFor({ url: `/art/characters/${subject}/${pose}.webp`, mask, measure });
    const idle = anchorsFor({ url: `/art/characters/${subject}/idle.webp`, mask, measure });
    expect(a.heldHeadRatio).toBe(headRatio);
    // the control reads 1.000 by construction (the box is virtual); the real head is the record's ratio
    const real = readRealHead({ aFrom: idle, aTo: a, head: { ratio: 1, source: 'registration' } })!;
    expect(real.ratio).toBeCloseTo(headRatio, 3);
    expect(real.costPct).toBeCloseTo((headRatio - 1) * 100, 1);
    expect(real.outsideBand).toBe(false); // all nine are inside the gate's hold band, 0.80 to 1.45
    if (subject !== 'wakka') expect(Math.abs(real.costPct)).toBeGreaterThan(2); // not hidden: eight of the nine cost a head
  });

  it('still carries those nine, with those ratios, in docs/target/pose-measure.json (the record the critic reads: `held`, or `ruled` where the mean needs no hold)', () => {
    const file = resolve(ROOT, 'docs', 'target', 'pose-measure.json');
    if (!existsSync(file)) return;
    const json = JSON.parse(readFileSync(file, 'utf8')) as { subjects: Record<string, { poses: Record<string, { held?: { headRatio: number }; ruled?: { headRatio: number } }> }> };
    for (const [s, p, ratio] of NINE) {
      const r = json.subjects[s]!.poses[p]!;
      expect(r.held?.headRatio ?? r.ruled?.headRatio, `${s}/${p}`).toBeCloseTo(ratio, 3);
    }
  });

  it('reads a ruled pose that is no hold the same way: its record\'s ratio is the head the player sees, and the anchors carry it', () => {
    const measure = measureOf('wakka', { cast: rec([70, 10, 130, 70], { x: 100, row: SOLE }, { ruled: { headRatio: 0.947 } }) });
    const a = anchorsFor({ url: '/art/characters/wakka/cast.webp', mask, measure });
    const idle = anchorsFor({ url: '/art/characters/wakka/idle.webp', mask, measure });
    expect(a.heldHeadRatio).toBe(0.947);
    const real = readRealHead({ aFrom: idle, aTo: a, head: { ratio: 1, source: 'registration' } })!;
    expect(real.ratio).toBeCloseTo(0.947, 3);
    expect(real.outsideBand).toBe(false);
  });

  it('is judged against the gate\'s hold band, not the 3 percent: a 1.375 head across the hold is no failure, a 1.5 is', () => {
    const idle = anchorsFor({ url: '/art/characters/lulu/idle.webp', mask, measure: null });
    const hold = (headRatio: number) => anchorsFor({ url: '/art/characters/lulu/critical.webp', mask, measure: measureOf('lulu', { critical: rec([70, 10, 130, 70], { x: 100, row: SOLE }, { held: { headRatio } }) }) });
    expect(readRealHead({ aFrom: idle, aTo: hold(1.375), head: { ratio: 1, source: 'registration' } })!.outsideBand).toBe(false);
    expect(readRealHead({ aFrom: idle, aTo: hold(1.5), head: { ratio: 1, source: 'registration' } })!.outsideBand).toBe(true);
    expect(readRealHead({ aFrom: idle, aTo: idle, head: { ratio: 1, source: 'registration' } })).toBeNull(); // no hold on either side: the control IS the head
    expect(readRealHead({ aFrom: idle, aTo: hold(1.2), head: { ratio: 1.2, source: 'silhouette' } })).toBeNull(); // a mass is no head
  });
});

// ------------------------------------------------------------------ CHK-027: jerks at a swap, dashes, teleports; the frame time

describe('CHK-027 split: a jerk at a swap is gated, a mid-move dash is reported', () => {
  const measure = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }), attack: rec(IDLE_HEAD, { x: 100, row: SOLE }) });

  it('gates a 100 px jump of the figure AT a pose swap (a hard cut that also moves it)', async () => {
    // registration slides the pose onto the idle's feet, so for the figure to jump at the cut the pose plane is simply drawn 100 px to the right of where it is registered
    const b = build('lulu', 'attack', quad(1, 100, SOLE, 500, 470), 10, { hard: true });
    const { r } = await run('lulu', 'attack', b, measure);
    const atSwap = r.jerks.filter((j) => j.atSwap);
    expect(atSwap.length).toBeGreaterThan(0);
    expect(atSwap.every((j) => j.kind === 'swap')).toBe(true);
    expect(r.summary.motion.swapJerksOverFail).toBeGreaterThan(0);
    expect(r.summary.checks['CHK-027'].result).toBe('FAIL');
    expect(r.summary.checks['CHK-027'].reasons.join(' ')).toMatch(/jerk\(s\) of 40 px or more in one frame AT A POSE SWAP/);
  });

  it('carries the frame each jerk fell on and the frame-time number apart from the jerks', async () => {
    const b = build('lulu', 'attack', quad(1, 100, SOLE, 500, 470), 10, { hard: true });
    // every frame is 16.7 ms except the frame of the first swap's cut, a 60 ms hitch
    const first = b.meta.swaps[0]!;
    const hit = b.records.findIndex((x) => x.n === first.n);
    for (let i = hit; i < b.records.length; i++) b.records[i]!.t += 43.3;
    const { r } = await run('lulu', 'attack', b, measure);
    expect(r.summary.frameTime).toMatchObject({ longMs: 34 });
    expect(r.summary.frameTime!.maxMs).toBeGreaterThan(55);
    expect(r.summary.frameTime!.longFrames).toBe(1);
    expect(r.summary.frameTime!.p50Ms).toBeCloseTo(16.7, 0);
    const long = r.jerks.filter((j) => j.longFrame);
    expect(long.length).toBeGreaterThan(0);
    expect(long.every((j) => (j.frameMs as number) > 34)).toBe(true);
    expect(r.summary.motion.jerksLongFrame).toBe(long.length);
    expect(r.summary.motion.swapJerksSteadyOverFail).toBeLessThan(r.summary.motion.swapJerksOverFail);
    expect(r.summary.checks['CHK-027'].note).toMatch(/fell on a frame of more than 34 ms/);
  });

  it('turns a list of frame times into percentiles', () => {
    const f = frameTimeOf([16.7, 16.7, 16.7, 16.7, 16.7, 16.7, 16.7, 16.7, 16.7, 50], 34)!;
    expect(f).toMatchObject({ frames: 10, p50Ms: 16.7, maxMs: 50, longFrames: 1, longFramePct: 10, longMs: 34 });
    expect(frameTimeOf([], 34)).toBeNull();
  });
});

// ------------------------------------------------------------------ the camera, projected per tracked point

describe('the camera\'s shift is projected per tracked point (probe version 2)', () => {
  // A pinhole camera dollying along z: screen = (800 + 1000 x / d, 450 - 1000 y / d), d the distance to the plane. A figure standing on the principal point (x 0, y 0) is not
  // moved at all by a dolly from d 10 to d 6 (its origin: what the old subtraction removed), while its head 3.6 units up is moved by 240 px: a camera cut the origin cannot account for.
  const proj = (d: number, x: number, y: number): [number, number] => [800 + (1000 * x) / d, 450 - (1000 * y) / d];
  const CORNERS: [number, number][] = [[-0.8, 3.6], [0.8, 3.6], [0.8, 0], [-0.8, 0]];
  /** A standing figure's plane (1.6 wide, 3.6 tall, feet at the origin) seen from distance `d`, and, while the camera moved, where it alone moved each corner (against `was`). */
  const planeAt = (d: number, was: number, k = 0, fade = 1): number[] => {
    const q = CORNERS.flatMap(([x, y]) => proj(d, x, y));
    const cs = CORNERS.flatMap(([x, y], i) => { const p = proj(was, x, y); return [q[i * 2]! - p[0], q[i * 2 + 1]! - p[1]]; });
    return [k, fade, 1, ...q, ...(cs.some((v) => Math.abs(v) >= 0.05) ? cs : [])];
  };
  const anchors: Anchors[] = [{ head: { u0: 0.4, t0: 0.02, u1: 0.6, t1: 0.1 }, mass: 0.3, stance: { u: 0.5, t: 1 }, stanceSrc: 'registration', mask: null, prone: false } as Anchors];
  const figAt = (n: number): FigRec => ({ i: 0, a: 1, act: 0, s: [n < 3 ? planeAt(10, 10) : n === 3 ? planeAt(6, 10) : planeAt(6, 6), 0], g: [0, 0] });

  it('reads, for any point of the painting, how far the camera alone moved it', () => {
    const p = planeOf(planeAt(6, 10))!;
    expect(cameraShiftAt(p, 0.5, 1)[1]).toBeCloseTo(0, 6); // the feet, on the principal point: not moved
    expect(cameraShiftAt(p, 0.5, 0.0)[1]).toBeCloseTo(-240, 6); // the top of the painting, 3.6 units up: 360 px above the centre at d 10, 600 at d 6
    expect(cameraShiftAt(p, 0.5, 0.5)[1]).toBeCloseTo(-120, 6); // a point halfway is moved by half as much: the shift is a function of WHERE on the painting
    expect(cameraShiftAt(planeOf(planeAt(6, 6))!, 0.5, 0.0)).toEqual([0, 0]); // a still camera records none
    expect(cameraShiftAt(planeOf([0, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8]), 0.5, 0.5)).toEqual([0, 0]); // version 1: none recorded
    expect(cameraShiftAt(null, 0.5, 0.5)).toEqual([0, 0]);
  });

  it('puts the camera\'s shift of the tracked HEAD and FEET in the figure\'s track', () => {
    const cams = figureTrack(figAt(3), anchors)!.cams;
    expect(cams.feet![1]).toBeCloseTo(0, 6);
    expect(cams.head![1]).toBeCloseTo(-240 * (1 - 0.06), 4); // the head box's centre is at t 0.06 down the painting, 94 percent of the way up from the feet
    expect(figureTrack(figAt(5), anchors)!.cams.head).toEqual([0, 0]);
  });

  it('does not call a camera dolly a head jerk, which the origin-only subtraction did on every figure the camera moved unevenly', () => {
    const track = (perPoint: boolean) => [0, 1, 2, 3, 4, 5, 6].map((n) => {
      const tr = figureTrack(figAt(n), anchors)!;
      // `cam` is the figure's ORIGIN shift (its feet are on the principal point): nothing, in a dolly
      return { n, t: n * FRAME_MS, feet: tr.feet, head: tr.head, centroid: null, cam: [0, 0] as [number, number], cams: perPoint ? tr.cams : null };
    });
    const old = detectJerks(track(false), 1, CFG);
    expect(old.some((j) => j.part === 'head' && j.px > 200)).toBe(true); // the head "jumped" 225 px
    expect(detectJerks(track(true), 1, CFG)).toHaveLength(0); // it was the camera
  });

  it('falls back to the origin\'s shift for a part with no per-point shift (a recording from probe version 1)', () => {
    const t = (n: number, x: number, cam: [number, number]) => ({ n, t: n * FRAME_MS, feet: [x, 500] as [number, number], head: null, centroid: null, cam, cams: null });
    const track = [0, 1, 2, 3, 4, 5, 6].map((n) => (n < 3 ? t(n, 100, [0, 0]) : t(n, 40, n === 3 ? [-60, 0] : [0, 0]))); // the figure stands still in the world; the camera moved it 60 px at frame 3
    expect(detectJerks(track, 1, CFG)).toHaveLength(0);
  });

  it('is what the analysis uses for a probe version 2 recording, and the origin\'s shift for version 1 or when the policy asks for it', async () => {
    const measure = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }), attack: rec(IDLE_HEAD, { x: 100, row: SOLE }) });
    const files = { '/art/characters/lulu/idle.png': await painting(), '/art/characters/lulu/attack.png': await painting() };
    // one figure showing its idle only, standing in a dolly: its top moves 240 px at frame 200, its feet nothing (as the probe v2 records it); the registered head is near the top
    const far = [700, 90, 900, 90, 900, 450, 700, 450], near = [700, -150, 900, -150, 900, 450, 700, 450], cs = [0, -240, 0, -240, 0, 0, 0, 0];
    const make = (version: number): Built => {
      const b = build('lulu', 'attack', IDLE_Q, 10);
      const records: ProbeFrame[] = [];
      for (let n = 0; n < 400; n++) records.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, f: [{ i: 0, a: 1, act: 0, s: [[0, 1, 1, ...(n < 200 ? far : near), ...(n === 200 ? cs : [])], 0], g: [0, 0] }] });
      return { meta: { ...b.meta, version, swaps: [] }, records };
    };
    const go = async (version: number, cfg: typeof CFG = CFG) => {
      const b = make(version);
      const { anchors: a } = await anchorsForPoses({ poses: b.meta.poses, fetchImage: fetcher(files), measure });
      return analyzeRun({ meta: b.meta, records: b.records, anchors: a, cfg });
    };
    expect((await go(2)).jerks).toHaveLength(0);
    expect((await go(1)).jerks.length).toBeGreaterThan(0); // version 1 has no per-point shift: the head "jumps"
    expect((await go(2, { ...CFG, tracking: { ...CFG.tracking, camera: 'origin' } } as typeof CFG)).jerks.length).toBeGreaterThan(0); // the earlier reading, one switch away
  });
});
