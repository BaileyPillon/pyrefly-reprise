/**
 * `pagesOutcome` — the fix for the 2026-09-27 incident: `tools/deploy-pages.mjs`
 * step 4 used to poll only `repos/<repo>/pages/builds/latest` and fail the
 * whole deploy the instant that one build read "errored". On 2026-09-27 the
 * push to gh-pages kicked its own Pages build and the script's own POST kicked
 * a second one for the same commit; the first errored ("Page build failed.")
 * while the second built the exact bundle that went live, but the deploy
 * failed and skipped verification and records (release 22 had the same
 * double build and passed only by luck of which one `latest` happened to
 * return).
 *
 * `pagesOutcome` looks at every build recorded for the pushed gh-pages
 * commit, not just the newest one: BUILT if any of them succeeded, ERRORED
 * only once every build for that commit has errored, and PENDING while
 * something for that commit is still building/queued or nothing has shown up
 * for it yet. Pure: no network, no git, no clock (both games; delivery
 * tooling, not gameplay, so this applies regardless of game).
 */

import { describe, expect, it } from 'vitest';

import { pagesOutcome } from '../../tools/deploy-pages.mjs';

const COMMIT = 'a'.repeat(40);
const OTHER_COMMIT = 'b'.repeat(40);

const build = (over: Record<string, unknown> = {}) => ({
  status: 'built',
  commit: COMMIT,
  error: { message: null },
  ...over,
});

describe('pagesOutcome', () => {
  it('is BUILT when the only build for the commit succeeded', () => {
    const outcome = pagesOutcome([build({ status: 'built' })], COMMIT);
    expect(outcome.status).toBe('built');
  });

  it('is BUILT when an earlier build for the same commit errored but a later one built (the 2026-09-27 case)', () => {
    const outcome = pagesOutcome(
      [
        build({ status: 'errored', error: { message: 'Page build failed.' } }),
        build({ status: 'built' }),
      ],
      COMMIT,
    );
    expect(outcome.status).toBe('built');
  });

  it('is PENDING while a build for the commit is still building', () => {
    const outcome = pagesOutcome([build({ status: 'building' })], COMMIT);
    expect(outcome.status).toBe('pending');
  });

  it('is PENDING while a build for the commit is still queued', () => {
    const outcome = pagesOutcome([build({ status: 'queued' })], COMMIT);
    expect(outcome.status).toBe('pending');
  });

  it('is PENDING when nothing has been recorded for the commit yet', () => {
    const outcome = pagesOutcome([], COMMIT);
    expect(outcome.status).toBe('pending');
  });

  it('is ERRORED, with every message, only once every build for the commit has errored', () => {
    const outcome = pagesOutcome(
      [
        build({ status: 'errored', error: { message: 'Page build failed.' } }),
        build({ status: 'errored', error: { message: 'timeout' } }),
      ],
      COMMIT,
    );
    expect(outcome.status).toBe('errored');
    expect(outcome.errors).toEqual(['Page build failed.', 'timeout']);
  });

  it('reports a placeholder message when an errored build carries none', () => {
    const outcome = pagesOutcome([build({ status: 'errored', error: {} })], COMMIT);
    expect(outcome.status).toBe('errored');
    expect(outcome.errors).toEqual(['(no error message)']);
  });

  it('ignores builds for another commit entirely — an unrelated build never decides this outcome', () => {
    const outcome = pagesOutcome(
      [
        build({ status: 'built', commit: OTHER_COMMIT }),
        build({ status: 'errored', commit: OTHER_COMMIT, error: { message: 'unrelated' } }),
      ],
      COMMIT,
    );
    expect(outcome.status).toBe('pending');
  });

  it('is BUILT for the right commit even when another commit only ever errored', () => {
    const outcome = pagesOutcome(
      [
        build({ status: 'errored', commit: OTHER_COMMIT, error: { message: 'unrelated' } }),
        build({ status: 'built', commit: COMMIT }),
      ],
      COMMIT,
    );
    expect(outcome.status).toBe('built');
  });
});
