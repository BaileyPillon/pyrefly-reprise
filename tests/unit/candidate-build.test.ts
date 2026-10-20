/**
 * **A review builds its candidate the way the deploy does** (both games; delivery and critic tooling; decision 134 of the release 55 live check):
 * the reviewed bundle is the deployed bundle, so the candidate carries the release name of the newest player note (`PYREFLY_RELEASE`), never none.
 * `tools/candidate-build.mjs` is the one way; the runner scripts and the runner's self-test go through it, and this file fails if one of them builds with a bare `vite build` again.
 *
 * Release 61: the candidate is also built for the deploy's base (the release 60 mismatch: the candidate had vite's default `/pyrefly-reprise/`, the deploy `/`), and every input
 * that decides the bundle is compared with the deploy's (`tests/unit/release-build.test.ts` holds the shared function).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  CANDIDATE_HOST,
  CANDIDATE_OUT,
  bundleOfIndexHtml,
  candidateBuildEnv,
  candidatePreviewArgs,
  candidatePreviewEnv,
  candidateUrl,
  candidateViteArgs,
  compareWithDeploy,
  decideCandidateRelease,
  deployBuildEnvFor,
  newestReleaseOf,
} from '../../tools/candidate-build.mjs';
import { RELEASE_ENV, releaseFromEnv } from '../../tools/build-stamp.mjs';
import { DEFAULT_HOST, HOSTS, checkBuildBase } from '../../tools/deploy-host.mjs';
import { SOURCEMAP_DIR_ENV } from '../../tools/dist-filter.mjs';
import { bundleInputs, diffBundleInputs } from '../../tools/release-build.mjs';
import { decideRelease } from '../../tools/release-notes.mjs';
import { RELEASE_NOTES, newestRelease } from '../../src/app/changelog/releaseNotes.ts';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const read = (rel: string): string => readFileSync(`${ROOT}${rel}`, 'utf8');

describe('the release name of a candidate', () => {
  it('is the newest player note\'s, the same name the deploy refuses to differ from', async () => {
    const newest = newestRelease(RELEASE_NOTES);
    expect(newest).toMatch(/^[0-9]+(\.[0-9]+)*[a-z]?$/);
    expect(await newestReleaseOf(ROOT)).toBe(newest);
    expect(decideCandidateRelease({ newest })).toEqual({ ok: true, release: newest });
    // the deploy's own decision for that name is the same release: one source of truth, two callers
    expect(decideRelease({ requested: newest as string, preview: false, newest, problems: [] })).toMatchObject({ ok: true, release: newest });
  });

  it('refuses a name that is not the newest note, and a tree with no note', () => {
    expect(decideCandidateRelease({ newest: '56', requested: '55' })).toMatchObject({ ok: false });
    expect(decideCandidateRelease({ newest: '56', requested: '56' })).toEqual({ ok: true, release: '56' });
    expect(decideCandidateRelease({ newest: '56', requested: '' })).toEqual({ ok: true, release: '56' });
    expect(decideCandidateRelease({ newest: null })).toMatchObject({ ok: false });
    expect(decideCandidateRelease({ newest: 'Preview' })).toMatchObject({ ok: false }); // a candidate is never stamped as a preview
  });
});

describe('the candidate build environment', () => {
  it('sets PYREFLY_RELEASE to the note\'s name and the build stamp reads it back', () => {
    const env = candidateBuildEnv('56', { PATH: 'x' });
    expect(env[RELEASE_ENV]).toBe('56');
    expect(env['PATH']).toBe('x');
    expect(releaseFromEnv(env)).toBe('56');
  });

  it('beats an inherited PYREFLY_RELEASE: the note decides, not the shell the reviewer happens to be in', () => {
    expect(candidateBuildEnv('56', { [RELEASE_ENV]: '12' })[RELEASE_ENV]).toBe('56');
    expect(candidateBuildEnv('56', { [RELEASE_ENV]: 'Preview' })[RELEASE_ENV]).toBe('56');
  });

  it('builds into the folder asked for, emptying it, as the deploy\'s own build does', () => {
    expect(candidateViteArgs()).toEqual(['build', '--outDir', CANDIDATE_OUT, '--emptyOutDir']);
    expect(candidateViteArgs('dist-smoke')).toEqual(['build', '--outDir', 'dist-smoke', '--emptyOutDir']);
  });
});

describe("the candidate is built for the deploy's base (release 60)", () => {
  it('builds for the default host: Cloudflare, served from the root', () => {
    expect(CANDIDATE_HOST).toBe(HOSTS[DEFAULT_HOST]);
    expect(candidateBuildEnv('60', {})['BASE_PATH']).toBe('/');
  });

  it('sets the base over an inherited one, in either direction', () => {
    expect(candidateBuildEnv('60', { BASE_PATH: '/pyrefly-reprise/' })['BASE_PATH']).toBe('/');
    expect(candidateBuildEnv('60', { BASE_PATH: '/elsewhere/' })['BASE_PATH']).toBe('/');
  });

  it("keeps no source maps: an inherited folder is removed, the deploy's own is not a candidate's", () => {
    expect(SOURCEMAP_DIR_ENV in candidateBuildEnv('60', { [SOURCEMAP_DIR_ENV]: 'D:/maps/x' })).toBe(false);
    expect(typeof deployBuildEnvFor('60', {})[SOURCEMAP_DIR_ENV]).toBe('string');
  });

  it('runs the command the deploy runs, into any folder', () => {
    expect(candidateViteArgs('dist-release')).toEqual(['build', '--outDir', 'dist-release', '--emptyOutDir']);
  });

  it('reads the same build inputs as the deploy, from any shell', () => {
    const shells = [
      {},
      { BASE_PATH: '/pyrefly-reprise/' },
      { BASE_PATH: '/', PYREFLY_RELEASE: '12', PYREFLY_SOURCEMAP_DIR: 'D:/old' },
      { PYREFLY_RELEASE: 'Preview', BASE_PATH: '/nowhere/' },
    ];
    for (const env of shells) {
      const compared = compareWithDeploy('60', env);
      expect(compared.differences, JSON.stringify(env)).toEqual([]);
      expect(compared.candidate).toEqual({ base: '/', release: '60', buildSha: '(git HEAD of the tree)', artWebp: 'exact', artThumbs: 'on' });
    }
  });

  it('says what the shell sets that the deploy would read from its own', () => {
    const compared = compareWithDeploy('60', { PYREFLY_ART_WEBP: 'off', PYREFLY_BUILD_SHA: '1cea6e93' });
    expect(compared.inherited).toEqual(['PYREFLY_BUILD_SHA=1cea6e93', 'PYREFLY_ART_WEBP=off']);
    expect(compared.differences).toEqual([]);
  });

  it('would catch the release 60 candidate: the release name and no base is not what the deploy builds with', () => {
    const release60Candidate: NodeJS.ProcessEnv = { [RELEASE_ENV]: '60' };
    const differences = diffBundleInputs(bundleInputs(release60Candidate), bundleInputs(deployBuildEnvFor('60', {})));
    expect(differences).toEqual([{ key: 'base', a: '/pyrefly-reprise/', b: '/' }]);
  });

  it('refuses, after the build, an index.html made for the old GitHub Pages folder', () => {
    const gate = '<script type="module" src="/pyrefly-reprise/assets/index-CXbIrsG6.js"></script>';
    const deployed = '<script type="module" src="/assets/index-DwCdr0nf.js"></script>';
    expect(checkBuildBase(gate, CANDIDATE_HOST.base).length).toBeGreaterThan(0);
    expect(checkBuildBase(deployed, CANDIDATE_HOST.base)).toEqual([]);
  });

  it('names the bundle an index.html loads, as the deploy reads it', () => {
    expect(bundleOfIndexHtml('<script src="/assets/index-DwCdr0nf.js"></script>')).toBe('index-DwCdr0nf.js');
    expect(bundleOfIndexHtml('<script src="/pyrefly-reprise/assets/index-CXbIrsG6.js"></script>')).toBe('index-CXbIrsG6.js');
    expect(bundleOfIndexHtml('<p>no script</p>')).toBeNull();
  });

  it('--dry-run prints both sides, exits 0, and ignores a hostile BASE_PATH in the shell', () => {
    const run = spawnSync(process.execPath, [`${ROOT}tools/candidate-build.mjs`, '--dry-run'], {
      cwd: ROOT, encoding: 'utf8', env: { ...process.env, BASE_PATH: '/pyrefly-reprise/', [RELEASE_ENV]: '12' },
    });
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toMatch(/release \S+ \(the newest player note\), PYREFLY_RELEASE=\S+ BASE_PATH=\/ node /);
    expect(run.stdout).toMatch(/build inputs of this candidate: base \/;/);
    expect(run.stdout).toContain('the deploy (Cloudflare, base /) builds with the same inputs');
  });
});

describe('serving a candidate (a bare vite preview serves the wrong base)', () => {
  it("sets the build's base for the preview and drops a release name that could stop vite.config.ts", () => {
    const env = candidatePreviewEnv({ BASE_PATH: '/pyrefly-reprise/', [RELEASE_ENV]: 'not a release' });
    expect(env['BASE_PATH']).toBe('/');
    expect(RELEASE_ENV in env).toBe(false);
  });

  it('serves the folder on this machine only, on exactly the port asked for', () => {
    expect(candidatePreviewArgs('dist-gate', 5420)).toEqual(['preview', '--outDir', 'dist-gate', '--port', '5420', '--strictPort', '--host', '127.0.0.1']);
  });

  it("answers at the host's base under that port", () => {
    expect(candidateUrl(5420)).toBe('http://127.0.0.1:5420/');
  });

  it('is what the runner prompts and the self-test use', () => {
    for (const file of ['critic/runner/focused.js', 'critic/runner/deep.js']) {
      const src = read(file);
      expect(src, file).toContain('node tools/candidate-build.mjs --serve --out dist-gate --port');
      expect(src, file).toContain('build.bundle');
    }
    const selftest = read('critic/runner/lib/selftest.mjs');
    expect(selftest).toContain('candidatePreviewEnv()');
    expect(selftest).toContain('candidateUrl(PORT)');
    expect(selftest).not.toContain('/pyrefly-reprise/');
  });
});

describe('no review script builds a candidate by hand', () => {
  const BARE_BUILD = /(?:npx\s+)?vite\s+build\s+--outDir|\[VITE_BIN,\s*'build'/;

  it.each(['critic/runner/focused.js', 'critic/runner/deep.js', 'critic/runner/release.js'])('%s names tools/candidate-build.mjs and has no bare vite build', (file) => {
    const src = read(file);
    expect(src).toContain('tools/candidate-build.mjs');
    expect(src, `${file} builds with a bare vite build: the bundle would carry no release name`).not.toMatch(BARE_BUILD);
  });

  it('the runner self-test builds through the same helpers', () => {
    const src = read('critic/runner/lib/selftest.mjs');
    expect(src).toContain('candidateBuildEnv');
    expect(src).toContain('newestReleaseOf');
    expect(src).not.toMatch(BARE_BUILD);
  });
});
