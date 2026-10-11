// @vitest-environment jsdom
/**
 * PR-0236 (critic round 15), FFX only (Chapter VIII, Evrae; the airship range
 * has no X-2 counterpart, research/ffx-evrae-airship.md §0.4).
 *
 * The finding: with the ship FAR and Close in already ordered, the Orders widget greyed both rows ("Already far", "Ordered"), yet the
 * folded top-level Orders row stayed enabled, so the player opened a submenu with nothing to choose. **That state no longer exists**
 * (re-parity row D-08, Bailey 2026-10-09 "Yes, match the game"): the game offers one order at a time, so an order owner always has
 * exactly one order on offer (Pull back at NEAR, Close in at FAR, Cancel while one stands) and the folded Orders row is always
 * choosable on their turn. These tests pin that: every board has one order on offer, the row is enabled and is that order, and the
 * row is absent on the turn of someone who cannot give one.
 */
import { describe, expect, it } from 'vitest';
import { orderOnOffer } from '../../src/battle/ffx/ai/evrae-rules.ts';
import { airshipMenuRows } from '../../src/ui/ffx/AirshipOrders.ts';
import type { AvailableCommand, Command } from '../../src/battle/common/types.ts';

const row = (label: string, command: Command, enabled = true): AvailableCommand => ({
  command,
  label,
  category: 'special',
  mpCost: 0,
  enabled,
  validTargets: [],
});
const attack = row('Attack', { kind: 'attack', targets: [] });
const trigger = (label: string, id: string, enabled: boolean): AvailableCommand => row(label, { kind: 'trigger', id, targets: [] }, enabled);

/** The rows the engine publishes for the three orders on this board (`owner`: the speaker may give orders). */
const published = (flags: Record<string, unknown>, owner: boolean): AvailableCommand[] => {
  const on = owner ? orderOnOffer(flags) : null;
  return [
    attack,
    trigger('Pull back', 'pull-back', on === 'pull-back'),
    trigger('Close in', 'close-in', on === 'close-in'),
    trigger('Cancel', 'cancel-order', on === 'cancel-order'),
  ];
};

const BOARDS: Array<[string, Record<string, unknown>, string]> = [
  ['NEAR, nothing standing', { 'airship.range': 'near', 'airship.order': '' }, 'pull-back'],
  ['FAR, nothing standing', { 'airship.range': 'far', 'airship.order': '' }, 'close-in'],
  ['NEAR, Pull back standing', { 'airship.range': 'near', 'airship.order': 'far' }, 'cancel-order'],
  ['FAR, Close in standing', { 'airship.range': 'far', 'airship.order': 'near' }, 'cancel-order'],
];

describe('the folded Orders row (PR-0236, after one-order-at-a-time)', () => {
  it('has exactly one order on offer on every board, so "none choosable" cannot arise', () => {
    for (const [name, flags, on] of BOARDS) expect(orderOnOffer(flags), name).toBe(on);
    expect(orderOnOffer({}), 'not the airship battle').toBeNull();
  });

  it('is enabled on an order owner\'s turn, and is the order on offer', () => {
    for (const [name, flags, on] of BOARDS) {
      const orders = airshipMenuRows(published(flags, true), flags).find((c) => c.label === 'Orders');
      expect(orders?.enabled, name).toBe(true);
      expect(orders?.command, name).toEqual({ kind: 'trigger', id: on, targets: [] });
    }
  });

  it('is absent on the turn of someone who cannot give an order', () => {
    for (const [name, flags] of BOARDS) {
      expect(airshipMenuRows(published(flags, false), flags).map((c) => c.label), name).toEqual(['Attack']);
    }
  });
});
