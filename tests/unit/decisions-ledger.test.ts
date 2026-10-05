/**
 * The central decisions ledger (DECISIONS.md, rendered by tools/decisions-ledger.mjs), proved against the real data files:
 *
 *   1. the three data files (decisions.json, decisions-early.json, targets.json) validate and keep their ids apart;
 *   2. a blanket yes ("all your recommendations") is never a row of its own: each accepted recommendation says what
 *      was decided and what changed (Bailey, 2026-10-04), and a malformed row fails;
 *   3. a malformed early-decisions file fails, whatever field is wrong;
 *   4. DECISIONS.md is exactly what the data renders, lists every decision and every standing rule in force, and
 *      keeps the public repository free of addresses, card digits, account ids and unrelated private material.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AREAS, STATES, buildEntries, isBlanket, loadModel, render, validateModel } from '../../tools/decisions-ledger-lib.mjs';
import type { DecisionRow, LedgerModel } from '../../tools/decisions-ledger-lib.mjs';

const ROOT = resolve(__dirname, '..', '..');
const AT = String.fromCharCode(64); // the at sign, built so no source line of this public repo holds one
const model = loadModel(ROOT);
const all: DecisionRow[] = [...model.early.decisions, ...model.registry.decisions];
const clone = (): LedgerModel => structuredClone(model);

const goodEarly = (over: Partial<DecisionRow> = {}): DecisionRow => ({
  id: 'E-999', date: '2026-09-17', title: 'A decision stated in full for the test', words: null, state: 'adopted', game: 'both', delivery: null,
  area: 'process', changed: 'What changed because of it, stated in a full sentence for the test.', where: 'tests/unit/decisions-ledger.test.ts', ...over,
});
const withEarly = (row: DecisionRow): LedgerModel => {
  const m = clone();
  m.early.decisions.push(row);
  return m;
};

describe('1. the data files', () => {
  it('validate, and no decision id is used twice across the registry and the early file', () => {
    expect(validateModel(model)).toEqual([]);
    expect(new Set(all.map((d) => d.id)).size).toBe(all.length);
  });

  it('number the early decisions E-001 upward in date order, so no D-number ever has to change', () => {
    const early = model.early.decisions;
    expect(early.length).toBeGreaterThan(40);
    early.forEach((d, i) => expect(d.id).toBe(`E-${String(i + 1).padStart(3, '0')}`));
    for (let i = 1; i < early.length; i += 1) expect(String(early[i]?.date) >= String(early[i - 1]?.date)).toBe(true);
    expect(early[0]?.date).toBe('2026-09-15');
  });

  it('hold D-022 to D-028 again: the seven rows a side session wrote on 2026-09-21 and never committed', () => {
    const ids = new Set(model.registry.decisions.map((d) => d.id));
    for (const n of [22, 23, 24, 25, 26, 27, 28]) expect(ids.has(`D-0${n}`)).toBe(true);
  });

  it('give every decision an area from the fixed vocabulary and a source', () => {
    for (const d of all) {
      expect(AREAS, d.id).toContain(d.area);
      expect(STATES, d.id).toContain(d.state);
      expect(String(d.where).length, d.id).toBeGreaterThan(7);
    }
  });
});

describe('2. a blanket yes is never a row of its own', () => {
  it('recognises the phrasings Bailey uses', () => {
    for (const w of ['all your recommendations', 'I\'ll go with all of your recommendations', 'yes, all your recommendations', 'all your recommendations, godspeed', 'Yes to all recommendations but the title screen needs to match the target.', 'A, B, and C together please.', 'adopt all six', 'Your picks (Recommended)']) expect(isBlanket(w), w).toBe(true);
    for (const w of ['B: hand, ring and a quiet dim', 'Wait line 1', 'Keep the stone look, use Anima\'s approved paintings', null, '']) expect(isBlanket(w), String(w)).toBe(false);
  });

  it('gives every row that records one a "changed" line, or splits it into parts that each have one', () => {
    let blanket = 0;
    for (const d of all) {
      if (!isBlanket(d.words)) continue;
      blanket += 1;
      const parts = d.parts ?? [];
      const own = typeof d.changed === 'string' && d.changed.length >= 20;
      expect(own || (parts.length > 0 && parts.every((p) => p.changed.length >= 20)), `${d.id} says only "${String(d.words).slice(0, 40)}"`).toBe(true);
    }
    expect(blanket).toBeGreaterThan(300);
  });

  it('splits the bundled acceptances (the four chapter preflights, the class-C batch) into one part per recommendation', () => {
    const parts = (id: string) => model.registry.decisions.find((d) => d.id === id)?.parts ?? [];
    expect(parts('D-145').length).toBe(29);
    expect(parts('D-146').length).toBe(25);
    expect(parts('D-147').length).toBe(28);
    expect(parts('D-148').length).toBe(23);
    expect(parts('D-249').length).toBe(8);
    for (const id of ['D-014', 'D-018', 'D-019', 'D-020', 'D-021', 'D-029', 'D-121', 'D-244', 'D-250', 'D-298', 'D-301', 'D-316']) expect(parts(id).length, id).toBeGreaterThan(1);
    for (const id of ['D-145', 'D-018']) expect(new Set(parts(id).map((p) => p.ref)).size).toBe(parts(id).length);
  });

  it('states what changed on each of the twelve answers of the 2026-10-04 morning page (D-371 to D-382)', () => {
    for (let n = 371; n <= 382; n += 1) {
      const d = model.registry.decisions.find((x) => x.id === `D-${n}`);
      expect(d, `D-${n}`).toBeDefined();
      expect(String(d?.changed ?? '').length, `D-${n}`).toBeGreaterThan(80);
    }
  });

  it('records the rule itself as a standing decision (process, both games, adopted)', () => {
    const d = model.registry.decisions.find((x) => /explicility say what changed/.test(String(x.words)));
    expect(d?.state).toBe('adopted');
    expect(d?.area).toBe('process');
    expect(d?.game).toBe('both');
    expect(d?.rule).toBeTruthy();
  });

  it('refuses a row that only repeats the blanket words', () => {
    const m = clone();
    m.registry.decisions.push({ id: 'D-999', date: '2026-10-04', title: 'Something he accepted without naming it', words: 'all your recommendations', state: 'adopted', game: 'both', delivery: null, area: 'process', where: 'tests' });
    expect(validateModel(m).join('\n')).toMatch(/D-999: .*blanket yes/);
    m.registry.decisions.pop();
    expect(validateModel(m)).toEqual([]);
  });
});

describe('3. a malformed early-decisions file fails', () => {
  it('accepts a well-formed row', () => {
    expect(validateModel(withEarly(goodEarly()))).toEqual([]);
  });

  it.each<[string, Partial<DecisionRow>, RegExp]>([
    ['an id that is not E-nnn', { id: 'X-1' }, /X-1: id must look like E-001/],
    ['a D-number in the early file', { id: 'D-998' }, /D-998: id must look like E-001/],
    ['a date before the project began', { date: '2026-09-01' }, /date must be YYYY-MM-DD on or after 2026-09-15/],
    ['a date that is not a day', { date: 'last week' }, /date must be/],
    ['an unknown state', { state: 'maybe' as DecisionRow['state'] }, /unknown state maybe/],
    ['an unknown game case', { game: 'ps2' as DecisionRow['game'] }, /unknown game case ps2/],
    ['a missing area', { area: undefined }, /area must be one of/],
    ['an area outside the vocabulary', { area: 'weather' }, /area must be one of/],
    ['a title that states nothing', { title: 'x' }, /title must state the decision/],
    ['words that are not a string or null', { words: 42 as unknown as string }, /words is Bailey's verbatim quote or null/],
    ['a superseded row with no successor', { state: 'superseded', supersededBy: 'E-000' }, /superseded decisions name an existing successor/],
    ['a proposal that is already being built', { state: 'proposed', delivery: 'in-progress' }, /nothing is built before a yes/],
    ['a blanket yes with no changed line', { words: 'all your recommendations', changed: undefined }, /blanket yes/],
    ['an email address in a quote', { words: `write to me at someone${AT}example.com please` }, /holds an address, card digits or an account id/],
    ['card digits in a note', { changed: 'He paid with a card that ends in 1234 for this and that.' }, /holds an address, card digits or an account id/],
    ['a 32-character account id', { where: `account ${'0123456789abcdef'.repeat(2)} in the dashboard` }, /holds an address, card digits or an account id/],
    ['a part with no changed line', { parts: [{ ref: 'a', title: 'A recommendation stated in full', changed: '' }] }, /part needs a "changed" line/],
    ['two parts with the same ref', { parts: [{ ref: 'a', title: 'First recommendation stated in full', changed: 'What changed because of the first one.' }, { ref: 'a', title: 'Second recommendation stated in full', changed: 'What changed because of the second one.' }] }, /every part needs its own ref/],
    ['a rule that states nothing', { rule: 'x' }, /rule is one line stating the standing rule/],
  ])('rejects %s', (_what, over, expected) => {
    expect(validateModel(withEarly(goodEarly(over))).join('\n')).toMatch(expected);
  });

  it('rejects an id used twice across the two files', () => {
    const m = clone();
    const first = m.registry.decisions[0];
    expect(first).toBeDefined();
    m.early.decisions.push(goodEarly({ id: 'E-998' }), { ...goodEarly({ id: 'E-997' }), id: 'E-998' });
    expect(validateModel(m).join('\n')).toMatch(/duplicate decision ids/);
  });

  it('refuses to render invalid data at all', () => {
    expect(() => render(withEarly(goodEarly({ id: 'bad' })))).toThrow(/decisions data is invalid/);
  });
});

describe('4. DECISIONS.md', () => {
  const file = readFileSync(resolve(ROOT, 'DECISIONS.md'), 'utf8').replace(/\r\n/g, '\n');
  const text = render(model);

  it('is exactly what the data renders (run: node tools/decisions-ledger.mjs)', () => {
    expect(file === text, 'DECISIONS.md is stale: run node tools/decisions-ledger.mjs and commit it with the data change').toBe(true);
  });

  it('lists every written decision, every item split out of a bundle and every picture decision', () => {
    const entries = buildEntries(model);
    for (const e of entries) if (e.id) expect(text.includes(`<a id="${e.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}"></a>`), String(e.id)).toBe(true);
    expect(text.split('\n').filter((l) => l.startsWith('- **Picture**')).length).toBe(entries.filter((e) => e.kind === 'picture').length);
    expect(entries.filter((e) => e.kind === 'picture').length).toBeGreaterThan(100);
  });

  it('lists the standing rules still in force, and only those', () => {
    const section = text.slice(text.indexOf('## Standing rules in force'), text.indexOf("## Waiting on Bailey's yes"));
    const live = all.filter((d) => d.rule && (d.state === 'adopted' || d.state === 'verified'));
    expect(live.length).toBeGreaterThan(20);
    for (const d of live) expect(section.includes(`[${d.id}](#`), d.id).toBe(true);
    for (const d of all.filter((x) => x.rule && x.state === 'superseded')) expect(section.includes(`[${d.id}](#`), d.id).toBe(false);
    for (const word of ['Delegation', 'End state first', 'Game-aware changes', 'Critic policy v2', 'Ship if better than live', 'Never invent game data', 'Never weaken a boss', 'Original assets only', 'Usage modes', 'Progress notes and a changelog', 'Spell out every blanket yes']) expect(section, word).toContain(word);
  });

  it('keeps his words verbatim, typos included', () => {
    expect(text).toContain('explicility say what changed');
    expect(text).toContain('Use my card that ends in [redacted]');
    expect(text).toContain('i want the subdomain to be baileypillon to match the github');
  });

  it('keeps the public repository free of addresses, card digits, account ids and unrelated private material', () => {
    const early = readFileSync(resolve(ROOT, 'docs', 'target', 'decisions-early.json'), 'utf8');
    for (const [name, body] of [['DECISIONS.md', text], ['decisions-early.json', early]] as const) {
      expect(body, `${name}: an email address`).not.toMatch(/[A-Za-z0-9._%+-]+\x40[A-Za-z0-9-]+\.(com|net|org|io|dev|co|app|me|edu|gov)\b/i);
      expect(body, `${name}: card digits`).not.toMatch(/\b(ends|ending) in\s*\d{4}\b/i);
      expect(body, `${name}: a 32-character id`).not.toMatch(/\b[0-9a-f]{32}\b/i);
      expect(body, `${name}: an at sign`).not.toContain(AT);
      expect(body, `${name}: unrelated private material`).not.toMatch(/mirage|endless tower|lifestream|\bCROW\b|malware|backdoor|spyware/i);
    }
  });
});
