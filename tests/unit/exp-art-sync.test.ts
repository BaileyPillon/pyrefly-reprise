/**
 * The art sync for the hidden experimental Leblanc chapter (`tools/exp-art-sync.mjs`; FFX-2 only): it copies the experiment's namespace into a
 * release tree and does nothing else. Every rule is tried on small fake trees in a temporary folder, never on the real art:
 * a dry run writes nothing; an existing file is never overwritten or touched; a path outside the namespace is never copied and never allowed;
 * a target that is the source is refused; each copy is checked by its sha256 and leaves no temporary name behind.
 * `--link` (D: is nearly full) hard-links instead of copying, on one volume only: each new name is the same file as its source, with the same sha256,
 * and every rule above still holds; two volumes are refused with nothing written (the volume check takes a test seam, `deviceOf`).
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { applySync, isCleanRelative, isFxNamespacePath, isNamespacePath, planSync } from '../../tools/exp-art-sync.mjs';

const TOOL = join(__dirname, '..', '..', 'tools', 'exp-art-sync.mjs');
const sha = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex');

function put(root: string, rel: string, content: string): void {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), content);
}

/** Every file under `root` with its size and mtime: what "nothing was touched" compares. */
function listing(root: string, rel = ''): string[] {
  const out: string[] = [];
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    const here = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(`dir ${here}`, ...listing(root, here));
    else out.push(`${here} ${statSync(join(root, here)).size} ${statSync(join(root, here)).mtimeMs}`);
  }
  return out.sort();
}

const NAMESPACE_FILES = [
  'characters/exp-leblanc-yuna-gunner/idle.png',
  'characters/exp-leblanc-yuna-gunner/idle.json',
  'characters/exp-leblanc-yuna-gunner/idle@2x.png',
  'backdrops/exp-leblanc-last-room.png',
  'backdrops/exp-leblanc-last-room@2x.png',
  'portraits/exp-leblanc-yuna-x2.png',
  'pause/exp-leblanc-paine.2x.webp',
];

/** A fake workspace (the namespace, a base subject that is hard-linked in the real one, a manifest) and a fake release tree beside it. */
function fakeTrees(): { source: string; fxSource: string; target: string; fxTarget: string } {
  const base = mkdtempSync(join(tmpdir(), 'exp-art-sync-'));
  const source = join(base, 'workspace', 'art');
  const fxSource = join(base, 'workspace', 'fx');
  const target = join(base, 'release', 'public', 'art');
  const fxTarget = join(base, 'release', 'public', 'fx');
  for (const f of NAMESPACE_FILES) put(source, f, `painting ${f}`);
  put(source, 'characters/yuna-gunner/idle.png', 'the release tree\'s own painting');
  put(source, 'backdrops/leblanc-last-room.png', 'Chapter VI\'s plate');
  put(source, 'manifest.json', '{"subjects":{}}');
  put(fxSource, 'exp-leblanc-last-room/depth.png', 'depth');
  put(fxSource, 'exp-leblanc-last-room/depth.json', '{}');
  put(fxSource, 'gagazet/depth.png', 'another room');
  mkdirSync(target, { recursive: true });
  mkdirSync(fxTarget, { recursive: true });
  put(target, 'characters/yuna-gunner/idle.png', 'the release tree\'s own painting');
  return { source, fxSource, target, fxTarget };
}

describe('what the namespace is', () => {
  it('owns its four prefixes and the room\'s depth map, and nothing the release tree has', () => {
    for (const f of NAMESPACE_FILES) expect(isNamespacePath(f), f).toBe(true);
    for (const f of ['characters/yuna-gunner/idle.png', 'backdrops/leblanc-last-room.png', 'portraits/yuna-x2.png', 'pause/leblanc.png', 'manifest.json', 'title/exp-leblanc-x.png', 'exp-leblanc-last-room/depth.png']) {
      expect(isNamespacePath(f), f).toBe(false);
    }
    expect(isFxNamespacePath('exp-leblanc-last-room/depth.png')).toBe(true);
    expect(isFxNamespacePath('gagazet/depth.png')).toBe(false);
  });

  it('never lets a path leave its root: parent steps, absolute paths, drive letters, backslashes and empty segments are refused', () => {
    for (const bad of ['../x.png', 'characters/exp-leblanc-a/../../x.png', '/etc/x', 'C:/x.png', 'characters\\exp-leblanc-a\\x.png', 'characters//exp-leblanc-a/x.png', '']) {
      expect(isCleanRelative(bad), bad).toBe(false);
    }
    for (const f of NAMESPACE_FILES) expect(isCleanRelative(f), f).toBe(true);
  });
});

describe('the plan (reads sizes only)', () => {
  it('lists exactly the namespace: not the base subjects, not Chapter VI\'s plate, not the manifest, not another room\'s depth map', () => {
    const { source, fxSource, target } = fakeTrees();
    const plan = planSync({ source, target, fxSource });
    expect(plan.problems).toEqual([]);
    expect(plan.entries.map((e: { rel: string }) => e.rel).sort()).toEqual([...NAMESPACE_FILES, 'exp-leblanc-last-room/depth.json', 'exp-leblanc-last-room/depth.png'].sort());
    expect(plan.entries.every((e: { status: string }) => e.status === 'new')).toBe(true);
    expect(plan.totals.new.files).toBe(NAMESPACE_FILES.length + 2);
    expect(plan.totals.new.bytes).toBe(plan.entries.reduce((n: number, e: { size: number }) => n + e.size, 0));
  });

  it('writes nothing: the release tree is the same before and after, and so is the workspace', () => {
    const { source, fxSource, target, fxTarget } = fakeTrees();
    const before = [listing(source), listing(target), listing(fxTarget)];
    planSync({ source, target, fxSource });
    expect([listing(source), listing(target), listing(fxTarget)]).toEqual(before);
  });

  it('a file that is already there with its size is "present" and left; another size is a CONFLICT that stops everything', () => {
    const { source, fxSource, target } = fakeTrees();
    put(target, 'backdrops/exp-leblanc-last-room.png', `painting backdrops/exp-leblanc-last-room.png`); // same size
    let plan = planSync({ source, target, fxSource });
    expect(plan.problems).toEqual([]);
    expect(plan.entries.find((e: { rel: string }) => e.rel === 'backdrops/exp-leblanc-last-room.png')?.status).toBe('present');
    put(target, 'portraits/exp-leblanc-yuna-x2.png', 'someone else\'s file, another size');
    plan = planSync({ source, target, fxSource });
    expect(plan.problems.join('\n')).toMatch(/conflict.*portraits\/exp-leblanc-yuna-x2\.png/);
    expect(plan.entries.find((e: { rel: string }) => e.rel === 'portraits/exp-leblanc-yuna-x2.png')?.status).toBe('conflict');
  });

  it('refuses a target that is the source, one inside it, one that holds it, one not called art, and one that is missing', () => {
    const { source, fxSource, target } = fakeTrees();
    expect(planSync({ source, target: source, fxSource }).problems.join()).toMatch(/same folder|holds/);
    expect(planSync({ source, target: join(source, 'characters'), fxSource }).problems.length).toBeGreaterThan(0);
    expect(planSync({ source, target: dirname(source), fxSource }).problems.length).toBeGreaterThan(0);
    const notArt = join(dirname(dirname(target)), 'public', 'pictures');
    mkdirSync(notArt, { recursive: true });
    expect(planSync({ source, target: notArt, fxSource }).problems.join()).toMatch(/"art"/);
    expect(planSync({ source, target: join(dirname(target), 'nowhere', 'art'), fxSource }).problems.join()).toMatch(/not a folder/);
    expect(planSync({ source, fxSource }).problems.join()).toMatch(/--target/);
  });
});

describe('the copy', () => {
  it('copies every new file whole, checked by its sha256, leaves no temporary name, and fills the depth map beside the art', async () => {
    const { source, fxSource, target, fxTarget } = fakeTrees();
    const plan = planSync({ source, target, fxSource });
    const result = await applySync(plan);
    expect(result.failed).toEqual([]);
    expect(result.copied).toHaveLength(NAMESPACE_FILES.length + 2);
    for (const f of NAMESPACE_FILES) expect(sha(join(target, f)), f).toBe(sha(join(source, f)));
    expect(sha(join(fxTarget, 'exp-leblanc-last-room/depth.png'))).toBe(sha(join(fxSource, 'exp-leblanc-last-room/depth.png')));
    for (const c of result.copied as Array<{ dst: string; sha256: string }>) expect(sha(c.dst)).toBe(c.sha256);
    const all = [...listing(target), ...listing(fxTarget)].join('\n');
    expect(all).not.toMatch(/exp-sync|\.tmp/);
    expect(existsSync(join(target, 'manifest.json'))).toBe(false); // the release build lists the namespace itself
    expect(existsSync(join(target, 'characters/yuna-gunner/idle.png'))).toBe(true); // the release tree's own file, untouched
  });

  it('never overwrites or touches a file that is there: its bytes and its time stay as they were, a second run copies nothing', async () => {
    const { source, fxSource, target } = fakeTrees();
    const mine = 'backdrops/exp-leblanc-last-room.png';
    put(target, mine, `painting ${mine}`); // the same size, other bytes would still not be replaced: set other bytes of the same length
    writeFileSync(join(target, mine), 'PAINTING backdrops/exp-leblanc-last-room.png');
    const before = [readFileSync(join(target, mine), 'utf8'), statSync(join(target, mine)).mtimeMs];
    const first = await applySync(planSync({ source, target, fxSource }));
    expect(first.copied).toHaveLength(NAMESPACE_FILES.length + 2 - 1);
    expect([readFileSync(join(target, mine), 'utf8'), statSync(join(target, mine)).mtimeMs]).toEqual(before);
    const again = await applySync(planSync({ source, target, fxSource }));
    expect(again.copied).toEqual([]);
    expect(again.skipped).toHaveLength(NAMESPACE_FILES.length + 2);
  });

  it('refuses to copy anything while a conflict stands', async () => {
    const { source, fxSource, target } = fakeTrees();
    put(target, 'pause/exp-leblanc-paine.2x.webp', 'a different length');
    const plan = planSync({ source, target, fxSource });
    await expect(applySync(plan)).rejects.toThrow(/refusing/);
    expect(existsSync(join(target, 'characters/exp-leblanc-yuna-gunner/idle.png'))).toBe(false);
  });
});

describe('--link (hard links on one volume)', () => {
  /** One device and one inode: the same file under two names. */
  const same = (a: string, b: string): boolean => {
    const x = statSync(a, { bigint: true });
    const y = statSync(b, { bigint: true });
    return x.dev === y.dev && x.ino === y.ino && x.ino !== 0n;
  };
  const SOURCE_COUNT = NAMESPACE_FILES.length + 2; // the namespace plus the depth map's two files

  it('plans the same files as a copy, marked as links, and planning writes nothing', () => {
    const { source, fxSource, target, fxTarget } = fakeTrees();
    const before = [listing(source), listing(target), listing(fxTarget)];
    const copyPlan = planSync({ source, target, fxSource });
    const plan = planSync({ source, target, fxSource, link: true });
    expect(copyPlan.link).toBe(false);
    expect(plan.link).toBe(true);
    expect(plan.problems).toEqual([]);
    expect(plan.entries.map((e: { rel: string }) => e.rel)).toEqual(copyPlan.entries.map((e: { rel: string }) => e.rel)); // nothing outside the namespace, the same as a copy
    expect([listing(source), listing(target), listing(fxTarget)]).toEqual(before);
  });

  it('gives every new file a second name for the source\'s own bytes: the same file, the same sha256, no bytes copied, no temporary name left', async () => {
    const { source, fxSource, target, fxTarget } = fakeTrees();
    const result = await applySync(planSync({ source, target, fxSource, link: true }));
    expect(result.failed).toEqual([]);
    expect(result.copied).toHaveLength(SOURCE_COUNT);
    for (const f of NAMESPACE_FILES) {
      expect(same(join(source, f), join(target, f)), f).toBe(true);
      expect(statSync(join(target, f)).nlink, f).toBe(2); // the workspace's name and the release tree's
      expect(sha(join(target, f)), f).toBe(sha(join(source, f)));
    }
    for (const f of ['exp-leblanc-last-room/depth.png', 'exp-leblanc-last-room/depth.json']) expect(same(join(fxSource, f), join(fxTarget, f)), f).toBe(true);
    for (const c of result.copied as Array<{ dst: string; sha256: string }>) expect(sha(c.dst)).toBe(c.sha256);
    expect([...listing(target), ...listing(fxTarget)].join('\n')).not.toMatch(/exp-sync|\.tmp/);
    expect(existsSync(join(target, 'manifest.json'))).toBe(false); // the release build lists the namespace itself
    expect(statSync(join(source, 'manifest.json')).nlink).toBe(1); // the workspace's files outside the namespace gained no name
    expect(statSync(join(source, 'characters/yuna-gunner/idle.png')).nlink).toBe(1);
    expect(same(join(source, 'characters/yuna-gunner/idle.png'), join(target, 'characters/yuna-gunner/idle.png'))).toBe(false); // the release tree's own file, untouched
    expect(readFileSync(join(target, 'characters/yuna-gunner/idle.png'), 'utf8')).toBe('the release tree\'s own painting');
  });

  it('never overwrites or touches a name that is there: its bytes, time and file stay as they were, and a second run links nothing', async () => {
    const { source, fxSource, target } = fakeTrees();
    const mine = 'backdrops/exp-leblanc-last-room.png';
    put(target, mine, 'PAINTING backdrops/exp-leblanc-last-room.png'); // the same length as the source's, other bytes: "present"
    const ino = statSync(join(target, mine), { bigint: true }).ino;
    const before = [readFileSync(join(target, mine), 'utf8'), statSync(join(target, mine)).mtimeMs];
    const first = await applySync(planSync({ source, target, fxSource, link: true }));
    expect(first.failed).toEqual([]);
    expect(first.copied).toHaveLength(SOURCE_COUNT - 1);
    expect([readFileSync(join(target, mine), 'utf8'), statSync(join(target, mine)).mtimeMs]).toEqual(before);
    expect(statSync(join(target, mine), { bigint: true }).ino).toBe(ino);
    expect(same(join(source, mine), join(target, mine))).toBe(false); // left alone, never replaced by a link
    expect(statSync(join(source, mine)).nlink).toBe(1);
    const again = await applySync(planSync({ source, target, fxSource, link: true }));
    expect(again.copied).toEqual([]);
    expect(again.skipped).toHaveLength(SOURCE_COUNT);
  });

  it('refuses to link anything while a conflict stands', async () => {
    const { source, fxSource, target } = fakeTrees();
    put(target, 'pause/exp-leblanc-paine.2x.webp', 'a different length');
    const plan = planSync({ source, target, fxSource, link: true });
    await expect(applySync(plan)).rejects.toThrow(/refusing to link/);
    expect(existsSync(join(target, 'characters/exp-leblanc-yuna-gunner/idle.png'))).toBe(false);
    expect(statSync(join(source, 'characters/exp-leblanc-yuna-gunner/idle.png')).nlink).toBe(1);
  });

  it('fails on two volumes (the art\'s or the depth map\'s): refused, nothing written; a plain copy across volumes is still allowed', async () => {
    const { source, fxSource, target, fxTarget } = fakeTrees();
    const workspaceApart = (folder: string): bigint => (folder.replace(/\\/g, '/').includes('/workspace/') ? 1n : 2n); // the workspace on one volume, the release tree on another
    const plan = planSync({ source, target, fxSource, link: true, deviceOf: workspaceApart });
    expect(plan.problems.join('\n')).toMatch(/--link needs the art source and target on one volume/);
    expect(plan.entries).toEqual([]);
    await expect(applySync(plan)).rejects.toThrow(/refusing to link/);
    expect(listing(target).join('\n')).not.toMatch(/exp-leblanc/);
    expect(listing(fxTarget)).toEqual([]);
    const fxApart = (folder: string): bigint => (resolve(folder) === resolve(fxTarget) ? 2n : 1n); // only the depth map's folders differ
    expect(planSync({ source, target, fxSource, link: true, deviceOf: fxApart }).problems.join('\n')).toMatch(/--link needs the fx source and target on one volume/);
    expect(planSync({ source, target, fxSource, deviceOf: workspaceApart }).problems).toEqual([]); // a copy does not need one volume
  });
});

describe('the command line', () => {
  const run = (args: string[]) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8' });

  it('--dry-run reports the plan and writes nothing (exit 0)', () => {
    const { source, fxSource, target, fxTarget } = fakeTrees();
    const before = [listing(target), listing(fxTarget), listing(source)];
    const r = run(['--source', source, '--fx-source', fxSource, '--target', target, '--dry-run']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(new RegExp(`to copy ${NAMESPACE_FILES.length + 2} files`));
    expect(r.stdout).toMatch(/nothing is written/);
    expect([listing(target), listing(fxTarget), listing(source)]).toEqual(before);
  });

  it('exits 2 on a conflict (dry run or not) and on a missing --target, and 0 after a real copy', () => {
    const { source, fxSource, target } = fakeTrees();
    put(target, 'portraits/exp-leblanc-yuna-x2.png', 'another size');
    expect(run(['--source', source, '--fx-source', fxSource, '--target', target, '--dry-run']).status).toBe(2);
    expect(run(['--source', source, '--fx-source', fxSource, '--target', target]).status).toBe(2);
    expect(run(['--source', source, '--fx-source', fxSource]).status).toBe(2);
    const clean = fakeTrees();
    const r = run(['--source', clean.source, '--fx-source', clean.fxSource, '--target', clean.target]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/copied and verified/);
  });

  it('--link --dry-run says "to link" and writes nothing (exit 0); --link makes hard links (exit 0, two names each) and a second run has nothing to do', () => {
    const { source, fxSource, target, fxTarget } = fakeTrees();
    const before = [listing(target), listing(fxTarget), listing(source)];
    const args = ['--source', source, '--fx-source', fxSource, '--target', target, '--link'];
    const dry = run([...args, '--dry-run']);
    expect(dry.status).toBe(0);
    expect(dry.stdout).toMatch(new RegExp(`to link ${NAMESPACE_FILES.length + 2} files`));
    expect(dry.stdout).toMatch(/nothing is written/);
    expect(dry.stdout).toMatch(/no new disk space/);
    expect([listing(target), listing(fxTarget), listing(source)]).toEqual(before);
    const real = run(args);
    expect(real.status).toBe(0);
    expect(real.stdout).toMatch(new RegExp(`${NAMESPACE_FILES.length + 2} linked and verified`));
    for (const f of NAMESPACE_FILES) expect(statSync(join(target, f)).nlink, f).toBe(2);
    const again = run(args);
    expect(again.status).toBe(0);
    expect(again.stdout).toMatch(/0 linked and verified/);
  });

  it('--link exits 2 on a conflict, like a copy, and a real copy without --link makes independent files (one name each)', () => {
    const { source, fxSource, target } = fakeTrees();
    put(target, 'portraits/exp-leblanc-yuna-x2.png', 'another size');
    expect(run(['--source', source, '--fx-source', fxSource, '--target', target, '--link', '--dry-run']).status).toBe(2);
    expect(run(['--source', source, '--fx-source', fxSource, '--target', target, '--link']).status).toBe(2);
    expect(statSync(join(source, 'portraits/exp-leblanc-yuna-x2.png')).nlink).toBe(1);
    const clean = fakeTrees();
    expect(run(['--source', clean.source, '--fx-source', clean.fxSource, '--target', clean.target]).status).toBe(0);
    expect(statSync(join(clean.target, 'characters/exp-leblanc-yuna-gunner/idle.png')).nlink).toBe(1);
  });
});
