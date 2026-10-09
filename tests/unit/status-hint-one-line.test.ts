// @vitest-environment jsdom
/**
 * R3942 (Bailey, 2026-10-08, "I'll go with all your recommendations"; the Chapter IV card pick, option 1): the FFX-2 phone cure-hint card is ONE row.
 *
 * Game case: FFX-2 only (rule 14). At the real sizes the giants study picked (Bahamut 70 percent on a phone) the girls stand low, and the
 * three-row sentence card (`GUIDE [CURSE]` over "Paine is cursed: Holy Water, Esuna or a Remedy cures it.", 73 px) sat on their legs: Yuna 52
 * percent hidden at 390x844 and 98 at 375x667 against live's 8 and 65 (three-run means). The card is now the chip and "Paine: Holy Water, Esuna, Remedy" on one
 * row, 31 px tall, the same 14.2 px type, the same dock (6 px above the party chips), no figure moved. FFX's phone card (a different game's
 * words and rooms) and every desktop card keep their sentences. The browser proof (the girls' share under the card at four windows, every
 * status on every girl at six widths) is in `docs/handoff/r3942-stage.md`; this pins the rules.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { StatusHintCard, hintCardHtml, oneLineCard, partyHints } from '../../src/ui/common/statusHintCard.ts';
import { cureHint, hintStatuses, type CureHint } from '../../src/ui/common/statusWords.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS = readFileSync(join(ROOT, 'src/ui/common/status-o3.css'), 'utf8');

const strip = (html: string): string => html.replace(/<[^>]+>/g, '');
/** A hint written before the one-row form existed (no `line`): the test literal the older files use. */
const OLD_HINT: CureHint = { status: 'curse', label: 'CURSE', html: 'Paine is cursed: <b>Holy Water</b> cures it.', short: 'Paine is cursed: <b>Holy Water</b> cures it.' };

function rect(top: number, height: number): DOMRect {
  return { top, bottom: top + height, left: 8, right: 382, width: 374, height, x: 8, y: top, toJSON: () => ({}) } as DOMRect;
}

/** A phone HUD root with the party chips at 486..548 (the 844-tall layout). */
function phoneHost(): HTMLElement {
  const host = document.createElement('div');
  const chips = document.createElement('div');
  chips.className = 'ig-stat-list';
  chips.getBoundingClientRect = () => rect(486, 62);
  host.appendChild(chips);
  document.body.appendChild(host);
  return host;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('R3942: FFX-2 has a one-row form of every hint it shows, with the whole cure list', () => {
  it('sleep, silence and curse each carry a line that names the list the sentence names (ffx2-combat-core §2.8)', () => {
    expect(hintStatuses('ffx2')).toEqual(['sleep', 'silence', 'curse']);
    const lines = Object.fromEntries(hintStatuses('ffx2').map((s) => [s, strip(cureHint('ffx2', s, 'Rikku', 'rikku')!.line ?? '')]));
    expect(lines['curse']).toBe('Rikku: Holy Water, Esuna, Remedy'); // Holy Water, Esuna, Remedy cure it (PR-0290: the whole list)
    expect(lines['silence']).toBe('Rikku: Echo Screen, Esuna, Remedy'); // "Cured by Echo Screen" (+ Esuna, Remedy)
    expect(lines['sleep']).toBe('Rikku: a hit, Esuna, Remedy'); // woken by a hit, Esuna, Remedy
    // Each names every item its sentence form names (nothing is dropped from the list).
    for (const s of hintStatuses('ffx2')) {
      const h = cureHint('ffx2', s, 'Rikku', 'rikku')!;
      for (const item of ['Holy Water', 'Echo Screen', 'Esuna', 'Remedy', 'a hit', 'A hit']) {
        if (strip(h.short).includes(item)) expect(lines[s]!.toLowerCase(), `${s}: ${item}`).toContain(item.toLowerCase());
      }
    }
  });

  it('is a row that fits: no longer than the longest line measured to fit one row at 360 px (33 characters, 8 px to spare)', () => {
    for (const s of hintStatuses('ffx2')) {
      for (const [name, id] of [['Yuna', 'yuna'], ['Rikku', 'rikku'], ['Paine', 'paine']] as const) {
        const line = strip(cureHint('ffx2', s, name, id)!.line ?? '');
        expect(line.length, `${s} ${name}: "${line}"`).toBeLessThanOrEqual(33);
        expect(line.startsWith(`${name}: `)).toBe(true); // who, then the list; the chip says which status
      }
    }
  });

  it('escapes a name like the sentence forms do', () => {
    expect(cureHint('ffx2', 'curse', '<i>Rikku</i>', 'rikku')!.line).toContain('&lt;i&gt;Rikku&lt;/i&gt;');
  });

  it('FFX has none: its phone card is the other game’s words and keeps its sentence', () => {
    for (const s of hintStatuses('ffx')) expect(cureHint('ffx', s, 'Tidus', 'tidus')!.line, s).toBeUndefined();
  });

  it('a party member with the status gets it from partyHints, in FFX-2 only', () => {
    const state = {
      result: null,
      combatants: {
        paine: { id: 'paine', name: 'Paine', side: 'party', alive: true, removed: false, statuses: { curse: { id: 'curse' } } },
      },
    } as unknown as BattleState;
    expect(partyHints('ffx2', state)[0]?.line).toBe('Paine: <b>Holy Water</b>, <b>Esuna</b>, <b>Remedy</b>');
    expect(partyHints('ffx', state)[0]?.line).toBeUndefined();
  });
});

describe('R3942: only the FFX-2 phone card takes the row', () => {
  const hint = cureHint('ffx2', 'curse', 'Paine', 'paine')!;

  it('oneLineCard: FFX-2, a phone and a hint with a line', () => {
    expect(oneLineCard('ffx2', [hint], true)).toBe(true);
    expect(oneLineCard('ffx2', [hint], false)).toBe(false); // the desktop card keeps its sentence
    expect(oneLineCard('ffx', [cureHint('ffx', 'curse', 'Tidus', 'tidus')!], true)).toBe(false);
    expect(oneLineCard('ffx2', [OLD_HINT], true)).toBe(false); // no line: the sentence
    expect(oneLineCard('ffx2', [], true)).toBe(false);
  });

  it('hintCardHtml: the row is the chip and the list, no GUIDE word; every other form is as it was', () => {
    expect(hintCardHtml([hint], true, true)).toBe('<div class="sthint__head"><i>CURSE</i></div><div class="sthint__body">Paine: <b>Holy Water</b>, <b>Esuna</b>, <b>Remedy</b></div>');
    // Phone, no row asked for (FFX, and the desktop's one-sentence compact form): the sentence under GUIDE.
    expect(hintCardHtml([hint], true)).toBe(`<div class="sthint__head">GUIDE <i>CURSE</i></div><div class="sthint__body">${hint.short}</div>`);
    // A row asked for with a hint that has none falls back to the sentence.
    expect(hintCardHtml([OLD_HINT], true, true)).toContain('GUIDE');
    // The desktop card is the full sentence.
    expect(hintCardHtml([hint], false)).toBe(`<div class="sthint__head">GUIDE <i>CURSE</i></div><div class="sthint__body">${hint.html}</div>`);
  });

  it('the FFX-2 phone card carries sthint--line and docks 6 px above the party chips, as the sentence card did', () => {
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 844 });
    const card = new StatusHintCard('ffx2', () => true);
    card.update([hint], true, phoneHost(), null, true);
    expect(card.el.hidden).toBe(false);
    expect(card.el.classList.contains('sthint--phone')).toBe(true);
    expect(card.el.classList.contains('sthint--line')).toBe(true);
    expect(card.el.className).toContain('sthint--ffx2');
    expect(card.el.querySelectorAll('.sthint__head').length).toBe(1);
    expect(card.el.querySelectorAll('.sthint__body').length).toBe(1);
    expect(card.el.textContent).toBe('CURSEPaine: Holy Water, Esuna, Remedy');
    expect(card.el.textContent).not.toContain('GUIDE');
    expect(card.el.style.bottom).toBe('364px'); // 844 - 486 + 6: the dock is unchanged, the card's top edge is what moved
    expect(card.el.style.top).toBe('');
  });

  it('the FFX phone card and the FFX-2 and FFX desktop cards do not', () => {
    const ffx = new StatusHintCard('ffx', () => true);
    ffx.update([cureHint('ffx', 'curse', 'Tidus', 'tidus')!], true, phoneHost(), null, true);
    expect(ffx.el.classList.contains('sthint--phone')).toBe(true);
    expect(ffx.el.classList.contains('sthint--line')).toBe(false);
    expect(ffx.el.innerHTML).toContain('GUIDE');
    expect(ffx.el.textContent).toContain('Tidus is cursed');
    const x2 = new StatusHintCard('ffx2', () => true);
    x2.update([hint], true, phoneHost(), null, false);
    expect(x2.el.classList.contains('sthint--line')).toBe(false);
    expect(x2.el.innerHTML).toContain('GUIDE');
    expect(x2.el.textContent).toContain('cannot change dresspheres'); // the full sentence
  });

  it('the game decides, not the data: an FFX hint that did carry a row still keeps its sentence on FFX’s phone card', () => {
    const ffxHint: CureHint = { ...cureHint('ffx', 'curse', 'Tidus', 'tidus')!, line: 'Tidus: Holy Water' };
    expect(oneLineCard('ffx', [ffxHint], true)).toBe(false);
    const card = new StatusHintCard('ffx', () => true);
    card.update([ffxHint], true, phoneHost(), null, true);
    expect(card.el.classList.contains('sthint--line')).toBe(false);
    expect(card.el.innerHTML).toContain('GUIDE');
    expect(card.el.textContent).toContain('Tidus is cursed');
    expect(card.el.textContent).not.toContain('Tidus: Holy Water');
  });

  it('the class goes with the card: BATTLE HELP off, no decision open, or the window grows past a phone', () => {
    const host = phoneHost();
    const card = new StatusHintCard('ffx2', () => true);
    card.update([hint], true, host, null, true);
    expect(card.el.classList.contains('sthint--line')).toBe(true);
    card.update([hint], false, host, null, true);
    expect(card.el.hidden).toBe(true);
    expect(card.el.classList.contains('sthint--line')).toBe(false);
    card.update([hint], true, host, null, true);
    expect(card.el.classList.contains('sthint--line')).toBe(true);
    card.update([hint], true, host, null, false); // a window resized to a desktop
    expect(card.el.classList.contains('sthint--line')).toBe(false);
    expect(card.el.innerHTML).toContain('GUIDE');
    const off = new StatusHintCard('ffx2', () => false);
    off.update([hint], true, phoneHost(), null, true);
    expect(off.el.hidden).toBe(true);
    expect(off.el.classList.contains('sthint--line')).toBe(false);
    expect(off.el.innerHTML).toBe('');
  });

  it('a hint with no row (an older literal) shows its sentence on the FFX-2 phone, never an empty row', () => {
    const card = new StatusHintCard('ffx2', () => true);
    card.update([OLD_HINT], true, phoneHost(), null, true);
    expect(card.el.classList.contains('sthint--line')).toBe(false);
    expect(card.el.textContent).toContain('Paine is cursed');
  });
});

describe('R3942: the row is styled for the FFX-2 phone card only, at the card’s own type, and never clips the list', () => {
  const BARE = CSS.replace(/\/\*[\s\S]*?\*\//g, ''); // the comments hold no braces, but they would be read as the first selector
  const rules = [...BARE.matchAll(/([^{}]*\.sthint--line[^{}]*)\{([^}]*)\}/g)].map((m) => ({ sel: m[1]!.trim(), body: m[2]! }));

  it('every rule for it names the phone card, and there are the four the row needs', () => {
    expect(rules.length).toBeGreaterThanOrEqual(4);
    for (const r of rules) expect(r.sel, r.sel).toMatch(/^\.sthint--phone\.sthint--line/);
    const card = rules.find((r) => r.sel === '.sthint--phone.sthint--line')!;
    expect(card.body).toMatch(/display:\s*flex/);
    expect(rules.find((r) => r.sel.endsWith('.sthint__body'))!.body).toMatch(/min-width:\s*0/);
  });

  it('sets no font size (the 14.2 px floor and TEXT SIZE rules stand), no position or dock, and nothing that clips or truncates', () => {
    for (const r of rules) {
      expect(r.body, r.sel).not.toMatch(/font-size|font:/);
      expect(r.body, r.sel).not.toMatch(/\b(position|top|bottom|left|right)\s*:/);
      expect(r.body, r.sel).not.toMatch(/overflow|text-overflow|white-space|line-clamp|max-height|height\s*:/);
    }
    expect(CSS).toContain('.sthint--phone, .sthint--phone .sthint__head { font-size: 14.2px; }');
    expect(CSS).toMatch(/\.sthint--phone\s*\{[^}]*bottom:\s*calc\(var\(--phud-chips/);
  });
});
