// @vitest-environment jsdom
/**
 * PR-0236 (critic round 15), FFX only (Chapter VIII, Evrae; the airship range
 * has no X-2 counterpart, research/ffx-evrae-airship.md §0.4).
 *
 * With the ship FAR and Close in already ordered, the Orders widget greys both
 * rows ("Already far", "Ordered"), yet the folded top-level Orders row stayed
 * enabled, so the player opened a submenu with nothing to choose. The row now
 * carries the widget's own verdict: disabled, with the "Ordered" reason. The
 * reason text is read on the flat disabled slab (PR-0018) in the widget's
 * colour, pinned below from the CSS.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
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
const pull = row('Pull back', { kind: 'trigger', id: 'pull-back', targets: [] });
const close = row('Close in', { kind: 'trigger', id: 'close-in', targets: [] });

const orders = (flags: Record<string, unknown>): AvailableCommand | undefined =>
  airshipMenuRows([attack, pull, close], flags).find((c) => c.label === 'Orders');

describe('the folded Orders row (PR-0236)', () => {
  it('is disabled with a reason when both orders would be greyed', () => {
    const far = orders({ 'airship.range': 'far', 'airship.order': 'near' });
    expect(far?.enabled).toBe(false);
    expect(far?.disabledReason).toBe('Ordered');
    const near = orders({ 'airship.range': 'near', 'airship.order': 'far' });
    expect(near?.enabled).toBe(false);
    expect(near?.disabledReason).toBe('Ordered');
  });

  it('stays enabled while one order is choosable', () => {
    expect(orders({ 'airship.range': 'far' })?.enabled).toBe(true);
    expect(orders({ 'airship.range': 'near', 'airship.order': 'near' })?.enabled).toBe(true);
  });

  it("a greyed row's reason is not dark ink on the dark disabled slab", () => {
    const css = readFileSync('src/ui/ffx/ffx-hud.css', 'utf8');
    expect(css).toMatch(/\.ffxhud \.ig-cmd--disabled \.ffx-airship-order__already,[^{]*\{ color: #d8d8de; \}/);
  });
});
