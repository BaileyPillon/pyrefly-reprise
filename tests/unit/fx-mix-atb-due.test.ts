/**
 * Round 19, PR-0314 (FFX-2 only): the DRESSPHERE SHOT is not cut to unless it can hold its 1.6 s, so the mix reads the party rows'
 * ATB gauges as drawn (`.ffx2atb__fill` width, `.ffx2atb--ready`) and says when another girl's menu is due.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { AtbWatch } from '../../src/engine/fx/mix/atbDue.ts';

interface Row {
  name: string;
  pct: number;
  ready?: boolean;
}

/** A minimal DOM: the party rows as `querySelectorAll('.ig-stat')` hands them out. */
function stubRows(rows: Row[]): void {
  const mk = (r: Row) => ({
    querySelector(sel: string) {
      if (sel === '.ffx2atb__fill') return { style: { width: `${r.pct}%` } };
      if (sel === '.ig-stat__name') return { textContent: r.name };
      if (sel === '.ffx2atb--ready') return r.ready ? {} : null;
      return null;
    },
  });
  (globalThis as { document?: unknown }).document = { querySelectorAll: (sel: string) => (sel === '.ig-stat' ? rows.map(mk) : []) };
}

afterEach(() => {
  delete (globalThis as { document?: unknown }).document;
});

/** Sample the rows for `secs` seconds at 60 Hz while each named gauge fills at its rate per second. */
function run(watch: AtbWatch, rows: Row[], secs: number, rates: Record<string, number>): void {
  for (let t = 0; t < secs * 60; t++) {
    for (const r of rows) r.pct = Math.min(100, r.pct + ((rates[r.name] ?? 0) * 100) / 60);
    stubRows(rows);
    watch.sample(1 / 60);
  }
}

describe('AtbWatch: is another girl\'s menu due? (PR-0314)', () => {
  it('a full gauge says now', () => {
    const rows: Row[] = [{ name: 'Rikku', pct: 0 }, { name: 'Paine', pct: 100, ready: true }];
    stubRows(rows);
    expect(new AtbWatch().secondsToMenu('Rikku')).toBe(0);
  });

  it('reads the rise it has seen: a gauge at 65 % rising at a quarter per second is about 1.4 s off', () => {
    const rows: Row[] = [{ name: 'Rikku', pct: 0 }, { name: 'Paine', pct: 40 }];
    const w = new AtbWatch();
    run(w, rows, 1, { Paine: 0.25 }); // 40 % -> 65 %
    const due = w.secondsToMenu('Rikku');
    expect(due).toBeGreaterThan(1.2);
    expect(due).toBeLessThan(1.6);
  });

  it('is not due for the girl who changed (her gauge has just emptied), nor for a gauge that is not rising', () => {
    const rows: Row[] = [{ name: 'Rikku', pct: 0 }, { name: 'Paine', pct: 50 }];
    const w = new AtbWatch();
    run(w, rows, 1, { Rikku: 0.5 }); // she refills quickly; Paine is stopped
    expect(w.secondsToMenu('Rikku')).toBe(Infinity);
  });

  it('a gauge that just fell (a refill after her own action) is not counted as on its way', () => {
    const rows: Row[] = [{ name: 'Rikku', pct: 0 }, { name: 'Paine', pct: 90 }];
    const w = new AtbWatch();
    run(w, rows, 0.4, {});
    rows[1]!.pct = 5; // Paine acted: her gauge dropped
    run(w, rows, 0.3, {});
    expect(w.secondsToMenu('Rikku')).toBe(Infinity);
  });

  it('needs a quarter second of history before it estimates anything', () => {
    const rows: Row[] = [{ name: 'Rikku', pct: 0 }, { name: 'Paine', pct: 70 }];
    const w = new AtbWatch();
    run(w, rows, 0.1, { Paine: 0.3 });
    expect(w.secondsToMenu('Rikku')).toBe(Infinity);
  });
});
