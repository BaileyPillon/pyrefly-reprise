/**
 * **The verifier and the real files** (ch-yrp, 2026-11-02; FFX-2 only; `tools/yrp-models-verify.mjs`, `tools/dist-filter.mjs`; the rule itself is in `yrp-ship-set.test.ts`). What it pins:
 *
 * 1. **The verifier** (run on a build before it deploys): passes a pruned tree, and names a missing file, a cut-short glTF, a file the host would refuse, an extra file and an untrimmed manifest.
 * 2. **The real files** (skipped when the models are not on this disk): every file of the set is there, a valid binary glTF (or JSON), under the host's 25 MiB per-file limit, and the shipped manifest's folders all have their files.
 *
 * Game case: FFX-2 only (the models are the game's own Yuna, Rikku, Paine and Bahamut); the check is shared delivery plumbing.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { YRP_SHIPPED_BASE_FILES, YRP_SHIPPED_DRESS_FOLDERS, YRP_SHIPPED_HD_FILES } from '../../src/data/yrp-ids.ts';
import { parseDressIndex } from '../../src/engine/yrp3d/dress.ts';
import { CLOUDFLARE_LIMITS } from '../../tools/deploy-host.mjs';
import { isUnshippedPublicFile, pruneUnshipped, shippedDressIndex } from '../../tools/dist-filter.mjs';
import { expectedYrpFiles, verifyYrpModels } from '../../tools/yrp-models-verify.mjs';
import { BASE, HD, fullManifest, tinyGlb } from './helpers/yrpShip.ts';

let tmp: string | null = null;
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

describe('the verifier', () => {
  /** A pruned build with whole stand-in files: every file of the set, a trimmed manifest. */
  function wholeBuild(): string {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-yrp-verify-'));
    for (const rel of expectedYrpFiles()) {
      mkdirSync(dirname(join(tmp, rel)), { recursive: true });
      writeFileSync(join(tmp, rel), rel.endsWith('.glb') ? tinyGlb() : '{}');
    }
    writeFileSync(join(tmp, BASE, 'dress', 'index.json'), JSON.stringify(shippedDressIndex(fullManifest())));
    return tmp;
  }

  it('lists the set: 12 base files, 2 HD files, the manifest and 28 dress files', () => {
    const files = expectedYrpFiles();
    expect(files).toHaveLength(43);
    expect(new Set(files).size).toBe(43);
    expect(files.every((f) => f.startsWith('models-exp/'))).toBe(true);
    for (const f of files) expect(isUnshippedPublicFile(f), f).toBe(false); // the verifier and the filter agree on every file
  });

  it('passes a whole build and a whole source tree', () => {
    const root = wholeBuild();
    expect(verifyYrpModels(root)).toMatchObject({ ok: true, problems: [], files: 43 });
    expect(verifyYrpModels(root, { mode: 'source' }).ok).toBe(true);
  });

  it('passes what pruneUnshipped leaves of a full copy (the filter and the verifier agree end to end)', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-yrp-verify-'));
    const files: Record<string, string> = {};
    for (const f of expectedYrpFiles()) files[f] = f.endsWith('.glb') ? tinyGlb().toString('latin1') : '{}';
    const manifest = fullManifest();
    for (const e of manifest.entries) {
      files[`${BASE}/dress/${e['folder'] as string}/anims.glb`] = tinyGlb().toString('latin1');
      files[`${BASE}/dress/${e['folder'] as string}/clipmap.json`] = '{}';
      files[`${BASE}/dress/${e['folder'] as string}/hd/anims.glb`] = tinyGlb().toString('latin1');
    }
    for (const f of ['bahamut-ai.glb', 'bahamut-ai-rigged.glb']) files[`${BASE}/${f}`] = tinyGlb().toString('latin1');
    files[`${HD}/yuna.glb`] = tinyGlb().toString('latin1');
    files[`${BASE}/dress/index.json`] = JSON.stringify(manifest);
    for (const [rel, text] of Object.entries(files)) {
      mkdirSync(dirname(join(tmp, rel)), { recursive: true });
      writeFileSync(join(tmp, rel), Buffer.from(text, 'latin1'));
    }
    expect(verifyYrpModels(tmp).problems.length, 'before the prune the build carries extras and the full manifest').toBeGreaterThan(0);
    pruneUnshipped(tmp);
    expect(verifyYrpModels(tmp)).toMatchObject({ ok: true, problems: [] });
  });

  it('names a missing file', () => {
    const root = wholeBuild();
    rmSync(join(root, BASE, 'dress', 'yuna-white-mage', 'anims.glb'));
    rmSync(join(root, HD, 'bahamut.glb'));
    const r = verifyYrpModels(root);
    expect(r.ok).toBe(false);
    expect(r.problems).toEqual(expect.arrayContaining([`${BASE}/dress/yuna-white-mage/anims.glb: missing`, `${HD}/bahamut.glb: missing`]));
  });

  it('names a cut-short glTF, a file that is not a glTF, an empty file and a clip map that is not JSON', () => {
    const root = wholeBuild();
    writeFileSync(join(root, BASE, 'yuna.glb'), tinyGlb().subarray(0, 23)); // header says 24, the file has 23
    writeFileSync(join(root, BASE, 'rikku.glb'), '<html>an index page where a model should be</html>');
    writeFileSync(join(root, BASE, 'paine.glb'), '');
    writeFileSync(join(root, BASE, 'clipmap.json'), '<html>');
    const text = verifyYrpModels(root).problems.join('\n');
    expect(text).toMatch(/yuna\.glb: says 24 bytes in its header and has 23/);
    expect(text).toMatch(/rikku\.glb: is not a binary glTF/);
    expect(text).toMatch(/paine\.glb: empty/);
    expect(text).toMatch(/clipmap\.json: is not JSON/);
  });

  it('names a file over the host\'s per-file limit (the limit is injected here: a real one is 25 MiB)', () => {
    const root = wholeBuild();
    const r = verifyYrpModels(root, { limits: { maxFileBytes: 20 } });
    expect(r.ok).toBe(false);
    expect(r.problems.some((p) => p.includes('is over the host'))).toBe(true);
  });

  it('names an extra file in a build (the AI boss, an HD dressphere) but allows it in the source tree', () => {
    const root = wholeBuild();
    mkdirSync(join(root, BASE, 'dress', 'yuna-gunner', 'hd'), { recursive: true });
    writeFileSync(join(root, BASE, 'bahamut-ai.glb'), tinyGlb());
    writeFileSync(join(root, BASE, 'dress', 'yuna-gunner', 'hd', 'anims.glb'), tinyGlb());
    const text = verifyYrpModels(root).problems.join('\n');
    expect(text).toMatch(/models-exp\/yrp\/bahamut-ai\.glb: ships but is not in the set/);
    expect(text).toMatch(/yuna-gunner\/hd\/anims\.glb: ships but is not in the set/);
    expect(verifyYrpModels(root, { mode: 'source' }).ok).toBe(true);
  });

  it('names an untrimmed manifest: all the folders, or an entry that still asks for an HD file', () => {
    const root = wholeBuild();
    writeFileSync(join(root, BASE, 'dress', 'index.json'), JSON.stringify(fullManifest()));
    expect(verifyYrpModels(root).problems.join('\n')).toMatch(/index\.json: lists 42 folder\(s\), not the 14 that ship/);
    const trimmed = shippedDressIndex(fullManifest())!;
    trimmed.entries[0]!['hd'] = true;
    writeFileSync(join(root, BASE, 'dress', 'index.json'), JSON.stringify(trimmed));
    expect(verifyYrpModels(root).problems.join('\n')).toMatch(/still asks for an HD file/);
  });

  it('fails an empty tree with a line for every file of the set', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-yrp-verify-'));
    const r = verifyYrpModels(tmp);
    expect(r.ok).toBe(false);
    expect(r.problems).toHaveLength(43);
    expect(r.problems.every((p) => p.endsWith(': missing'))).toBe(true);
  });
});

// ---- the command line, and the deploy that runs it (review MAJOR-3) -------------------------------------------------
describe('the deploy gate', () => {
  const TOOL = join(process.cwd(), 'tools', 'yrp-models-verify.mjs');
  const cli = (dir: string, env: Record<string, string> = {}): { status: number | null; out: string } => {
    const r = spawnSync(process.execPath, [TOOL, '--dir', dir], { encoding: 'utf8', env: { ...process.env, PYREFLY_YRP_MODELS: '', ...env } });
    return { status: r.status, out: `${r.stdout}${r.stderr}` };
  };

  it('refuses a build cut from a tree without the models, in one explanation, and names the way to fix it', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-yrp-gate-'));
    writeFileSync(join(tmp, 'index.html'), '<html>');
    const r = cli(tmp);
    expect(r.status).toBe(1);
    expect(r.out).toContain('FAIL');
    expect(r.out).toContain('holds no models-exp folder');
    expect(r.out).toContain('grey capsules');
    expect(r.out).toContain('PYREFLY_YRP_MODELS=capsules');
    expect(r.out.split('\n').filter((l) => l.endsWith(': missing')), 'no line per missing file').toEqual([]);
  });

  it('lets a build with no models folder through only when the run says capsules on purpose, with a warning', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-yrp-gate-'));
    const r = cli(tmp, { PYREFLY_YRP_MODELS: 'capsules' });
    expect(r.status).toBe(0);
    expect(r.out).toContain('WARNING');
    expect(r.out).toContain('grey capsules');
    expect(cli(tmp, { PYREFLY_YRP_MODELS: 'yes' }).status, 'any other value').toBe(1);
  });

  it('never lets a half-there set through, even when capsules were asked for', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-yrp-gate-'));
    mkdirSync(join(tmp, BASE), { recursive: true });
    writeFileSync(join(tmp, BASE, 'yuna.glb'), tinyGlb());
    const r = cli(tmp, { PYREFLY_YRP_MODELS: 'capsules' });
    expect(r.status).toBe(1);
    expect(r.out).toContain('yuna-anims.glb: missing');
  });

  it('passes a whole, pruned build', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-yrp-gate-'));
    for (const rel of expectedYrpFiles()) {
      mkdirSync(dirname(join(tmp, rel)), { recursive: true });
      writeFileSync(join(tmp, rel), rel.endsWith('.glb') ? tinyGlb() : '{}');
    }
    writeFileSync(join(tmp, BASE, 'dress', 'index.json'), JSON.stringify(shippedDressIndex(fullManifest())));
    const r = cli(tmp);
    expect(r.status).toBe(0);
    expect(r.out).toContain('PASS, 43 files');
  });

  it('is run by tools/deploy-pages.mjs on the finished build, before that build is hashed, and a failure stops the deploy', () => {
    const src = readFileSync(join(process.cwd(), 'tools', 'deploy-pages.mjs'), 'utf8');
    const at = (needle: string): number => src.indexOf(needle);
    const gate = at("'yrp-models-verify.mjs'), '--dir', DIST");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeGreaterThan(at("runNpx(['vite', 'build'"));
    expect(gate).toBeLessThan(at('await buildManifest(DIST)'));
    expect(src.slice(gate, gate + 250)).toContain('fail(');
  });
});

// ---- the real files ------------------------------------------------------------------------------------------------
const PUBLIC = 'public';
const haveModels = existsSync(`${PUBLIC}/${BASE}/yuna.glb`) && existsSync(`${PUBLIC}/${BASE}/dress/index.json`);

/** A binary glTF whose header says what its file is: magic, version 2 and a length equal to the file's. */
function glbProblem(path: string): string | null {
  const b = readFileSync(path);
  if (b.length < 20 || b.toString('latin1', 0, 4) !== 'glTF') return 'not a binary glTF';
  if (b.readUInt32LE(4) !== 2) return `glTF version ${b.readUInt32LE(4)}`;
  if (b.readUInt32LE(8) !== b.length) return `header says ${b.readUInt32LE(8)} bytes, the file has ${b.length}`;
  return null;
}

describe.skipIf(!haveModels)('the real files (local only: skipped without public/models-exp)', () => {
  /** Everything on disk that the rule ships. */
  const onDisk = (): string[] => {
    const root = join(PUBLIC, 'models-exp');
    const out: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (lstatSync(full).isDirectory()) walk(full);
        else out.push(relative(PUBLIC, full).split(sep).join('/'));
      }
    };
    walk(root);
    // The 3D Bahamut's own two folders only: a tree that also holds the hidden Wind Waker chapter's `models-exp/windwaker/` (a release tree does, r74) ships that folder too, and its files are
    // proved by `ww-models.mjs verify` and `r74-int-models-both.test.ts`, not by this set.
    return out.filter((rel) => (rel.startsWith(`${BASE}/`) || rel.startsWith(`${HD}/`)) && !isUnshippedPublicFile(rel)).sort();
  };

  it('has every file of the set, and nothing else ships: 12 base files, 2 HD files, the manifest and 28 dress files', () => {
    const want = [
      ...YRP_SHIPPED_BASE_FILES.map((f) => `${BASE}/${f}`),
      ...YRP_SHIPPED_HD_FILES.map((f) => `${HD}/${f}`),
      `${BASE}/dress/index.json`,
      ...YRP_SHIPPED_DRESS_FOLDERS.flatMap((d) => [`${BASE}/dress/${d}/anims.glb`, `${BASE}/dress/${d}/clipmap.json`]),
    ].sort();
    expect(onDisk()).toEqual(want);
    expect(want).toHaveLength(12 + 2 + 1 + 28);
  });

  it('ships files the host takes: every one is under 25 MiB, and the set is a few hundred MB at most, never the 1.1 GB of the folder', () => {
    let total = 0;
    for (const rel of onDisk()) {
      const bytes = lstatSync(join(PUBLIC, rel)).size;
      total += bytes;
      expect(bytes, rel).toBeLessThanOrEqual(CLOUDFLARE_LIMITS.maxFileBytes);
    }
    expect(total).toBeLessThan(200 * 1024 * 1024);
    expect(total).toBeGreaterThan(100 * 1024 * 1024);
  });

  it('ships whole files: every .glb is a binary glTF version 2 with its own length, every .json parses', () => {
    for (const rel of onDisk()) {
      const full = join(PUBLIC, rel);
      if (rel.endsWith('.glb')) expect(glbProblem(full), rel).toBeNull();
      else expect(() => JSON.parse(readFileSync(full, 'utf8')), rel).not.toThrow();
    }
  });

  it('passes the verifier in source mode (the pre-flight a release tree runs: node tools/yrp-models-verify.mjs --source public)', () => {
    expect(verifyYrpModels(PUBLIC, { mode: 'source' })).toMatchObject({ ok: true, problems: [], files: 43 });
  });

  it('ships a manifest whose every folder has its two files and whose starters are Chapter IV\'s', () => {
    const real = JSON.parse(readFileSync(`${PUBLIC}/${BASE}/dress/index.json`, 'utf8')) as unknown;
    const shipped = parseDressIndex(shippedDressIndex(real))!;
    expect(shipped).not.toBeNull();
    expect(shipped.entries).toHaveLength(14);
    expect(shipped.starts).toEqual({ yuna: 'white-mage', rikku: 'dark-knight', paine: 'warrior' });
    for (const e of shipped.entries) {
      expect(existsSync(`${PUBLIC}/${BASE}/dress/${e.folder}/anims.glb`), e.folder).toBe(true);
      expect(existsSync(`${PUBLIC}/${BASE}/dress/${e.folder}/clipmap.json`), e.folder).toBe(true);
    }
  });
});

