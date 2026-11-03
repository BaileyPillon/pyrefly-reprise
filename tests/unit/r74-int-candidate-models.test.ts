/**
 * A REVIEW CANDIDATE CHECKS THE 3D BAHAMUT'S MODELS AS THE DEPLOY DOES (r74-int review, MINOR-3, 2026-11-03; FFX-2 only for the chapter, shared delivery plumbing).
 *
 * `tools/candidate-build.mjs` builds with `releaseBuildEnv`, so the Wind Waker models were already enforced by the build itself (the vite plugin fires because `PYREFLY_RELEASE` is set). The hidden 3D Bahamut's
 * models were checked only in `tools/deploy-pages.mjs`: a focused-review candidate cut from a tree without `public/models-exp/yrp` built, drew grey capsules in the reviewed artifact, and the deploy (which refuses
 * without the models) then shipped a different asset set under the same bundle. The candidate now runs the same `tools/yrp-models-verify.mjs --dir` on its build and refuses on a FAIL.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkYrpModels } from '../../tools/candidate-build.mjs';

const ROOT = process.cwd();
const text = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});
const scratch = (): string => {
  const d = mkdtempSync(join(tmpdir(), 'candidate-yrp-'));
  made.push(d);
  return d;
};
function withEnv<T>(name: string, value: string | undefined, run: () => T): T {
  const had = Object.prototype.hasOwnProperty.call(process.env, name);
  const before = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  try {
    return run();
  } finally {
    if (had) process.env[name] = before;
    else delete process.env[name];
  }
}

describe('checkYrpModels runs the deploy\'s own verifier on a candidate build', () => {
  it('a build with no models folder (a candidate cut from a tree without public/models-exp) FAILS, and says why', () => {
    const r = withEnv('PYREFLY_YRP_MODELS', undefined, () => checkYrpModels(ROOT, scratch()));
    expect(r.ok).toBe(false);
    expect(r.skipped).toBeNull();
    expect(r.detail).toMatch(/FAIL/);
    expect(r.detail).toMatch(/grey capsules/);
  });

  it('PYREFLY_YRP_MODELS=capsules passes it with the verifier\'s own warning, as it does the deploy (reviewing the chapter on capsules on purpose)', () => {
    const r = withEnv('PYREFLY_YRP_MODELS', 'capsules', () => checkYrpModels(ROOT, scratch()));
    expect(r.ok).toBe(true);
    expect(r.detail).toMatch(/WARNING/);
  });

  it('a tree that has no such verifier is skipped, as the deploy of that tree would not run it either', () => {
    expect(checkYrpModels(scratch(), scratch())).toEqual({ ok: true, skipped: join('tools', 'yrp-models-verify.mjs'), detail: '' });
  });
});

describe('the wiring: the candidate refuses on it, and it is the same tool the deploy runs', () => {
  it('candidate-build.mjs runs the check after the build, next to the fx check, and returns 1 when it fails', () => {
    const src = text('tools/candidate-build.mjs');
    const main = src.slice(src.indexOf('async function main('));
    const fx = main.indexOf("runTool(root, join('tools', 'fx-assets.mjs')");
    const yrp = main.indexOf('const yrp = checkYrpModels(root, dist);');
    expect(fx).toBeGreaterThan(0);
    expect(yrp).toBeGreaterThan(fx);
    expect(main.slice(yrp, yrp + 900)).toMatch(/if \(!yrp\.ok\) \{[\s\S]*return 1;\s*\}/);
    expect(src).toContain("join('tools', 'yrp-models-verify.mjs'), ['--dir', dist]");
  });

  it('the deploy runs `tools/yrp-models-verify.mjs --dir` on its build (the check the candidate now repeats), and the Wind Waker models are the build\'s own check for either', () => {
    const deploy = text('tools/deploy-pages.mjs');
    expect(deploy).toMatch(/'yrp-models-verify\.mjs'\), '--dir', DIST\]/);
    const vite = text('vite.config.ts');
    expect(vite).toMatch(/PYREFLY_RELEASE/);
    expect(text('tools/candidate-build.mjs')).toContain('releaseBuildEnv'); // so PYREFLY_RELEASE is set and the plugin fires in a candidate
  });
});
