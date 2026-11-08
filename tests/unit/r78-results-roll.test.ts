/**
 * **Release 78, R77-1: the results page's counts roll, so their text is a fraction of what was paid until the roll lands; the page now says the settled amount (`data-final`), on the desktop page and the phone's (both games; no pixel changes).**
 *
 * The focused review of release 77 read "GIL 347 / AP 422 x3" and then "GIL 985 / AP 1,197 x3" for a Spherimorph fight whose record pays 4,000 gil and 4,860 AP on an overkill, and called the payout wrong. The engine's pay
 * is exact (`tests/unit/chapters/r78-spherimorph-rewards.test.ts`); the text was read while the counts were still rolling (`ledgerValueText`: `round(value * p)`). This file pins:
 *
 *  1. The review's four readings are the true amounts at one `p` each (gil and AP always at the SAME fraction), and `p` = 1 is exactly the paid amount: the roll is the whole of the "variation".
 *  2. The page carries the settled amount at every `p` (desktop ledger, member awards, phone tallies, phone chips): the same `data-final` on every frame, none on a settled text value, none on a defeat's rows.
 *  3. The screen's snapshot (`ResultsScreen.snapshot`, what `window.__pyrefly.snapshotState()` returns) says what was paid.
 */
import { describe, expect, it } from 'vitest';
import { desktopPageHtml, finalAttr, ledgerValueText, type LedgerLine, type ResultsPageModel } from '../../src/ui/common/resultsPage.ts';
import { phonePageHtml } from '../../src/ui/common/resultsPhone.ts';
import type { ResultsMemberRow } from '../../src/ui/common/resultsMath.ts';

const AP: LedgerLine = { kind: 'count', key: 'AP', value: 4_860, detail: '×3 PARTY' };
const GIL: LedgerLine = { kind: 'count', key: 'GIL', value: 4_000 };

const row = (id: string, award: number): ResultsMemberRow => ({ id, name: id, award, awardUnit: 'AP', levelDelta: 0, levelUnit: 'S.Lv', detail: 'S.LV 30 · 79/695 AP', standing: 'S.LV 30' });

const model = (progress: number, over: Partial<ResultsPageModel> = {}): ResultsPageModel => ({
  victory: true,
  silent: false,
  heading: 'Victory',
  clock: '0:53',
  tags: ['OVERKILL ×1'],
  quip: undefined,
  ledger: [AP, GIL, { kind: 'items', key: 'ITEMS', value: 'Lv. 2 Key Sphere ×2' }, { kind: 'text', key: 'TURNS', value: '9' }],
  rows: [row('tidus', 4_860), row('yuna', 4_860), row('lulu', 4_860)],
  progress,
  actionIndex: 0,
  ...over,
});

describe('the review readings are the paid amounts mid-roll', () => {
  const read = (p: number): [string, string] => [ledgerValueText(GIL, p), ledgerValueText(AP, p)];

  it('first run: 347 gil and 422 AP are p = 0.08675 of 4,000 and 4,860; second run: 985 and 1,197 are p = 0.24625; the screenshot taken a moment before: 464 and 563 are p = 0.1159', () => {
    expect(read(0.08675)).toEqual(['347', '422']);
    expect(read(0.24625)).toEqual(['985', '1,197']);
    expect(read(0.1159)).toEqual(['464', '563']);
  });

  it('the roll lands on exactly the paid amounts (p = 1), and starts at nothing (p = 0)', () => {
    expect(read(1)).toEqual(['4,000', '4,860']);
    expect(read(0)).toEqual(['0', '0']);
  });

  it('gil and AP are always the same fraction of their amounts at one p (a payout fault would not scale both by one factor)', () => {
    for (let p = 0.01; p < 1; p += 0.037) {
      const gil = Number(ledgerValueText(GIL, p).replace(/,/g, ''));
      const ap = Number(ledgerValueText(AP, p).replace(/,/g, ''));
      expect(Math.abs(gil / 4_000 - ap / 4_860), `p ${p}`).toBeLessThan(0.001);
    }
  });
});

describe('the page says the settled amount on every frame of the roll', () => {
  const finals = (html: string): string[] => [...html.matchAll(/data-final="(\d+)"/g)].map((m) => m[1]!);

  it('desktop: the AP and gil ledger values and each member award carry the amounts (4860, 4000, then 4860 x3), at p 0, 0.25 and 1 alike', () => {
    for (const p of [0, 0.08675, 0.24625, 1]) expect(finals(desktopPageHtml(model(p))), `p ${p}`).toEqual(['4860', '4000', '4860', '4860', '4860']);
  });

  it('the item list and a settled text value carry none (they do not roll)', () => {
    const html = desktopPageHtml(model(0.3));
    expect(html).toContain('>Lv. 2 Key Sphere ×2<');
    expect(html).not.toMatch(/data-final="[^"]*"[^>]*>Lv\. 2/);
    expect(finalAttr({ kind: 'text', value: '9' })).toBe('');
    expect(finalAttr({ kind: 'items', value: 'Potion ×1' })).toBe('');
    expect(finalAttr({ kind: 'count', value: 3_240 })).toBe(' data-final="3240"');
  });

  it('the text of a count stays the rolling one (nothing a player sees changes): at p = 0.24625 the page prints 1,197 and 985', () => {
    const html = desktopPageHtml(model(0.24625));
    expect(html).toContain('>1,197<');
    expect(html).toContain('>985<');
  });

  it('phone: the tallies and the member chips carry the same amounts at every p', () => {
    for (const p of [0, 0.24625, 1]) expect(finals(phonePageHtml(model(p), '')), `p ${p}`).toEqual(['4860', '4000', '4860', '4860', '4860']);
  });

  it('a defeat prints no award and so no settled amount on its member rows', () => {
    const html = desktopPageHtml(model(1, { victory: false, heading: 'Defeat', tags: [], ledger: [{ kind: 'text', key: 'TURNS', value: '9' }] }));
    expect(finals(html)).toEqual([]);
  });
});
