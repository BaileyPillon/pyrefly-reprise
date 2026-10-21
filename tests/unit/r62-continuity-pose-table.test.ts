/**
 * RELEASE 62, PR-0512 (tooling, both games): the continuity harness reads the candidate's own pose-measure table, or says loudly that it did not.
 *
 * Round 28 (the deep review of release 61): the gap pass's continuity runs read the review tree's table (78 subjects) and not the candidate's (114); four chapters failed CHK-026 on registrations the
 * candidate had replaced, and the same chapters passed on the candidate's table. `critic/runner/lib/continuity-table.mjs` now (1) resolves the table in one place and records its source, (2) reads the
 * candidate's table from the commit the build names (the title's build tag) and (3) makes CHK-026 UNVERIFIED, with the reason, when the table the run read is not that file.
 *
 * The git part runs for real: a throwaway repository with two commits whose tables differ (two subjects, then three), the way the review tree and the candidate differ.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { aggregate, continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import { POSE_MEASURE_REL, candidateTableAt, judgeTable, parseBuildTag, resolvePoseMeasure, tableRootOf } from '../../critic/runner/lib/continuity-table.mjs';
import { loadPoseMeasure } from '../../critic/runner/lib/continuity-silhouette.mjs';

const table = (names: string[]): string => JSON.stringify({ version: 1, koProjection: 0.978, resolution: 0.005, metric: 'x', subjects: Object.fromEntries(names.map((n) => [n, { poses: {} }])) }, null, 1);

describe('which table a run reads', () => {
  const root = join('D:', 'harness-tree');
  it('an explicit --pose-measure wins, then --candidate-root (and its older spelling), then the tree the harness was started from', () => {
    const explicit = join('D:', 'x', 'docs', 'target', 'pose-measure.json');
    expect(resolvePoseMeasure({ args: { 'pose-measure': explicit, 'candidate-root': 'D:/cand' }, root })).toEqual({ path: explicit, source: 'explicit', root: tableRootOf(explicit) });
    expect(resolvePoseMeasure({ args: { 'candidate-root': 'D:/cand' }, root })).toEqual({ path: join('D:/cand', ...POSE_MEASURE_REL), source: 'candidate-root', root: 'D:/cand' });
    expect(resolvePoseMeasure({ args: { 'pose-measure-from': 'D:/cand' }, root }).source).toBe('candidate-root');
    expect(resolvePoseMeasure({ args: {}, root })).toEqual({ path: join(root, ...POSE_MEASURE_REL), source: 'harness-tree', root });
  });

  it('says "none" when the harness tree has no table', () => {
    expect(resolvePoseMeasure({ args: {}, root, exists: () => false })).toEqual({ path: null, source: 'none', root: null });
  });

  it('finds the repository a table file sits in', () => {
    expect(tableRootOf(join('D:', 'a b', 'docs', 'target', 'pose-measure.json'))).toBe(join('D:', 'a b'));
    expect(tableRootOf(join('D:', 'a', 'other.json'))).toBeNull();
  });
});

describe('the title\'s build tag', () => {
  it('names the commit', () => {
    expect(parseBuildTag('Release 61 · 660c19bb')).toEqual({ release: '61', sha: '660c19bb' });
    expect(parseBuildTag('Preview · A1B2C3D4')).toEqual({ release: 'Preview', sha: 'a1b2c3d4' });
    expect(parseBuildTag('  660c19bb ')).toEqual({ release: null, sha: '660c19bb' });
    expect(parseBuildTag(null)).toEqual({ release: null, sha: null });
    expect(parseBuildTag('Release 61')).toEqual({ release: '61', sha: null });
  });
});

describe('the candidate\'s own table, read from its commit, against the table the run loaded', () => {
  let repo: string;
  let older: string; // the "review tree": a table of 2 subjects, at commit A
  let newer: string; // the "candidate": 3 subjects, at commit B

  const git = (...a: string[]): string => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commitTable = (names: string[], msg: string): string => {
    writeFileSync(join(repo, ...POSE_MEASURE_REL), table(names));
    git('add', join(...POSE_MEASURE_REL));
    git('-c', 'user.name=t', '-c', 'user.email=t@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', msg);
    return git('rev-parse', '--short=8', 'HEAD');
  };

  beforeAll(() => {
    repo = mkdtempSync(join(tmpdir(), 'r62-pose-table-'));
    git('init', '-q');
    mkdirSync(join(repo, 'docs', 'target'), { recursive: true });
    older = commitTable(['tidus', 'yuna'], 'a');
    newer = commitTable(['tidus', 'yuna', 'seymour-flux-body'], 'b');
  });
  afterAll(() => rmSync(repo, { recursive: true, force: true }));

  it('reads the table as the commit has it, not as the working tree has it now', () => {
    expect(candidateTableAt(repo, older)?.count).toBe(2);
    expect(candidateTableAt(repo, newer)?.count).toBe(3);
    expect(candidateTableAt(repo, older)?.sha256).not.toBe(candidateTableAt(repo, newer)?.sha256);
  });

  it('is null for what git cannot give: an unknown commit, no commit, no repository', () => {
    expect(candidateTableAt(repo, 'deadbeef')).toBeNull();
    expect(candidateTableAt(repo, null)).toBeNull();
    expect(candidateTableAt(null, newer)).toBeNull();
    expect(candidateTableAt(join(tmpdir(), 'r62-not-a-repo-' + Date.now()), newer)).toBeNull();
  });

  const loadedAt = (sha: string) => {
    const t = candidateTableAt(repo, sha)!;
    return { path: 'x/docs/target/pose-measure.json', sha256: t.sha256, count: t.count };
  };

  it('round 28\'s case: the review tree\'s table (2 subjects) against a candidate that has 3 is stale, CHK-026 will be UNVERIFIED and the reason names both tables', () => {
    const j = judgeTable({ loaded: loadedAt(older), candidate: candidateTableAt(repo, newer), buildSha: newer, source: 'harness-tree' });
    expect(j.checked).toBe(true);
    expect(j.stale).toBe(true);
    expect(j.fail).toBe(true);
    expect(j.reason).toMatch(/2 subjects/);
    expect(j.reason).toMatch(/3 subjects/);
    expect(j.reason).toMatch(/not the candidate's/);
    expect(j.reason).toMatch(/--candidate-root/);
    expect(j.reason).toContain(newer);
  });

  it('the candidate\'s own table passes, and is recorded as checked', () => {
    expect(judgeTable({ loaded: loadedAt(newer), candidate: candidateTableAt(repo, newer), buildSha: newer, source: 'candidate-root' })).toEqual({ checked: true, stale: false, fail: false, reason: null });
  });

  it('--allow-stale-pose-table keeps the verdict and still records the mismatch', () => {
    const j = judgeTable({ loaded: loadedAt(older), candidate: candidateTableAt(repo, newer), buildSha: newer, source: 'explicit', allowStale: true });
    expect(j.stale).toBe(true);
    expect(j.fail).toBe(false);
    expect(j.reason).toMatch(/not the candidate's/);
  });

  it('a build that shows no commit, or a commit the repository does not know, cannot be checked: said so, verdict kept', () => {
    const l = loadedAt(newer);
    const noCommit = judgeTable({ loaded: l, candidate: null, buildSha: null, source: 'harness-tree' });
    expect(noCommit).toMatchObject({ checked: false, stale: false, fail: false });
    expect(noCommit.reason).toMatch(/shows no commit/);
    const unknown = judgeTable({ loaded: l, candidate: null, buildSha: 'deadbeef', source: 'harness-tree' });
    expect(unknown).toMatchObject({ checked: false, stale: false, fail: false });
    expect(unknown.reason).toMatch(/does not know commit deadbeef/);
    expect(judgeTable({ loaded: null, candidate: null, buildSha: newer, source: 'none' }).reason).toMatch(/no pose-measure table was loaded/);
  });

  it('the harness\'s own loader hashes the same bytes: a file on disk equals the commit\'s version', () => {
    const onDisk = loadPoseMeasure(join(repo, ...POSE_MEASURE_REL));
    expect(onDisk?.sha256).toBe(candidateTableAt(repo, newer)?.sha256);
    expect(onDisk?.count).toBe(3);
  });
});

describe('the whole run leaves a chapter out when its table was not the candidate\'s', () => {
  const cfg = continuityConfig();
  const chapter = (id: string, over: Record<string, unknown> = {}) => ({
    chapter: id, game: 'ffx', checks: { 'CHK-026': { result: 'PASS' }, 'CHK-027': { result: 'PASS' } }, strips: [{ file: 'a.jpg' }],
    summary: {
      battleSeconds: 120, swaps: 40, counted: 38,
      size: { maxHeadJumpPct: 1.5, maxHeadJumpPctRegistration: 1.5, headOverTolerance: 0, maxFeetShiftPx: 1, feetOverTolerance: 0, headMeasured: 38, headRegistration: 30 },
      motion: { snaps: 0, hardCuts: 0, ghostSwaps: 10, ghostFrames: 30, worstGhostSeverity: 0.3, ghostOverFail: 0, jerks: 2, worstJerkPx: 30, jerksOverFail: 0, lowestIou: 0.5, maxCentroidShiftPx: 10 },
    },
    ...over,
  });

  it('a false FAIL read against the wrong table does not fail the run: it is UNVERIFIED, naming the chapter', () => {
    const wrong = chapter('yunalesca', { staleTable: true, checks: { 'CHK-026': { result: 'UNVERIFIED' }, 'CHK-027': { result: 'PASS' } } });
    (wrong.summary.size as Record<string, number>)['headOverTolerance'] = 708; // the round-28 reading: 708 swaps over tolerance on the old table
    const a = aggregate([chapter('seymour-flux'), wrong] as never, cfg);
    expect(a.size['headOverTolerance']).toBe(0); // not counted
    expect(a.checks['CHK-026'].result).toBe('UNVERIFIED');
    expect(a.checks['CHK-026'].reasons.join(' ')).toContain('yunalesca');
  });

  it('a chapter read on the right table with a real failure still fails the run', () => {
    const bad = chapter('mirror-aeons');
    (bad.summary.size as Record<string, number>)['headOverTolerance'] = 3;
    const a = aggregate([chapter('seymour-flux'), bad] as never, cfg);
    expect(a.checks['CHK-026'].result).toBe('FAIL');
  });
});
