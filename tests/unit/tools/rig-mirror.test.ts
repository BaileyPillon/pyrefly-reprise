/**
 * **The release art mirror that carries the rigs, on fixtures** (the rig program, 2026-10-17; both games, shared plumbing). A mirror is a folder of hard links to the live art, so the
 * one thing that must never happen is a write through a link. The cases: the new mirror links every file of the source (same inode), holds the rigs as real copies and a manifest of its
 * own that lists them and their tiers; the source is byte for byte what it was; and the tool refuses, before it writes, anything that would go wrong later (a target that exists, a rig
 * that does not verify as a shipping rig, another volume).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, linkSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { writeManifest } from '../../../tools/gen/manifest.mjs';
import { gateRig, stampRig } from '../../../tools/rig/rig-gate-lib.mjs';
import { buildMirror, listFiles, planMirror, verifyMirror } from '../../../tools/rig/rig-mirror.mjs';
import { writeTiers } from '../../../tools/rig/rig-tiers.mjs';
import { SUBJECT, puppetWorld, tempDir } from './rig-gate-fixtures.ts';

vi.setConfig({ testTimeout: 180_000, hookTimeout: 180_000 });

let world: Awaited<ReturnType<typeof puppetWorld>>;
let rigsRoot: string;

/** A source mirror: every file of the art folder linked from a second name (nlink 2, as the live art is), and a manifest of its own. */
function sourceMirror(art: string): string {
  const m = tempDir('mirror-src-');
  for (const f of listFiles(art)) {
    mkdirSync(dirname(join(m, f)), { recursive: true });
    linkSync(join(art, f), join(m, f));
  }
  writeManifest(m, { now: '2026-10-17T00:00:00.000Z' } as never);
  return m;
}
const target = (): string => join(tempDir('mirror-out-'), 'r51');
const snapshot = (dir: string): string => listFiles(dir).map((f) => `${f}:${statSync(join(dir, f)).size}:${statSync(join(dir, f)).nlink}:${statSync(join(dir, f)).ino}`).join('\n');

beforeAll(async () => {
  world = await puppetWorld();
  stampRig(world.rig, await gateRig({ rig: world.rig, inputs: world.inputs, blends: false }));
  rigsRoot = dirname(world.rig); // <rigsRoot>/zz-puppet/rig.json
});

describe('refuses, before it writes anything', () => {
  it('a target that exists, one inside the source, and a source that is not an art folder', async () => {
    const src = sourceMirror(world.art);
    await writeTiers(world.rig);
    const there = tempDir('mirror-there-');
    expect((await planMirror({ from: src, rigsRoot, to: there })).problems.join('\n')).toMatch(/exists/);
    expect((await planMirror({ from: src, rigsRoot, to: join(src, 'inner') })).problems.join('\n')).toMatch(/inside one another/);
    expect((await planMirror({ from: tempDir('not-art-'), rigsRoot, to: target() })).problems.join('\n')).toMatch(/not an art folder/);
    expect((await planMirror({ from: src, rigsRoot, to: join(tempDir('x-'), 'public', 'art') })).problems.join('\n')).toMatch(/public\/art|does not exist/);
  });
  it('a rig that does not verify as a shipping rig against the SOURCE mirror (an unstamped one, a repainted costume, no 1x tier)', async () => {
    const src = sourceMirror(world.art);
    await writeTiers(world.rig);
    expect((await planMirror({ from: src, rigsRoot, to: target() })).ok).toBe(true);
    const w2 = await puppetWorld();
    stampRig(w2.rig, await gateRig({ rig: w2.rig, inputs: w2.inputs, blends: false }));
    const p2 = await planMirror({ from: sourceMirror(w2.art), rigsRoot: dirname(w2.rig), to: target() });
    expect(p2.ok).toBe(false);
    expect(p2.problems.join('\n')).toMatch(/tier/);
    expect((await planMirror({ from: sourceMirror(w2.art), rigsRoot: dirname(w2.rig), to: target(), makeTiers: true })).ok).toBe(true); // the tool may write the tier itself
  });
  it('another volume (a hard link cannot cross one)', async () => {
    if (!existsSync('M:/')) return; // the owner\'s machine has an M: drive, a CI box may not
    const src = sourceMirror(world.art);
    await writeTiers(world.rig);
    const plan = await planMirror({ from: src, rigsRoot, to: 'M:/pyrefly-rig-tmp/mirror-vol-test' });
    const sameVolume = statSync(src).dev === statSync('M:/pyrefly-rig-tmp').dev;
    expect(plan.problems.some((p) => /another volume/.test(p))).toBe(!sameVolume);
  });
});

describe('the new mirror', () => {
  it('links every file of the source (same inode), holds the rig as real copies and a manifest of its own that lists the rig and its tiers, and leaves the source as it was', async () => {
    await writeTiers(world.rig);
    const src = sourceMirror(world.art);
    const before = snapshot(src);
    const manifestBefore = readFileSync(join(src, 'manifest.json'), 'utf8');
    const to = target();
    const plan = await planMirror({ from: src, rigsRoot, to });
    expect(plan.problems).toEqual([]);
    const made = await buildMirror({ from: src, rigsRoot, to, plan });
    expect(made.linked).toBe(plan.links.length);
    expect(made.manifest.rigs).toEqual([SUBJECT]);
    expect(made.manifest.rigTiers[SUBJECT]).toEqual([1, 2]);
    expect(made.manifest.changedKeys).toEqual(['rigTiers', 'rigs']);
    const idle = join('characters', SUBJECT, 'idle.png');
    expect(statSync(join(to, idle)).ino).toBe(statSync(join(src, idle)).ino);
    expect(statSync(join(to, idle)).nlink).toBeGreaterThanOrEqual(3); // the art folder, the source mirror, the new mirror
    expect(statSync(join(to, 'manifest.json')).nlink).toBe(1);
    expect(statSync(join(to, 'rigs', SUBJECT, 'rig.json')).nlink).toBe(1);
    expect(readFileSync(join(to, 'rigs', SUBJECT, 'rig.json'))).toEqual(readFileSync(join(world.rig, 'rig.json')));
    expect(existsSync(join(to, 'rigs', SUBJECT, '1x', 'head.png'))).toBe(true);
    // the source: no file added or changed, no link count changed except by the new names (nlink grew by one per linked file), the manifest the same bytes
    expect(readFileSync(join(src, 'manifest.json'), 'utf8')).toBe(manifestBefore);
    expect(listFiles(src).join('\n')).toBe(before.split('\n').map((l) => l.split(':')[0]).join('\n'));
    const proved = await verifyMirror({ from: src, rigsRoot, to, plan });
    expect(proved.problems).toEqual([]);
    expect(proved.ok).toBe(true);
    expect(proved.linked).toBe(plan.links.length);
  });
  it('writes the 1x tier into the NEW copy with --make-tiers and never into the rig root', async () => {
    const w = await puppetWorld();
    stampRig(w.rig, await gateRig({ rig: w.rig, inputs: w.inputs, blends: false }));
    const root = dirname(w.rig);
    const src = sourceMirror(w.art);
    const to = target();
    const plan = await planMirror({ from: src, rigsRoot: root, to, makeTiers: true });
    expect(plan.problems).toEqual([]);
    const made = await buildMirror({ from: src, rigsRoot: root, to, plan, makeTiers: true });
    expect(made.tiered).toBeGreaterThan(4);
    expect(existsSync(join(w.rig, '1x'))).toBe(false);
    expect(existsSync(join(to, 'rigs', SUBJECT, '1x', 'torso.png'))).toBe(true);
    expect((await verifyMirror({ from: src, rigsRoot: root, to, plan })).problems).toEqual([]);
  });
  it('takes the place of a rig the source mirror already holds, in the new mirror only', async () => {
    await writeTiers(world.rig);
    const src = sourceMirror(world.art);
    mkdirSync(join(src, 'rigs', SUBJECT), { recursive: true });
    writeFileSync(join(src, 'rigs', SUBJECT, 'rig.json'), '{"old":true}');
    writeFileSync(join(src, 'rigs', SUBJECT, 'old.png'), 'x');
    const to = target();
    const plan = await planMirror({ from: src, rigsRoot, to });
    expect(plan.copies[0]!.replaces).toBe(true);
    expect(plan.links.some((f) => f.startsWith('rigs/'))).toBe(false);
    await buildMirror({ from: src, rigsRoot, to, plan });
    expect(existsSync(join(to, 'rigs', SUBJECT, 'old.png'))).toBe(false);
    expect(readFileSync(join(src, 'rigs', SUBJECT, 'rig.json'), 'utf8')).toBe('{"old":true}');
    expect((await verifyMirror({ from: src, rigsRoot, to, plan })).ok).toBe(true);
  });
  it('leaves out a rig the source mirror holds (release 59 takes Kimahri\'s rig off): not linked, not in the manifest, the source untouched', async () => {
    await writeTiers(world.rig);
    const src = sourceMirror(world.art);
    mkdirSync(join(src, 'rigs', 'zz-old'), { recursive: true });
    writeFileSync(join(src, 'rigs', 'zz-old', 'rig.json'), '{"old":true}');
    writeFileSync(join(src, 'rigs', 'zz-old', 'part.png'), 'x');
    const before = snapshot(src);
    const to = target();
    expect((await planMirror({ from: src, rigsRoot, to, without: ['zz-nope'] })).problems.join('\n')).toMatch(/no rig of that name/);
    expect((await planMirror({ from: src, rigsRoot, to, without: [SUBJECT] })).problems.join('\n')).toMatch(/both added and left out/);
    const plan = await planMirror({ from: src, rigsRoot, to, without: ['zz-old'] });
    expect(plan.problems).toEqual([]);
    expect(plan.links.some((f) => f.startsWith('rigs/zz-old/'))).toBe(false);
    const made = await buildMirror({ from: src, rigsRoot, to, plan });
    expect(made.manifest.rigs).toEqual([SUBJECT]);
    expect(existsSync(join(to, 'rigs', 'zz-old'))).toBe(false);
    expect(existsSync(join(to, 'rigs', SUBJECT, 'rig.json'))).toBe(true);
    expect(snapshot(src).split('\n').map((l) => l.split(':').slice(0, 2).join(':'))).toEqual(before.split('\n').map((l) => l.split(':').slice(0, 2).join(':')));
    expect(existsSync(join(src, 'rigs', 'zz-old', 'part.png'))).toBe(true);
    const proved = await verifyMirror({ from: src, rigsRoot, to, plan });
    expect(proved.problems).toEqual([]);
    expect(proved.ok).toBe(true);
  });
  it('is caught when it is wrong: a rig file changed in the new mirror, a linked file missing', async () => {
    await writeTiers(world.rig);
    const src = sourceMirror(world.art);
    const to = target();
    const plan = await planMirror({ from: src, rigsRoot, to });
    await buildMirror({ from: src, rigsRoot, to, plan });
    const head = join(to, 'rigs', SUBJECT, 'head.png');
    const orig = readFileSync(head);
    writeFileSync(head, Buffer.concat([orig, Buffer.from([0])])); // a real copy: writing it touches no other name
    const bad = await verifyMirror({ from: src, rigsRoot, to, plan });
    expect(bad.ok).toBe(false);
    expect(bad.problems.join('\n')).toMatch(/head\.png/);
    expect(readFileSync(join(world.rig, 'head.png'))).toEqual(orig); // the rig root's file is untouched
  });
});

describe('the command line', () => {
  it('--dry says what it would make and writes nothing', async () => {
    await writeTiers(world.rig);
    const src = sourceMirror(world.art);
    const to = target();
    const r = spawnSync(process.execPath, ['tools/art-mirror-add-rigs.mjs', '--from', src, '--rigs', rigsRoot, '--to', to, '--dry'], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/to hard-link/);
    expect(existsSync(to)).toBe(false);
  });
  it('exits 3 and writes nothing when it refuses', () => {
    const r = spawnSync(process.execPath, ['tools/art-mirror-add-rigs.mjs', '--from', tempDir('nope-'), '--rigs', rigsRoot, '--to', target()], { encoding: 'utf8' });
    expect(r.status).toBe(3);
    expect(r.stderr).toMatch(/REFUSED/);
  });
});
