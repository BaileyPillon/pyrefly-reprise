/**
 * **The Wind Waker chapter's models travel with the build** (Chapter 32, FFX-2 only; `tools/ww-models.mjs`, `tools/ww/ww-models.json`, 2026-11-02).
 *
 * The eleven `.glb` files in `public/models-exp/windwaker/` are gitignored (the repo is public, the files are about 33 MB), so a build from a clean worktree has none and the chapter would stand a capsule in every
 * slot with nothing to say so. Like `public/fx`, the files are listed by name, size and sha256 in git, backed up, restored and verified. This file pins:
 *
 * 1. the committed list names exactly the files the chapter asks for (four figures, three weapons, four temple pieces), each shipped by the dist filter;
 * 2. `check` finds a missing file and a changed one, and `copyTree` restores what is missing or different and nothing else;
 * 3. the command line fails (exit 1) on a folder that has not got them, says what is missing, and `--warn` goes on.
 *
 * It reads no model: the folders here are made of small fake files. Game case: FFX-2 only (the chapter's), the tool is delivery plumbing.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { WW_MODEL_DIR, WW_PROP_DIR, WW_TEMPLE_DIR } from '../../src/data/windwaker-ids.ts';
import { MODEL_FILE, PROP_NAMES, TEMPLE_NAMES, WW_CAST, WW_PARTY_IDS } from '../../src/engine/ww3d/layout.ts';
import { ANIME_FILES } from '../../src/engine/ww3d/animeLayout.ts';
import { isUnshippedPublicFile } from '../../tools/dist-filter.mjs';
import { WW_MODELS_SRC, check, copyTree, readList, recordOf } from '../../tools/ww-models.mjs';

interface Listed { path: string; bytes: number; sha256: string }

const ROOT = join(__dirname, '..', '..');
const made: string[] = [];
const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');

afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A folder holding a fake file for every listed path (the content is the path itself, so each differs). */
function fakeFolder(files: readonly Listed[], skip: readonly string[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), 'ww-models-'));
  made.push(dir);
  for (const f of files) {
    if (skip.includes(f.path)) continue;
    mkdirSync(dirname(join(dir, f.path)), { recursive: true });
    writeFileSync(join(dir, f.path), Buffer.from(`fake ${f.path}`));
  }
  return dir;
}

const fakeList = (paths: readonly string[]): Listed[] => paths.map((path) => ({ path, bytes: Buffer.byteLength(`fake ${path}`), sha256: sha(Buffer.from(`fake ${path}`)) }));

/** The path of every file the chapter loads, relative to `public/models-exp/windwaker`. */
const wanted = (): string[] => [
  ...WW_CAST.map((id) => `${MODEL_FILE[id]}.glb`),
  ...PROP_NAMES.map((n) => `props/${n}.glb`),
  ...TEMPLE_NAMES.map((n) => `temple/${n}.glb`),
  ...WW_PARTY_IDS.map((id) => `${ANIME_FILES[id]}.glb`), // the anime chapter's three girls (the LOD1 files of the Meshy toon cast; ch-anime, 2026-11-06)
  `${ANIME_FILES['x2-valefor']}.glb`, // and its own Valefor (part 2: a Meshy feathered one); the weapons and the temple are shared
].sort();

describe('the committed list', () => {
  const list: Listed[] = readList();

  it('names exactly the fifteen files the two chapters load (the Wind Waker chapter\'s eleven and the anime chapter\'s three girls and its Valefor), each once, with a size and a sha256', () => {
    expect(list.map((f) => f.path).sort()).toEqual(wanted());
    expect(new Set(list.map((f) => f.path)).size).toBe(15);
    for (const f of list) {
      expect(f.bytes, f.path).toBeGreaterThan(1000);
      expect(f.sha256, f.path).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('lists the folders the chapter reads (the model, prop and temple folders) and each file ships in a build', () => {
    expect(WW_MODEL_DIR).toBe('models-exp/windwaker');
    expect(WW_PROP_DIR).toBe(`${WW_MODEL_DIR}/props`);
    expect(WW_TEMPLE_DIR).toBe(`${WW_MODEL_DIR}/temple`);
    for (const f of list) expect(isUnshippedPublicFile(`${WW_MODEL_DIR}/${f.path}`), f.path).toBe(false);
  });

  it('is a list and nothing more: no model is in git', () => {
    expect(JSON.parse(readFileSync(join(ROOT, 'tools', 'ww', 'ww-models.json'), 'utf8')).files).toHaveLength(15);
    const ignore = readFileSync(join(ROOT, '.gitignore'), 'utf8').split(/\r?\n/);
    expect(ignore).toContain('public/models-exp/');
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
    const dir = fakeFolder(files, ['rikku.glb']);
    writeFileSync(join(dir, 'valefor.glb'), Buffer.from('changed on disk'));
    expect(check(dir, files).sort()).toEqual(['differs valefor.glb', 'missing rikku.glb']);
    expect(check(join(tmpdir(), 'ww-models-not-there'), files)).toHaveLength(15);
  });

  it('checks the sha256 and not only the size: a copy of the right length with one byte flipped is "differs" (the review of 2026-11-02, mutant M16)', () => {
    const files = fakeList(paths);
    const dir = fakeFolder(files);
    const flipped = Buffer.from(`fake valefor.glb`);
    flipped[0] = flipped[0]! ^ 1;
    writeFileSync(join(dir, 'valefor.glb'), flipped);
    expect(statSync(join(dir, 'valefor.glb')).size, 'the same length').toBe(files.find((f) => f.path === 'valefor.glb')!.bytes);
    expect(check(dir, files)).toEqual(['differs valefor.glb']);
  });

  it('restores a same-length corrupted copy too (copyTree compares hashes, not sizes)', () => {
    const files = fakeList(paths);
    const backup = fakeFolder(files);
    const dir = fakeFolder(files);
    const flipped = Buffer.from(`fake yuna.glb`);
    flipped[5] = flipped[5]! ^ 1;
    writeFileSync(join(dir, 'yuna.glb'), flipped);
    expect(copyTree(backup, dir, files)).toBe(1);
    expect(check(dir, files)).toEqual([]);
  });

  it('restores what is missing or different from a backup and copies nothing else', () => {
    const files = fakeList(paths);
    const backup = fakeFolder(files);
    const dir = fakeFolder(files, ['props/pistol.glb', 'temple/wall.glb']);
    writeFileSync(join(dir, 'yuna.glb'), Buffer.from('changed on disk'));
    expect(copyTree(backup, dir, files)).toBe(3);
    expect(check(dir, files)).toEqual([]);
    expect(copyTree(backup, dir, files)).toBe(0);
  });

  it('records a folder as name, size and sha256, sorted', () => {
    const files = fakeList(paths);
    expect(recordOf(fakeFolder(files))).toEqual([...files].sort((a, b) => (a.path < b.path ? -1 : 1)));
  });
});

describe('the real files, where this disk has them (the review of 2026-11-02, mutant M14)', () => {
  // The committed list is only as good as the files it was recorded from. `ffx-local-guard` reads the list from git; nothing else checked that the models on a disk with them still match it, so a list recorded from a
  // stale export (or edited by hand) passed every test. A disk without the models (a clean worktree, a review copy) skips this and the tool's `ensure` says so at build time.
  const have = existsSync(WW_MODELS_SRC) && readList().every((f) => existsSync(join(WW_MODELS_SRC, f.path)));
  it.runIf(have)('match the list: all fifteen, with the recorded size and sha256', () => {
    expect(check(WW_MODELS_SRC)).toEqual([]);
  });
});

describe('the command line', () => {
  const run = (...args: string[]) => spawnSync(process.execPath, [join(ROOT, 'tools', 'ww-models.mjs'), ...args], { encoding: 'utf8', env: { ...process.env, PYREFLY_WW_BACKUP: join(tmpdir(), 'ww-models-no-backup-here') } });

  it('fails a build folder that has not got the models, and says which are missing', () => {
    const empty = mkdtempSync(join(tmpdir(), 'ww-models-empty-'));
    made.push(empty);
    const r = run('verify', '--dir', empty);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('missing yuna.glb');
    expect(r.stdout).toContain('FAIL (15)');
  });

  it('goes on under --warn and says the chapter will draw capsules', () => {
    const empty = mkdtempSync(join(tmpdir(), 'ww-models-empty-'));
    made.push(empty);
    const r = run('verify', '--dir', empty, '--warn');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('capsules');
  });

  it('fails an ensure when the folder and the backup both lack the models, and writes nothing', () => {
    const r = run('restore');
    expect(r.status).toBe(1);
    expect(existsSync(join(tmpdir(), 'ww-models-no-backup-here'))).toBe(false);
  });

  it('prints its usage for an unknown command', () => {
    const r = run('frobnicate');
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('usage: node tools/ww-models.mjs');
  });
});
