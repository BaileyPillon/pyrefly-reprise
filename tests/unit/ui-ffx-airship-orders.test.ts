// @vitest-environment jsdom
/**
 * `AirshipOrders` — where the Evrae order widget meets the real FFX command
 * menu. FFX only (Chapter 8). Built to the driver's recommendation A + C,
 * INFERRED in docs/target/targets.json, never approved.
 *
 * Pins the three things the integration promises: every other battle's menu is
 * passed through untouched; in the Evrae battle the two order rows fold into
 * one "Orders" row that opens the widget (and cancel returns to the menu); and
 * Cid's CTB tile carries the ORDER chip only while an order stands.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleState, Command } from '../../src/battle/common/types.ts';
import { AirshipOrders } from '../../src/ui/ffx/AirshipOrders.ts';

function row(label: string, command: Command, enabled = true): AvailableCommand {
  return { label, enabled, command, validTargets: [] } as unknown as AvailableCommand;
}
const attack = row('Attack', { kind: 'attack', targets: [] } as unknown as Command);
const pull = (enabled = true) => row('Pull back', { kind: 'trigger', id: 'pull-back', targets: [] }, enabled);
const close = (enabled = true) => row('Close in', { kind: 'trigger', id: 'close-in', targets: [] }, enabled);
const stateWith = (flags: Record<string, unknown>): BattleState => ({ flags } as unknown as BattleState);

describe('AirshipOrders.choose', () => {
  it('passes every other battle straight through: same array, no widget', async () => {
    const orders = new AirshipOrders();
    const commands = [attack, row('Talk', { kind: 'trigger', id: 'talk', targets: [] })];
    let seen: AvailableCommand[] | null = null;
    const out = await orders.choose(commands, stateWith({}), async (c) => {
      seen = c;
      return c[0]!.command;
    });
    expect(seen).toBe(commands);
    expect(out).toBe(attack.command);
    expect(orders.el.hidden).toBe(true);
  });

  it('folds the two orders into one "Orders" row, and opening it shows the widget', async () => {
    const orders = new AirshipOrders();
    document.body.appendChild(orders.el);
    const menus: string[][] = [];
    const promise = orders.choose([pull(), close(), attack], stateWith({ 'airship.range': 'near', 'airship.missilesLeft': 2 }), async (c) => {
      menus.push(c.map((x) => x.label));
      return c[0]!.command; // the player picks "Orders"
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(menus[0]).toEqual(['Orders', 'Attack']);
    expect(orders.el.hidden).toBe(false);
    expect(orders.el.textContent).toMatch(/Already near/);
    // Keyboard: Enter confirms the first live row, Pull back.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    await expect(promise).resolves.toEqual({ kind: 'trigger', id: 'pull-back', targets: [] });
    orders.dispose();
  });

  it('cancel in the widget goes back to the menu for the same decision', async () => {
    const orders = new AirshipOrders();
    document.body.appendChild(orders.el);
    let opens = 0;
    const promise = orders.choose([pull(), close(), attack], stateWith({ 'airship.range': 'far' }), async (c) => {
      opens++;
      return opens === 1 ? c[0]!.command : c[1]!.command; // Orders, then Attack
    });
    await Promise.resolve();
    await Promise.resolve();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
    await expect(promise).resolves.toBe(attack.command);
    expect(opens).toBe(2);
    expect(orders.el.hidden).toBe(true);
    orders.dispose();
  });

  it('drops the row on the turn of someone who cannot give an order (option A, step 1)', async () => {
    const orders = new AirshipOrders();
    let seen: string[] = [];
    await orders.choose([pull(false), close(false), attack], stateWith({ 'airship.range': 'near' }), async (c) => {
      seen = c.map((x) => x.label);
      return attack.command;
    });
    expect(seen).toEqual(['Attack']);
  });

  it('marks the standing order "Ordered" instead of offering it twice', async () => {
    const orders = new AirshipOrders();
    document.body.appendChild(orders.el);
    void orders.choose([pull(), close(), attack], stateWith({ 'airship.range': 'near', 'airship.order': 'far' }), async (c) => c[0]!.command);
    await Promise.resolve();
    await Promise.resolve();
    expect(orders.el.textContent).toMatch(/Ordered/);
    expect(orders.el.querySelectorAll('.ig-cmd--disabled').length).toBe(2);
    orders.abandon();
    expect(orders.el.hidden).toBe(true);
    orders.dispose();
  });
});

describe('AirshipOrders.dockChip', () => {
  it('puts one ORDER chip on Cid\'s tile while an order stands, and none otherwise', () => {
    const orders = new AirshipOrders();
    const ctb = document.createElement('div');
    ctb.innerHTML = '<div class="ig-ctb__row" data-actor="cid"></div><div class="ig-ctb__row" data-actor="tidus"></div>';
    orders.dockChip(ctb, stateWith({ 'airship.order': 'far' }));
    orders.dockChip(ctb, stateWith({ 'airship.order': 'far' }));
    expect(ctb.querySelectorAll('[data-actor="cid"] .ffx-airship-order__chip')).toHaveLength(1);
    expect(ctb.querySelectorAll('[data-actor="tidus"] .ffx-airship-order__chip')).toHaveLength(0);
    orders.dockChip(ctb, stateWith({ 'airship.order': '' }));
    expect(ctb.querySelectorAll('.ffx-airship-order__chip')).toHaveLength(0);
  });
});
