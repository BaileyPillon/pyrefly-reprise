// @vitest-environment jsdom
/**
 * PR-0282 (critic round 18, major, inside status O3): the cure-hint card covered the top command
 * row on phones in both games and ignored BATTLE HELP OFF; on the desktop FFX HUD with the guide
 * folded it covered the NEXT BEST MOVE card's header.
 *
 * Game case: both (shared plumbing; the desktop half is the FFX HUD's advisor solver, the only HUD
 * whose card could reach the hint's slot). Browser proof with rect measurements at 390x844,
 * 1600x900 and 2000x1012 in Chapters I and IV is in `docs/handoff/r33-fix.md`; this pins the rules.
 *
 * R38 (2026-10-03): with the guide open the card stands in the guide column's own slot (`.sgd__slot`), a card of its
 * own above the scrolling sheet, instead of inside the guide's document; the cases below that used to say "in the guide"
 * say "in its slot" and pin that the document is never touched.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { GUIDE_FADE_CLASS, MIN_SHEET_HEIGHT, StatusHintCard, guideSqueezed } from '../../src/ui/common/statusHintCard.ts';
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

  it('PR-0304: while the FFX-2 guide stack is faded, a solo copy stands in the stage slot; the copy in the column stays put', () => {
    expect(GUIDE_FADE_CLASS).toBe(ACTION_FADE_CLASS);
    const stage = document.createElement('div');
    const guide = document.createElement('div');
    guide.className = 'sgd';
    guide.innerHTML = '<div class="sgd__stack"><div class="sgd__slot"></div><div class="sgd__panel"></div></div>';
    stage.appendChild(guide);
    document.body.appendChild(stage);
    const card = new StatusHintCard('ffx2', () => true);
    card.update([HINT], true, stage, guide, false);
    expect(card.el.parentElement?.className).toBe('sgd__slot');
    expect(card.solo.hidden).toBe(true);
    guide.querySelector('.sgd__stack')!.classList.add(ACTION_FADE_CLASS);
    card.update([HINT], true, stage, guide, false);
    expect(card.el.parentElement?.className).toBe('sgd__slot');
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

describe('R38: the card has a box of its own, outside the guide’s document', () => {
  function column(): { stage: HTMLElement; guide: HTMLElement; slot: HTMLElement; panel: HTMLElement } {
    const stage = document.createElement('div');
    const guide = document.createElement('div');
    guide.className = 'sgd';
    guide.innerHTML =
      '<div class="sgd__stack"><div class="sgd__slot"></div><div class="sgd__panel"><div class="sgd__body"><p>the page</p></div></div></div><button class="sgd__toggle"></button>';
    stage.appendChild(guide);
    document.body.appendChild(stage);
    return { stage, guide, slot: guide.querySelector<HTMLElement>('.sgd__slot')!, panel: guide.querySelector<HTMLElement>('.sgd__panel')! };
  }

  it('with the guide open the card stands in the column’s slot and never touches the sheet or its page', () => {
    const { stage, guide, slot, panel } = column();
    const page = panel.innerHTML;
    const card = new StatusHintCard('ffx', () => true);
    card.update([HINT], true, stage, guide, false);
    expect(card.el.parentElement).toBe(slot);
    expect(card.el.classList.contains('sthint--slot')).toBe(true);
    expect(card.el.hidden).toBe(false);
    expect(panel.contains(card.el)).toBe(false);
    expect(panel.innerHTML).toBe(page);
    expect(panel.querySelector('.sthint')).toBeNull();
    // When the decision closes the card goes and the page is where it was.
    card.update([HINT], false, stage, guide, false);
    expect(card.el.hidden).toBe(true);
    expect(panel.innerHTML).toBe(page);
  });

  it('with the guide folded (G), hidden or absent, the card stands alone in the stage, the approved O3 slot', () => {
    const { stage, guide, slot } = column();
    const card = new StatusHintCard('ffx', () => true);
    guide.classList.add('sgd--off');
    card.update([HINT], true, stage, guide, false);
    expect(card.el.parentElement).toBe(stage);
    expect(card.el.classList.contains('sthint--slot')).toBe(false);
    expect(slot.children.length).toBe(0);
    guide.classList.remove('sgd--off');
    card.update([HINT], true, stage, guide, false);
    expect(card.el.parentElement).toBe(slot); // G brings the guide back and the card moves into its slot
    guide.hidden = true; // an encounter with no written guide
    card.update([HINT], true, stage, guide, false);
    expect(card.el.parentElement).toBe(stage);
    card.update([HINT], true, stage, null, false);
    expect(card.el.parentElement).toBe(stage);
  });

  it('on the phone the card is docked by the phone’s own rules and the guide column is not used', () => {
    const { stage, guide, slot } = column();
    const card = new StatusHintCard('ffx', () => true);
    card.update([HINT], true, stage, guide, true);
    expect(slot.children.length).toBe(0);
    expect(card.el.classList.contains('sthint--phone')).toBe(true);
  });

  it('keeps the same content and the same triggers: BATTLE HELP, a decision open, a status with a rule', () => {
    const { stage, guide } = column();
    const off = new StatusHintCard('ffx', () => false);
    off.update([HINT], true, stage, guide, false);
    expect(off.el.hidden).toBe(true);
    const on = new StatusHintCard('ffx', () => true);
    on.update([], true, stage, guide, false);
    expect(on.el.hidden).toBe(true); // no status with a rule: no card
    on.update([HINT], false, stage, guide, false);
    expect(on.el.hidden).toBe(true); // no decision open
    on.update([HINT], true, stage, guide, false);
    expect(on.el.hidden).toBe(false);
    expect(on.el.innerHTML).toContain('<div class="sthint__head">GUIDE <i>CURSE</i></div>');
    expect(on.el.textContent).toContain('Holy Water');
  });

  it('is still dodged by the numerals, the intent slabs and the message banner, as it was inside the panel they dodge', () => {
    // Each of these lists names the guide by its solid children; the card is a third one now that it stands outside `.sgd__panel`.
    for (const file of [
      'src/ui/ffx/DamageNumbers.ts',
      'src/ui/ffx/hudAvoidSelectors.ts',
      'src/ui/ffx2/DamageLayer.ts',
      'src/ui/ffx2/battleMessage.ts',
      'src/ui/ffx2/intentBoard.ts',
    ]) {
      const src = readFileSync(join(ROOT, file), 'utf8');
      expect(src, file).toContain("'.sgd__panel'");
      expect(src, file).toContain("'.sgd__slot > .sthint'");
    }
    // Only the card in the guide's column: the phone's card and the folded guide's card are not in the slot, so nothing changes for them.
    const { stage, guide } = column();
    const card = new StatusHintCard('ffx', () => true);
    card.update([HINT], true, stage, guide, false);
    expect(stage.querySelectorAll('.sgd__slot > .sthint:not([hidden])').length).toBe(1);
    card.update([HINT], true, stage, guide, true);
    expect(stage.querySelectorAll('.sgd__slot > .sthint').length).toBe(0); // the phone's card is docked by its own rules, in the stage
    expect(card.el.parentElement).toBe(stage);
  });

  it('is styled as a card of its own in the column, not as a block in a panel', () => {
    const rule = /\.sthint--slot\s*\{([^}]*)\}/.exec(CSS)?.[1] ?? '';
    expect(rule).toMatch(/position:\s*relative/);
    expect(rule).toMatch(/width:\s*auto/);
    expect(CSS).not.toContain('sthint--inguide');
    expect(CSS).not.toContain('.sgd__more');
    // Alone in the column, the sheet steps aside.
    expect(CSS).toMatch(/\.sgd--hint-alone \.sgd__panel \{ display: none; \}/);
  });
});

describe('PR-0302 repair: the card never leaves the sheet too little room beside it', () => {
  const ZOMBIE: CureHint = { status: 'zombie', label: 'ZOMBIE', html: 'Healing turns into damage on a Zombie, and a <b>Phoenix Down</b> would KO her outright.', short: 'Healing hurts a Zombie.' };

  type Squeeze = { squeezed: boolean; overflow?: boolean };
  /**
   * A column with the layout numbers `guideSqueezed` reads: the stack's box and what it holds, and the sheet's box and
   * what it holds. `squeezed: true` is a sheet that must scroll and shows less than the least it may.
   */
  function desktop(opts: Squeeze): { stage: HTMLElement; guide: HTMLElement; set: (o: Squeeze) => void } {
    const stage = document.createElement('div');
    const guide = document.createElement('div');
    guide.className = 'sgd';
    guide.innerHTML = '<div class="sgd__stack"><div class="sgd__slot"></div><div class="sgd__panel"></div></div>';
    const stack = guide.querySelector<HTMLElement>('.sgd__stack')!;
    const panel = guide.querySelector<HTMLElement>('.sgd__panel')!;
    const set = (o: Squeeze): void => {
      const def = (el: HTMLElement, k: string, v: number): void => void Object.defineProperty(el, k, { configurable: true, value: v });
      def(stack, 'offsetHeight', 177);
      def(stack, 'scrollHeight', o.overflow ? 190 : 177);
      def(panel, 'offsetHeight', o.squeezed ? MIN_SHEET_HEIGHT - 6 : 86);
      def(panel, 'clientHeight', o.squeezed ? MIN_SHEET_HEIGHT - 6 : 80);
      def(panel, 'scrollHeight', 400); // there is far more to scroll than shows
    };
    set(opts);
    stage.appendChild(guide);
    document.body.appendChild(stage);
    return { stage, guide, set };
  }

  it('is squeezed when the sheet scrolls and shows less than the least it may, or the column overflows its cap; never without layout', () => {
    expect(guideSqueezed(desktop({ squeezed: true }).guide)).toBe(true);
    document.body.innerHTML = '';
    expect(guideSqueezed(desktop({ squeezed: false }).guide)).toBe(false); // roomy
    document.body.innerHTML = '';
    expect(guideSqueezed(desktop({ squeezed: false, overflow: true }).guide)).toBe(true); // the card itself runs past the cap
    document.body.innerHTML = '';
    const bare = document.createElement('div');
    bare.innerHTML = '<div class="sgd__stack"><div class="sgd__slot"></div><div class="sgd__panel"></div></div>';
    expect(guideSqueezed(bare)).toBe(false); // jsdom: every box is 0
    expect(guideSqueezed(document.createElement('div'))).toBe(false);
    // A document shorter than the least the sheet may show is not "squeezed": there is nothing to scroll to.
    const short = desktop({ squeezed: true });
    Object.defineProperty(short.guide.querySelector('.sgd__panel'), 'scrollHeight', { configurable: true, value: MIN_SHEET_HEIGHT - 6 });
    expect(guideSqueezed(short.guide)).toBe(false);
  });

  it('squeezed, the card takes the one-sentence form (the solo copy too); roomy, it keeps the full rule', () => {
    const tight = desktop({ squeezed: true });
    const card = new StatusHintCard('ffx', () => true);
    card.update([ZOMBIE], true, tight.stage, tight.guide, false);
    expect(card.el.parentElement?.className).toBe('sgd__slot');
    expect(card.el.innerHTML).toContain('Healing hurts a Zombie.');
    expect(card.el.innerHTML).not.toContain('Phoenix Down');
    tight.guide.querySelector('.sgd__stack')!.classList.add(GUIDE_FADE_CLASS);
    card.update([ZOMBIE], true, tight.stage, tight.guide, false);
    expect(card.solo.innerHTML).toContain('Healing hurts a Zombie.');
    document.body.innerHTML = '';
    const roomy = desktop({ squeezed: false });
    const full = new StatusHintCard('ffx', () => true);
    full.update([ZOMBIE], true, roomy.stage, roomy.guide, false);
    expect(full.el.innerHTML).toContain('Phoenix Down');
  });

  it('holds the form for that card (no flicker) and starts a new card from the full rule again', () => {
    const { stage, guide, set } = desktop({ squeezed: true });
    const card = new StatusHintCard('ffx', () => true);
    card.update([ZOMBIE], true, stage, guide, false);
    expect(card.el.innerHTML).toContain('Healing hurts a Zombie.');
    set({ squeezed: false }); // now the short card leaves room: it stays short for the same card
    card.update([ZOMBIE], true, stage, guide, false);
    expect(card.el.innerHTML).toContain('Healing hurts a Zombie.');
    // The decision closes and the next card is measured afresh.
    card.update([ZOMBIE], false, stage, guide, false);
    expect(card.el.hidden).toBe(true);
    card.update([HINT], true, stage, guide, false);
    expect(card.el.innerHTML).toContain('Paine is cursed');
  });

  it('where even the one-sentence card squeezes the sheet two frames running, it stands alone and the sheet steps aside', () => {
    const { stage, guide, set } = desktop({ squeezed: true });
    const card = new StatusHintCard('ffx', () => true);
    card.update([ZOMBIE], true, stage, guide, false); // the full form is squeezed: one-sentence form, counted once
    expect(card.el.innerHTML).toContain('Healing hurts a Zombie.');
    expect(guide.classList.contains('sgd--hint-alone')).toBe(false);
    card.update([ZOMBIE], true, stage, guide, false); // still squeezed the second frame running: the card stands alone
    expect(guide.classList.contains('sgd--hint-alone')).toBe(true);
    // It is latched for this card: the sheet is hidden, so a roomy measure does not bring it back mid-card...
    set({ squeezed: false });
    card.update([ZOMBIE], true, stage, guide, false);
    expect(guide.classList.contains('sgd--hint-alone')).toBe(true);
    // ...and the guide is given back the moment the card goes.
    card.update([ZOMBIE], false, stage, guide, false);
    expect(guide.classList.contains('sgd--hint-alone')).toBe(false);
  });

  it('TEXT SIZE scales the guide column, so the floor of the card in its slot is divided by it (no 15 x 1.3)', () => {
    expect(CSS).toContain('html[data-text-size]:not([data-phone-battle]) .ffxhud__stage .sthint--slot,');
    expect(CSS).toContain('.ffx2hud__stage .sthint--slot { font-size: max(6px, calc(15px / var(--lb-scale, 1) / var(--pyr-ts, 1))); }');
    expect(CSS).toContain('.ffx2hud__stage .sthint--slot .sthint__head { font-size: max(4.8px, calc(15px / var(--lb-scale, 1) / var(--pyr-ts, 1))); }');
  });
});
