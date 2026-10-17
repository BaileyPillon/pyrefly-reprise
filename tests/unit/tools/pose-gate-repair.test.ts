/**
 * **The pose gate, second pass: the holes a verifier found in it** (pose continuity repair, 2026-10-17; both games). Bailey, 2026-10-16: "pose continuity is the
 * strongest recurring issue we need a permanent fix for this please." The verifier tried to ship a bad painting past `tools/pose-gate.mjs` and
 * `tools/art-install.mjs` and got through with: a transparent painting, an opaque slab, a bar, a small figure holding a full-height pole, a wide pose, a head box moved
 * onto the legs, a junctioned subject folder and a swapped twirl painting (this file); a `@2x` master left behind by a replaced painting, a master changed between the gate
 * and the build, an invented sentence in Bailey's name, a legacy row added with its seal entry, a base ref that git could not read and an installer that registered a
 * figure with no head (`pose-gate-repair-ship.test.ts`). Every case passed before and must fail now. The art is rectangles with known sizes (`pose-gate-fixtures.ts`), so
 * each failure is the gate's call and never a painting's.
 */
import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { censusReport, runGate } from '../../../tools/pose-gate-lib.mjs';
import { listSubjects, readSubject } from '../../../tools/posescale/pose-model.mjs';
import {
  CANVAS_H, CANVAS_W, FIXTURE_DECISIONS, IDLE_FIG, IDLE_HEAD, ROOT, TALL_FIG, bareTable, codesOf, flagsOf, gateOf as gate, inputsFor, installedTable, must, paint, paintBoss, paintRects, rowOf, tempDir,
  withRow, type Table,
} from './pose-gate-fixtures.ts';

// each test decodes images; under a full run of the suite the machine is busy, so the default 15 s is too short
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('degenerate paintings: stature was the alpha bounding box only, so a pole, a slab or nothing at all could read `ok`', () => {
  const art = tempDir('pose-gate-degenerate-');
  let table: Table;
  /** The head box of a small figure standing in the lower half of the canvas (rows 260 to 449). */
  const LOW_HEAD: [number, number, number, number] = [0.375, 0.52, 0.625, 0.62];

  beforeAll(async () => {
    await paint(art, 'zz-deg', 'idle', IDLE_FIG);
    await paint(art, 'zz-deg', 'fine', TALL_FIG); // the control: in band
    await paintRects(art, 'zz-deg', 'empty', []); // a transparent PNG
    await paintRects(art, 'zz-deg', 'slab', [{ x0: 0, x1: CANVAS_W, y0: 0, y1: CANVAS_H }]); // an opaque slab (an all-black render given an alpha channel)
    await paintRects(art, 'zz-deg', 'block', [{ x0: 130, x1: 270, y0: 80, y1: 450 }]); // a plain rectangle the size of a figure: stature and mass in band
    await paintRects(art, 'zz-deg', 'bar', [{ x0: 193, x1: 207, y0: 50, y1: 450 }]); // one 14 px bar the height of the idle
    await paintRects(art, 'zz-deg', 'pole', [{ x0: 150, x1: 250, y0: 260, y1: 450 }, { x0: 245, x1: 250, y0: 50, y1: 450 }]); // a 48 percent figure holding a full-height pole
    const bare: Table = { 'zz-deg': Object.fromEntries(['idle', 'fine', 'empty', 'slab', 'block', 'bar', 'pole'].map((p) => [p, { stanceX: 200, head: p === 'pole' ? LOW_HEAD : IDLE_HEAD }])) };
    table = await installedTable(art, bare, 'zz-deg');
  }, 120_000);

  it('a fresh install writes `blocked` for every one of them and `ok` for the control', () => {
    expect(rowOf(table, 'zz-deg', 'fine').status).toBe('ok');
    for (const p of ['slab', 'block', 'bar', 'pole']) expect(rowOf(table, 'zz-deg', p).status, p).toBe('blocked');
  });

  it('refuses a transparent painting as `empty`, though no band reads it and no exemption covers it', async () => {
    const r = await gate(art, table, { subjects: ['zz-deg'] });
    expect(codesOf(r, 'zz-deg/empty')).toEqual(['empty']);
    expect(must(r.failures.find((x) => x.code === 'empty'), 'failure').message).toContain('nothing opaque');
  });

  it('refuses the slab (mass), the bar (mass), and the small figure with a pole (a prop carries the height), even with `ok` typed in by hand', async () => {
    const hand = ['slab', 'block', 'bar', 'pole'].reduce((t, p) => withRow(t, 'zz-deg', p, { status: 'ok' }), table);
    const r = await gate(art, hand, { subjects: ['zz-deg'] });
    expect(flagsOf(r, 'zz-deg/slab')).toEqual(expect.arrayContaining(['mass-high']));
    expect(flagsOf(r, 'zz-deg/bar')).toEqual(expect.arrayContaining(['mass-low']));
    expect(flagsOf(r, 'zz-deg/block')).toEqual(['slab']); // in band on every other axis: only its being a rectangle gives it away
    expect(flagsOf(r, 'zz-deg/pole')).toEqual(expect.arrayContaining(['props-only']));
    // a plain rectangle is refused as a `slab` before any band is read; the pole figure is not a rectangle, so its bands speak
    for (const p of ['slab', 'block', 'bar']) expect(codesOf(r, `zz-deg/${p}`), p).toEqual(['slab']);
    expect(codesOf(r, 'zz-deg/pole')).toContain('out-of-band');
    expect(codesOf(r, 'zz-deg/fine')).toEqual([]);
  });

  it('refuses a standing pose whose stance cannot be read (a shape with no feet)', async () => {
    // a 7 px pole with a 7 px arm: thinner than the disc the stance is opened with, so no thick part is left to stand on (and it is not a rectangle)
    const art2 = tempDir('pose-gate-nostance-');
    await paint(art2, 'zz-ns', 'idle', IDLE_FIG);
    await paintRects(art2, 'zz-ns', 'attack', [{ x0: 190, x1: 197, y0: 50, y1: 450 }, { x0: 150, x1: 250, y0: 100, y1: 107 }]);
    const t = await installedTable(art2, { 'zz-ns': { idle: { stanceX: 200, head: IDLE_HEAD }, attack: { stanceX: 200, head: IDLE_HEAD } } }, 'zz-ns');
    const r = await gate(art2, withRow(t, 'zz-ns', 'attack', { status: 'ok' }), { subjects: ['zz-ns'] });
    expect(flagsOf(r, 'zz-ns/attack')).toEqual(expect.arrayContaining(['no-stance']));
    expect(codesOf(r, 'zz-ns/attack')).toContain('out-of-band');
  });

  it('refuses a painting that has nothing in common with its idle (a figure standing somewhere else)', async () => {
    const art2 = tempDir('pose-gate-nooverlap-');
    await paint(art2, 'zz-no', 'idle', IDLE_FIG);
    await paint(art2, 'zz-no', 'attack', { x0: 20, x1: 120, y0: 80, y1: 450 }); // the same height, 130 px to the left: no overlap at the drawn place
    const t = await installedTable(art2, { 'zz-no': { idle: { stanceX: 200, head: IDLE_HEAD }, attack: { head: IDLE_HEAD } } }, 'zz-no');
    const r = await gate(art2, withRow(t, 'zz-no', 'attack', { status: 'ok' }), { subjects: ['zz-no'] });
    expect(flagsOf(r, 'zz-no/attack')).toEqual(expect.arrayContaining(['no-overlap']));
  });

  it('the census reports each as a failure of its own code', async () => {
    const r = await gate(art, table, { subjects: ['zz-deg'] });
    const report = censusReport(r);
    expect(report.failuresByCode).toEqual({ empty: 1, slab: 3, blocked: 1 }); // the pole figure is the one the bands, not the shape, give away
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('the head reading is taken from the pixels, not from what the table says', () => {
  const art = tempDir('pose-gate-head-');
  let fresh: Table;
  beforeAll(async () => {
    await paintBoss(art);
    fresh = await installedTable(art, bareTable(), 'zz-boss');
  }, 60_000);

  it('a head box moved onto the legs (same size, so the size reading is unchanged) fails `head-off`', async () => {
    const r = await gate(art, withRow(fresh, 'zz-boss', 'attack', { head: [0.375, 0.8, 0.625, 0.9] }), { subjects: ['zz-boss'] });
    expect(flagsOf(r, 'zz-boss/attack')).toContain('head-off');
    expect(codesOf(r, 'zz-boss/attack')).toContain('out-of-band');
  });

  it('a head box on empty canvas fails `head-off`', async () => {
    const r = await gate(art, withRow(fresh, 'zz-boss', 'attack', { head: [0.02, 0.1, 0.27, 0.2] }), { subjects: ['zz-boss'] });
    expect(flagsOf(r, 'zz-boss/attack')).toContain('head-off');
  });

  it('a pose with no head box, though its idle has one, fails `no-head`', async () => {
    const t = JSON.parse(JSON.stringify(fresh)) as Table;
    delete must(t['zz-boss'], 'zz-boss rows').attack!.head;
    const r = await gate(art, t, { subjects: ['zz-boss'] });
    expect(flagsOf(r, 'zz-boss/attack')).toContain('no-head');
  });

  it('a typed hold ratio that is not the applied scale over the ruler reading fails `held-head`', async () => {
    // a hold: scale 0.925 applied over a ruler reading of 0.5 is a head ratio of 1.85; the record says 1.0, which would read the head as matched
    const inputs = await inputsFor(art, withRow(fresh, 'zz-boss', 'attack', { scale: 0.925 }));
    inputs.records = { subjects: { 'zz-boss': { poses: { attack: { held: { headRatio: 1.0, reading: 0.5 } } } } } };
    const r = (await readSubject(inputs, 'zz-boss', { poses: ['attack'] }))[0]!;
    expect(r.heldGap).toBeGreaterThan(0.8);
    inputs.records = { subjects: { 'zz-boss': { poses: { attack: { held: { headRatio: 1.85, reading: 0.5 } } } } } };
    expect((await readSubject(inputs, 'zz-boss', { poses: ['attack'] }))[0]!.heldGap).toBeLessThan(0.01);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('a wide pose is laid down by the engine, so it needs a hull for an idle or an `upright` mark', () => {
  it('flags a lunge wider than 1.15 times its height on a figure whose idle is upright', async () => {
    const art = tempDir('pose-gate-wide-');
    await paint(art, 'zz-wide', 'idle', IDLE_FIG);
    await paint(art, 'zz-wide', 'attack', { x0: 0, x1: 400, y0: 100, y1: 300 }, { W: 400, H: 300 });
    const t = await installedTable(art, { 'zz-wide': { idle: { stanceX: 200 }, attack: {} } }, 'zz-wide');
    const r = await gate(art, withRow(t, 'zz-wide', 'attack', { status: 'ok' }), { subjects: ['zz-wide'] });
    expect(must(r.entries.find((e) => e.key === 'zz-wide/attack'), 'entry').class).toBe('wide');
    expect(flagsOf(r, 'zz-wide/attack')).toEqual(['wide-pose']);
  });

  it('accepts it where the idle is wide as well (a hull)', async () => {
    const art = tempDir('pose-gate-hull-');
    await paint(art, 'zz-hull', 'idle', { x0: 0, x1: 400, y0: 100, y1: 300 }, { W: 400, H: 300 });
    await paint(art, 'zz-hull', 'attack', { x0: 0, x1: 400, y0: 90, y1: 300 }, { W: 400, H: 300 });
    const t = await installedTable(art, { 'zz-hull': { idle: {}, attack: {} } }, 'zz-hull');
    const r = await gate(art, t, { subjects: ['zz-hull'] });
    expect(flagsOf(r, 'zz-hull/attack')).not.toContain('wide-pose');
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('exemptions: the twirl key is the five staged keys on a dressphere, not any pose called twirl on any subject', () => {
  const art = tempDir('pose-gate-twirl-');
  beforeAll(async () => {
    await paint(art, 'zz-boss', 'idle', IDLE_FIG);
    await paint(art, 'zz-boss', 'twirl-strike', { x0: 150, x1: 250, y0: 200, y1: 450 }); // a squashed painting under the old exemption's name
    await paint(art, 'rikku-songstress', 'idle', IDLE_FIG);
    await paint(art, 'rikku-songstress', 'twirl-end', { x0: 150, x1: 250, y0: 200, y1: 450 });
    await paintRects(art, 'rikku-songstress', 'twirl-start', []); // transparent
  }, 60_000);

  it('judges `twirl-strike` on a boss like any other pose, and exempts `twirl-end` on a dressphere', async () => {
    const r = await gate(art, { 'zz-boss': { idle: { stanceX: 200, head: IDLE_HEAD } }, 'rikku-songstress': { idle: { stanceX: 200, head: IDLE_HEAD } } });
    expect(codesOf(r, 'zz-boss/twirl-strike')).toEqual(['unregistered']);
    expect(must(r.entries.find((e) => e.key === 'rikku-songstress/twirl-end'), 'entry').outcome).toBe('exempt');
  });

  it('but a staged painting with nothing in it is `empty`: exempt means not banded, never not read', async () => {
    const r = await gate(art, { 'rikku-songstress': { idle: { stanceX: 200, head: IDLE_HEAD } } }, { subjects: ['rikku-songstress'] });
    expect(codesOf(r, 'rikku-songstress/twirl-start')).toEqual(['empty']);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('a folder that is a link or a junction is still a subject', () => {
  it('lists a junctioned subject folder and reads its paintings (a build follows the link into dist, so the gate must too)', async () => {
    const art = tempDir('pose-gate-link-art-');
    const real = tempDir('pose-gate-link-real-');
    await paintBoss(real);
    mkdirSync(join(art, 'characters'), { recursive: true });
    symlinkSync(join(real, 'characters', 'zz-boss'), join(art, 'characters', 'zz-linked'), 'junction');
    const inputs = await inputsFor(art, {});
    expect(listSubjects(inputs)).toEqual(['zz-linked']);
    const r = await runGate({ root: ROOT, inputs, ledger: null, concurrency: 1, decisions: FIXTURE_DECISIONS, pin: null });
    expect(r.paintings).toBe(2);
    expect(r.failures.map((x) => x.code)).toEqual(['unregistered', 'unregistered']);
  });
});
