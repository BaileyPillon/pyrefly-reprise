/**
 * **The dev server checks `public/fx` itself** (release 69 `r69-fix`: the Chapter I first-menu mismatch of the `booth-leblanc` review was a tree with no `public/fx`, started with `npx vite`, which skips `npm run dev`'s
 * `predev`; `tools/vite-fx-assets.mjs`). Pins:
 *
 * 1. the plugin is serve-only (`apply: 'serve'`, `configureServer` and nothing else), and Vite itself leaves it out of a build and keeps it for the dev server;
 * 2. starting the server runs exactly `ensure --warn` once (`npm run dev`'s `predev` step), and a runner that fails or throws never stops the server;
 * 3. `vite.config.ts` registers it, once, for a dev server and not for a build, and BEFORE `pyreflyFfxLocal()` (`ffx-local-guard.test.ts` pins that one last);
 * 4. the call really reaches `tools/fx-assets.mjs`: a real `ensure --warn` run exits 0 whether this checkout has its depth maps or not (a missing folder is a printed warning).
 *
 * Game case: both games, shared dev plumbing (the maps are for FFX and FFX-2 rooms; nothing here reads a chapter).
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from 'vite';
import { describe, expect, it, vi } from 'vitest';

import viteConfig from '../../vite.config.ts';
import { FX_ENSURE_ARGS, pyreflyFxAssets } from '../../tools/vite-fx-assets.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
type Hooked = { name: string; apply?: string; configureServer?: (server: object) => void; [k: string]: unknown };
const hooked = (p: unknown): Hooked => p as Hooked;

describe('the plugin', () => {
  it('is serve-only: apply serve, configureServer, and no other hook', () => {
    const p = hooked(pyreflyFxAssets());
    expect(p.name).toBe('pyrefly-fx-assets');
    expect(p.apply).toBe('serve');
    expect(typeof p.configureServer).toBe('function');
    for (const hook of ['configurePreviewServer', 'buildStart', 'generateBundle', 'closeBundle', 'transform', 'load', 'resolveId', 'transformIndexHtml']) expect(p[hook]).toBeUndefined();
  });

  it('Vite itself keeps it out of a build and in for the dev server', async () => {
    const names = async (command: 'build' | 'serve'): Promise<string[]> =>
      (await resolveConfig({ configFile: false, logLevel: 'silent', plugins: [pyreflyFxAssets()] }, command, 'development', 'development', false)).plugins.map((p) => p.name);
    expect(await names('build')).not.toContain('pyrefly-fx-assets');
    expect(await names('serve')).toContain('pyrefly-fx-assets');
  });

  it('runs exactly `ensure --warn` once when the server is configured (npm run dev\'s predev step)', () => {
    expect([...FX_ENSURE_ARGS]).toEqual(['ensure', '--warn']);
    const run = vi.fn(() => 0);
    hooked(pyreflyFxAssets({ run })).configureServer!({});
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(['ensure', '--warn']);
  });

  it('a failing or throwing runner never stops the dev server', () => {
    const say = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      expect(() => hooked(pyreflyFxAssets({ run: () => 1 })).configureServer!({})).not.toThrow();
      expect(() => hooked(pyreflyFxAssets({ run: () => { throw new Error('spawn blew up'); } })).configureServer!({})).not.toThrow();
      expect(say.mock.calls.map((c) => String(c[0])).join('\n')).toContain('spawn blew up');
    } finally {
      say.mockRestore();
    }
  });
});

describe('vite.config.ts', () => {
  const names = (command: 'serve' | 'build'): string[] =>
    (viteConfig as unknown as (env: object) => { plugins: Hooked[] })({ command, mode: command === 'serve' ? 'development' : 'production', isPreview: false }).plugins.map((p) => p.name);

  it('registers the plugin once, for the dev server, before the FFX-local route', () => {
    const serve = names('serve');
    expect(serve.filter((n) => n === 'pyrefly-fx-assets')).toHaveLength(1);
    expect(serve.indexOf('pyrefly-fx-assets')).toBeLessThan(serve.indexOf('pyrefly-ffx-local'));
  });

  it('names it in the plugin list the source text carries (a start that skips predev still runs the check)', () => {
    const text = readFileSync(join(REPO, 'vite.config.ts'), 'utf8');
    expect(text).toMatch(/import \{ pyreflyFxAssets \} from '\.\/tools\/vite-fx-assets\.mjs';/);
    expect(text).toMatch(/plugins: \[[^\]]*pyreflyFxAssets\(\)[^\]]*pyreflyFfxLocal\(\)\]/);
  });
});

describe('the call reaches the tool', () => {
  it('`fx-assets.mjs ensure --warn` exits 0 and names itself, with or without depth maps, with a backup that does not exist', () => {
    const empty = mkdtempSync(join(tmpdir(), 'fx-none-'));
    try {
      const run = spawnSync(process.execPath, [join(REPO, 'tools', 'fx-assets.mjs'), 'ensure', '--warn'], {
        encoding: 'utf8',
        env: { ...process.env, PYREFLY_FX_BACKUP: join(empty, 'no-backup-here') },
        cwd: empty,
      });
      expect(run.status).toBe(0);
      // either this checkout has public/fx (the check passes) or it has none and the tool warns and goes on: both are exit 0, never a stopped server
      expect(`${run.stdout}${run.stderr}`).toMatch(/fx-assets/);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
