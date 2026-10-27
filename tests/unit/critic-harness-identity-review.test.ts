/**
 * POST-CONFERENCE MOTION PLAN, STEP 0, review follow-up (the driver, under Bailey's 2026-10-25 delegation; both games, critic plumbing): what the adversarial review of branch
 * `post-tool-pin` found (D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-tool-pin/review/REVIEW.md, F2 to F10) and the fixes for it. The first test file for the identity is
 * critic-harness-identity.test.ts; this one is the second pass: the id leaves out notes, the stamp is bound to its numbers, a PASS with no aggregate is refused, a malformed stamp
 * refuses instead of throwing, the deploy gate says why, the embed tool, and the aggregate path run for real on a fixture chapter (no browser).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { main as continuityId } from '../../tools/continuity-id.mjs';
import { applyStoredReports } from '../../tools/critic-clear.mjs';
import { aggregateDigest, describeIdentity, fileSha256, harnessIdentity, harnessIdentityErrors, measuredBlock, summaryStamp, verifyStamp } from '../../tools/critic-harness-identity.mjs';
import { loadPolicy, validateReport } from '../../tools/critic-policy.mjs';
import { describeSkipped, shipEvidenceFor } from '../../tools/critic-ship-evidence.mjs';
import { resolveReleaseGate } from '../../tools/deploy-pages.mjs';

const ROOT = resolve(__dirname, '..', '..');
const policy = loadPolicy(ROOT);
const NO_GIT = (() => { throw new Error('no git'); }) as never;
const tmp = mkdtempSync(join(tmpdir(), 'harness-id-review-'));
afterAll(() => { rmSync(tmp, { recursive: true, force: true }); });
const write = (root: string, rel: string, text: string): void => { mkdirSync(join(root, rel, '..'), { recursive: true }); writeFileSync(join(root, rel), text); };

function fakeTree(name: string, continuity: object = { size: { headTolerancePct: 3 } }): string {
  const root = join(tmp, name);
  write(root, 'critic/runner/lib/continuity.mjs', "import './helper.mjs';\n");
  write(root, 'critic/runner/lib/route.mjs', "import './helper.mjs';\n");
  write(root, 'critic/runner/lib/helper.mjs', 'export const helper = 1;\n');
  write(root, 'critic/policy.json', JSON.stringify({ continuity }, null, 1));
  return root;
}
const idOf = (continuity: object): string => harnessIdentity(fakeTree(`t${Math.random().toString(36).slice(2)}`, continuity), { run: NO_GIT }).id;
const dig = <T extends object>(h: T, agg: object = { checks: {} }) => ({ ...h, aggregateSha256: aggregateDigest(agg) });

describe('F2: the id is made of what the harness measures with, not of what the policy says about it', () => {
  const base = { size: { headTolerancePct: 3, note: 'n' }, motion: { jerkMinPx: 24 }, note: 'a', requiredFrom: '2026-10-05', requiredFromNote: 'r', checks: ['CHK-026'], caps: { sizeFails: { max: 7, note: 'c' } }, harnessIdentity: { requiredFrom: '2026-10-27' } };
  it('rewording a note, moving a start date, changing a cap or the gate does not move it', () => {
    const id = idOf(base);
    expect(idOf({ ...base, note: 'reworded', requiredFromNote: 'again' })).toBe(id);
    expect(idOf({ ...base, size: { headTolerancePct: 3, note: 'also reworded' } })).toBe(id);
    expect(idOf({ ...base, requiredFrom: '2027-01-01', checks: ['CHK-026', 'CHK-027'] })).toBe(id);
    expect(idOf({ ...base, caps: { sizeFails: { max: 6, note: 'c' } } })).toBe(id);
    expect(idOf({ ...base, harnessIdentity: { requiredFrom: '2030-01-01', note: 'x' } })).toBe(id);
  });
  it('a threshold the harness reads still does', () => {
    const id = idOf(base);
    expect(idOf({ ...base, size: { headTolerancePct: 4, note: 'n' } })).not.toBe(id);
    expect(idOf({ ...base, motion: { jerkMinPx: 25 } })).not.toBe(id);
    expect(idOf({ ...base, wash: { excuse: true } })).not.toBe(id);
  });
  it('measuredBlock strips notes at every depth and only the verdict-side keys at the top', () => {
    expect(measuredBlock({ note: 'x', a: { note: 'y', b: 1, cNote: 'z' }, caps: { max: 1 }, list: [{ note: 'q', v: 1 }] })).toEqual({ a: { b: 1 }, list: [{ v: 1 }] });
    expect(measuredBlock({ size: { caps: 1, checks: 2 } })).toEqual({ size: { caps: 1, checks: 2 } }); // only the top level's verdict-side keys go
  });
  it('the real policy: the repository\'s own id is unchanged by the notes it carries', () => {
    const p = JSON.parse(readFileSync(join(ROOT, 'critic/policy.json'), 'utf8')).continuity;
    expect(JSON.stringify(measuredBlock(p))).not.toMatch(/"note"|Note"/);
    expect(Object.keys(measuredBlock(p) as object)).not.toContain('harnessIdentity');
  });
});

describe('F3: the stamp is bound to the numbers it was made beside', () => {
  const release = dig(harnessIdentity(fakeTree('f3'), { run: NO_GIT }), { checks: { 'CHK-027': { result: 'FAIL' } }, size: { a: 1 }, motion: { snaps: 0 } });
  const pol = { continuity: { harnessIdentity: { requiredFrom: '2026-10-27' } } };
  const report = (continuity: object) => ({ date: '2026-10-28T12:00:00.000Z', build: { mainSha: 'e9907cad8' }, continuity });
  const ask = (r: unknown, opts: object = { identity: release }) => harnessIdentityErrors(r, pol, opts);
  const numbers = { checks: { 'CHK-027': { result: 'FAIL' } }, size: { a: 1 }, motion: { snaps: 0 } };

  it('accepts the numbers the harness wrote, with other keys beside them', () => {
    expect(ask(report({ ...numbers, harness: release, reportLine: 'free text', extra: [1] }))).toEqual([]);
  });
  it('refuses a stamp pasted beside other numbers (the round 29 graft), and edited numbers', () => {
    const e = ask(report({ ...numbers, motion: { snaps: 7 }, harness: release }));
    expect(e).toHaveLength(1);
    expect(e[0]).toMatch(/not the numbers the harness wrote under this stamp/);
    expect(e[0]).toContain('--embed');
    expect(ask(report({ ...numbers, checks: { 'CHK-027': { result: 'PASS' } }, harness: release }))[0]).toMatch(/not the numbers/);
  });
  it('refuses a stamp with no digest at all (an older harness or a hand-built block), except for one chapter\'s own file', () => {
    const bare = harnessIdentity(fakeTree('f3b'), { run: NO_GIT });
    expect(ask(report({ ...numbers, harness: bare }), { identity: bare })[0]).toMatch(/carries no digest/);
    expect(ask(report({ ...numbers, harness: bare }), { identity: bare, chapterStamp: true })).toEqual([]);
  });
  it('the digest does not move when a parsed file and the in-memory object differ only in undefined fields', () => {
    expect(aggregateDigest({ checks: { a: 1, b: undefined }, size: { x: [1, undefined] } })).toBe(aggregateDigest(JSON.parse(JSON.stringify({ checks: { a: 1, b: undefined }, size: { x: [1, undefined] } }))));
  });
});

describe('F4: a PASS or FAIL of CHK-026 or CHK-027 with no continuity aggregate is refused', () => {
  const pol = { continuity: { harnessIdentity: { requiredFrom: '2026-10-27' } } };
  const rep = (checks: object[], date = '2026-10-28T12:00:00.000Z') => ({ date, build: { mainSha: 'e9907cad8' }, checks });
  it('refuses it from the day the rule starts, naming both checks and what to do', () => {
    const e = harnessIdentityErrors(rep([{ id: 'CHK-026', result: 'PASS' }, { id: 'CHK-027', result: 'FAIL' }]), pol, {});
    expect(e).toHaveLength(1);
    expect(e[0]).toMatch(/records CHK-026 PASS and CHK-027 FAIL but carries no continuity aggregate/);
    expect(e[0]).toContain('UNVERIFIED');
  });
  it('leaves UNVERIFIED and NOT APPLICABLE alone, other checks alone, and a report from before the rule', () => {
    expect(harnessIdentityErrors(rep([{ id: 'CHK-026', result: 'UNVERIFIED', reason: 'x' }, { id: 'CHK-027', result: 'NOT APPLICABLE', reason: 'y' }]), pol, {})).toEqual([]);
    expect(harnessIdentityErrors(rep([{ id: 'CHK-017', result: 'PASS' }]), pol, {})).toEqual([]);
    expect(harnessIdentityErrors(rep([{ id: 'CHK-026', result: 'PASS' }], '2026-10-26T23:00:00.000Z'), pol, {})).toEqual([]);
  });
  it('validateReport takes it up', () => {
    const r = { rubricVersion: policy.rubricVersion, review: 'focused', date: '2026-10-28T12:00:00.000Z', build: { mainSha: 'deadbeef00' }, verdicts: {}, checks: [{ id: 'CHK-026', result: 'PASS' }] };
    expect(validateReport(r as never, policy).filter((x) => x.startsWith('continuity harness identity'))).toHaveLength(1);
  });
});

describe('F5: a tree named with --harness-tree must match its HEAD; a chapter measured by another harness, or under CONT_CFG, is flagged', () => {
  const release = dig(harnessIdentity(fakeTree('f5'), { run: NO_GIT }));
  const pol = { continuity: { harnessIdentity: { requiredFrom: '2026-10-27' } } };
  const report = { date: '2026-10-28T12:00:00.000Z', build: { mainSha: 'e9907cad8' }, continuity: { checks: {}, harness: release } };
  it('refuses a named tree whose harness files differ from its HEAD, and says so', () => {
    const dirty = { ...release, tree: { root: 'D:/wip', head: 'abc', dirty: ['critic/runner/lib/helper.mjs'] } };
    const e = harnessIdentityErrors(report, pol, { identity: dirty as never, explicitTree: true });
    expect(e[0]).toMatch(/--harness-tree \(D:\/wip\) has harness files that differ from its HEAD \(critic\/runner\/lib\/helper\.mjs\)/);
    expect(harnessIdentityErrors(report, pol, { identity: dirty as never })).toEqual([]); // the default tree is not held to it: its dirt is in the id
    expect(harnessIdentityErrors(report, pol, { identity: release, explicitTree: true })).toEqual([]);
  });
  const stamp0 = harnessIdentity(fakeTree('f5s'), { run: NO_GIT });
  const chapter = (name: string, id: string, override = false) => ({ chapter: name, summary: {}, harness: { id, policy: { override } } });
  it('summaryStamp flags a chapter another harness measured (not "the files changed") and a chapter run under CONT_CFG', () => {
    const base = { stamp0, stampEnd: stamp0, tableStamp: null, aggregate: { checks: {} } };
    const same = summaryStamp({ ...base, results: [chapter('a', stamp0.id)] } as never);
    expect(same).toMatchObject({ changedDuringRun: false, chaptersByOtherHarness: [], chapterIds: [stamp0.id], unstamped: [] });
    expect(same.policy.override).toBe(false);
    const other = summaryStamp({ ...base, results: [chapter('a', stamp0.id), chapter('b', 'f'.repeat(64))] } as never);
    expect(other).toMatchObject({ changedDuringRun: true, chaptersByOtherHarness: ['b'] });
    const e = harnessIdentityErrors({ ...report, continuity: { checks: {}, harness: other } }, pol, {});
    expect(e[0]).toMatch(/^continuity harness identity: b was measured by another harness than the one that started the run/);
    expect(e.join('\n')).not.toMatch(/own files changed while the run was going/);
    const edited = summaryStamp({ ...base, stampEnd: { ...stamp0, id: 'e'.repeat(64) }, results: [chapter('a', stamp0.id)] } as never);
    expect(harnessIdentityErrors({ ...report, continuity: { checks: {}, harness: edited } }, pol, {})[0]).toMatch(/own files changed while the run was going/);
    const exp = summaryStamp({ ...base, results: [chapter('a', stamp0.id, true)] } as never);
    expect(exp.policy.override).toBe(true);
    expect(harnessIdentityErrors({ ...report, continuity: { checks: {}, harness: exp } }, pol, {})[0]).toMatch(/CONT_CFG/);
    expect(summaryStamp({ ...base, results: [{ chapter: 'c', summary: {} }] } as never).unstamped).toEqual(['c']);
  });
});

describe('F7: a malformed stamp is refused, never thrown', () => {
  const release = dig(harnessIdentity(fakeTree('f7'), { run: NO_GIT }));
  const pol = { continuity: { harnessIdentity: { requiredFrom: '2026-10-27' } } };
  const rep = (harness: unknown) => ({ date: '2026-10-28T12:00:00.000Z', build: { mainSha: 'e9907cad8' }, continuity: { checks: {}, harness } });
  it.each([
    ['unstamped as a string', { ...release, unstamped: 'none' }],
    ['unstamped holding a number', { ...release, unstamped: [1] }],
    ['tree as a string', { ...release, tree: 'x' }],
    ['poseTable as a string', { ...release, poseTable: 'x' }],
    ['policy as null', { ...release, policy: null }],
    ['changedDuringRun as a string', { ...release, changedDuringRun: 'no' }],
    ['chapterIds as an object', { ...release, chapterIds: {} }],
  ])('%s', (_name, bad) => {
    expect(verifyStamp(bad).length).toBeGreaterThan(0);
    const e = harnessIdentityErrors(rep(bad), pol, { identity: release });
    expect(e.length).toBeGreaterThan(0);
    expect(e[0]).toContain('continuity harness identity');
  });
  it('validateReport (the whole release gate) survives it', () => {
    const r = { rubricVersion: policy.rubricVersion, review: 'focused', date: '2026-10-28T12:00:00.000Z', build: { mainSha: 'deadbeef00' }, verdicts: {}, checks: [], continuity: { checks: {}, harness: { ...release, unstamped: 'none' } } };
    expect(() => validateReport(r as never, policy, { root: ROOT })).not.toThrow();
    expect(validateReport(r as never, policy, { root: ROOT }).some((x) => x.includes('malformed'))).toBe(true);
  });
  it('a throw inside the rule becomes a refusal', () => {
    const hostile = { ...release, get files(): never { throw new Error('boom'); } };
    expect(harnessIdentityErrors(rep(hostile), pol, {})[0]).toMatch(/could not be read \(boom\)/);
  });
});

describe('F10: what the stamp now records without making it part of the id', () => {
  it('names the waiver ledger by hash (CRLF read as LF) and rows, and the run\'s query and browser', () => {
    const f = join(tmp, 'waivers.json');
    writeFileSync(f, '{"rows":[]}\r\n');
    writeFileSync(join(tmp, 'waivers-lf.json'), '{"rows":[]}\n');
    expect(fileSha256(f)).toBe(fileSha256(join(tmp, 'waivers-lf.json')));
    expect(fileSha256(join(tmp, 'nope.json'))).toBeNull();
    const tree = fakeTree('f10');
    const plain = harnessIdentity(tree, { run: NO_GIT, env: {} });
    const rich = harnessIdentity(tree, { run: NO_GIT, env: { PYREFLY_QUERY: 'smear=off', PYREFLY_BROWSER: 'gpu' }, waivers: { path: f, sha256: fileSha256(f), rows: 12 } });
    expect(rich.id).toBe(plain.id);
    expect(rich.run).toEqual({ query: 'smear=off', setArt: null, browser: 'gpu' });
    expect(describeIdentity(rich)).toMatch(/waivers [0-9a-f]{8} \(12 rows\); PYREFLY_QUERY=smear=off\)$/);
    expect(describeIdentity(plain)).not.toContain('waivers');
  });
});

describe('F6: the deploy gate says why a report was refused', () => {
  const REL = join(tmp, 'gate');
  const rep = (extra: object = {}) => ({
    rubricVersion: policy.rubricVersion, review: 'focused', date: '2026-10-28T12:00:00.000Z', build: { mainSha: 'abc1234' },
    verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'PASS', milestone: 'not assessed', ship: 'SHIP' }, shipReasons: ['ok'], checks: [], issues: [], coverage: { requiredNotTested: [] },
    continuity: { checks: {}, size: {}, motion: {} }, ...extra,
  });
  it('shipEvidenceFor returns the refused report and its first error; resolveReleaseGate puts them in the refusal', () => {
    write(REL, 'critic/policy.json', readFileSync(join(ROOT, 'critic/policy.json'), 'utf8'));
    write(REL, 'critic/reviews/abc1234-focused.json', JSON.stringify(rep()));
    const skipped: { path: string; errors: string[] }[] = [];
    expect(shipEvidenceFor(REL, 'abc1234', skipped)).toBeNull();
    expect(skipped).toHaveLength(1);
    expect(skipped[0]!.path).toBe('critic/reviews/abc1234-focused.json');
    expect(skipped[0]!.errors[0]).toMatch(/carries no "harness" block/);
    expect(describeSkipped(skipped)).toMatch(/^critic\/reviews\/abc1234-focused\.json was refused as evidence: continuity harness identity/);
    const gate = resolveReleaseGate({ focusedBeforeDeploy: true, deepBeforeDeploy: false, evidence: null, ownerOverrideWords: null, skipped });
    expect(gate.action).toBe('fail');
    expect((gate as { message: string }).message).toMatch(/no validated focused or deep report for this commit exists under .*; critic\/reviews\/abc1234-focused\.json was refused as evidence: continuity harness identity/);
  });
  it('without refused reports the message is exactly what it was', () => {
    const gate = resolveReleaseGate({ focusedBeforeDeploy: true, deepBeforeDeploy: false, evidence: null, ownerOverrideWords: null });
    expect((gate as { message: string }).message).toMatch(/\(critic\/RUBRIC\.md section 4\)$/);
  });
  it('applyStoredReports (the deploy\'s settle step) returns the refusal so the deploy can log it', () => {
    const marker = { mainSha: 'abc1234', obligations: [{ kind: 'focused', status: 'pending' }] };
    write(REL, 'critic/pending/abc1234.json', JSON.stringify(marker));
    const results = applyStoredReports(REL, 'abc1234');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ ok: false });
    expect((results[0] as { errors: string[] }).errors[0]).toMatch(/continuity harness identity/);
  });
});

describe('F1: critic-clear --records judges with this tree\'s policy and settles another tree\'s records', () => {
  it('works with records that have no policy of their own, and prints a note', () => {
    const records = join(tmp, 'records');
    mkdirSync(join(records, 'critic'), { recursive: true });
    const f = join(tmp, 'rec-report.json');
    writeFileSync(f, JSON.stringify({ rubricVersion: policy.rubricVersion, review: 'focused', date: '2026-10-28T12:00:00.000Z', build: { mainSha: 'deadbeef00' }, verdicts: {}, checks: [], continuity: { checks: {} } }));
    const r = spawnSync(process.execPath, ['tools/critic-clear.mjs', '--report', f, '--records', records], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
    expect(r.stdout).toContain(`critic:clear NOTE: settling the records of ${records}`);
    expect(r.stdout).toContain('REFUSED'); // judged by THIS tree's policy: the aggregate has no stamp
    expect(r.stdout).toMatch(/carries no "harness" block/);
    expect(r.stderr).not.toMatch(/ENOENT/);
    const named = spawnSync(process.execPath, ['tools/critic-score.mjs', '--report', f, '--harness-tree', ROOT], { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
    expect(named.stdout).toContain('critic:score NOTE: the continuity harness is matched against');
  });
});

describe('the aggregate path, run for real on a fixture chapter (no browser): the summary carries the stamp, its digest and the right flags', () => {
  const fixture = JSON.parse(readFileSync(join(ROOT, 'tests/fixtures/continuity-chapter-min.json'), 'utf8')) as Record<string, unknown>;
  const mine = harnessIdentity(ROOT);
  const runCase = (name: string, edit: (j: Record<string, unknown>) => void): { summary: Record<string, any>; file: string } => {
    const ev = join(tmp, `agg-${name}`);
    const dir = join(ev, 'ffx2-bahamut-win-toolpin', 'continuity');
    mkdirSync(dir, { recursive: true });
    const chapter = structuredClone(fixture);
    chapter.harness = structuredClone(mine);
    edit(chapter);
    writeFileSync(join(dir, 'continuity.json'), JSON.stringify(chapter));
    const p = spawnSync(process.execPath, ['critic/runner/lib/continuity.mjs', '--base=http://127.0.0.1:1/', `--evidence=${ev}`, '--chapters=ffx2-bahamut', '--tag=toolpin', '--only-aggregate'], { cwd: ROOT, encoding: 'utf8', timeout: 120_000 });
    const file = join(ev, 'continuity-summary.json');
    expect(existsSync(file), (p.stderr || p.stdout).slice(-400)).toBe(true);
    return { summary: JSON.parse(readFileSync(file, 'utf8')), file };
  };
  const check = (file: string) => { const lines: string[] = []; return { code: continuityId(['--check', file], (l) => lines.push(l)), lines }; };

  it('stamped by this tree: same id, no flags, the digest of its own numbers, and --check accepts it', () => {
    const { summary, file } = runCase('same', () => undefined);
    expect(summary.harness.id).toBe(mine.id);
    expect(summary.harness).toMatchObject({ changedDuringRun: false, unstamped: [], chaptersByOtherHarness: [], chapterIds: [mine.id] });
    expect(summary.harness.aggregateSha256).toBe(aggregateDigest(summary));
    expect(summary.reportLine).toMatch(/Read by harness [0-9a-f]{12}/);
    const c = check(file);
    expect(c.lines.join('\n')).toContain("OK: this is the release tree's own harness.");
    expect(c.code).toBe(0);
  });
  it('a chapter with no stamp (an older harness, re-aggregated): unstamped, refused', () => {
    const { summary, file } = runCase('nostamp', (j) => { delete j.harness; });
    expect(summary.harness.unstamped).toEqual(['ffx2-bahamut']);
    const c = check(file);
    expect(c.code).toBe(1);
    expect(c.lines.join('\n')).toMatch(/ffx2-bahamut was measured by a run that left no stamp/);
  });
  it('a chapter another tree measured: said so, not "the files changed"', () => {
    const { summary, file } = runCase('other', (j) => { (j.harness as { id: string }).id = 'f'.repeat(64); });
    expect(summary.harness).toMatchObject({ changedDuringRun: true, chaptersByOtherHarness: ['ffx2-bahamut'] });
    expect(summary.reportLine).toContain('THE HARNESS CHANGED DURING THE RUN');
    const c = check(file);
    expect(c.code).toBe(1);
    expect(c.lines.join('\n')).toMatch(/ffx2-bahamut was measured by another harness than the one that started the run/);
  });
  it('a chapter run under CONT_CFG is an experiment even when this process was clean', () => {
    const { summary, file } = runCase('exp', (j) => { (j.harness as { policy: { override: boolean } }).policy.override = true; });
    expect(summary.harness.policy.override).toBe(true);
    expect(check(file).lines.join('\n')).toMatch(/CONT_CFG/);
  });
});

describe('F9: node tools/continuity-id.mjs --embed copies the summary into the report, whole, and asks the rule', () => {
  const mine = harnessIdentity(ROOT);
  const numbers = { checks: { 'CHK-026': { result: 'FAIL' }, 'CHK-027': { result: 'PASS' } }, size: { a: 1 }, motion: { snaps: 0 }, reportLine: 'x' };
  const summaryWith = (harness: unknown): string => { const f = join(tmp, `summary-${Math.random().toString(36).slice(2)}.json`); writeFileSync(f, JSON.stringify({ ...numbers, harness })); return f; };
  const reportFile = (): string => { const f = join(tmp, `report-${Math.random().toString(36).slice(2)}.json`); writeFileSync(f, JSON.stringify({ review: 'deep', note: 'kept', continuity: { checks: { typed: 'by hand' }, mine: 1 } })); return f; };
  const run = (argv: string[]) => { const lines: string[] = []; return { code: continuityId(argv, (l) => lines.push(l)), text: () => lines.join('\n') }; };

  it('puts the summary and its stamp in report.continuity verbatim (replacing what was typed, keeping what was not), and accepts this tree\'s own', () => {
    const s = summaryWith({ ...mine, chapterIds: [mine.id], aggregateSha256: aggregateDigest(numbers) });
    const r = reportFile();
    const out = run(['--embed', s, '--into', r]);
    expect(out.code).toBe(0);
    expect(out.text()).toContain("OK: the report's continuity is the summary of this tree's own harness.");
    const written = JSON.parse(readFileSync(r, 'utf8'));
    expect(written.note).toBe('kept');
    expect(written.continuity.mine).toBe(1);
    expect(written.continuity.checks).toEqual(numbers.checks);
    expect(written.continuity.harness.id).toBe(mine.id);
    expect(aggregateDigest(written.continuity)).toBe(written.continuity.harness.aggregateSha256);
  });
  it('refuses another tree\'s stamp (exit 1, the report is still written so the refusal can be read), a summary with no stamp (2) and a missing --into (64)', () => {
    const foreign = dig(harnessIdentity(fakeTree('f9'), { run: NO_GIT }), numbers);
    const r = reportFile();
    const out = run(['--embed', summaryWith({ ...foreign, chapterIds: [foreign.id] }), '--into', r]);
    expect(out.code).toBe(1);
    expect(out.text()).toMatch(/REFUSED: .*not the release tree's own/);
    expect(JSON.parse(readFileSync(r, 'utf8')).continuity.harness.id).toBe(foreign.id);
    expect(run(['--embed', summaryWith(undefined), '--into', reportFile()]).code).toBe(2);
    expect(run(['--embed', summaryWith(mine)]).code).toBe(64);
  });
});

describe('the tree the briefs name exists: the files the briefs run are in this repository', () => {
  it('continuity-id, critic-clear and critic-score are where deep.js and focused.js say', () => {
    for (const f of ['tools/continuity-id.mjs', 'tools/critic-clear.mjs', 'tools/critic-score.mjs', 'tools/critic-ship-evidence.mjs']) expect(existsSync(join(ROOT, f)), f).toBe(true);
  });
});
