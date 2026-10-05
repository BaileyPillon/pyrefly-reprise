// @vitest-environment jsdom
/**
 * PR-0104 (FFX-2 only; `docs/plans/pr-0104-method-check.md`): a girl's confirmed command is named at the confirm.
 * The chip reads `AtbState.charging.commandRef`, which the engine sets at the submit and clears when the charge ends.
 * Browser proof (a frame 135 to 175 ms after the confirm at 1600x900, 153 to 166 ms after the tap at 390x844):
 * `docs/handoff/r37-ui-floor.md`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleState, Command } from '../../src/battle/common/types.ts';
import { QueuedChips, queuedCommands, queuedLabel } from '../../src/ui/ffx2/QueuedChips.ts';

const shell: Command = { kind: 'ability', id: 'x2-white-mage-shell', targets: ['yuna'] };
const state = (extra: Record<string, unknown> = {}, game = 'ffx2'): BattleState =>
  ({
    game,
    result: null,
    combatants: {
      yuna: { side: 'party', alive: true, atb: { charging: { commandRef: shell, remainingTicks: 5, totalTicks: 9 } } },
      rikku: { side: 'party', alive: true, atb: { charging: null } },
      paine: { side: 'party', alive: false, atb: { charging: { commandRef: shell, remainingTicks: 5, totalTicks: 9 } } },
      bahamut: { side: 'enemy', alive: true, atb: { charging: { commandRef: shell, remainingTicks: 5, totalTicks: 9 } } },
      ...extra,
    },
  }) as unknown as BattleState;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('queuedLabel and queuedCommands', () => {
  it('names an ability by its own data name, an item by its own, an attack as Attack; a spherechange has none', () => {
    expect(queuedLabel(shell)).toBe('Shell');
    expect(queuedLabel({ kind: 'attack', targets: ['bahamut'] })).toBe('Attack');
    expect(queuedLabel({ kind: 'spherechange', targets: [], extra: { toDressphere: 'x', toNode: 1, gatesCrossed: [] } })).toBeNull();
    expect(queuedLabel({ kind: 'ability', id: 'no-such-ability', targets: [] })).toBeNull();
  });

  it('lists only living girls with a charging command, in FFX-2 only', () => {
    expect(queuedCommands(state())).toEqual([{ id: 'yuna', label: 'Shell' }]);
    expect(queuedCommands(state({}, 'ffx'))).toEqual([]);
    expect(queuedCommands(null)).toEqual([]);
    expect(queuedCommands({ ...state(), result: { outcome: 'victory' } } as unknown as BattleState)).toEqual([]);
  });
});

describe('QueuedChips', () => {
  const mount = () => {
    const overlay = document.createElement('div');
    document.body.appendChild(overlay);
    const chips = new QueuedChips();
    chips.mount(overlay, { project: () => ({ x: 200, y: 300 }) });
    return { overlay, chips };
  };

  it('draws a chip at the sync, keeps it while the command charges, and removes it when the charge is gone', () => {
    const { overlay, chips } = mount();
    chips.sync(state());
    const el = overlay.querySelector('.ffx2-qchip') as HTMLElement;
    expect(el.textContent).toBe('Shell');
    expect(el.dataset['actor']).toBe('yuna');
    chips.sync(state());
    expect(overlay.querySelectorAll('.ffx2-qchip')).toHaveLength(1);
    chips.sync(state({ yuna: { side: 'party', alive: true, atb: { charging: null } } }));
    expect(overlay.querySelectorAll('.ffx2-qchip')).toHaveLength(0);
  });

  it('unmount removes every chip', () => {
    const { overlay, chips } = mount();
    chips.sync(state());
    chips.unmount();
    expect(overlay.querySelectorAll('.ffx2-qchip')).toHaveLength(0);
  });
});
