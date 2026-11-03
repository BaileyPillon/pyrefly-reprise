/**
 * **Both hidden 3D chapters' models ship together** (r74 integration, 2026-11-02; FFX-2 only: the hidden 3D Bahamut, `ch-yrp`, Chapter 31, and the hidden Wind Waker chapter, `ch-waker`, Chapter 32; the
 * check and the filter are shared delivery plumbing).
 *
 * Each lane was written against a tree that had only its own model set. `tools/yrp-models-verify.mjs` (the deploy's gate) refuses any file of `models-exp/` that is not in the 3D Bahamut's set, and
 * `tools/dist-filter.mjs` (ch-waker) lets the whole `models-exp/windwaker/` folder through, so the two merged as written would have refused every build that carries the Wind Waker models. What this pins:
 *
 * 1. the filter keeps the Wind Waker folder AND the 3D Bahamut's set, prunes the rest, and a sibling folder that merely begins with `windwaker` is not the folder;
 * 2. the verifier passes a build that carries both sets, still names any other extra file, and treats a build with only the Wind Waker folder as one with no 3D Bahamut models (the capsules word applies).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { isShippedModelFile, isUnshippedPublicFile, isWindwakerModelFile, pruneUnshipped, shippedDressIndex } from '../../tools/dist-filter.mjs';
import { expectedYrpFiles, verifyYrpModels } from '../../tools/yrp-models-verify.mjs';
import { BASE, fullManifest, tinyGlb } from './helpers/yrpShip.ts';

let tmp: string | null = null;
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

const WW = ['models-exp/windwaker/yuna.glb', 'models-exp/windwaker/valefor.glb', 'models-exp/windwaker/props/pistol.glb', 'models-exp/windwaker/temple/wall.glb'] as const;

/** A whole build of the 3D Bahamut's set, with the Wind Waker folder beside it when asked. */
function build(withWw: boolean): string {
  tmp = mkdtempSync(join(tmpdir(), 'pyrefly-r74-models-'));
  for (const rel of expectedYrpFiles()) {
    mkdirSync(dirname(join(tmp, rel)), { recursive: true });
    writeFileSync(join(tmp, rel), rel.endsWith('.glb') ? tinyGlb() : '{}');
  }
  writeFileSync(join(tmp, BASE, 'dress', 'index.json'), JSON.stringify(shippedDressIndex(fullManifest())));
  if (withWw) {
    for (const rel of WW) {
      mkdirSync(dirname(join(tmp, rel)), { recursive: true });
      writeFileSync(join(tmp, rel), tinyGlb());
    }
  }
  return tmp;
}

describe('the filter keeps both sets', () => {
  it('names the Wind Waker folder exactly: the folder, its files either way down, not a sibling that begins with its name', () => {
    for (const p of ['models-exp/windwaker', ...WW]) expect(isWindwakerModelFile(p), p).toBe(true);
    for (const p of ['models-exp/windwaker-yrp/yuna.glb', 'models-exp/windwakerx/yuna.glb', 'models-exp/windwaker2/props/pistol.glb', 'models-exp/windwaker-old', 'models-exp/yrp/yuna.glb', 'models-exp', 'windwaker/yuna.glb']) {
      expect(isWindwakerModelFile(p), p).toBe(false);
    }
  });

  it('ships the Wind Waker folder and every file of the 3D Bahamut\'s set, and nothing else of models-exp', () => {
    for (const p of WW) expect(isShippedModelFile(p), p).toBe(true);
    for (const p of expectedYrpFiles()) expect(isUnshippedPublicFile(p), p).toBe(false);
    for (const p of [`${BASE}/bahamut-ai.glb`, 'models-exp/yrp-hd/yuna.glb', 'models-exp/some-new-experiment/props/pistol.glb', 'models-exp/windwaker-yrp/yuna.glb']) {
      expect(isUnshippedPublicFile(p), p).toBe(true);
    }
  });

  it('prunes a full copy of both to exactly the two sets, and the verifier then passes it', () => {
    const root = build(true);
    mkdirSync(join(root, 'models-exp', 'some-new-experiment'), { recursive: true });
    writeFileSync(join(root, 'models-exp', 'some-new-experiment', 'x.glb'), tinyGlb());
    writeFileSync(join(root, BASE, 'bahamut-ai.glb'), tinyGlb());
    expect(verifyYrpModels(root).ok, 'before the prune the build carries extras').toBe(false);
    pruneUnshipped(root);
    expect(verifyYrpModels(root)).toMatchObject({ ok: true, problems: [] });
    // the Wind Waker files survived the prune
    const again = pruneUnshipped(root);
    expect(again, 'a second prune finds nothing left to remove').toEqual([]);
  });
});

describe('the verifier beside the Wind Waker folder', () => {
  it('passes a build that carries both sets (the Wind Waker folder is not an extra file)', () => {
    expect(verifyYrpModels(build(true))).toMatchObject({ ok: true, problems: [], files: 43 });
  });

  it('still names any other extra file, with the Wind Waker folder present', () => {
    const root = build(true);
    writeFileSync(join(root, 'models-exp', 'windwaker-yrp-extra.glb'), tinyGlb());
    writeFileSync(join(root, BASE, 'bahamut-ai.glb'), tinyGlb());
    const text = verifyYrpModels(root).problems.join('\n');
    expect(text).toMatch(/models-exp\/windwaker-yrp-extra\.glb: ships but is not in the set/);
    expect(text).toMatch(/models-exp\/yrp\/bahamut-ai\.glb: ships but is not in the set/);
    expect(text).not.toMatch(/models-exp\/windwaker\//);
  });

  describe('on the command line', () => {
    const TOOL = join(process.cwd(), 'tools', 'yrp-models-verify.mjs');
    const cli = (dir: string, env: Record<string, string> = {}): { status: number | null; out: string } => {
      const r = spawnSync(process.execPath, [TOOL, '--dir', dir], { encoding: 'utf8', env: { ...process.env, PYREFLY_YRP_MODELS: '', ...env } });
      return { status: r.status, out: `${r.stdout}${r.stderr}` };
    };

    it('passes both sets', () => {
      const r = cli(build(true));
      expect(r.status).toBe(0);
      expect(r.out).toContain('PASS');
    });

    it('a build with ONLY the Wind Waker folder has no 3D Bahamut models: refused with one explanation, let through only on the capsules word', () => {
      tmp = mkdtempSync(join(tmpdir(), 'pyrefly-r74-models-'));
      for (const rel of WW) {
        mkdirSync(dirname(join(tmp, rel)), { recursive: true });
        writeFileSync(join(tmp, rel), tinyGlb());
      }
      const refused = cli(tmp);
      expect(refused.status).toBe(1);
      expect(refused.out).toContain('holds no models-exp/yrp folder');
      expect(refused.out).toContain('PYREFLY_YRP_MODELS=capsules');
      expect(refused.out.split('\n').filter((l) => l.endsWith(': missing')), 'no line per missing file').toEqual([]);
      const allowed = cli(tmp, { PYREFLY_YRP_MODELS: 'capsules' });
      expect(allowed.status).toBe(0);
      expect(allowed.out).toContain('WARNING');
    });
  });
});
