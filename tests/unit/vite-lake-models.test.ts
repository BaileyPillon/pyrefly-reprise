/**
 * **A production build checks the hidden Wendigo chapter's models itself** (ch-wendigo phase 4, 2026-11-07; `tools/vite-lake-models.mjs`; delivery plumbing for the FFX-only hidden chapter 49). The models are gitignored, so a clean
 * release tree has none and the chapter would ship drawing capsules. This is the Wind Waker plugin's twin (`vite-ww-models.test.ts`); pins:
 *
 * 1. the plugin is build-only (`apply: 'build'`) with `configResolved` and `closeBundle` and nothing else; Vite keeps it for a build and leaves it out of the dev server;
 * 2. before the build it runs exactly `ensure --warn` once (the `predev` and `prebuild` step in package.json), and a runner that throws never stops the build;
 * 3. after the build it checks the OUTPUT root: intact is silent (an info line), a problem on a plain build is a warning, a problem on a RELEASE build (`PYREFLY_RELEASE` set, as the deploy and a review's candidate do)
 *    throws, and so does a check that cannot run on a release build; `PYREFLY_LAKE_MODELS=skip` (or `capsules`) turns both steps off;
 * 4. `vite.config.ts` registers it once, after the dist-filter (so it sees the pruned output) and before the FFX-local route; the dev and build scripts run `ensure --warn` too;
 * 5. the real check against a real build output: the 24 files pass, a file changed or missing fails, and a release build fails closed on a root with no output.
 */
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from 'vite';
import { describe, expect, it, vi } from 'vitest';

import viteConfig from '../../vite.config.ts';
import { check, readList } from '../../tools/lake-models.mjs';
import { verifyLakeModels } from '../../tools/lake-models-verify.mjs';
import { LAKE_ENSURE_ARGS, SKIP_ENV, pyreflyLakeModels } from '../../tools/vite-lake-models.mjs';

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
function build(options: Parameters<typeof pyreflyLakeModels>[0]): { info: string[]; warn: string[]; thrown: string | null } {
  const p = hooked(pyreflyLakeModels(options));
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
    const p = hooked(pyreflyLakeModels());
    expect(p.name).toBe('pyrefly-lake-models');
    expect(p.apply).toBe('build');
    expect(typeof p.configResolved).toBe('function');
    expect(typeof p.closeBundle).toBe('function');
    for (const hook of ['configureServer', 'configurePreviewServer', 'buildStart', 'generateBundle', 'writeBundle', 'transform', 'load', 'resolveId', 'transformIndexHtml']) expect(p[hook]).toBeUndefined();
  });

  it('Vite itself keeps it for a build and leaves it out of the dev server', async () => {
    const names = async (command: 'build' | 'serve'): Promise<string[]> =>
      (await resolveConfig({ configFile: false, logLevel: 'silent', plugins: [pyreflyLakeModels({ run: () => 0, env: { [SKIP_ENV]: 'skip' } })] }, command, 'development', 'development', false)).plugins.map((p) => p.name);
    expect(await names('build')).toContain('pyrefly-lake-models');
    expect(await names('serve')).not.toContain('pyrefly-lake-models');
  });

  it('runs exactly `ensure --warn` once before the build (the predev and prebuild step), and a runner that throws never stops it', () => {
    expect([...LAKE_ENSURE_ARGS]).toEqual(['ensure', '--warn']);
    const run = vi.fn(() => 0);
    hooked(pyreflyLakeModels({ run, env: {} })).configResolved!(CONFIG);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(['ensure', '--warn']);
    const say = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      expect(() => hooked(pyreflyLakeModels({ run: () => { throw new Error('spawn blew up'); }, env: {} })).configResolved!(CONFIG)).not.toThrow();
      expect(say.mock.calls.map((c) => String(c[0])).join('\n')).toContain('spawn blew up');
    } finally {
      say.mockRestore();
    }
  });
});

describe('the check after the build', () => {
  const run = (): number => 0;

  it('reads the output root of the build: outDir under the config root', () => {
    const verify = vi.fn((_root: string): string[] => []);
    build({ run, verify, env: {} });
    expect(verify).toHaveBeenCalledTimes(1);
    expect(String(verify.mock.calls[0]![0]).replace(/\\/g, '/')).toMatch(/\/work\/tree\/dist-release$/);
  });

  it('is quiet when the models shipped intact, on a release build and on a plain one', () => {
    for (const env of [{}, { PYREFLY_RELEASE: '77' }]) {
      const out = build({ run, verify: () => [], env });
      expect(out.thrown).toBeNull();
      expect(out.warn).toEqual([]);
      expect(out.info.join('\n')).toMatch(/24 models shipped intact/);
    }
  });

  it('warns on a plain build that does not carry them (the chapter draws capsules; a review copy has none) and goes on', () => {
    const out = build({ run, verify: () => ['models-exp/lake/tidus.glb: missing', 'models-exp/lake/yuna.glb: empty'], env: {} });
    expect(out.thrown).toBeNull();
    expect(out.warn).toHaveLength(1);
    expect(out.warn[0]).toMatch(/tidus\.glb: missing; models-exp\/lake\/yuna\.glb: empty/);
    expect(out.warn[0]).toMatch(/capsules/);
  });

  it('FAILS a release build that does not carry them, naming the first three problems and the way out', () => {
    const out = build({ run, verify: () => ['missing a.glb', 'missing b.glb', 'missing c.glb', 'missing d.glb'], env: { PYREFLY_RELEASE: '77' } });
    expect(out.thrown).toMatch(/missing a\.glb; missing b\.glb; missing c\.glb; and 1 more/);
    expect(out.thrown).toMatch(/lake-models\.mjs ensure/);
    expect(out.thrown).toContain(SKIP_ENV);
    expect(build({ run, verify: () => ['missing a.glb'], env: { PYREFLY_RELEASE: 'Preview' } }).thrown).not.toBeNull(); // a preview deploy is a release build too
  });

  it('a check that cannot run is a problem like any other: a warning on a plain build, a failure on a release build', () => {
    const verify = (): string[] => {
      throw new Error('no list');
    };
    expect(build({ run, verify, env: {} }).warn.join('\n')).toMatch(/the check could not run: no list/);
    expect(build({ run, verify, env: { PYREFLY_RELEASE: '77' } }).thrown).toMatch(/the check could not run: no list/);
  });

  it('is off with PYREFLY_LAKE_MODELS=skip or =capsules: nothing runs before the build, nothing is checked after it, even on a release build', () => {
    for (const word of ['skip', 'capsules']) {
      const runSpy = vi.fn(() => 0);
      const verify = vi.fn(() => ['missing a.glb']);
      const out = build({ run: runSpy, verify, env: { PYREFLY_RELEASE: '77', [SKIP_ENV]: word } });
      expect(runSpy, word).not.toHaveBeenCalled();
      expect(verify, word).not.toHaveBeenCalled();
      expect(out, word).toEqual({ info: [], warn: [], thrown: null });
    }
    // any other value is not a switch
    expect(build({ run, verify: () => ['missing a.glb'], env: { PYREFLY_RELEASE: '77', [SKIP_ENV]: 'yes' } }).thrown).not.toBeNull();
  });
});

describe('vite.config.ts and package.json', () => {
  const names = (command: 'serve' | 'build'): string[] =>
    (viteConfig as unknown as (env: object) => { plugins: Hooked[] })({ command, mode: command === 'serve' ? 'development' : 'production', isPreview: false }).plugins.map((p) => p.name);

  it('registers the plugin once, in a build only, after the dist-filter and before the FFX-local route', () => {
    const b = names('build');
    expect(b.filter((n) => n === 'pyrefly-lake-models')).toHaveLength(1);
    expect(b.indexOf('pyrefly-lake-models')).toBeGreaterThan(b.indexOf('pyrefly-dist-filter'));
    expect(b.indexOf('pyrefly-lake-models')).toBeLessThan(b.indexOf('pyrefly-ffx-local'));
  });

  it('runs `ensure --warn` in the dev and build scripts too (the same step the plugin makes), after the Wind Waker one', () => {
    const scripts = (JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;
    for (const name of ['predev', 'prebuild']) expect(scripts[name], name).toContain('node tools/ww-models.mjs ensure --warn && node tools/lake-models.mjs ensure --warn');
  });
});

describe('against a real build output', () => {
  const list = readList();
  const SRC = join(REPO, 'public', 'models-exp', 'lake');
  const have = existsSync(SRC) && check(SRC).length === 0;

  it('a root with no output is 24 problems and a release build fails closed on it', () => {
    const none = mkdtempSync(join(tmpdir(), 'lake-none-'));
    try {
      expect(verifyLakeModels(none).problems.filter((p) => p.endsWith(': missing'))).toHaveLength(24);
    } finally {
      rmSync(none, { recursive: true, force: true });
    }
    expect(build({ run: () => 0, env: { PYREFLY_RELEASE: '77' } }).thrown).toMatch(/does not carry/);
  });

  it.runIf(have)('passes an output that carries the 24 files, and fails one with a file changed and one with a file missing', () => {
    const out = mkdtempSync(join(tmpdir(), 'lake-out-'));
    try {
      const dir = join(out, 'models-exp', 'lake');
      for (const f of list) {
        mkdirSync(dirname(join(dir, f.path)), { recursive: true });
        copyFileSync(join(SRC, f.path), join(dir, f.path));
      }
      expect(verifyLakeModels(out)).toMatchObject({ ok: true, problems: [] });
      writeFileSync(join(dir, list[0]!.path), 'not a model');
      expect(verifyLakeModels(out).problems.join('\n')).toContain(`models-exp/lake/${list[0]!.path}: is not a binary glTF`);
      rmSync(join(dir, list[1]!.path));
      expect(verifyLakeModels(out).problems.join('\n')).toContain(`models-exp/lake/${list[1]!.path}: missing`);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });
});
