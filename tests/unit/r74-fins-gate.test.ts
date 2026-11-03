/**
 * THE RELEASE CUT REFUSES CHAPTER XVII ON OFFLINE PROOF ALONE (r74-int review, MAJOR-2, 2026-11-03; BOTH games' plumbing, FFX only for the chapter).
 *
 * `docs/handoff/r74-fins.md` says a candidate that carries the Fin plate's move "must not reach production before FIN-1 to FIN-4 and FIN-9 have run and read as predicted", and the chapter is on `TREATED_CHAPTERS` on
 * arithmetic only (the plate's width read from the font file, no browser). The merge kept the mechanism that enforces exactly this for Chapter XII (`tools/owed-hold-lifts.mjs`, one row), and nothing enforced it for
 * Chapter XVII: `findOwedHoldLifts` and `findOwedLifts` reported the Chapter XII walk as owed and said nothing of the Fin plate. The second row, `fins-hud`, is the stop. What this file pins: the row; its jobs against the
 * note's section 7; the real tree (owed today, clear the day the `FINS-HUD LIFT:` line names a passing report, and nothing owed when a `hud` hold row is back); the scratch-tree cases (no line, OWED, a missing, unreadable,
 * foreign or short report, a job reading FAIL, a pair, an error, a sky number over its bound, PASS); the gate; and the note's marker and report shape.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { PIECE_HOLDS, TREATED_CHAPTERS } from '../../src/engine/motion/DemoGate.ts';
import { resolveReleaseGate } from '../../tools/deploy-pages.mjs';
import { REPORT_RE } from '../../tools/owed-lifts.mjs';
import { HOLD_LIFTS, findOwedHoldLifts, holdIsInSource, holdLiftReportVerdict } from '../../tools/owed-hold-lifts.mjs';

const ROOT = process.cwd();
const text = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const FINS = 'sin-fins-core';
const NOTE = 'docs/handoff/r74-fins.md';
const REPORT = 'critic/reviews/r74-fins-hudwalk.json';
const row = HOLD_LIFTS.find((r) => r.id === 'fins-hud')!;
const JOBS = ['FIN-1', 'FIN-2', 'FIN-3', 'FIN-4', 'FIN-9'];

// ---- a scratch tree: the files the module reads, written per case -------------------------------------------------------------------------------------------------------------------------------------------------
const made: string[] = [];
afterAll(() => {
  for (const r of made) rmSync(r, { recursive: true, force: true });
});
const goodJob = (id: string): Record<string, unknown> =>
  id === 'FIN-4' ? { verdict: 'PASS', consoleErrors: 0, skyOver240Pct: 0.4, frameOver240DeltaPct: 0.2, meanLumaDiff: 2.5 } : id === 'FIN-3' ? { verdict: 'PASS', consoleErrors: 0 } : { verdict: 'PASS', pairs: 0, consoleErrors: 0 };
function proof(over: Record<string, unknown> = {}, jobs: Record<string, Record<string, unknown> | null> = {}): unknown {
  const all: Record<string, unknown> = Object.fromEntries(JOBS.map((j) => [j, goodJob(j)]));
  for (const [j, v] of Object.entries(jobs)) {
    if (v === null) delete all[j];
    else all[j] = { ...goodJob(j), ...v };
  }
  return { review: 'lift-proof', lift: 'fins-hud', chapter: FINS, piece: 'hud', verdicts: { liftProof: 'PASS' }, jobs: all, ...over };
}
function tree(opts: { listed?: boolean; holdsHud?: boolean; line?: string | null; reports?: Record<string, unknown> }): string {
  const root = mkdtempSync(join(tmpdir(), 'owed-fins-lift-'));
  made.push(root);
  const put = (rel: string, body: string): void => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  };
  const rows = [`  // '${FINS}': { game: 'ffx', since: 'r74' } is only a comment here`, `  'sin-face': { game: 'ffx', since: 'r71' },`, ...(opts.listed === false ? [] : [`  '${FINS}': { game: 'ffx', since: 'r74' },`]), `  'mirror-aeons': { game: 'ffx', since: 'r71' },`];
  put('src/engine/motion/DemoGate.ts', `export const TREATED_CHAPTERS: Readonly<Record<string, TreatedEntry>> = Object.freeze({\n${rows.join('\n')}\n});\n`);
  put(
    'src/engine/motion/PieceHoldsLast.ts',
    [
      'export const LAST_HOLDS = Object.freeze({',
      "  'sin-face': Object.freeze({",
      "    hud:\n      'another chapter holds hud, which is no business of this one',",
      '  }),',
      `  '${FINS}': Object.freeze({`,
      '    // hud: this comment names the key and is not one',
      "    hd2d:\n      'a string',",
      ...(opts.holdsHud ? ["    hud:\n      'FFX, Chapter XVII: the F1 HUD waits. Lifts when ...',"] : []),
      "    real:\n      'a string',",
      '  }),',
      '});',
      '',
    ].join('\n'),
  );
  put(NOTE, `# note\n\nprose that mentions FINS-HUD LIFT: in the middle of a line\n\n${opts.line === null ? '' : `FINS-HUD LIFT: ${opts.line}\n`}\nmore prose\n`);
  for (const [rel, body] of Object.entries(opts.reports ?? {})) put(rel, JSON.stringify(body));
  return root;
}
const OWED_LINE = 'OWED: jobs FIN-1 to FIN-4 and FIN-9 have not run';
const NAMED_LINE = `the jobs FIN-1 to FIN-4 and FIN-9 read 0 pairs, report ${REPORT}`;

describe('the table is data: the second row is Chapter XVII, its note and marker, and the five jobs of its hold condition with their numbers', () => {
  it('shape', () => {
    expect(HOLD_LIFTS.map((r) => r.id)).toEqual(['omnis-hud', 'fins-hud']);
    expect({ id: row.id, chapter: row.chapter, piece: row.piece, note: row.note, marker: row.marker }).toEqual({ id: 'fins-hud', chapter: FINS, piece: 'hud', note: NOTE, marker: 'FINS-HUD LIFT:' });
    expect(Object.keys(row.jobs)).toEqual(JOBS);
    expect(row.jobs['FIN-1']).toEqual({ zero: ['pairs', 'consoleErrors'], atMost: {} });
    expect(row.jobs['FIN-2']).toEqual({ zero: ['pairs', 'consoleErrors'], atMost: {} });
    expect(row.jobs['FIN-3']).toEqual({ zero: ['consoleErrors'], atMost: {} });
    expect(row.jobs['FIN-4']).toEqual({ zero: ['consoleErrors'], atMost: { skyOver240Pct: 1.0, frameOver240DeltaPct: 1.0, meanLumaDiff: 6 } });
    expect(row.jobs['FIN-9']).toEqual({ zero: ['pairs', 'consoleErrors'], atMost: {} });
    for (const j of JOBS) expect(row.jobs[j]!.zero, j).toContain('consoleErrors');
  });

  it('the chapter-lift mechanism of Chapter XVIII is untouched, and the Chapter XII row keeps its seven jobs', () => {
    expect(Object.keys(HOLD_LIFTS[0]!.jobs)).toEqual(['J74-1', 'J74-2', 'J74-3', 'J74-4', 'J74-5', 'J74-6', 'J74-7']);
    expect(HOLD_LIFTS[0]!.marker).toBe('OMNIS-HUD LIFT:');
  });

  it('the jobs of the table are jobs of section 7 of the note, and they are the five the hold condition names (FIN-1 to FIN-4 and FIN-9)', () => {
    const note = text(NOTE);
    const jobs = note.slice(note.indexOf('## 7. '), note.indexOf('## 8. '));
    const listed = [...jobs.matchAll(/^\| \*\*(FIN-\d+)\*\*/gm)].map((m) => m[1]);
    for (const j of JOBS) expect(listed, j).toContain(j);
    const hold = note.slice(note.indexOf('> **HOLD CONDITION'), note.indexOf('## 1. '));
    expect(hold).toMatch(/FIN-1 to FIN-4 and FIN-9/);
  });

  it('the report path the note tells the next lane to write is one the lift line may name (REPORT_RE), and a lift proof, not a review of a sha', () => {
    expect(REPORT.match(REPORT_RE)?.[0]).toBe(REPORT);
    expect(/critic\/reviews\/[0-9a-f]{7,40}-(?:focused|live|deep)\.json/.test(REPORT)).toBe(false);
    const note = text(NOTE);
    const section = note.slice(note.indexOf('## 13. '));
    expect(section).toContain(REPORT); // the file the section tells the lane to write
    expect(section).toContain('"review": "lift-proof"');
    expect(section).toContain('"lift": "fins-hud"');
    expect(section).toContain('"piece": "hud"');
    for (const j of JOBS) expect(section, j).toContain(`"${j}"`);
    for (const f of ['skyOver240Pct', 'frameOver240DeltaPct', 'meanLumaDiff']) expect(section, f).toContain(`"${f}"`);
  });
});

describe('holdIsInSource reads Chapter XVII\'s row as the tables are', () => {
  it('the real tables: the chapter holds six pieces and `hud` is not one of them; another chapter\'s `hud` row is not this chapter\'s', () => {
    expect(Object.keys(PIECE_HOLDS[FINS]!).sort()).toEqual(['arena', 'breath', 'cam', 'hd2d', 'moments', 'real']);
    expect(holdIsInSource(ROOT, FINS, 'hud')).toBe(false);
    expect(holdIsInSource(ROOT, FINS, 'real')).toBe(true);
    expect(holdIsInSource(ROOT, FINS, 'breath')).toBe(true);
  });

  it('a comment that names the key is not the key, and another chapter\'s hud row is not this chapter\'s (a row of PieceHoldsLast.ts)', () => {
    expect(holdIsInSource(tree({ holdsHud: false }), FINS, 'hud')).toBe(false);
    expect(holdIsInSource(tree({ holdsHud: true }), FINS, 'hud')).toBe(true);
    expect(holdIsInSource(tree({ holdsHud: false }), 'sin-face', 'hud')).toBe(true);
  });
});

describe('the REAL tree: while the plate\'s move stands on arithmetic and the line names no passing report the cut would refuse; the day the line names one, or a hud hold is back, nothing is owed', () => {
  it('the invariant, whichever state the tree is in', () => {
    expect(Object.keys(TREATED_CHAPTERS)).toContain(FINS);
    const held = Object.prototype.hasOwnProperty.call(PIECE_HOLDS[FINS]!, 'hud');
    const owed = findOwedHoldLifts(ROOT).filter((o) => o.id === 'fins-hud');
    if (held) {
      expect(owed, 'the hold is in place: nothing to prove').toEqual([]);
      return;
    }
    const line = text(NOTE).match(/^FINS-HUD LIFT: (.*)$/m);
    expect(line, 'the HUD plays on a model, so the note needs its lift line').not.toBeNull();
    const named = line![1]!.match(REPORT_RE);
    if (named) {
      expect(owed).toEqual([]);
      expect(holdLiftReportVerdict(ROOT, named[0], row).state).toBe('pass');
    } else {
      expect(line![1]).toMatch(/OWED/);
      expect(owed).toHaveLength(1);
      expect(owed[0]!.why).toMatch(/still OWED/);
      expect(owed[0]!.why).toContain('FIN-1');
      expect(owed[0]!.why).toContain('FIN-9');
    }
  });

  it('the cut: with the real tree\'s answer the gate fails while Chapter XVII is owed (no review is needed for the refusal to stand), and only the owner\'s own words make it a warning', () => {
    const owed = findOwedHoldLifts(ROOT).filter((o) => o.id === 'fins-hud');
    const none = { focusedBeforeDeploy: false, deepBeforeDeploy: false, evidence: null, ownerOverrideWords: null };
    const gate = resolveReleaseGate({ ...none, owedHoldLifts: owed });
    if (owed.length === 0) {
      expect(gate.action).toBe('proceed');
      return;
    }
    expect(gate.action).toBe('fail');
    expect(gate.message).toMatch(/Chapter XVII's F1 HUD/);
    expect(gate.message).toMatch(/unknown on a critical is a HOLD/);
    const over = resolveReleaseGate({ ...none, ownerOverrideWords: 'Bailey: ship it', owedHoldLifts: owed });
    expect(over.action).toBe('proceed-with-warning');
    expect(over.warningLines?.join('\n')).toMatch(/still OWED/);
  });
});

describe('a scratch tree, case by case', () => {
  const cases: Array<[string, Parameters<typeof tree>[0], RegExp | null]> = [
    ['OWED', { line: OWED_LINE }, /still OWED/],
    ['no lift line', { line: null }, /carries no "FINS-HUD LIFT:" line/],
    ['the report is missing', { line: NAMED_LINE }, /does not exist/],
    ['PASS', { line: NAMED_LINE, reports: { [REPORT]: proof() } }, null],
    ['a hud hold is back in place (nothing was lifted)', { holdsHud: true, line: OWED_LINE }, null],
    ['a hud hold is back and the line is gone', { holdsHud: true, line: null }, null],
    ['the chapter is off the list', { listed: false, line: OWED_LINE }, null],
    ['a proof of something else', { line: NAMED_LINE, reports: { [REPORT]: proof({ piece: 'breath' }) } }, /is not a proof of fins-hud/],
    ['a proof of the other lift', { line: NAMED_LINE, reports: { [REPORT]: proof({ lift: 'omnis-hud' }) } }, /is not a proof of fins-hud/],
    ['a proof of another chapter', { line: NAMED_LINE, reports: { [REPORT]: proof({ chapter: 'seymour-omnis' }) } }, /is not a proof of fins-hud/],
    ['FIN-9 missing', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-9': null }) } }, /holds no entry for FIN-9/],
    ['FIN-1 and FIN-4 missing', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-1': null, 'FIN-4': null }) } }, /holds no entry for FIN-1, FIN-4/],
    ['FIN-3 reads FAIL', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-3': { verdict: 'FAIL' } }) } }, /FIN-3 reads FAIL/],
    ['FIN-2 reads UNVERIFIED', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-2': { verdict: 'UNVERIFIED' } }) } }, /FIN-2 reads UNVERIFIED/],
    ['a job with no verdict', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-9': { verdict: undefined } }) } }, /FIN-9 reads no verdict/],
    ['a pair left in FIN-1 under a PASS written over it', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-1': { pairs: 1 } }) } }, /FIN-1 pairs is 1, not 0/],
    ['a pair in FIN-9 (the banner against the plate)', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-9': { pairs: 2 } }) } }, /FIN-9 pairs is 2, not 0/],
    ['a count left out', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-2': { pairs: undefined } }) } }, /FIN-2 pairs is missing, not 0/],
    ['a console error in the paths that keep today\'s', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-3': { consoleErrors: 4 } }) } }, /FIN-3 consoleErrors is 4, not 0/],
    ['the sky band over its share', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-4': { skyOver240Pct: 1.2 } }) } }, /FIN-4 skyOver240Pct is 1.2, over 1/],
    ['the whole frame over the control by more than a point', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-4': { frameOver240DeltaPct: 1.5 } }) } }, /FIN-4 frameOver240DeltaPct is 1.5, over 1/],
    ['the mean luma 7 levels off the control', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-4': { meanLumaDiff: 7 } }) } }, /FIN-4 meanLumaDiff is 7, over 6/],
    ['FIN-4 with no luma measured', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-4': { meanLumaDiff: undefined } }) } }, /FIN-4 meanLumaDiff is missing, over 6/],
    ['FIN-4 at its bounds exactly (1, 1 and 6 pass)', { line: NAMED_LINE, reports: { [REPORT]: proof({}, { 'FIN-4': { skyOver240Pct: 1.0, frameOver240DeltaPct: 1.0, meanLumaDiff: 6 } }) } }, null],
  ];
  for (const [name, opts, why] of cases) {
    it(name, () => {
      const owed = findOwedHoldLifts(tree(opts));
      if (why === null) expect(owed).toEqual([]);
      else {
        expect(owed).toHaveLength(1);
        expect(owed[0]!.id).toBe('fins-hud');
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

  it('Chapter XII\'s report does not clear Chapter XVII (and the other way): each row needs its own', () => {
    const omnisReport = { review: 'lift-proof', lift: 'omnis-hud', chapter: 'seymour-omnis', piece: 'hud', verdicts: { liftProof: 'PASS' }, jobs: Object.fromEntries(['J74-1', 'J74-2', 'J74-3', 'J74-4', 'J74-5', 'J74-6', 'J74-7'].map((j) => [j, { verdict: 'PASS', pairs: 0, textOverlaps: 0, consoleErrors: 0, maxDiffPx: 1 }])) };
    const t = tree({ line: NAMED_LINE, reports: { [REPORT]: omnisReport } });
    expect(findOwedHoldLifts(t)[0]!.why).toMatch(/is not a proof of fins-hud/);
    expect(holdLiftReportVerdict(t, REPORT, HOLD_LIFTS[0]!).state).toBe('pass');
  });
});

describe('the release gate and the note', () => {
  const none = { focusedBeforeDeploy: false, deepBeforeDeploy: false, evidence: null, ownerOverrideWords: null };
  const lift = { id: 'fins-hud', label: row.label, why: `${row.label}: the "hud" hold of ${FINS} is lifted on a model while the browser jobs FIN-1, FIN-2, FIN-3, FIN-4, FIN-9 are still OWED` };

  it('an owed Chapter XVII row refuses the deploy, stacks with Chapter XII\'s row, and the owner\'s own words make it a warning that lists both', () => {
    const omnis = { id: 'omnis-hud', label: "Chapter XII's F1 HUD (the lifted `hud` hold)", why: "Chapter XII's F1 HUD: lifted on a model while the browser jobs J74-1 are still OWED" };
    const gate = resolveReleaseGate({ ...none, owedHoldLifts: [lift] });
    expect(gate.action).toBe('fail');
    expect(gate.refusals).toHaveLength(1);
    expect(gate.message).toMatch(/Chapter XVII's F1 HUD/);
    const both = resolveReleaseGate({ ...none, owedHoldLifts: [omnis, lift] });
    expect(both.refusals).toHaveLength(2);
    const over = resolveReleaseGate({ ...none, ownerOverrideWords: 'Bailey: ship it', owedHoldLifts: [omnis, lift] });
    expect(over.action).toBe('proceed-with-warning');
    expect(over.warningLines?.join('\n')).toMatch(/Chapter XVII's F1 HUD/);
    expect(over.warningLines?.join('\n')).toMatch(/Chapter XII's F1 HUD/);
  });

  it('every row\'s marker is a line of its note (the reader finds the line by its start), and the top of the Fins note tells the next lane what the cut does', () => {
    for (const r of HOLD_LIFTS) expect(text(r.note), r.id).toMatch(new RegExp(`^${r.marker}`, 'm'));
    const note = text(NOTE);
    const top = note.slice(0, note.indexOf('## 1. '));
    expect(top).toContain('tools/owed-hold-lifts.mjs');
    expect(top).toMatch(/`npm run deploy` refuses/);
    expect(top).toMatch(/^FINS-HUD LIFT: /m);
    expect(top).toMatch(/FIN-1 to FIN-4 and FIN-9/);
  });
});
