/**
 * THE RELEASE CUT REFUSES A LIFTED HUD HOLD WITH NO BROWSER PROOF (r74-omnis review, finding M1, major; 2026-11-02; BOTH games' plumbing, FFX only for the chapter).
 *
 * The lane lifted Chapter XII's `hud` hold, the hold that was release 72's HOLD cause for that chapter, on a MODEL of the recorded walks. The only protection was the handoff note's prose and a test that pins the prose, so a cut
 * that carried the commit could deploy with the cursor-walk jobs J74-1 to J74-7 unread, and `critic-plan` calls the change FOCUSED only. `tools/owed-lifts.mjs` (r73 merge review, finding 1) is keyed on "chapter on the list plus
 * a CHK-027 report", which does not fit a piece; `tools/owed-hold-lifts.mjs` is the second kind: a lifted PIECE hold, the handoff note's `OMNIS-HUD LIFT:` line, and a proof report that holds every job at its numbers. `resolveReleaseGate`
 * (tools/deploy-pages.mjs) turns each owed lift into a refusal, which `--skip-tests` does not skip and only the owner's own words turn into a warning.
 *
 * What this file pins: the table; the text reader against the real hold tables (so a moved or renamed row cannot make the gate silently pass); the real tree (owed today, clear the day the line names a passing report, and
 * nothing owed when the hold is back); the scratch-tree cases (no line, OWED, a report that is missing, unreadable, of something else, short a job, reading FAIL, a pair, an error, a diff over the bound, PASS); the gate; the wiring.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { PIECE_HOLDS, TREATED_CHAPTERS, TREATED_PIECES } from '../../src/engine/motion/DemoGate.ts';
import { resolveReleaseGate } from '../../tools/deploy-pages.mjs';
import { REPORT_RE } from '../../tools/owed-lifts.mjs';
import { HOLD_LIFTS, findOwedHoldLifts, holdIsInSource, holdLiftReportVerdict } from '../../tools/owed-hold-lifts.mjs';

const ROOT = process.cwd();
const text = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const OMNIS = 'seymour-omnis';
const NOTE = 'docs/handoff/r74-omnis.md';
const REPORT = 'critic/reviews/r74-omnis-hudwalk.json';
const row = HOLD_LIFTS[0]!;
const JOBS = ['J74-1', 'J74-2', 'J74-3', 'J74-4', 'J74-5', 'J74-6', 'J74-7'];

// ---- a scratch tree: the files the module reads, written per case -------------------------------------------------------------------------------------------------------------------------------------------------
const made: string[] = [];
afterAll(() => {
  for (const r of made) rmSync(r, { recursive: true, force: true });
});
const goodJob = (id: string): Record<string, unknown> => (id === 'J74-4' ? { verdict: 'PASS', consoleErrors: 0, maxDiffPx: 1.2 } : ['J74-6'].includes(id) ? { verdict: 'PASS', consoleErrors: 0 } : id === 'J74-1' ? { verdict: 'PASS', pairs: 0, textOverlaps: 0, consoleErrors: 0 } : { verdict: 'PASS', pairs: 0, consoleErrors: 0 });
function proof(over: Record<string, unknown> = {}, jobs: Record<string, Record<string, unknown> | null> = {}): unknown {
  const all: Record<string, unknown> = Object.fromEntries(JOBS.map((j) => [j, goodJob(j)]));
  for (const [j, v] of Object.entries(jobs)) {
    if (v === null) delete all[j];
    else all[j] = { ...goodJob(j), ...v };
  }
  return { review: 'lift-proof', lift: 'omnis-hud', chapter: OMNIS, piece: 'hud', verdicts: { liftProof: 'PASS' }, jobs: all, ...over };
}
function tree(opts: { listed?: boolean; holdsHud?: boolean; line?: string | null; reports?: Record<string, unknown> }): string {
  const root = mkdtempSync(join(tmpdir(), 'owed-hold-lifts-'));
  made.push(root);
  const put = (rel: string, body: string): void => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  };
  const rows = [`  // '${OMNIS}': { game: 'ffx', since: 'r71' } is only a comment here`, `  'seymour-flux': { game: 'ffx', since: 'r60' },`, ...(opts.listed === false ? [] : [`  '${OMNIS}': { game: 'ffx', since: 'r71' },`]), `  'mirror-aeons': { game: 'ffx', since: 'r71' },`];
  put('src/engine/motion/DemoGate.ts', `export const TREATED_CHAPTERS: Readonly<Record<string, TreatedEntry>> = Object.freeze({\n${rows.join('\n')}\n});\n`);
  put(
    'src/engine/motion/PieceHolds.ts',
    [
      'export const PIECE_HOLDS = Object.freeze({',
      "  'yunalesca': Object.freeze({",
      "    breath:\n      'x',",
      '  }),',
      `  '${OMNIS}': Object.freeze({`,
      '    // hud: this comment names the key and is not one',
      "    breath:\n      'a string',",
      ...(opts.holdsHud ? ["    hud:\n      'FFX, Chapter XII: the F1 HUD waits. Lifts when ...',"] : []),
      "    cam:\n      'a string',",
      '  }),',
      "  'isaaru-via-purifico': Object.freeze({",
      "    hud: 'another chapter holds hud, which is no business of this one',",
      '  }),',
      '});',
      '',
    ].join('\n'),
  );
  put(NOTE, `# note\n\nprose that mentions OMNIS-HUD LIFT: in the middle of a line\n\n${opts.line === null ? '' : `OMNIS-HUD LIFT: ${opts.line}\n`}\nmore prose\n`);
  for (const [rel, body] of Object.entries(opts.reports ?? {})) put(rel, JSON.stringify(body));
  return root;
}
const OWED_LINE = 'OWED: jobs J74-1 to J74-7 have not run';
const NAMED_LINE = `the jobs J74-1 to J74-7 read 0 pairs, report ${REPORT}`;

describe('the table is data: the first row is the lifted hud hold of Chapter XII, its note and marker, and the seven jobs with their numbers', () => {
  it('shape', () => {
    expect(HOLD_LIFTS).toHaveLength(2); // Chapter XII's, then Chapter XVII's (r74-int review MAJOR-2: tests/unit/r74-fins-gate.test.ts)
    expect(HOLD_LIFTS[0]!.id).toBe('omnis-hud');
    expect({ id: row.id, chapter: row.chapter, piece: row.piece, note: row.note, marker: row.marker }).toEqual({ id: 'omnis-hud', chapter: OMNIS, piece: 'hud', note: NOTE, marker: 'OMNIS-HUD LIFT:' });
    expect(Object.keys(row.jobs)).toEqual(JOBS);
    expect(row.jobs['J74-1']!.zero).toEqual(['pairs', 'textOverlaps', 'consoleErrors']);
    expect(row.jobs['J74-4']).toEqual({ zero: ['consoleErrors'], atMost: { maxDiffPx: 1.5 } });
    for (const j of JOBS) expect(row.jobs[j as keyof typeof row.jobs]!.zero, j).toContain('consoleErrors');
  });

  it('the report path the note tells the next lane to write is one the lift line may name (REPORT_RE), and a lift proof, not a review of a sha', () => {
    expect(REPORT.match(REPORT_RE)?.[0]).toBe(REPORT);
    expect(/critic\/reviews\/[0-9a-f]{7,40}-(?:focused|live|deep)\.json/.test(REPORT)).toBe(false);
    const note = text(NOTE);
    const section = note.slice(note.indexOf('**The proof report'), note.indexOf('## 7. '));
    expect(section).toContain(REPORT);
    expect(section).toContain('"review": "lift-proof"');
    expect(section).toContain('"lift": "omnis-hud"');
    for (const j of JOBS) expect(section, j).toContain(`"${j}"`);
  });

  it('the jobs of the table are the jobs of section 6 of the note, one for one', () => {
    const note = text(NOTE);
    const jobs = note.slice(note.indexOf('## 6. '), note.indexOf('**The proof report'));
    expect([...jobs.matchAll(/\*\*(J74-\d)\*\*/g)].map((m) => m[1])).toEqual(JOBS);
  });
});

describe('holdIsInSource reads the hold tables as the tables are', () => {
  it('agrees with the real PIECE_HOLDS for every chapter and every piece (a renamed or moved row cannot make the gate pass silently)', () => {
    let checked = 0;
    for (const [id, rows] of Object.entries(PIECE_HOLDS)) {
      for (const piece of TREATED_PIECES) {
        expect(holdIsInSource(ROOT, id, piece), `${id} ${piece}`).toBe(Object.prototype.hasOwnProperty.call(rows, piece));
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(Object.keys(PIECE_HOLDS)).toContain('sin-face'); // a chapter whose rows live in PieceHoldsLast.ts is read there
    expect(holdIsInSource(ROOT, 'sin-face', 'breath')).toBe(true);
    expect(holdIsInSource(ROOT, OMNIS, 'hud')).toBe(true); // the lift this lane made, put back by the r74 browser read (2026-11-03): the hold is in place, so nothing is owed
    expect(holdIsInSource(ROOT, 'sin-fins-core', 'hud')).toBe(true); // and Chapter XVII holds hud from the same read
    expect(holdIsInSource(ROOT, OMNIS, 'breath')).toBe(true);
    expect(holdIsInSource(ROOT, 'not-a-chapter', 'hud')).toBe(false);
  });

  it('a comment that names the key is not the key, and another chapter\'s hud row is not this chapter\'s', () => {
    expect(holdIsInSource(tree({ holdsHud: false }), OMNIS, 'hud')).toBe(false);
    expect(holdIsInSource(tree({ holdsHud: true }), OMNIS, 'hud')).toBe(true);
    expect(holdIsInSource(tree({ holdsHud: false }), 'isaaru-via-purifico', 'hud')).toBe(true);
    expect(holdIsInSource(tree({ holdsHud: false }), 'yunalesca', 'hud')).toBe(false);
  });
});

describe('the REAL tree: while the hud hold is lifted and the line names no passing report the cut would refuse; the day the line names one, or the hold is back, nothing is owed', () => {
  it('the invariant, whichever state the tree is in', () => {
    expect(Object.keys(TREATED_CHAPTERS)).toContain(OMNIS);
    const lifted = !Object.prototype.hasOwnProperty.call(PIECE_HOLDS[OMNIS]!, 'hud');
    const owed = findOwedHoldLifts(ROOT).filter((o) => o.id === 'omnis-hud'); // Chapter XVII's row answers beside it (tests/unit/r74-fins-gate.test.ts)
    if (!lifted) {
      expect(owed, 'the hold is in place: nothing to prove').toEqual([]);
      return;
    }
    const line = text(NOTE).match(/^OMNIS-HUD LIFT: (.*)$/m);
    expect(line, 'a lifted hold needs its lift line').not.toBeNull();
    const named = line![1]!.match(REPORT_RE);
    if (named) {
      expect(owed).toEqual([]);
      expect(holdLiftReportVerdict(ROOT, named[0], row).state).toBe('pass');
    } else {
      expect(line![1]).toMatch(/OWED/);
      expect(owed).toHaveLength(1);
      expect(owed[0]!.id).toBe('omnis-hud');
      expect(owed[0]!.why).toMatch(/still OWED/);
      expect(owed[0]!.why).toContain('J74-1');
      expect(owed[0]!.why).toContain('J74-7');
    }
  });

  it('the cut: with the real tree\'s answer the gate fails while owed (no review is needed for the refusal to stand), and only the owner\'s own words make it a warning', () => {
    const owed = findOwedHoldLifts(ROOT).filter((o) => o.id === 'omnis-hud');
    const none = { focusedBeforeDeploy: false, deepBeforeDeploy: false, evidence: null, ownerOverrideWords: null };
    const gate = resolveReleaseGate({ ...none, owedHoldLifts: owed });
    if (owed.length === 0) {
      expect(gate.action).toBe('proceed');
      return;
    }
    expect(gate.action).toBe('fail');
    expect(gate.message).toMatch(/Chapter XII's F1 HUD/);
    expect(gate.message).toMatch(/unknown on a critical is a HOLD/);
    const over = resolveReleaseGate({ ...none, ownerOverrideWords: 'Bailey: ship it', owedHoldLifts: owed });
    expect(over.action).toBe('proceed-with-warning');
    expect(over.warningLines?.join('\n')).toMatch(/still OWED/);
  });
});

describe('a scratch tree, case by case', () => {
  const cases: Array<[string, Parameters<typeof tree>[0], RegExp | null]> = [
    ['OWED', { line: OWED_LINE }, /still OWED/],
    ['no lift line', { line: null }, /carries no "OMNIS-HUD LIFT:" line/],
    ['the report is missing', { line: NAMED_LINE }, /does not exist/],
    ['PASS', { line: NAMED_LINE, reports: { [REPORT]: proof() } }, null],
    ['the hold is back in place (nothing was lifted)', { holdsHud: true, line: OWED_LINE }, null],
    ['the hold is back and the line is gone', { holdsHud: true, line: null }, null],
    ['the chapter is off the list', { listed: false, line: OWED_LINE }, null],
    ['a proof of something else', { line: NAMED_LINE, reports: { [REPORT]: proof({ piece: 'breath' }) } }, /is not a proof of omnis-hud/],
    ['a proof of another lift', { line: NAMED_LINE, reports: { [REPORT]: proof({ lift: 'sin-face' }) } }, /is not a proof of omnis-hud/],
    ['a job missing', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-7': null }) } }, /holds no entry for J74-7/],
    ['two jobs missing', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-5': null, 'J74-6': null }) } }, /holds no entry for J74-5, J74-6/],
    ['a job reads FAIL', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-3': { verdict: 'FAIL' } }) } }, /J74-3 reads FAIL/],
    ['a job reads UNVERIFIED', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-2': { verdict: 'UNVERIFIED' } }) } }, /J74-2 reads UNVERIFIED/],
    ['a job with no verdict', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-6': { verdict: undefined } }) } }, /J74-6 reads no verdict/],
    ['a pair left in J74-1 under a PASS written over it', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-1': { pairs: 1 } }) } }, /J74-1 pairs is 1, not 0/],
    ['a text overlap in J74-1', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-1': { textOverlaps: 2 } }) } }, /J74-1 textOverlaps is 2, not 0/],
    ['a count left out', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-7': { pairs: undefined } }) } }, /J74-7 pairs is missing, not 0/],
    ['a console error in the fight through', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-6': { consoleErrors: 3 } }) } }, /J74-6 consoleErrors is 3, not 0/],
    ['a diff over the bound in J74-4', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-4': { maxDiffPx: 1.6 } }) } }, /J74-4 maxDiffPx is 1.6, over 1.5/],
    ['J74-4 with no diff measured', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'J74-4': { maxDiffPx: undefined } }) } }, /J74-4 maxDiffPx is missing, over 1.5/],
  ];
  for (const [name, opts, why] of cases) {
    it(name, () => {
      const owed = findOwedHoldLifts(tree(opts));
      if (why === null) expect(owed).toEqual([]);
      else {
        expect(owed).toHaveLength(1);
        expect(owed[0]!.id).toBe('omnis-hud');
        expect(owed[0]!.why).toMatch(why);
      }
    });
  }

  it('a report that is not JSON is unreadable, and a line that names a path only in prose before the marker is not the lift line', () => {
    const bad = tree({ line: NAMED_LINE });
    mkdirSync(join(bad, 'critic/reviews'), { recursive: true });
    writeFileSync(join(bad, REPORT), '{ not json');
    expect(holdLiftReportVerdict(bad, REPORT, row)).toEqual({ state: 'unreadable', detail: `${REPORT} is not JSON` });
    expect(findOwedHoldLifts(bad)[0]!.why).toMatch(/is not JSON/);
    const prose = tree({ line: OWED_LINE, reports: { [REPORT]: proof() } }); // a passing report exists, but the line does not name it
    expect(findOwedHoldLifts(prose)[0]!.why).toMatch(/still OWED/);
  });
});

describe('the release gate turns an owed hold lift into a refusal', () => {
  const none = { focusedBeforeDeploy: false, deepBeforeDeploy: false, evidence: null, ownerOverrideWords: null };
  const lift = { id: 'omnis-hud', label: "Chapter XII's F1 HUD (the lifted `hud` hold)", why: "Chapter XII's F1 HUD (the lifted `hud` hold): the \"hud\" hold of seymour-omnis is lifted on a model while the browser jobs are still OWED" };

  it('nothing owed: the gate is what it always was', () => {
    expect(resolveReleaseGate({ ...none })).toEqual({ action: 'proceed', refusals: [] });
    expect(resolveReleaseGate({ ...none, owedHoldLifts: [] })).toEqual({ action: 'proceed', refusals: [] });
  });

  it('one owed hold lift: the deploy fails and says why; it stacks with an owed chapter lift and with a missing review; the owner\'s own words make it a warning that lists it', () => {
    const gate = resolveReleaseGate({ ...none, owedHoldLifts: [lift] });
    expect(gate.action).toBe('fail');
    expect(gate.refusals).toHaveLength(1);
    expect(gate.message).toMatch(/lifted on a model while the browser jobs are still OWED/);
    expect(gate.message).toMatch(/unknown on a critical is a HOLD/);
    const both = resolveReleaseGate({ ...none, focusedBeforeDeploy: true, owedLifts: [{ id: 'sin-face', label: 'x', why: 'y' }], owedHoldLifts: [lift] });
    expect(both.refusals).toHaveLength(3);
    const over = resolveReleaseGate({ ...none, ownerOverrideWords: 'Bailey: ship it', owedHoldLifts: [lift] });
    expect(over.action).toBe('proceed-with-warning');
    expect(over.warningLines?.join('\n')).toMatch(/still OWED/);
  });

  it('is wired: deploy-pages.mjs imports findOwedHoldLifts and hands the real tree\'s answer to the gate on every run, and --skip-tests does not reach it; the chapter-lift wiring is untouched', () => {
    const src = text('tools/deploy-pages.mjs');
    expect(src).toMatch(/import \{ findOwedHoldLifts \} from '\.\/owed-hold-lifts\.mjs';/);
    expect(src).toMatch(/owedHoldLifts: findOwedHoldLifts\(ROOT\),/);
    expect(src).toMatch(/owedLifts: findOwedLifts\(ROOT\),/);
    const fn = src.slice(src.indexOf('function releaseGateFor'), src.indexOf('The `docs/deploys.log` line for one run'));
    expect(fn).toContain('findOwedHoldLifts(ROOT)');
    expect(fn).not.toMatch(/SKIP_TESTS/);
    expect(src).toMatch(/for \(const lift of \[\.\.\.owedLifts, \.\.\.owedHoldLifts\]\) refusals\.push\(/);
  });

  it('the handoff note says the cut refuses and what to do about it', () => {
    const note = text(NOTE);
    const top = note.slice(0, note.indexOf('## 1. '));
    expect(top).toContain('tools/owed-hold-lifts.mjs');
    expect(top).toMatch(/`npm run deploy` refuses/);
    expect(top).toMatch(/^OMNIS-HUD LIFT: /m);
    expect(top).toMatch(/J74-1 to J74-7/);
  });
});
