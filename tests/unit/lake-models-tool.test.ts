/**
 * **The Wendigo chapter's models travel with the build** (Chapter 49, FFX only; `tools/lake-models.mjs`, `tools/lake/lake-models.json`, ch-wendigo phase 4, 2026-11-07).
 *
 * The 24 `.glb` files in `public/models-exp/lake/` are gitignored (the repo is public, the files are 128 MiB), so a build from a clean worktree has none and the chapter would stand a capsule in every slot with nothing to say
 * so. Like the Wind Waker chapter's, the files are listed by name, size and sha256 in git, backed up (the models store and the second disk), restored and verified. This file pins:
 *
 * 1. the committed list names exactly the 24 files the chapter loads (`LAKE_SHIPPED_FILES`: ten bodies, nine weapons, five props), each under the host's 25 MiB, each shipped by the dist filter, none in git, and no local path in
 *    the list;
 * 2. `check` finds a missing file and a changed one (a same-length flip too), `copyTree` restores what is missing or different and nothing else, `backupPlaces` names the store and the second disk (or the one folder an
 *    environment value gives) and `firstGoodBackup` picks the first that holds every file whole;
 * 3. the command line fails (exit 1) on a folder that has not got them, says what is missing, `--warn` goes on, `ensure` restores from a backup and `backup` copies and verifies;
 * 4. where this disk has the real files, they match the list.
 *
 * It reads no model: the folders here are made of small fake files. Game case: FFX only (the chapter's); the tool is delivery plumbing.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { LAKE_CAST, LAKE_FILES, LAKE_MODEL_DIR, LAKE_PROP_FILES, LAKE_SHIPPED_FILES, LAKE_WEAPON_FILES } from '../../src/data/ffx/lake-models.ts';
import { CLOUDFLARE_LIMITS } from '../../tools/deploy-host.mjs';
import { isUnshippedPublicFile } from '../../tools/dist-filter.mjs';
import { LAKE_BACKUP_DATE, LAKE_MODELS_SRC, backupPlaces, check, copyTree, firstGoodBackup, readList, recordOf } from '../../tools/lake-models.mjs';

interface Listed { path: string; bytes: number; sha256: string }

const ROOT = join(__dirname, '..', '..');
const made: string[] = [];
const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');

afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A folder holding a fake file for every listed path (the content is the path itself, so each differs). */
function fakeFolder(files: readonly Listed[], skip: readonly string[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), 'lake-models-'));
  made.push(dir);
  for (const f of files) {
    if (skip.includes(f.path)) continue;
    mkdirSync(dirname(join(dir, f.path)), { recursive: true });
    writeFileSync(join(dir, f.path), Buffer.from(`fake ${f.path}`));
  }
  return dir;
}

const fakeList = (paths: readonly string[]): Listed[] => paths.map((path) => ({ path, bytes: Buffer.byteLength(`fake ${path}`), sha256: sha(Buffer.from(`fake ${path}`)) }));
const wanted = (): string[] => [...LAKE_SHIPPED_FILES].sort();

describe('the committed list', () => {
  const list: Listed[] = readList();

  it('names exactly the 24 files the chapter loads (ten bodies, nine weapons, five props), each once, with a size and a sha256', () => {
    expect(list.map((f) => f.path).sort()).toEqual(wanted());
    expect(new Set(list.map((f) => f.path)).size).toBe(24);
    expect(LAKE_SHIPPED_FILES).toHaveLength(LAKE_CAST.length + LAKE_WEAPON_FILES.length + LAKE_PROP_FILES.length);
    expect(Object.values(LAKE_FILES)).toHaveLength(10);
    for (const f of list) {
      expect(f.bytes, f.path).toBeGreaterThan(1000);
      expect(f.sha256, f.path).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('keeps every file under the host\'s per-file limit (25 MiB), so the deploy gate can take them all', () => {
    for (const f of list) expect(f.bytes, f.path).toBeLessThanOrEqual(CLOUDFLARE_LIMITS.maxFileBytes);
    expect(list.reduce((n, f) => n + f.bytes, 0), 'the whole set').toBeGreaterThan(100 * 1048576);
  });

  it('lists files the dist filter ships, in the folder the page reads', () => {
    expect(LAKE_MODEL_DIR).toBe('models-exp/lake/');
    for (const f of list) expect(isUnshippedPublicFile(`models-exp/lake/${f.path}`), f.path).toBe(false);
  });

  it('is a list and nothing more: no model is in git, no place on this PC is in the list, and the models folder is ignored', () => {
    const text = readFileSync(join(ROOT, 'tools', 'lake', 'lake-models.json'), 'utf8');
    expect(JSON.parse(text).files).toHaveLength(24);
    expect(text, 'no drive path, no user folder').not.toMatch(/[A-Za-z]:[\\/]|Users[\\/]|pyrefly-scratch/);
    expect(readFileSync(join(ROOT, '.gitignore'), 'utf8').split(/\r?\n/)).toContain('public/models-exp/');
  });
});

describe('check, recordOf and copyTree', () => {
  const paths = wanted();

  it('passes a folder that holds every listed file', () => {
    const files = fakeList(paths);
    expect(check(fakeFolder(files), files)).toEqual([]);
  });

  it('reports a missing file and a changed one, and a folder that is not there is every file missing', () => {
    const files = fakeList(paths);
    const dir = fakeFolder(files, ['tidus.glb']);
    writeFileSync(join(dir, 'wendigo.glb'), Buffer.from('changed on disk'));
    expect(check(dir, files).sort()).toEqual(['differs wendigo.glb', 'missing tidus.glb']);
    expect(check(join(tmpdir(), 'lake-models-not-there'), files)).toHaveLength(24);
  });

  it('checks the sha256 and not only the size: a copy of the right length with one byte flipped is "differs"', () => {
    const files = fakeList(paths);
    const dir = fakeFolder(files);
    const flipped = Buffer.from('fake yuna.glb');
    flipped[0] = flipped[0]! ^ 1;
    writeFileSync(join(dir, 'yuna.glb'), flipped);
    expect(statSync(join(dir, 'yuna.glb')).size, 'the same length').toBe(files.find((f) => f.path === 'yuna.glb')!.bytes);
    expect(check(dir, files)).toEqual(['differs yuna.glb']);
  });

  it('restores what is missing or different from a backup (a same-length flip too) and copies nothing else', () => {
    const files = fakeList(paths);
    const backup = fakeFolder(files);
    const dir = fakeFolder(files, ['props/temple.glb', 'weapons/katana.glb']);
    writeFileSync(join(dir, 'auron.glb'), Buffer.from('changed on disk'));
    const flipped = Buffer.from('fake lulu.glb');
    flipped[5] = flipped[5]! ^ 1;
    writeFileSync(join(dir, 'lulu.glb'), flipped);
    expect(copyTree(backup, dir, files)).toBe(4);
    expect(check(dir, files)).toEqual([]);
    expect(copyTree(backup, dir, files)).toBe(0);
  });

  it('records a folder as name, size and sha256, sorted', () => {
    const files = fakeList(paths);
    expect(recordOf(fakeFolder(files))).toEqual([...files].sort((a, b) => (a.path < b.path ? -1 : 1)));
  });
});

describe('the backup places', () => {
  it('are the models store and the second disk, each at the dated folder\'s models-exp/lake, unless the environment names one folder', () => {
    const places = backupPlaces({}).map((p) => p.replace(/\\/g, '/'));
    expect(places).toHaveLength(2);
    expect(places[0]).toMatch(new RegExp(`pyrefly-models-exp-store/${LAKE_BACKUP_DATE}/models-exp/lake$`));
    expect(places[1]).toMatch(new RegExp(`pyrefly-models-backup/${LAKE_BACKUP_DATE}/models-exp/lake$`));
    expect(places[0]).not.toBe(places[1]);
    const one = join(tmpdir(), 'lake-one-backup');
    expect(backupPlaces({ PYREFLY_LAKE_BACKUP: one })).toEqual([one]);
    expect(backupPlaces({ PYREFLY_LAKE_BACKUP: '   ' })).toHaveLength(2);
  });

  it('firstGoodBackup picks the first place that holds every file whole and skips one that is short, different or not there', () => {
    const files = fakeList(wanted());
    const short = fakeFolder(files, ['kimahri.glb']);
    const good = fakeFolder(files);
    const other = fakeFolder(files);
    expect(firstGoodBackup(files, [join(tmpdir(), 'lake-no-such'), short, good, other])).toBe(good);
    expect(firstGoodBackup(files, [short])).toBeNull();
    expect(firstGoodBackup(files, [])).toBeNull();
  });
});

describe('the real files, where this disk has them', () => {
  // The committed list is only as good as the files it was recorded from; a disk without the models (a clean worktree, a review copy) skips this and the tool's `ensure` says so at build time.
  const have = existsSync(LAKE_MODELS_SRC) && readList().every((f) => existsSync(join(LAKE_MODELS_SRC, f.path)));
  it.runIf(have)('match the list: all 24, with the recorded size and sha256', () => {
    expect(check(LAKE_MODELS_SRC)).toEqual([]);
  });
});

describe('the command line', () => {
  const run = (env: Record<string, string>, ...args: string[]) => spawnSync(process.execPath, [join(ROOT, 'tools', 'lake-models.mjs'), ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
  const NO_BACKUP = { PYREFLY_LAKE_BACKUP: join(tmpdir(), 'lake-models-no-backup-here') };

  it('fails a build folder that has not got the models, and says which are missing', () => {
    const empty = mkdtempSync(join(tmpdir(), 'lake-models-empty-'));
    made.push(empty);
    const r = run(NO_BACKUP, 'verify', '--dir', empty);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('missing tidus.glb');
    expect(r.stdout).toContain('FAIL (24)');
  });

  it('goes on under --warn and says the chapter will draw capsules', () => {
    const empty = mkdtempSync(join(tmpdir(), 'lake-models-empty-'));
    made.push(empty);
    const r = run(NO_BACKUP, 'verify', '--dir', empty, '--warn');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('capsules');
  });

  it('fails a restore when no backup holds the files, and writes nothing', () => {
    const r = run(NO_BACKUP, 'restore');
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('no backup holds all 24 files');
    expect(existsSync(join(tmpdir(), 'lake-models-no-backup-here'))).toBe(false);
  });

  it('prints its usage for an unknown command', () => {
    const r = run(NO_BACKUP, 'frobnicate');
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('usage: node tools/lake-models.mjs');
  });
});
