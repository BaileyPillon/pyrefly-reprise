/**
 * **A production build checks the hidden Wind Waker chapter's models itself** (the review of 2026-11-02; `tools/vite-ww-models.mjs`; delivery plumbing for the FFX-2 hidden chapter 32). The models are gitignored, so a clean
 * release tree had none and the chapter shipped drawing capsules, with nothing in the deploy to say so (the handoff left `ww-models.mjs ensure` and `verify` to the driver). Pins:
 *
 * 1. the plugin is build-only (`apply: 'build'`) with `configResolved` and `closeBundle` and nothing else; Vite keeps it for a build and leaves it out of the dev server;
 * 2. before the build it runs exactly `ensure --warn` once (the `predev` and `prebuild` step in package.json), and a runner that throws never stops the build;
 * 3. after the build it checks the OUTPUT's `models-exp/windwaker`: intact is silent (an info line), a problem on a plain build is a warning, a problem on a RELEASE build (`PYREFLY_RELEASE` set, as the deploy and a
 *    review's candidate do) throws, and so does a check that cannot run on a release build; `PYREFLY_WW_MODELS=skip` turns both steps off;
 * 4. `vite.config.ts` registers it once, after the dist-filter (so it sees the pruned output) and before the FFX-local route (`ffx-local-guard.test.ts` keeps that one last);
 * 5. the real check against a real folder: a build output with the eleven files passes, one with a file changed or missing fails, and the dev scripts run `ensure --warn` too.
 */
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from 'vite';
import { describe, expect, it, vi } from 'vitest';

import viteConfig from '../../vite.config.ts';
import { SKIP_ENV, WW_ENSURE_ARGS, isReleaseBuild, pyreflyWwModels } from '../../tools/vite-ww-models.mjs';
import { check, readList } from '../../tools/ww-models.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
type Hooked = {
  name: string;
  apply?: string;
  configResolved?: (config: { root: string; build: { outDir: string } }) => void;
  closeBundle?: (this: { info: (m: string) => void; warn: (m: string) => void }) => void;
  [k: string]: unknown;
};
const hooked = (p: unknown): Hooked => p as Hooked;
const CONFIG = { root: '/work/tree', build: { outDir: 'dist-release' } };

/** Run the plugin's two steps the way Vite does, and collect what it said. */
function build(options: Parameters<typeof pyreflyWwModels>[0]): { info: string[]; warn: string[]; thrown: string | null } {
  const p = hooked(pyreflyWwModels(options));
  const info: string[] = [];
  const warn: string[] = [];
  let thrown: string | null = null;
  p.configResolved!(CONFIG);
  try {
    p.closeBundle!.call({ info: (m) => info.push(m), warn: (m) => warn.push(m) });
  } catch (error) {
    thrown = (error as Error).message;
  }
  return { info, warn, thrown };
}

describe('the plugin', () => {
  it('is build-only: apply build, configResolved and closeBundle, and no other hook', () => {
    const p = hooked(pyreflyWwModels());
    expect(p.name).toBe('pyrefly-ww-models');
    expect(p.apply).toBe('build');
    expect(typeof p.configResolved).toBe('function');
    expect(typeof p.closeBundle).toBe('function');
    for (const hook of ['configureServer', 'configurePreviewServer', 'buildStart', 'generateBundle', 'writeBundle', 'transform', 'load', 'resolveId', 'transformIndexHtml']) expect(p[hook]).toBeUndefined();
  });

  it('Vite itself keeps it for a build and leaves it out of the dev server', async () => {
    const names = async (command: 'build' | 'serve'): Promise<string[]> =>
      (await resolveConfig({ configFile: false, logLevel: 'silent', plugins: [pyreflyWwModels({ run: () => 0, env: { [SKIP_ENV]: 'skip' } })] }, command, 'development', 'development', false)).plugins.map((p) => p.name);
    expect(await names('build')).toContain('pyrefly-ww-models');
    expect(await names('serve')).not.toContain('pyrefly-ww-models');
  });

  it('runs exactly `ensure --warn` once before the build (the predev and prebuild step), and a runner that throws never stops it', () => {
    expect([...WW_ENSURE_ARGS]).toEqual(['ensure', '--warn']);
    const run = vi.fn(() => 0);
    hooked(pyreflyWwModels({ run, env: {} })).configResolved!(CONFIG);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(['ensure', '--warn']);
    const say = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      expect(() => hooked(pyreflyWwModels({ run: () => { throw new Error('spawn blew up'); }, env: {} })).configResolved!(CONFIG)).not.toThrow();
      expect(say.mock.calls.map((c) => String(c[0])).join('\n')).toContain('spawn blew up');
    } finally {
      say.mockRestore();
    }
  });
});

describe('the check after the build', () => {
  const run = (): number => 0;

  it('reads the output folder of the build: outDir under the config root, models-exp/windwaker', () => {
    const verify = vi.fn((_dir: string): string[] => []);
    build({ run, verify, env: {} });
    expect(verify).toHaveBeenCalledTimes(1);
    expect(String(verify.mock.calls[0]![0]).replace(/\\/g, '/')).toMatch(/\/work\/tree\/dist-release\/models-exp\/windwaker$/);
  });

  it('is quiet when the models shipped intact, on a release build and on a plain one', () => {
    for (const env of [{}, { PYREFLY_RELEASE: '73' }]) {
      const out = build({ run, verify: () => [], env });
      expect(out.thrown).toBeNull();
      expect(out.warn).toEqual([]);
      expect(out.info.join('\n')).toMatch(/shipped intact/);
    }
  });

  it('warns on a plain build that does not carry them (the chapter draws capsules; a review copy has none) and goes on', () => {
    const out = build({ run, verify: () => ['missing yuna.glb', 'differs valefor.glb'], env: {} });
    expect(out.thrown).toBeNull();
    expect(out.warn).toHaveLength(1);
    expect(out.warn[0]).toMatch(/missing yuna\.glb; differs valefor\.glb/);
    expect(out.warn[0]).toMatch(/capsules/);
  });

  it('FAILS a release build that does not carry them, naming the first three problems and the way out', () => {
    const out = build({ run, verify: () => ['missing a.glb', 'missing b.glb', 'missing c.glb', 'missing d.glb'], env: { PYREFLY_RELEASE: '73' } });
    expect(out.thrown).toMatch(/missing a\.glb; missing b\.glb; missing c\.glb; and 1 more/);
    expect(out.thrown).toMatch(/ww-models\.mjs ensure/);
    expect(out.thrown).toContain(SKIP_ENV);
    expect(build({ run, verify: () => ['missing a.glb'], env: { PYREFLY_RELEASE: 'Preview' } }).thrown).not.toBeNull(); // a preview deploy is a release build too
  });

  it('a check that cannot run is a problem like any other: a warning on a plain build, a failure on a release build', () => {
    const verify = (): string[] => {
      throw new Error('no list');
    };
    expect(build({ run, verify, env: {} }).warn.join('\n')).toMatch(/the check could not run: no list/);
    expect(build({ run, verify, env: { PYREFLY_RELEASE: '73' } }).thrown).toMatch(/the check could not run: no list/);
  });

  it('is off with PYREFLY_WW_MODELS=skip: nothing runs before the build, nothing is checked after it, even on a release build', () => {
    const runSpy = vi.fn(() => 0);
    const verify = vi.fn(() => ['missing a.glb']);
    const out = build({ run: runSpy, verify, env: { PYREFLY_RELEASE: '73', [SKIP_ENV]: 'skip' } });
    expect(runSpy).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
    expect(out).toEqual({ info: [], warn: [], thrown: null });
  });

  it('knows a release build by PYREFLY_RELEASE alone (blank is not one)', () => {
    expect(isReleaseBuild({})).toBe(false);
    expect(isReleaseBuild({ PYREFLY_RELEASE: '' })).toBe(false);
    expect(isReleaseBuild({ PYREFLY_RELEASE: '  ' })).toBe(false);
    expect(isReleaseBuild({ PYREFLY_RELEASE: '73' })).toBe(true);
    expect(isReleaseBuild({ PYREFLY_RELEASE: 'Preview' })).toBe(true);
  });
});

describe('vite.config.ts and package.json', () => {
  const names = (command: 'serve' | 'build'): string[] =>
    (viteConfig as unknown as (env: object) => { plugins: Hooked[] })({ command, mode: command === 'serve' ? 'development' : 'production', isPreview: false }).plugins.map((p) => p.name);

  it('registers the plugin once, after the dist-filter and before the FFX-local route', () => {
    const build = names('build');
    expect(build.filter((n) => n === 'pyrefly-ww-models')).toHaveLength(1);
    expect(build.indexOf('pyrefly-ww-models')).toBeGreaterThan(build.indexOf('pyrefly-dist-filter'));
    expect(build.indexOf('pyrefly-ww-models')).toBeLessThan(build.indexOf('pyrefly-ffx-local'));
  });

  it('runs `ensure --warn` in the dev and build scripts too (the same step the plugin makes), after the fx check', () => {
    const scripts = (JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;
    for (const name of ['predev', 'prebuild']) {
      expect(scripts[name], name).toContain('node tools/fx-assets.mjs ensure --warn && node tools/ww-models.mjs ensure --warn');
    }
  });
});

describe('against a real folder: the check the plugin makes is the tool\'s own, size and sha256 of the eleven listed files', () => {
  const list = readList();
  const SRC = join(REPO, 'public', 'models-exp', 'windwaker');
  const have = existsSync(SRC) && check(SRC).length === 0;

  it('lists eleven files, and a folder that is not there is eleven problems', () => {
    expect(list).toHaveLength(11);
    const none = mkdtempSync(join(tmpdir(), 'ww-none-'));
    try {
      expect(check(join(none, 'models-exp', 'windwaker'))).toHaveLength(11);
    } finally {
      rmSync(none, { recursive: true, force: true });
    }
  });

  it.runIf(have)('passes a build output that carries the files, and fails one with a file changed and one with a file missing', () => {
    const out = mkdtempSync(join(tmpdir(), 'ww-out-'));
    try {
      const dir = join(out, 'models-exp', 'windwaker');
      for (const f of list) {
        mkdirSync(dirname(join(dir, f.path)), { recursive: true });
        copyFileSync(join(SRC, f.path), join(dir, f.path));
      }
      expect(check(dir)).toEqual([]);
      // and the plugin's own default check is that same one, run on the folder the build wrote: a fake root with no output fails closed on a release build
      expect(build({ run: () => 0, env: { PYREFLY_RELEASE: '73' } }).thrown).toMatch(/does not carry/);
      writeFileSync(join(dir, list[0]!.path), 'not a model');
      expect(check(dir)).toEqual([`differs ${list[0]!.path}`]);
      rmSync(join(dir, list[1]!.path));
      expect(check(dir)).toEqual([`differs ${list[0]!.path}`, `missing ${list[1]!.path}`]);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });
});
