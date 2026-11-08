// @vitest-environment jsdom
/**
 * **Release 78, R77-1, on the real results screen (both games; the case here is Spherimorph, FFX only):** a won Spherimorph fight (4,860 AP on an overkill, 4,000 gil) is on the screen at a fraction of its amounts while the
 * counts roll, and the screen says the settled amounts the whole time (`data-final` on the page, `snapshot().paid`), so a reader of the first seconds is not misled. At the end of the roll the text IS the paid amount.
 */
import { describe, expect, it } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';

const RESULT: BattleResult = {
  outcome: 'victory',
  turns: 9,
  elapsedTicks: 500,
  elapsedMs: 53_000,
  ap: 4_860,
  exp: 0,
  gil: 4_000,
  drops: [{ itemId: 'lv-2-key-sphere', count: 2 }],
  overkilled: ['spherimorph'],
  sphereLevelsGained: { tidus: 0, yuna: 0, lulu: 0 },
  turnsTaken: { tidus: 3, yuna: 3, lulu: 3 },
};

function open(): { screen: ResultsScreen; root: HTMLElement } {
  const save = new SaveStore('r78-results-roll-test', null);
  save.recordAttempt('spherimorph');
  const screen = new ResultsScreen({ chapterId: 'spherimorph', result: RESULT });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { save, fade: () => Promise.resolve() } as unknown as App;
  screen.root = root;
  void screen.enter();
  return { screen, root };
}

const num = (s: string | null | undefined): number => Number((s ?? '').replace(/[^0-9]/g, ''));
const ledger = (root: HTMLElement, key: string): HTMLElement => {
  const line = [...root.querySelectorAll<HTMLElement>('.rres__line')].find((l) => l.querySelector('.rres__k')?.textContent === key);
  return line!.querySelector<HTMLElement>('.rres__v')!;
};

describe('the real results screen of a won Spherimorph fight', () => {
  it('mid-roll the text is a fraction of the paid amounts (gil and AP at the same fraction), `data-final` and the snapshot say 4,000 and 4,860', () => {
    const { screen, root } = open();
    screen.update(0.1); // 100 ms of the 1,150 ms roll
    const gil = ledger(root, 'GIL');
    const ap = ledger(root, 'AP');
    expect(num(gil.textContent)).toBeGreaterThan(0);
    expect(num(gil.textContent)).toBeLessThan(4_000);
    expect(Math.abs(num(gil.textContent) / 4_000 - num(ap.textContent) / 4_860)).toBeLessThan(0.002);
    expect([gil.dataset['final'], ap.dataset['final']]).toEqual(['4000', '4860']);
    for (const m of root.querySelectorAll<HTMLElement>('.rres__member-ap')) expect(m.dataset['final']).toBe('4860');
    const paid = screen.snapshot()['paid'] as { ap: number; exp: number; gil: number; countProgress: number };
    expect([paid.ap, paid.exp, paid.gil]).toEqual([4_860, 0, 4_000]);
    expect(paid.countProgress).toBeGreaterThan(0);
    expect(paid.countProgress).toBeLessThan(1);
  });

  it('a second later the roll has landed: the text is the paid amount, the attributes did not change, the snapshot says the roll is done', () => {
    const { screen, root } = open();
    screen.update(0.1);
    const before = [ledger(root, 'GIL').dataset['final'], ledger(root, 'AP').dataset['final']];
    screen.update(2);
    expect(num(ledger(root, 'GIL').textContent)).toBe(4_000);
    expect(num(ledger(root, 'AP').textContent)).toBe(4_860);
    expect([ledger(root, 'GIL').dataset['final'], ledger(root, 'AP').dataset['final']]).toEqual(before);
    expect((screen.snapshot()['paid'] as { countProgress: number }).countProgress).toBe(1);
  });
});
