// @vitest-environment jsdom
/**
 * The phone's enemy-move line is two rows and the figures own the second (lane a11y-text, 2026-10-29; release 67 gap check item 5; BOTH games, the upright phone only).
 *
 * Release 67 clamped the line to two lines (backlog 57) and the clamp cut the damage figures on the longest lines: Chapter I's "SEYMOUR FLUX 3RD IN QUEUE Lance of Atrophy SCRIPTED ZOMBIE 99% TIDUS 707-799 / YUNA 746-842 /
 * KIMAHRI 698-788" laid out on three to four lines at 390 x 844 (`gaps/phone-fight`, 65 reads, 27 distinct, max visible 2, max laid out 4), and a party-wide move drew only its first target. These tests pin the markup and
 * the fit; jsdom has no layout, so the measure `fitPhoneLine` reads (`scrollWidth` against `clientWidth`) is faked from the character count, and the browser sweep (docs/handoff/a11y-text.md, job P1) reads the real one.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { EnemyIntentPanel, type IntentTargetView, type IntentView } from '../../src/ui/common/EnemyIntent.ts';
import { ROW1_RUNGS, ROW2_RUNGS, fitPhoneLine, phoneBodyHtml, phoneFigures, phoneLineOn, phoneTiming } from '../../src/ui/common/enemy-intent-phone.ts';
import { lastDecl, leafRules, readSource } from './helpers/cssEval.ts';

const target = (name: string, amount: number, min = amount, max = amount, lethal = false): IntentTargetView =>
  ({ targetId: name.toLowerCase(), targetName: name, amount, min, max, hpFraction: lethal ? 1 : 0.3, lethal, hitChancePercent: null }) as IntentTargetView;

function view(over: Partial<IntentView> = {}): IntentView {
  return {
    enemyId: 'seymour',
    enemyName: 'Seymour Flux',
    turnsAway: 0,
    actsNext: true,
    kind: 'action',
    moveName: 'Lance of Atrophy',
    abilityId: 'lance-of-atrophy',
    description: 'Physical non-elemental damage to one character - never misses.',
    elements: [],
    statusText: ['Zombie 99%'],
    estimate: null,
    randomTarget: { perHit: false, hits: 1, rows: [target('Tidus', 753, 707, 799), target('Yuna', 794, 746, 842), target('Kimahri', 743, 698, 788)] },
    confidence: 'scripted',
    branches: [],
    charge: null,
    counters: [],
    formNote: null,
    notes: [],
    cite: 'ffx-seymour-flux §4',
    ...over,
  } as IntentView;
}
const CONF = '<span class="eint__conf eint__conf--scripted">Scripted</span>';
const CHIP = '<span class="eint__status-chip">Zombie 99%</span>';

function body(v: IntentView = view()): HTMLElement {
  const el = document.createElement('div');
  el.className = 'eint__body';
  el.innerHTML = phoneBodyHtml(v, CONF, CHIP, 'Lance of Atrophy');
  document.body.append(el);
  return el;
}
const text = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-phone-battle');
});

describe('the words: the timing and the figures', () => {
  it('timing is NEXT for the next actor and the queue place after it (the desktop rule, said short)', () => {
    expect(phoneTiming({ actsNext: true, turnsAway: 0 })).toBe('next');
    expect(phoneTiming({ actsNext: false, turnsAway: 0 })).toBe('next');
    expect(phoneTiming({ actsNext: false, turnsAway: 1 })).toBe('2nd');
    expect(phoneTiming({ actsNext: false, turnsAway: 2 })).toBe('3rd');
    expect(phoneTiming({ actsNext: false, turnsAway: 3 })).toBe('4th');
    expect(phoneTiming({ actsNext: false, turnsAway: 10 })).toBe('11th');
    expect(phoneTiming({ actsNext: false, turnsAway: 20 })).toBe('21st');
  });

  it('a rolled victim lists every candidate; a party-wide move lists every character it moves HP of (not the first alone); zero rows are not damage', () => {
    const rolled = phoneFigures(view());
    expect(rolled.random).toBe(true);
    expect(rolled.rows.map((r) => `${r.name} ${r.amount}`)).toEqual(['Tidus 753', 'Yuna 794', 'Kimahri 743']);
    const wide = phoneFigures(view({ randomTarget: null, estimate: { name: 'Mega Flare', hits: 1, totalHarmToParty: 0, heals: false, perTarget: [target('Tidus', 2299, 2299, 2420), target('Yuna', 0), target('Kimahri', 349, 349, 394)] } }));
    expect(wide.random).toBe(false);
    expect(wide.rows.map((r) => `${r.name} ${r.amount}`)).toEqual(['Tidus 2,299', 'Kimahri 349']);
    expect(phoneFigures(view({ randomTarget: null, estimate: null })).rows).toEqual([]);
  });

  it('a lethal figure says KO, a heal carries a plus, a status-only move lists names with no number, the spread is the smallest and largest', () => {
    const f = phoneFigures(view({ randomTarget: { perHit: false, hits: 1, rows: [target('Yuna', 172, 172, 172, true), target('Tidus', 25), target('Rikku', -120)] } }));
    expect(f.rows.map((r) => [r.name, r.amount, r.kind])).toEqual([['Yuna', 'KO', 'lethal'], ['Tidus', '25', 'damage'], ['Rikku', '+120', 'heal']]);
    expect([f.lo, f.hi]).toEqual([25, 172]);
    const names = phoneFigures(view({ randomTarget: { perHit: false, hits: 1, rows: [target('Tidus', 0), target('Yuna', 0)] } }));
    expect(names.rows.map((r) => [r.name, r.amount, r.kind])).toEqual([['Tidus', '', 'candidate'], ['Yuna', '', 'candidate']]);
  });
});

describe('the markup: one wrapper, two rows, the figures on the second', () => {
  it('the body has ONE child (the phone sheet makes every direct child inline), holding row 1 and row 2', () => {
    const b = body();
    expect(b.children.length).toBe(1);
    const wrap = b.children[0]!;
    expect(wrap.classList.contains('eint__phone')).toBe(true);
    expect([...wrap.children].map((c) => c.className)).toEqual(['eint__r eint__r1', 'eint__r eint__r2 eint__r2--random']);
  });

  it('row 1 is who and when (short), the move, the certainty badge and the chip; row 2 is a figure per character with the number beside the name', () => {
    const b = body();
    expect([...b.querySelector('.eint__r1')!.children].map((c) => text(c)).join(' ')).toBe('Seymour Fluxnext Lance of Atrophy Scripted Zombie 99%');
    expect(text(b.querySelector('.eint__r1 .eint__tm'))).toBe('next');
    const figs = [...b.querySelectorAll('.eint__r2 .eint__fig')];
    expect(figs.map((f) => `${text(f.querySelector('.eint__fn'))} ${text(f.querySelector('.eint__fa'))}`)).toEqual(['Tidus 753', 'Yuna 794', 'Kimahri 743']);
    expect(figs.map((f) => text(f.querySelector('.eint__f3')))).toEqual(['Tid', 'Yun', 'Kim']);
    expect(text(b.querySelector('.eint__sum'))).toBe('random: 3 targets · 743–794');
  });

  it('none of the old figure classes the phone sheet hides (eint__dmg, which hides every row after the first) are used', () => {
    const b = body();
    expect(b.querySelector('.eint__dmg, .eint__dmgs, .eint__pct')).toBeNull();
  });

  it('names are escaped, the move arrives with its citations already taken out, and a move with nothing to hit has no second row', () => {
    const b = body(view({ enemyName: 'A<b>B', randomTarget: null, estimate: null, statusText: [] }));
    expect(b.querySelector('.eint__nm')!.innerHTML).toBe('A&lt;b&gt;B');
    expect(b.querySelector('.eint__r2')).toBeNull();
    expect(b.querySelectorAll('.eint__r').length).toBe(1);
  });

  it('a queue place is the timing after the first turn', () => {
    expect(text(body(view({ actsNext: false, turnsAway: 2 })).querySelector('.eint__tm'))).toBe('3rd');
  });
});

describe('the fit: the least useful piece goes first, one at a time, and only while a row is wider than the line', () => {
  /** A fake measure: a row "overflows" while the characters it still shows exceed the budget (the rungs are classes on the wrapper, so it reads them the way the sheet hides). */
  function measure(budget: number): (row: HTMLElement) => boolean {
    return (row) => {
      const wrap = row.parentElement!;
      const has = (c: string): boolean => wrap.classList.contains(c);
      if (row.classList.contains('eint__r1')) {
        const parts = [
          has('p-nm') ? '' : text(row.querySelector('.eint__nm')),
          has('p-tm') ? '' : text(row.querySelector('.eint__tm')),
          text(row.querySelector('.eint__label')),
          has('p-cf') ? '' : text(row.querySelector('.eint__conf')),
          has('p-ch') ? '' : text(row.querySelector('.eint__status-chip')),
        ];
        return parts.join(' ').length > budget && !has('p-el');
      }
      if (has('p-sm')) return text(row.querySelector('.eint__sum')).length > budget && !has('p-el2');
      // the band is what a ranged figure shows until the point rung (p-pt) takes it off
      const num = (f: Element): string => text(f.querySelector(f.querySelector('.eint__fb') && !has('p-pt') ? '.eint__fb' : '.eint__fa'));
      const per = [...row.querySelectorAll('.eint__fig')].map((f) => (has('p-sh') ? text(f.querySelector('.eint__f3')) : text(f.querySelector('.eint__fn'))) + ' ' + num(f));
      return per.join(' / ').length + 'random: '.length > budget && !has('p-el2');
    };
  }

  it('Chapter I\'s longest line (SEYMOUR FLUX next, Lance of Atrophy, SCRIPTED, ZOMBIE 99%) at a budget of 40 characters takes off the badge, then the timing, then the name, and stops', () => {
    const b = body();
    const applied = fitPhoneLine(b, measure(40)).filter((c) => ROW1_RUNGS.includes(c));
    expect(applied).toEqual(['p-cf', 'p-tm', 'p-nm']);
    const wrap = b.querySelector('.eint__phone')!;
    expect(wrap.classList.contains('p-ch')).toBe(false);
    expect(wrap.classList.contains('p-el')).toBe(false);
  });

  it('a line that fits has no rung on it; a line that never fits goes through every rung of row 1 and ends with the ellipsis', () => {
    expect(fitPhoneLine(body(), measure(200))).toEqual([]);
    expect(fitPhoneLine(body(), measure(5))).toEqual([...ROW1_RUNGS.slice(0, 5), ...ROW2_RUNGS]); // the base line's figures carry ranges, so the point rung is spent too
  });

  it('row 2 shortens the names first, then becomes a count and a spread; the figures are never dropped before that', () => {
    const six = view({ randomTarget: { perHit: false, hits: 1, rows: ['Tidus', 'Yuna', 'Auron', 'Kimahri', 'Wakka', 'Lulu', 'Rikku'].map((n, i) => target(n, 300 + i * 40)) } });
    const names = fitPhoneLine(body(six), measure(70));
    expect(names).toContain('p-sh');
    expect(names).toContain('p-sm');
    const some = fitPhoneLine(body(six), measure(80));
    expect(some.filter((c) => ROW2_RUNGS.includes(c))).toEqual(['p-sh']);
    expect(some).not.toContain('p-sm');
    expect(text(body(six).querySelector('.eint__sum'))).toBe('random: 7 targets · 300–540');
  });

  it('a rung whose piece is not on the line is skipped: an uncertain badge is never dropped, a move with no chip does not spend the chip rung', () => {
    const el = document.createElement('div');
    el.className = 'eint__body';
    el.innerHTML = phoneBodyHtml(view({ statusText: [] }), '<span class="eint__conf eint__conf--likely">Most likely 50%</span>', '', 'Lance of Atrophy');
    document.body.append(el);
    const applied = fitPhoneLine(el, measure(5)).filter((c) => ROW1_RUNGS.includes(c));
    expect(applied).not.toContain('p-cf');
    expect(applied).not.toContain('p-ch');
    expect(applied).toEqual(['p-tm', 'p-nm', 'p-el']);
  });

  it('fitting is idempotent: the classes are cleared and rebuilt, so a second pass at the same width ends in the same place, and a wider line gives the pieces back', () => {
    const b = body();
    const first = fitPhoneLine(b, measure(40));
    expect(fitPhoneLine(b, measure(40))).toEqual(first);
    expect(fitPhoneLine(b, measure(200))).toEqual([]);
    expect([...b.querySelector('.eint__phone')!.classList].filter((c) => c.startsWith('p-'))).toEqual([]);
  });

  it('a body that is not the phone\'s is left alone', () => {
    const b = document.createElement('div');
    b.innerHTML = '<p class="eint__enemy">X</p>';
    expect(fitPhoneLine(b, () => true)).toEqual([]);
  });
});

describe('the panel wears this body on the upright phone only, and follows the phone attribute', () => {
  function mount(): { panel: EnemyIntentPanel; body: HTMLElement } {
    const overlay = document.createElement('div');
    document.body.appendChild(overlay);
    const panel = new EnemyIntentPanel({ game: 'ffx', readVisible: () => true, writeVisible: () => {} });
    panel.mount(overlay, { host: overlay, scale: () => 1, project: () => ({ x: 100, y: 100 }), avoid: () => [], density: 'brief' });
    panel.setSource(() => view());
    return { panel, body: overlay.querySelector<HTMLElement>('.eint__body')! };
  }

  it('with no phone attribute the body is the desktop\'s (brief) and has no phone wrapper', () => {
    const { panel, body: b } = mount();
    expect(phoneLineOn()).toBe(false);
    expect(b.querySelector('.eint__phone')).toBeNull();
    expect(b.querySelector('p.eint__enemy')).not.toBeNull();
    expect(b.querySelector('.eint__dmgs')).not.toBeNull();
    panel.unmount();
  });

  it('with the phone attribute it is the two-row body, in the same words as the desktop\'s move line', () => {
    document.documentElement.setAttribute('data-phone-battle', 'ffx');
    const { panel, body: b } = mount();
    expect(phoneLineOn()).toBe(true);
    expect(b.children.length).toBe(1);
    expect(text(b.querySelector('.eint__r1 .eint__label'))).toBe('Lance of Atrophy');
    expect(text(b.querySelector('.eint__r1 .eint__conf'))).toBe('Scripted');
    expect(text(b.querySelector('.eint__r1 .eint__status-chip'))).toBe('Zombie 99%');
    expect([...b.querySelectorAll('.eint__r2 .eint__fn')].map((e) => e.textContent)).toEqual(['Tidus', 'Yuna', 'Kimahri']);
    panel.unmount();
  });

  it('turning the phone off (rotating the phone) draws the desktop body again on the next frame, and back', () => {
    document.documentElement.setAttribute('data-phone-battle', 'ffx');
    const { panel, body: b } = mount();
    expect(b.querySelector('.eint__phone')).not.toBeNull();
    document.documentElement.removeAttribute('data-phone-battle');
    panel.update(0);
    expect(b.querySelector('.eint__phone')).toBeNull();
    expect(b.querySelector('p.eint__enemy')).not.toBeNull();
    document.documentElement.setAttribute('data-phone-battle', 'ffx2');
    panel.update(0);
    expect(b.querySelector('.eint__phone')).not.toBeNull();
    panel.unmount();
  });
});

describe('the observers keep the fit current: a new move is fitted on its own, off the phone nothing is touched', () => {
  const widthOf = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');
  const clientOf = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  afterEach(() => {
    if (widthOf) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', widthOf);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)['scrollWidth'];
    if (clientOf) Object.defineProperty(HTMLElement.prototype, 'clientWidth', clientOf);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)['clientWidth'];
  });
  /** jsdom has no layout: a row is as wide as its text (10 px a character) in a line 300 px wide. */
  function fakeLayout(): void {
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get(this: HTMLElement) { return this.classList.contains('eint__r') ? (this.textContent ?? '').length * 10 : 0; } });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get(this: HTMLElement) { return this.classList.contains('eint__r') ? 300 : 0; } });
  }
  const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

  it('on the phone a long line is fitted as soon as the body is written, with no call from the panel', async () => {
    fakeLayout();
    document.documentElement.setAttribute('data-phone-battle', 'ffx');
    const overlay = document.createElement('div');
    document.body.appendChild(overlay);
    const panel = new EnemyIntentPanel({ game: 'ffx', readVisible: () => true, writeVisible: () => {} });
    panel.mount(overlay, { host: overlay, scale: () => 1, project: () => ({ x: 100, y: 100 }), avoid: () => [], density: 'brief' });
    panel.setSource(() => view());
    const b = overlay.querySelector<HTMLElement>('.eint__body')!;
    await flush();
    const wrap = b.querySelector('.eint__phone')!;
    // row 1 is "Seymour Flux" + "next" + the move + the badge + the chip: well over 30 characters
    expect([...wrap.classList].filter((c) => c.startsWith('p-')).length).toBeGreaterThan(0);
    expect(wrap.classList.contains('p-cf')).toBe(true);
    panel.unmount();
  });

  it('a change in the size of the panel (the window narrows, or it is drawn after being hidden) fits again through the ResizeObserver', async () => {
    fakeLayout();
    const lineIs = (px: number): void => void Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get(this: HTMLElement) { return this.classList.contains('eint__r') ? px : 0; } });
    lineIs(1200); // a wide line: every row fits
    const seen: Array<{ cb: () => void; target: Element }> = [];
    const had = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      private readonly cb: () => void;
      constructor(cb: () => void) { this.cb = cb; }
      observe(target: Element): void { seen.push({ cb: this.cb, target }); }
      disconnect(): void {}
    };
    try {
      document.documentElement.setAttribute('data-phone-battle', 'ffx');
      const overlay = document.createElement('div');
      document.body.appendChild(overlay);
      const panel = new EnemyIntentPanel({ game: 'ffx', readVisible: () => true, writeVisible: () => {} });
      panel.mount(overlay, { host: overlay, scale: () => 1, project: () => ({ x: 100, y: 100 }), avoid: () => [], density: 'brief' });
      panel.setSource(() => view());
      await flush();
      expect(seen.length, 'one observer, on the panel').toBe(1);
      expect(seen[0]!.target.getAttribute('data-role')).toBe('enemy-intent-panel');
      const wrap = overlay.querySelector('.eint__phone')!;
      const before = [...wrap.classList].filter((c) => c.startsWith('p-')).length;
      expect(before).toBe(0);
      lineIs(450); // the line gets narrower than row 1 (50 characters at 10 px)
      seen[0]!.cb();
      const after = [...wrap.classList].filter((c) => c.startsWith('p-')).length;
      expect(after).toBeGreaterThan(0);
      lineIs(1200); // and wider again: the pieces come back
      seen[0]!.cb();
      expect([...wrap.classList].filter((c) => c.startsWith('p-')).length).toBe(0);
      panel.unmount();
    } finally {
      if (had === undefined) delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
      else (globalThis as { ResizeObserver?: unknown }).ResizeObserver = had;
    }
  });

  it('off the phone the body is not touched and no rung appears', async () => {
    fakeLayout();
    const overlay = document.createElement('div');
    document.body.appendChild(overlay);
    const panel = new EnemyIntentPanel({ game: 'ffx', readVisible: () => true, writeVisible: () => {} });
    panel.mount(overlay, { host: overlay, scale: () => 1, project: () => ({ x: 100, y: 100 }), avoid: () => [], density: 'brief' });
    panel.setSource(() => view());
    await flush();
    expect(overlay.querySelector('[class*="p-cf"], [class*="p-tm"], .eint__phone')).toBeNull();
    panel.unmount();
  });
});

describe('the stylesheet: nothing outside the phone, one line box a row, the rungs hide what they name', () => {
  const sheet = leafRules(readSource('src/ui/common/phone-enemy-line.css'));

  it('every selector hangs from html[data-phone-battle]', () => {
    expect(sheet.length).toBeGreaterThan(20);
    for (const r of sheet) expect(r.sel.startsWith('html[data-phone-battle] '), r.sel).toBe(true);
  });

  it('a row is one line box of the 14 px type (1.3em, the body clamp 2.6em holds exactly two), does not wrap, and clips', () => {
    const row = 'html[data-phone-battle] .eint__phone > .eint__r';
    expect(lastDecl(sheet, row, 'height')).toBe('1.3em');
    expect(lastDecl(sheet, row, 'white-space')).toBe('nowrap');
    expect(lastDecl(sheet, row, 'overflow')).toBe('hidden');
    expect(lastDecl(sheet, row, 'display')).toBe('flex !important'.replace(' !important', ''));
    const clamp = leafRules(readSource('src/ui/common/phone-battle-parts.css'));
    expect(lastDecl(clamp, 'html[data-phone-battle] .eint__body', 'max-height')).toBe('2.6em');
    expect(lastDecl(clamp, 'html[data-phone-battle] .eint__body', 'line-height')).toBe('1.3');
  });

  it('every rung the code puts on is a rule in the sheet, hiding or releasing what it names', () => {
    const css = readSource('src/ui/common/phone-enemy-line.css');
    for (const rung of [...ROW1_RUNGS, ...ROW2_RUNGS]) expect(css, rung).toContain(`.eint__phone.${rung} `);
    expect(lastDecl(sheet, 'html[data-phone-battle] .eint__phone.p-cf .eint__conf--scripted', 'display')).toBe('none');
    expect(lastDecl(sheet, 'html[data-phone-battle] .eint__phone.p-ch .eint__status-chip', 'display')).toBe('none');
    expect(lastDecl(sheet, 'html[data-phone-battle] .eint__phone.p-sh .eint__f3', 'display')).toBe('inline');
    expect(lastDecl(sheet, 'html[data-phone-battle] .eint__phone.p-sm .eint__sum', 'display')).toBe('inline');
    expect(lastDecl(sheet, 'html[data-phone-battle] .eint__f3', 'display')).toBe('none');
    expect(lastDecl(sheet, 'html[data-phone-battle] .eint__sum', 'display')).toBe('none');
  });

  it('a body holding the wrapper is a plain block (no line clamp to miscount flex rows) and keeps the 2.6em cap and the clip of the phone sheet', () => {
    const own = 'html[data-phone-battle] .eint__body:has(> .eint__phone)';
    expect(lastDecl(sheet, own, 'display')).toBe('block');
    expect(lastDecl(sheet, own, '-webkit-line-clamp')).toBe('none');
    expect(lastDecl(sheet, own, 'line-clamp')).toBe('none');
    expect(lastDecl(sheet, own, 'max-height')).toBeUndefined(); // the cap is the phone sheet's, not restated here
  });

  it('the figures are not told apart by colour alone (KO and the plus sign are text), and the wrapper outranks the rule that makes body children inline', () => {
    expect(lastDecl(sheet, 'html[data-phone-battle] .eint__body > .eint__phone', 'display')).toBe('block');
    const parts = readSource('src/ui/common/phone-battle-parts.css');
    expect(parts).toMatch(/html\[data-phone-battle\] \.eint__body > \* \{\s*display: inline !important;/);
    expect(readSource('src/ui/common/phone-enemy-line.css')).toMatch(/\.eint__body > \.eint__phone \{\s*display: block !important;/);
  });
});
