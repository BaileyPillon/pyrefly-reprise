/**
 * **The anime chapter's two model tools** (`tools/anime/proportion.mjs`, `retarget.mjs`, `glbkit.mjs`; the hidden anime chapter, FFX-2 only; delivery plumbing, no game data), pinned on a SYNTHETIC rig: a 24-joint Meshy-named skeleton
 * with eight vertices and two clips, made in memory, so the tests need no model file.
 *
 * 1. **The proportion pass** moves the mesh and the skeleton together: a vertex that follows the head joint is scaled about it by the head's factor, a foot vertex keeps its place against its foot, the soles stay on the floor, the new
 *    inverse-bind matrices are the inverses of the new bind-pose world matrices (so the bind pose draws the stored mesh), the bones' offsets and the clips' translation tracks follow the lengthening, the hips' track follows the hips' rise;
 * 2. **The retarget** copies a clip by bone name onto another skeleton of other lengths: the rotations as they are, the root's track by the ratio of the leg lengths, a constant lift so the feet stand where the target's rest feet stand,
 *    a clip of the same name is replaced, and a source whose constant tracks hold two keys is resampled onto the union of the key times;
 * 3. **The file round-trips** (`writeGlb` then `readGlb`), and the BIN repacks (`compactGlb`) when a rewrite left bytes behind;
 * 4. **The Valefor fit** (`tools/anime/valefor-fit.mjs`) stands a static Meshy mesh in the Wind Waker chapter's file convention: 3.5 m tall, the claws on y 0 and z 0, the body's centre line on x 0, the specks dropped, nothing else of the mesh changed.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { compactGlb, mat4Inv, readAccessor, readGlb, replaceImage, worldMatrices, writeGlb, type Glb } from '../../tools/anime/glbkit.mjs';
import { apply, proportion, type ProportionParams } from '../../tools/anime/proportion.mjs';
import { retargetClips, sample } from '../../tools/anime/retarget.mjs';
import { fitValefor } from '../../tools/anime/valefor-fit.mjs';

type V3 = [number, number, number];
interface JointDef { name: string; parent: string | null; t: V3 }

/** The Meshy 24-joint skeleton's names, parents and offsets (identity frames; legs hang down), all multiplied by `k`. */
const joints = (k: number): JointDef[] => {
  const s = (t: V3): V3 => [t[0] * k, t[1] * k, t[2] * k];
  const j: JointDef[] = [
    { name: 'Hips', parent: null, t: [0, 1.0 * k, 0] },
    { name: 'Spine02', parent: 'Hips', t: s([0, 0.1, 0]) },
    { name: 'Spine01', parent: 'Spine02', t: s([0, 0.1, 0]) },
    { name: 'Spine', parent: 'Spine01', t: s([0, 0.1, 0]) },
    { name: 'neck', parent: 'Spine', t: s([0, 0.05, 0]) },
    { name: 'Head', parent: 'neck', t: s([0, 0.07, 0]) },
    { name: 'head_end', parent: 'Head', t: s([0, 0.26, 0]) },
    { name: 'headfront', parent: 'Head', t: s([0, 0.01, 0.1]) },
  ];
  for (const side of ['Left', 'Right']) {
    const m = side === 'Left' ? 1 : -1;
    const x = (v: number): number => v * m;
    j.push(
      { name: side + 'Shoulder', parent: 'Spine', t: s([x(0.03), 0.02, 0]) },
      { name: side + 'Arm', parent: side + 'Shoulder', t: s([x(0.1), -0.02, 0]) },
      { name: side + 'ForeArm', parent: side + 'Arm', t: s([x(0.05), -0.2, 0]) },
      { name: side + 'Hand', parent: side + 'ForeArm', t: s([x(0.02), -0.2, 0]) },
      { name: side + 'UpLeg', parent: 'Hips', t: s([x(0.08), -0.05, 0]) },
      { name: side + 'Leg', parent: side + 'UpLeg', t: s([0, -0.45, 0]) },
      { name: side + 'Foot', parent: side + 'Leg', t: s([0, -0.4, 0]) },
      { name: side + 'ToeBase', parent: side + 'Foot', t: s([0, -0.06, 0.1]) },
    );
  }
  // Meshy names the toes LeftToeBase / RightToeBase
  for (const d of j) d.name = d.name.replace('ToeBase', 'ToeBase').replace(/^(Left|Right)ToeBase$/, '$1ToeBase');
  return j;
};

interface RigOpts { k: number; hipsY?: number[]; armWave?: boolean }

/** A GLB in memory: the skeleton, one skinned mesh of eight vertices, and a clip `idle` (a constant pose with a bobbing hips, and a constant leg offset held as two keys). */
function buildRig({ k, hipsY = [1.0, 0.95, 1.0], armWave = false }: RigOpts): Glb {
  const defs = joints(k);
  const names = ['Armature', 'char1', ...defs.map((d) => d.name)];
  const idx = new Map(names.map((n, i) => [n, i]));
  const nodes: Array<Record<string, unknown>> = names.map((name) => ({ name }));
  nodes[idx.get('Armature')!]!['children'] = [idx.get('Hips')!, idx.get('char1')!];
  for (const d of defs) {
    nodes[idx.get(d.name)!]!['translation'] = d.t.slice();
    nodes[idx.get(d.name)!]!['rotation'] = [0, 0, 0, 1];
    if (d.parent) {
      const p = nodes[idx.get(d.parent)!]!;
      ((p['children'] ??= []) as number[]).push(idx.get(d.name)!);
    }
  }
  nodes[idx.get('char1')!]!['mesh'] = 0;
  nodes[idx.get('char1')!]!['skin'] = 0;
  const jointIdx = defs.map((d) => idx.get(d.name)!);
  const pieces: Buffer[] = [];
  const bufferViews: Array<Record<string, number>> = [];
  const accessors: Array<Record<string, unknown>> = [];
  const push = (data: Buffer, componentType: number, count: number, type: string, extra: Record<string, unknown> = {}): number => {
    const pad = (4 - (pieces.reduce((n, b) => n + b.length, 0) % 4)) % 4;
    if (pad) pieces.push(Buffer.alloc(pad));
    const off = pieces.reduce((n, b) => n + b.length, 0);
    pieces.push(data);
    bufferViews.push({ buffer: 0, byteOffset: off, byteLength: data.length });
    accessors.push({ bufferView: bufferViews.length - 1, componentType, count, type, ...extra });
    return accessors.length - 1;
  };
  const f32 = (a: number[]): Buffer => { const b = Buffer.alloc(a.length * 4); a.forEach((v, i) => b.writeFloatLE(v, i * 4)); return b; };
  const { world } = worldMatrices({ json: { nodes }, bin: Buffer.alloc(0) } as unknown as Glb);
  const at = (name: string): V3 => { const m = world[idx.get(name)!]!; return [m[12]!, m[13]!, m[14]!]; };
  const head = at('Head');
  const foot = at('LeftFoot');
  const verts: Array<{ p: V3; w: Array<[string, number]> }> = [
    { p: [head[0] + 0.02, head[1] + 0.08 * k, head[2] + 0.08], w: [['Head', 1]] },
    { p: [0, head[1] - 0.04 * k, 0], w: [['Head', 0.5], ['neck', 0.5]] },
    { p: [foot[0], 0, 0.05], w: [['LeftFoot', 1]] },
    { p: [at('LeftLeg')[0], at('LeftLeg')[1], 0.03], w: [['LeftUpLeg', 0.5], ['LeftLeg', 0.5]] },
    { p: [at('LeftHand')[0], at('LeftHand')[1] - 0.05, 0], w: [['LeftHand', 1]] },
    { p: [0, at('Hips')[1], 0.05], w: [['Hips', 1]] },
    { p: [head[0], head[1] + 0.25 * k, head[2]], w: [['Head', 1]] }, // the crown
    { p: [head[0], head[1] - 0.02 * k, head[2] + 0.07], w: [['Head', 1]] }, // the chin
  ];
  const pos = f32(verts.flatMap((v) => v.p));
  const nor = f32(verts.flatMap(() => [0, 0, 1]));
  const jb = Buffer.alloc(verts.length * 4);
  const wb: number[] = [];
  verts.forEach((v, i) => {
    for (let c = 0; c < 4; c++) { const e = v.w[c]; jb[i * 4 + c] = e ? defs.findIndex((d) => d.name === e[0]) : 0; wb.push(e ? e[1] : 0); }
  });
  const ibm = defs.flatMap((d) => mat4Inv(world[idx.get(d.name)!]!));
  const posMin = [Math.min(...verts.map((v) => v.p[0])), Math.min(...verts.map((v) => v.p[1])), Math.min(...verts.map((v) => v.p[2]))];
  const posMax = [Math.max(...verts.map((v) => v.p[0])), Math.max(...verts.map((v) => v.p[1])), Math.max(...verts.map((v) => v.p[2]))];
  const aPos = push(pos, 5126, verts.length, 'VEC3', { min: posMin, max: posMax });
  const aNor = push(nor, 5126, verts.length, 'VEC3');
  const aJ = push(jb, 5121, verts.length, 'VEC4');
  const aW = push(f32(wb), 5126, verts.length, 'VEC4');
  const aIbm = push(f32(ibm), 5126, defs.length, 'MAT4');
  // the clip: a bobbing hips, every joint's rotation held (two keys), the left leg's offset held (two keys)
  const times3 = [0, 0.5, 1];
  const t3 = push(f32(times3), 5126, 3, 'SCALAR', { min: [0], max: [1] });
  const t2 = push(f32([0, 1]), 5126, 2, 'SCALAR', { min: [0], max: [1] });
  const samplers: Array<Record<string, unknown>> = [];
  const channels: Array<Record<string, unknown>> = [];
  const chan = (node: string, path: string, input: number, output: number): void => {
    samplers.push({ input, output, interpolation: 'LINEAR' });
    channels.push({ sampler: samplers.length - 1, target: { node: idx.get(node)!, path } });
  };
  chan('Hips', 'translation', t3, push(f32(hipsY.flatMap((y) => [0, y, 0])), 5126, 3, 'VEC3'));
  for (const d of defs) {
    const q = armWave && d.name === 'LeftArm' ? [[0, 0, 0, 1], [0, 0, Math.sin(0.15), Math.cos(0.15)], [0, 0, 0, 1]] : [[0, 0, 0, 1], [0, 0, 0, 1]];
    const n = q.length;
    chan(d.name, 'rotation', n === 3 ? t3 : t2, push(f32(q.flat()), 5126, n, 'VEC4'));
  }
  chan('LeftLeg', 'translation', t2, push(f32([...defs.find((d) => d.name === 'LeftLeg')!.t, ...defs.find((d) => d.name === 'LeftLeg')!.t]), 5126, 2, 'VEC3'));
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [idx.get('Armature')!] }],
    nodes,
    meshes: [{ name: 'Mesh_0', primitives: [{ attributes: { POSITION: aPos, NORMAL: aNor, JOINTS_0: aJ, WEIGHTS_0: aW } }] }],
    skins: [{ name: 'Armature', joints: jointIdx, inverseBindMatrices: aIbm }],
    animations: [{ name: 'idle', samplers, channels }],
    accessors,
    bufferViews,
    buffers: [{ byteLength: 0 }],
  };
  return { json, bin: Buffer.concat(pieces) } as Glb;
}

const P: ProportionParams = { head: 0.8, k: 1, leg: 1.1, spine: 1.02, arm: 1.5, slim: 1, neck: 1.1 };
const pos = (g: Glb): Float64Array => readAccessor(g, g.json.meshes[0].primitives[0].attributes.POSITION).data;
const nodeIdx = (g: Glb, name: string): number => g.json.nodes.findIndex((n: { name: string }) => n.name === name);
const worldOf = (g: Glb, name: string): V3 => { const { world } = worldMatrices(g); const m = world[nodeIdx(g, name)]!; return [m[12]!, m[13]!, m[14]!]; };

describe('the proportion pass', () => {
  it('a vertex that follows the head joint is scaled about it by the head factor; the head joint\'s own children follow', () => {
    const before = buildRig({ k: 1 });
    const headBefore = worldOf(before, 'Head');
    const v0 = Array.from(pos(before).slice(0, 3));
    const g = buildRig({ k: 1 });
    apply(g, proportion(g, P), P);
    const headAfter = worldOf(g, 'Head');
    const v1 = Array.from(pos(g).slice(0, 3));
    for (let c = 0; c < 3; c++) expect(v1[c]! - headAfter[c]!, `axis ${c}`).toBeCloseTo(P.head * (v0[c]! - headBefore[c]!), 5);
    const endBefore = worldOf(before, 'head_end');
    const endAfter = worldOf(g, 'head_end');
    expect(endAfter[1] - headAfter[1]).toBeCloseTo(P.head * (endBefore[1] - headBefore[1]), 5);
  });

  it('a foot vertex keeps its place against its foot (a bone that is not scaled), and the soles stay on y 0', () => {
    const before = buildRig({ k: 1 });
    const footBefore = worldOf(before, 'LeftFoot');
    const g = buildRig({ k: 1 });
    apply(g, proportion(g, P), P);
    const footAfter = worldOf(g, 'LeftFoot');
    const a = Array.from(pos(before).slice(6, 9));
    const b = Array.from(pos(g).slice(6, 9));
    for (let c = 0; c < 3; c++) expect(b[c]! - footAfter[c]!).toBeCloseTo(a[c]! - footBefore[c]!, 5);
    let min = Infinity;
    const p = pos(g);
    for (let i = 1; i < p.length; i += 3) min = Math.min(min, p[i]!);
    expect(min, 'the lowest vertex stays on the floor').toBeCloseTo(0, 5);
  });

  it('lengthens the leg by its factor: the knee and foot joints drop by the extra length, the hips rise by the same (the soles stay down)', () => {
    const before = buildRig({ k: 1 });
    const g = buildRig({ k: 1 });
    const r = proportion(g, P);
    apply(g, r, P);
    const kneeBefore = worldOf(before, 'LeftUpLeg')[1]! - worldOf(before, 'LeftLeg')[1]!;
    const kneeAfter = worldOf(g, 'LeftUpLeg')[1]! - worldOf(g, 'LeftLeg')[1]!;
    expect(kneeAfter / kneeBefore, 'the thigh is 1.1 times as long').toBeCloseTo(1.1, 5);
    const shinBefore = worldOf(before, 'LeftLeg')[1]! - worldOf(before, 'LeftFoot')[1]!;
    const shinAfter = worldOf(g, 'LeftLeg')[1]! - worldOf(g, 'LeftFoot')[1]!;
    expect(shinAfter / shinBefore, 'the shin too').toBeCloseTo(1.1, 5);
    expect(r.hips).toBeGreaterThan(r.hipsOld);
    expect(worldOf(g, 'Hips')[1]).toBeCloseTo(r.hips, 5);
  });

  it('the new inverse-bind matrices are the inverses of the new bind-pose world matrices: the bind pose draws the stored mesh', () => {
    const g = buildRig({ k: 1 });
    apply(g, proportion(g, P), P);
    const ibm = readAccessor(g, g.json.skins[0].inverseBindMatrices).data;
    const { world } = worldMatrices(g);
    g.json.skins[0].joints.forEach((n: number, k: number) => {
      const inv = mat4Inv(world[n]!);
      for (let c = 0; c < 16; c++) expect(ibm[k * 16 + c]!, `joint ${k} entry ${c}`).toBeCloseTo(inv[c]!, 4);
    });
  });

  it('the clips follow: the held leg offset is the thigh\'s new length, the hips\' track rises by the hips\' ratio', () => {
    const g = buildRig({ k: 1 });
    const r = proportion(g, P);
    apply(g, r, P);
    const an = g.json.animations[0];
    const find = (node: string, path: string) => an.channels.find((c: { target: { node: number; path: string } }) => c.target.node === nodeIdx(g, node) && c.target.path === path);
    const leg = readAccessor(g, an.samplers[find('LeftLeg', 'translation').sampler].output).data;
    expect(leg[1]).toBeCloseTo(-0.45 * 1.1, 5);
    expect(leg[4]).toBeCloseTo(-0.45 * 1.1, 5);
    const hips = readAccessor(g, an.samplers[find('Hips', 'translation').sampler].output).data;
    const ratio = r.hips / r.hipsOld;
    expect(hips[1]).toBeCloseTo(1.0 * ratio, 5);
    expect(hips[4]).toBeCloseTo(0.95 * ratio, 5);
    // the node's own bind offset is the first key
    expect(g.json.nodes[nodeIdx(g, 'Hips')].translation[1]).toBeCloseTo(hips[1]!, 5);
  });

  it('measures a head count, and the head count rises when the head shrinks', () => {
    const a = proportion(buildRig({ k: 1 }), { ...P, head: 1, leg: 1, spine: 1, k: 1 });
    const b = proportion(buildRig({ k: 1 }), { ...P, head: 0.7, leg: 1, spine: 1, k: 1 });
    expect(b.heads).toBeGreaterThan(a.heads);
  });
});

describe('the round trip', () => {
  const dirs: string[] = [];
  afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });
  it('writeGlb then readGlb gives the same nodes, accessors and bytes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'anime-tools-'));
    dirs.push(dir);
    const g = buildRig({ k: 1 });
    const file = join(dir, 'rig.glb');
    writeGlb(file, g.json, g.bin);
    const back = readGlb(file);
    expect(back.json.nodes).toEqual(g.json.nodes);
    expect(back.json.accessors).toEqual(g.json.accessors);
    expect(Buffer.compare(back.bin.subarray(0, g.bin.length), g.bin)).toBe(0);
  });
});

describe('the retarget', () => {
  it('samples a track between its keys: linear for positions, a normalised slerp for rotations, held outside', () => {
    expect(sample([0, 1], [0, 10], 1, 0.25, false)[0]).toBeCloseTo(2.5, 9);
    expect(sample([0, 1], [0, 10], 1, -1, false)[0]).toBe(0);
    expect(sample([0, 1], [0, 10], 1, 4, false)[0]).toBe(10);
    const q = sample([0, 1], [0, 0, 0, 1, 0, 0, Math.sin(Math.PI / 4), Math.cos(Math.PI / 4)], 4, 0.5, true);
    expect(Math.hypot(...q)).toBeCloseTo(1, 9);
    expect(q[2]).toBeCloseTo(Math.sin(Math.PI / 8), 6);
  });

  it('copies a clip by bone name: the rotations as they are, the root by the leg ratio, resampled onto the union of the key times, replacing a clip of the same name', () => {
    const dst = buildRig({ k: 1 });
    const src = buildRig({ k: 0.5, hipsY: [0.5, 0.45, 0.5], armWave: true });
    expect(dst.json.animations).toHaveLength(1);
    const { reports, ratio } = retargetClips(dst, src, [['idle', 'idle']], { calib: 'first' });
    expect(ratio, 'the target\'s legs are twice as long').toBeCloseTo(2, 6);
    expect(dst.json.animations, 'the clip of that name is replaced, not added').toHaveLength(1);
    const an = dst.json.animations[0];
    expect(an.name).toBe('idle');
    // every joint has a rotation channel; only the root has a translation channel (the others keep the node's own offsets)
    expect(an.channels.filter((c: { target: { path: string } }) => c.target.path === 'rotation')).toHaveLength(24);
    expect(an.channels.filter((c: { target: { path: string } }) => c.target.path === 'translation')).toHaveLength(1);
    expect(an.channels.filter((c: { target: { path: string } }) => c.target.path === 'scale')).toHaveLength(0);
    const arm = an.channels.find((c: { target: { node: number; path: string } }) => c.target.node === nodeIdx(dst, 'LeftArm') && c.target.path === 'rotation');
    const times = readAccessor(dst, an.samplers[arm.sampler].input).data;
    expect(Array.from(times)).toEqual([0, 0.5, 1]);
    const q = readAccessor(dst, an.samplers[arm.sampler].output).data;
    expect(q[6]).toBeCloseTo(Math.sin(0.15), 5);
    expect(q[7]).toBeCloseTo(Math.cos(0.15), 5);
    // a joint whose source track held two keys is resampled onto the three
    const spine = an.channels.find((c: { target: { node: number; path: string } }) => c.target.node === nodeIdx(dst, 'Spine') && c.target.path === 'rotation');
    expect(readAccessor(dst, an.samplers[spine.sampler].output).count).toBe(3);
    const root = an.channels.find((c: { target: { node: number; path: string } }) => c.target.node === nodeIdx(dst, 'Hips') && c.target.path === 'translation');
    const t = readAccessor(dst, an.samplers[root.sampler].output).data;
    expect(t[1]).toBeCloseTo(1.0, 5);
    expect(t[4]).toBeCloseTo(0.9, 5);
    expect(reports[0]!.keys).toBe(3);
    expect(reports[0]!.lift).toBeCloseTo(0, 5);
  });

  it('lifts the whole clip by one constant so the feet stand where the target\'s rest feet stand', () => {
    const dst = buildRig({ k: 1 });
    const src = buildRig({ k: 0.5, hipsY: [0.52, 0.52, 0.52] }); // the source stands 2 cm higher, 4 cm at the target's scale
    const { reports } = retargetClips(dst, src, [['idle', 'stand']], { calib: 'median' });
    expect(reports[0]!.lift, 'lowered by 4 cm').toBeCloseTo(-0.04, 5);
    expect(reports[0]!.toeAfter[0]).toBeCloseTo(reports[0]!.rest, 5);
    expect(reports[0]!.toeAfter[1]).toBeCloseTo(reports[0]!.rest, 5);
    expect(dst.json.animations.map((a: { name: string }) => a.name).sort()).toEqual(['idle', 'stand']);
  });

  it('a report leaves the target untouched', () => {
    const dst = buildRig({ k: 1 });
    const src = buildRig({ k: 0.5 });
    const before = JSON.stringify(dst.json.animations);
    const binBefore = dst.bin.length;
    retargetClips(dst, src, [['idle', 'other']], { report: true });
    expect(JSON.stringify(dst.json.animations)).toBe(before);
    expect(dst.bin.length).toBe(binBefore);
  });

  it('refuses a source with no such clip', () => {
    expect(() => retargetClips(buildRig({ k: 1 }), buildRig({ k: 0.5 }), [['nothing', 'x']])).toThrow(/no source clip/);
  });
});

/** A static mesh of two islands: a body strip of 14 triangles (a 2 x 8 grid, the lower row the claws at z 0.5, the upper row the head at z 0.9, x -1 to 1, y 0 to 2) and one stray triangle far away; one image. */
function staticMesh(): Glb {
  const pieces: Buffer[] = [];
  const bufferViews: Array<Record<string, number>> = [];
  const accessors: Array<Record<string, unknown>> = [];
  const push = (data: Buffer, componentType: number, count: number, type: string, extra: Record<string, unknown> = {}): number => {
    const pad = (4 - (pieces.reduce((n, b) => n + b.length, 0) % 4)) % 4;
    if (pad) pieces.push(Buffer.alloc(pad));
    const off = pieces.reduce((n, b) => n + b.length, 0);
    pieces.push(data);
    bufferViews.push({ buffer: 0, byteOffset: off, byteLength: data.length });
    accessors.push({ bufferView: bufferViews.length - 1, componentType, count, type, ...extra });
    return accessors.length - 1;
  };
  const p: number[] = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 8; i++) p.push(-1 + (i * 2) / 7, row * 2, row === 0 ? 0.5 : 0.9);
  p.push(5, 9, 0, 6, 9, 0, 5, 10, 0); // the stray triangle
  const f32 = (a: number[]): Buffer => { const b = Buffer.alloc(a.length * 4); a.forEach((v, i) => b.writeFloatLE(v, i * 4)); return b; };
  const idx: number[] = [];
  for (let i = 0; i < 7; i++) idx.push(i, i + 1, 8 + i, i + 1, 9 + i, 8 + i);
  idx.push(16, 17, 18);
  const ib = Buffer.alloc(idx.length * 4);
  idx.forEach((v, i) => ib.writeUInt32LE(v, i * 4));
  const aPos = push(f32(p), 5126, p.length / 3, 'VEC3', { min: [-1, 0, 0], max: [6, 10, 0.9] });
  const aNor = push(f32(p.map((_, i) => (i % 3 === 2 ? 1 : 0))), 5126, p.length / 3, 'VEC3');
  const aIdx = push(ib, 5125, idx.length, 'SCALAR');
  const image = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  bufferViews.push({ buffer: 0, byteOffset: pieces.reduce((n, b) => n + b.length, 0), byteLength: image.length });
  pieces.push(image);
  const json = {
    asset: { version: '2.0' },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: aPos, NORMAL: aNor }, indices: aIdx, mode: 4 }] }],
    images: [{ mimeType: 'image/jpeg', bufferView: bufferViews.length - 1 }],
    accessors,
    bufferViews,
    buffers: [{ byteLength: 0 }],
  };
  return { json, bin: Buffer.concat(pieces) } as Glb;
}

describe('the Valefor fit', () => {
  it('stands the mesh 3.5 m tall with the claws on y 0 and z 0 and the body centred on x 0, drops the stray triangle and leaves the shape alone', async () => {
    const g = staticMesh();
    const r = await fitValefor(g, { height: 3.5, minTris: 12 });
    expect(r.height).toBe(3.5);
    expect(r.scale).toBeCloseTo(1.75, 9);
    expect(r.droppedIslands).toBe(1);
    expect(r.droppedTris).toBe(1);
    const prim = g.json.meshes[0].primitives[0];
    const pos = readAccessor(g, prim.attributes.POSITION).data;
    const xs = [...Array(24).keys()].map((i) => pos[i * 3]!).slice(0, 16);
    const ys = [...Array(24).keys()].map((i) => pos[i * 3 + 1]!).slice(0, 16);
    expect(Math.min(...ys)).toBeCloseTo(0, 6);
    expect(Math.max(...ys)).toBeCloseTo(3.5, 6);
    expect(Math.min(...xs)).toBeCloseTo(-1.75, 6);
    expect(Math.max(...xs)).toBeCloseTo(1.75, 6);
    expect(pos[2], 'the claws\' z').toBeCloseTo(0, 6);
    expect(pos[8 * 3 + 2], 'the head\'s z (0.4 forward of the claws, scaled)').toBeCloseTo(0.7, 6);
    expect(readAccessor(g, prim.indices).count, 'the 14 triangles of the body').toBe(42);
    expect(g.json.accessors[prim.attributes.POSITION].min[1]).toBeCloseTo(0, 6);
    expect(r.beak![2], 'the beak is the most forward vertex of the top fifth').toBeCloseTo(0.7, 6);
    expect(r.beak![1]).toBeCloseTo(3.5, 6);
  });

  it('repacks the BIN: the replaced index list and the replaced image leave no bytes behind, every reference still points at its own data', async () => {
    const g = staticMesh();
    const before = g.bin.length;
    await fitValefor(g, { height: 3.5, minTris: 12 });
    const prim = g.json.meshes[0].primitives[0];
    // the old index accessor's view is unreferenced now: gone; the BIN is shorter than the old one plus the new index list
    expect(g.json.bufferViews.length).toBe(4);
    expect(g.bin.length).toBeLessThan(before);
    expect(Array.from(readAccessor(g, prim.indices).data.slice(0, 6))).toEqual([0, 1, 8, 1, 9, 8]);
    const im = g.json.images[0];
    expect(Array.from(g.bin.subarray(g.json.bufferViews[im.bufferView].byteOffset, g.json.bufferViews[im.bufferView].byteOffset + 4))).toEqual([0xff, 0xd8, 0xff, 0xd9]);
  });

  it('replaceImage then compactGlb swaps an image\'s bytes and frees the old ones', () => {
    const g = staticMesh();
    replaceImage(g, 0, Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]), 'image/png');
    const freed = compactGlb(g);
    expect(freed).toBe(4);
    const im = g.json.images[0];
    expect(im.mimeType).toBe('image/png');
    const bv = g.json.bufferViews[im.bufferView];
    expect(Array.from(g.bin.subarray(bv.byteOffset, bv.byteOffset + bv.byteLength))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
