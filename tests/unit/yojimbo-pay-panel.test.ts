// @vitest-environment jsdom
/**
 * The player's Yojimbo's amount panel (FFX only; the hidden Last Summoning): the model without a DOM, the widget with real key events and clicks, and the wrapper that sits between it and the command menu.
 *
 * What is pinned: a payment is a whole number from 0 to what the party holds, edited a digit at a time; choosing Pay in the menu asks how much (the engine's Pay row carries `gilSpent: 0`, which is "pay nothing", so submitting
 * it as it stands would make him leave); Escape goes back to his menu on the same decision; every other menu passes straight through.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleState, Command } from '../../src/battle/common/types.ts';
import { PAY_ABILITY_ID } from '../../src/battle/ffx/aeon-commands.ts';
import { YojimboPay } from '../../src/ui/ffx/YojimboPay.ts';
import { YojimboPayWidget } from '../../src/ui/ffx/YojimboPayWidget.ts';
import { MAX_PLACES, allIn, digitsOf, double, gil, halve, movePlace, nudge, openPay, payNote, placeAtIndex } from '../../src/ui/ffx/yojimboPayModel.ts';

describe('the model (no DOM)', () => {
  it('opens on the suggestion, clamped to the purse, with as many digits as the purse has and the cursor on the leading digit', () => {
    const s = openPay(50_000, 32_768);
    expect(s).toMatchObject({ purse: 50_000, amount: 32_768, places: 5, place: 4 });
    expect(digitsOf(s)).toEqual([3, 2, 7, 6, 8]);
    expect(openPay(1_000, 5_000).amount).toBe(1_000); // never above the purse
    expect(openPay(1_000, -3).amount).toBe(0);
    expect(openPay(0, 0)).toMatchObject({ purse: 0, amount: 0, places: 1, place: 0 });
    expect(openPay(10 ** 9, 5).places).toBe(MAX_PLACES); // the engine's purse is below a hundred million
  });

  it('moves the cursor between digits and stops at both ends', () => {
    let s = openPay(50_000, 32_768);
    expect(movePlace(s, 'left')).toBe(s); // already on the leading digit
    s = movePlace(s, 'right');
    expect(s.place).toBe(3);
    for (let i = 0; i < 9; i++) s = movePlace(s, 'right');
    expect(s.place).toBe(0);
    expect(movePlace(s, 'right')).toBe(s);
    expect(placeAtIndex(s, 0).place).toBe(4);
    expect(placeAtIndex(s, 4).place).toBe(0);
    expect(placeAtIndex(s, 99).place).toBe(0);
  });

  it('changes the digit under the cursor by one, wrapping 9 to 0 and 0 to 9, and never leaves the purse', () => {
    let s = openPay(99_999, 12_345);
    s = { ...s, place: 0 };
    expect(nudge(s, 1).amount).toBe(12_346);
    expect(nudge(s, -1).amount).toBe(12_344);
    expect(nudge({ ...s, amount: 12_349 }, 1).amount).toBe(12_340); // 9 wraps to 0 in its own place, no carry
    expect(nudge({ ...s, amount: 12_340 }, -1).amount).toBe(12_349);
    const small = openPay(5_000, 5_000);
    expect(nudge({ ...small, place: 3 }, 1).amount).toBe(5_000); // 5 -> 6 thousands would pass the purse: clamped to it
    expect(nudge(openPay(5_000, 0), -1).amount).toBeGreaterThanOrEqual(0);
    expect(nudge(s, 1, 4).amount).toBe(22_345); // another place, named
  });

  it('has the three shortcuts: everything, half (rounded down) and double (to the purse at most)', () => {
    const s = openPay(50_000, 32_768);
    expect(allIn(s).amount).toBe(50_000);
    expect(halve(s).amount).toBe(16_384);
    expect(halve({ ...s, amount: 7 }).amount).toBe(3);
    expect(double(s).amount).toBe(50_000);
    expect(double({ ...s, amount: 4_096 }).amount).toBe(8_192);
  });

  it('writes gil with its thousands and says what the payment means, in words of its own', () => {
    expect(gil(32_768)).toBe('32,768');
    expect(gil(1_000_000)).toBe('1,000,000');
    expect(gil(0)).toBe('0');
    expect(payNote(openPay(50_000, 0))).toBe('Pay nothing and he leaves.');
    expect(payNote(openPay(50_000, 50_000))).toBe('Everything the party holds.');
    expect(payNote(openPay(50_000, 32_768))).toMatch(/Each doubling counts/);
    expect(payNote(openPay(0, 0))).toMatch(/nothing to pay with/);
  });
});

// ------------------------------------------------------------------------------------------------ the widget

const key = (code: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
};
const click = (root: HTMLElement, action: string): void => {
  root.querySelector<HTMLElement>(`[data-ui-action="${action}"]`)!.click();
};
const digitsOnScreen = (el: HTMLElement): string => [...el.querySelectorAll('.ffx-ypay__digit')].map((d) => d.textContent).join('');

describe('the widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('draws the digits with their commas, the purse, a note and the buttons, and nothing is mounted until it is asked', async () => {
    const w = new YojimboPayWidget();
    document.body.appendChild(w.el);
    expect(w.el.hidden).toBe(true);
    expect(w.open).toBe(false);
    void w.ask(1_500_000, 1_048_576);
    expect(w.open).toBe(true);
    expect(digitsOnScreen(w.el)).toBe('1048576');
    expect(w.el.querySelectorAll('.ffx-ypay__comma')).toHaveLength(2); // 1,048,576
    expect(w.el.querySelector('.ffx-ypay__title')!.textContent).toBe('PAY YOJIMBO');
    expect(w.el.querySelector('.ffx-ypay__purse')!.textContent).toBe('The party holds 1,500,000 gil');
    expect(w.el.querySelector('[data-ui-action="pay"]')!.textContent).toBe('PAY 1,048,576');
    w.hide();
    w.dispose();
  });

  it('puts the comma before the hundreds and not before the leading digit', () => {
    const w = new YojimboPayWidget();
    document.body.appendChild(w.el);
    void w.ask(50_000, 32_768);
    const parts = [...w.el.querySelectorAll('.ffx-ypay__digits > *')].map((n) => (n.classList.contains('ffx-ypay__sep') ? ',' : n.classList.contains('ffx-ypay__cell') ? n.querySelector('.ffx-ypay__digit')!.textContent : ''));
    expect(parts.join('')).toBe('32,768');
    w.hide();
    w.dispose();
  });

  it('is keyboard reachable: left and right choose a digit, up and down change it, Enter pays what is shown', async () => {
    const w = new YojimboPayWidget();
    document.body.appendChild(w.el);
    const answer = w.ask(50_000, 32_768);
    key('ArrowRight'); // the thousands
    key('ArrowUp');
    expect(w.amount).toBe(33_768);
    key('ArrowDown');
    key('ArrowDown');
    expect(w.amount).toBe(31_768);
    key('ArrowRight');
    key('ArrowRight');
    key('ArrowRight'); // the units
    key('ArrowUp');
    expect(w.amount).toBe(31_769);
    expect(digitsOnScreen(w.el)).toBe('31769');
    key('Enter');
    expect(await answer).toBe(31_769);
    expect(w.open).toBe(false);
    w.dispose();
  });

  it('goes back on Escape, answering null, and takes itself down', async () => {
    const w = new YojimboPayWidget();
    document.body.appendChild(w.el);
    const answer = w.ask(50_000, 4_096);
    key('Escape');
    expect(await answer).toBeNull();
    expect(w.open).toBe(false);
    w.dispose();
  });

  it('is touch reachable: a digit’s arrows, HALF, DOUBLE, ALL, PAY and BACK', async () => {
    const w = new YojimboPayWidget();
    document.body.appendChild(w.el);
    let answer = w.ask(50_000, 8_192);
    click(w.el, 'up:3'); // the thousands: 8 -> 9
    expect(w.amount).toBe(9_192);
    click(w.el, 'down:4'); // the ten-thousands: 0 wraps to 9, clamped to the purse is not needed (9 x 10,000 is above it, so it clamps)
    expect(w.amount).toBeLessThanOrEqual(50_000);
    click(w.el, 'half');
    const halved = w.amount!;
    click(w.el, 'double');
    expect(w.amount).toBeGreaterThanOrEqual(halved);
    click(w.el, 'all');
    expect(w.amount).toBe(50_000);
    click(w.el, 'pay');
    expect(await answer).toBe(50_000);
    answer = w.ask(50_000, 100);
    click(w.el, 'back');
    expect(await answer).toBeNull();
    w.dispose();
  });

  it('is told apart from a decision that went away: hide() drops the panel without answering', async () => {
    const w = new YojimboPayWidget();
    document.body.appendChild(w.el);
    let settled = false;
    void w.ask(10_000, 1_000).then(() => (settled = true));
    w.hide();
    await Promise.resolve();
    expect(w.open).toBe(false);
    expect(settled).toBe(false);
    w.dispose();
  });
});

// ------------------------------------------------------------------------------------------------ the wrapper

const row = (command: Command, label: string, enabled = true): AvailableCommand => ({ command, label, category: 'aeon', mpCost: 0, enabled, validTargets: [] }) as AvailableCommand;
const PAY: Command = { kind: 'ability', id: PAY_ABILITY_ID, targets: [], gilSpent: 0 } as Command;
const DISMISS: Command = { kind: 'dismiss', targets: [] };
const state = (flags: Record<string, unknown>): BattleState => ({ flags }) as unknown as BattleState;

describe('the wrapper between the panel and the command menu', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is a pass-through for every menu without the Pay row: the menu is opened once, with the commands as given', async () => {
    const pay = new YojimboPay();
    const commands = [row({ kind: 'attack', targets: [] }, 'Attack')];
    let opened = 0;
    const got = await pay.choose(commands, state({}), async (cmds) => {
      opened += 1;
      expect(cmds).toBe(commands);
      return cmds[0]!.command;
    });
    expect(got).toEqual({ kind: 'attack', targets: [] });
    expect(opened).toBe(1);
    expect(pay.widget.open).toBe(false);
    pay.dispose();
  });

  it('answers Dismiss as the menu gave it, without asking for anything', async () => {
    const pay = new YojimboPay();
    document.body.appendChild(pay.el);
    const got = await pay.choose([row(PAY, 'Pay'), row(DISMISS, 'Dismiss')], state({ 'yojimbo:gil': 50_000, 'yojimbo:compatibility': 128 }), async () => DISMISS);
    expect(got).toEqual(DISMISS);
    expect(pay.widget.open).toBe(false);
    pay.dispose();
  });

  it('asks how much when Pay is chosen, opens on the line’s payment, and returns the engine’s own Pay row with the payment in gilSpent', async () => {
    const pay = new YojimboPay();
    document.body.appendChild(pay.el);
    const flags = { 'yojimbo:gil': 50_000, 'yojimbo:compatibility': 128 };
    const chosen = pay.choose([row(PAY, 'Pay'), row(DISMISS, 'Dismiss')], state(flags), async () => PAY);
    await Promise.resolve();
    await Promise.resolve();
    expect(pay.widget.open).toBe(true);
    expect(pay.widget.amount).toBe(32_768); // paymentFor(50,000, 128): the smallest power of two that reaches a motivation of 63
    key('ArrowRight');
    key('ArrowDown');
    key('Enter');
    expect(await chosen).toEqual({ kind: 'ability', id: PAY_ABILITY_ID, targets: [], gilSpent: 31_768 });
    pay.dispose();
  });

  it('goes back to his menu on Escape, the same decision, and takes the next pick', async () => {
    const pay = new YojimboPay();
    document.body.appendChild(pay.el);
    let opened = 0;
    const picks: Command[] = [PAY, DISMISS];
    const chosen = pay.choose([row(PAY, 'Pay'), row(DISMISS, 'Dismiss')], state({ 'yojimbo:gil': 9_000, 'yojimbo:compatibility': 128 }), async () => picks[opened++]!);
    await new Promise((r) => setTimeout(r, 0));
    expect(pay.widget.open).toBe(true);
    key('Escape');
    expect(await chosen).toEqual(DISMISS);
    expect(opened).toBe(2);
    pay.dispose();
  });

  it('opens on what the purse allows when it cannot reach the line’s payment, and on nothing for an empty purse', async () => {
    const pay = new YojimboPay();
    document.body.appendChild(pay.el);
    void pay.choose([row(PAY, 'Pay')], state({ 'yojimbo:gil': 20_000, 'yojimbo:compatibility': 128 }), async () => PAY);
    await new Promise((r) => setTimeout(r, 0));
    expect(pay.widget.amount).toBe(16_384);
    pay.abandon();
    expect(pay.widget.open).toBe(false);
    void pay.choose([row(PAY, 'Pay')], state({}), async () => PAY);
    await new Promise((r) => setTimeout(r, 0));
    expect(pay.widget.amount).toBe(0);
    pay.abandon();
    pay.dispose();
  });

  it('ignores a disabled Pay row (the menu never offers it then)', async () => {
    const pay = new YojimboPay();
    let opened = 0;
    const got = await pay.choose([row(PAY, 'Pay', false), row(DISMISS, 'Dismiss')], state({}), async () => {
      opened += 1;
      return DISMISS;
    });
    expect(got).toEqual(DISMISS);
    expect(opened).toBe(1);
    pay.dispose();
  });
});
