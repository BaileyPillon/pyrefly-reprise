/**
 * **The rig gate on a rig the real pipeline made** (the rig program; both games). `tests/fixtures/rig/kimahri-mini` is the 2026-10-15 hand-cut prototype Kimahri (11 parts, 29 bones) quartered and painted one
 * flat colour a part, with an idle and four "approved paintings" drawn by bending the rig by hand-chosen angles plus a degree of noise; the rig beside them is what `tools/rig/rig.py fit-keys` and `export` made from
 * those paintings ALONE (`tools/rig/make_fixture.py` regenerates it). The fitter is Python with its own rasteriser, the gate is Node with another: this test is where they meet. It passes; each case after it breaks it
 * one way and the gate says which.
 */
import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { gateRig } from '../../../tools/rig/rig-gate-lib.mjs';
import { loadModelInputs } from '../../../tools/posescale/pose-model.mjs';
import { ROOT, tempDir, type RigJson } from './rig-gate-fixtures.ts';

vi.setConfig({ testTimeout: 180_000, hookTimeout: 180_000 });

const FIX = join(ROOT, 'tests', 'fixtures', 'rig', 'kimahri-mini');
const SUBJECT = 'kimahri-mini';
const inputs = (): Promise<Awaited<ReturnType<typeof loadModelInputs>>> =>
  loadModelInputs({ root: ROOT, artDir: join(FIX, 'art'), table: JSON.parse(readFileSync(join(FIX, 'table.json'), 'utf8')), tableSource: {}, koScale: {}, records: { subjects: {} } });

/** A copy of the fixture rig with `patch` applied to its rig.json. */
function mutated(patch: (rig: RigJson) => void): string {
  const dir = join(tempDir('kimahri-mini-'), SUBJECT);
  cpSync(join(FIX, 'rig'), dir, { recursive: true });
  const raw = JSON.parse(readFileSync(join(dir, 'rig.json'), 'utf8')) as RigJson;
  patch(raw);
  writeFileSync(join(dir, 'rig.json'), JSON.stringify(raw));
  return dir;
}

describe('the rig the pipeline made from Kimahri', () => {
  it('passes the gate: every key at overlap 0.85 or more with its painting, in band, no hole in any key or blend', async () => {
    const r = await gateRig({ rig: join(FIX, 'rig'), inputs: await inputs(), blends: true });
    expect(r.failures).toEqual([]);
    expect(r.status).toBe('ok');
    expect(r.keys.length).toBeGreaterThanOrEqual(3);
    expect(r.keys.map((k) => k.pose)).toContain('idle');
    for (const k of r.keys.filter((x) => x.pose !== 'idle')) expect(k.iou).toBeGreaterThanOrEqual(0.85);
    expect(r.size.parts).toBe(11);
    expect(r.size.bones).toBe(29);
    expect(r.holes?.rendered).toBeGreaterThan(30); // the keys and 25, 50 and 75 percent between every two
  });

  it('what the fitter claims is what the gate reads: no key is `key-fit-stale`', async () => {
    const r = await gateRig({ rig: join(FIX, 'rig'), inputs: await inputs(), blends: false });
    expect(r.failures.filter((f) => f.code === 'key-fit-stale')).toEqual([]);
    const raw = JSON.parse(readFileSync(join(FIX, 'rig', 'rig.json'), 'utf8')) as RigJson;
    for (const k of r.keys.filter((x) => x.pose !== 'idle')) expect(Math.abs((raw.keys[k.pose].fit.iou as number) - (k.iou as number))).toBeLessThan(0.05);
  });

  it('refuses the same rig with one key thrown 120 px sideways (overlap far under 0.85)', async () => {
    const pose = Object.keys((JSON.parse(readFileSync(join(FIX, 'rig', 'rig.json'), 'utf8')) as RigJson).keys).find((k) => k !== 'idle') as string;
    const dir = mutated((rig) => { rig.keys[pose].root = { ...(rig.keys[pose].root ?? {}), dx: (rig.keys[pose].root?.dx ?? 0) + 120 }; delete rig.keys[pose].fit; });
    const r = await gateRig({ rig: dir, inputs: await inputs(), blends: false });
    expect(r.status).toBe('refused');
    expect(r.failures.filter((f) => f.pose === pose).map((f) => f.code)).toContain('key-iou');
  });

  it('refuses the same rig with a key lifted off the floor (feet)', async () => {
    const pose = Object.keys((JSON.parse(readFileSync(join(FIX, 'rig', 'rig.json'), 'utf8')) as RigJson).keys).find((k) => k !== 'idle') as string;
    const dir = mutated((rig) => { rig.keys[pose].root = { ...(rig.keys[pose].root ?? {}), dy: (rig.keys[pose].root?.dy ?? 0) - 24 }; delete rig.keys[pose].fit; });
    const r = await gateRig({ rig: dir, inputs: await inputs(), blends: false });
    expect(r.status).toBe('refused');
    // the runtime's landmark check excuses the key's own declared root.dy; the silhouette's feet band (the idle's soles, 2 percent of its height) does not
    expect(r.failures.filter((f) => f.pose === pose).map((f) => f.code)).toContain('key-feet-y');
  });
});
