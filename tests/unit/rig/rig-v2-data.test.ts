import { describe, expect, it } from 'vitest';
import { RIG_VERSIONS, type RigFile } from '../../../src/data/art/rigTypes.ts';
import { readRig } from '../../../src/engine/rig/RigData.ts';
import { HIDDEN, OWN, compileStates, describeState, keyState, partStateAt, restState, sameState } from '../../../src/engine/rig/RigPartState.ts';
import { makeRigFile } from './rig-fixture.ts';
import { makeRigFileV2 } from './rig-v2-fixture.ts';

const reason = (f: unknown): string => {
  const r = readRig(f);
  return r.ok ? 'OK' : r.reason;
};
const edit = (fn: (f: RigFile) => void): RigFile => {
  const f = structuredClone(makeRigFileV2());
  fn(f);
  return f;
};

describe('format versions: the reader accepts 1 and 2', () => {
  it('reads both versions and says what it reads when it meets another', () => {
    expect(RIG_VERSIONS).toEqual([1, 2]);
    expect(reason(makeRigFile())).toBe('OK'); // a v1 file, untouched
    expect(reason(makeRigFileV2())).toBe('OK');
    expect(reason({ ...makeRigFile(), version: 3 })).toContain('this build reads 1 and 2');
    expect(reason({ ...makeRigFile(), version: '2' })).toContain('this build reads 1 and 2');
  });

  it('a v1 file carries none of the v2 fields: a part with hidden or variants, or a key with parts, is refused', () => {
    expect(reason(edit((f) => { f.version = 1; }))).toMatch(/need version 2/);
    const v1 = makeRigFile();
    expect(reason({ ...v1, parts: v1.parts.map((p, i) => (i === 0 ? { ...p, hidden: true } : p)) })).toMatch(/hidden and variants need version 2/);
    expect(reason({ ...v1, keys: { ...v1.keys, hurt: { ...v1.keys['hurt']!, parts: {} } } })).toMatch(/parts need version 2/);
  });

  it('a v1 file reads as it always did: no hidden part, no variants, the rest state is every part with its own image', () => {
    const r = readRig(makeRigFile());
    if (!r.ok) throw new Error(r.reason);
    expect(r.data.version).toBe(1);
    expect(r.data.parts.every((p) => !p.hidden && p.variants.length === 0)).toBe(true);
    expect([...restState(r.data)]).toEqual(r.data.parts.map(() => OWN));
    for (const s of compileStates(r.data).values()) expect(sameState(s, restState(r.data))).toBe(true);
  });
});

describe('format v2: what the reader refuses', () => {
  it('reads the fixture: a hidden part, a variant on the part\'s mesh, a variant with its own mesh', () => {
    const r = readRig(makeRigFileV2());
    if (!r.ok) throw new Error(r.reason);
    const head = r.data.parts.find((p) => p.name === 'head')!;
    expect(head.variants.map((v) => v.name)).toEqual(['back', 'wide']);
    expect(head.variants[0]!.verts).toBe(head.verts); // shares the part's mesh
    expect(head.variants[1]!.verts).not.toBe(head.verts);
    expect(head.variants[1]!.box).toEqual([130, 100, 140, 160]);
    expect(head.variants[1]!.boneA[0]).toBe(r.data.boneIndex.get('head'));
    expect(r.data.parts.find((p) => p.name === 'scar')!.hidden).toBe(true);
  });

  it.each([
    ['a bad hidden', (f: RigFile) => { (f.parts[0] as unknown as Record<string, unknown>)['hidden'] = 'yes'; }, /bad hidden/],
    ['a variant with no png', (f: RigFile) => { (f.parts.find((p) => p.name === 'head')!.variants!['back'] as unknown as Record<string, unknown>)['png'] = 3; }, /variant back: bad fields/],
    ['a variant name that is not plain', (f: RigFile) => { f.parts.find((p) => p.name === 'head')!.variants!['a:b'] = { png: 'x.png' }; }, /not a plain name/],
    ['a variant mesh with a bad bone', (f: RigFile) => { f.parts.find((p) => p.name === 'head')!.variants!['wide']!.bone = 'nobody'; }, /variant wide: no bone nobody/],
    ['a key naming a part that is not there', (f: RigFile) => { f.keys['hurt']!.parts = { ghost: {} }; }, /part that is not there: ghost/],
    ['a key swapping in a variant the part lacks', (f: RigFile) => { f.keys['hurt']!.parts = { head: { image: 'front' } }; }, /no variant front/],
    ['a key with a non-boolean show', (f: RigFile) => { f.keys['hurt']!.parts = { arm: { show: 'no' as unknown as boolean } }; }, /bad fields/],
    ['an idle that names parts', (f: RigFile) => { f.keys['idle']!.parts = { arm: { show: false } }; }, /idle key names parts/],
    ['a hidden part no key shows (dead data)', (f: RigFile) => { f.keys['attack']!.parts = { head: { image: 'back' } }; }, /part scar is hidden at rest and no key shows it/],
    ['a hidden part a key only hides', (f: RigFile) => { f.keys['attack']!.parts = { head: { image: 'back' }, scar: { show: false } }; }, /no key shows it/],
  ])('refuses %s', (_name, fn, re) => {
    expect(reason(edit(fn))).toMatch(re);
  });

  it('a variant that gives a mesh but no skin is rigid on the part\'s bone; on a skinned part it must give its own', () => {
    const body = (f: RigFile): RigFile['parts'][number] => f.parts.find((p) => p.name === 'body')!;
    expect(reason(edit((f) => { body(f).variants = { alt: { png: 'b.png', box: [140, 250, 120, 250] } }; f.keys['hurt']!.parts = { body: { image: 'alt' } }; }))).toMatch(/variant alt: needs "bone"/);
    expect(reason(edit((f) => { body(f).variants = { alt: { png: 'b.png', box: [140, 250, 120, 250], bone: 'chest' } }; f.keys['hurt']!.parts = { body: { image: 'alt' } }; }))).toBe('OK');
  });
});

describe('the part state of a key is a pure function of the key and the file', () => {
  const data = (() => {
    const r = readRig(makeRigFileV2());
    if (!r.ok) throw new Error(r.reason);
    return r.data;
  })();
  const at = (s: Int16Array, name: string): number => s[data.parts.findIndex((p) => p.name === name)]!;

  it('the rest hides what is hidden; a key shows what it names, swaps what it says, hides what it hides, and leaves the rest at its default', () => {
    const rest = restState(data);
    expect(at(rest, 'scar')).toBe(HIDDEN);
    expect(at(rest, 'head')).toBe(OWN);
    const attack = keyState(data, data.keys.get('attack'));
    expect(at(attack, 'scar')).toBe(OWN); // named with {}: shown, its own image
    expect(at(attack, 'head')).toBe(0); // the variant `back`
    expect(at(attack, 'arm')).toBe(OWN); // not named: the default
    const hurt = keyState(data, data.keys.get('hurt'));
    expect(at(hurt, 'head')).toBe(1); // `wide`
    expect(at(hurt, 'arm')).toBe(HIDDEN);
    expect(at(hurt, 'scar')).toBe(HIDDEN); // no inheritance from the attack before it
    expect(keyState(data, undefined)).toEqual(rest);
  });

  it('flips at progress 0.5: the state of the key moved from below, of the key moved to from there', () => {
    const from = restState(data);
    const to = keyState(data, data.keys.get('attack'));
    expect(partStateAt(from, to, 0)).toBe(from);
    expect(partStateAt(from, to, 0.4999)).toBe(from);
    expect(partStateAt(from, to, 0.5)).toBe(to);
    expect(partStateAt(from, to, 1)).toBe(to);
  });

  it('describes a state the way the gate states it', () => {
    expect(describeState(data, keyState(data, data.keys.get('hurt')))['head']).toEqual({ shown: true, image: 'wide' });
    expect(describeState(data, restState(data))['scar']).toEqual({ shown: false, image: null });
  });
});
