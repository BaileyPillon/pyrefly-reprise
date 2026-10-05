/**
 * The continuity checks in the policy (Bailey, 2026-10-04, D-420 to D-426): the `continuity` block of critic/policy.json, the
 * two checks CHK-026 and CHK-027 in the library, the caps they put on the sub-scores (`continuityCaps`, inside
 * `validateReport`, so `critic-score` and `critic-clear` refuse a report above a cap), and the whole run's aggregate.
 * Rounds 19 to 21 carry subScores and are history: the caps start on `continuity.requiredFrom`. No existing gate, verdict rule or
 * deploy behaviour changes, which the existing critic tests keep proving.
 *
 * Game case: both (shared critic plumbing).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aggregate, continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import type { ChapterResult } from '../../critic/runner/lib/continuity.mjs';
import { classifyChange, continuityCaps, loadPolicy, validateReport } from '../../tools/critic-policy.mjs';
import type { CriticReport } from '../../tools/critic-policy.mjs';

const ROOT = resolve(__dirname, '..', '..');
const policy = loadPolicy(ROOT);
const c = policy['continuity'] as ReturnType<typeof continuityConfig> & { requiredFrom: string; probe: Record<string, number>; caps: { sizeFails: { check: string; subScores: string[]; max: number }; snaps: { subScore: string; max: number } }; checks: string[] };

describe('the continuity block of the policy', () => {
  it('holds the thresholds the owner named: 3 percent on a head, 2 px on the feet at 1600 wide', () => {
    expect(c.size.headTolerancePct).toBe(3);
    expect(c.size.feetTolerancePx).toBe(2);
  });

  it('holds the caps the owner approved: 7.0 on characterModels and animation while CHK-026 fails, 7.5 on animation while snaps exceed the threshold', () => {
    expect(c.caps.sizeFails).toEqual({ check: 'CHK-026', subScores: ['characterModels', 'animation'], max: 7.0 });
    expect(c.caps.snaps).toEqual({ subScore: 'animation', max: 7.5 });
    expect(c.motion.snapsPerMinuteMax).toBeGreaterThan(0);
  });

  it('is read whole by the harness: every number it uses is there', () => {
    const num = (v: unknown): void => expect(typeof v === 'number' && Number.isFinite(v), String(v)).toBe(true);
    for (const v of [c.minBattleSeconds, c.minSwaps, c.minFps, ...Object.values(c.size), ...Object.values(c.motion), ...Object.values(c.strips), ...Object.values(c.probe)]) num(v);
    expect(c.strips).toMatchObject({ beforeFrames: 6, afterFrames: 6 });
    expect(c.requiredFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(continuityConfig()).toEqual(c);
  });

  it('can be overridden for an experiment, block by block, and only by the environment', () => {
    process.env['CONT_CFG'] = '{"strips":{"worstJerks":14},"minFps":20}';
    try {
      const o = continuityConfig();
      expect(o.strips.worstJerks).toBe(14);
      expect(o.strips.worstSwaps).toBe(c.strips.worstSwaps);
      expect(o.minFps).toBe(20);
    } finally {
      delete process.env['CONT_CFG'];
    }
    expect(continuityConfig().minFps).toBe(c.minFps);
  });

  it('puts both checks in the library as implemented, with a tool that exists', () => {
    for (const id of ['CHK-026', 'CHK-027']) {
      const k = policy.checks.find((x) => x.id === id) as { id: string; automation: string; tool?: string } | undefined;
      expect(k, id).toBeDefined();
      expect(k!.automation).toBe('implemented');
      expect(existsSync(resolve(ROOT, k!.tool ?? 'missing')), `${id} names its tool`).toBe(true);
    }
    expect(policy.checks.find((x) => x.id === 'CHK-025')!.title).toMatch(/hidden experiment/); // the id the driver's brief used was taken
  });

  it('lists them for a change to the presenter, the stage, the figures, the paintings or a new chapter, and not for a pause caption', () => {
    const plan = (paths: string[]) => classifyChange(paths, policy);
    for (const path of ['src/engine/BattlePresenterBeats.ts', 'src/engine/PaintedActor.ts', 'src/engine/BattlePresenterStage.ts', 'public/art/characters/tidus/attack.png', 'src/data/encounters.ts']) {
      expect(plan([path]).checks, path).toEqual(expect.arrayContaining(['CHK-026', 'CHK-027']));
    }
    expect(plan(['src/engine/BattleCamera.ts']).checks).toContain('CHK-027');
    expect(plan(['src/app/screens/PauseScreen.ts']).checks).not.toContain('CHK-026');
  });
});

/** A deep report as the chief critic writes it, dated after the caps began. */
const report = (over: Record<string, unknown> = {}): CriticReport => ({
  rubricVersion: 2, review: 'deep', date: `${c.requiredFrom}T12:00:00.000Z`,
  build: { mainSha: 'abc1234' },
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'FAIL', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons: ['no critical this change introduced'],
  checks: [
    { id: 'CHK-026', result: 'FAIL', evidence: ['critic/rounds/round-22/continuity/continuity-summary.json'] },
    { id: 'CHK-027', result: 'FAIL', evidence: ['critic/rounds/round-22/continuity/continuity-summary.json'] },
  ],
  continuity: { checks: { 'CHK-026': 'FAIL', 'CHK-027': 'FAIL' }, motion: { snapsPerMinute: c.motion.snapsPerMinuteMax + 1 } },
  subScores: { characterModels: 7.0, enemyModels: 7.8, animation: 7.0, fidelity: 8.2, camera: 7.9 },
  issues: [],
  ...over,
}) as CriticReport;

describe('the caps on the sub-scores (D-424)', () => {
  it('lets a build that fails both checks score what is under the caps', () => {
    expect(continuityCaps(report(), policy)).toEqual([]);
    expect(validateReport(report(), policy).filter((e) => /subScores|CHK-02[67]|snapsPerMinute/.test(e))).toEqual([]);
  });

  it('caps characterModels and animation at 7.0 while CHK-026 fails', () => {
    const e = continuityCaps(report({ subScores: { characterModels: 8.2, enemyModels: 7.8, animation: 7.4, fidelity: 8.2, camera: 7.9 } }), policy);
    expect(e.join('\n')).toMatch(/subScores\.characterModels is 8\.2 but CHK-026 FAILS: it is capped at 7/);
    expect(e.join('\n')).toMatch(/subScores\.animation is 7\.4 but CHK-026 FAILS: it is capped at 7/);
    expect(e.join('\n')).not.toMatch(/enemyModels|fidelity|camera/); // the other three are not touched
    // the same scores round 21 gave, on a report from after the caps, are refused by the validator everyone uses
    expect(validateReport(report({ subScores: { characterModels: 8.2, enemyModels: 7.8, animation: 7.4, fidelity: 8.2, camera: 7.9 } }), policy).join('\n')).toMatch(/capped at 7/);
  });

  it('lifts the 7.0 cap when CHK-026 passes, and leaves the 7.5 cap on animation while snaps exceed the threshold', () => {
    const passing = report({
      checks: [{ id: 'CHK-026', result: 'PASS', evidence: ['x'] }, { id: 'CHK-027', result: 'FAIL', evidence: ['x'] }],
      continuity: { checks: { 'CHK-026': 'PASS', 'CHK-027': 'FAIL' }, motion: { snapsPerMinute: c.motion.snapsPerMinuteMax + 0.5 } },
    });
    expect(continuityCaps({ ...passing, subScores: { characterModels: 8.4, animation: 7.5 } }, policy)).toEqual([]);
    const e = continuityCaps({ ...passing, subScores: { characterModels: 8.4, animation: 7.6 } }, policy);
    expect(e).toHaveLength(1);
    expect(e[0]).toMatch(/subScores\.animation is 7\.6 but snaps per minute \(.*\) exceed .*: it is capped at 7\.5/);
  });

  it('lifts the 7.5 cap when the snaps are under the threshold', () => {
    const ok = report({
      checks: [{ id: 'CHK-026', result: 'PASS', evidence: ['x'] }, { id: 'CHK-027', result: 'PASS', evidence: ['x'] }],
      continuity: { checks: { 'CHK-026': 'PASS', 'CHK-027': 'PASS' }, motion: { snapsPerMinute: c.motion.snapsPerMinuteMax } },
      subScores: { characterModels: 9.0, animation: 9.0 },
    });
    expect(continuityCaps(ok, policy)).toEqual([]);
  });

  it('wants the measured snaps per minute in the report when CHK-027 has a result', () => {
    const e = continuityCaps(report({ continuity: { checks: { 'CHK-026': 'FAIL', 'CHK-027': 'FAIL' } } }), policy);
    expect(e.join('\n')).toMatch(/continuity\.motion\.snapsPerMinute must be the number the harness measured/);
  });

  it('puts no cap on an UNVERIFIED check, and still wants it recorded with its reason', () => {
    const unverified = report({
      checks: [{ id: 'CHK-026', result: 'UNVERIFIED', reason: 'the page ran at 12 fps' }, { id: 'CHK-027', result: 'UNVERIFIED', reason: 'the page ran at 12 fps' }],
      continuity: { checks: { 'CHK-026': 'UNVERIFIED', 'CHK-027': 'UNVERIFIED' } },
      subScores: { characterModels: 8.2, animation: 7.9 },
    });
    expect(continuityCaps(unverified, policy)).toEqual([]);
    const noReason = report({ checks: [{ id: 'CHK-026', result: 'UNVERIFIED' }, { id: 'CHK-027', result: 'UNVERIFIED', reason: 'x' }], continuity: { checks: {} }, subScores: { characterModels: 5 } });
    expect(validateReport(noReason, policy).join('\n')).toMatch(/CHK-026: UNVERIFIED needs a reason/);
  });

  it('requires both checks to be recorded in a deep or milestone report with subScores from the day the caps begin', () => {
    const none = report({ checks: [], continuity: undefined, subScores: { characterModels: 6, animation: 6 } });
    const e = continuityCaps(none, policy);
    expect(e.join('\n')).toMatch(/CHK-026 must be recorded/);
    expect(e.join('\n')).toMatch(/CHK-027 must be recorded/);
    expect(continuityCaps({ ...none, review: 'milestone' }, policy)).toHaveLength(2);
  });

  it('refuses a PASS recorded for a check the harness output says fails', () => {
    const laundered = report({ checks: [{ id: 'CHK-026', result: 'PASS', evidence: ['x'] }, { id: 'CHK-027', result: 'PASS', evidence: ['x'] }], subScores: { characterModels: 9, animation: 9 } });
    expect(continuityCaps(laundered, policy).join('\n')).toMatch(/CHK-026 is recorded PASS but the harness output in report\.continuity says FAIL/);
  });

  it('leaves older reports and other reviews alone', () => {
    const before = report({ date: '2026-10-04T12:00:00.000Z', checks: [], continuity: undefined, subScores: { characterModels: 9.9, animation: 9.9 } });
    expect(continuityCaps(before, policy)).toEqual([]);
    expect(continuityCaps({ ...report({ subScores: { characterModels: 9.9, animation: 9.9 } }), review: 'focused' }, policy)).toEqual([]);
    expect(continuityCaps(report({ subScores: undefined }), policy)).toEqual([]);
  });

  it('keeps every report already on record valid (rounds 19 to 21 carry subScores)', () => {
    const dir = resolve(ROOT, 'critic', 'rounds');
    const withSub = readdirSync(dir).filter((f) => /^round-\d+b?\.json$/.test(f)).map((f) => ({ f, r: JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as CriticReport })).filter((x) => x.r.subScores);
    expect(withSub.length).toBeGreaterThanOrEqual(3);
    for (const { f, r } of withSub) expect(continuityCaps(r, policy), f).toEqual([]);
  });
});

describe('the whole run\'s aggregate', () => {
  const chapter = (id: string, over: Record<string, unknown> = {}): ChapterResult => ({
    chapter: id, game: 'ffx', checks: { 'CHK-026': { result: 'PASS' }, 'CHK-027': { result: 'PASS' } }, strips: [{ file: 'a.jpg' }],
    summary: {
      battleSeconds: 120, swaps: 40, counted: 38,
      size: { maxHeadJumpPct: 1.5, maxHeadJumpPctRegistration: 1.5, headOverTolerance: 0, maxFeetShiftPx: 1, feetOverTolerance: 0, headMeasured: 38, headRegistration: 30 },
      motion: { snaps: 0, hardCuts: 0, ghostSwaps: 10, ghostFrames: 30, worstGhostSeverity: 0.3, ghostOverFail: 0, jerks: 2, worstJerkPx: 30, jerksOverFail: 0, lowestIou: 0.5, maxCentroidShiftPx: 10 },
    },
    ...over,
  });

  it('counts snaps per minute over all the battle seconds, takes the worst of each number and keeps a clean run clean', () => {
    const first = chapter('a');
    const allowed = Math.floor(c.motion.snapsPerMinuteMax * 4); // 4 minutes of battle in all: as many snaps as the threshold allows
    (first.summary!['motion'] as Record<string, number>)['snaps'] = allowed;
    const a = aggregate([first, chapter('b')], c);
    expect(a.battleSeconds).toBe(240);
    expect(a.motion['snaps']).toBe(allowed);
    expect(a.motion['snapsPerMinute']).toBe(allowed / 4);
    expect(a.size['maxHeadJumpPct']).toBe(1.5);
    expect(a.checks['CHK-026'].result).toBe('PASS');
    expect(a.checks['CHK-027'].result).toBe('PASS');
    // one more snap than the threshold allows turns CHK-027 over
    (first.summary!['motion'] as Record<string, number>)['snaps'] = allowed + 1;
    expect(aggregate([first, chapter('b')], c).checks['CHK-027'].result).toBe('FAIL');
  });

  it('fails a run when one chapter\'s numbers are over, whichever chapter it was', () => {
    const bad = chapter('b');
    (bad.summary!['size'] as Record<string, number>)['headOverTolerance'] = 3;
    (bad.summary!['motion'] as Record<string, number>)['jerksOverFail'] = 1;
    const a = aggregate([chapter('a'), bad], c);
    expect(a.checks['CHK-026'].result).toBe('FAIL');
    expect(a.checks['CHK-027'].result).toBe('FAIL');
  });

  it('never lets a chapter that could not be verified turn into a pass', () => {
    const lost: ChapterResult = { chapter: 'c', summary: null, checks: { 'CHK-026': { result: 'UNVERIFIED', reasons: ['no battle'] }, 'CHK-027': { result: 'UNVERIFIED', reasons: ['no battle'] } } };
    const a = aggregate([chapter('a'), chapter('b'), lost], c);
    expect(a.checks['CHK-026'].result).toBe('UNVERIFIED');
    expect(a.checks['CHK-026'].reasons.join(' ')).toMatch(/not verified in: c/);
    // but it never hides another chapter's failure
    const bad = chapter('b');
    (bad.summary!['size'] as Record<string, number>)['headOverTolerance'] = 1;
    expect(aggregate([chapter('a'), bad, lost], c).checks['CHK-026'].result).toBe('FAIL');
  });
});
