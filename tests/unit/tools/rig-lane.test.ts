/**
 * **The lane kit's Node parts** (`tools/rig/lane/`; the rig program, 2026-10-18): the recorder's argument parser, the subject registry (the real `lane-subjects.json` must be valid and must
 * name the two rigged subjects), which poses to play, the scratch Vite config it writes (it must parse), the lock and guard files, and the tracker's projection and jerk analysis. The browser
 * parts (`record.mjs`, `play.mjs`) are exercised by recording for real (docs/handoff/rig-v2-and-kit.md); here they are only syntax-checked by importing what they import.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FRAME_PATTERN, MODES, expectedOutputs, frameMs, guards, lockStatus, parseArgs, resolvePoses, subjectSpec, trackerPoints, validateSubject, viteConfigText, type SubjectSpec } from '../../../tools/rig/lane/lane-pure.mjs';
import { analyse, toSamples, type TrackRecord } from '../../../tools/rig/lane/track.mjs';
import { ROOT } from './pose-gate-fixtures.ts';

const registry = JSON.parse(readFileSync(join(ROOT, 'tools/rig/lane/lane-subjects.json'), 'utf8')) as { subjects: Record<string, SubjectSpec> };
const spec = registry.subjects['lulu']!;

describe('parseArgs', () => {
  it('reads --key value, --key=value, flags and positionals; a flag is not swallowed as the previous key\'s value', () => {
    expect(parseArgs(['new', 'zz', '--preset', 'humanoid-side', '--force', '--out=D:/x y', '--off', '--modes', 'poses,cast'])).toEqual({ _: ['new', 'zz'], preset: 'humanoid-side', force: true, out: 'D:/x y', off: true, modes: 'poses,cast' });
  });
});

describe('the subject registry', () => {
  it('is valid, names Kimahri and Lulu, and every entry can be recorded', () => {
    expect(Object.keys(registry.subjects)).toEqual(expect.arrayContaining(['kimahri', 'lulu']));
    for (const [id, s] of Object.entries(registry.subjects)) expect(validateSubject(id, s), id).toEqual([]);
    expect(registry.subjects['kimahri']!.chapter).toEqual({ door: 'gagazet', id: 'biran-yenke' });
    expect(spec.chapter).toEqual({ door: 'mushroom', id: 'sinspawn-gui' });
    expect(spec.poses).toEqual(expect.arrayContaining(['defend', 'od-fury', 'ko']));
  });

  it('says what is wrong with an entry, and what it has when an id is unknown', () => {
    expect(validateSubject('x', { actor: '', chapter: { door: 'Two Words', id: 'c' }, poses: [], track: {} })).toHaveLength(4);
    expect(validateSubject('x', { ...spec, castKeys: [1] })).toEqual(['x: castKeys must be a list of key names']);
    expect(validateSubject('x', null)).toEqual(['x: not an object']);
    expect(() => subjectSpec(registry, 'nobody')).toThrow(/has kimahri, lulu/);
    expect(() => subjectSpec({ subjects: { x: { ...spec, poses: ['Bad Pose'] } } }, 'x')).toThrow(/poses must be a list of pose names/);
    expect(subjectSpec(registry, 'lulu')).toBe(spec);
  });

  it('resolves the poses to play: all, a list, or refuses a pose the entry does not list', () => {
    expect(resolvePoses(spec, undefined)).toEqual(spec.poses);
    expect(resolvePoses(spec, 'all')).toEqual(spec.poses);
    expect(resolvePoses(spec, 'defend, ko')).toEqual(['defend', 'ko']);
    expect(() => resolvePoses(spec, 'defend,dance')).toThrow(/dance is not among/);
    expect(resolvePoses(spec, 'dance', { any: true })).toEqual(['dance']);
  });

  it('turns the tracker entry into the landmark names the page reads (feet always a list)', () => {
    expect(trackerPoints(spec)).toEqual({ head: 'headCenter', feet: ['feet'], centroid: 'pelvisCenter', hand: 'fist', tip: 'doll' });
    expect(trackerPoints(registry.subjects['kimahri']!).feet).toEqual(['soleN', 'soleF']);
    expect(trackerPoints({ ...spec, track: { head: 'h', feet: 'f', centroid: 'c' } })).toEqual({ head: 'h', feet: ['f'], centroid: 'c', hand: null, tip: null });
  });
});

describe('the scratch Vite config, the lock and the guards', () => {
  it('writes a config that parses, with the rig route, the private cache and the aliases', () => {
    const text = viteConfigText({ cacheDir: 'D:/tmp/vite-cache-lane-5881', rigsDir: 'D:/pyrefly-art-rigs', aliases: { lulu: 'lulu-v2', x: 'y' } });
    expect(text).toContain("pyreflyRigArt(\"D:/pyrefly-art-rigs\", parseAliases(\"lulu=lulu-v2,x=y\"))");
    expect(text).toContain('cacheDir: "D:/tmp/vite-cache-lane-5881"');
    expect(text).toContain("strictPort: true");
    expect(() => new Function(text.replace(/^import .*$/gm, '').replace('export default', 'return'))).not.toThrow(); // valid JavaScript once the imports are out
  });

  it('reads a lock: free, held by a live pid, stale when its pid is gone or the file is not ours', () => {
    const alive = (pid: number): boolean => pid === 100;
    expect(lockStatus(null, alive)).toEqual({ state: 'free' });
    expect(lockStatus(JSON.stringify({ pid: 100, what: 'lulu poses' }), alive)).toMatchObject({ state: 'held', by: { pid: 100 } });
    expect(lockStatus(JSON.stringify({ pid: 7 }), alive)).toMatchObject({ state: 'stale', why: 'pid 7 is gone' });
    expect(lockStatus('hello', alive)).toMatchObject({ state: 'stale', why: 'not a lock file' });
  });

  it('lists the guard files that are there (REVIEW-BROWSER stops a recording, GPU-QUIET too)', () => {
    expect(guards(() => false)).toEqual([]);
    expect(guards((p) => p.endsWith('REVIEW-BROWSER'))).toEqual(['REVIEW-BROWSER']);
    expect(guards(() => true, 'X:/q')).toEqual(['REVIEW-BROWSER', 'GPU-QUIET']);
  });

  it('knows each mode and the files it must leave (the recorder retries a mode that left none)', () => {
    expect(MODES).toEqual(['poses', 'cast', 'hurtko', 'fight', 'anim', 'anim2']);
    for (const m of MODES) expect(expectedOutputs(m).length, m).toBeGreaterThan(0);
    expect(expectedOutputs('poses')).toEqual(['poses-info.json']);
    expect(expectedOutputs('anim')).toEqual(['segments.json', 'console.json']); // the animation prototype's recording (one session a variant of the engine)
    expect(expectedOutputs('anim2')).toEqual(['segments.json', 'console.json']); // pass 2's recording (a fixed camera of its own, one video an action)
    expect(expectedOutputs('nothing')).toEqual([]);
  });

  it('steps the virtual clock 16, 17, 17 so that three frames are 50 ms: an exact 60 Hz', () => {
    expect(FRAME_PATTERN).toEqual([16, 17, 17]);
    expect([0, 1, 2, 3, 4, 5].map(frameMs)).toEqual([16, 17, 17, 16, 17, 17]);
    expect(Array.from({ length: 600 }, (_, i) => frameMs(i)).reduce((a, b) => a + b, 0)).toBe(10000);
  });
});

describe('the tracker', () => {
  // identity view and projection: a point (x, y, 0) lands at ((x * 0.5 + 0.5) * W, (-y * 0.5 + 0.5) * H)
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const rec = (n: number, x: number, pose = 'idle', rootX = 0): TrackRecord => ({ n, t: n * 16, rig: true, pose, head: [x, 0.5, 0], feet: [x, -0.5, 0], centroid: [x, 0, 0], hand: null, tip: null, root: [rootX, 0, 0], V: I, P: I });

  it('projects the points through the camera and takes the camera\'s own shift of the root out of the motion', () => {
    const s = toSamples([rec(0, 0), rec(1, 0.1)], 1600, 900);
    expect(s[0]!.fig.head).toEqual([800, 225]);
    expect(s[0]!.fig.feet).toEqual([800, 675]);
    expect(s[1]!.fig.head![0]).toBeCloseTo(880, 6);
    expect(s[0]!.fig.hand).toBeNull();
    expect(s[1]!.fig.cam).toEqual([0, 0]); // the identity camera did not move
  });

  it('finds a jerk in a figure that jumps and none in one that walks; counts pose key changes', async () => {
    const walk = Array.from({ length: 30 }, (_, i) => rec(i, i * 0.001, i < 15 ? 'idle' : 'attack'));
    const w = await analyse(toSamples(walk), ROOT);
    expect(w.frames).toBe(30);
    expect(w.jerksHeadFeetPelvis).toBe(0);
    expect(w.poseKeyChanges).toBe(1);
    expect(w.perPoint['hand']).toBeNull(); // not tracked: no number, not a zero
    const jump = Array.from({ length: 30 }, (_, i) => rec(i, i < 15 ? 0 : 0.5));
    const j = await analyse(toSamples(jump), ROOT);
    expect(j.jerksHeadFeetPelvis).toBeGreaterThan(0);
    expect(j.maxStepPxPerFrame['head']).toBeGreaterThan(300);
  });
});
