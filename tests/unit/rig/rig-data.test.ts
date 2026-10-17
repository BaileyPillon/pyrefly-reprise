import { describe, expect, it } from 'vitest';
import { costumeMatches, gateProblem, masterName, readRig } from '../../../src/engine/rig/RigData.ts';
import { makeRig, makeRigFile } from './rig-fixture.ts';

const reason = (f: unknown): string => {
  const r = readRig(f);
  return r.ok ? 'OK' : r.reason;
};

describe('readRig', () => {
  it('reads the fixture: bones, parts in draw order, landmarks, keys', () => {
    const d = makeRig();
    expect(d.bones).toHaveLength(11);
    expect(d.bones[4]).toMatchObject({ name: 'thighN', parent: 1, bx: -20, by: 10 }); // the joint's offset from its parent's joint
    expect(d.parts.map((p) => p.name)).toEqual(['tail', 'legF', 'body', 'legN', 'arm', 'head']);
    expect([...d.keys.keys()]).toEqual(['idle', 'ready', 'attack', 'hurt', 'ko']);
    expect(d.roots).toEqual([0]);
    expect(d.landmarks.get('footN')).toEqual({ bone: 5, x: 180, y: 770 });
  });

  it('a part with only a box and a bone is a rigid quad with planar uvs, v flipped for the mesh (the file is v down)', () => {
    const head = makeRig().parts.find((p) => p.name === 'head')!;
    expect([...head.verts]).toEqual([150, 110, 250, 110, 250, 250, 150, 250]);
    expect([...head.triangles]).toEqual([0, 1, 2, 0, 2, 3]);
    // top-left corner: u 0, file v 0 (down) = mesh v 1; bottom-right: u 1, mesh v 0
    expect([...head.uvs]).toEqual([0, 1, 1, 1, 1, 0, 0, 0]);
    expect([...head.boneA]).toEqual([3, 3, 3, 3]);
    expect([...head.wA]).toEqual([1, 1, 1, 1]);
    expect([...head.boneB]).toEqual([-1, -1, -1, -1]);
  });

  it('reads four-a-vertex weights and the prototype two-a-vertex form to the same skin', () => {
    const four = makeRig().parts.find((p) => p.name === 'body')!;
    expect([...four.boneA]).toEqual([2, 2, 2, 2, 1, 1]);
    expect([...four.boneB]).toEqual([-1, -1, 1, 1, -1, -1]);
    expect([...four.wA]).toEqual([1, 1, 0.5, 0.5, 1, 1]);
    const f = makeRigFile();
    const body = f.parts.find((p) => p.name === 'body')!;
    const w = body.weights!;
    body.bones = w.filter((_, i) => i % 2 === 0);
    body.weights = w.filter((_, i) => i % 2 === 1);
    const two = readRig(f);
    expect(two.ok && [...two.data.parts.find((p) => p.name === 'body')!.boneA]).toEqual([...four.boneA]);
    expect(two.ok && [...two.data.parts.find((p) => p.name === 'body')!.boneB]).toEqual([...four.boneB]);
  });

  it('the prototype uv is v UP and is kept as it is; the new uvs is v DOWN and is flipped', () => {
    const f = makeRigFile();
    const head = f.parts.find((p) => p.name === 'head')!;
    (head as unknown as Record<string, unknown>)['uv'] = [0, 0.25, 1, 0.25, 1, 0.75, 0, 0.75];
    const old = readRig(f);
    expect(old.ok && [...old.data.parts.find((p) => p.name === 'head')!.uvs]).toEqual([0, 0.25, 1, 0.25, 1, 0.75, 0, 0.75]);
    delete (head as unknown as Record<string, unknown>)['uv'];
    head.uvs = [0, 0.25, 1, 0.25, 1, 0.75, 0, 0.75];
    const now = readRig(f);
    expect(now.ok && [...now.data.parts.find((p) => p.name === 'head')!.uvs]).toEqual([0, 0.75, 1, 0.75, 1, 0.25, 0, 0.25]);
  });

  it('rim modes: a mask, the whole edge (rimEverywhere or the prototype noRim, which ignores the mask), none', () => {
    const f = makeRigFile();
    f.parts.push({ name: 'prop', order: 9, png: 'prop.png', box: [0, 0, 10, 10], bone: 'arm' }, { name: 'shaft', order: 10, png: 's.png', rim: 's.rim.png', box: [0, 0, 10, 10], bone: 'arm' });
    (f.parts[f.parts.length - 1] as unknown as Record<string, unknown>)['noRim'] = true;
    const d = readRig(f);
    if (!d.ok) throw new Error(d.reason);
    const mode = (n: string): string => d.data.parts.find((p) => p.name === n)!.rimMode;
    expect([mode('head'), mode('arm'), mode('prop'), mode('shaft')]).toEqual(['mask', 'all', 'off', 'all']);
  });

  it('says why it refuses a file', () => {
    expect(reason(null)).toMatch(/not an object/);
    expect(reason({ ...makeRigFile(), version: 2 })).toMatch(/version 2/);
    expect(reason({ ...makeRigFile(), image: { w: 0, h: 10 } })).toMatch(/image size/);
    const noIdle = makeRigFile();
    delete (noIdle.keys as Record<string, unknown>)['idle'];
    expect(reason(noIdle)).toMatch(/no "idle" key/);
    const badParent = makeRigFile();
    badParent.bones[1]!.parent = 5;
    expect(reason(badParent)).toMatch(/does not come before/);
    const badTri = makeRigFile();
    badTri.parts[2]!.triangles = [0, 1, 99];
    expect(reason(badTri)).toMatch(/out of range/);
    const noSkin = makeRigFile();
    delete (noSkin.parts[0] as { bone?: string }).bone;
    expect(reason(noSkin)).toMatch(/needs "bone"/);
    const nan = makeRigFile();
    nan.parts[0]!.box = [0, 0, Number.NaN, 5];
    expect(reason(nan)).toMatch(/bad box/);
  });

  it('keys are radians: a rotation past 2 pi (degrees by mistake) and an unknown bone are refused', () => {
    const deg = makeRigFile();
    deg.keys['attack']!.bones['arm'] = { rot: -70 };
    expect(reason(deg)).toMatch(/radians/);
    const ghost = makeRigFile();
    ghost.keys['attack']!.bones['wing'] = { rot: 0.1 };
    expect(reason(ghost)).toMatch(/no bone wing/);
  });

  it('refuses a motion block that names a bone that is not there', () => {
    const f = makeRigFile();
    f.motion!.chains![0]!.bones = ['tail0', 'tail9'];
    expect(reason(f)).toMatch(/chain names a bone/);
  });
});

describe('the gate and the costume', () => {
  it('only gate.status "ok" is drawn: refused, blocked and no gate at all are reasons', () => {
    expect(gateProblem(makeRig())).toBeNull();
    expect(gateProblem(makeRig({ gate: { status: 'refused', at: 'x', by: 'y', why: 'a hole at the knee' } }))).toBe('gate refused (a hole at the knee)');
    expect(gateProblem(makeRig({ gate: { status: 'blocked', at: 'x', by: 'y' } }))).toBe('gate blocked');
    expect(gateProblem(makeRig({ gate: undefined }))).toBe('no gate');
  });

  it('the costume matches the idle painting however the game names it', () => {
    const d = makeRig();
    for (const url of [
      '/art/characters/testfig/idle.png',
      '/pyrefly-reprise/art/characters/testfig/idle.webp',
      '/art/characters/testfig/idle%402x.png',
      '/art/characters/testfig/idle@2x.png?v=3',
      'art/characters/testfig/idle.png',
    ]) expect(costumeMatches(d, url), url).toBe(true);
    expect(costumeMatches(d, '/art/characters/testfig/attack.png')).toBe(false);
    expect(costumeMatches(d, '/art/characters/other/idle.png')).toBe(false);
    expect(masterName('art/characters/kimahri/idle.png')).toBe('characters/kimahri/idle');
    expect(costumeMatches(makeRig({ costume: { painting: 'art/characters/testfig/idle.png', sha: 'b' } }), '/art/characters/testfig/idle.webp')).toBe(true);
  });
});
