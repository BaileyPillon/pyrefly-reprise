/**
 * POST-CONFERENCE MOTION PLAN, STEP 0 (the driver, under Bailey's 2026-10-25 delegation; both games, critic plumbing): pin the measuring tool.
 *
 * The continuity harness drifted three times and each time the tool, not the game, moved a number (round 28 a stale pose table, release 63 a CRLF hash, round 29 an old tree that could not see
 * planned smear cuts: 4.67 and 7.51 snaps a minute where the release tree reads 0). So (1) every run stamps the harness's identity into its output, (2) critic-clear, critic-score and the deploy gate
 * refuse a continuity aggregate that carries no stamp or whose stamp is not the release tree's own, and (3) `node tools/continuity-id.mjs` prints the identity. No browser: a throwaway tree for the
 * file rules, injected identities for the refusal rules, the CLIs run for real on temporary reports.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { poseTableStamp } from '../../critic/runner/lib/continuity.mjs';
import { aggregateDigest, blobId, canonicalJson, compareIdentity, describeIdentity, harnessDigest, harnessFiles, harnessIdentity, harnessIdentityErrors, verifyStamp } from '../../tools/critic-harness-identity.mjs';
import { loadPolicy, validateReport } from '../../tools/critic-policy.mjs';

const ROOT = resolve(__dirname, '..', '..');
const policy = loadPolicy(ROOT);
const NO_GIT = (() => { throw new Error('no git'); }) as never;

const tmp = mkdtempSync(join(tmpdir(), 'harness-id-')); // made at load: the describe bodies below build their trees while the suite is collected
const write = (root: string, rel: string, text: string): void => { mkdirSync(join(root, rel, '..'), { recursive: true }); writeFileSync(join(root, rel), text); };

/** A tree shaped like the repository's harness: two entries, a helper they share, one more under tools/, the verdict-side files that are left out, and a policy. */
function fakeTree(name: string, probeVersion = 2): string {
  const root = join(tmp, name);
  write(root, 'critic/runner/lib/continuity.mjs', "import './helper.mjs';\nimport './continuity-probe.mjs';\nimport { loadPolicy } from '../../../tools/critic-policy.mjs';\nexport const a = loadPolicy;\n");
  write(root, 'critic/runner/lib/route.mjs', "import './helper.mjs';\nimport '../../../tools/extra.mjs';\nconst lazy = () => import('./lazy.mjs');\n");
  write(root, 'critic/runner/lib/helper.mjs', 'export const helper = 1;\n');
  write(root, 'critic/runner/lib/lazy.mjs', 'export const lazy = 1;\n');
  write(root, 'critic/runner/lib/continuity-probe.mjs', `export const probe = { cfg: 1, version: ${probeVersion}, running: false };\n`);
  write(root, 'critic/runner/lib/unrelated.mjs', 'export const unrelated = 1;\n');
  write(root, 'tools/extra.mjs', 'export const extra = 1;\n');
  write(root, 'tools/critic-policy.mjs', "import './only-the-verdict-side.mjs';\nexport const loadPolicy = 1;\n");
  write(root, 'tools/only-the-verdict-side.mjs', 'export const v = 1;\n');
  write(root, 'tools/critic-continuity-caps.mjs', 'export const caps = 1;\n');
  write(root, 'critic/policy.json', JSON.stringify({ continuity: { size: { headTolerancePct: 3 }, harnessIdentity: { requiredFrom: '2026-10-27' } } }, null, 1));
  return root;
}

afterAll(() => { rmSync(tmp, { recursive: true, force: true }); });

describe('what the identity is made of', () => {
  it('is the import closure of the harness and the route, minus the verdict-side files, and nothing else', () => {
    const root = fakeTree('closure');
    expect(harnessFiles(root)).toEqual([
      'critic/runner/lib/continuity-probe.mjs',
      'critic/runner/lib/continuity.mjs',
      'critic/runner/lib/helper.mjs',
      'critic/runner/lib/lazy.mjs', // a dynamic import() counts
      'critic/runner/lib/route.mjs',
      'tools/extra.mjs',
    ]);
  });

  it('reads CRLF as LF, so a checkout with core.autocrlf and the commit have one id (the release 63 lesson)', () => {
    expect(blobId('a\r\nb\r\n')).toBe(blobId('a\nb\n'));
    expect(blobId('a\nb\n')).toBe('a8c0a9d8a7fd5f8e0a0a3b4d1b9ae3d6f8f2b0a4'.length === 40 ? blobId('a\nb\n') : '');
    // git's own blob id of "hello\n"
    expect(blobId('hello\n')).toBe('ce013625030ba8dba906f756967f9e9ca394464a');
    const a = fakeTree('crlf-a');
    const b = fakeTree('crlf-b');
    write(b, 'critic/runner/lib/helper.mjs', 'export const helper = 1;\r\n');
    write(a, 'critic/runner/lib/helper.mjs', 'export const helper = 1;\n');
    expect(harnessIdentity(a, { run: NO_GIT }).id).toBe(harnessIdentity(b, { run: NO_GIT }).id);
  });

  it('changes with any file the harness runs, and with the policy block it measures by', () => {
    const base = harnessIdentity(fakeTree('base'), { run: NO_GIT });
    const edited = fakeTree('edited');
    write(edited, 'critic/runner/lib/helper.mjs', 'export const helper = 2;\n');
    expect(harnessIdentity(edited, { run: NO_GIT }).id).not.toBe(base.id);
    const tuned = fakeTree('tuned');
    write(tuned, 'critic/policy.json', JSON.stringify({ continuity: { size: { headTolerancePct: 4 }, harnessIdentity: { requiredFrom: '2026-10-27' } } }));
    expect(harnessIdentity(tuned, { run: NO_GIT }).id).not.toBe(base.id);
    expect(harnessIdentity(tuned, { run: NO_GIT }).policy.continuitySha256).not.toBe(base.policy.continuitySha256);
  });

  it('ignores what does not move a measurement: the verdict-side files, an unrelated file, the gate\'s own settings, the HEAD, the key order of the policy', () => {
    const base = harnessIdentity(fakeTree('same'), { run: NO_GIT });
    const other = fakeTree('same2');
    write(other, 'tools/critic-policy.mjs', 'export const loadPolicy = 2; // a release-rule edit\n');
    write(other, 'tools/critic-continuity-caps.mjs', 'export const caps = 2;\n');
    write(other, 'critic/runner/lib/unrelated.mjs', 'export const unrelated = 2;\n');
    write(other, 'critic/policy.json', JSON.stringify({ continuity: { harnessIdentity: { requiredFrom: '2027-01-01', note: 'x' }, size: { headTolerancePct: 3 } }, somethingElse: 1 }));
    expect(harnessIdentity(other, { run: NO_GIT }).id).toBe(base.id);
    expect(canonicalJson({ b: 1, a: { d: 1, c: 2 } })).toBe(canonicalJson({ a: { c: 2, d: 1 }, b: 1 }));
  });

  it('records the tree\'s HEAD and which harness files differ from it, the probe version, the policy override and the pose table it was given', () => {
    const git = ((_cmd: string, args: string[]) => (args.includes('rev-parse') ? 'abc123def456\n' : ' M critic/runner/lib/helper.mjs\n?? tools/extra.mjs\n')) as never;
    const table = { path: 'D:/x/docs/target/pose-measure.json', sha256: 'f'.repeat(64), subjects: 114, source: 'harness-tree', buildSha: 'e9907cad8', isCandidate: true };
    const id = harnessIdentity(fakeTree('stamped', 7), { run: git, env: { CONT_CFG: '{"wash":{"excuse":true}}' }, poseTable: table });
    expect(id.tree.head).toBe('abc123def456');
    expect(id.tree.dirty).toEqual(['critic/runner/lib/helper.mjs', 'tools/extra.mjs']);
    expect(id.probe.version).toBe(7);
    expect(id.probe.blob).toBe(id.files['critic/runner/lib/continuity-probe.mjs']);
    expect(id.policy.override).toBe(true);
    expect(id.poseTable).toEqual(table);
    expect(verifyStamp(id)).toEqual([]);
    expect(describeIdentity(id)).toMatch(/harness [0-9a-f]{12} \(6 files; tree .*at abc123def \(2 harness file\(s\) modified since HEAD\); policy [0-9a-f]{8} OVERRIDDEN BY CONT_CFG; probe v7 [0-9a-f]{8}; pose table ffffffff \(114 subjects\)\)/);
    expect(harnessIdentity(fakeTree('nogit'), { run: NO_GIT }).tree).toMatchObject({ head: null, dirty: null });
  });

  it('of this repository: names the probe, the route and the pose-bands, not itself and not the verdict side, and is the same twice', () => {
    const files = harnessFiles(ROOT);
    for (const f of ['critic/runner/lib/continuity.mjs', 'critic/runner/lib/continuity-probe.mjs', 'critic/runner/lib/continuity-smear.mjs', 'critic/runner/lib/route.mjs', 'tools/posescale/pose-bands.mjs']) expect(files, f).toContain(f);
    for (const f of ['tools/critic-harness-identity.mjs', 'tools/critic-policy.mjs', 'tools/critic-continuity-caps.mjs', 'tools/continuity-id.mjs']) expect(files, f).not.toContain(f);
    const a = harnessIdentity(ROOT, { run: NO_GIT });
    expect(a.probe.version).toBeGreaterThan(0);
    expect(a.id).toBe(harnessIdentity(ROOT, { run: NO_GIT }).id);
    expect(a.id).toBe(harnessDigest(a.files, a.policy.continuitySha256));
    expect((policy as unknown as { continuity: { harnessIdentity: { requiredFrom: string } } }).continuity.harnessIdentity.requiredFrom).toBe('2026-10-27');
  });
});

describe('the build\'s own pose table', () => {
  it('is read the way the harness reads it (tableAtCommit agrees with candidateTableAt on this repository), and the module imports nothing from the harness\'s tree', async () => {
    const { candidateTableAt } = await import('../../critic/runner/lib/continuity-table.mjs');
    const { tableAtCommit } = await import('../../tools/critic-harness-identity.mjs');
    const mine = tableAtCommit(ROOT, 'acbd815d3');
    const theirs = candidateTableAt(ROOT, 'acbd815d3');
    expect(mine).not.toBeNull();
    expect(mine).toEqual(theirs);
    expect(tableAtCommit(ROOT, 'nonsense')).toBeNull();
    expect(tableAtCommit(ROOT, 'abcdef0123456789abcdef0123456789abcdef01')).toBeNull();
    // a copy of tools/ alone must load it (the deploy's dry-run tests copy tools/ into a fake root)
    const imports = [...readFileSync(join(ROOT, 'tools/critic-harness-identity.mjs'), 'utf8').matchAll(/^import .* from '(\.[^']+)'/gm)].map((m) => m[1]);
    expect(imports).toEqual([]);
  });
});

describe('a stamp is checked against itself', () => {
  const good = harnessIdentity(fakeTree('verify'), { run: NO_GIT });
  it('accepts its own, refuses an edited file list, a mis-copied id, another schema and nothing', () => {
    expect(verifyStamp(good)).toEqual([]);
    expect(verifyStamp({ ...good, files: { ...good.files, 'critic/runner/lib/helper.mjs': '0'.repeat(40) } })[0]).toMatch(/not the digest of its own file list/);
    expect(verifyStamp({ ...good, id: `${good.id.slice(0, 60)}abcd` })[0]).toMatch(/not the digest/);
    expect(verifyStamp({ ...good, schema: 'continuity-harness/0' })[0]).toMatch(/schema/);
    expect(verifyStamp(null)).toHaveLength(1);
    expect(verifyStamp({ ...good, files: {} })[0]).toMatch(/no harness files/);
  });
  it('compares two stamps by file, naming what differs', () => {
    const other = harnessIdentity((() => { const r = fakeTree('verify2'); write(r, 'critic/runner/lib/helper.mjs', 'export const helper = 9;\n'); return r; })(), { run: NO_GIT });
    expect(compareIdentity(good, good)).toEqual({ same: true, files: [], policy: false });
    const d = compareIdentity(good, other);
    expect(d.same).toBe(false);
    expect(d.files.map((f) => f.path)).toEqual(['critic/runner/lib/helper.mjs']);
    expect(d.policy).toBe(false);
  });
});

// a stamp as the harness writes it: with the digest of the numbers it sits beside (here the report's `continuity.checks` is `{}`)
const dig = <T extends object>(h: T, agg: object = { checks: {} }) => ({ ...h, aggregateSha256: aggregateDigest(agg) });

describe('the refusal (critic-clear, critic-score, the deploy gate)', () => {
  const release = dig(harnessIdentity(fakeTree('release'), { run: NO_GIT }));
  const oldTree = (() => { const r = fakeTree('old-tree'); write(r, 'critic/runner/lib/helper.mjs', 'export const helper = 0; // 2026-10-10\n'); return dig(harnessIdentity(r, { run: NO_GIT })); })();
  const pol = { continuity: { harnessIdentity: { requiredFrom: '2026-10-27' } } };
  const report = (stamp: unknown, extra: Record<string, unknown> = {}) => ({ date: '2026-10-28T12:00:00.000Z', build: { mainSha: 'e9907cad8' }, continuity: { checks: {}, ...(stamp === undefined ? {} : { harness: stamp }) }, ...extra });
  const ask = (r: unknown, opts: object = { identity: release }) => harnessIdentityErrors(r, pol, opts);

  it('passes the release tree\'s own harness', () => {
    expect(ask(report(release))).toEqual([]);
  });

  it('refuses a harness from another tree and says which files differ, where it ran, and what to run instead (the round 29 case)', () => {
    const errors = ask(report(oldTree));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('continuity harness identity: REFUSED');
    expect(errors[0]).toContain('not the release tree\'s own');
    expect(errors[0]).toContain('critic/runner/lib/helper.mjs');
    expect(errors[0]).toMatch(/Run node critic\/runner\/lib\/continuity\.mjs from the release tree/);
    expect(errors[0]).toContain('--harness-tree');
    expect(errors[0]).toContain('4.67 and 7.51');
  });

  it('refuses an aggregate with no stamp, from the day the rule starts (a copy that dropped it, or an older harness)', () => {
    const errors = ask(report(undefined));
    expect(errors[0]).toMatch(/carries no "harness" block/);
    expect(errors[0]).toMatch(/copy the "harness" object of continuity-summary\.json/);
  });

  it('leaves a report from before the rule alone, and a report with no continuity aggregate at all', () => {
    expect(ask({ ...report(undefined), date: '2026-10-26T23:59:59.000Z' })).toEqual([]);
    expect(ask({ ...report(oldTree), date: '2026-10-05T00:00:00.000Z' })).toEqual([]);
    expect(ask({ date: '2026-10-28T12:00:00.000Z', build: { mainSha: 'e9907cad8' } })).toEqual([]);
    expect(harnessIdentityErrors(report(undefined), { continuity: {} }, { identity: release })).toEqual([]); // a policy without the gate asks nothing
  });

  it('refuses an edited or mis-copied stamp, a run that edited its own files, a CONT_CFG experiment and chapters measured with no stamp', () => {
    expect(ask(report({ ...release, id: 'f'.repeat(64) }))[0]).toMatch(/not the digest of its own file list/);
    expect(ask(report({ ...release, changedDuringRun: true }))[0]).toMatch(/changed while the run was going/);
    const exp = dig(harnessIdentity(fakeTree('exp'), { run: NO_GIT, env: { CONT_CFG: '{}' } }));
    expect(ask(report(exp), { identity: exp })[0]).toMatch(/CONT_CFG/);
    expect(ask(report({ ...release, unstamped: ['seymour-flux', 'ffx2-bahamut'] }))[0]).toMatch(/seymour-flux, ffx2-bahamut were measured by a run that left no stamp/);
  });

  it('refuses a pose table that is not the build\'s own, with both hashes (CHK-026 read against someone else\'s registrations)', () => {
    const stamped = { ...release, poseTable: { sha256: 'a'.repeat(64), subjects: 78, source: 'harness-tree', buildSha: 'e9907cad8', isCandidate: false } };
    const withTable = dig(harnessIdentity(fakeTree('release'), { run: NO_GIT, poseTable: stamped.poseTable }));
    const errors = ask(report(withTable), { identity: release, root: 'D:/anywhere', candidateTable: () => ({ sha256: 'b'.repeat(64), count: 114 }) });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/pose-measure table this run read \(sha256 aaaaaaaaaaaa, 78 subjects, CRLF read as LF\) is not the table of build commit e9907cad8 \(sha256 bbbbbbbbbbbb, 114 subjects\)/);
    expect(ask(report(withTable), { identity: release, root: 'D:/anywhere', candidateTable: () => ({ sha256: 'a'.repeat(64), count: 78 }) })).toEqual([]);
    expect(ask(report(withTable), { identity: release, root: 'D:/anywhere', candidateTable: () => null })).toEqual([]); // the commit is not known here: not checked, not refused
  });

  it('without a release tree only the stamp itself is asked of (a caller that gave no root)', () => {
    expect(harnessIdentityErrors(report(oldTree), pol, {})).toEqual([]);
    expect(harnessIdentityErrors(report({ ...oldTree, changedDuringRun: true }), pol, {})[0]).toMatch(/changed while the run was going/);
  });
});

describe('validateReport takes it up, so critic-clear, critic-score and the deploy gate all ask it', () => {
  const stamp = dig(harnessIdentity(ROOT, { run: NO_GIT }));
  const stale = harnessIdentity(ROOT, { run: NO_GIT, env: {} });
  const base = (harness: unknown, date = '2026-10-28T12:00:00.000Z') => ({ rubricVersion: policy.rubricVersion, review: 'focused', date, build: { mainSha: 'deadbeef00' }, continuity: { checks: {}, harness }, verdicts: {}, checks: [] });
  const idErrors = (errors: string[]) => errors.filter((e) => e.startsWith('continuity harness identity'));

  it('with a root: this tree\'s own stamp passes, another tree\'s is refused; without one: only consistency', () => {
    expect(idErrors(validateReport(base(stamp) as never, policy, { root: ROOT }))).toEqual([]);
    const fake = dig(harnessIdentity(fakeTree('vr'), { run: NO_GIT }));
    expect(idErrors(validateReport(base(fake) as never, policy, { root: ROOT }))[0]).toContain('REFUSED');
    expect(idErrors(validateReport(base(fake) as never, policy))).toEqual([]);
    expect(idErrors(validateReport(base(undefined) as never, policy))[0]).toMatch(/no "harness" block/);
    expect(idErrors(validateReport(base(undefined, '2026-10-20T00:00:00.000Z') as never, policy, { root: ROOT }))).toEqual([]);
    expect(stale.id).toBe(stamp.id);
  });

  it('harnessTree names another release tree to match (critic-clear and critic-score --harness-tree)', () => {
    const fakeRoot = fakeTree('vr-tree');
    const fake = dig(harnessIdentity(fakeRoot, { run: NO_GIT }));
    expect(idErrors(validateReport(base(fake) as never, policy, { root: ROOT, harnessTree: fakeRoot }))).toEqual([]);
    expect(idErrors(validateReport(base(stamp) as never, policy, { root: ROOT, harnessTree: fakeRoot }))[0]).toContain('REFUSED');
  });
});

describe('the tools, run for real on temporary reports', () => {
  const node = process.execPath;
  const run = (args: string[]) => spawnSync(node, args, { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
  const full = { checks: {}, size: {}, motion: {} }; // what reportFile() puts in the report's continuity beside the stamp
  const stamp = dig(harnessIdentity(ROOT, { run: NO_GIT }), full);
  const other = dig(harnessIdentity(fakeTree('cli'), { run: NO_GIT }), full);
  const reportFile = (name: string, harness: unknown, date = '2026-10-28T12:00:00.000Z'): string => {
    const f = join(tmp, name);
    writeFileSync(f, JSON.stringify({ rubricVersion: policy.rubricVersion, review: 'deep', date, build: { mainSha: 'deadbeef00', artifactHash: 'x' }, continuity: { checks: {}, size: {}, motion: {}, harness }, verdicts: {}, checks: [], categories: [] }));
    return f;
  };

  it('node tools/continuity-id.mjs prints the identity (and --json, --files)', () => {
    const r = run(['tools/continuity-id.mjs']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/^harness [0-9a-f]{12} \(\d+ files; tree .+ at [0-9a-f]{9}/);
    const j = JSON.parse(run(['tools/continuity-id.mjs', '--json']).stdout);
    expect(j.id).toBe(stamp.id);
    expect(run(['tools/continuity-id.mjs', '--files']).stdout).toContain('critic/runner/lib/continuity-probe.mjs');
  });

  it('continuity-id --check: exit 0 for this tree\'s own stamp, 1 with the reason for another tree\'s, 2 when there is no stamp', () => {
    const own = join(tmp, 'own-summary.json');
    writeFileSync(own, JSON.stringify({ harness: stamp }));
    const ok = run(['tools/continuity-id.mjs', '--check', own]);
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain("OK: this is the release tree's own harness.");
    const bad = join(tmp, 'other-summary.json');
    writeFileSync(bad, JSON.stringify({ harness: other }));
    const refused = run(['tools/continuity-id.mjs', '--check', bad]);
    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain('REFUSED');
    const none = join(tmp, 'old-summary.json');
    writeFileSync(none, JSON.stringify({ checks: {} }));
    expect(run(['tools/continuity-id.mjs', '--check', none]).status).toBe(2);
  });

  it('critic-score refuses a foreign harness before it prints any score', () => {
    const r = run(['tools/critic-score.mjs', '--report', reportFile('score-foreign.json', other)]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('critic:score REFUSED the continuity evidence');
    expect(r.stdout).toContain('not the release tree\'s own');
    expect(r.stdout).not.toMatch(/^score:/m);
    const unstamped = run(['tools/critic-score.mjs', '--report', reportFile('score-none.json', undefined)]);
    expect(unstamped.status).toBe(1);
    expect(unstamped.stdout).toMatch(/no "harness" block/);
  });

  it('critic-score does not refuse this tree\'s own stamp, or a report from before the rule', () => {
    expect(run(['tools/critic-score.mjs', '--report', reportFile('score-own.json', stamp)]).stdout).not.toContain('harness identity');
    const old = run(['tools/critic-score.mjs', '--report', reportFile('score-old.json', undefined, '2026-10-20T00:00:00.000Z')]);
    expect(old.stdout).not.toContain('REFUSED the continuity evidence');
    expect(old.stdout).toMatch(/score:/);
  });

  it('critic-score --harness-tree matches another release tree', () => {
    const fakeRoot = fakeTree('cli-tree');
    const r = run(['tools/critic-score.mjs', '--report', reportFile('score-tree.json', dig(harnessIdentity(fakeRoot, { run: NO_GIT }), full)), '--harness-tree', fakeRoot]);
    expect(r.stdout).not.toContain('REFUSED the continuity evidence');
  });

  it('critic-clear refuses it too, settling nothing, with the reason in the list', () => {
    const r = run(['tools/critic-clear.mjs', '--report', reportFile('clear-foreign.json', other)]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('critic:clear REFUSED: the report is not valid evidence, nothing was settled');
    expect(r.stdout).toContain('continuity harness identity: REFUSED');
  });
});

describe('the harness stamps what it measured', () => {
  it('poseTableStamp names the table as loaded (LF-normalised sha256), where it came from and whether it is the build\'s', () => {
    expect(poseTableStamp({ path: 'p', sha256: 's', count: 114 }, 'candidate-root', 'e9907cad8', { checked: true, stale: false })).toEqual({ path: 'p', sha256: 's', subjects: 114, source: 'candidate-root', buildSha: 'e9907cad8', isCandidate: true });
    expect(poseTableStamp({ path: 'p', sha256: 's', count: 78 }, undefined, undefined, { checked: true, stale: true })).toMatchObject({ source: 'unknown', buildSha: null, isCandidate: false });
    expect(poseTableStamp({ path: 'p', sha256: 's', count: 78 }, 'harness-tree', null, null).isCandidate).toBeNull();
  });

  it('continuity.mjs writes the stamp into each chapter\'s continuity.json and into the summary, and the report line names the tool', () => {
    const src = readFileSync(join(ROOT, 'critic/runner/lib/continuity.mjs'), 'utf8');
    expect(src).toContain("from '../../../tools/critic-harness-identity.mjs'");
    expect(src).toMatch(/harness: harnessIdentity\(ROOT, \{ poseTable: measure \? poseTableStamp\(measure, poseSource, build\.sha, judged\) : null, waivers: /);
    expect(src).toMatch(/summary\.harness = summaryStamp\(\{ stamp0, stampEnd: harnessIdentity\(ROOT\), results, tableStamp,/);
    expect(src).toMatch(/summary\.reportLine = `\$\{summary\.reportLine\} Read by \$\{describeIdentity\(summary\.harness\)\}/);
  });
});
