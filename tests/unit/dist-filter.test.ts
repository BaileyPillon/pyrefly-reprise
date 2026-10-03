/**
 * PR-0100 + PR-0173: audition candidates, raw renders and numbered art takes
 * never reach the build. PR-0328 (D-335, Bailey 2026-10-03): neither does any
 * source map, and no code points at one. Game case: both (delivery plumbing, CHK-017).
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Plugin, UserConfig } from 'vite';

import {
  SOURCEMAP_DIR_ENV,
  findSourceMapReferences,
  findUnshipped,
  hasSourceMapReference,
  isSourceMapFile,
  isUnshippedPublicFile,
  keepSourceMaps,
  pruneUnshipped,
} from '../../tools/dist-filter.mjs';
import viteConfig, { THIRD_PARTY_LICENCES } from '../../vite.config.ts';

let tmp: string | null = null;
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  tmp = null;
});

describe('what never ships', () => {
  it('drops audio candidates, raw renders and numbered takes', () => {
    for (const p of [
      'audio/candidates/evrae-near.mp3',
      'audio/candidates/C-round1-battle-ffx-A-x12.ogg',
      'art/portraits/f4blulu.1.raw.png',
      'art/portraits/f4lulu.3.png',
      'art/characters/ffx2-bahamut/ko.2.json',
      'art\\characters\\paine-dark-knight\\idle-a.1.png',
    ]) {
      expect(isUnshippedPublicFile(p), p).toBe(true);
    }
  });

  it('keeps everything the game loads', () => {
    for (const p of [
      'audio/manifest.json',
      'audio/music/boss-seymour.mp3',
      'audio/sfx/sprite.mp3',
      'art/manifest.json',
      'art/characters/anima/hurt.png',
      'art/characters/anima/hurt.json',
      'art/characters/evrae/idle-far.png',
      'art/backdrops/ch1-2.png', // a digit inside the stem is not a take number
      'art/portraits/tidus-v2.png',
      'assets/index-4f2a.js',
      'index.html',
    ]) {
      expect(isUnshippedPublicFile(p), p).toBe(false);
    }
  });

  it('prunes a built tree and leaves no empty candidates folder', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-dist-'));
    const files = [
      'index.html',
      'audio/manifest.json',
      'audio/candidates/a.ogg',
      'art/portraits/lulu.png',
      'art/portraits/lulu.2.png',
      'art/portraits/lulu.2.json',
      'art/portraits/lulu.raw.png',
    ];
    for (const f of files) {
      mkdirSync(dirname(join(tmp, f)), { recursive: true });
      writeFileSync(join(tmp, f), 'x');
    }
    const removed = pruneUnshipped(tmp);
    expect(removed.sort()).toEqual([
      'art/portraits/lulu.2.json',
      'art/portraits/lulu.2.png',
      'art/portraits/lulu.raw.png',
      'audio/candidates/a.ogg',
    ]);
    expect(findUnshipped(tmp)).toEqual([]);
    expect(readdirSync(join(tmp, 'audio'))).toEqual(['manifest.json']);
    expect(readdirSync(join(tmp, 'art', 'portraits'))).toEqual(['lulu.png']);
  });
});

describe('the production build applies it', () => {
  it('vite.config.ts carries the dist-filter plugin for builds', async () => {
    const config = (await (viteConfig as (env: { command: 'build'; mode: string; isPreview: boolean }) => UserConfig | Promise<UserConfig>)({
      command: 'build',
      mode: 'production',
      isPreview: false,
    })) as UserConfig;
    const names = (config.plugins ?? []).flat().map((p) => (p as Plugin | null)?.name);
    expect(names).toContain('pyrefly-dist-filter');
  });

  // three.js is MIT: its copyright and permission notice must travel with the
  // bundle. The minifier strips comments unless told otherwise (the live
  // index-ChAAAZ-I.js carried no "Three.js Authors" at all).
  it('keeps the bundled licence notices: @license headers in the code, full texts beside it', async () => {
    const config = (await (viteConfig as (env: { command: 'build'; mode: string; isPreview: boolean }) => UserConfig | Promise<UserConfig>)({
      command: 'build',
      mode: 'production',
      isPreview: false,
    })) as UserConfig;
    expect(config.build?.license).toEqual({ fileName: THIRD_PARTY_LICENCES });
    expect(isUnshippedPublicFile(THIRD_PARTY_LICENCES)).toBe(false);
    const output = config.build?.rolldownOptions?.output;
    expect(Array.isArray(output) ? undefined : output?.comments).toMatchObject({ legal: true });
  });
});

// ---- PR-0328, D-335: no source map ships -----------------------------------------------------
// Release 36's three maps weighed 22,775,896 bytes of a site held to 800,000,000 (D-332).

type BuildEnv = { command: 'build'; mode: string; isPreview: boolean };
const BUILD: BuildEnv = { command: 'build', mode: 'production', isPreview: false };
const configFor = async (): Promise<UserConfig> =>
  (await (viteConfig as (env: BuildEnv) => UserConfig | Promise<UserConfig>)(BUILD)) as UserConfig;

/** Run `fn` with the source-map variable set to `value` (or removed), then put it back. */
async function withSourceMapEnv<T>(value: string | undefined, fn: () => Promise<T>): Promise<T> {
  const before = process.env[SOURCEMAP_DIR_ENV];
  if (value === undefined) delete process.env[SOURCEMAP_DIR_ENV];
  else process.env[SOURCEMAP_DIR_ENV] = value;
  try {
    return await fn();
  } finally {
    if (before === undefined) delete process.env[SOURCEMAP_DIR_ENV];
    else process.env[SOURCEMAP_DIR_ENV] = before;
  }
}

/** The dist-filter plugin of a config, typed for calling its two hooks directly. */
function filterPlugin(config: UserConfig): { configResolved(c: unknown): void; closeBundle(this: unknown): void } {
  const found = (config.plugins ?? []).flat().find((p) => (p as Plugin | null)?.name === 'pyrefly-dist-filter');
  return found as unknown as { configResolved(c: unknown): void; closeBundle(this: unknown): void };
}

/** A build folder as the bundler leaves it: code with a pointer, its maps, and the art. */
function fakeBuild(root: string): void {
  const files: Record<string, string> = {
    'index.html': '<script type="module" src="/pyrefly-reprise/assets/index-AAAA.js"></script>',
    'assets/index-AAAA.js': 'console.log("game");\n//# sourceMappingURL=index-AAAA.js.map\n',
    'assets/index-AAAA.js.map': '{"version":3,"sources":["a.ts"]}',
    'assets/worker-BBBB.js': 'postMessage(1);\n//# sourceMappingURL=worker-BBBB.js.map',
    'assets/worker-BBBB.js.map': '{"version":3}',
    'assets/index-CCCC.css': 'body{margin:0}\n/*# sourceMappingURL=index-CCCC.css.map */',
    'assets/index-CCCC.css.map': '{"version":3}',
    'third-party-licenses.md': 'three.js MIT',
    'art/portraits/lulu.png': 'png',
  };
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
}

describe('source maps never ship', () => {
  it('names the maps the bundler writes beside its code, and nothing else', () => {
    for (const p of ['assets/index-DU_vcl-u.js.map', 'assets/worker-CWxiDItd.js.map', 'assets/index-x.css.map', 'assets/chunk.mjs.map', 'assets\\index-y.js.map']) {
      expect(isSourceMapFile(p), p).toBe(true);
    }
    for (const p of ['assets/index-DU_vcl-u.js', 'art/manifest.json', 'data/dungeon.map', 'audio/music/boss.mp3', 'third-party-licenses.md', 'index.html']) {
      expect(isSourceMapFile(p), p).toBe(false);
    }
  });

  it('recognises a sourceMappingURL comment where a bundler puts it, and not a mere mention of the name', () => {
    expect(hasSourceMapReference('run();\n//# sourceMappingURL=index-x.js.map\n')).toBe(true);
    expect(hasSourceMapReference('run();\n//@ sourceMappingURL=index-x.js.map')).toBe(true);
    expect(hasSourceMapReference('a{}\n/*# sourceMappingURL=index-x.css.map */')).toBe(true);
    expect(hasSourceMapReference('//# sourceMappingURL=first-line.js.map')).toBe(true);
    expect(hasSourceMapReference('const s = "//# sourceMappingURL=" + name; run();')).toBe(false);
    expect(hasSourceMapReference('/* this build has no sourceMappingURL */ run();')).toBe(false);
    expect(hasSourceMapReference('')).toBe(false);
  });

  it('a build carrying maps is reported and pruned: findUnshipped names them, prune removes them and keeps the code and the licence', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-dist-'));
    fakeBuild(tmp);
    expect(findUnshipped(tmp).sort()).toEqual(['assets/index-AAAA.js.map', 'assets/index-CCCC.css.map', 'assets/worker-BBBB.js.map']);
    expect(pruneUnshipped(tmp)).toHaveLength(3);
    expect(findUnshipped(tmp)).toEqual([]);
    expect(readdirSync(join(tmp, 'assets')).sort()).toEqual(['index-AAAA.js', 'index-CCCC.css', 'worker-BBBB.js']);
    expect(existsSync(join(tmp, 'third-party-licenses.md'))).toBe(true);
    expect(existsSync(join(tmp, 'art', 'portraits', 'lulu.png'))).toBe(true);
  });

  it('findSourceMapReferences lists the code and styles that still point at a map', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-dist-'));
    fakeBuild(tmp);
    expect(findSourceMapReferences(tmp).sort()).toEqual(['assets/index-AAAA.js', 'assets/index-CCCC.css', 'assets/worker-BBBB.js']);
    writeFileSync(join(tmp, 'assets', 'index-AAAA.js'), 'console.log("game");\n');
    writeFileSync(join(tmp, 'assets', 'index-CCCC.css'), 'body{margin:0}\n');
    writeFileSync(join(tmp, 'assets', 'worker-BBBB.js'), 'postMessage(1);\n');
    expect(findSourceMapReferences(tmp)).toEqual([]);
  });

  it('keepSourceMaps copies the maps to a side folder under the same relative paths and leaves the build alone', () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-dist-'));
    const build = join(tmp, 'build');
    const side = join(tmp, 'side', 'abc1234');
    fakeBuild(build);
    expect(keepSourceMaps(build, side).sort()).toEqual(['assets/index-AAAA.js.map', 'assets/index-CCCC.css.map', 'assets/worker-BBBB.js.map']);
    expect(readdirSync(join(side, 'assets')).sort()).toEqual(['index-AAAA.js.map', 'index-CCCC.css.map', 'worker-BBBB.js.map']);
    expect(readFileSync(join(side, 'assets', 'index-AAAA.js.map'), 'utf8')).toContain('a.ts');
    expect(existsSync(join(build, 'assets', 'index-AAAA.js.map'))).toBe(true);
    mkdirSync(join(tmp, 'plain'));
    writeFileSync(join(tmp, 'plain', 'index.html'), 'x');
    expect(keepSourceMaps(join(tmp, 'plain'), join(tmp, 'elsewhere'))).toEqual([]); // a build without maps keeps nothing
    expect(existsSync(join(tmp, 'elsewhere'))).toBe(false);
  });
});

describe('the production build makes and ships no source map', () => {
  it('makes none unless a side folder is named, and then hides them (no sourceMappingURL comment in the code)', async () => {
    const off = await withSourceMapEnv(undefined, configFor);
    expect(off.build?.sourcemap).toBe(false);
    const on = await withSourceMapEnv(join(tmpdir(), 'pyrefly-maps-never-written'), configFor);
    expect(on.build?.sourcemap).toBe('hidden');
    expect(existsSync(join(tmpdir(), 'pyrefly-maps-never-written'))).toBe(false); // reading the config writes nothing
  });

  it('the dist-filter plugin keeps the maps in the side folder and prunes them from the build', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-dist-'));
    const outDir = join(tmp, 'dist-release');
    const side = join(tmp, 'sourcemaps', 'abc1234');
    fakeBuild(outDir);
    const config = await withSourceMapEnv(side, configFor);
    const plugin = filterPlugin(config);
    const said: string[] = [];
    plugin.configResolved({ root: tmp, build: { outDir: 'dist-release' } });
    plugin.closeBundle.call({ info: (m: string) => said.push(m), warn: (m: string) => said.push(`WARN ${m}`) });
    expect(readdirSync(join(side, 'assets')).sort()).toEqual(['index-AAAA.js.map', 'index-CCCC.css.map', 'worker-BBBB.js.map']);
    expect(findUnshipped(outDir)).toEqual([]);
    expect(said.join('\n')).toContain('kept 3 source map(s)');
    expect(said.some((m) => m.startsWith('WARN'))).toBe(false);
  });

  it('a side folder that cannot be written is a warning, and the maps are still pruned from the build', async () => {
    tmp = mkdtempSync(join(tmpdir(), 'pyrefly-dist-'));
    const outDir = join(tmp, 'dist-release');
    fakeBuild(outDir);
    writeFileSync(join(tmp, 'a-file'), 'x'); // a folder cannot be made beneath a file
    const config = await withSourceMapEnv(join(tmp, 'a-file', 'abc1234'), configFor);
    const plugin = filterPlugin(config);
    const said: string[] = [];
    plugin.configResolved({ root: tmp, build: { outDir: 'dist-release' } });
    plugin.closeBundle.call({ info: (m: string) => said.push(m), warn: (m: string) => said.push(`WARN ${m}`) });
    expect(said.some((m) => m.startsWith('WARN'))).toBe(true);
    expect(findUnshipped(outDir)).toEqual([]);
  });

  it('keeps the licence notices the earlier release rules require', async () => {
    const config = await withSourceMapEnv(undefined, configFor);
    expect(config.build?.license).toEqual({ fileName: THIRD_PARTY_LICENCES });
    expect(isSourceMapFile(THIRD_PARTY_LICENCES)).toBe(false);
    expect(isUnshippedPublicFile(THIRD_PARTY_LICENCES)).toBe(false);
  });

  it('is wired to the deploy: it names the folder by commit and refuses a build that still points at a map', () => {
    const deploy = readFileSync(join(__dirname, '..', '..', 'tools', 'deploy-pages.mjs'), 'utf8');
    expect(deploy).toContain('SOURCEMAP_DIR_ENV');
    expect(deploy).toContain('findSourceMapReferences(DIST)');
    expect(deploy).toMatch(/join\(SOURCEMAP_HOME, mainSha\)/);
  });
});
