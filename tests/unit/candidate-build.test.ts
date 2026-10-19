/**
 * **A review builds its candidate the way the deploy does** (both games; delivery and critic tooling; decision 134 of the release 55 live check):
 * the reviewed bundle is the deployed bundle, so the candidate carries the release name of the newest player note (`PYREFLY_RELEASE`), never none.
 * `tools/candidate-build.mjs` is the one way; the runner scripts and the runner's self-test go through it, and this file fails if one of them builds with a bare `vite build` again.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { CANDIDATE_OUT, candidateBuildEnv, candidateViteArgs, decideCandidateRelease, newestReleaseOf } from '../../tools/candidate-build.mjs';
import { RELEASE_ENV, releaseFromEnv } from '../../tools/build-stamp.mjs';
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
