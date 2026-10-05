/**
 * The central actions ledger: docs/target/actions.json (one entry per line), the Markdown it renders to
 * (ACTIONS.md) and the tool that does both (tools/actions-ledger.mjs).
 *
 *   1. the real data file is well formed, ACTIONS.md is current, and every decision it links exists;
 *   2. every line of docs/deploys.log that existed when the ledger began has a deploy row;
 *   3. the validator rejects a malformed ledger, field by field, including the privacy rules of a public repository;
 *   4. the renderer groups by day, newest first, escapes what Markdown would swallow, and the staleness check bites.
 *
 * Game case: both (shared records and tooling; no game behaviour).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FIRST_DAY, GAMES, KINDS, checkLedger, compareLedger, loadActions, renderActions, validateActions,
  type ActionRow, type ActionsFile,
} from '../../tools/actions-ledger.mjs';

const ROOT = resolve(__dirname, '..', '..');

/** A valid row, with any field overridden. */
const row = (over: Partial<ActionRow> = {}): ActionRow => ({
  id: 'A-0001', date: '2026-09-15', kind: 'process', title: 'A title', what: 'What was done.', who: 'driver session',
  decisions: [], game: 'both', result: 'done', evidence: ['commit abc1234'], reversible: { value: true, how: 'revert the commit' },
  ...over,
});
const ledger = (...rows: ActionRow[]): ActionsFile => ({ actions: rows });
const problemsOf = (...rows: ActionRow[]) => validateActions(ledger(...rows));

describe('1. the real ledger', () => {
  const data = loadActions(ROOT);

  it('is well formed', () => {
    expect(validateActions(data)).toEqual([]);
  });

  it('is rendered into a current ACTIONS.md', () => {
    expect(checkLedger(ROOT)).toEqual({ ok: true, problems: [] });
  });

  it('starts on the day the project began and uses every kind', () => {
    expect(data.actions[0]?.date).toBe(FIRST_DAY);
    const used = new Set(data.actions.map((r) => r.kind));
    for (const k of KINDS) expect(used.has(k), `kind ${k} is never used`).toBe(true);
  });

  it('links only decisions that exist in docs/target/decisions.json', () => {
    const known = new Set<string>((JSON.parse(readFileSync(resolve(ROOT, 'docs/target/decisions.json'), 'utf8')) as { decisions: { id: string }[] }).decisions.map((d) => d.id));
    const unknown = data.actions.flatMap((r) => r.decisions.filter((d) => d.startsWith('D-') && !known.has(d)).map((d) => `${r.id} ${d}`));
    expect(unknown).toEqual([]);
  });
});

describe('2. every deploy that existed when the ledger began has a row', () => {
  const data = loadActions(ROOT);
  const lines = readFileSync(resolve(ROOT, 'docs/deploys.log'), 'utf8').split(/\r?\n/).filter(Boolean).slice(1);
  const LEDGERED = 43; // docs/deploys.log lines 1 to 43 were covered on 2026-10-04; later deploys get a row when they are recorded

  it('has at least the 43 lines the ledger covers', () => {
    expect(lines.length).toBeGreaterThanOrEqual(LEDGERED);
  });

  it('names the deployed main sha and bundle in the row for each of those lines', () => {
    for (let i = 0; i < LEDGERED; i++) {
      const fields: Record<string, string> = {};
      for (const f of (lines[i] ?? '').split('\t').slice(1)) {
        const [k = '', v = ''] = f.split('=');
        fields[k] = v;
      }
      const hit = data.actions.find((r) => r.kind === 'deploy' && r.evidence.includes(`docs/deploys.log line ${i + 1}`));
      expect(hit, `no deploy row for docs/deploys.log line ${i + 1}`).toBeDefined();
      expect(hit?.title, `row ${hit?.id}`).toContain(`main ${(fields.main ?? '').slice(0, 7)}`);
      expect(hit?.title, `row ${hit?.id}`).toContain(`bundle ${fields.bundle ?? ''}`);
    }
  });
});

describe('3. the validator rejects a malformed ledger', () => {
  it('accepts a minimal valid row and a valid pair of rows', () => {
    expect(problemsOf(row())).toEqual([]);
    expect(problemsOf(row(), row({ id: 'A-0002', kind: 'deploy', game: 'FFX-2', decisions: ['D-004', 'E-001'] }))).toEqual([]);
  });

  it('rejects data that is not an object with an actions array, and an empty ledger', () => {
    expect(validateActions(null)).not.toEqual([]);
    expect(validateActions([])).not.toEqual([]);
    expect(validateActions({ actions: 'x' })).not.toEqual([]);
    expect(validateActions({ actions: [] })).toContain('the ledger has no rows');
  });

  it('rejects a row that is not an object, lacks a field or carries an unknown one', () => {
    expect(validateActions({ actions: [5] })).toContain('row #1: not an object');
    const { evidence, ...short } = row();
    expect(evidence).toBeDefined();
    expect(validateActions({ actions: [short] })).toContain('A-0001: missing field "evidence"');
    expect(validateActions({ actions: [{ ...row(), extra: 1 }] })).toContain('A-0001: unknown field "extra"');
  });

  it('rejects a bad, duplicate or non-increasing id', () => {
    expect(problemsOf(row({ id: 'B-0001' }))).toContain('B-0001: id must look like A-0001');
    expect(problemsOf(row({ id: 'A-1' }))).not.toEqual([]);
    expect(problemsOf(row(), row())).toContain('A-0001: duplicate id');
    expect(problemsOf(row({ id: 'A-0005' }), row({ id: 'A-0003' }))).toContain('A-0003: ids must increase down the file (append new rows at the end)');
  });

  it('rejects an impossible date, a wrong format and a date before the project began', () => {
    for (const date of ['2026-02-30', '2026-9-15', '15/09/2026', '2026-09-14', '']) {
      expect(problemsOf(row({ date })), `date ${date}`).not.toEqual([]);
    }
  });

  it('rejects an unknown kind or game', () => {
    expect(problemsOf(row({ kind: 'chore' }))).toContain(`A-0001: kind must be one of ${KINDS.join(', ')}`);
    expect(problemsOf(row({ game: 'FF7' }))).toContain(`A-0001: game must be one of ${GAMES.join(', ')}`);
  });

  it('rejects empty, padded, multi-line or over-long text fields', () => {
    for (const k of ['title', 'what', 'who', 'result'] as const) {
      const only = (text: string) => ({ [k]: text }) as Partial<ActionRow>;
      expect(problemsOf(row(only(''))), `${k} empty`).not.toEqual([]);
      expect(problemsOf(row(only(' padded'))), `${k} padded`).not.toEqual([]);
      expect(problemsOf(row(only('two\nlines'))), `${k} multi-line`).not.toEqual([]);
    }
    expect(problemsOf(row({ title: 'x'.repeat(221) }))).not.toEqual([]);
    expect(problemsOf(row({ what: 'x'.repeat(2401) }))).not.toEqual([]);
  });

  it('rejects a decisions field that is not a list of unique D- or E- ids', () => {
    expect(problemsOf(row({ decisions: 'D-004' as unknown as string[] }))).not.toEqual([]);
    expect(problemsOf(row({ decisions: ['D-4'] }))).not.toEqual([]);
    expect(problemsOf(row({ decisions: ['d-004'] }))).not.toEqual([]);
    expect(problemsOf(row({ decisions: ['D-004', 'D-004'] }))).not.toEqual([]);
  });

  it('rejects evidence that is empty or not made of one-line strings', () => {
    expect(problemsOf(row({ evidence: [] }))).not.toEqual([]);
    expect(problemsOf(row({ evidence: [''] }))).not.toEqual([]);
    expect(problemsOf(row({ evidence: [7 as unknown as string] }))).not.toEqual([]);
  });

  it('rejects a reversible field that is not {value: boolean, how: text}', () => {
    expect(problemsOf(row({ reversible: { value: 'yes' as unknown as boolean, how: 'x' } }))).not.toEqual([]);
    expect(problemsOf(row({ reversible: { value: true, how: '' } }))).not.toEqual([]);
    expect(problemsOf(row({ reversible: { value: true, how: 'x', extra: 1 } as unknown as ActionRow['reversible'] }))).not.toEqual([]);
    expect(problemsOf(row({ reversible: true as unknown as ActionRow['reversible'] }))).not.toEqual([]);
  });

  it('rejects the private details a public repository must never carry, in any text field', () => {
    const email = ['someone', 'example.com'].join(String.fromCharCode(64));
    const hex = 'a1b2c3d4'.repeat(4); // 32 hex characters, the shape of a Cloudflare account id
    expect(problemsOf(row({ what: `Mailed ${email}.` }))).toContain('A-0001.what: contains an at sign (no email addresses; write "account #1", "#2" or "#3")');
    expect(problemsOf(row({ title: `Account ${hex}` })).join(' ')).toContain('long hex id');
    expect(problemsOf(row({ evidence: [`token ${hex}`] })).join(' ')).toContain('long hex id');
    expect(problemsOf(row({ result: `paid with the card ending in ${'12' + '34'}` })).join(' ')).toContain('payment card digits');
    expect(problemsOf(row({ reversible: { value: true, how: 'Visa 4111 1111 1111 1111' } })).join(' ')).toContain('payment card digits');
  });

  it('allows a 40-character git sha and ordinary game words such as the advisor card at 1600x900', () => {
    const sha40 = '1b339718e0'.repeat(4); // 40 hex characters, the length of a full commit sha
    expect(problemsOf(row({ evidence: [`critic/reviews/${sha40}-focused.md`], what: 'The advisor card sits at 1600 by 900 beside the intent card.' }))).toEqual([]);
  });
});

describe('4. the renderer and the staleness check', () => {
  const two = ledger(
    row({ id: 'A-0001', date: '2026-09-15', kind: 'infrastructure', title: 'First day', decisions: ['D-001'] }),
    row({ id: 'A-0002', date: '2026-09-16', kind: 'deploy', title: 'Alpha 1', game: 'FFX', evidence: ['commit abc1234', 'docs/deploys.log line 1'], result: 'shipped', reversible: { value: false, how: 'cannot be unpublished' } }),
  );
  const md = renderActions(two);

  it('lists the newest day first and the newest row first inside a day', () => {
    expect(md.indexOf('### 2026-09-16')).toBeGreaterThan(-1);
    expect(md.indexOf('### 2026-09-16')).toBeLessThan(md.indexOf('### 2026-09-15'));
    const same = renderActions(ledger(row({ id: 'A-0001', title: 'Older' }), row({ id: 'A-0002', title: 'Newer' })));
    expect(same.indexOf('Newer')).toBeLessThan(same.indexOf('Older'));
  });

  it('prints every field of a row as a compact sub-bullet list', () => {
    expect(md).toContain('- **A-0002** · `deploy` · FFX · **Alpha 1**');
    expect(md).toContain('  - Result: shipped');
    expect(md).toContain('  - Evidence: `commit abc1234` · `docs/deploys.log line 1`');
    expect(md).toContain('  - Reversible: no, cannot be unpublished');
    expect(md).toContain('  - Who: driver session · Decisions: D-001');
  });

  it('summarises the rows by kind and by month', () => {
    expect(md).toContain('- **Rows:** 2, from 2026-09-15 to 2026-09-16 (ids A-0001 to A-0002)');
    expect(md).toContain('| infrastructure | 1 |');
    expect(md).toContain('| September 2026 | 2 |');
  });

  it('escapes the characters Markdown or HTML would swallow', () => {
    const out = renderActions(ledger(row({ title: 'A <menu> chip', what: 'A *bold* name_with_underscores [link]' })));
    expect(out).toContain('A &lt;menu&gt; chip');
    expect(out).toContain('A \\*bold\\* name\\_with\\_underscores \\[link\\]');
  });

  it('renders the same text twice and ends with exactly one newline', () => {
    expect(renderActions(two)).toBe(md);
    expect(md.endsWith('\n')).toBe(true);
    expect(md.endsWith('\n\n')).toBe(false);
  });

  it('reports a stale ACTIONS.md, ignores line endings, and refuses a malformed ledger', () => {
    expect(compareLedger(two, md)).toEqual([]);
    expect(compareLedger(two, md.replace(/\n/g, '\r\n'))).toEqual([]);
    expect(compareLedger(two, `${md}\nextra`)).toEqual(['ACTIONS.md is stale: run node tools/actions-ledger.mjs and commit the result']);
    expect(compareLedger(ledger(row({ kind: 'chore' })), md)).not.toEqual([]);
  });
});
