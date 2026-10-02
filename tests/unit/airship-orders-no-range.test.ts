// @vitest-environment jsdom
/**
 * F4 / PR-0273, FFX only (Chapter XVII link 3, "on Sin's back": research/ffx-sin.md
 * section 1 says no Trigger Command there). The engine still offers the two order
 * triggers greyed; with no `airship.range` there is no widget to fold them into, so
 * the menu used to list PULL BACK and CLOSE IN dead above ATTACK.
 */
import { describe, expect, it } from 'vitest';
import { AirshipOrders, airshipMenuRows } from '../../src/ui/ffx/AirshipOrders.ts';
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
const pull = (enabled: boolean): AvailableCommand => row('Pull back', { kind: 'trigger', id: 'pull-back', targets: [] }, enabled);
const close = (enabled: boolean): AvailableCommand => row('Close in', { kind: 'trigger', id: 'close-in', targets: [] }, enabled);

describe('order rows with no range state (Sin link 3)', () => {
  it('airshipMenuRows drops the greyed orders and starts with ATTACK', () => {
    const rows = airshipMenuRows([pull(false), close(false), attack], { 'sin.fin.hits': 0 });
    expect(rows.map((r) => r.label)).toEqual(['Attack']);
  });

  it('the menu the HUD paints is the same list', async () => {
    let shown: string[] = [];
    const orders = new AirshipOrders();
    const commands = [pull(false), close(false), attack];
    const picked = await orders.choose(commands, null, async (cs) => {
      shown = cs.map((c) => c.label);
      return cs[0]!.command;
    });
    expect(shown).toEqual(['Attack']);
    expect(picked.kind).toBe('attack');
  });

  it('with a range state (links 1 and 2, Evrae) nothing changes: the rows fold into Orders', () => {
    const rows = airshipMenuRows([pull(true), close(false), attack], { 'airship.range': 'far' });
    expect(rows.map((r) => r.label)).toEqual(['Orders', 'Attack']);
  });

  it('a menu with no order rows is returned as given', () => {
    const commands = [attack];
    expect(airshipMenuRows(commands, undefined)).toBe(commands);
  });
});
