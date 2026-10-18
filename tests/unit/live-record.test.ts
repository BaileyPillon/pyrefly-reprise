/**
 * The generated "what is live" record: docs/LIVE.md, written by tools/live-record.mjs from docs/deploys.log, the
 * markers in critic/pending and critic/cleared, the focused report of the live build, CHANGELOG.md and
 * docs/target/in-flight.json (ChatGPT's point 8, adopted by Bailey on 2026-10-17: make the current release
 * unmistakable).
 *
 *   1. the real record is current: it fails the moment a deploy line, a marker or a report moves and LIVE.md was not
 *      regenerated, which is what keeps it from going stale;
 *   2. the real record agrees with the deploy log, the marker and the changelog;
 *   3. the parser, the builder and the renderer on small repositories made for the test: a new deploy, an open
 *      obligation, a disclosed major and a failed deploy each change the page.
 *
 * Game case: both (records and tooling; no game behaviour).
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildLive, changelogEntry, checkLive, eastern, loadMarker, parseDeployLog, renderLive } from '../../tools/live-record.mjs';

const ROOT = resolve(__dirname, '..', '..');
const made: string[] = [];
afterEach(() => { for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true }); });

/** A tiny repository root: a deploy log, markers, reports, a changelog and an in-flight list. */
function fixture(files: Record<string, string | object>): string {
  const root = mkdtempSync(join(tmpdir(), 'live-record-'));
  made.push(root);
  for (const [rel, body] of Object.entries(files)) {
    const file = join(root, rel);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
  }
  return root;
}

const HEAD = 'datetime\tmain_sha\tbundle_hash\tart_file_count\tstatus\n';
const line = (iso: string, sha: string, bundle: string, status = 'ok') => `${iso}\tmain=${sha}\tbundle=${bundle}\tartFiles=10\tstatus=${status}\toverride=owner\thost=cloudflare\n`;
const marker = (sha: string, obligations: object[] = []) => ({ mainSha: sha, bundle: 'B', deployedAt: '2026-10-01T12:00:00Z', artifactHash: 'a'.repeat(64), liveArtifact: { result: 'PASS', checked: 7 }, obligations });
const base = (extra: Record<string, string | object> = {}) => fixture({
  'docs/deploys.log': HEAD + line('2026-10-01T12:00:00.000Z', 'aaaaaaa', 'AAA') + line('2026-10-02T12:00:00.000Z', 'bbbbbbb', 'BBB'),
  'critic/pending/bbbbbbb.json': marker('bbbbbbb', [{ kind: 'live', status: 'pending', requires: 'verify the live URL' }, { kind: 'deep', status: 'pending', requires: 'deep review', carriedFrom: ['x', 'y'] }]),
  'critic/cleared/aaaaaaa.json': marker('aaaaaaa'),
  'CHANGELOG.md': '# log\n\n## 2026-10-02 · Release 9 (r9): a thing\n\nAddress: https://example.test (main bbbbbbb, bundle BBB)\n\n## 2026-10-01 · Release 8 (r8)\n\nAddress: https://example.test (main aaaaaaa)\n',
  'docs/target/in-flight.json': { asOf: 'then', note: '', branches: [{ name: 'next', tip: 'ccccccc', case: 'both', what: 'the next thing' }] },
  ...extra,
});

describe('1. the real record', () => {
  it('is current: docs/LIVE.md equals what the repository says (run node tools/live-record.mjs after a deploy)', () => {
    expect(checkLive(ROOT)).toEqual([]);
  });

  it('names the last line of docs/deploys.log as the live build', () => {
    const rows = parseDeployLog(readFileSync(join(ROOT, 'docs', 'deploys.log'), 'utf8'));
    const last = rows[rows.length - 1];
    if (!last) throw new Error('docs/deploys.log has no deploy line');
    expect(last.status).toBe('ok');
    const text = readFileSync(join(ROOT, 'docs', 'LIVE.md'), 'utf8').replace(/\r\n/g, '\n');
    expect(text).toContain(`| Commit | \`${last.sha}\``);
    expect(text).toContain(`| Bundle | \`${last.bundle}\` |`);
    expect(text).toContain(`line ${last.line}:`);
  });

  it('has a marker for the live build, and the page lists every obligation that marker leaves pending', () => {
    const model = buildLive(ROOT);
    expect(model.marker.state).not.toBe('missing');
    expect(model.marker.data?.artifactHash).toMatch(/^[0-9a-f]{64}$/);
    const text = readFileSync(join(ROOT, 'docs', 'LIVE.md'), 'utf8');
    for (const p of model.pending) for (const o of p.data.obligations ?? []) if (o.status === 'pending') expect(text).toContain(`| \`${p.sha}\` | ${o.kind}`);
  });

  it('is the build the changelog calls live, and every in-flight branch has a tip', () => {
    const model = buildLive(ROOT);
    expect(model.changelog).not.toBeNull();
    for (const b of model.inFlight.branches) expect(b.tip).toMatch(/^[0-9a-f]{7,40}$/);
    expect(new Set(model.inFlight.branches.map((b) => b.name)).size).toBe(model.inFlight.branches.length);
  });
});

describe('2. the parts', () => {
  it('reads the deploy log: the header is skipped and the line numbers are the file\'s', () => {
    const rows = parseDeployLog(HEAD + line('2026-10-01T12:00:00.000Z', 'aaaaaaa', 'AAA') + '\n' + line('2026-10-02T12:00:00.000Z', 'bbbbbbb', 'BBB', 'failed'));
    expect(rows.map((r) => [r.line, r.sha, r.bundle, r.status])).toEqual([[2, 'aaaaaaa', 'AAA', 'ok'], [4, 'bbbbbbb', 'BBB', 'failed']]);
    expect(parseDeployLog('')).toEqual([]);
  });

  it('writes a moment in US Eastern as the project does', () => {
    expect(eastern('2026-10-17T23:46:00.524Z')).toBe('2026-10-17 19:46 EDT');
    expect(eastern('2026-12-01T12:00:00Z')).toBe('2026-12-01 07:00 EST');
  });

  it('finds the changelog entry that names the sha, and none for a sha it does not name', () => {
    const text = '## 2026-10-02 · Release 9 (r9): x\n\nAddress: https://e (main bbbbbbb, bundle B)\n\n## 2026-10-01 · Release 8\n\nAddress: none yet (branch r8)\n';
    expect(changelogEntry(text, 'bbbbbbb')).toBe('2026-10-02 · Release 9 (r9): x');
    expect(changelogEntry(text, 'aaaaaaa')).toBeNull();
  });

  it('prefers a pending marker over a cleared one and reports a missing marker', () => {
    const root = base();
    expect(loadMarker(root, 'bbbbbbb').state).toBe('pending');
    expect(loadMarker(root, 'aaaaaaa').state).toBe('cleared');
    expect(loadMarker(root, 'zzzzzzz').state).toBe('missing');
  });
});

describe('3. the page changes when the repository does', () => {
  it('names the newest deploy, its open obligations (the deep one with its carried builds) and the branches', () => {
    const text = renderLive(buildLive(base()));
    expect(text).toContain('| Commit | `bbbbbbb` (Release 9 (r9)) |');
    expect(text).toContain('| `bbbbbbb` | live | verify the live URL |');
    expect(text).toContain('| `bbbbbbb` | deep (carries 2 earlier builds) | deep review |');
    expect(text).toContain('| `next` | `ccccccc` | both | the next thing |');
    expect(text).toContain('| 2026-10-02T12:00:00.000Z | `bbbbbbb` | `BBB` | 3 |');
  });

  it('goes stale at once when a deploy line is added, and a regenerate makes it current again', () => {
    const root = base();
    writeFileSync(join(root, 'docs', 'LIVE.md'), renderLive(buildLive(root)));
    expect(checkLive(root)).toEqual([]);
    writeFileSync(join(root, 'docs', 'deploys.log'), readFileSync(join(root, 'docs', 'deploys.log'), 'utf8') + line('2026-10-03T12:00:00.000Z', 'ddddddd', 'DDD'));
    writeFileSync(join(root, 'critic', 'pending', 'ddddddd.json'), JSON.stringify(marker('ddddddd')));
    const problems = checkLive(root);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('stale');
    expect(problems[0]).toContain('ddddddd');
    writeFileSync(join(root, 'docs', 'LIVE.md'), renderLive(buildLive(root)));
    expect(checkLive(root)).toEqual([]);
  });

  it('goes stale when a marker settles an obligation or a report is added', () => {
    const root = base();
    const regenerate = () => writeFileSync(join(root, 'docs', 'LIVE.md'), renderLive(buildLive(root)));
    regenerate();
    writeFileSync(join(root, 'critic', 'pending', 'bbbbbbb.json'), JSON.stringify(marker('bbbbbbb', [{ kind: 'live', status: 'done', requires: 'verify the live URL' }])));
    expect(checkLive(root)[0]).toContain('stale');
    regenerate();
    expect(checkLive(root)).toEqual([]);
    mkdirSync(join(root, 'critic', 'reviews'), { recursive: true });
    writeFileSync(join(root, 'critic', 'reviews', 'bbbbbbb-live.json'), JSON.stringify({ verdicts: { deployment: 'PASS' } }));
    expect(checkLive(root)[0]).toContain('stale');
    regenerate();
    expect(readFileSync(join(root, 'docs', 'LIVE.md'), 'utf8')).toContain('deployment PASS');
  });

  it('is missing, not silently fine, without docs/LIVE.md, and says why a broken log cannot be built', () => {
    expect(checkLive(base())[0]).toContain('missing');
    const noDeploy = fixture({ 'docs/deploys.log': HEAD });
    expect(checkLive(noDeploy)[0]).toContain('no deploy with status=ok');
  });

  it('discloses the majors of the focused report, with whether this build introduced them, and says so when there are none', () => {
    const report = (issues: object[]) => ({ 'critic/reviews/bbbbbbb-focused.json': { verdicts: { ship: 'SHIP', changedArea: 'PASS' }, issues } });
    const withMajor = renderLive(buildLive(base(report([
      { id: 'F-1', severity: 'major', title: 'jerks | one frame', introducedByCandidate: false, regressionVsLive: false },
      { id: 'F-2', severity: 'polish', title: 'a caption', introducedByCandidate: true, regressionVsLive: false },
    ]))));
    expect(withMajor).toContain('| F-1 | major | no | no | jerks \\| one frame |');
    expect(withMajor).not.toContain('F-2');
    expect(withMajor).toContain('ship SHIP, changed area PASS');
    expect(renderLive(buildLive(base(report([]))))).toContain('lists no major or critical issue');
    expect(renderLive(buildLive(base()))).toContain('No focused report was found');
  });

  it('keeps the live build as the last status=ok line when a later deploy failed, and says so', () => {
    const root = base({ 'docs/deploys.log': HEAD + line('2026-10-01T12:00:00.000Z', 'aaaaaaa', 'AAA') + line('2026-10-02T12:00:00.000Z', 'bbbbbbb', 'BBB') + line('2026-10-03T12:00:00.000Z', 'ddddddd', 'DDD', 'failed') });
    const text = renderLive(buildLive(root));
    expect(text).toContain('| Commit | `bbbbbbb`');
    expect(text).toContain('ddddddd: failed');
  });
});
