/**
 * The head lock of a rig (PR-0534, r74-lulu; FFX only: Lulu's rig). `src/engine/rig/RigHeadHold.ts`.
 *
 * Round 33b's continuity harness found 397 of its 415 CHK-026 head failures on Lulu's rig: the head part's mesh read 5 to 15 percent different between keys (cast to idle 0.912, ready to cast 1.154). The reading
 * was exact, not an artefact: the head part hangs on a shell bone under the spine, the fitter scales her spine, and the head took the scale with it. The lock sets the shell bone's own scale to the inverse of the
 * scale it inherits. These tests pin (1) the rule on a small synthetic rig, and (2) on Lulu's real rig.json (the art is gitignored: skipped where `public/art/rigs/lulu` is not) that the harness's own head
 * reading, taken from the engine's skeleton, reproduces the 508 counted swaps round 33b recorded (`tests/fixtures/rig/lulu-recorded-head-swaps.json`), and that with the lock every one of them is under the 3 percent tolerance.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RigFile } from '../../../src/data/art/rigTypes.ts';
import { readRig, type RigData } from '../../../src/engine/rig/RigData.ts';
import { compileKeys } from '../../../src/engine/rig/RigKeys.ts';
import { RIG_HEAD_HOLD, holdPartSize, shellBoneOf } from '../../../src/engine/rig/RigHeadHold.ts';
import { C_SX, C_SY, CH, RigSkeleton } from '../../../src/engine/rig/RigSkeleton.ts';
import { makeRigFile } from './rig-fixture.ts';

/** The harness's head reading (`continuity-rig-probe.mjs`, `areaOf`): the area of the part's triangles after the skinning, as a linear size. */
function headSize(data: RigData, pose: Float64Array, part = 'head'): number {
  const sk = new RigSkeleton(data);
  sk.solve(pose);
  const p = data.parts.find((x) => x.name === part)!;
  const out = new Float32Array((p.verts.length / 2) * 3);
  sk.skin(p, out);
  let area = 0;
  for (let t = 0; t < p.triangles.length / 3; t++) {
    const i0 = p.triangles[t * 3]!, i1 = p.triangles[t * 3 + 1]!, i2 = p.triangles[t * 3 + 2]!;
    area += Math.abs((out[i1 * 3]! - out[i0 * 3]!) * (out[i2 * 3 + 1]! - out[i0 * 3 + 1]!) - (out[i1 * 3 + 1]! - out[i0 * 3 + 1]!) * (out[i2 * 3]! - out[i0 * 3]!)) / 2;
  }
  return Math.sqrt(area);
}

/** The small synthetic rig with the head part moved onto a shell bone under the head (as Lulu's is), and keys that scale the chest, the root and the shell itself. */
function shelled(name = 'testfig'): RigFile {
  const f = makeRigFile({ name } as Partial<RigFile>);
  f.bones = [...f.bones, { name: 'headS', parent: 3, x: 200, y: 180 }];
  f.parts = f.parts.map((p) => (p.name === 'head' ? { ...p, bone: 'headS' } : p));
  f.keys = {
    idle: { bones: {}, source: 'characters/testfig/idle' },
    grow: { bones: { chest: { sx: 1.2, sy: 1.2 } }, source: 'authored' },
    shrink: { bones: { chest: { sx: 0.9, sy: 0.9, rot: 0.1 }, root: { sx: 0.8, sy: 0.8 } }, source: 'authored' },
    front: { bones: { headS: { sx: 0.8, sy: 0.8 } }, source: 'authored' },
    flat: { bones: { pelvis: { rot: 0.1 } }, source: 'authored' },
  };
  return f;
}
const load = (f: RigFile): RigData => { const r = readRig(f); if (!r.ok) throw new Error(r.reason); return r.data; };

describe('the head lock (RigHeadHold)', () => {
  it('draws the head part at the idle\'s size in every key that scales the bones above it, and says what it did', () => {
    const data = load(shelled());
    expect(shellBoneOf(data, 'head')).toBe(data.boneIndex.get('headS'));
    const free = compileKeys(data, false);
    expect(headSize(data, free.get('grow')!) / headSize(data, free.get('idle')!)).toBeCloseTo(1.2, 4);
    expect(headSize(data, free.get('shrink')!) / headSize(data, free.get('idle')!)).toBeCloseTo(0.72, 4);
    const held = compileKeys(data, true);
    const rows = holdPartSize(data, new Map([...free].map(([k, v]) => [k, Float64Array.from(v)])), 'head');
    expect(rows.map((r) => [r.key, r.action])).toEqual([['idle', 'idle'], ['grow', 'held'], ['shrink', 'held'], ['front', 'explicit'], ['flat', 'unchanged']]);
    // 'testfig' is not in the table: compileKeys with the lock on leaves it alone; holding the part by name does the work
    expect(Object.keys(RIG_HEAD_HOLD)).toEqual(['lulu']);
    expect(headSize(data, held.get('grow')!) / headSize(data, held.get('idle')!)).toBeCloseTo(1.2, 4);
    const byName = new Map([...free].map(([k, v]) => [k, Float64Array.from(v)]));
    holdPartSize(data, byName, 'head');
    for (const k of ['grow', 'shrink', 'flat']) expect(headSize(data, byName.get(k)!) / headSize(data, byName.get('idle')!), k).toBeCloseTo(1, 4);
    const o = data.boneIndex.get('headS')! * CH;
    expect(byName.get('grow')![o + C_SX]).toBeCloseTo(1 / 1.2, 6);
    expect(byName.get('grow')![o + C_SY]).toBeCloseTo(1 / 1.2, 6);
    expect(byName.get('shrink')![o + C_SX]).toBeCloseTo(1 / 0.72, 6);
    // a key that scales the shell itself (a front-view head tucked behind another body) is the file's own: left as it is
    expect(byName.get('front')![o + C_SX]).toBe(0.8);
    expect(headSize(data, byName.get('front')!) / headSize(data, byName.get('idle')!)).toBeCloseTo(0.8, 4);
    // nothing else moves: the keys' other channels are the file's
    expect(Array.from(byName.get('grow')!.slice(0, o))).toEqual(Array.from(free.get('grow')!.slice(0, o)));
  });

  it('is on for a rig by its name: a rig called lulu is held by compileKeys, any other is not; hold=false gives the file back', () => {
    const lulu = load(shelled('lulu'));
    const size = (m: Map<string, Float64Array>, k: string): number => headSize(lulu, m.get(k)!) / headSize(lulu, m.get('idle')!);
    expect(size(compileKeys(lulu, false), 'grow')).toBeCloseTo(1.2, 4);
    expect(size(compileKeys(lulu), 'grow')).toBeCloseTo(1, 4);
    expect(size(compileKeys(lulu), 'shrink')).toBeCloseTo(1, 4);
    const other = load(shelled('kimahri'));
    expect(headSize(other, compileKeys(other).get('grow')!) / headSize(other, compileKeys(other).get('idle')!)).toBeCloseTo(1.2, 4);
  });

  it('leaves a part alone that is not rigid on one bone, and a key that hides it (format v2)', () => {
    const two = makeRigFile();
    const d2 = load(two);
    expect(shellBoneOf(d2, 'body')).toBe(-1); // the fixture's body blends the chest and the pelvis
    expect(shellBoneOf(d2, 'nothing')).toBe(-1);
    expect(holdPartSize(d2, compileKeys(d2, false), 'body')).toEqual([]);
    const v2 = shelled();
    v2.version = 2;
    v2.keys.grow = { ...v2.keys.grow!, parts: { head: { show: false } } };
    const dv = load(v2);
    const rows = holdPartSize(dv, new Map([...compileKeys(dv, false)].map(([k, v]) => [k, Float64Array.from(v)])), 'head');
    expect(rows.find((r) => r.key === 'grow')!.action).toBe('hidden');
    expect(rows.find((r) => r.key === 'shrink')!.action).toBe('held');
  });
});

// ---- Lulu's real rig, against what round 33b recorded
const RIG = resolve(__dirname, '..', '..', '..', 'public', 'art', 'rigs', 'lulu', 'rig.json');
const RECORDED = JSON.parse(readFileSync(resolve(__dirname, '..', '..', 'fixtures', 'rig', 'lulu-recorded-head-swaps.json'), 'utf8')) as {
  totals: { swaps: number; failHead: number };
  pairs: { from: string; to: string; metric: string; swaps: number; failHead: number; ratios: number[] }[];
};
const TOLERANCE = 0.03; // CHK-026: a head changes by at most 3 percent at a swap (policy size.headTolerancePct)

describe.skipIf(!existsSync(RIG))('Lulu\'s rig: round 33b\'s recorded head swaps, read again and with the lock', () => {
  const data = load(JSON.parse(readFileSync(RIG, 'utf8')) as RigFile);
  const free = compileKeys(data, false);
  const held = compileKeys(data, true);
  const size = (keys: Map<string, Float64Array>, k: string): number => headSize(data, keys.get(k)!) / headSize(data, keys.get('idle')!);

  it('the recorded fixture is the 508 counted swaps of six chapters, 397 of them over the tolerance', () => {
    expect(RECORDED.totals.swaps).toBe(508);
    expect(RECORDED.pairs.reduce((s, p) => s + p.swaps, 0)).toBe(508);
    expect(RECORDED.totals.failHead).toBe(RECORDED.pairs.reduce((s, p) => s + p.failHead, 0));
    expect(RECORDED.totals.failHead).toBe(397);
  });

  it('the engine\'s skeleton reproduces the harness\'s recorded ratio for the pairs of keys it recorded by the head mesh (so the reading was exact)', () => {
    const headPairs = RECORDED.pairs.filter((p) => p.metric === 'head');
    expect(headPairs.length).toBeGreaterThan(20);
    // a swap can be read before the figure has settled out of the previous move (a key that was cut short): its recorded ratio is then between two keys' and not the pair's. The pairs seen often are the keys'.
    const keyRatio = (p: (typeof headPairs)[number]): number => size(free, p.to) / size(free, p.from);
    const matches = (p: (typeof headPairs)[number]): boolean => p.ratios.some((r) => Math.abs(r - keyRatio(p)) < 0.0006);
    for (const p of headPairs.filter((x) => x.swaps >= 8)) expect(matches(p), `${p.from} > ${p.to} (${p.swaps} swaps) recorded ${p.ratios.join(', ')}, the keys read ${keyRatio(p).toFixed(4)}`).toBe(true);
    const matched = headPairs.filter(matches).reduce((s, p) => s + p.swaps, 0);
    expect(matched / headPairs.reduce((s, p) => s + p.swaps, 0)).toBeGreaterThan(0.95); // the rest were read mid-move
    // and the failures the harness counted are the pairs whose key-to-key ratio is over 3 percent: a pair over it is a failure, and a failure is a pair over it (or was read mid-move over it)
    for (const p of headPairs) {
      const off = Math.abs(size(free, p.to) / size(free, p.from) - 1);
      if (off > TOLERANCE + 0.002 && p.swaps >= 8) expect(p.failHead, `${p.from} > ${p.to} fails`).toBeGreaterThan(0);
      if (p.failHead > 0) expect(off > TOLERANCE || p.ratios.some((r) => Math.abs(r - 1) > TOLERANCE), `${p.from} > ${p.to} was over`).toBe(true);
    }
  });

  it('with the lock, every recorded pair of keys reads inside the tolerance: 0 of the 508 counted swaps fail (397 did)', () => {
    let over = 0, worst = 0;
    for (const p of RECORDED.pairs.filter((x) => x.metric === 'head')) {
      const ratio = size(held, p.to) / size(held, p.from);
      worst = Math.max(worst, Math.abs(ratio - 1));
      if (Math.abs(ratio - 1) > TOLERANCE) over += p.swaps;
    }
    expect(over).toBe(0);
    expect(worst).toBeLessThan(0.001);
  });

  it('the head is the idle\'s in every key but the two front-view ones (their side head is another head, read as a variant), and in every point of a move between any two keys', () => {
    for (const k of data.keys.keys()) {
      if (k === 'defend' || k === 'od-fury') { expect(size(held, k), k).toBeCloseTo(0.8, 3); continue; }
      expect(Math.abs(size(held, k) - 1), k).toBeLessThan(0.0006);
    }
    // a swap can be read before the figure has settled out of the previous move: a straight blend of any two channel sets (the front-view keys left out) keeps the head within 1.5 percent of the idle's
    const names = [...data.keys.keys()].filter((k) => k !== 'defend' && k !== 'od-fury');
    let worst = 0;
    for (const a of names) for (const b of names) {
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const pose = held.get(a)!.map((v, j) => v + (held.get(b)![j]! - v) * t);
        worst = Math.max(worst, Math.abs(headSize(data, pose) / headSize(data, held.get('idle')!) - 1));
      }
    }
    // 1.46 percent at the worst (item to ko, half way): a swap read with both ends mid-move is still under the 3 percent
    expect(worst).toBeLessThan(0.015);
    expect((1 + worst) / (1 - worst)).toBeLessThan(1 + TOLERANCE);
  });

  it('what it costs: only the head shell bone differs from the file\'s keys, and the free keys are the 5 to 15 percent the harness saw', () => {
    const shell = data.boneIndex.get('headS')!;
    for (const [k, pose] of held) {
      const was = free.get(k)!;
      for (let j = 0; j < pose.length; j++) if (j < shell * CH || j >= (shell + 1) * CH) expect(pose[j], `${k}[${j}]`).toBe(was[j]);
    }
    const drift = [...free.keys()].filter((k) => k !== 'defend' && k !== 'od-fury').map((k) => Math.abs(size(free, k) - 1));
    expect(Math.max(...drift)).toBeGreaterThan(0.09);
  });
});

// The lock is Lulu's alone: every other rig the game ships compiles to the very same channels with it on and off, so Chapter I (Seymour's body), Chapter IV (FFX-2's Bahamut) and every other rig chapter read as they did.
const RIGS_DIR = resolve(__dirname, '..', '..', '..', 'public', 'art', 'rigs');
describe.skipIf(!existsSync(RIG))('the lock changes no other rig', () => {
  it('every other shipped rig compiles to the same channels with the lock on and off', () => {
    let read = 0;
    for (const name of readdirSync(RIGS_DIR).filter((n) => n !== 'lulu' && existsSync(resolve(RIGS_DIR, n, 'rig.json')))) {
      const r = readRig(JSON.parse(readFileSync(resolve(RIGS_DIR, name, 'rig.json'), 'utf8')));
      if (!r.ok) continue;
      read++;
      const on = compileKeys(r.data, true), off = compileKeys(r.data, false);
      expect([...on.keys()], name).toEqual([...off.keys()]);
      for (const [k, pose] of on) expect(Array.from(pose), `${name}/${k}`).toEqual(Array.from(off.get(k)!));
    }
    expect(read).toBeGreaterThanOrEqual(5);
  });
});
