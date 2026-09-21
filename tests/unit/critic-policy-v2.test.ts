/**
 * Critic policy v2 (approved by Bailey on 2026-09-20): every deployed build is
 * evaluated, and the depth of the review follows what changed. These tests are
 * the five things the owner asked to have proved, against the real
 * `critic/policy.json`:
 *
 *   1. a small change gets a focused check;
 *   2. a shared-system change gets broader coverage, before it deploys;
 *   3. every deployment owes exact-artifact live verification;
 *   4. missing evidence stays pending or fails;
 *   5. an old score cannot certify a new build.
 *
 * Plus the single weighted score and its gates: 9.60 unrounded, every category
 * at least 9.0, nothing UNVERIFIED. Filesystem tests run in a temp directory,
 * never the repo's real `critic/pending/`.
 */

import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearWithReport } from '../../tools/critic-clear.mjs';
import {
  applyReport,
  buildPendingMarker,
  markerObligations,
  readPendingMarkers,
  supersedeMarkers,
  writePendingMarker,
} from '../../tools/critic-pending.mjs';
import type { CriticReport } from '../../tools/critic-policy.mjs';
import { loadPolicy, milestoneVerdict, planReview, validateReport, weightedTotal } from '../../tools/critic-policy.mjs';
import { qualityLine } from '../../tools/critic-status.mjs';

const REPO = resolve(__dirname, '..', '..');
const policy = loadPolicy(REPO);
const plan = (paths: string[] | null, extra: Partial<Parameters<typeof planReview>[0]> = {}) => planReview({ paths, policy, ...extra });
const FFX = ['seymour-flux', 'yunalesca', 'braskas-final-aeon'];
const ALL = [...FFX, 'ffx2-bahamut', 'ffx2-vegnagun-shuyin'];

describe('1. a small change gets a focused check', () => {
  it('a pause-screen caption repair is a focused review with real-input and layout checks, not a combat audit', () => {
    const p = plan(['src/app/screens/PauseScreen.ts', 'docs/handoff/fix3-pause.md']);
    expect(p.review).toBe('focused');
    expect(p.obligations).toEqual(['live', 'focused']);
    expect(p.deepBeforeDeploy).toBe(false);
    expect(p.checks).toEqual(expect.arrayContaining(['CHK-002', 'CHK-003', 'CHK-015', 'CHK-016', 'CHK-017']));
    expect(p.checks).not.toContain('CHK-023');
    expect(p.ignoredPaths).toEqual(['docs/handoff/fix3-pause.md']);
  });

  it('one scene file touches one chapter, not five', () => {
    const p = plan(['src/scenes/gagazet.ts']);
    expect(p.review).toBe('focused');
    expect(p.chapters).toEqual(['seymour-flux']);
  });

  it('an FFX HUD change stays in the FFX chapters and still carries the game-aware check', () => {
    const p = plan(['src/ui/ffx/CommandMenu.ts']);
    expect(p.games).toBe('ffx');
    expect(p.chapters).toEqual(FFX);
    expect(p.checks).toContain('CHK-021');
  });

  it('a docs-only deploy still owes live verification and nothing else', () => {
    const p = plan(['docs/handoff/NOW.md', 'critic/RUBRIC.md']);
    expect(p.review).toBe('live');
    expect(p.obligations).toEqual(['live']);
  });
});

describe('2. a shared-system change gets broader coverage', () => {
  it('a CTB scheduler change is a deep review of every FFX chapter, focused before the deploy and deep after it', () => {
    const p = plan(['src/battle/ffx/ctb.ts']);
    expect(p.review).toBe('deep');
    // RULE B (Bailey, 2026-09-21): only the save-data class still holds a build for a deep review.
    expect(p.deepBeforeDeploy).toBe(false);
    expect(p.focusedBeforeDeploy).toBe(true);
    expect(p.deepAfterDeploy).toBe(true);
    expect(p.chapters).toEqual(FFX);
    expect(p.obligations).toEqual(['live', 'focused', 'deep']);
    expect(p.checks).toEqual(expect.arrayContaining(['CHK-022', 'CHK-023']));
  });

  it('an asset-loader change covers every chapter, FFX-2 included', () => {
    const p = plan(['src/engine/ArtManifest.ts']);
    expect(p.review).toBe('deep');
    expect(p.chapters).toEqual(ALL);
    expect(p.checks).toEqual(expect.arrayContaining(['CHK-012', 'CHK-018', 'CHK-019']));
  });

  it.each([
    ['src/battle/common/status.ts'], ['src/engine/BattlePresenterEvents.ts'], ['src/app/SaveData.ts'],
    ['src/ui/inkgold/tokens.css'], ['src/audio/AudioManager.ts'], ['src/data/encounters.ts'], ['package.json'],
  ])('%s is a shared system', (path) => {
    expect(plan([path]).review).toBe('deep');
  });

  it('a save-schema change selects the upgrade check, and is the one class still reviewed deeply before the deploy', () => {
    expect(plan(['src/app/SaveData.ts']).checks).toContain('CHK-024');
    expect(plan(['src/app/SaveData.ts']).deepBeforeDeploy).toBe(true);
  });

  it('an unknown change set, or a product path no rule knows, is never waved through', () => {
    expect(plan(null).review).toBe('deep');
    expect(plan(['src/brand-new-system/thing.ts']).review).toBe('deep');
  });

  it('a batch that crosses four systems stops being a focused pass', () => {
    const p = plan(['src/ui/ffx/a.ts', 'src/ui/ffx2/b.ts', 'src/app/screens/c.ts', 'src/engine/tactics/d.ts']);
    expect(p.review).toBe('deep');
  });

  it('the third substantial checkpoint since the last deep review is a deep review', () => {
    expect(plan(['src/ui/ffx/a.ts'], { ledger: { substantialSinceDeep: 1 } }).review).toBe('focused');
    expect(plan(['src/ui/ffx/a.ts'], { ledger: { substantialSinceDeep: 2 } }).review).toBe('deep');
    expect(plan(['src/ui/ffx/a.ts'], { ledger: { activeDaysSinceDeep: 7 } }).review).toBe('deep');
  });

  it('a request can raise the depth and can never lower it', () => {
    expect(plan(['src/ui/ffx/a.ts'], { minimum: 'deep' }).review).toBe('deep');
    expect(plan(['src/battle/ffx/ctb.ts'], { minimum: 'live' }).review).toBe('deep');
    expect(plan(['src/ui/ffx/a.ts'], { claim: 'milestone' }).obligations).toEqual(['live', 'focused', 'deep', 'milestone']);
  });
});

const BUILD = { mainSha: 'abc1234', bundle: 'Bund1e', artifactHash: 'f'.repeat(64) };
// Dated after the owner's release rules came in (2026-09-21), so every candidate
// review here carries verdicts.ship and its reasons (RULE A, RUBRIC section 3).
const report = (over: Partial<CriticReport>): CriticReport => ({
  rubricVersion: 2, review: 'focused', date: '2026-09-26T12:00:00.000Z', build: BUILD,
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'PASS', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons: ['no critical defect and no regression against the live build'],
  checks: [{ id: 'CHK-015', result: 'PASS', evidence: ['real Esc and H key presses on the production preview'] }],
  ...over,
});
const LIVE_OK = report({
  review: 'live', verdicts: { deployment: 'PASS', changedArea: 'NOT APPLICABLE', milestone: 'not assessed' },
  checks: [{ id: 'CHK-017', result: 'PASS', mandatory: true, evidence: ['verify-live: 61 files compared, manifest match'] }],
});
const deepPlan = plan(['src/battle/ffx/ctb.ts']);
const marker = () => buildPendingMarker({
  mainSha: 'abc1234', bundle: 'Bund1e', deployedAt: '2026-09-26T10:00:00.000Z', liveUrl: 'https://example.test/', artFiles: 10,
  artifactHash: BUILD.artifactHash, plan: deepPlan,
});

describe('3. every deployment owes exact-artifact live verification', () => {
  it('every plan lists the live obligation and the live-artifact check, whatever changed', () => {
    for (const paths of [['README.md'], ['src/ui/ffx/a.ts'], ['src/battle/common/x.ts'], null]) {
      const p = plan(paths);
      expect(p.obligations[0]).toBe('live');
      expect(p.checks).toContain('CHK-017');
    }
  });

  it('a deployment PASS without the exact-artifact check on record is not a valid report', () => {
    const bad = report({ review: 'live', verdicts: { deployment: 'PASS', changedArea: 'NOT APPLICABLE', milestone: 'not assessed' }, checks: [] });
    expect(validateReport(bad, policy).join(' ')).toMatch(/CHK-017/);
    expect(validateReport(LIVE_OK, policy)).toEqual([]);
  });

  it('a live report that does not name the artifact it verified settles nothing', () => {
    const noHash = { ...LIVE_OK, build: { mainSha: 'abc1234', bundle: 'Bund1e' } };
    expect(validateReport(noHash, policy).join(' ')).toMatch(/artifactHash/);
    expect(applyReport(marker(), noHash).settled).toEqual([]);
  });

  it('a marker written under the old policy still owes live, focused and deep', () => {
    const old = { mainSha: 'a1b2c3d', bundle: 'x', deployedAt: '2026-09-18T12:00:00.000Z', liveUrl: 'u', artFiles: 1 };
    expect(markerObligations(old).map((o) => `${o.kind}:${o.status}`)).toEqual(['live:pending', 'focused:pending', 'deep:pending']);
  });
});

describe('4. missing evidence stays pending or fails', () => {
  it('a focused pass settles the focused obligation and can never settle the deep review', () => {
    const { marker: next, settled, refused } = applyReport(marker(), report({}));
    expect(settled).toEqual([{ kind: 'focused', result: 'PASS' }]);
    expect(refused.map((r) => r.kind)).toEqual(['live', 'deep']);
    expect(markerObligations(next).find((o) => o.kind === 'deep')?.status).toBe('pending');
  });

  it('UNVERIFIED settles nothing', () => {
    const unverified = report({ verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'UNVERIFIED', milestone: 'not assessed' } });
    expect(applyReport(marker(), unverified).settled).toEqual([]);
  });

  it('a deep review that left required coverage untested does not settle the deep obligation', () => {
    const partial = report({ review: 'deep', coverage: { requiredNotTested: ['ffx2-bahamut full flow'] } });
    const { settled, refused } = applyReport(marker(), partial);
    expect(settled.map((s) => s.kind)).toEqual(['focused']);
    expect(refused.find((r) => r.kind === 'deep')?.why).toMatch(/not tested/);
  });

  it('a mandatory check left UNVERIFIED keeps everything pending', () => {
    const r = report({ checks: [{ id: 'CHK-016', result: 'UNVERIFIED', mandatory: true, reason: 'the wait for the command menu timed out' }] });
    expect(applyReport(marker(), r).settled).toEqual([]);
  });

  it('a FAIL is a result: the obligation is settled and the failure stays on the record', () => {
    const failed = report({ verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'FAIL', milestone: 'not assessed' } });
    const { marker: next } = applyReport(marker(), failed);
    expect(markerObligations(next).find((o) => o.kind === 'focused')).toMatchObject({ status: 'done', result: 'FAIL' });
  });

  it('a PASS with no evidence, an unknown check id or a missing reason is not a valid report', () => {
    expect(validateReport(report({ checks: [{ id: 'CHK-015', result: 'PASS' }] }), policy).join(' ')).toMatch(/needs evidence/);
    expect(validateReport(report({ checks: [{ id: 'CHK-999', result: 'PASS', evidence: ['x'] }] }), policy).join(' ')).toMatch(/unknown check/);
    expect(validateReport(report({ checks: [{ id: 'CHK-015', result: 'UNVERIFIED' }] }), policy).join(' ')).toMatch(/needs a reason/);
    expect(validateReport(report({ checks: [{ id: 'CHK-015', result: 'PASS', reusedFrom: 'round-03' }] }), policy).join(' ')).toMatch(/dependency argument/);
  });

  it('a deep review still owed moves to the build that replaces it; the rest is recorded as never verified', () => {
    const { carriedDeep, closed } = supersedeMarkers([marker()], 'def5678', '2026-09-27T09:00:00.000Z');
    expect(carriedDeep).toEqual(['abc1234']);
    expect(markerObligations(closed[0] ?? {}).map((o) => `${o.kind}:${o.status}`)).toEqual(['live:superseded-unverified', 'focused:superseded-unverified', 'deep:carried']);
    expect(plan(['README.md'], { carriedDeep }).obligations).toContain('live');
    expect(plan(['src/ui/ffx/a.ts'], { carriedDeep }).review).toBe('deep');
  });
});

describe('5. an old score cannot certify a new build', () => {
  it('a report for another build settles nothing on this marker', () => {
    const other = report({ review: 'deep', build: { ...BUILD, mainSha: '7191674' } });
    const { settled, refused } = applyReport(marker(), other);
    expect(settled).toEqual([]);
    expect(refused[0]?.why).toMatch(/7191674/);
  });

  it('a report with no build, or for a different artifact of the same commit, settles nothing', () => {
    expect(validateReport(report({ build: {} }), policy).join(' ')).toMatch(/mainSha/);
    const otherArtifact = { ...LIVE_OK, build: { ...BUILD, artifactHash: 'e'.repeat(64) } };
    expect(applyReport(marker(), otherArtifact).settled).toEqual([]);
  });

  it('the status line names the build a score belongs to, and rubric v1 rounds are history', () => {
    const v1 = { file: 'round-03.json', id: 'round-03', rubricVersion: 1, sha: '7191674', total: 4.09 };
    expect(qualityLine([v1], '7191674')).toMatch(/no full score under rubric v2 yet.*history/);
    const v2 = { file: 'round-04.json', id: 'round-04', rubricVersion: 2, review: 'deep', sha: 'abc1234', total: 7.4, date: '2026-09-27' };
    expect(qualityLine([v1, v2], 'def5678')).toMatch(/NOT the live build def5678/);
    expect(qualityLine([v1, v2], 'abc1234')).toMatch(/which is the live build/);
  });
});

const scores = (value: number, over: Record<string, number | null> = {}) =>
  policy.categories.map((c) => ({ id: c.id, score: c.id in over ? over[c.id] : value }));

describe('the single weighted score and its gates', () => {
  it('the ten weights total 100', () => {
    expect(policy.categories.reduce((n, c) => n + c.weight, 0)).toBe(100);
    expect(policy.categories).toHaveLength(10);
  });

  it('9.60 is tested unrounded: 9.595 is not accepted', () => {
    expect(weightedTotal(scores(9.6), policy)).toMatchObject({ total: 9.6, meetsTotal: true, display: '9.60' });
    const near = weightedTotal(scores(9.6, { delivery: 9.5 }), policy);
    expect(near.total).toBeCloseTo(9.595, 6);
    expect(near.display).toBe('9.59');
    expect(near.meetsTotal).toBe(false);
  });

  it('a missing or UNVERIFIED category leaves the score provisional: never zero, never averaged away', () => {
    const missing = weightedTotal(scores(9.8).filter((c) => c.id !== 'audio'), policy);
    expect(missing).toMatchObject({ total: null, provisional: true, missing: ['audio'], meetsTotal: false });
    const unverified = weightedTotal(scores(9.8).map((c) => (c.id === 'audio' ? { ...c, status: 'UNVERIFIED' } : c)), policy);
    expect(unverified.total).toBeNull();
  });

  const accepted = (): CriticReport => report({
    review: 'milestone', verdicts: { deployment: 'PASS', changedArea: 'PASS', milestone: 'accepted', ship: 'SHIP' }, categories: scores(9.7),
    checks: [{ id: 'CHK-017', result: 'PASS', mandatory: true, evidence: ['verify-live --full'] }],
    issues: [{ id: 'PR-0001', severity: 'polish', status: 'open' }],
    encounters: ALL.map((id) => ({ id, completedRealFlow: true })),
    targets: { required: 50, matched: 50, failing: 0, unverified: 0, waiting: 0 },
    humanJudgments: [{ what: 'audio mix, Bailey, 9/10', recorded: true }],
  });

  it('accepts a complete milestone report', () => {
    expect(milestoneVerdict(accepted(), policy)).toMatchObject({ accepted: true, reasons: [] });
    expect(validateReport(accepted(), policy)).toEqual([]);
  });

  it('every category must reach 9.0 even when the total clears 9.60', () => {
    const r = { ...accepted(), categories: scores(9.7, { onboarding: 8.9 }) };
    expect(weightedTotal(r.categories, policy).meetsTotal).toBe(true);
    expect(milestoneVerdict(r, policy).reasons.join(' ')).toMatch(/onboarding is below the 9 floor/);
  });

  it.each([
    ['a deep review claiming acceptance', { review: 'deep' }, /cannot accept a milestone/],
    ['an UNVERIFIED mandatory check', { checks: [{ id: 'CHK-017', result: 'UNVERIFIED', mandatory: true, reason: 'live site unreachable' }] }, /CHK-017 is UNVERIFIED/],
    ['an open major issue', { issues: [{ id: 'PR-0002', severity: 'major', status: 'open' }] }, /critical or major/],
    ['an encounter with no real-input flow', { encounters: [{ id: 'yunalesca', completedRealFlow: false }] }, /yunalesca/],
    ['a required target still unverified', { targets: { required: 50, matched: 49, failing: 0, unverified: 1, waiting: 0 } }, /unverified/],
    ['a target waiting on a decision', { targets: { required: 50, matched: 49, failing: 0, unverified: 0, waiting: 1 } }, /waiting/],
    ['a missing human judgment', { humanJudgments: [{ what: 'audio mix', recorded: false }] }, /human judgment/],
    ['an unverified deployment', { verdicts: { deployment: 'UNVERIFIED', changedArea: 'PASS', milestone: 'accepted' } }, /live verification/],
    ['an incomplete build identity', { build: { mainSha: 'abc1234', bundle: 'Bund1e' } }, /identity is incomplete/],
    ['a rubric v1 report', { rubricVersion: 1 }, /rubric v1/],
  ])('refuses %s', (_name, over, why) => {
    const verdict = milestoneVerdict({ ...accepted(), ...(over as Partial<CriticReport>) }, policy);
    expect(verdict.accepted).toBe(false);
    expect(verdict.reasons.join(' ')).toMatch(why);
  });

  it('a report cannot certify itself: claiming "accepted" while a gate fails is invalid evidence', () => {
    const lying = { ...accepted(), categories: scores(9.7, { combat: 8.0 }) };
    expect(validateReport(lying, policy).join(' ')).toMatch(/gates disagree/);
  });
});

describe('critic-clear end to end, in a temp project', () => {
  let root = '';
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'pyrefly-critic-v2-'));
    mkdirSync(join(root, 'critic', 'reviews'), { recursive: true });
    cpSync(join(REPO, 'critic', 'policy.json'), join(root, 'critic', 'policy.json'));
    writePendingMarker(join(root, 'critic', 'pending'), marker());
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  const save = (name: string, r: CriticReport) => {
    const p = join(root, 'critic', 'reviews', name);
    writeFileSync(p, JSON.stringify(r));
    return p;
  };

  it('an invalid report settles nothing and says why', () => {
    const r = clearWithReport(root, save('bad.json', report({ rubricVersion: 1 })));
    expect(r.ok).toBe(false);
    expect(readPendingMarkers(join(root, 'critic', 'pending'))[0]?.obligations?.every((o) => o.status === 'pending')).toBe(true);
  });

  it('focused then live leave the deep review owed; the deep report settles it, archives the marker and restarts the ledger', () => {
    expect(clearWithReport(root, save('abc1234-focused.json', report({}))).settled.map((s) => s.kind)).toEqual(['focused']);
    expect(clearWithReport(root, save('abc1234-live.json', LIVE_OK)).settled.map((s) => s.kind)).toEqual(['live']);
    const owed = readPendingMarkers(join(root, 'critic', 'pending'))[0]?.obligations?.filter((o) => o.status === 'pending').map((o) => o.kind);
    expect(owed).toEqual(['deep']);

    const deep = clearWithReport(root, save('abc1234-deep.json', report({ review: 'deep', coverage: { requiredNotTested: [] } })));
    expect(deep.settled.map((s) => s.kind)).toEqual(['deep']);
    expect(deep.archived).toBe(true);
    expect(readPendingMarkers(join(root, 'critic', 'pending'))).toEqual([]);
    expect(existsSync(join(root, 'critic', 'cleared', 'abc1234.json'))).toBe(true);
    const ledger = JSON.parse(readFileSync(join(root, 'critic', 'ledger.json'), 'utf8'));
    expect(ledger.lastDeep.sha).toBe('abc1234');
    expect(ledger.deploysSinceDeep).toEqual([]);
  });

  it('a candidate review made before the deploy is kept, not applied to some other build', () => {
    const r = clearWithReport(root, save('zzz9999-focused.json', report({ build: { ...BUILD, mainSha: 'zzz9999' } })));
    expect(r).toMatchObject({ ok: true, settled: [] });
    expect(r.note).toMatch(/candidate evidence/);
  });
});
