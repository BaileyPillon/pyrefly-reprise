/**
 * The owner's release rules, adopted 2026-09-21. Two candidates in a row had
 * been held for a day by the pre-deploy deep review although each was better
 * than the live build; Bailey was offered three answers and replied
 * "A, B, and C together please."
 *
 *   A  SHIP IF BETTER THAN LIVE — a build deploys when the reviewed changed
 *      area has no critical defect introduced or left reachable by the change
 *      and no regression against the live build. Majors that are not
 *      regressions are disclosed and carried into the next batch. Defects
 *      inside a brand-new feature do not block; the feature may ship off.
 *   B  DEEP REVIEW AFTER DEPLOY — a shared-system change needs a FOCUSED
 *      review of the production candidate before the deploy; the deep review
 *      runs on the live build afterwards and stays that build's obligation.
 *      Deep-before-deploy survives only for the save-data class, and at most
 *      two deploys may go out while a deep review is owed.
 *   C  OWNER OVERRIDE — unchanged (commit d333b06): only Bailey's own words
 *      ship a build past a refusal, and they settle nothing.
 *
 * Everything here is a pure function or a temp directory: no network, no
 * build, no git push.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildPendingMarker, deepOwedBuilds, supersedeMarkers } from '../../tools/critic-pending.mjs';
import type { CriticReport } from '../../tools/critic-policy.mjs';
import { loadPolicy, planReview, releasePolicy, shipVerdict, validateReport } from '../../tools/critic-policy.mjs';
import { formatOwnerOverrideWarning, parseOwnerOverride, resolveReleaseGate, shipEvidenceFor } from '../../tools/deploy-pages.mjs';

const REPO = resolve(__dirname, '..', '..');
const policy = loadPolicy(REPO);
const release = releasePolicy(policy);
const plan = (paths: string[] | null, extra: Partial<Parameters<typeof planReview>[0]> = {}) => planReview({ paths, policy, ...extra });

/** A report dated after the rule came in, so the new fields are required. */
const NEW_DATE = '2026-09-24T12:00:00.000Z';
const issue = (over: Record<string, unknown> = {}) => ({
  id: 'PR-0101', severity: 'major', status: 'open', title: 'a thing',
  introducedByCandidate: false, regressionVsLive: false, ...over,
});
const report = (over: Partial<CriticReport> = {}): CriticReport => ({
  rubricVersion: 2, review: 'focused', date: NEW_DATE, build: { mainSha: 'abc1234' },
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'PASS', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons: ['no critical defect and no regression against the live build'],
  checks: [{ id: 'CHK-015', result: 'PASS', evidence: ['real key presses on the production preview'] }],
  issues: [],
  ...over,
});

describe('policy.json carries the release block the rules need', () => {
  it('names the numbers and the save-data class, and defaults closed', () => {
    expect(release.adopted).toBe('2026-09-21');
    expect(release.maxDeploysWithDeepOwed).toBe(2);
    expect(release.deepAfterDeploy).toBe(true);
    expect(release.deepBeforeDeployClasses).toEqual(['save-schema']);
    expect(release.regressionBlockingSeverities).toEqual(['critical', 'major']);
    expect(releasePolicy({} as never).deepBeforeDeployClasses).toEqual([]);
  });

  it('save-schema is the only rule that still demands deep evidence before deploying', () => {
    const before = policy.rules.filter((r) => r.deepBeforeDeploy).map((r) => r.id);
    expect(before).toEqual(release.deepBeforeDeployClasses);
  });
});

describe('rule A: ship if better than live', () => {
  it('SHIPs with disclosed majors: a major that is neither introduced nor a regression never blocks', () => {
    const v = shipVerdict(report({
      issues: [issue({ id: 'PR-0101' }), issue({ id: 'PR-0102', severity: 'polish' })],
    }), policy);
    expect(v.ship).toBe('SHIP');
    expect(v.blocking).toEqual([]);
    expect(v.disclose.map((i) => i.id)).toEqual(['PR-0101']);
    expect(v.reasons.join(' ')).toMatch(/disclosed/);
  });

  it('SHIPs a major the candidate introduced, as long as it is not a regression', () => {
    const v = shipVerdict(report({ issues: [issue({ introducedByCandidate: true, regressionVsLive: false })] }), policy);
    expect(v.ship).toBe('SHIP');
    expect(v.disclose.map((i) => i.id)).toEqual(['PR-0101']);
  });

  it('HOLDs on a critical the change introduced', () => {
    const v = shipVerdict(report({ issues: [issue({ severity: 'critical', introducedByCandidate: true, regressionVsLive: false })] }), policy);
    expect(v.ship).toBe('HOLD');
    expect(v.blocking.map((i) => i.id)).toEqual(['PR-0101']);
    expect(v.reasons.join(' ')).toMatch(/critical/);
  });

  it('HOLDs on a regression against the live build, critical or major', () => {
    for (const severity of ['critical', 'major']) {
      const v = shipVerdict(report({ issues: [issue({ severity, introducedByCandidate: true, regressionVsLive: true })] }), policy);
      expect(v.ship, severity).toBe('HOLD');
      expect(v.reasons.join(' '), severity).toMatch(/regression/);
    }
  });

  it('HOLDs when a critical leaves either tag unknown', () => {
    for (const over of [{ regressionVsLive: 'unknown' }, { introducedByCandidate: 'unknown' }, { regressionVsLive: undefined }]) {
      const v = shipVerdict(report({ issues: [issue({ severity: 'critical', introducedByCandidate: false, regressionVsLive: false, ...over })] }), policy);
      expect(v.ship, JSON.stringify(over)).toBe('HOLD');
      expect(v.reasons.join(' '), JSON.stringify(over)).toMatch(/unknown/);
    }
  });

  it('does not hold for an unknown tag on a major: only a critical unknown is a HOLD', () => {
    expect(shipVerdict(report({ issues: [issue({ regressionVsLive: 'unknown' })] }), policy).ship).toBe('SHIP');
  });

  it('a defect inside a brand-new feature never blocks; a critical one says the feature ships switched off', () => {
    const v = shipVerdict(report({
      issues: [issue({ severity: 'critical', inNewFeature: true, introducedByCandidate: true, regressionVsLive: false })],
    }), policy);
    expect(v.ship).toBe('SHIP');
    expect(v.reasons.join(' ')).toMatch(/switched off/);
  });

  it('ignores issues that are already fixed and verified', () => {
    const v = shipVerdict(report({
      issues: [issue({ severity: 'critical', status: 'fixed-verified', introducedByCandidate: true, regressionVsLive: true })],
    }), policy);
    expect(v.ship).toBe('SHIP');
  });

  it('a report dated after the rule came in must carry verdicts.ship, its reasons and the tags', () => {
    expect(validateReport(report(), policy)).toEqual([]);
    const noShip = report();
    delete (noShip.verdicts as Record<string, unknown>).ship;
    expect(validateReport(noShip, policy).join(' ')).toMatch(/verdicts\.ship/);
    expect(validateReport(report({ shipReasons: [] }), policy).join(' ')).toMatch(/shipReasons/);
    const untagged = report({ issues: [{ id: 'PR-0101', severity: 'major', status: 'open' }] });
    expect(validateReport(untagged, policy).join(' ')).toMatch(/introducedByCandidate.*regressionVsLive|introducedByCandidate/);
  });

  it('a polish issue needs no tags: only critical and major decide the ship verdict', () => {
    expect(validateReport(report({ issues: [{ id: 'PR-0102', severity: 'polish', status: 'open' }] }), policy)).toEqual([]);
  });

  it('a report cannot certify its own SHIP while the rules say HOLD', () => {
    const lying = report({ issues: [issue({ severity: 'critical', introducedByCandidate: true })] });
    expect(validateReport(lying, policy).join(' ')).toMatch(/claims ship SHIP/);
  });

  it('a live report needs no ship verdict: it runs after the deploy', () => {
    const live = report({
      review: 'live', build: { mainSha: 'abc1234', artifactHash: 'f'.repeat(64) },
      verdicts: { deployment: 'PASS', changedArea: 'NOT APPLICABLE', milestone: 'not assessed' },
      shipReasons: undefined, checks: [{ id: 'CHK-017', result: 'PASS', mandatory: true, evidence: ['verify-live: 61 files'] }],
    });
    expect(validateReport(live, policy)).toEqual([]);
  });

  it('old reports (rounds 04 to 06) still validate as history', () => {
    let checked = 0;
    for (const file of ['round-04.json', 'round-05.json', 'round-06.json']) {
      const full = join(REPO, 'critic', 'rounds', file);
      if (!existsSync(full)) continue;
      const old = JSON.parse(readFileSync(full, 'utf8')) as CriticReport;
      expect(validateReport(old, policy), file).toEqual([]);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('rule B: the plan says focused before deploy, deep after', () => {
  it('a shared-system change is a deep review, reviewed focused before the deploy and deeply after it', () => {
    const p = plan(['src/battle/ffx/ctb.ts']);
    expect(p.review).toBe('deep');
    expect(p.focusedBeforeDeploy).toBe(true);
    expect(p.deepBeforeDeploy).toBe(false);
    expect(p.deepAfterDeploy).toBe(true);
    expect(p.obligations).toEqual(['live', 'focused', 'deep']);
  });

  it('the save-data class still needs its deep review BEFORE the deploy', () => {
    const p = plan(['src/app/SaveData.ts']);
    expect(p.deepBeforeDeploy).toBe(true);
    expect(p.deepAfterDeploy).toBe(false);
    expect(p.checks).toContain('CHK-024');
  });

  it('a local change needs a focused review and owes no deep one', () => {
    const p = plan(['src/app/screens/PauseScreen.ts']);
    expect(p.review).toBe('focused');
    expect(p.focusedBeforeDeploy).toBe(true);
    expect(p.deepBeforeDeploy).toBe(false);
    expect(p.deepAfterDeploy).toBe(false);
  });

  it('a docs-only deploy needs no candidate review at all', () => {
    const p = plan(['docs/handoff/NOW.md']);
    expect(p.review).toBe('live');
    expect(p.focusedBeforeDeploy).toBe(false);
    expect(p.deepAfterDeploy).toBe(false);
  });

  it('a milestone claim keeps its deep evidence before the deploy', () => {
    expect(plan(['src/ui/ffx/a.ts'], { claim: 'milestone' }).deepBeforeDeploy).toBe(true);
  });
});

describe('rule B: the deploy gate', () => {
  const gate = (over: Partial<Parameters<typeof resolveReleaseGate>[0]> = {}) => resolveReleaseGate({
    focusedBeforeDeploy: true, deepBeforeDeploy: false, evidence: { path: 'critic/reviews/abc1234-focused.json', review: 'focused', ship: 'SHIP' },
    deepOwed: [], maxDeploysWithDeepOwed: release.maxDeploysWithDeepOwed, ownerOverrideWords: null, ...over,
  });

  it('a focused report that says SHIP is enough for a shared-system change', () => {
    expect(gate().action).toBe('proceed');
  });

  it('no candidate review is needed when no shipped file changed', () => {
    expect(gate({ focusedBeforeDeploy: false, evidence: null }).action).toBe('proceed');
  });

  it('refuses when there is no validated report for this commit', () => {
    const g = gate({ evidence: null });
    expect(g.action).toBe('fail');
    expect(g.message).toMatch(/no validated focused or deep report/);
  });

  it('refuses when the review of the candidate says HOLD', () => {
    const g = gate({ evidence: { path: 'critic/reviews/abc1234-focused.json', review: 'focused', ship: 'HOLD' } });
    expect(g.action).toBe('fail');
    expect(g.message).toMatch(/HOLD/);
  });

  it('refuses a save-data change that only has a focused report', () => {
    const g = gate({ deepBeforeDeploy: true });
    expect(g.action).toBe('fail');
    expect(g.message).toMatch(/save data|deep review/i);
  });

  it('accepts a save-data change with a deep report that says SHIP', () => {
    expect(gate({ deepBeforeDeploy: true, evidence: { path: 'critic/rounds/round-07.json', review: 'deep', ship: 'SHIP' } }).action).toBe('proceed');
  });

  it('lets two deploys go out with a deep review owed and refuses the third', () => {
    expect(gate({ deepOwed: ['aaa1111'] }).action).toBe('proceed');
    const third = gate({ deepOwed: ['aaa1111', 'bbb2222'] });
    expect(third.action).toBe('fail');
    expect(third.message).toMatch(/deep review/);
    expect(third.message).toMatch(/aaa1111, bbb2222/);
  });
});

describe('rule C: the owner override still works', () => {
  const held = { focusedBeforeDeploy: true, deepBeforeDeploy: false, evidence: null, deepOwed: ['aaa1111', 'bbb2222'], maxDeploysWithDeepOwed: 2 };

  it('only the owner\'s own words unlock it (unchanged from d333b06)', () => {
    expect(parseOwnerOverride(undefined)).toEqual({ ok: true, words: null });
    expect(parseOwnerOverride(true).ok).toBe(false);
    expect(parseOwnerOverride('ship it').ok).toBe(false);
    expect(parseOwnerOverride('  Bailey: push the build please  ')).toEqual({ ok: true, words: 'Bailey: push the build please' });
  });

  it('turns every refusal into one loud warning and settles nothing', () => {
    const g = resolveReleaseGate({ ...held, ownerOverrideWords: 'Bailey: push the build please' });
    expect(g.action).toBe('proceed-with-warning');
    const text = g.warningLines!.join('\n');
    expect(text).toMatch(/OWNER OVERRIDE/);
    expect(text).toMatch(/Bailey: push the build please/);
    expect(text).toMatch(/live, focused, deep, milestone/);
    expect(text).toMatch(/PENDING/);
    for (const r of g.refusals!) expect(text).toContain(r);
  });

  it('without the words the refusal stands', () => {
    expect(resolveReleaseGate({ ...held, ownerOverrideWords: null }).action).toBe('fail');
  });

  it('the warning block works with no refusal text at all', () => {
    expect(formatOwnerOverrideWarning('Bailey: ship it now').join('\n')).toMatch(/OWNER OVERRIDE/);
  });
});

describe('how many builds owe a deep review', () => {
  const markerFor = (sha: string, carriedDeep: string[] = []) => buildPendingMarker({
    mainSha: sha, bundle: 'B', deployedAt: '2026-09-24T10:00:00.000Z', liveUrl: 'https://example.test/', artFiles: 1,
    artifactHash: 'f'.repeat(64), plan: plan(['src/battle/ffx/ctb.ts']), carriedDeep,
  });

  it('counts the build itself and every build whose debt it carries', () => {
    expect(deepOwedBuilds([markerFor('aaa1111')])).toEqual(['aaa1111']);
    expect(deepOwedBuilds([markerFor('bbb2222', ['aaa1111'])]).sort()).toEqual(['aaa1111', 'bbb2222']);
  });

  it('counts nothing for a build whose deep review is settled or which never owed one', () => {
    const settled = markerFor('aaa1111');
    settled.obligations = settled.obligations!.map((o) => (o.kind === 'deep' ? { ...o, status: 'done' as const, result: 'PASS' as const } : o));
    expect(deepOwedBuilds([settled])).toEqual([]);
    expect(deepOwedBuilds([buildPendingMarker({
      mainSha: 'ccc3333', bundle: 'B', deployedAt: '2026-09-24T10:00:00.000Z', liveUrl: 'u', artFiles: 1, plan: plan(['docs/handoff/NOW.md']),
    })])).toEqual([]);
  });

  it('two deploys in a row with the deep review owed reach the cap the gate refuses at', () => {
    const first = markerFor('aaa1111');
    const { carriedDeep } = supersedeMarkers([first], 'bbb2222', '2026-09-24T11:00:00.000Z');
    const second = markerFor('bbb2222', carriedDeep);
    expect(deepOwedBuilds([second]).length).toBe(release.maxDeploysWithDeepOwed);
  });
});

describe('shipEvidenceFor: which report the gate is allowed to read', () => {
  let root = '';
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'pyrefly-release-rules-'));
    mkdirSync(join(root, 'critic', 'reviews'), { recursive: true });
    mkdirSync(join(root, 'critic', 'rounds'), { recursive: true });
    writeFileSync(join(root, 'critic', 'policy.json'), readFileSync(join(REPO, 'critic', 'policy.json')));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  const save = (rel: string, r: CriticReport) => writeFileSync(join(root, 'critic', ...rel.split('/')), JSON.stringify(r));

  it('finds a validated focused report for the commit and reports its ship verdict', () => {
    save('reviews/abc1234-focused.json', report());
    expect(shipEvidenceFor(root, 'abc1234')).toMatchObject({ path: 'critic/reviews/abc1234-focused.json', review: 'focused', ship: 'SHIP' });
  });

  it('ignores an invalid report, a live report and a report for another build', () => {
    save('reviews/abc1234-live.json', report({ review: 'live', verdicts: { deployment: 'PASS', changedArea: 'NOT APPLICABLE', milestone: 'not assessed' } }));
    save('reviews/def5678-focused.json', report({ build: { mainSha: 'def5678' } }));
    save('rounds/round-09.json', report({ review: 'deep', rubricVersion: 1 }));
    expect(shipEvidenceFor(root, 'abc1234')).toBeNull();
  });

  it('prefers a deep report over a focused one for the same commit', () => {
    save('reviews/abc1234-focused.json', report());
    save('rounds/round-08.json', report({ review: 'deep', coverage: { requiredNotTested: [] } }));
    expect(shipEvidenceFor(root, 'abc1234')?.review).toBe('deep');
  });

  it('reports a HOLD verdict instead of hiding it', () => {
    save('reviews/abc1234-focused.json', report({
      verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'FAIL', milestone: 'not assessed', ship: 'HOLD' },
      shipReasons: ['PR-0101 is a regression against the live build'],
      issues: [issue({ severity: 'major', introducedByCandidate: true, regressionVsLive: true })],
    }));
    expect(shipEvidenceFor(root, 'abc1234')).toMatchObject({ ship: 'HOLD' });
  });
});
