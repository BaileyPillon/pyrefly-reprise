/**
 * THE REVIEW OF THE RELEASE 73 MERGE (`origin/r73` 843f07f62; 2026-11-02): the findings that are about what the cut can and cannot do, and what the browser jobs predict.
 *
 * FINDING 1 (major, ship gate; BOTH games' plumbing, FFX only for the chapter): Chapter XVIII (Sin's face) was back on `TREATED_CHAPTERS` with its CHK-027 proof only OWED. The chapter was release 71's HOLD cause;
 * "unknown on a critical is a HOLD" (critic/RUBRIC.md section 3); the lane had loosened the guard so that "OWED" passed, and nothing stopped a cut that still said OWED. The fix keeps the candidate as the lane built it
 * and makes the cut refuse: `tools/owed-lifts.mjs` (`findOwedLifts`) is read by `resolveReleaseGate` (tools/deploy-pages.mjs) as a fourth refusal, which `--skip-tests` does not skip and only the owner's own
 * words turn into a warning; the guard test now also requires a NAMED report to read CHK-027 PASS for the chapter, not only to exist.
 *
 * FINDING 3 (minor, job specs): J73-2/J73-3 (and the lane's F-1/F-2) predicted CHK-026 PASS for Chapter XVIII. The last read (`critic/reviews/4c01379d4-focused`) has CHK-026 FAIL there (46 swaps over the head
 * tolerance, worst 15.5 percent, 0.1 percent where the head is registered), the same as on the control and on live: unchanged by the delta, not a regression, not the lift's criterion. The predictions now say so.
 *
 * (Finding 2, the forced-fast arm, is `r73-merge-review-fast-arm.test.ts`: it needs the real `Input` and a DOM.)
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { TREATED_CHAPTERS } from '../../src/engine/motion/DemoGate.ts';
import { resolveReleaseGate } from '../../tools/deploy-pages.mjs';
import { LIFT_NOTES, findOwedLifts, isListedInSource, liftReportVerdict } from '../../tools/owed-lifts.mjs';

const ROOT = process.cwd();
const text = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const ID = 'sin-face';
const NOTE = 'docs/handoff/booth-b4.md';
const CAUSE = 'cause the house strike played at the fast playback speed, repaired by StrikeCurve.crossingFloors (r73-fast), CHK-027 against ?treated=pack at normal AND fast speed';

// ---- a scratch tree: the three files the module reads, written per case ---------------------------------------------------------------------------------------------------------------------------------
const made: string[] = [];
function tree(opts: { listed?: boolean; commented?: boolean; line?: string | null; reports?: Record<string, unknown> }): string {
  const root = mkdtempSync(join(tmpdir(), 'owed-lifts-'));
  made.push(root);
  const put = (rel: string, body: string): void => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  };
  const rows = [
    `  // 'sin-face': { game: 'ffx', since: 'r71' } is only a comment here`,
    `  'seymour-flux': { game: 'ffx', since: 'r60' },`,
    ...(opts.listed ? [`  'sin-face': { game: 'ffx', since: 'r71' },`] : []),
    `  'mirror-aeons': { game: 'ffx', since: 'r71' },`,
  ];
  put('src/engine/motion/DemoGate.ts', `export const TREATED_CHAPTERS: Readonly<Record<string, TreatedEntry>> = Object.freeze({\n${rows.join('\n')}\n});\n\nexport const AFTER = { 'sin-face': 1 };\n`);
  put(NOTE, `# note\n\nprose that mentions SIN-FACE LIFT: in the middle of a line\n\n${opts.line === null ? '' : `SIN-FACE LIFT: ${opts.line}\n`}\nmore prose\n`);
  for (const [rel, body] of Object.entries(opts.reports ?? {})) put(rel, JSON.stringify(body));
  return root;
}
afterAll(() => {
  for (const r of made) rmSync(r, { recursive: true, force: true });
});
const report = (rows: Array<[string, string]>): unknown => ({ continuity: { chapters: rows.map(([chapter, c27]) => ({ chapter, checks: { 'CHK-026': 'FAIL', 'CHK-027': c27 } })) } });
const REPORT = 'critic/reviews/abcdef123-focused.json';

describe('finding 1: a listed chapter whose lift proof is OWED blocks the cut (tools/owed-lifts.mjs)', () => {
  it('the table is data: one row, Chapter XVIII, the note and marker the guard test reads, CHK-027', () => {
    expect(LIFT_NOTES).toEqual([{ id: ID, label: "Chapter XVIII (Sin's face)", note: NOTE, marker: 'SIN-FACE LIFT:', check: 'CHK-027' }]);
  });

  it('reads the list from the source the way the real list says it: every listed id is found, a comment or an unlisted id is not', () => {
    for (const id of Object.keys(TREATED_CHAPTERS)) expect(isListedInSource(ROOT, id), id).toBe(true);
    for (const id of ['sin-fins-core', 'exp-leblanc', 'not-a-chapter', 'sin']) expect(isListedInSource(ROOT, id), id).toBe(false);
    const scratch = tree({ listed: false, line: CAUSE });
    expect(isListedInSource(scratch, ID)).toBe(false); // the commented line and the key after the block do not count
    expect(isListedInSource(scratch, 'mirror-aeons')).toBe(true);
    expect(isListedInSource(tree({ listed: true, line: CAUSE }), ID)).toBe(true);
  });

  it('the REAL tree: while the lift line says OWED the chapter is owed (the cut would refuse); the day it names a report that reads PASS it is not', () => {
    const line = text(NOTE).match(/^SIN-FACE LIFT: (.*)$/m);
    const owed = findOwedLifts(ROOT);
    if (!Object.keys(TREATED_CHAPTERS).includes(ID)) {
      expect(owed).toEqual([]);
      expect(line, 'a lift line with the chapter off the list is a half-made change').toBeNull();
      return;
    }
    expect(line).not.toBeNull();
    const named = line![1]!.match(/critic\/reviews\/[0-9a-f]{7,40}-(?:focused|live|deep)\.json/);
    if (named) {
      expect(owed).toEqual([]);
      expect(liftReportVerdict(ROOT, named[0], ID, 'CHK-027').state).toBe('pass');
    } else {
      expect(line![1]).toMatch(/OWED/);
      expect(owed).toHaveLength(1);
      expect(owed[0]!.id).toBe(ID);
      expect(owed[0]!.why).toMatch(/still OWED/);
    }
  });

  it('a scratch tree, case by case: OWED is owed; a report that reads PASS is not; FAIL, a missing file, no run of the chapter, one failing run among two, and no line at all are owed', () => {
    const cases: Array<[string, Parameters<typeof tree>[0], RegExp | null]> = [
      ['OWED', { listed: true, line: `${CAUSE}, OWED: jobs F-1 to F-2 on the next focused review, specs in docs/handoff/r73-fast.md` }, /still OWED/],
      ['PASS', { listed: true, line: `${CAUSE}, report ${REPORT}`, reports: { [REPORT]: report([['sin-face', 'PASS']]) } }, null],
      ['PASS, two runs (normal and fast)', { listed: true, line: `${CAUSE}, report ${REPORT}`, reports: { [REPORT]: report([['sin-face', 'PASS'], ['sin-face', 'PASS'], ['mirror-aeons', 'FAIL']]) } }, null],
      ['FAIL', { listed: true, line: `${CAUSE}, report ${REPORT}`, reports: { [REPORT]: report([['sin-face', 'FAIL']]) } }, /CHK-027 FAIL for sin-face/],
      ['one run fails', { listed: true, line: `${CAUSE}, report ${REPORT}`, reports: { [REPORT]: report([['sin-face', 'PASS'], ['sin-face', 'FAIL']]) } }, /CHK-027 FAIL for sin-face/],
      ['UNVERIFIED', { listed: true, line: `${CAUSE}, report ${REPORT}`, reports: { [REPORT]: report([['sin-face', 'UNVERIFIED']]) } }, /CHK-027 UNVERIFIED for sin-face/],
      ['the report is missing', { listed: true, line: `${CAUSE}, report ${REPORT}` }, /does not exist/],
      ['the report holds no run of the chapter', { listed: true, line: `${CAUSE}, report ${REPORT}`, reports: { [REPORT]: report([['mirror-aeons', 'PASS']]) } }, /holds no continuity run of sin-face/],
      ['no lift line', { listed: true, line: null }, /carries no "SIN-FACE LIFT:" line/],
      ['the chapter is off the list', { listed: false, line: `${CAUSE}, OWED: jobs F-1 to F-2` }, null],
      ['the chapter is off the list and the line is gone', { listed: false, line: null }, null],
    ];
    for (const [name, opts, why] of cases) {
      const owed = findOwedLifts(tree(opts));
      if (why === null) expect(owed, name).toEqual([]);
      else {
        expect(owed, name).toHaveLength(1);
        expect(owed[0]!.id, name).toBe(ID);
        expect(owed[0]!.why, name).toMatch(why);
      }
    }
    const bad = tree({ listed: true, line: `${CAUSE}, report ${REPORT}` }); // the named report exists but is not JSON
    mkdirSync(join(bad, 'critic/reviews'), { recursive: true });
    writeFileSync(join(bad, REPORT), '{ not json');
    expect(liftReportVerdict(bad, REPORT, ID, 'CHK-027')).toEqual({ state: 'unreadable', detail: `${REPORT} is not JSON` });
    expect(findOwedLifts(bad)[0]!.why).toMatch(/is not JSON/);
  });
});

describe('finding 1: the release gate turns each owed lift into a refusal (and --owner-override alone makes it a warning)', () => {
  const none = { focusedBeforeDeploy: false, deepBeforeDeploy: false, evidence: null, ownerOverrideWords: null };
  const lift = { id: ID, label: "Chapter XVIII (Sin's face)", why: "Chapter XVIII (Sin's face) is on the treated list while its CHK-027 run is still OWED" };

  it('no owed lift: nothing changes (the gate proceeds, with no refusals, as before)', () => {
    expect(resolveReleaseGate({ ...none })).toEqual({ action: 'proceed', refusals: [] });
    expect(resolveReleaseGate({ ...none, owedLifts: [] })).toEqual({ action: 'proceed', refusals: [] });
  });

  it('one owed lift: the deploy fails, the message names the chapter and the rule, even when no review is required for the change', () => {
    const gate = resolveReleaseGate({ ...none, owedLifts: [lift] });
    expect(gate.action).toBe('fail');
    expect(gate.refusals).toHaveLength(1);
    expect(gate.message).toMatch(/Chapter XVIII \(Sin's face\) is on the treated list while its CHK-027 run is still OWED/);
    expect(gate.message).toMatch(/unknown on a critical is a HOLD/);
  });

  it('it stacks with the other refusals, and the owner\'s own words turn them into a warning that lists it', () => {
    const stacked = resolveReleaseGate({ focusedBeforeDeploy: true, deepBeforeDeploy: false, evidence: null, ownerOverrideWords: null, owedLifts: [lift] });
    expect(stacked.action).toBe('fail');
    expect(stacked.refusals).toHaveLength(2);
    const overridden = resolveReleaseGate({ ...none, ownerOverrideWords: 'Bailey: ship it', owedLifts: [lift] });
    expect(overridden.action).toBe('proceed-with-warning');
    expect(overridden.warningLines?.join('\n')).toMatch(/CHK-027 run is still OWED/);
  });

  it('is wired: deploy-pages.mjs imports findOwedLifts and hands the real tree\'s answer to the gate on every run (a dry run included), and --skip-tests does not reach it', () => {
    const src = text('tools/deploy-pages.mjs');
    expect(src).toMatch(/import \{ findOwedLifts \} from '\.\/owed-lifts\.mjs';/);
    expect(src).toMatch(/owedLifts: findOwedLifts\(ROOT\),/);
    const fn = src.slice(src.indexOf('function releaseGateFor'), src.indexOf('The `docs/deploys.log` line for one run'));
    expect(fn).toContain('findOwedLifts(ROOT)');
    expect(fn).not.toMatch(/SKIP_TESTS/);
    expect(src.match(/releaseGateFor\(/g)!.length).toBeGreaterThanOrEqual(3); // the definition, the dry run and the real run
  });

  it('the guard test reads a NAMED report through liftReportVerdict and wants PASS (a report that only exists is not a lift)', () => {
    const guard = text('tests/unit/booth-b4-r71-sin-face-off.test.ts');
    expect(guard).toContain("liftReportVerdict(process.cwd(), report[0], ID, 'CHK-027')");
    expect(guard).toMatch(/expect\(verdict\.state, verdict\.detail\)\.toBe\('pass'\)/);
    expect(guard).not.toMatch(/existsSync\(resolve\(report\[0\]\)\)/);
  });

  it('the handoff note says the OWED form does not survive the cut, and what to do about it', () => {
    const note = text(NOTE);
    const section = note.slice(note.indexOf('## 15.'));
    expect(section).toMatch(/release gate refuses/);
    expect(section).toContain('tools/owed-lifts.mjs');
    expect(section).toMatch(/CHK-027 PASS/);
  });
});

describe('finding 3: the predictions for Chapter XVIII do not say CHK-026 PASS; they say what the last read says', () => {
  const REVIEW = JSON.parse(text('critic/reviews/4c01379d4-focused.json')) as {
    continuity: { chapters: Array<{ chapter: string; checks: Record<string, string>; maxHeadJumpPct: number }> };
    checks: Array<{ id: string; result: string; reason: string }>;
  };
  const sin = REVIEW.continuity.chapters.find((c) => c.chapter === ID)!;

  it('the read the specs now cite: CHK-026 FAIL on Sin\'s face (46 swaps, worst 15.5 percent), unchanged by that delta and not a regression', () => {
    expect(sin.checks['CHK-026']).toBe('FAIL');
    expect(sin.maxHeadJumpPct).toBe(15.5);
    const chk = REVIEW.checks.find((c) => c.id === 'CHK-026')!;
    expect(chk.reason).toMatch(/XVIII 46, 15\.5/);
    expect(chk.reason).toMatch(/not a regression/);
  });

  const ROWS: Array<[string, string, RegExp]> = [
    ['docs/handoff/r73.md', 'J73-2', /^\| \*\*J73-2\*\*.*$/m],
    ['docs/handoff/r73.md', 'J73-3', /^\| \*\*J73-3\*\*.*$/m],
    ['docs/handoff/r73-fast.md', 'F-1', /^\| \*\*F-1\*\*.*$/m],
    ['docs/handoff/r73-fast.md', 'F-2', /^\| \*\*F-2\*\*.*$/m],
    ['docs/handoff/r73-sinface.md', 'J-2', /^\| \*\*J-2\*\*.*$/m],
  ];
  it.each(ROWS)('%s, job %s: no "CHK-026 ... PASS", and the row says CHK-026 reads FAIL as on the control (46 swaps, worst 15.5 percent) and that the lift reads CHK-027 only', (file, job, re) => {
    const row = text(file).match(re)?.[0];
    expect(row, `${file} has the ${job} row`).toBeTruthy();
    expect(row).not.toMatch(/CHK-026 and CHK-027 PASS/);
    expect(row).not.toMatch(/CHK-026 PASS/);
    expect(row).toMatch(/CHK-027 PASS/);
    expect(row).toMatch(/CHK-026 FAIL/);
    expect(row).toMatch(/46 swaps/);
    expect(row).toMatch(/15\.5 percent/);
    expect(row).toMatch(/4c01379d4/);
    expect(row).toMatch(/not a regression|not the lift/);
  });

  it('Chapter VIII\'s row (J73-4 and F-3) reads "PASS" for CHK-027 only: its CHK-026 was FAIL at 4c01379d4 too (19 swaps, worst 15.5 percent)', () => {
    for (const [file, re] of [['docs/handoff/r73.md', /^\| \*\*J73-4\*\*.*$/m], ['docs/handoff/r73-fast.md', /^\| \*\*F-3\*\*.*$/m]] as const) {
      const row = text(file).match(re)![0];
      expect(row, file).toMatch(/CHK-027 PASS/);
      expect(row, file).toMatch(/CHK-026 FAIL/);
      expect(row, file).toMatch(/19 swaps/);
    }
    const viii = REVIEW.continuity.chapters.find((c) => c.chapter === 'evrae-airship')!;
    expect(viii.checks).toEqual({ 'CHK-026': 'FAIL', 'CHK-027': 'PASS' });
  });
});
