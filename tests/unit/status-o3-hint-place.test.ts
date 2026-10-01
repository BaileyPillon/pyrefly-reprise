// @vitest-environment jsdom
/**
 * PR-0282 (critic round 18, major, inside status O3): the cure-hint card covered the top command
 * row on phones in both games and ignored BATTLE HELP OFF; on the desktop FFX HUD with the guide
 * folded it covered the NEXT BEST MOVE card's header.
 *
 * Game case: both (shared plumbing; the desktop half is the FFX HUD's advisor solver, the only HUD
 * whose card could reach the hint's slot). Browser proof with rect measurements at 390x844,
 * 1600x900 and 2000x1012 in Chapters I and IV is in `docs/handoff/r33-fix.md`; this pins the rules.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { StatusHintCard } from '../../src/ui/common/statusHintCard.ts';
import { ADVISOR_PANEL_SELECTORS, STATUS_HINT_SELECTOR } from '../../src/ui/ffx/hudAvoidSelectors.ts';
import type { CureHint } from '../../src/ui/common/statusWords.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS = readFileSync(join(ROOT, 'src/ui/common/status-o3.css'), 'utf8');

const HINT: CureHint = { status: 'curse', label: 'CURSE', html: 'Paine is cursed: <b>Holy Water</b> cures it.', short: 'Paine is cursed: <b>Holy Water</b> cures it.' };

function rect(top: number, height: number, left = 8, width = 374): DOMRect {
  return { top, bottom: top + height, left, right: left + width, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

/** A phone HUD root with the party chips at 486..548 (the 844-tall layout). */
function phoneHost(withCard = false): HTMLElement {
  const host = document.createElement('div');
  const chips = document.createElement('div');
  chips.className = 'ig-stat-list';
  chips.getBoundingClientRect = () => rect(486, 62);
  host.appendChild(chips);
  if (withCard) {
    const card = document.createElement('div');
    card.className = 'phud-card';
    card.getBoundingClientRect = () => rect(558, 150);
    host.appendChild(card);
  }
  document.body.appendChild(host);
  return host;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('PR-0282: the cure hint follows BATTLE HELP and never covers a command row', () => {
  it('BATTLE HELP OFF: no card, in both games, phone and desktop', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      for (const phone of [true, false]) {
        const card = new StatusHintCard(game, () => false);
        const host = phoneHost();
        card.update([HINT], true, host, null, phone);
        expect(card.el.hidden).toBe(true);
        expect(card.el.innerHTML).toBe('');
      }
    }
  });

  it('BATTLE HELP ON: the card shows while a decision is open', () => {
    const card = new StatusHintCard('ffx2', () => true);
    card.update([HINT], true, phoneHost(), null, true);
    expect(card.el.hidden).toBe(false);
    expect(card.el.textContent).toContain('Holy Water');
    card.update([HINT], false, phoneHost(), null, true);
    expect(card.el.hidden).toBe(true);
  });

  it('phone command menu: docked just above the party chips (clear of the TIP line and the grid)', () => {
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 844 });
    const card = new StatusHintCard('ffx', () => true);
    card.update([HINT], true, phoneHost(), null, true);
    // The chips' top is 486: the card's bottom edge sits 6 px above it, 844 - 486 + 6 = 364 from the bottom.
    expect(card.el.style.bottom).toBe('364px');
    expect(card.el.style.top).toBe('');
  });

  it('phone target step: under the target card, as the approved mockup has it', () => {
    const card = new StatusHintCard('ffx', () => true);
    card.update([HINT], true, phoneHost(true), null, true);
    expect(card.el.style.top).toBe(`${558 + 150 + 4}px`);
    expect(card.el.style.bottom).toBe('auto');
  });

  it("the phone stylesheet's default slot is the chips' top, not over the command grid", () => {
    const rule = /\.sthint--phone\s*\{([^}]*)\}/.exec(CSS)?.[1] ?? '';
    expect(rule).not.toMatch(/bottom:\s*168px/);
    expect(rule).toMatch(/bottom:\s*calc\(var\(--phud-chips/);
  });

  it("desktop FFX: the advisor's solver treats a visible hint card as an obstacle, a hidden one not", () => {
    const sel = [...ADVISOR_PANEL_SELECTORS, STATUS_HINT_SELECTOR].join();
    // The FFX HUD hands exactly this list to the solver.
    expect(readFileSync(join(ROOT, 'src/ui/ffx/FFXBattleHud.ts'), 'utf8')).toContain('[...ADVISOR_PANEL_SELECTORS, STATUS_HINT_SELECTOR].join()');
    const host = document.createElement('div');
    const card = new StatusHintCard('ffx', () => true);
    host.appendChild(card.el);
    document.body.appendChild(host);
    expect(host.querySelectorAll(sel).length).toBe(0); // hidden until a decision opens
    card.update([HINT], true, host, null, false);
    expect(host.querySelectorAll(sel).length).toBe(1);
  });
});

describe('round 18b: the cure hint reads at 14 px, keeps off the tap line, and outlives the guide fade', () => {
  it('PR-0302: the stage card floors its type at 15 rendered px (14 after any rounding), the phone card is 14 px and follows TEXT SIZE', () => {
    expect(CSS).toContain('.sthint { font-size: max(6px, calc(15px / var(--lb-scale, 1))); }');
    expect(CSS).toContain('.sthint__head { font-size: max(4.8px, calc(15px / var(--lb-scale, 1))); }');
    expect(CSS).toContain('.sthint--phone, .sthint--phone .sthint__head { font-size: 14.2px; }');
    expect(CSS).toContain("html[data-phone-battle='ffx'][data-text-size] .sthint--phone");
    expect(CSS).toContain("html[data-phone-battle='ffx2'][data-text-size-wide] .sthint--phone");
    // The floors come after the sizes they lift (the same specificity: the later rule wins).
    expect(CSS.indexOf('.sthint { font-size: max(')).toBeGreaterThan(CSS.indexOf('.sthint--phone .sthint__head { font-size: 9px'));
  });
});
