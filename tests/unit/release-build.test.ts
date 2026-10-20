/**
 * **The deploy and a review's candidate build with the same inputs** (both games; release tooling, no gameplay; release 61, the finding of the release 60 live check).
 *
 * Release 60's candidate was reviewed as `index-CXbIrsG6.js` and the deploy published `index-DwCdr0nf.js`: the deploy built with the host's base (`BASE_PATH=/`), the candidate
 * with vite's own default (`/pyrefly-reprise/`), and a base is in the bundle, the stylesheet, index.html and every chunk that imports the bundle. The environment of both builds now
 * comes from `tools/release-build.mjs`; this file holds the contract: what it pins, that the deploy really calls it, and that no variable `vite.config.ts` reads is left out of its
 * inventory (a new one must be pinned or listed as inherited on purpose, not discovered by the next release).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { SCOPE_ENV } from '../../tools/art-derive-lib.mjs';
import { THUMBS_ENV } from '../../tools/art-thumbs.mjs';
import { RELEASE_ENV } from '../../tools/build-stamp.mjs';
import { DEFAULT_HOST, HOSTS, hostBuildEnv } from '../../tools/deploy-host.mjs';
import { SOURCEMAP_DIR_ENV } from '../../tools/dist-filter.mjs';
import {
  ART_THUMBS_ENV,
  ART_WEBP_ENV,
  BASE_ENV,
  BUILD_SHA_ENV,
  INHERITED_BUILD_ENV,
  bundleInputs,
  diffBundleInputs,
  formatBundleInputs,
  inheritedBuildEnv,
  releaseBuildEnv,
  releaseViteArgs,
} from '../../tools/release-build.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (rel: string): string => readFileSync(`${ROOT}${rel}`, 'utf8');

describe('releaseBuildEnv: what the production build is told', () => {
  it('sets the host\'s base, whatever the shell carries', () => {
    expect(releaseBuildEnv({ release: '60', host: HOSTS.cloudflare, env: {} })[BASE_ENV]).toBe('/');
    expect(releaseBuildEnv({ release: '60', host: HOSTS.github, env: {} })[BASE_ENV]).toBe('/pyrefly-reprise/');
    // a leftover from a GitHub rehearsal cannot decide the Cloudflare build, nor the reverse
    expect(releaseBuildEnv({ release: '60', host: HOSTS.cloudflare, env: { [BASE_ENV]: '/pyrefly-reprise/' } })[BASE_ENV]).toBe('/');
    expect(releaseBuildEnv({ release: '60', host: HOSTS.github, env: { [BASE_ENV]: '/' } })[BASE_ENV]).toBe('/pyrefly-reprise/');
  });

  it('defaults to the default host, the one a production deploy goes to', () => {
    expect(releaseBuildEnv({ release: '60', env: {} })).toMatchObject(hostBuildEnv(HOSTS[DEFAULT_HOST]));
  });

  it('sets the release name over an inherited one', () => {
    expect(releaseBuildEnv({ release: '60', env: { [RELEASE_ENV]: '12' } })[RELEASE_ENV]).toBe('60');
    expect(releaseBuildEnv({ release: 'Preview', env: {} })[RELEASE_ENV]).toBe('Preview');
  });

  it('keeps the source maps when asked, and removes an inherited folder when not', () => {
    expect(releaseBuildEnv({ release: '60', sourceMapDir: 'D:/maps/abc', env: {} })[SOURCEMAP_DIR_ENV]).toBe('D:/maps/abc');
    expect(SOURCEMAP_DIR_ENV in releaseBuildEnv({ release: '60', sourceMapDir: null, env: { [SOURCEMAP_DIR_ENV]: 'D:/old' } })).toBe(false);
  });

  it('leaves the rest of the environment alone and does not touch the one it was given', () => {
    const given = { PATH: 'x', [BASE_ENV]: '/pyrefly-reprise/' };
    const out = releaseBuildEnv({ release: '60', env: given });
    expect(out['PATH']).toBe('x');
    expect(given[BASE_ENV]).toBe('/pyrefly-reprise/');
  });
});

describe('releaseViteArgs: the command both builds run', () => {
  it('builds into the folder, emptying it', () => {
    expect(releaseViteArgs('dist-release')).toEqual(['build', '--outDir', 'dist-release', '--emptyOutDir']);
  });

  it('is the command tools/deploy-pages.mjs runs, word for word', () => {
    const src = read('tools/deploy-pages.mjs');
    const call = src.match(/runNpx\((\[[^\]]*\])\s*,/);
    expect(call, 'deploy-pages.mjs no longer builds with runNpx([...], ...)').not.toBeNull();
    const words = JSON.parse((call as RegExpMatchArray)[1]!.replace(/'/g, '"')) as string[];
    expect(words).toEqual(['vite', ...releaseViteArgs('dist-release')]);
  });
});

describe('the deploy builds with releaseBuildEnv, the function a candidate also uses', () => {
  const src = read('tools/deploy-pages.mjs');

  it('calls it with its release, its host and its source-map folder', () => {
    expect(src).toMatch(/releaseBuildEnv\(\{ release: RELEASE, host: HOST, sourceMapDir \}\)/);
    expect(src).toContain("from './release-build.mjs'");
  });

  it('no longer assembles the build environment by hand', () => {
    expect(src).not.toMatch(/\.\.\.hostEnv|hostBuildEnv\(/);
    expect(src).not.toMatch(/\[RELEASE_ENV\]\s*:/);
  });
});

describe('the variables a build reads, by name', () => {
  it('are the ones the build tools define', () => {
    expect(BASE_ENV).toBe('BASE_PATH');
    expect(ART_WEBP_ENV).toBe(SCOPE_ENV);
    expect(ART_THUMBS_ENV).toBe(THUMBS_ENV);
    expect(BUILD_SHA_ENV).toBe('PYREFLY_BUILD_SHA');
  });

  it('are every variable vite.config.ts reads: a new one must be pinned or listed on purpose', () => {
    const config = read('vite.config.ts');
    const named = new Set<string>();
    for (const m of config.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)|process\.env\[\s*['"]([A-Z_][A-Z0-9_]*)['"]\s*\]/g)) named.add((m[1] ?? m[2]) as string);
    // the release name is read through releaseFromEnv(process.env), the source-map folder through SOURCEMAP_DIR_ENV
    expect(config).toContain('releaseFromEnv(process.env)');
    expect(config).toContain('process.env[SOURCEMAP_DIR_ENV]');
    const known = new Set([BASE_ENV, BUILD_SHA_ENV]);
    expect([...named].filter((n) => !known.has(n)), 'vite.config.ts reads a variable release-build.mjs does not know').toEqual([]);
    // and the pinned ones are exactly what releaseBuildEnv sets
    expect(RELEASE_ENV).toBe('PYREFLY_RELEASE');
    expect(SOURCEMAP_DIR_ENV).toBe('PYREFLY_SOURCEMAP_DIR');
  });

  it('are the three the deploy leaves to the shell on purpose', () => {
    expect([...INHERITED_BUILD_ENV].sort()).toEqual([ART_THUMBS_ENV, ART_WEBP_ENV, BUILD_SHA_ENV].sort());
  });
});

describe('bundleInputs: what vite.config.ts and the art plugin will read', () => {
  it('reads the defaults the way they do', () => {
    expect(bundleInputs({})).toEqual({
      base: '/pyrefly-reprise/', // vite.config.ts: process.env.BASE_PATH ?? '/pyrefly-reprise/'
      release: '',
      buildSha: '(git HEAD of the tree)',
      artWebp: 'exact',
      artThumbs: 'on',
    });
    expect(read('vite.config.ts')).toContain(`process.env.BASE_PATH ?? '${HOSTS.github.base}'`);
  });

  it('reads set values, trimmed and lower-cased where the tools do', () => {
    expect(bundleInputs({ BASE_PATH: '/', PYREFLY_RELEASE: ' 60 ', PYREFLY_BUILD_SHA: ' 1cea6e93 ', PYREFLY_ART_WEBP: ' OFF ', PYREFLY_ART_THUMBS: 'Off' })).toEqual({
      base: '/', release: '60', buildSha: '1cea6e93', artWebp: 'off', artThumbs: 'off',
    });
    // an empty BASE_PATH is a value, as `??` reads it
    expect(bundleInputs({ BASE_PATH: '' }).base).toBe('');
  });

  it('names the release 60 mismatch: a build with the release name and no base reads another base than the deploy', () => {
    const candidateOfRelease60 = bundleInputs({ [RELEASE_ENV]: '60' });
    const deploy = bundleInputs(releaseBuildEnv({ release: '60', host: HOSTS.cloudflare, sourceMapDir: 'D:/maps/1cea6e93', env: {} }));
    expect(diffBundleInputs(candidateOfRelease60, deploy)).toEqual([{ key: 'base', a: '/pyrefly-reprise/', b: '/' }]);
  });

  it('finds no difference between two builds made by releaseBuildEnv for one host, whatever each shell carries', () => {
    const a = bundleInputs(releaseBuildEnv({ release: '60', host: HOSTS.cloudflare, env: { BASE_PATH: '/pyrefly-reprise/', PYREFLY_RELEASE: '12' } }));
    const b = bundleInputs(releaseBuildEnv({ release: '60', host: HOSTS.cloudflare, sourceMapDir: 'D:/maps/x', env: { PYREFLY_SOURCEMAP_DIR: 'D:/old' } }));
    expect(diffBundleInputs(a, b)).toEqual([]);
  });

  it('prints one line per input', () => {
    expect(formatBundleInputs(bundleInputs({ BASE_PATH: '/', PYREFLY_RELEASE: '60' }))).toEqual([
      'base /', 'release 60', 'build sha (git HEAD of the tree)', 'art WebP scope exact', 'strip thumbnails on',
    ]);
    expect(formatBundleInputs(bundleInputs({}))[1]).toBe('release (none)');
  });
});

describe('inheritedBuildEnv: what this shell sets that the deploy reads from its own', () => {
  it('lists only the unpinned variables that are set', () => {
    expect(inheritedBuildEnv({})).toEqual([]);
    expect(inheritedBuildEnv({ PYREFLY_ART_WEBP: 'off', PYREFLY_BUILD_SHA: ' ', BASE_PATH: '/' })).toEqual(['PYREFLY_ART_WEBP=off']);
  });
});
