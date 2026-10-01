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
import { GUIDE_FADE_CLASS, StatusHintCard, guideOverCommands } from '../../src/ui/common/statusHintCard.ts';
import { ACTION_FADE_CLASS } from '../../src/ui/ffx2/actionFade.ts';
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

  it('PR-0303: at the phone target step a card that would reach the tap line docks above the party chips instead', () => {
    Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 844 });
    const host = phoneHost(true);
    const tap = document.createElement('p');
    tap.className = 'phud-target__hint';
    tap.getBoundingClientRect = () => rect(727, 17);
    host.appendChild(tap);
    const card = new StatusHintCard('ffx', () => true);
    card.el.getBoundingClientRect = () => rect(0, 70);
    card.update([HINT], true, host, null, true);
    expect(card.el.style.top).toBe('');
    expect(card.el.style.bottom).toBe('364px');
    // A short card that fits between the target card (bottom 708) and the tap line stays under the card.
    card.el.getBoundingClientRect = () => rect(0, 10);
    card.update([HINT], true, host, null, true);
    expect(card.el.style.top).toBe('712px');
  });

  it('PR-0304: while the FFX-2 guide stack is faded, a solo copy stands in the stage slot; the guide copy stays put', () => {
    expect(GUIDE_FADE_CLASS).toBe(ACTION_FADE_CLASS);
    const stage = document.createElement('div');
    const guide = document.createElement('div');
    guide.className = 'sgd';
    guide.innerHTML = '<div class="sgd__stack"><div class="sgd__panel"></div></div>';
    stage.appendChild(guide);
    document.body.appendChild(stage);
    const card = new StatusHintCard('ffx2', () => true);
    card.update([HINT], true, stage, guide, false);
    expect(card.el.parentElement?.className).toBe('sgd__panel');
    expect(card.solo.hidden).toBe(true);
    guide.querySelector('.sgd__stack')!.classList.add(ACTION_FADE_CLASS);
    card.update([HINT], true, stage, guide, false);
    expect(card.el.parentElement?.className).toBe('sgd__panel');
    expect(card.solo.hidden).toBe(false);
    expect(card.solo.parentElement).toBe(stage);
    expect(card.solo.textContent).toContain('Holy Water');
    guide.querySelector('.sgd__stack')!.classList.remove(ACTION_FADE_CLASS);
    card.update([HINT], true, stage, guide, false);
    expect(card.solo.hidden).toBe(true);
    // No decision open: neither shows.
    guide.querySelector('.sgd__stack')!.classList.add(ACTION_FADE_CLASS);
    card.update([HINT], false, stage, guide, false);
    expect(card.solo.hidden).toBe(true);
  });
});

describe('PR-0302 repair: the larger in-guide card never pushes the FFX guide over a command row', () => {
  const ZOMBIE: CureHint = { status: 'zombie', label: 'ZOMBIE', html: 'Healing turns into damage on a Zombie, and a <b>Phoenix Down</b> would KO her outright.', short: 'Healing hurts a Zombie.' };
  /** A stage with the guide's column at 43..307 x 208..`guideBottom` and the TALK row at `rowTop`. */
  function desktop(guideBottom: number, rowTop: number, rowLeft = 55): { stage: HTMLElement; guide: HTMLElement } {
    const stage = document.createElement('div');
    const guide = document.createElement('div');
    guide.className = 'sgd';
    guide.innerHTML = '<div class="sgd__stack"><div class="sgd__panel"></div><button class="sgd__more"></button></div>';
    const [stack, panel, more] = ['.sgd__stack', '.sgd__panel', '.sgd__more'].map((s) => guide.querySelector<HTMLElement>(s)!);
    stack!.getBoundingClientRect = () => rect(208, 142, 43, 264); // max-height: the slab runs past it
    panel!.getBoundingClientRect = () => rect(208, guideBottom - 22 - 208, 43, 264);
    more!.getBoundingClientRect = () => rect(guideBottom - 22, 22, 43, 264);
    const row = document.createElement('div');
    row.className = 'ig-cmd';
    row.getBoundingClientRect = () => rect(rowTop, 46, rowLeft, 310);
    stage.append(guide, row);
    document.body.appendChild(stage);
    return { stage, guide };
  }

  it('the check counts the slab and MORE past the stack, rows under the column only, and nothing without layout', () => {
    expect(guideOverCommands(desktop(490, 476).guide, document.body)).toBe(true); // the blocker: MORE over TALK's top 14 px
    document.body.innerHTML = '';
    expect(guideOverCommands(desktop(448, 476).guide, document.body)).toBe(false); // base: clear
    document.body.innerHTML = '';
    expect(guideOverCommands(desktop(490, 476, 400).guide, document.body)).toBe(false); // a row beside the column
    document.body.innerHTML = '';
    const bare = document.createElement('div');
    bare.innerHTML = '<div class="sgd__stack"><div class="sgd__panel"></div></div><div class="ig-cmd"></div>';
    expect(guideOverCommands(bare, bare)).toBe(false); // jsdom: every box 0
  });

  it('over a row the card takes the one-sentence form (the solo copy too), clear of rows it keeps the full rule', () => {
    const over = desktop(490, 476);
    const card = new StatusHintCard('ffx', () => true);
    card.update([ZOMBIE], true, over.stage, over.guide, false);
    expect(card.el.parentElement?.className).toBe('sgd__panel');
    expect(card.el.innerHTML).toContain('Healing hurts a Zombie.');
    expect(card.el.innerHTML).not.toContain('Phoenix Down');
    over.guide.querySelector('.sgd__stack')!.classList.add(GUIDE_FADE_CLASS);
    card.update([ZOMBIE], true, over.stage, over.guide, false);
    expect(card.solo.innerHTML).toContain('Healing hurts a Zombie.');
    document.body.innerHTML = '';
    const clear = desktop(448, 476);
    const full = new StatusHintCard('ffx', () => true);
    full.update([ZOMBIE], true, clear.stage, clear.guide, false);
    expect(full.el.innerHTML).toContain('Phoenix Down');
  });

  it('the form holds for that card (no flicker) and a new card starts from the full rule again', () => {
    const { stage, guide } = desktop(490, 476);
    const card = new StatusHintCard('ffx', () => true);
    card.update([ZOMBIE], true, stage, guide, false);
    // Now the short card clears the row: it stays short for the same card.
    guide.querySelector<HTMLElement>('.sgd__more')!.getBoundingClientRect = () => rect(426, 22, 43, 264);
    guide.querySelector<HTMLElement>('.sgd__panel')!.getBoundingClientRect = () => rect(208, 218, 43, 264);
    card.update([ZOMBIE], true, stage, guide, false);
    expect(card.el.innerHTML).toContain('Healing hurts a Zombie.');
    // The decision closes and the next card is measured afresh.
    card.update([ZOMBIE], false, stage, guide, false);
    expect(card.el.hidden).toBe(true);
    card.update([HINT], true, stage, guide, false);
    expect(card.el.innerHTML).toContain('Paine is cursed');
  });

  it('TEXT SIZE scales the guide column, so the in-guide floor is divided by it (no 15 x 1.3)', () => {
    expect(CSS).toContain('html[data-text-size]:not([data-phone-battle]) .ffxhud__stage .sthint--inguide,');
    expect(CSS).toContain('.ffx2hud__stage .sthint--inguide { font-size: max(6px, calc(15px / var(--lb-scale, 1) / var(--pyr-ts, 1))); }');
    expect(CSS).toContain('.ffx2hud__stage .sthint--inguide .sthint__head { font-size: max(4.8px, calc(15px / var(--lb-scale, 1) / var(--pyr-ts, 1))); }');
  });
});
