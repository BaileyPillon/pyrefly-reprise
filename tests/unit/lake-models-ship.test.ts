/**
 * **What a production build ships of the hidden Wendigo chapter's models, and the gate that proves it** (ch-wendigo phase 4, 2026-11-07; Chapter 49, FFX only; `tools/dist-filter.mjs` `isLakeModelFile`,
 * `tools/lake-models-verify.mjs`, the deploy's step in `tools/deploy-pages.mjs`). The 24 models are local files (gitignored), so a release cut from a tree without them would ship the chapter on grey capsules with every
 * other gate green. Pins:
 *
 * 1. the filter ships exactly the 24 files of `LAKE_SHIPPED_FILES` and no other file of `models-exp/lake/` (an allow-list, not the whole folder), beside the 3D Bahamut's set and the Wind Waker folder, and prunes a stray;
 * 2. the verifier passes a build that carries the 24 whole, and names a missing file, an empty one, one cut short, one over the host's limit, one with a local path in its JSON chunk, one that differs from the recorded
 *    sha256, an extra file, and a record that disagrees with the code's list;
 * 3. the 3D Bahamut's verifier lets the 24 stand beside its set (they are not an "extra file" there) and still names any other;
 * 4. on the command line: a build without the folder is refused with one explanation and let through only on the capsules word; the deploy runs the check; the real source files, where this disk has them, pass.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { LAKE_SHIPPED_FILES } from '../../src/data/ffx/lake-models.ts';
import { isLakeModelFile, isShippedModelFile, isUnshippedPublicFile, pruneUnshipped, shippedDressIndex } from '../../tools/dist-filter.mjs';
import { check, readList } from '../../tools/lake-models.mjs';
import { expectedLakeFiles, verifyLakeModels } from '../../tools/lake-models-verify.mjs';
import { expectedYrpFiles, verifyYrpModels } from '../../tools/yrp-models-verify.mjs';
import { BASE, fullManifest, tinyGlb } from './helpers/yrpShip.ts';

const ROOT = join(__dirname, '..', '..');
const made: string[] = [];
const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex');
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});
const scratch = (): string => {
  const d = mkdtempSync(join(tmpdir(), 'lake-ship-'));
  made.push(d);
  return d;
};

/** A binary glTF whose header is whole and whose JSON chunk is `json` (padded with spaces to a multiple of 4), plus a little BIN chunk so each file's size differs with `salt`. */
function glb(json: string, salt = ''): Buffer {
  const text = Buffer.from(json + ' '.repeat((4 - (Buffer.byteLength(json) % 4)) % 4), 'utf8');
  const bin = Buffer.from(`bin ${salt}`.padEnd(8, ' '), 'utf8');
  const total = 12 + 8 + text.length + 8 + bin.length;
  const b = Buffer.alloc(total);
  b.write('glTF', 0, 'latin1');
  b.writeUInt32LE(2, 4);
  b.writeUInt32LE(total, 8);
  b.writeUInt32LE(text.length, 12);
  b.write('JSON', 16, 'latin1');
  text.copy(b, 20);
  b.writeUInt32LE(bin.length, 20 + text.length);
  b.write('BIN\0', 24 + text.length, 'latin1');
  bin.copy(b, 28 + text.length);
  return b;
}

const CLEAN = JSON.stringify({ asset: { version: '2.0', generator: 'Khronos glTF Blender I/O' } });
const model = (rel: string): Buffer => glb(CLEAN, rel);

interface Built { root: string; list: Array<{ path: string; bytes: number; sha256: string }> }

/** A build root holding the 24 whole files (distinct bytes each) and the record that goes with them. */
function build(): Built {
  const root = scratch();
  const list = LAKE_SHIPPED_FILES.map((path) => {
    const b = model(path);
    mkdirSync(dirname(join(root, 'models-exp', 'lake', path)), { recursive: true });
    writeFileSync(join(root, 'models-exp', 'lake', path), b);
    return { path, bytes: b.length, sha256: sha(b) };
  });
  return { root, list };
}

describe('the filter ships exactly the 24 files', () => {
  it('names each of them, in the folder the page reads, and nothing else of that folder', () => {
    expect(LAKE_SHIPPED_FILES).toHaveLength(24);
    for (const f of LAKE_SHIPPED_FILES) {
      expect(isLakeModelFile(`models-exp/lake/${f}`), f).toBe(true);
      expect(isShippedModelFile(`models-exp/lake/${f}`), f).toBe(true);
      expect(isUnshippedPublicFile(`models-exp/lake/${f}`), f).toBe(false);
    }
    for (const p of ['models-exp/lake/scratch-export.glb', 'models-exp/lake/tidus-old.glb', 'models-exp/lake/props/scratch.glb', 'models-exp/lake/weapons/brotherhood.fbx', 'models-exp/lake', 'models-exp/lake/', 'models-exp/lake-hd/tidus.glb', 'models-exp/lakes/tidus.glb', 'models-exp/lake/props', 'lake/tidus.glb']) {
      expect(isLakeModelFile(p), p).toBe(false);
    }
    expect(isUnshippedPublicFile('models-exp/lake/scratch-export.glb')).toBe(true);
    expect(isUnshippedPublicFile('models-exp/lake-hd/tidus.glb')).toBe(true);
  });

  it('leaves the other chapters\' rules alone: the Wind Waker folder still ships whole and the 3D Bahamut\'s set still ships by name', () => {
    expect(isShippedModelFile('models-exp/windwaker/anything/else.glb')).toBe(true);
    for (const p of expectedYrpFiles()) expect(isUnshippedPublicFile(p), p).toBe(false);
    expect(isUnshippedPublicFile(`${BASE}/bahamut-ai.glb`)).toBe(true);
  });

  it('prunes a build with the 24, a stray file in their folder and the other sets: the strays go, the 24 stay, and a second prune finds nothing', () => {
    const { root, list } = build();
    for (const rel of ['models-exp/lake/scratch.glb', 'models-exp/lake/props/old-temple.glb', 'models-exp/some-new-experiment/x.glb']) {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), tinyGlb());
    }
    const removed = pruneUnshipped(root).sort();
    expect(removed).toEqual(['models-exp/lake/props/old-temple.glb', 'models-exp/lake/scratch.glb', 'models-exp/some-new-experiment/x.glb']);
    expect(verifyLakeModels(root, { list })).toMatchObject({ ok: true, problems: [] });
    expect(pruneUnshipped(root)).toEqual([]);
    for (const f of LAKE_SHIPPED_FILES) expect(existsSync(join(root, 'models-exp', 'lake', f)), f).toBe(true);
  });
});

describe('the verifier', () => {
  it('passes a build that carries the 24 whole, as recorded, and nothing else of the folder', () => {
    const { root, list } = build();
    expect(verifyLakeModels(root, { list })).toMatchObject({ ok: true, problems: [], files: 24 });
    expect(expectedLakeFiles()).toHaveLength(24);
    expect(expectedLakeFiles().every((f) => f.startsWith('models-exp/lake/'))).toBe(true);
  });

  it('names a missing file, an empty one and one cut short', () => {
    const { root, list } = build();
    rmSync(join(root, 'models-exp', 'lake', 'tidus.glb'));
    writeFileSync(join(root, 'models-exp', 'lake', 'yuna.glb'), '');
    writeFileSync(join(root, 'models-exp', 'lake', 'rikku.glb'), model('rikku.glb').subarray(0, 40));
    const text = verifyLakeModels(root, { list }).problems.join('\n');
    expect(text).toMatch(/models-exp\/lake\/tidus\.glb: missing/);
    expect(text).toMatch(/models-exp\/lake\/yuna\.glb: empty/);
    expect(text).toMatch(/models-exp\/lake\/yuna\.glb: is not a binary glTF/);
    expect(text).toMatch(/models-exp\/lake\/rikku\.glb: says \d+ bytes in its header and has 40/);
  });

  it('names a file over the host\'s limit and one whose bytes differ from the record (same length, one byte flipped)', () => {
    const { root, list } = build();
    const flipped = model('wakka.glb');
    flipped[flipped.length - 1] = flipped[flipped.length - 1]! ^ 1;
    writeFileSync(join(root, 'models-exp', 'lake', 'wakka.glb'), flipped);
    const text = verifyLakeModels(root, { list, limits: { maxFileBytes: 50 } }).problems.join('\n');
    expect(text).toMatch(/models-exp\/lake\/wakka\.glb: is not the recorded file/);
    expect(text).toMatch(/is over the host's 50-byte limit for one file/);
    expect(verifyLakeModels(root, { list }).problems.join('\n')).not.toMatch(/limit/);
  });

  it('refuses a local path in a model\'s JSON chunk in a build (a drive path, a user folder, the scratch folder) and does not look in source mode', () => {
    const { root, list } = build();
    const dirty = glb(JSON.stringify({ asset: { version: '2.0', generator: 'x', extras: { from: 'D:\\Work\\export\\tidus.blend' } } }), 'tidus.glb');
    writeFileSync(join(root, 'models-exp', 'lake', 'tidus.glb'), dirty);
    const withSha = list.map((f) => (f.path === 'tidus.glb' ? { ...f, bytes: dirty.length, sha256: sha(dirty) } : f));
    expect(verifyLakeModels(root, { list: withSha }).problems.join('\n')).toMatch(/models-exp\/lake\/tidus\.glb: has a local path in a string/);
    expect(verifyLakeModels(root, { list: withSha, mode: 'source' }).ok).toBe(true);
  });

  it('names an extra file in the folder in a build, not in the source', () => {
    const { root, list } = build();
    writeFileSync(join(root, 'models-exp', 'lake', 'tidus-take2.glb'), tinyGlb());
    expect(verifyLakeModels(root, { list }).problems.join('\n')).toMatch(/models-exp\/lake\/tidus-take2\.glb: ships but is not in the set/);
    expect(verifyLakeModels(root, { list, mode: 'source' }).ok).toBe(true);
  });

  it('fails when the record and the code disagree: a file the chapter loads that the record lacks, and one the record has that the chapter does not load', () => {
    const { root, list } = build();
    const text = verifyLakeModels(root, { list: [...list.filter((f) => f.path !== 'lulu.glb'), { path: 'ghost.glb', bytes: 1, sha256: '0'.repeat(64) }] }).problems.join('\n');
    expect(text).toMatch(/models-exp\/lake\/lulu\.glb: the chapter loads it but tools\/lake\/lake-models\.json does not record it/);
    expect(text).toMatch(/models-exp\/lake\/ghost\.glb: recorded but not in LAKE_SHIPPED_FILES/);
  });

  it('reads the real record by default: the 24 files, whose names are the code\'s', () => {
    expect(readList().map((f) => f.path).sort()).toEqual([...LAKE_SHIPPED_FILES].sort());
  });
});

describe('the 3D Bahamut\'s verifier beside the 24', () => {
  /** A whole build of the 3D Bahamut's set, with the 24 beside it when asked. */
  function both(withLake: boolean): string {
    const root = scratch();
    for (const rel of expectedYrpFiles()) {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), rel.endsWith('.glb') ? tinyGlb() : '{}');
    }
    writeFileSync(join(root, BASE, 'dress', 'index.json'), JSON.stringify(shippedDressIndex(fullManifest())));
    if (withLake) {
      for (const f of LAKE_SHIPPED_FILES) {
        mkdirSync(dirname(join(root, 'models-exp', 'lake', f)), { recursive: true });
        writeFileSync(join(root, 'models-exp', 'lake', f), tinyGlb());
      }
    }
    return root;
  }

  it('passes a build that carries both sets (the 24 are not an extra file) and still names any other extra file', () => {
    expect(verifyYrpModels(both(true))).toMatchObject({ ok: true, problems: [], files: 43 });
    const root = both(true);
    writeFileSync(join(root, 'models-exp', 'lake', 'stray.glb'), tinyGlb());
    writeFileSync(join(root, 'models-exp', 'lakeish.glb'), tinyGlb());
    const text = verifyYrpModels(root).problems.join('\n');
    expect(text).toMatch(/models-exp\/lake\/stray\.glb: ships but is not in the set/);
    expect(text).toMatch(/models-exp\/lakeish\.glb: ships but is not in the set/);
    expect(text).not.toMatch(/models-exp\/lake\/tidus\.glb/);
  });
});

describe('on the command line', () => {
  const TOOL = join(ROOT, 'tools', 'lake-models-verify.mjs');
  const cli = (args: string[], env: Record<string, string> = {}): { status: number | null; out: string } => {
    const r = spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', env: { ...process.env, PYREFLY_LAKE_MODELS: '', ...env } });
    return { status: r.status, out: `${r.stdout}${r.stderr}` };
  };

  it('refuses a build with no models-exp/lake folder with one explanation (not 24 "missing" lines), and lets it through only on the capsules word', () => {
    const empty = scratch();
    const refused = cli(['--dir', empty]);
    expect(refused.status).toBe(1);
    expect(refused.out).toContain('holds no models-exp/lake folder');
    expect(refused.out).toContain('PYREFLY_LAKE_MODELS=capsules');
    expect(refused.out.split('\n').filter((l) => l.endsWith(': missing')), 'no line per missing file').toEqual([]);
    const allowed = cli(['--dir', empty], { PYREFLY_LAKE_MODELS: 'capsules' });
    expect(allowed.status).toBe(0);
    expect(allowed.out).toContain('WARNING');
  });

  it('still fails a build that has some of the files and not all, even on the capsules word', () => {
    const root = scratch();
    mkdirSync(join(root, 'models-exp', 'lake'), { recursive: true });
    writeFileSync(join(root, 'models-exp', 'lake', 'tidus.glb'), model('tidus.glb'));
    const r = cli(['--dir', root], { PYREFLY_LAKE_MODELS: 'capsules' });
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/models-exp\/lake\/yuna\.glb: missing/);
  });

  const haveSource = existsSync(join(ROOT, 'public', 'models-exp', 'lake')) && check(join(ROOT, 'public', 'models-exp', 'lake')).length === 0;
  it.runIf(haveSource)('passes the real source files of this disk (24 files, as recorded, whole)', () => {
    const r = cli(['--source', join(ROOT, 'public')]);
    expect(r.out).toContain('PASS, 24 files');
    expect(r.status).toBe(0);
  });
});

describe('the deploy runs it', () => {
  it('tools/deploy-pages.mjs runs the check on its build next to the 3D Bahamut\'s, before the build is hashed, and the build plugin enforces the same for a candidate (it sets PYREFLY_RELEASE)', () => {
    const deploy = readFileSync(join(ROOT, 'tools', 'deploy-pages.mjs'), 'utf8');
    expect(deploy).toMatch(/'lake-models-verify\.mjs'\), '--dir', DIST\]/);
    expect(deploy.indexOf('lake-models-verify.mjs')).toBeGreaterThan(deploy.indexOf('yrp-models-verify.mjs'));
    expect(deploy.indexOf('lake-models-verify.mjs')).toBeLessThan(deploy.indexOf('2b. Identity of the whole artifact'));
    const candidate = readFileSync(join(ROOT, 'tools', 'candidate-build.mjs'), 'utf8');
    expect(candidate).toContain('releaseBuildEnv({ release, host: CANDIDATE_HOST');
  });
});
