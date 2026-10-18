// @vitest-environment jsdom
/**
 * **The help slab prints no reason under a greyed row** (re-parity RC11, lane "FFX Chapter III roster"; **FFX only**; `MENU_DRAW_PARITY` item `help`, default OFF; handoff `docs/handoff/re-parity-rc11-ffx-ch3-roster.md`).
 *
 * The original prints no reason for a greyed row. Now that the cursor rests on greyed rows (item `cursor`) the slab would say "Silenced" under every spell of a silenced caster. Off, the text is
 * byte for byte what it was ("Silenced - <effect>"); on, it is the row's plain description alone; `skip: ['help']` brings the old text back.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnyCombatant, AvailableCommand, CombatantId } from '../../src/battle/common/types.ts';
import { setMenuDrawParity } from '../../src/battle/ffx/menu-draw-parity.ts';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import { commandHelpText } from '../../src/ui/ffx/commandHelp.ts';
import { actor, engineFor, menuOf } from './helpers/menuParityDrive.ts';

vi.mock('../../src/ui/ffx/refusalCue.ts', () => ({ playRefusal: vi.fn() }));

let restore: (() => void) | undefined;
const on = (skip: Parameters<typeof setMenuDrawParity>[1] = []): void => {
  restore?.();
  restore = setMenuDrawParity(true, skip);
};
const opened: CommandMenu[] = [];
afterEach(() => {
  for (const m of opened.splice(0)) m.close();
  restore?.();
  restore = undefined;
});
beforeEach(() => {
  document.body.innerHTML = '';
});
const key = (code: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
};
const selected = (): string => document.querySelector('.ig-cmd--selected .ffx-cmd__label')?.textContent ?? '';

beforeAll(async () => {
  await engineFor('braskas-final-aeon');
});

/** Silenced Lulu's rows, the menu opened on them, and every help line the slab was handed. */
async function silencedLulu(): Promise<{ commands: AvailableCommand[]; helps: string[] }> {
  const engine = await engineFor('braskas-final-aeon');
  actor(engine, 'lulu').statuses.silence = { id: 'silence', turnsRemaining: 254 } as never;
  const commands = menuOf(engine, 'lulu');
  const helps: string[] = [];
  const menu = new CommandMenu();
  opened.push(menu);
  document.body.append(menu.stackEl, menu.breadcrumbEl, menu.targetCursor.el);
  void menu.open({ actorId: 'lulu', commands, previewRank: () => [], combatants: engine.state().combatants as Record<CombatantId, AnyCombatant>, setHelp: (t: string) => helps.push(t) });
  return { commands, helps };
}

describe('the pure text', () => {
  const grey: AvailableCommand = { command: { kind: 'ability', id: 'fire', targets: [] }, label: 'Fire', category: 'blackmagic', mpCost: 4, enabled: false, disabledReason: 'Silenced', validTargets: [] };

  it('off: "<reason> - <effect>" exactly as before; an enabled row and a greyed row with no reason are unchanged', () => {
    const text = commandHelpText(grey);
    expect(text.startsWith('Silenced — ')).toBe(true);
    expect(commandHelpText({ ...grey, enabled: true })).toBe(text.slice('Silenced — '.length));
    const { disabledReason: _r, ...noReason } = grey;
    void _r;
    expect(commandHelpText(noReason as AvailableCommand)).toBe(text.slice('Silenced — '.length));
  });

  it('on: the effect alone, no reason; skip "help": as off', () => {
    const off = commandHelpText(grey);
    on();
    expect(commandHelpText(grey)).toBe(off.slice('Silenced — '.length));
    expect(commandHelpText(grey)).not.toContain('Silenced');
    on(['help']);
    expect(commandHelpText(grey)).toBe(off);
  });

  it('on: a row whose effect is empty prints nothing, not its reason', () => {
    on();
    expect(commandHelpText({ ...grey, command: { kind: 'dismiss', targets: [] }, label: 'x', category: 'aeon' })).not.toContain('Silenced');
  });
});

describe('the real menu: the cursor rests on a silenced spell and the slab reads its description only', () => {
  it('on: inside Black Magic every slab line is free of the reason', async () => {
    on();
    const { helps } = await silencedLulu();
    for (let i = 0; i < 12 && selected() !== 'Black Magic'; i += 1) key('ArrowDown');
    expect(selected()).toBe('Black Magic');
    key('Enter');
    key('ArrowDown');
    expect(helps.length).toBeGreaterThan(2);
    expect(helps.filter((h) => h.includes('Silenced'))).toEqual([]);
    expect(helps.some((h) => h.length > 0)).toBe(true);
  });

  it('on with "help" skipped: the slab says "Silenced" under the spell as it would have', async () => {
    on(['help']);
    const { helps } = await silencedLulu();
    for (let i = 0; i < 12 && selected() !== 'Black Magic'; i += 1) key('ArrowDown');
    key('Enter');
    key('ArrowDown');
    expect(helps.some((h) => h.startsWith('Silenced'))).toBe(true);
  });
});
