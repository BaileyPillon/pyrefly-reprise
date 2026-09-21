/**
 * Owner override of the deploy gate (critic/RUBRIC.md section 10, adopted
 * 2026-09-21, after the owner found "too many build deployment blockers").
 * `tools/deploy-pages.mjs` refuses to deploy a shared-system change with no
 * validated deep report whose changed area passed. This override is an
 * explicit, off-by-default escape hatch: only the owner's own words (passed
 * as `--owner-override`) turn that refusal into a loud warning, and nothing
 * else is relaxed — no obligation is ever settled by it.
 *
 * These tests exercise the pure functions the deploy script and the status
 * reader were given, never a real deploy: no network, no git push, no build.
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { clearWithReport } from '../../tools/critic-clear.mjs';
import { buildPendingMarker, markerObligations } from '../../tools/critic-pending.mjs';
import { loadPolicy, ownerOverridePolicy, planReview } from '../../tools/critic-policy.mjs';
import { formatOwnerOverrideLine, readOwnerOverride } from '../../tools/critic-status.mjs';
import {
  formatDeployLogLine,
  formatOwnerOverrideWarning,
  latestDeepReportFor,
  parseOwnerOverride,
  resolveReleaseGate,
} from '../../tools/deploy-pages.mjs';

const REPO = resolve(__dirname, '..', '..');
const policy = loadPolicy(REPO);
// A real shared-system path, so the plan is a genuine ReviewPlan (deep,
// deepBeforeDeploy, live+focused+deep owed) rather than a hand-typed stand-in.
const deepPlan = planReview({ paths: ['src/battle/common/status.ts'], policy });

describe('critic/policy.json exposes the owner-override block', () => {
  it('is allowed, requires the owner\'s words, and never settles an obligation', () => {
    expect(ownerOverridePolicy(policy)).toEqual({ allowed: true, requiresOwnerWords: true, settlesObligations: false });
  });

  it('defaults closed if the block is ever missing', () => {
    expect(ownerOverridePolicy({} as any)).toMatchObject({ allowed: false, settlesObligations: false });
  });
});

describe('parseOwnerOverride: only the owner\'s own words unlock it', () => {
  it('an absent flag means no override was requested', () => {
    expect(parseOwnerOverride(undefined)).toEqual({ ok: true, words: null });
  });

  it('a bare flag (no value) is refused', () => {
    const r = parseOwnerOverride(true);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/owner-override/);
  });

  it('an empty or whitespace-only value is refused', () => {
    expect(parseOwnerOverride('').ok).toBe(false);
    expect(parseOwnerOverride('   ').ok).toBe(false);
  });

  it('fewer than 8 characters is refused', () => {
    const r = parseOwnerOverride('ship it');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/8/);
  });

  it('8 or more characters of the owner\'s own words is accepted, trimmed', () => {
    expect(parseOwnerOverride('  Bailey: push the build please  ')).toEqual({ ok: true, words: 'Bailey: push the build please' });
  });
});

// The gate is `resolveReleaseGate` since the owner's release rules of
// 2026-09-21 ("A, B, and C together please."): the save-data class is what
// still demands deep evidence before a deploy, and the override behaves
// exactly as commit d333b06 made it.
describe('resolveReleaseGate: without the flag the refusal stands', () => {
  const save = { focusedBeforeDeploy: true, deepBeforeDeploy: true, maxDeploysWithDeepOwed: 2 };

  it('no candidate review required at all: proceeds, override or not', () => {
    const none = { focusedBeforeDeploy: false, deepBeforeDeploy: false, evidence: null, maxDeploysWithDeepOwed: 2 };
    expect(resolveReleaseGate({ ...none, ownerOverrideWords: null }).action).toBe('proceed');
    expect(resolveReleaseGate({ ...none, ownerOverrideWords: 'Bailey: ship it now' }).action).toBe('proceed');
  });

  it('a validated deep report already says SHIP: proceeds normally, override not needed', () => {
    const evidence = { path: 'critic/reviews/abc1234-deep.json', review: 'deep' as const, ship: 'SHIP' as const };
    expect(resolveReleaseGate({ ...save, evidence, ownerOverrideWords: null }).action).toBe('proceed');
  });

  it('deep evidence required, none on record, no override: hard refusal (unchanged default behaviour)', () => {
    const gate = resolveReleaseGate({ ...save, evidence: null, ownerOverrideWords: null });
    expect(gate.action).toBe('fail');
    expect(gate.message).toMatch(/deep review/i);
    expect(gate.message).toMatch(/no validated deep report/);
  });

  it('deep evidence required, none on record, a valid override: proceeds with a loud warning', () => {
    const gate = resolveReleaseGate({ ...save, evidence: null, ownerOverrideWords: 'Bailey: push the build please' });
    expect(gate.action).toBe('proceed-with-warning');
    expect(gate.warningLines!.join('\n')).toEqual(formatOwnerOverrideWarning('Bailey: push the build please', gate.refusals).join('\n'));
  });
});

describe('formatOwnerOverrideWarning: loud, and says nothing is settled', () => {
  it('names the words and every obligation as staying pending', () => {
    const lines = formatOwnerOverrideWarning('Bailey: push the build please').join('\n');
    expect(lines).toMatch(/OWNER OVERRIDE/);
    expect(lines).toMatch(/Bailey: push the build please/);
    expect(lines).toMatch(/live, focused, deep, milestone/);
    expect(lines).toMatch(/PENDING/);
  });
});

describe('formatDeployLogLine: docs/deploys.log gains override=owner', () => {
  const base = { isoNow: '2026-09-21T10:00:00.000Z', mainSha: 'abc1234', bundleHash: 'Bund1e', artFileCount: 10, status: 'ok' };

  it('without an override the line is unchanged', () => {
    expect(formatDeployLogLine(base)).toBe('2026-09-21T10:00:00.000Z\tmain=abc1234\tbundle=Bund1e\tartFiles=10\tstatus=ok\n');
  });

  it('with an override the line gains a trailing override=owner field', () => {
    expect(formatDeployLogLine({ ...base, overrideUsed: true })).toBe('2026-09-21T10:00:00.000Z\tmain=abc1234\tbundle=Bund1e\tartFiles=10\tstatus=ok\toverride=owner\n');
  });
});

describe('latestDeepReportFor: the newest deep/milestone report for a commit, whatever its verdict', () => {
  let root = '';
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'pyrefly-owner-override-'));
    mkdirSync(join(root, 'critic', 'reviews'), { recursive: true });
    mkdirSync(join(root, 'critic', 'rounds'), { recursive: true });
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('returns null when nothing is on record', () => {
    expect(latestDeepReportFor(root, 'abc1234')).toBeNull();
  });

  it('finds a failing deep report for the commit', () => {
    writeFileSync(
      join(root, 'critic', 'rounds', 'round-04.json'),
      JSON.stringify({ rubricVersion: 2, review: 'deep', date: '2026-09-21T09:00:00.000Z', build: { mainSha: 'abc1234' }, verdicts: { changedArea: 'FAIL' } }),
    );
    expect(latestDeepReportFor(root, 'abc1234')).toEqual({ path: 'critic/rounds/round-04.json', changedArea: 'FAIL' });
  });

  it('picks the newest by date when several reports exist for the same commit', () => {
    writeFileSync(
      join(root, 'critic', 'reviews', 'abc1234-old.json'),
      JSON.stringify({ rubricVersion: 2, review: 'deep', date: '2026-09-19T09:00:00.000Z', build: { mainSha: 'abc1234' }, verdicts: { changedArea: 'FAIL' } }),
    );
    writeFileSync(
      join(root, 'critic', 'rounds', 'round-05.json'),
      JSON.stringify({ rubricVersion: 2, review: 'milestone', date: '2026-09-21T09:00:00.000Z', build: { mainSha: 'abc1234' }, verdicts: { changedArea: 'UNVERIFIED' } }),
    );
    expect(latestDeepReportFor(root, 'abc1234')).toEqual({ path: 'critic/rounds/round-05.json', changedArea: 'UNVERIFIED' });
  });

  it('ignores focused/live reviews and reports for a different commit', () => {
    writeFileSync(
      join(root, 'critic', 'reviews', 'abc1234-focused.json'),
      JSON.stringify({ rubricVersion: 2, review: 'focused', date: '2026-09-21T09:00:00.000Z', build: { mainSha: 'abc1234' }, verdicts: { changedArea: 'PASS' } }),
    );
    writeFileSync(
      join(root, 'critic', 'rounds', 'round-06.json'),
      JSON.stringify({ rubricVersion: 2, review: 'deep', date: '2026-09-21T09:00:00.000Z', build: { mainSha: 'def5678' }, verdicts: { changedArea: 'FAIL' } }),
    );
    expect(latestDeepReportFor(root, 'abc1234')).toBeNull();
  });
});

describe('an override never settles a review: every obligation stays pending', () => {
  it('the marker carries ownerOverride, and its obligations are exactly what the plan required', () => {
    const baseMarker = buildPendingMarker({
      mainSha: 'abc1234', bundle: 'Bund1e', deployedAt: '2026-09-21T10:00:00.000Z', liveUrl: 'https://example.test/', artFiles: 10,
      artifactHash: 'f'.repeat(64), plan: deepPlan,
    });
    const marker = { ...baseMarker, ownerOverride: { words: 'Bailey: push the build please', date: '2026-09-21T10:00:00.000Z', report: 'critic/rounds/round-04.json', changedArea: 'FAIL' } };
    expect(marker.ownerOverride).toEqual({ words: 'Bailey: push the build please', date: '2026-09-21T10:00:00.000Z', report: 'critic/rounds/round-04.json', changedArea: 'FAIL' });
    expect(markerObligations(marker).map((o) => `${o.kind}:${o.status}`)).toEqual(['live:pending', 'focused:pending', 'deep:pending']);
  });

  it('an override with no report at all on record carries report: null, changedArea: null', () => {
    const baseMarker = buildPendingMarker({ mainSha: 'zzz9999', bundle: 'B', deployedAt: '2026-09-21T10:00:00.000Z', liveUrl: 'u', artFiles: 1, artifactHash: 'a'.repeat(64), plan: deepPlan });
    const marker = { ...baseMarker, ownerOverride: { words: 'Bailey: push the build please', date: '2026-09-21T10:00:00.000Z', report: null, changedArea: null } };
    expect(marker.ownerOverride.report).toBeNull();
    expect(marker.ownerOverride.changedArea).toBeNull();
  });
});

describe('critic-status names the override', () => {
  let root = '';
  beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'pyrefly-owner-override-status-')); });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('readOwnerOverride returns the block a marker file carries', () => {
    const p = join(root, 'abc1234.json');
    writeFileSync(p, JSON.stringify({ mainSha: 'abc1234', ownerOverride: { words: 'Bailey: push the build please', date: '2026-09-21T10:00:00.000Z', report: null, changedArea: null } }));
    expect(readOwnerOverride(p)).toEqual({ words: 'Bailey: push the build please', date: '2026-09-21T10:00:00.000Z', report: null, changedArea: null });
  });

  it('returns null when the marker carries no override, or cannot be read', () => {
    const p = join(root, 'def5678.json');
    writeFileSync(p, JSON.stringify({ mainSha: 'def5678' }));
    expect(readOwnerOverride(p)).toBeNull();
    expect(readOwnerOverride(join(root, 'missing.json'))).toBeNull();
  });

  it('formatOwnerOverrideLine names the exact words', () => {
    expect(formatOwnerOverrideLine({ words: 'Bailey: push the build please' })).toBe('    deployed under owner override: "Bailey: push the build please"');
  });
});

describe('critic-clear is unchanged: only a passing report settles deep', () => {
  let root = '';
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'pyrefly-owner-override-clear-'));
    mkdirSync(join(root, 'critic', 'reviews'), { recursive: true });
    writeFileSync(join(root, 'critic', 'policy.json'), readFileSync(join(REPO, 'critic', 'policy.json')));
    const marker = buildPendingMarker({
      mainSha: 'abc1234', bundle: 'Bund1e', deployedAt: '2026-09-21T10:00:00.000Z', liveUrl: 'https://example.test/', artFiles: 10,
      artifactHash: 'f'.repeat(64), plan: deepPlan,
    });
    mkdirSync(join(root, 'critic', 'pending'), { recursive: true });
    writeFileSync(join(root, 'critic', 'pending', 'abc1234.json'), JSON.stringify({ ...marker, ownerOverride: { words: 'Bailey: push the build please', date: '2026-09-21T10:00:00.000Z', report: null, changedArea: null } }));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('a non-passing (UNVERIFIED) deep report settles nothing, even on a build shipped under an owner override', () => {
    const reportPath = join(root, 'critic', 'reviews', 'abc1234-deep.json');
    writeFileSync(reportPath, JSON.stringify({
      rubricVersion: 2, review: 'deep', date: '2026-09-21T11:00:00.000Z', build: { mainSha: 'abc1234', bundle: 'Bund1e', artifactHash: 'f'.repeat(64) },
      verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'UNVERIFIED', milestone: 'not assessed' },
      checks: [{ id: 'CHK-015', result: 'UNVERIFIED', reason: 'not tested' }],
    }));
    const r = clearWithReport(root, reportPath);
    expect(r.ok).toBe(true);
    expect(r.settled).toEqual([]);
    const marker = JSON.parse(readFileSync(join(root, 'critic', 'pending', 'abc1234.json'), 'utf8'));
    expect(marker.ownerOverride).toBeTruthy();
    expect(marker.obligations.every((o: { status: string }) => o.status === 'pending')).toBe(true);
  });

  it('a validated PASS still settles the deep obligation normally: the override changed nothing about clearing', () => {
    const reportPath = join(root, 'critic', 'reviews', 'abc1234-deep.json');
    writeFileSync(reportPath, JSON.stringify({
      rubricVersion: 2, review: 'deep', date: '2026-09-21T11:00:00.000Z', build: { mainSha: 'abc1234', bundle: 'Bund1e', artifactHash: 'f'.repeat(64) },
      verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'PASS', milestone: 'not assessed' },
      checks: [{ id: 'CHK-015', result: 'PASS', evidence: ['real input'] }],
      coverage: { requiredNotTested: [] },
    }));
    const r = clearWithReport(root, reportPath);
    expect(r.settled.map((s) => s.kind)).toEqual(['focused', 'deep']);
  });
});
