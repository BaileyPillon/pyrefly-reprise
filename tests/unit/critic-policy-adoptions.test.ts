/**
 * The six process rules Bailey adopted on 2026-09-21 (docs/plans/scaffold-proposals.md,
 * critic/RUBRIC.md §4 and §6 to §10), proved against the real data files:
 *
 *   1. an issue that consecutive full reviews leave open is reported as stalled;
 *   2. repair attempts are counted, and the cycles per candidate follow the usage mode;
 *   3. the usage modes in policy.json are the ones the rubric prints;
 *   4. a target's delivery status uses a fixed vocabulary, and "verified" names its report;
 *   5. a recorded reaction keeps what Bailey named apart from what an agent guessed;
 *   6. every calibration case has a known answer and a file that confirms it.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadPolicy, stalledIssues, validateReport } from '../../tools/critic-policy.mjs';

const ROOT = resolve(__dirname, '..', '..');
const policy = loadPolicy(ROOT);
const readJson = (rel: string) => JSON.parse(readFileSync(resolve(ROOT, rel), 'utf8'));

const deep = (id: string, issues: object[]) => ({ id, rubricVersion: 2, review: 'deep', issues });
const issue = (id: string, severity = 'major', status = 'open', extra: object = {}) => ({ id, severity, status, title: id, ...extra });

describe('1. the stagnation rule', () => {
  it('reports an issue that two consecutive deep reviews leave open at the same severity', () => {
    const stalled = stalledIssues([deep('round-04', [issue('PR-0009'), issue('PR-0003')]), deep('round-05', [issue('PR-0009'), issue('PR-0003', 'major', 'fixed')])], policy);
    expect(stalled.map((s) => s.id)).toEqual(['PR-0009']);
    expect(stalled[0]?.reason).toBe('open in round-04, round-05');
  });

  it('does not call an issue stalled after one review, after a change of severity, or across a focused pass', () => {
    expect(stalledIssues([deep('round-04', [issue('PR-0009')])], policy)).toEqual([]);
    expect(stalledIssues([deep('round-04', [issue('PR-0009', 'major')]), deep('round-05', [issue('PR-0009', 'polish')])], policy)).toEqual([]);
    const focused = { id: 'abc-focused', rubricVersion: 2, review: 'focused', issues: [issue('PR-0009')] };
    expect(stalledIssues([deep('round-04', [issue('PR-0009')]), focused], policy)).toEqual([]);
  });

  it('ignores rubric v1 rounds: their issue lists are history', () => {
    const v1 = { id: 'round-03', rubricVersion: 1, review: 'full round (old policy)', issues: [issue('PR-0009')] };
    expect(stalledIssues([v1, deep('round-04', [issue('PR-0009')])], policy)).toEqual([]);
  });
});

describe('2. repair attempts and cycles', () => {
  it('flags an open issue that has used up its repair attempts', () => {
    const cap = policy.cadence.repairAttemptsBeforeEscalation;
    const stalled = stalledIssues([deep('round-05', [issue('PR-0009', 'major', 'open', { attempts: cap }), issue('PR-0010', 'major', 'open', { attempts: cap - 1 })])], policy);
    expect(stalled.map((s) => s.id)).toEqual(['PR-0009']);
    expect(stalled[0]?.reason).toBe(`${cap} repair attempts`);
  });

  it('validates attempts when present and leaves reports without it valid', () => {
    const base = { rubricVersion: 2, review: 'focused', build: { mainSha: 'abc1234' }, date: '2026-09-21T00:00:00Z', verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'PASS', milestone: 'not assessed' }, checks: [] };
    expect(validateReport({ ...base, issues: [issue('PR-0001')] }, policy)).toEqual([]);
    expect(validateReport({ ...base, issues: [issue('PR-0001', 'major', 'open', { attempts: 2 })] }, policy)).toEqual([]);
    expect(validateReport({ ...base, issues: [issue('PR-0001', 'major', 'open', { attempts: 'twice' })] }, policy)).toEqual(['PR-0001: attempts must be a whole number of repair attempts']);
  });

  it('allows fewer repair cycles per candidate as the usage mode tightens', () => {
    const c = policy.cadence.repairCyclesPerCandidate;
    expect(c.normal).toBeGreaterThan(c.conserve);
    expect(c.conserve).toBeGreaterThan(c.protect);
    expect(c.protect).toBe(0);
  });
});

describe('3. usage modes', () => {
  it('are contiguous, and the rubric prints the same numbers', () => {
    const m = policy.usageModes;
    expect(m.conserve.weeklyLeftAbove).toBe(m.protect.weeklyLeftAtOrBelow);
    expect(m.normal.weeklyLeftAbove).toBeGreaterThan(m.conserve.weeklyLeftAbove);
    const rubric = readFileSync(resolve(ROOT, 'critic', 'RUBRIC.md'), 'utf8');
    expect(rubric).toContain(`| Normal | more than ${m.normal.weeklyLeftAbove} percent |`);
    expect(rubric).toContain(`| Conserve | ${m.conserve.weeklyLeftAbove} to ${m.normal.weeklyLeftAbove} percent |`);
    expect(rubric).toContain(`| Protect | ${m.protect.weeklyLeftAtOrBelow} percent or less |`);
    expect(rubric).toContain('agents may only tighten it');
  });
});

const DELIVERY = ['not-scheduled', 'in-progress', 'implemented', 'verified'];
const REACTION_LISTS = ['liked', 'disliked', 'mustRemain', 'mustChange', 'undecided', 'inferred'];
type Tile = { label: string; delivery?: string; verifiedBy?: string; reaction?: Record<string, unknown>; reactionOf?: string };
const targets = readJson('docs/target/targets.json');
const tiles: Tile[] = targets.groups.flatMap((g: { tiles: Tile[] }) => g.tiles);

describe('4. delivery status and decision states', () => {
  it('uses the fixed delivery vocabulary, and a verified tile names the report that verified it', () => {
    for (const t of tiles) {
      if (t.delivery === undefined) continue;
      expect(DELIVERY, t.label).toContain(t.delivery);
      if (t.delivery === 'verified') {
        expect(t.verifiedBy, t.label).toMatch(/^critic\/(rounds|reviews)\/\S+\.json @ [0-9a-f]{7,}$/);
        expect(existsSync(resolve(ROOT, String(t.verifiedBy).split(' @ ')[0] ?? '')), t.label).toBe(true);
      } else {
        expect(t.verifiedBy, t.label).toBeUndefined();
      }
    }
  });

  it('keeps every decision in a known state, with a successor when superseded', () => {
    const { decisions } = readJson('docs/target/decisions.json');
    const ids = new Set(decisions.map((d: { id: string }) => d.id));
    expect(ids.size).toBe(decisions.length);
    for (const d of decisions) {
      expect(['proposed', 'adopted', 'deferred', 'rejected', 'superseded', 'verified'], d.id).toContain(d.state);
      expect(['ffx', 'ffx2', 'both'], d.id).toContain(d.game);
      expect([null, ...DELIVERY], d.id).toContain(d.delivery);
      if (d.state === 'superseded') expect(ids.has(d.supersededBy), d.id).toBe(true);
      if (d.state === 'proposed') expect(d.delivery, `${d.id}: nothing is built before a yes`).toBeNull();
    }
  });
});

describe('5. named versus inferred', () => {
  it('records Bailey’s words and all six lists on every reaction', () => {
    const withReaction = tiles.filter((t) => t.reaction);
    expect(withReaction.length).toBeGreaterThan(0);
    for (const t of withReaction) {
      expect(typeof t.reaction?.words, t.label).toBe('string');
      expect(String(t.reaction?.date), t.label).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const k of REACTION_LISTS) expect(Array.isArray(t.reaction?.[k]), `${t.label}: ${k}`).toBe(true);
    }
  });

  it('points every reactionOf at a tile that holds a reaction', () => {
    const holders = new Set(tiles.filter((t) => t.reaction).map((t) => t.label));
    for (const t of tiles.filter((x) => x.reactionOf)) expect(holders.has(String(t.reactionOf)), t.label).toBe(true);
  });
});

describe('6. calibration cases', () => {
  it('each have a known answer, Bailey’s source and a file in the repo that confirms them', () => {
    const { cases } = readJson('critic/calibration/cases.json');
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      expect(['should-fail', 'should-pass'], c.id).toContain(c.kind);
      expect(['ffx', 'ffx2', 'both'], c.id).toContain(c.game);
      for (const k of ['expected', 'source', 'confirmedIn']) expect(String(c[k] ?? '').length, `${c.id}: ${k}`).toBeGreaterThan(10);
      const [file = '', anchor] = String(c.confirmedIn).split(' ');
      expect(existsSync(resolve(ROOT, file)), c.id).toBe(true);
      if (anchor) expect(readFileSync(resolve(ROOT, file), 'utf8'), c.id).toContain(anchor);
    }
  });
});
