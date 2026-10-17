/**
 * Pose continuity in the critic (W4, CHK-026 and CHK-027; both games). Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a
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
import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';
import { analyzeRun, anchorsForPoses } from '../../critic/runner/lib/continuity-analyze.mjs';
import { CFG, IDLE_HEAD, SOLE, build, fetcher, measureOf, painting, quad, rec, run } from './critic-continuity-pose-fixtures.ts';

// decoding real paintings and importing the model's tables is slow on a loaded machine; nothing here is timing-sensitive
vi.setConfig({ testTimeout: 60_000 });

// ------------------------------------------------------------------ the HEIGHT reading

describe('the height reading (CHK-026, from the pixels)', () => {
  // Lulu's hurt, drawn at 0.667 of her idle's height with a registered head the lock has made match the idle's to the pixel: the exact defect of ten releases.
  const hurtQ = quad(0.667, 100, SOLE, 400, 470);
  const hurtHead = [70, 10, 130, 70]; // 60 painting px at scale 0.667 is 40 px on screen: the idle's head, to the pixel
  const measure = (hurt: Record<string, unknown> = {}) => measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }), hurt: rec(hurtHead, { x: 100, row: SOLE }, hurt) });

  it('FAILS Lulu hurt at 0.667 of her idle: the head and the feet agree to the pixel, the body is two thirds of the height', async () => {
    const { r } = await run('lulu', 'hurt', build('lulu', 'hurt', hurtQ), measure());
    const s = r.swaps.find((x) => x.fromPose === 'idle')!;
    // the old readings, which passed
    expect(s.head!.ratio).toBeCloseTo(1, 2);
    expect(s.head!.label).toBe('control');
    expect(s.failHead).toBe(false);
    expect(s.feet!.px).toBeLessThan(0.5);
    expect(s.failFeet).toBe(false);
    // the new one, which does not
    expect(s.height).toMatchObject({ vs: 'idle', pose: 'hurt', side: 'to', class: 'standing', band: [0.9, 1.1], flags: ['stature-low'], source: 'pixels' });
    expect(s.height!.stature).toBeCloseTo(0.667, 2);
    expect(s.failHeight).toBe(true);
    expect(r.summary.size.heightOverBand).toBe(10);
    expect(r.summary.size.minStature).toBeCloseTo(0.667, 2);
    expect(r.perFigure['lulu']).toMatchObject({ heightOver: 10, feetSilOver: 0, sizeOver: 0, feetOver: 0 }); // the head and the feet were fine; the height was not
    expect(r.perFigure['lulu']!['minStature'] as number).toBeCloseTo(0.667, 2);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
    expect(r.summary.checks['CHK-026'].reasons.join(' ')).toMatch(/draw a pose outside its height band against the idle, read from the pixels \(stature 0\.66/);
    expect(r.summary.checks['CHK-026'].note).toMatch(/head reading is a CONTROL/);
  });

  it('reads the same defect from the other side of the swap (hurt to idle), and ranks it among the worst swaps', async () => {
    const { r } = await run('lulu', 'hurt', build('lulu', 'hurt', hurtQ), measure());
    const back = r.swaps.find((x) => x.fromPose === 'hurt')!;
    expect(back.height).toMatchObject({ side: 'from', pose: 'hurt', flags: ['stature-low'] });
    expect(back.height!.stature).toBeCloseTo(0.667, 2);
    expect(r.worst.swaps.length).toBeGreaterThan(0);
    expect(r.swaps[r.worst.swaps[0]!]!.height!.flags).toEqual(['stature-low']); // outranks the mild ghosts: the registered head says nothing is wrong
  });

  it('PASSES the same pose held to 0.90 (r50.1), and SHOWS the head it cost instead of hiding it behind the lock\'s 1.000', async () => {
    const q = quad(0.901, 100, SOLE, 400, 470);
    const box = [77.8, 20, 122.2, 64.4]; // the held pose's virtual head box: the idle's size over the applied scale, so the control reads 1.000
    const m = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }), hurt: rec(box, { x: 100, row: SOLE }, { held: { headRatio: 1.354, stature: 0.901, by: 'test' } }) });
    const { r } = await run('lulu', 'hurt', build('lulu', 'hurt', q), m);
    const s = r.swaps.find((x) => x.fromPose === 'idle')!;
    expect(s.head!.ratio).toBeCloseTo(1, 2); // the control agrees with itself
    expect(s.height!.flags).toEqual([]);
    expect(s.height!.stature).toBeCloseTo(0.901, 2);
    expect(s.headReal).toMatchObject({ fromHeld: null, toHeld: 1.354, outsideBand: false, band: [0.8, 1.45] });
    expect(s.headReal!.ratio).toBeCloseTo(1.354, 2);
    expect(s.headReal!.costPct).toBeCloseTo(35.4, 0);
    const back = r.swaps.find((x) => x.fromPose === 'hurt')!;
    expect(back.headReal!.ratio).toBeCloseTo(1 / 1.354, 2); // and the way back reads the same cost, the other way
    expect(r.summary.size.holdSwaps).toBe(10);
    expect(r.summary.size.worstRealHeadPct).toBeGreaterThan(25);
    expect(r.summary.checks['CHK-026'].result).toBe('PASS');
    expect(r.summary.checks['CHK-026'].note).toMatch(/10 swap\(s\) across a recorded hold \(real head worst/);
  });

  it('fails a hold whose real head is outside the hold band (0.80 to 1.45): the cost is the owner\'s, the band is the gate\'s', async () => {
    const q = quad(0.901, 100, SOLE, 400, 470);
    const m = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }), hurt: rec([77.8, 20, 122.2, 64.4], { x: 100, row: SOLE }, { held: { headRatio: 1.6 } }) });
    const { r } = await run('lulu', 'hurt', build('lulu', 'hurt', q), m);
    expect(r.swaps.find((x) => x.fromPose === 'idle')!.failRealHead).toBe(true);
    expect(r.summary.size.realHeadOutsideBand).toBe(10);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
    expect(r.summary.checks['CHK-026'].reasons.join(' ')).toMatch(/recorded hold's real head outside the hold band/);
  });

  it('judges a laid-down KO by its LENGTH, and only reports it (the owner has not ruled on the KO band)', async () => {
    // a KO painting 0.42 of the idle's height tall and 1.5 times as long: wide, so the engine lays it down
    const longPose = await sharp({ create: { width: 400, height: 120, channels: 4, background: { r: 200, g: 120, b: 90, alpha: 1 } } }).png().toBuffer();
    const idle = await painting();
    const qKo = [300, 360, 500, 360, 500, 480, 300, 480]; // 200 x 120 on screen: the long side is 200, the idle's height 243
    const b = build('lulu', 'ko', qKo);
    const files = { '/art/characters/lulu/idle.png': idle, '/art/characters/lulu/ko.png': longPose };
    const measure = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }) });
    const { anchors } = await anchorsForPoses({ poses: b.meta.poses, fetchImage: fetcher(files), measure });
    const r = analyzeRun({ meta: b.meta, records: b.records, anchors, cfg: CFG });
    const ko = r.swaps.find((x) => x.fromPose === 'idle')!;
    expect(ko.height).toMatchObject({ class: 'ko', stature: null, flags: [] });
    expect(ko.height!.length).toBeCloseTo(0.82, 1);
    expect(ko.failHeight).toBe(false);
    expect(r.summary.size.koLengthMeasured).toBe(10);
  });

  it('is switched off by the policy, for an old-versus-new run of one recording', async () => {
    const cfg = { ...CFG, readings: { ...(CFG['readings'] as object), height: false } } as typeof CFG;
    const { r } = await run('lulu', 'hurt', build('lulu', 'hurt', hurtQ), measure(), { cfg });
    expect(r.swaps[0]!.height).toBeNull();
    expect(r.summary.checks['CHK-026'].result).toBe('PASS'); // the earlier harness: head and feet only
  });
});

// ------------------------------------------------------------------ the FEET reading

describe('the feet reading (CHK-026, from the silhouette\'s own stance)', () => {
  it('FAILS a knee-planted row: the registered stance agrees with the idle\'s, the soles are 70 px lower', async () => {
    // Paine Lady Luck hurt: the generator wrote a feetRow at the knees. The engine plants the REGISTERED stance (row 200, the knees) where the idle's soles are, so the
    // registered feet read 0 px; the painting's own soles hang 70 px below the floor.
    const q = quad(1, 100, 200, 400, 470);
    const m = measureOf('paine-lady-luck', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }), hurt: rec(IDLE_HEAD, { x: 100, row: 200 }) });
    const { r } = await run('paine-lady-luck', 'hurt', build('paine-lady-luck', 'hurt', q), m);
    const s = r.swaps.find((x) => x.fromPose === 'idle')!;
    expect(s.feet!.px).toBeLessThan(0.5); // what passed
    expect(s.failFeet).toBe(false);
    expect(s.failHead).toBe(false);
    expect(s.feetSil).toMatchObject({ gate: 'dy', source: 'silhouette', standing: true });
    expect(s.feetSil!.dy).toBeCloseTo(70, 0); // what did not
    expect(s.feetSil!.gatePx).toBeGreaterThan(s.feetSil!.tolerancePx);
    expect(s.failFeetSil).toBe(true);
    expect(r.summary.size.feetSilOver).toBe(10);
    expect(r.summary.size.maxFeetSilPx).toBeCloseTo(70, 0);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
    expect(r.summary.checks['CHK-026'].reasons.join(' ')).toMatch(/silhouette's own stance more than the tolerance \(worst 70/);
  });

  it('FAILS a Dark Aeon painting with no stance: nothing slides it onto the idle\'s feet, and it is listed as unregistered', async () => {
    // dark-sandy had no registration at all (FOC501-01: 239 swaps over the feet line): the plane is not slid, so the pose stands 45 px lower than the idle
    const q = quad(1, 100, SOLE, 400, 515);
    const b = build('dark-sandy', 'attack', q);
    const { r } = await run('dark-sandy', 'attack', b, measureOf('somebody-else', {}));
    const s = r.swaps.find((x) => x.fromPose === 'idle')!;
    expect(s.unregistered).toBe(true);
    expect(s.feetSil).toMatchObject({ gate: 'xy' }); // no registered stance: both axes judge
    expect(s.feetSil!.gatePx).toBeCloseTo(45, 0);
    expect(s.failFeetSil).toBe(true);
    expect(s.failFeet).toBe(true); // the earlier coarse reading saw it too
    expect(r.summary.size.unregisteredSwaps).toBe(10);
    expect(r.coverage['unregistered']).toEqual(['dark-sandy/idle', 'dark-sandy/attack']);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
  });

  it('reports an unregistered pose that stands where the idle stands, and does not fail it (the gate refuses it at install; a ship hold is the owner\'s to rule on)', async () => {
    const b = build('dark-sandy', 'attack', quad(1, 100, SOLE, 400, 470));
    const { r } = await run('dark-sandy', 'attack', b, measureOf('somebody-else', {}));
    expect(r.swaps.find((x) => x.fromPose === 'idle')!.unregistered).toBe(true);
    expect(r.summary.size.unregisteredSwaps).toBe(10);
    expect(r.summary.checks['CHK-026'].result).toBe('PASS');
  });

  it('shows the sideways gap of a registered pose and does not gate it: the registered stance is the reviewed one', async () => {
    // the pose is painted 30 px to the right inside its painting but its REGISTERED stance (the reviewed one) says x 100: the engine slides the plane onto the idle's feet by it, so the
    // registered feet read 0 and the auto stance of the silhouette is 30 px off sideways: shown, not gated (the auto stance is crude sideways: a trailing foot, a lunge)
    const q = quad(1, 100, SOLE, 400, 470);
    const m = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }), attack: rec([110, 20, 150, 60], { x: 100, row: SOLE }) });
    const { r } = await run('lulu', 'attack', build('lulu', 'attack', q), m, { poseDx: 30 });
    const s = r.swaps.find((x) => x.fromPose === 'idle')!;
    expect(s.feet!.px).toBeLessThan(0.5);
    expect(s.feetSil).toMatchObject({ gate: 'dy' });
    expect(s.feetSil!.dx).toBeCloseTo(30, 0);
    expect(s.feetSil!.gatePx).toBeLessThan(1);
    expect(s.feetSil!.registeredGapPx[1]).toBeGreaterThan(28);
    expect(s.failFeetSil).toBe(false);
    expect(r.summary.checks['CHK-026'].result).toBe('PASS');
  });
});

